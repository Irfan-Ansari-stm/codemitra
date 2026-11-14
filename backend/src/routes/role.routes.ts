import { Router } from 'express';
import { rbacService } from '../services/rbac.service';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin, requirePermission } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

export const roleRouter = Router();
roleRouter.use(requireAuth);

// GET /api/v1/roles - List all roles
roleRouter.get('/', requirePermission('roles.view'), async (_req, res, next) => {
  try {
    const roles = await rbacService.listRoles();
    res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/roles/:id - Get role with its permissions
roleRouter.get('/:id', requirePermission('roles.view'), async (req, res, next) => {
  try {
    const role = await rbacService.getRoleById(req.params.id);
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/roles - Create custom role
roleRouter.post('/', isSuperAdmin, async (req, res, next) => {
  try {
    const { name, slug, description, permissionIds } = req.body;
    if (!name || typeof name !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Role name is required');
    }
    if (!slug || typeof slug !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Role slug is required');
    }

    const newRole = await rbacService.createRole({
      name,
      slug,
      description,
      permissionIds: Array.isArray(permissionIds) ? permissionIds : undefined,
    });
    res.status(201).json({ success: true, data: newRole });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/roles/:id - Update role
roleRouter.patch('/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    const updated = await rbacService.updateRole(req.params.id, {
      name: typeof name === 'string' ? name : undefined,
      description: typeof description === 'string' ? description : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/roles/:id/status - Toggle active/inactive
roleRouter.patch('/:id/status', isSuperAdmin, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      throw new AppError(400, 'VALIDATION_ERROR', 'isActive boolean is required');
    }
    const updated = await rbacService.updateRole(req.params.id, { isActive });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/roles/:id - Delete custom role
roleRouter.delete('/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await rbacService.deleteRole(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/roles/:id/duplicate - Duplicate role
roleRouter.post('/:id/duplicate', isSuperAdmin, async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      throw new AppError(400, 'VALIDATION_ERROR', 'New role name and slug are required');
    }
    const duplicated = await rbacService.duplicateRole(req.params.id, name, slug);
    res.status(201).json({ success: true, data: duplicated });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/roles/:id/permissions - Get role permissions
roleRouter.get('/:id/permissions', requirePermission('roles.view', 'permissions.view'), async (req, res, next) => {
  try {
    const perms = await rbacService.getRolePermissions(req.params.id);
    res.json({ success: true, data: perms });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/roles/:id/permissions - Update role permissions
roleRouter.put('/:id/permissions', isSuperAdmin, async (req, res, next) => {
  try {
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'permissionIds must be an array of strings');
    }
    const result = await rbacService.updateRolePermissions(req.params.id, permissionIds);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
