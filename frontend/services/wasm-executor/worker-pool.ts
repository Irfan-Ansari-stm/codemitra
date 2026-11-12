import { WasmExecutionRequest, WasmExecutionResponse, WorkerTask } from './types';

export class WorkerPool {
  private worker: Worker | null = null;
  private currentTask: WorkerTask | null = null;
  private workerScriptUrl: string;

  constructor(workerScriptUrl = '/workers/wasm-worker.js') {
    this.workerScriptUrl = workerScriptUrl;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Worker !== 'undefined';
  }

  private initWorker(): Worker {
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(this.workerScriptUrl);
    } catch {
      // Fallback for relative paths or cross-origin workers
      const resolved = new URL(this.workerScriptUrl, window.location.origin).href;
      this.worker = new Worker(resolved);
    }

    this.worker.onmessage = (e: MessageEvent) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (e: ErrorEvent) => {
      this.handleError(e);
    };

    return this.worker;
  }

  private handleMessage(data: any) {
    if (data.type === 'PONG' || data.type === 'INIT_OK' || data.type === 'INIT_ERROR') {
      return;
    }

    if (!this.currentTask) return;
    if (data.id && data.id !== this.currentTask.id) return;

    if (data.type === 'STATUS') {
      if (data.status === 'running') {
        // Initialization finished; start strict timeout for actual user code execution
        if (this.currentTask.timeoutTimer) {
          clearTimeout(this.currentTask.timeoutTimer);
        }
        const timeoutMs = Math.max(this.currentTask.request.timeLimitMs || 5000, 3000);
        this.currentTask.timeoutTimer = setTimeout(() => {
          if (this.currentTask) {
            const task = this.currentTask;
            this.currentTask = null;
            this.terminate();
            task.resolve({
              stdout: '',
              stderr: `Execution timed out after ${timeoutMs} ms. Web Worker was safely terminated.`,
              compileOutput: '',
              status: 'timed_out',
              executionTime: timeoutMs,
              memoryUsage: null,
              engineUsed: 'wasm',
            });
          }
        }, timeoutMs + 1000);
      }
      return;
    }

    if (this.currentTask.timeoutTimer) {
      clearTimeout(this.currentTask.timeoutTimer);
    }

    const task = this.currentTask;
    this.currentTask = null;

    if (data.type === 'RESULT') {
      task.resolve({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        compileOutput: data.compileOutput || '',
        status: data.status || 'completed',
        executionTime: data.executionTime || 0,
        memoryUsage: data.memoryUsage || null,
        engineUsed: 'wasm',
      });
    } else {
      task.resolve({
        stdout: '',
        stderr: data.error || 'Unknown worker message',
        compileOutput: '',
        status: 'failed',
        executionTime: 0,
        memoryUsage: null,
        engineUsed: 'wasm',
      });
    }
  }

  private handleError(e: ErrorEvent) {
    if (!this.currentTask) return;

    if (this.currentTask.timeoutTimer) {
      clearTimeout(this.currentTask.timeoutTimer);
    }

    const task = this.currentTask;
    this.currentTask = null;
    this.terminate();

    task.resolve({
      stdout: '',
      stderr: e.message || 'Worker runtime error occurred.',
      compileOutput: '',
      status: 'runtime_error',
      executionTime: 0,
      memoryUsage: null,
      engineUsed: 'wasm',
    });
  }

  public preload(language: string | number) {
    if (!this.isSupported()) return;
    try {
      const worker = this.initWorker();
      worker.postMessage({
        type: 'INIT',
        language,
      });
    } catch (e) {
      // Ignore background preload failures
    }
  }

  public async execute(request: WasmExecutionRequest): Promise<WasmExecutionResponse> {
    if (!this.isSupported()) {
      throw new Error('Web Workers are not supported in this environment');
    }

    if (this.currentTask) {
      // Terminate busy worker to prevent state leakage or concurrency clashes
      this.terminate();
    }

    const worker = this.initWorker();
    const taskId = request.id || Math.random().toString(36).substring(2, 9);
    // Allow up to 60s for initial CDN download of WASM runtimes; actual execution uses request.timeLimitMs
    const initTimeoutMs = 60000;

    return new Promise<WasmExecutionResponse>((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        if (this.currentTask && this.currentTask.id === taskId) {
          this.terminate();
          this.currentTask = null;
          resolve({
            stdout: '',
            stderr: `WebAssembly initialization timed out after ${initTimeoutMs / 1000}s.`,
            compileOutput: '',
            status: 'timed_out',
            executionTime: initTimeoutMs,
            memoryUsage: null,
            engineUsed: 'wasm',
          });
        }
      }, initTimeoutMs);

      this.currentTask = {
        id: taskId,
        request,
        resolve,
        reject,
        timeoutTimer,
      };

      worker.postMessage({
        id: taskId,
        type: 'EXECUTE',
        language: request.language,
        code: request.code,
        stdin: request.stdin || '',
      });
    });
  }

  public terminate() {
    if (this.currentTask?.timeoutTimer) {
      clearTimeout(this.currentTask.timeoutTimer);
    }
    this.currentTask = null;

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const defaultWorkerPool = new WorkerPool();
