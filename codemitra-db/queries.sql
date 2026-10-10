-- =============================================================================
-- CODEVERSE — PRODUCTION QUERY LIBRARY
-- File    : queries.sql
-- Purpose : All canonical SQL queries for the Express API backend.
--           Organised by module. Use these directly in Drizzle .execute()
--           or adapt to Drizzle query builder syntax.
--
-- Convention:
--   $1, $2 … = positional parameters (pg / node-postgres style)
--   -- [PARAM] comments document what each parameter represents
-- =============================================================================


-- =============================================================================
-- MODULE: AUTH
-- =============================================================================

-- AUTH-01: Find user by email for login (includes lock check)
-- [PARAM] $1 = email (case-insensitive via citext)
SELECT
    id,
    tenant_id,
    email,
    password_hash,
    name,
    role,
    is_active,
    is_email_verified,
    login_attempt_count,
    locked_until,
    metadata
FROM users
WHERE email = $1
  AND is_deleted = FALSE
LIMIT 1;

-- AUTH-02: Record successful login (reset failed attempts, update last_login)
-- [PARAM] $1 = user_id
UPDATE users
SET
    last_login_at       = NOW(),
    login_attempt_count = 0,
    locked_until        = NULL,
    updated_at          = NOW()
WHERE id = $1;

-- AUTH-03: Increment failed login attempt; lock after 5 failures for 15 minutes
-- [PARAM] $1 = user_id
UPDATE users
SET
    login_attempt_count = login_attempt_count + 1,
    locked_until = CASE
        WHEN login_attempt_count + 1 >= 5
        THEN NOW() + INTERVAL '15 minutes'
        ELSE locked_until
    END,
    updated_at = NOW()
WHERE id = $1
RETURNING login_attempt_count, locked_until;

-- AUTH-04: Store a new refresh token
-- [PARAM] $1=user_id, $2=token_hash, $3=expires_at, $4=ip_address, $5=user_agent
INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
VALUES ($1, $2, $3, $4::INET, $5)
RETURNING id;

-- AUTH-05: Validate and fetch refresh token (must not be revoked or expired)
-- [PARAM] $1 = token_hash (SHA-256 of raw token)
SELECT
    rt.id,
    rt.user_id,
    rt.expires_at,
    u.role,
    u.tenant_id,
    u.is_active
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.token_hash = $1
  AND rt.is_revoked = FALSE
  AND rt.expires_at > NOW()
  AND u.is_deleted  = FALSE
LIMIT 1;

-- AUTH-06: Revoke a specific refresh token (logout)
-- [PARAM] $1 = token_hash
UPDATE refresh_tokens
SET is_revoked = TRUE
WHERE token_hash = $1;

-- AUTH-07: Revoke ALL refresh tokens for a user (force logout everywhere)
-- [PARAM] $1 = user_id
UPDATE refresh_tokens
SET is_revoked = TRUE
WHERE user_id = $1 AND is_revoked = FALSE;


-- =============================================================================
-- MODULE: TENANTS / INSTITUTIONS
-- =============================================================================

-- TENANT-01: List all active tenants (Super Admin dashboard)
SELECT
    t.id,
    t.name,
    t.slug,
    t.plan,
    t.max_students,
    t.plan_expires_at,
    t.is_active,
    t.created_at,
    COUNT(u.id) FILTER (
        WHERE u.role = 'institution_student'
          AND u.is_active   = TRUE
          AND u.is_deleted  = FALSE
    ) AS student_count,
    COUNT(u.id) FILTER (
        WHERE u.role = 'institution_admin'
          AND u.is_deleted  = FALSE
    ) AS admin_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE t.is_deleted = FALSE
GROUP BY t.id
ORDER BY t.created_at DESC
LIMIT  $1   -- [PARAM] $1 = page size
OFFSET $2;  -- [PARAM] $2 = offset

-- TENANT-02: Get single tenant detail by slug
-- [PARAM] $1 = slug
SELECT
    id, name, slug, logo_url, plan, max_students,
    plan_expires_at, is_active, contact_email, settings
FROM tenants
WHERE slug = $1 AND is_deleted = FALSE
LIMIT 1;

-- TENANT-03: Create institution (with initial admin user) — use in transaction
-- Step 1: Insert tenant
INSERT INTO tenants (name, slug, logo_url, plan, max_students, contact_email)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, slug;
-- Step 2: Insert institution admin user (run immediately after with tenant.id)
-- [PARAM] $1=tenant_id, $2=email, $3=bcrypt_hash, $4=name
INSERT INTO users (tenant_id, email, password_hash, name, role, is_email_verified, is_active)
VALUES ($1, $2, $3, $4, 'institution_admin', TRUE, TRUE)
RETURNING id, email, role;

-- TENANT-04: Check tenant student quota before bulk import
-- [PARAM] $1 = tenant_id
SELECT
    t.max_students,
    COUNT(u.id) FILTER (
        WHERE u.role = 'institution_student'
          AND u.is_active  = TRUE
          AND u.is_deleted = FALSE
    ) AS current_students,
    (t.max_students - COUNT(u.id) FILTER (
        WHERE u.role = 'institution_student'
          AND u.is_active  = TRUE
          AND u.is_deleted = FALSE
    )) AS available_slots
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE t.id = $1
GROUP BY t.id, t.max_students;

