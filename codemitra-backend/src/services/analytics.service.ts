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
    return result.rows[0];
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
};
