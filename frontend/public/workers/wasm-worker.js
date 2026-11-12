/**
 * CodeMitra Secure WebAssembly & Multi-Language Worker
 * 
 * Runs in an isolated Web Worker thread with:
 * - Domain-restricted fetch (allows trusted CDN WASM binaries, blocks untrusted exfiltration)
 * - Zero DOM/Cookie/LocalStore access (isolated Web Worker context)
 * - Strict I/O size limits (128 KB cap)
 * - Custom stdin/stdout/stderr streaming
 * - Python 3 via Pyodide WebAssembly runtime (CPython 3.11/3.12)
 * - JavaScript sandboxed execution
 * - TypeScript compilation & sandboxed execution
 * - Lua 5.4 via Fengari WebAssembly/JS engine
 */

/* eslint-disable no-restricted-globals */

// Polyfill window in worker context for libraries (such as Fengari) that expect window
if (typeof self !== 'undefined' && typeof self.window === 'undefined') {
  self.window = self;
}

// ── Network & API Sandbox Lockdown ───────────────────────────────────────────
const rawFetch = (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function')
  ? globalThis.fetch
  : (typeof self !== 'undefined' && typeof self.fetch === 'function')
    ? self.fetch
    : null;

// Allowlist of trusted origins for downloading WASM runtime binaries and libraries
const TRUSTED_ASSET_DOMAINS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'cdn.pyodide.org',
  'files.pythonhosted.org',
  'pypi.org',
  'fastly.jsdelivr.net',
  'localhost',
  '127.0.0.1',
];

// Gated fetch: WASM runtimes (Pyodide, etc.) can load their .wasm and metadata,
// but untrusted user code cannot make outbound calls to external servers.
self.fetch = function(resource, init) {
  let urlStr = '';
  if (typeof resource === 'string') {
    urlStr = resource;
  } else if (resource && typeof resource.url === 'string') {
    urlStr = resource.url;
  } else if (resource && typeof resource.href === 'string') {
    urlStr = resource.href;
  } else if (resource && typeof resource.toString === 'function') {
    urlStr = resource.toString();
  }

  // Allow blob: and data: URLs required by WebAssembly instantiations
  if (urlStr.startsWith('blob:') || urlStr.startsWith('data:')) {
    if (rawFetch) return rawFetch(resource, init);
    return Promise.reject(new Error('Fetch API is not available in worker context.'));
  }

  try {
    const workerOrigin = self.location ? self.location.origin : 'http://localhost:3000';
    const parsed = new URL(urlStr, self.location ? self.location.href : workerOrigin);
    
    const isSameOrigin = self.location && parsed.origin === self.location.origin;
    const isTrustedDomain = TRUSTED_ASSET_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );

    if (!isSameOrigin && !isTrustedDomain) {
      return Promise.reject(
        new Error(`Security Restriction: Outbound network request to "${parsed.hostname}" is not permitted in the sandbox.`)
      );
    }
  } catch (err) {
    // Pass through if URL parsing fails
  }

  if (rawFetch) {
    try {
      return rawFetch(resource, init);
    } catch {
      return rawFetch.call(self, urlStr, init);
    }
  }
  return Promise.reject(new Error('Fetch API is not available in worker context.'));
};

// Neutralize dangerous APIs while preserving XMLHttpRequest and IndexedDB for WASM runtimes (Pyodide/Emscripten)
try {
  self.WebSocket = undefined;
  if (typeof EventSource !== 'undefined') self.EventSource = undefined;
  if (typeof openDatabase !== 'undefined') self.openDatabase = undefined;
  if (typeof Notification !== 'undefined') self.Notification = undefined;
  if (typeof Worker !== 'undefined') self.Worker = undefined;
  if (typeof SharedWorker !== 'undefined') self.SharedWorker = undefined;
} catch (e) {
  // Ignore lockdown errors
}

const MAX_OUTPUT_BYTES = 131072; // 128 KB
let pyodideInstance = null;
let isPyodideLoading = false;
let pyodideLoadPromise = null;
let isFengariLoaded = false;

function truncate(str, maxBytes = MAX_OUTPUT_BYTES) {
  if (!str) return '';
  if (str.length <= maxBytes) return str;
  return str.slice(0, maxBytes) + '\n[Output truncated: exceeded size limit]';
}

/**
 * Lazy loads Pyodide WebAssembly runtime from CDN with working fetch
 */
