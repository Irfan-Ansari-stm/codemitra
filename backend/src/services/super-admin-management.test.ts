import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../db';
import { rbacService } from './rbac.service';
import { userService } from './user.service';
import { tenantService } from './tenant.service';
import { instituteApplicationService } from './institute-application.service';

after(async () => {
  await pool.end();
});

test('Super Admin Complete Management Suite', async (t) => {
  let createdTenantId: string;
  let testUserId: string;
  let customRoleId: string;
  const uniqueStamp = Date.now();

  await t.test('Phase 2 & 3: Role and Permission Management', async () => {
    // 1. List roles
    const roles = await rbacService.listRoles();
    assert.ok(roles.length >= 4);
    const superAdmin = roles.find((r: any) => r.slug === 'super_admin');
    assert.ok(superAdmin && superAdmin.isSystem);

    // 2. Create custom role
    const slug = `curator_${uniqueStamp}`;
    const role = await rbacService.createRole({
      name: 'Curator Role',
      slug,
      description: 'Custom curator role for content management',
    });
    customRoleId = role.id;
    assert.strictEqual(role.slug, slug);
    assert.strictEqual(role.isSystem, false);

    // 3. Update permissions for role
    const allPerms = await rbacService.listPermissions();
    const userViewPerm = allPerms.all.find((p: any) => p.slug === 'users.view');
    assert.ok(userViewPerm);

    const updatePerms = await rbacService.updateRolePermissions(customRoleId, [userViewPerm.id]);
    assert.strictEqual(updatePerms.count, 1);

    const rolePerms = await rbacService.getRolePermissions(customRoleId);
    assert.strictEqual(rolePerms.length, 1);
    assert.strictEqual(rolePerms[0].slug, 'users.view');

    // 4. Update role details
    const updatedRole = await rbacService.updateRole(customRoleId, {
      name: 'Lead Curator Role',
      isActive: false,
    });
    assert.strictEqual(updatedRole.name, 'Lead Curator Role');
    assert.strictEqual(updatedRole.isActive, false);

    // Reactivate
    await rbacService.updateRole(customRoleId, { isActive: true });
  });

  await t.test('Phase 5: Institution Management', async () => {
    // 1. Create institution
    const tenantSlug = `metro-tech-${uniqueStamp}`;
    const tenant = await tenantService.create({
      name: `Metro Tech ${uniqueStamp}`,
      slug: tenantSlug,
      plan: 'pro',
      maxStudents: 200,
      contactEmail: `contact@metrotech-${uniqueStamp}.edu`,
      contactPhone: '+1-555-123-4567',
      websiteUrl: 'https://metrotech.edu',
      address: '100 Innovation Way',
    });
    createdTenantId = tenant.id;
    assert.ok(tenant.id);
    assert.strictEqual(tenant.slug, tenantSlug);
    assert.strictEqual(tenant.plan, 'pro');

    // 2. Get institution details (with student and admin aggregates)
    const details = await tenantService.getById(createdTenantId);
    assert.strictEqual(details.id, createdTenantId);
    assert.strictEqual(details.name, `Metro Tech ${uniqueStamp}`);
    assert.strictEqual(typeof details.total_students, 'number');
    assert.strictEqual(typeof details.active_students, 'number');
    assert.ok(Array.isArray(details.admins));

    // 3. Update institution
    const updated = await tenantService.update(createdTenantId, {
      name: `Metro Tech University ${uniqueStamp}`,
      maxStudents: 350,
    });
    assert.strictEqual(updated.name, `Metro Tech University ${uniqueStamp}`);
    assert.strictEqual(updated.max_students, 350);

    // 4. Search institution
    const searchRes = await tenantService.list(1, 10, tenantSlug);
    assert.ok(searchRes.data.length >= 1);
    assert.strictEqual(searchRes.data[0].slug, tenantSlug);
  });

  await t.test('Phase 4: User Management and Role Assignments', async () => {
    // 1. Unified directory count & listing
    const userList = await userService.list(undefined, 1, 10);
    assert.ok(userList.total > 0);
    assert.ok(userList.data.length > 0);

    // 2. Create Institution Admin assigned to tenant
    const adminUser = await userService.createInstitutionUser({
      tenantId: createdTenantId,
      name: `Admin User ${uniqueStamp}`,
      email: `admin.${uniqueStamp}@metrotech.edu`,
      password: 'SecurePassword123!',
      role: 'institution_admin',
      phone: '+1-555-999-0000',
    });
    testUserId = adminUser.id;
    assert.ok(adminUser.id);
    assert.strictEqual(adminUser.role, 'institution_admin');
    assert.strictEqual(adminUser.tenant_id, createdTenantId);

    // 3. Verify institution details now reflect the newly created admin
    const instDetails = await tenantService.getById(createdTenantId);
    assert.ok(instDetails.admins.some((a: any) => a.id === testUserId));

    // 4. Change user role to custom role
    const roleChange = await userService.updateRole(testUserId, `curator_${uniqueStamp}`);
    assert.ok(roleChange.success);

    // 5. Update user status to suspended
    const suspendRes = await userService.updateStatus(testUserId, true, true, 'Violation of conduct');
    assert.strictEqual(suspendRes.metadata?.isSuspended, true);

    // 6. Reactivate user
    const reactivateRes = await userService.updateStatus(testUserId, true, false);
    assert.strictEqual(reactivateRes.metadata?.isSuspended, false);

    // 7. Password reset
    await userService.resetPassword(testUserId, undefined, 'NewSecurePassword123!');
  });

  await t.test('Phase 6: Pending Applications Review Workflow', async () => {
    // 1. List pending applications
    const pendingList = await instituteApplicationService.list(1, 10, 'pending');
    assert.ok(Array.isArray(pendingList.data));

    // 2. Find or create an application to test review workflow
    const studentUser = await pool.query("SELECT id FROM users WHERE role = 'general_student' LIMIT 1");
    assert.ok(studentUser.rows[0], 'General student should exist');

    const appSlug = `test-campus-${uniqueStamp}`;
    const createdApp = await pool.query(`
      INSERT INTO institute_applications (
        applicant_user_id, institution_name, slug, contact_email, status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [studentUser.rows[0].id, `Test Campus ${uniqueStamp}`, appSlug, `campus.${uniqueStamp}@test.edu`]);

    const appId = createdApp.rows[0].id;
    assert.ok(appId);

    // 3. Review: Reject with note
    const superAdminUser = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const reviewerId = superAdminUser.rows[0].id;

    const rejectedApp = await instituteApplicationService.review(
      appId,
      reviewerId,
      'rejected',
      'Please submit official university accreditation certificate.'
    );
    assert.strictEqual(rejectedApp.status, 'rejected');
    assert.strictEqual(rejectedApp.review_note, 'Please submit official university accreditation certificate.');
  });

  await t.test('Phase 7: General Users & Query Operator Regression Test', async () => {
    // This directly tests the operator mismatch bug (u.role::text = $1 OR r.slug = $1)
    const generalUsers = await userService.list(undefined, 1, 20, 'general_student');
    assert.ok(typeof generalUsers.total === 'number');
    assert.ok(Array.isArray(generalUsers.data));

    // Verify all returned records have tenant_id null
    for (const u of generalUsers.data) {
      assert.strictEqual(u.tenant_id, null, 'General users must not be associated with a tenant');
    }
  });

  await t.test('Phase 8: Cross-Institute Students Management & Actions', async () => {
    const { superAdminStudentsService } = await import('./admin.service');
    const students = await superAdminStudentsService.listStudents({ page: 1, limit: 10 });
    assert.ok(typeof students.total === 'number');
    assert.ok(Array.isArray(students.data));

    if (students.data.length > 0) {
      const firstStudent = students.data[0];
      const details = await superAdminStudentsService.getStudentDetails(firstStudent.id);
      assert.strictEqual(details.id, firstStudent.id);

      // Verify toggle verification status
      const updatedVerify = await superAdminStudentsService.verifyStudent(
        firstStudent.id,
        true,
        firstStudent.id
      );
      assert.strictEqual(updatedVerify.is_email_verified, true);
    }
  });

  await t.test('Cleanup: Safe Deletion of custom role and test institution', async () => {
    // Unassign role before deleting
    await pool.query('DELETE FROM user_roles WHERE role_id = $1', [customRoleId]);
    const deleteRoleRes = await rbacService.deleteRole(customRoleId);
    assert.ok(deleteRoleRes.success);

    // Soft delete institution
    await tenantService.softDelete(createdTenantId);
    const instCheck = await pool.query('SELECT is_deleted FROM tenants WHERE id = $1', [createdTenantId]);
    assert.strictEqual(instCheck.rows[0].is_deleted, true);
  });
});
