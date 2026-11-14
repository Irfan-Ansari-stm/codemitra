import { Client } from 'pg';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  console.log('Connected to PostgreSQL. Running IDE schema migration...');

  try {
    await client.query('BEGIN');

    // 1. ide_projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS ide_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        project_name VARCHAR(255) NOT NULL,
        description TEXT,
        default_language VARCHAR(64) NOT NULL DEFAULT 'python',
        visibility VARCHAR(32) NOT NULL DEFAULT 'private',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_projects_user_id ON ide_projects(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_projects_updated_at ON ide_projects(updated_at DESC);`);

    // 2. ide_files
    await client.query(`
      CREATE TABLE IF NOT EXISTS ide_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES ide_projects(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(512) NOT NULL DEFAULT '/',
        language VARCHAR(64) NOT NULL DEFAULT 'python',
        source_code TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_files_project_id ON ide_files(project_id);`);

    // 3. ide_open_tabs
    await client.query(`
      CREATE TABLE IF NOT EXISTS ide_open_tabs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES ide_projects(id) ON DELETE CASCADE,
        file_id UUID NOT NULL REFERENCES ide_files(id) ON DELETE CASCADE,
        tab_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_open_tabs_user_project ON ide_open_tabs(user_id, project_id);`);

    // 4. ide_executions
    await client.query(`
      CREATE TABLE IF NOT EXISTS ide_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        project_id UUID REFERENCES ide_projects(id) ON DELETE SET NULL,
        language VARCHAR(64) NOT NULL,
        source_code_snapshot TEXT NOT NULL,
        stdin TEXT DEFAULT '',
        execution_engine VARCHAR(32) NOT NULL DEFAULT 'auto',
        execution_status VARCHAR(64) NOT NULL DEFAULT 'completed',
        stdout TEXT DEFAULT '',
        stderr TEXT DEFAULT '',
        compile_output TEXT DEFAULT '',
        exit_code INTEGER DEFAULT 0,
        execution_time DOUBLE PRECISION DEFAULT 0,
        memory_used INTEGER DEFAULT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_executions_user_id ON ide_executions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_executions_created_at ON ide_executions(created_at DESC);`);

    // 5. ide_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS ide_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        editor_theme VARCHAR(32) NOT NULL DEFAULT 'vs-dark',
        font_size INTEGER NOT NULL DEFAULT 14,
        tab_size INTEGER NOT NULL DEFAULT 2,
        word_wrap BOOLEAN NOT NULL DEFAULT true,
        minimap_enabled BOOLEAN NOT NULL DEFAULT false,
        auto_save_enabled BOOLEAN NOT NULL DEFAULT true,
        default_language VARCHAR(64) NOT NULL DEFAULT 'python',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ide_settings_user_id ON ide_settings(user_id);`);

    await client.query('COMMIT');
    console.log('IDE database tables and indexes created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await client.end();
  }
}

runMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