-- TENANT-05: Update tenant subscription plan
-- [PARAM] $1=plan, $2=max_students, $3=plan_expires_at, $4=tenant_id
UPDATE tenants
SET
    plan            = $1,
    max_students    = $2,
    plan_expires_at = $3,
    updated_at      = NOW()
WHERE id = $4
RETURNING id, plan, max_students, plan_expires_at;


-- =============================================================================
-- MODULE: USERS / STUDENTS
-- =============================================================================

-- USER-01: List students in an institution (with progress summary)
-- [PARAM] $1=tenant_id, $2=search_term (optional), $3=limit, $4=offset
SELECT
    u.id,
    u.name,
    u.email,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.metadata,
    COALESCE(us.total_problems_solved,  0) AS problems_solved,
    COALESCE(us.current_streak_days,    0) AS streak,
    COALESCE(us.total_score,            0) AS score,
    COALESCE(us.rank_institution,       0) AS rank
FROM users u
LEFT JOIN user_stats us ON us.user_id = u.id AND us.tenant_id = u.tenant_id
WHERE u.tenant_id  = $1
  AND u.role       = 'institution_student'
  AND u.is_deleted = FALSE
  AND ($2::TEXT IS NULL OR u.name ILIKE '%' || $2 || '%' OR u.email ILIKE '%' || $2 || '%')
ORDER BY u.name ASC
LIMIT  $3
OFFSET $4;

-- USER-02: Get single student profile with full stats
-- [PARAM] $1=user_id, $2=tenant_id
SELECT
    u.id,
    u.tenant_id,
    u.name,
    u.email,
    u.avatar_url,
    u.role,
    u.is_active,
    u.last_login_at,
    u.metadata,
    us.total_problems_solved,
    us.easy_solved,
    us.medium_solved,
    us.hard_solved,
    us.total_submissions,
    us.accepted_submissions,
    us.current_streak_days,
    us.max_streak_days,
    us.total_score,
    us.rank_institution,
    us.rank_global,
    us.last_submission_date
FROM users u
LEFT JOIN user_stats us ON us.user_id = u.id AND us.tenant_id = $2
WHERE u.id        = $1
  AND u.tenant_id = $2
  AND u.is_deleted = FALSE
LIMIT 1;

-- USER-03: Bulk insert students (used after CSV parse in application)
-- [PARAM] $1=tenant_id, $2=email, $3=bcrypt_hash, $4=name, $5=metadata_jsonb
INSERT INTO users (tenant_id, email, password_hash, name, role, is_email_verified, metadata)
VALUES ($1, $2, $3, $4, 'institution_student', TRUE, $5::JSONB)
ON CONFLICT (email) DO NOTHING
RETURNING id, email, name;

-- USER-04: Deactivate / reactivate a student
-- [PARAM] $1=is_active, $2=user_id, $3=tenant_id
UPDATE users
SET is_active = $1, updated_at = NOW()
WHERE id = $2 AND tenant_id = $3 AND is_deleted = FALSE
RETURNING id, is_active;

-- USER-05: Student count per tenant (for Super Admin analytics)
SELECT
    tenant_id,
    COUNT(*) FILTER (WHERE role = 'institution_student' AND is_active AND NOT is_deleted) AS active_students,
    COUNT(*) FILTER (WHERE role = 'institution_admin'   AND is_active AND NOT is_deleted) AS active_admins
FROM users
GROUP BY tenant_id;


-- =============================================================================
-- MODULE: COURSES / MODULES / CHAPTERS
-- =============================================================================

-- COURSE-01: Get full course tree (course + modules + chapters) for an institution
-- [PARAM] $1=tenant_id, $2=course_id
SELECT
    c.id           AS course_id,
    c.title        AS course_title,
    c.description  AS course_description,
    c.thumbnail_url,
    c.status       AS course_status,
    c.language_tags,
    m.id           AS module_id,
    m.title        AS module_title,
    m.order_index  AS module_order,
    m.status       AS module_status,
    ch.id          AS chapter_id,
    ch.title       AS chapter_title,
    ch.order_index AS chapter_order,
    ch.status      AS chapter_status,
    ch.estimated_minutes
FROM courses c
LEFT JOIN modules  m  ON m.course_id  = c.id AND m.is_deleted  = FALSE
LEFT JOIN chapters ch ON ch.module_id = m.id AND ch.is_deleted = FALSE
WHERE c.id        = $2
  AND c.tenant_id = $1
  AND c.is_deleted = FALSE
ORDER BY m.order_index, ch.order_index;

