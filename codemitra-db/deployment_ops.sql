-- =============================================================================
-- CODEVERSE — DEPLOYMENT CHECKLIST & OPERATIONS RUNBOOK
-- File    : deployment_ops.sql
-- Purpose : Pre-deploy verification, post-deploy health checks,
--           and ongoing operations queries.
-- =============================================================================


-- =============================================================================
-- SECTION A: PRE-DEPLOYMENT CHECKLIST
-- Run each block and verify the expected output before going live.
-- =============================================================================

-- A-01: Verify all extensions are loaded
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
WHERE name IN ('pgcrypto', 'pg_trgm', 'citext')
ORDER BY name;
-- EXPECTED: 3 rows, installed_version IS NOT NULL for all three

-- A-02: Verify all 23 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type   = 'BASE TABLE'
ORDER BY table_name;
-- EXPECTED: 23 rows including: announcements, assignment_problems,
-- assignment_submissions, assignments, audit_logs, blog_categories,
-- blog_posts, chapters, courses, modules, notifications, problems,
-- quiz_attempts, quiz_questions, quizzes, rate_limit_log,
-- refresh_tokens, submissions, tenants, test_cases, user_progress,
-- user_stats, users

-- A-03: Verify all 9 enums exist
SELECT typname, array_agg(enumlabel ORDER BY enumsortorder) AS values
FROM pg_type
JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
WHERE typname IN (
    'user_role', 'subscription_plan', 'content_status',
    'difficulty_level', 'problem_scope', 'submission_verdict',
    'assignment_status', 'quiz_status', 'blog_status', 'notification_type'
)
GROUP BY typname
ORDER BY typname;
-- EXPECTED: 10 rows

-- A-04: Verify RLS is enabled on all tenant-scoped tables
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'rate_limit_log', 'blog_categories')
ORDER BY tablename;
-- EXPECTED: rls_enabled = TRUE for all tenant-scoped tables

-- A-05: Verify all performance indexes
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
-- EXPECTED: 39 rows (idx_* named indexes)

-- A-06: Verify all triggers are in place
SELECT
    trigger_name,
    event_object_table AS table_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- EXPECTED: Multiple triggers including updated_at triggers on each table

-- A-07: Verify DB roles exist with correct permissions
SELECT
    r.rolname,
    r.rolcanlogin,
    r.rolsuper,
    r.rolcreaterole,
    r.rolcreatedb
FROM pg_roles r
WHERE r.rolname IN ('codeverse_app', 'codeverse_readonly')
ORDER BY r.rolname;
-- EXPECTED: 2 rows, rolcanlogin=TRUE, rolsuper=FALSE for both

-- A-08: Verify seed data was inserted
SELECT COUNT(*) AS blog_category_count FROM blog_categories;
-- EXPECTED: 5
SELECT COUNT(*) AS super_admin_count FROM users WHERE role = 'super_admin';
-- EXPECTED: 1
SELECT COUNT(*) AS demo_tenant_count FROM tenants WHERE slug = 'demo-college';
-- EXPECTED: 1

-- A-09: Verify 4 views exist
SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
-- EXPECTED: v_active_tenants, v_institution_analytics,
--           v_problem_stats, v_student_dashboard

-- A-10: Test constraint — ensure cross-tenant isolation works
-- Insert a test tenant and verify slug uniqueness constraint
-- (This block is safe to run; it cleans up after itself)
DO $$
BEGIN
    BEGIN
        INSERT INTO tenants (name, slug, plan) VALUES ('Test A', 'test-collision-slug', 'trial');
        INSERT INTO tenants (name, slug, plan) VALUES ('Test B', 'test-collision-slug', 'trial');
        RAISE EXCEPTION 'ERROR: Slug uniqueness constraint NOT working!';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'PASS: Slug uniqueness constraint is working correctly.';
    END;
    -- Clean up
    DELETE FROM tenants WHERE slug = 'test-collision-slug';
END $$;

