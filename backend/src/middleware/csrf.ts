/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection for all state-changing operations
 * 
 * Features:
 * - Double-submit cookie pattern
 * - Token generation and validation
 * - Stateless implementation (no server-side storage)
 * - Configurable token expiration
 * - Support for AJAX and form submissions
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface CsrfConfig {
  tokenLength: number;
  tokenExpiry: number; // in milliseconds
  cookieName: string;
  headerName: string;
  excludedPaths: string[];
  secureCookie: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

const defaultConfig: CsrfConfig = {
  tokenLength: 32,
  tokenExpiry: 3600000, // 1 hour
  cookieName: 'XSRF-TOKEN',
  headerName: 'X-XSRF-TOKEN',
  excludedPaths: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/health',
    '/metrics'
  ],
  secureCookie: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create a signed token with timestamp
 */
function createSignedToken(token: string, secret: string): string {
  const timestamp = Date.now();
  const payload = `${token}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `${payload}.${signature}`;
}

/**
 * Verify a signed token
 */
function verifySignedToken(
  signedToken: string,
  secret: string,
  maxAge: number
): { valid: boolean; token?: string; error?: string } {
  try {
    const parts = signedToken.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [token, timestampStr, signature] = parts;
    
    if (!token || !timestampStr || !signature) {
      return { valid: false, error: 'Missing token components' };
    }
    
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      return { valid: false, error: 'Invalid timestamp' };
    }

    // Check if token has expired
    if (Date.now() - timestamp > maxAge) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify signature
    const payload = `${token}.${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, token: token };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * CSRF Protection Middleware Factory
 */
export function csrfProtection(config: Partial<CsrfConfig> = {}) {
  const finalConfig: CsrfConfig = { ...defaultConfig, ...config };
  const csrfSecret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

  if (!process.env.CSRF_SECRET) {
    logger.warn('CSRF_SECRET not set in environment variables. Using generated secret (not recommended for production)');
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF protection for excluded paths
    if (finalConfig.excludedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip CSRF protection for safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // For GET requests, generate and set new token if not exists
      const existingToken = req.cookies?.[finalConfig.cookieName];
      
      if (!existingToken) {
        const token = generateToken(finalConfig.tokenLength);
        const signedToken = createSignedToken(token, csrfSecret);
        
        res.cookie(finalConfig.cookieName, signedToken, {
          httpOnly: false, // Must be accessible to JavaScript
          secure: finalConfig.secureCookie,
          sameSite: finalConfig.sameSite,
          maxAge: finalConfig.tokenExpiry,
          path: '/'
        });

        // Also set the token in response header for AJAX requests
        res.setHeader(finalConfig.headerName, token);
      }

      return next();
    }

    // For state-changing methods, validate CSRF token
    const cookieToken = req.cookies?.[finalConfig.cookieName];
    const headerToken = req.headers?.[finalConfig.headerName.toLowerCase()] as string;
    const bodyToken = req.body?._csrf;

    if (!cookieToken) {
      logger.warn('CSRF token missing from cookie', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token not found. Please refresh the page and try again.'
      });
    }

    if (!headerToken && !bodyToken) {
      logger.warn('CSRF token missing from request', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token not provided in request.'
      });
    }

    // Verify the cookie token
    const cookieVerification = verifySignedToken(
      cookieToken,
      csrfSecret,
      finalConfig.tokenExpiry
    );

    if (!cookieVerification.valid) {
      logger.warn('Invalid CSRF cookie token', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        error: cookieVerification.error
      });
      return res.status(403).json({
        error: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or expired CSRF token. Please refresh the page and try again.'
      });
    }

    // Compare tokens (double-submit cookie pattern)
    const requestToken = headerToken || bodyToken;
    if (cookieVerification.token !== requestToken) {
      logger.warn('CSRF token mismatch', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'CSRF_TOKEN_MISMATCH',
        message: 'CSRF token validation failed. Please refresh the page and try again.'
      });
    }

    // Token is valid, proceed with request
    logger.debug('CSRF token validated successfully', {
      method: req.method,
      path: req.path
    });

    next();
  };
}

/**
 * Middleware to generate and send CSRF token
 */
export function generateCsrfToken(config: Partial<CsrfConfig> = {}) {
  const finalConfig: CsrfConfig = { ...defaultConfig, ...config };
  const csrfSecret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

  return (req: Request, res: Response, next: NextFunction) => {
    const token = generateToken(finalConfig.tokenLength);
    const signedToken = createSignedToken(token, csrfSecret);
    
    res.cookie(finalConfig.cookieName, signedToken, {
      httpOnly: false,
      secure: finalConfig.secureCookie,
      sameSite: finalConfig.sameSite,
      maxAge: finalConfig.tokenExpiry,
      path: '/'
    });

    // Attach token to request for use in templates/responses
    (req as any).csrfToken = () => token;
    
    next();
  };
}

/**
 * Get CSRF token endpoint for AJAX requests
 */
export function getCsrfTokenEndpoint(req: Request, res: Response): Response {
  const csrfToken = (req as any).csrfToken?.();
  
  if (!csrfToken) {
    return res.status(500).json({
      error: 'CSRF_TOKEN_GENERATION_FAILED',
      message: 'Failed to generate CSRF token'
    });
  }

  return res.json({
    csrfToken,
    expiresIn: defaultConfig.tokenExpiry
  });
}

/**
 * Express app configuration for CSRF protection
 */
export const csrfConfig = {
  middleware: csrfProtection,
  generator: generateCsrfToken,
  endpoint: getCsrfTokenEndpoint,
  defaultConfig
};

export default csrfProtection;
