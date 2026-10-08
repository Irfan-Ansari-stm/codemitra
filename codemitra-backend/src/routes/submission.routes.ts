import { Router } from 'express';
import { submissionService } from '../services/submission.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin } from '../middleware/rbac';
import { submissionRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { submitCodeSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../db';

export const submissionRouter = Router();
submissionRouter.use(requireAuth);

// POST /api/v1/submissions — submit code for judging
submissionRouter.post(
  '/',
  submissionRateLimiter,
  validate(submitCodeSchema),
  async (req, res, next) => {
    try {
      const result = await submissionService.createSubmission({
        userId: req.user!.id,
        tenantId: req.user!.tenantId,
        problemId: req.body.problemId,
        assignmentId: req.body.assignmentId,
        languageId: req.body.languageId,
        sourceCode: req.body.sourceCode,
        isRun: false,
      });
      res.status(202).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/submissions/run — run code against sample cases only (no DB persist)
submissionRouter.post(
  '/run',
  submissionRateLimiter,
  validate(submitCodeSchema),
  async (req, res, next) => {
    try {
      const result = await submissionService.createSubmission({
        userId: req.user!.id,
        tenantId: req.user!.tenantId,
        problemId: req.body.problemId,
        languageId: req.body.languageId,
        sourceCode: req.body.sourceCode,
        isRun: true,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/submissions/:id — poll submission result
submissionRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, verdict, score, runtime_ms, memory_kb, test_case_results,
              language_id, created_at, updated_at
       FROM submissions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/submissions/problem/:problemId — user's submission history for a problem
submissionRouter.get('/problem/:problemId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, language_id, verdict, score, runtime_ms, memory_kb, created_at
       FROM submissions WHERE user_id = $1 AND problem_id = $2
       ORDER BY created_at DESC LIMIT 20`,
      [req.user!.id, req.params.problemId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/submissions — list submissions for tenant (admin only)
submissionRouter.get('/', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT s.id, s.verdict, s.score, s.language_id, s.created_at,
              u.name AS student_name, p.title AS problem_title
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       JOIN problems p ON p.id = s.problem_id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});