-- COURSE-02: List courses for institution (with module and chapter counts)
-- [PARAM] $1=tenant_id, $2=status_filter (NULL = all), $3=limit, $4=offset
SELECT
    c.id,
    c.title,
    c.description,
    c.thumbnail_url,
    c.status,
    c.language_tags,
    c.sort_order,
    c.created_at,
    COUNT(DISTINCT m.id)  FILTER (WHERE NOT m.is_deleted)  AS module_count,
    COUNT(DISTINCT ch.id) FILTER (WHERE NOT ch.is_deleted) AS chapter_count,
    COUNT(DISTINCT p.id)  FILTER (WHERE NOT p.is_deleted)  AS problem_count
FROM courses c
LEFT JOIN modules  m  ON m.course_id  = c.id
LEFT JOIN chapters ch ON ch.module_id = m.id
LEFT JOIN problems p  ON p.chapter_id = ch.id
WHERE c.tenant_id  = $1
  AND c.is_deleted = FALSE
  AND ($2::TEXT IS NULL OR c.status = $2::content_status)
GROUP BY c.id
ORDER BY c.sort_order ASC, c.created_at DESC
LIMIT  $3
OFFSET $4;

-- COURSE-03: Create a course
-- [PARAM] $1=tenant_id, $2=created_by, $3=title, $4=description, $5=thumbnail_url, $6=language_tags[]
INSERT INTO courses (tenant_id, created_by, title, description, thumbnail_url, language_tags, status)
VALUES ($1, $2, $3, $4, $5, $6, 'draft')
RETURNING id, title, status, created_at;

-- MODULE-01: Reorder modules within a course (batch update via unnest)
-- [PARAM] $1 = array of module IDs, $2 = array of new order_index values, $3=course_id
UPDATE modules AS m
SET
    order_index = v.new_order,
    updated_at  = NOW()
FROM (
    SELECT
        UNNEST($1::UUID[])    AS module_id,
        UNNEST($2::INTEGER[]) AS new_order
) AS v
WHERE m.id = v.module_id AND m.course_id = $3;

-- CHAPTER-01: Get chapter content with its problems and quiz info
-- [PARAM] $1=chapter_id, $2=tenant_id, $3=student_user_id
SELECT
    ch.id,
    ch.title,
    ch.content,
    ch.estimated_minutes,
    ch.status,
    -- Student's progress on this chapter
    up.completion_percent,
    up.problems_solved,
    up.is_completed,
    up.last_accessed_at,
    -- Problems in this chapter
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id',         p.id,
                'title',      p.title,
                'difficulty', p.difficulty,
                'tags',       p.tags,
                'solved',     (
                    SELECT EXISTS (
                        SELECT 1 FROM submissions s
                        WHERE s.user_id    = $3
                          AND s.problem_id = p.id
                          AND s.verdict    = 'accepted'
                    )
                )
            ) ORDER BY p.id
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
    ) AS problems,
    -- Quiz linked to this chapter
    JSON_BUILD_OBJECT(
        'id',     q.id,
        'title',  q.title,
        'status', q.status
    ) AS quiz
FROM chapters ch
LEFT JOIN problems     p  ON p.chapter_id = ch.id AND NOT p.is_deleted
LEFT JOIN quizzes      q  ON q.chapter_id = ch.id AND NOT q.is_deleted AND q.status = 'published'
LEFT JOIN user_progress up ON up.chapter_id = ch.id AND up.user_id = $3
WHERE ch.id        = $1
  AND ch.tenant_id = $2
  AND NOT ch.is_deleted
GROUP BY ch.id, up.completion_percent, up.problems_solved,
         up.is_completed, up.last_accessed_at, q.id, q.title, q.status;


-- =============================================================================
-- MODULE: PROBLEMS
-- =============================================================================

-- PROB-01: List problems for institution (with filter options)
-- [PARAM] $1=tenant_id, $2=difficulty (NULL=all), $3=tags (NULL=all), $4=limit, $5=offset
SELECT
    p.id,
    p.title,
    p.slug,
    p.difficulty,
    p.tags,
    p.scope,
    p.total_submissions,
    p.accepted_submissions,
    CASE
        WHEN p.total_submissions = 0 THEN 0
        ELSE ROUND((p.accepted_submissions::NUMERIC / p.total_submissions) * 100, 1)
    END AS acceptance_rate,
    p.created_at
FROM problems p
WHERE (p.tenant_id = $1 OR p.scope = 'public')
  AND p.is_deleted = FALSE
  AND ($2::difficulty_level IS NULL OR p.difficulty = $2::difficulty_level)
  AND ($3::TEXT[] IS NULL OR p.tags && $3::TEXT[])
ORDER BY p.created_at DESC
LIMIT  $4
OFFSET $5;

-- PROB-02: Get full problem detail (for solve page)
-- Returns problem without hidden test cases (students see sample only)
-- [PARAM] $1=problem_id, $2=tenant_id (for scope check)
SELECT
    p.id,
    p.title,
    p.statement,
    p.input_format,
    p.output_format,
    p.constraints_text,
    p.sample_explanation,
    p.difficulty,
    p.tags,
    p.time_limit_ms,
    p.memory_limit_mb,
    p.allowed_languages,
    p.total_submissions,
    p.accepted_submissions,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id',    tc.id,
                'input', tc.input,
                'output', tc.expected_output
            ) ORDER BY tc.order_index
        ) FILTER (WHERE tc.id IS NOT NULL AND tc.is_hidden = FALSE),
        '[]'
    ) AS sample_test_cases
