import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac.service';

type Role = 'super_admin' | 'institution_admin' | 'institution_student' | 'general_student';

/**
 * Factory: creates a middleware that allows only the specified roles.
 * requireAuth must run before this middleware.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Required role: ${roles.join(' or ')}`,
        },
      });
      return;
    }
    next();
  };
}

export const isSuperAdmin = requireRole('super_admin');
export const isInstitutionAdmin = requireRole('super_admin', 'institution_admin');
export const isAnyStudent = requireRole('institution_student', 'general_student');
export const isAuthenticated = requireRole(
  'super_admin',
  'institution_admin',
  'institution_student',
  'general_student'
);

/**
 * Factory: creates a middleware that checks if the user has ANY of the required permissions.
 * Super Admins are automatically granted all permissions.
 */
export function requirePermission(...permissionSlugs: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    // Super Admin has full unrestricted access
    if (req.user.role === 'super_admin') {
      return next();
    }

    try {
      const userPerms = await rbacService.getUserPermissions(req.user.id);
      const hasPermission = permissionSlugs.some(slug => userPerms.permissionSlugs.includes(slug));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Missing required permission: ${permissionSlugs.join(' or ')}`,
          },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