-- A-11: Test constraint — ensure institution_student must have tenant_id
DO $$
BEGIN
    BEGIN
        INSERT INTO users (email, password_hash, name, role)
        VALUES ('orphan@test.com', '$2b$12$testhash000000000000000000000000000000000000000000000000000', 'Orphan', 'institution_student');
        RAISE EXCEPTION 'ERROR: Tenant constraint for institution_student NOT working!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: institution_student tenant constraint is working correctly.';
    END;
END $$;

-- A-12: Test constraint — ensure bcrypt hash minimum length is enforced
DO $$
DECLARE
    v_test_tenant UUID := '00000000-0000-0000-0000-000000000010';
BEGIN
    BEGIN
        INSERT INTO users (tenant_id, email, password_hash, name, role)
        VALUES (v_test_tenant, 'plain@test.com', 'plaintext', 'Test User', 'institution_student');
        RAISE EXCEPTION 'ERROR: Password hash length constraint NOT working!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Password hash length constraint is working correctly.';
    END;
END $$;


-- =============================================================================
-- SECTION B: CONNECTION POOL CONFIGURATION
-- These settings should be configured in your pg Pool constructor (Node.js)
-- and verified here after deployment.
-- =============================================================================

-- B-01: Check current max_connections setting
SHOW max_connections;
-- Recommended: 100 for small, 500 for medium, 1000+ for large deployments
-- Your connection pool max should be no more than max_connections - 10

-- B-02: Check current active connections
SELECT
    state,
    COUNT(*) AS connection_count,
    MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) AS max_duration_seconds
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;
-- EXPECTED: 'idle' connections = your pool size; 'active' varies by load

-- B-03: Verify connection pool session variables are set correctly
-- (Run this from the application connection, not superuser)
-- SELECT current_setting('app.current_tenant_id', TRUE) AS tenant_id;
-- SELECT current_setting('app.current_user_id',   TRUE) AS user_id;
-- SELECT current_setting('app.current_user_role', TRUE) AS user_role;
-- EXPECTED: These should return the values set by your middleware


-- =============================================================================
-- SECTION C: POST-DEPLOYMENT HEALTH CHECKS
-- Run after every deployment to verify system health.
-- =============================================================================

-- C-01: Database size and table sizes
SELECT
    t2.relname                                     AS table_name,
    pg_size_pretty(pg_total_relation_size(t2.oid)) AS total_size,
    pg_size_pretty(pg_relation_size(t2.oid))       AS table_size,
    pg_size_pretty(
        pg_total_relation_size(t2.oid) - pg_relation_size(t2.oid)
    )                                              AS index_size,
    n_live_tup                                  AS live_rows
FROM pg_class t2
JOIN pg_stat_user_tables ON pg_stat_user_tables.relid = t2.oid
WHERE t2.relkind = 'r'
  AND pg_stat_user_tables.schemaname = 'public'
ORDER BY pg_total_relation_size(t2.oid) DESC;

-- C-02: Index usage stats (identify unused indexes after 30+ days in production)
SELECT
    schemaname,
    relname       AS tablename,
    indexrelname  AS indexname,
    idx_scan      AS times_used,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
-- ACTION: If idx_scan = 0 after 30+ days, consider dropping that index.
--         EXCEPTION: partial indexes on rarely-triggered conditions (e.g., pending submissions).

-- C-03: Slow query monitoring (requires pg_stat_statements extension)
-- Enable with: CREATE EXTENSION pg_stat_statements;
-- SELECT
--     query,
--     calls,
--     ROUND(mean_exec_time::NUMERIC, 2) AS avg_ms,
--     ROUND(total_exec_time::NUMERIC, 2) AS total_ms,
--     rows
-- FROM pg_stat_statements
-- WHERE query NOT LIKE '%pg_stat%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;

-- C-04: Bloat check — tables with high dead tuple ratio
SELECT
    schemaname || '.' || relname            AS table_name,
    n_dead_tup                              AS dead_rows,
    n_live_tup                              AS live_rows,
    ROUND(
        n_dead_tup::NUMERIC /
        NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2
    )                                       AS dead_ratio_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY dead_ratio_pct DESC NULLS LAST;