FROM problems p
LEFT JOIN test_cases tc ON tc.problem_id = p.id
WHERE p.id = $1
  AND (p.tenant_id = $2 OR p.scope = 'public')
  AND p.is_deleted = FALSE
GROUP BY p.id;

-- PROB-03: Get ALL test cases for a problem (admin view — includes hidden)
-- [PARAM] $1=problem_id
SELECT
    id,
    input,
    expected_output,
    is_hidden,
    points,
    order_index,
    explanation
FROM test_cases
WHERE problem_id = $1
ORDER BY order_index ASC;

-- PROB-04: Create problem with test cases (use in a transaction)
-- Step 1: Insert problem
INSERT INTO problems (
    tenant_id, chapter_id, created_by,
    title, slug, statement, input_format, output_format,
    constraints_text, sample_explanation,
    difficulty, scope, tags, time_limit_ms, memory_limit_mb, allowed_languages
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING id;

-- Step 2: Batch insert test cases (run for each test case)
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, points, order_index)
VALUES ($1, $2, $3, $4, $5, $6);

-- PROB-05: Full-text search on problems (uses pg_trgm index)
-- [PARAM] $1=search_term, $2=tenant_id, $3=limit
SELECT
    id, title, difficulty, tags,
    SIMILARITY(title, $1) AS relevance
FROM problems
WHERE (tenant_id = $2 OR scope = 'public')
  AND is_deleted = FALSE
  AND title % $1
ORDER BY relevance DESC, created_at DESC
LIMIT $3;


-- =============================================================================
-- MODULE: SUBMISSIONS
-- =============================================================================

-- SUB-01: Create a pending submission
-- [PARAM] $1=user_id, $2=problem_id, $3=tenant_id, $4=assignment_id, $5=language_id, $6=source_code
INSERT INTO submissions (
    user_id, problem_id, tenant_id, assignment_id,
    language_id, source_code, verdict
)
VALUES ($1, $2, $3, $4, $5, $6, 'pending')
RETURNING id, created_at;

-- SUB-02: Update submission after Judge0 responds
-- [PARAM] $1=verdict, $2=score, $3=runtime_ms, $4=memory_kb, $5=stderr_output, $6=test_case_results (JSONB), $7=id
UPDATE submissions
SET
    verdict            = $1::submission_verdict,
    score              = $2,
    runtime_ms         = $3,
    memory_kb          = $4,
    stderr_output      = $5,
    test_case_results  = $6::JSONB,
    updated_at         = NOW()
WHERE id = $7
RETURNING id, verdict, score, runtime_ms, memory_kb;

-- SUB-03: Store Judge0 batch token for polling
-- [PARAM] $1=judge0_token, $2=submission_id
UPDATE submissions
SET judge0_token = $1, updated_at = NOW()
WHERE id = $2;

-- SUB-04: Get all pending submissions (for background Judge0 polling job)
SELECT
    id,
    judge0_token,
    problem_id,
    created_at
FROM submissions
WHERE verdict = 'pending'
  AND created_at < NOW() - INTERVAL '5 seconds'
  -- Avoid race: don't re-poll submissions just created
ORDER BY created_at ASC
LIMIT 50;

-- SUB-05: Get user's submission history for a problem (latest first)
-- [PARAM] $1=user_id, $2=problem_id, $3=limit
SELECT
    id,
    language_id,
    verdict,
    score,
    runtime_ms,
    memory_kb,
    created_at
FROM submissions
WHERE user_id    = $1
  AND problem_id = $2
ORDER BY created_at DESC
LIMIT $3;

-- SUB-06: Check if user already solved a problem (for dedup in stats)
-- [PARAM] $1=user_id, $2=problem_id
SELECT EXISTS (
    SELECT 1
    FROM submissions
    WHERE user_id    = $1
      AND problem_id = $2
      AND verdict    = 'accepted'
) AS already_solved;

-- SUB-07: Recent submissions for institution dashboard feed
-- [PARAM] $1=tenant_id, $2=limit
SELECT
    s.id,
    s.verdict,
    s.language_id,
    s.runtime_ms,
    s.created_at,
    u.name  AS student_name,
    u.email AS student_email,
    p.title AS problem_title,
    p.difficulty
FROM submissions s
JOIN users    u ON u.id = s.user_id
JOIN problems p ON p.id = s.problem_id
WHERE s.tenant_id = $1
ORDER BY s.created_at DESC
LIMIT $2;


-- =============================================================================
-- MODULE: ASSIGNMENTS
-- =============================================================================

-- ASSIGN-01: List assignments for a course
-- [PARAM] $1=tenant_id, $2=course_id (NULL = all), $3=limit, $4=offset
SELECT
    a.id,
    a.title,
    a.description,
    a.due_date,
    a.total_marks,
    a.status,
    a.late_submission_allowed,
    a.created_at,
    COUNT(ap.id) AS problem_count,
    COUNT(asub.id) AS submission_count
