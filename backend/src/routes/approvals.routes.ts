import { Router, Request, Response, NextFunction } from 'express';
import { isSuperAdmin } from '../middleware/rbac';
import { approvalsService } from '../services/approvals.service';

const router = Router();

// Protect all approval routes with isSuperAdmin
router.use(isSuperAdmin);

// =============================================================================
// SUMMARY & STATS
// =============================================================================
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await approvalsService.getSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// INSTITUTE APPLICATIONS
// =============================================================================
router.get('/institutes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await approvalsService.listInstitutes({
      search: search as string,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/institutes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await approvalsService.getInstitute(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Institute application not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/institutes/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { note } = req.body;
    const result = await approvalsService.approveInstitute(req.params.id, adminId, note);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/institutes/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { reason, adminNotes } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const result = await approvalsService.rejectInstitute(req.params.id, adminId, reason, adminNotes);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/institutes/:id/request-changes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { comments } = req.body;
    if (!comments || typeof comments !== 'string' || !comments.trim()) {
      return res.status(400).json({ success: false, message: 'Comments are required when requesting changes' });
    }
    const result = await approvalsService.requestInstituteChanges(req.params.id, adminId, comments);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// STUDENT ADMISSIONS
// =============================================================================
router.get('/admissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, tenantId, page, limit, sortBy, sortOrder } = req.query;
    const result = await approvalsService.listAdmissions({
      search: search as string,
      status: status as string,
      tenantId: tenantId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/admissions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await approvalsService.getAdmission(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Admission application not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/admissions/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { note } = req.body;
    const result = await approvalsService.approveAdmission(req.params.id, adminId, note);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/admissions/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { reason, adminNotes } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const result = await approvalsService.rejectAdmission(req.params.id, adminId, reason, adminNotes);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/admissions/:id/request-changes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { comments } = req.body;
    if (!comments || typeof comments !== 'string' || !comments.trim()) {
      return res.status(400).json({ success: false, message: 'Comments are required when requesting changes' });
    }
    const result = await approvalsService.requestAdmissionChanges(req.params.id, adminId, comments);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// COURSE SUBMISSIONS
// =============================================================================
router.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, tenantId, page, limit, sortBy, sortOrder } = req.query;
    const result = await approvalsService.listCourses({
      search: search as string,
      status: status as string,
      tenantId: tenantId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await approvalsService.getCourse(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Course submission not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/courses/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { note } = req.body;
    const result = await approvalsService.approveCourse(req.params.id, adminId, note);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/courses/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { reason, adminNotes } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const result = await approvalsService.rejectCourse(req.params.id, adminId, reason, adminNotes);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/courses/:id/request-changes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user?.id;
    const { comments } = req.body;
    if (!comments || typeof comments !== 'string' || !comments.trim()) {
      return res.status(400).json({ success: false, message: 'Comments are required when requesting changes' });
    }
    const result = await approvalsService.requestCourseChanges(req.params.id, adminId, comments);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// AUDIT HISTORY
// =============================================================================
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.query;
    const result = await approvalsService.getAuditHistory(
      entityType as string | undefined,
      entityId as string | undefined
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export const approvalsRouter = router;
