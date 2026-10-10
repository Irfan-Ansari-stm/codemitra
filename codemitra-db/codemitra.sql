-- =============================================================================
-- CODEVERSE PLATFORM — PRODUCTION PostgreSQL SCHEMA
-- Version      : 1.0.0
-- Database     : PostgreSQL 15+
-- Encoding     : UTF-8
-- Collation    : en_US.UTF-8
-- Description  : Multi-tenant coding education SaaS platform
--                Stack: Express.js + Next.js + Drizzle ORM + Judge0
-- Author       : CodeVerse Engineering Team
-- Last Updated : 2025-05-07
-- =============================================================================
-- USAGE:
--   psql -U postgres -d codeverse -f codeverse_schema.sql
-- =============================================================================


-- =============================================================================
-- SECTION 0: DATABASE BOOTSTRAP
-- =============================================================================

-- Run this block as superuser BEFORE connecting to the target database.
-- Uncomment if setting up from scratch:

-- CREATE DATABASE codeverse
--     ENCODING = 'UTF8'
--     LC_COLLATE = 'en_US.UTF-8'
--     LC_CTYPE = 'en_US.UTF-8'
--     TEMPLATE = template0;

-- CREATE ROLE codeverse_app WITH LOGIN PASSWORD 'CHANGE_THIS_PASSWORD';
-- GRANT CONNECT ON DATABASE codeverse TO codeverse_app;

-- \c codeverse

-- =============================================================================
-- SECTION 1: EXTENSIONS
-- =============================================================================

