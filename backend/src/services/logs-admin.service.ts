import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // Prevent CSV Formula Injection
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export const logsAdminService = {
  async getAuditLogs(filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const limit = filters?.limit || 30;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.action) {
      params.push(`%${filters.action}%`);
      conditions.push(`(a.action ILIKE $${params.length} OR u.name ILIKE $${params.length} OR a.ip_address ILIKE $${params.length})`);
    }
    if (filters?.resourceType) {
      params.push(filters.resourceType);
      conditions.push(`a.resource_type = $${params.length}`);
    }
    if (filters?.userId) {
      params.push(filters.userId);
      conditions.push(`a.user_id = $${params.length}`);
    }
    if (filters?.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`a.created_at >= $${params.length}`);
    }
    if (filters?.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`a.created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT a.id, a.user_id, a.action, a.resource_type, a.resource_id,
                a.old_data, a.new_data, a.ip_address, a.user_agent, a.request_id,
                a.created_at,
                u.name AS user_name, u.email AS user_email, u.role AS user_role,
                t.name AS tenant_name
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         LEFT JOIN tenants t ON t.id = a.tenant_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         ${where}`,
        params
      ),
    ]);

    const total = countRes.rows[0]?.total || 0;
    return {
      data: rowsRes.rows.map((r: any) => ({
        ...r,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getApplicationLogs(filters?: {
    level?: string;
    source?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const limit = filters?.limit || 30;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.level) {
      params.push(filters.level);
      conditions.push(`level = $${params.length}`);
    }
    if (filters?.source) {
      params.push(`%${filters.source}%`);
      conditions.push(`source ILIKE $${params.length}`);
    }
    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(message ILIKE $${params.length} OR source ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT id, level, source, message, context, request_id, environment, stack_trace, created_at
         FROM application_logs
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM application_logs ${where}`,
        params
      ),
    ]);

    const total = countRes.rows[0]?.total || 0;
    return {
      data: rowsRes.rows.map((r: any) => ({
        ...r,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getAuthLogs(filters?: { search?: string; page?: number; limit?: number }) {
    const limit = filters?.limit || 30;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(user_name ILIKE $${params.length} OR user_email ILIKE $${params.length} OR event_type ILIKE $${params.length} OR ip_address ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rowsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT id, user_id, user_name, user_email, event_type, status, ip_address, user_agent, metadata, created_at
         FROM authentication_history
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM authentication_history ${where}`,
        params
      ),
    ]);

    const total = countRes.rows[0]?.total || 0;
    return {
      data: rowsRes.rows.map((r: any) => ({
        ...r,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getAuditLogById(id: string) {
    const res = await pool.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email, u.role AS user_role, t.name AS tenant_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN tenants t ON t.id = a.tenant_id
       WHERE a.id = $1`,
      [id]
    );
    if (!res.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Audit log record not found');
    }
    const row = res.rows[0];
    return {
      ...row,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };
  },

  async exportLogsCsv(type = 'audit', filters?: any, userId?: string) {
    let rows: any[] = [];
    let headers: string[] = [];

    if (type === 'audit') {
      const auditResult = await this.getAuditLogs({ ...filters, limit: 1000 });
      rows = auditResult.data;
      headers = ['id', 'action', 'user_name', 'user_email', 'resource_type', 'resource_id', 'ip_address', 'request_id', 'created_at'];
    } else if (type === 'application') {
      const appResult = await this.getApplicationLogs({ ...filters, limit: 1000 });
      rows = appResult.data;
      headers = ['id', 'level', 'source', 'message', 'request_id', 'environment', 'created_at'];
    } else {
      const authResult = await this.getAuthLogs({ ...filters, limit: 1000 });
      rows = authResult.data;
      headers = ['id', 'user_name', 'user_email', 'event_type', 'status', 'ip_address', 'user_agent', 'created_at'];
    }

    const csvLines = [headers.join(',')];
    for (const r of rows) {
      const line = headers.map((h) => escapeCsvCell(r[h])).join(',');
      csvLines.push(line);
    }

    const csvContent = csvLines.join('\n');
    const fileName = `${type}_logs_${new Date().toISOString().slice(0, 10)}.csv`;

    // Record export in history
    await pool.query(
      `INSERT INTO log_export_history (log_type, file_name, records_count, filters, exported_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [type, fileName, rows.length, JSON.stringify(filters || {}), userId || null]
    ).catch(() => {});

    return {
      fileName,
      content: csvContent,
      count: rows.length,
    };
  },
};

