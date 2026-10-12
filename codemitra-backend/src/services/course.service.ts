import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

// ── Types ─────────────────────────────────────────────────────────

export type CourseSort = 'newest' | 'oldest' | 'title' | 'popular';

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  status?: string;
  sort?: CourseSort;
  order?: 'asc' | 'desc';
}

export interface CourseListResult {
  courses: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Shared SELECT with computed per-course aggregates.
const COURSE_AGGREGATES = `(SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id AND NOT m.is_deleted) AS module_count,
    (SELECT COUNT(*) FROM chapters ch JOIN modules m2 ON ch.module_id = m2.id WHERE m2.course_id = c.id AND NOT ch.is_deleted AND NOT m2.is_deleted) AS chapter_count,
    (SELECT COALESCE(SUM(ch.estimated_minutes), 0) FROM chapters ch JOIN modules m2 ON ch.module_id = m2.id WHERE m2.course_id = c.id AND NOT ch.is_deleted AND NOT m2.is_deleted) AS total_minutes,
    (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.is_active) AS enrollment_count`;

const PUBLISHED_COURSE_AGGREGATES = `(SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id AND m.status = 'published' AND NOT m.is_deleted) AS module_count,
    (SELECT COUNT(*) FROM chapters ch JOIN modules m2 ON ch.module_id = m2.id WHERE m2.course_id = c.id AND m2.status = 'published' AND ch.status = 'published' AND NOT ch.is_deleted AND NOT m2.is_deleted) AS chapter_count,
    (SELECT COALESCE(SUM(ch.estimated_minutes), 0) FROM chapters ch JOIN modules m2 ON ch.module_id = m2.id WHERE m2.course_id = c.id AND m2.status = 'published' AND ch.status = 'published' AND NOT ch.is_deleted AND NOT m2.is_deleted) AS total_minutes,
    (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.is_active) AS enrollment_count`;

const SORT_CLAUSES: Record<CourseSort, string> = {
  newest: 'c.created_at DESC',
  oldest: 'c.created_at ASC',
  title: 'c.title ASC',
  popular: 'enrollment_count DESC, c.sort_order ASC, c.created_at DESC',
};

export const courseService = {
  // ── Courses ────────────────────────────────────────────────────────
  /**
   * Lists tenant courses. When `limit` is a positive number the result is
   * paginated and returned as a CourseListResult; otherwise every matching
   * course is returned as a plain array (backward-compatible behavior).
   */
  async listCourses(
    tenantId: string | null,
    params: CourseListParams = {},
    platformWide = false
  ): Promise<any[] | CourseListResult> {
    const clauses: string[] = ['NOT c.is_deleted'];
    const values: any[] = [];
    if (platformWide) {
      // Super admins can manage all tenant and general-audience courses.
    } else if (tenantId) {
      values.push(tenantId);
      clauses.push(`c.tenant_id = $${values.length}`);
    } else {
      clauses.push(`c.tenant_id IS NULL AND c.status = 'published'`);
    }

    if (params.status) {
      values.push(params.status);
      clauses.push(`c.status = $${values.length}`);
    }
    if (params.search) {
      values.push(`%${params.search}%`);
      clauses.push(
        `(c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`
      );
    }
    if (params.language) {
      values.push(params.language);
      clauses.push(`c.language_tags @> ARRAY[$${values.length}]`);
    }

    const sort = params.sort ?? 'newest';
    const direction = params.order === 'asc' ? 'ASC' : 'DESC';
    let orderBy = SORT_CLAUSES[sort];
    if (params.order && sort !== 'popular') {
      const sortColumn = sort === 'title' ? 'c.title' : 'c.created_at';
      orderBy = `${sortColumn} ${direction}`;
    }

    const aggregates = tenantId || platformWide ? COURSE_AGGREGATES : PUBLISHED_COURSE_AGGREGATES;
      const baseQuery = `SELECT c.id, c.tenant_id, c.title, c.description, c.thumbnail_url, c.status,
      c.language_tags, c.sort_order, c.created_at, c.updated_at,
      u.name AS created_by_name,
      ${aggregates}
      FROM courses c
      JOIN users u ON u.id = c.created_by
      WHERE ${clauses.join(' AND ')}
      GROUP BY c.id, u.name`;

    // No limit requested — return the full list (legacy contract).
    if (!params.limit || params.limit <= 0) {
      const result = await pool.query(`${baseQuery} ORDER BY ${orderBy}`);
      return result.rows;
    }

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, params.limit);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM courses c WHERE ${clauses.join(' AND ')}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(`${baseQuery} ORDER BY ${orderBy} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [
      ...values,
      limit,
      offset,
    ]);

    return {
      courses: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Featured courses — documented rule: published courses with the most
   * active enrollments, tie-broken by manual sort order, then newest.
   */
  async getFeaturedCourses(tenantId: string | null, limit = 3) {
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.thumbnail_url, c.status,
        c.language_tags, c.sort_order, c.created_at, c.updated_at,
        u.name AS created_by_name,
        ${PUBLISHED_COURSE_AGGREGATES}
        FROM courses c
        JOIN users u ON u.id = c.created_by
        WHERE (($1::uuid IS NULL AND c.tenant_id IS NULL) OR c.tenant_id = $1)
          AND NOT c.is_deleted AND c.status = 'published'
        GROUP BY c.id, u.name
        ORDER BY enrollment_count DESC, c.sort_order ASC, c.created_at DESC
        LIMIT $2`,
      [tenantId, Math.min(20, Math.max(1, limit))]
    );
    return result.rows;
  },

