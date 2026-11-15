import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from './admin.service';

export const securityAdminService = {
  async getOverview() {
    const [sessionsRes, lockedRes, failedLoginsRes, controlsRes, complianceRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM user_sessions WHERE is_active = TRUE AND is_revoked = FALSE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM account_lockouts WHERE status = 'locked' AND lock_expires_at > NOW()`),
      pool.query(`SELECT COUNT(*)::int AS count FROM login_attempts WHERE is_success = FALSE AND attempted_at >= NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT * FROM security_controls`),
      pool.query(`SELECT * FROM compliance_checks`),
    ]);

    // Calculate dynamic security posture score based on enabled controls and compliance
    const enabledControlsCount = controlsRes.rows.filter((c: any) => c.is_enabled).length;
    const compliantChecksCount = complianceRes.rows.filter((c: any) => c.status === 'compliant').length;
    const totalChecks = Math.max(1, complianceRes.rows.length);
    const score = Math.round(50 + (enabledControlsCount * 5) + ((compliantChecksCount / totalChecks) * 20));
    const securityScore = Math.min(99, Math.max(50, score));

    return {
      activeSessionsCount: sessionsRes.rows[0]?.count || 0,
      lockedAccountsCount: lockedRes.rows[0]?.count || 0,
      failedLogins24h: failedLoginsRes.rows[0]?.count || 0,
      securityScore,
      securityPosture: `${securityScore}/100 Grade A`,
      controlsCount: enabledControlsCount,
      controls: {
        total: controlsRes.rows.length,
        enabled: enabledControlsCount,
      },
      compliance: {
        total: complianceRes.rows.length,
        passed: compliantChecksCount,
      },
    };
  },

  async listSessions(filters?: { search?: string; role?: string; userId?: string; limit?: number; page?: number }) {
    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['s.is_active = TRUE'];
    const params: any[] = [];

    if (filters?.userId) {
      params.push(filters.userId);
      conditions.push(`s.user_id = $${params.length}`);
    }
    if (filters?.role) {
      params.push(filters.role);
      conditions.push(`u.role = $${params.length}`);
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR s.ip_address ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT s.id, s.user_id, s.ip_address, s.user_agent, s.device_info,
                s.is_active, s.is_revoked, s.last_active_at, s.expires_at, s.created_at,
                u.name AS user_name, u.email AS user_email, u.role AS user_role,
                t.name AS tenant_name
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN tenants t ON t.id = u.tenant_id
         ${where}
         ORDER BY s.last_active_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
         ${where}`,
        params
      ),
    ]);

    const total = countRes.rows[0]?.total || 0;
    return {
      data: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getSession(id: string) {
    const res = await pool.query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email, u.role AS user_role, t.name AS tenant_name
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE s.id = $1`,
      [id]
    );
    if (!res.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Session not found');
    }
    return res.rows[0];
  },

  async revokeSession(id: string, adminId: string, ipAddress?: string) {
    const res = await pool.query(
      `UPDATE user_sessions
       SET is_active = FALSE, is_revoked = TRUE, revoked_at = NOW(), revoked_by = $1
       WHERE id = $2
       RETURNING *`,
      [adminId, id]
    );

    if (!res.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Session not found');
    }

    // Also revoke matching refresh_tokens if any
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1`,
      [id]
    ).catch(() => {});

    await writeAuditLog({
      userId: adminId,
      action: 'security.session.revoke',
      resourceType: 'user_session',
      resourceId: id,
      ipAddress,
    });

    return { success: true, message: 'Session revoked successfully' };
  },

  async revokeUserSessions(userId: string, adminId: string, ipAddress?: string) {
    await pool.query(
      `UPDATE user_sessions
       SET is_active = FALSE, is_revoked = TRUE, revoked_at = NOW(), revoked_by = $1
       WHERE user_id = $2 AND is_active = TRUE`,
      [adminId, userId]
    );

    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1`,
      [userId]
    ).catch(() => {});

    await writeAuditLog({
      userId: adminId,
      action: 'security.user.revoke_all_sessions',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });

    return { success: true, message: 'All active sessions for user revoked successfully' };
  },

  async listLockedAccounts(filters?: { search?: string; status?: string; limit?: number; page?: number }) {
    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`al.status = $${params.length}`);
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR al.email ILIKE $${params.length} OR al.lock_reason ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT al.id, al.user_id, al.email, al.lock_reason, al.failed_attempts,
                al.locked_at, al.lock_expires_at, al.status, al.ip_address,
                u.name AS user_name, u.role AS user_role, t.name AS tenant_name
         FROM account_lockouts al
         JOIN users u ON u.id = al.user_id
         LEFT JOIN tenants t ON t.id = u.tenant_id
         ${where}
         ORDER BY al.locked_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM account_lockouts al
         JOIN users u ON u.id = al.user_id
         ${where}`,
        params
      ),
    ]);

    const total = countRes.rows[0]?.total || 0;
    return {
      data: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async unlockUser(userId: string, reason = 'Administrative verification', adminId: string, ipAddress?: string) {
    // 1. Update user record
    await pool.query(
      `UPDATE users
       SET locked_until = NULL, login_attempt_count = 0, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // 2. Update account_lockouts record
    const res = await pool.query(
      `UPDATE account_lockouts
       SET status = 'unlocked', unlocked_at = NOW(), unlocked_by = $1, unlock_reason = $2
       WHERE user_id = $3 AND status = 'locked'
       RETURNING *`,
      [adminId, reason, userId]
    );

    await writeAuditLog({
      userId: adminId,
      action: 'security.user.unlock',
      resourceType: 'user',
      resourceId: userId,
      newData: { reason },
      ipAddress,
    });

    return { success: true, message: 'User account unlocked successfully', lockout: res.rows[0] || null };
  },

  async listFailedLogins(limit = 50) {
    const res = await pool.query(
      `SELECT la.*, u.name AS user_name
       FROM login_attempts la
       LEFT JOIN users u ON u.id = la.user_id
       WHERE la.is_success = FALSE
       ORDER BY la.attempted_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async listControls() {
    const res = await pool.query(
      `SELECT * FROM security_controls ORDER BY category ASC, name ASC`
    );
    return res.rows;
  },

  async updateControl(id: string, data: { value?: any; isEnabled?: boolean }, adminId: string, ipAddress?: string) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.value !== undefined) {
      values.push(JSON.stringify(data.value));
      fields.push(`value = $${values.length}`);
    }
    if (data.isEnabled !== undefined) {
      values.push(data.isEnabled);
      fields.push(`is_enabled = $${values.length}`);
    }

    if (fields.length === 0) {
      const cur = await pool.query(`SELECT * FROM security_controls WHERE id = $1`, [id]);
      return cur.rows[0];
    }

    values.push(adminId);
    fields.push(`updated_by = $${values.length}`);
    values.push(id);

    const res = await pool.query(
      `UPDATE security_controls
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (!res.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Security control policy not found');
    }

    await writeAuditLog({
      userId: adminId,
      action: 'security.control.update',
      resourceType: 'security_control',
      resourceId: undefined,
      newData: { controlId: id, ...data },
      ipAddress,
    });

    return res.rows[0];
  },

  async getCompliance() {
    const res = await pool.query(
      `SELECT * FROM compliance_checks ORDER BY standard ASC, name ASC`
    );
    return res.rows;
  },
};

