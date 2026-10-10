import { Router } from 'express';
import { quizService } from '../services/quiz.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin, isAuthenticated } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  createQuizSchema,
  addQuizQuestionSchema,
  submitQuizSchema,
} from '../validators';
import { AppError } from '../middleware/errorHandler';

export const quizRouter = Router();
quizRouter.use(requireAuth);

// GET /api/v1/quizzes
quizRouter.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const quizzes = await quizService.list(tenantId);
    res.json({ success: true, data: quizzes });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/quizzes/:id
quizRouter.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const quiz = await quizService.getById(req.params.id, tenantId, ['super_admin', 'institution_admin'].includes(req.user!.role));
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/quizzes
quizRouter.post(
  '/',
  isInstitutionAdmin,
  validate(createQuizSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const quiz = await quizService.create({
        tenantId,
        createdBy: req.user!.id,
        ...req.body,
      });
      for (const question of req.body.questions || []) {
        await quizService.addQuestion({ quizId: quiz.id, ...question });
      }
      res.status(201).json({ success: true, data: quiz });
    } catch (err) {
      next(err);
    }
  }
);

quizRouter.patch('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({ success: true, data: await quizService.update(req.params.id, tenantId, req.body || {}) });
  } catch (err) { next(err); }
});

quizRouter.delete('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    await quizService.softDelete(req.params.id, tenantId);
    res.json({ success: true, data: { message: 'Quiz archived' } });
  } catch (err) { next(err); }
});

quizRouter.post('/:id/attempt', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const attempt = await quizService.startAttempt(req.params.id, req.user!.id, tenantId);
    res.status(201).json({ success: true, data: attempt });
  } catch (err) { next(err); }
});

// POST /api/v1/quizzes/:id/questions
quizRouter.post(
  '/:id/questions',
  isInstitutionAdmin,
  validate(addQuizQuestionSchema),
  async (req, res, next) => {
    try {
      const question = await quizService.addQuestion({
        quizId: req.params.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  }
);

export const quizCompatRouter = Router();
quizCompatRouter.post('/quiz-attempts/:attemptId/submit', requireAuth, isAuthenticated, validate(submitQuizSchema), async (req, res, next) => {
  try {
    const result = await quizService.submitAttempt(req.params.attemptId, req.user!.id, req.body.answers);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/v1/quizzes/:id/start — student starts a quiz attempt
quizRouter.post('/:id/start', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const attempt = await quizService.startAttempt(
      req.params.id,
      req.user!.id,
      tenantId
    );
    res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/quizzes/attempts/:attemptId/submit — student submits answers
quizRouter.post(
  '/attempts/:attemptId/submit',
  isAuthenticated,
  validate(submitQuizSchema),
  async (req, res, next) => {
    try {
      const result = await quizService.submitAttempt(
        req.params.attemptId,
        req.user!.id,
        req.body.answers
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
