import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const userService = {
  async list(tenantId: string, page = 1, limit = 20, role?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['u.tenant_id = $1', 'u.is_deleted = FALSE'];
    const params: any[] = [tenantId];

    if (role) {
      params.push(role);
      conditions.push(`u.role = $${params.length}`);
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

  async getById(id: string) {
    const result = await pool.query(
      `SELECT id, name, email, role, tenant_id, is_active, is_email_verified,
              avatar_url, phone, bio, metadata, last_login_at, created_at
       FROM users WHERE id = $1 AND is_deleted = FALSE LIMIT 1`,
      [id]
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
    const allowed = ['name', 'phone', 'bio', 'avatar_url', 'metadata', 'is_active'];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));
    if (fields.length === 0) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map((f) => (f === 'metadata' ? JSON.stringify(data[f]) : data[f]));

    const result = await pool.query(
      `UPDATE users SET ${sets}, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE RETURNING id, name, email, role, avatar_url`,
      [id, ...values]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return result.rows[0];
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
    return { ...user, stats: stats.rows[0] || null };
  },
};
