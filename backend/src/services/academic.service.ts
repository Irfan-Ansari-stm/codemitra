import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

// ── Academic Years ──────────────────────────────────────────────
export const academicYearService = {
  async list(tenantId: string) {
    const result = await pool.query(
      'SELECT * FROM academic_years WHERE tenant_id = $1 ORDER BY start_date DESC',
      [tenantId]
    );
    return result.rows;
  },

  async create(
    tenantId: string,
    data: { name: string; startDate: string; endDate: string; isActive?: boolean },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    // If setting active, deactivate others
    if (data.isActive) {
      await pool.query(
        'UPDATE academic_years SET is_active = FALSE WHERE tenant_id = $1',
        [tenantId]
      );
    }

    const result = await pool.query(
      `INSERT INTO academic_years (tenant_id, name, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, data.name, data.startDate, data.endDate, data.isActive || false]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'academic_year.create',
      resourceType: 'academic_year',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM academic_years WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Academic year not found');
    }

    if (data.isActive) {
      await pool.query(
        'UPDATE academic_years SET is_active = FALSE WHERE tenant_id = $1',
        [tenantId]
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      startDate: 'start_date',
      endDate: 'end_date',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id, tenantId);
    const result = await pool.query(
      `UPDATE academic_years SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
       RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'academic_year.update',
      resourceType: 'academic_year',
      resourceId: id,
      oldData: existing.rows[0],
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string, userId: string) {
    const result = await pool.query(
      'DELETE FROM academic_years WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Academic year not found');
    }
    return result.rows[0];
  },
};

// ── Semesters ───────────────────────────────────────────────────
export const semesterService = {
  async list(tenantId: string, academicYearId?: string) {
    const result = await pool.query(
      `SELECT s.*, ay.name as academic_year_name
       FROM semesters s
       LEFT JOIN academic_years ay ON ay.id = s.academic_year_id
       WHERE s.tenant_id = $1 AND ($2::uuid IS NULL OR s.academic_year_id = $2)
       ORDER BY s.start_date DESC`,
      [tenantId, academicYearId || null]
    );
    return result.rows;
  },

  async create(
    tenantId: string,
    data: {
      name: string;
      startDate: string;
      endDate: string;
      academicYearId?: string;
      isActive?: boolean;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    if (data.isActive) {
      await pool.query(
        'UPDATE semesters SET is_active = FALSE WHERE tenant_id = $1',
        [tenantId]
      );
    }

    const result = await pool.query(
      `INSERT INTO semesters (tenant_id, academic_year_id, name, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, data.academicYearId || null, data.name, data.startDate, data.endDate, data.isActive || false]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'semester.create',
      resourceType: 'semester',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    tenantId: string,
    data: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM semesters WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Semester not found');
    }

    if (data.isActive) {
      await pool.query(
        'UPDATE semesters SET is_active = FALSE WHERE tenant_id = $1',
        [tenantId]
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      startDate: 'start_date',
      endDate: 'end_date',
      academicYearId: 'academic_year_id',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id, tenantId);
    const result = await pool.query(
      `UPDATE semesters SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
       RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'semester.update',
      resourceType: 'semester',
      resourceId: id,
      oldData: existing.rows[0],
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string) {
    const result = await pool.query(
      'DELETE FROM semesters WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Semester not found');
    }
    return result.rows[0];
  },
};

// ── Batches ─────────────────────────────────────────────────────
export const batchService = {
  async list(tenantId: string) {
    const result = await pool.query(
      `SELECT b.*, ay.name as academic_year_name, s.name as semester_name,
              d.name as department_name
       FROM batches b
       LEFT JOIN academic_years ay ON ay.id = b.academic_year_id
       LEFT JOIN semesters s ON s.id = b.semester_id
       LEFT JOIN institute_departments d ON d.id = b.department_id
       WHERE b.tenant_id = $1
       ORDER BY b.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  },

  async create(
    tenantId: string,
    data: {
      name: string;
      code?: string;
      academicYearId?: string;
      semesterId?: string;
      departmentId?: string;
      description?: string;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO batches (tenant_id, name, code, academic_year_id, semester_id, department_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.code || null,
        data.academicYearId || null,
        data.semesterId || null,
        data.departmentId || null,
        data.description || null,
      ]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'batch.create',
      resourceType: 'batch',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    tenantId: string,
    data: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM batches WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Batch not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      code: 'code',
      academicYearId: 'academic_year_id',
      semesterId: 'semester_id',
      departmentId: 'department_id',
      description: 'description',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id, tenantId);
    const result = await pool.query(
      `UPDATE batches SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
       RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'batch.update',
      resourceType: 'batch',
      resourceId: id,
      oldData: existing.rows[0],
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string) {
    const result = await pool.query(
      'DELETE FROM batches WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Batch not found');
    }
    return result.rows[0];
  },

  async enrollStudent(
    tenantId: string,
    batchId: string,
    studentId: string,
    userId: string
  ) {
    const result = await pool.query(
      `INSERT INTO student_batches (student_id, batch_id, tenant_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, batch_id) DO NOTHING
       RETURNING *`,
      [studentId, batchId, tenantId]
    );
    return result.rows[0];
  },

  async getStudents(tenantId: string, batchId: string) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active
       FROM student_batches sb
       JOIN users u ON u.id = sb.student_id
       WHERE sb.batch_id = $1 AND sb.tenant_id = $2
       ORDER BY u.name`,
      [batchId, tenantId]
    );
    return result.rows;
  },
};

// ── Classes ─────────────────────────────────────────────────────
export const classService = {
  async list(tenantId: string, batchId?: string) {
    const result = await pool.query(
      `SELECT c.*, b.name as batch_name, co.title as course_name,
              u.name as instructor_name
       FROM classes c
       LEFT JOIN batches b ON b.id = c.batch_id
       LEFT JOIN courses co ON co.id = c.course_id
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE c.tenant_id = $1 AND ($2::uuid IS NULL OR c.batch_id = $2)
       ORDER BY c.created_at DESC`,
      [tenantId, batchId || null]
    );
    return result.rows;
  },

  async create(
    tenantId: string,
    data: {
      name: string;
      batchId?: string;
      courseId?: string;
      instructorId?: string;
      schedule?: any;
      room?: string;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO classes (tenant_id, batch_id, course_id, name, instructor_id, schedule, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tenantId,
        data.batchId || null,
        data.courseId || null,
        data.name,
        data.instructorId || null,
        JSON.stringify(data.schedule || []),
        data.room || null,
      ]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'class.create',
      resourceType: 'class',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    tenantId: string,
    data: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Class not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      batchId: 'batch_id',
      courseId: 'course_id',
      instructorId: 'instructor_id',
      schedule: 'schedule',
      room: 'room',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(fieldMap[key] === 'schedule' ? JSON.stringify(value) : value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id, tenantId);
    const result = await pool.query(
      `UPDATE classes SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
       RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'class.update',
      resourceType: 'class',
      resourceId: id,
      oldData: existing.rows[0],
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string) {
    const result = await pool.query(
      'DELETE FROM classes WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Class not found');
    }
    return result.rows[0];
  },
};

