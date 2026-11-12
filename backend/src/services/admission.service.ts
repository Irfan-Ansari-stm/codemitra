import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

export interface Admission {
  id: string;
  tenant_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  program: string | null;
  documents: any[];
  status: string;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const admissionService = {
  async list(
    tenantId: string,
    status?: string,
    page = 1,
    limit = 20
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM admissions a
       LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM admissions a ${where}`,
      params
    );
    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async getById(id: string, tenantId?: string): Promise<Admission> {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM admissions a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = $1 AND ($2::uuid IS NULL OR a.tenant_id = $2)`,
      [id, tenantId || null]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Admission application not found');
    }
    return result.rows[0];
  },

  async getByUser(userId: string) {
    const result = await pool.query(
      `SELECT a.*, t.name as institute_name, t.slug as institute_slug
       FROM admissions a
       JOIN tenants t ON t.id = a.tenant_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async create(
    tenantId: string,
    data: {
      userId: string;
      fullName: string;
      email: string;
      phone?: string;
      address?: string;
      program?: string;
      documents?: any[];
    },
    ipAddress?: string,
    requestId?: string
  ) {
    // Check for existing application
    const existing = await pool.query(
      'SELECT id, status FROM admissions WHERE tenant_id = $1 AND user_id = $2',
      [tenantId, data.userId]
    );
    if (existing.rows.length > 0) {
      const existingAdmission = existing.rows[0];
      if (existingAdmission.status === 'pending') {
        throw new AppError(
          409,
          'DUPLICATE_APPLICATION',
          'You already have a pending application to this institute'
        );
      }
      if (existingAdmission.status === 'approved') {
        throw new AppError(
          409,
          'ALREADY_ADMITTED',
          'You are already admitted to this institute'
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO admissions
         (tenant_id, user_id, full_name, email, phone, address, program, documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId,
        data.userId,
        data.fullName,
        data.email.toLowerCase(),
        data.phone || null,
        data.address || null,
        data.program || null,
        JSON.stringify(data.documents || []),
      ]
    );

    await writeAuditLog({
      userId: data.userId,
      tenantId,
      action: 'admission.submit',
      resourceType: 'admission',
      resourceId: result.rows[0].id,
      newData: { fullName: data.fullName, program: data.program },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async approve(
    id: string,
    tenantId: string,
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const admission = await this.getById(id, tenantId);

    // Transaction: approve admission, create membership, update user
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update admission status
      await client.query(
        `UPDATE admissions
         SET status = 'approved', review_note = $1, reviewed_by = $2,
             reviewed_at = NOW(), admitted_at = NOW()
         WHERE id = $3`,
        [reviewNote || null, reviewedBy, id]
      );

      // Update user: assign to institute, set role to institution_student
      await client.query(
        `UPDATE users
         SET tenant_id = $1, role = 'institution_student', is_active = TRUE
         WHERE id = $2`,
        [tenantId, admission.user_id]
      );

      // Create institute membership record (via institute_staff is not right;
      // membership is implied by tenant_id + role. We record an activity event.)
      await client.query(
        `INSERT INTO activity_events (user_id, tenant_id, event_type, resource_type, resource_id, description)
         VALUES ($1, $2, 'admission.approved', 'admission', $3, 'Student admitted to institute')`,
        [admission.user_id, tenantId, id]
      );

      await writeAuditLog({
        userId: reviewedBy,
        tenantId,
        action: 'admission.approve',
        resourceType: 'admission',
        resourceId: id,
        oldData: { status: admission.status },
        newData: { status: 'approved', reviewNote },
        ipAddress,
        requestId,
      });

      await client.query('COMMIT');
      return { ...admission, status: 'approved', admitted_at: new Date().toISOString() };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async reject(
    id: string,
    tenantId: string,
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const admission = await this.getById(id, tenantId);

    const result = await pool.query(
      `UPDATE admissions
       SET status = 'rejected', review_note = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [reviewNote || null, reviewedBy, id]
    );

    await writeAuditLog({
      userId: reviewedBy,
      tenantId,
      action: 'admission.reject',
      resourceType: 'admission',
      resourceId: id,
      oldData: { status: admission.status },
      newData: { status: 'rejected', reviewNote },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async requestInfo(
    id: string,
    tenantId: string,
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const admission = await this.getById(id, tenantId);

    const result = await pool.query(
      `UPDATE admissions
       SET status = 'request_info', review_note = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [reviewNote || null, reviewedBy, id]
    );

    await writeAuditLog({
      userId: reviewedBy,
      tenantId,
      action: 'admission.request_info',
      resourceType: 'admission',
      resourceId: id,
      oldData: { status: admission.status },
      newData: { status: 'request_info', reviewNote },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async withdraw(id: string, tenantId: string, userId: string) {
    const admission = await this.getById(id, tenantId);
    if (admission.user_id !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to withdraw this application');
    }

    const result = await pool.query(
      `UPDATE admissions SET status = 'withdrawn', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },
};
