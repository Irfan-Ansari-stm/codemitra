import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { toUniqueSlug } from '../utils/slug';

export const problemService = {
  async list(params: {
    tenantId?: string;
    scope?: string;
    difficulty?: string;
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['NOT p.is_deleted'];
    const values: any[] = [];

    if (params.scope === 'public') {
      conditions.push(`p.scope = 'public'`);
    } else if (params.tenantId) {
      values.push(params.tenantId);
      conditions.push(`(p.tenant_id = $${values.length} OR p.scope = 'public')`);
    }

    if (params.difficulty) {
      values.push(params.difficulty);
      conditions.push(`p.difficulty = $${values.length}`);
    }

    if (params.search) {
      values.push(`%${params.search}%`);
      conditions.push(`p.title ILIKE $${values.length}`);
    }

    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT p.id, p.title, p.slug, p.difficulty, p.scope, p.tags,
              p.total_submissions, p.accepted_submissions, p.created_at,
              CASE WHEN p.total_submissions = 0 THEN 0
                   ELSE ROUND((p.accepted_submissions::NUMERIC / p.total_submissions) * 100, 1)
              END AS acceptance_rate
       FROM problems p WHERE ${where}
       ORDER BY p.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM problems p WHERE ${where}`,
      values
    );
    return { data: result.rows, total: parseInt(count.rows[0].count) };
  },

  async getById(id: string) {
    const result = await pool.query(
      `SELECT p.*, u.name AS created_by_name,
              (SELECT json_agg(tc ORDER BY tc.order_index)
               FROM test_cases tc WHERE tc.problem_id = p.id AND NOT tc.is_hidden) AS sample_cases
       FROM problems p JOIN users u ON u.id = p.created_by
       WHERE p.id = $1 AND NOT p.is_deleted LIMIT 1`,
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Problem not found');
    return result.rows[0];
  },

  async create(data: {
    tenantId?: string | null;
    chapterId?: string | null;
    createdBy: string;
    title: string;
    statement: string;
    difficulty: string;
    scope: string;
    inputFormat?: string;
    outputFormat?: string;
    constraintsText?: string;
    sampleExplanation?: string;
    tags?: string[];
    timeLimitMs?: number;
    memoryLimitMb?: number;
    allowedLanguages?: number[];
  }) {
    const slug = toUniqueSlug(data.title);
    const result = await pool.query(
      `INSERT INTO problems
         (tenant_id, chapter_id, created_by, title, slug, statement, difficulty, scope,
          input_format, output_format, constraints_text, sample_explanation, tags,
          time_limit_ms, memory_limit_mb, allowed_languages)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        data.tenantId || null, data.chapterId || null, data.createdBy,
        data.title, slug, data.statement, data.difficulty, data.scope,
        data.inputFormat || null, data.outputFormat || null,
        data.constraintsText || null, data.sampleExplanation || null,
        `{${(data.tags || []).join(',')}}`,
        data.timeLimitMs || 2000, data.memoryLimitMb || 256,
        `{${(data.allowedLanguages || [71, 50, 54, 62, 63]).join(',')}}`,
      ]
    );
    return result.rows[0];
  },

  async addTestCase(data: {
    problemId: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    points?: number;
    orderIndex?: number;
    explanation?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, points, order_index, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.problemId, data.input, data.expectedOutput,
        data.isHidden !== false, data.points ?? 1,
        data.orderIndex ?? 0, data.explanation || null,
      ]
    );
    return result.rows[0];
  },

  async getTestCases(problemId: string, includeHidden = false) {
    const hiddenFilter = includeHidden ? '' : 'AND is_hidden = FALSE';
    const result = await pool.query(
      `SELECT * FROM test_cases WHERE problem_id = $1 ${hiddenFilter} ORDER BY order_index`,
      [problemId]
    );
    return result.rows;
  },
};