FROM assignments a
LEFT JOIN assignment_problems    ap   ON ap.assignment_id = a.id
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
WHERE a.tenant_id  = $1
  AND a.is_deleted = FALSE
  AND ($2::UUID IS NULL OR a.course_id = $2)
GROUP BY a.id
ORDER BY a.due_date ASC NULLS LAST
LIMIT  $3
OFFSET $4;

-- ASSIGN-02: Get assignment detail with problems
-- [PARAM] $1=assignment_id, $2=tenant_id
SELECT
    a.id,
    a.title,
    a.description,
    a.instructions,
    a.due_date,
    a.total_marks,
    a.status,
    a.late_submission_allowed,
    a.late_penalty_percent,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id',         p.id,
                'title',      p.title,
                'difficulty', p.difficulty,
                'marks',      ap.marks,
                'order',      ap.order_index
            ) ORDER BY ap.order_index
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
    ) AS problems
FROM assignments a
LEFT JOIN assignment_problems ap ON ap.assignment_id = a.id
LEFT JOIN problems            p  ON p.id = ap.problem_id AND NOT p.is_deleted
WHERE a.id = $1 AND a.tenant_id = $2 AND NOT a.is_deleted
GROUP BY a.id;

-- ASSIGN-03: Student assignment submission upsert
-- [PARAM] $1=assignment_id, $2=student_id, $3=tenant_id, $4=status
INSERT INTO assignment_submissions (assignment_id, student_id, tenant_id, status, submitted_at)
VALUES ($1, $2, $3, $4::assignment_status, NOW())
ON CONFLICT (assignment_id, student_id) DO UPDATE SET
    status       = EXCLUDED.status,
    submitted_at = CASE
                       WHEN EXCLUDED.status IN ('submitted','late_submitted')
                       THEN NOW()
                       ELSE assignment_submissions.submitted_at
                   END,
    updated_at   = NOW()
RETURNING id, status, submitted_at;

-- ASSIGN-04: Grade an assignment submission
-- [PARAM] $1=total_score, $2=feedback, $3=graded_by, $4=assignment_submission_id
UPDATE assignment_submissions
SET
    status      = 'graded',
    total_score = $1,
    feedback    = $2,
    graded_by   = $3,
    graded_at   = NOW(),
    updated_at  = NOW()
WHERE id = $4
RETURNING id, total_score, status;

-- ASSIGN-05: Assignments due in next 48 hours (for notification job)
SELECT
    a.id           AS assignment_id,
    a.title,
    a.due_date,
    a.tenant_id,
    u.id           AS student_id,
    u.name         AS student_name,
    u.email        AS student_email
FROM assignments a
JOIN users u ON u.tenant_id = a.tenant_id AND u.role = 'institution_student' AND u.is_active
LEFT JOIN assignment_submissions asub
    ON asub.assignment_id = a.id AND asub.student_id = u.id
WHERE a.status     = 'published'
  AND a.is_deleted = FALSE
  AND a.due_date   BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
  AND (asub.id IS NULL OR asub.status = 'not_started')
ORDER BY a.due_date ASC;


-- =============================================================================
-- MODULE: QUIZZES
-- =============================================================================

-- QUIZ-01: Get quiz with all questions (shuffled if enabled)
-- [PARAM] $1=quiz_id, $2=tenant_id
SELECT
    q.id,
    q.title,
    q.description,
    q.time_limit_minutes,
    q.shuffle_questions,
    q.shuffle_options,
    q.passing_score,
    q.max_attempts,
    q.show_answers_after,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id',           qq.id,
                'question',     qq.question_text,
                'options',      qq.options,
                'points',       qq.points,
                'image_url',    qq.image_url
                -- correct_options NOT included (server-side grading only)
            ) ORDER BY
                CASE WHEN q.shuffle_questions THEN RANDOM() ELSE qq.order_index::FLOAT END
        ) FILTER (WHERE qq.id IS NOT NULL),
        '[]'
    ) AS questions
FROM quizzes q
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
WHERE q.id        = $1
  AND q.tenant_id = $2
  AND q.status    = 'published'
  AND NOT q.is_deleted
GROUP BY q.id;

