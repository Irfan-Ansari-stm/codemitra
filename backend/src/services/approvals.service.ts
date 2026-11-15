import { pool } from '../db';

export interface ApprovalsSummary {
  counts: {
    institutes: number;
    admissions: number;
    courses: number;
    total: number;
    approvedToday: number;
    rejectedToday: number;
    changesRequested: number;
  };
}

export interface ApprovalsListParams {
  search?: string;
  status?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const approvalsService = {
  // ---------------------------------------------------------------------------
  // SUMMARY METRICS
  // ---------------------------------------------------------------------------
  async getSummary(): Promise<ApprovalsSummary> {
    const [instRes, admRes, courseRes, todayRes, changesRes] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS count 
        FROM institute_applications 
        WHERE status IN ('pending', 'submitted', 'under_review')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count 
        FROM admissions 
        WHERE status IN ('pending', 'submitted', 'under_review')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count 
        FROM course_submissions 
        WHERE status IN ('pending', 'submitted', 'under_review')
      `),
      pool.query(`
        SELECT 
          (SELECT COUNT(*)::int FROM institute_applications WHERE status = 'approved' AND reviewed_at >= CURRENT_DATE) +
          (SELECT COUNT(*)::int FROM admissions WHERE status = 'approved' AND reviewed_at >= CURRENT_DATE) +
          (SELECT COUNT(*)::int FROM course_submissions WHERE status = 'approved' AND reviewed_at >= CURRENT_DATE) AS approved_today,
          (SELECT COUNT(*)::int FROM institute_applications WHERE status = 'rejected' AND reviewed_at >= CURRENT_DATE) +
          (SELECT COUNT(*)::int FROM admissions WHERE status = 'rejected' AND reviewed_at >= CURRENT_DATE) +
          (SELECT COUNT(*)::int FROM course_submissions WHERE status = 'rejected' AND reviewed_at >= CURRENT_DATE) AS rejected_today
      `),
      pool.query(`
        SELECT 
          (SELECT COUNT(*)::int FROM institute_applications WHERE status = 'changes_requested') +
          (SELECT COUNT(*)::int FROM admissions WHERE status = 'changes_requested') +
          (SELECT COUNT(*)::int FROM course_submissions WHERE status = 'changes_requested') AS changes_requested
      `)
    ]);

    const institutesCount = instRes.rows[0]?.count || 0;
    const admissionsCount = admRes.rows[0]?.count || 0;
    const coursesCount = courseRes.rows[0]?.count || 0;

    return {
      counts: {
        institutes: institutesCount,
        admissions: admissionsCount,
        courses: coursesCount,
        total: institutesCount + admissionsCount + coursesCount,
        approvedToday: todayRes.rows[0]?.approved_today || 0,
        rejectedToday: todayRes.rows[0]?.rejected_today || 0,
        changesRequested: changesRes.rows[0]?.changes_requested || 0,
      }
    };
  },

  // ---------------------------------------------------------------------------
  // INSTITUTE APPLICATIONS
  // ---------------------------------------------------------------------------
  async listInstitutes(params: ApprovalsListParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status && params.status !== 'all') {
      conditions.push(`ia.status = $${paramIndex++}`);
      values.push(params.status);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(ia.institution_name) LIKE $${paramIndex} OR
        LOWER(ia.contact_email) LIKE $${paramIndex} OR
        LOWER(COALESCE(ia.contact_person, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(ia.city, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(ia.application_number, '')) LIKE $${paramIndex}
      )`);
      values.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM institute_applications ia
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, values);
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT ia.id, ia.application_number, ia.institution_name, ia.slug,
             ia.contact_email, ia.contact_phone, ia.contact_person,
             ia.city, ia.state, ia.country, ia.institution_type, ia.established_year,
             ia.website_url, ia.address, ia.description, ia.documents,
             ia.status, ia.review_note, ia.rejection_reason, ia.admin_notes,
             ia.reviewed_at, ia.created_at, ia.updated_at,
             u.name AS applicant_name, u.email AS applicant_email,
             r.name AS reviewer_name
      FROM institute_applications ia
      LEFT JOIN users u ON u.id = ia.applicant_user_id
      LEFT JOIN users r ON r.id = ia.reviewed_by
      ${whereClause}
      ORDER BY ia.created_at ${orderClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      items: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getInstitute(id: string) {
    const res = await pool.query(`
      SELECT ia.*,
             u.name AS applicant_name, u.email AS applicant_email,
             r.name AS reviewer_name, r.email AS reviewer_email
      FROM institute_applications ia
      LEFT JOIN users u ON u.id = ia.applicant_user_id
      LEFT JOIN users r ON r.id = ia.reviewed_by
      WHERE ia.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return null;
    }

    const application = res.rows[0];

    // Fetch audit history
    const historyRes = await pool.query(`
      SELECT ah.*, u.name AS performed_by_name, u.email AS performed_by_email
      FROM approval_history ah
      LEFT JOIN users u ON u.id = ah.performed_by
      WHERE ah.entity_type = 'institute' AND ah.entity_id = $1
      ORDER BY ah.created_at DESC
    `, [id]);

    return {
      ...application,
      history: historyRes.rows,
    };
  },

  async approveInstitute(id: string, adminId: string, note?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const appRes = await client.query('SELECT * FROM institute_applications WHERE id = $1 FOR UPDATE', [id]);
      if (appRes.rows.length === 0) {
        throw new Error('Institute application not found');
      }
      const app = appRes.rows[0];

      await client.query(`
        UPDATE institute_applications
        SET status = 'approved',
            reviewed_by = $1,
            reviewed_at = NOW(),
            admin_notes = COALESCE($2, admin_notes),
            updated_at = NOW()
        WHERE id = $3
      `, [adminId, note || null, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, admin_notes, performed_by
        ) VALUES (
          'institute', $1, 'approve', $2, 'approved', $3, $4
        )
      `, [id, app.status, note || 'Application approved by Super Admin.', adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Institute application approved successfully' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async rejectInstitute(id: string, adminId: string, reason: string, adminNotes?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const appRes = await client.query('SELECT * FROM institute_applications WHERE id = $1 FOR UPDATE', [id]);
      if (appRes.rows.length === 0) {
        throw new Error('Institute application not found');
      }
      const app = appRes.rows[0];

      await client.query(`
        UPDATE institute_applications
        SET status = 'rejected',
            rejection_reason = $1,
            admin_notes = COALESCE($2, admin_notes),
            reviewed_by = $3,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $4
      `, [reason.trim(), adminNotes || null, adminId, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, reason, admin_notes, performed_by
        ) VALUES (
          'institute', $1, 'reject', $2, 'rejected', $3, $4, $5
        )
      `, [id, app.status, reason.trim(), adminNotes || null, adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Institute application rejected' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async requestInstituteChanges(id: string, adminId: string, comments: string) {
    if (!comments || !comments.trim()) {
      throw new Error('Comments are required when requesting changes');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const appRes = await client.query('SELECT * FROM institute_applications WHERE id = $1 FOR UPDATE', [id]);
      if (appRes.rows.length === 0) {
        throw new Error('Institute application not found');
      }
      const app = appRes.rows[0];

      await client.query(`
        UPDATE institute_applications
        SET status = 'changes_requested',
            admin_notes = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $3
      `, [comments.trim(), adminId, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, admin_notes, performed_by
        ) VALUES (
          'institute', $1, 'request_changes', $2, 'changes_requested', $3, $4
        )
      `, [id, app.status, comments.trim(), adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Changes requested from applicant' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // STUDENT ADMISSIONS
  // ---------------------------------------------------------------------------
  async listAdmissions(params: ApprovalsListParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status && params.status !== 'all') {
      conditions.push(`a.status = $${paramIndex++}`);
      values.push(params.status);
    }

    if (params.tenantId) {
      conditions.push(`a.tenant_id = $${paramIndex++}`);
      values.push(params.tenantId);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(a.full_name) LIKE $${paramIndex} OR
        LOWER(a.email) LIKE $${paramIndex} OR
        LOWER(COALESCE(a.phone, '')) LIKE $${paramIndex} OR
        LOWER(a.program) LIKE $${paramIndex} OR
        LOWER(COALESCE(a.application_number, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(t.name, '')) LIKE $${paramIndex}
      )`);
      values.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM admissions a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, values);
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT a.id, a.application_number, a.full_name, a.email, a.phone,
             a.program, a.academic_details, a.documents, a.status,
             a.rejection_reason, a.admin_notes, a.submitted_at, a.reviewed_at,
             a.created_at, a.updated_at,
             t.id AS tenant_id, t.name AS institution_name,
             u.name AS student_user_name,
             r.name AS reviewer_name
      FROM admissions a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      LEFT JOIN users u ON u.id = a.student_id
      LEFT JOIN users r ON r.id = a.reviewed_by
      ${whereClause}
      ORDER BY a.created_at ${orderClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      items: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getAdmission(id: string) {
    const res = await pool.query(`
      SELECT a.*,
             t.name AS institution_name,
             u.name AS student_user_name, u.email AS student_user_email,
             r.name AS reviewer_name, r.email AS reviewer_email
      FROM admissions a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      LEFT JOIN users u ON u.id = a.student_id
      LEFT JOIN users r ON r.id = a.reviewed_by
      WHERE a.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return null;
    }

    const admission = res.rows[0];

    const historyRes = await pool.query(`
      SELECT ah.*, u.name AS performed_by_name, u.email AS performed_by_email
      FROM approval_history ah
      LEFT JOIN users u ON u.id = ah.performed_by
      WHERE ah.entity_type = 'admission' AND ah.entity_id = $1
      ORDER BY ah.created_at DESC
    `, [id]);

    return {
      ...admission,
      history: historyRes.rows,
    };
  },

  async approveAdmission(id: string, adminId: string, note?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const admRes = await client.query('SELECT * FROM admissions WHERE id = $1 FOR UPDATE', [id]);
      if (admRes.rows.length === 0) {
        throw new Error('Admission application not found');
      }
      const adm = admRes.rows[0];

      await client.query(`
        UPDATE admissions
        SET status = 'approved',
            reviewed_by = $1,
            reviewed_at = NOW(),
            admin_notes = COALESCE($2, admin_notes),
            updated_at = NOW()
        WHERE id = $3
      `, [adminId, note || null, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, admin_notes, performed_by
        ) VALUES (
          'admission', $1, 'approve', $2, 'approved', $3, $4
        )
      `, [id, adm.status, note || 'Student admission approved.', adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Student admission approved' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async rejectAdmission(id: string, adminId: string, reason: string, adminNotes?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const admRes = await client.query('SELECT * FROM admissions WHERE id = $1 FOR UPDATE', [id]);
      if (admRes.rows.length === 0) {
        throw new Error('Admission application not found');
      }
      const adm = admRes.rows[0];

      await client.query(`
        UPDATE admissions
        SET status = 'rejected',
            rejection_reason = $1,
            admin_notes = COALESCE($2, admin_notes),
            reviewed_by = $3,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $4
      `, [reason.trim(), adminNotes || null, adminId, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, reason, admin_notes, performed_by
        ) VALUES (
          'admission', $1, 'reject', $2, 'rejected', $3, $4, $5
        )
      `, [id, adm.status, reason.trim(), adminNotes || null, adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Student admission rejected' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async requestAdmissionChanges(id: string, adminId: string, comments: string) {
    if (!comments || !comments.trim()) {
      throw new Error('Comments are required when requesting changes');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const admRes = await client.query('SELECT * FROM admissions WHERE id = $1 FOR UPDATE', [id]);
      if (admRes.rows.length === 0) {
        throw new Error('Admission application not found');
      }
      const adm = admRes.rows[0];

      await client.query(`
        UPDATE admissions
        SET status = 'changes_requested',
            admin_notes = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $3
      `, [comments.trim(), adminId, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, admin_notes, performed_by
        ) VALUES (
          'admission', $1, 'request_changes', $2, 'changes_requested', $3, $4
        )
      `, [id, adm.status, comments.trim(), adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Changes requested from candidate' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // COURSE SUBMISSIONS
  // ---------------------------------------------------------------------------
  async listCourses(params: ApprovalsListParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status && params.status !== 'all') {
      conditions.push(`cs.status = $${paramIndex++}`);
      values.push(params.status);
    }

    if (params.tenantId) {
      conditions.push(`cs.tenant_id = $${paramIndex++}`);
      values.push(params.tenantId);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(cs.title) LIKE $${paramIndex} OR
        LOWER(COALESCE(cs.category, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(cs.submission_number, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(t.name, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(u.name, '')) LIKE $${paramIndex}
      )`);
      values.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM course_submissions cs
      LEFT JOIN tenants t ON t.id = cs.tenant_id
      LEFT JOIN users u ON u.id = cs.instructor_id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, values);
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT cs.id, cs.submission_number, cs.course_id, cs.submission_version,
             cs.title, cs.category, cs.level, cs.description, cs.syllabus_summary,
             cs.documents, cs.status, cs.rejection_reason, cs.review_comments,
             cs.admin_notes, cs.submitted_at, cs.reviewed_at, cs.created_at, cs.updated_at,
             t.id AS tenant_id, t.name AS institution_name,
             u.name AS instructor_name, u.email AS instructor_email,
             r.name AS reviewer_name,
             (SELECT COUNT(*)::int FROM modules m WHERE m.course_id = cs.course_id) AS modules_count,
             (SELECT COUNT(*)::int FROM chapters ch JOIN modules m ON m.id = ch.module_id WHERE m.course_id = cs.course_id) AS chapters_count
      FROM course_submissions cs
      LEFT JOIN tenants t ON t.id = cs.tenant_id
      LEFT JOIN users u ON u.id = cs.instructor_id
      LEFT JOIN users r ON r.id = cs.reviewed_by
      ${whereClause}
      ORDER BY cs.created_at ${orderClause}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      items: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getCourse(id: string) {
    const res = await pool.query(`
      SELECT cs.*,
             t.name AS institution_name,
             u.name AS instructor_name, u.email AS instructor_email,
             r.name AS reviewer_name, r.email AS reviewer_email,
             (SELECT COUNT(*)::int FROM modules m WHERE m.course_id = cs.course_id) AS modules_count,
             (SELECT COUNT(*)::int FROM chapters ch JOIN modules m ON m.id = ch.module_id WHERE m.course_id = cs.course_id) AS chapters_count
      FROM course_submissions cs
      LEFT JOIN tenants t ON t.id = cs.tenant_id
      LEFT JOIN users u ON u.id = cs.instructor_id
      LEFT JOIN users r ON r.id = cs.reviewed_by
      WHERE cs.id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return null;
    }

    const courseSubmission = res.rows[0];

    const historyRes = await pool.query(`
      SELECT ah.*, u.name AS performed_by_name, u.email AS performed_by_email
      FROM approval_history ah
      LEFT JOIN users u ON u.id = ah.performed_by
      WHERE ah.entity_type = 'course' AND ah.entity_id = $1
      ORDER BY ah.created_at DESC
    `, [id]);

    return {
      ...courseSubmission,
      history: historyRes.rows,
    };
  },

  async approveCourse(id: string, adminId: string, note?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const csRes = await client.query('SELECT * FROM course_submissions WHERE id = $1 FOR UPDATE', [id]);
      if (csRes.rows.length === 0) {
        throw new Error('Course submission not found');
      }
      const cs = csRes.rows[0];

      await client.query(`
        UPDATE course_submissions
        SET status = 'approved',
            reviewed_by = $1,
            reviewed_at = NOW(),
            admin_notes = COALESCE($2, admin_notes),
            updated_at = NOW()
        WHERE id = $3
      `, [adminId, note || null, id]);

      // Publish the course in the courses table
      await client.query(`
        UPDATE courses
        SET status = 'published',
            updated_at = NOW()
        WHERE id = $1
      `, [cs.course_id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, admin_notes, performed_by
        ) VALUES (
          'course', $1, 'approve', $2, 'approved', $3, $4
        )
      `, [id, cs.status, note || 'Course submission approved and published to catalog.', adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Course approved and published successfully' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async rejectCourse(id: string, adminId: string, reason: string, adminNotes?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const csRes = await client.query('SELECT * FROM course_submissions WHERE id = $1 FOR UPDATE', [id]);
      if (csRes.rows.length === 0) {
        throw new Error('Course submission not found');
      }
      const cs = csRes.rows[0];

      await client.query(`
        UPDATE course_submissions
        SET status = 'rejected',
            rejection_reason = $1,
            admin_notes = COALESCE($2, admin_notes),
            reviewed_by = $3,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $4
      `, [reason.trim(), adminNotes || null, adminId, id]);

      // Keep course as draft
      await client.query(`
        UPDATE courses
        SET status = 'draft',
            updated_at = NOW()
        WHERE id = $1
      `, [cs.course_id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, reason, admin_notes, performed_by
        ) VALUES (
          'course', $1, 'reject', $2, 'rejected', $3, $4, $5
        )
      `, [id, cs.status, reason.trim(), adminNotes || null, adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Course submission rejected' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async requestCourseChanges(id: string, adminId: string, comments: string) {
    if (!comments || !comments.trim()) {
      throw new Error('Comments are required when requesting changes');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const csRes = await client.query('SELECT * FROM course_submissions WHERE id = $1 FOR UPDATE', [id]);
      if (csRes.rows.length === 0) {
        throw new Error('Course submission not found');
      }
      const cs = csRes.rows[0];

      await client.query(`
        UPDATE course_submissions
        SET status = 'changes_requested',
            review_comments = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = $3
      `, [comments.trim(), adminId, id]);

      await client.query(`
        INSERT INTO approval_history (
          entity_type, entity_id, action, previous_status, new_status, admin_notes, performed_by
        ) VALUES (
          'course', $1, 'request_changes', $2, 'changes_requested', $3, $4
        )
      `, [id, cs.status, comments.trim(), adminId]);

      await client.query('COMMIT');
      return { success: true, message: 'Changes requested from course author' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // GLOBAL AUDIT HISTORY
  // ---------------------------------------------------------------------------
  async getAuditHistory(entityType?: string, entityId?: string) {
    const conditions: string[] = [];
    const values: any[] = [];
    let pIdx = 1;

    if (entityType) {
      conditions.push(`ah.entity_type = $${pIdx++}`);
      values.push(entityType);
    }
    if (entityId) {
      conditions.push(`ah.entity_id = $${pIdx++}`);
      values.push(entityId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await pool.query(`
      SELECT ah.*, u.name AS performed_by_name, u.email AS performed_by_email
      FROM approval_history ah
      LEFT JOIN users u ON u.id = ah.performed_by
      ${whereClause}
      ORDER BY ah.created_at DESC
      LIMIT 100
    `, values);

    return res.rows;
  }
};
