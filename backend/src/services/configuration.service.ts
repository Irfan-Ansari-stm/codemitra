import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

export const configurationService = {
  async getAll() {
    const result = await pool.query(
      `SELECT config_key, config_value, category, description, is_sensitive, updated_at
       FROM platform_configurations
       ORDER BY category, config_key`
    );
    // Group by category
    const grouped: Record<string, Record<string, any>> = {};
    for (const row of result.rows) {
      if (!grouped[row.category]) {
        grouped[row.category] = {};
      }
      grouped[row.category][row.config_key] = {
        ...row.config_value,
        description: row.description,
        is_sensitive: row.is_sensitive,
        updated_at: row.updated_at,
      };
    }
    return grouped;
  },

  async getByKey(key: string) {
    const result = await pool.query(
      'SELECT * FROM platform_configurations WHERE config_key = $1',
      [key]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Configuration not found');
    }
    return result.rows[0];
  },

  async getByCategory(category: string) {
    const result = await pool.query(
      `SELECT config_key, config_value, description, is_sensitive, updated_at
       FROM platform_configurations WHERE category = $1
       ORDER BY config_key`,
      [category]
    );
    return result.rows;
  },

  async update(
    key: string,
    value: any,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM platform_configurations WHERE config_key = $1',
      [key]
    );

    if (existing.rows.length === 0) {
      // Create new
      const result = await pool.query(
        `INSERT INTO platform_configurations (config_key, config_value, updated_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [key, JSON.stringify(value), userId]
      );

      await writeAuditLog({
        userId,
        action: 'configuration.create',
        resourceType: 'configuration',
        resourceId: key,
        newData: { config_key: key, value },
        ipAddress,
        requestId,
      });

      // Record in history
      await pool.query(
        `INSERT INTO configuration_history (config_key, old_value, new_value, changed_by)
         VALUES ($1, NULL, $2, $3)`,
        [key, JSON.stringify(value), userId]
      );

      return result.rows[0];
    }

    const oldValue = existing.rows[0].config_value;

    const result = await pool.query(
      `UPDATE platform_configurations
       SET config_value = $1, updated_by = $2, updated_at = NOW()
       WHERE config_key = $3
       RETURNING *`,
      [JSON.stringify(value), userId, key]
    );

    await writeAuditLog({
      userId,
      action: 'configuration.update',
      resourceType: 'configuration',
      resourceId: key,
      oldData: { config_key: key, value: oldValue },
      newData: { config_key: key, value },
      ipAddress,
      requestId,
    });

    // Record in history
    await pool.query(
      `INSERT INTO configuration_history (config_key, old_value, new_value, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [key, oldValue, JSON.stringify(value), userId]
    );

    return result.rows[0];
  },

  async updateBulk(
    configs: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const [key, value] of Object.entries(configs)) {
        const result = await this.update(key, value, userId, ipAddress, requestId);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getHistory(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT ch.*, u.name as changed_by_name
       FROM configuration_history ch
       LEFT JOIN users u ON u.id = ch.changed_by
       ORDER BY ch.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM configuration_history');
    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async getFeatureFlags() {
    const result = await pool.query(
      `SELECT flag_key, name, description, is_enabled, rollout_percent, metadata, updated_at
       FROM feature_flags
       ORDER BY name`
    );
    return result.rows;
  },

  async updateFeatureFlag(
    key: string,
    data: { isEnabled?: boolean; rolloutPercent?: number },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.isEnabled !== undefined) {
      values.push(data.isEnabled);
      updates.push(`is_enabled = $${values.length}`);
    }
    if (data.rolloutPercent !== undefined) {
      values.push(data.rolloutPercent);
      updates.push(`rollout_percent = $${values.length}`);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'NO_FIELDS', 'No valid fields to update');
    }

    values.push(key);
    const result = await pool.query(
      `UPDATE feature_flags SET ${updates.join(', ')}, updated_by = $${values.length + 1}, updated_at = NOW()
       WHERE flag_key = $${values.length + 2}
       RETURNING *`,
      [...values, userId, key]
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Feature flag not found');
    }

    await writeAuditLog({
      userId,
      action: 'feature_flag.update',
      resourceType: 'feature_flag',
      resourceId: key,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },
};

// ── SEO Service ─────────────────────────────────────────────────
export const seoService = {
  async getGlobalSettings() {
    const result = await pool.query(
      `SELECT config_value FROM platform_configurations WHERE config_key = 'seo.global'`
    );
    return result.rows[0]?.config_value || {
      siteTitle: 'CodeVerse',
      siteDescription: 'Multi-tenant coding education platform',
      defaultKeywords: ['coding', 'education', 'programming'],
      defaultOgImage: null,
      twitterHandle: null,
      googleAnalyticsId: null,
      robotsTxt: 'User-agent: *\nAllow: /',
    };
  },

  async updateGlobalSettings(
    settings: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    return configurationService.update('seo.global', settings, userId, ipAddress, requestId);
  },

  async getEntityMetadata(entityType: string, entityId: string) {
    const result = await pool.query(
      'SELECT * FROM seo_metadata WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );
    return result.rows[0] || null;
  },

  async setEntityMetadata(
    entityType: string,
    entityId: string,
    data: {
      metaTitle?: string;
      metaDescription?: string;
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
      structuredData?: any;
      noindex?: boolean;
      nofollow?: boolean;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await pool.query(
      'SELECT * FROM seo_metadata WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );

    if (existing.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO seo_metadata
           (entity_type, entity_id, meta_title, meta_description, canonical_url,
            og_title, og_description, og_image_url, structured_data, noindex, nofollow)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          entityType,
          entityId,
          data.metaTitle || null,
          data.metaDescription || null,
          data.canonicalUrl || null,
          data.ogTitle || null,
          data.ogDescription || null,
          data.ogImageUrl || null,
          JSON.stringify(data.structuredData || {}),
          data.noindex || false,
          data.nofollow || false,
        ]
      );
      return result.rows[0];
    }

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      metaTitle: 'meta_title',
      metaDescription: 'meta_description',
      canonicalUrl: 'canonical_url',
      ogTitle: 'og_title',
      ogDescription: 'og_description',
      ogImageUrl: 'og_image_url',
      noindex: 'noindex',
      nofollow: 'nofollow',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }
    if (data.structuredData !== undefined) {
      values.push(JSON.stringify(data.structuredData));
      updates.push(`structured_data = $${values.length}`);
    }

    values.push(entityType, entityId);
    const result = await pool.query(
      `UPDATE seo_metadata SET ${updates.join(', ')}
       WHERE entity_type = $${values.length - 1} AND entity_id = $${values.length}
       RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      action: 'seo.update',
      resourceType: 'seo_metadata',
      resourceId: entityId,
      newData: { entityType, entityId, ...data },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async getRedirects(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT * FROM redirects ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM redirects');
    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async createRedirect(
    data: { sourcePath: string; targetPath: string; statusCode?: number; isActive?: boolean },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO redirects (source_path, target_path, status_code, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.sourcePath, data.targetPath, data.statusCode || 301, data.isActive !== undefined ? data.isActive : true]
    );

    await writeAuditLog({
      userId,
      action: 'redirect.create',
      resourceType: 'redirect',
      resourceId: result.rows[0].id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async deleteRedirect(id: string, userId: string) {
    await pool.query('DELETE FROM redirects WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'redirect.delete',
      resourceType: 'redirect',
      resourceId: id,
    });
    return { message: 'Redirect deleted' };
  },

  async generateSitemap() {
    // Generate sitemap from published content
    const pages = await pool.query(
      `SELECT slug, updated_at FROM content_pages WHERE status = 'published'`
    );
    const courses = await pool.query(
      `SELECT id, updated_at FROM courses WHERE status = 'published' AND is_deleted = FALSE`
    );
    const problems = await pool.query(
      `SELECT slug, updated_at FROM problems WHERE scope = 'public' AND is_deleted = FALSE`
    );
    const blogPosts = await pool.query(
      `SELECT slug, updated_at FROM blog_posts WHERE status = 'published'`
    );

    const baseUrl = process.env.PUBLIC_URL || 'https://codeverse.io';
    const urls = [
      { loc: baseUrl, lastmod: new Date().toISOString(), priority: 1.0 },
      ...pages.rows.map((p: any) => ({
        loc: `${baseUrl}/pages/${p.slug}`,
        lastmod: p.updated_at,
        priority: 0.6,
      })),
      ...courses.rows.map((c: any) => ({
        loc: `${baseUrl}/courses/${c.id}`,
        lastmod: c.updated_at,
        priority: 0.8,
      })),
      ...problems.rows.map((p: any) => ({
        loc: `${baseUrl}/problems/${p.slug}`,
        lastmod: p.updated_at,
        priority: 0.7,
      })),
      ...blogPosts.rows.map((b: any) => ({
        loc: `${baseUrl}/blog/${b.slug}`,
        lastmod: b.updated_at,
        priority: 0.6,
      })),
    ];

    return urls;
  },
};

// ── Logs Service ────────────────────────────────────────────────
export const logsService = {
  async getAuditLogs(
    filters: {
      userId?: string;
      tenantId?: string;
      action?: string;
      resourceType?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (filters.tenantId) {
      params.push(filters.tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }
    if (filters.action) {
      params.push(`%${filters.action}%`);
      conditions.push(`action ILIKE $${params.length}`);
    }
    if (filters.resourceType) {
      params.push(filters.resourceType);
      conditions.push(`resource_type = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email,
              t.name as tenant_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN tenants t ON t.id = a.tenant_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM audit_logs a ${where}`,
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

  async getApplicationLogs(
    filters: {
      level?: string;
      source?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.level) {
      params.push(filters.level);
      conditions.push(`level = $${params.length}`);
    }
    if (filters.source) {
      params.push(`%${filters.source}%`);
      conditions.push(`source ILIKE $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM application_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM application_logs ${where}`,
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

  async getActivityEvents(
    filters: {
      userId?: string;
      tenantId?: string;
      eventType?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (filters.tenantId) {
      params.push(filters.tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }
    if (filters.eventType) {
      params.push(filters.eventType);
      conditions.push(`event_type = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT e.*, u.name as user_name, t.name as tenant_name
       FROM activity_events e
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN tenants t ON t.id = e.tenant_id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM activity_events e ${where}`,
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

  async getAuthLogs(
    filters: {
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const conditions: string[] = ["action IN ('user.login', 'user.logout', 'user.login_failed', 'user.password_change')"];
    const params: any[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM audit_logs a ${where}`,
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

  async logError(
    level: string,
    message: string,
    source: string,
    stackTrace?: string,
    metadata?: any,
    userId?: string,
    tenantId?: string,
    requestId?: string
  ) {
    await pool.query(
      `INSERT INTO application_logs
         (level, message, source, stack_trace, metadata, user_id, tenant_id, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        level,
        message,
        source,
        stackTrace || null,
        JSON.stringify(metadata || {}),
        userId || null,
        tenantId || null,
        requestId || null,
      ]
    );
  },
};

// ── Notification Service ────────────────────────────────────────
export const notificationService = {
  async create(params: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    actionUrl?: string;
    metadata?: any;
  }) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        params.userId,
        params.type,
        params.title,
        params.message || null,
        params.actionUrl || null,
        JSON.stringify(params.metadata || {}),
      ]
    );
    return result.rows[0];
  },

  async createBulk(
    userIds: string[],
    params: {
      type: string;
      title: string;
      message?: string;
      actionUrl?: string;
      metadata?: any;
    }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const userId of userIds) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            params.type,
            params.title,
            params.message || null,
            params.actionUrl || null,
            JSON.stringify(params.metadata || {}),
          ]
        );
      }

      await client.query('COMMIT');
      return { count: userIds.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async list(userId: string, isRead?: boolean, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];

    if (isRead !== undefined) {
      params.push(isRead);
      conditions.push(`is_read = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
      `SELECT * FROM notifications ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM notifications ${where}`,
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

  async markRead(ids: string[], userId: string) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = ANY($1) AND user_id = $2
       RETURNING *`,
      [ids, userId]
    );
    return result.rows;
  },

  async markAllRead(userId: string) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING *`,
      [userId]
    );
    return result.rows;
  },

  async delete(id: string, userId: string) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Notification not found');
    }
    return result.rows[0];
  },

  async getTemplates() {
    const result = await pool.query(
      `SELECT * FROM notification_templates ORDER BY name`
    );
    return result.rows;
  },

  async updateTemplate(
    id: string,
    data: { name?: string; subject?: string; bodyTemplate?: string; channel?: string; isActive?: boolean },
    userId: string
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      subject: 'subject',
      bodyTemplate: 'body_template',
      channel: 'channel',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE notification_templates SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      action: 'notification_template.update',
      resourceType: 'notification_template',
      resourceId: id,
      newData: data,
    });

    return result.rows[0];
  },
};