// ── Attendance ──────────────────────────────────────────────────
export const attendanceService = {
  async list(
    tenantId: string,
    studentId?: string,
    classId?: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];

    if (studentId) {
      params.push(studentId);
      conditions.push(`student_id = $${params.length}`);
    }
    if (classId) {
      params.push(classId);
      conditions.push(`class_id = $${params.length}`);
    }
    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`session_date >= $${params.length}`);
    }
    if (dateTo) {
      params.push(dateTo);
      conditions.push(`session_date <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT a.*, u.name as student_name, c.name as class_name
       FROM attendance a
       JOIN users u ON u.id = a.student_id
       LEFT JOIN classes c ON c.id = a.class_id
       ${where}
       ORDER BY a.session_date DESC, a.created_at DESC`,
      params
    );
    return result.rows;
  },

  async record(
    tenantId: string,
    data: {
      studentId: string;
      classId: string;
      courseId?: string;
      sessionDate: string;
      status: string;
      notes?: string;
    },
    recordedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO attendance
         (tenant_id, student_id, class_id, course_id, session_date, status, recorded_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (tenant_id, student_id, class_id, session_date)
       DO UPDATE SET status = $6, notes = $8, recorded_by = $7
       RETURNING *`,
      [
        tenantId,
        data.studentId,
        data.classId,
        data.courseId || null,
        data.sessionDate,
        data.status,
        recordedBy,
        data.notes || null,
      ]
    );

    await writeAuditLog({
      userId: recordedBy,
      tenantId,
      action: 'attendance.record',
      resourceType: 'attendance',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async recordBulk(
    tenantId: string,
    records: Array<{
      studentId: string;
      classId: string;
      courseId?: string;
      sessionDate: string;
      status: string;
    }>,
    recordedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const record of records) {
        await client.query(
          `INSERT INTO attendance
             (tenant_id, student_id, class_id, course_id, session_date, status, recorded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (tenant_id, student_id, class_id, session_date)
           DO UPDATE SET status = $6, recorded_by = $7`,
          [
            tenantId,
            record.studentId,
            record.classId,
            record.courseId || null,
            record.sessionDate,
            record.status,
            recordedBy,
          ]
        );
      }

      await writeAuditLog({
        userId: recordedBy,
        tenantId,
        action: 'attendance.record_bulk',
        resourceType: 'attendance',
        newData: { count: records.length },
        ipAddress,
        requestId,
      });

      await client.query('COMMIT');
      return { count: records.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getStudentSummary(tenantId: string, studentId: string) {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int as total_sessions,
         COUNT(*) FILTER (WHERE status = 'present')::int as present,
         COUNT(*) FILTER (WHERE status = 'absent')::int as absent,
         COUNT(*) FILTER (WHERE status = 'late')::int as late,
         COUNT(*) FILTER (WHERE status = 'excused')::int as excused
       FROM attendance
       WHERE tenant_id = $1 AND student_id = $2`,
      [tenantId, studentId]
    );
    const summary = result.rows[0];
    const attendanceRate =
      summary.total_sessions > 0
        ? Math.round((summary.present / summary.total_sessions) * 100)
        : 0;
    return { ...summary, attendance_rate: attendanceRate };
  },
};

