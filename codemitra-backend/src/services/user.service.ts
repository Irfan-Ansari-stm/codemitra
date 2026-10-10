import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const userService = {
  async list(tenantId: string | undefined, page = 1, limit = 20, role?: string, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['u.is_deleted = FALSE'];
    const params: any[] = [];

    if (tenantId) {
      params.push(tenantId);
      conditions.push(`u.tenant_id = $${params.length}`);
    }

    if (role) {
      params.push(role);
      conditions.push(`u.role = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_email_verified,
              u.last_login_at, u.created_at, u.avatar_url, u.metadata
       FROM users u WHERE ${where}
       ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM users u WHERE ${where}`,
      params
    );
    return { data: result.rows, total: parseInt(count.rows[0].count) };
  },

  async getById(id: string, tenantId?: string | null) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.tenant_id, u.is_active, u.is_email_verified,
              u.avatar_url, u.phone, u.bio, u.metadata, u.last_login_at, u.created_at,
              COALESCE(us.total_problems_solved, 0)::int AS total_problems_solved,
              COALESCE(us.easy_solved, 0)::int AS easy_solved,
              COALESCE(us.medium_solved, 0)::int AS medium_solved,
              COALESCE(us.hard_solved, 0)::int AS hard_solved,
              COALESCE(us.total_submissions, 0)::int AS total_submissions,
              COALESCE(us.total_score, 0) AS total_score
       FROM users u LEFT JOIN user_stats us ON us.user_id = u.id
       WHERE u.id = $1 AND u.is_deleted = FALSE
         AND ($2::uuid IS NULL OR u.tenant_id = $2) LIMIT 1`,
      [id, tenantId || null]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return result.rows[0];
  },

  async createInstitutionUser(data: {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role: 'institution_admin' | 'institution_student';
    metadata?: Record<string, any>;
  }) {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role, is_email_verified, metadata)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6) RETURNING id, email, name, role`,
      [
        data.tenantId,
        data.email.toLowerCase(),
        passwordHash,
        data.name,
        data.role,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>) {
    const mapped = { ...data };
    if ('avatarUrl' in mapped) mapped.avatar_url = mapped.avatarUrl;
    if ('isActive' in mapped) mapped.is_active = mapped.isActive;
    const allowed = ['name', 'phone', 'bio', 'avatar_url', 'metadata', 'is_active'];
    const fields = Object.keys(mapped).filter((k) => allowed.includes(k));
    if (fields.length === 0) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map((f) => (f === 'metadata' ? JSON.stringify(mapped[f]) : mapped[f]));

    const result = await pool.query(
      `UPDATE users SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE RETURNING id, name, email, role, avatar_url`,
      [id, ...values]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return result.rows[0];
  },

  async resetPassword(id: string, tenantId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, login_attempt_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND role = 'institution_student' AND NOT is_deleted
       RETURNING id`, [passwordHash, id, tenantId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Student not found');
  },

  async softDelete(id: string) {
    await pool.query(
      'UPDATE users SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [id]
    );
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
