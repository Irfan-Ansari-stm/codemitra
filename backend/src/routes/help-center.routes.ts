import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { helpCenterService } from '../services/help-center.service';

export const helpCenterRouter = Router();

// =============================================================================
// SUPER ADMIN PROTECTED ROUTES
// =============================================================================

// Statistics
helpCenterRouter.get('/stats', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const stats = await helpCenterService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// Categories
helpCenterRouter.get('/categories', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const categories = await helpCenterService.listCategories(true);
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

helpCenterRouter.post('/categories', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const category = await helpCenterService.createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
});

helpCenterRouter.put('/categories/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const category = await helpCenterService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

helpCenterRouter.delete('/categories/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await helpCenterService.deleteCategory(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Articles
helpCenterRouter.get('/articles', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { status, categoryId, search, page, limit, sortBy, sortOrder } = req.query as any;
    const result = await helpCenterService.listArticles({
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

helpCenterRouter.get('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await helpCenterService.getById(req.params.id);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

helpCenterRouter.post('/articles', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await helpCenterService.create(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: article });
  } catch (err) { next(err); }
});

helpCenterRouter.patch('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await helpCenterService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

helpCenterRouter.put('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const article = await helpCenterService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

helpCenterRouter.delete('/articles/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await helpCenterService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

helpCenterRouter.get('/articles/:id/revisions', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const revisions = await helpCenterService.getRevisions(req.params.id);
    res.json({ success: true, data: revisions });
  } catch (err) { next(err); }
});

helpCenterRouter.post('/articles/:id/revisions/:revId/restore', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await helpCenterService.restoreRevision(req.params.id, req.params.revId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// PUBLIC HELP CENTER ROUTES
// =============================================================================
export const publicHelpCenterRouter = Router();

publicHelpCenterRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await helpCenterService.listCategories(false);
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

publicHelpCenterRouter.get('/articles', async (req, res, next) => {
  try {
    const { categoryId, search, page, limit } = req.query as any;
    const result = await helpCenterService.listArticles({
      status: 'published',
      categoryId,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

publicHelpCenterRouter.get('/articles/:slug', async (req, res, next) => {
  try {
    const article = await helpCenterService.getBySlug(req.params.slug);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

publicHelpCenterRouter.post('/articles/:id/feedback', async (req, res, next) => {
  try {
    const { isHelpful, feedbackText } = req.body;
    const userId = (req as any).user?.id || null;
    const result = await helpCenterService.submitFeedback(req.params.id, Boolean(isHelpful), feedbackText, userId, req.ip);
    res.json(result);
  } catch (err) { next(err); }
});
