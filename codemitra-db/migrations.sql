-- =============================================================================
-- CODEVERSE — MIGRATION SYSTEM
-- File    : migrations.sql
-- Purpose : Versioned, idempotent migration runner.
--           Run this file to set up the migration registry,
--           then run individual numbered migration files in order.
-- =============================================================================

-- =============================================================================
-- MIGRATION REGISTRY (run once on empty database)
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version         VARCHAR(20)     PRIMARY KEY,
    description     VARCHAR(255)    NOT NULL,
    applied_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    applied_by      TEXT            DEFAULT CURRENT_USER,
    execution_ms    INTEGER,
    checksum        TEXT
);

COMMENT ON TABLE schema_migrations IS
    'Migration version registry — do not modify manually';

-- Helper: check if migration already applied
CREATE OR REPLACE FUNCTION migration_applied(p_version VARCHAR)
RETURNS BOOLEAN LANGUAGE SQL AS $$
    SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = p_version);
$$;

-- =============================================================================
-- MIGRATION 0001 — Initial Schema
-- =============================================================================
DO $$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF migration_applied('0001') THEN
        RAISE NOTICE 'Migration 0001 already applied, skipping.';
        RETURN;
    END IF;

    -- The full schema in codeverse_schema.sql IS migration 0001.
    -- After running codeverse_schema.sql, register it:
    INSERT INTO schema_migrations (version, description, checksum)
    VALUES ('0001', 'Initial schema — all core tables, indexes, RLS, triggers', MD5('initial_schema_v1'));

    RAISE NOTICE 'Migration 0001 applied in %ms.',
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
END $$;

-- =============================================================================
-- MIGRATION 0002 — Add course_enrollments for explicit student-course mapping
-- (Run this when ready to add the feature — example migration)
-- =============================================================================
DO $$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF migration_applied('0002') THEN
        RAISE NOTICE 'Migration 0002 already applied, skipping.';
        RETURN;
    END IF;

    -- Create course_enrollments table
    CREATE TABLE course_enrollments (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id   UUID        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
        student_id  UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        tenant_id   UUID        NOT NULL REFERENCES tenants(id)  ON DELETE RESTRICT,
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        enrolled_by UUID        REFERENCES users(id) ON DELETE SET NULL,
        is_active   BOOLEAN     NOT NULL DEFAULT TRUE,

        CONSTRAINT course_enrollments_unique UNIQUE (course_id, student_id)
    );

    CREATE INDEX idx_enrollments_course   ON course_enrollments(course_id);
    CREATE INDEX idx_enrollments_student  ON course_enrollments(student_id, is_active);
    CREATE INDEX idx_enrollments_tenant   ON course_enrollments(tenant_id);

    ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY enrollment_tenant_isolation ON course_enrollments
        USING (
            current_user_role_name() = 'super_admin'
            OR tenant_id = current_tenant_id()
        );

    INSERT INTO schema_migrations (version, description)
    VALUES ('0002', 'Add course_enrollments table for explicit student-course mapping');

    RAISE NOTICE 'Migration 0002 applied in %ms.',
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
END $$;

-- =============================================================================
-- MIGRATION 0003 — Add contest / hackathon support
-- =============================================================================
DO $$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF migration_applied('0003') THEN
        RAISE NOTICE 'Migration 0003 already applied, skipping.';
        RETURN;
    END IF;

    CREATE TYPE contest_status AS ENUM (
        'upcoming', 'active', 'ended', 'cancelled'
    );

    CREATE TABLE contests (
        id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID            REFERENCES tenants(id) ON DELETE RESTRICT,
        -- NULL = platform-wide public contest
        created_by      UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        title           VARCHAR(255)    NOT NULL,
        description     TEXT,
        slug            VARCHAR(300)    NOT NULL UNIQUE,
        status          contest_status  NOT NULL DEFAULT 'upcoming',
        starts_at       TIMESTAMPTZ     NOT NULL,
        ends_at         TIMESTAMPTZ     NOT NULL,
        is_public       BOOLEAN         NOT NULL DEFAULT FALSE,
        max_participants INTEGER,
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

        CONSTRAINT contests_dates_valid CHECK (ends_at > starts_at)
    );

    CREATE TABLE contest_problems (
        id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
        contest_id  UUID    NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
        problem_id  UUID    NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
        points      INTEGER NOT NULL DEFAULT 100,
        order_index INTEGER NOT NULL DEFAULT 0,

        CONSTRAINT contest_problems_unique UNIQUE (contest_id, problem_id)
    );

    CREATE TABLE contest_registrations (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        contest_id      UUID        NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
        user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT contest_registrations_unique UNIQUE (contest_id, user_id)
    );

    CREATE INDEX idx_contests_status     ON contests(status, starts_at);
    CREATE INDEX idx_contests_tenant     ON contests(tenant_id) WHERE tenant_id IS NOT NULL;
    CREATE INDEX idx_contest_reg_contest ON contest_registrations(contest_id);
    CREATE INDEX idx_contest_reg_user    ON contest_registrations(user_id);

    ALTER TABLE contests              ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contest_problems      ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contest_registrations ENABLE ROW LEVEL SECURITY;

    CREATE POLICY contests_visibility ON contests
        USING (
            current_user_role_name() = 'super_admin'
            OR is_public = TRUE
            OR tenant_id = current_tenant_id()
        );

    CREATE TRIGGER contests_updated_at
        BEFORE UPDATE ON contests
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

    INSERT INTO schema_migrations (version, description)
    VALUES ('0003', 'Add contest/hackathon tables with RLS and triggers');

    RAISE NOTICE 'Migration 0003 applied in %ms.',
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
END $$;

