/**
 * OTP Service - One-Time Password Management
 * 
 * Handles:
 * - OTP generation and validation
 * - Email delivery
 * - Expiration management
 * - Rate limiting
 * - Secure storage
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const OTP_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = parseInt(process.env.OTP_EXPIRATION_MINUTES || '5');
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');
const OTP_RATE_LIMIT_PER_HOUR = parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR || '3');

// ============================================================================
// TYPES
// ============================================================================

export enum OTPPurpose {
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  TRANSFER = 'TRANSFER',
  GIFT = 'GIFT',
  WE_WALLET_ACCESS = 'WE_WALLET_ACCESS',
  WHITELIST_ADDRESS = 'WHITELIST_ADDRESS',
  BALANCE_ADJUSTMENT = 'BALANCE_ADJUSTMENT',
  WALLET_LOCK = 'WALLET_LOCK',
}

interface GenerateOTPInput {
  userId: string;
  userEmail: string;
  purpose: OTPPurpose;
  metadata?: Record<string, any>;
}

interface VerifyOTPInput {
  userId: string;
  code: string;
  purpose: OTPPurpose;
}

interface OTPResult {
  success: boolean;
  otpId?: string;
  expiresAt?: Date;
  error?: string;
}

interface VerifyOTPResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

// ============================================================================
// OTP GENERATION
// ============================================================================

/**
 * Generate and send OTP to user
 */
