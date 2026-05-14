import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auditService } from '../services/AuditService';
import { adminService } from '../services/AdminService';

const JWT_SECRET = process.env.CFIS_JWT_SECRET || 'cfis-super-secret-key-change-in-production';
// Separate secret for short-lived pre-auth tokens (password verified, TOTP pending)
const TEMP_TOKEN_SECRET = JWT_SECRET + ':totp-pending';

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'admin@coindaily.online').split(',').map(e => e.trim());

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN';
  };
}

// ─── JWT Guard (unchanged — protects all authenticated routes) ──────
/**
 * Verifies the Bearer JWT on every protected route.
 * Only SUPER_ADMIN role is accepted.
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
      role: 'SUPER_ADMIN',
    };
    next();
  } catch {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' } });
  }
}

// ─── Step 1: Login (email + password → temp token) ──────────────────
/**
 * Two-step login — Step 1.
 * Verifies email + bcrypt password against cfis_admins table.
 * Returns a short-lived temp token and the next step:
 *   - "totp"       → TOTP enrolled, enter authenticator code
 *   - "totp-setup" → TOTP not yet enrolled, set up authenticator
 *
 * Falls back to legacy env-var auth (no TOTP) if cfis_admins table
 * doesn't exist yet. Logs a warning to migrate.
 */
export async function loginSuperAdmin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email and password required.' } });
    return;
  }

  try {
    // ── Try DB-backed auth (bcrypt + TOTP) ──
    const dbAuthReady = await adminService.isDbAuthAvailable();

    if (dbAuthReady) {
      return await loginWithDB(req, res, email, password);
    }

    // ── Fallback: legacy env-var auth (pre-migration) ──
    console.warn('[CFIS AUTH] ⚠ Using legacy env-var auth. Run `npx ts-node scripts/setup-admin.ts` to enable MFA.');
    return await loginLegacy(req, res, email, password);
  } catch (err: any) {
    console.error('[CFIS AUTH] Login error:', err.message);
    res.status(500).json({ error: { code: 'AUTH_ERROR', message: 'Authentication service error.' } });
  }
}

// DB-backed login: bcrypt verify → temp token → TOTP step
async function loginWithDB(req: Request, res: Response, email: string, password: string): Promise<void> {
  const { success, admin, error } = await adminService.verifyPassword(email, password);

  if (!success || !admin) {
    auditService.log({
      action: 'FAILED_LOGIN',
      actor: email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }).catch(() => {});

    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: error || 'Invalid email or password.' } });
    return;
  }

  // Email must also be in the SUPER_ADMIN_EMAILS whitelist
  if (!SUPER_ADMIN_EMAILS.includes(admin.email)) {
    res.status(403).json({ error: { code: 'UNAUTHORIZED_ADMIN', message: 'Email not authorized for CFIS.' } });
    return;
  }

  // Password correct — issue a short-lived temp token for TOTP step
  const tempToken = jwt.sign(
    { id: admin.id, email: admin.email, type: 'totp-pending' },
    TEMP_TOKEN_SECRET,
    { expiresIn: '5m' }
  );

  if (admin.totp_enrolled) {
    // TOTP already set up — ask for code
    res.json({
      data: {
        step: 'totp',
        tempToken,
        message: 'Enter your authenticator code.',
      },
    });
  } else {
    // TOTP not enrolled — provide setup URI + secret
    const totpUri = adminService.generateTOTPUri(admin.email, admin.totp_secret);
    res.json({
      data: {
        step: 'totp-setup',
        tempToken,
        totpUri,
        totpSecret: admin.totp_secret,
        message: 'Scan the QR code or enter the secret in your authenticator app, then submit the 6-digit code.',
      },
    });
  }
}

// Legacy env-var login: plaintext password, no TOTP (pre-migration fallback)
async function loginLegacy(req: Request, res: Response, email: string, password: string): Promise<void> {
  const ADMIN_PASSWORD = process.env.CFIS_ADMIN_PASSWORD || 'cfis-admin-2026';

  if (!SUPER_ADMIN_EMAILS.includes(email)) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    auditService.log({
      action: 'FAILED_LOGIN',
      actor: email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }).catch(() => {});
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    return;
  }

  const token = jwt.sign(
    { id: 'super-admin-1', email, role: 'SUPER_ADMIN' },
    JWT_SECRET,
    { expiresIn: '4h' }
  );

  auditService.log({
    action: 'SUPER_ADMIN_LOGIN_LEGACY',
    actor: email,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  }).catch(() => {});

  res.json({
    data: {
      token,
      expiresIn: '4h',
      admin: { email, role: 'SUPER_ADMIN' },
      warning: 'Legacy auth active (no MFA). Run setup-admin script to enable TOTP.',
    },
  });
}

