import axios from 'axios';
import { AppError } from '../../middleware/errorHandler';
import { truncateOutput } from './execution-limits';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

// Judge0 status ID → internal status verdict
export const JUDGE0_STATUS_MAP: Record<number, { verdict: string; isError: boolean }> = {
  1: { verdict: 'pending', isError: false },
  2: { verdict: 'pending', isError: false },
  3: { verdict: 'accepted', isError: false },
  4: { verdict: 'wrong_answer', isError: true },
  5: { verdict: 'time_limit_exceeded', isError: true },
  6: { verdict: 'compile_error', isError: true },
  7: { verdict: 'runtime_error', isError: true },
  8: { verdict: 'runtime_error', isError: true },
  9: { verdict: 'runtime_error', isError: true },
  10: { verdict: 'runtime_error', isError: true },
  11: { verdict: 'runtime_error', isError: true },
  12: { verdict: 'runtime_error', isError: true },
  13: { verdict: 'internal_error', isError: true },
  14: { verdict: 'memory_limit_exceeded', isError: true },
};

function judge0Headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) h['X-Auth-Token'] = JUDGE0_API_KEY;
  return h;
}

export interface Judge0SingleResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: 'completed' | 'failed' | 'timed_out' | 'compilation_error' | 'runtime_error';
  verdict: string;
  executionTime: number; // ms
  memoryUsage: number | null; // KB
}

export const judge0Service = {
  async executeSingle(params: {
    sourceCode: string;
    languageId: number;
    stdin?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
  }): Promise<Judge0SingleResult> {
    const timeLimitSec = ((params.timeLimitMs || 5000) / 1000).toString();
    const memoryLimitKb = ((params.memoryLimitMb || 128) * 1024).toString();

    let submissionResponse;
    try {
      submissionResponse = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
        {
          source_code: Buffer.from(params.sourceCode).toString('base64'),
          language_id: params.languageId,
          stdin: Buffer.from(params.stdin || '').toString('base64'),
          cpu_time_limit: timeLimitSec,
          memory_limit: memoryLimitKb,
        },
        { headers: judge0Headers(), timeout: 15_000 }
      );
    } catch {
      throw new AppError(
        503,
        'JUDGE0_UNAVAILABLE',
        'Judge0 execution service is unavailable.'
      );
    }

    const data = submissionResponse.data;
    const statusId = data.status?.id || 13;
    const statusInfo = JUDGE0_STATUS_MAP[statusId] || { verdict: 'internal_error', isError: true };

    const stdout = truncateOutput(data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf8') : '');
    const stderr = truncateOutput(data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf8') : '');
    const compileOutput = truncateOutput(
      data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf8') : ''
    );

    let normalizedStatus: Judge0SingleResult['status'] = 'completed';
    if (statusId === 5) normalizedStatus = 'timed_out';
    else if (statusId === 6) normalizedStatus = 'compilation_error';
    else if (statusId >= 7 && statusId <= 12) normalizedStatus = 'runtime_error';
    else if (statusInfo.isError && statusId !== 3) normalizedStatus = 'failed';

    const executionTime = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
    const memoryUsage = data.memory ? parseInt(data.memory, 10) : null;

    return {
      stdout,
      stderr,
      compileOutput,
      status: normalizedStatus,
      verdict: statusInfo.verdict,
      executionTime,
      memoryUsage,
    };
  },

  async createBatch(submissions: Array<{
    sourceCode: string;
    languageId: number;
    stdin: string;
    expectedOutput?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
  }>): Promise<string[]> {
    const payload = submissions.map((sub) => ({
      source_code: Buffer.from(sub.sourceCode).toString('base64'),
      language_id: sub.languageId,
      stdin: Buffer.from(sub.stdin).toString('base64'),
      expected_output: sub.expectedOutput ? Buffer.from(sub.expectedOutput).toString('base64') : undefined,
      cpu_time_limit: (((sub.timeLimitMs || 5000) / 1000)).toString(),
      memory_limit: (((sub.memoryLimitMb || 128) * 1024)).toString(),
    }));

    try {
      const response = await axios.post(
        `${JUDGE0_URL}/submissions/batch?base64_encoded=true`,
        { submissions: payload },
        { headers: judge0Headers(), timeout: 10_000 }
      );
      return response.data.map((s: any) => s.token);
    } catch {
      throw new AppError(
        503,
        'JUDGE0_UNAVAILABLE',
        'Judge0 batch execution service is unavailable.'
      );
    }
  },

  async pollBatch(tokens: string[], testCases: any[], maxAttempts = 10): Promise<any[]> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));

      const response = await axios.get(
        `${JUDGE0_URL}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=true&fields=status,stdout,stderr,compile_output,time,memory,status_id`,
        { headers: judge0Headers(), timeout: 10_000 }
      );

      const results: any[] = response.data.submissions;
      const allDone = results.every((r) => r.status && r.status.id > 2);
      if (!allDone) continue;

      return results.map((r, i) => {
        const statusId = r.status?.id || 13;
        const statusMap = JUDGE0_STATUS_MAP[statusId] || { verdict: 'internal_error' };
        return {
          caseIndex: i + 1,
          passed: statusId === 3,
          verdict: statusMap.verdict,
          runtimeMs: r.time ? Math.round(parseFloat(r.time) * 1000) : null,
          memoryKb: r.memory || null,
          stdout: truncateOutput(r.stdout ? Buffer.from(r.stdout, 'base64').toString('utf8') : ''),
          stderr: truncateOutput(r.stderr ? Buffer.from(r.stderr, 'base64').toString('utf8') : ''),
          compileOutput: truncateOutput(r.compile_output ? Buffer.from(r.compile_output, 'base64').toString('utf8') : ''),
          points: statusId === 3 ? (testCases[i]?.points || 1) : 0,
        };
      });
    }
    throw new AppError(504, 'EXECUTION_TIMEOUT', 'Code execution timed out');
  },
};
