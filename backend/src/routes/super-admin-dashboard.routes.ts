import { Router } from 'express';
import { superAdminDashboardService } from '../services/super-admin-dashboard.service';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

export const superAdminDashboardRouter = Router();
superAdminDashboardRouter.use(requireAuth, isSuperAdmin);

// GET /api/v1/super-admin/dashboard/stats
superAdminDashboardRouter.get('/dashboard/stats', async (req, res, next) => {
  try {
    const stats = await superAdminDashboardService.getStats({
      range: req.query.range as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/super-admin/dashboard/platform-growth
superAdminDashboardRouter.get('/dashboard/platform-growth', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const series = await superAdminDashboardService.getPlatformGrowth(months);
    res.json({ success: true, data: { series } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/super-admin/dashboard/user-distribution
superAdminDashboardRouter.get('/dashboard/user-distribution', async (_req, res, next) => {
  try {
    const data = await superAdminDashboardService.getUserDistribution();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/super-admin/dashboard/top-institutions
superAdminDashboardRouter.get('/dashboard/top-institutions', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const sortBy = (req.query.sortBy as string) || 'students';
    const data = await superAdminDashboardService.getTopInstitutions(limit, sortBy);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/super-admin/dashboard/recent-activities
superAdminDashboardRouter.get('/dashboard/recent-activities', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await superAdminDashboardService.getRecentActivities(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/super-admin/dashboard/health
superAdminDashboardRouter.get('/dashboard/health', async (_req, res, next) => {
  try {
    const data = await superAdminDashboardService.getPlatformHealth();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/super-admin/search
superAdminDashboardRouter.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: { query: '', results: [] } });
    }
    const limit = parseInt(req.query.limit as string) || 15;
    const data = await superAdminDashboardService.globalSearch(q, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
