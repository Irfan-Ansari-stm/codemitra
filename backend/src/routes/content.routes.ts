import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { contentPageService, bannerService, faqService } from '../services/content.service';

export const contentRouter = Router();

// =============================================================================
// SUPER ADMIN PROTECTED ROUTES
// =============================================================================

// Overview statistics
contentRouter.get('/stats', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const stats = await contentPageService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// Pages CRUD
contentRouter.get('/pages', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { status, pageType, search, page, limit, sortBy, sortOrder } = req.query as any;
    const result = await contentPageService.list(
      status,
      pageType,
      search,
      parseInt(page) || 1,
      parseInt(limit) || 20,
      sortBy,
      sortOrder
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

contentRouter.get('/pages/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const page = await contentPageService.getById(req.params.id);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

contentRouter.post('/pages', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const page = await contentPageService.create(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: page });
  } catch (err) { next(err); }
});

contentRouter.patch('/pages/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const page = await contentPageService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

contentRouter.put('/pages/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const page = await contentPageService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

contentRouter.delete('/pages/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await contentPageService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

contentRouter.get('/pages/:id/revisions', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const revisions = await contentPageService.getRevisions(req.params.id);
    res.json({ success: true, data: revisions });
  } catch (err) { next(err); }
});

contentRouter.post('/pages/:id/revisions/:revId/restore', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await contentPageService.restoreRevision(req.params.id, req.params.revId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Banners CRUD
contentRouter.get('/banners', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit, status } = req.query as any;
    const result = await bannerService.listAll(parseInt(page) || 1, parseInt(limit) || 20, status);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

contentRouter.post('/banners', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const banner = await bannerService.create(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: banner });
  } catch (err) { next(err); }
});

contentRouter.get('/banners/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const banner = await bannerService.getById(req.params.id);
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
});

contentRouter.patch('/banners/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const banner = await bannerService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
});

contentRouter.put('/banners/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const banner = await bannerService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
});

contentRouter.delete('/banners/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await bannerService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// FAQs CRUD
contentRouter.get('/faqs', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { category, search } = req.query as any;
    const faqs = await faqService.listAll(category, search);
    res.json({ success: true, data: faqs, total: faqs.length });
  } catch (err) { next(err); }
});

contentRouter.post('/faqs', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const faq = await faqService.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: faq });
  } catch (err) { next(err); }
});

contentRouter.patch('/faqs/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const faq = await faqService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: faq });
  } catch (err) { next(err); }
});

contentRouter.put('/faqs/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const faq = await faqService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: faq });
  } catch (err) { next(err); }
});

contentRouter.delete('/faqs/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await faqService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// PUBLIC CONTENT ROUTES
// =============================================================================
export const publicContentRouter = Router();

publicContentRouter.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await contentPageService.getBySlug(req.params.slug);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

publicContentRouter.get('/banners', async (_req, res, next) => {
  try {
    const banners = await bannerService.list();
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
});

publicContentRouter.get('/faqs', async (_req, res, next) => {
  try {
    const faqs = await faqService.list();
    res.json({ success: true, data: faqs });
  } catch (err) { next(err); }
});
