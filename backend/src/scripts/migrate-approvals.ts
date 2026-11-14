import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';

export async function migrateApprovals() {
  console.log('--- Migrating Approvals Hub Tables & Columns ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ensure institute_applications has extended columns
    await client.query(`
      ALTER TABLE institute_applications 
      ADD COLUMN IF NOT EXISTS application_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
      ADD COLUMN IF NOT EXISTS established_year INTEGER,
      ADD COLUMN IF NOT EXISTS institution_type VARCHAR(100) DEFAULT 'University',
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS admin_notes TEXT;

      CREATE INDEX IF NOT EXISTS idx_ia_app_number ON institute_applications(application_number);
    `);

    // Backfill application_number for existing records if null
    await client.query(`
      UPDATE institute_applications 
      SET application_number = 'INS-' || LPAD(SUBSTRING(id::text, 1, 6), 6, '0')
      WHERE application_number IS NULL;
    `);

    // 2. Create admissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_number VARCHAR(50) UNIQUE,
        student_id UUID REFERENCES users(id) ON DELETE SET NULL,
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
        batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        program VARCHAR(255) NOT NULL,
        academic_details JSONB DEFAULT '{}'::jsonb,
        documents JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        admin_notes TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admissions_tenant_id ON admissions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_admissions_student_id ON admissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
      CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON admissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_admissions_app_number ON admissions(application_number);

      -- Create alias view student_admission_applications for schema compatibility
      CREATE OR REPLACE VIEW student_admission_applications AS SELECT * FROM admissions;
    `);

    // 3. Create course_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_number VARCHAR(50) UNIQUE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        submission_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        level VARCHAR(50) DEFAULT 'Beginner',
        description TEXT,
        syllabus_summary TEXT,
        documents JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        review_comments TEXT,
        admin_notes TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cs_course_id ON course_submissions(course_id);
      CREATE INDEX IF NOT EXISTS idx_cs_tenant_id ON course_submissions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_cs_status ON course_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_cs_created_at ON course_submissions(created_at);
    `);

    // 4. Create approval_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        reason TEXT,
        admin_notes TEXT,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ah_entity ON approval_history(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_ah_created_at ON approval_history(created_at);
    `);

    await client.query('COMMIT');
    console.log('Approvals tables successfully migrated!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateApprovals()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