  async getCatalogStats(tenantId: string | null) {
    if (!tenantId) {
      const result = await pool.query(
        `SELECT
          COUNT(*) AS total_courses,
          COUNT(*) AS published_courses,
          (SELECT COUNT(*) FROM modules m JOIN courses c2 ON c2.id = m.course_id
            WHERE c2.status = 'published' AND m.status = 'published'
              AND NOT m.is_deleted AND NOT c2.is_deleted) AS total_modules,
          (SELECT COUNT(*) FROM chapters ch
            JOIN modules m ON m.id = ch.module_id
            JOIN courses c2 ON c2.id = m.course_id
            WHERE c2.status = 'published' AND m.status = 'published'
              AND ch.status = 'published' AND NOT ch.is_deleted
              AND NOT m.is_deleted AND NOT c2.is_deleted) AS total_lessons
        FROM courses c
        WHERE c.tenant_id IS NULL AND c.status = 'published' AND NOT c.is_deleted`
      );
      return result.rows[0];
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE NOT c.is_deleted) AS total_courses,
        COUNT(*) FILTER (WHERE NOT c.is_deleted AND c.status = 'published') AS published_courses,
        (SELECT COUNT(*) FROM modules m JOIN courses c2 ON c2.id = m.course_id
          WHERE c2.tenant_id = $1 AND NOT m.is_deleted AND NOT c2.is_deleted) AS total_modules,
        (SELECT COUNT(*) FROM chapters ch
          JOIN modules m ON m.id = ch.module_id
          JOIN courses c2 ON c2.id = m.course_id
          WHERE c2.tenant_id = $1 AND NOT ch.is_deleted AND NOT m.is_deleted AND NOT c2.is_deleted) AS total_lessons
      FROM courses c
      WHERE c.tenant_id = $1`,
      [tenantId]
    );
    return result.rows[0];
  },

  async getCourse(id: string, tenantId: string | null, userId?: string, platformWide = false, publishedOnly = false) {
    const aggregates = publishedOnly || (!tenantId && !platformWide) ? PUBLISHED_COURSE_AGGREGATES : COURSE_AGGREGATES;
    const result = await pool.query(
      `SELECT c.*, u.name AS created_by_name, u.avatar_url AS created_by_avatar_url,
        ${aggregates}
        FROM courses c JOIN users u ON u.id = c.created_by
        WHERE c.id = $1 AND NOT c.is_deleted
          AND ($3::boolean OR (($2::uuid IS NOT NULL AND c.tenant_id = $2)
            OR ($2::uuid IS NULL AND c.tenant_id IS NULL AND c.status = 'published')))
          AND (NOT $4::boolean OR c.status = 'published')
        LIMIT 1`,
      [id, tenantId, platformWide, publishedOnly]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    const course = result.rows[0];
    course.modules = await courseService.listModulesWithChapters(
      id,
      course.tenant_id,
      publishedOnly || (!tenantId && !platformWide)
    );
    if (userId) {
      course.is_enrolled = await courseService.isEnrolled(id, userId);
      course.progress = await courseService.getCourseProgress(id, userId, publishedOnly || (!tenantId && !platformWide));
    }
    return course;
  },

  async getPublishedCourseTenantId(courseId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT tenant_id FROM courses
      WHERE id = $1 AND tenant_id IS NULL AND status = 'published' AND NOT is_deleted
       LIMIT 1`,
      [courseId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0].tenant_id;
  },

