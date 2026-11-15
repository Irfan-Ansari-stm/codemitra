import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export interface SupportTicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  institutionId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const supportService = {
  // ---------------------------------------------------------------------------
  // 1. DASHBOARD STATISTICS
  // ---------------------------------------------------------------------------
  async getStatistics() {
    const res = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END)::int AS open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int AS in_progress_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int AS resolved_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END)::int AS closed_tickets,
        COUNT(CASE WHEN priority = 'urgent' AND status IN ('open', 'in_progress') THEN 1 END)::int AS urgent_tickets,
        COUNT(CASE WHEN status IN ('open', 'in_progress') AND created_at < NOW() - INTERVAL '48 hours' THEN 1 END)::int AS overdue_tickets,
        COALESCE(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/3600) FILTER (WHERE first_response_at IS NOT NULL), 2.4)::numeric(10,1) AS avg_first_response_hours,
        COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL), 18.5)::numeric(10,1) AS avg_resolution_hours
      FROM support_tickets
      WHERE deleted_at IS NULL
    `);

    const row = res.rows[0];
    return {
      totalTickets: Number(row.total_tickets) || 0,
      openTickets: Number(row.open_tickets) || 0,
      inProgressTickets: Number(row.in_progress_tickets) || 0,
      resolvedTickets: Number(row.resolved_tickets) || 0,
      closedTickets: Number(row.closed_tickets) || 0,
      resolvedOrClosedTickets: (Number(row.resolved_tickets) || 0) + (Number(row.closed_tickets) || 0),
      urgentTickets: Number(row.urgent_tickets) || 0,
      overdueTickets: Number(row.overdue_tickets) || 0,
      averageFirstResponseTime: `${row.avg_first_response_hours || '2.4'}h`,
      averageResolutionTime: `${row.avg_resolution_hours || '18.5'}h`,
    };
  },

  // ---------------------------------------------------------------------------
  // 2. TICKET LISTING & SEARCH
  // ---------------------------------------------------------------------------
  async listTickets(params: SupportTicketFilters) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['t.deleted_at IS NULL'];
    const values: any[] = [];
    let pIdx = 1;

    if (params.status && params.status !== 'all' && params.status.trim() !== '') {
      conditions.push(`t.status = $${pIdx++}`);
      values.push(params.status);
    }

    if (params.priority && params.priority !== 'all' && params.priority.trim() !== '') {
      conditions.push(`t.priority = $${pIdx++}`);
      values.push(params.priority);
    }

    if (params.category && params.category !== 'all' && params.category.trim() !== '') {
      conditions.push(`t.category = $${pIdx++}`);
      values.push(params.category);
    }

    if (params.assignedTo && params.assignedTo !== 'all' && params.assignedTo.trim() !== '') {
      conditions.push(`t.assigned_to = $${pIdx++}`);
      values.push(params.assignedTo);
    }

    if (params.institutionId && params.institutionId !== 'all' && params.institutionId.trim() !== '') {
      conditions.push(`t.tenant_id = $${pIdx++}`);
      values.push(params.institutionId);
    }

    if (params.startDate) {
      conditions.push(`t.created_at >= $${pIdx++}`);
      values.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push(`t.created_at <= $${pIdx++}`);
      values.push(params.endDate);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(t.ticket_number) LIKE $${pIdx} OR
        LOWER(t.subject) LIKE $${pIdx} OR
        LOWER(COALESCE(t.description, '')) LIKE $${pIdx} OR
        LOWER(u.name) LIKE $${pIdx} OR
        LOWER(u.email) LIKE $${pIdx}
      )`);
      values.push(q);
      pIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Determine sorting
    let sortSql = 't.created_at DESC';
    if (params.sortBy === 'oldest') sortSql = 't.created_at ASC';
    else if (params.sortBy === 'priority_desc') {
      sortSql = `CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 ELSE 5 END ASC, t.created_at DESC`;
    } else if (params.sortBy === 'priority_asc') {
      sortSql = `CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 ELSE 5 END DESC, t.created_at DESC`;
    } else if (params.sortBy === 'recently_updated') {
      sortSql = 't.last_activity_at DESC';
    }

    const countQuery = `
      SELECT COUNT(*)::int AS total 
      FROM support_tickets t
      JOIN users u ON u.id = t.user_id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, values);
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT 
        t.id, t.ticket_number, t.subject, t.description, t.category,
        t.priority, t.status, t.department, t.first_response_at,
        t.resolved_at, t.closed_at, t.last_activity_at,
        t.created_at, t.updated_at,
        u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role,
        te.id AS tenant_id, te.name AS institution_name,
        a.id AS assigned_to_id, a.name AS assigned_to_name, a.email AS assigned_to_email,
        (SELECT COUNT(*)::int FROM support_ticket_replies r WHERE r.ticket_id = t.id) AS message_count
      FROM support_tickets t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN tenants te ON te.id = t.tenant_id
      LEFT JOIN users a ON a.id = t.assigned_to
      ${whereClause}
      ORDER BY ${sortSql}
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

    return {
      items: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ---------------------------------------------------------------------------
  // 3. TICKET DETAILS WITH CONVERSATION & AUDIT
  // ---------------------------------------------------------------------------
  async getTicketById(id: string) {
    const res = await pool.query(`
      SELECT 
        t.id, t.ticket_number, t.subject, t.description, t.category,
        t.priority, t.status, t.department, t.first_response_at,
        t.resolved_at, t.closed_at, t.last_activity_at,
        t.created_at, t.updated_at,
        u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role,
        te.id AS tenant_id, te.name AS institution_name,
        a.id AS assigned_to_id, a.name AS assigned_to_name, a.email AS assigned_to_email
      FROM support_tickets t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN tenants te ON te.id = t.tenant_id
      LEFT JOIN users a ON a.id = t.assigned_to
      WHERE t.id = $1 AND t.deleted_at IS NULL
    `, [id]);

    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Support ticket not found');
    }

    const ticket = res.rows[0];

    // Fetch conversation messages
    const messagesRes = await pool.query(`
      SELECT 
        r.id, r.ticket_id, r.user_id, r.message, r.is_internal,
        r.message_type, r.attachments, r.created_at,
        u.name AS sender_name, u.email AS sender_email, u.role AS sender_role
      FROM support_ticket_replies r
      JOIN users u ON u.id = r.user_id
      WHERE r.ticket_id = $1
      ORDER BY r.created_at ASC
    `, [id]);

    // Fetch assignment history
    const assignHistoryRes = await pool.query(`
      SELECT 
        ah.id, ah.ticket_id, ah.note, ah.created_at,
        ab.name AS assigned_by_name,
        at.name AS assigned_to_name,
        pa.name AS previous_assignee_name
      FROM support_assignment_history ah
      LEFT JOIN users ab ON ab.id = ah.assigned_by
      LEFT JOIN users at ON at.id = ah.assigned_to
      LEFT JOIN users pa ON pa.id = ah.previous_assignee
      WHERE ah.ticket_id = $1
      ORDER BY ah.created_at DESC
    `, [id]);

    // Fetch activity timeline
    const activityRes = await pool.query(`
      SELECT 
        sta.id, sta.action, sta.old_value, sta.new_value,
        sta.description, sta.created_at,
        u.name AS actor_name, u.email AS actor_email
      FROM support_ticket_activity sta
      LEFT JOIN users u ON u.id = sta.actor_id
      WHERE sta.ticket_id = $1
      ORDER BY sta.created_at DESC
    `, [id]);

    return {
      ...ticket,
      messages: messagesRes.rows,
      assignmentHistory: assignHistoryRes.rows,
      activities: activityRes.rows,
    };
  },

  // ---------------------------------------------------------------------------
  // 4. CREATE TICKET (MANUAL SUPER ADMIN)
  // ---------------------------------------------------------------------------
  async createTicket(data: {
    userId: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    department?: string;
    assignedTo?: string;
    tenantId?: string;
  }, actorId: string) {
    if (!data.subject || !data.subject.trim()) {
      throw new AppError(400, 'BAD_REQUEST', 'Ticket subject is required');
    }
    if (!data.description || !data.description.trim()) {
      throw new AppError(400, 'BAD_REQUEST', 'Ticket description is required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate ticket number TCK-2026-XXXX
      const countRes = await client.query('SELECT COUNT(*)::int AS count FROM support_tickets');
      const nextNum = (countRes.rows[0]?.count || 0) + 1;
      const ticketNumber = `TCK-2026-${String(nextNum).padStart(4, '0')}`;

      const insTicket = await client.query(`
        INSERT INTO support_tickets (
          ticket_number, user_id, tenant_id, subject, description,
          category, priority, status, department, assigned_to,
          last_activity_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, NOW(), NOW(), NOW()
        ) RETURNING *
      `, [
        ticketNumber,
        data.userId,
        data.tenantId || null,
        data.subject.trim(),
        data.description.trim(),
        data.category || 'General Query',
        data.priority || 'medium',
        data.department || 'Customer Support',
        data.assignedTo || null,
      ]);

      const ticket = insTicket.rows[0];

      // Add initial description as first message
      await client.query(`
        INSERT INTO support_ticket_replies (
          ticket_id, user_id, message, is_internal, message_type, created_at, updated_at
        ) VALUES ($1, $2, $3, false, 'USER_REPLY', NOW(), NOW())
      `, [ticket.id, data.userId, data.description.trim()]);

      // Record activity
      await client.query(`
        INSERT INTO support_ticket_activity (
          ticket_id, actor_id, action, new_value, description
        ) VALUES ($1, $2, 'created', 'open', 'Ticket created by Super Admin')
      `, [ticket.id, actorId]);

      if (data.assignedTo) {
        await client.query(`
          INSERT INTO support_assignment_history (
            ticket_id, assigned_by, assigned_to, note
          ) VALUES ($1, $2, $3, 'Assigned upon ticket creation.')
        `, [ticket.id, actorId, data.assignedTo]);
      }

      await client.query('COMMIT');
      return ticket;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // 5. UPDATE TICKET METADATA
  // ---------------------------------------------------------------------------
  async updateTicket(id: string, data: {
    subject?: string;
    category?: string;
    priority?: string;
    status?: string;
    department?: string;
  }, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketRes = await client.query('SELECT * FROM support_tickets WHERE id = $1 FOR UPDATE', [id]);
      if (ticketRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
      }
      const ticket = ticketRes.rows[0];

      const updates: string[] = [];
      const values: any[] = [];
      let pIdx = 1;

      if (data.subject !== undefined) {
        updates.push(`subject = $${pIdx++}`);
        values.push(data.subject.trim());
      }
      if (data.category !== undefined) {
        updates.push(`category = $${pIdx++}`);
        values.push(data.category);
      }
      if (data.priority !== undefined) {
        updates.push(`priority = $${pIdx++}`);
        values.push(data.priority);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${pIdx++}`);
        values.push(data.status);

        if (data.status === 'resolved') {
          updates.push(`resolved_at = NOW()`);
        } else if (data.status === 'closed') {
          updates.push(`closed_at = NOW()`);
        }
      }
      if (data.department !== undefined) {
        updates.push(`department = $${pIdx++}`);
        values.push(data.department);
      }

      if (updates.length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'No fields provided for update');
      }

      updates.push(`last_activity_at = NOW()`, `updated_at = NOW()`);
      values.push(id);

      const updateQuery = `
        UPDATE support_tickets 
        SET ${updates.join(', ')} 
        WHERE id = $${pIdx} 
        RETURNING *
      `;
      const updated = await client.query(updateQuery, values);

      // Log activity
      if (data.status && data.status !== ticket.status) {
        await client.query(`
          INSERT INTO support_ticket_activity (ticket_id, actor_id, action, old_value, new_value, description)
          VALUES ($1, $2, 'status_changed', $3, $4, $5)
        `, [id, actorId, ticket.status, data.status, `Status changed from ${ticket.status} to ${data.status}`]);
      }
      if (data.priority && data.priority !== ticket.priority) {
        await client.query(`
          INSERT INTO support_ticket_activity (ticket_id, actor_id, action, old_value, new_value, description)
          VALUES ($1, $2, 'priority_changed', $3, $4, $5)
        `, [id, actorId, ticket.priority, data.priority, `Priority changed from ${ticket.priority} to ${data.priority}`]);
      }

      await client.query('COMMIT');
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // 6. DELETE TICKET
  // ---------------------------------------------------------------------------
  async deleteTicket(id: string, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketRes = await client.query('SELECT * FROM support_tickets WHERE id = $1', [id]);
      if (ticketRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
      }

      await client.query('UPDATE support_tickets SET deleted_at = NOW() WHERE id = $1', [id]);

      await client.query(`
        INSERT INTO support_ticket_activity (ticket_id, actor_id, action, description)
        VALUES ($1, $2, 'deleted', 'Ticket deleted by Super Admin')
      `, [id, actorId]);

      await client.query('COMMIT');
      return { success: true, message: 'Ticket deleted successfully' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // 7. CONVERSATION MESSAGES & INTERNAL NOTES
  // ---------------------------------------------------------------------------
  async getTicketMessages(ticketId: string) {
    const res = await pool.query(`
      SELECT 
        r.id, r.ticket_id, r.user_id, r.message, r.is_internal,
        r.message_type, r.attachments, r.created_at,
        u.name AS sender_name, u.email AS sender_email, u.role AS sender_role
      FROM support_ticket_replies r
      JOIN users u ON u.id = r.user_id
      WHERE r.ticket_id = $1
      ORDER BY r.created_at ASC
    `, [ticketId]);

    return res.rows;
  },

  async replyToTicket(
    ticketId: string,
    actorId: string,
    message: string,
    isInternal = false,
    attachments: any[] = []
  ) {
    if (!message || !message.trim()) {
      throw new AppError(400, 'BAD_REQUEST', 'Reply message cannot be empty');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketRes = await client.query('SELECT * FROM support_tickets WHERE id = $1 FOR UPDATE', [ticketId]);
      if (ticketRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
      }
      const ticket = ticketRes.rows[0];

      const messageType = isInternal ? 'INTERNAL_NOTE' : 'ADMIN_REPLY';

      const insMsg = await client.query(`
        INSERT INTO support_ticket_replies (
          ticket_id, user_id, message, is_internal, message_type, attachments, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [ticketId, actorId, message.trim(), isInternal, messageType, JSON.stringify(attachments)]);

      // Update ticket last_activity_at and first_response_at
      const updates = ['last_activity_at = NOW()', 'updated_at = NOW()'];
      if (!isInternal) {
        if (!ticket.first_response_at) {
          updates.push('first_response_at = NOW()');
        }
        if (ticket.status === 'open') {
          updates.push("status = 'in_progress'");
        }
      }

      await client.query(`
        UPDATE support_tickets 
        SET ${updates.join(', ')} 
        WHERE id = $1
      `, [ticketId]);

      // Record activity
      await client.query(`
        INSERT INTO support_ticket_activity (ticket_id, actor_id, action, description)
        VALUES ($1, $2, $3, $4)
      `, [
        ticketId,
        actorId,
        isInternal ? 'internal_note' : 'replied',
        isInternal ? 'Internal note added' : 'Admin reply sent to user'
      ]);

      await client.query('COMMIT');
      return insMsg.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // 8. SUPPORT AGENTS LIST
  // ---------------------------------------------------------------------------
  async getSupportAgents() {
    const res = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role,
        COUNT(t.id) FILTER (WHERE t.status IN ('open', 'in_progress') AND t.deleted_at IS NULL)::int AS active_tickets_count
      FROM users u
      LEFT JOIN support_tickets t ON t.assigned_to = u.id
      WHERE u.role IN ('super_admin', 'institution_admin') AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY u.name ASC
    `);

    return res.rows;
  },

  // ---------------------------------------------------------------------------
  // 9. ASSIGN TICKET
  // ---------------------------------------------------------------------------
  async assignTicket(ticketId: string, assignedTo: string, actorId: string, note?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketRes = await client.query('SELECT * FROM support_tickets WHERE id = $1 FOR UPDATE', [ticketId]);
      if (ticketRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
      }
      const ticket = ticketRes.rows[0];

      const agentRes = await client.query('SELECT name, email FROM users WHERE id = $1', [assignedTo]);
      if (agentRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Assigned agent not found');
      }
      const agent = agentRes.rows[0];

      await client.query(`
        UPDATE support_tickets 
        SET assigned_to = $1, last_activity_at = NOW(), updated_at = NOW() 
        WHERE id = $2
      `, [assignedTo, ticketId]);

      // Record assignment history
      await client.query(`
        INSERT INTO support_assignment_history (
          ticket_id, assigned_by, assigned_to, previous_assignee, note
        ) VALUES ($1, $2, $3, $4, $5)
      `, [ticketId, actorId, assignedTo, ticket.assigned_to, note || null]);

      // Record activity
      await client.query(`
        INSERT INTO support_ticket_activity (
          ticket_id, actor_id, action, old_value, new_value, description
        ) VALUES ($1, $2, 'assigned', $3, $4, $5)
      `, [ticketId, actorId, ticket.assigned_to, assignedTo, `Ticket assigned to ${agent.name}`]);

      await client.query('COMMIT');
      return { success: true, message: `Ticket assigned to ${agent.name}` };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // 10. STATUS & PRIORITY ACTIONS (RESOLVE, CLOSE, ESCALATE, REOPEN)
  // ---------------------------------------------------------------------------
  async updateStatus(ticketId: string, status: string, actorId: string) {
    return this.updateTicket(ticketId, { status }, actorId);
  },

  async updatePriority(ticketId: string, priority: string, actorId: string) {
    return this.updateTicket(ticketId, { priority }, actorId);
  },

  async escalateTicket(ticketId: string, actorId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketRes = await client.query('SELECT * FROM support_tickets WHERE id = $1 FOR UPDATE', [ticketId]);
      if (ticketRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
      }
      const ticket = ticketRes.rows[0];

      await client.query(`
        UPDATE support_tickets 
        SET priority = 'urgent', last_activity_at = NOW(), updated_at = NOW() 
        WHERE id = $1
      `, [ticketId]);

      await client.query(`
        INSERT INTO support_ticket_activity (
          ticket_id, actor_id, action, old_value, new_value, description
        ) VALUES ($1, $2, 'escalated', $3, 'urgent', 'Ticket escalated to Urgent priority')
      `, [ticketId, actorId, ticket.priority]);

      await client.query('COMMIT');
      return { success: true, message: 'Ticket escalated to urgent priority' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async reopenTicket(ticketId: string, actorId: string, reason?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketRes = await client.query('SELECT * FROM support_tickets WHERE id = $1 FOR UPDATE', [ticketId]);
      if (ticketRes.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
      }
      const ticket = ticketRes.rows[0];

      await client.query(`
        UPDATE support_tickets 
        SET status = 'open', resolved_at = NULL, closed_at = NULL, last_activity_at = NOW(), updated_at = NOW() 
        WHERE id = $1
      `, [ticketId]);

      await client.query(`
        INSERT INTO support_ticket_activity (
          ticket_id, actor_id, action, old_value, new_value, description
        ) VALUES ($1, $2, 'reopened', $3, 'open', $4)
      `, [ticketId, actorId, ticket.status, reason || 'Ticket reopened by Super Admin']);

      await client.query('COMMIT');
      return { success: true, message: 'Ticket reopened successfully' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ---------------------------------------------------------------------------
  // 11. TICKET ACTIVITY
  // ---------------------------------------------------------------------------
  async getTicketActivity(ticketId: string) {
    const res = await pool.query(`
      SELECT 
        sta.id, sta.action, sta.old_value, sta.new_value,
        sta.description, sta.created_at,
        u.name AS actor_name, u.email AS actor_email
      FROM support_ticket_activity sta
      LEFT JOIN users u ON u.id = sta.actor_id
      WHERE sta.ticket_id = $1
      ORDER BY sta.created_at DESC
    `, [ticketId]);

    return res.rows;
  },

  // ---------------------------------------------------------------------------
  // 12. EXPORT TICKETS TO CSV
  // ---------------------------------------------------------------------------
  async exportTicketsCSV(params: SupportTicketFilters) {
    const list = await this.listTickets({ ...params, page: 1, limit: 10000 });
    const items = list.items;

    const headers = [
      'Ticket Number',
      'Subject',
      'Category',
      'Priority',
      'Status',
      'User Name',
      'User Email',
      'Institution',
      'Assigned Agent',
      'Created Date',
      'Last Activity',
    ];

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = items.map((t: any) => [
      escapeCSV(t.ticket_number),
      escapeCSV(t.subject),
      escapeCSV(t.category),
      escapeCSV(t.priority),
      escapeCSV(t.status),
      escapeCSV(t.user_name),
      escapeCSV(t.user_email),
      escapeCSV(t.institution_name || 'N/A'),
      escapeCSV(t.assigned_to_name || 'Unassigned'),
      escapeCSV(new Date(t.created_at).toISOString()),
      escapeCSV(new Date(t.last_activity_at).toISOString()),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
