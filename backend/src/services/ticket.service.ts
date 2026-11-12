import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  tenant_id: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

let ticketCounter = 1000;

export const ticketService = {
  async list(
    userId: string,
    role: string,
    tenantId: string | null,
    status?: string,
    page = 1,
    limit = 20
  ) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    // Scope: super_admin sees all, institute_admin sees institute tickets,
    // students/users see only their own
    if (role === 'super_admin') {
      // no additional filter
    } else if (role === 'institution_admin') {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    } else {
      params.push(userId);
      conditions.push(`user_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM support_tickets t ${where}`,
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

  async getById(id: string, userId: string, role: string, tenantId: string | null) {
    const result = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email,
              a.name as assigned_to_name
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN users a ON a.id = t.assigned_to
       WHERE t.id = $1`,
      [id]
    );
    const ticket = result.rows[0];
    if (!ticket) {
      throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
    }

    // Authorization check
    if (role !== 'super_admin') {
      if (role === 'institution_admin' && ticket.tenant_id !== tenantId) {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to view this ticket');
      }
      if (role !== 'institution_admin' && ticket.user_id !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to view this ticket');
      }
    }

    // Get replies
    const replies = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM support_ticket_replies r
       JOIN users u ON u.id = r.user_id
       WHERE r.ticket_id = $1
       ORDER BY r.created_at ASC`,
      [id]
    );

    return { ...ticket, replies: replies.rows };
  },

  async create(
    userId: string,
    tenantId: string | null,
    data: {
      subject: string;
      description: string;
      category?: string;
      priority?: string;
    },
    ipAddress?: string,
    requestId?: string
  ) {
    const ticketNumber = `TKT-${String(++ticketCounter).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO support_tickets
         (ticket_number, user_id, tenant_id, subject, description, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        ticketNumber,
        userId,
        tenantId,
        data.subject,
        data.description,
        data.category || 'general',
        data.priority || 'medium',
      ]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'ticket.create',
      resourceType: 'ticket',
      resourceId: result.rows[0].id,
      newData: { ticketNumber, subject: data.subject },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    userId: string,
    role: string,
    tenantId: string | null,
    data: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      category?: string;
    },
    ipAddress?: string,
    requestId?: string
  ) {
    const ticket = await this.getById(id, userId, role, tenantId);

    // Only super_admin and institute_admin can update status/priority/assignment
    if (role !== 'super_admin' && role !== 'institution_admin') {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to update tickets');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${values.length}`);
      if (data.status === 'resolved') {
        updates.push(`resolved_at = NOW()`);
      }
    }
    if (data.priority !== undefined) {
      values.push(data.priority);
      updates.push(`priority = $${values.length}`);
    }
    if (data.assignedTo !== undefined) {
      values.push(data.assignedTo);
      updates.push(`assigned_to = $${values.length}`);
    }
    if (data.category !== undefined) {
      values.push(data.category);
      updates.push(`category = $${values.length}`);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE support_tickets SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'ticket.update',
      resourceType: 'ticket',
      resourceId: id,
      oldData: { status: ticket.status, priority: ticket.priority },
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async reply(
    id: string,
    userId: string,
    role: string,
    tenantId: string | null,
    message: string,
    isInternal = false,
    ipAddress?: string,
    requestId?: string
  ) {
    const ticket = await this.getById(id, userId, role, tenantId);

    const result = await pool.query(
      `INSERT INTO support_ticket_replies (ticket_id, user_id, message, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, message, isInternal]
    );

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await pool.query(
        'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2',
        ['in_progress', id]
      );
    }

    await writeAuditLog({
      userId,
      tenantId,
      action: 'ticket.reply',
      resourceType: 'ticket',
      resourceId: id,
      newData: { isInternal },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, userId: string, role: string, tenantId: string | null) {
    const ticket = await this.getById(id, userId, role, tenantId);

    if (role !== 'super_admin') {
      throw new AppError(403, 'FORBIDDEN', 'Not authorized to delete tickets');
    }

    await pool.query('DELETE FROM support_ticket_replies WHERE ticket_id = $1', [id]);
    await pool.query('DELETE FROM support_tickets WHERE id = $1', [id]);

    await writeAuditLog({
      userId,
      tenantId,
      action: 'ticket.delete',
      resourceType: 'ticket',
      resourceId: id,
      oldData: { ticketNumber: ticket.ticket_number },
    });

    return { message: 'Ticket deleted' };
  },
};
