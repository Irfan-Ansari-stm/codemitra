import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

// ── Content Pages ───────────────────────────────────────────────
export const contentPageService = {
  async list(status?: string, pageType?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (pageType) {
      params.push(pageType);
      conditions.push(`page_type = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, page_type, status, is_featured,
              published_at, seo_title, seo_description, created_by, created_at, updated_at
       FROM content_pages ${where}
       ORDER BY updated_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM content_pages ${where}`,
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

  async getBySlug(slug: string) {
    const result = await pool.query(
      `SELECT * FROM content_pages WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Page not found');
    }
    return result.rows[0];
  },

  async getById(id: string) {
    const result = await pool.query(
      'SELECT * FROM content_pages WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Page not found');
    }
    return result.rows[0];
  },

  async create(
    data: {
      slug: string;
      title: string;
      content: string;
      excerpt?: string;
      pageType?: string;
      status?: string;
      isFeatured?: boolean;
      seoTitle?: string;
      seoDescription?: string;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO content_pages
         (slug, title, content, excerpt, page_type, status, is_featured,
          published_at, seo_title, seo_description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
               CASE WHEN $6 = 'published' THEN NOW() ELSE NULL END,
               $8, $9, $10)
       RETURNING *`,
      [
        data.slug,
        data.title,
        data.content,
        data.excerpt || null,
        data.pageType || 'page',
        data.status || 'draft',
        data.isFeatured || false,
        data.seoTitle || null,
        data.seoDescription || null,
        userId,
      ]
    );

    await writeAuditLog({
      userId,
      action: 'content_page.create',
      resourceType: 'content_page',
      resourceId: result.rows[0].id,
      newData: { slug: data.slug, title: data.title },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    data: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const existing = await this.getById(id);

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      slug: 'slug',
      title: 'title',
      content: 'content',
      excerpt: 'excerpt',
      pageType: 'page_type',
      status: 'status',
      isFeatured: 'is_featured',
      seoTitle: 'seo_title',
      seoDescription: 'seo_description',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    if (data.status === 'published' && existing.status !== 'published') {
      updates.push(`published_at = NOW()`);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE content_pages SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      action: 'content_page.update',
      resourceType: 'content_page',
      resourceId: id,
      oldData: { slug: existing.slug, title: existing.title },
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, userId: string) {
    const existing = await this.getById(id);
    await pool.query('DELETE FROM content_pages WHERE id = $1', [id]);

    await writeAuditLog({
      userId,
      action: 'content_page.delete',
      resourceType: 'content_page',
      resourceId: id,
      oldData: { slug: existing.slug, title: existing.title },
    });

    return { message: 'Page deleted' };
  },
};

// ── Banners ─────────────────────────────────────────────────────
export const bannerService = {
  async list() {
    const result = await pool.query(
      `SELECT * FROM banners WHERE is_active = TRUE
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY display_order ASC`
    );
    return result.rows;
  },

  async listAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT * FROM banners ORDER BY display_order ASC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM banners');
    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async create(
    data: {
      title: string;
      subtitle?: string;
      content?: string;
      imageUrl?: string;
      linkUrl?: string;
      linkText?: string;
      position?: string;
      isActive?: boolean;
      startDate?: string;
      endDate?: string;
      displayOrder?: number;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO banners
         (title, subtitle, content, image_url, link_url, link_text, position,
          is_active, start_date, end_date, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.title,
        data.subtitle || null,
        data.content || null,
        data.imageUrl || null,
        data.linkUrl || null,
        data.linkText || null,
        data.position || 'hero',
        data.isActive !== undefined ? data.isActive : true,
        data.startDate || null,
        data.endDate || null,
        data.displayOrder || 0,
      ]
    );

    await writeAuditLog({
      userId,
      action: 'banner.create',
      resourceType: 'banner',
      resourceId: result.rows[0].id,
      newData: { title: data.title },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async update(
    id: string,
    data: Record<string, any>,
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      title: 'title',
      subtitle: 'subtitle',
      content: 'content',
      imageUrl: 'image_url',
      linkUrl: 'link_url',
      linkText: 'link_text',
      position: 'position',
      isActive: 'is_active',
      startDate: 'start_date',
      endDate: 'end_date',
      displayOrder: 'display_order',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE banners SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    await writeAuditLog({
      userId,
      action: 'banner.update',
      resourceType: 'banner',
      resourceId: id,
      newData: data,
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, userId: string) {
    await pool.query('DELETE FROM banners WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'banner.delete',
      resourceType: 'banner',
      resourceId: id,
    });
    return { message: 'Banner deleted' };
  },
};

// ── FAQ Items ───────────────────────────────────────────────────
export const faqService = {
  async list() {
    const result = await pool.query(
      `SELECT * FROM faq_items WHERE is_published = TRUE
       ORDER BY order_index ASC`
    );
    return result.rows;
  },

  async listAll() {
    const result = await pool.query(
      `SELECT * FROM faq_items ORDER BY order_index ASC`
    );
    return result.rows;
  },

  async create(
    data: { question: string; answer: string; category?: string; orderIndex?: number },
    userId: string
  ) {
    const result = await pool.query(
      `INSERT INTO faq_items (question, answer, category, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.question, data.answer, data.category || null, data.orderIndex || 0]
    );
    await writeAuditLog({
      userId,
      action: 'faq.create',
      resourceType: 'faq',
      resourceId: result.rows[0].id,
      newData: { question: data.question },
    });
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>, userId: string) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      question: 'question',
      answer: 'answer',
      category: 'category',
      orderIndex: 'order_index',
      isPublished: 'is_published',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE faq_items SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    await writeAuditLog({
      userId,
      action: 'faq.update',
      resourceType: 'faq',
      resourceId: id,
      newData: data,
    });
    return result.rows[0];
  },

  async delete(id: string, userId: string) {
    await pool.query('DELETE FROM faq_items WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'faq.delete',
      resourceType: 'faq',
      resourceId: id,
    });
    return { message: 'FAQ deleted' };
  },
};

// ── Help Articles ───────────────────────────────────────────────
export const helpArticleService = {
  async list() {
    const result = await pool.query(
      `SELECT id, slug, title, category, view_count, created_at
       FROM help_articles WHERE is_published = TRUE
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async getBySlug(slug: string) {
    const result = await pool.query(
      `SELECT * FROM help_articles WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Article not found');
    }
    // Increment view count
    await pool.query(
      'UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1',
      [result.rows[0].id]
    );
    return result.rows[0];
  },

  async listAll() {
    const result = await pool.query(
      `SELECT * FROM help_articles ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async create(
    data: { slug: string; title: string; content: string; category?: string },
    userId: string
  ) {
    const result = await pool.query(
      `INSERT INTO help_articles (slug, title, content, category, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.slug, data.title, data.content, data.category || null, userId]
    );
    await writeAuditLog({
      userId,
      action: 'help_article.create',
      resourceType: 'help_article',
      resourceId: result.rows[0].id,
      newData: { slug: data.slug, title: data.title },
    });
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>, userId: string) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      slug: 'slug',
      title: 'title',
      content: 'content',
      category: 'category',
      isPublished: 'is_published',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE help_articles SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    await writeAuditLog({
      userId,
      action: 'help_article.update',
      resourceType: 'help_article',
      resourceId: id,
      newData: data,
    });
    return result.rows[0];
  },

  async delete(id: string, userId: string) {
    await pool.query('DELETE FROM help_articles WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'help_article.delete',
      resourceType: 'help_article',
      resourceId: id,
    });
    return { message: 'Article deleted' };
  },
};

// ── Media Assets ────────────────────────────────────────────────
export const mediaAssetService = {
  async list(tenantId?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (tenantId) {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM media_assets ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM media_assets ${where}`,
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

  async create(
    tenantId: string | null,
    data: {
      name: string;
      fileUrl: string;
      fileType: string;
      mimeType?: string;
      fileSizeBytes?: number;
      altText?: string;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO media_assets
         (tenant_id, name, file_url, file_type, mime_type, file_size_bytes, alt_text, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId,
        data.name,
        data.fileUrl,
        data.fileType,
        data.mimeType || null,
        data.fileSizeBytes || null,
        data.altText || null,
        userId,
      ]
    );

    await writeAuditLog({
      userId,
      tenantId,
      action: 'media.upload',
      resourceType: 'media_asset',
      resourceId: result.rows[0].id,
      newData: { name: data.name, fileType: data.fileType },
      ipAddress,
      requestId,
    });

    return result.rows[0];
  },

  async delete(id: string, tenantId: string | null, userId: string) {
    const result = await pool.query(
      'DELETE FROM media_assets WHERE id = $1 AND ($2::uuid IS NULL OR tenant_id = $2) RETURNING *',
      [id, tenantId || null]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Media asset not found');
    }
    await writeAuditLog({
      userId,
      tenantId,
      action: 'media.delete',
      resourceType: 'media_asset',
      resourceId: id,
      oldData: { name: result.rows[0].name },
    });
    return { message: 'Media asset deleted' };
  },
};
