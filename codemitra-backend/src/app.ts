import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { authRouter } from './routes/auth.routes';
import { tenantRouter } from './routes/tenant.routes';
import { userRouter } from './routes/user.routes';
import { courseRouter, courseCompatRouter } from './routes/course.routes';
import { problemRouter } from './routes/problem.routes';
import { submissionRouter } from './routes/submission.routes';
import { assignmentRouter, assignmentCompatRouter } from './routes/assignment.routes';
import { quizRouter, quizCompatRouter } from './routes/quiz.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { blogRouter } from './routes/blog.routes';
import { notificationRouter, announcementRouter } from './routes/notification.routes';
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
  app.use('/api/v1/tenants', tenantRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/courses', courseRouter);
  app.use('/api/v1', courseCompatRouter);
  app.use('/api/v1/problems', problemRouter);
  app.use('/api/v1/submissions', submissionRouter);
  app.use('/api/v1/assignments', assignmentRouter);
  app.use('/api/v1', assignmentCompatRouter);
  app.use('/api/v1/quizzes', quizRouter);
  app.use('/api/v1', quizCompatRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/blog', blogRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/announcements', announcementRouter);

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
