import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { writeAuditLog } from '../utils/audit';

export const blogAdminService = {
  // ── Statistics ──────────────────────────────────────────────────
  async getStats() {
    const [postsRes, catsRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_articles,
          COUNT(CASE WHEN status = 'published' THEN 1 END)::int AS published_articles,
          COUNT(CASE WHEN status = 'draft' THEN 1 END)::int AS draft_articles,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END)::int AS scheduled_articles,
          COUNT(CASE WHEN status = 'archived' THEN 1 END)::int AS archived_articles,
          COALESCE(SUM(view_count), 0)::int AS total_views
        FROM blog_posts
      `),
      pool.query(`SELECT COUNT(*)::int AS total_categories FROM blog_categories`),
    ]);

    const p = postsRes.rows[0];

    return {
      totalArticles: p.total_articles || 0,
      publishedArticles: p.published_articles || 0,
      draftArticles: p.draft_articles || 0,
      scheduledArticles: p.scheduled_articles || 0,
      archivedArticles: p.archived_articles || 0,
      totalViews: p.total_views || 0,
      totalCategories: catsRes.rows[0]?.total_categories || 0,
    };
  },

  // ── Articles Management ─────────────────────────────────────────
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
      conditions.push(`p.status = $${sqlParams.length}`);
    }
    if (params.categoryId && params.categoryId !== 'all') {
      sqlParams.push(params.categoryId);
      conditions.push(`p.category_id = $${sqlParams.length}`);
    }
    if (params.search && params.search.trim()) {
      sqlParams.push(`%${params.search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(p.title) LIKE $${sqlParams.length} OR LOWER(p.slug) LIKE $${sqlParams.length} OR LOWER(p.excerpt) LIKE $${sqlParams.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortCol = ['title', 'status', 'view_count', 'read_time_minutes', 'created_at', 'updated_at', 'published_at'].includes(params.sortBy || '') ? params.sortBy : 'updated_at';
    const safeOrder = (params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(
      `SELECT p.*,
              c.name AS category_name, c.slug AS category_slug,
              u.name AS author_name, u.email AS author_email
       FROM blog_posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       LEFT JOIN users u ON u.id = p.author_id
       ${where}
       ORDER BY p.${safeSortCol} ${safeOrder}
       LIMIT $${sqlParams.length + 1} OFFSET $${sqlParams.length + 2}`,
      [...sqlParams, limit, offset]
    );

    const count = await pool.query(`SELECT COUNT(*) FROM blog_posts p ${where}`, sqlParams);

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
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, u.name AS author_name
       FROM blog_posts p
       LEFT JOIN blog_categories c ON c.id = p.category_id
       LEFT JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');
    return result.rows[0];
  },

  async createArticle(data: any, authorId: string, ipAddress?: string, requestId?: string) {
    const cleanSlug = (data.slug || data.title).toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const wordCount = (data.content || '').split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    const status = data.status || 'draft';

    const result = await pool.query(
      `INSERT INTO blog_posts
         (author_id, category_id, title, slug, excerpt, content, cover_image_url, tags,
          status, is_featured, read_time_minutes, published_at, scheduled_at,
          seo_title, seo_description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
               CASE WHEN $9 = 'published' THEN NOW() ELSE NULL END,
               $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        authorId,
        data.categoryId || null,
        data.title,
        cleanSlug,
        data.excerpt || null,
        data.content,
        data.coverImageUrl || null,
        data.tags || [],
        status,
        data.isFeatured || false,
        readTime,
        data.scheduledAt || null,
        data.seoTitle || data.title,
        data.seoDescription || (data.excerpt || data.title).substring(0, 150),
      ]
    );

    const post = result.rows[0];

    // Record initial revision
    await pool.query(
      `INSERT INTO blog_article_revisions (post_id, version, title, content, excerpt, changed_by)
       VALUES ($1, 1, $2, $3, $4, $5)`,
      [post.id, post.title, post.content, post.excerpt, authorId]
    );

    await writeAuditLog({
      userId: authorId,
      action: 'blog.create',
      resourceType: 'blog_post',
      resourceId: post.id,
      newData: { title: post.title, slug: post.slug, status: post.status },
      ipAddress,
      requestId,
    });

    return post;
  },

  async updateArticle(id: string, data: Record<string, any>, userId: string, ipAddress?: string, requestId?: string) {
    const existing = await this.getById(id);

    const updates: string[] = [];
    const values: any[] = [];
    const fieldMap: Record<string, string> = {
      categoryId: 'category_id',
      title: 'title',
      slug: 'slug',
      excerpt: 'excerpt',
      content: 'content',
      coverImageUrl: 'cover_image_url',
      tags: 'tags',
      status: 'status',
      isFeatured: 'is_featured',
      readTimeMinutes: 'read_time_minutes',
      scheduledAt: 'scheduled_at',
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
      updates.push('published_at = NOW()');
    }

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE blog_posts SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    const updated = result.rows[0];

    // Record revision
    const verRes = await pool.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_ver FROM blog_article_revisions WHERE post_id = $1`,
      [id]
    );
    await pool.query(
      `INSERT INTO blog_article_revisions (post_id, version, title, content, excerpt, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, verRes.rows[0].next_ver, updated.title, updated.content, updated.excerpt, userId]
    );

    await writeAuditLog({
      userId,
      action: 'blog.update',
      resourceType: 'blog_post',
      resourceId: id,
      oldData: { title: existing.title, status: existing.status },
      newData: data,
      ipAddress,
      requestId,
    });

    return updated;
  },

  async deleteArticle(id: string, userId: string) {
    await this.getById(id);
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    await writeAuditLog({
      userId,
      action: 'blog.delete',
      resourceType: 'blog_post',
      resourceId: id,
    });
    return { message: 'Blog article deleted successfully' };
  },

  // ── Categories & Tags ───────────────────────────────────────────
  async listCategories() {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id)::int AS articles_count
      FROM blog_categories c
      LEFT JOIN blog_posts p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return result.rows;
  },

  async createCategory(name: string, description?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const result = await pool.query(
      `INSERT INTO blog_categories (name, slug, description, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING *`,
      [name, slug, description || null]
    );
    return result.rows[0];
  },

  async updateCategory(id: string, name: string, description?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const result = await pool.query(
      `UPDATE blog_categories SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *`,
      [name, slug, description || null, id]
    );
    return result.rows[0];
  },

  async deleteCategory(id: string) {
    await pool.query('DELETE FROM blog_categories WHERE id = $1', [id]);
    return { message: 'Category deleted' };
  },
};
