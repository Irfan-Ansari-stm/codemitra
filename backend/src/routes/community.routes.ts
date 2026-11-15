import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { communityService } from '../services/community.service';

export const communityRouter = Router();

// =============================================================================
// SUPER ADMIN PROTECTED ROUTES
// =============================================================================

// Statistics
communityRouter.get('/analytics', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const stats = await communityService.getCommunityStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// Categories
communityRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await communityService.listCategories();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

communityRouter.post('/categories', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const cat = await communityService.createCategory(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) { next(err); }
});

communityRouter.put('/categories/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const cat = await communityService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: cat });
  } catch (err) { next(err); }
});

// Threads (Admin listing & management)
communityRouter.get('/threads', async (req, res, next) => {
  try {
    const { categoryId, tag, status, moderationStatus, search, page, limit, sortBy, sortOrder } = req.query as any;
    const result = await communityService.listThreads({
      categoryId,
      tag,
      status,
      moderationStatus,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

communityRouter.get('/threads/:id', async (req, res, next) => {
  try {
    const thread = await communityService.getThreadById(req.params.id);
    res.json({ success: true, data: thread });
  } catch (err) { next(err); }
});

communityRouter.post('/threads', requireAuth, async (req, res, next) => {
  try {
    const thread = await communityService.createThread(req.body, req.user!.id);
    res.status(201).json({ success: true, data: thread });
  } catch (err) { next(err); }
});

communityRouter.patch('/threads/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const thread = await communityService.updateThread(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: thread });
  } catch (err) { next(err); }
});

communityRouter.delete('/threads/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await communityService.deleteThread(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Replies
communityRouter.post('/threads/:id/replies', requireAuth, async (req, res, next) => {
  try {
    const reply = await communityService.createReply(req.params.id, req.body.content, req.user!.id, req.body.parentReplyId);
    res.status(201).json({ success: true, data: reply });
  } catch (err) { next(err); }
});

communityRouter.patch('/replies/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const reply = await communityService.updateReply(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: reply });
  } catch (err) { next(err); }
});

communityRouter.delete('/replies/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await communityService.deleteReply(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Moderation Queue & Reports
communityRouter.get('/reports', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { status, reportType, page, limit } = req.query as any;
    const result = await communityService.listReports({
      status,
      reportType,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

communityRouter.post('/reports/:id/resolve', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { action, resolutionNote } = req.body;
    const report = await communityService.resolveReport(req.params.id, action, resolutionNote || '', req.user!.id);
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
});
