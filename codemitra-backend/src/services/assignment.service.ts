import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export const assignmentService = {
  async list(tenantId: string, status?: string) {
    const params: any[] = [tenantId];
    let filter = '';
    if (status) {
      params.push(status);
      filter = `AND a.status = $${params.length}`;
    }
    const result = await pool.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.status, a.total_marks,
              a.late_submission_allowed, a.created_at,
              u.name AS created_by_name,
              COUNT(DISTINCT ap.problem_id) AS problem_count
       FROM assignments a
       JOIN users u ON u.id = a.created_by
       LEFT JOIN assignment_problems ap ON ap.assignment_id = a.id
       WHERE a.tenant_id = $1 AND NOT a.is_deleted ${filter}
       GROUP BY a.id, u.name ORDER BY a.created_at DESC`,
      params
    );
    return result.rows;
  },

  async getById(id: string, tenantId: string) {
    const result = await pool.query(
      `SELECT a.*, u.name AS created_by_name FROM assignments a
       JOIN users u ON u.id = a.created_by
       WHERE a.id = $1 AND a.tenant_id = $2 AND NOT a.is_deleted LIMIT 1`,
      [id, tenantId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Assignment not found');

    const problems = await pool.query(
      `SELECT ap.*, p.title, p.difficulty, p.slug FROM assignment_problems ap
       JOIN problems p ON p.id = ap.problem_id
       WHERE ap.assignment_id = $1 ORDER BY ap.order_index`,
      [id]
    );
    return { ...result.rows[0], problems: problems.rows };
  },

  async create(data: {
    tenantId: string;
    createdBy: string;
    title: string;
    description?: string;
    instructions?: string;
    dueDate?: string;
    lateSubmissionAllowed?: boolean;
    latePenaltyPercent?: number;
    totalMarks?: number;
    courseId?: string;
    chapterId?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO assignments
         (tenant_id, created_by, title, description, instructions, due_date,
          late_submission_allowed, late_penalty_percent, total_marks, course_id, chapter_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        data.tenantId, data.createdBy, data.title,
        data.description || null, data.instructions || null,
        data.dueDate || null, data.lateSubmissionAllowed ?? false,
        data.latePenaltyPercent ?? 0, data.totalMarks ?? 100,
        data.courseId || null, data.chapterId || null,
      ]
    );
    return result.rows[0];
  },

  async addProblem(assignmentId: string, problemId: string, marks: number, orderIndex: number) {
    const result = await pool.query(
      `INSERT INTO assignment_problems (assignment_id, problem_id, marks, order_index)
       VALUES ($1, $2, $3, $4) ON CONFLICT (assignment_id, problem_id)
       DO UPDATE SET marks = $3, order_index = $4 RETURNING *`,
      [assignmentId, problemId, marks, orderIndex]
    );
    return result.rows[0];
  },

  async getStudentSubmission(assignmentId: string, studentId: string) {
    const result = await pool.query(
      `SELECT * FROM assignment_submissions
       WHERE assignment_id = $1 AND student_id = $2 LIMIT 1`,
      [assignmentId, studentId]
    );
    return result.rows[0] || null;
  },

  async submitAssignment(assignmentId: string, studentId: string, tenantId: string) {
    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, tenant_id, status, submitted_at)
       VALUES ($1, $2, $3, 'submitted', NOW())
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       RETURNING *`,
      [assignmentId, studentId, tenantId]
    );
    return result.rows[0];
  },
};
