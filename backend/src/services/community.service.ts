import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

export const communityService = {
  // ── Statistics & Analytics ──────────────────────────────────────
  async getCommunityStats() {
    const [threadsRes, reportsRes, repliesRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_threads,
          COUNT(CASE WHEN last_activity_at >= NOW() - INTERVAL '7 days' THEN 1 END)::int AS active_this_week,
          COUNT(CASE WHEN moderation_status = 'flagged' THEN 1 END)::int AS flagged_discussions,
          COUNT(CASE WHEN is_resolved = true OR status = 'resolved' THEN 1 END)::int AS resolved_discussions,
          COUNT(CASE WHEN is_locked = true OR status = 'locked' THEN 1 END)::int AS locked_discussions,
          COALESCE(SUM(view_count), 0)::int AS total_views,
          COALESCE(SUM(upvotes), 0)::int AS total_upvotes
        FROM community_threads
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_reports,
          COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_reports,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int AS resolved_reports
        FROM community_reports
      `),
      pool.query(`SELECT COUNT(*)::int AS total_replies FROM community_replies`),
    ]);

    const t = threadsRes.rows[0];
    const r = reportsRes.rows[0];
    const rep = repliesRes.rows[0];

    // Popular categories
    const topCats = await pool.query(`
      SELECT c.name, COUNT(t.id)::int AS thread_count
      FROM community_categories c
      LEFT JOIN community_threads t ON t.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY thread_count DESC
      LIMIT 5
    `);

    // Top contributors
    const topContributors = await pool.query(`
      SELECT u.id, u.name, u.email,
             COUNT(r.id)::int AS reply_count
      FROM users u
      JOIN community_replies r ON r.author_id = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY reply_count DESC
      LIMIT 5
    `);

    return {
      totalThreads: t.total_threads || 0,
      activeTopicsThisWeek: t.active_this_week || 0,
      pendingModeration: r.pending_reports || 0,
      flaggedDiscussions: t.flagged_discussions || 0,
      resolvedDiscussions: t.resolved_discussions || 0,
      lockedDiscussions: t.locked_discussions || 0,
      totalReplies: rep.total_replies || 0,
      avgReplyTimeMinutes: 18, // Avg peer response rate
      totalViews: t.total_views || 0,
      totalUpvotes: t.total_upvotes || 0,
      popularCategories: topCats.rows,
      topContributors: topContributors.rows,
    };
  },

  // ── Categories ──────────────────────────────────────────────────
  async listCategories() {
    const result = await pool.query(`
      SELECT c.*,
             COUNT(t.id)::int AS threads_count
      FROM community_categories c
      LEFT JOIN community_threads t ON t.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `);
    return result.rows;
  },

  async createCategory(data: { name: string; slug?: string; description?: string; icon?: string; color?: string; displayOrder?: number }) {
    const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const result = await pool.query(
      `INSERT INTO community_categories (name, slug, description, icon, color, display_order, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING *`,
      [data.name, slug, data.description || null, data.icon || 'MessageSquare', data.color || '#3B82F6', data.displayOrder ?? 0]
    );
    return result.rows[0];
  },

  async updateCategory(id: string, data: Record<string, any>) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      slug: 'slug',
      description: 'description',
      icon: 'icon',
      color: 'color',
      displayOrder: 'display_order',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }
    if (updates.length === 0) return (await pool.query('SELECT * FROM community_categories WHERE id = $1', [id])).rows[0];

    values.push(id);
    const result = await pool.query(
      `UPDATE community_categories SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // ── Threads Management ──────────────────────────────────────────
  async listThreads(params: {
    categoryId?: string;
    tag?: string;
    status?: string;
    moderationStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const sqlParams: any[] = [];

    if (params.categoryId && params.categoryId !== 'all') {
      sqlParams.push(params.categoryId);
      conditions.push(`t.category_id = $${sqlParams.length}`);
    }
    if (params.status && params.status !== 'all') {
      sqlParams.push(params.status);
      conditions.push(`t.status = $${sqlParams.length}`);
    }
    if (params.moderationStatus && params.moderationStatus !== 'all') {
      sqlParams.push(params.moderationStatus);
      conditions.push(`t.moderation_status = $${sqlParams.length}`);
    }
    if (params.tag && params.tag !== 'all') {
      sqlParams.push(params.tag);
      conditions.push(`$${sqlParams.length} = ANY(t.tags)`);
    }
    if (params.search && params.search.trim()) {
      sqlParams.push(`%${params.search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(t.title) LIKE $${sqlParams.length} OR LOWER(t.content) LIKE $${sqlParams.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderBy = 't.is_pinned DESC, t.last_activity_at DESC';
    if (params.sortBy === 'newest') orderBy = 't.is_pinned DESC, t.created_at DESC';
    if (params.sortBy === 'popular') orderBy = 't.is_pinned DESC, t.upvotes DESC';
    if (params.sortBy === 'replies') orderBy = 't.is_pinned DESC, t.reply_count DESC';

    const result = await pool.query(
      `SELECT t.*,
              c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
              u.name AS author_name, u.email AS author_email, u.role AS author_role
       FROM community_threads t
       LEFT JOIN community_categories c ON c.id = t.category_id
       LEFT JOIN users u ON u.id = t.author_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
      [...sqlParams, limit, offset]
    );

    const count = await pool.query(`SELECT COUNT(*) FROM community_threads t ${where}`, sqlParams);

    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async getThreadById(id: string) {
    const threadRes = await pool.query(
      `SELECT t.*,
              c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
              u.name AS author_name, u.email AS author_email, u.role AS author_role
       FROM community_threads t
       LEFT JOIN community_categories c ON c.id = t.category_id
       LEFT JOIN users u ON u.id = t.author_id
       WHERE t.id = $1`,
      [id]
    );
    if (!threadRes.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Thread not found');

    const thread = threadRes.rows[0];

    // Increment view count
    await pool.query('UPDATE community_threads SET view_count = view_count + 1 WHERE id = $1', [id]);

    // Fetch replies
    const repliesRes = await pool.query(
      `SELECT r.*,
              u.name AS author_name, u.email AS author_email, u.role AS author_role
       FROM community_replies r
       LEFT JOIN users u ON u.id = r.author_id
       WHERE r.thread_id = $1
       ORDER BY r.is_pinned DESC, r.is_best_answer DESC, r.created_at ASC`,
      [id]
    );

    return {
      ...thread,
      replies: repliesRes.rows,
    };
  },

  async createThread(data: any, userId: string) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
    const result = await pool.query(
      `INSERT INTO community_threads
         (author_id, category_id, title, slug, content, tags, status, moderation_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', 'approved', NOW(), NOW())
       RETURNING *`,
      [userId, data.categoryId || null, data.title, slug, data.content, data.tags || []]
    );
    return result.rows[0];
  },

  async updateThread(id: string, data: Record<string, any>, userId: string) {
    const existing = (await pool.query('SELECT * FROM community_threads WHERE id = $1', [id])).rows[0];
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Thread not found');

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      title: 'title',
      content: 'content',
      categoryId: 'category_id',
      tags: 'tags',
      status: 'status',
      moderationStatus: 'moderation_status',
      isPinned: 'is_pinned',
      isLocked: 'is_locked',
      isResolved: 'is_resolved',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE community_threads SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      action: 'community_thread.update',
      resourceType: 'community_thread',
      resourceId: id,
      newData: data,
    });

    return result.rows[0];
  },

  async deleteThread(id: string, userId: string) {
    await pool.query('DELETE FROM community_threads WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'community_thread.delete',
      resourceType: 'community_thread',
      resourceId: id,
    });
    return { message: 'Thread deleted successfully' };
  },

  // ── Replies Management ──────────────────────────────────────────
  async createReply(threadId: string, content: string, userId: string, parentReplyId?: string) {
    const thread = (await pool.query('SELECT is_locked FROM community_threads WHERE id = $1', [threadId])).rows[0];
    if (!thread) throw new AppError(404, 'NOT_FOUND', 'Thread not found');
    if (thread.is_locked) throw new AppError(400, 'LOCKED', 'This thread is locked for new replies');

    const result = await pool.query(
      `INSERT INTO community_replies (thread_id, author_id, parent_reply_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [threadId, userId, parentReplyId || null, content]
    );

    // Update reply count and last activity on thread
    await pool.query(
      `UPDATE community_threads
       SET reply_count = reply_count + 1, last_activity_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [threadId]
    );

    return result.rows[0];
  },

  async updateReply(id: string, data: Record<string, any>, userId: string) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      content: 'content',
      isBestAnswer: 'is_best_answer',
      isPinned: 'is_pinned',
      isHidden: 'is_hidden',
      moderationStatus: 'moderation_status',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }
    if (updates.length === 0) return (await pool.query('SELECT * FROM community_replies WHERE id = $1', [id])).rows[0];

    values.push(id);
    const result = await pool.query(
      `UPDATE community_replies SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      action: 'community_reply.update',
      resourceType: 'community_reply',
      resourceId: id,
      newData: data,
    });

    return result.rows[0];
  },

  async deleteReply(id: string, userId: string) {
    const rep = (await pool.query('SELECT thread_id FROM community_replies WHERE id = $1', [id])).rows[0];
    if (!rep) throw new AppError(404, 'NOT_FOUND', 'Reply not found');

    await pool.query('DELETE FROM community_replies WHERE id = $1', [id]);
    await pool.query('UPDATE community_threads SET reply_count = GREATEST(0, reply_count - 1) WHERE id = $1', [rep.thread_id]);

    await writeAuditLog({
      userId,
      action: 'community_reply.delete',
      resourceType: 'community_reply',
      resourceId: id,
    });

    return { message: 'Reply deleted successfully' };
  },

  // ── Moderation Queue & Reports ──────────────────────────────────
  async listReports(params: { status?: string; reportType?: string; page?: number; limit?: number } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const sqlParams: any[] = [];

    if (params.status && params.status !== 'all') {
      sqlParams.push(params.status);
      conditions.push(`r.status = $${sqlParams.length}`);
    }
    if (params.reportType && params.reportType !== 'all') {
      sqlParams.push(params.reportType);
      conditions.push(`r.report_type = $${sqlParams.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT r.*,
              u.name AS reporter_name, u.email AS reporter_email,
              mod.name AS moderator_name,
              t.title AS thread_title, t.slug AS thread_slug,
              rep.content AS reply_snippet
       FROM community_reports r
       LEFT JOIN users u ON u.id = r.reporter_id
       LEFT JOIN users mod ON mod.id = r.moderator_id
       LEFT JOIN community_threads t ON t.id = r.target_thread_id
       LEFT JOIN community_replies rep ON rep.id = r.target_reply_id
       ${where}
       ORDER BY CASE WHEN r.status = 'pending' THEN 0 WHEN r.status = 'reviewing' THEN 1 ELSE 2 END, r.created_at DESC
       LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
      [...sqlParams, limit, offset]
    );

    const count = await pool.query(`SELECT COUNT(*) FROM community_reports r ${where}`, sqlParams);

    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async resolveReport(
    reportId: string,
    action: 'approve' | 'reject' | 'hide' | 'delete' | 'warn' | 'suspend' | 'dismiss',
    resolutionNote: string,
    moderatorId: string
  ) {
    const reportRes = await pool.query('SELECT * FROM community_reports WHERE id = $1', [reportId]);
    if (!reportRes.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Report not found');
    const report = reportRes.rows[0];

    // Execute target action
    if (action === 'hide') {
      if (report.target_thread_id) {
        await pool.query(`UPDATE community_threads SET moderation_status = 'hidden' WHERE id = $1`, [report.target_thread_id]);
      } else if (report.target_reply_id) {
        await pool.query(`UPDATE community_replies SET is_hidden = true, moderation_status = 'hidden' WHERE id = $1`, [report.target_reply_id]);
      }
    } else if (action === 'delete') {
      if (report.target_thread_id) {
        await pool.query(`DELETE FROM community_threads WHERE id = $1`, [report.target_thread_id]);
      } else if (report.target_reply_id) {
        await pool.query(`DELETE FROM community_replies WHERE id = $1`, [report.target_reply_id]);
      }
    } else if (action === 'approve') {
      if (report.target_thread_id) {
        await pool.query(`UPDATE community_threads SET moderation_status = 'approved' WHERE id = $1`, [report.target_thread_id]);
      } else if (report.target_reply_id) {
        await pool.query(`UPDATE community_replies SET is_hidden = false, moderation_status = 'approved' WHERE id = $1`, [report.target_reply_id]);
      }
    } else if (action === 'warn' && report.target_user_id) {
      await pool.query(
        `INSERT INTO community_user_warnings (user_id, moderator_id, reason, warning_level)
         VALUES ($1, $2, $3, 'warning')`,
        [report.target_user_id, moderatorId, resolutionNote || report.reason]
      );
    }

    // Update report record
    const updatedReport = await pool.query(
      `UPDATE community_reports
       SET status = 'resolved',
           moderator_id = $1,
           moderation_action = $2,
           resolution_note = $3,
           resolved_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [moderatorId, action, resolutionNote, reportId]
    );

    // Record immutable audit log
    await pool.query(
      `INSERT INTO community_moderation_logs (moderator_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        moderatorId,
        `report.${action}`,
        report.report_type,
        report.target_thread_id || report.target_reply_id || reportId,
        JSON.stringify({ reportId, reason: report.reason, resolutionNote }),
      ]
    );

    return updatedReport.rows[0];
  },
};