-- QUIZ-02: Grade a quiz attempt (server-side: compare answers to correct_options)
-- [PARAM] $1=quiz_attempt_id, $2=answers_jsonb ({"question_id": ["opt_id", ...]})
WITH question_scores AS (
    SELECT
        qq.id,
        qq.points,
        qq.correct_options,
        (
            SELECT COALESCE(
                JSONB_ARRAY_ELEMENTS_TEXT(
                    ($2::JSONB -> qq.id::TEXT)
                ),
                NULL
            )
        ) AS submitted_options,
        -- Full credit only if ALL correct options selected and no extras
        CASE
            WHEN ARRAY(
                SELECT JSONB_ARRAY_ELEMENTS_TEXT($2::JSONB -> qq.id::TEXT)
                ORDER BY 1
            ) = (qq.correct_options ORDER BY 1)
            THEN qq.points
            ELSE 0
        END AS earned_points
    FROM quiz_attempts qa
    JOIN quizzes       q  ON q.id = qa.quiz_id
    JOIN quiz_questions qq ON qq.quiz_id = q.id
    WHERE qa.id = $1
)
UPDATE quiz_attempts
SET
    score       = (SELECT SUM(earned_points)::NUMERIC FROM question_scores),
    total_points = (SELECT SUM(points) FROM question_scores),
    passed      = (
        SELECT (SUM(earned_points) / NULLIF(SUM(points), 0)) * 100
        FROM question_scores
    ) >= (
        SELECT passing_score FROM quizzes WHERE id = (
            SELECT quiz_id FROM quiz_attempts WHERE id = $1
        )
    ),
    status           = 'completed',
    completed_at     = NOW(),
    time_taken_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    updated_at       = NOW()
WHERE id = $1
RETURNING id, score, total_points, passed;


-- =============================================================================
-- MODULE: ANALYTICS
-- =============================================================================

-- ANALYTICS-01: Institution Overview Dashboard (all key metrics in one query)
-- [PARAM] $1=tenant_id
SELECT
    -- Student stats
    COUNT(DISTINCT u.id) FILTER (
        WHERE u.role = 'institution_student' AND u.is_active AND NOT u.is_deleted
    ) AS total_students,
    COUNT(DISTINCT u.id) FILTER (
        WHERE u.role = 'institution_student'
          AND u.last_login_at >= NOW() - INTERVAL '7 days'
    ) AS active_students_7d,
    COUNT(DISTINCT u.id) FILTER (
        WHERE u.role = 'institution_student'
          AND u.last_login_at >= CURRENT_DATE
    ) AS active_students_today,
    -- Course stats
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published' AND NOT c.is_deleted) AS published_courses,
    -- Problem stats
    COUNT(DISTINCT p.id) FILTER (WHERE NOT p.is_deleted) AS total_problems,
    -- Submission stats (last 7 days)
    COUNT(s.id) FILTER (
        WHERE s.created_at >= NOW() - INTERVAL '7 days'
    ) AS submissions_7d,
    COUNT(s.id) FILTER (
        WHERE s.verdict = 'accepted'
          AND s.created_at >= NOW() - INTERVAL '7 days'
    ) AS accepted_7d,
    -- Assignment stats
    COUNT(DISTINCT a.id) FILTER (
        WHERE a.status = 'published'
          AND a.due_date > NOW()
          AND NOT a.is_deleted
    ) AS active_assignments
FROM tenants t
LEFT JOIN users       u ON u.tenant_id = t.id
LEFT JOIN courses     c ON c.tenant_id = t.id
LEFT JOIN problems    p ON p.tenant_id = t.id
LEFT JOIN submissions s ON s.tenant_id = t.id
LEFT JOIN assignments a ON a.tenant_id = t.id
WHERE t.id = $1;

-- ANALYTICS-02: Daily submission heatmap for last 90 days
-- [PARAM] $1=tenant_id
SELECT
    DATE(created_at)                        AS submission_date,
    COUNT(*)                                AS total,
    COUNT(*) FILTER (WHERE verdict = 'accepted') AS accepted
FROM submissions
WHERE tenant_id  = $1
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY submission_date ASC;

-- ANALYTICS-03: Per-student course completion report
-- [PARAM] $1=tenant_id, $2=course_id
SELECT
    u.id           AS student_id,
    u.name,
    u.email,
    COUNT(ch.id)   AS total_chapters,
    COUNT(up.id) FILTER (WHERE up.is_completed) AS completed_chapters,
    ROUND(
        COUNT(up.id) FILTER (WHERE up.is_completed)::NUMERIC /
        NULLIF(COUNT(ch.id), 0) * 100,
        1
    ) AS completion_pct,
    COALESCE(SUM(up.problems_solved), 0) AS problems_solved,
    MAX(up.last_accessed_at) AS last_activity
FROM users u
CROSS JOIN (
    SELECT ch.id
    FROM courses c
    JOIN modules  m  ON m.course_id  = c.id AND NOT m.is_deleted
    JOIN chapters ch ON ch.module_id = m.id AND NOT ch.is_deleted
    WHERE c.id = $2 AND c.tenant_id = $1
) ch
LEFT JOIN user_progress up
    ON up.user_id = u.id AND up.chapter_id = ch.id
WHERE u.tenant_id  = $1
  AND u.role       = 'institution_student'
  AND u.is_active  = TRUE
  AND u.is_deleted = FALSE
GROUP BY u.id, u.name, u.email
ORDER BY completion_pct DESC, u.name ASC;

-- ANALYTICS-04: Problem difficulty distribution for an institution
-- [PARAM] $1=tenant_id
SELECT
    p.difficulty,
    COUNT(p.id)                                    AS total_problems,
    SUM(p.total_submissions)                       AS total_attempts,
    SUM(p.accepted_submissions)                    AS total_accepted,
    ROUND(
        SUM(p.accepted_submissions)::NUMERIC /
        NULLIF(SUM(p.total_submissions), 0) * 100, 1
    ) AS overall_acceptance_rate
