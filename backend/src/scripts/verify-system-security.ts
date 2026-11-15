import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verify() {
  const tables = [
    'service_registry',
    'service_health_history',
    'system_metrics',
    'execution_languages',
    'execution_nodes',
    'execution_limits',
    'execution_metrics',
    'user_sessions',
    'account_lockouts',
    'login_attempts',
    'security_controls',
    'compliance_checks',
    'audit_logs',
    'application_logs',
    'authentication_history',
    'integrations',
    'webhook_endpoints',
    'webhook_deliveries',
    'api_keys',
    'platform_configurations',
    'feature_flags',
    'incidents',
    'database_backups',
  ];

  console.log('📊 System & Security Table Counts:');
  for (const t of tables) {
    const res = await pool.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
    console.log(`  - ${t}: ${res.rows[0].count}`);
  }
  await pool.end();
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
