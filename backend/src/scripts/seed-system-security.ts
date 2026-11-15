import 'dotenv/config';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSeed() {
  const client = await pool.connect();
  console.log('🌱 Starting System & Security Seed Script...');

  try {
    await client.query('BEGIN');

    // Find super admin or first user
    const userRes = await client.query(`SELECT id, name, email FROM users ORDER BY created_at ASC LIMIT 5`);
    const defaultUser = userRes.rows[0] || { id: null, name: 'System Administrator', email: 'superadmin@codeverse.io' };
    const allUsers = userRes.rows;

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. MONITORING SEED DATA
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Service Registry & Health Checks...');
    const services = [
      {
        slug: 'api-gateway',
        name: 'Core REST API Gateway',
        description: 'Handles platform HTTP routing, authentication middleware, and rate limiting.',
        service_type: 'core_api',
        endpoint_url: 'http://localhost:5000/api/v1/health/live',
        status: 'operational',
        probe_latency_ms: 2,
        uptime_target: 99.99,
      },
      {
        slug: 'postgres-db',
        name: 'PostgreSQL Relational Datastore',
        description: 'Primary ACID database for users, tenants, courses, problems, and audit trails.',
        service_type: 'database',
        endpoint_url: 'localhost:5432/codemitra',
        status: 'operational',
        probe_latency_ms: 3,
        uptime_target: 99.95,
      },
      {
        slug: 'auth-service',
        name: 'Authentication & Session Store',
        description: 'JWT token signing, refresh token rotation, and password verification.',
        service_type: 'auth',
        endpoint_url: 'http://localhost:5000/api/v1/auth/me',
        status: 'operational',
        probe_latency_ms: 1,
        uptime_target: 99.99,
      },
      {
        slug: 'code-execution',
        name: 'Code Execution & Sandbox Router',
        description: 'WebAssembly client worker engine with Judge0 container cluster fallback.',
        service_type: 'code_execution',
        endpoint_url: 'http://localhost:5000/api/v1/execution/capabilities',
        status: 'operational',
        probe_latency_ms: 12,
        uptime_target: 99.90,
      },
      {
        slug: 'webhook-dispatcher',
        name: 'Outgoing Webhook Dispatcher',
        description: 'Reliable HMAC-signed event notification delivery with exponential backoff.',
        service_type: 'webhooks',
        endpoint_url: 'http://localhost:5000/api/v1/super-admin/integrations/webhooks',
        status: 'operational',
        probe_latency_ms: 2,
        uptime_target: 99.95,
      },
    ];

    const serviceIds: Record<string, string> = {};
    for (const svc of services) {
      const res = await client.query(
        `INSERT INTO service_registry (slug, name, description, service_type, endpoint_url, status, probe_latency_ms, uptime_target, last_checked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             probe_latency_ms = EXCLUDED.probe_latency_ms,
             last_checked_at = NOW(),
             updated_at = NOW()
         RETURNING id, slug`,
        [svc.slug, svc.name, svc.description, svc.service_type, svc.endpoint_url, svc.status, svc.probe_latency_ms, svc.uptime_target]
      );
      serviceIds[res.rows[0].slug] = res.rows[0].id;
    }

    // Historical health checks (25 entries)
    await client.query(`DELETE FROM service_health_history`);
    for (const [slug, sId] of Object.entries(serviceIds)) {
      for (let i = 0; i < 5; i++) {
        const checkedAt = new Date(Date.now() - i * 3600000 * 2).toISOString();
        const latency = slug === 'code-execution' ? 10 + i * 2 : 2 + i;
        await client.query(
          `INSERT INTO service_health_history (service_id, status, latency_ms, response_code, checked_at)
           VALUES ($1, 'operational', $2, 200, $3)`,
          [sId, latency, checkedAt]
        );
      }
    }

    // 24 hours of System Metrics
    await client.query(`DELETE FROM system_metrics`);
    for (let h = 24; h >= 0; h--) {
      const recordedAt = new Date(Date.now() - h * 3600000).toISOString();
      const cpu = 12.5 + (h % 7) * 2.1;
      const memRss = 180 + (h % 5) * 6;
      const memHeapUsed = 85 + (h % 6) * 4;
      const dbLatency = 2 + (h % 3);
      await client.query(
        `INSERT INTO system_metrics (cpu_usage_percent, memory_rss_mb, memory_heap_used_mb, memory_heap_total_mb, database_latency_ms, database_connections_active, database_connections_idle, api_latency_ms, recorded_at)
         VALUES ($1, $2, $3, 256, $4, 4, 16, 5, $5)`,
        [cpu, memRss, memHeapUsed, dbLatency, recordedAt]
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. EXECUTION SEED DATA
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Execution Languages, Nodes & Limits...');
    const languages = [
      { id: 71, name: 'Python 3', slug: 'python', extension: 'py', monaco_lang: 'python', version: '3.11.2', runtime: 'Pyodide WASM / CPython', engine: 'wasm', wasm: true, judge0: true, order: 1 },
      { id: 63, name: 'JavaScript (Node.js)', slug: 'javascript', extension: 'js', monaco_lang: 'javascript', version: '20.11.0', runtime: 'Isolated-VM / Node.js', engine: 'wasm', wasm: true, judge0: true, order: 2 },
      { id: 74, name: 'TypeScript', slug: 'typescript', extension: 'ts', monaco_lang: 'typescript', version: '5.3.3', runtime: 'Transpiled Node.js', engine: 'wasm', wasm: true, judge0: true, order: 3 },
      { id: 62, name: 'Java (OpenJDK)', slug: 'java', extension: 'java', monaco_lang: 'java', version: '17.0.6', runtime: 'HotSpot JVM', engine: 'judge0', wasm: false, judge0: true, order: 4 },
      { id: 50, name: 'C (GCC)', slug: 'c', extension: 'c', monaco_lang: 'c', version: '12.2.0', runtime: 'GCC / Clang Native', engine: 'hybrid', wasm: true, judge0: true, order: 5 },
      { id: 54, name: 'C++ (G++)', slug: 'cpp', extension: 'cpp', monaco_lang: 'cpp', version: '17 (GCC 12.2.0)', runtime: 'G++ Native', engine: 'hybrid', wasm: true, judge0: true, order: 6 },
      { id: 51, name: 'C# (Mono / .NET)', slug: 'csharp', extension: 'cs', monaco_lang: 'csharp', version: '6.12.0', runtime: 'Mono Runtime', engine: 'judge0', wasm: false, judge0: true, order: 7 },
      { id: 68, name: 'PHP', slug: 'php', extension: 'php', monaco_lang: 'php', version: '8.2.3', runtime: 'Zend Engine', engine: 'judge0', wasm: false, judge0: true, order: 8 },
      { id: 72, name: 'Ruby', slug: 'ruby', extension: 'rb', monaco_lang: 'ruby', version: '3.2.1', runtime: 'YARV', engine: 'judge0', wasm: false, judge0: true, order: 9 },
      { id: 60, name: 'Go', slug: 'go', extension: 'go', monaco_lang: 'go', version: '1.20.1', runtime: 'Go Toolchain', engine: 'judge0', wasm: false, judge0: true, order: 10 },
      { id: 73, name: 'Rust', slug: 'rust', extension: 'rs', monaco_lang: 'rust', version: '1.68.2', runtime: 'rustc / LLVM', engine: 'judge0', wasm: false, judge0: true, order: 11 },
      { id: 78, name: 'Kotlin', slug: 'kotlin', extension: 'kt', monaco_lang: 'kotlin', version: '1.8.20', runtime: 'Kotlin/JVM', engine: 'judge0', wasm: false, judge0: true, order: 12 },
      { id: 83, name: 'Swift', slug: 'swift', extension: 'swift', monaco_lang: 'swift', version: '5.8', runtime: 'Apple LLVM', engine: 'judge0', wasm: false, judge0: true, order: 13 },
      { id: 90, name: 'Dart', slug: 'dart', extension: 'dart', monaco_lang: 'dart', version: '2.19.6', runtime: 'Dart VM', engine: 'judge0', wasm: false, judge0: true, order: 14 },
      { id: 82, name: 'SQL (SQLite / Postgres)', slug: 'sql', extension: 'sql', monaco_lang: 'sql', version: '3.40.1', runtime: 'SQL Engine', engine: 'wasm', wasm: true, judge0: true, order: 15 },
      { id: 46, name: 'Bash', slug: 'bash', extension: 'sh', monaco_lang: 'shell', version: '5.2.15', runtime: 'GNU Bash', engine: 'judge0', wasm: false, judge0: true, order: 16 },
    ];

    for (const lang of languages) {
      await client.query(
        `INSERT INTO execution_languages (id, name, slug, extension, monaco_lang, version, runtime, engine, wasm_supported, judge0_supported, is_active, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             extension = EXCLUDED.extension,
             monaco_lang = EXCLUDED.monaco_lang,
             version = EXCLUDED.version,
             runtime = EXCLUDED.runtime,
             engine = EXCLUDED.engine,
             wasm_supported = EXCLUDED.wasm_supported,
             judge0_supported = EXCLUDED.judge0_supported,
             display_order = EXCLUDED.display_order,
             updated_at = NOW()`,
        [lang.id, lang.name, lang.slug, lang.extension, lang.monaco_lang, lang.version, lang.runtime, lang.engine, lang.wasm, lang.judge0, lang.order]
      );
    }

    // Execution Nodes
    const nodes = [
      { name: 'US-East Judge0 Worker Cluster 01', type: 'judge0', host: 'https://judge0-us-east.codeverse.internal', status: 'healthy', queue: 2, max: 100, latency: 18, fixture: true },
      { name: 'EU-Central Judge0 Worker Cluster 02', type: 'judge0', host: 'https://judge0-eu-central.codeverse.internal', status: 'healthy', queue: 0, max: 75, latency: 26, fixture: true },
      { name: 'Local In-Process WASM Sandbox Worker', type: 'wasm_worker', host: 'worker://wasm-local-pool', status: 'healthy', queue: 0, max: 50, latency: 2, fixture: false },
    ];
    for (const n of nodes) {
      await client.query(
        `INSERT INTO execution_nodes (name, node_type, host_url, status, current_queue, max_concurrency, latency_ms, is_active, is_development_fixture, last_health_check_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, NOW())
         ON CONFLICT DO NOTHING`,
        [n.name, n.type, n.host, n.status, n.queue, n.max, n.latency, n.fixture]
      );
    }

    // Execution Limits
    const limits = [
      { id: 'easy', name: 'Easy Difficulty Timeout', time: 2000, mem: 128, out: 65536, con: 5, rate: 60 },
      { id: 'medium', name: 'Medium Difficulty Timeout', time: 3000, mem: 256, out: 131072, con: 8, rate: 45 },
      { id: 'hard', name: 'Hard Difficulty Timeout', time: 5000, mem: 512, out: 262144, con: 10, rate: 30 },
      { id: 'platform', name: 'Global Platform Default', time: 3000, mem: 256, out: 131072, con: 10, rate: 60 },
    ];
    for (const lim of limits) {
      await client.query(
        `INSERT INTO execution_limits (id, name, max_execution_time_ms, max_memory_mb, max_output_size_bytes, max_concurrent_runs, rate_limit_per_minute, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             max_execution_time_ms = EXCLUDED.max_execution_time_ms,
             max_memory_mb = EXCLUDED.max_memory_mb,
             max_output_size_bytes = EXCLUDED.max_output_size_bytes,
             max_concurrent_runs = EXCLUDED.max_concurrent_runs,
             rate_limit_per_minute = EXCLUDED.rate_limit_per_minute,
             updated_at = NOW()`,
        [lim.id, lim.name, lim.time, lim.mem, lim.out, lim.con, lim.rate, defaultUser.id]
      );
    }

    // Execution Metrics (Last 7 Days)
    for (let d = 6; d >= 0; d--) {
      const dateStr = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
      const total = 12000 + (d % 3) * 1500;
      const wasm = Math.round(total * 0.72);
      const judge0 = total - wasm;
      const success = Math.round(total * 0.94);
      const failed = total - success;
      await client.query(
        `INSERT INTO execution_metrics (date, total_runs, successful_runs, failed_runs, timeout_runs, wasm_runs, judge0_runs, avg_latency_ms, avg_memory_mb)
         VALUES ($1, $2, $3, $4, 25, $5, $6, 14.5, 38.2)
         ON CONFLICT (date) DO UPDATE
         SET total_runs = EXCLUDED.total_runs,
             successful_runs = EXCLUDED.successful_runs,
             wasm_runs = EXCLUDED.wasm_runs,
             judge0_runs = EXCLUDED.judge0_runs`,
        [dateStr, total, success, failed, wasm, judge0]
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. SECURITY & SESSIONS SEED DATA
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Active Sessions, Locked Accounts & Controls...');
    await client.query(`DELETE FROM user_sessions`);
    for (let i = 0; i < 8; i++) {
      const targetUser = allUsers[i % allUsers.length] || defaultUser;
      const tokenHash = crypto.createHash('sha256').update(`seed_token_${i}`).digest('hex');
      const ip = `192.168.1.${10 + i}`;
      const expiresAt = new Date(Date.now() + (7 - i) * 86400000).toISOString();
      const lastActive = new Date(Date.now() - i * 3600000).toISOString();
      await client.query(
        `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, device_info, is_active, is_revoked, last_active_at, expires_at)
         VALUES ($1, $2, $3, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0', 'Chrome 122 on Windows 10', TRUE, FALSE, $4, $5)`,
        [targetUser.id, tokenHash, ip, lastActive, expiresAt]
      );
    }

    // Locked Accounts (2 sample locked accounts)
    await client.query(`DELETE FROM account_lockouts`);
    if (allUsers.length > 2) {
      const lockedUser1 = allUsers[1];
      const lockedUser2 = allUsers[2];
      await client.query(
        `INSERT INTO account_lockouts (user_id, email, lock_reason, failed_attempts, locked_at, lock_expires_at, status, ip_address)
         VALUES ($1, $2, 'Exceeded maximum 5 consecutive failed login attempts', 5, NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '45 minutes', 'locked', '203.0.113.45'),
                ($3, $4, 'Suspicious geographic login anomaly detected by SIEM', 6, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', 'locked', '198.51.100.12')`,
        [lockedUser1.id, lockedUser1.email, lockedUser2.id, lockedUser2.email]
      );
    }

    // 15 Sample Login Attempts
    await client.query(`DELETE FROM login_attempts`);
    for (let i = 0; i < 15; i++) {
      const isSuccess = i % 4 !== 0;
      const targetUser = allUsers[i % allUsers.length] || defaultUser;
      const attemptedAt = new Date(Date.now() - i * 1800000).toISOString();
      await client.query(
        `INSERT INTO login_attempts (email, user_id, is_success, failure_reason, ip_address, user_agent, attempted_at)
         VALUES ($1, $2, $3, $4, $5, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', $6)`,
        [
          targetUser.email,
          isSuccess ? targetUser.id : null,
          isSuccess,
          isSuccess ? null : 'Invalid password credential',
          `192.168.1.${10 + (i % 5)}`,
          attemptedAt,
        ]
      );
    }

    // Security Controls (6 configured policies)
    const securityControls = [
      { id: 'pwd_policy', name: 'Password Complexity Standard', cat: 'authentication', desc: 'Enforces min 8 characters, at least 1 uppercase letter, 1 number, and 1 special symbol.', val: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSymbols: true } },
      { id: 'session_timeout', name: 'Session Idle Inactivity Timeout', cat: 'session', desc: 'Automatically revokes unrefreshed JWT session tokens after inactivity.', val: { timeoutMinutes: 120 } },
      { id: 'max_sessions', name: 'Maximum Concurrent User Sessions', cat: 'session', desc: 'Limits simultaneous active browser/device sessions per account.', val: { maxConcurrent: 3 } },
      { id: 'lockout_policy', name: 'Brute-Force Account Lockout Policy', cat: 'lockout', desc: 'Temporarily locks accounts after 5 failed login attempts for 15 minutes.', val: { maxAttempts: 5, lockoutMinutes: 15 } },
      { id: 'jwt_policy', name: 'JWT Secure Expiration & Rotation', cat: 'compliance', desc: 'Strict 15-minute access token lifetime with cryptographically rotated refresh tokens.', val: { accessTtlMin: 15, refreshTtlDays: 7 } },
      { id: 'audit_immutability', name: 'Audit Trail Immutability Safeguard', cat: 'compliance', desc: 'Cryptographically seals audit logs preventing modification or deletion by any role.', val: { isImmutable: true, retentionDays: 365 } },
    ];
    for (const sc of securityControls) {
      await client.query(
        `INSERT INTO security_controls (id, name, category, description, value, is_enabled, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, TRUE, $6, NOW())
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             value = EXCLUDED.value,
             is_enabled = EXCLUDED.is_enabled,
             updated_at = NOW()`,
        [sc.id, sc.name, sc.cat, sc.desc, JSON.stringify(sc.val), defaultUser.id]
      );
    }

    // Compliance Checks
    const complianceItems = [
      { id: 'soc2_pwd', name: 'Password Hashing & Salting (bcrypt 12 rounds)', std: 'SOC2 Type II', desc: 'Zero plaintext passwords; cryptographically salted hashes with 12 bcrypt rounds.', status: 'compliant' },
      { id: 'soc2_jwt', name: 'Stateless Access Tokens with Cryptographic Expiry', std: 'SOC2 Type II', desc: 'Tokens sign exp and user claim with HMAC-SHA256.', status: 'compliant' },
      { id: 'soc2_brute', name: 'Brute Force Account Lockout Enforcement', std: 'ISO 27001', desc: 'Automatic lockout triggered upon 5 consecutive failed authentication probes.', status: 'compliant' },
      { id: 'soc2_rate', name: 'Distributed Rate Limiting (Redis / In-Memory)', std: 'OWASP Top 10', desc: 'Strict sliding window rate limiting prevents denial of service and automated credential stuffing.', status: 'compliant' },
      { id: 'soc2_tenant', name: 'Multi-Tenant Logical Isolation Enforcement', std: 'ISO 27001', desc: 'Tenant ID constraints verified on all institution resource queries.', status: 'compliant' },
      { id: 'soc2_audit', name: 'Audit Trail Immutability & Retention', std: 'SOC2 Type II', desc: 'All administrative state mutations recorded in append-only audit trail.', status: 'compliant' },
    ];
    for (const ci of complianceItems) {
      await client.query(
        `INSERT INTO compliance_checks (id, name, standard, description, status, last_assessed_at, assessed_by)
         VALUES ($1, $2, $3, $4, $5, NOW(), 'Automated Policy Auditor')
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             standard = EXCLUDED.standard,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             last_assessed_at = NOW()`,
        [ci.id, ci.name, ci.std, ci.desc, ci.status]
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. LOGS & AUDIT TRAIL SEED DATA
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Audit Logs, Application Logs & Authentication History...');
    const actions = [
      'student.verify',
      'institute.application.approved',
      'institute.application.rejected',
      'batch.create',
      'batch.update',
      'batch.delete',
      'user.create',
      'user.update',
      'user.delete',
      'role.update',
      'session.revoke',
      'api_key.create',
      'integration.update',
      'security.control.update',
      'backup.trigger',
    ];

    // Seed 50 Audit Logs
    for (let i = 0; i < 50; i++) {
      const act = actions[i % actions.length];
      const targetUser = allUsers[i % allUsers.length] || defaultUser;
      const createdAt = new Date(Date.now() - i * 1800000).toISOString();
      const reqId = crypto.randomUUID();
      await client.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_data, new_data, ip_address, user_agent, request_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Mozilla/5.0 Chrome/122.0', $8, $9)`,
        [
          targetUser.id,
          act,
          act.split('.')[0],
          targetUser.id,
          JSON.stringify({ previousStatus: 'pending' }),
          JSON.stringify({ newStatus: 'approved', timestamp: createdAt }),
          `192.168.1.${10 + (i % 10)}`,
          reqId,
          createdAt,
        ]
      );
    }

    // Seed 40 Application Logs
    await client.query(`DELETE FROM application_logs`);
    const logLevels = ['info', 'info', 'warn', 'error', 'debug'];
    const logSources = ['api-gateway', 'auth-service', 'execution-router', 'database-pool', 'webhook-dispatcher'];
    const logMessages = [
      'Database connection pool acquired worker in 2ms.',
      'Incoming execution request dispatched to WebAssembly sandbox worker.',
      'API rate limit warning threshold reached for client IP: 192.168.1.15.',
      'Failed authentication attempt: user password mismatch.',
      'Scheduled health check ping successful for all 5 subsystems.',
      'Audit log transaction committed successfully.',
      'WASM worker compiled Python script in 14ms.',
      'Unhandled exception in third-party sandbox container ping: connection timeout.',
    ];

    for (let i = 0; i < 40; i++) {
      const level = logLevels[i % logLevels.length];
      const source = logSources[i % logSources.length];
      const msg = logMessages[i % logMessages.length];
      const createdAt = new Date(Date.now() - i * 1200000).toISOString();
      const reqId = crypto.randomUUID();
      const stack = level === 'error' ? 'Error: Connection timeout\n  at Socket.<anonymous> (/app/src/services/sandbox.ts:42:15)' : null;
      await client.query(
        `INSERT INTO application_logs (level, source, message, context, request_id, environment, stack_trace, created_at)
         VALUES ($1, $2, $3, $4, $5, 'production', $6, $7)`,
        [level, source, msg, JSON.stringify({ workerId: `worker-${i % 4}` }), reqId, stack, createdAt]
      );
    }

    // Seed 25 Authentication History Records
    await client.query(`DELETE FROM authentication_history`);
    const authEvents = ['login', 'login', 'login_failed', 'logout', 'password_change', 'account_locked', 'session_revoked'];
    for (let i = 0; i < 25; i++) {
      const evt = authEvents[i % authEvents.length];
      const isSuccess = evt !== 'login_failed' && evt !== 'account_locked';
      const targetUser = allUsers[i % allUsers.length] || defaultUser;
      const createdAt = new Date(Date.now() - i * 3600000).toISOString();
      await client.query(
        `INSERT INTO authentication_history (user_id, user_name, user_email, event_type, status, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', $7)`,
        [
          targetUser.id,
          targetUser.name,
          targetUser.email,
          evt,
          isSuccess ? 'success' : 'failure',
          `192.168.1.${10 + (i % 6)}`,
          createdAt,
        ]
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. INTEGRATIONS & API MANAGEMENT SEED DATA
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('  -> Seeding Integrations, Webhooks & Developer API Keys...');
    const integrations = [
      {
        id: 'judge0',
        name: 'Judge0 Sandboxed Code Execution',
        provider: 'Judge0 API',
        type: 'code_execution',
        description: 'Multi-language untrusted code compiler and runtime container sandbox.',
        endpoint_url: process.env.JUDGE0_URL || 'http://localhost:2358',
        status: process.env.JUDGE0_URL ? 'connected' : 'configured',
      },
      {
        id: 'postgresql',
        name: 'PostgreSQL Relational Storage',
        provider: 'PostgreSQL',
        type: 'database',
        description: 'High-performance ACID relational data storage with connection pooling.',
        endpoint_url: 'localhost:5432/codemitra',
        status: 'connected',
      },
      {
        id: 'webhooks',
        name: 'Outgoing Webhook Dispatcher',
        provider: 'CodeVerse Engine',
        type: 'webhooks',
        description: 'Event-driven HTTP webhook notification system with HMAC signatures.',
        endpoint_url: 'http://localhost:5000/api/v1/webhooks',
        status: 'ready',
      },
    ];

    for (const integ of integrations) {
      await client.query(
        `INSERT INTO integrations (id, name, provider, integration_type, description, endpoint_url, connection_status, is_enabled, last_health_check_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             provider = EXCLUDED.provider,
             integration_type = EXCLUDED.integration_type,
             description = EXCLUDED.description,
             endpoint_url = EXCLUDED.endpoint_url,
             connection_status = EXCLUDED.connection_status,
             last_health_check_at = NOW(),
             updated_at = NOW()`,
        [integ.id, integ.name, integ.provider, integ.type, integ.description, integ.endpoint_url, integ.status]
      );
    }

    // Webhook Endpoints (2 fixtures)
    await client.query(`DELETE FROM webhook_deliveries`);
    await client.query(`DELETE FROM webhook_endpoints`);
    const wh1 = await client.query(
      `INSERT INTO webhook_endpoints (name, target_url, subscribed_events, signing_secret_hash, is_active, retry_count, timeout_seconds, created_by)
       VALUES ('Slack Platform Operations Alert Dispatcher', 'https://hooks.slack.com/services/T00/B00/X00', ARRAY['student.verify', 'batch.create', 'incident.create'], $1, TRUE, 3, 10, $2)
       RETURNING id`,
      [crypto.createHash('sha256').update('whsec_slack_123').digest('hex'), defaultUser.id]
    );

    const wh2 = await client.query(
      `INSERT INTO webhook_endpoints (name, target_url, subscribed_events, signing_secret_hash, is_active, retry_count, timeout_seconds, created_by)
       VALUES ('University ERP Student Sync Endpoint', 'https://erp.institution.edu/api/webhooks/students', ARRAY['student.verify', 'student.enrolled'], $1, TRUE, 3, 15, $2)
       RETURNING id`,
      [crypto.createHash('sha256').update('whsec_erp_456').digest('hex'), defaultUser.id]
    );

    // Sample Webhook Deliveries (5 records)
    const whDeliveries = [
      { whId: wh1.rows[0].id, event: 'student.verify', status: 'success', code: 200, body: '{"ok": true}', attempt: 1 },
      { whId: wh1.rows[0].id, event: 'batch.create', status: 'success', code: 200, body: '{"ok": true}', attempt: 1 },
      { whId: wh1.rows[0].id, event: 'incident.create', status: 'success', code: 200, body: '{"ok": true}', attempt: 1 },
      { whId: wh2.rows[0].id, event: 'student.verify', status: 'success', code: 200, body: '{"received": true}', attempt: 1 },
      { whId: wh2.rows[0].id, event: 'student.enrolled', status: 'failed', code: 504, body: 'Gateway Timeout', attempt: 2 },
    ];
    for (const deliv of whDeliveries) {
      await client.query(
        `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status, status_code, response_body, attempt_number, delivered_at)
         VALUES ($1, $2, '{"event": "test"}', $3, $4, $5, $6, NOW())`,
        [deliv.whId, deliv.event, deliv.status, deliv.code, deliv.body, deliv.attempt]
      );
    }

    // Developer API Keys (3 fixtures)
    await client.query(`DELETE FROM api_keys`);
    const sampleKeys = [
      { name: 'Production CI/CD Runner Key', prefix: 'cv_live_9a', scopes: ['read:users', 'execute:code', 'read:courses'] },
      { name: 'University LMS Data Ingestion Key', prefix: 'cv_live_4b', scopes: ['read:students', 'write:enrollments'] },
      { name: 'Monitoring Agent Telemetry Key', prefix: 'cv_live_7c', scopes: ['read:metrics', 'read:health'] },
    ];
    for (const key of sampleKeys) {
      const secret = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(secret).digest('hex');
      await client.query(
        `INSERT INTO api_keys (name, key_prefix, key_hash, scopes, is_active, created_by, last_used_at, expires_at)
         VALUES ($1, $2, $3, $4, TRUE, $5, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '180 days')`,
        [key.name, key.prefix, hash, key.scopes, defaultUser.id]
      );
    }

    await client.query('COMMIT');
    console.log('✅ System & Security Seed Completed Successfully with Zero Errors!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});
