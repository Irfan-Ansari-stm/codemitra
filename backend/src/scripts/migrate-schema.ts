import 'dotenv/config';
import { pool } from '../db';

async function migrate() {
  console.log('--- Applying Schema Updates to PostgreSQL ---');
  await pool.query(`
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published';
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS code_templates JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS reference_solutions JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
    ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
    ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;
    ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;
    ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS comparison_mode VARCHAR(50) DEFAULT 'exact';
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'problems_slug_unique') THEN
        ALTER TABLE problems ADD CONSTRAINT problems_slug_unique UNIQUE (slug);
      END IF;
    END $$;
  `);
  console.log('Schema updates applied successfully!');
}

migrate()
  .catch((err) => {
    console.error('Migration error:', err.message);
  })
  .finally(async () => {
    await pool.end();
  });
