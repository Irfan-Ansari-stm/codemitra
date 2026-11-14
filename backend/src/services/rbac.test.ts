import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { rbacService } from './rbac.service';
import { pool } from '../db';

after(async () => {
  await pool.end();
});

test('RBAC Service and Roles', async (t) => {
  await t.test('listRoles returns system roles including super_admin', async () => {
    const roles = await rbacService.listRoles();
    assert.ok(Array.isArray(roles));
    assert.ok(roles.length >= 4);

    const superAdminRole = roles.find((r: any) => r.slug === 'super_admin');
    assert.ok(superAdminRole);
    assert.strictEqual(superAdminRole.isSystem, true);
  });

  await t.test('listPermissions returns grouped permissions', async () => {
    const perms = await rbacService.listPermissions();
    assert.ok(Array.isArray(perms.all));
    assert.ok(perms.all.length > 20);
    assert.ok(perms.grouped.users);
    assert.ok(perms.grouped.roles);
    assert.ok(perms.grouped.institutions);
  });

  await t.test('prevent deletion of system role', async () => {
    const roles = await rbacService.listRoles();
    const superAdmin = roles.find((r: any) => r.slug === 'super_admin');
    assert.ok(superAdmin);

    await assert.rejects(
      async () => {
        await rbacService.deleteRole(superAdmin.id);
      },
      (err: any) => {
        return err.statusCode === 400 && err.code === 'PROTECTED_ROLE';
      }
    );
  });

  await t.test('create, duplicate, and delete custom role', async () => {
    const customSlug = `test_reviewer_${Date.now()}`;
    const newRole = await rbacService.createRole({
      name: 'Test Reviewer',
      slug: customSlug,
      description: 'Role for testing custom creation',
    });
    assert.strictEqual(newRole.slug, customSlug);
    assert.strictEqual(newRole.isSystem, false);

    // Duplicate custom role
    const dupSlug = `${customSlug}_copy`;
    const dupRole = await rbacService.duplicateRole(newRole.id, 'Test Reviewer Copy', dupSlug);
    assert.strictEqual(dupRole.slug, dupSlug);

    // Clean up
    await rbacService.deleteRole(newRole.id);
    await rbacService.deleteRole(dupRole.id);
  });
});
