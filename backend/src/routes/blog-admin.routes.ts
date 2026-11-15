import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { blogAdminService } from '../services/blog-admin.service';

export const blogAdminRouter = Router();

// Statistics
blogAdminRouter.get('/stats', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const stats = await blogAdminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// Categories
blogAdminRouter.get('/categories', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const categories = await blogAdminService.listCategories();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

blogAdminRouter.post('/categories', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const category = await blogAdminService.createCategory(req.body.name, req.body.description);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
});

blogAdminRouter.put('/categories/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const category = await blogAdminService.updateCategory(req.params.id, req.body.name, req.body.description);
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

blogAdminRouter.delete('/categories/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await blogAdminService.deleteCategory(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Articles
blogAdminRouter.get('/articles', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { status, categoryId, search, page, limit, sortBy, sortOrder } = req.query as any;
    const result = await blogAdminService.listArticles({
      status,
      categoryId,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

blogAdminRouter.get('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await blogAdminService.getById(req.params.id);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

blogAdminRouter.post('/articles', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await blogAdminService.createArticle(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: article });
  } catch (err) { next(err); }
});

blogAdminRouter.patch('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await blogAdminService.updateArticle(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

blogAdminRouter.put('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await blogAdminService.updateArticle(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

blogAdminRouter.delete('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await blogAdminService.deleteArticle(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});
