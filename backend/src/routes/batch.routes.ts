import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin, isInstitutionAdmin, requirePermission } from '../middleware/rbac';
import { superAdminBatchService } from '../services/batch.service';
import { AppError } from '../middleware/errorHandler';

export const batchRouter = Router();
batchRouter.use(requireAuth);

// ── Analytics Overview ──────────────────────────────────────────────
batchRouter.get('/analytics', async (req, res, next) => {
  try {
    const isSuper = req.user!.role === 'super_admin';
    const tenantId = isSuper ? (req.query.tenantId as string | undefined) : req.user!.tenantId;
    const analytics = await superAdminBatchService.getAnalytics(tenantId || undefined);
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
});

// ── Platform Settings ───────────────────────────────────────────────
batchRouter.get('/settings', async (_req, res, next) => {
  try {
    const settings = await superAdminBatchService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

batchRouter.put('/settings', isSuperAdmin, async (req, res, next) => {
  try {
    const settings = await superAdminBatchService.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// ── Export CSV ──────────────────────────────────────────────────────
batchRouter.get('/export', async (req, res, next) => {
  try {
    const isSuper = req.user!.role === 'super_admin';
    const tenantId = isSuper ? (req.query.tenantId as string | undefined) : req.user!.tenantId;
    const records = await superAdminBatchService.exportBatches(tenantId || undefined);
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
});

// ── List Batches ────────────────────────────────────────────────────
batchRouter.get('/', async (req, res, next) => {
  try {
    const isSuper = req.user!.role === 'super_admin';
    const tenantId = isSuper ? (req.query.tenantId as string | undefined) : req.user!.tenantId;
    const {
      search,
      status,
      academicYearId,
      department,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query as any;

    const result = await superAdminBatchService.listBatches({
      tenantId: tenantId || undefined,
      search: search as string,
      status: status as string,
      academicYearId: academicYearId as string,
      department: department as string,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ── Create Batch ────────────────────────────────────────────────────
batchRouter.post('/', async (req, res, next) => {
  try {
    const isSuper = req.user!.role === 'super_admin';
    const tenantId = isSuper ? req.body.tenantId : req.user!.tenantId;

    if (!tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Institution context is required to create a batch');
    }

    const batch = await superAdminBatchService.createBatch(
      { ...req.body, tenantId },
      req.user!.id,
      req.ip,
      (req as any).requestId
    );

    res.status(201).json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// ── Get Single Batch Details ────────────────────────────────────────
batchRouter.get('/:id', async (req, res, next) => {
  try {
    const batch = await superAdminBatchService.getBatchById(req.params.id);
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// ── Update Batch ────────────────────────────────────────────────────
batchRouter.patch('/:id', async (req, res, next) => {
  try {
    const batch = await superAdminBatchService.updateBatch(
      req.params.id,
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// ── Status toggle (active / archived) ───────────────────────────────
batchRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw new AppError(400, 'VALIDATION_ERROR', 'status is required');
    const batch = await superAdminBatchService.updateBatch(
      req.params.id,
      { status },
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// ── Delete / Archive Batch ──────────────────────────────────────────
batchRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await superAdminBatchService.deleteBatch(
      req.params.id,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json(result);
  } catch (err) { next(err); }
});

// ── Duplicate Batch ─────────────────────────────────────────────────
batchRouter.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      throw new AppError(400, 'VALIDATION_ERROR', 'name and code are required to duplicate a batch');
    }
    const result = await superAdminBatchService.duplicateBatch(
      req.params.id,
      name,
      code,
      req.user!.id
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── Batch Students ──────────────────────────────────────────────────
batchRouter.get('/:id/students', async (req, res, next) => {
  try {
    const students = await superAdminBatchService.getBatchStudents(
      req.params.id,
      req.query.search as string
    );
    res.json({ success: true, data: students });
  } catch (err) { next(err); }
});

batchRouter.post('/:id/students', async (req, res, next) => {
  try {
    const { studentId, sectionId, rollNumber } = req.body;
    if (!studentId) throw new AppError(400, 'VALIDATION_ERROR', 'studentId is required');
    const result = await superAdminBatchService.enrollStudent(
      req.params.id,
      studentId,
      sectionId || null,
      rollNumber || null,
      req.user!.id
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

batchRouter.delete('/:id/students/:studentId', async (req, res, next) => {
  try {
    const result = await superAdminBatchService.removeStudent(req.params.id, req.params.studentId);
    res.json(result);
  } catch (err) { next(err); }
});

batchRouter.post('/:id/students/bulk-enroll', async (req, res, next) => {
  try {
    const { studentIds, sectionId } = req.body;
    const result = await superAdminBatchService.bulkEnrollStudents(
      req.params.id,
      studentIds,
      sectionId || null,
      req.user!.id
    );
    res.status(201).json({ success: true, ...result });
  } catch (err) { next(err); }
});

batchRouter.post('/:id/students/transfer', async (req, res, next) => {
  try {
    const { studentId, targetBatchId, targetSectionId } = req.body;
    if (!studentId || !targetBatchId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'studentId and targetBatchId are required');
    }
    const result = await superAdminBatchService.transferStudent(
      studentId,
      req.params.id,
      targetBatchId,
      targetSectionId || null,
      req.user!.id
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ── Batch Sections ──────────────────────────────────────────────────
batchRouter.get('/:id/sections', async (req, res, next) => {
  try {
    const sections = await superAdminBatchService.getSections(req.params.id);
    res.json({ success: true, data: sections });
  } catch (err) { next(err); }
});

batchRouter.post('/:id/sections', async (req, res, next) => {
  try {
    const { name, code, capacity, room, instructorId } = req.body;
    if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Section name is required');
    const section = await superAdminBatchService.createSection(req.params.id, {
      name,
      code,
      capacity: capacity ? parseInt(capacity) : 60,
      room,
      instructorId,
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) { next(err); }
});

// ── Batch Courses ───────────────────────────────────────────────────
batchRouter.get('/:id/courses', async (req, res, next) => {
  try {
    const courses = await superAdminBatchService.getBatchCourses(req.params.id);
    res.json({ success: true, data: courses });
  } catch (err) { next(err); }
});

batchRouter.post('/:id/courses', async (req, res, next) => {
  try {
    const { courseId, instructorId } = req.body;
    if (!courseId) throw new AppError(400, 'VALIDATION_ERROR', 'courseId is required');
    const result = await superAdminBatchService.assignCourse(
      req.params.id,
      courseId,
      instructorId
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

batchRouter.delete('/:id/courses/:courseId', async (req, res, next) => {
  try {
    const result = await superAdminBatchService.removeCourse(req.params.id, req.params.courseId);
    res.json(result);
  } catch (err) { next(err); }
});