FROM problems p
WHERE (p.tenant_id = $1 OR p.scope = 'public')
  AND NOT p.is_deleted
GROUP BY p.difficulty
ORDER BY
    CASE p.difficulty
        WHEN 'easy'   THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard'   THEN 3
    END;

-- ANALYTICS-05: Top 20 students leaderboard for institution
-- [PARAM] $1=tenant_id
SELECT
    u.id,
    u.name,
    u.avatar_url,
    us.total_problems_solved,
    us.easy_solved,
    us.medium_solved,
    us.hard_solved,
    us.total_score,
    us.current_streak_days,
    us.max_streak_days,
    us.last_submission_date,
    RANK() OVER (ORDER BY us.total_score DESC, us.total_problems_solved DESC) AS rank
FROM user_stats us
JOIN users u ON u.id = us.user_id
WHERE us.tenant_id   = $1
  AND u.is_active    = TRUE
  AND u.is_deleted   = FALSE
  AND u.role         = 'institution_student'
ORDER BY rank
LIMIT 20;

-- ANALYTICS-06: Global public leaderboard (general students + institution students on public problems)
SELECT
    u.id,
    u.name,
    u.avatar_url,
    us.total_problems_solved,
    us.total_score,
    us.current_streak_days,
    us.last_submission_date,
    RANK() OVER (ORDER BY us.total_score DESC) AS global_rank
FROM user_stats us
JOIN users u ON u.id = us.user_id
WHERE us.tenant_id IS NULL    -- Global stats row (tenant_id = NULL)
  AND u.is_active   = TRUE
  AND u.is_deleted  = FALSE
ORDER BY global_rank
LIMIT 100;

-- ANALYTICS-07: Submission activity per language (for admin insight)
-- [PARAM] $1=tenant_id, $2=days_back
SELECT
    language_id,
    COUNT(*)                                           AS total_submissions,
    COUNT(*) FILTER (WHERE verdict = 'accepted')       AS accepted,
    ROUND(AVG(runtime_ms))                             AS avg_runtime_ms,
    ROUND(
        COUNT(*) FILTER (WHERE verdict = 'accepted')::NUMERIC /
        COUNT(*)::NUMERIC * 100, 1
    ) AS acceptance_rate
FROM submissions
WHERE tenant_id  = $1
  AND created_at >= NOW() - ($2 || ' days')::INTERVAL
GROUP BY language_id
ORDER BY total_submissions DESC;


-- =============================================================================
-- MODULE: USER PROGRESS
-- =============================================================================

-- PROGRESS-01: Upsert user progress for a chapter (called when student opens chapter)
-- [PARAM] $1=user_id, $2=chapter_id, $3=tenant_id, $4=problems_solved, $5=problems_total
INSERT INTO user_progress (
    user_id, chapter_id, tenant_id,
    problems_solved, problems_total,
    completion_percent, is_completed, last_accessed_at
)
VALUES (
    $1, $2, $3, $4, $5,
    CASE WHEN $5 = 0 THEN 0 ELSE ROUND(($4::NUMERIC / $5) * 100, 2) END,
    ($4 >= $5 AND $5 > 0),
    NOW()
)
ON CONFLICT (user_id, chapter_id) DO UPDATE SET
    problems_solved    = GREATEST(user_progress.problems_solved, $4),
    problems_total     = $5,
    completion_percent = CASE
        WHEN $5 = 0 THEN 0
        ELSE ROUND((GREATEST(user_progress.problems_solved, $4)::NUMERIC / $5) * 100, 2)
    END,
    is_completed       = (GREATEST(user_progress.problems_solved, $4) >= $5 AND $5 > 0),
    completed_at       = CASE
        WHEN (GREATEST(user_progress.problems_solved, $4) >= $5 AND $5 > 0)
             AND user_progress.completed_at IS NULL
        THEN NOW()
        ELSE user_progress.completed_at
    END,
    last_accessed_at   = NOW(),
    updated_at         = NOW()
RETURNING id, completion_percent, is_completed;


-- =============================================================================
-- MODULE: AUDIT LOGS
-- =============================================================================

-- AUDIT-01: Write an audit log entry (append-only)
-- [PARAM] $1=user_id, $2=tenant_id, $3=action, $4=resource_type, $5=resource_id,
--         $6=old_data (JSONB), $7=new_data (JSONB), $8=ip_address, $9=user_agent, $10=request_id
INSERT INTO audit_logs (
    user_id, tenant_id, action, resource_type, resource_id,
    old_data, new_data, ip_address, user_agent, request_id
)
VALUES (
    $1, $2, $3, $4, $5::UUID,
    $6::JSONB, $7::JSONB, $8::INET, $9, $10::UUID
);

