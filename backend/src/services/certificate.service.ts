import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';
import crypto from 'crypto';

export interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  tenant_id: string | null;
  course_id: string | null;
  title: string;
  description: string | null;
  recipient_name: string;
  issued_by: string | null;
  issue_date: string;
  completion_date: string | null;
  score: number | null;
  credential_url: string | null;
  verification_code: string;
  metadata: any;
  issued_by_user_id: string | null;
  created_at: string;
}

export const certificateService = {
  async list(
    userId: string,
    role: string,
    tenantId: string | null,
    courseId?: string
  ) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (role === 'super_admin') {
      // sees all
    } else if (role === 'institution_admin') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    } else {
      params.push(userId);
      conditions.push(`user_id = $${params.length}`);
    }

    if (courseId) {
      params.push(courseId);
      conditions.push(`course_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT c.*, u.name as recipient_name, co.title as course_title
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN courses co ON co.id = c.course_id
       ${where}
       ORDER BY c.issue_date DESC`,
      params
    );
    return result.rows;
  },

  async getById(
    id: string,
    userId: string,
    role: string,
    tenantId: string | null
  ) {
    const result = await pool.query(
      `SELECT c.*, u.name as recipient_name, u.email as recipient_email,
              co.title as course_title, t.name as institute_name
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN courses co ON co.id = c.course_id
       LEFT JOIN tenants t ON t.id = c.tenant_id
       WHERE c.id = $1`,
      [id]
    );
    const certificate = result.rows[0];
    if (!certificate) {
      throw new AppError(404, 'NOT_FOUND', 'Certificate not found');
    }

    // Authorization
    if (role !== 'super_admin') {
      if (role === 'institution_admin' && certificate.tenant_id !== tenantId) {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to view this certificate');
      }
      if (role !== 'institution_admin' && certificate.user_id !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to view this certificate');
      }
    }

    return certificate;
  },

  async issue(
    data: {
      userId: string;
      tenantId?: string;
      courseId?: string;
      title: string;
      description?: string;
      recipientName: string;
      issuedBy?: string;
      completionDate?: string;
      score?: number;
      credentialUrl?: string;
      metadata?: any;
    },
    issuedByUserId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const certificateNumber = `CERT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const verificationCode = crypto.randomBytes(16).toString('hex');

    const result = await pool.query(
      `INSERT INTO certificates
         (certificate_number, user_id, tenant_id, course_id, title, description,
          recipient_name, issued_by, issue_date, completion_date, score,
          credential_url, verification_code, metadata, issued_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        certificateNumber,
        data.userId,
        data.tenantId || null,
        data.courseId || null,
        data.title,
        data.description || null,
        data.recipientName,
        data.issuedBy || null,
        data.completionDate || null,
        data.score || null,
        data.credentialUrl || null,
        verificationCode,
        JSON.stringify(data.metadata || {}),
        issuedByUserId,
      ]
    );

    await writeAuditLog({
      userId: issuedByUserId,
      tenantId: data.tenantId || null,
      action: 'certificate.issue',
      resourceType: 'certificate',
      resourceId: result.rows[0].id,
      newData: { certificateNumber, title: data.title, recipientName: data.recipientName },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async verify(verificationCode: string) {
    const result = await pool.query(
      `SELECT c.*, u.name as recipient_name, co.title as course_title,
              t.name as institute_name
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN courses co ON co.id = c.course_id
       LEFT JOIN tenants t ON t.id = c.tenant_id
       WHERE c.verification_code = $1`,
      [verificationCode]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Certificate not found');
    }
    return result.rows[0];
  },

  async revoke(
    id: string,
    userId: string,
    role: string,
    tenantId: string | null,
    ipAddress?: string,
    requestId?: string
  ) {
    const certificate = await this.getById(id, userId, role, tenantId);

    if (role !== 'super_admin' && role !== 'institution_admin') {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to revoke certificates');
    }

    await pool.query('DELETE FROM certificates WHERE id = $1', [id]);

    await writeAuditLog({
      userId,
      tenantId,
      action: 'certificate.revoke',
      resourceType: 'certificate',
      resourceId: id,
      oldData: { certificateNumber: certificate.certificate_number },
      ipAddress,
      requestId,
    });

    return { message: 'Certificate revoked' };
  },

  async getCourseCompletion(
    tenantId: string,
    studentId: string,
    courseId: string
  ) {
    // Calculate completion based on progress, assignments, quizzes
    const progress = await pool.query(
      `SELECT
         COUNT(*)::int as total_chapters,
         COUNT(*) FILTER (WHERE up.is_completed)::int as completed_chapters
       FROM chapters ch
       LEFT JOIN user_progress up ON up.chapter_id = ch.id AND up.user_id = $1
       WHERE ch.tenant_id = $2 AND ch.is_deleted = FALSE
         AND ch.module_id IN (
           SELECT m.id FROM modules m WHERE m.course_id = $3 AND m.is_deleted = FALSE
         )`,
      [studentId, tenantId, courseId]
    );

    const assignments = await pool.query(
      `SELECT
         COUNT(*)::int as total,
         COUNT(*) FILTER (WHERE status IN ('submitted', 'late_submitted', 'graded'))::int as submitted
       FROM assignment_submissions
       WHERE tenant_id = $1 AND student_id = $2
         AND assignment_id IN (
           SELECT id FROM assignments WHERE course_id = $3 AND tenant_id = $1 AND is_deleted = FALSE
         )`,
      [tenantId, studentId, courseId]
    );

    const quizzes = await pool.query(
      `SELECT
         COUNT(*)::int as total,
         COUNT(*) FILTER (WHERE status = 'completed')::int as completed
       FROM quiz_attempts
       WHERE tenant_id = $1 AND student_id = $2
         AND quiz_id IN (
           SELECT id FROM quizzes WHERE tenant_id = $1 AND is_deleted = FALSE
             AND chapter_id IN (
               SELECT ch.id FROM chapters ch
               JOIN modules m ON m.id = ch.module_id
               WHERE m.course_id = $3 AND m.is_deleted = FALSE
             )
         )`,
      [tenantId, studentId, courseId]
    );

    const totalChapters = parseInt(progress.rows[0].total_chapters) || 0;
    const completedChapters = parseInt(progress.rows[0].completed_chapters) || 0;
    const totalAssignments = parseInt(assignments.rows[0].total) || 0;
    const submittedAssignments = parseInt(assignments.rows[0].submitted) || 0;
    const totalQuizzes = parseInt(quizzes.rows[0].total) || 0;
    const completedQuizzes = parseInt(quizzes.rows[0].completed) || 0;

    const chapterProgress = totalChapters > 0 ? completedChapters / totalChapters : 1;
    const assignmentProgress = totalAssignments > 0 ? submittedAssignments / totalAssignments : 1;
    const quizProgress = totalQuizzes > 0 ? completedQuizzes / totalQuizzes : 1;

    const overallProgress = Math.round(
      (chapterProgress * 0.5 + assignmentProgress * 0.3 + quizProgress * 0.2) * 100
    );

    return {
      total_chapters: totalChapters,
      completed_chapters: completedChapters,
      total_assignments: totalAssignments,
      submitted_assignments: submittedAssignments,
      total_quizzes: totalQuizzes,
      completed_quizzes: completedQuizzes,
      overall_progress: overallProgress,
      is_eligible: overallProgress >= 80,
    };
  },
};