// ── Grades ──────────────────────────────────────────────────────
export const gradeService = {
  async list(
    tenantId: string,
    studentId?: string,
    courseId?: string
  ) {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];

    if (studentId) {
      params.push(studentId);
      conditions.push(`student_id = $${params.length}`);
    }
    if (courseId) {
      params.push(courseId);
      conditions.push(`course_id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT g.*, u.name as student_name, c.title as course_name
       FROM grades g
       JOIN users u ON u.id = g.student_id
       LEFT JOIN courses c ON c.id = g.course_id
       ${where}
       ORDER BY g.created_at DESC`,
      params
    );
    return result.rows;
  },

  async record(
    tenantId: string,
    data: {
      studentId: string;
      courseId: string;
      assessmentId?: string;
      assessmentType?: string;
      score: number;
      maxScore?: number;
      feedback?: string;
    },
    recordedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const maxScore = data.maxScore || 100;
    const percentage = (data.score / maxScore) * 100;
    const gradeLetter =
      percentage >= 90 ? 'A' :
      percentage >= 80 ? 'B' :
      percentage >= 70 ? 'C' :
      percentage >= 60 ? 'D' : 'F';

    const result = await pool.query(
      `INSERT INTO grades
         (tenant_id, student_id, course_id, assessment_id, assessment_type,
          score, max_score, grade_letter, feedback, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        tenantId,
        data.studentId,
        data.courseId,
        data.assessmentId || null,
        data.assessmentType || 'assignment',
        data.score,
        maxScore,
        gradeLetter,
        data.feedback || null,
        recordedBy,
      ]
    );

    await writeAuditLog({
      userId: recordedBy,
      tenantId,
      action: 'grade.record',
      resourceType: 'grade',
      resourceId: result.rows[0].id,
      newData: { ...data, gradeLetter },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    tenantId: string,
    data: { score?: number; maxScore?: number; feedback?: string; gradeLetter?: string },
    recordedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM grades WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (!existing.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Grade not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      score: 'score',
      maxScore: 'max_score',
      feedback: 'feedback',
      gradeLetter: 'grade_letter',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id, tenantId);
    const result = await pool.query(
      `UPDATE grades SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
       RETURNING *`,
      values
    );

    await writeAuditLog({
      userId: recordedBy,
      tenantId,
      action: 'grade.update',
      resourceType: 'grade',
      resourceId: id,
      oldData: existing.rows[0],
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string) {
    const result = await pool.query(
      'DELETE FROM grades WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Grade not found');
    }
    return result.rows[0];
  },

  async getStudentTranscript(tenantId: string, studentId: string) {
    const result = await pool.query(
      `SELECT
         c.id as course_id,
         c.title as course_title,
         COUNT(g.id)::int as assessment_count,
         AVG(g.score)::numeric(5,2) as average_score,
         MAX(g.max_score)::numeric(7,2) as max_score,
         STRING_AGG(DISTINCT g.grade_letter, ', ') as grade_letters
       FROM grades g
       JOIN courses c ON c.id = g.course_id
       WHERE g.tenant_id = $1 AND g.student_id = $2
       GROUP BY c.id, c.title
       ORDER BY c.title`,
      [tenantId, studentId]
    );
    return result.rows;
  },
};

// ── Timetable ───────────────────────────────────────────────────
export const timetableService = {
  async list(tenantId: string, classId?: string) {
    const result = await pool.query(
      `SELECT t.*, c.name as class_name, u.name as instructor_name
       FROM timetables t
       LEFT JOIN classes c ON c.id = t.class_id
       LEFT JOIN users u ON u.id = t.instructor_id
       WHERE t.tenant_id = $1 AND ($2::uuid IS NULL OR t.class_id = $2)
       ORDER BY t.day_of_week, t.start_time`,
      [tenantId, classId || null]
    );
    return result.rows;
  },

  async create(
    tenantId: string,
    data: {
      classId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      subject?: string;
      instructorId?: string;
      room?: string;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO timetables
         (tenant_id, class_id, day_of_week, start_time, end_time, subject, instructor_id, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId,
        data.classId,
        data.dayOfWeek,
        data.startTime,
        data.endTime,
        data.subject || null,
        data.instructorId || null,
        data.room || null,
      ]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'timetable.create',
      resourceType: 'timetable',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string) {
    const result = await pool.query(
      'DELETE FROM timetables WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Timetable entry not found');
    }
    return result.rows[0];
  },
};
