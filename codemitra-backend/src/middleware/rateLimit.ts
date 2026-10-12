import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Global API rate limit — 300 req/min per user or IP
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id || req.ip || 'anon',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Retry after 1 minute.' },
  },
});

// Strict limit for auth endpoints — prevents brute force
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => req.ip || 'anon',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Retry after 15 minutes.' },
  },
});

// Code submission rate limit — prevents Judge0 abuse
export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: (req: Request) => req.user?.id || req.ip || 'anon',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Submission rate limit exceeded.' },
  },
});

// Newsletter subscription rate limit — prevents list bombing
export const newsletterRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => req.ip || 'anon',
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many subscription attempts. Retry after a minute.',
    },
  },
});
