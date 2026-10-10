import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export const courseService = {
  // ── Courses ────────────────────────────────────────────────────────────────
  async listCourses(tenantId: string, status?: string) {
    const params: any[] = [tenantId];
    let statusFilter = '';
    if (status) {
      params.push(status);
      statusFilter = `AND c.status = $${params.length}`;
    }
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.thumbnail_url, c.status,
              c.language_tags, c.sort_order, c.created_at,
              u.name AS created_by_name,
              COUNT(DISTINCT m.id) AS module_count
       FROM courses c
       JOIN users u ON u.id = c.created_by
       LEFT JOIN modules m ON m.course_id = c.id AND NOT m.is_deleted
       WHERE c.tenant_id = $1 AND NOT c.is_deleted ${statusFilter}
       GROUP BY c.id, u.name
       ORDER BY c.sort_order, c.created_at DESC`,
      params
    );
    return result.rows;
  },

  async getCourse(id: string, tenantId: string) {
    const result = await pool.query(
      `SELECT c.*, u.name AS created_by_name
       FROM courses c JOIN users u ON u.id = c.created_by
       WHERE c.id = $1 AND c.tenant_id = $2 AND NOT c.is_deleted LIMIT 1`,
      [id, tenantId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    const modules = await courseService.listModules(id, tenantId);
    return { ...result.rows[0], modules };
  },

  async createCourse(data: {
    tenantId: string;
    createdBy: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    languageTags?: string[];
    status?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO courses (tenant_id, created_by, title, description, thumbnail_url, language_tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.tenantId, data.createdBy, data.title,
        data.description || null, data.thumbnailUrl || null,
        `{${(data.languageTags || []).join(',')}}`, data.status || 'draft',
      ]
    );
    return result.rows[0];
  },

  async updateCourse(id: string, tenantId: string, data: Record<string, any>) {
    const mapped = { ...data };
    if ('thumbnailUrl' in mapped) mapped.thumbnail_url = mapped.thumbnailUrl;
    if ('languageTags' in mapped) mapped.language_tags = mapped.languageTags;
    const allowed = ['title', 'description', 'thumbnail_url', 'language_tags', 'status', 'sort_order'];
    const fields = Object.keys(mapped).filter((k) => allowed.includes(k));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const result = await pool.query(
      `UPDATE courses SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND NOT is_deleted RETURNING *`,
      [id, tenantId, ...fields.map((f) => mapped[f])]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0];
  },

  async softDeleteCourse(id: string, tenantId: string) {
    const result = await pool.query('UPDATE courses SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 AND NOT is_deleted RETURNING id', [id, tenantId]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  async listModules(courseId: string, tenantId?: string | null) {
    const result = await pool.query(
      `SELECT m.*, COUNT(DISTINCT ch.id) AS chapter_count
       FROM modules m
       LEFT JOIN chapters ch ON ch.module_id = m.id AND NOT ch.is_deleted
       WHERE m.course_id = $1 AND NOT m.is_deleted
         AND ($2::uuid IS NULL OR m.tenant_id = $2)
       GROUP BY m.id ORDER BY m.order_index`,
      [courseId, tenantId || null]
    );
    return result.rows;
  },

  async createModule(data: {
    courseId: string;
    tenantId: string;
    title: string;
    description?: string;
    orderIndex?: number;
    status?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO modules (course_id, tenant_id, title, description, order_index, status)
       SELECT c.id, c.tenant_id, $3, $4, $5, $6 FROM courses c
       WHERE c.id = $1 AND c.tenant_id = $2 AND NOT c.is_deleted RETURNING *`,
      [data.courseId, data.tenantId, data.title, data.description || null, data.orderIndex ?? 0, data.status || 'draft']
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0];
  },

  // ── Chapters ───────────────────────────────────────────────────────────────
  async listChapters(moduleId: string, tenantId?: string | null) {
    const result = await pool.query(
      `SELECT * FROM chapters WHERE module_id = $1 AND NOT is_deleted
       AND ($2::uuid IS NULL OR tenant_id = $2) ORDER BY order_index`,
      [moduleId, tenantId || null]
    );
    return result.rows;
  },

  async updateModule(id: string, tenantId: string | null | undefined, data: Record<string, any>) {
    const allowed = ['title', 'description', 'status', 'order_index'];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const set = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(`UPDATE modules SET ${set}, updated_at=NOW() WHERE id=$1 AND NOT is_deleted AND ($${fields.length + 2}::uuid IS NULL OR tenant_id=$${fields.length + 2}) RETURNING *`, [id, ...fields.map((f) => data[f]), tenantId || null]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Module not found');
    return result.rows[0];
  },

  async reorderModules(courseId: string, tenantId: string | null | undefined, order: { id: string; orderIndex: number }[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const course = await client.query('SELECT id FROM courses WHERE id=$1 AND NOT is_deleted AND ($2::uuid IS NULL OR tenant_id=$2) FOR UPDATE', [courseId, tenantId || null]);
      if (!course.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
      for (const item of order) {
        const updated = await client.query('UPDATE modules SET order_index=$1, updated_at=NOW() WHERE id=$2 AND course_id=$3 AND NOT is_deleted AND ($4::uuid IS NULL OR tenant_id=$4) RETURNING id', [item.orderIndex, item.id, courseId, tenantId || null]);
        if (!updated.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Module not found in course');
      }
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
    return courseService.listModules(courseId, tenantId);
  },

  async softDeleteModule(id: string, tenantId?: string | null) {
    const result = await pool.query('UPDATE modules SET is_deleted=TRUE, updated_at=NOW() WHERE id=$1 AND NOT is_deleted AND ($2::uuid IS NULL OR tenant_id=$2) RETURNING id', [id, tenantId || null]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Module not found');
  },

  async getChapter(id: string, tenantId?: string | null) {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE id = $1 AND NOT is_deleted AND ($2::uuid IS NULL OR tenant_id=$2) LIMIT 1',
      [id, tenantId || null]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    const problems = await pool.query('SELECT id, title, slug, difficulty, scope FROM problems WHERE chapter_id=$1 AND NOT is_deleted ORDER BY created_at DESC', [id]);
    return { ...result.rows[0], problems: problems.rows };
  },

  async createChapter(data: {
    moduleId: string;
    tenantId: string;
    title: string;
    content?: string;
    orderIndex?: number;
    estimatedMinutes?: number;
    status?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO chapters (module_id, tenant_id, title, content, order_index, estimated_minutes, status)
       SELECT m.id, m.tenant_id, $3, $4, $5, $6, $7 FROM modules m
       WHERE m.id=$1 AND m.tenant_id=$2 AND NOT m.is_deleted RETURNING *`,
      [data.moduleId, data.tenantId, data.title, data.content || null, data.orderIndex ?? 0, data.estimatedMinutes ?? 30, data.status || 'draft']
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Module not found');
    return result.rows[0];
  },

  async updateChapter(id: string, tenantId: string | null | undefined, data: Record<string, any>) {
    const allowed = ['title', 'content', 'status', 'order_index', 'estimated_minutes'];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const set = fields.map((f, i) => `${f}=$${i + 2}`).join(', ');
    const result = await pool.query(`UPDATE chapters SET ${set}, updated_at=NOW() WHERE id=$1 AND NOT is_deleted AND ($${fields.length + 2}::uuid IS NULL OR tenant_id=$${fields.length + 2}) RETURNING *`, [id, ...fields.map((f) => data[f]), tenantId || null]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    return result.rows[0];
  },

  async softDeleteChapter(id: string, tenantId?: string | null) {
    const result = await pool.query('UPDATE chapters SET is_deleted=TRUE, updated_at=NOW() WHERE id=$1 AND NOT is_deleted AND ($2::uuid IS NULL OR tenant_id=$2) RETURNING id', [id, tenantId || null]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
  },
};
