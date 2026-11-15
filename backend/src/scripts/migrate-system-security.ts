import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  console.log('🚀 Starting System & Security Database Migration...');

  try {
    await client.query('BEGIN');

    // 1. INCIDENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(30) NOT NULL DEFAULT 'medium',
        status VARCHAR(30) NOT NULL DEFAULT 'investigating',
        affected_services TEXT[] NOT NULL DEFAULT '{}',
        summary TEXT NOT NULL,
        mitigation_steps TEXT,
        timeline JSONB NOT NULL DEFAULT '[]',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. API KEYS
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        scopes TEXT[] NOT NULL DEFAULT '{"read"}',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
    `);

    // 3. DATABASE BACKUPS
    await client.query(`
      CREATE TABLE IF NOT EXISTS database_backups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        file_size_bytes INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'completed',
        backup_type VARCHAR(30) NOT NULL DEFAULT 'manual',
        initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        checksum VARCHAR(128),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. APPLICATION LOGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS application_logs (
        id BIGSERIAL PRIMARY KEY,
        level VARCHAR(20) NOT NULL DEFAULT 'info',
        source VARCHAR(100) NOT NULL DEFAULT 'api',
        message TEXT NOT NULL,
        context JSONB NOT NULL DEFAULT '{}',
        request_id UUID,
        environment VARCHAR(50) DEFAULT 'production',
        stack_trace TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_app_logs_level ON application_logs(level);
      CREATE INDEX IF NOT EXISTS idx_app_logs_source ON application_logs(source);
      CREATE INDEX IF NOT EXISTS idx_app_logs_created ON application_logs(created_at DESC);
    `);

    // 5. SERVICE REGISTRY & MONITORING
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_registry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        service_type VARCHAR(50) NOT NULL DEFAULT 'internal',
        endpoint_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'operational',
        probe_latency_ms INTEGER NOT NULL DEFAULT 0,
        uptime_target NUMERIC(5, 2) NOT NULL DEFAULT 99.95,
        last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS service_health_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES service_registry(id) ON DELETE CASCADE,
        status VARCHAR(30) NOT NULL,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        response_code INTEGER,
        error_message TEXT,
        checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_shh_service_time ON service_health_history(service_id, checked_at DESC);

      CREATE TABLE IF NOT EXISTS system_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cpu_usage_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
        memory_rss_mb INTEGER NOT NULL DEFAULT 0,
        memory_heap_used_mb INTEGER NOT NULL DEFAULT 0,
        memory_heap_total_mb INTEGER NOT NULL DEFAULT 0,
        database_latency_ms INTEGER NOT NULL DEFAULT 0,
        database_connections_active INTEGER NOT NULL DEFAULT 0,
        database_connections_idle INTEGER NOT NULL DEFAULT 0,
        api_latency_ms INTEGER NOT NULL DEFAULT 0,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sys_metrics_time ON system_metrics(recorded_at DESC);
    `);

    // 6. EXECUTION INFRASTRUCTURE
    await client.query(`
      CREATE TABLE IF NOT EXISTS execution_languages (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        extension VARCHAR(20) NOT NULL,
        monaco_lang VARCHAR(50) NOT NULL,
        version VARCHAR(50) NOT NULL DEFAULT 'Latest',
        runtime VARCHAR(50) NOT NULL DEFAULT 'Native',
        engine VARCHAR(30) NOT NULL DEFAULT 'hybrid',
        wasm_supported BOOLEAN NOT NULL DEFAULT TRUE,
        judge0_supported BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        node_type VARCHAR(50) NOT NULL DEFAULT 'judge0',
        host_url TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'healthy',
        current_queue INTEGER NOT NULL DEFAULT 0,
        max_concurrency INTEGER NOT NULL DEFAULT 50,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_development_fixture BOOLEAN NOT NULL DEFAULT FALSE,
        last_health_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_limits (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        max_execution_time_ms INTEGER NOT NULL DEFAULT 3000,
        max_memory_mb INTEGER NOT NULL DEFAULT 256,
        max_output_size_bytes INTEGER NOT NULL DEFAULT 131072,
        max_concurrent_runs INTEGER NOT NULL DEFAULT 10,
        rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL UNIQUE,
        total_runs INTEGER NOT NULL DEFAULT 0,
        successful_runs INTEGER NOT NULL DEFAULT 0,
        failed_runs INTEGER NOT NULL DEFAULT 0,
        timeout_runs INTEGER NOT NULL DEFAULT 0,
        wasm_runs INTEGER NOT NULL DEFAULT 0,
        judge0_runs INTEGER NOT NULL DEFAULT 0,
        avg_latency_ms NUMERIC(8, 2) NOT NULL DEFAULT 0,
        avg_memory_mb NUMERIC(8, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        language_id INTEGER,
        engine VARCHAR(30) NOT NULL DEFAULT 'wasm',
        status VARCHAR(30) NOT NULL DEFAULT 'completed',
        execution_time_ms INTEGER NOT NULL DEFAULT 0,
        memory_bytes INTEGER,
        ip_address VARCHAR(45),
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_exec_events_user ON execution_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_exec_events_created ON execution_events(created_at DESC);
    `);

    // 7. SECURITY & SESSIONS
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_info VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        revoked_at TIMESTAMPTZ,
        revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
        last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, is_revoked);

      CREATE TABLE IF NOT EXISTS account_lockouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        lock_reason TEXT NOT NULL DEFAULT 'Excessive failed login attempts',
        failed_attempts INTEGER NOT NULL DEFAULT 5,
        locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        lock_expires_at TIMESTAMPTZ NOT NULL,
        unlocked_at TIMESTAMPTZ,
        unlocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
        unlock_reason TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'locked',
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_account_lockouts_user ON account_lockouts(user_id);
      CREATE INDEX IF NOT EXISTS idx_account_lockouts_status ON account_lockouts(status);

      CREATE TABLE IF NOT EXISTS login_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        is_success BOOLEAN NOT NULL DEFAULT FALSE,
        failure_reason TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at DESC);

      CREATE TABLE IF NOT EXISTS security_controls (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'authentication',
        description TEXT NOT NULL,
        value JSONB NOT NULL DEFAULT '{}',
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'info',
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        ip_address VARCHAR(45),
        description TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sec_events_type ON security_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_sec_events_time ON security_events(created_at DESC);

      CREATE TABLE IF NOT EXISTS compliance_checks (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        standard VARCHAR(50) NOT NULL DEFAULT 'SOC2 / ISO27001',
        description TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'compliant',
        last_assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        assessed_by VARCHAR(100) DEFAULT 'Automated Policy Auditor'
      );
    `);

    // 8. AUTHENTICATION HISTORY & LOG EXPORTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS authentication_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        event_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'success',
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_auth_history_user ON authentication_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_history_created ON authentication_history(created_at DESC);

      CREATE TABLE IF NOT EXISTS log_export_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        log_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        records_count INTEGER NOT NULL DEFAULT 0,
        filters JSONB NOT NULL DEFAULT '{}',
        exported_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 9. INTEGRATIONS & WEBHOOKS
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        description TEXT,
        endpoint_url TEXT,
        connection_status VARCHAR(30) NOT NULL DEFAULT 'ready',
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        last_health_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_error TEXT,
        configuration JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS integration_health_checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        integration_id VARCHAR(50) REFERENCES integrations(id) ON DELETE CASCADE,
        status VARCHAR(30) NOT NULL,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        response_code INTEGER,
        error_message TEXT,
        checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ihc_integration_time ON integration_health_checks(integration_id, checked_at DESC);

      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        target_url TEXT NOT NULL,
        subscribed_events TEXT[] NOT NULL DEFAULT '{}',
        signing_secret_hash TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        retry_count INTEGER NOT NULL DEFAULT 3,
        timeout_seconds INTEGER NOT NULL DEFAULT 10,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_webhook_active ON webhook_endpoints(is_active);

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(30) NOT NULL DEFAULT 'success',
        status_code INTEGER,
        response_body TEXT,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        next_retry_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_webhook_deliv_webhook ON webhook_deliveries(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliv_status ON webhook_deliveries(status);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliv_time ON webhook_deliveries(delivered_at DESC);
    `);

    await client.query('COMMIT');
    console.log('✅ System & Security Database Migration Completed Successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
