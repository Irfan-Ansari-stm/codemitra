import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { rbacService } from './rbac.service';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export interface UserListFilterOptions {
  tenantId?: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const userService = {
  async list(
    tenantId: string | undefined,
    page = 1,
    limit = 20,
    role?: string,
    search?: string,
    extraOptions?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      verificationStatus?: 'all' | 'verified' | 'unverified';
      standaloneOnly?: boolean;
    }
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const offset = (pageNum - 1) * limitNum;
    const conditions: string[] = ['u.is_deleted = FALSE'];
    const params: any[] = [];

    if (tenantId) {
      params.push(tenantId);
      conditions.push(`u.tenant_id = $${params.length}`);
    }

    if (role && role !== 'all') {
      params.push(role);
      conditions.push(`(u.role::text = $${params.length} OR r.slug = $${params.length})`);
    }

    if (extraOptions?.standaloneOnly || role === 'general_student') {
      conditions.push('u.tenant_id IS NULL');
    }

    if (extraOptions?.verificationStatus && extraOptions.verificationStatus !== 'all') {
      if (extraOptions.verificationStatus === 'verified') {
        conditions.push('u.is_email_verified = TRUE');
      } else if (extraOptions.verificationStatus === 'unverified') {
        conditions.push('u.is_email_verified = FALSE');
      }
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
    }

    const status = extraOptions?.status;
    if (status && status !== 'all') {
      if (status === 'active') {
        conditions.push(`u.is_active = TRUE AND (u.metadata->>'isSuspended' IS NULL OR u.metadata->>'isSuspended' = 'false')`);
      } else if (status === 'inactive') {
        conditions.push(`u.is_active = FALSE AND (u.metadata->>'isSuspended' IS NULL OR u.metadata->>'isSuspended' = 'false')`);
      } else if (status === 'suspended') {
        conditions.push(`u.metadata->>'isSuspended' = 'true'`);
      }
    }

    if (extraOptions?.dateFrom) {
      params.push(extraOptions.dateFrom);
      conditions.push(`u.created_at >= $${params.length}::timestamptz`);
    }
    if (extraOptions?.dateTo) {
      params.push(extraOptions.dateTo);
      conditions.push(`u.created_at <= $${params.length}::timestamptz`);
    }

    const sortFieldMap: Record<string, string> = {
      name: 'u.name',
      email: 'u.email',
      role: 'u.role',
      status: 'u.is_active',
      createdAt: 'u.created_at',
      lastLoginAt: 'u.last_login_at',
    };

    const sortBy = extraOptions?.sortBy && sortFieldMap[extraOptions.sortBy] ? sortFieldMap[extraOptions.sortBy] : 'u.created_at';
    const sortOrder = extraOptions?.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
         u.id, u.tenant_id, u.name, u.email, u.role, u.is_active, u.is_email_verified,
         u.phone, u.bio, u.avatar_url, u.last_login_at, u.created_at, u.metadata,
         t.name AS institution_name, t.slug AS institution_slug,
         r.name AS role_name, r.id AS role_id
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ${where}
       ORDER BY ${sortBy} ${sortOrder} NULLS LAST
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(DISTINCT u.id)
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ${where}`,
      params
    );

    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page: pageNum,
      limit: limitNum,
    };
  },

  async getById(id: string, tenantId?: string | null, studentsOnly = false) {
    const result = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.role, u.tenant_id, u.is_active, u.is_email_verified,
         u.avatar_url, u.phone, u.bio, u.metadata, u.last_login_at, u.created_at,
         t.name AS institution_name, t.slug AS institution_slug,
         r.name AS role_name, r.id AS role_id, r.slug AS role_slug,
         COALESCE(us.total_problems_solved, 0)::int AS total_problems_solved,
         COALESCE(us.easy_solved, 0)::int AS easy_solved,
         COALESCE(us.medium_solved, 0)::int AS medium_solved,
         COALESCE(us.hard_solved, 0)::int AS hard_solved,
         COALESCE(us.total_submissions, 0)::int AS total_submissions,
         COALESCE(us.total_score, 0) AS total_score
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE u.id = $1 AND u.is_deleted = FALSE
         AND ($2::uuid IS NULL OR u.tenant_id = $2)
         AND ($3::boolean = FALSE OR u.role = 'institution_student')
       LIMIT 1`,
      [id, tenantId || null, studentsOnly]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return result.rows[0];
  },

  async createInstitutionUser(data: {
    tenantId: string | null;
    email: string;
    password: string;
    name: string;
    role: 'super_admin' | 'institution_admin' | 'institution_student' | 'general_student' | string;
    phone?: string;
    bio?: string;
    metadata?: Record<string, any>;
  }) {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // If role is a standard enum value use it, else default to institution_student or general_student
    const standardRoles = ['super_admin', 'institution_admin', 'institution_student', 'general_student'];
    const dbRole = standardRoles.includes(data.role)
      ? data.role
      : data.tenantId
      ? 'institution_student'
      : 'general_student';

    const result = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role, phone, bio, is_email_verified, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
       RETURNING id, tenant_id, email, name, role, phone, bio, is_active, is_email_verified, created_at`,
      [
        data.tenantId,
        data.email.toLowerCase(),
        passwordHash,
        data.name,
        dbRole,
        data.phone || null,
        data.bio || null,
        JSON.stringify(data.metadata || {}),
      ]
    );

    const newUser = result.rows[0];

    // Map role in user_roles
    try {
      await rbacService.assignUserRole(newUser.id, data.role);
    } catch (err) {
      console.warn('Failed to assign user role entry:', err);
    }

    return newUser;
  },

  async update(id: string, data: Record<string, any>, tenantId?: string | null, studentsOnly = false) {
    const mapped = { ...data };
    if ('avatarUrl' in mapped) mapped.avatar_url = mapped.avatarUrl;
    if ('isActive' in mapped) mapped.is_active = mapped.isActive;
    const allowed = ['name', 'phone', 'bio', 'avatar_url', 'metadata', 'is_active'];
    const fields = Object.keys(mapped).filter((k) => allowed.includes(k));
    if (fields.length === 0) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');

    // Protect last active super admin from being deactivated
    if (mapped.is_active === false) {
      const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      if (userCheck.rows[0]?.role === 'super_admin') {
        const adminCount = await pool.query(
          "SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin' AND is_active = TRUE AND is_deleted = FALSE"
        );
        if ((adminCount.rows[0]?.count || 0) <= 1) {
          throw new AppError(400, 'PROTECTED_USER', 'Cannot deactivate the last active Super Admin account');
        }
      }
      // Revoke sessions when deactivated
      await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [id]);
    }

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map((f) => (f === 'metadata' ? JSON.stringify(mapped[f]) : mapped[f]));

    const tenantFilter = tenantId ? ` AND tenant_id = $${values.length + 2}` : '';
    const studentFilter = studentsOnly ? ` AND role = 'institution_student'` : '';
    const result = await pool.query(
      `UPDATE users SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE${tenantFilter}${studentFilter}
       RETURNING id, name, email, role, is_active, avatar_url, phone, bio, metadata`,
      tenantId ? [id, ...values, tenantId] : [id, ...values]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return result.rows[0];
  },

  async updateStatus(id: string, isActive: boolean, isSuspended = false, reason?: string) {
    // Protect last active super admin
    if (!isActive || isSuspended) {
      const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
      if (userCheck.rows[0]?.role === 'super_admin') {
        const adminCount = await pool.query(
          "SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin' AND is_active = TRUE AND is_deleted = FALSE"
        );
        if ((adminCount.rows[0]?.count || 0) <= 1) {
          throw new AppError(400, 'PROTECTED_USER', 'Cannot deactivate or suspend the last active Super Admin account');
        }
      }
      await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [id]);
    }

    const userRes = await pool.query('SELECT metadata FROM users WHERE id = $1', [id]);
    if (!userRes.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const metadata = userRes.rows[0].metadata || {};
    metadata.isSuspended = isSuspended;
    if (reason) metadata.statusReason = reason;
    if (isSuspended) metadata.suspendedAt = new Date().toISOString();
    else delete metadata.suspendedAt;

    const result = await pool.query(
      `UPDATE users
       SET is_active = $1, metadata = $2, updated_at = NOW()
       WHERE id = $3 AND NOT is_deleted
       RETURNING id, name, email, role, is_active, metadata`,
      [isActive && !isSuspended, JSON.stringify(metadata), id]
    );

    return result.rows[0];
  },

  async updateRole(id: string, roleIdentifier: string, assignedBy?: string) {
    return rbacService.assignUserRole(id, roleIdentifier, assignedBy);
  },

  async updateTenant(id: string, tenantId: string | null) {
    if (tenantId) {
      const tenantCheck = await pool.query('SELECT id FROM tenants WHERE id = $1 AND NOT is_deleted', [tenantId]);
      if (!tenantCheck.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Institution tenant not found');
    }

    const result = await pool.query(
      `UPDATE users
       SET tenant_id = $1, updated_at = NOW()
       WHERE id = $2 AND NOT is_deleted
       RETURNING id, name, email, role, tenant_id, is_active`,
      [tenantId, id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return result.rows[0];
  },

  async resetPassword(id: string, tenantId: string | undefined, newPassword: string, studentsOnly = false) {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const tenantFilter = tenantId ? ' AND tenant_id = $3' : '';
    const roleFilter = studentsOnly ? " AND role = 'institution_student'" : '';
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, login_attempt_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $2${tenantFilter}${roleFilter} AND NOT is_deleted
       RETURNING id`, tenantId ? [passwordHash, id, tenantId] : [passwordHash, id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    // Revoke existing sessions on reset
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [id]);
  },

  async softDelete(id: string, tenantId?: string | null, studentsOnly = false) {
    // Protect last active super admin from deletion
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows[0]?.role === 'super_admin') {
      const adminCount = await pool.query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin' AND is_active = TRUE AND is_deleted = FALSE"
      );
      if ((adminCount.rows[0]?.count || 0) <= 1) {
        throw new AppError(400, 'PROTECTED_USER', 'Cannot delete the last active Super Admin account');
      }
    }

    const tenantFilter = tenantId ? ' AND tenant_id = $2' : '';
    const studentFilter = studentsOnly ? ` AND role = 'institution_student'` : '';
    const result = await pool.query(
      `UPDATE users SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE${tenantFilter}${studentFilter}
       RETURNING id`,
      tenantId ? [id, tenantId] : [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    // Revoke sessions
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [id]);
  },

  async getProfile(userId: string) {
    const user = await userService.getById(userId);
    const stats = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return {
      ...user,
      totalProblemsSolved: user.total_problems_solved,
      stats: stats.rows[0] || null,
    };
  },
};