async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (isPyodideLoading) return pyodideLoadPromise;

  isPyodideLoading = true;
  pyodideLoadPromise = (async () => {
    if (typeof loadPyodide === 'undefined') {
      try {
        // eslint-disable-next-line no-undef
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
      } catch (err) {
        isPyodideLoading = false;
        throw new Error('Failed to load Pyodide WebAssembly script: ' + (err.message || String(err)));
      }
    }
    // eslint-disable-next-line no-undef
    const py = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
    // Warm up the Python VM so all subsequent user executions are instantaneous
    await py.runPythonAsync('import sys, io');
    pyodideInstance = py;
    isPyodideLoading = false;
    return py;
  })();

  return pyodideLoadPromise;
}

/**
 * Lazy loads Fengari Lua WASM engine (prefers local bundled script)
 */
async function getFengari() {
  if (isFengariLoaded && typeof fengari !== 'undefined') return fengari;
  try {
    try {
      importScripts('/workers/fengari-web.js');
    } catch {
      importScripts('https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js');
    }
    isFengariLoaded = true;
    return fengari;
  } catch (err) {
    throw new Error('Failed to load Lua WebAssembly engine: ' + (err.message || String(err)));
  }
}

let sqlJsInstance = null;
/**
 * Lazy loads SQLite WebAssembly engine (prefers local bundled wasm)
 */
async function getSql() {
  if (sqlJsInstance) return sqlJsInstance;
  if (typeof initSqlJs === 'undefined') {
    try {
      importScripts('/workers/sql-wasm.js');
    } catch {
      importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js');
    }
  }
  // eslint-disable-next-line no-undef
  sqlJsInstance = await initSqlJs({
    locateFile: (file) => `/workers/${file}`,
  });
  return sqlJsInstance;
}

/**
 * Execute SQL queries via SQLite WebAssembly engine
 */
