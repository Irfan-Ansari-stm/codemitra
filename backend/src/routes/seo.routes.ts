import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { comprehensiveSeoService } from '../services/seo.service';

export const seoRouter = Router();

// =============================================================================
// SUPER ADMIN PROTECTED ROUTES
// =============================================================================

// Global SEO settings
seoRouter.get('/settings', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const settings = await comprehensiveSeoService.getGlobalSettings();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

seoRouter.put('/settings', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const settings = await comprehensiveSeoService.updateGlobalSettings(
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// Entity / Page specific metadata
seoRouter.get('/metadata/:entityType/:entityId', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const metadata = await comprehensiveSeoService.getEntityMetadata(req.params.entityType, req.params.entityId);
    res.json({ success: true, data: metadata });
  } catch (err) { next(err); }
});

seoRouter.put('/metadata/:entityType/:entityId', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const metadata = await comprehensiveSeoService.setEntityMetadata(
      req.params.entityType,
      req.params.entityId,
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: metadata });
  } catch (err) { next(err); }
});

// Redirects
seoRouter.get('/redirects', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit, search } = req.query as any;
    const result = await comprehensiveSeoService.getRedirects(
      parseInt(page) || 1,
      parseInt(limit) || 20,
      search
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

seoRouter.post('/redirects', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const redirect = await comprehensiveSeoService.createRedirect(
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.status(201).json({ success: true, data: redirect });
  } catch (err) { next(err); }
});

seoRouter.delete('/redirects/:id', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await comprehensiveSeoService.deleteRedirect(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Sitemap generation & inspection
seoRouter.get('/sitemap', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const baseUrl = req.query.baseUrl ? String(req.query.baseUrl) : 'https://codeverse.dev';
    const sitemap = await comprehensiveSeoService.generateSitemap(baseUrl);
    res.json({ success: true, data: sitemap });
  } catch (err) { next(err); }
});

seoRouter.post('/sitemap/generate', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const baseUrl = req.body?.baseUrl || 'https://codeverse.dev';
    const sitemap = await comprehensiveSeoService.generateSitemap(baseUrl);
    res.json({ success: true, data: sitemap });
  } catch (err) { next(err); }
});

// SEO Audit
seoRouter.get('/audit', requireAuth, isSuperAdmin, async (_req, res, next) => {
  try {
    const audit = await comprehensiveSeoService.runAudit();
    res.json({ success: true, data: audit });
  } catch (err) { next(err); }
});

// =============================================================================
// PUBLIC XML SITEMAP & ROBOTS.TXT
// =============================================================================
export const publicSeoRouter = Router();

publicSeoRouter.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const result = await comprehensiveSeoService.generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(result.xml);
  } catch (err) { next(err); }
});

publicSeoRouter.get('/robots.txt', async (_req, res, next) => {
  try {
    const settings = await comprehensiveSeoService.getGlobalSettings();
    res.header('Content-Type', 'text/plain');
    res.send(settings.robotsTxt || 'User-agent: *\nAllow: /');
  } catch (err) { next(err); }
});
