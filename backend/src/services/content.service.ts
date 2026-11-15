import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

// ── Content Pages ───────────────────────────────────────────────
export const contentPageService = {
  async getStats() {
    const [pagesCount, bannersCount, faqsCount] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_pages,
          COUNT(CASE WHEN status = 'published' THEN 1 END)::int AS published_pages,
          COUNT(CASE WHEN status = 'draft' THEN 1 END)::int AS draft_pages,
          COUNT(CASE WHEN status = 'archived' THEN 1 END)::int AS archived_pages
        FROM content_pages
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_banners,
          COUNT(CASE WHEN is_active = true THEN 1 END)::int AS active_banners
        FROM content_banners
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_faqs,
          COUNT(DISTINCT category)::int AS categories_count
        FROM content_faqs
      `),
    ]);

    const pageStats = pagesCount.rows[0];
    const bannerStats = bannersCount.rows[0];
    const faqStats = faqsCount.rows[0];

    return {
      totalPages: pageStats.total_pages || 0,
      publishedPages: pageStats.published_pages || 0,
      draftPages: pageStats.draft_pages || 0,
      archivedPages: pageStats.archived_pages || 0,
      totalBanners: bannerStats.total_banners || 0,
      activeBanners: bannerStats.active_banners || 0,
      totalFaqs: faqStats.total_faqs || 0,
      faqCategories: faqStats.categories_count || 0,
    };
  },

  async list(status?: string, pageType?: string, search?: string, page = 1, limit = 20, sortBy = 'updated_at', sortOrder = 'DESC') {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (pageType && pageType !== 'all') {
      params.push(pageType);
      conditions.push(`page_type = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(title) LIKE $${params.length} OR LOWER(slug) LIKE $${params.length} OR LOWER(excerpt) LIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortCol = ['title', 'status', 'page_type', 'view_count', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'updated_at';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(
      `SELECT p.id, p.slug, p.title, p.excerpt, p.content, p.page_type, p.category, p.status, p.is_featured,
              p.published_at, p.scheduled_at, p.view_count, p.seo_title, p.seo_description, p.keywords,
              p.created_by, p.created_at, p.updated_at,
              u.name AS author_name, u.email AS author_email
       FROM content_pages p
       LEFT JOIN users u ON u.id = p.created_by
       ${where}
       ORDER BY p.${safeSortCol} ${safeOrder}
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
      `SELECT p.*, u.name AS author_name
       FROM content_pages p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.slug = $1 AND p.status = 'published'`,
      [slug]
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Page not found');
    }
    await pool.query('UPDATE content_pages SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]);
    return result.rows[0];
  },

  async getById(id: string) {
    const result = await pool.query(
      `SELECT p.*, u.name AS author_name, u.email AS author_email
       FROM content_pages p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
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
      category?: string;
      status?: string;
      isFeatured?: boolean;
      seoTitle?: string;
      seoDescription?: string;
      keywords?: string[];
      scheduledAt?: string | null;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const cleanSlug = data.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const publishedAt = data.status === 'published' ? new Date() : null;

    const result = await pool.query(
      `INSERT INTO content_pages
         (slug, title, content, excerpt, page_type, category, status, is_featured,
          published_at, scheduled_at, seo_title, seo_description, keywords, created_by, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
       RETURNING *`,
      [
        cleanSlug,
        data.title,
        data.content,
        data.excerpt || null,
        data.pageType || 'page',
        data.category || 'General',
        data.status || 'draft',
        data.isFeatured || false,
        publishedAt,
        data.scheduledAt || null,
        data.seoTitle || data.title,
        data.seoDescription || (data.excerpt || data.title).substring(0, 150),
        data.keywords || [],
        userId,
      ]
    );

    const page = result.rows[0];

    // Record initial revision
    await pool.query(
      `INSERT INTO content_page_revisions (page_id, version, title, content, excerpt, changed_by, change_summary)
       VALUES ($1, 1, $2, $3, $4, $5, 'Initial page creation')`,
      [page.id, page.title, page.content, page.excerpt, userId]
    );

    await writeAuditLog({
      userId,
      action: 'content_page.create',
      resourceType: 'content_page',
      resourceId: page.id,
      newData: { slug: page.slug, title: page.title, status: page.status },
      ipAddress,
      requestId,
    });

    return page;
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
      category: 'category',
      status: 'status',
      isFeatured: 'is_featured',
      seoTitle: 'seo_title',
      seoDescription: 'seo_description',
      keywords: 'keywords',
      scheduledAt: 'scheduled_at',
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

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE content_pages SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    const updated = result.rows[0];

    // Record new revision
    const versionRes = await pool.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM content_page_revisions WHERE page_id = $1`,
      [id]
    );
    const nextVersion = versionRes.rows[0].next_version;

    await pool.query(
      `INSERT INTO content_page_revisions (page_id, version, title, content, excerpt, changed_by, change_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, nextVersion, updated.title, updated.content, updated.excerpt, userId, data.changeSummary || 'Content page update']
    );

    await writeAuditLog({
      userId,
      action: 'content_page.update',
      resourceType: 'content_page',
      resourceId: id,
      oldData: { slug: existing.slug, title: existing.title, status: existing.status },
      newData: data,
      ipAddress,
      requestId,
    });

    return updated;
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
    return { message: 'Page deleted successfully' };
  },

  async getRevisions(pageId: string) {
    const result = await pool.query(
      `SELECT r.*, u.name AS author_name, u.email AS author_email
       FROM content_page_revisions r
       LEFT JOIN users u ON u.id = r.changed_by
       WHERE r.page_id = $1
       ORDER BY r.version DESC`,
      [pageId]
    );
    return result.rows;
  },

  async restoreRevision(pageId: string, revisionId: string, userId: string) {
    const revRes = await pool.query(
      `SELECT * FROM content_page_revisions WHERE id = $1 AND page_id = $2`,
      [revisionId, pageId]
    );
    if (!revRes.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Revision not found');
    }
    const rev = revRes.rows[0];
    return this.update(pageId, {
      title: rev.title,
      content: rev.content,
      excerpt: rev.excerpt,
      changeSummary: `Restored version ${rev.version}`,
    }, userId);
  },
};

// ── Banners ─────────────────────────────────────────────────────
export const bannerService = {
  async listAll(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status === 'active') {
      conditions.push('is_active = true');
    } else if (status === 'inactive') {
      conditions.push('is_active = false');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM content_banners ${where}
       ORDER BY priority DESC, created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM content_banners ${where}`,
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

  async list() {
    const result = await pool.query(
      `SELECT * FROM content_banners
       WHERE is_active = true
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY priority DESC, created_at DESC`
    );
    return result.rows;
  },

  async getById(id: string) {
    const result = await pool.query('SELECT * FROM content_banners WHERE id = $1', [id]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Banner not found');
    return result.rows[0];
  },

  async create(
    data: {
      title: string;
      subtitle?: string;
      description?: string;
      content?: string;
      desktopImage?: string;
      mobileImage?: string;
      imageUrl?: string;
      linkUrl?: string;
      ctaText?: string;
      ctaUrl?: string;
      position?: string;
      priority?: number;
      targetAudience?: string;
      isActive?: boolean;
      startDate?: string | null;
      endDate?: string | null;
    },
    userId: string,
    ipAddress?: string,
    requestId?: string
  ) {
    const result = await pool.query(
      `INSERT INTO content_banners
         (title, subtitle, description, content, desktop_image, mobile_image, image_url, link_url,
          cta_text, cta_url, position, priority, target_audience, is_active, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        data.title,
        data.subtitle || null,
        data.description || null,
        data.content || null,
        data.desktopImage || data.imageUrl || null,
        data.mobileImage || null,
        data.imageUrl || data.desktopImage || null,
        data.linkUrl || data.ctaUrl || null,
        data.ctaText || 'Learn More',
        data.ctaUrl || data.linkUrl || '/',
        data.position || 'top',
        data.priority ?? 0,
        data.targetAudience || 'all',
        data.isActive !== undefined ? data.isActive : true,
        data.startDate || null,
        data.endDate || null,
        userId,
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
    const existing = await this.getById(id);

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      title: 'title',
      subtitle: 'subtitle',
      description: 'description',
      content: 'content',
      desktopImage: 'desktop_image',
      mobileImage: 'mobile_image',
      imageUrl: 'image_url',
      linkUrl: 'link_url',
      ctaText: 'cta_text',
      ctaUrl: 'cta_url',
      position: 'position',
      priority: 'priority',
      targetAudience: 'target_audience',
      isActive: 'is_active',
      startDate: 'start_date',
      endDate: 'end_date',
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
      `UPDATE content_banners SET ${updates.join(', ')}, updated_at = NOW()
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
    await this.getById(id);
    await pool.query('DELETE FROM content_banners WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'banner.delete',
      resourceType: 'banner',
      resourceId: id,
    });
    return { message: 'Banner deleted' };
  },
};

// ── FAQs ────────────────────────────────────────────────────────
export const faqService = {
  async listAll(category?: string, search?: string) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(question) LIKE $${params.length} OR LOWER(answer) LIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM content_faqs ${where} ORDER BY category, display_order ASC, created_at ASC`,
      params
    );
    return result.rows;
  },

  async list() {
    const result = await pool.query(
      `SELECT id, question, answer, category, display_order
       FROM content_faqs
       WHERE is_active = true AND status = 'published'
       ORDER BY category, display_order ASC`
    );
    return result.rows;
  },

  async getById(id: string) {
    const result = await pool.query('SELECT * FROM content_faqs WHERE id = $1', [id]);
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'FAQ not found');
    return result.rows[0];
  },

  async create(
    data: { question: string; answer: string; category?: string; displayOrder?: number; status?: string; visibility?: string; isActive?: boolean },
    userId: string
  ) {
    const result = await pool.query(
      `INSERT INTO content_faqs (question, answer, category, display_order, sort_order, status, visibility, is_active, created_by)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.question,
        data.answer,
        data.category || 'General',
        data.displayOrder ?? 0,
        data.status || 'published',
        data.visibility || 'public',
        data.isActive !== undefined ? data.isActive : true,
        userId,
      ]
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
    await this.getById(id);
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      question: 'question',
      answer: 'answer',
      category: 'category',
      displayOrder: 'display_order',
      sortOrder: 'sort_order',
      status: 'status',
      visibility: 'visibility',
      isActive: 'is_active',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE content_faqs SET ${updates.join(', ')}, updated_at = NOW()
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
    await this.getById(id);
    await pool.query('DELETE FROM content_faqs WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'faq.delete',
      resourceType: 'faq',
      resourceId: id,
    });
    return { message: 'FAQ deleted' };
  },
};

// ── Legacy Help Articles Service (Kept for compatibility) ────────
export const helpArticleService = {
  async list(category?: string) {
    const conditions = ['is_published = true'];
    const params: any[] = [];
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    const result = await pool.query(
      `SELECT * FROM help_articles WHERE ${conditions.join(' AND ')} ORDER BY view_count DESC`,
      params
    );
    return result.rows;
  },

  async getBySlug(slug: string) {
    const result = await pool.query(
      'SELECT * FROM help_articles WHERE slug = $1 AND is_published = true',
      [slug]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Article not found');
    await pool.query('UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]);
    return result.rows[0];
  },

  async listAll() {
    const result = await pool.query('SELECT * FROM help_articles ORDER BY created_at DESC');
    return result.rows;
  },

  async create(data: { slug: string; title: string; content: string; category?: string }, userId: string) {
    const result = await pool.query(
      `INSERT INTO help_articles (slug, title, content, category, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.slug, data.title, data.content, data.category || null, userId]
    );
    return result.rows[0];
  },

  async update(id: string, data: Record<string, any>, userId: string) {
    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = { slug: 'slug', title: 'title', content: 'content', category: 'category', isPublished: 'is_published' };
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }
    values.push(id);
    const result = await pool.query(`UPDATE help_articles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values);
    return result.rows[0];
  },

  async delete(id: string, userId: string) {
    await pool.query('DELETE FROM help_articles WHERE id = $1', [id]);
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
      `SELECT * FROM media_assets ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const count = await pool.query(`SELECT COUNT(*) FROM media_assets ${where}`, params);
    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async create(tenantId: string | null, data: any, userId: string) {
    const result = await pool.query(
      `INSERT INTO media_assets (tenant_id, name, file_url, file_type, mime_type, file_size_bytes, alt_text, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, data.name, data.fileUrl, data.fileType, data.mimeType || null, data.fileSizeBytes || null, data.altText || null, userId]
    );
    return result.rows[0];
  },

  async delete(id: string, tenantId: string | null, userId: string) {
    const result = await pool.query('DELETE FROM media_assets WHERE id = $1 RETURNING *', [id]);
    return { message: 'Media asset deleted' };
  },
};
