import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin, isInstitutionAdmin, isAnyStudent, isAuthenticated } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { instituteApplicationService, instituteService } from '../services/institute.service';
import { admissionService } from '../services/admission.service';
import { ticketService } from '../services/ticket.service';
import {
  academicYearService,
  semesterService,
  batchService,
  classService,
  attendanceService,
  gradeService,
  timetableService,
} from '../services/academic.service';
import { certificateService } from '../services/certificate.service';
import {
  contentPageService,
  bannerService,
  faqService,
  helpArticleService,
  mediaAssetService,
} from '../services/content.service';
import {
  configurationService,
  seoService,
  logsService,
  notificationService,
} from '../services/configuration.service';
import {
  superAdminStudentsService,
  superAdminApprovalsService,
  superAdminSecurityService,
  superAdminBillingService,
  superAdminIncidentsService,
  superAdminIntegrationsService,
  superAdminBackupService,
  superAdminNotificationsService,
  superAdminMonitoringService,
} from '../services/admin.service';
import { pool } from '../db';
import { writeAuditLog } from '../utils/audit';
import { AppError } from '../middleware/errorHandler';

export const platformRouter = Router();
platformRouter.use(requireAuth);

// =============================================================================
// INSTITUTE APPLICATIONS (Super Admin)
// =============================================================================
const createInstituteApplicationSchema = z.object({
  institutionName: z.string().min(2).max(255).trim(),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(30).optional(),
  websiteUrl: z.string().url().optional(),
  address: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  documents: z.array(z.any()).optional(),
});

const reviewInstituteApplicationSchema = z.object({
  reviewNote: z.string().max(2000).optional(),
});

