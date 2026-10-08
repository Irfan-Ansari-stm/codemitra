import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[${(req as any).requestId}] Unhandled error:`, err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: `${field} already exists` },
    });
    return;
  }

  // PostgreSQL check violation
  if (err.code === '23514') {
    res.status(400).json({
      success: false,
      error: { code: 'CONSTRAINT_VIOLATION', message: err.message },
    });
    return;
  }

  // PostgreSQL FK violation
  if (err.code === '23503') {
    res.status(400).json({
      success: false,
      error: { code: 'REFERENCE_ERROR', message: 'Referenced resource not found' },
    });
    return;
  }

  // Known AppError
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Fallback 500
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      requestId: (req as any).requestId,
    },
  });
}

/**
 * Custom AppError — throw this from services to send structured HTTP errors.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
