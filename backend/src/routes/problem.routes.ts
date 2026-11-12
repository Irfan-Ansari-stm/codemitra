import { Router } from 'express';
import type { z } from 'zod';
import { problemService } from '../services/problem.service';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isInstitutionAdmin, isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createProblemSchema, createTestCaseSchema, paginationSchema, problemQuerySchema, updateProblemSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { seedCodingQuestions } from '../db/seed-coding-questions';

export const problemRouter = Router();

// GET /api/v1/problems — public problems visible without auth; tenant problems need auth.
// Supports server-side search, difficulty/tag/status/bookmark filters, sorting, and pagination.
problemRouter.get('/', optionalAuth, validate(problemQuerySchema, 'query'), async (req, res, next) => {
  try {
    const query = req.query as unknown as z.infer<typeof problemQuerySchema>;
    const tags = query.tags
      ? query.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : undefined;
    const result = await problemService.list({
      tenantId: req.user?.tenantId || undefined,
      userId: req.user?.id || undefined,
      scope: query.scope,
      platformWide: req.user?.role === 'super_admin',
      difficulty: query.difficulty,
      tags,
      search: query.search,
      status: query.status,
      bookmarked: query.bookmarked,
      sort: query.sort,
      order: query.order,
      page: query.page,
      limit: query.limit,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/problems/bookmarks — authenticated user's bookmarked problems.
// Registered before /:id so "bookmarks" is not parsed as a problem UUID.
problemRouter.get('/bookmarks', requireAuth, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const query = req.query as unknown as z.infer<typeof paginationSchema>;
    const result = await problemService.getBookmarks(req.user!.id, query.page, query.limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Bookmark endpoints — require authentication; bookmarks are per-user and never shared.
problemRouter.get('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    res.json({ success: true, data: { bookmarked: await problemService.isBookmarked(req.user!.id, req.params.id) } });
  } catch (err) {
    next(err);
  }
});

problemRouter.put('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    res.json({ success: true, data: await problemService.addBookmark(req.user!.id, req.params.id) });
  } catch (err) {
    next(err);
  }
});

problemRouter.delete('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    res.json({ success: true, data: await problemService.removeBookmark(req.user!.id, req.params.id) });
  } catch (err) {
    next(err);
  }
});

// Keep named paths before /:id so Express does not treat their first segment as a UUID.
problemRouter.get('/:id/test-cases', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    if (req.user!.role !== 'super_admin' && !req.user!.tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    }
    await problemService.assertManageAccess(
      req.params.id,
      req.user!.role === 'super_admin' ? null : req.user!.tenantId
    );
    const testCases = await problemService.getTestCases(req.params.id, true);
    res.json({ success: true, data: testCases });
  } catch (err) { next(err); }
});

problemRouter.get('/:id/stats', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    if (req.user!.role !== 'super_admin' && !req.user!.tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    }
    await problemService.assertManageAccess(
      req.params.id,
      req.user!.role === 'super_admin' ? null : req.user!.tenantId
    );
    res.json({ success: true, data: await problemService.getStats(req.params.id) });
  }
  catch (err) { next(err); }
});

// GET /api/v1/problems/:id
problemRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const problem = await problemService.getById(
      req.params.id,
      req.user?.role === 'super_admin' ? undefined : req.user?.tenantId ?? null,
      req.user?.role === 'super_admin'
    );
    res.json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/problems
problemRouter.post(
  '/',
  requireAuth,
  isInstitutionAdmin,
  validate(createProblemSchema),
  async (req, res, next) => {
    try {
      const isSuperAdmin = req.user!.role === 'super_admin';
      const tenantId = isSuperAdmin
        ? req.body.scope === 'institution' ? req.body.tenantId : null
        : req.user!.tenantId;
      if (!isSuperAdmin && !tenantId) {
        throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      }
      if (req.body.scope === 'institution' && !tenantId) {
        throw new AppError(400, 'TENANT_REQUIRED', 'Institution problems must belong to an institution');
      }
      const problem = await problemService.create({
        ...req.body,
        scope: isSuperAdmin ? req.body.scope : 'institution',
        tenantId,
        createdBy: req.user!.id,
      });
      for (const testCase of req.body.testCases || []) {
        await problemService.addTestCase({ problemId: problem.id, ...testCase });
      }
      res.status(201).json({ success: true, data: problem });
    } catch (err) {
      next(err);
    }
  }
);

