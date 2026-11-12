import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { paginationSchema, createInstituteApplicationSchema, reviewInstituteApplicationSchema } from '../validators';
import { instituteApplicationService } from '../services/institute-application.service';

export const instituteApplicationRouter = Router();
instituteApplicationRouter.use(requireAuth);

const applicationListSchema = paginationSchema.extend({ status: z.enum(['pending', 'approved', 'rejected']).optional() });

instituteApplicationRouter.post('/', validate(createInstituteApplicationSchema), async (req, res, next) => {
  try {
    const application = await instituteApplicationService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: application });
  } catch (error) { next(error); }
});

instituteApplicationRouter.get('/', isSuperAdmin, validate(applicationListSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, status } = req.query as unknown as z.infer<typeof applicationListSchema>;
    const result = await instituteApplicationService.list(page, limit, status);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

instituteApplicationRouter.patch('/:id', isSuperAdmin, validate(reviewInstituteApplicationSchema), async (req, res, next) => {
  try {
    const application = await instituteApplicationService.review(
      req.params.id, req.user!.id, req.body.decision, req.body.reviewNote,
      (req as any).requestId
    );
    res.json({ success: true, data: application });
  } catch (error) { next(error); }
});
