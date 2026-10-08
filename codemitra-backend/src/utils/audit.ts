import { pool } from '../db';

export async function writeAuditLog(params: {
  userId?: string;
  tenantId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldData?: object;
  newData?: object;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (user_id, tenant_id, action, resource_type, resource_id,
          old_data, new_data, ip_address, user_agent, request_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        params.userId || null,
        params.tenantId || null,
        params.action,
        params.resourceType || null,
        params.resourceId || null,
        params.oldData ? JSON.stringify(params.oldData) : null,
        params.newData ? JSON.stringify(params.newData) : null,
        params.ipAddress || null,
        params.userAgent || null,
        params.requestId || null,
      ]
    );
  } catch (err) {
    // Never throw from audit log — log to console and continue
    console.error('Audit log write failed:', err);
  }
}
