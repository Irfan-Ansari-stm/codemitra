import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { toSlug } from '../utils/slug';

export const tenantService = {
  async list(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT id, name, slug, plan, max_students, is_active, plan_expires_at, created_at
       FROM tenants WHERE is_deleted = FALSE
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query(
      'SELECT COUNT(*) FROM tenants WHERE is_deleted = FALSE'
    );
    return { data: result.rows, total: parseInt(count.rows[0].count) };
  },

  async getById(id: string) {
    const result = await pool.query(
      'SELECT * FROM tenants WHERE id = $1 AND is_deleted = FALSE LIMIT 1',
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Tenant not found');
    return result.rows[0];
  },

  async create(data: {
    name: string;
    plan?: string;
    maxStudents?: number;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
    address?: string;
  }) {
    const slug = toSlug(data.name);
    const result = await pool.query(
      `INSERT INTO tenants (name, slug, plan, max_students, contact_email, contact_phone, website_url, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.name,
        slug,
        data.plan || 'trial',
        data.maxStudents || 50,
        data.contactEmail || null,
        data.contactPhone || null,
        data.websiteUrl || null,
        data.address || null,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>) {
    const allowed = ['name', 'plan', 'max_students', 'contact_email', 'contact_phone', 'website_url', 'address', 'is_active', 'plan_expires_at', 'settings'];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));
    if (fields.length === 0) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map((f) => data[f]);

    const result = await pool.query(
      `UPDATE tenants SET ${sets}, updated_at = NOW() WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
      [id, ...values]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Tenant not found');
    return result.rows[0];
  },

  async softDelete(id: string) {
    await pool.query(
      'UPDATE tenants SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [id]
    );
  },
};
