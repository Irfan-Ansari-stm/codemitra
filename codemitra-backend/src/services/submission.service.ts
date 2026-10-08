import axios from 'axios';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

// Judge0 status ID → our submission_verdict enum
const JUDGE0_STATUS_MAP: Record<number, string> = {
  1: 'pending',
  2: 'pending',
  3: 'accepted',
  4: 'wrong_answer',
  5: 'time_limit_exceeded',
  6: 'compile_error',
  7: 'runtime_error',
  8: 'runtime_error',
  9: 'runtime_error',
  10: 'runtime_error',
  11: 'runtime_error',
  12: 'runtime_error',
  13: 'internal_error',
  14: 'memory_limit_exceeded',
};

function judge0Headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) h['X-Auth-Token'] = JUDGE0_API_KEY;
  return h;
}

export const submissionService = {
  async createSubmission(params: {
    userId: string;
    tenantId: string | null;
    problemId: string;
    assignmentId?: string;
    languageId: number;
    sourceCode: string;
    isRun?: boolean;
  }) {
    // Load problem
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

    // Load test cases (sample only for run, all for submit)
    const isHiddenFilter = params.isRun ? 'AND is_hidden = FALSE' : '';
    const tcResult = await pool.query(
      `SELECT id, input, expected_output, points FROM test_cases
       WHERE problem_id = $1 ${isHiddenFilter} ORDER BY order_index`,
      [params.problemId]
    );
    const testCases = tcResult.rows;
    if (testCases.length === 0) {
      throw new AppError(400, 'NO_TEST_CASES', 'Problem has no test cases');
    }

    // Create pending submission record (skip for run-only)
    let submissionId: string | null = null;
    if (!params.isRun) {
      const subResult = await pool.query(
        `INSERT INTO submissions
           (user_id, problem_id, tenant_id, assignment_id, language_id, source_code, verdict)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
        [
          params.userId,
          params.problemId,
          params.tenantId,
          params.assignmentId || null,
          params.languageId,
          params.sourceCode,
        ]
      );
      submissionId = subResult.rows[0].id;
    }

    // Build Judge0 batch payload
    const judge0Submissions = testCases.map((tc) => ({
      source_code: Buffer.from(params.sourceCode).toString('base64'),
      language_id: params.languageId,
      stdin: Buffer.from(tc.input).toString('base64'),
      expected_output: Buffer.from(tc.expected_output).toString('base64'),
      cpu_time_limit: (problem.time_limit_ms / 1000).toString(),
      memory_limit: (problem.memory_limit_mb * 1024).toString(),
    }));

    const judge0Response = await axios.post(
      `${JUDGE0_URL}/submissions/batch?base64_encoded=true`,
      { submissions: judge0Submissions },
      { headers: judge0Headers(), timeout: 10_000 }
    );

    const tokens: string[] = judge0Response.data.map((s: any) => s.token);

    if (submissionId) {
      await pool.query(
        'UPDATE submissions SET judge0_token = $1 WHERE id = $2',
        [tokens.join(','), submissionId]
      );
    }

    // For run-only, poll immediately (sample cases are fast)
    if (params.isRun) {
      const results = await submissionService.pollJudge0(tokens, testCases);
      return { submissionId: null, results };
    }

    return { submissionId, status: 'pending' };
  },

  async pollJudge0(
    tokens: string[],
    testCases: any[],
    maxAttempts = 10
  ): Promise<any[]> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));

      const response = await axios.get(
        `${JUDGE0_URL}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=true&fields=status,stdout,stderr,time,memory,status_id`,
        { headers: judge0Headers(), timeout: 10_000 }
      );

      const results: any[] = response.data.submissions;
      const allDone = results.every((r) => r.status.id > 2);
      if (!allDone) continue;

      return results.map((r, i) => ({
        caseIndex: i + 1,
        passed: r.status.id === 3,
        verdict: JUDGE0_STATUS_MAP[r.status.id] || 'internal_error',
        runtimeMs: r.time ? Math.round(parseFloat(r.time) * 1000) : null,
        memoryKb: r.memory || null,
        stdout: r.stdout ? Buffer.from(r.stdout, 'base64').toString() : '',
        stderr: r.stderr ? Buffer.from(r.stderr, 'base64').toString() : '',
        points: r.status.id === 3 ? (testCases[i]?.points || 1) : 0,
      }));
    }
    throw new AppError(504, 'EXECUTION_TIMEOUT', 'Code execution timed out');
  },

  async processJudge0Result(submissionId: string): Promise<void> {
    const subResult = await pool.query(
      `SELECT s.id, s.judge0_token, s.problem_id, p.time_limit_ms, p.memory_limit_mb
       FROM submissions s JOIN problems p ON p.id = s.problem_id
       WHERE s.id = $1 AND s.verdict = 'pending' LIMIT 1`,
      [submissionId]
    );
    const sub = subResult.rows[0];
    if (!sub || !sub.judge0_token) return;

    const tokens = sub.judge0_token.split(',');
    const tcResult = await pool.query(
      'SELECT id, points FROM test_cases WHERE problem_id = $1 ORDER BY order_index',
      [sub.problem_id]
    );
    const testCases = tcResult.rows;
    const results = await submissionService.pollJudge0(tokens, testCases);

    const allPassed = results.every((r) => r.passed);
    const finalVerdict = allPassed
      ? 'accepted'
      : results.find((r) => !r.passed)?.verdict || 'wrong_answer';

    const totalPoints = testCases.reduce((s: number, tc: any) => s + tc.points, 0) || 1;
    const earnedPoints = results.reduce((s: number, r: any) => s + r.points, 0);
    const score = Math.round((earnedPoints / totalPoints) * 10000) / 100;
    const maxRuntime = Math.max(...results.map((r) => r.runtimeMs || 0));
    const maxMemory = Math.max(...results.map((r) => r.memoryKb || 0));
    const firstError = results.find((r) => r.stderr)?.stderr || null;

    await pool.query(
      `UPDATE submissions
       SET verdict = $1, score = $2, runtime_ms = $3, memory_kb = $4,
           stderr_output = $5, test_case_results = $6::JSONB, updated_at = NOW()
       WHERE id = $7`,
      [finalVerdict, score, maxRuntime, maxMemory, firstError, JSON.stringify(results), submissionId]
    );
  },
};

/**
 * Background polling job — exported for use in src/index.ts.
 * Polls every 2 seconds for pending submissions.
 */
export function startSubmissionPoller(): void {
  setInterval(async () => {
    try {
      const pending = await pool.query(
        `SELECT id FROM submissions
         WHERE verdict = 'pending' AND created_at < NOW() - INTERVAL '3 seconds'
         ORDER BY created_at ASC LIMIT 20`
      );
      await Promise.allSettled(
        pending.rows.map((r: any) => submissionService.processJudge0Result(r.id))
      );
    } catch (err) {
      console.error('Submission poller error:', err);
    }
  }, 2000);
}
