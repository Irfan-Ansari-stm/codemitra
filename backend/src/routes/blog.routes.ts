import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createBlogPostSchema, blogQuerySchema, paginationSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { toSlug, toUniqueSlug } from '../utils/slug';
import * as blogService from '../services/blog.service';
import type { BlogSort } from '../services/blog.service';

export const blogRouter = Router();

interface ParsedBlogQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  sort?: BlogSort;
  featured?: boolean;
}

function isAdminRole(req: any): boolean {
  return !!req.user && ['super_admin', 'institution_admin'].includes(req.user.role);
}

// ── Public reads ───────────────────────────────────────────────

// GET /api/v1/blog — list published posts with search, filters, sorting
blogRouter.get('/', optionalAuth, validate(blogQuerySchema, 'query'), async (req, res, next) => {
  try {
    const query = req.query as unknown as ParsedBlogQuery;
    const result = await blogService.listPosts(
      {
        page: query.page,
        limit: query.limit,
        search: query.search,
        category: query.category,
        tag: query.tag,
        sort: query.sort,
        featured: query.featured,
      },
      isAdminRole(req),
      req.user?.id
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/categories — categories with published post counts
blogRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await blogService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/tags — all tags with published post counts
blogRouter.get('/tags', async (_req, res, next) => {
  try {
    const tags = await blogService.getTags();
    res.json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/featured — the latest published featured article
blogRouter.get('/featured', optionalAuth, async (req, res, next) => {
  try {
    const post = await blogService.getFeaturedPost(isAdminRole(req));
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/related/:slug — published articles sharing category or tags
blogRouter.get('/related/:slug', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(10, Number(req.query.limit) || 3);
    const posts = await blogService.getRelatedPosts(req.params.slug, limit);
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/posts/:slug — single published article by slug
blogRouter.get('/posts/:slug', optionalAuth, async (req, res, next) => {
  try {
    const post = await blogService.getPostBySlug(req.params.slug, isAdminRole(req), req.user?.id);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');
    // Count real public views; admin previews do not inflate the counter.
    if (post.status === 'published') {
      await blogService.incrementViewCount(post.slug);
      post.view_count += 1;
    }
    const adjacent = await blogService.getAdjacentPosts(post.slug);
    res.json({ success: true, data: post, adjacent });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/slug/:slug — backward-compatible alias
blogRouter.get('/slug/:slug', optionalAuth, async (req, res, next) => {
  try {
    const post = await blogService.getPostBySlug(req.params.slug, isAdminRole(req), req.user?.id);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');
    if (post.status === 'published') {
      await blogService.incrementViewCount(post.slug);
      post.view_count += 1;
    }
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// ── Authenticated bookmarks ────────────────────────────────────
// Registered before /:id so /bookmarks is not captured by the
// parameterized single-post route.

// GET /api/v1/blog/bookmarks — the signed-in user's saved articles
blogRouter.get('/bookmarks', requireAuth, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const query = req.query as unknown as { page?: number; limit?: number };
    const result = await blogService.getBookmarkedPosts(
      req.user!.id,
      query.page,
      query.limit
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/:id/bookmark — check whether the article is saved
blogRouter.get('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    const bookmarked = await blogService.isPostBookmarked(req.user!.id, req.params.id);
    res.json({ success: true, data: { bookmarked } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/blog/:id/bookmark — save the article
blogRouter.put('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    await blogService.addBookmark(req.user!.id, req.params.id);
    res.json({ success: true, data: { bookmarked: true } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/blog/:id/bookmark — remove the saved article
blogRouter.delete('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    await blogService.removeBookmark(req.user!.id, req.params.id);
    res.json({ success: true, data: { bookmarked: false } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/blog/:id — single article by id
blogRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await blogService.getPostById(req.params.id, isAdminRole(req), req.user?.id);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// ── Admin writes ───────────────────────────────────────────────

function mapCreateBody(body: any, authorId: string) {
  return {
    authorId,
    categoryId: body.categoryId || null,
    title: body.title,
    slug: body.slug ? toSlug(body.slug) : toUniqueSlug(body.title),
    excerpt: body.excerpt || null,
    content: body.content,
    coverImageUrl: body.coverImageUrl || null,
    tags: body.tags || [],
    isFeatured: body.isFeatured ?? false,
    seoTitle: body.seoTitle || null,
    seoDescription: body.seoDescription || null,
    status: body.status || 'draft',
    readTimeMinutes: body.readTimeMinutes ?? null,
  };
}

// POST /api/v1/blog — create a post (super_admin)
blogRouter.post('/', requireAuth, isSuperAdmin, validate(createBlogPostSchema), async (req, res, next) => {
  try {
    const post = await blogService.createPost(mapCreateBody(req.body, req.user!.id));
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/blog/posts — backward-compatible create (super_admin)
blogRouter.post('/posts', requireAuth, isSuperAdmin, validate(createBlogPostSchema), async (req, res, next) => {
  try {
    const post = await blogService.createPost(mapCreateBody(req.body, req.user!.id));
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/blog/:id — update a post (super_admin)
blogRouter.patch('/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const mapped: Record<string, unknown> = { ...req.body };
    if ('isFeatured' in mapped) mapped.is_featured = mapped.isFeatured;
    if ('readTimeMinutes' in mapped) mapped.read_time_minutes = mapped.readTimeMinutes;
    if ('coverImageUrl' in mapped) mapped.cover_image_url = mapped.coverImageUrl;
    if ('seoTitle' in mapped) mapped.seo_title = mapped.seoTitle;
    if ('seoDescription' in mapped) mapped.seo_description = mapped.seoDescription;
    if ('categoryId' in mapped) mapped.category_id = mapped.categoryId;

    const post = await blogService.updatePost(req.params.id, mapped);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/blog/:id — archive a post (super_admin)
blogRouter.delete('/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const archived = await blogService.archivePost(req.params.id);
    if (!archived) throw new AppError(404, 'NOT_FOUND', 'Blog post not found');
    res.json({ success: true, data: { message: 'Blog post archived' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/blog/posts/:id/publish — publish a draft (super_admin)
blogRouter.patch('/posts/:id/publish', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const post = await blogService.updatePost(req.params.id, { status: 'published' });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
});
