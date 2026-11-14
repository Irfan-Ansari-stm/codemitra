import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { toSlug } from '../utils/slug';

export const tenantService = {
  async list(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['is_deleted = FALSE'];
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(name ILIKE $${params.length} OR slug ILIKE $${params.length} OR contact_email ILIKE $${params.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT id, name, slug, plan, max_students, is_active, plan_expires_at, created_at,
              contact_email, contact_phone, website_url, address
       FROM tenants ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM tenants ${where}`,
      params
    );
    return { data: result.rows, total: parseInt(count.rows[0].count), page, limit };
  },

  async getById(id: string) {
    const result = await pool.query(
      'SELECT * FROM tenants WHERE id = $1 AND is_deleted = FALSE LIMIT 1',
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Tenant not found');
    const tenant = result.rows[0];

    // Fetch related statistics and administrators
    const [studentsRes, adminsRes, coursesRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_students,
           COUNT(*) FILTER (WHERE is_active = TRUE AND is_deleted = FALSE)::int AS active_students
         FROM users WHERE tenant_id = $1 AND role = 'institution_student'`,
        [id]
      ),
      pool.query(
        `SELECT id, name, email, phone, is_active, created_at, last_login_at
         FROM users WHERE tenant_id = $1 AND role = 'institution_admin' AND is_deleted = FALSE`,
        [id]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total_courses
         FROM courses WHERE tenant_id = $1 AND is_deleted = FALSE`,
        [id]
      ),
    ]);

    return {
      ...tenant,
      total_students: studentsRes.rows[0]?.total_students || 0,
      active_students: studentsRes.rows[0]?.active_students || 0,
      total_courses: coursesRes.rows[0]?.total_courses || 0,
      admins: adminsRes.rows,
    };
  },

  async getBySlug(slug: string) {
    const result = await pool.query(
      'SELECT * FROM tenants WHERE slug = $1 AND is_deleted = FALSE LIMIT 1',
      [slug]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Tenant not found');
    return result.rows[0];
  },

  async create(data: {
    name: string;
    slug?: string;
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
        data.slug || slug,
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
    const mapped = { ...data };
    for (const [from, to] of Object.entries({ maxStudents: 'max_students', isActive: 'is_active', contactEmail: 'contact_email', contactPhone: 'contact_phone', websiteUrl: 'website_url', planExpiresAt: 'plan_expires_at' })) {
      if (from in mapped) mapped[to] = mapped[from];
    }
    const allowed = ['name', 'slug', 'plan', 'max_students', 'contact_email', 'contact_phone', 'website_url', 'address', 'is_active', 'plan_expires_at', 'settings'];
    const fields = Object.keys(mapped).filter((k) => allowed.includes(k));
    if (fields.length === 0) throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map((f) => mapped[f]);

    const result = await pool.query(
      `UPDATE tenants SET ${sets}, updated_at = NOW() WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
      [id, ...values]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Tenant not found');
    return result.rows[0];
  },

  async softDelete(id: string) {
    const result = await pool.query(
      'UPDATE tenants SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND is_deleted = FALSE RETURNING id',
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Institution not found');
  },
};
