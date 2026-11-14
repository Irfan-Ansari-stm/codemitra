import { Router } from 'express';
import { rbacService } from '../services/rbac.service';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

export const permissionRouter = Router();
permissionRouter.use(requireAuth);

// GET /api/v1/permissions - List all permissions grouped by module
permissionRouter.get('/', requirePermission('permissions.view'), async (_req, res, next) => {
  try {
    const permissions = await rbacService.listPermissions();
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/permissions/me - Current user's role and effective permissions
permissionRouter.get('/me', async (req, res, next) => {
  try {
    const userPerms = await rbacService.getUserPermissions(req.user!.id);
    res.json({ success: true, data: userPerms });
  } catch (err) {
    next(err);
  }
});
