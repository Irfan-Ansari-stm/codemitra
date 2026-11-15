import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { authRouter } from './routes/auth.routes';
import { tenantRouter } from './routes/tenant.routes';
import { instituteApplicationRouter } from './routes/institute-application.routes';
import { userRouter } from './routes/user.routes';
import { roleRouter } from './routes/role.routes';
import { permissionRouter } from './routes/permission.routes';
import { superAdminDashboardRouter } from './routes/super-admin-dashboard.routes';
import { courseRouter, courseCompatRouter } from './routes/course.routes';
import { problemRouter } from './routes/problem.routes';
import { submissionRouter } from './routes/submission.routes';
import { executionRouter } from './routes/execution.routes';
import { ideRouter } from './routes/ide.routes';
import { assignmentRouter, assignmentCompatRouter } from './routes/assignment.routes';
import { quizRouter, quizCompatRouter } from './routes/quiz.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { blogRouter } from './routes/blog.routes';
import { newsletterRouter } from './routes/newsletter.routes';
import { notificationRouter, announcementRouter } from './routes/notification.routes';
import { batchRouter } from './routes/batch.routes';
import { approvalsRouter } from './routes/approvals.routes';
import { supportRouter } from './routes/support.routes';
import { contentRouter, publicContentRouter } from './routes/content.routes';
import { seoRouter, publicSeoRouter } from './routes/seo.routes';
import { helpCenterRouter, publicHelpCenterRouter } from './routes/help-center.routes';
import { communityRouter } from './routes/community.routes';
import { blogAdminRouter } from './routes/blog-admin.routes';
import {
  monitoringRouter,
  executionAdminRouter,
  securityAdminRouter,
  logsAdminRouter,
  integrationsAdminRouter,
} from './routes/system-security.routes';
import { publicRouter } from './routes/public.routes';
import { platformRouter } from './routes/platform.routes';
import { globalRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(compression());
  app.use(cookieParser());

  // ── Request ID ────────────────────────────────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).requestId = crypto.randomUUID();
    next();
  });

  // ── Global rate limiter ───────────────────────────────────────────────────
  app.use('/api', globalRateLimiter);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  app.get('/readyz', async (_req, res) => {
    try {
      const { pool } = await import('./db');
      await pool.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/tenants/applications', instituteApplicationRouter);
  app.use('/api/v1/tenants', tenantRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/roles', roleRouter);
  app.use('/api/v1/permissions', permissionRouter);
  app.use('/api/v1/super-admin/roles', roleRouter);
  app.use('/api/v1/super-admin/permissions', permissionRouter);
  app.use('/api/v1/super-admin/institutions', tenantRouter);
  app.use('/api/v1/super-admin/institution-applications', instituteApplicationRouter);
  app.use('/api/v1/super-admin/users', userRouter);
  app.use('/api/v1/super-admin/batches', batchRouter);
  app.use('/api/v1/batches', batchRouter);
  app.use('/api/v1/super-admin/approvals', approvalsRouter);
  app.use('/api/v1/super-admin/support', supportRouter);
  app.use('/api/v1/super-admin/content', contentRouter);
  app.use('/api/v1/super-admin/seo', seoRouter);
  app.use('/api/v1/super-admin/help-center', helpCenterRouter);
  app.use('/api/v1/super-admin/community', communityRouter);
  app.use('/api/v1/super-admin/blog', blogAdminRouter);
  app.use('/api/v1/super-admin/monitoring', monitoringRouter);
  app.use('/api/v1/super-admin/execution', executionAdminRouter);
  app.use('/api/v1/super-admin/security', securityAdminRouter);
  app.use('/api/v1/super-admin/logs', logsAdminRouter);
  app.use('/api/v1/super-admin/integrations', integrationsAdminRouter);
  app.use('/api/v1/super-admin', superAdminDashboardRouter);
  app.use('/api/v1/courses', courseRouter);
  app.use('/api/v1', courseCompatRouter);
  app.use('/api/v1/problems', problemRouter);
  app.use('/api/v1/submissions', submissionRouter);
  app.use('/api/v1/execution', executionRouter);
  app.use('/api/v1/ide', ideRouter);
  app.use('/api/v1/assignments', assignmentRouter);
  app.use('/api/v1', assignmentCompatRouter);
  app.use('/api/v1/quizzes', quizRouter);
  app.use('/api/v1', quizCompatRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/blog', blogRouter);
  app.use('/api/v1/content', publicContentRouter);
  app.use('/api/v1/help-center', publicHelpCenterRouter);
  app.use('/api/v1/community', communityRouter);
  app.use('/api/v1/seo', publicSeoRouter);
  app.use('/sitemap.xml', publicSeoRouter);
  app.use('/robots.txt', publicSeoRouter);
  app.use('/api/v1/newsletter', newsletterRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/announcements', announcementRouter);
  app.use('/api/v1/public', publicRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/v1', platformRouter);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

export const app = createApp();
