/**
 * Input Validation and Sanitization Middleware
 * Protects against XSS, SQL injection, and other injection attacks
 * 
 * Features:
 * - HTML sanitization
 * - SQL injection prevention
 * - NoSQL injection prevention
 * - Path traversal prevention
 * - Command injection prevention
 * - Schema-based validation (Zod)
 * - File upload validation
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../utils/logger';

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string, allowedTags?: string[]): string {
  const config = allowedTags ? {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  } : {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  };

  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any, allowHtml = false): any {
  if (typeof obj === 'string') {
    return allowHtml ? sanitizeHtml(obj) : obj.trim();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowHtml));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, allowHtml);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate against SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /('|";|";--)/g,
    /(xp_|sp_|exec\s+)/gi
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate against NoSQL injection patterns
 */
export function detectNoSQLInjection(input: any): boolean {
  if (typeof input === 'string') {
    return /\$where|\$ne|\$gt|\$lt|\$regex|\$in/.test(input);
  }

  if (typeof input === 'object' && input !== null) {
    const str = JSON.stringify(input);
    return /\$where|\$ne|\$gt|\$lt|\$regex|\$in/.test(str);
  }

  return false;
}

/**
 * Validate against path traversal attacks
 */
export function detectPathTraversal(input: string): boolean {
  const pathTraversalPatterns = [
    /\.\.[\/\\]/,
    /\.\.[\\\/]/,
    /%2e%2e[\/\\]/i,
    /\.\.%2f/i,
    /\.\.%5c/i
  ];

  return pathTraversalPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate against command injection
 */
export function detectCommandInjection(input: string): boolean {
  const commandPatterns = [
    /[;&|`$(){}[\]<>]/,
    /\n|\r/,
    /\\\\/
  ];

  return commandPatterns.some(pattern => pattern.test(input));
}

/**
 * Schema validation middleware factory
 */
export function validateSchema(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', {
          path: req.path,
          errors: error.errors,
          body: req.body
        });

        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      logger.error('Validation error', { error });
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Validation failed'
      });
      return;
    }
  };
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(options: {
  allowHtml?: boolean;
  checkSQLInjection?: boolean;
  checkNoSQLInjection?: boolean;
  checkPathTraversal?: boolean;
  checkCommandInjection?: boolean;
} = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    allowHtml = false,
    checkSQLInjection = true,
    checkNoSQLInjection = true,
    checkPathTraversal = true,
    checkCommandInjection = true
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check query parameters
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          if (checkSQLInjection && detectSQLInjection(value)) {
            logger.warn('SQL injection attempt detected', {
              path: req.path,
              key,
              value,
              ip: req.ip
            });
            res.status(400).json({
              error: 'INVALID_INPUT',
              message: 'Invalid characters detected in input'
            });
            return;
          }

          if (checkPathTraversal && detectPathTraversal(value)) {
            logger.warn('Path traversal attempt detected', {
              path: req.path,
              key,
              value,
              ip: req.ip
            });
            res.status(400).json({
              error: 'INVALID_INPUT',
              message: 'Invalid path detected'
            });
            return;
          }

          if (checkCommandInjection && detectCommandInjection(value)) {
            logger.warn('Command injection attempt detected', {
              path: req.path,
              key,
              value,
              ip: req.ip
            });
            res.status(400).json({
              error: 'INVALID_INPUT',
              message: 'Invalid characters detected'
            });
            return;
          }
        }
      }

      // Check and sanitize body
      if (req.body && typeof req.body === 'object') {
        if (checkNoSQLInjection && detectNoSQLInjection(req.body)) {
          logger.warn('NoSQL injection attempt detected', {
            path: req.path,
            body: req.body,
            ip: req.ip
          });
          res.status(400).json({
            error: 'INVALID_INPUT',
            message: 'Invalid input detected'
          });
          return;
        }

        // Sanitize body
        req.body = sanitizeObject(req.body, allowHtml);
      }

      next();
    } catch (error) {
      logger.error('Input sanitization error', { error });
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Input processing failed'
      });
      return;
    }
  };
}

/**
 * File upload validation
 */
export function validateFileUpload(options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  maxFiles?: number;
} = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxFiles = 5
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const files = (req as any).files;

    if (!files) {
      return next();
    }

    const fileArray = Array.isArray(files) ? files : Object.values(files).flat();

    if (fileArray.length > maxFiles) {
      return res.status(400).json({
        error: 'TOO_MANY_FILES',
        message: `Maximum ${maxFiles} files allowed`
      });
    }

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: `File ${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`
        });
      }

      // Check mime type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: `File type ${file.mimetype} not allowed`
        });
      }

      // Check file extension
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          error: 'INVALID_FILE_EXTENSION',
          message: `File extension ${ext} not allowed`
        });
      }

      // Check for malicious file names
      if (detectPathTraversal(file.name)) {
        logger.warn('Malicious file name detected', {
          fileName: file.name,
          ip: req.ip
        });
        return res.status(400).json({
          error: 'INVALID_FILE_NAME',
          message: 'Invalid file name'
        });
      }
    }

    next();
  };
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  ),
  username: z.string().min(3).max(30).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores and hyphens'
  ),
  url: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'Only HTTP and HTTPS URLs are allowed'
  ),
  uuid: z.string().uuid(),
  phoneNumber: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format'
  ),
  safeString: z.string().max(1000).refine(
    (str) => !detectSQLInjection(str) && !detectCommandInjection(str),
    'Invalid characters detected'
  ),
  htmlContent: z.string().max(50000).transform((str) => sanitizeHtml(str, [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'
  ]))
};

export default {
  sanitizeHtml,
  sanitizeObject,
  sanitizeInput,
  validateSchema,
  validateFileUpload,
  detectSQLInjection,
  detectNoSQLInjection,
  detectPathTraversal,
  detectCommandInjection,
  commonSchemas
};
