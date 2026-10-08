import { pool } from '../db';

export const notificationService = {
  async getUnread(userId: string, limit = 20) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async markRead(notificationId: string, userId: string) {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
  },

  async markAllRead(userId: string) {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
  },

  async create(params: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        params.userId, params.type, params.title,
        params.message || null, params.actionUrl || null,
        JSON.stringify(params.metadata || {}),
      ]
    );
    return result.rows[0];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },
};
