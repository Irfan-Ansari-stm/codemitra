import { Router } from 'express';
import { problemService } from '../services/problem.service';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { isInstitutionAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createProblemSchema, createTestCaseSchema, paginationSchema } from '../validators';

export const problemRouter = Router();

// GET /api/v1/problems — public problems visible without auth; tenant problems need auth
problemRouter.get('/', optionalAuth, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const result = await problemService.list({
      tenantId: req.user?.tenantId || undefined,
      scope: req.query.scope as string,
      difficulty: req.query.difficulty as string,
      search: req.query.search as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/problems/:id
problemRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const problem = await problemService.getById(req.params.id);
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
      const problem = await problemService.create({
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: problem });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/problems/:id/test-cases — all test cases (admin only)
problemRouter.get(
  '/:id/test-cases',
  requireAuth,
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const testCases = await problemService.getTestCases(req.params.id, true);
      res.json({ success: true, data: testCases });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/problems/:id/test-cases
problemRouter.post(
  '/:id/test-cases',
  requireAuth,
  isInstitutionAdmin,
  validate(createTestCaseSchema),
  async (req, res, next) => {
    try {
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
