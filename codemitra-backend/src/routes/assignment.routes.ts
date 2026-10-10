import { Router } from 'express';
import { assignmentService } from '../services/assignment.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin, isAuthenticated } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  createAssignmentSchema,
  addProblemToAssignmentSchema,
} from '../validators';
import { AppError } from '../middleware/errorHandler';

export const assignmentRouter = Router();
assignmentRouter.use(requireAuth);

// GET /api/v1/assignments
assignmentRouter.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const status = req.query.status as string | undefined;
    const assignments = await assignmentService.list(tenantId, status);
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/assignments/:id
assignmentRouter.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const assignment = await assignmentService.getById(req.params.id, tenantId);
    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/assignments
assignmentRouter.post(
  '/',
  isInstitutionAdmin,
  validate(createAssignmentSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const assignment = await assignmentService.create({
        tenantId,
        createdBy: req.user!.id,
        ...req.body,
      });
      for (const entry of req.body.problemIds || []) {
        await assignmentService.addProblem(assignment.id, entry.problemId, entry.marks ?? 10, entry.orderIndex ?? 0);
      }
      res.status(201).json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  }
);

assignmentRouter.patch('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({ success: true, data: await assignmentService.update(req.params.id, tenantId, req.body || {}) });
  } catch (err) { next(err); }
});

assignmentRouter.get('/:id/submissions', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({ success: true, data: await assignmentService.listSubmissions(req.params.id, tenantId) });
  } catch (err) { next(err); }
});

assignmentRouter.delete('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    await assignmentService.softDelete(req.params.id, tenantId);
    res.json({ success: true, data: { message: 'Assignment deleted' } });
  } catch (err) { next(err); }
});

// POST /api/v1/assignments/:id/problems — add a problem to an assignment
assignmentRouter.post(
  '/:id/problems',
  isInstitutionAdmin,
  validate(addProblemToAssignmentSchema),
  async (req, res, next) => {
    try {
      const entry = await assignmentService.addProblem(
        req.params.id,
        req.body.problemId,
        req.body.marks,
        req.body.orderIndex
      );
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }
);

export const assignmentCompatRouter = Router();
assignmentCompatRouter.patch('/assignment-submissions/:submissionId/grade', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const score = Number(req.body?.totalScore);
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    if (!Number.isFinite(score) || score < 0) throw new AppError(400, 'VALIDATION_ERROR', 'totalScore must be a non-negative number');
    const data = await assignmentService.gradeSubmission(req.params.submissionId, tenantId, req.user!.id, score, req.body?.feedback);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/v1/assignments/:id/my-submission — student's own submission record
assignmentRouter.get('/:id/my-submission', isAuthenticated, async (req, res, next) => {
  try {
    const submission = await assignmentService.getStudentSubmission(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/assignments/:id/submit — student submits an assignment
assignmentRouter.post('/:id/submit', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const submission = await assignmentService.submitAssignment(
      req.params.id,
      req.user!.id,
      tenantId
    );
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});
