import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

export const notificationRouter = Router();
notificationRouter.use(requireAuth);

// GET /api/v1/notifications/unread-count
notificationRouter.get('/unread-count', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id=$1 AND NOT is_read',
      [req.user!.id]
    );
    res.json({ success: true, data: { unread: result.rows[0]?.unread || 0 } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications
notificationRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await pool.query(
      `SELECT id, type, title, message, action_url AS "actionUrl", is_read AS "isRead", metadata, created_at AS "createdAt"
       FROM notifications
       WHERE user_id=$1 AND ($2::boolean=false OR NOT is_read)
       ORDER BY created_at DESC LIMIT $3`,
      [req.user!.id, unreadOnly, limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/read-all
notificationRouter.patch('/read-all', async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND NOT is_read RETURNING id',
      [req.user!.id]
    );
    res.json({ success: true, data: { markedRead: result.rowCount } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/:id/read
notificationRouter.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
    res.json({ success: true, data: { id: result.rows[0].id, isRead: true } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/mark-read
notificationRouter.patch('/mark-read', async (req, res, next) => {
  try {
    const ids = req.body?.ids;
    if (ids !== undefined && (!Array.isArray(ids) || ids.some((id: unknown) => typeof id !== 'string'))) {
      throw new AppError(400, 'VALIDATION_ERROR', 'ids must be an array of notification IDs');
    }
    const result = ids?.length
      ? await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND id=ANY($2::uuid[]) RETURNING id', [req.user!.id, ids])
      : await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND NOT is_read RETURNING id', [req.user!.id]);
    res.json({ success: true, data: { markedRead: result.rowCount } });
  } catch (err) {
    next(err);
  }
});

notificationRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
    res.json({ success: true, data: { message: 'Notification dismissed' } });
  } catch (err) { next(err); }
});

export const announcementRouter = Router();
announcementRouter.use(requireAuth, isInstitutionAdmin);
announcementRouter.post('/', async (req, res, next) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return next(new AppError(400, 'TENANT_REQUIRED', 'Tenant context required'));
  const { title, content, isPinned = false } = req.body || {};
  if (typeof title !== 'string' || title.trim().length < 2 || typeof content !== 'string' || !content.trim()) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'title and content are required'));
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO announcements (tenant_id,created_by,title,content,is_pinned) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [tenantId, req.user!.id, title.trim(), content, Boolean(isPinned)]
    );
    await client.query(
      `INSERT INTO notifications (user_id,type,title,message,action_url,metadata)
       SELECT id,'announcement',$1,$2,NULL,jsonb_build_object('announcementId',$3::text)
       FROM users WHERE tenant_id=$4 AND role='institution_student' AND is_active AND NOT is_deleted`,
      [title.trim(), content, result.rows[0].id, tenantId]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});
