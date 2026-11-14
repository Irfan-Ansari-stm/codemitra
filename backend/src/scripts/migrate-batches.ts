import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';

export async function migrateBatches() {
  console.log('--- Migrating Batches & Academic Structure Tables ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Academic Years
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ay_tenant_id ON academic_years(tenant_id);
    `);

    // 2. Semesters / Academic Terms
    await client.query(`
      CREATE TABLE IF NOT EXISTS semesters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        term_number INT DEFAULT 1,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sem_tenant_id ON semesters(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_sem_ay_id ON semesters(academic_year_id);
    `);

    // 3. Academic Programs
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        degree VARCHAR(100) DEFAULT 'B.Tech',
        department VARCHAR(100) DEFAULT 'Computer Science',
        duration_years INT DEFAULT 4,
        total_semesters INT DEFAULT 8,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ap_tenant_id ON academic_programs(tenant_id);
    `);

    // 4. Batches
    await client.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        description TEXT,
        department VARCHAR(100) DEFAULT 'Computer Science & Engineering',
        program_id UUID REFERENCES academic_programs(id) ON DELETE SET NULL,
        academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
        semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
        batch_type VARCHAR(50) NOT NULL DEFAULT 'undergraduate',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        admission_year INT NOT NULL DEFAULT 2022,
        graduation_year INT NOT NULL DEFAULT 2026,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '4 years'),
        current_term VARCHAR(50) DEFAULT 'Semester 6',
        max_capacity INT NOT NULL DEFAULT 60,
        coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_batches_tenant_id ON batches(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
      CREATE INDEX IF NOT EXISTS idx_batches_graduation_year ON batches(graduation_year);
      CREATE INDEX IF NOT EXISTS idx_batches_academic_year_id ON batches(academic_year_id);
    `);

    // 5. Batch Sections
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(50),
        capacity INT NOT NULL DEFAULT 60,
        instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        room VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bs_batch_id ON batch_sections(batch_id);
      CREATE INDEX IF NOT EXISTS idx_bs_tenant_id ON batch_sections(tenant_id);
    `);

    // 6. Student Batches (Enrollments)
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        section_id UUID REFERENCES batch_sections(id) ON DELETE SET NULL,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        roll_number VARCHAR(100),
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        enrolled_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        UNIQUE (batch_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_sb_batch_id ON student_batches(batch_id);
      CREATE INDEX IF NOT EXISTS idx_sb_student_id ON student_batches(student_id);
      CREATE INDEX IF NOT EXISTS idx_sb_section_id ON student_batches(section_id);
      CREATE INDEX IF NOT EXISTS idx_sb_tenant_id ON student_batches(tenant_id);
    `);

    // 7. Batch Courses
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (batch_id, course_id)
      );
      CREATE INDEX IF NOT EXISTS idx_bc_batch_id ON batch_courses(batch_id);
      CREATE INDEX IF NOT EXISTS idx_bc_course_id ON batch_courses(course_id);
    `);

    // 8. Platform Batch Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_batch_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
        default_academic_year VARCHAR(50) DEFAULT '2025-2026',
        default_semester VARCHAR(50) DEFAULT 'Semester 6',
        default_batch_capacity INT DEFAULT 60,
        batch_naming_pattern VARCHAR(100) DEFAULT '{dept}-{year}-{grad}',
        section_naming_convention VARCHAR(50) DEFAULT 'Alpha (Section A, B, C)',
        auto_generate_code BOOLEAN DEFAULT TRUE,
        strict_capacity_limit BOOLEAN DEFAULT TRUE,
        allow_cross_batch_transfer BOOLEAN DEFAULT TRUE,
        graduation_alert_months INT DEFAULT 6,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      INSERT INTO platform_batch_settings (id)
      VALUES ('global')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 9. Seed Initial Data if batches are empty
    const batchCountRes = await client.query('SELECT COUNT(*)::int AS count FROM batches');
    if (batchCountRes.rows[0].count === 0) {
      console.log('Seeding initial academic structure and batches...');

      // Find an institution (tenant)
      const tenantRes = await client.query('SELECT id, name FROM tenants WHERE NOT is_deleted ORDER BY created_at ASC LIMIT 1');
      if (tenantRes.rows[0]) {
        const tenantId = tenantRes.rows[0].id;

        // Academic Year
        const ayRes = await client.query(`
          INSERT INTO academic_years (tenant_id, name, start_date, end_date, is_active)
          VALUES ($1, '2025-2026 Academic Year', '2025-08-01', '2026-06-30', TRUE)
          RETURNING id
        `, [tenantId]);
        const ayId = ayRes.rows[0].id;

        // Semester
        const semRes = await client.query(`
          INSERT INTO semesters (tenant_id, academic_year_id, name, term_number, start_date, end_date, is_active)
          VALUES ($1, $2, 'Semester 6 (Spring 2026)', 6, '2026-01-10', '2026-05-31', TRUE)
          RETURNING id
        `, [tenantId, ayId]);
        const semId = semRes.rows[0].id;

        // Academic Program
        const progRes = await client.query(`
          INSERT INTO academic_programs (tenant_id, name, code, degree, department)
          VALUES ($1, 'B.Tech in Computer Science & Engineering', 'CSE-BTECH', 'B.Tech', 'Computer Science & Engineering')
          RETURNING id
        `, [tenantId]);
        const progId = progRes.rows[0].id;

        // Find an admin user for coordinator
        const adminRes = await client.query("SELECT id FROM users WHERE role IN ('super_admin', 'institution_admin') LIMIT 1");
        const coordinatorId = adminRes.rows[0]?.id || null;

        // Create Seed Batch 1: CSE 2022-2026
        const b1Res = await client.query(`
          INSERT INTO batches (
            tenant_id, name, code, description, department, program_id,
            academic_year_id, semester_id, batch_type, status,
            admission_year, graduation_year, start_date, end_date, current_term,
            max_capacity, coordinator_id
          ) VALUES (
            $1, 'CSE Class of 2026 Cohort', 'CSE-2022-26',
            'Final year undergraduate computer science engineering cohort with full-stack and cloud track specialization.',
            'Computer Science & Engineering', $2, $3, $4, 'undergraduate', 'active',
            2022, 2026, '2022-08-01', '2026-06-30', 'Semester 8',
            75, $5
          ) RETURNING id
        `, [tenantId, progId, ayId, semId, coordinatorId]);
        const b1Id = b1Res.rows[0].id;

        // Create Seed Batch 2: AI & DS 2023-2027
        const b2Res = await client.query(`
          INSERT INTO batches (
            tenant_id, name, code, description, department, program_id,
            academic_year_id, semester_id, batch_type, status,
            admission_year, graduation_year, start_date, end_date, current_term,
            max_capacity, coordinator_id
          ) VALUES (
            $1, 'AI & Data Science 2023-2027', 'AIDS-2023-27',
            'Artificial Intelligence and Machine Learning core batch focusing on deep learning, NLP, and distributed systems.',
            'Artificial Intelligence & Data Science', $2, $3, $4, 'undergraduate', 'active',
            2023, 2027, '2023-08-01', '2027-06-30', 'Semester 6',
            60, $5
          ) RETURNING id
        `, [tenantId, progId, ayId, semId, coordinatorId]);
        const b2Id = b2Res.rows[0].id;

        // Create Sections for Batch 1
        const sec1Res = await client.query(`
          INSERT INTO batch_sections (batch_id, tenant_id, name, code, capacity, room)
          VALUES ($1, $2, 'Section A', 'CSE-A', 40, 'Lab Complex B-302')
          RETURNING id
        `, [b1Id, tenantId]);
        const sec1Id = sec1Res.rows[0].id;

        await client.query(`
          INSERT INTO batch_sections (batch_id, tenant_id, name, code, capacity, room)
          VALUES ($1, $2, 'Section B', 'CSE-B', 35, 'Seminar Hall 1')
        `, [b1Id, tenantId]);

        // Enroll existing institution students into Batch 1 Section A
        const studentsRes = await client.query(`
          SELECT id FROM users
          WHERE (role = 'institution_student' OR tenant_id = $1)
            AND NOT is_deleted
          LIMIT 10
        `, [tenantId]);

        let roll = 1;
        for (const st of studentsRes.rows) {
          await client.query(`
            INSERT INTO student_batches (batch_id, student_id, section_id, tenant_id, status, roll_number)
            VALUES ($1, $2, $3, $4, 'active', $5)
            ON CONFLICT (batch_id, student_id) DO NOTHING
          `, [b1Id, st.id, sec1Id, tenantId, `22CSE${String(roll++).padStart(3, '0')}`]);
        }

        // Assign a course if any courses exist
        const courseRes = await client.query('SELECT id FROM courses LIMIT 2');
        for (const c of courseRes.rows) {
          await client.query(`
            INSERT INTO batch_courses (batch_id, course_id, tenant_id, semester_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (batch_id, course_id) DO NOTHING
          `, [b1Id, c.id, tenantId, semId]);
        }

        console.log('Seeded initial batches, sections, enrollments, and course assignments successfully.');
      }
    }

    await client.query('COMMIT');
    console.log('--- Batches Migration Completed Successfully ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateBatches()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