problemRouter.patch('/:id', requireAuth, isInstitutionAdmin, validate(updateProblemSchema), async (req, res, next) => {
  try {
    const tenantId = req.user!.role === 'super_admin' ? undefined : req.user!.tenantId || undefined;
    if (req.user!.role !== 'super_admin' && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    if (req.body.scope === 'institution' && req.user!.role === 'super_admin' && !req.body.tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Institution problems must belong to an institution');
    }
    const { tenantId: requestedTenantId, ...updates } = req.body;
    if (req.user!.role !== 'super_admin' && 'scope' in updates) {
      updates.scope = 'institution';
    }
    res.json({
      success: true,
      data: await problemService.update(
        req.params.id,
        req.user!.role === 'super_admin' ? { ...updates, tenantId: requestedTenantId } : updates,
        tenantId
      ),
    });
  }
  catch (err) { next(err); }
});
problemRouter.delete('/:id', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.role === 'super_admin' ? undefined : req.user!.tenantId || undefined;
    if (req.user!.role !== 'super_admin' && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    await problemService.softDelete(req.params.id, tenantId);
    res.json({ success: true, data: { message: 'Problem deleted' } });
  }
  catch (err) { next(err); }
});
problemRouter.patch('/test-cases/:testCaseId', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    if (req.user!.role !== 'super_admin' && !req.user!.tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    }
    const tenantId = req.user!.role === 'super_admin' ? null : req.user!.tenantId;
    const testCase = await problemService.getTestCase(req.params.testCaseId);
    await problemService.assertManageAccess(testCase.problem_id, tenantId);
    res.json({ success: true, data: await problemService.updateTestCase(req.params.testCaseId, req.body || {}) });
  }
  catch (err) { next(err); }
});
problemRouter.delete('/test-cases/:testCaseId', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    if (req.user!.role !== 'super_admin' && !req.user!.tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    }
    const tenantId = req.user!.role === 'super_admin' ? null : req.user!.tenantId;
    const testCase = await problemService.getTestCase(req.params.testCaseId);
    await problemService.assertManageAccess(testCase.problem_id, tenantId);
    await problemService.deleteTestCase(req.params.testCaseId);
    res.json({ success: true, data: { message: 'Test case deleted' } });
  }
  catch (err) { next(err); }
});

// POST /api/v1/problems/seed — seed 20+ verified coding questions (Super Admin only)
problemRouter.post('/seed', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const result = await seedCodingQuestions(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/problems/bulk-import — import array of problems (Super Admin only)
problemRouter.post('/bulk-import', requireAuth, isSuperAdmin, async (req, res, next) => {
  try {
    const { problems } = req.body;
    if (!Array.isArray(problems)) {
      throw new AppError(400, 'INVALID_PAYLOAD', 'problems array is required');
    }
    const created = [];
    for (const p of problems) {
      const prob = await problemService.create({
        ...p,
        scope: 'public',
        createdBy: req.user!.id,
      });
      if (Array.isArray(p.testCases)) {
        for (const tc of p.testCases) {
          await problemService.addTestCase({ problemId: prob.id, ...tc });
        }
      }
      created.push(prob);
    }
    res.json({ success: true, data: { count: created.length, problems: created } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/problems/:id/test-cases
problemRouter.post(
  '/:id/test-cases',
  requireAuth,
  isInstitutionAdmin,
  validate(createTestCaseSchema),
  async (req, res, next) => {
    try {
      if (req.user!.role !== 'super_admin' && !req.user!.tenantId) {
        throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      }
      await problemService.assertManageAccess(
        req.params.id,
        req.user!.role === 'super_admin' ? null : req.user!.tenantId
      );
      const testCase = await problemService.addTestCase({
        problemId: req.params.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: testCase });
    } catch (err) {
      next(err);
    }
  }
);
