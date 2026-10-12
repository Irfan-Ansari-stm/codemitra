import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { toSlug, toUniqueSlug } from '../utils/slug';

export const problemService = {
  async list(params: {
    tenantId?: string;
    userId?: string;
    scope?: string;
    platformWide?: boolean;
    difficulty?: string;
    tags?: string[];
    search?: string;
    status?: string;
    bookmarked?: boolean;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;
    const conditions: string[] = ['NOT p.is_deleted'];
    const joins: string[] = [];
    const values: any[] = [];

    // Anonymous callers (no tenantId) must only ever see public problems,
    // regardless of the requested scope.
    if (params.platformWide) {
      // Super admins can review all tenant and public problems, or filter by scope.
      if (params.scope && params.scope !== 'all') {
        values.push(params.scope);
        conditions.push(`p.scope = $${values.length}`);
      }
    } else if (params.scope === 'public' || !params.tenantId) {
      conditions.push(`p.scope = 'public'`);
    } else {
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

    if (params.tags && params.tags.length) {
      values.push(params.tags);
      conditions.push(`p.tags && $${values.length}`);
    }

    // User-specific context: solved flag, bookmarked flag, and user-scoped filters.
    let solvedExpr = 'FALSE';
    let bookmarkedExpr = 'FALSE';
    if (params.userId) {
      values.push(params.userId);
      const userIdParam = values.length;
      joins.push(
        `LEFT JOIN (SELECT DISTINCT problem_id FROM submissions WHERE user_id = $${userIdParam} AND verdict = 'accepted') solved_subs ON solved_subs.problem_id = p.id`
      );
      joins.push(
        `LEFT JOIN problem_bookmarks pb ON pb.problem_id = p.id AND pb.user_id = $${userIdParam}`
      );
      solvedExpr = `solved_subs.problem_id IS NOT NULL`;
      bookmarkedExpr = `pb.user_id IS NOT NULL`;

      if (params.status === 'solved') {
        conditions.push(solvedExpr);
      } else if (params.status === 'unsolved') {
        conditions.push(`NOT ${solvedExpr}`);
      }

      if (params.bookmarked) {
        conditions.push(bookmarkedExpr);
      }
    }

    // Sorting is restricted to a whitelist of column expressions.
    const direction = params.order === 'asc' ? 'ASC' : 'DESC';
    let orderBy = 'p.created_at DESC';
    switch (params.sort) {
      case 'created_at':
        orderBy = `p.created_at ${direction}`;
        break;
      case 'title':
        orderBy = `p.title ${direction}`;
        break;
      case 'difficulty':
        orderBy = `CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END ${direction}`;
        break;
      case 'acceptance_rate':
        orderBy = `(p.accepted_submissions::NUMERIC / NULLIF(p.total_submissions, 0)) ${direction} NULLS LAST`;
        break;
      case 'total_submissions':
        orderBy = `p.total_submissions ${direction}`;
        break;
    }

    const where = conditions.join(' AND ');
    const joinSql = joins.join(' ');
    const result = await pool.query(
      `SELECT p.id, p.tenant_id, p.title, p.slug, p.difficulty, p.scope, p.tags,
              p.total_submissions, p.accepted_submissions, p.created_at,
              CASE WHEN p.total_submissions = 0 THEN 0
                   ELSE ROUND((p.accepted_submissions::NUMERIC / p.total_submissions) * 100, 1)
              END AS acceptance_rate,
              ${solvedExpr} AS solved,
              ${bookmarkedExpr} AS bookmarked
       FROM problems p
       ${joinSql}
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM problems p ${joinSql} WHERE ${where}`,
      values
    );
    return { data: result.rows, total: parseInt(count.rows[0].count) };
  },

  async getBookmarks(userId: string, page = 1, limit = 20) {
    return this.list({ userId, bookmarked: true, page, limit });
  },

  async isBookmarked(userId: string, problemId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM problem_bookmarks WHERE user_id = $1 AND problem_id = $2 LIMIT 1',
      [userId, problemId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async addBookmark(userId: string, problemId: string) {
    const problem = await pool.query(
      'SELECT id FROM problems WHERE id = $1 AND NOT is_deleted LIMIT 1',
      [problemId]
    );
    if (!problem.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Problem not found');
    await pool.query(
      'INSERT INTO problem_bookmarks (user_id, problem_id) VALUES ($1, $2) ON CONFLICT (user_id, problem_id) DO NOTHING',
      [userId, problemId]
    );
    return { bookmarked: true };
  },

  async removeBookmark(userId: string, problemId: string) {
    await pool.query(
      'DELETE FROM problem_bookmarks WHERE user_id = $1 AND problem_id = $2',
      [userId, problemId]
    );
    return { bookmarked: false };
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
    slug?: string;
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
    const slug = data.slug ? toSlug(data.slug) : toUniqueSlug(data.title);
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

  async update(problemId: string, data: Record<string, any>, tenantId?: string) {
    const mapped = { ...data };
    if ('tenantId' in mapped) mapped.tenant_id = mapped.tenantId;
    if ('timeLimitMs' in mapped) mapped.time_limit_ms = mapped.timeLimitMs;
    if ('memoryLimitMb' in mapped) mapped.memory_limit_mb = mapped.memoryLimitMb;
    if ('constraintsText' in mapped) mapped.constraints_text = mapped.constraintsText;
    const allowed = ['tenant_id', 'title', 'statement', 'difficulty', 'scope', 'input_format', 'output_format', 'constraints_text', 'sample_explanation', 'tags', 'time_limit_ms', 'memory_limit_mb', 'allowed_languages'];
    const fields = Object.keys(mapped).filter((key) => allowed.includes(key));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const assignments = fields.map((field, i) => `${field}=$${i + 2}`).join(', ');
    const values = fields.map((field) => ['tags', 'allowed_languages'].includes(field) ? `{${mapped[field].join(',')}}` : mapped[field]);
    const tenantFilter = tenantId ? ` AND tenant_id = $${values.length + 2}` : '';
    const result = await pool.query(`UPDATE problems SET ${assignments}, updated_at=NOW() WHERE id=$1 AND NOT is_deleted${tenantFilter} RETURNING *`, tenantId ? [problemId, ...values, tenantId] : [problemId, ...values]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Problem not found');
    return result.rows[0];
  },

  async softDelete(problemId: string, tenantId?: string) {
    const result = await pool.query(
      `UPDATE problems SET is_deleted=TRUE, updated_at=NOW()
       WHERE id=$1 AND NOT is_deleted${tenantId ? ' AND tenant_id = $2' : ''}
       RETURNING id`,
      tenantId ? [problemId, tenantId] : [problemId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Problem not found');
  },

  async updateTestCase(id: string, data: Record<string, any>) {
    const mapped = { ...data };
    if ('isHidden' in mapped) mapped.is_hidden = mapped.isHidden;
    if ('orderIndex' in mapped) mapped.order_index = mapped.orderIndex;
    const allowed = ['input', 'expected_output', 'is_hidden', 'points', 'order_index', 'explanation'];
    const fields = Object.keys(mapped).filter((key) => allowed.includes(key));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const assignments = fields.map((field, i) => `${field}=$${i + 2}`).join(', ');
    const result = await pool.query(`UPDATE test_cases SET ${assignments}, updated_at=NOW() WHERE id=$1 RETURNING *`, [id, ...fields.map((field) => mapped[field])]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Test case not found');
    return result.rows[0];
  },

  async deleteTestCase(id: string) {
    await pool.query('DELETE FROM test_cases WHERE id=$1', [id]);
  },

  async getStats(problemId: string) {
    const result = await pool.query(
      `SELECT p.id, p.total_submissions AS totalSubmissions, p.accepted_submissions AS acceptedSubmissions,
              CASE WHEN p.total_submissions=0 THEN 0 ELSE ROUND(p.accepted_submissions::numeric / p.total_submissions * 100, 1) END AS acceptanceRate,
              p.difficulty, p.scope
       FROM problems p WHERE p.id=$1 AND NOT p.is_deleted`, [problemId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Problem not found');
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