// Public: submit institute application (authenticated users)
platformRouter.post(
  '/institute-applications',
  validate(createInstituteApplicationSchema),
  async (req, res, next) => {
    try {
      const application = await instituteApplicationService.create({
        ...req.body,
        applicantUserId: req.user!.id,
      });
      await writeAuditLog({
        userId: req.user!.id,
        action: 'institute_application.submit',
        resourceType: 'institute_application',
        resourceId: application.id,
        newData: { institutionName: req.body.institutionName },
        ipAddress: req.ip,
        requestId: (req as any).requestId,
      });
      res.status(201).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }
);

// Super Admin: list applications
platformRouter.get(
  '/super-admin/institute-applications',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const { status, page, limit } = req.query as any;
      const result = await instituteApplicationService.list(
        status,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// Super Admin: approve application
platformRouter.post(
  '/super-admin/institute-applications/:id/approve',
  isSuperAdmin,
  validate(reviewInstituteApplicationSchema),
  async (req, res, next) => {
    try {
      const result = await instituteApplicationService.approve(
        req.params.id,
        req.body.reviewNote,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Super Admin: reject application
platformRouter.post(
  '/super-admin/institute-applications/:id/reject',
  isSuperAdmin,
  validate(reviewInstituteApplicationSchema),
  async (req, res, next) => {
    try {
      const result = await instituteApplicationService.reject(
        req.params.id,
        req.body.reviewNote,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Super Admin: request more info
platformRouter.post(
  '/super-admin/institute-applications/:id/request-info',
  isSuperAdmin,
  validate(reviewInstituteApplicationSchema),
  async (req, res, next) => {
    try {
      const result = await instituteApplicationService.requestInfo(
        req.params.id,
        req.body.reviewNote,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// INSTITUTE MANAGEMENT (Super Admin)
// =============================================================================
platformRouter.get(
  '/super-admin/institutes',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const { page, limit, search } = req.query as any;
      const result = await instituteService.list(
        parseInt(page) || 1,
        parseInt(limit) || 20,
        search
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.get(
  '/super-admin/institutes/:id',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const institute = await instituteService.getById(req.params.id);
      res.json({ success: true, data: institute });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.patch(
  '/super-admin/institutes/:id',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const institute = await instituteService.update(
        req.params.id,
        req.body,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: institute });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.post(
  '/super-admin/institutes/:id/suspend',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      const institute = await instituteService.suspend(
        req.params.id,
        reason,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: institute });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.post(
  '/super-admin/institutes/:id/reactivate',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const institute = await instituteService.reactivate(
        req.params.id,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: institute });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.delete(
  '/super-admin/institutes/:id',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const result = await instituteService.softDelete(
        req.params.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Super Admin: invite institute admin
platformRouter.post(
  '/super-admin/institutes/:id/invite-admin',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Email is required');
      }
      const result = await instituteService.inviteAdmin(
        req.params.id,
        email,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Institute Admin: branches, departments, documents, staff
platformRouter.get(
  '/institution/branches',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const branches = await instituteService.getBranches(req.user!.tenantId!);
      res.json({ success: true, data: branches });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.post(
  '/institution/branches',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const branch = await instituteService.createBranch(
        req.user!.tenantId!,
        req.body
      );
      res.status(201).json({ success: true, data: branch });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.get(
  '/institution/departments',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const departments = await instituteService.getDepartments(req.user!.tenantId!);
      res.json({ success: true, data: departments });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.post(
  '/institution/departments',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const department = await instituteService.createDepartment(
        req.user!.tenantId!,
        req.body
      );
      res.status(201).json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.get(
  '/institution/documents',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const documents = await instituteService.getDocuments(req.user!.tenantId!);
      res.json({ success: true, data: documents });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.post(
  '/institution/documents',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const document = await instituteService.addDocument(
        req.user!.tenantId!,
        { ...req.body, uploadedBy: req.user!.id }
      );
      res.status(201).json({ success: true, data: document });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.get(
  '/institution/staff',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const staff = await instituteService.getStaff(req.user!.tenantId!);
      res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }
);

platformRouter.post(
  '/institution/staff',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      const staff = await instituteService.assignStaff(
        req.user!.tenantId!,
        { ...req.body, assignedBy: req.user!.id }
      );
      res.status(201).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// ADMISSIONS (Institute Admin + General User)
// =============================================================================
const createAdmissionSchema = z.object({
  fullName: z.string().min(2).max(255).trim(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  program: z.string().max(255).optional(),
  documents: z.array(z.any()).optional(),
});

// General User: apply to institute
platformRouter.post(
  '/institutions/:id/admissions',
  isAuthenticated,
  validate(createAdmissionSchema),
  async (req, res, next) => {
    try {
      const admission = await admissionService.create(
        req.params.id,
        { ...req.body, userId: req.user!.id },
        req.ip,
        (req as any).requestId
      );
      res.status(201).json({ success: true, data: admission });
    } catch (err) {
      next(err);
    }
  }
);

// Institute Admin: list admissions for their institute
platformRouter.get(
  '/institutions/:id/admissions',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      if (req.user!.tenantId !== req.params.id && req.user!.role !== 'super_admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to view admissions for this institute');
      }
      const { status, page, limit } = req.query as any;
      const result = await admissionService.list(
        req.params.id,
        status,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// Institute Admin: approve admission
platformRouter.post(
  '/institutions/:id/admissions/:admissionId/approve',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      if (req.user!.tenantId !== req.params.id && req.user!.role !== 'super_admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to approve admissions for this institute');
      }
      const { reviewNote } = req.body;
      const admission = await admissionService.approve(
        req.params.admissionId,
        req.params.id,
        reviewNote,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: admission });
    } catch (err) {
      next(err);
    }
  }
);

// Institute Admin: reject admission
platformRouter.post(
  '/institutions/:id/admissions/:admissionId/reject',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      if (req.user!.tenantId !== req.params.id && req.user!.role !== 'super_admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to reject admissions for this institute');
      }
      const { reviewNote } = req.body;
      const admission = await admissionService.reject(
        req.params.admissionId,
        req.params.id,
        reviewNote,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: admission });
    } catch (err) {
      next(err);
    }
  }
);

// Institute Admin: request more info
platformRouter.post(
  '/institutions/:id/admissions/:admissionId/request-info',
  isInstitutionAdmin,
  async (req, res, next) => {
    try {
      if (req.user!.tenantId !== req.params.id && req.user!.role !== 'super_admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized for this institute');
      }
      const { reviewNote } = req.body;
      const admission = await admissionService.requestInfo(
        req.params.admissionId,
        req.params.id,
        reviewNote,
        req.user!.id,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: admission });
    } catch (err) {
      next(err);
    }
  }
);

// User: view own admissions
platformRouter.get(
  '/my/admissions',
  isAuthenticated,
  async (req, res, next) => {
    try {
      const admissions = await admissionService.getByUser(req.user!.id);
      res.json({ success: true, data: admissions });
    } catch (err) {
      next(err);
    }
  }
);

// User: withdraw admission application
platformRouter.post(
  '/my/admissions/:id/withdraw',
  isAuthenticated,
  async (req, res, next) => {
    try {
      const admission = await admissionService.getById(req.params.id);
      const result = await admissionService.withdraw(
        req.params.id,
        admission.tenant_id,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// SUPPORT TICKETS
// =============================================================================
const createTicketSchema = z.object({
  subject: z.string().min(2).max(500).trim(),
  description: z.string().min(10).max(5000).trim(),
  category: z.enum(['general', 'technical', 'billing', 'course', 'problem', 'account', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  category: z.string().optional(),
});

const replyTicketSchema = z.object({
  message: z.string().min(1).max(5000).trim(),
  isInternal: z.boolean().optional(),
});

// List tickets (scoped by role)
platformRouter.get(
  '/tickets',
  isAuthenticated,
  async (req, res, next) => {
    try {
      const { status, page, limit } = req.query as any;
      const result = await ticketService.list(
        req.user!.id,
        req.user!.role,
        req.user!.tenantId,
        status,
        parseInt(page) || 1,
        parseInt(limit) || 20
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// Create ticket
platformRouter.post(
  '/tickets',
  isAuthenticated,
  validate(createTicketSchema),
  async (req, res, next) => {
    try {
      const ticket = await ticketService.create(
        req.user!.id,
        req.user!.tenantId,
        req.body,
        req.ip,
        (req as any).requestId
      );
      res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

// Get ticket
platformRouter.get(
  '/tickets/:id',
  isAuthenticated,
  async (req, res, next) => {
    try {
      const ticket = await ticketService.getById(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.user!.tenantId
      );
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

// Update ticket
platformRouter.patch(
  '/tickets/:id',
  isAuthenticated,
  validate(updateTicketSchema),
  async (req, res, next) => {
    try {
      const ticket = await ticketService.update(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.user!.tenantId,
        req.body,
        req.ip,
        (req as any).requestId
      );
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

// Reply to ticket
platformRouter.post(
  '/tickets/:id/reply',
  isAuthenticated,
  validate(replyTicketSchema),
  async (req, res, next) => {
    try {
      const reply = await ticketService.reply(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.user!.tenantId,
        req.body.message,
        req.body.isInternal || false,
        req.ip,
        (req as any).requestId
      );
      res.status(201).json({ success: true, data: reply });
    } catch (err) {
      next(err);
    }
  }
);

// Delete ticket (Super Admin only)
platformRouter.delete(
  '/tickets/:id',
  isSuperAdmin,
  async (req, res, next) => {
    try {
      const result = await ticketService.delete(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.user!.tenantId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// ACADEMIC MANAGEMENT (Institute Admin)
// =============================================================================
const createAcademicYearSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().optional(),
});

const createSemesterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  academicYearId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

const createBatchSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  code: z.string().max(50).optional(),
  academicYearId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
});

const createClassSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  batchId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  schedule: z.array(z.any()).optional(),
  room: z.string().max(100).optional(),
});

const recordAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  sessionDate: z.string().min(1),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(1000).optional(),
});

const recordBulkAttendanceSchema = z.object({
  sessionDate: z.string().min(1),
  classId: z.string().uuid(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'excused']),
  })),
});

const recordGradeSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  assessmentId: z.string().uuid().optional(),
  assessmentType: z.enum(['assignment', 'quiz', 'exam', 'project', 'participation']).optional(),
  score: z.number().min(0),
  maxScore: z.number().min(1).default(100),
  feedback: z.string().max(2000).optional(),
});

const createTimetableSchema = z.object({
  classId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  subject: z.string().max(255).optional(),
  instructorId: z.string().uuid().optional(),
  room: z.string().max(100).optional(),
});

// Academic Years
platformRouter.get('/academic/years', isInstitutionAdmin, async (req, res, next) => {
  try {
    const years = await academicYearService.list(req.user!.tenantId!);
    res.json({ success: true, data: years });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/years', isInstitutionAdmin, validate(createAcademicYearSchema), async (req, res, next) => {
  try {
    const year = await academicYearService.create(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: year });
  } catch (err) { next(err); }
});

platformRouter.patch('/academic/years/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const year = await academicYearService.update(req.params.id, req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: year });
  } catch (err) { next(err); }
});

platformRouter.delete('/academic/years/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const year = await academicYearService.delete(req.params.id, req.user!.tenantId!, req.user!.id);
    res.json({ success: true, data: year });
  } catch (err) { next(err); }
});

// Semesters
platformRouter.get('/academic/semesters', isInstitutionAdmin, async (req, res, next) => {
  try {
    const { academicYearId } = req.query as any;
    const semesters = await semesterService.list(req.user!.tenantId!, academicYearId);
    res.json({ success: true, data: semesters });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/semesters', isInstitutionAdmin, validate(createSemesterSchema), async (req, res, next) => {
  try {
    const semester = await semesterService.create(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: semester });
  } catch (err) { next(err); }
});

platformRouter.patch('/academic/semesters/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const semester = await semesterService.update(req.params.id, req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: semester });
  } catch (err) { next(err); }
});

platformRouter.delete('/academic/semesters/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const semester = await semesterService.delete(req.params.id, req.user!.tenantId!);
    res.json({ success: true, data: semester });
  } catch (err) { next(err); }
});

// Batches
platformRouter.get('/academic/batches', isInstitutionAdmin, async (req, res, next) => {
  try {
    const batches = await batchService.list(req.user!.tenantId!);
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/batches', isInstitutionAdmin, validate(createBatchSchema), async (req, res, next) => {
  try {
    const batch = await batchService.create(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: batch });
  } catch (err) { next(err); }
});

platformRouter.patch('/academic/batches/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const batch = await batchService.update(req.params.id, req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

platformRouter.delete('/academic/batches/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const batch = await batchService.delete(req.params.id, req.user!.tenantId!);
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/batches/:id/enroll', isInstitutionAdmin, async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const result = await batchService.enrollStudent(req.user!.tenantId!, req.params.id, studentId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.get('/academic/batches/:id/students', isInstitutionAdmin, async (req, res, next) => {
  try {
    const students = await batchService.getStudents(req.user!.tenantId!, req.params.id);
    res.json({ success: true, data: students });
  } catch (err) { next(err); }
});

// Classes
platformRouter.get('/academic/classes', isInstitutionAdmin, async (req, res, next) => {
  try {
    const { batchId } = req.query as any;
    const classes = await classService.list(req.user!.tenantId!, batchId);
    res.json({ success: true, data: classes });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/classes', isInstitutionAdmin, validate(createClassSchema), async (req, res, next) => {
  try {
    const classEntity = await classService.create(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: classEntity });
  } catch (err) { next(err); }
});

platformRouter.patch('/academic/classes/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const classEntity = await classService.update(req.params.id, req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: classEntity });
  } catch (err) { next(err); }
});

platformRouter.delete('/academic/classes/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const classEntity = await classService.delete(req.params.id, req.user!.tenantId!);
    res.json({ success: true, data: classEntity });
  } catch (err) { next(err); }
});

// Attendance
platformRouter.get('/academic/attendance', isInstitutionAdmin, async (req, res, next) => {
  try {
    const { studentId, classId, dateFrom, dateTo } = req.query as any;
    const attendance = await attendanceService.list(req.user!.tenantId!, studentId, classId, dateFrom, dateTo);
    res.json({ success: true, data: attendance });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/attendance', isInstitutionAdmin, validate(recordAttendanceSchema), async (req, res, next) => {
  try {
    const record = await attendanceService.record(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/attendance/bulk', isInstitutionAdmin, validate(recordBulkAttendanceSchema), async (req, res, next) => {
  try {
    const records = req.body.records.map((r: any) => ({
      ...r,
      classId: req.body.classId,
      sessionDate: req.body.sessionDate,
    }));
    const result = await attendanceService.recordBulk(req.user!.tenantId!, records, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.get('/academic/attendance/summary/:studentId', isInstitutionAdmin, async (req, res, next) => {
  try {
    const summary = await attendanceService.getStudentSummary(req.user!.tenantId!, req.params.studentId);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// Grades
platformRouter.get('/academic/grades', isInstitutionAdmin, async (req, res, next) => {
  try {
    const { studentId, courseId } = req.query as any;
    const grades = await gradeService.list(req.user!.tenantId!, studentId, courseId);
    res.json({ success: true, data: grades });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/grades', isInstitutionAdmin, validate(recordGradeSchema), async (req, res, next) => {
  try {
    const grade = await gradeService.record(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: grade });
  } catch (err) { next(err); }
});

platformRouter.patch('/academic/grades/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const grade = await gradeService.update(req.params.id, req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: grade });
  } catch (err) { next(err); }
});

platformRouter.delete('/academic/grades/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const grade = await gradeService.delete(req.params.id, req.user!.tenantId!);
    res.json({ success: true, data: grade });
  } catch (err) { next(err); }
});

platformRouter.get('/academic/grades/transcript/:studentId', isInstitutionAdmin, async (req, res, next) => {
  try {
    const transcript = await gradeService.getStudentTranscript(req.user!.tenantId!, req.params.studentId);
    res.json({ success: true, data: transcript });
  } catch (err) { next(err); }
});

// Timetable
platformRouter.get('/academic/timetable', isInstitutionAdmin, async (req, res, next) => {
  try {
    const { classId } = req.query as any;
    const timetable = await timetableService.list(req.user!.tenantId!, classId);
    res.json({ success: true, data: timetable });
  } catch (err) { next(err); }
});

platformRouter.post('/academic/timetable', isInstitutionAdmin, validate(createTimetableSchema), async (req, res, next) => {
  try {
    const entry = await timetableService.create(req.user!.tenantId!, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
});

platformRouter.delete('/academic/timetable/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const entry = await timetableService.delete(req.params.id, req.user!.tenantId!);
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// =============================================================================
// CERTIFICATES
// =============================================================================
const issueCertificateSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  title: z.string().min(2).max(500).trim(),
  description: z.string().max(2000).optional(),
  recipientName: z.string().min(2).max(255).trim(),
  issuedBy: z.string().max(255).optional(),
  completionDate: z.string().optional(),
  score: z.number().optional(),
  credentialUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

// List certificates (scoped by role)
platformRouter.get('/certificates', isAuthenticated, async (req, res, next) => {
  try {
    const { courseId } = req.query as any;
    const certificates = await certificateService.list(
      req.user!.id,
      req.user!.role,
      req.user!.tenantId,
      courseId
    );
    res.json({ success: true, data: certificates });
  } catch (err) { next(err); }
});

// Get certificate
platformRouter.get('/certificates/:id', isAuthenticated, async (req, res, next) => {
  try {
    const certificate = await certificateService.getById(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.user!.tenantId
    );
    res.json({ success: true, data: certificate });
  } catch (err) { next(err); }
});

// Issue certificate (Super Admin + Institute Admin)
platformRouter.post('/certificates', isInstitutionAdmin, validate(issueCertificateSchema), async (req, res, next) => {
  try {
    const certificate = await certificateService.issue(
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.status(201).json({ success: true, data: certificate });
  } catch (err) { next(err); }
});

// Verify certificate (public)
platformRouter.get('/certificates/verify/:code', async (_req, res, next) => {
  try {
    const certificate = await certificateService.verify(_req.params.code);
    res.json({ success: true, data: certificate });
  } catch (err) { next(err); }
});

// Revoke certificate
platformRouter.post('/certificates/:id/revoke', isInstitutionAdmin, async (req, res, next) => {
  try {
    const result = await certificateService.revoke(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.user!.tenantId,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Course completion check
platformRouter.get('/certificates/completion/:courseId/:studentId', isInstitutionAdmin, async (req, res, next) => {
  try {
    const completion = await certificateService.getCourseCompletion(
      req.user!.tenantId!,
      req.params.studentId,
      req.params.courseId
    );
    res.json({ success: true, data: completion });
  } catch (err) { next(err); }
});

// =============================================================================
// CONTENT MANAGEMENT (Super Admin)
// =============================================================================
const createContentPageSchema = z.object({
  slug: z.string().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(500).trim(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  pageType: z.enum(['page', 'article', 'faq', 'banner', 'landing']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

const createBannerSchema = z.object({
  title: z.string().min(2).max(500).trim(),
  subtitle: z.string().max(500).optional(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  linkText: z.string().max(255).optional(),
  position: z.enum(['hero', 'top', 'bottom', 'sidebar', 'modal']).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

const createFaqSchema = z.object({
  question: z.string().min(2).max(500).trim(),
  answer: z.string().min(2),
  category: z.string().max(100).optional(),
  orderIndex: z.number().int().optional(),
});

const createHelpArticleSchema = z.object({
  slug: z.string().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(500).trim(),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
});

// Content pages
platformRouter.get('/super-admin/content/pages', isSuperAdmin, async (req, res, next) => {
  try {
    const { status, pageType, page, limit } = req.query as any;
    const result = await contentPageService.list(status, pageType, parseInt(page) || 1, parseInt(limit) || 20);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/content/pages', isSuperAdmin, validate(createContentPageSchema), async (req, res, next) => {
  try {
    const page = await contentPageService.create(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: page });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/content/pages/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const page = await contentPageService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/content/pages/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await contentPageService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Public: get published page by slug
platformRouter.get('/content/pages/:slug', async (req, res, next) => {
  try {
    const page = await contentPageService.getBySlug(req.params.slug);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
});

// Banners
platformRouter.get('/super-admin/content/banners', isSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await bannerService.listAll(parseInt(page) || 1, parseInt(limit) || 20);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/content/banners', isSuperAdmin, validate(createBannerSchema), async (req, res, next) => {
  try {
    const banner = await bannerService.create(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: banner });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/content/banners/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const banner = await bannerService.update(req.params.id, req.body, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/content/banners/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await bannerService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Public: active banners
platformRouter.get('/content/banners', async (_req, res, next) => {
  try {
    const banners = await bannerService.list();
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
});

// FAQ
platformRouter.get('/super-admin/content/faqs', isSuperAdmin, async (_req, res, next) => {
  try {
    const faqs = await faqService.listAll();
    res.json({ success: true, data: faqs });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/content/faqs', isSuperAdmin, validate(createFaqSchema), async (req, res, next) => {
  try {
    const faq = await faqService.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: faq });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/content/faqs/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const faq = await faqService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: faq });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/content/faqs/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await faqService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Public: FAQs
platformRouter.get('/content/faqs', async (_req, res, next) => {
  try {
    const faqs = await faqService.list();
    res.json({ success: true, data: faqs });
  } catch (err) { next(err); }
});

// Help articles
platformRouter.get('/super-admin/help-center', isSuperAdmin, async (_req, res, next) => {
  try {
    const articles = await helpArticleService.listAll();
    res.json({ success: true, data: articles });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/help-center', isSuperAdmin, validate(createHelpArticleSchema), async (req, res, next) => {
  try {
    const article = await helpArticleService.create(req.body, req.user!.id);
    res.status(201).json({ success: true, data: article });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/help-center/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const article = await helpArticleService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/help-center/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await helpArticleService.delete(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Public: help articles
platformRouter.get('/help-center', async (_req, res, next) => {
  try {
    const articles = await helpArticleService.list();
    res.json({ success: true, data: articles });
  } catch (err) { next(err); }
});

platformRouter.get('/help-center/:slug', async (req, res, next) => {
  try {
    const article = await helpArticleService.getBySlug(req.params.slug);
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

// Media assets
platformRouter.get('/super-admin/files', isSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await mediaAssetService.list(undefined, parseInt(page) || 1, parseInt(limit) || 20);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/files', isSuperAdmin, async (req, res, next) => {
  try {
    const asset = await mediaAssetService.create(
      null,
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.status(201).json({ success: true, data: asset });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/files/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await mediaAssetService.delete(req.params.id, null, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// CONFIGURATION (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/configuration', isSuperAdmin, async (_req, res, next) => {
  try {
    const config = await configurationService.getAll();
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/configuration/:key', isSuperAdmin, async (req, res, next) => {
  try {
    const config = await configurationService.getByKey(req.params.key);
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

platformRouter.put('/super-admin/configuration/:key', isSuperAdmin, async (req, res, next) => {
  try {
    const config = await configurationService.update(
      req.params.key,
      req.body.value,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

platformRouter.put('/super-admin/configuration', isSuperAdmin, async (req, res, next) => {
  try {
    const configs = req.body;
    const result = await configurationService.updateBulk(configs, req.user!.id, req.ip, (req as any).requestId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/configuration/history', isSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await configurationService.getHistory(parseInt(page) || 1, parseInt(limit) || 50);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Feature flags
platformRouter.get('/super-admin/feature-flags', isSuperAdmin, async (_req, res, next) => {
  try {
    const flags = await configurationService.getFeatureFlags();
    res.json({ success: true, data: flags });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/feature-flags/:key', isSuperAdmin, async (req, res, next) => {
  try {
    const flag = await configurationService.updateFeatureFlag(
      req.params.key,
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: flag });
  } catch (err) { next(err); }
});

// =============================================================================
// SEO (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/seo/settings', isSuperAdmin, async (_req, res, next) => {
  try {
    const settings = await seoService.getGlobalSettings();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

platformRouter.put('/super-admin/seo/settings', isSuperAdmin, async (req, res, next) => {
  try {
    const settings = await seoService.updateGlobalSettings(
      req.body,
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/seo/metadata/:entityType/:entityId', isSuperAdmin, async (req, res, next) => {
  try {
    const metadata = await seoService.getEntityMetadata(req.params.entityType, req.params.entityId);
    res.json({ success: true, data: metadata });
  } catch (err) { next(err); }
});

platformRouter.put('/super-admin/seo/metadata/:entityType/:entityId', isSuperAdmin, async (req, res, next) => {
  try {
    const metadata = await seoService.setEntityMetadata(
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

platformRouter.get('/super-admin/seo/redirects', isSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit } = req.query as any;
    const result = await seoService.getRedirects(parseInt(page) || 1, parseInt(limit) || 20);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/seo/redirects', isSuperAdmin, async (req, res, next) => {
  try {
    const redirect = await seoService.createRedirect(req.body, req.user!.id, req.ip, (req as any).requestId);
    res.status(201).json({ success: true, data: redirect });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/seo/redirects/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await seoService.deleteRedirect(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/seo/sitemap', isSuperAdmin, async (_req, res, next) => {
  try {
    const urls = await seoService.generateSitemap();
    res.json({ success: true, data: urls });
  } catch (err) { next(err); }
});

// =============================================================================
// LOGS & AUDIT (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/logs/audit', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await logsService.getAuditLogs(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/logs/application', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await logsService.getApplicationLogs(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/logs/activity', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await logsService.getActivityEvents(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/logs/auth', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await logsService.getAuthLogs(req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// =============================================================================
// NOTIFICATION TEMPLATES (Super Admin)
// User-facing notification endpoints are in notification.routes.ts
// =============================================================================
platformRouter.get('/super-admin/notifications/templates', isSuperAdmin, async (_req, res, next) => {
  try {
    const templates = await notificationService.getTemplates();
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/notifications/templates/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const template = await notificationService.updateTemplate(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

// =============================================================================
// CROSS-INSTITUTE STUDENT MANAGEMENT (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/students', isSuperAdmin, async (req, res, next) => {
  try {
    const { search, tenantId, page, limit } = req.query as any;
    const result = await superAdminStudentsService.listStudents({
      search: search as string,
      tenantId: tenantId as string,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/students/:id/verify', isSuperAdmin, async (req, res, next) => {
  try {
    const { isVerified = true } = req.body;
    const result = await superAdminStudentsService.verifyStudent(
      req.params.id,
      Boolean(isVerified),
      req.user!.id,
      req.ip,
      (req as any).requestId
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.get('/super-admin/students/export', isSuperAdmin, async (req, res, next) => {
  try {
    const { tenantId } = req.query as any;
    const records = await superAdminStudentsService.exportStudents(tenantId as string);
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
});

// =============================================================================
// APPROVALS HUB (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/approvals', isSuperAdmin, async (_req, res, next) => {
  try {
    const result = await superAdminApprovalsService.getPendingApprovals();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// SECURITY & COMPLIANCE (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/security/overview', isSuperAdmin, async (_req, res, next) => {
  try {
    const result = await superAdminSecurityService.getOverview();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/security/sessions/:id/revoke', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await superAdminSecurityService.revokeSession(req.params.id, req.user!.id, req.ip);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/security/users/:id/unlock', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await superAdminSecurityService.unlockUser(req.params.id, req.user!.id, req.ip);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// BILLING & SUBSCRIPTIONS (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/billing/overview', isSuperAdmin, async (_req, res, next) => {
  try {
    const result = await superAdminBillingService.getOverview();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/billing/institutes/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const { plan, maxStudents } = req.body;
    if (!plan || !maxStudents) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Plan and maxStudents are required');
    }
    const result = await superAdminBillingService.updateInstitutePlan(
      req.params.id,
      plan,
      parseInt(maxStudents),
      req.user!.id,
      req.ip
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// PLATFORM-WIDE INCIDENT MANAGEMENT (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/incidents', isSuperAdmin, async (req, res, next) => {
  try {
    const { status, severity, page, limit } = req.query as any;
    const result = await superAdminIncidentsService.list(
      status as string,
      severity as string,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/incidents', isSuperAdmin, async (req, res, next) => {
  try {
    const { title, severity = 'medium', summary, affectedServices = [], mitigationSteps } = req.body;
    if (!title || !summary) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title and summary are required');
    }
    const result = await superAdminIncidentsService.create({
      title,
      severity,
      summary,
      affectedServices: Array.isArray(affectedServices) ? affectedServices : [affectedServices],
      mitigationSteps,
      userId: req.user!.id,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.patch('/super-admin/incidents/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await superAdminIncidentsService.update(
      req.params.id,
      req.body,
      req.user!.id,
      req.ip
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/incidents/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await superAdminIncidentsService.delete(req.params.id, req.user!.id, req.ip);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// INTEGRATIONS & APIS (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/integrations/overview', isSuperAdmin, async (_req, res, next) => {
  try {
    const result = await superAdminIntegrationsService.getOverview();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/integrations/api-keys', isSuperAdmin, async (req, res, next) => {
  try {
    const { name, scopes = ['read'] } = req.body;
    if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'API key name is required');
    const result = await superAdminIntegrationsService.createApiKey(
      name,
      Array.isArray(scopes) ? scopes : [scopes],
      req.user!.id,
      req.ip
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/integrations/api-keys/:id', isSuperAdmin, async (req, res, next) => {
  try {
    const result = await superAdminIntegrationsService.revokeApiKey(req.params.id, req.user!.id, req.ip);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// BACKUP & RECOVERY (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/backup/status', isSuperAdmin, async (_req, res, next) => {
  try {
    const result = await superAdminBackupService.getStatus();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

platformRouter.post('/super-admin/backup/trigger', isSuperAdmin, async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await superAdminBackupService.triggerBackup(req.user!.id, notes, req.ip);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// NOTIFICATIONS BROADCAST (Super Admin)
// =============================================================================
platformRouter.post('/super-admin/notifications/broadcast', isSuperAdmin, async (req, res, next) => {
  try {
    const { targetAudience = 'all', title, message, actionUrl } = req.body;
    if (!title || !message) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title and message are required');
    }
    const result = await superAdminNotificationsService.broadcast({
      targetAudience,
      title,
      message,
      actionUrl,
      userId: req.user!.id,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// SYSTEM MONITORING & HEALTH (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/system/health', isSuperAdmin, async (_req, res, next) => {
  try {
    const result = await superAdminMonitoringService.getHealth();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// =============================================================================
// FEEDBACK & REVIEWS (Super Admin)
// =============================================================================
platformRouter.get('/super-admin/feedback', isSuperAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [reviews, count] = await Promise.all([
      pool.query(
        `SELECT cr.id, cr.course_id, cr.student_id, cr.rating, cr.review, cr.created_at,
                u.name AS student_name, u.email AS student_email,
                c.title AS course_title
         FROM course_ratings cr
         JOIN users u ON u.id = cr.student_id
         JOIN courses c ON c.id = cr.course_id
         ORDER BY cr.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ).catch(() => ({ rows: [] })),
      pool.query(`SELECT COUNT(*)::int AS total FROM course_ratings`).catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    const total = count.rows[0]?.total || 0;
    res.json({
      success: true,
      data: reviews.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
});

platformRouter.delete('/super-admin/feedback/:id', isSuperAdmin, async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM course_ratings WHERE id = $1`, [req.params.id]);
    await writeAuditLog({
      userId: req.user!.id,
      action: 'feedback.delete',
      resourceType: 'course_rating',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    res.json({ success: true, data: { message: 'Review removed' } });
  } catch (err) { next(err); }
});


// =============================================================================
// PUBLIC ENDPOINTS (no auth required)
// =============================================================================
// Certificate verification (public)
platformRouter.get('/verify-certificate/:code', async (req, res, next) => {
  try {
    const certificate = await certificateService.verify(req.params.code);
    res.json({ success: true, data: certificate });
  } catch (err) { next(err); }
});

export default platformRouter;
