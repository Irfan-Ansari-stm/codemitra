export const EXECUTION_LIMITS = {
  DEFAULT_TIMEOUT_MS: 5000,
  MAX_TIMEOUT_MS: 15000,
  MAX_SOURCE_CODE_BYTES: 65536, // 64 KB
  MAX_STDIN_BYTES: 65536,       // 64 KB
  MAX_OUTPUT_BYTES: 131072,     // 128 KB
  DEFAULT_MEMORY_LIMIT_MB: 128,
  MAX_MEMORY_LIMIT_MB: 512,
} as const;

export interface LanguageInfo {
  id: number;
  slug: string;
  name: string;
  monacoLang: string;
  extension: string;
  wasmSupported: boolean;
  judge0Supported: boolean;
  notes?: string;
}

export const SUPPORTED_LANGUAGES: Record<number, LanguageInfo> = {
  71: {
    id: 71,
    slug: 'python',
    name: 'Python 3',
    monacoLang: 'python',
    extension: 'py',
    wasmSupported: true,
    judge0Supported: true,
    notes: 'Supported in browser via Pyodide WebAssembly runtime.',
  },
  63: {
    id: 63,
    slug: 'javascript',
    name: 'JavaScript',
    monacoLang: 'javascript',
    extension: 'js',
    wasmSupported: true,
    judge0Supported: true,
    notes: 'Supported in browser via sandboxed Web Worker runtime.',
  },
  74: {
    id: 74,
    slug: 'typescript',
    name: 'TypeScript',
    monacoLang: 'typescript',
    extension: 'ts',
    wasmSupported: true,
    judge0Supported: true,
    notes: 'Transpiled and executed in browser worker or via Judge0.',
  },
  64: {
    id: 64,
    slug: 'lua',
    name: 'Lua',
    monacoLang: 'lua',
    extension: 'lua',
    wasmSupported: true,
    judge0Supported: true,
    notes: 'Supported in browser via Fengari Lua WebAssembly engine.',
  },
  50: {
    id: 50,
    slug: 'c',
    name: 'C (GCC / MSVC)',
    monacoLang: 'c',
    extension: 'c',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled via MSVC/GCC native toolchain or Judge0 container sandbox.',
  },
  54: {
    id: 54,
    slug: 'cpp',
    name: 'C++ (G++ / MSVC)',
    monacoLang: 'cpp',
    extension: 'cpp',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled via MSVC/G++ native toolchain or Judge0 container sandbox.',
  },
  62: {
    id: 62,
    slug: 'java',
    name: 'Java (OpenJDK)',
    monacoLang: 'java',
    extension: 'java',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled and executed via OpenJDK javac/java or Judge0 container sandbox.',
  },
  73: {
    id: 73,
    slug: 'rust',
    name: 'Rust',
    monacoLang: 'rust',
    extension: 'rs',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled and executed via native rustc or Judge0 container sandbox.',
  },
  60: {
    id: 60,
    slug: 'go',
    name: 'Go',
    monacoLang: 'go',
    extension: 'go',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled and executed server-side via CodeMitra sandbox or Judge0.',
  },
  72: {
    id: 72,
    slug: 'ruby',
    name: 'Ruby',
    monacoLang: 'ruby',
    extension: 'rb',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Executed server-side via CodeMitra sandbox or Judge0.',
  },
  68: {
    id: 68,
    slug: 'php',
    name: 'PHP',
    monacoLang: 'php',
    extension: 'php',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Executed server-side via CodeMitra sandbox or Judge0.',
  },
  51: {
    id: 51,
    slug: 'csharp',
    name: 'C# (Mono)',
    monacoLang: 'csharp',
    extension: 'cs',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled and executed server-side via CodeMitra sandbox or Judge0.',
  },
  78: {
    id: 78,
    slug: 'kotlin',
    name: 'Kotlin',
    monacoLang: 'kotlin',
    extension: 'kt',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Compiled and executed server-side via CodeMitra sandbox or Judge0.',
  },
  80: {
    id: 80,
    slug: 'r',
    name: 'R',
    monacoLang: 'r',
    extension: 'r',
    wasmSupported: false,
    judge0Supported: true,
    notes: 'Executed server-side via CodeMitra sandbox or Judge0.',
  },
  82: {
    id: 82,
    slug: 'sql',
    name: 'SQL',
    monacoLang: 'sql',
    extension: 'sql',
    wasmSupported: true,
    judge0Supported: true,
    notes: 'Executed via SQLite in-memory engine with tabular result formatting.',
  },
  81: {
    id: 81,
    slug: 'html',
    name: 'HTML',
    monacoLang: 'html',
    extension: 'html',
    wasmSupported: true,
    judge0Supported: true,
    notes: 'Rendered and validated via sandboxed DOM preview engine.',
  },
};

export function resolveLanguage(langInput: string | number): LanguageInfo | null {
  if (typeof langInput === 'number') {
    return SUPPORTED_LANGUAGES[langInput] || null;
  }
  const clean = langInput.toLowerCase().trim();
  const byId = parseInt(clean, 10);
  if (!isNaN(byId) && SUPPORTED_LANGUAGES[byId]) {
    return SUPPORTED_LANGUAGES[byId];
  }
  for (const info of Object.values(SUPPORTED_LANGUAGES)) {
    if (
      info.slug === clean ||
      info.monacoLang === clean ||
      info.extension === clean ||
      info.name.toLowerCase() === clean
    ) {
      return info;
    }
  }
  if (clean === 'py' || clean === 'python3') return SUPPORTED_LANGUAGES[71];
  if (clean === 'js' || clean === 'node') return SUPPORTED_LANGUAGES[63];
  if (clean === 'ts') return SUPPORTED_LANGUAGES[74];
  if (clean === 'c++') return SUPPORTED_LANGUAGES[54];
  if (clean === 'c#') return SUPPORTED_LANGUAGES[51];
  if (clean === 'rs') return SUPPORTED_LANGUAGES[73];
  if (clean === 'golang') return SUPPORTED_LANGUAGES[60];
  if (clean === 'rb') return SUPPORTED_LANGUAGES[72];
  if (clean === 'kt') return SUPPORTED_LANGUAGES[78];
  if (clean === 'sql') return SUPPORTED_LANGUAGES[82];
  if (clean === 'html' || clean === 'htm') return SUPPORTED_LANGUAGES[81];
  return null;
}

export function truncateOutput(str: string | null | undefined, maxBytes: number = EXECUTION_LIMITS.MAX_OUTPUT_BYTES): string {
  if (!str) return '';
  if (Buffer.byteLength(str, 'utf8') <= maxBytes) return str;
  const truncated = Buffer.from(str).subarray(0, maxBytes).toString('utf8');
  return `${truncated}\n[Output truncated: exceeded size limit of ${Math.round(maxBytes / 1024)} KB]`;
}
