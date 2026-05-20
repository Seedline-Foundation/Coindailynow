/**
 * BE-2-4: Zod validation middleware for REST routes.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: e.errors.map((x) => ({ path: x.path.join('.'), message: x.message })),
        });
        return;
      }
      next(e);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      (req as any).validatedQuery = schema.parse(req.query);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        res.status(400).json({ success: false, error: 'Invalid query', details: e.errors });
        return;
      }
      next(e);
    }
  };
}