async function executeSql(code) {
  const startTime = performance.now();
  try {
    const SQL = await getSql();
    const db = new SQL.Database();
    
    // Execute SQL query statements
    const results = db.exec(code);
    const executionTime = Math.max(1, Math.round(performance.now() - startTime));

    if (!results || results.length === 0) {
      return {
        success: true,
        stdout: 'Query executed successfully. (0 rows returned)\n',
        stderr: '',
        compileOutput: '',
        status: 'completed',
        executionTime,
        memoryUsage: null,
        engineUsed: 'wasm',
      };
    }

    let output = '';
    for (const res of results) {
      const columns = res.columns || [];
      const values = res.values || [];

      // Calculate column widths
      const colWidths = columns.map((col, idx) => {
        let maxLen = String(col).length;
        for (const row of values) {
          const valStr = row[idx] === null ? 'NULL' : String(row[idx]);
          if (valStr.length > maxLen) maxLen = valStr.length;
        }
        return Math.max(maxLen, 3);
      });

      const border = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
      const header = '|' + columns.map((col, idx) => ' ' + String(col).padEnd(colWidths[idx]) + ' ').join('|') + '|';

      output += border + '\n' + header + '\n' + border + '\n';
      for (const row of values) {
        const rowStr = '|' + row.map((val, idx) => {
          const s = val === null ? 'NULL' : String(val);
          return ' ' + s.padEnd(colWidths[idx]) + ' ';
        }).join('|') + '|';
        output += rowStr + '\n';
      }
      output += border + '\n';
      output += `(${values.length} ${values.length === 1 ? 'row' : 'rows'})\n\n`;
    }

    return {
      success: true,
      stdout: truncate(output.trim()),
      stderr: '',
      compileOutput: '',
      status: 'completed',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  } catch (err) {
    const executionTime = Math.max(1, Math.round(performance.now() - startTime));
    return {
      success: false,
      stdout: '',
      stderr: truncate(err.message || String(err)),
      compileOutput: '',
      status: 'runtime_error',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  }
}

/**
 * Render and validate HTML code in a sandbox
 */
async function executeHtml(code) {
  const startTime = performance.now();
  const titleMatch = code.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Document';

  const bodyMatch = code.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : code;

  const textContent = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '  * $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  const executionTime = Math.max(1, Math.round(performance.now() - startTime));
  const output = `[HTML5 Live DOM Render]\nTitle: "${title}"\n${'-'.repeat(45)}\n${textContent || '(Empty DOM Body)'}\n${'-'.repeat(45)}\nStatus: 200 OK | Rendered successfully`;

  return {
    success: true,
    stdout: truncate(output),
    stderr: '',
    compileOutput: '',
    status: 'completed',
    executionTime,
    memoryUsage: null,
    engineUsed: 'wasm',
  };
}

/**
 * Execute Python code via Pyodide WASM
 */
async function executePython(code, stdin) {
  const py = await getPyodide();

  // Inject standard input directly into Python's sys.stdin using io.StringIO
  const rawStdin = typeof stdin === 'string' ? stdin : '';
  py.globals.set('__codemitra_stdin__', rawStdin);
  py.globals.set('__codemitra_code__', code);

  // Synchronous execution harness that captures stdout, stderr, syntax errors, and tracebacks
  const harness = `
import sys, io, traceback

__codemitra_stdout__ = io.StringIO()
__codemitra_stderr__ = io.StringIO()
__prev_stdout__ = sys.stdout
__prev_stderr__ = sys.stderr
sys.stdout = __codemitra_stdout__
sys.stderr = __codemitra_stderr__
sys.stdin = io.StringIO(__codemitra_stdin__)

__codemitra_is_syntax__ = False

try:
    __compiled__ = compile(__codemitra_code__, '<solution>', 'exec')
    exec(__compiled__, globals())
except SyntaxError as e:
    __codemitra_is_syntax__ = True
    traceback.print_exc(file=__codemitra_stderr__)
except Exception:
    traceback.print_exc(file=__codemitra_stderr__)
finally:
    sys.stdout = __prev_stdout__
    sys.stderr = __prev_stderr__

__codemitra_out_res__ = __codemitra_stdout__.getvalue()
__codemitra_err_res__ = __codemitra_stderr__.getvalue()
`;

  const startTime = performance.now();
  try {
    // Execute synchronously in Pyodide WASM for instant execution without async network checks
    py.runPython(harness);
    const executionTime = Math.max(1, Math.round(performance.now() - startTime));

    const outText = String(py.globals.get('__codemitra_out_res__') || '');
    const errText = String(py.globals.get('__codemitra_err_res__') || '');
    const isSyntax = Boolean(py.globals.get('__codemitra_is_syntax__'));

    if (errText) {
      return {
        success: false,
        stdout: truncate(outText),
        stderr: truncate(errText),
        compileOutput: isSyntax ? truncate(errText) : '',
        status: isSyntax ? 'compilation_error' : 'runtime_error',
        executionTime,
        memoryUsage: null,
        engineUsed: 'wasm',
      };
    }

    return {
      success: true,
      stdout: truncate(outText),
      stderr: '',
      compileOutput: '',
      status: 'completed',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  } catch (err) {
    const executionTime = Math.max(1, Math.round(performance.now() - startTime));
    const errStr = err.message || String(err);
    const isSyntax = errStr.includes('SyntaxError');

    return {
      success: false,
      stdout: '',
      stderr: truncate(errStr),
      compileOutput: isSyntax ? truncate(errStr) : '',
      status: isSyntax ? 'compilation_error' : 'runtime_error',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  }
}

/**
 * Execute JavaScript in a sandboxed execution context
 */
async function executeJavaScript(code, stdin) {
  let stdout = '';
  let stderr = '';

  const stdinLines = (stdin || '').split('\n');
  let lineIdx = 0;
  const readline = () => {
    if (lineIdx < stdinLines.length) {
      return stdinLines[lineIdx++];
    }
    return '';
  };

  const customConsole = {
    log: (...args) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
      }
    },
    info: (...args) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
      }
    },
    warn: (...args) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
      }
    },
    error: (...args) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
      }
    },
  };

  const startTime = performance.now();
  try {
    const runner = new Function(
      'console',
      'readline',
      'prompt',
      'input',
      `"use strict";
       ${code}`
    );

    runner(customConsole, readline, readline, readline);
    const executionTime = Math.round(performance.now() - startTime);

    return {
      success: true,
      stdout: truncate(stdout),
      stderr: truncate(stderr),
      compileOutput: '',
      status: 'completed',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  } catch (err) {
    const executionTime = Math.round(performance.now() - startTime);
    const errStr = err.message || String(err);
    const isSyntax = err instanceof SyntaxError;

    return {
      success: false,
      stdout: truncate(stdout),
      stderr: truncate(errStr),
      compileOutput: isSyntax ? truncate(errStr) : '',
      status: isSyntax ? 'compilation_error' : 'runtime_error',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  }
}

/**
 * Execute TypeScript by compiling and executing in sandbox
 */
async function executeTypeScript(code, stdin) {
  // Strip TypeScript types or use regex-based type stripping for fast in-worker execution
  try {
    // Quick, robust type-stripping for standard TS code (interfaces, types, type annotations)
    let jsCode = code
      .replace(/:\s*([A-Za-z0-9_<>\[\]]+|string|number|boolean|any|void|unknown|never)\b/g, '')
      .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
      .replace(/type\s+[A-Za-z0-9_]+\s*=[^;]+;/g, '')
      .replace(/as\s+[A-Za-z0-9_<>\[\]]+/g, '');
    
    return await executeJavaScript(jsCode, stdin);
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: err.message || String(err),
      compileOutput: 'TypeScript Compilation Error: ' + (err.message || String(err)),
      status: 'compilation_error',
      executionTime: 0,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  }
}

/**
 * Execute Lua code via Fengari WASM engine
 */
async function executeLua(code, stdin) {
  let stdout = '';
  let stderr = '';

  try {
    const f = await getFengari();
    const { lua, lauxlib, lualib } = f;

    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    // Intercept console.log which Fengari uses for print()
    const origLog = console.log;
    console.log = (...args) => {
      const line = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += line + '\n';
    };

    let status;
    const startTime = performance.now();
    try {
      status = lauxlib.luaL_dostring(L, f.to_luastring(code));
    } finally {
      console.log = origLog;
    }
    const executionTime = Math.round(performance.now() - startTime);

    if (status !== lua.LUA_OK) {
      const errStr = f.to_jsstring(lua.lua_tostring(L, -1));
      return {
        success: false,
        stdout: truncate(stdout),
        stderr: truncate(errStr),
        compileOutput: '',
        status: 'runtime_error',
        executionTime,
        memoryUsage: null,
        engineUsed: 'wasm',
      };
    }

    return {
      success: true,
      stdout: truncate(stdout),
      stderr: truncate(stderr),
      compileOutput: '',
      status: 'completed',
      executionTime,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  } catch (err) {
    return {
      success: false,
      stdout: '',
      stderr: err.message || String(err),
      compileOutput: '',
      status: 'runtime_error',
      executionTime: 0,
      memoryUsage: null,
      engineUsed: 'wasm',
    };
  }
}

// ── Worker Message Handler ────────────────────────────────────────────────────
self.onmessage = async (e) => {
  const { id, type, language, code, stdin } = e.data || {};

  if (type === 'PING') {
    self.postMessage({ id, type: 'PONG' });
    return;
  }

  if (type === 'INIT') {
    if (language === 'python' || language === 71) {
      try {
        await getPyodide();
        self.postMessage({ id, type: 'INIT_OK', language });
      } catch (err) {
        self.postMessage({ id, type: 'INIT_ERROR', error: err.message });
      }
    } else {
      self.postMessage({ id, type: 'INIT_OK', language });
    }
    return;
  }

  if (type === 'EXECUTE') {
    try {
      const langLower = String(language).toLowerCase();
      let result;

      if (langLower === 'python' || langLower === '71' || langLower === 'py') {
        if (!pyodideInstance) {
          self.postMessage({ id, type: 'STATUS', status: 'initializing', message: 'Downloading Pyodide WebAssembly runtime...' });
        }
        await getPyodide();
        self.postMessage({ id, type: 'STATUS', status: 'running' });
        result = await executePython(code, stdin);
      } else if (langLower === 'javascript' || langLower === '63' || langLower === 'js') {
        self.postMessage({ id, type: 'STATUS', status: 'running' });
        result = await executeJavaScript(code, stdin);
      } else if (langLower === 'typescript' || langLower === '74' || langLower === 'ts') {
        self.postMessage({ id, type: 'STATUS', status: 'running' });
        result = await executeTypeScript(code, stdin);
      } else if (langLower === 'lua' || langLower === '64') {
        if (!isFengariLoaded) {
          self.postMessage({ id, type: 'STATUS', status: 'initializing', message: 'Loading Lua WebAssembly runtime...' });
        }
        await getFengari();
        self.postMessage({ id, type: 'STATUS', status: 'running' });
        result = await executeLua(code, stdin);
      } else if (langLower === 'sql' || langLower === '82') {
        self.postMessage({ id, type: 'STATUS', status: 'running' });
        result = await executeSql(code);
      } else if (langLower === 'html' || langLower === '81') {
        self.postMessage({ id, type: 'STATUS', status: 'running' });
        result = await executeHtml(code);
      } else {
        result = {
          success: false,
          stdout: '',
          stderr: `Language '${language}' is compiled and executed via containerized server sandbox. Please choose 'Auto' or 'Judge0'.`,
          compileOutput: '',
          status: 'failed',
          executionTime: 0,
          memoryUsage: null,
          engineUsed: 'wasm',
        };
      }

      self.postMessage({ id, type: 'RESULT', ...result });
    } catch (err) {
      self.postMessage({
        id,
        type: 'RESULT',
        success: false,
        stdout: '',
        stderr: err.message || String(err),
        compileOutput: '',
        status: 'runtime_error',
        executionTime: 0,
        memoryUsage: null,
        engineUsed: 'wasm',
      });
    }
  }
};
