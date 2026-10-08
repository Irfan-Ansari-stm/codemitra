import { Router } from 'express';
import { userService } from '../services/user.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, paginationSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';

export const userRouter = Router();
userRouter.use(requireAuth);

// GET /api/v1/users — list users in tenant (admin only)
userRouter.get(
  '/',
  isInstitutionAdmin,
  validate(paginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const { page, limit } = req.query as any;
      const role = req.query.role as string | undefined;
      const result = await userService.list(tenantId, page, limit, role);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/users/profile — own profile
userRouter.get('/profile', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/:id
userRouter.get('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users — create institution user (admin only)
userRouter.post(
  '/',
  isInstitutionAdmin,
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const user = await userService.createInstitutionUser({
        tenantId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/users/:id — update user
userRouter.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    // Users can only update themselves; admins can update anyone in tenant
    if (
      req.user!.id !== req.params.id &&
      !['super_admin', 'institution_admin'].includes(req.user!.role)
    ) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot update another user');
    }
    const user = await userService.update(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/:id — soft delete (admin only)
userRouter.delete('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    await userService.softDelete(req.params.id);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    next(err);
  }
});
