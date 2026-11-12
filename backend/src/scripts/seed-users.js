const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:Admin123@localhost:5432/codemitra?sslmode=disable';

const pool = new Pool({ connectionString });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Connected to database successfully.');
    await client.query('BEGIN');

    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    console.log('Generated bcrypt hash for Password123!');

    // 1. Ensure Demo Tenant exists
    const tenantId = '00000000-0000-0000-0000-000000000010';
    await client.query(`
      INSERT INTO tenants (id, name, slug, plan, max_students, is_active)
      VALUES ($1, 'Demo Engineering College', 'demo-college', 'pro', 1000, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        is_active = true;
    `, [tenantId]);

    // 2. Define users to seed/update
    const usersToSeed = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'superadmin@codeverse.in',
        name: 'CodeVerse Super Admin',
        role: 'super_admin',
        tenantId: null,
        metadata: { seed: 'codemitra-dev', role_description: 'Platform Super Admin' },
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'superadmin@codemitra.local',
        name: 'CodeMitra Super Admin',
        role: 'super_admin',
        tenantId: null,
        metadata: { seed: 'codemitra-dev', role_description: 'Platform Super Admin' },
      },
      {
        id: '00000000-0000-0000-0000-000000000020',
        email: 'admin@demo.codemitra.local',
        name: 'Demo Institution Admin',
        role: 'institution_admin',
        tenantId: tenantId,
        metadata: { seed: 'codemitra-dev', role_description: 'Institution Administrator' },
      },
      {
        id: '47a353f7-b7ee-4633-9695-3063e22d64f8',
        email: 'admin@demo-college.edu',
        name: 'College Admin',
        role: 'institution_admin',
        tenantId: tenantId,
        metadata: { seed: 'codemitra-dev', role_description: 'Institution Administrator' },
      },
      {
        id: '00000000-0000-0000-0000-000000000021',
        email: 'student@demo.codemitra.local',
        name: 'Demo College Student',
        role: 'institution_student',
        tenantId: tenantId,
        metadata: {
          seed: 'codemitra-dev',
          enrollment_number: 'DEMO-001',
          batch: '2026',
          year: 1,
          department: 'Computer Science',
        },
      },
      {
        id: '45bfe5c6-1917-4ddc-9b0b-3ac02b4490bf',
        email: 'student@demo-college.edu',
        name: 'College Student',
        role: 'institution_student',
        tenantId: tenantId,
        metadata: {
          seed: 'codemitra-dev',
          enrollment_number: 'DEMO-002',
          batch: '2026',
          year: 2,
          department: 'Information Technology',
        },
      },
      {
        id: '00000000-0000-0000-0000-000000000022',
        email: 'learner@demo.codemitra.local',
        name: 'Demo Public Learner',
        role: 'general_student',
        tenantId: null,
        metadata: { seed: 'codemitra-dev', role_description: 'Public Self-Registered Student' },
      },
      {
        id: '00000000-0000-0000-0000-000000000023',
        email: 'student@codeverse.in',
        name: 'CodeVerse Public Student',
        role: 'general_student',
        tenantId: null,
        metadata: { seed: 'codemitra-dev', role_description: 'Public Self-Registered Student' },
      },
    ];

    for (const u of usersToSeed) {
      await client.query(`
        INSERT INTO users (
          id, tenant_id, email, password_hash, name, role,
          is_email_verified, is_active, is_deleted, login_attempt_count, locked_until, metadata, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          true, true, false, 0, NULL, $7, NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          name = EXCLUDED.name,
          tenant_id = EXCLUDED.tenant_id,
          is_email_verified = true,
          is_active = true,
          is_deleted = false,
          login_attempt_count = 0,
          locked_until = NULL,
          metadata = EXCLUDED.metadata,
          updated_at = NOW();
      `, [u.id, u.tenantId, u.email, passwordHash, u.name, u.role, JSON.stringify(u.metadata)]);

      // If user is student, ensure user_stats row exists
      if (u.role === 'institution_student' || u.role === 'general_student') {
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
        const actualUserId = userRes.rows[0].id;
        await client.query(`
          INSERT INTO user_stats (
            user_id, tenant_id, total_problems_solved, easy_solved, medium_solved, hard_solved,
            total_submissions, accepted_submissions, current_streak_days, max_streak_days, total_score
          )
          SELECT $1, $2, 5, 3, 2, 0, 8, 5, 3, 5, 45
          WHERE NOT EXISTS (
            SELECT 1 FROM user_stats WHERE user_id = $1
          );
        `, [actualUserId, u.tenantId]);
      }
      console.log(`Seeded user: [${u.role}] ${u.email}`);
    }

    await client.query('COMMIT');
    console.log('\nSeeding transaction committed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding transaction failed and rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
