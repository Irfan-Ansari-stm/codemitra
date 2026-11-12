import { executionRouterService, ExecutionRequest, UnifiedExecutionResult } from './execution-router.service';
import { SUPPORTED_LANGUAGES, EXECUTION_LIMITS } from './execution-limits';
import { pool } from '../../db';
import { AppError } from '../../middleware/errorHandler';

export const executionService = {
  /**
   * Run standalone code execution with engine routing.
   */
  async runCode(req: ExecutionRequest): Promise<UnifiedExecutionResult> {
    return executionRouterService.execute(req);
  },

  /**
   * Return platform execution capabilities, supported engines, and resource limits.
   */
  getCapabilities() {
    return {
      engines: [
        {
          id: 'wasm',
          name: 'WebAssembly & Sandboxed Execution',
          description: 'Client-side isolated worker execution with zero server latency (Python, JS, TS, Lua) and high-performance native sandbox (C, C++, Java, Rust).',
          supportedLanguages: ['python', 'javascript', 'typescript', 'lua', 'c', 'cpp', 'java', 'rust'],
        },
        {
          id: 'judge0',
          name: 'Judge0 Sandbox',
          description: 'Secure containerized execution for compiled and interpreted languages (C, C++, Java, Rust, Python, JavaScript).',
          supportedLanguages: ['python', 'javascript', 'c', 'cpp', 'java', 'rust'],
        },
        {
          id: 'auto',
          name: 'Auto (Intelligent Router)',
          description: 'Automatically picks WebAssembly for supported languages with transparent fallback to Judge0.',
        },
      ],
      limits: EXECUTION_LIMITS,
      languages: Object.values(SUPPORTED_LANGUAGES),
    };
  },

  /**
   * Run code against sample test cases for a given problem.
   * NOTE: Hidden test cases are NEVER exposed or evaluated in untrusted client environments.
   */
  async runProblemSamples(params: {
    problemId: string;
    languageId: number;
    sourceCode: string;
    engine?: 'auto' | 'wasm' | 'judge0';
  }) {
    const probResult = await pool.query(
      `SELECT id, time_limit_ms, memory_limit_mb, allowed_languages
       FROM problems WHERE id = $1 AND is_deleted = FALSE LIMIT 1`,
      [params.problemId]
    );
    const problem = probResult.rows[0];
    if (!problem) throw new AppError(404, 'NOT_FOUND', 'Problem not found');

    if (!problem.allowed_languages.includes(params.languageId)) {
      throw new AppError(400, 'LANGUAGE_NOT_ALLOWED', 'Language not permitted for this problem');
    }

    // Load only non-hidden sample test cases
    const tcResult = await pool.query(
      `SELECT id, input, expected_output, points FROM test_cases
       WHERE problem_id = $1 AND is_hidden = FALSE ORDER BY order_index`,
      [params.problemId]
    );
    const testCases = tcResult.rows;
    if (testCases.length === 0) {
      throw new AppError(400, 'NO_TEST_CASES', 'Problem has no sample test cases');
    }

    // Execute against each sample test case
    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const execResult = await executionRouterService.execute({
        language: params.languageId,
        sourceCode: params.sourceCode,
        stdin: tc.input,
        engine: params.engine || 'auto',
        timeLimitMs: problem.time_limit_ms,
        memoryLimitMb: problem.memory_limit_mb,
      });

      const actualOut = (execResult.stdout || '').trim();
      const expectedOut = (tc.expected_output || '').trim();
      const passed = execResult.status === 'completed' && actualOut === expectedOut;

      let verdict = 'accepted';
      if (execResult.status === 'timed_out') verdict = 'time_limit_exceeded';
      else if (execResult.status === 'compilation_error') verdict = 'compile_error';
      else if (execResult.status === 'runtime_error') verdict = 'runtime_error';
      else if (!passed) verdict = 'wrong_answer';

      results.push({
        caseIndex: i + 1,
        passed,
        verdict,
        runtimeMs: execResult.executionTime,
        memoryKb: execResult.memoryUsage,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        compileOutput: execResult.compileOutput,
        engineUsed: execResult.engineUsed,
        points: passed ? tc.points : 0,
      });
    }

    return { results };
  },
};
