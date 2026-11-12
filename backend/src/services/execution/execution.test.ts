import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveLanguage, truncateOutput, EXECUTION_LIMITS } from './execution-limits';
import { wasmService } from './wasm.service';
import { executionRouterService } from './execution-router.service';

describe('Execution Limits & Language Resolution', () => {
  it('correctly resolves language slugs and IDs', () => {
    const py = resolveLanguage(71);
    assert.strictEqual(py?.slug, 'python');
    assert.strictEqual(py?.wasmSupported, true);

    const js = resolveLanguage('javascript');
    assert.strictEqual(js?.id, 63);
    assert.strictEqual(js?.wasmSupported, true);

    const cpp = resolveLanguage('cpp');
    assert.strictEqual(cpp?.id, 54);
    assert.strictEqual(cpp?.wasmSupported, false);
    assert.strictEqual(cpp?.judge0Supported, true);

    const invalid = resolveLanguage('nonexistent_lang');
    assert.strictEqual(invalid, null);
  });

  it('truncates large output exceeding max byte limit', () => {
    const smallText = 'Hello world';
    assert.strictEqual(truncateOutput(smallText), smallText);

    const hugeText = 'A'.repeat(100);
    const truncated = truncateOutput(hugeText, 50);
    assert.ok(truncated.includes('[Output truncated'));
    assert.ok(truncated.length < 150);
  });
});

describe('WASM Sandboxed Service (Node Isolated Worker)', () => {
  it('executes valid JavaScript code in isolated sandbox', async () => {
    const code = `
      let sum = 0;
      for (let i = 1; i <= 5; i++) sum += i;
      console.log('SUM:', sum);
    `;

    const result = await wasmService.executeSandboxed({
      sourceCode: code,
      language: 'javascript',
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.stdout.includes('SUM: 15'));
    assert.strictEqual(result.engineUsed, 'wasm');
    assert.ok(result.executionTime >= 0);
  });

  it('handles standard input (stdin) lines', async () => {
    const code = `
      const name = readline();
      const age = readline();
      console.log('User: ' + name + ', Age: ' + age);
    `;

    const result = await wasmService.executeSandboxed({
      sourceCode: code,
      language: 'javascript',
      stdin: 'Alice\n25',
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.stdout.includes('User: Alice, Age: 25'));
  });

  it('catches and reports compilation (syntax) errors', async () => {
    const invalidCode = 'const x = ;'; // Syntax error

    const result = await wasmService.executeSandboxed({
      sourceCode: invalidCode,
      language: 'javascript',
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'compilation_error');
    assert.ok(result.stderr.length > 0);
  });

  it('catches and reports runtime exceptions', async () => {
    const runtimeErrCode = 'throw new Error("Simulated runtime crash!");';

    const result = await wasmService.executeSandboxed({
      sourceCode: runtimeErrCode,
      language: 'javascript',
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'runtime_error');
    assert.ok(result.stderr.includes('Simulated runtime crash!'));
  });

  it('terminates infinite loops on strict timeout', async () => {
    const infiniteLoopCode = 'while (true) {}';

    const result = await wasmService.executeSandboxed({
      sourceCode: infiniteLoopCode,
      language: 'javascript',
      timeLimitMs: 800, // Short timeout for test
    });

    assert.strictEqual(result.status, 'timed_out');
    assert.ok(result.stderr.includes('timed out'));
  });

  it('prevents sandbox escape and access to process or host globals', async () => {
    const exploitCode = `
      try {
        console.log('PROCESS:', typeof process);
        console.log('REQUIRE:', typeof require);
      } catch (e) {
        console.log('BLOCKED');
      }
    `;

    const result = await wasmService.executeSandboxed({
      sourceCode: exploitCode,
      language: 'javascript',
      timeLimitMs: 2000,
    });

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.stdout.includes('PROCESS: undefined'));
    assert.ok(result.stdout.includes('REQUIRE: undefined'));
  });

  it('executes valid Python code with stdin on server runner', async () => {
    const pyCode = `
import sys
tokens = sys.stdin.read().split()
if len(tokens) >= 2:
    a, b = int(tokens[0]), int(tokens[1])
    print(f"Sum: {a + b}")
`;

    const result = await wasmService.executeSandboxed({
      sourceCode: pyCode,
      language: 'python',
      stdin: '15 25',
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.stdout.includes('Sum: 40'));
  });

  it('reports Python syntax errors correctly', async () => {
    const badPyCode = 'def broken(';

    const result = await wasmService.executeSandboxed({
      sourceCode: badPyCode,
      language: 'python',
      timeLimitMs: 3000,
    });

    assert.strictEqual(result.status, 'compilation_error');
    assert.ok(result.stderr.includes('SyntaxError'));
  });
});

describe('Execution Router Service', () => {
  it('selects WASM for supported language in auto mode', () => {
    const py = resolveLanguage(71)!;
    const { targetEngine, willFallback } = executionRouterService.resolveEngine(py, 'auto');
    assert.strictEqual(targetEngine, 'wasm');
    assert.strictEqual(willFallback, false);
  });

  it('routes to Judge0 for compiled C/C++ in auto mode', () => {
    const cpp = resolveLanguage(54)!;
    const { targetEngine, willFallback } = executionRouterService.resolveEngine(cpp, 'auto');
    assert.strictEqual(targetEngine, 'judge0');
    assert.strictEqual(willFallback, false);
  });

  it('provides controlled fallback to Judge0 when WASM requested for unsupported language', () => {
    const c = resolveLanguage(50)!;
    const { targetEngine, willFallback, reason } = executionRouterService.resolveEngine(c, 'wasm');
    assert.strictEqual(targetEngine, 'judge0');
    assert.strictEqual(willFallback, true);
    assert.ok(reason?.includes('Judge0'));
  });
});
