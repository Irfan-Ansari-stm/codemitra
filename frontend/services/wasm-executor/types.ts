export type ExecutionEngineType = 'auto' | 'wasm' | 'judge0';

export type ExecutionStatus =
  | 'idle'
  | 'compiling'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'compilation_error'
  | 'runtime_error';

export interface WasmExecutionRequest {
  id?: string;
  language: string | number;
  code: string;
  stdin?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface WasmExecutionResponse {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: ExecutionStatus;
  executionTime: number; // ms
  memoryUsage: number | null; // KB
  engineUsed: 'wasm' | 'judge0';
  fallbackOccurred?: boolean;
  notes?: string;
}

export interface WorkerTask {
  id: string;
  request: WasmExecutionRequest;
  resolve: (res: WasmExecutionResponse) => void;
  reject: (err: any) => void;
  timeoutTimer?: ReturnType<typeof setTimeout>;
}