// ─── Step 2a: Verify TOTP (enrolled admin) ──────────────────────────
/**
 * Verifies the 6-digit TOTP code for an enrolled admin.
 * Requires the temp token from Step 1.
 * Returns the real 4-hour JWT on success.
 */
export async function verifyTOTP(req: Request, res: Response): Promise<void> {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Temp token and TOTP code required.' } });
    return;
  }

  try {
    const payload = jwt.verify(tempToken, TEMP_TOKEN_SECRET) as any;
    if (payload.type !== 'totp-pending') {
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid temporary token.' } });
      return;
    }

    const admin = await adminService.findByEmail(payload.email);
    if (!admin || !admin.totp_secret) {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Admin not found.' } });
      return;
    }

    if (!admin.totp_enrolled) {
      res.status(400).json({ error: { code: 'TOTP_NOT_ENROLLED', message: 'TOTP not enrolled. Use setup-totp endpoint.' } });
      return;
    }

    if (!adminService.verifyTOTP(admin.email, admin.totp_secret, code)) {
      auditService.log({
        action: 'FAILED_TOTP',
        actor: admin.email,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      }).catch(() => {});
      res.status(401).json({ error: { code: 'INVALID_TOTP', message: 'Invalid authenticator code.' } });
      return;
    }

    // TOTP valid — issue the real session JWT
    await adminService.updateLastLogin(admin.id);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    auditService.log({
      action: 'SUPER_ADMIN_LOGIN',
      actor: admin.email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      data: {
        token,
        expiresIn: '4h',
        admin: { email: admin.email, role: 'SUPER_ADMIN' },
      },
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Temporary token expired. Start login again.' } });
    } else {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Authentication failed.' } });
    }
  }
}

// ─── Step 2b: Setup TOTP (first-time enrollment) ────────────────────
/**
 * Enrolls TOTP for an admin who hasn't set it up yet.
 * The admin must enter a valid 6-digit code from their authenticator
 * to prove they configured it correctly.
 * Returns the real 4-hour JWT on success.
 */
export async function setupTOTP(req: Request, res: Response): Promise<void> {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Temp token and TOTP code required.' } });
    return;
  }

  try {
    const payload = jwt.verify(tempToken, TEMP_TOKEN_SECRET) as any;
    if (payload.type !== 'totp-pending') {
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid temporary token.' } });
      return;
    }

    const admin = await adminService.findByEmail(payload.email);
    if (!admin || !admin.totp_secret) {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Admin not found.' } });
      return;
    }

    if (admin.totp_enrolled) {
      res.status(400).json({ error: { code: 'ALREADY_ENROLLED', message: 'TOTP already enrolled. Use verify-totp.' } });
      return;
    }

    if (!adminService.verifyTOTP(admin.email, admin.totp_secret, code)) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOTP',
          message: 'Invalid code. Ensure your authenticator app is set up correctly and try again.',
        },
      });
      return;
    }

    // Code verified — mark TOTP as enrolled
    await adminService.enrollTOTP(admin.id);
    await adminService.updateLastLogin(admin.id);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    auditService.log({
      action: 'TOTP_ENROLLED',
      actor: admin.email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }).catch(() => {});

    auditService.log({
      action: 'SUPER_ADMIN_LOGIN',
      actor: admin.email,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      data: {
        token,
        expiresIn: '4h',
        admin: { email: admin.email, role: 'SUPER_ADMIN' },
        message: 'TOTP enrolled successfully. Your authenticator app is now required for all future logins.',
      },
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Temporary token expired. Start login again.' } });
    } else {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Authentication failed.' } });
    }
  }
}

// ─── HMAC verification (service-to-service — unchanged) ─────────────
/**
 * Verifies HMAC-SHA256 signatures on internal service-to-service calls.
 * 30-second replay window.
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
  if (isNaN(reqTime) || Math.abs(now - reqTime) > 30) {
    res.status(401).json({ error: { code: 'REPLAY_DETECTED', message: 'Request timestamp too old or invalid.' } });
    return;
  }

  const crypto = require('crypto');
  const hmacSecret = process.env.CFIS_HMAC_SECRET || 'cfis-hmac-secret';
  const body = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac('sha256', hmacSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'HMAC signature mismatch.' } });
    return;
  }

  next();
}
