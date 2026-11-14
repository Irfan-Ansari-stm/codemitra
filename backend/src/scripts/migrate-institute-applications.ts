import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';

export async function migrateInstituteApplications() {
  console.log('--- Migrating institute_applications Table ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS institute_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        applicant_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        institution_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50),
        website_url TEXT,
        address TEXT,
        description TEXT,
        documents JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        review_note TEXT,
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ia_applicant_user_id ON institute_applications(applicant_user_id);
      CREATE INDEX IF NOT EXISTS idx_ia_status ON institute_applications(status);
      CREATE INDEX IF NOT EXISTS idx_ia_created_at ON institute_applications(created_at);
    `);

    // Check if there are any existing applications
    const existing = await client.query('SELECT COUNT(*)::int AS count FROM institute_applications');
    if (existing.rows[0].count === 0) {
      console.log('Seeding demo pending institute application...');
      // Find a general student user to be applicant
      const student = await client.query("SELECT id FROM users WHERE role = 'general_student' LIMIT 1");
      const applicantId = student.rows[0]?.id || null;

      await client.query(`
        INSERT INTO institute_applications (
          applicant_user_id, institution_name, slug, contact_email, contact_phone,
          website_url, address, description, status, created_at
        ) VALUES (
          $1, 'Apex Institute of Technology', 'apex-institute-of-technology',
          'admissions@apex.edu.in', '+91 98765 43210', 'https://apex.edu.in',
          'Sector 62, Noida, Uttar Pradesh, India',
          'Premier engineering and computer science polytechnic requesting CodeMitra campus platform integration.',
          'pending', NOW() - INTERVAL '2 days'
        );
      `, [applicantId]);
      console.log('Demo application seeded.');
    }

    await client.query('COMMIT');
    console.log('institute_applications table successfully migrated!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error migrating institute_applications:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateInstituteApplications()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
