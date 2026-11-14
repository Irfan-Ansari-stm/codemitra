import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const rbacService = {
  /**
   * List all roles with user count and permission count
   */
  async listRoles() {
    const result = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.slug,
        r.description,
        r.is_system AS "isSystem",
        r.is_active AS "isActive",
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt",
        COUNT(DISTINCT ur.user_id)::int AS "userCount",
        COUNT(DISTINCT rp.permission_id)::int AS "permissionCount"
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.created_at ASC
    `);
    return result.rows;
  },

  /**
   * Get role by ID with details and assigned permissions
   */
  async getRoleById(roleId: string) {
    const roleRes = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.slug,
        r.description,
        r.is_system AS "isSystem",
        r.is_active AS "isActive",
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt"
      FROM roles r
      WHERE r.id = $1
    `, [roleId]);

    if (!roleRes.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Role not found');
    }

    const permsRes = await pool.query(`
      SELECT p.id, p.name, p.slug, p.module, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module, p.action
    `, [roleId]);

    return {
      ...roleRes.rows[0],
      permissions: permsRes.rows,
    };
  },

  /**
   * Create custom role
   */
  async createRole(data: CreateRoleDto) {
    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!slug) {
      throw new AppError(400, 'INVALID_SLUG', 'Role slug cannot be empty');
    }

    const reservedSlugs = ['super_admin', 'institution_admin', 'institution_student', 'general_student'];
    if (reservedSlugs.includes(slug)) {
      throw new AppError(400, 'RESERVED_SLUG', 'This role slug is reserved by the system');
    }

    const existing = await pool.query('SELECT id FROM roles WHERE slug = $1', [slug]);
    if (existing.rows[0]) {
      throw new AppError(409, 'ROLE_EXISTS', 'A role with this slug already exists');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertRes = await client.query(`
        INSERT INTO roles (name, slug, description, is_system, is_active)
        VALUES ($1, $2, $3, FALSE, TRUE)
        RETURNING id, name, slug, description, is_system AS "isSystem", is_active AS "isActive", created_at AS "createdAt"
      `, [data.name.trim(), slug, data.description || null]);

      const newRole = insertRes.rows[0];

      if (data.permissionIds && data.permissionIds.length > 0) {
        for (const pId of data.permissionIds) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [newRole.id, pId]);
        }
      }

      await client.query('COMMIT');
      return newRole;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Update role
   */
  async updateRole(roleId: string, data: UpdateRoleDto) {
    const roleCheck = await pool.query('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (!roleCheck.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Role not found');
    }
    const currentRole = roleCheck.rows[0];

    // System roles protection
    if (currentRole.is_system && data.isActive === false) {
      throw new AppError(400, 'PROTECTED_ROLE', 'System roles cannot be deactivated');
    }

    const sets: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      values.push(data.name.trim());
      sets.push(`name = $${values.length}`);
    }
    if (data.description !== undefined) {
      values.push(data.description);
      sets.push(`description = $${values.length}`);
    }
    if (data.isActive !== undefined) {
      values.push(data.isActive);
      sets.push(`is_active = $${values.length}`);
    }

    if (sets.length === 0) {
      return currentRole;
    }

    values.push(roleId);
    const result = await pool.query(`
      UPDATE roles
      SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, name, slug, description, is_system AS "isSystem", is_active AS "isActive", updated_at AS "updatedAt"
    `, values);

    return result.rows[0];
  },

  /**
   * Delete custom role
   */
  async deleteRole(roleId: string) {
    const roleCheck = await pool.query('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (!roleCheck.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Role not found');
    }
    const currentRole = roleCheck.rows[0];

    if (currentRole.is_system) {
      throw new AppError(400, 'PROTECTED_ROLE', 'System roles cannot be deleted');
    }

    const usersAssigned = await pool.query('SELECT COUNT(*)::int AS count FROM user_roles WHERE role_id = $1', [roleId]);
    if (usersAssigned.rows[0].count > 0) {
      throw new AppError(400, 'ROLE_IN_USE', `Cannot delete role because ${usersAssigned.rows[0].count} user(s) are currently assigned to it`);
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
    return { success: true, message: 'Role deleted successfully' };
  },

  /**
   * Duplicate role
   */
  async duplicateRole(roleId: string, newName: string, newSlug: string) {
    const sourceRole = await this.getRoleById(roleId);
    const permissionIds = sourceRole.permissions.map((p: any) => p.id);

    return this.createRole({
      name: newName,
      slug: newSlug,
      description: `Duplicated from ${sourceRole.name}. ${sourceRole.description || ''}`,
      permissionIds,
    });
  },

  /**
   * List all permissions grouped by module
   */
  async listPermissions() {
    const result = await pool.query(`
      SELECT id, name, slug, module, action, description
      FROM permissions
      ORDER BY module, action
    `);

    // Group by module
    const groups: Record<string, any[]> = {};
    for (const p of result.rows) {
      if (!groups[p.module]) {
        groups[p.module] = [];
      }
      groups[p.module].push(p);
    }

    return {
      all: result.rows,
      grouped: groups,
    };
  },

  /**
   * Get permissions for role
   */
  async getRolePermissions(roleId: string) {
    const result = await pool.query(`
      SELECT p.id, p.name, p.slug, p.module, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module, p.action
    `, [roleId]);
    return result.rows;
  },

  /**
   * Update all permissions for a role
   */
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    const roleCheck = await pool.query('SELECT * FROM roles WHERE id = $1', [roleId]);
    if (!roleCheck.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Role not found');
    }
    const role = roleCheck.rows[0];

    // Prevent stripping super_admin of core permissions
    if (role.slug === 'super_admin') {
      const corePerms = ['dashboard.view', 'users.view', 'roles.view', 'permissions.view', 'permissions.edit'];
      const permsRes = await pool.query('SELECT id, slug FROM permissions WHERE slug = ANY($1)', [corePerms]);
      const coreIds = permsRes.rows.map(r => r.id);
      for (const cId of coreIds) {
        if (!permissionIds.includes(cId)) {
          permissionIds.push(cId);
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      if (permissionIds.length > 0) {
        for (const pId of permissionIds) {
          await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [roleId, pId]);
        }
      }

      await client.query('COMMIT');
      return { success: true, count: permissionIds.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get all effective permissions for a user
   */
  async getUserPermissions(userId: string) {
    const userRoleRes = await pool.query(`
      SELECT r.id, r.name, r.slug, r.is_system AS "isSystem"
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.is_active = TRUE
      LIMIT 1
    `, [userId]);

    let role = userRoleRes.rows[0];

    // Fallback to user.role column if user_roles entry is missing
    if (!role) {
      const uRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      if (uRes.rows[0]) {
        const fallbackRole = await pool.query('SELECT id, name, slug, is_system AS "isSystem" FROM roles WHERE slug = $1', [uRes.rows[0].role]);
        role = fallbackRole.rows[0];
      }
    }

    if (!role) {
      return {
        role: null,
        permissions: [],
        permissionSlugs: [],
      };
    }

    const permsRes = await pool.query(`
      SELECT DISTINCT p.id, p.name, p.slug, p.module, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module, p.action
    `, [role.id]);

    const permissionSlugs = permsRes.rows.map(p => p.slug);

    return {
      role,
      permissions: permsRes.rows,
      permissionSlugs,
    };
  },

  /**
   * Assign role to user
   */
  async assignUserRole(userId: string, roleIdentifier: string, assignedBy?: string) {
    // Check if roleIdentifier is UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roleIdentifier);
    const roleRes = await pool.query(
      isUuid ? 'SELECT id, slug, name FROM roles WHERE id = $1' : 'SELECT id, slug, name FROM roles WHERE slug = $1',
      [roleIdentifier]
    );

    if (!roleRes.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Role not found');
    }
    const role = roleRes.rows[0];

    // Check user exists
    const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (!userRes.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    const currentUser = userRes.rows[0];

    // Prevent removing the last active super admin
    if (currentUser.role === 'super_admin' && role.slug !== 'super_admin') {
      const adminCount = await pool.query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin' AND is_active = TRUE AND is_deleted = FALSE"
      );
      if ((adminCount.rows[0]?.count || 0) <= 1) {
        throw new AppError(400, 'PROTECTED_USER', 'Cannot reassign role of the last active Super Admin account');
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user_roles mapping
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES ($1, $2, $3)
      `, [userId, role.id, assignedBy || null]);

      // If role.slug is one of the enum values, update users.role as well
      const enumRoles = ['super_admin', 'institution_admin', 'institution_student', 'general_student'];
      if (enumRoles.includes(role.slug)) {
        await client.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role.slug, userId]);
      }

      await client.query('COMMIT');
      return { success: true, role };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
