import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin, isAuthenticated, isSuperAdmin } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

// GET /api/v1/analytics/overview
analyticsRouter.get('/overview', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId =
      req.user!.role === 'super_admin'
        ? (req.query.tenantId as string)
        : req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant ID required');
    const data = await analyticsService.getOverview(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/heatmap?days=90
analyticsRouter.get('/heatmap', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const days = parseInt(req.query.days as string) || 90;
    const data = await analyticsService.getSubmissionHeatmap(tenantId, days);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/leaderboard
analyticsRouter.get('/leaderboard', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await analyticsService.getLeaderboard(tenantId, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/report — full institution report
analyticsRouter.get('/report', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const data = await analyticsService.getInstitutionReport(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/students/:studentId/progress
analyticsRouter.get(
  '/students/:studentId/progress',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const data = await analyticsService.getStudentProgress(
        tenantId,
        req.params.studentId
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

analyticsRouter.get('/courses/:courseId/completion', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({ success: true, data: await analyticsService.getCourseCompletion(tenantId, req.params.courseId) });
  } catch (err) { next(err); }
});

analyticsRouter.get('/problems/:problemId/stats', isInstitutionAdmin, async (req, res, next) => {
  try { res.json({ success: true, data: await analyticsService.getProblemStatistics(req.params.problemId, req.user!.tenantId || undefined) }); }
  catch (err) { next(err); }
});

analyticsRouter.get('/languages', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const days = parseInt(req.query.days as string) || 30;
    res.json({ success: true, data: await analyticsService.getLanguageActivity(tenantId, days) });
  } catch (err) { next(err); }
});

analyticsRouter.get('/difficulty-distribution', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({ success: true, data: await analyticsService.getDifficultyDistribution(tenantId) });
  } catch (err) { next(err); }
});

analyticsRouter.get('/platform/overview', isSuperAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await analyticsService.getPlatformOverview() }); }
  catch (err) { next(err); }
});
