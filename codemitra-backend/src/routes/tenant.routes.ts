import { Router } from 'express';
import { tenantService } from '../services/tenant.service';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createTenantSchema, paginationSchema } from '../validators';
import { writeAuditLog } from '../utils/audit';

export const tenantRouter = Router();
tenantRouter.use(requireAuth, isSuperAdmin);

tenantRouter.get('/slug/:slug', async (req, res, next) => {
  try {
    const tenant = await tenantService.getBySlug(req.params.slug);
    res.json({ success: true, data: tenant });
  } catch (err) { next(err); }
});

tenantRouter.get('/:id/quota', async (req, res, next) => {
  try {
    const tenant = await tenantService.getById(req.params.id);
    const result = await import('../db').then(({ pool }) => pool.query(
      `SELECT COUNT(*)::int AS total_students,
              COUNT(*) FILTER (WHERE is_active AND NOT is_deleted)::int AS active_students
       FROM users WHERE tenant_id = $1 AND role = 'institution_student'`, [tenant.id]
    ));
    const active = result.rows[0].active_students;
    res.json({ success: true, data: { tenantId: tenant.id, totalStudents: result.rows[0].total_students,
      activeStudents: active, maxStudents: tenant.max_students, availableSlots: Math.max(0, tenant.max_students - active) } });
  } catch (err) { next(err); }
});

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
    res.json({ success: true, data: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, maxStudents: tenant.max_students } });
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