  async getPublishedCourseTenantIdForChapter(chapterId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT c.tenant_id
       FROM chapters ch
       JOIN modules m ON m.id = ch.module_id
       JOIN courses c ON c.id = m.course_id
      WHERE ch.id = $1 AND c.tenant_id IS NULL AND ch.status = 'published' AND NOT ch.is_deleted
         AND m.status = 'published' AND NOT m.is_deleted
         AND c.status = 'published' AND NOT c.is_deleted
       LIMIT 1`,
      [chapterId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    return result.rows[0].tenant_id;
  },

  async getPublishedModuleTenantId(moduleId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT c.tenant_id
       FROM modules m
       JOIN courses c ON c.id = m.course_id
      WHERE m.id = $1 AND c.tenant_id IS NULL AND m.status = 'published' AND NOT m.is_deleted
         AND c.status = 'published' AND NOT c.is_deleted
       LIMIT 1`,
      [moduleId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Module not found');
    return result.rows[0].tenant_id;
  },

  async isEnrolled(courseId: string, studentId: string) {
    const result = await pool.query(
      `SELECT is_active FROM course_enrollments WHERE course_id = $1 AND student_id = $2 LIMIT 1`,
      [courseId, studentId]
    );
    return !!result.rows[0]?.is_active;
  },

  /**
   * Enrolls a student in a course. Idempotent: re-enrolling an existing
   * (even previously inactive) enrollment reactivates it.
   */
  async enrollStudent(courseId: string, studentId: string, tenantId: string | null) {
    const course = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND tenant_id IS NOT DISTINCT FROM $2::uuid
         AND status = 'published' AND NOT is_deleted`,
      [courseId, tenantId]
    );
    if (!course.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    const result = await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id, tenant_id, enrolled_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_id, student_id) DO UPDATE
         SET is_active = TRUE, enrolled_at = NOW()
       RETURNING *`,
      [courseId, studentId, tenantId, studentId]
    );
    return result.rows[0];
  },

  async getEnrollment(courseId: string, studentId: string) {
    const result = await pool.query(
      `SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2 LIMIT 1`,
      [courseId, studentId]
    );
    return result.rows[0] ?? null;
  },

