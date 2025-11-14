import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * JWT Secret - should be set in environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

/**
 * Token expiration times
 */
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate JWT access token
 */
export function generateJWT(payload: {
  sub: string;
  email:string;
  username: string;
  role?: string;
  subscriptionTier?: string;
  [key: string]: any;
}): string {
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'coindaily-api',
      audience: 'coindaily-app'
    }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'coindaily-api',
      audience: 'coindaily-app'
    }
  );
}

/**
 * Verify JWT token
 */
export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'coindaily-api',
      audience: 'coindaily-app'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'coindaily-api',
      audience: 'coindaily-app'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Generate random token
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash token for storage
 */
export async function hashToken(token: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Decode JWT without verification (for debugging)
 */
export function decodeJWT(token: string): any {
  return jwt.decode(token);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export default {
  generateJWT,
  generateRefreshToken,
  verifyJWT,
  verifyRefreshToken,
  generateRandomToken,
  generateResetToken,
  hashToken,
  decodeJWT,
  isTokenExpired
};
