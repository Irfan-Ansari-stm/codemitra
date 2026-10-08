import { Router } from 'express';
import { authService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { writeAuditLog } from '../utils/audit';
import { AppError } from '../middleware/errorHandler';
import { loginSchema, registerSchema, changePasswordSchema } from '../validators';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(
        email,
        password,
        req.ip || '',
        req.headers['user-agent'] || ''
      );
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
      });
      res.json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/register
authRouter.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const user = await authService.register(
        req.body.email,
        req.body.password,
        req.body.name
      );
      res.status(201).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Refresh token required');
    const result = await authService.refresh(token, req.ip || '');
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/auth/change-password
authRouter.patch(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  async (req, res, next) => {
    try {
      await authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      await writeAuditLog({
        userId: req.user!.id,
        action: 'user.password_change',
        requestId: (req as any).requestId,
      });
      res.json({
        success: true,
        data: { message: 'Password changed. Please log in again.' },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await import('../services/user.service').then((m) =>
      m.userService.getProfile(req.user!.id)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
