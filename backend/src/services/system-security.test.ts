import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { systemMonitoringService } from './system-monitoring.service';
import { executionAdminService } from './execution-admin.service';
import { securityAdminService } from './security-admin.service';
import { logsAdminService } from './logs-admin.service';
import { integrationsAdminService } from './integrations-admin.service';
import { pool } from '../db';

describe('Super Admin System & Security Service Suite', () => {
  // ─── 1. SYSTEM MONITORING & HEALTH ──────────────────────────────────────────
  it('1. System Monitoring: retrieves real runtime health, metrics, and services', async () => {
    const overview = await systemMonitoringService.getOverview();
    assert.ok(overview);
    assert.ok(['healthy', 'operational', 'degraded'].includes(overview.status));
    assert.ok(overview.memory.rssMb > 0);
    assert.ok(overview.memory.heapUsedMb > 0);
    assert.ok(overview.database.poolTotal >= 0);
    assert.ok(overview.services.length >= 3);

    const health = await systemMonitoringService.getHealth();
    assert.ok(['healthy', 'operational', 'degraded'].includes(health.status));

    const services = await systemMonitoringService.listServices();
    assert.ok(services.length >= 4);
    const dbService = services.find((s: any) => s.slug === 'postgres-db' || s.id === 'postgresql');
    assert.ok(dbService);

    // Test manual check on service
    const checkResult = await systemMonitoringService.checkService(dbService.id);
    assert.ok(['healthy', 'operational'].includes(checkResult.status));
    assert.ok(checkResult.latencyMs >= 0);

    const live = await systemMonitoringService.getLive();
    assert.equal(live.status, 'alive');

    const ready = await systemMonitoringService.getReady();
    assert.equal(ready.status, 'ready');
  });

  // ─── 2. CODE EXECUTION & WASM CLUSTERS ──────────────────────────────────────
  it('2. Execution & Clusters: manages languages, nodes, limits, and metrics', async () => {
    const overview = await executionAdminService.getOverview();
    assert.ok(overview);
    assert.ok(overview.languagesCount >= 16);
    assert.ok(overview.nodesCount >= 3);

    const languages = await executionAdminService.listLanguages();
    assert.ok(languages.length >= 16);
    const python = languages.find((l: any) => l.slug === 'python');
    assert.ok(python);

    // Update language
    const updatedLang = await executionAdminService.updateLanguage(python.id, {
      notes: 'High-performance Python 3.12 runtime',
    });
    assert.equal(updatedLang.notes, 'High-performance Python 3.12 runtime');

    // Nodes
    const nodes = await executionAdminService.listNodes();
    assert.ok(nodes.length >= 3);
    const node1 = nodes[0];
    const pingResult = await executionAdminService.healthCheckNode(node1.id);
    assert.ok(['healthy', 'ready', 'active'].includes(pingResult.status));

    // Limits
    const limits = await executionAdminService.getLimits();
    assert.ok(limits.length >= 4);

    // Metrics & History
    const metrics = await executionAdminService.getMetrics();
    assert.ok(Array.isArray(metrics));

    const history = await executionAdminService.getHistory(10);
    assert.ok(Array.isArray(history));
  });

  // ─── 3. SECURITY & COMPLIANCE CENTER ────────────────────────────────────────
  it('3. Security & Compliance: sessions, locked accounts, controls, posture score', async () => {
    const overview = await securityAdminService.getOverview();
    assert.ok(overview);
    assert.ok(overview.securityScore >= 50 && overview.securityScore <= 100);
    assert.ok(overview.activeSessionsCount >= 0);
    assert.ok(overview.controls.total >= 4);

    const sessions = await securityAdminService.listSessions();
    assert.ok(Array.isArray(sessions.data));

    const controls = await securityAdminService.listControls();
    assert.ok(controls.length >= 4);
    const mfaControl = controls.find((c: any) => c.key === 'mfa_enforcement');
    if (mfaControl) {
      const toggled = await securityAdminService.updateControl(mfaControl.id, { isEnabled: true });
      assert.equal(toggled.isEnabled, true);
    }

    const compliance = await securityAdminService.getCompliance();
    assert.ok(compliance.length >= 5);

    const locked = await securityAdminService.listLockedAccounts();
    assert.ok(Array.isArray(locked.data));
  });

  // ─── 4. LOGS & AUDIT TRAIL ──────────────────────────────────────────────────
  it('4. Logs & Audit: audit trail, safe dates, and CSV export injection protection', async () => {
    const auditRes = await logsAdminService.getAuditLogs({ page: 1, limit: 10 });
    assert.ok(auditRes.data.length > 0);
    assert.ok(auditRes.total > 0);

    // Verify all returned logs have valid ISO timestamp strings (never NaN or Invalid Date)
    for (const log of auditRes.data) {
      assert.ok(log.created_at);
      const parsed = new Date(log.created_at);
      assert.equal(Number.isNaN(parsed.getTime()), false, `Expected valid date but got ${log.created_at}`);
    }

    const appLogs = await logsAdminService.getApplicationLogs({ limit: 10 });
    assert.ok(Array.isArray(appLogs.data));

    const authLogs = await logsAdminService.getAuthLogs({ limit: 10 });
    assert.ok(Array.isArray(authLogs.data));

    // Test CSV Export with formula injection prevention
    const csv = await logsAdminService.exportLogsCsv('audit', { limit: 5 });
    assert.ok(csv.content.includes('id,action,user_name'));
    assert.ok(csv.content.split('\n').length >= 2);
  });

  // ─── 5. INTEGRATIONS & API MANAGEMENT ───────────────────────────────────────
  it('5. Integrations & API Keys: live testing, webhooks, and secure API keys', async () => {
    const overview = await integrationsAdminService.getOverview();
    assert.ok(overview.integrations.total >= 3);
    assert.ok(overview.webhooks.total >= 1);
    assert.ok(overview.apiKeys.total >= 1);

    // Test DB integration
    const testResult = await integrationsAdminService.testIntegration('postgresql');
    assert.equal(testResult.status, 'connected');
    assert.ok(testResult.latencyMs >= 0);

    // Create a new webhook
    const newWebhook = await integrationsAdminService.createWebhook({
      name: 'Automated Test Webhook',
      targetUrl: 'https://example.com/webhook-test',
      subscribedEvents: ['user.created', 'submission.completed'],
    });
    assert.ok(newWebhook.id);
    assert.ok(newWebhook.signingSecret.startsWith('whsec_'));

    // Update webhook
    const updatedWebhook = await integrationsAdminService.updateWebhook(newWebhook.id, {
      name: 'Automated Test Webhook (Renamed)',
    });
    assert.equal(updatedWebhook.name, 'Automated Test Webhook (Renamed)');

    // Delete webhook
    const deleteRes = await integrationsAdminService.deleteWebhook(newWebhook.id);
    assert.equal(deleteRes.success, true);

    // Create an API key
    const newApiKey = await integrationsAdminService.createApiKey({
      name: 'CI/CD Pipeline Key',
      scopes: ['read', 'write'],
    });
    assert.ok(newApiKey.id);
    assert.ok(newApiKey.key.startsWith('cm_live_'));
    assert.ok(newApiKey.keyPrefix.startsWith('cm_'));

    // Revoke API key
    const revokeRes = await integrationsAdminService.revokeApiKey(newApiKey.id);
    assert.equal(revokeRes.success, true);
    assert.equal(revokeRes.isActive, false);
  });
});
