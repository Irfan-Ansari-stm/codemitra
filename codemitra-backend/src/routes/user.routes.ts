import { Router } from 'express';
import { userService } from '../services/user.service';
import { requireAuth } from '../middleware/auth';
import { isInstitutionAdmin, isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, userListQuerySchema } from '../validators';
import { AppError } from '../middleware/errorHandler';
import { randomBytes } from 'crypto';

export const userRouter = Router();
userRouter.use(requireAuth);

// GET /api/v1/users — list users in tenant (admin only)
userRouter.get(
  '/',
  isInstitutionAdmin,
  validate(userListQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.role === 'super_admin' ? undefined : req.user!.tenantId || undefined;
      if (req.user!.role !== 'super_admin' && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
      const { page, limit } = req.query as any;
      const role = req.query.role as string | undefined;
      const result = await userService.list(tenantId, page, limit, role, req.query.search as string | undefined);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/users/profile — own profile
userRouter.get('/profile', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

userRouter.get('/me', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

userRouter.patch('/me', validate(updateUserSchema), async (req, res, next) => {
  try {
    const user = await userService.update(req.user!.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id
userRouter.get('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
      const user = await userService.getById(
        req.params.id,
        req.user!.role === 'super_admin' ? undefined : req.user!.tenantId,
        req.user!.role === 'institution_admin'
      );
      res.json({ success: true, data: { ...user, totalProblemsSolved: user.total_problems_solved } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users — create institution user (admin only)
userRouter.post(
  '/',
  isSuperAdmin,
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.body.tenantId ?? null;
      if (req.body.role !== 'general_student' && !tenantId) {
        throw new AppError(400, 'TENANT_REQUIRED', 'Institution users must belong to an institution');
      }
      if (req.body.role === 'general_student' && tenantId) {
        throw new AppError(400, 'INVALID_TENANT', 'General users cannot be assigned to an institution');
      }
      const user = await userService.createInstitutionUser({
        ...req.body,
        tenantId,
      });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

userRouter.post('/:id/reset-password', isInstitutionAdmin, async (req, res, next) => {
  try {
    const isSuperAdmin = req.user!.role === 'super_admin';
    const tenantId = isSuperAdmin ? undefined : req.user!.tenantId || undefined;
    if (!isSuperAdmin && !tenantId) throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    if (typeof req.body?.newPassword !== 'string' || req.body.newPassword.length < 8 || req.body.newPassword.length > 128) {
      throw new AppError(400, 'VALIDATION_ERROR', 'newPassword must be 8 to 128 characters');
    }
    await userService.resetPassword(req.params.id, tenantId, req.body.newPassword, !isSuperAdmin);
    res.json({ success: true, data: { message: 'Password reset successfully' } });
  } catch (err) { next(err); }
});

function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { cells.push(value.trim()); value = ''; }
    else value += ch;
  }
  cells.push(value.trim());
  return cells;
}

userRouter.post('/bulk-import', isSuperAdmin, async (req, res, next) => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new AppError(400, 'TENANT_REQUIRED', 'A valid institution tenantId is required');
    }
    const contentType = req.headers['content-type'] || '';
    const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    if (!boundary) throw new AppError(400, 'VALIDATION_ERROR', 'Upload a CSV file in the file field');
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > 2 * 1024 * 1024) throw new AppError(413, 'UPLOAD_TOO_LARGE', 'CSV file must be 2 MB or smaller');
      chunks.push(buffer);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    const marker = /name="file"[^\r\n]*\r\n(?:[^\r\n]*\r\n)*\r\n([\s\S]*?)\r\n--/i.exec(raw);
    if (!marker) throw new AppError(400, 'VALIDATION_ERROR', 'CSV file field is missing');
    const lines = marker[1].replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new AppError(400, 'VALIDATION_ERROR', 'CSV must include a header and at least one student');
    const headers = parseCsvRow(lines[0]).map((v) => v.toLowerCase());
    const emailIndex = headers.indexOf('email');
    const nameIndex = headers.indexOf('name');
    if (emailIndex < 0 || nameIndex < 0) throw new AppError(400, 'VALIDATION_ERROR', 'CSV headers must include email and name');
    const created: unknown[] = [];
    const errors: { row: number; message: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvRow(lines[i]);
      const email = values[emailIndex]?.trim().toLowerCase();
      const name = values[nameIndex]?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
        errors.push({ row: i + 1, message: 'Valid email and name are required' });
        continue;
      }
      const metadata: Record<string, string> = {};
      for (const field of ['enrollment_number', 'batch', 'department']) {
        const index = headers.indexOf(field);
        if (index >= 0 && values[index]) metadata[field] = values[index];
      }
      try {
        created.push(await userService.createInstitutionUser({ tenantId, email, name,
          password: randomBytes(24).toString('base64url'), role: 'institution_student', metadata }));
      } catch (err: any) {
        if (err.code === '23505') errors.push({ row: i + 1, message: 'Email already exists' });
        else throw err;
      }
    }
    res.status(201).json({ success: true, data: { imported: created.length, failed: errors.length, students: created, errors, passwordResetRequired: true } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/:id — update user
userRouter.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    // Users can only update themselves; admins can update anyone in tenant
    if (
      req.user!.id !== req.params.id &&
      !['super_admin', 'institution_admin'].includes(req.user!.role)
    ) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot update another user');
    }
    const isInstitutionAdminUpdatingStudent =
      req.user!.role === 'institution_admin' && req.user!.id !== req.params.id;
    const tenantId = isInstitutionAdminUpdatingStudent ? req.user!.tenantId : undefined;
    if (isInstitutionAdminUpdatingStudent && !tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    }
    const user = await userService.update(
      req.params.id,
      req.body,
      tenantId,
      isInstitutionAdminUpdatingStudent
    );
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/:id — soft delete (admin only)
userRouter.delete('/:id', isInstitutionAdmin, async (req, res, next) => {
  try {
    const isInstitutionAdmin = req.user!.role === 'institution_admin';
    const tenantId = isInstitutionAdmin ? req.user!.tenantId : undefined;
    if (isInstitutionAdmin && !tenantId) {
      throw new AppError(400, 'TENANT_REQUIRED', 'Tenant context required');
    }
    await userService.softDelete(req.params.id, tenantId, isInstitutionAdmin);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    next(err);
  }
});
