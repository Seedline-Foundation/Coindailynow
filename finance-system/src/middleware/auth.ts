import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auditService } from '../services/AuditService';

const JWT_SECRET = process.env.CFIS_JWT_SECRET || 'cfis-super-secret-key-change-in-production';
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'admin@coindaily.online').split(',');

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN';
  };
}

/**
 * CFIS Auth Middleware
 * ONLY Super Admins can access CFIS.
 * No other roles are permitted.
 */
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication required. Super Admin access only.' } });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Super Admin access only.' } });
      return;
    }
    if (!SUPER_ADMIN_EMAILS.includes(payload.email)) {
      res.status(403).json({ error: { code: 'UNAUTHORIZED_ADMIN', message: 'Email not authorized.' } });
      return;
    }

    req.admin = {
      id: payload.id,
      email: payload.email,
      role: 'SUPER_ADMIN'
    };
    next();
  } catch (error) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
  }
}

/**
 * Login endpoint handler — generates JWT for Super Admin
 */
export async function loginSuperAdmin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  // In production: hash check against DB, MFA, hardware key, etc.
  const ADMIN_PASSWORD = process.env.CFIS_ADMIN_PASSWORD || 'cfis-admin-2026';

  if (!SUPER_ADMIN_EMAILS.includes(email)) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    // Log failed attempt (non-blocking, tolerates DB offline)
    auditService.log({
      action: 'FAILED_LOGIN',
      actor: email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }).catch(() => {});
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    return;
  }

  const token = jwt.sign(
    { id: 'super-admin-1', email, role: 'SUPER_ADMIN' },
    JWT_SECRET,
    { expiresIn: '4h' }
  );

  // Log success (non-blocking, tolerates DB offline)
  auditService.log({
    action: 'SUPER_ADMIN_LOGIN',
    actor: email,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  }).catch(() => {});

  res.json({
    data: {
      token,
      expiresIn: '4h',
      admin: { email, role: 'SUPER_ADMIN' }
    }
  });
}

/**
 * HMAC signature verification for internal service-to-service calls
 */
export function verifyInternalHMAC(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-cfis-signature'] as string;
  const timestamp = req.headers['x-cfis-timestamp'] as string;

  if (!signature || !timestamp) {
    res.status(401).json({ error: { code: 'HMAC_REQUIRED', message: 'Internal HMAC signature required.' } });
    return;
  }

  // Check replay (30-second window)
  const now = Math.floor(Date.now() / 1000);
  const reqTime = parseInt(timestamp);
  if (Math.abs(now - reqTime) > 30) {
    res.status(401).json({ error: { code: 'REPLAY_DETECTED', message: 'Request timestamp too old.' } });
    return;
  }

  const crypto = require('crypto');
  const hmacSecret = process.env.CFIS_HMAC_SECRET || 'cfis-hmac-secret';
  const body = JSON.stringify(req.body);
  const expectedSig = crypto.createHmac('sha256', hmacSecret).update(`${timestamp}.${body}`).digest('hex');

  if (signature !== expectedSig) {
    res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'HMAC signature mismatch.' } });
    return;
  }

  next();
}
