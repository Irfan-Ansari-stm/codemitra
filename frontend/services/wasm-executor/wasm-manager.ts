import { defaultWorkerPool, WorkerPool } from './worker-pool';
import { WasmExecutionRequest, WasmExecutionResponse } from './types';
import { executionApi } from '../execution-api';

export const WASM_SUPPORTED_LANGUAGES = new Set([
  'python',
  'py',
  '71',
  'javascript',
  'js',
  '63',
  'typescript',
  'ts',
  '74',
  'lua',
  '64',
  'sql',
  '82',
  'html',
  '81',
]);

export function isLanguageWasmSupported(languageIdOrSlug: number | string): boolean {
  return WASM_SUPPORTED_LANGUAGES.has(String(languageIdOrSlug).toLowerCase());
}

export class WasmManager {
  private pool: WorkerPool;

  constructor(pool: WorkerPool = defaultWorkerPool) {
    this.pool = pool;
  }

  public isBrowserSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof Worker !== 'undefined' &&
      typeof WebAssembly !== 'undefined'
    );
  }

  public canExecuteLocally(language: string | number): boolean {
    return this.isBrowserSupported() && isLanguageWasmSupported(language);
  }

  public preload(language: string | number) {
    if (this.canExecuteLocally(language)) {
      this.pool.preload(language);
    }
  }

  /**
   * Execute code using WebAssembly/sandboxed worker with automatic server fallback if needed.
   */
  public async execute(
    request: WasmExecutionRequest,
    preferredEngine: 'auto' | 'wasm' | 'judge0' = 'auto'
  ): Promise<WasmExecutionResponse> {
    const canLocal = this.canExecuteLocally(request.language);

    // If Judge0 is explicitly chosen, or if WASM is not supported for this language
    if (preferredEngine === 'judge0' || (!canLocal && preferredEngine === 'auto')) {
      const serverRes = await executionApi.run({
        language: request.language,
        sourceCode: request.code,
        stdin: request.stdin,
        engine: 'judge0',
      });
      return {
        ...serverRes.data.data,
        engineUsed: 'judge0',
      };
    }

    // Attempt browser WebAssembly execution
    if (canLocal) {
      try {
        const result = await this.pool.execute(request);
        // If client execution timed out or failed, seamlessly fall back to high-performance server sandbox
        if (result.status === 'timed_out' || result.status === 'failed') {
          console.warn('WASM execution timed out or failed, falling back to server execution');
          try {
            const fallbackRes = await executionApi.run({
              language: request.language,
              sourceCode: request.code,
              stdin: request.stdin,
              engine: 'auto',
            });
            const data = (fallbackRes as any)?.data?.data || (fallbackRes as any)?.data;
            if (data && data.status) {
              return {
                ...data,
                fallbackOccurred: true,
                notes: 'Executed via CodeMitra sandboxed engine.',
              };
            }
          } catch (serverErr) {
            console.error('Server fallback also failed:', serverErr);
          }
        }
        return result;
      } catch (err: any) {
        console.warn('Browser WASM execution error, falling back to server execution:', err);
        // Controlled fallback to server-side engine
        try {
          const fallbackRes = await executionApi.run({
            language: request.language,
            sourceCode: request.code,
            stdin: request.stdin,
            engine: 'auto',
          });
          const data = (fallbackRes as any)?.data?.data || (fallbackRes as any)?.data;
          if (data && data.status) {
            return {
              ...data,
              fallbackOccurred: true,
              notes: 'Client WASM execution failed; seamlessly executed via server sandbox.',
            };
          }
        } catch (serverErr) {
          console.error('Server fallback also failed:', serverErr);
        }
        return {
          stdout: '',
          stderr: err.message || 'Execution failed',
          compileOutput: '',
          status: 'failed',
          executionTime: 0,
          memoryUsage: null,
          engineUsed: 'wasm',
        };
      }
    }

    // For compiled or server-side execution (e.g. C, C++, Java, Rust, Go)
    const serverRes = await executionApi.run({
      language: request.language,
      sourceCode: request.code,
      stdin: request.stdin,
      engine: preferredEngine,
    });
    return serverRes.data.data;
  }

  public terminate() {
    this.pool.terminate();
  }
}

export const wasmManager = new WasmManager();
