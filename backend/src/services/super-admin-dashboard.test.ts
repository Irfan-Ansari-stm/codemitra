import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { superAdminDashboardService } from './super-admin-dashboard.service';
import { pool } from '../db';

after(async () => {
  await pool.end();
});

test('Super Admin Dashboard Service', async (t) => {
  await t.test('getStats returns calculated platform metrics and trends', async () => {
    const stats = await superAdminDashboardService.getStats({ range: '30d' });

    assert.ok(stats.registeredUsers);
    assert.strictEqual(typeof stats.registeredUsers.total, 'number');
    assert.ok(Array.isArray(stats.registeredUsers.trend));
    assert.strictEqual(stats.registeredUsers.trend.length, 7);

    assert.ok(stats.activeTenants);
    assert.strictEqual(typeof stats.activeTenants.total, 'number');

    assert.ok(stats.pendingApprovals);
    assert.strictEqual(typeof stats.pendingApprovals.total, 'number');

    assert.ok(stats.publishedCourses);
    assert.strictEqual(typeof stats.publishedCourses.total, 'number');
  });

  await t.test('getUserDistribution returns counts and valid percentages', async () => {
    const dist = await superAdminDashboardService.getUserDistribution();

    assert.ok(dist.distribution);
    assert.ok(Array.isArray(dist.distribution));
    assert.strictEqual(dist.distribution.length, 4);

    const roles = dist.distribution.map(d => d.role);
    assert.ok(roles.includes('super_admin'));
    assert.ok(roles.includes('institution_admin'));
    assert.ok(roles.includes('institution_student'));
    assert.ok(roles.includes('general_student'));

    // Verify percentages sum is within reasonable bounds (if total > 0)
    if (dist.total > 0) {
      const sum = dist.distribution.reduce((acc, d) => acc + d.percentage, 0);
      assert.ok(sum >= 95 && sum <= 105);
    }
  });

  await t.test('getPlatformGrowth returns monthly series', async () => {
    const growth = await superAdminDashboardService.getPlatformGrowth(6);
    assert.ok(Array.isArray(growth));
    assert.strictEqual(growth.length, 6);
    assert.ok(growth[0].month);
    assert.strictEqual(typeof growth[0].users, 'number');
    assert.strictEqual(typeof growth[0].institutes, 'number');
  });

  await t.test('getTopInstitutions returns ranked list', async () => {
    const top = await superAdminDashboardService.getTopInstitutions(5);
    assert.ok(Array.isArray(top));
    if (top.length > 0) {
      assert.strictEqual(top[0].rank, 1);
      assert.ok(top[0].name);
      assert.ok(top[0].students !== undefined);
    }
  });

  await t.test('globalSearch searches users and resources', async () => {
    const searchRes = await superAdminDashboardService.globalSearch('admin');
    assert.ok(Array.isArray(searchRes.results));
  });

  await t.test('getPlatformHealth returns operational diagnostics', async () => {
    const health = await superAdminDashboardService.getPlatformHealth();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.database.status, 'connected');
    assert.ok(health.database.latencyMs >= 0);
  });
});