-- AUDIT-02: Query audit logs for a resource
-- [PARAM] $1=resource_type, $2=resource_id, $3=limit
SELECT
    al.id,
    al.action,
    al.old_data,
    al.new_data,
    al.ip_address,
    al.created_at,
    u.name  AS user_name,
    u.email AS user_email,
    u.role  AS user_role
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.resource_type = $1
  AND al.resource_id   = $2::UUID
ORDER BY al.created_at DESC
LIMIT $3;


-- =============================================================================
-- MODULE: NOTIFICATIONS
-- =============================================================================

-- NOTIF-01: Create notification for a user
-- [PARAM] $1=user_id, $2=type, $3=title, $4=message, $5=action_url, $6=metadata
INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
VALUES ($1, $2::notification_type, $3, $4, $5, $6::JSONB);

-- NOTIF-02: Get unread notifications for user (inbox)
-- [PARAM] $1=user_id, $2=limit
SELECT
    id, type, title, message, action_url, is_read, metadata, created_at
FROM notifications
WHERE user_id  = $1
  AND is_read  = FALSE
ORDER BY created_at DESC
LIMIT $2;

-- NOTIF-03: Mark notifications as read
-- [PARAM] $1=user_id, $2=array of notification IDs (NULL = mark all)
UPDATE notifications
SET is_read = TRUE
WHERE user_id = $1
  AND ($2::UUID[] IS NULL OR id = ANY($2::UUID[]));

-- NOTIF-04: Bulk notify all students in tenant (e.g., new course published)
-- [PARAM] $1=tenant_id, $2=type, $3=title, $4=message, $5=action_url
INSERT INTO notifications (user_id, type, title, message, action_url)
SELECT
    u.id, $2::notification_type, $3, $4, $5
FROM users u
WHERE u.tenant_id   = $1
  AND u.role        = 'institution_student'
  AND u.is_active   = TRUE
  AND u.is_deleted  = FALSE;


-- =============================================================================
-- MODULE: BLOG / CMS
-- =============================================================================

-- BLOG-01: List published blog posts (with pagination and category filter)
-- [PARAM] $1=category_slug (NULL=all), $2=tag (NULL=all), $3=limit, $4=offset
SELECT
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.cover_image_url,
    bp.tags,
    bp.read_time_minutes,
    bp.view_count,
    bp.published_at,
    bp.is_featured,
    u.name  AS author_name,
    bc.name AS category_name,
    bc.slug AS category_slug
FROM blog_posts bp
JOIN users          u  ON u.id  = bp.author_id
LEFT JOIN blog_categories bc ON bc.id = bp.category_id
WHERE bp.status     = 'published'
  AND ($1::TEXT IS NULL OR bc.slug = $1)
  AND ($2::TEXT IS NULL OR bp.tags @> ARRAY[$2])
ORDER BY bp.is_featured DESC, bp.published_at DESC
LIMIT  $3
OFFSET $4;

-- BLOG-02: Get single blog post by slug (and increment view count)
-- [PARAM] $1=slug
WITH updated AS (
    UPDATE blog_posts SET view_count = view_count + 1
    WHERE slug = $1 AND status = 'published'
    RETURNING *
)
SELECT
    up.*,
    u.name AS author_name,
    u.avatar_url AS author_avatar,
    bc.name AS category_name
FROM updated up
JOIN users u ON u.id = up.author_id
LEFT JOIN blog_categories bc ON bc.id = up.category_id;


-- =============================================================================
-- MODULE: MAINTENANCE
-- =============================================================================

-- MAINT-01: Clean up expired and revoked refresh tokens (run daily via cron)
DELETE FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '1 day';

-- MAINT-02: Soft-purge: Hard delete soft-deleted records older than 90 days
-- (Run weekly — only for records already soft-deleted)
DELETE FROM users    WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '90 days';
DELETE FROM courses  WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '90 days';
DELETE FROM problems WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '90 days';

-- MAINT-03: Recalculate institution leaderboard ranks (run daily via pg_cron or cron job)
-- [PARAM] $1=tenant_id
WITH ranked AS (
    SELECT
        user_id,
        RANK() OVER (
            ORDER BY total_score DESC, total_problems_solved DESC
        ) AS new_rank
    FROM user_stats
    WHERE tenant_id = $1
)
UPDATE user_stats us
SET rank_institution = r.new_rank, updated_at = NOW()
FROM ranked r
WHERE us.user_id = r.user_id AND us.tenant_id = $1;

-- MAINT-04: Recalculate global leaderboard ranks
UPDATE user_stats us
SET rank_global = r.new_rank, updated_at = NOW()
FROM (
    SELECT
        user_id,
        RANK() OVER (ORDER BY total_score DESC) AS new_rank
    FROM user_stats
    WHERE tenant_id IS NULL
) r
WHERE us.user_id = r.user_id AND us.tenant_id IS NULL;

-- MAINT-05: Database health check (run after deployments)
SELECT
    schemaname,
    tablename,
    n_live_tup     AS live_rows,
    n_dead_tup     AS dead_rows,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- =============================================================================
-- END OF QUERY LIBRARY
-- =============================================================================
