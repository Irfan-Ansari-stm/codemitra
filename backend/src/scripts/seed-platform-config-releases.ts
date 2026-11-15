import 'dotenv/config';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSeed() {
  const client = await pool.connect();
  console.log('🌱 Starting Platform Configuration, Feature Flags, Incidents & Backups Seed Script...');

  try {
    await client.query('BEGIN');

    // ─── 1. FEATURE FLAGS TABLE & SEED ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flag_key VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        rollout_percent INT NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}',
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const flags = [
      { key: 'enable_ai_code_review', name: 'AI Code Review & Mentor Assist', desc: 'AI-assisted code analysis, complexity evaluation, and hint generation.', enabled: true, rollout: 100 },
      { key: 'enable_new_dashboard', name: 'Next-Gen Analytics Dashboards', desc: 'Real-time telemetry widgets, growth trends, and cohort heatmaps.', enabled: true, rollout: 75 },
      { key: 'enable_live_code_execution', name: 'WASM & Judge0 Dual Engine', desc: 'Dual-engine code execution with in-browser WebAssembly and Judge0 container fallback.', enabled: true, rollout: 100 },
      { key: 'enable_institute_analytics', name: 'Enterprise Institute Telemetry', desc: 'Cross-batch progress monitoring, attendance tracking, and placement insights.', enabled: true, rollout: 50 },
      { key: 'enable_advanced_assessments', name: 'Proctored Coding Assessments', desc: 'Tab-switch detection, automated snapshotting, and strict timer enforcement.', enabled: false, rollout: 25 },
      { key: 'enable_student_leaderboard', name: 'Gamified Student Leaderboard', desc: 'Platform-wide and cohort-level coding leaderboards with streak badges.', enabled: true, rollout: 100 },
      { key: 'enable_webhook_notifications', name: 'Outbound HMAC Webhook Engine', desc: 'Dispatches signed JSON payloads on user, submission, and batch lifecycle events.', enabled: true, rollout: 100 },
      { key: 'enable_beta_editor', name: 'Monaco Advanced Multi-Tab IDE', desc: 'Multi-file workspace support, terminal output streaming, and split diff editor.', enabled: true, rollout: 80 },
    ];

    for (const f of flags) {
      await client.query(
        `INSERT INTO feature_flags (flag_key, name, description, is_enabled, rollout_percent, metadata, updated_at)
         VALUES ($1, $2, $3, $4, $5, '{"env": "production"}', NOW())
         ON CONFLICT (flag_key) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             is_enabled = EXCLUDED.is_enabled,
             rollout_percent = EXCLUDED.rollout_percent,
             updated_at = NOW()`,
        [f.key, f.name, f.desc, f.enabled, f.rollout]
      );
    }
    console.log('✅ Feature flags table created and 8 flags seeded.');

    // ─── 2. PLATFORM CONFIGURATIONS SEED ────────────────────────────────────────
    const configs = [
      { key: 'branding.platform_name', value: 'CodeMitra', category: 'branding', desc: 'Platform display name' },
      { key: 'branding.tagline', value: 'Modern Multi-Tenant Coding & Education Platform', category: 'branding', desc: 'Homepage hero headline' },
      { key: 'branding.support_email', value: 'support@codemitra.local', category: 'branding', desc: 'Public customer support email' },
      { key: 'branding.primary_color', value: '#2563eb', category: 'branding', desc: 'Primary theme accent color' },
      { key: 'security.session_timeout_minutes', value: 120, category: 'security', desc: 'Inactivity threshold before session timeout' },
      { key: 'security.max_login_attempts', value: 5, category: 'security', desc: 'Failed login attempts before temporary lockout' },
      { key: 'security.lockout_duration_minutes', value: 15, category: 'security', desc: 'Duration of account lockout in minutes' },
      { key: 'security.mfa_enforced_admins', value: false, category: 'security', desc: 'Mandatory 2FA enforcement for administrative roles' },
      { key: 'platform.max_upload_size_mb', value: 25, category: 'general', desc: 'Maximum single file attachment size' },
      { key: 'platform.rate_limit_per_minute', value: 120, category: 'general', desc: 'API rate limiter window cap' },
      { key: 'platform.log_retention_days', value: 90, category: 'general', desc: 'Audit and application log retention period' },
    ];

    for (const c of configs) {
      await client.query(
        `INSERT INTO platform_configurations (id, config_key, config_value, category, description, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
         ON CONFLICT (config_key) DO UPDATE
         SET config_value = EXCLUDED.config_value,
             description = EXCLUDED.description,
             updated_at = NOW()`,
        [c.key, JSON.stringify(c.value), c.category, c.desc]
      );
    }
    console.log('✅ Platform configurations seeded.');

    // ─── 3. INCIDENTS SEED (8 Incidents: 1 critical, 2 high, 2 medium, 3 low) ────
    await client.query(`DELETE FROM incidents`);
    const userRes = await client.query(`SELECT id FROM users LIMIT 1`);
    const adminId = userRes.rows[0]?.id || null;

    const incidentsData = [
      {
        title: 'Judge0 Node-02 Sandbox Container Outage',
        severity: 'critical',
        status: 'investigating',
        services: ['code-execution', 'judge0'],
        desc: 'Compiler cluster node 2 stopped responding to execution ping probes. Workloads routing to WASM and Node 1.',
        rootCause: 'Docker daemon out-of-memory kernel reap under peak concurrent compilation test load.',
        notes: 'Restarted runner daemon. Increased container pool swap allocation.',
        createdHoursAgo: 2,
      },
      {
        title: 'Outgoing Webhook Dispatch Queue Latency Spike',
        severity: 'high',
        status: 'monitoring',
        services: ['webhook-dispatcher'],
        desc: 'Exponential backoff queue backlog reached 450 jobs due to slow LMS endpoint response.',
        rootCause: 'Third-party college endpoint throttling inbound HTTPS requests to 5 req/sec.',
        notes: 'Applied per-domain dispatch rate throttling to smooth bursts.',
        createdHoursAgo: 8,
      },
      {
        title: 'Redis In-Memory Session Cache Intermittent Disconnects',
        severity: 'high',
        status: 'resolved',
        services: ['auth-service'],
        desc: 'Session verification latency jumped from 1ms to 85ms for 4 minutes during rolling update.',
        rootCause: 'Sentinel failover timeout misconfiguration during routine node maintenance.',
        notes: 'Patched sentinel quorum timeout to 500ms.',
        createdHoursAgo: 24,
      },
      {
        title: 'PostgreSQL Datastore Connection Pool High Watermark',
        severity: 'medium',
        status: 'resolved',
        services: ['postgres-db'],
        desc: 'Active connection pool climbed to 18 of 20 connections during platform-wide batch assignment launch.',
        rootCause: 'Unindexed query on student submissions table during multi-tenant grade sync.',
        notes: 'Added composite btree index on (assignment_id, user_id, status).',
        createdHoursAgo: 48,
      },
      {
        title: 'S3 Asset Pre-Signed Upload URL Expiry Anomaly',
        severity: 'medium',
        status: 'resolved',
        services: ['core-api'],
        desc: 'Profile photo uploads failed for users on desktop Safari with clock drift.',
        rootCause: 'Upload URL signature window set to 60s instead of standard 900s.',
        notes: 'Adjusted pre-signed URL expiration threshold to 15 minutes.',
        createdHoursAgo: 72,
      },
      {
        title: 'Stale Frontend CDN Cache on Public Course Catalog',
        severity: 'low',
        status: 'closed',
        services: ['core-api'],
        desc: 'Updated course curriculum title took 30 minutes to propagate to unauthenticated landing page visitors.',
        rootCause: 'Missing revalidation hook invocation on course update mutation.',
        notes: 'Added On-Demand Next.js revalidation call in course update service.',
        createdHoursAgo: 96,
      },
      {
        title: 'Minor Markdown Renderer Sanitizer Escaping Edge Case',
        severity: 'low',
        status: 'closed',
        services: ['core-api'],
        desc: 'LaTeX equation with double backslashes rendered literal KaTeX tokens instead of inline fraction.',
        rootCause: 'Regex greedy matching on double backslash math blocks.',
        notes: 'Updated KaTeX renderer regex with non-greedy token parsing.',
        createdHoursAgo: 120,
      },
      {
        title: 'Audit Log CSV Export Encoding on Microsoft Excel Windows',
        severity: 'low',
        status: 'resolved',
        services: ['core-api'],
        desc: 'CSV export opened in older Excel versions without UTF-8 BOM showed garbled accented characters.',
        rootCause: 'Content-Type lacked explicit charset=utf-8 declaration.',
        notes: 'Added charset=utf-8 header and single-quote formula injection protection.',
        createdHoursAgo: 144,
      },
    ];

    for (const inc of incidentsData) {
      const createdAt = new Date(Date.now() - inc.createdHoursAgo * 3600000);
      const updatedAt = new Date(createdAt.getTime() + 1800000);
      const resolvedAt = inc.status === 'resolved' || inc.status === 'closed' ? updatedAt : null;

      const timeline = [
        { time: createdAt.toISOString(), message: inc.desc, status: 'investigating' },
        { time: updatedAt.toISOString(), message: inc.notes, status: inc.status },
      ];

      await client.query(
        `INSERT INTO incidents (title, severity, status, summary, affected_services, created_by, mitigation_steps, timeline, resolved_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          inc.title,
          inc.severity,
          inc.status,
          inc.desc,
          inc.services,
          adminId,
          inc.notes,
          JSON.stringify(timeline),
          resolvedAt,
          createdAt,
          updatedAt,
        ]
      );
    }
    console.log('✅ 8 Incidents seeded.');

    // ─── 4. DATABASE BACKUPS SEED (10 Backups) ──────────────────────────────────
    await client.query(`DELETE FROM database_backups`);
    const backupTypes = ['full', 'incremental', 'manual', 'full', 'incremental', 'manual', 'full', 'manual', 'incremental', 'full'];
    const backupStatuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'failed', 'completed', 'completed'];

    for (let i = 0; i < 10; i++) {
      const bType = backupTypes[i];
      const bStatus = backupStatuses[i];
      const daysAgo = i * 2;
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      const sizeBytes = bType === 'full' ? 485000000 + (i % 3) * 12000000 : 38000000 + (i % 4) * 4500000;
      const filename = `codemitra_db_${bType}_${createdAt.toISOString().slice(0, 10)}.sql.gz`;
      const checksum = crypto.createHash('sha256').update(filename + sizeBytes).digest('hex');

      await client.query(
        `INSERT INTO database_backups (filename, file_size_bytes, status, backup_type, checksum, initiated_by, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          filename,
          sizeBytes,
          bStatus,
          bType,
          checksum,
          adminId,
          `Automated daily disaster recovery snapshot (${bType.toUpperCase()})`,
          createdAt,
        ]
      );
    }
    console.log('✅ 10 Database backup records seeded.');

    await client.query('COMMIT');
    console.log('🎉 All Platform Configurations, Feature Flags, Incidents & Backups Successfully Seeded!');
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
