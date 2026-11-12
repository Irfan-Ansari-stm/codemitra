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
              (SELECT COUNT(*)::int FROM tenants WHERE is_active = TRUE AND NOT is_deleted) AS "activeTenants",
              (SELECT COUNT(*)::int FROM institute_applications WHERE status = 'pending') AS "pendingTenants",
              (SELECT COUNT(*)::int FROM users WHERE NOT is_deleted) AS "totalUsers",
              (SELECT COUNT(*)::int FROM users WHERE role='institution_student' AND NOT is_deleted) AS "totalStudents",
              (SELECT COUNT(*)::int FROM users WHERE role='general_student' AND NOT is_deleted) AS "totalGeneralUsers",
              (SELECT COUNT(*)::int FROM users WHERE role='institution_admin' AND NOT is_deleted) AS "totalAdmins",
              (SELECT COUNT(*)::int FROM users WHERE role='super_admin' AND NOT is_deleted) AS "totalSuperAdmins",
              (SELECT COUNT(*)::int FROM users WHERE last_login_at >= NOW() - INTERVAL '7 days' AND NOT is_deleted) AS "activeUsers7d",
              (SELECT COUNT(*)::int FROM users WHERE last_login_at >= CURRENT_DATE AND NOT is_deleted) AS "activeUsersToday",
              (SELECT COUNT(*)::int FROM problems WHERE NOT is_deleted) AS "totalProblems",
              (SELECT COUNT(*)::int FROM submissions) AS "totalSubmissions",
              (SELECT COUNT(*)::int FROM submissions WHERE created_at >= NOW() - INTERVAL '7 days') AS "submissions7d",
              (SELECT COUNT(*)::int FROM submissions WHERE verdict='accepted') AS "acceptedSubmissions",
              (SELECT COUNT(*)::int FROM courses WHERE NOT is_deleted) AS "totalCourses",
              (SELECT COUNT(*)::int FROM courses WHERE status='published' AND NOT is_deleted) AS "publishedCourses",
              (SELECT COUNT(*)::int FROM assignments WHERE NOT is_deleted) AS "totalAssignments",
              (SELECT COUNT(*)::int FROM quizzes WHERE NOT is_deleted) AS "totalQuizzes",
              (SELECT COUNT(*)::int FROM assignment_submissions) AS "assignmentSubmissions",
              (SELECT COUNT(*)::int FROM quiz_attempts) AS "quizAttempts",
              (SELECT COUNT(*)::int FROM user_progress) AS "progressRecords",
              (SELECT COUNT(*)::int FROM admissions WHERE status = 'pending') AS "pendingAdmissions",
              (SELECT COUNT(*)::int FROM support_tickets WHERE status IN ('open', 'in_progress')) AS "openTickets"`
    ).catch(async () => {
      // Fallback query if optional tables are not present yet
      return pool.query(
        `SELECT (SELECT COUNT(*)::int FROM tenants WHERE NOT is_deleted) AS "totalTenants",
                (SELECT COUNT(*)::int FROM tenants WHERE is_active = TRUE AND NOT is_deleted) AS "activeTenants",
                0 AS "pendingTenants",
                (SELECT COUNT(*)::int FROM users WHERE NOT is_deleted) AS "totalUsers",
                (SELECT COUNT(*)::int FROM users WHERE role='institution_student' AND NOT is_deleted) AS "totalStudents",
                (SELECT COUNT(*)::int FROM users WHERE role='general_student' AND NOT is_deleted) AS "totalGeneralUsers",
                (SELECT COUNT(*)::int FROM users WHERE role='institution_admin' AND NOT is_deleted) AS "totalAdmins",
                (SELECT COUNT(*)::int FROM users WHERE role='super_admin' AND NOT is_deleted) AS "totalSuperAdmins",
                (SELECT COUNT(*)::int FROM users WHERE last_login_at >= NOW() - INTERVAL '7 days' AND NOT is_deleted) AS "activeUsers7d",
                (SELECT COUNT(*)::int FROM users WHERE last_login_at >= CURRENT_DATE AND NOT is_deleted) AS "activeUsersToday",
                (SELECT COUNT(*)::int FROM problems WHERE NOT is_deleted) AS "totalProblems",
                (SELECT COUNT(*)::int FROM submissions) AS "totalSubmissions",
                (SELECT COUNT(*)::int FROM submissions WHERE created_at >= NOW() - INTERVAL '7 days') AS "submissions7d",
                (SELECT COUNT(*)::int FROM submissions WHERE verdict='accepted') AS "acceptedSubmissions",
                (SELECT COUNT(*)::int FROM courses WHERE NOT is_deleted) AS "totalCourses",
                (SELECT COUNT(*)::int FROM courses WHERE status='published' AND NOT is_deleted) AS "publishedCourses",
                (SELECT COUNT(*)::int FROM assignments WHERE NOT is_deleted) AS "totalAssignments",
                (SELECT COUNT(*)::int FROM quizzes WHERE NOT is_deleted) AS "totalQuizzes",
                (SELECT COUNT(*)::int FROM assignment_submissions) AS "assignmentSubmissions",
                (SELECT COUNT(*)::int FROM quiz_attempts) AS "quizAttempts",
                (SELECT COUNT(*)::int FROM user_progress) AS "progressRecords",
                0 AS "pendingAdmissions",
                0 AS "openTickets"`
      );
    });

    const [institutions, recentActivity, monthlyGrowth] = await Promise.all([
      pool.query(
        `SELECT t.id, t.name, t.slug, t.plan, t.is_active AS "isActive", t.created_at AS "createdAt",
                COUNT(DISTINCT u.id) FILTER (WHERE u.role='institution_student' AND u.is_active AND NOT u.is_deleted)::int AS "students",
                COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '7 days' AND NOT u.is_deleted)::int AS "activeUsers7d",
                COUNT(DISTINCT c.id) FILTER (WHERE NOT c.is_deleted)::int AS "courses",
                COUNT(DISTINCT p.id) FILTER (WHERE NOT p.is_deleted)::int AS "problems",
                COUNT(DISTINCT s.id)::int AS "submissions",
                MAX(s.created_at) AS "lastSubmissionAt"
         FROM tenants t
         LEFT JOIN users u ON u.tenant_id=t.id
         LEFT JOIN courses c ON c.tenant_id=t.id
         LEFT JOIN problems p ON p.tenant_id=t.id
         LEFT JOIN submissions s ON s.tenant_id=t.id
         WHERE NOT t.is_deleted
         GROUP BY t.id ORDER BY MAX(s.created_at) DESC NULLS LAST, t.name ASC LIMIT 50`
      ),
      pool.query(
        `SELECT s.id, 'code_submission' AS type, s.verdict::text AS status, s.created_at AS "occurredAt",
                u.id AS "studentId", u.name AS "studentName", u.email AS "studentEmail",
                t.id AS "institutionId", t.name AS "institutionName", p.title AS "itemTitle"
         FROM submissions s JOIN users u ON u.id=s.user_id
         LEFT JOIN tenants t ON t.id=s.tenant_id JOIN problems p ON p.id=s.problem_id
         UNION ALL
         SELECT aas.id, 'assignment_submission' AS type, aas.status::text AS status, aas.updated_at AS "occurredAt",
                u.id AS "studentId", u.name AS "studentName", u.email AS "studentEmail",
                t.id AS "institutionId", t.name AS "institutionName", a.title AS "itemTitle"
         FROM assignment_submissions aas JOIN users u ON u.id=aas.student_id
         JOIN tenants t ON t.id=aas.tenant_id JOIN assignments a ON a.id=aas.assignment_id
         UNION ALL
         SELECT qa.id, 'quiz_attempt' AS type, qa.status::text AS status, COALESCE(qa.completed_at, qa.started_at, qa.created_at) AS "occurredAt",
                u.id AS "studentId", u.name AS "studentName", u.email AS "studentEmail",
                t.id AS "institutionId", t.name AS "institutionName", q.title AS "itemTitle"
         FROM quiz_attempts qa JOIN users u ON u.id=qa.student_id
         JOIN tenants t ON t.id=qa.tenant_id JOIN quizzes q ON q.id=qa.quiz_id
         UNION ALL
         SELECT up.id, 'course_progress' AS type, CONCAT(up.completion_percent, '% complete') AS status,
                COALESCE(up.last_accessed_at, up.updated_at) AS "occurredAt",
                u.id AS "studentId", u.name AS "studentName", u.email AS "studentEmail",
                t.id AS "institutionId", t.name AS "institutionName", CONCAT(c.title, ' · ', ch.title) AS "itemTitle"
         FROM user_progress up JOIN users u ON u.id=up.user_id
         JOIN tenants t ON t.id=up.tenant_id JOIN chapters ch ON ch.id=up.chapter_id
         JOIN modules m ON m.id=ch.module_id JOIN courses c ON c.id=m.course_id
         WHERE up.last_accessed_at IS NOT NULL
         ORDER BY "occurredAt" DESC NULLS LAST LIMIT 50`
      ),
      pool.query(
        `SELECT TO_CHAR(d, 'Mon YYYY') AS month,
                (SELECT COUNT(*)::int FROM users WHERE created_at <= (d + INTERVAL '1 month - 1 second') AND NOT is_deleted) AS users,
                (SELECT COUNT(*)::int FROM tenants WHERE created_at <= (d + INTERVAL '1 month - 1 second') AND NOT is_deleted) AS institutes,
                d AS sort_date
         FROM generate_series(
           DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
           DATE_TRUNC('month', NOW()),
           '1 month'::interval
         ) d
         ORDER BY sort_date ASC`
      ).catch(() => ({ rows: [] })),
    ]);

    const row = result.rows[0];
    const totalU = row.totalUsers || 1;
    const userDistribution = [
      {
        name: 'Institute Students',
        value: row.totalStudents || 0,
        percentage: Math.round(((row.totalStudents || 0) / totalU) * 100),
        color: '#2563eb',
      },
      {
        name: 'General Users',
        value: row.totalGeneralUsers || 0,
        percentage: Math.round(((row.totalGeneralUsers || 0) / totalU) * 100),
        color: '#10b981',
      },
      {
        name: 'Institute Admins',
        value: row.totalAdmins || 0,
        percentage: Math.round(((row.totalAdmins || 0) / totalU) * 100),
        color: '#f59e0b',
      },
      {
        name: 'Super Admins',
        value: row.totalSuperAdmins || 0,
        percentage: Math.round(((row.totalSuperAdmins || 0) / totalU) * 100),
        color: '#8b5cf6',
      },
    ];

    const sortedInsts = [...institutions.rows].sort((a, b) => (b.students || 0) - (a.students || 0));
    const topInstitutes = sortedInsts.slice(0, 5).map((inst, idx) => ({
      rank: idx + 1,
      id: inst.id,
      name: inst.name,
      students: (inst.students || 0).toLocaleString(),
      growth: '+10%',
      color: idx % 3 === 0 ? 'blue' : idx % 3 === 1 ? 'emerald' : 'purple',
    }));

    return {
      ...row,
      pendingApprovals: (row.pendingTenants || 0) + (row.pendingAdmissions || 0),
      growthData: monthlyGrowth.rows.map((r: any) => ({
        month: r.month,
        users: r.users,
        institutes: r.institutes,
      })),
      userDistribution,
      topInstitutes,
      institutions: institutions.rows,
      recentActivity: recentActivity.rows,
    };
  },

  async getInstitutionDashboard(tenantId: string) {
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant ID required');

    // 1. Overview counts & metrics
    const overviewRes = await pool.query(
      `SELECT
         t.id AS "tenantId", t.name AS "tenantName", t.slug AS "tenantSlug", t.plan AS "tenantPlan", t.max_students AS "maxStudents",
         COUNT(DISTINCT u.id) FILTER (WHERE u.role='institution_student' AND u.is_active AND NOT u.is_deleted)::int AS "totalStudents",
         COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '7 days')::int AS "activeStudents7d",
         COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= CURRENT_DATE)::int AS "activeStudentsToday",
         COUNT(DISTINCT c.id) FILTER (WHERE c.status='published' AND NOT c.is_deleted)::int AS "publishedCourses",
         COUNT(DISTINCT p.id) FILTER (WHERE NOT p.is_deleted)::int AS "totalProblems",
         COUNT(s.id)::int AS "totalSubmissions",
         COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days')::int AS "submissions7d",
         COUNT(s.id) FILTER (WHERE s.verdict='accepted')::int AS "acceptedSubmissions",
         COUNT(s.id) FILTER (WHERE s.verdict='accepted' AND s.created_at >= NOW() - INTERVAL '7 days')::int AS "accepted7d",
         COUNT(DISTINCT a.id) FILTER (WHERE a.status='published' AND a.due_date > NOW() AND NOT a.is_deleted)::int AS "activeAssignments",
         COUNT(DISTINCT asub.id) FILTER (WHERE asub.status='submitted')::int AS "pendingGrading"
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id
       LEFT JOIN courses c ON c.tenant_id = t.id
       LEFT JOIN problems p ON p.tenant_id = t.id
       LEFT JOIN submissions s ON s.tenant_id = t.id
       LEFT JOIN assignments a ON a.tenant_id = t.id
       LEFT JOIN assignment_submissions asub ON asub.tenant_id = t.id
       WHERE t.id = $1
       GROUP BY t.id`,
      [tenantId]
    );

    const overview = overviewRes.rows[0] || {
      totalStudents: 0, activeStudents7d: 0, activeStudentsToday: 0,
      publishedCourses: 0, totalProblems: 0, totalSubmissions: 0,
      submissions7d: 0, acceptedSubmissions: 0, accepted7d: 0,
      activeAssignments: 0, pendingGrading: 0,
    };

    // 2. Monthly submission & activity trend (last 6 months)
    const growthRes = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
              COUNT(*)::int AS submissions,
              COUNT(DISTINCT user_id)::int AS "activeStudents",
              DATE_TRUNC('month', created_at) AS sort_month
       FROM submissions
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY sort_month ASC`,
      [tenantId]
    );

    // 3. Problem difficulty distribution & solved count
    const difficultyRes = await pool.query(
      `SELECT p.difficulty,
              COUNT(DISTINCT p.id)::int AS count,
              COUNT(DISTINCT s.id) FILTER (WHERE s.verdict='accepted')::int AS solved
       FROM problems p
       LEFT JOIN submissions s ON s.problem_id = p.id AND s.tenant_id = $1
       WHERE (p.tenant_id = $1 OR p.scope = 'public') AND NOT p.is_deleted
       GROUP BY p.difficulty
       ORDER BY CASE p.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
      [tenantId]
    );

    // 4. Recent submissions across the institution
    const recentSubmissionsRes = await pool.query(
      `SELECT s.id, p.id AS "problemId", p.title AS "problemTitle",
              u.id AS "studentId", u.name AS "studentName", u.avatar_url AS "avatarUrl",
              s.verdict, s.runtime_ms AS "runtimeMs", s.memory_kb AS "memoryKb",
              s.language_id AS "languageId", s.created_at AS "createdAt"
       FROM submissions s
       JOIN problems p ON p.id = s.problem_id
       JOIN users u ON u.id = s.user_id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC
       LIMIT 10`,
      [tenantId]
    );

    // 5. Pending assignments that require grading
    const pendingAssignmentsRes = await pool.query(
      `SELECT asub.id, a.id AS "assignmentId", a.title AS "assignmentTitle",
              u.id AS "studentId", u.name AS "studentName", u.email AS "studentEmail",
              asub.submitted_at AS "submittedAt", a.total_marks AS "totalMarks"
       FROM assignment_submissions asub
       JOIN assignments a ON a.id = asub.assignment_id
       JOIN users u ON u.id = asub.student_id
       WHERE asub.tenant_id = $1 AND asub.status = 'submitted'
       ORDER BY asub.submitted_at DESC
       LIMIT 10`,
      [tenantId]
    );

    // 6. Top performing students (Leaderboard)
    const leaderboardRes = await pool.query(
      `SELECT u.id, u.name, u.avatar_url AS "avatarUrl",
              COALESCE(us.total_problems_solved, 0)::int AS "problemsSolved",
              COALESCE(us.total_score, 0)::numeric AS "totalScore",
              COALESCE(us.current_streak_days, 0)::int AS "streak",
              RANK() OVER (ORDER BY COALESCE(us.total_score, 0) DESC) AS rank
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id AND us.tenant_id = u.tenant_id
       WHERE u.tenant_id = $1 AND u.role = 'institution_student' AND u.is_active AND NOT u.is_deleted
       ORDER BY rank ASC
       LIMIT 5`,
      [tenantId]
    );

    // 7. Popular courses in this institution
    const popularCoursesRes = await pool.query(
      `SELECT c.id, c.title, c.thumbnail_url AS "thumbnailUrl",
              COUNT(DISTINCT ce.student_id) FILTER (WHERE ce.is_active)::int AS "enrolledStudents",
              COALESCE(ROUND(AVG(up.completion_percent), 1), 0)::numeric AS "avgCompletion"
       FROM courses c
       LEFT JOIN course_enrollments ce ON ce.course_id = c.id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN chapters ch ON ch.module_id = m.id
       LEFT JOIN user_progress up ON up.chapter_id = ch.id
       WHERE c.tenant_id = $1 AND c.status = 'published' AND NOT c.is_deleted
       GROUP BY c.id
       ORDER BY "enrolledStudents" DESC, c.created_at DESC
       LIMIT 5`,
      [tenantId]
    );

    // 8. Upcoming deadlines
    const upcomingDeadlinesRes = await pool.query(
      `SELECT a.id, a.title, a.due_date AS "dueDate", a.total_marks AS "totalMarks",
              c.title AS "courseTitle",
              COUNT(asub.id)::int AS "submissionsCount"
       FROM assignments a
       LEFT JOIN courses c ON c.id = a.course_id
       LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
       WHERE a.tenant_id = $1 AND a.status = 'published' AND a.due_date > NOW() AND NOT a.is_deleted
       GROUP BY a.id, c.title
       ORDER BY a.due_date ASC
       LIMIT 5`,
      [tenantId]
    );

    return {
      overview,
      growth: growthRes.rows,
      difficultyDistribution: difficultyRes.rows,
      recentSubmissions: recentSubmissionsRes.rows,
      pendingAssignments: pendingAssignmentsRes.rows,
      topStudents: leaderboardRes.rows,
      popularCourses: popularCoursesRes.rows,
      upcomingDeadlines: upcomingDeadlinesRes.rows,
    };
  },

  async getStudentDashboard(userId: string, tenantId: string | null, isGeneral: boolean) {
    // 1. Overall student stats
    const statsRes = await pool.query(
      `SELECT
         COALESCE(us.total_problems_solved, 0)::int AS "problemsSolved",
         COALESCE(us.easy_solved, 0)::int AS "easySolved",
         COALESCE(us.medium_solved, 0)::int AS "mediumSolved",
         COALESCE(us.hard_solved, 0)::int AS "hardSolved",
         COALESCE(us.total_submissions, 0)::int AS "totalSubmissions",
         COALESCE(us.accepted_submissions, 0)::int AS "acceptedSubmissions",
         COALESCE(us.current_streak_days, 0)::int AS "currentStreak",
         COALESCE(us.max_streak_days, 0)::int AS "maxStreak",
         COALESCE(us.total_score, 0)::numeric AS "totalScore",
         COALESCE(us.rank_institution, 0)::int AS "rankInstitution",
         COALESCE(us.rank_global, 0)::int AS "rankGlobal",
         COUNT(DISTINCT ce.course_id) FILTER (WHERE ce.is_active)::int AS "enrolledCourses",
         COUNT(DISTINCT up.chapter_id) FILTER (WHERE up.is_completed)::int AS "completedChapters"
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       LEFT JOIN course_enrollments ce ON ce.student_id = u.id
       LEFT JOIN user_progress up ON up.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, us.total_problems_solved, us.easy_solved, us.medium_solved, us.hard_solved,
                us.total_submissions, us.accepted_submissions, us.current_streak_days,
                us.max_streak_days, us.total_score, us.rank_institution, us.rank_global`,
      [userId]
    );

    const stats = statsRes.rows[0] || {
      problemsSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
      totalSubmissions: 0, acceptedSubmissions: 0, currentStreak: 0,
      maxStreak: 0, totalScore: 0, rankInstitution: 0, rankGlobal: 0,
      enrolledCourses: 0, completedChapters: 0,
    };

    // If user_stats has 0 totalSubmissions, compute from submissions table as live fallback
    if (stats.totalSubmissions === 0) {
      const liveSubCount = await pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE verdict='accepted')::int AS accepted,
                COUNT(DISTINCT problem_id) FILTER (WHERE verdict='accepted')::int AS solved
         FROM submissions WHERE user_id = $1`,
        [userId]
      );
      if (liveSubCount.rows[0]?.total > 0) {
        stats.totalSubmissions = liveSubCount.rows[0].total;
        stats.acceptedSubmissions = liveSubCount.rows[0].accepted;
        stats.problemsSolved = liveSubCount.rows[0].solved;
      }
    }

    // 2. Pending assignments (for institution students)
    let pendingAssignments: any[] = [];
    if (tenantId) {
      const pendingAssRes = await pool.query(
        `SELECT a.id, a.title, a.due_date AS "dueDate", a.total_marks AS "totalMarks",
                c.title AS "courseTitle",
                COALESCE(asub.status, 'not_started') AS "submissionStatus",
                asub.total_score AS "score"
         FROM assignments a
         LEFT JOIN courses c ON c.id = a.course_id
         LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = $1
         WHERE a.tenant_id = $2 AND a.status = 'published' AND a.due_date >= NOW() AND NOT a.is_deleted
         ORDER BY a.due_date ASC
         LIMIT 5`,
        [userId, tenantId]
      );
      pendingAssignments = pendingAssRes.rows;
    }

    // 3. Enrolled Courses with progress rollup
    const enrolledCoursesRes = await pool.query(
      `SELECT c.id, c.title, c.thumbnail_url AS "thumbnailUrl",
              ce.enrolled_at AS "enrolledAt",
              COALESCE(ROUND(AVG(up.completion_percent), 1), 0)::numeric AS "completionPercent",
              COUNT(DISTINCT ch.id)::int AS "chaptersCount",
              COUNT(DISTINCT ch.id) FILTER (WHERE up.is_completed)::int AS "completedChapters",
              MAX(up.last_accessed_at) AS "lastAccessedAt"
       FROM course_enrollments ce
       JOIN courses c ON c.id = ce.course_id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN chapters ch ON ch.module_id = m.id
       LEFT JOIN user_progress up ON up.chapter_id = ch.id AND up.user_id = $1
       WHERE ce.student_id = $1 AND ce.is_active AND NOT c.is_deleted
       GROUP BY c.id, ce.enrolled_at
       ORDER BY MAX(up.last_accessed_at) DESC NULLS LAST, ce.enrolled_at DESC
       LIMIT 6`,
      [userId]
    );

    // 4. Recent Code Submissions
    const recentSubmissionsRes = await pool.query(
      `SELECT s.id, p.id AS "problemId", p.title AS "problemTitle", p.difficulty,
              s.verdict, s.runtime_ms AS "runtimeMs", s.memory_kb AS "memoryKb",
              s.language_id AS "languageId", s.created_at AS "createdAt"
       FROM submissions s
       JOIN problems p ON p.id = s.problem_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // 5. Monthly Submissions trend (last 6 months)
    const monthlyActivityRes = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
              COUNT(*)::int AS submissions,
              COUNT(*) FILTER (WHERE verdict='accepted')::int AS accepted,
              DATE_TRUNC('month', created_at) AS sort_month
       FROM submissions
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY sort_month ASC`,
      [userId]
    );

    // 6. Leaderboard (Tenant or Global)
    let leaderboardQuery = '';
    let leaderboardParams: any[] = [];
    if (tenantId && !isGeneral) {
      leaderboardQuery = `
        SELECT u.id, u.name, u.avatar_url AS "avatarUrl",
               COALESCE(us.total_problems_solved, 0)::int AS "problemsSolved",
               COALESCE(us.total_score, 0)::numeric AS "totalScore",
               COALESCE(us.current_streak_days, 0)::int AS "streak",
               RANK() OVER (ORDER BY COALESCE(us.total_score, 0) DESC) AS rank
        FROM users u
        LEFT JOIN user_stats us ON us.user_id = u.id AND us.tenant_id = u.tenant_id
        WHERE u.tenant_id = $1 AND u.role = 'institution_student' AND u.is_active AND NOT u.is_deleted
        ORDER BY rank ASC
        LIMIT 5`;
      leaderboardParams = [tenantId];
    } else {
      leaderboardQuery = `
        SELECT u.id, u.name, u.avatar_url AS "avatarUrl",
               COALESCE(us.total_problems_solved, 0)::int AS "problemsSolved",
               COALESCE(us.total_score, 0)::numeric AS "totalScore",
               COALESCE(us.current_streak_days, 0)::int AS "streak",
               RANK() OVER (ORDER BY COALESCE(us.total_score, 0) DESC) AS rank
        FROM users u
        LEFT JOIN user_stats us ON us.user_id = u.id
        WHERE u.is_active AND NOT u.is_deleted
        ORDER BY rank ASC
        LIMIT 5`;
      leaderboardParams = [];
    }
    const leaderboardRes = await pool.query(leaderboardQuery, leaderboardParams);

    // 7. Recommended / Next Problems (unsolved)
    const recommendedRes = await pool.query(
      `SELECT p.id, p.title, p.slug, p.difficulty, p.tags,
              p.total_submissions AS "totalSubmissions",
              p.accepted_submissions AS "acceptedSubmissions"
       FROM problems p
       WHERE NOT p.is_deleted
         AND ($2::uuid IS NULL OR p.tenant_id = $2 OR p.scope = 'public')
         AND p.id NOT IN (
           SELECT DISTINCT problem_id FROM submissions WHERE user_id = $1 AND verdict = 'accepted'
         )
       ORDER BY p.total_submissions DESC, p.created_at DESC
       LIMIT 5`,
      [userId, tenantId || null]
    );

    return {
      stats,
      activityTrend: monthlyActivityRes.rows,
      recentSubmissions: recentSubmissionsRes.rows,
      enrolledCourses: enrolledCoursesRes.rows,
      pendingAssignments,
      leaderboard: leaderboardRes.rows,
      recommendedProblems: recommendedRes.rows,
    };
  },
};
