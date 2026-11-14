import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../db';
import { superAdminBatchService } from './batch.service';

after(async () => {
  await pool.end();
});

test('Super Admin Batches & Cohorts Service Suite', async (t) => {
  let createdBatchId: string;
  let testTenantId: string;
  let testStudentId: string;
  let testSectionId: string;
  const uniqueStamp = Date.now();

  // Find or create test institution
  const tenantRes = await pool.query('SELECT id FROM tenants WHERE NOT is_deleted LIMIT 1');
  assert.ok(tenantRes.rows[0], 'An active institution should exist');
  testTenantId = tenantRes.rows[0].id;

  // Find or create an active student
  let studentRes = await pool.query("SELECT id FROM users WHERE role = 'institution_student' AND NOT is_deleted LIMIT 1");
  if (!studentRes.rows[0]) {
    studentRes = await pool.query(`
      INSERT INTO users (email, name, password_hash, role, tenant_id)
      VALUES ($1, 'Batch Test Student', 'hash', 'institution_student', $2)
      RETURNING id
    `, [`batch_student_${uniqueStamp}@codeverse.test`, testTenantId]);
  }
  testStudentId = studentRes.rows[0]?.id;

  await t.test('1. Get platform batch analytics', async () => {
    const analytics = await superAdminBatchService.getAnalytics();
    assert.ok(typeof analytics.activeBatches === 'number');
    assert.ok(typeof analytics.totalBatches === 'number');
    assert.ok(typeof analytics.enrolledStudents === 'number');
    assert.ok(typeof analytics.averageProgress === 'number');
    assert.ok(typeof analytics.graduationDue === 'number');
  });

  await t.test('2. List batches with filters and pagination', async () => {
    const result = await superAdminBatchService.listBatches({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    assert.ok(typeof result.total === 'number');
    assert.ok(Array.isArray(result.data));
    assert.ok(result.page === 1);
  });

  await t.test('3. Create a new batch with automatic Section A', async () => {
    const adminUser = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const adminId = adminUser.rows[0].id;

    const newBatch = await superAdminBatchService.createBatch({
      tenantId: testTenantId,
      name: `Test Cohort ${uniqueStamp}`,
      code: `TC-${uniqueStamp.toString().slice(-6)}`,
      description: 'Automated test cohort description',
      department: 'Computer Science',
      batchType: 'undergraduate',
      status: 'active',
      admissionYear: 2023,
      graduationYear: 2027,
      maxCapacity: 50,
      createDefaultSection: true,
    }, adminId);

    createdBatchId = newBatch.id;
    assert.ok(createdBatchId);
    assert.strictEqual(newBatch.name, `Test Cohort ${uniqueStamp}`);
    assert.strictEqual(newBatch.max_capacity, 50);

    // Verify default section was created
    const sections = await superAdminBatchService.getSections(createdBatchId);
    assert.ok(sections.length >= 1);
    assert.strictEqual(sections[0].name, 'Section A');
    testSectionId = sections[0].id;
  });

  await t.test('4. Prevent duplicate batch code in same institution', async () => {
    const adminUser = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const adminId = adminUser.rows[0].id;

    await assert.rejects(
      async () => {
        await superAdminBatchService.createBatch({
          tenantId: testTenantId,
          name: `Duplicate Attempt ${uniqueStamp}`,
          code: `TC-${uniqueStamp.toString().slice(-6)}`,
        }, adminId);
      },
      { code: 'DUPLICATE_CODE' }
    );
  });

  await t.test('5. Update batch metadata and status', async () => {
    const adminUser = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const adminId = adminUser.rows[0].id;

    const updated = await superAdminBatchService.updateBatch(
      createdBatchId,
      { maxCapacity: 65, description: 'Updated test description' },
      adminId
    );
    assert.strictEqual(updated.max_capacity, 65);
    assert.strictEqual(updated.description, 'Updated test description');
  });

  await t.test('6. Create section, list sections, and delete section', async () => {
    const secB = await superAdminBatchService.createSection(createdBatchId, {
      name: 'Section B',
      code: 'SEC-B',
      capacity: 35,
      room: 'Room 404',
    });
    assert.ok(secB.id);
    assert.strictEqual(secB.name, 'Section B');

    const sections = await superAdminBatchService.getSections(createdBatchId);
    assert.strictEqual(sections.length, 2);

    const delRes = await superAdminBatchService.deleteSection(secB.id);
    assert.strictEqual(delRes.success, true);
  });

  await t.test('7. Student enrollment, retrieval, and removal', async () => {
    if (testStudentId) {
      const adminUser = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
      const adminId = adminUser.rows[0].id;

      // Ensure student tenant matches
      await pool.query('UPDATE users SET tenant_id = $1 WHERE id = $2', [testTenantId, testStudentId]);

      const enrollment = await superAdminBatchService.enrollStudent(
        createdBatchId,
        testStudentId,
        testSectionId,
        'ROLL-101',
        adminId
      );
      assert.ok(enrollment.id);
      assert.strictEqual(enrollment.roll_number, 'ROLL-101');

      const enrolledList = await superAdminBatchService.getBatchStudents(createdBatchId);
      assert.ok(enrolledList.some((s: any) => s.student_id === testStudentId));

      const removeRes = await superAdminBatchService.removeStudent(createdBatchId, testStudentId);
      assert.strictEqual(removeRes.success, true);
    }
  });

  await t.test('8. Platform settings retrieval and update', async () => {
    const settings = await superAdminBatchService.getSettings();
    assert.ok(settings.id === 'global');

    const updated = await superAdminBatchService.updateSettings({
      defaultBatchCapacity: 75,
      defaultSemester: 'Semester 7',
    });
    assert.strictEqual(updated.default_batch_capacity, 75);
    assert.strictEqual(updated.default_semester, 'Semester 7');
  });

  await t.test('9. Export batches dataset', async () => {
    const exported = await superAdminBatchService.exportBatches();
    assert.ok(Array.isArray(exported));
    assert.ok(exported.length >= 1);
  });

  await t.test('10. Archive and soft delete batch', async () => {
    const adminUser = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const adminId = adminUser.rows[0].id;

    const delRes = await superAdminBatchService.deleteBatch(createdBatchId, adminId);
    assert.strictEqual(delRes.success, true);
    assert.strictEqual(delRes.data.is_deleted, true);
    assert.strictEqual(delRes.data.status, 'archived');
  });
});