-- =============================================================================
-- MIGRATION 0004 — Add plagiarism detection tracking
-- =============================================================================
DO $$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF migration_applied('0004') THEN
        RAISE NOTICE 'Migration 0004 already applied, skipping.';
        RETURN;
    END IF;

    CREATE TYPE plagiarism_status AS ENUM (
        'pending', 'clean', 'suspicious', 'flagged'
    );

    CREATE TABLE plagiarism_reports (
        id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id_a     UUID                NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        submission_id_b     UUID                NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        similarity_score    NUMERIC(5,2)        NOT NULL
                                CONSTRAINT plagiarism_score_range CHECK (similarity_score BETWEEN 0 AND 100),
        status              plagiarism_status   NOT NULL DEFAULT 'pending',
        reviewed_by         UUID                REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at         TIMESTAMPTZ,
        notes               TEXT,
        created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

        CONSTRAINT plagiarism_pairs_unique UNIQUE (submission_id_a, submission_id_b),
        CONSTRAINT plagiarism_different_submissions CHECK (submission_id_a <> submission_id_b)
    );

    CREATE INDEX idx_plagiarism_submission_a ON plagiarism_reports(submission_id_a);
    CREATE INDEX idx_plagiarism_status       ON plagiarism_reports(status, similarity_score DESC);

    INSERT INTO schema_migrations (version, description)
    VALUES ('0004', 'Add plagiarism detection tracking for submissions');

    RAISE NOTICE 'Migration 0004 applied in %ms.',
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
END $$;

-- =============================================================================
-- MIGRATION 0005 — Add certification system
-- =============================================================================
DO $$
DECLARE
    v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
    IF migration_applied('0005') THEN
        RAISE NOTICE 'Migration 0005 already applied, skipping.';
        RETURN;
    END IF;

    CREATE TABLE certificates (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        tenant_id       UUID        REFERENCES tenants(id) ON DELETE RESTRICT,
        course_id       UUID        REFERENCES courses(id) ON DELETE RESTRICT,
        title           VARCHAR(255) NOT NULL,
        issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at      TIMESTAMPTZ,
        certificate_url TEXT,
        verify_hash     TEXT        NOT NULL UNIQUE,
        -- SHA-256(user_id + course_id + issued_at) for public verification
        metadata        JSONB       NOT NULL DEFAULT '{}'::JSONB,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_certificates_user   ON certificates(user_id);
    CREATE INDEX idx_certificates_verify ON certificates(verify_hash);

    INSERT INTO schema_migrations (version, description)
    VALUES ('0005', 'Add certificate issuance system for course completion');

    RAISE NOTICE 'Migration 0005 applied in %ms.',
        EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
END $$;

-- =============================================================================
-- QUERY: Check migration status (run anytime)
-- =============================================================================
SELECT
    version,
    description,
    applied_at,
    applied_by,
    execution_ms
FROM schema_migrations
ORDER BY version ASC;

-- =============================================================================
-- ROLLBACK PROCEDURES
-- NOTE: These are DESTRUCTIVE. Only run in development.
--       In production, write FORWARD migrations instead.
-- =============================================================================

-- Rollback 0005: Remove certification system
-- DROP TABLE IF EXISTS certificates CASCADE;
-- DELETE FROM schema_migrations WHERE version = '0005';

-- Rollback 0004: Remove plagiarism reports
-- DROP TABLE IF EXISTS plagiarism_reports CASCADE;
-- DROP TYPE  IF EXISTS plagiarism_status CASCADE;
-- DELETE FROM schema_migrations WHERE version = '0004';

-- Rollback 0003: Remove contest system
-- DROP TABLE IF EXISTS contest_registrations CASCADE;
-- DROP TABLE IF EXISTS contest_problems CASCADE;
-- DROP TABLE IF EXISTS contests CASCADE;
-- DROP TYPE  IF EXISTS contest_status CASCADE;
-- DELETE FROM schema_migrations WHERE version = '0003';

-- Rollback 0002: Remove enrollments
-- DROP TABLE IF EXISTS course_enrollments CASCADE;
-- DELETE FROM schema_migrations WHERE version = '0002';

-- =============================================================================
-- END OF MIGRATIONS
-- =============================================================================
