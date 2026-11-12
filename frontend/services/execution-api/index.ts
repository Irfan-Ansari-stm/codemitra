import { api } from '@/lib/api';
import { ApiResponse } from '@/types';

export interface ExecutionRunPayload {
  language: string | number;
  sourceCode: string;
  stdin?: string;
  engine?: 'auto' | 'wasm' | 'judge0';
  problemId?: string;
}

export interface ExecutionRunData {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: 'completed' | 'failed' | 'timed_out' | 'compilation_error' | 'runtime_error';
  executionTime: number;
  memoryUsage: number | null;
  engineUsed: 'wasm' | 'judge0';
  fallbackOccurred?: boolean;
  notes?: string;
}

export interface ExecutionCapabilities {
  engines: Array<{
    id: string;
    name: string;
    description: string;
    supportedLanguages?: string[];
  }>;
  limits: {
    DEFAULT_TIMEOUT_MS: number;
    MAX_TIMEOUT_MS: number;
    MAX_SOURCE_CODE_BYTES: number;
    MAX_STDIN_BYTES: number;
    MAX_OUTPUT_BYTES: number;
    DEFAULT_MEMORY_LIMIT_MB: number;
    MAX_MEMORY_LIMIT_MB: number;
  };
  languages: Array<{
    id: number;
    slug: string;
    name: string;
    monacoLang: string;
    extension: string;
    wasmSupported: boolean;
    judge0Supported: boolean;
    notes?: string;
  }>;
}

export const executionApi = {
  run: (payload: ExecutionRunPayload) =>
    api.post<ApiResponse<ExecutionRunData>>('/execution/run', payload),

  getCapabilities: () =>
    api.get<ApiResponse<ExecutionCapabilities>>('/execution/capabilities'),
};