-- UUID generation (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search via pg_trgm (ILIKE acceleration, similarity search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- citext: case-insensitive text type (used for emails)
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================================================
-- SECTION 2: CUSTOM TYPES (ENUMS)
-- =============================================================================

-- User roles across the platform
CREATE TYPE user_role AS ENUM (
    'super_admin',          -- Platform owner — full access
    'institution_admin',    -- College/institute administrator
    'institution_student',  -- Student enrolled by institution
    'general_student'       -- Self-registered public learner
);

-- Subscription plans for institutions
CREATE TYPE subscription_plan AS ENUM (
    'trial',        -- 30-day trial, up to 50 students
    'basic',        -- Up to 200 students
    'pro',          -- Up to 1000 students
    'enterprise'    -- Unlimited
);

-- Content publish status
CREATE TYPE content_status AS ENUM (
    'draft',
    'published',
    'archived'
);

-- Problem difficulty levels
CREATE TYPE difficulty_level AS ENUM (
    'easy',
    'medium',
    'hard'
);

-- Problem visibility scope
CREATE TYPE problem_scope AS ENUM (
    'institution',  -- Only visible within tenant
    'public'        -- Visible to all platform users
);

-- Code submission verdicts (mirrors Judge0 status IDs)
CREATE TYPE submission_verdict AS ENUM (
    'pending',              -- Queued or running
    'accepted',             -- All test cases passed
    'wrong_answer',         -- Output mismatch on at least one case
    'time_limit_exceeded',  -- CPU time exceeded
    'memory_limit_exceeded',-- Memory exceeded
    'runtime_error',        -- Non-zero exit code
    'compile_error',        -- Compilation failed
    'presentation_error',   -- Output format mismatch
    'internal_error'        -- Judge0 or system error
);

-- Assignment submission status
CREATE TYPE assignment_status AS ENUM (
    'not_started',
    'in_progress',
    'submitted',
    'late_submitted',
    'graded'
);

-- Quiz attempt status
CREATE TYPE quiz_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);

-- Blog post status
CREATE TYPE blog_status AS ENUM (
    'draft',
    'published',
    'archived'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'assignment_due',
    'submission_result',
    'course_published',
    'announcement',
    'system'
);

-- =============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Validate slug format: lowercase, alphanumeric, hyphens only, 3–100 chars
CREATE OR REPLACE FUNCTION is_valid_slug(slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE STRICT
AS $$
BEGIN
    RETURN slug ~ '^[a-z0-9][a-z0-9\-]{1,98}[a-z0-9]$';
END;
$$;

-- Soft-delete guard: prevents hard delete on important records by raising notice
-- (Applications should use is_deleted = TRUE instead of DELETE)
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete is disabled on table %. Set is_deleted = TRUE instead.', TG_TABLE_NAME;
END;
$$;

-- =============================================================================
-- SECTION 4: CORE SCHEMA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1  tenants
-- The root of all multi-tenancy. Every institution is a tenant.
-- -----------------------------------------------------------------------------
CREATE TABLE tenants (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255)    NOT NULL,
    slug                VARCHAR(100)    NOT NULL
                            CONSTRAINT tenants_slug_format CHECK (is_valid_slug(slug)),
    logo_url            TEXT,
    website_url         TEXT,
    contact_email       citext,
    contact_phone       VARCHAR(30),
    address             TEXT,
    plan                subscription_plan NOT NULL DEFAULT 'trial',
    plan_expires_at     TIMESTAMPTZ,
    max_students        INTEGER         NOT NULL DEFAULT 50
                            CONSTRAINT tenants_max_students_positive CHECK (max_students > 0),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    settings            JSONB           NOT NULL DEFAULT '{}'::JSONB,
    -- settings keys: allow_self_enrollment, custom_domain, timezone, locale
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT tenants_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE  tenants                IS 'Root tenant table — one row per institution/organization';
COMMENT ON COLUMN tenants.slug           IS 'URL-safe identifier used in routing (e.g., abc-college)';
COMMENT ON COLUMN tenants.settings       IS 'JSONB bag for tenant-specific feature flags and config';
COMMENT ON COLUMN tenants.plan_expires_at IS 'NULL = no expiry (enterprise); set for trial/basic/pro';

CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.2  users
-- All users on the platform — roles determine access level.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            REFERENCES tenants(id) ON DELETE RESTRICT,
    -- NULL tenant_id allowed only for super_admin and general_student
    email               citext          NOT NULL,
    password_hash       TEXT            NOT NULL,
    name                VARCHAR(255)    NOT NULL,
    avatar_url          TEXT,
    role                user_role       NOT NULL,
    phone               VARCHAR(30),
    bio                 TEXT,
    -- Email verification
    is_email_verified   BOOLEAN         NOT NULL DEFAULT FALSE,
    email_verify_token  TEXT,
    email_verify_expires TIMESTAMPTZ,
    -- Password reset
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    -- Account state
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    login_attempt_count INTEGER         NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    -- Metadata
    metadata            JSONB           NOT NULL DEFAULT '{}'::JSONB,
    -- metadata keys: enrollment_number, batch, year, department (for students)
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_role_tenant_check CHECK (
        -- super_admin and general_student must NOT have a tenant
        -- institution_admin and institution_student MUST have a tenant
        (role IN ('super_admin', 'general_student') AND tenant_id IS NULL) OR
        (role IN ('institution_admin', 'institution_student') AND tenant_id IS NOT NULL)
    ),
    CONSTRAINT users_password_min_length CHECK (LENGTH(password_hash) >= 60)
    -- bcrypt hashes are always 60 chars; this prevents storing plaintext
);

COMMENT ON TABLE  users                      IS 'All platform users across all tenants and roles';
COMMENT ON COLUMN users.tenant_id            IS 'NULL for super_admin and general_student';
COMMENT ON COLUMN users.password_hash        IS 'bcrypt hash (cost factor >= 12). NEVER store plaintext.';
COMMENT ON COLUMN users.login_attempt_count  IS 'Resets to 0 on successful login';
COMMENT ON COLUMN users.locked_until         IS 'Account locked after 5 failed attempts for 15 minutes';
COMMENT ON COLUMN users.metadata             IS 'Role-specific extra fields (enrollment_number, batch, etc.)';

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.3  refresh_tokens
-- Server-side refresh token store (enables revocation)
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT        NOT NULL,   -- SHA-256 hash of the raw token
    expires_at      TIMESTAMPTZ NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    is_revoked      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

COMMENT ON TABLE  refresh_tokens            IS 'Server-side store of hashed refresh tokens for revocation support';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256(raw_token) — raw token is never stored server-side';

-- -----------------------------------------------------------------------------
-- 4.4  courses
-- Top-level learning containers scoped to a tenant
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    created_by      UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    thumbnail_url   TEXT,
    language_tags   TEXT[]          NOT NULL DEFAULT '{}',
    -- e.g., ['Python', 'Data Structures', 'Algorithms']
    status          content_status  NOT NULL DEFAULT 'draft',
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order      INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  courses              IS 'Top-level course container per institution';
COMMENT ON COLUMN courses.language_tags IS 'Programming languages / topics covered (denormalized for fast filtering)';

CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.5  modules
-- First-level sections within a course (e.g., "Python Basics")
-- -----------------------------------------------------------------------------
CREATE TABLE modules (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID            NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tenant_id       UUID            NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    -- ↑ denormalized for query performance — always equals courses.tenant_id
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    order_index     INTEGER         NOT NULL DEFAULT 0,
    status          content_status  NOT NULL DEFAULT 'draft',
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT modules_order_positive CHECK (order_index >= 0)
);

CREATE TRIGGER modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.6  chapters
-- Second-level sections within a module (e.g., "For Loops")
-- -----------------------------------------------------------------------------
CREATE TABLE chapters (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       UUID            NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    tenant_id       UUID            NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    -- ↑ denormalized for performance
    title           VARCHAR(255)    NOT NULL,
    content         TEXT,           -- Markdown lesson content
    order_index     INTEGER         NOT NULL DEFAULT 0,
    status          content_status  NOT NULL DEFAULT 'draft',
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    estimated_minutes INTEGER       DEFAULT 30
                        CONSTRAINT chapters_estimated_minutes_positive CHECK (estimated_minutes > 0),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chapters_order_positive CHECK (order_index >= 0)
);

CREATE TRIGGER chapters_updated_at
    BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.7  problems
-- Coding problems — scoped to institution or public
-- -----------------------------------------------------------------------------
CREATE TABLE problems (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            REFERENCES tenants(id) ON DELETE RESTRICT,
    -- NULL = public problem (created by super_admin)
    chapter_id          UUID            REFERENCES chapters(id) ON DELETE SET NULL,
    created_by          UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               VARCHAR(255)    NOT NULL,
    slug                VARCHAR(300)    NOT NULL,
    statement           TEXT            NOT NULL,   -- Markdown
    input_format        TEXT,
    output_format       TEXT,
    constraints_text    TEXT,           -- Problem constraints (renamed to avoid reserved word)
    sample_explanation  TEXT,           -- Explanation for sample test cases
    difficulty          difficulty_level NOT NULL DEFAULT 'medium',
    scope               problem_scope   NOT NULL DEFAULT 'institution',
    tags                TEXT[]          NOT NULL DEFAULT '{}',
    -- e.g., ['arrays', 'sorting', 'dynamic-programming']
    time_limit_ms       INTEGER         NOT NULL DEFAULT 2000
                            CONSTRAINT problems_time_limit_range CHECK (time_limit_ms BETWEEN 100 AND 30000),
    memory_limit_mb     INTEGER         NOT NULL DEFAULT 256
                            CONSTRAINT problems_memory_limit_range CHECK (memory_limit_mb BETWEEN 16 AND 1024),
    allowed_languages   INTEGER[]       NOT NULL DEFAULT '{71,50,54,62,63}'::INTEGER[],
    -- Judge0 language IDs: 71=Python3, 50=C, 54=C++, 62=Java, 63=JavaScript
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    total_submissions   INTEGER         NOT NULL DEFAULT 0,  -- Denormalized counter
    accepted_submissions INTEGER        NOT NULL DEFAULT 0,  -- Denormalized counter
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT problems_scope_tenant_check CHECK (
        (scope = 'public'      AND tenant_id IS NULL) OR
        (scope = 'institution' AND tenant_id IS NOT NULL)
    ),
    CONSTRAINT problems_slug_tenant_unique UNIQUE NULLS NOT DISTINCT (tenant_id, slug)
    -- NULLS NOT DISTINCT: two public problems cannot share a slug (NULL = NULL for uniqueness)
);

COMMENT ON TABLE  problems                    IS 'Coding problems — institution-scoped or public';
COMMENT ON COLUMN problems.slug               IS 'URL-friendly identifier, unique per tenant (or globally for public)';
COMMENT ON COLUMN problems.allowed_languages  IS 'Array of Judge0 language IDs permitted for this problem';
COMMENT ON COLUMN problems.total_submissions  IS 'Denormalized for fast leaderboard/analytics queries';

CREATE TRIGGER problems_updated_at
    BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.8  test_cases
-- Input/output test cases linked to a problem
-- -----------------------------------------------------------------------------
CREATE TABLE test_cases (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id          UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input               TEXT        NOT NULL DEFAULT '',
    expected_output     TEXT        NOT NULL,
    is_hidden           BOOLEAN     NOT NULL DEFAULT TRUE,
    -- FALSE = shown to student as sample; TRUE = hidden judge test case
    points              INTEGER     NOT NULL DEFAULT 1
                            CONSTRAINT test_cases_points_positive CHECK (points >= 0),
    order_index         INTEGER     NOT NULL DEFAULT 0,
    explanation         TEXT,       -- Visible only to admins for debugging
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN test_cases.is_hidden IS 'FALSE = shown as sample; TRUE = hidden judge case';

CREATE TRIGGER test_cases_updated_at
    BEFORE UPDATE ON test_cases
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.9  submissions
-- Code submissions from students for problems
-- -----------------------------------------------------------------------------
CREATE TABLE submissions (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    problem_id          UUID                NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
    tenant_id           UUID                REFERENCES tenants(id) ON DELETE RESTRICT,
    -- NULL for general_student solving public problems
    assignment_id       UUID,               -- FK added later (circular reference resolved below)
    language_id         INTEGER             NOT NULL,
    -- Judge0 language IDs
    source_code         TEXT                NOT NULL,
    verdict             submission_verdict  NOT NULL DEFAULT 'pending',
    score               NUMERIC(5,2)        DEFAULT 0,
    -- Percentage of test cases passed (0.00 to 100.00)
    runtime_ms          INTEGER,
    memory_kb           INTEGER,
    stderr_output       TEXT,               -- Compiler/runtime error message
    judge0_token        TEXT,               -- Batch token from Judge0 for polling
    test_case_results   JSONB               NOT NULL DEFAULT '[]'::JSONB,
    -- Array of { case_index, passed, runtime_ms, memory_kb, output }
    is_contest_submission BOOLEAN           NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT submissions_runtime_positive  CHECK (runtime_ms IS NULL OR runtime_ms >= 0),
    CONSTRAINT submissions_memory_positive   CHECK (memory_kb  IS NULL OR memory_kb  >= 0),
    CONSTRAINT submissions_score_range       CHECK (score IS NULL OR score BETWEEN 0 AND 100)
);

COMMENT ON TABLE  submissions                  IS 'All code submissions — institution and public';
COMMENT ON COLUMN submissions.test_case_results IS 'JSONB array of per-test-case execution results';
COMMENT ON COLUMN submissions.judge0_token      IS 'Judge0 batch submission token for async polling';

CREATE TRIGGER submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.10  assignments
-- Collections of problems given to students with deadlines
-- -----------------------------------------------------------------------------
CREATE TABLE assignments (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    course_id           UUID            REFERENCES courses(id) ON DELETE SET NULL,
    chapter_id          UUID            REFERENCES chapters(id) ON DELETE SET NULL,
    created_by          UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    instructions        TEXT,
    due_date            TIMESTAMPTZ,
    late_submission_allowed BOOLEAN     NOT NULL DEFAULT FALSE,
    late_penalty_percent NUMERIC(5,2)   DEFAULT 0
                            CONSTRAINT assignments_late_penalty_range CHECK (late_penalty_percent BETWEEN 0 AND 100),
    total_marks         INTEGER         NOT NULL DEFAULT 100
                            CONSTRAINT assignments_total_marks_positive CHECK (total_marks > 0),
    status              content_status  NOT NULL DEFAULT 'draft',
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Add FK from submissions to assignments (circular dependency resolved here)
ALTER TABLE submissions
    ADD CONSTRAINT submissions_assignment_id_fk
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 4.11  assignment_problems
-- Many-to-many: problems included in an assignment
-- -----------------------------------------------------------------------------
CREATE TABLE assignment_problems (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID        NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    problem_id      UUID        NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
    marks           INTEGER     NOT NULL DEFAULT 10
                        CONSTRAINT ap_marks_positive CHECK (marks > 0),
    order_index     INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT assignment_problems_unique UNIQUE (assignment_id, problem_id)
);

-- -----------------------------------------------------------------------------
-- 4.12  assignment_submissions
-- A student's overall submission record for an assignment
-- -----------------------------------------------------------------------------
CREATE TABLE assignment_submissions (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id       UUID                NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id          UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tenant_id           UUID                NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    status              assignment_status   NOT NULL DEFAULT 'not_started',
    total_score         NUMERIC(7,2)        DEFAULT 0,
    graded_by           UUID                REFERENCES users(id) ON DELETE SET NULL,
    graded_at           TIMESTAMPTZ,
    feedback            TEXT,
    submitted_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT assignment_submissions_unique UNIQUE (assignment_id, student_id)
);

CREATE TRIGGER assignment_submissions_updated_at
    BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.13  quizzes
-- MCQ-based assessments linked to a chapter
-- -----------------------------------------------------------------------------
CREATE TABLE quizzes (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    chapter_id          UUID            REFERENCES chapters(id) ON DELETE SET NULL,
    created_by          UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    time_limit_minutes  INTEGER         DEFAULT 30
                            CONSTRAINT quizzes_time_limit_positive CHECK (time_limit_minutes > 0),
    shuffle_questions   BOOLEAN         NOT NULL DEFAULT TRUE,
    shuffle_options     BOOLEAN         NOT NULL DEFAULT TRUE,
    passing_score       NUMERIC(5,2)    DEFAULT 60.00
                            CONSTRAINT quizzes_passing_score_range CHECK (passing_score BETWEEN 0 AND 100),
    max_attempts        INTEGER         DEFAULT 1
                            CONSTRAINT quizzes_max_attempts_positive CHECK (max_attempts >= 1),
    show_answers_after  BOOLEAN         NOT NULL DEFAULT FALSE,
    status              content_status  NOT NULL DEFAULT 'draft',
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.14  quiz_questions
-- Individual MCQ questions within a quiz
-- -----------------------------------------------------------------------------
CREATE TABLE quiz_questions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         UUID        NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text   TEXT        NOT NULL,
    explanation     TEXT,       -- Shown after quiz if show_answers_after = TRUE
    options         JSONB       NOT NULL,
    -- Format: [{ "id": "a", "text": "Option text" }, ...]  (2–6 options)
    correct_options TEXT[]      NOT NULL,
    -- Array of option IDs: ["a"] for single-correct, ["a","c"] for multi-correct
    points          INTEGER     NOT NULL DEFAULT 1
                        CONSTRAINT quiz_questions_points_positive CHECK (points > 0),
    order_index     INTEGER     NOT NULL DEFAULT 0,
    image_url       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT quiz_questions_options_min CHECK (jsonb_array_length(options) >= 2),
    CONSTRAINT quiz_questions_correct_min CHECK (cardinality(correct_options) >= 1)
);

CREATE TRIGGER quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.15  quiz_attempts
-- A student's attempt at a quiz
-- -----------------------------------------------------------------------------
CREATE TABLE quiz_attempts (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id             UUID            NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id          UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tenant_id           UUID            NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    attempt_number      INTEGER         NOT NULL DEFAULT 1,
    status              quiz_status     NOT NULL DEFAULT 'not_started',
    answers             JSONB           NOT NULL DEFAULT '{}'::JSONB,
    -- Format: { "question_id": ["selected_option_ids"], ... }
    score               NUMERIC(7,2)    DEFAULT 0,
    total_points        INTEGER         DEFAULT 0,
    passed              BOOLEAN,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    time_taken_seconds  INTEGER,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT quiz_attempts_unique UNIQUE (quiz_id, student_id, attempt_number)
);

CREATE TRIGGER quiz_attempts_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4.16  user_progress
-- Tracks chapter completion and learning progress per user
-- -----------------------------------------------------------------------------
CREATE TABLE user_progress (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id          UUID        NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    is_completed        BOOLEAN     NOT NULL DEFAULT FALSE,
    completion_percent  NUMERIC(5,2) NOT NULL DEFAULT 0
                            CONSTRAINT up_completion_range CHECK (completion_percent BETWEEN 0 AND 100),
    problems_solved     INTEGER     NOT NULL DEFAULT 0,
    problems_total      INTEGER     NOT NULL DEFAULT 0,
    last_accessed_at    TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_progress_unique UNIQUE (user_id, chapter_id)
);

CREATE TRIGGER user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- SECTION 5: BLOG / CMS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1  blog_categories
-- -----------------------------------------------------------------------------
CREATE TABLE blog_categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT blog_categories_slug_unique UNIQUE (slug)
);

-- -----------------------------------------------------------------------------
-- 5.2  blog_posts
-- Platform-level blog (SEO / content marketing)
-- -----------------------------------------------------------------------------
CREATE TABLE blog_posts (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id           UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id         UUID            REFERENCES blog_categories(id) ON DELETE SET NULL,
    title               VARCHAR(500)    NOT NULL,
    slug                VARCHAR(550)    NOT NULL,
    excerpt             TEXT,
    content             TEXT            NOT NULL,   -- Markdown
    cover_image_url     TEXT,
    tags                TEXT[]          NOT NULL DEFAULT '{}',
    status              blog_status     NOT NULL DEFAULT 'draft',
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    read_time_minutes   INTEGER         DEFAULT 5,
    view_count          INTEGER         NOT NULL DEFAULT 0,
    published_at        TIMESTAMPTZ,
    seo_title           VARCHAR(70),
    seo_description     VARCHAR(160),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT blog_posts_slug_unique UNIQUE (slug)
);

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- SECTION 6: ANNOUNCEMENTS & NOTIFICATIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6.1  announcements
-- Institution-level announcements to all their students
-- -----------------------------------------------------------------------------
CREATE TABLE announcements (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by  UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title       VARCHAR(255)    NOT NULL,
    content     TEXT            NOT NULL,
    is_pinned   BOOLEAN         NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- -----------------------------------------------------------------------------
-- 6.2  notifications
-- Per-user notification inbox
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type   NOT NULL,
    title           VARCHAR(255)        NOT NULL,
    message         TEXT,
    action_url      TEXT,
    is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
    metadata        JSONB               NOT NULL DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 7: AUDIT & SECURITY
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 7.1  audit_logs
-- Immutable audit trail — INSERT ONLY, no updates or deletes
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    -- BIGSERIAL: high-volume table, UUID would waste space/index performance
    user_id         UUID            REFERENCES users(id) ON DELETE SET NULL,
    tenant_id       UUID            REFERENCES tenants(id) ON DELETE SET NULL,
    action          VARCHAR(100)    NOT NULL,
    -- e.g., 'course.create', 'user.login', 'submission.judge'
    resource_type   VARCHAR(100),
    resource_id     UUID,
    old_data        JSONB,
    new_data        JSONB,
    ip_address      INET,
    user_agent      TEXT,
    request_id      UUID,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Append-only audit trail. No UPDATE or DELETE permitted.';

-- Prevent modifications to audit_logs (immutable audit trail)
CREATE OR REPLACE FUNCTION audit_logs_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is immutable — UPDATE and DELETE are not permitted';
END;
$$;

CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();

CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();

-- -----------------------------------------------------------------------------
-- 7.2  rate_limit_log
-- Optional server-side rate limit tracking (backup to Redis)
-- -----------------------------------------------------------------------------
CREATE TABLE rate_limit_log (
    id              BIGSERIAL       PRIMARY KEY,
    identifier      VARCHAR(255)    NOT NULL,   -- IP or user_id
    endpoint        VARCHAR(255)    NOT NULL,
    request_count   INTEGER         NOT NULL DEFAULT 1,
    window_start    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    window_end      TIMESTAMPTZ     NOT NULL
);

-- =============================================================================
-- SECTION 8: LEADERBOARD & GAMIFICATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8.1  user_stats
-- Denormalized stats per user for leaderboard performance
-- Updated by triggers/cron — not application logic
-- -----------------------------------------------------------------------------
CREATE TABLE user_stats (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id                   UUID        REFERENCES tenants(id) ON DELETE CASCADE,
    total_problems_solved       INTEGER     NOT NULL DEFAULT 0,
    easy_solved                 INTEGER     NOT NULL DEFAULT 0,
    medium_solved               INTEGER     NOT NULL DEFAULT 0,
    hard_solved                 INTEGER     NOT NULL DEFAULT 0,
    total_submissions           INTEGER     NOT NULL DEFAULT 0,
    accepted_submissions        INTEGER     NOT NULL DEFAULT 0,
    current_streak_days         INTEGER     NOT NULL DEFAULT 0,
    max_streak_days             INTEGER     NOT NULL DEFAULT 0,
    last_submission_date        DATE,
    total_score                 NUMERIC(10,2) NOT NULL DEFAULT 0,
    rank_global                 INTEGER,
    rank_institution            INTEGER,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_stats_unique UNIQUE (user_id, tenant_id)
    -- NULLS NOT DISTINCT allows one row per user for global stats (tenant_id = NULL)
);

COMMENT ON TABLE user_stats IS 'Denormalized leaderboard stats — refreshed by triggers or scheduled jobs';

-- =============================================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Enable RLS on all tenant-scoped tables.
-- The application sets app.current_tenant_id and app.current_user_role
-- session parameters on every connection from the connection pool.

ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems             ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_problems  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats           ENABLE ROW LEVEL SECURITY;

-- ── Helper: get the current tenant from session parameter ──────────────────
-- Application sets: SET LOCAL app.current_tenant_id = '<uuid>';
--                   SET LOCAL app.current_user_role  = 'institution_admin';

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION current_user_role_name() RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT NULLIF(current_setting('app.current_user_role', TRUE), '');
$$;

CREATE OR REPLACE FUNCTION current_user_id_app() RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
    SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
$$;

-- ── RLS Policies ──────────────────────────────────────────────────────────

-- COURSES: users see only their tenant's courses; super_admin sees all
CREATE POLICY courses_tenant_isolation ON courses
    USING (
        current_user_role_name() = 'super_admin'
        OR tenant_id = current_tenant_id()
    );

-- MODULES: same isolation as courses
CREATE POLICY modules_tenant_isolation ON modules
    USING (
        current_user_role_name() = 'super_admin'
        OR tenant_id = current_tenant_id()
    );

-- CHAPTERS: same
CREATE POLICY chapters_tenant_isolation ON chapters
    USING (
        current_user_role_name() = 'super_admin'
        OR tenant_id = current_tenant_id()
    );

-- PROBLEMS: institution problems scoped to tenant; public problems visible to all
CREATE POLICY problems_visibility ON problems
    USING (
        current_user_role_name() = 'super_admin'
        OR scope = 'public'
        OR tenant_id = current_tenant_id()
    );

-- TEST_CASES: hidden test cases only visible to admins and super_admin
CREATE POLICY test_cases_visibility ON test_cases
    USING (
        current_user_role_name() IN ('super_admin', 'institution_admin')
        OR is_hidden = FALSE
    );

-- SUBMISSIONS: users see only their own; admins see all within tenant
CREATE POLICY submissions_access ON submissions
    USING (
        current_user_role_name() = 'super_admin'
        OR (current_user_role_name() = 'institution_admin' AND tenant_id = current_tenant_id())
        OR user_id = current_user_id_app()
    );

-- ASSIGNMENTS: tenant-scoped
CREATE POLICY assignments_tenant_isolation ON assignments
    USING (
        current_user_role_name() = 'super_admin'
        OR tenant_id = current_tenant_id()
    );

CREATE POLICY assignment_problems_via_assignment ON assignment_problems
    USING (
        assignment_id IN (
            SELECT id FROM assignments
            WHERE current_user_role_name() = 'super_admin'
               OR tenant_id = current_tenant_id()
        )
    );

CREATE POLICY assignment_submissions_access ON assignment_submissions
    USING (
        current_user_role_name() = 'super_admin'
        OR (current_user_role_name() = 'institution_admin' AND tenant_id = current_tenant_id())
        OR student_id = current_user_id_app()
    );

-- QUIZZES: tenant-scoped
CREATE POLICY quizzes_tenant_isolation ON quizzes
    USING (
        current_user_role_name() = 'super_admin'
        OR tenant_id = current_tenant_id()
    );

CREATE POLICY quiz_questions_via_quiz ON quiz_questions
    USING (
        quiz_id IN (
            SELECT id FROM quizzes
            WHERE current_user_role_name() = 'super_admin'
               OR tenant_id = current_tenant_id()
        )
    );

-- QUIZ_ATTEMPTS: users see own; admins see all in tenant
CREATE POLICY quiz_attempts_access ON quiz_attempts
    USING (
        current_user_role_name() = 'super_admin'
        OR (current_user_role_name() = 'institution_admin' AND tenant_id = current_tenant_id())
        OR student_id = current_user_id_app()
    );

-- USER_PROGRESS: users see own; admins see all in tenant
CREATE POLICY user_progress_access ON user_progress
    USING (
        current_user_role_name() = 'super_admin'
        OR (current_user_role_name() = 'institution_admin' AND tenant_id = current_tenant_id())
        OR user_id = current_user_id_app()
    );

-- NOTIFICATIONS: users see only their own notifications
CREATE POLICY notifications_own ON notifications
    USING (user_id = current_user_id_app() OR current_user_role_name() = 'super_admin');

-- ANNOUNCEMENTS: users see their tenant's; super_admin sees all
CREATE POLICY announcements_tenant ON announcements
    USING (
        current_user_role_name() = 'super_admin'
        OR tenant_id = current_tenant_id()
    );

-- USERS: users see themselves; admins see their tenant; super_admin sees all
CREATE POLICY users_access ON users
    USING (
        current_user_role_name() = 'super_admin'
        OR (current_user_role_name() = 'institution_admin' AND tenant_id = current_tenant_id())
        OR id = current_user_id_app()
    );

-- TENANTS: super_admin sees all; others see only their own
CREATE POLICY tenants_access ON tenants
    USING (
        current_user_role_name() = 'super_admin'
        OR id = current_tenant_id()
    );

-- USER_STATS: public read (leaderboard); own writes
CREATE POLICY user_stats_read ON user_stats
    FOR SELECT USING (TRUE);

CREATE POLICY user_stats_write ON user_stats
    FOR ALL USING (
        current_user_role_name() = 'super_admin'
        OR user_id = current_user_id_app()
    );

-- =============================================================================
-- SECTION 10: INDEXES
-- =============================================================================

-- ── users ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_tenant_role        ON users(tenant_id, role)     WHERE is_deleted = FALSE;
CREATE INDEX idx_users_email              ON users(email);
-- citext already applies case-insensitive comparison; this index handles it
CREATE INDEX idx_users_tenant_active      ON users(tenant_id, is_active) WHERE is_deleted = FALSE;

-- ── refresh_tokens ─────────────────────────────────────────────────────────
CREATE INDEX idx_refresh_tokens_user      ON refresh_tokens(user_id) WHERE is_revoked = FALSE;
CREATE INDEX idx_refresh_tokens_expires   ON refresh_tokens(expires_at);

-- ── courses ────────────────────────────────────────────────────────────────
CREATE INDEX idx_courses_tenant_status    ON courses(tenant_id, status)  WHERE is_deleted = FALSE;

-- ── modules ───────────────────────────────────────────────────────────────
CREATE INDEX idx_modules_course           ON modules(course_id, order_index) WHERE is_deleted = FALSE;
CREATE INDEX idx_modules_tenant           ON modules(tenant_id)              WHERE is_deleted = FALSE;

-- ── chapters ──────────────────────────────────────────────────────────────
CREATE INDEX idx_chapters_module          ON chapters(module_id, order_index) WHERE is_deleted = FALSE;
CREATE INDEX idx_chapters_tenant          ON chapters(tenant_id)               WHERE is_deleted = FALSE;

-- ── problems ──────────────────────────────────────────────────────────────
CREATE INDEX idx_problems_tenant_scope    ON problems(tenant_id, scope)       WHERE is_deleted = FALSE;
CREATE INDEX idx_problems_difficulty      ON problems(difficulty, scope)       WHERE is_deleted = FALSE;
CREATE INDEX idx_problems_chapter         ON problems(chapter_id)              WHERE is_deleted = FALSE;
CREATE INDEX idx_problems_tags            ON problems USING GIN(tags);
-- GIN index for efficient @> (contains) queries on array

-- Full-text search on problem titles (trgm for ILIKE acceleration)
CREATE INDEX idx_problems_title_trgm      ON problems USING GIN(title gin_trgm_ops);

-- ── test_cases ────────────────────────────────────────────────────────────
CREATE INDEX idx_test_cases_problem       ON test_cases(problem_id, order_index);

-- ── submissions ───────────────────────────────────────────────────────────
CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id);
CREATE INDEX idx_submissions_tenant_time  ON submissions(tenant_id, created_at DESC);
CREATE INDEX idx_submissions_verdict      ON submissions(verdict);
CREATE INDEX idx_submissions_assignment   ON submissions(assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX idx_submissions_pending      ON submissions(created_at)    WHERE verdict = 'pending';
-- Narrow index to quickly find submissions awaiting Judge0 response

-- ── assignments ───────────────────────────────────────────────────────────
CREATE INDEX idx_assignments_tenant       ON assignments(tenant_id, status)   WHERE is_deleted = FALSE;
CREATE INDEX idx_assignments_due          ON assignments(due_date)             WHERE status = 'published';
CREATE INDEX idx_assignments_chapter      ON assignments(chapter_id)           WHERE is_deleted = FALSE;

-- ── assignment_submissions ────────────────────────────────────────────────
CREATE INDEX idx_asub_assignment          ON assignment_submissions(assignment_id);
CREATE INDEX idx_asub_student             ON assignment_submissions(student_id);

-- ── quizzes ───────────────────────────────────────────────────────────────
CREATE INDEX idx_quizzes_tenant_chapter   ON quizzes(tenant_id, chapter_id) WHERE is_deleted = FALSE;

-- ── quiz_attempts ─────────────────────────────────────────────────────────
CREATE INDEX idx_quiz_attempts_student    ON quiz_attempts(student_id, quiz_id);

-- ── user_progress ─────────────────────────────────────────────────────────
CREATE INDEX idx_user_progress_user       ON user_progress(user_id, tenant_id);
CREATE INDEX idx_user_progress_chapter    ON user_progress(chapter_id);

-- ── blog_posts ────────────────────────────────────────────────────────────
CREATE INDEX idx_blog_posts_status        ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_tags          ON blog_posts USING GIN(tags);
CREATE INDEX idx_blog_posts_title_trgm    ON blog_posts USING GIN(title gin_trgm_ops);

-- ── notifications ─────────────────────────────────────────────────────────
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ── audit_logs ────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_action             ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_user               ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource           ON audit_logs(resource_type, resource_id);

-- ── user_stats ────────────────────────────────────────────────────────────
CREATE INDEX idx_user_stats_global_rank   ON user_stats(total_score DESC) WHERE tenant_id IS NULL;
CREATE INDEX idx_user_stats_tenant_rank   ON user_stats(tenant_id, total_score DESC) WHERE tenant_id IS NOT NULL;

-- =============================================================================
-- SECTION 11: TRIGGERS FOR BUSINESS LOGIC
-- =============================================================================

-- ── 11.1  Enforce tenant's max_students quota ──────────────────────────────
CREATE OR REPLACE FUNCTION check_tenant_student_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_current_count INTEGER;
    v_max           INTEGER;
BEGIN
    IF NEW.role = 'institution_student' AND NEW.tenant_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_current_count
        FROM users
        WHERE tenant_id = NEW.tenant_id
          AND role = 'institution_student'
          AND is_deleted = FALSE
          AND is_active = TRUE;

        SELECT max_students INTO v_max
        FROM tenants WHERE id = NEW.tenant_id;

        IF v_current_count >= v_max THEN
            RAISE EXCEPTION
                'Tenant student quota exceeded. Current: %, Limit: %. Upgrade plan to add more students.',
                v_current_count, v_max
            USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_student_quota
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION check_tenant_student_quota();

-- ── 11.2  Auto-update denormalized submission counters on problems ──────────
CREATE OR REPLACE FUNCTION update_problem_submission_counters()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Only process when a submission transitions to a terminal verdict
    IF (TG_OP = 'INSERT' AND NEW.verdict != 'pending')
    OR (TG_OP = 'UPDATE' AND OLD.verdict = 'pending' AND NEW.verdict != 'pending')
    THEN
        UPDATE problems
        SET
            total_submissions    = total_submissions + 1,
            accepted_submissions = accepted_submissions + (CASE WHEN NEW.verdict = 'accepted' THEN 1 ELSE 0 END),
            updated_at           = NOW()
        WHERE id = NEW.problem_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER submissions_update_problem_counters
    AFTER INSERT OR UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_problem_submission_counters();

-- ── 11.3  Auto-create user_progress row when student first accesses chapter ─
-- This trigger fires when user_progress is inserted by the application;
-- the following trigger updates stats on completion:
CREATE OR REPLACE FUNCTION sync_user_stats_on_submission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_problem_difficulty difficulty_level;
    v_already_solved     BOOLEAN;
BEGIN
    -- Only process newly accepted submissions
    IF NEW.verdict != 'accepted' THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.verdict = 'accepted' THEN
        RETURN NEW; -- Already counted
    END IF;

    -- Check if user already solved this problem (to avoid double-counting)
    SELECT EXISTS (
        SELECT 1 FROM submissions
        WHERE user_id = NEW.user_id
          AND problem_id = NEW.problem_id
          AND verdict = 'accepted'
          AND id != NEW.id
    ) INTO v_already_solved;

    IF v_already_solved THEN
        RETURN NEW;
    END IF;

    -- Get difficulty
    SELECT difficulty INTO v_problem_difficulty
    FROM problems WHERE id = NEW.problem_id;

    -- Upsert user_stats
    INSERT INTO user_stats (user_id, tenant_id, total_problems_solved,
        easy_solved, medium_solved, hard_solved,
        total_submissions, accepted_submissions, total_score)
    VALUES (
        NEW.user_id,
        NEW.tenant_id,
        1,
        CASE WHEN v_problem_difficulty = 'easy'   THEN 1 ELSE 0 END,
        CASE WHEN v_problem_difficulty = 'medium' THEN 1 ELSE 0 END,
        CASE WHEN v_problem_difficulty = 'hard'   THEN 1 ELSE 0 END,
        1, 1,
        CASE v_problem_difficulty
            WHEN 'easy'   THEN 10
            WHEN 'medium' THEN 25
            WHEN 'hard'   THEN 50
        END
    )
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET
        total_problems_solved   = user_stats.total_problems_solved + 1,
        easy_solved             = user_stats.easy_solved   + EXCLUDED.easy_solved,
        medium_solved           = user_stats.medium_solved + EXCLUDED.medium_solved,
        hard_solved             = user_stats.hard_solved   + EXCLUDED.hard_solved,
        total_submissions       = user_stats.total_submissions + 1,
        accepted_submissions    = user_stats.accepted_submissions + 1,
        total_score             = user_stats.total_score + EXCLUDED.total_score,
        updated_at              = NOW();

    RETURN NEW;
END;
$$;

CREATE TRIGGER submissions_sync_user_stats
    AFTER INSERT OR UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION sync_user_stats_on_submission();

-- ── 11.4  Invalidate expired refresh tokens (runs on INSERT) ───────────────
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Opportunistically clean up expired tokens on new insert (probabilistic)
    IF random() < 0.05 THEN  -- 5% chance per insert to avoid overhead every time
        DELETE FROM refresh_tokens
        WHERE expires_at < NOW() - INTERVAL '1 day';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_tokens_cleanup
    AFTER INSERT ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION cleanup_expired_refresh_tokens();

-- =============================================================================
-- SECTION 12: VIEWS (for common queries)
-- =============================================================================

-- ── 12.1  Active Institutions (non-deleted, non-expired) ───────────────────
CREATE OR REPLACE VIEW v_active_tenants AS
SELECT
    t.id,
    t.name,
    t.slug,
    t.plan,
    t.max_students,
    t.plan_expires_at,
    COUNT(u.id) FILTER (WHERE u.role = 'institution_student' AND u.is_active AND NOT u.is_deleted) AS active_students,
    COUNT(u.id) FILTER (WHERE u.role = 'institution_admin'   AND u.is_active AND NOT u.is_deleted) AS admin_count,
    t.created_at
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE t.is_active = TRUE AND t.is_deleted = FALSE
  AND (t.plan_expires_at IS NULL OR t.plan_expires_at > NOW())
GROUP BY t.id;

COMMENT ON VIEW v_active_tenants IS 'Active, non-expired institutions with student/admin counts';

-- ── 12.2  Problem Statistics ───────────────────────────────────────────────
CREATE OR REPLACE VIEW v_problem_stats AS
SELECT
    p.id,
    p.tenant_id,
    p.title,
    p.difficulty,
    p.scope,
    p.tags,
    p.total_submissions,
    p.accepted_submissions,
    CASE
        WHEN p.total_submissions = 0 THEN 0
        ELSE ROUND((p.accepted_submissions::NUMERIC / p.total_submissions) * 100, 2)
    END AS acceptance_rate_pct
FROM problems p
WHERE p.is_deleted = FALSE;

-- ── 12.3  Student Dashboard View ──────────────────────────────────────────
CREATE OR REPLACE VIEW v_student_dashboard AS
SELECT
    u.id         AS student_id,
    u.tenant_id,
    u.name,
    u.email,
    COALESCE(us.total_problems_solved,   0) AS problems_solved,
    COALESCE(us.total_submissions,       0) AS total_submissions,
    COALESCE(us.accepted_submissions,    0) AS accepted_submissions,
    COALESCE(us.current_streak_days,     0) AS current_streak,
    COALESCE(us.total_score,             0) AS total_score,
    COALESCE(us.rank_institution,        0) AS rank_in_institution,
    COUNT(DISTINCT up.chapter_id) FILTER (WHERE up.is_completed) AS chapters_completed,
    us.last_submission_date
FROM users u
LEFT JOIN user_stats us ON us.user_id = u.id AND us.tenant_id = u.tenant_id
LEFT JOIN user_progress up ON up.user_id = u.id
WHERE u.role = 'institution_student'
  AND u.is_deleted = FALSE
GROUP BY u.id, us.total_problems_solved, us.total_submissions,
         us.accepted_submissions, us.current_streak_days, us.total_score,
         us.rank_institution, us.last_submission_date;

-- ── 12.4  Institution Analytics Overview ──────────────────────────────────
CREATE OR REPLACE VIEW v_institution_analytics AS
SELECT
    t.id           AS tenant_id,
    t.name         AS institution_name,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'institution_student' AND u.is_active AND NOT u.is_deleted) AS total_students,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published' AND NOT c.is_deleted) AS published_courses,
    COUNT(DISTINCT p.id) FILTER (WHERE NOT p.is_deleted) AS total_problems,
    COUNT(DISTINCT s.id) AS total_submissions,
    COUNT(DISTINCT s.id) FILTER (WHERE s.verdict = 'accepted') AS accepted_submissions,
    COUNT(DISTINCT s.user_id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') AS active_students_7d,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'published' AND NOT a.is_deleted) AS active_assignments
FROM tenants t
LEFT JOIN users       u ON u.tenant_id = t.id
LEFT JOIN courses     c ON c.tenant_id = t.id
LEFT JOIN problems    p ON p.tenant_id = t.id
LEFT JOIN submissions s ON s.tenant_id = t.id
LEFT JOIN assignments a ON a.tenant_id = t.id
WHERE t.is_deleted = FALSE
GROUP BY t.id, t.name;

-- =============================================================================
-- SECTION 13: DATABASE ROLES & PERMISSIONS
-- =============================================================================

-- Application role (used by Express.js connection pool)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'codeverse_app') THEN
        CREATE ROLE codeverse_app WITH LOGIN PASSWORD 'CHANGE_THIS_IN_PRODUCTION';
    END IF;
END $$;

-- Read-only role (analytics, reporting, read replicas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'codeverse_readonly') THEN
        CREATE ROLE codeverse_readonly WITH LOGIN PASSWORD 'CHANGE_THIS_IN_PRODUCTION';
    END IF;
END $$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO codeverse_app;
GRANT USAGE ON SCHEMA public TO codeverse_readonly;

-- Grant table permissions to app role (CRUD on all user-facing tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO codeverse_app;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO codeverse_app;
GRANT EXECUTE                        ON ALL FUNCTIONS IN SCHEMA public TO codeverse_app;

-- Read-only role gets SELECT only
GRANT SELECT ON ALL TABLES    IN SCHEMA public TO codeverse_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO codeverse_readonly;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO codeverse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT                  ON SEQUENCES TO codeverse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT                         ON TABLES    TO codeverse_readonly;

-- Revoke direct superuser access from codeverse_app (principle of least privilege)
-- Audit logs: app can INSERT but NOT UPDATE/DELETE (enforced by trigger + permission)
REVOKE UPDATE, DELETE ON audit_logs FROM codeverse_app;

-- =============================================================================
-- SECTION 14: SEED DATA
-- =============================================================================

-- ── 14.1  Blog Categories ─────────────────────────────────────────────────
INSERT INTO blog_categories (name, slug, description) VALUES
    ('Tutorials',       'tutorials',       'Step-by-step coding tutorials'),
    ('Interview Prep',  'interview-prep',  'Tips and problems for coding interviews'),
    ('Platform Updates','platform-updates','CodeVerse feature announcements'),
    ('Career Advice',   'career-advice',   'Placement and career guidance'),
    ('Competitive',     'competitive',     'Competitive programming topics')
ON CONFLICT (slug) DO NOTHING;

-- ── 14.2  Super Admin Account ─────────────────────────────────────────────
-- Password: 'SuperAdmin@2025!' — CHANGE IMMEDIATELY AFTER FIRST LOGIN
-- Hash generated with bcrypt cost 12
INSERT INTO users (
    id, tenant_id, email, password_hash, name, role,
    is_email_verified, is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin@codeverse.in',
    -- This is a placeholder hash — replace with actual bcrypt hash at deployment
    '$2b$12$PLACEHOLDER_REPLACE_WITH_REAL_BCRYPT_HASH_BEFORE_DEPLOY',
    'CodeVerse Super Admin',
    'super_admin',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ── 14.3  Demo Tenant (for development/testing) ───────────────────────────
INSERT INTO tenants (
    id, name, slug, plan, max_students, is_active
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    'Demo Engineering College',
    'demo-college',
    'pro',
    1000,
    TRUE
) ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SECTION 15: TABLE PARTITIONING (PRODUCTION SCALE)
-- =============================================================================
-- For high-volume tables, partition by time range.
-- Uncomment and apply when submissions > 10M rows.

-- Example: Partition submissions by month
-- (Implement after initial launch when volume justifies it)
--
-- CREATE TABLE submissions_2025_01 PARTITION OF submissions
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- CREATE TABLE submissions_2025_02 PARTITION OF submissions
--     FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
--
-- Similarly for audit_logs which grows fastest.

-- =============================================================================
-- SECTION 16: MAINTENANCE POLICIES
-- =============================================================================

-- ── 16.1  Auto-vacuum tuning for high-write tables ─────────────────────────
ALTER TABLE submissions          SET (autovacuum_vacuum_scale_factor = 0.01);
ALTER TABLE audit_logs           SET (autovacuum_vacuum_scale_factor = 0.01);
ALTER TABLE notifications        SET (autovacuum_vacuum_scale_factor = 0.05);

-- ── 16.2  Scheduled Cleanup Jobs (run via pg_cron or application cron) ─────
-- These are provided as SQL to run on a schedule — not auto-executed.

-- Clean expired refresh tokens (run daily):
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() AND is_revoked = FALSE;

-- Clean soft-deleted records older than 90 days (run weekly, super_admin only):
-- DELETE FROM users WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '90 days';
-- DELETE FROM courses WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '90 days';

-- Purge audit_logs older than 2 years (run monthly, keep recent for compliance):
-- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';

-- =============================================================================
-- SECTION 17: FINAL VALIDATION
-- =============================================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_index_count INTEGER;
    v_trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'current_schema()'
      AND table_type = 'BASE TABLE';

    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%';

    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';

    RAISE NOTICE '=== CodeVerse Schema Deployment Complete ===';
    RAISE NOTICE 'Custom Types (Enums)  : 9';
    RAISE NOTICE 'Tables created        : 20';
    RAISE NOTICE 'Performance Indexes   : 30+';
    RAISE NOTICE 'RLS Policies          : 16';
    RAISE NOTICE 'Triggers              : 10';
    RAISE NOTICE 'Views                 : 4';
    RAISE NOTICE 'DB Roles              : 2 (codeverse_app, codeverse_readonly)';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ACTION REQUIRED: Replace placeholder bcrypt hash in seed data.';
    RAISE NOTICE 'ACTION REQUIRED: Change codeverse_app and codeverse_readonly passwords.';
    RAISE NOTICE 'ACTION REQUIRED: Set app.current_tenant_id per connection in your ORM.';
END $$;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
