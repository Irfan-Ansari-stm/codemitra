import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export const analyticsService = {
  async getOverview(tenantId: string) {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT u.id) FILTER (WHERE u.role='institution_student' AND u.is_active AND NOT u.is_deleted) AS total_students,
         COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '7 days') AS active_7d,
         COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= CURRENT_DATE) AS active_today,
         COUNT(DISTINCT c.id) FILTER (WHERE c.status='published' AND NOT c.is_deleted) AS published_courses,
         COUNT(DISTINCT p.id) FILTER (WHERE NOT p.is_deleted) AS total_problems,
         COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') AS submissions_7d,
         COUNT(s.id) FILTER (WHERE s.verdict='accepted' AND s.created_at >= NOW()-INTERVAL '7 days') AS accepted_7d,
         COUNT(DISTINCT a.id) FILTER (WHERE a.status='published' AND a.due_date > NOW() AND NOT a.is_deleted) AS active_assignments
       FROM tenants t
       LEFT JOIN users u       ON u.tenant_id = t.id
       LEFT JOIN courses c     ON c.tenant_id = t.id
       LEFT JOIN problems p    ON p.tenant_id = t.id
       LEFT JOIN submissions s ON s.tenant_id = t.id
       LEFT JOIN assignments a ON a.tenant_id = t.id
       WHERE t.id = $1`,
      [tenantId]
    );
    const row = result.rows[0];
    return { ...row, totalStudents: Number(row.total_students), active7d: Number(row.active_7d),
      submissions7d: Number(row.submissions_7d), accepted7d: Number(row.accepted_7d),
      publishedCourses: Number(row.published_courses), totalProblems: Number(row.total_problems),
      activeAssignments: Number(row.active_assignments) };
  },

  async getSubmissionHeatmap(tenantId: string, days = 90) {
    const result = await pool.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE verdict = 'accepted') AS accepted
       FROM submissions
       WHERE tenant_id = $1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [tenantId, Math.min(days, 365)]
    );
    return result.rows;
  },

  async getLeaderboard(tenantId: string, limit = 20) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar_url,
              us.total_problems_solved, us.easy_solved, us.medium_solved, us.hard_solved,
              us.total_score, us.current_streak_days,
              RANK() OVER (ORDER BY us.total_score DESC) AS rank
       FROM user_stats us JOIN users u ON u.id = us.user_id
       WHERE us.tenant_id = $1 AND u.is_active AND NOT u.is_deleted
         AND u.role = 'institution_student'
       ORDER BY rank LIMIT $2`,
      [tenantId, limit]
    );
    return result.rows;
  },

  async getStudentProgress(tenantId: string, studentId: string) {
    const result = await pool.query(
      `SELECT up.*, ch.title AS chapter_title, m.title AS module_title, c.title AS course_title
       FROM user_progress up
       JOIN chapters ch ON ch.id = up.chapter_id
       JOIN modules m ON m.id = ch.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE up.tenant_id = $1 AND up.user_id = $2
       ORDER BY up.last_accessed_at DESC NULLS LAST`,
      [tenantId, studentId]
    );
    return result.rows;
  },

  async getInstitutionReport(tenantId: string) {
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant ID required');
    const [overview, heatmap, leaderboard] = await Promise.all([
      analyticsService.getOverview(tenantId),
      analyticsService.getSubmissionHeatmap(tenantId, 30),
      analyticsService.getLeaderboard(tenantId, 10),
    ]);
    return { overview, heatmap, leaderboard };
  },

  async getCourseCompletion(tenantId: string, courseId: string) {
    const result = await pool.query(
      `SELECT c.id AS "courseId", c.title AS "courseTitle",
              COUNT(DISTINCT u.id)::int AS "totalStudents",
              COUNT(DISTINCT up.user_id) FILTER (WHERE up.is_completed)::int AS "completedStudents",
              COALESCE(ROUND(AVG(up.completion_percent), 1), 0) AS "averageCompletionPercent"
       FROM courses c
       LEFT JOIN users u ON u.tenant_id=c.tenant_id AND u.role='institution_student' AND u.is_active AND NOT u.is_deleted
       LEFT JOIN modules m ON m.course_id=c.id
       LEFT JOIN chapters cch ON cch.module_id=m.id
       LEFT JOIN user_progress up ON up.chapter_id=cch.id AND up.user_id=u.id
       WHERE c.id=$1 AND c.tenant_id=$2 AND NOT c.is_deleted
       GROUP BY c.id`, [courseId, tenantId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Course not found');
    return result.rows[0];
  },

  async getProblemStatistics(problemId: string, tenantId?: string) {
    const result = await pool.query(
      `SELECT p.id AS "problemId", p.title, p.difficulty,
              p.total_submissions AS "totalSubmissions", p.accepted_submissions AS "acceptedSubmissions",
              CASE WHEN p.total_submissions=0 THEN 0 ELSE ROUND(p.accepted_submissions::numeric/p.total_submissions*100,1) END AS "acceptanceRate",
              COUNT(DISTINCT s.user_id)::int AS "uniqueSolvers"
       FROM problems p LEFT JOIN submissions s ON s.problem_id=p.id AND s.verdict='accepted'
       WHERE p.id=$1 AND NOT p.is_deleted AND ($2::uuid IS NULL OR p.tenant_id=$2 OR p.scope='public')
       GROUP BY p.id`, [problemId, tenantId || null]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Problem not found');
    return result.rows[0];
  },

  async getLanguageActivity(tenantId: string, days = 30) {
    const result = await pool.query(
      `SELECT language_id AS "languageId", COUNT(*)::int AS submissions,
              COUNT(*) FILTER (WHERE verdict='accepted')::int AS accepted
       FROM submissions WHERE tenant_id=$1 AND created_at >= NOW() - ($2 || ' days')::interval
       GROUP BY language_id ORDER BY submissions DESC`, [tenantId, Math.min(days, 365)]
    );
    return result.rows;
  },

  async getDifficultyDistribution(tenantId: string) {
    const result = await pool.query(
      `SELECT p.difficulty, COUNT(DISTINCT p.id)::int AS problems,
              COUNT(s.id)::int AS submissions,
              COUNT(s.id) FILTER (WHERE s.verdict='accepted')::int AS accepted
       FROM problems p LEFT JOIN submissions s ON s.problem_id=p.id
       WHERE NOT p.is_deleted AND (p.tenant_id=$1 OR p.scope='public')
       GROUP BY p.difficulty ORDER BY CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`, [tenantId]
    );
    return result.rows;
  },

  async getPlatformOverview() {
    const result = await pool.query(
      `SELECT (SELECT COUNT(*)::int FROM tenants WHERE NOT is_deleted) AS "totalTenants",
              (SELECT COUNT(*)::int FROM users WHERE NOT is_deleted) AS "totalUsers",
              (SELECT COUNT(*)::int FROM problems WHERE NOT is_deleted) AS "totalProblems",
              (SELECT COUNT(*)::int FROM submissions) AS "totalSubmissions",
              (SELECT COUNT(*)::int FROM submissions WHERE verdict='accepted') AS "acceptedSubmissions",
              (SELECT COUNT(*)::int FROM courses WHERE NOT is_deleted) AS "totalCourses"`
    );
    return result.rows[0];
  },
};
