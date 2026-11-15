import { Router, Request, Response, NextFunction } from 'express';
import { isSuperAdmin } from '../middleware/rbac';
import { systemMonitoringService } from '../services/system-monitoring.service';
import { executionAdminService } from '../services/execution-admin.service';
import { securityAdminService } from '../services/security-admin.service';
import { logsAdminService } from '../services/logs-admin.service';
import { integrationsAdminService } from '../services/integrations-admin.service';

// ═════════════════════════════════════════════════════════════════════════════
// 1. MONITORING ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export const monitoringRouter = Router();
monitoringRouter.use(isSuperAdmin);

monitoringRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await systemMonitoringService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await systemMonitoringService.getHealth();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.get('/services', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await systemMonitoringService.listServices();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.post('/services/:id/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await systemMonitoringService.checkService(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
    const data = await systemMonitoringService.getMetrics(hours);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await systemMonitoringService.getHistory(req.query.serviceId as string, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.get('/health/live', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await systemMonitoringService.getLive();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

monitoringRouter.get('/health/ready', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await systemMonitoringService.getReady();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// 2. EXECUTION ADMIN ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export const executionAdminRouter = Router();
executionAdminRouter.use(isSuperAdmin);

executionAdminRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.get('/languages', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.listLanguages();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.post('/languages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.createLanguage(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.patch('/languages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.updateLanguage(parseInt(req.params.id, 10), req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.get('/nodes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.listNodes();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.get('/nodes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.getNode(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.post('/nodes/:id/health-check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.healthCheckNode(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.get('/limits', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.getLimits();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.put('/limits/:tier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.updateLimits(req.params.tier, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.get('/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await executionAdminService.getMetrics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

executionAdminRouter.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await executionAdminService.getHistory(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// 3. SECURITY ADMIN ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export const securityAdminRouter = Router();
securityAdminRouter.use(isSuperAdmin);

securityAdminRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.listSessions(req.query as any);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.getSession(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.post('/sessions/:id/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.revokeSession(req.params.id, (req as any).user?.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.post('/users/:userId/revoke-sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.revokeUserSessions(req.params.userId, (req as any).user?.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.get('/locked-accounts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.listLockedAccounts();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.post('/users/:userId/unlock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reason = req.body?.reason || 'Super Admin manual unlock';
    const data = await securityAdminService.unlockUser(req.params.userId, reason, (req as any).user?.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.get('/failed-logins', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
    const data = await securityAdminService.listFailedLogins(hours);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.get('/controls', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.listControls();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.patch('/controls/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.updateControl(req.params.id, req.body, (req as any).user?.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

securityAdminRouter.get('/compliance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await securityAdminService.getCompliance();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// 4. LOGS ADMIN ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export const logsAdminRouter = Router();
logsAdminRouter.use(isSuperAdmin);

logsAdminRouter.get('/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await logsAdminService.getAuditLogs(req.query as any);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

logsAdminRouter.get('/audit/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await logsAdminService.getAuditLogById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

logsAdminRouter.get('/application', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await logsAdminService.getApplicationLogs(req.query as any);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

logsAdminRouter.get('/authentication', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await logsAdminService.getAuthLogs(req.query as any);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

logsAdminRouter.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logType = (req.query.type as string) || 'audit';
    const csvResult = await logsAdminService.exportLogsCsv(logType, req.query as any);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csvResult.fileName}"`);
    res.send(csvResult.content);
  } catch (err) {
    next(err);
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// 5. INTEGRATIONS ADMIN ROUTER
// ═════════════════════════════════════════════════════════════════════════════
export const integrationsAdminRouter = Router();
integrationsAdminRouter.use(isSuperAdmin);

integrationsAdminRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.getOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.post('/integrations/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.testIntegration(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.patch('/integrations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.updateIntegration(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.get('/webhooks', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.listWebhooks();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.post('/webhooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.createWebhook({
      ...req.body,
      createdBy: (req as any).user?.id,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.patch('/webhooks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.updateWebhook(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.delete('/webhooks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.deleteWebhook(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.get('/webhooks/:id/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await integrationsAdminService.getWebhookDeliveries(req.params.id, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.get('/deliveries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await integrationsAdminService.getWebhookDeliveries(undefined, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.post('/deliveries/:id/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.retryWebhookDelivery(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.get('/api-keys', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.listApiKeys();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.post('/api-keys', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.createApiKey({
      ...req.body,
      createdBy: (req as any).user?.id,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

integrationsAdminRouter.post('/api-keys/:id/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await integrationsAdminService.revokeApiKey(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