  /** Enrolled courses for a student, with per-course completion rollup. */
  async listEnrolledCourses(studentId: string, tenantId: string | null) {
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.thumbnail_url, c.status,
        c.language_tags, c.sort_order, c.created_at, c.updated_at,
        u.name AS created_by_name, ce.enrolled_at,
        (SELECT COUNT(*) FROM chapters ch JOIN modules m ON m.id = ch.module_id
          WHERE m.course_id = c.id AND NOT ch.is_deleted AND NOT m.is_deleted) AS chapter_count,
        (SELECT COUNT(*) FROM chapters ch JOIN modules m ON m.id = ch.module_id
          JOIN user_progress up ON up.chapter_id = ch.id
          WHERE m.course_id = c.id AND NOT ch.is_deleted AND NOT m.is_deleted
            AND up.user_id = $1 AND up.is_completed) AS completed_lessons
        FROM course_enrollments ce
        JOIN courses c ON c.id = ce.course_id
        JOIN users u ON u.id = c.created_by
        WHERE ce.student_id = $1 AND ce.tenant_id IS NOT DISTINCT FROM $2::uuid
          AND ce.is_active AND NOT c.is_deleted
        ORDER BY ce.enrolled_at DESC`,
      [studentId, tenantId]
    );
    return result.rows;
  },

  async getCourseProgress(
    courseId: string,
    studentId: string,
    publishedOnly = false
  ) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT ch.id) AS total_lessons,
        COUNT(DISTINCT ch.id) FILTER (WHERE up.is_completed) AS completed_lessons,
        MAX(up.last_accessed_at) AS last_accessed_at,
        MAX(up.completed_at) AS completed_at
      FROM chapters ch
      JOIN modules m ON m.id = ch.module_id
      LEFT JOIN user_progress up ON up.chapter_id = ch.id AND up.user_id = $2
      WHERE m.course_id = $1 AND NOT ch.is_deleted AND NOT m.is_deleted
        AND (NOT $3::boolean OR (m.status = 'published' AND ch.status = 'published'))
      GROUP BY m.course_id`,
      [courseId, studentId, publishedOnly]
    );
    const row = result.rows[0];
    if (!row) {
      return { totalLessons: 0, completedLessons: 0, percent: 0, lastAccessedAt: null, completedAt: null };
    }
    const total = parseInt(row.total_lessons, 10) || 0;
    const completed = parseInt(row.completed_lessons, 10) || 0;
    return {
      totalLessons: total,
      completedLessons: completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      lastAccessedAt: row.last_accessed_at ?? null,
      completedAt: row.completed_at ?? null,
    };
  },

  /**
   * Marks a chapter complete/incomplete for the current user.
   * user_progress has no unique constraint on (user_id, chapter_id),
   * so the upsert is done as an explicit update-then-insert.
   */
  async updateChapterProgress(
    chapterId: string,
    studentId: string,
    tenantId: string | null,
    isCompleted: boolean
  ) {
    const chapter = await pool.query(
      `SELECT ch.id, ch.module_id, m.course_id
       FROM chapters ch JOIN modules m ON m.id = ch.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE ch.id = $1 AND NOT ch.is_deleted AND ch.status = 'published'
         AND m.status = 'published' AND c.status = 'published'
         AND NOT m.is_deleted AND NOT c.is_deleted`,
      [chapterId]
    );
    if (!chapter.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    const { course_id: courseId } = chapter.rows[0];
    const course = await pool.query(
      'SELECT tenant_id FROM courses WHERE id = $1 AND NOT is_deleted',
      [courseId]
    );
    if (!course.rows[0] || course.rows[0].tenant_id !== tenantId) {
      throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    }

    const enrollment = await pool.query(
      `SELECT 1 FROM course_enrollments
      WHERE course_id = $1 AND student_id = $2 AND tenant_id IS NOT DISTINCT FROM $3::uuid AND is_active
       LIMIT 1`,
      [courseId, studentId, tenantId]
    );
    if (!enrollment.rows[0]) {
      throw new AppError(403, 'FORBIDDEN', 'Enroll in this course before updating progress');
    }

    const existing = await pool.query(
      'SELECT id FROM user_progress WHERE user_id = $1 AND chapter_id = $2',
      [studentId, chapterId]
    );
    if (existing.rows[0]) {
      const updated = await pool.query(
        `UPDATE user_progress
         SET is_completed = $1, completion_percent = $2,
           last_accessed_at = NOW(), completed_at = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [isCompleted, isCompleted ? 100 : 0, isCompleted ? new Date() : null, existing.rows[0].id]
      );
      return updated.rows[0];
    }
    const inserted = await pool.query(
      `INSERT INTO user_progress (user_id, chapter_id, tenant_id, is_completed,
         completion_percent, last_accessed_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING *`,
      [studentId, chapterId, tenantId, isCompleted, isCompleted ? 100 : 0, isCompleted ? new Date() : null]
    );
    return inserted.rows[0];
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  async createCourse(data: {
    tenantId: string | null;
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
        data.languageTags || [], data.status || 'draft',
      ]
    );
    return result.rows[0];
  },

  async updateCourse(id: string, tenantId: string | null | undefined, data: Record<string, any>) {
    const mapped = { ...data };
    if ('thumbnailUrl' in mapped) mapped.thumbnail_url = mapped.thumbnailUrl;
    if ('languageTags' in mapped) mapped.language_tags = mapped.languageTags;
    const allowed = ['title', 'description', 'thumbnail_url', 'language_tags', 'status', 'sort_order'];
    const fields = Object.keys(mapped).filter((k) => allowed.includes(k));
    if (!fields.length) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    const sets = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const scopeClause = tenantId === undefined ? '' : ' AND tenant_id = $2';
    const values = tenantId === undefined
      ? [id, ...fields.map((f) => mapped[f])]
      : [id, tenantId, ...fields.map((f) => mapped[f])];
    const offset = tenantId === undefined ? 1 : 2;
    const scopedSets = fields.map((field, index) => `${field} = $${index + offset + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE courses SET ${scopedSets}, updated_at = NOW()
       WHERE id = $1${scopeClause} AND NOT is_deleted RETURNING *`,
      values
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0];
  },

  async softDeleteCourse(id: string, tenantId: string | null | undefined) {
    const scopeClause = tenantId === undefined ? '' : ' AND tenant_id = $2';
    const values = tenantId === undefined ? [id] : [id, tenantId];
    const result = await pool.query(`UPDATE courses SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1${scopeClause} AND NOT is_deleted RETURNING id`, values);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  async listModules(
    courseId: string,
    tenantId?: string | null,
    publishedOnly = false
  ) {
    const result = await pool.query(
      `SELECT m.*, COUNT(DISTINCT ch.id) AS chapter_count
       FROM modules m
       LEFT JOIN chapters ch ON ch.module_id = m.id AND NOT ch.is_deleted
         AND (NOT $3::boolean OR ch.status = 'published')
       WHERE m.course_id = $1 AND NOT m.is_deleted
         AND ($2::uuid IS NULL OR m.tenant_id = $2)
         AND (NOT $3::boolean OR m.status = 'published')
       GROUP BY m.id ORDER BY m.order_index`,
      [courseId, tenantId || null, publishedOnly]
    );
    return result.rows;
  },

  /** Modules with their chapters nested, ordered by module and chapter order. */
  async listModulesWithChapters(
    courseId: string,
    tenantId?: string | null,
    publishedOnly = false
  ) {
    const modules = await this.listModules(courseId, tenantId, publishedOnly);
    const moduleIds = modules.map((module: any) => module.id);
    if (moduleIds.length === 0) return modules;
    const chapters = await pool.query(
      `SELECT * FROM chapters
       WHERE module_id = ANY($1) AND NOT is_deleted
         AND (NOT $2::boolean OR status = 'published')
       ORDER BY order_index`,
      [moduleIds, publishedOnly]
    );
    const chaptersByModule = new Map<string, any[]>();
    for (const chapter of chapters.rows) {
      const list = chaptersByModule.get(chapter.module_id) ?? [];
      list.push(chapter);
      chaptersByModule.set(chapter.module_id, list);
    }
    return modules.map((module: any) => ({
      ...module,
      chapters: chaptersByModule.get(module.id) ?? [],
    }));
  },

  async createModule(data: {
    courseId: string;
    tenantId: string | null;
    title: string;
    description?: string;
    orderIndex?: number;
    status?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO modules (course_id, tenant_id, title, description, order_index, status)
      SELECT c.id, c.tenant_id, $3, $4, $5, $6 FROM courses c
      WHERE c.id = $1 AND ($2::uuid IS NULL OR c.tenant_id = $2) AND NOT c.is_deleted RETURNING *`,
      [data.courseId, data.tenantId, data.title, data.description || null, data.orderIndex ?? 0, data.status || 'draft']
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0];
  },

  // ── Chapters ───────────────────────────────────────────────────────────────
  async listChapters(
    moduleId: string,
    tenantId?: string | null,
    publishedOnly = false
  ) {
    const result = await pool.query(
      `SELECT * FROM chapters WHERE module_id = $1 AND NOT is_deleted
       AND ($2::uuid IS NULL OR tenant_id = $2)
       AND (NOT $3::boolean OR status = 'published')
       ORDER BY order_index`,
      [moduleId, tenantId || null, publishedOnly]
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

  async getChapter(id: string, tenantId?: string | null, publishedOnly = false) {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE id = $1 AND NOT is_deleted AND ($2::uuid IS NULL OR tenant_id=$2) AND (NOT $3::boolean OR status = \'published\') LIMIT 1',
      [id, tenantId || null, publishedOnly]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Chapter not found');
    const problems = await pool.query('SELECT id, title, slug, difficulty, scope FROM problems WHERE chapter_id=$1 AND NOT is_deleted ORDER BY created_at DESC', [id]);
    return { ...result.rows[0], problems: problems.rows };
  },

  async createChapter(data: {
    moduleId: string;
    tenantId: string | null;
    title: string;
    content?: string;
    orderIndex?: number;
    estimatedMinutes?: number;
    status?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO chapters (module_id, tenant_id, title, content, order_index, estimated_minutes, status)
      SELECT m.id, m.tenant_id, $3, $4, $5, $6, $7 FROM modules m
      WHERE m.id=$1 AND ($2::uuid IS NULL OR m.tenant_id=$2) AND NOT m.is_deleted RETURNING *`,
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
