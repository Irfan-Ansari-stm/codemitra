import { Router } from 'express';
import { tenantService } from '../services/tenant.service';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createTenantSchema, paginationSchema } from '../validators';
import { writeAuditLog } from '../utils/audit';

export const tenantRouter = Router();
tenantRouter.use(requireAuth, isSuperAdmin);

// GET /api/v1/tenants
tenantRouter.get('/', validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await tenantService.list(page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenants/:id
tenantRouter.get('/:id', async (req, res, next) => {
  try {
    const tenant = await tenantService.getById(req.params.id);
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenants
tenantRouter.post('/', validate(createTenantSchema), async (req, res, next) => {
  try {
    const tenant = await tenantService.create(req.body);
    await writeAuditLog({
      userId: req.user!.id,
      action: 'tenant.create',
      resourceType: 'tenant',
      resourceId: tenant.id,
      newData: tenant,
      requestId: (req as any).requestId,
    });
    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/tenants/:id
tenantRouter.patch('/:id', async (req, res, next) => {
  try {
    const tenant = await tenantService.update(req.params.id, req.body);
    await writeAuditLog({
      userId: req.user!.id,
      action: 'tenant.update',
      resourceType: 'tenant',
      resourceId: tenant.id,
      requestId: (req as any).requestId,
    });
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/tenants/:id
tenantRouter.delete('/:id', async (req, res, next) => {
  try {
    await tenantService.softDelete(req.params.id);
    await writeAuditLog({
      userId: req.user!.id,
      action: 'tenant.delete',
      resourceType: 'tenant',
      resourceId: req.params.id,
      requestId: (req as any).requestId,
    });
    res.json({ success: true, data: { message: 'Tenant deleted' } });
  } catch (err) {
    next(err);
  }
});
