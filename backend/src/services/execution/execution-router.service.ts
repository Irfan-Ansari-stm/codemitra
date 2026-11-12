import { resolveLanguage, LanguageInfo, EXECUTION_LIMITS } from './execution-limits';
import { judge0Service, Judge0SingleResult } from './judge0.service';
import { wasmService, WasmExecutionResult } from './wasm.service';
import { AppError } from '../../middleware/errorHandler';

export type ExecutionEngine = 'auto' | 'wasm' | 'judge0';

export interface ExecutionRequest {
  language: string | number;
  sourceCode: string;
  stdin?: string;
  engine?: ExecutionEngine;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface UnifiedExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: 'completed' | 'failed' | 'timed_out' | 'compilation_error' | 'runtime_error';
  executionTime: number; // ms
  memoryUsage: number | null; // KB
  engineUsed: 'wasm' | 'judge0';
  fallbackOccurred?: boolean;
  notes?: string;
}

export const executionRouterService = {
  /**
   * Determine the most suitable execution engine given language and user preference.
   */
  resolveEngine(
    lang: LanguageInfo,
    preferredEngine: ExecutionEngine = 'auto'
  ): { targetEngine: 'wasm' | 'judge0'; willFallback: boolean; reason?: string } {
    if (preferredEngine === 'wasm') {
      if (lang.wasmSupported) {
        return { targetEngine: 'wasm', willFallback: false };
      }
      return {
        targetEngine: 'judge0',
        willFallback: true,
        reason: `${lang.name} requires containerized compilation via Judge0. Falling back to Judge0.`,
      };
    }

    if (preferredEngine === 'judge0') {
      return { targetEngine: 'judge0', willFallback: false };
    }

    // Auto resolution:
    if (lang.wasmSupported) {
      return { targetEngine: 'wasm', willFallback: false };
    }

    return { targetEngine: 'judge0', willFallback: false };
  },

  /**
   * Route execution request to the appropriate engine with controlled fallback.
   */
  async execute(req: ExecutionRequest): Promise<UnifiedExecutionResult> {
    const lang = resolveLanguage(req.language);
    if (!lang) {
      throw new AppError(400, 'INVALID_LANGUAGE', `Unsupported language '${req.language}'`);
    }

    if (!req.sourceCode || typeof req.sourceCode !== 'string') {
      throw new AppError(400, 'SOURCE_CODE_REQUIRED', 'sourceCode must be a non-empty string');
    }

    if (Buffer.byteLength(req.sourceCode, 'utf8') > EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES) {
      throw new AppError(400, 'PAYLOAD_TOO_LARGE', 'Source code exceeds size limit (64 KB)');
    }

    if (req.stdin && Buffer.byteLength(req.stdin, 'utf8') > EXECUTION_LIMITS.MAX_STDIN_BYTES) {
      throw new AppError(400, 'PAYLOAD_TOO_LARGE', 'Stdin exceeds size limit (64 KB)');
    }

    const { targetEngine, willFallback, reason } = this.resolveEngine(lang, req.engine || 'auto');

    if (targetEngine === 'wasm') {
      try {
        const wasmRes: WasmExecutionResult = await wasmService.executeSandboxed({
          sourceCode: req.sourceCode,
          language: lang.id,
          stdin: req.stdin,
          timeLimitMs: req.timeLimitMs,
          memoryLimitMb: req.memoryLimitMb,
        });

        return {
          ...wasmRes,
          engineUsed: 'wasm',
          fallbackOccurred: false,
        };
      } catch (err: any) {
        // If WASM sandbox fails unexpectedly, provide controlled fallback to Judge0
        console.warn('WASM execution failed, falling back to Judge0:', err.message);
        const judge0Res: Judge0SingleResult = await judge0Service.executeSingle({
          sourceCode: req.sourceCode,
          languageId: lang.id,
          stdin: req.stdin,
          timeLimitMs: req.timeLimitMs,
          memoryLimitMb: req.memoryLimitMb,
        });

        return {
          stdout: judge0Res.stdout,
          stderr: judge0Res.stderr,
          compileOutput: judge0Res.compileOutput,
          status: judge0Res.status,
          executionTime: judge0Res.executionTime,
          memoryUsage: judge0Res.memoryUsage,
          engineUsed: 'judge0',
          fallbackOccurred: true,
          notes: 'WASM runtime encountered an error; safely executed via Judge0.',
        };
      }
    }

    // Target engine: Judge0
    try {
      const judge0Res: Judge0SingleResult = await judge0Service.executeSingle({
        sourceCode: req.sourceCode,
        languageId: lang.id,
        stdin: req.stdin,
        timeLimitMs: req.timeLimitMs,
        memoryLimitMb: req.memoryLimitMb,
      });

      return {
        stdout: judge0Res.stdout,
        stderr: judge0Res.stderr,
        compileOutput: judge0Res.compileOutput,
        status: judge0Res.status,
        executionTime: judge0Res.executionTime,
        memoryUsage: judge0Res.memoryUsage,
        engineUsed: 'judge0',
        fallbackOccurred: willFallback,
        notes: reason,
      };
    } catch (err: any) {
      console.warn('Judge0 unavailable, falling back to server isolated sandbox:', err.message);
      const wasmRes = await wasmService.executeSandboxed({
        sourceCode: req.sourceCode,
        language: lang.id,
        stdin: req.stdin,
        timeLimitMs: req.timeLimitMs,
        memoryLimitMb: req.memoryLimitMb,
      });

      return {
        ...wasmRes,
        engineUsed: 'wasm',
        fallbackOccurred: true,
        notes: `Executed via CodeMitra sandboxed execution engine (${wasmRes.engineUsed}).`,
      };
    }
  },
};
