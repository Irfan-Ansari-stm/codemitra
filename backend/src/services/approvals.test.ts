import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../db';
import { approvalsService } from './approvals.service';

after(async () => {
  await pool.end();
});

test('Workflow Approvals Hub Service Suite', async (t) => {
  let adminUserId: string;

  // Retrieve admin user id for action auditing
  const adminRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
  adminUserId = adminRes.rows[0]?.id || '00000000-0000-0000-0000-000000000001';

  await t.test('1. Summary metrics returns dynamic counts and aggregates', async () => {
    const summary = await approvalsService.getSummary();
    assert.ok(summary);
    assert.ok(summary.counts);
    assert.strictEqual(typeof summary.counts.institutes, 'number');
    assert.strictEqual(typeof summary.counts.admissions, 'number');
    assert.strictEqual(typeof summary.counts.courses, 'number');
    assert.strictEqual(typeof summary.counts.total, 'number');
    assert.strictEqual(
      summary.counts.total,
      summary.counts.institutes + summary.counts.admissions + summary.counts.courses
    );
    assert.strictEqual(typeof summary.counts.approvedToday, 'number');
    assert.strictEqual(typeof summary.counts.rejectedToday, 'number');
  });

  await t.test('2. Institute Applications: listing, filtering, search, and lifecycle', async () => {
    // List all
    const allList = await approvalsService.listInstitutes({ page: 1, limit: 10 });
    assert.ok(allList.items.length > 0);
    assert.ok(allList.total > 0);

    // Filter by status 'pending'
    const pendingList = await approvalsService.listInstitutes({ status: 'pending', page: 1, limit: 10 });
    assert.ok(pendingList.items.every((item: any) => item.status === 'pending'));

    // Search by name
    const searchResult = await approvalsService.listInstitutes({ search: 'Vellore' });
    assert.ok(searchResult.items.length > 0);
    assert.ok(searchResult.items[0].institution_name.includes('Vellore'));

    // Create a temporary test application for action validation
    const tempInsert = await pool.query(`
      INSERT INTO institute_applications (
        application_number, institution_name, slug, contact_email, status
      ) VALUES (
        'INS-TEST-001', 'Test Engineering College', 'test-eng-college', 'test@college.edu', 'pending'
      ) RETURNING id
    `);
    const testAppId = tempInsert.rows[0].id;

    // Fetch detail
    const details = await approvalsService.getInstitute(testAppId);
    assert.ok(details);
    assert.strictEqual(details.institution_name, 'Test Engineering College');

    // Request changes
    const reqChanges = await approvalsService.requestInstituteChanges(
      testAppId,
      adminUserId,
      'Please submit updated AICTE affiliation letter.'
    );
    assert.strictEqual(reqChanges.success, true);
    const updated1 = await approvalsService.getInstitute(testAppId);
    assert.strictEqual(updated1?.status, 'changes_requested');
    assert.strictEqual(updated1?.admin_notes, 'Please submit updated AICTE affiliation letter.');

    // Approve
    const approveResult = await approvalsService.approveInstitute(
      testAppId,
      adminUserId,
      'Accreditation credentials verified successfully.'
    );
    assert.strictEqual(approveResult.success, true);
    const updated2 = await approvalsService.getInstitute(testAppId);
    assert.strictEqual(updated2?.status, 'approved');

    // Rejection validation (reason must be present)
    await assert.rejects(
      async () => approvalsService.rejectInstitute(testAppId, adminUserId, ''),
      /Rejection reason is required/
    );

    // Reject with reason
    const rejectResult = await approvalsService.rejectInstitute(
      testAppId,
      adminUserId,
      'Invalid certificate uploaded.'
    );
    assert.strictEqual(rejectResult.success, true);
    const updated3 = await approvalsService.getInstitute(testAppId);
    assert.strictEqual(updated3?.status, 'rejected');
    assert.strictEqual(updated3?.rejection_reason, 'Invalid certificate uploaded.');

    // Verify audit history was captured
    assert.ok(updated3?.history.length >= 3);

    // Cleanup
    await pool.query('DELETE FROM approval_history WHERE entity_id = $1', [testAppId]);
    await pool.query('DELETE FROM institute_applications WHERE id = $1', [testAppId]);
  });

  await t.test('3. Student Admissions: listing, filtering, search, and lifecycle', async () => {
    // List all
    const allAdmissions = await approvalsService.listAdmissions({ page: 1, limit: 10 });
    assert.ok(allAdmissions.items.length > 0);
    assert.ok(allAdmissions.total >= 20);

    // Filter by status 'pending'
    const pendingAdmissions = await approvalsService.listAdmissions({ status: 'pending' });
    assert.ok(pendingAdmissions.items.length >= 10);
    assert.ok(pendingAdmissions.items.every((a: any) => a.status === 'pending'));

    // Search by student name
    const searchAdm = await approvalsService.listAdmissions({ search: 'Aarav' });
    assert.ok(searchAdm.items.length > 0);
    assert.strictEqual(searchAdm.items[0].full_name, 'Aarav Mehta');

    // Create a temporary admission record
    const tenantRes = await pool.query('SELECT id FROM tenants LIMIT 1');
    const tenantId = tenantRes.rows[0].id;
    const tempAdm = await pool.query(`
      INSERT INTO admissions (
        application_number, tenant_id, full_name, email, program, status
      ) VALUES (
        'ADM-TEST-999', $1, 'Test Candidate', 'candidate@test.com', 'B.Tech IT', 'pending'
      ) RETURNING id
    `, [tenantId]);
    const testAdmId = tempAdm.rows[0].id;

    // Approve admission
    const appAdmRes = await approvalsService.approveAdmission(testAdmId, adminUserId, 'Documents verified.');
    assert.strictEqual(appAdmRes.success, true);

    const admDetails = await approvalsService.getAdmission(testAdmId);
    assert.strictEqual(admDetails?.status, 'approved');

    // Reject admission
    const rejAdmRes = await approvalsService.rejectAdmission(testAdmId, adminUserId, 'Did not meet math cutoff.');
    assert.strictEqual(rejAdmRes.success, true);

    // Cleanup
    await pool.query('DELETE FROM approval_history WHERE entity_id = $1', [testAdmId]);
    await pool.query('DELETE FROM admissions WHERE id = $1', [testAdmId]);
  });

  await t.test('4. Course Submissions: listing, filtering, search, and lifecycle', async () => {
    // List all
    const allCourses = await approvalsService.listCourses({ page: 1, limit: 10 });
    assert.ok(allCourses.items.length > 0);
    assert.ok(allCourses.total >= 15);

    // Filter by status 'pending'
    const pendingCourses = await approvalsService.listCourses({ status: 'pending' });
    assert.ok(pendingCourses.items.length >= 7);
    assert.ok(pendingCourses.items.every((c: any) => c.status === 'pending'));

    // Search by title
    const searchCourse = await approvalsService.listCourses({ search: 'Distributed' });
    assert.ok(searchCourse.items.length > 0);
    assert.ok(searchCourse.items[0].title.includes('Distributed Systems'));

    // Create a temporary course and course_submission
    const courseRes = await pool.query('SELECT id, tenant_id, created_by FROM courses LIMIT 1');
    const c = courseRes.rows[0];
    const tempSub = await pool.query(`
      INSERT INTO course_submissions (
        submission_number, course_id, tenant_id, instructor_id, title, status
      ) VALUES (
        'SUB-TEST-999', $1, $2, $3, 'Test Course Pipeline', 'pending'
      ) RETURNING id
    `, [c.id, c.tenant_id, c.created_by]);
    const testSubId = tempSub.rows[0].id;

    // Request changes
    const reqCourseChg = await approvalsService.requestCourseChanges(
      testSubId,
      adminUserId,
      'Add week 6 assignment test cases.'
    );
    assert.strictEqual(reqCourseChg.success, true);

    // Approve course
    const appCourse = await approvalsService.approveCourse(
      testSubId,
      adminUserId,
      'Course approved and published.'
    );
    assert.strictEqual(appCourse.success, true);

    const subDetails = await approvalsService.getCourse(testSubId);
    assert.strictEqual(subDetails?.status, 'approved');

    // Cleanup
    await pool.query('DELETE FROM approval_history WHERE entity_id = $1', [testSubId]);
    await pool.query('DELETE FROM course_submissions WHERE id = $1', [testSubId]);
  });

  await t.test('5. Audit history tracking', async () => {
    const history = await approvalsService.getAuditHistory();
    assert.ok(Array.isArray(history));
    assert.ok(history.length > 0);
  });
});
