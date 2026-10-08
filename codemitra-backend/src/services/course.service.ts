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
    return result.rows[0];
  },

  async createCourse(data: {
    tenantId: string;
    createdBy: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    languageTags?: string[];
  }) {
    const result = await pool.query(
      `INSERT INTO courses (tenant_id, created_by, title, description, thumbnail_url, language_tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.tenantId, data.createdBy, data.title,
        data.description || null, data.thumbnailUrl || null,
        `{${(data.languageTags || []).join(',')}}`,
      ]
    );
    return result.rows[0];
  },

  async updateCourse(id: string, tenantId: string, data: Record<string, any>) {
    const allowed = ['title', 'description', 'thumbnail_url', 'language_tags', 'status', 'sort_order'];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const result = await pool.query(
      `UPDATE courses SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND NOT is_deleted RETURNING *`,
      [id, tenantId, ...fields.map((f) => data[f])]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0];
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  async listModules(courseId: string) {
    const result = await pool.query(
      `SELECT m.*, COUNT(DISTINCT ch.id) AS chapter_count
       FROM modules m
       LEFT JOIN chapters ch ON ch.module_id = m.id AND NOT ch.is_deleted
       WHERE m.course_id = $1 AND NOT m.is_deleted
       GROUP BY m.id ORDER BY m.order_index`,
      [courseId]
    );
    return result.rows;
  },

  async createModule(data: {
    courseId: string;
    tenantId: string;
    title: string;
    description?: string;
    orderIndex?: number;
  }) {
    const result = await pool.query(
      `INSERT INTO modules (course_id, tenant_id, title, description, order_index)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.courseId, data.tenantId, data.title, data.description || null, data.orderIndex ?? 0]
    );
    return result.rows[0];
  },

  // ── Chapters ───────────────────────────────────────────────────────────────
  async listChapters(moduleId: string) {
    const result = await pool.query(
      `SELECT * FROM chapters WHERE module_id = $1 AND NOT is_deleted ORDER BY order_index`,
      [moduleId]
    );
    return result.rows;
  },

  async getChapter(id: string) {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE id = $1 AND NOT is_deleted LIMIT 1',
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    return result.rows[0];
  },

  async createChapter(data: {
    moduleId: string;
    tenantId: string;
    title: string;
    content?: string;
    orderIndex?: number;
    estimatedMinutes?: number;
  }) {
    const result = await pool.query(
      `INSERT INTO chapters (module_id, tenant_id, title, content, order_index, estimated_minutes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.moduleId, data.tenantId, data.title, data.content || null, data.orderIndex ?? 0, data.estimatedMinutes ?? 30]
    );
    return result.rows[0];
  },
};
