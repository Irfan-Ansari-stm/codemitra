import { Router } from 'express';
import { courseService } from '../services/course.service';
import type { CourseListParams } from '../services/course.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin, isAuthenticated } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  createCourseSchema,
  createModuleSchema,
  createChapterSchema,
  courseQuerySchema,
  chapterProgressSchema,
} from '../validators';
import { AppError } from '../middleware/errorHandler';

export const courseRouter = Router();
courseRouter.use(requireAuth);

// ── Courses ───────────────────────────────────────────────────────────────────

// GET /api/v1/courses — searchable, filterable, sortable, paginated catalog.
// When `limit` is supplied the response carries a `meta` pagination block;
// without `limit` the full list is returned (legacy contract).
courseRouter.get('/', isAuthenticated, validate(courseQuerySchema, 'query'), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const query = req.query as unknown as CourseListParams;
    const result = await courseService.listCourses(tenantId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      language: query.language,
      status: ['super_admin', 'institution_admin'].includes(req.user!.role) ? query.status : 'published',
      sort: query.sort,
      order: query.order,
    }, req.user!.role === 'super_admin');
    if (Array.isArray(result)) {
      res.json({ success: true, data: result });
    } else {
      res.json({
        success: true,
        data: result.courses,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

courseRouter.get('/manage', isInstitutionAdmin, validate(courseQuerySchema, 'query'), async (req, res, next) => {
  try {
    const query = req.query as unknown as CourseListParams;
    const platformWide = req.user!.role === 'super_admin';
    const result = await courseService.listCourses(platformWide ? null : req.user!.tenantId, query, platformWide);
    res.json({ success: true, data: Array.isArray(result) ? result : result.courses });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/featured — published courses with the most active enrollments.
courseRouter.get('/featured', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = parseInt(req.query.limit as string, 10) || 3;
    const courses = await courseService.getFeaturedCourses(tenantId, limit);
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/stats — catalog-wide counts for the current tenant.
courseRouter.get('/stats', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const stats = await courseService.getCatalogStats(tenantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/my-courses — courses the current student is enrolled in,
// with per-course completion rollup.
courseRouter.get('/my-courses', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const courses = await courseService.listEnrolledCourses(req.user!.id, tenantId);
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/:id — course detail with nested curriculum, enrollment
// status, and learning progress for the current user.
courseRouter.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const platformWide = req.user!.role === 'super_admin';
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    const course = await courseService.getCourse(req.params.id, tenantId, req.user!.id, platformWide, publishedOnly);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/:id/enrollment — current user's enrollment status.
courseRouter.get('/:id/enrollment', isAuthenticated, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) {
      if (req.user!.role !== 'general_student') {
        throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      }
      await courseService.getPublishedCourseTenantId(req.params.id);
    }
    const enrollment = await courseService.getEnrollment(req.params.id, req.user!.id);
    res.json({ success: true, data: enrollment });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/courses/:id/enroll — enroll the current user (idempotent).
courseRouter.post('/:id/enroll', isAuthenticated, async (req, res, next) => {
  try {
    let tenantId = req.user!.tenantId;
    if (!tenantId) {
      if (req.user!.role !== 'general_student') {
        throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      }
      tenantId = await courseService.getPublishedCourseTenantId(req.params.id);
    }
    const enrollment = await courseService.enrollStudent(
      req.params.id,
      req.user!.id,
      tenantId
    );
    res.json({ success: true, data: enrollment });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/:id/progress — current user's completion rollup.
courseRouter.get('/:id/progress', isAuthenticated, async (req, res, next) => {
  try {
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    const tenantId = req.user!.tenantId ??
      (publishedOnly
        ? await courseService.getPublishedCourseTenantId(req.params.id)
        : null);
    if (tenantId === null && req.user!.role !== 'general_student') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const progress = await courseService.getCourseProgress(
      req.params.id,
      req.user!.id,
      publishedOnly
    );
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/courses/:id/progress — mark a chapter complete/incomplete.
courseRouter.post(
  '/:id/progress',
  isAuthenticated,
  validate(chapterProgressSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId ??
        (req.user!.role === 'general_student'
          ? await courseService.getPublishedCourseTenantIdForChapter(req.body.chapterId)
          : null);
      if (tenantId === null && req.user!.role !== 'general_student') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const progress = await courseService.updateChapterProgress(
        req.body.chapterId,
        req.user!.id,
        tenantId,
        req.body.isCompleted
      );
      res.json({ success: true, data: progress });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/courses
courseRouter.post('/', isInstitutionAdmin, validate(createCourseSchema), async (req, res, next) => {
  try {
    const tenantId = req.user!.role === 'super_admin' ? (req.body.tenantId ?? null) : req.user!.tenantId;
    if (req.user!.role !== 'super_admin' && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const course = await courseService.createCourse({
      ...req.body,
      tenantId,
      createdBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/courses/:id
courseRouter.patch('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.role === 'super_admin' ? undefined : req.user!.tenantId;
    if (req.user!.role !== 'super_admin' && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const course = await courseService.updateCourse(req.params.id, tenantId, req.body);
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

courseRouter.delete('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.role === 'super_admin' ? undefined : req.user!.tenantId;
    if (req.user!.role !== 'super_admin' && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    await courseService.softDeleteCourse(req.params.id, tenantId);
    res.json({ success: true, data: { message: 'Course deleted' } });
  } catch (err) { next(err); }
});

// ── Modules ───────────────────────────────────────────────────────────────────

// GET /api/v1/courses/:courseId/modules
courseRouter.get('/:courseId/modules', isAuthenticated, async (req, res, next) => {
  try {
    let tenantId = req.user!.tenantId;
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    if (!tenantId && req.user!.role === 'general_student') {
      tenantId = await courseService.getPublishedCourseTenantId(req.params.courseId);
    }
    if (!tenantId && !publishedOnly && req.user!.role !== 'super_admin') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const modules = await courseService.listModules(
      req.params.courseId,
      tenantId,
      publishedOnly
    );
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
      if (!tenantId && req.user!.role !== 'super_admin') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
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

export const courseCompatRouter = Router();

courseCompatRouter.patch('/modules/reorder', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try {
    const { courseId, order } = req.body || {};
    if (!courseId || !Array.isArray(order) || order.some((x: any) => !x.id || !Number.isInteger(x.orderIndex) || x.orderIndex < 0)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'courseId and an order array of {id, orderIndex} are required');
    }
    const data = await courseService.reorderModules(courseId, req.user!.tenantId, order);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

courseCompatRouter.patch('/modules/:moduleId', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try { res.json({ success: true, data: await courseService.updateModule(req.params.moduleId, req.user!.tenantId, req.body || {}) }); }
  catch (err) { next(err); }
});
courseCompatRouter.delete('/modules/:moduleId', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try { await courseService.softDeleteModule(req.params.moduleId, req.user!.tenantId); res.json({ success: true, data: { message: 'Module deleted' } }); }
  catch (err) { next(err); }
});
courseCompatRouter.get('/modules/:moduleId/chapters', requireAuth, isAuthenticated, async (req, res, next) => {
  try {
    let tenantId = req.user!.tenantId;
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    if (!tenantId && req.user!.role === 'general_student') tenantId = await courseService.getPublishedModuleTenantId(req.params.moduleId);
    if (!tenantId && !publishedOnly && req.user!.role !== 'super_admin') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({
      success: true,
      data: await courseService.listChapters(req.params.moduleId, tenantId, publishedOnly),
    });
  }
  catch (err) { next(err); }
});
courseCompatRouter.post('/modules/:moduleId/chapters', requireAuth, isInstitutionAdmin, validate(createChapterSchema), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId && req.user!.role !== 'super_admin') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const data = await courseService.createChapter({ moduleId: req.params.moduleId, tenantId, ...req.body });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});
courseCompatRouter.get('/chapters/:id', requireAuth, isAuthenticated, async (req, res, next) => {
  try {
    let tenantId = req.user!.tenantId;
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    if (!tenantId && req.user!.role === 'general_student') {
      tenantId = await courseService.getPublishedCourseTenantIdForChapter(req.params.id);
    }
    if (!tenantId && req.user!.role !== 'super_admin' && req.user!.role !== 'general_student') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    res.json({ success: true, data: await courseService.getChapter(req.params.id, tenantId, publishedOnly) });
  }
  catch (err) { next(err); }
});
courseCompatRouter.patch('/chapters/:id', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try { res.json({ success: true, data: await courseService.updateChapter(req.params.id, req.user!.tenantId, req.body || {}) }); }
  catch (err) { next(err); }
});
courseCompatRouter.delete('/chapters/:id', requireAuth, isInstitutionAdmin, async (req, res, next) => {
  try { await courseService.softDeleteChapter(req.params.id, req.user!.tenantId); res.json({ success: true, data: { message: 'Chapter deleted' } }); }
  catch (err) { next(err); }
});

// ── Chapters ──────────────────────────────────────────────────────────────────

// GET /api/v1/courses/modules/:moduleId/chapters
courseRouter.get('/modules/:moduleId/chapters', isAuthenticated, async (req, res, next) => {
  try {
    let tenantId = req.user!.tenantId;
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    if (!tenantId && req.user!.role === 'general_student') tenantId = await courseService.getPublishedModuleTenantId(req.params.moduleId);
    if (!tenantId && !publishedOnly && req.user!.role !== 'super_admin') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const chapters = await courseService.listChapters(
      req.params.moduleId,
      tenantId,
      publishedOnly
    );
    res.json({ success: true, data: chapters });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/courses/chapters/:id
courseRouter.get('/chapters/:id', isAuthenticated, async (req, res, next) => {
  try {
    let tenantId = req.user!.tenantId;
    const publishedOnly = ['institution_student', 'general_student'].includes(req.user!.role);
    if (!tenantId && req.user!.role === 'general_student') {
      tenantId = await courseService.getPublishedCourseTenantIdForChapter(req.params.id);
    }
    if (!tenantId && req.user!.role !== 'super_admin' && req.user!.role !== 'general_student') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    const chapter = await courseService.getChapter(req.params.id, tenantId, publishedOnly);
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
      if (!tenantId && req.user!.role !== 'super_admin') throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
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
