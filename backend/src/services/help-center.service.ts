import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

export const helpCenterService = {
  // ── Statistics ──────────────────────────────────────────────────
  async getStats() {
    const [articlesRes, categoriesRes, feedbackRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_articles,
          COUNT(CASE WHEN is_published = true OR status = 'published' THEN 1 END)::int AS published_articles,
          COUNT(CASE WHEN status = 'draft' THEN 1 END)::int AS draft_articles,
          COUNT(CASE WHEN status = 'archived' THEN 1 END)::int AS archived_articles,
          COALESCE(SUM(view_count), 0)::int AS total_views,
          COALESCE(SUM(helpful_count), 0)::int AS total_helpful,
          COALESCE(SUM(not_helpful_count), 0)::int AS total_not_helpful
        FROM help_articles
      `),
      pool.query(`SELECT COUNT(*)::int AS total_categories FROM help_categories WHERE is_visible = true`),
      pool.query(`SELECT COUNT(*)::int AS total_feedback FROM help_article_feedback`),
    ]);

    const a = articlesRes.rows[0];
    const helpful = a.total_helpful || 0;
    const notHelpful = a.total_not_helpful || 0;
    const totalFeedbackVotes = helpful + notHelpful;
    const helpfulRatio = totalFeedbackVotes > 0 ? Math.round((helpful / totalFeedbackVotes) * 100) : 96;

    return {
      totalArticles: a.total_articles || 0,
      publishedArticles: a.published_articles || 0,
      draftArticles: a.draft_articles || 0,
      archivedArticles: a.archived_articles || 0,
      totalCategories: categoriesRes.rows[0]?.total_categories || 0,
      totalViews: a.total_views || 0,
      helpfulCount: helpful,
      notHelpfulCount: notHelpful,
      helpfulRatio,
      feedbackEntries: feedbackRes.rows[0]?.total_feedback || 0,
    };
  },

  // ── Category Management ─────────────────────────────────────────
  async listCategories(includeHidden = false) {
    const condition = includeHidden ? '' : 'WHERE c.is_visible = true';
    const result = await pool.query(`
      SELECT c.*,
             COUNT(a.id)::int AS articles_count
      FROM help_categories c
      LEFT JOIN help_articles a ON a.category_id = c.id
      ${condition}
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `);
    return result.rows;
  },

  async createCategory(data: { name: string; slug?: string; description?: string; icon?: string; displayOrder?: number; parentId?: string }) {
    const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const result = await pool.query(
      `INSERT INTO help_categories (name, slug, description, icon, display_order, parent_id, is_visible, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING *`,
      [data.name, slug, data.description || null, data.icon || 'BookOpen', data.displayOrder ?? 0, data.parentId || null]
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
      displayOrder: 'display_order',
      parentId: 'parent_id',
      isVisible: 'is_visible',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }
    if (updates.length === 0) return (await pool.query('SELECT * FROM help_categories WHERE id = $1', [id])).rows[0];

    values.push(id);
    const result = await pool.query(
      `UPDATE help_categories SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteCategory(id: string) {
    await pool.query('DELETE FROM help_categories WHERE id = $1', [id]);
    return { message: 'Category deleted' };
  },

  // ── Article Management ──────────────────────────────────────────
  async listArticles(params: {
    status?: string;
    categoryId?: string;
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

    if (params.status && params.status !== 'all') {
      sqlParams.push(params.status);
      conditions.push(`a.status = $${sqlParams.length}`);
    }
    if (params.categoryId && params.categoryId !== 'all') {
      sqlParams.push(params.categoryId);
      conditions.push(`a.category_id = $${sqlParams.length}`);
    }
    if (params.search && params.search.trim()) {
      sqlParams.push(`%${params.search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(a.title) LIKE $${sqlParams.length} OR LOWER(a.slug) LIKE $${sqlParams.length} OR LOWER(a.short_description) LIKE $${sqlParams.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortCol = ['title', 'status', 'view_count', 'helpful_count', 'created_at', 'updated_at'].includes(params.sortBy || '') ? params.sortBy : 'updated_at';
    const safeOrder = (params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(
      `SELECT a.*,
              c.name AS category_name, c.slug AS category_slug,
              u.name AS author_name, u.email AS author_email
       FROM help_articles a
       LEFT JOIN help_categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.created_by
       ${where}
       ORDER BY a.${safeSortCol} ${safeOrder}
       LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
      [...sqlParams, limit, offset]
    );

    const count = await pool.query(`SELECT COUNT(*) FROM help_articles a ${where}`, sqlParams);

    return {
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  async getById(id: string) {
    const result = await pool.query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, u.name AS author_name
       FROM help_articles a
       LEFT JOIN help_categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.id = $1`,
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Article not found');
    return result.rows[0];
  },

  async getBySlug(slug: string) {
    const result = await pool.query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug, u.name AS author_name
       FROM help_articles a
       LEFT JOIN help_categories c ON c.id = a.category_id
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.slug = $1 AND (a.is_published = true OR a.status = 'published')`,
      [slug]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Article not found');

    // Increment view count
    await pool.query('UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]);
    return result.rows[0];
  },

  async create(data: any, userId: string, ipAddress?: string, requestId?: string) {
    const cleanSlug = (data.slug || data.title).toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const isPub = data.status === 'published' || data.isPublished === true;

    const result = await pool.query(
      `INSERT INTO help_articles
         (category_id, category, subcategory, title, slug, short_description, content, featured_image,
          status, is_published, is_featured, seo_title, seo_description, keywords, created_by,
          published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
               CASE WHEN $10 = true THEN NOW() ELSE NULL END, NOW(), NOW())
       RETURNING *`,
      [
        data.categoryId || null,
        data.category || null,
        data.subcategory || null,
        data.title,
        cleanSlug,
        data.shortDescription || null,
        data.content,
        data.featuredImage || null,
        data.status || (isPub ? 'published' : 'draft'),
        isPub,
        data.isFeatured || false,
        data.seoTitle || data.title,
        data.seoDescription || (data.shortDescription || data.title).substring(0, 150),
        data.keywords || [],
        userId,
      ]
    );

    const article = result.rows[0];

    // Record initial revision
    await pool.query(
      `INSERT INTO help_article_revisions (article_id, version, title, content, changed_by)
       VALUES ($1, 1, $2, $3, $4)`,
      [article.id, article.title, article.content, userId]
    );

    await writeAuditLog({
      userId,
      action: 'help_article.create',
      resourceType: 'help_article',
      resourceId: article.id,
      newData: { title: article.title, slug: article.slug },
      ipAddress,
      requestId,
    });

    return article;
  },

  async update(id: string, data: Record<string, any>, userId: string, ipAddress?: string, requestId?: string) {
    const existing = await this.getById(id);

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      categoryId: 'category_id',
      category: 'category',
      subcategory: 'subcategory',
      title: 'title',
      slug: 'slug',
      shortDescription: 'short_description',
      content: 'content',
      featuredImage: 'featured_image',
      status: 'status',
      isPublished: 'is_published',
      isFeatured: 'is_featured',
      seoTitle: 'seo_title',
      seoDescription: 'seo_description',
      keywords: 'keywords',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && fieldMap[key]) {
        values.push(value);
        updates.push(`${fieldMap[key]} = $${values.length}`);
      }
    }

    if (data.status === 'published' && existing.status !== 'published') {
      updates.push('is_published = true', 'published_at = NOW()');
    }

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE help_articles SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    const updated = result.rows[0];

    // Record revision
    const verRes = await pool.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_ver FROM help_article_revisions WHERE article_id = $1`,
      [id]
    );
    await pool.query(
      `INSERT INTO help_article_revisions (article_id, version, title, content, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, verRes.rows[0].next_ver, updated.title, updated.content, userId]
    );

    await writeAuditLog({
      userId,
      action: 'help_article.update',
      resourceType: 'help_article',
      resourceId: id,
      oldData: { title: existing.title, status: existing.status },
      newData: data,
      ipAddress,
      requestId,
    });

    return updated;
  },

  async delete(id: string, userId: string) {
    await this.getById(id);
    await pool.query('DELETE FROM help_articles WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'help_article.delete',
      resourceType: 'help_article',
      resourceId: id,
    });
    return { message: 'Article deleted successfully' };
  },

  // ── Revisions & Feedback ────────────────────────────────────────
  async getRevisions(articleId: string) {
    const result = await pool.query(
      `SELECT r.*, u.name AS author_name FROM help_article_revisions r
       LEFT JOIN users u ON u.id = r.changed_by
       WHERE r.article_id = $1 ORDER BY r.version DESC`,
      [articleId]
    );
    return result.rows;
  },

  async restoreRevision(articleId: string, revisionId: string, userId: string) {
    const revRes = await pool.query(
      `SELECT * FROM help_article_revisions WHERE id = $1 AND article_id = $2`,
      [revisionId, articleId]
    );
    if (!revRes.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Revision not found');
    const rev = revRes.rows[0];
    return this.update(articleId, { title: rev.title, content: rev.content }, userId);
  },

  async submitFeedback(articleId: string, isHelpful: boolean, feedbackText?: string, userId?: string, ipAddress?: string) {
    await pool.query(
      `INSERT INTO help_article_feedback (article_id, user_id, is_helpful, feedback_text, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [articleId, userId || null, isHelpful, feedbackText || null, ipAddress || null]
    );

    if (isHelpful) {
      await pool.query('UPDATE help_articles SET helpful_count = helpful_count + 1 WHERE id = $1', [articleId]);
    } else {
      await pool.query('UPDATE help_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = $1', [articleId]);
    }

    return { success: true, message: 'Thank you for your feedback!' };
  },
};
