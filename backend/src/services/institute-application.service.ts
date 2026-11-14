import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { toSlug } from '../utils/slug';

type ApplicationInput = {
  institutionName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: string;
};

export const instituteApplicationService = {
  async create(applicantUserId: string, data: ApplicationInput) {
    const slug = toSlug(data.institutionName).slice(0, 90).replace(/-+$/g, '');
    if (!slug) throw new AppError(400, 'INVALID_NAME', 'Institution name must contain letters or numbers');
    const result = await pool.query(
      `INSERT INTO institute_applications
         (applicant_user_id, institution_name, slug, contact_email, contact_phone, website_url, address)
       SELECT id, $2, $3, $4, $5, $6, $7 FROM users
       WHERE id = $1 AND role = 'general_student' AND is_active = TRUE AND is_deleted = FALSE
       RETURNING id, applicant_user_id, institution_name, slug, contact_email,
                 contact_phone, website_url, address, status, created_at`,
      [applicantUserId, data.institutionName, slug, data.contactEmail,
        data.contactPhone || null, data.websiteUrl || null, data.address || null]
    );
    if (!result.rows[0]) throw new AppError(403, 'APPLICATION_NOT_ALLOWED', 'Only an active general user can apply to register an institution');
    return result.rows[0];
  },

  async list(page: number, limit: number, status?: string) {
    const offset = (page - 1) * limit;
    const values: unknown[] = status ? [status, limit, offset] : [limit, offset];
    const where = status ? 'WHERE ia.status = $1' : '';
    const limitParam = status ? '$2' : '$1';
    const offsetParam = status ? '$3' : '$2';
    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT ia.id,
                ia.applicant_user_id AS "applicantUserId", ia.applicant_user_id,
                u.name AS "applicantName", u.name AS applicant_name,
                u.email AS "applicantEmail", u.email AS applicant_email,
                ia.institution_name AS "institutionName", ia.institution_name,
                ia.slug,
                ia.contact_email AS "contactEmail", ia.contact_email,
                ia.contact_phone AS "contactPhone", ia.contact_phone,
                ia.website_url AS "websiteUrl", ia.website_url,
                ia.address, ia.status,
                ia.review_note AS "reviewNote", ia.review_note,
                ia.reviewed_by AS "reviewedBy", ia.reviewed_by,
                ia.reviewed_at AS "reviewedAt", ia.reviewed_at,
                ia.tenant_id AS "tenantId", ia.tenant_id,
                ia.created_at AS "createdAt", ia.created_at
         FROM institute_applications ia LEFT JOIN users u ON u.id = ia.applicant_user_id
         ${where} ORDER BY ia.created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
        values
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM institute_applications ia ${where}`,
        status ? [status] : [])
    ]);
    return { data: rows.rows, total: count.rows[0].total, page, limit };
  },

  async review(id: string, reviewerId: string, decision: 'approved' | 'rejected', reviewNote?: string, requestId?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query(
        `SELECT ia.*, u.name AS applicant_name
         FROM institute_applications ia LEFT JOIN users u ON u.id = ia.applicant_user_id
         WHERE ia.id = $1 FOR UPDATE OF ia`, [id]
      );
      const application = locked.rows[0];
      if (!application) throw new AppError(404, 'NOT_FOUND', 'Institute application not found');
      if (application.status !== 'pending') throw new AppError(409, 'APPLICATION_ALREADY_REVIEWED', 'This institute application has already been reviewed');

      let tenantId: string | null = null;
      let tenantSlug = application.slug;
      if (decision === 'approved') {
        await client.query('SAVEPOINT create_institute_tenant');
        let created;
        try {
          created = await client.query(
            `INSERT INTO tenants (name, slug, contact_email, contact_phone, website_url, address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [application.institution_name, tenantSlug, application.contact_email,
              application.contact_phone, application.website_url, application.address]
          );
        } catch (error: any) {
          await client.query('ROLLBACK TO SAVEPOINT create_institute_tenant');
          if (error.code !== '23505') throw error;
          tenantSlug = `${application.slug.slice(0, 90)}-${id.replace(/-/g, '').slice(0, 8)}`;
          created = await client.query(
            `INSERT INTO tenants (name, slug, contact_email, contact_phone, website_url, address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [application.institution_name, tenantSlug, application.contact_email,
              application.contact_phone, application.website_url, application.address]
          );
        }
        tenantId = created.rows[0].id;
        const promoted = await client.query(
          `UPDATE users SET role = 'institution_admin', tenant_id = $2, updated_at = NOW()
           WHERE id = $1 AND role = 'general_student' AND is_active = TRUE AND is_deleted = FALSE
           RETURNING id`, [application.applicant_user_id, tenantId]
        );
        if (!promoted.rows[0]) throw new AppError(409, 'APPLICANT_NOT_ELIGIBLE', 'Applicant account is no longer eligible for institute administration');
      }

      const updated = await client.query(
        `UPDATE institute_applications
         SET status = $2, review_note = $3, reviewed_by = $4, reviewed_at = NOW(), slug = $6,
             tenant_id = $5, updated_at = NOW()
         WHERE id = $1 AND status = 'pending'
         RETURNING id, applicant_user_id, institution_name, slug, status, review_note,
                   reviewed_by, reviewed_at, tenant_id, created_at`,
        [id, decision, reviewNote || null, reviewerId, tenantId, tenantSlug]
      );
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, 'system', $2, $3, $4::jsonb)`,
        [application.applicant_user_id,
          decision === 'approved' ? 'Institution application approved' : 'Institution application reviewed',
          decision === 'approved'
            ? `${application.institution_name} is ready. Sign out and sign back in to open your institute administrator workspace.`
            : `Your application for ${application.institution_name} was not approved.${reviewNote ? ` Review note: ${reviewNote}` : ''}`,
          JSON.stringify({ applicationId: id, decision, tenantId })]
      );
      await client.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, new_data, request_id)
         VALUES ($1, $2, $3, 'institute_application', $4, $5::jsonb, $6)`,
        [reviewerId, tenantId, `institute_application.${decision}`, id,
          JSON.stringify({ decision, applicantUserId: application.applicant_user_id, tenantId,
            reviewNote: reviewNote || null }), requestId || null]
      );
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },
};
