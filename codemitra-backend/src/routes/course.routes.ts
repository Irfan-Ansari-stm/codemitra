import { Router } from 'express';
import { courseService } from '../services/course.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin, isAuthenticated } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createCourseSchema, createModuleSchema, createChapterSchema } from '../validators';
import { AppError } from '../middleware/errorHandler';

export const courseRouter = Router();
courseRouter.use(requireAuth);

// ── Courses ───────────────────────────────────────────────────────────────────

// GET /api/v1/courses
courseRouter.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const status = req.query.status as string | undefined;
    const courses = await courseService.listCourses(tenantId, status);
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/:id
courseRouter.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const course = await courseService.getCourse(req.params.id, tenantId);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/courses
courseRouter.post('/', isInstitutionAdmin, validate(createCourseSchema), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const course = await courseService.createCourse({
      tenantId,
      createdBy: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/courses/:id
courseRouter.patch('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const course = await courseService.updateCourse(req.params.id, tenantId, req.body);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// ── Modules ───────────────────────────────────────────────────────────────────

// GET /api/v1/courses/:courseId/modules
courseRouter.get('/:courseId/modules', isAuthenticated, async (req, res, next) => {
  try {
    const modules = await courseService.listModules(req.params.courseId);
    res.json({ success: true, data: modules });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/courses/:courseId/modules
courseRouter.post(
  '/:courseId/modules',
  isInstitutionAdmin,
  validate(createModuleSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const module = await courseService.createModule({
        courseId: req.params.courseId,
        tenantId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: module });
    } catch (err) {
      next(err);
    }
  }
);

// ── Chapters ──────────────────────────────────────────────────────────────────

// GET /api/v1/courses/modules/:moduleId/chapters
courseRouter.get('/modules/:moduleId/chapters', isAuthenticated, async (req, res, next) => {
  try {
    const chapters = await courseService.listChapters(req.params.moduleId);
    res.json({ success: true, data: chapters });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/chapters/:id
courseRouter.get('/chapters/:id', isAuthenticated, async (req, res, next) => {
  try {
    const chapter = await courseService.getChapter(req.params.id);
    res.json({ success: true, data: chapter });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/courses/modules/:moduleId/chapters
courseRouter.post(
  '/modules/:moduleId/chapters',
  isInstitutionAdmin,
  validate(createChapterSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      if (!tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const chapter = await courseService.createChapter({
        moduleId: req.params.moduleId,
        tenantId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: chapter });
    } catch (err) {
      next(err);
    }
  }
);
