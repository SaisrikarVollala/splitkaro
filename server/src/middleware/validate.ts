import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';

/**
 * Wraps async Express handlers to catch any errors and forward them to the next middleware.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Express error handler that converts ZodErrors to a standard 400 JSON response format.
 */
export const zodErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (err instanceof z.ZodError) {
    const errorMsg = err.errors[0]?.message || 'Validation failed';
    const issues = err.errors.map(e => ({
      path: e.path.map(String).join('.'),
      message: e.message
    }));
    return res.status(400).json({
      error: errorMsg,
      issues
    });
  }
  next(err);
};