export async function generateOTP(input: GenerateOTPInput): Promise<OTPResult> {
  const { userId, userEmail, purpose, metadata } = input;

  try {
    // 1. Check rate limiting
    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${rateLimitCheck.minutesUntilReset} minutes.`,
      };
    }

    // 2. Generate 6-digit OTP code
    const code = generateOTPCode();

    // 3. Calculate expiration
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // 4. Encrypt OTP code before storing
    const encryptedCode = encryptOTP(code);

    // 5. Invalidate any existing OTPs for this purpose
    await prisma.$executeRaw`
      UPDATE "OTP" 
      SET "isValid" = false 
      WHERE "userId" = ${userId} 
      AND "purpose" = ${purpose} 
      AND "verified" = false
    `;

    // 6. Create OTP record
    const otp = await prisma.oTP.create({
      data: {
        userId,
        code: encryptedCode,
        purpose,
        expiresAt,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        verified: false,
        isValid: true,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // 7. Send OTP via email
    await sendOTPEmail(userEmail, code, purpose, expiresAt);

    // 8. Log OTP generation
    await logOTPAction(userId, 'GENERATED', purpose, otp.id);

    return {
      success: true,
      otpId: otp.id,
      expiresAt,
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    return {
      success: false,
      error: 'Failed to generate OTP. Please try again.',
    };
  }
}

/**
 * Generate random 6-digit OTP code
 */
function generateOTPCode(): string {
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

/**
 * Encrypt OTP code for secure storage
 */
function encryptOTP(code: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-32-bytes!!', 'utf-8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(code, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, auth tag, and encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt OTP code
 */
function decryptOTP(encryptedData: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-32-bytes!!', 'utf-8');
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0]!, 'hex');
  const authTag = Buffer.from(parts[1]!, 'hex');
  const encrypted = parts[2]!;
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  
  return decrypted;
}

// ============================================================================
// OTP VERIFICATION
// ============================================================================

/**
 * Verify OTP code
 */
export async function verifyOTP(input: VerifyOTPInput): Promise<VerifyOTPResult> {
  const { userId, code, purpose } = input;

  try {
    // 1. Find active OTP for this purpose
    const otp = await prisma.oTP.findFirst({
      where: {
        userId,
        purpose,
        verified: false,
        isValid: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      await logOTPAction(userId, 'VERIFY_FAILED_NO_OTP', purpose);
      return {
        success: false,
        error: 'No valid OTP found. Please request a new one.',
      };
    }

    // 2. Check if OTP has expired
    if (new Date() > otp.expiresAt) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { isValid: false },
      });
      await logOTPAction(userId, 'VERIFY_FAILED_EXPIRED', purpose, otp.id);
      return {
        success: false,
        error: 'OTP has expired. Please request a new one.',
      };
    }

    // 3. Check if max attempts exceeded
    if (otp.attempts >= otp.maxAttempts) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { isValid: false },
      });
      await logOTPAction(userId, 'VERIFY_FAILED_MAX_ATTEMPTS', purpose, otp.id);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.',
      };
    }

    // 4. Increment attempt counter
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });

    // 5. Decrypt and verify code
    const storedCode = decryptOTP(otp.code);
    if (storedCode !== code) {
      const attemptsRemaining = otp.maxAttempts - (otp.attempts + 1);
      await logOTPAction(userId, 'VERIFY_FAILED_WRONG_CODE', purpose, otp.id);
      return {
        success: false,
        error: `Invalid OTP code. ${attemptsRemaining} attempts remaining.`,
        attemptsRemaining,
      };
    }

    // 6. Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otp.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        isValid: false, // Can only be used once
      },
    });

    // 7. Log successful verification
    await logOTPAction(userId, 'VERIFIED', purpose, otp.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: 'Failed to verify OTP. Please try again.',
    };
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitResult {
  allowed: boolean;
  minutesUntilReset?: number;
}

/**
 * Check if user has exceeded OTP request rate limit
 */
async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentOTPs = await prisma.oTP.count({
    where: {
      userId,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (recentOTPs >= OTP_RATE_LIMIT_PER_HOUR) {
    // Find oldest OTP to calculate reset time
    const oldestOTP = await prisma.oTP.findFirst({
      where: {
        userId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (oldestOTP) {
      const resetTime = new Date(oldestOTP.createdAt.getTime() + 60 * 60 * 1000);
      const minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
      
      return {
        allowed: false,
        minutesUntilReset,
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// EMAIL DELIVERY
// ============================================================================

/**
 * Send OTP via email
 */
async function sendOTPEmail(
  email: string,
  code: string,
  purpose: OTPPurpose,
  expiresAt: Date
): Promise<void> {
  const purposeText = getPurposeText(purpose);
  const expirationMinutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);

  const subject = `Your Verification Code - ${purposeText}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 8px; margin: 30px 0; padding: 20px; background: white; border-radius: 10px; border: 2px dashed #667eea; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .security-tips { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .security-tips ul { margin: 10px 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verification Code</h1>
            <p>CoinDaily Security</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>You requested a verification code for: <strong>${purposeText}</strong></p>
            
            <div class="otp-code">${code}</div>
            
            <div class="warning">
              ⚠️ <strong>This code will expire in ${expirationMinutes} minutes.</strong>
            </div>
            
            <p>Enter this code to complete your transaction. If you didn't request this code, please ignore this email or contact support immediately.</p>
            
            <div class="security-tips">
              <strong>🛡️ Security Tips:</strong>
              <ul>
                <li>Never share your verification code with anyone</li>
                <li>CoinDaily staff will never ask for your verification code</li>
                <li>Be cautious of phishing attempts</li>
                <li>Verify the URL before entering any codes</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 CoinDaily. All rights reserved.</p>
            <p>If you have questions, contact us at support@coindaily.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Get user-friendly purpose text
 */
function getPurposeText(purpose: OTPPurpose): string {
  const purposeMap: Record<OTPPurpose, string> = {
    WITHDRAWAL: 'Withdrawal Request',
    PAYMENT: 'Payment Authorization',
    TRANSFER: 'Fund Transfer',
    GIFT: 'Gift Transaction',
    WE_WALLET_ACCESS: 'We Wallet Access',
    WHITELIST_ADDRESS: 'Whitelist Address Verification',
    BALANCE_ADJUSTMENT: 'Balance Adjustment',
    WALLET_LOCK: 'Wallet Lock Action',
  };

  return purposeMap[purpose] || purpose;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up expired OTPs (run as scheduled job)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await prisma.oTP.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { verified: true, verifiedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  console.log(`Cleaned up ${result.count} expired OTPs`);
  return result.count;
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log OTP action for audit trail
 */
async function logOTPAction(
  userId: string,
  action: string,
  purpose: OTPPurpose,
  otpId?: string
): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId,
        action: `OTP_${action}`,
        ipAddress: '', // Should be passed from request context
        userAgent: '', // Should be passed from request context
        timestamp: new Date(),
        metadata: {
          purpose,
          otpId,
        },
      },
    });
  } catch (error) {
    console.error('Error logging OTP action:', error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get OTP status
 */
export async function getOTPStatus(otpId: string) {
  const otp = await prisma.oTP.findUnique({
    where: { id: otpId },
  });

  if (!otp) {
    return null;
  }

  return {
    id: otp.id,
    purpose: otp.purpose,
    verified: otp.verified,
    isValid: otp.isValid,
    attempts: otp.attempts,
    maxAttempts: otp.maxAttempts,
    expiresAt: otp.expiresAt,
    expired: new Date() > otp.expiresAt,
  };
}

/**
 * Cancel OTP
 */
export async function cancelOTP(otpId: string): Promise<boolean> {
  try {
    await prisma.oTP.update({
      where: { id: otpId },
      data: { isValid: false },
    });
    return true;
  } catch (error) {
    console.error('Error cancelling OTP:', error);
    return false;
  }
}

export default {
  generateOTP,
  verifyOTP,
  cleanupExpiredOTPs,
  getOTPStatus,
  cancelOTP,
};