-- ACTION: If dead_ratio_pct > 20%, run: VACUUM ANALYZE <table_name>;

-- C-05: Lock monitoring — detect blocking queries
SELECT
    blocked_locks.pid           AS blocked_pid,
    blocking_locks.pid          AS blocking_pid,
    blocked_activity.query      AS blocked_query,
    blocking_activity.query     AS blocking_query,
    EXTRACT(EPOCH FROM NOW() - blocked_activity.query_start) AS blocked_for_seconds
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
    ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype          = blocked_locks.locktype
    AND blocking_locks.relation         = blocked_locks.relation
    AND blocking_locks.pid              != blocked_locks.pid
    AND blocking_locks.granted          = TRUE
    AND blocked_locks.granted           = FALSE
JOIN pg_catalog.pg_stat_activity blocking_activity
    ON blocking_activity.pid = blocking_locks.pid
ORDER BY blocked_for_seconds DESC;
-- ACTION: If > 0 rows, investigate the blocking_query for long transactions.


-- =============================================================================
-- SECTION D: PERFORMANCE TUNING QUERIES
-- =============================================================================

-- D-01: Recommended postgresql.conf settings for a 4GB RAM server
-- (Apply in your cloud DB dashboard or postgresql.conf)
/*
shared_buffers          = 1GB        # 25% of RAM
effective_cache_size    = 3GB        # 75% of RAM
maintenance_work_mem    = 256MB
work_mem                = 16MB       # per sort/hash operation
max_connections         = 200
checkpoint_completion_target = 0.9
wal_buffers             = 64MB
default_statistics_target = 100
random_page_cost        = 1.1        # for SSD storage
effective_io_concurrency = 200       # for SSD
min_wal_size            = 1GB
max_wal_size            = 4GB
*/

-- D-02: EXPLAIN ANALYZE template for query tuning
-- Replace the SELECT below with any slow query and examine the plan:
-- EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
-- SELECT * FROM submissions WHERE tenant_id = '...' ORDER BY created_at DESC LIMIT 20;

-- D-03: Force index usage stats reset (run at start of load testing)
-- SELECT pg_stat_reset();

-- D-04: Check autovacuum configuration per table
SELECT
    relname,
    reloptions
FROM pg_class t2
WHERE t2.relkind = 'r'
  AND reloptions IS NOT NULL
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relname;
-- Shows custom autovacuum settings set in Section 16 of codeverse_schema.sql


-- =============================================================================
-- SECTION E: BACKUP & RECOVERY PROCEDURES
-- =============================================================================

/*
── Full backup (run from your server CLI) ─────────────────────────────────────

  pg_dump \
    --host=<HOST> \
    --port=5432 \
    --username=codeverse_app \
    --format=custom \           # compressed, fast restore
    --compress=9 \
    --no-owner \
    --no-acl \
    --file=codeverse_$(date +%Y%m%d_%H%M%S).dump \
    codeverse

── Schema-only backup (for documentation / version control) ───────────────────

  pg_dump \
    --host=<HOST> \
    --username=codeverse_app \
    --schema-only \
    --file=codeverse_schema_$(date +%Y%m%d).sql \
    codeverse

── Restore from backup ────────────────────────────────────────────────────────

  pg_restore \
    --host=<HOST> \
    --username=postgres \
    --dbname=codeverse_new \
    --no-owner \
    --no-acl \
    --jobs=4 \                  # parallel restore (match CPU count)
    codeverse_20250507_020000.dump

── Point-in-Time Recovery ─────────────────────────────────────────────────────
  Providers like Neon, Supabase, and AWS RDS handle PITR automatically.
  Enable WAL archiving if self-hosting:
    wal_level = replica
    archive_mode = on
    archive_command = 'cp %p /backups/wal/%f'
*/


-- =============================================================================
-- SECTION F: APPLICATION INTEGRATION NOTES
-- =============================================================================

