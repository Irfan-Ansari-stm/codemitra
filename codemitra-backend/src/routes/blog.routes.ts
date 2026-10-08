import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createBlogPostSchema, paginationSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../db';
import { toUniqueSlug } from '../utils/slug';

export const blogRouter = Router();

// GET /api/v1/blog/categories
blogRouter.get('/categories', async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blog_categories ORDER BY name'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/posts
blogRouter.get(
  '/posts',
  optionalAuth,
  validate(paginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query as any;
      const offset = (page - 1) * limit;

      const isAdmin =
        req.user && ['super_admin', 'institution_admin'].includes(req.user.role);
      const statusFilter = isAdmin ? '' : `AND status = 'published'`;

      const result = await pool.query(
        `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.cover_image_url,
                bp.tags, bp.status, bp.is_featured, bp.read_time_minutes,
                bp.view_count, bp.published_at, bp.created_at,
                u.name AS author_name,
                bc.name AS category_name
         FROM blog_posts bp
         JOIN users u ON u.id = bp.author_id
         LEFT JOIN blog_categories bc ON bc.id = bp.category_id
         WHERE 1=1 ${statusFilter}
         ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const count = await pool.query(
        `SELECT COUNT(*) FROM blog_posts WHERE 1=1 ${statusFilter}`
      );

      res.json({
        success: true,
        data: result.rows,
        total: parseInt(count.rows[0].count),
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/blog/posts/:slug
blogRouter.get('/posts/:slug', optionalAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT bp.*, u.name AS author_name, bc.name AS category_name
       FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id
       LEFT JOIN blog_categories bc ON bc.id = bp.category_id
       WHERE bp.slug = $1 LIMIT 1`,
      [req.params.slug]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');

    // Increment view count
    await pool.query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1',
      [req.params.slug]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/blog/posts — super_admin only
blogRouter.post(
  '/posts',
  requireAuth,
  isSuperAdmin,
  validate(createBlogPostSchema),
  async (req, res, next) => {
    try {
      const slug = toUniqueSlug(req.body.title);
      const result = await pool.query(
        `INSERT INTO blog_posts
           (author_id, category_id, title, slug, excerpt, content,
            cover_image_url, tags, is_featured, seo_title, seo_description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          req.user!.id,
          req.body.categoryId || null,
          req.body.title,
          slug,
          req.body.excerpt || null,
          req.body.content,
          req.body.coverImageUrl || null,
          `{${(req.body.tags || []).join(',')}}`,
          req.body.isFeatured ?? false,
          req.body.seoTitle || null,
          req.body.seoDescription || null,
        ]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/blog/posts/:id/publish — publish a draft post
blogRouter.patch(
  '/posts/:id/publish',
  requireAuth,
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `UPDATE blog_posts
         SET status = 'published', published_at = NOW(), updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);
