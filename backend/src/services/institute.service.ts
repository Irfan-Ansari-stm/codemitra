import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';
import { signRefreshToken, hashToken } from '../utils/jwt';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export interface InstituteApplication {
  id: string;
  institution_name: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  address: string | null;
  description: string | null;
  documents: any[];
  status: string;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  applicant_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const instituteApplicationService = {
  async list(status?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM institute_applications ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM institute_applications ${where}`,
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

  async getById(id: string): Promise<InstituteApplication> {
    const result = await pool.query(
      'SELECT * FROM institute_applications WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Institute application not found');
    }
    return result.rows[0];
  },

  async create(data: {
    institutionName: string;
    contactEmail: string;
    contactPhone?: string;
    websiteUrl?: string;
    address?: string;
    description?: string;
    documents?: any[];
    applicantUserId?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO institute_applications
         (institution_name, contact_email, contact_phone, website_url, address, description, documents, applicant_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.institutionName,
        data.contactEmail.toLowerCase(),
        data.contactPhone || null,
        data.websiteUrl || null,
        data.address || null,
        data.description || null,
        JSON.stringify(data.documents || []),
        data.applicantUserId || null,
      ]
    );
    return result.rows[0];
  },

  async review(
    id: string,
    decision: 'approved' | 'rejected' | 'request_info',
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const application = await this.getById(id);

    const result = await pool.query(
      `UPDATE institute_applications
       SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [decision, reviewNote || null, reviewedBy, id]
    );

    await writeAuditLog({
      userId: reviewedBy,
      action: `institute_application.${decision}`,
      resourceType: 'institute_application',
      resourceId: id,
      oldData: { status: application.status },
      newData: { status: decision, reviewNote },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async approve(
    id: string,
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const application = await this.getById(id);

    // Transaction: approve application, create tenant, invite admin
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update application status
      await client.query(
        `UPDATE institute_applications
         SET status = 'approved', review_note = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3`,
        [reviewNote || null, reviewedBy, id]
      );

      // Generate unique slug
      const baseSlug = application.institution_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'institute';
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const slugCheck = await client.query(
          'SELECT id FROM tenants WHERE slug = $1',
          [slug]
        );
        if (slugCheck.rows.length === 0) break;
        slug = `${baseSlug}-${++counter}`;
      }

      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, slug, contact_email, contact_phone, website_url, address, plan, is_active, is_verified, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'trial', TRUE, TRUE, 'verified')
         RETURNING *`,
        [
          application.institution_name,
          slug,
          application.contact_email,
          application.contact_phone,
          application.website_url,
          application.address,
        ]
      );
      const tenant = tenantResult.rows[0];

      // If applicant has a user account, assign them as institute admin
      if (application.applicant_user_id) {
        await client.query(
          `UPDATE users SET tenant_id = $1, role = 'institution_admin', is_active = TRUE
           WHERE id = $2`,
          [tenant.id, application.applicant_user_id]
        );
      }

      await writeAuditLog({
        userId: reviewedBy,
        tenantId: tenant.id,
        action: 'institute_application.approved',
        resourceType: 'institute_application',
        resourceId: id,
        newData: { tenantId: tenant.id, slug },
        ipAddress,
        requestId,
      });

      await client.query('COMMIT');
      return { application: { ...application, status: 'approved', reviewed_at: new Date().toISOString() }, tenant };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async reject(
    id: string,
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    return this.review(id, 'rejected', reviewNote, reviewedBy, ipAddress, requestId);
  },

  async requestInfo(
    id: string,
    reviewNote: string | undefined,
    reviewedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    return this.review(id, 'request_info', reviewNote, reviewedBy, ipAddress, requestId);
  },
};

export const instituteService = {
  async list(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['is_deleted = FALSE'];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR slug ILIKE $${params.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT id, name, slug, plan, max_students, is_active, is_verified, verification_status,
              contact_email, contact_phone, website_url, address, description,
              total_students, created_at
       FROM tenants ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM tenants ${where}`,
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

  async getById(id: string) {
    const result = await pool.query(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.role = 'institution_student' AND u.is_deleted = FALSE)::int AS student_count,
              (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.role = 'institution_admin' AND u.is_deleted = FALSE)::int AS admin_count,
              (SELECT COUNT(*) FROM courses c WHERE c.tenant_id = t.id AND c.is_deleted = FALSE)::int AS course_count
       FROM tenants t WHERE t.id = $1 AND t.is_deleted = FALSE`,
      [id]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Institute not found');
    }
    return result.rows[0];
  },

  async update(
    id: string,
    data: Record<string, any>,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await this.getById(id);
    const allowed = [
      'name', 'contact_email', 'contact_phone', 'website_url', 'address',
      'description', 'plan', 'max_students', 'is_active', 'is_verified',
      'verification_status', 'established_year', 'total_students',
    ];
    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      const dbKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      if (allowed.includes(dbKey) && value !== undefined) {
        values.push(value);
        updates.push(`${dbKey} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE tenants SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} AND is_deleted = FALSE
       RETURNING *`,
      values
    );

    await writeAuditLog({
      action: 'institute.update',
      resourceType: 'institute',
      resourceId: id,
      oldData: existing,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async suspend(
    id: string,
    reason: string | undefined,
    suspendedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await this.getById(id);
    const result = await pool.query(
      `UPDATE tenants SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
      [id]
    );

    await writeAuditLog({
      userId: suspendedBy,
      tenantId: id,
      action: 'institute.suspend',
      resourceType: 'institute',
      resourceId: id,
      oldData: { isActive: existing.is_active },
      newData: { isActive: false, reason },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async reactivate(
    id: string,
    reactivatedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await this.getById(id);
    const result = await pool.query(
      `UPDATE tenants SET is_active = TRUE, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
      [id]
    );

    await writeAuditLog({
      userId: reactivatedBy,
      tenantId: id,
      action: 'institute.reactivate',
      resourceType: 'institute',
      resourceId: id,
      oldData: { isActive: existing.is_active },
      newData: { isActive: true },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async softDelete(id: string, ipAddress?: string, requestId?: string) {
    const existing = await this.getById(id);
    const result = await pool.query(
      `UPDATE tenants SET is_deleted = TRUE, is_active = FALSE, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await writeAuditLog({
      action: 'institute.delete',
      resourceType: 'institute',
      resourceId: id,
      oldData: existing,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async inviteAdmin(
    id: string,
    email: string,
    invitedBy: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const tenant = await this.getById(id);

    // Check if user with email exists
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1 AND is_deleted = FALSE',
      [email.toLowerCase()]
    );

    if (userResult.rows.length > 0) {
      // Existing user: assign as institute admin
      const user = userResult.rows[0];
      await pool.query(
        `UPDATE users SET tenant_id = $1, role = 'institution_admin', is_active = TRUE
         WHERE id = $2`,
        [id, user.id]
      );

      await writeAuditLog({
        userId: invitedBy,
        tenantId: id,
        action: 'institute.admin_assigned',
        resourceType: 'institute',
        resourceId: id,
        newData: { adminEmail: email, adminId: user.id },
        ipAddress,
        requestId,
      });

      return { user, invitation: null };
    }

    // Create invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(invitationToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO institute_invitations (tenant_id, email, role, invited_by, token_hash, expires_at)
       VALUES ($1, $2, 'institution_admin', $3, $4, $5)`,
      [id, email.toLowerCase(), invitedBy, tokenHash, expiresAt]
    );

    await writeAuditLog({
      userId: invitedBy,
      tenantId: id,
      action: 'institute.admin_invited',
      resourceType: 'institute',
      resourceId: id,
      newData: { adminEmail: email },
      ipAddress,
      requestId,
    });

    return { user: null, invitation: { token: invitationToken, expiresAt } };
  },

  async getBranches(tenantId: string) {
    const result = await pool.query(
      'SELECT * FROM institute_branches WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  },

  async createBranch(tenantId: string, data: {
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  }) {
    const result = await pool.query(
      `INSERT INTO institute_branches (tenant_id, name, code, address, phone, email, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, data.name, data.code || null, data.address || null, data.phone || null, data.email || null, data.isPrimary || false]
    );
    return result.rows[0];
  },

  async getDepartments(tenantId: string) {
    const result = await pool.query(
      'SELECT * FROM institute_departments WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  },

  async createDepartment(tenantId: string, data: {
    name: string;
    code?: string;
    description?: string;
    headUserId?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO institute_departments (tenant_id, name, code, description, head_user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, data.name, data.code || null, data.description || null, data.headUserId || null]
    );
    return result.rows[0];
  },

  async getDocuments(tenantId: string) {
    const result = await pool.query(
      `SELECT d.*, u.name as uploaded_by_name
       FROM institute_documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.tenant_id = $1
       ORDER BY d.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  },

  async addDocument(tenantId: string, data: {
    name: string;
    documentType: string;
    fileUrl: string;
    fileSizeBytes?: number;
    mimeType?: string;
    uploadedBy: string;
  }) {
    const result = await pool.query(
      `INSERT INTO institute_documents (tenant_id, name, document_type, file_url, file_size_bytes, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, data.name, data.documentType, data.fileUrl, data.fileSizeBytes || null, data.mimeType || null, data.uploadedBy]
    );
    return result.rows[0];
  },

  async getStaff(tenantId: string) {
    const result = await pool.query(
      `SELECT s.*, u.name, u.email, u.is_active
       FROM institute_staff s
       JOIN users u ON u.id = s.user_id
       WHERE s.tenant_id = $1 AND s.is_active = TRUE
       ORDER BY u.name`,
      [tenantId]
    );
    return result.rows;
  },

  async assignStaff(tenantId: string, data: {
    userId: string;
    staffRole: string;
    assignedBy: string;
  }) {
    const result = await pool.query(
      `INSERT INTO institute_staff (tenant_id, user_id, staff_role, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET staff_role = $3, is_active = TRUE
       RETURNING *`,
      [tenantId, data.userId, data.staffRole, data.assignedBy]
    );
    return result.rows[0];
  },
};