/*
── Setting RLS session context per request (Express.js middleware) ─────────────

  // src/middleware/tenantContext.ts
  import { pool } from '../db';

  export async function setTenantContext(
    client: PoolClient,
    userId: string,
    tenantId: string | null,
    role: string
  ) {
    await client.query(`
      SELECT
        set_config('app.current_user_id',   $1, TRUE),
        set_config('app.current_tenant_id', $2, TRUE),
        set_config('app.current_user_role', $3, TRUE)
    `, [userId, tenantId ?? '', role]);
    // TRUE = local to transaction (reset after transaction ends)
  }

  // Usage in route handler:
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setTenantContext(client, req.user.id, req.user.tenantId, req.user.role);
    // ... your Drizzle queries run with RLS automatically applied
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

── Judge0 Integration Flow ────────────────────────────────────────────────────

  1. POST /submissions (Express)
     → Insert pending submission row
     → POST Judge0 /submissions/batch with all test cases
     → Store judge0_token in submission row

  2. Background Polling Job (runs every 2 seconds via setInterval or queue)
     → SELECT * FROM submissions WHERE verdict = 'pending' LIMIT 50  (SUB-04)
     → GET Judge0 /submissions/batch?tokens=<comma_list>
     → For each completed: UPDATE submissions SET verdict = ..., test_case_results = ...  (SUB-02)
     → Triggers auto-update problem counters + user_stats

  3. Client Polling (React Query)
     → GET /api/submissions/:id every 2 seconds
     → Stop polling when verdict != 'pending'

── Drizzle Migration Command ──────────────────────────────────────────────────

  # Generate migration from schema changes:
  npx drizzle-kit generate:pg

  # Apply migrations:
  npx drizzle-kit push:pg

  # Or apply the raw SQL migrations manually:
  psql -U codeverse_app -d codeverse -f migrations.sql

── Environment Variables Required ────────────────────────────────────────────

  DATABASE_URL=postgresql://codeverse_app:PASSWORD@HOST:5432/codeverse?sslmode=require
  JUDGE0_URL=http://your-judge0-instance:2358
  JUDGE0_API_KEY=your_judge0_key          # if using hosted judge0.com
  JWT_ACCESS_SECRET=<256-bit random>      # openssl rand -hex 32
  JWT_REFRESH_SECRET=<256-bit random>     # different from access secret
  JWT_ACCESS_EXPIRES=15m
  JWT_REFRESH_EXPIRES=7d
  BCRYPT_ROUNDS=12
  SMTP_HOST=smtp.resend.com
  SMTP_API_KEY=your_resend_key
  CLOUDINARY_URL=cloudinary://...
  NODE_ENV=production
*/

-- =============================================================================
-- SECTION G: EMERGENCY PROCEDURES
-- =============================================================================

-- G-01: Kill a specific blocking connection
-- SELECT pg_terminate_backend(<blocking_pid>);

-- G-02: Kill ALL idle connections older than 10 minutes
-- SELECT pg_terminate_backend(pid)
-- FROM pg_stat_activity
-- WHERE state = 'idle'
--   AND state_change < NOW() - INTERVAL '10 minutes'
--   AND datname = current_database();

-- G-03: Emergency: Disable RLS temporarily (ONLY for emergency admin access)
-- ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
-- -- ... perform admin query ...
-- ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- G-04: Check for table bloat requiring manual VACUUM FULL
-- (WARNING: VACUUM FULL locks the table — schedule maintenance window)
-- VACUUM (FULL, ANALYZE, VERBOSE) submissions;
-- VACUUM (FULL, ANALYZE, VERBOSE) audit_logs;

-- G-05: Reindex a specific index if corrupted
-- REINDEX INDEX CONCURRENTLY idx_submissions_tenant_time;
-- (CONCURRENTLY = non-blocking, available in PostgreSQL 12+)

-- =============================================================================
-- END OF DEPLOYMENT OPS RUNBOOK
-- =============================================================================
