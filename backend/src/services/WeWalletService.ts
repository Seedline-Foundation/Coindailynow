/**
 * We Wallet Service - Platform Central Wallet Management
 * 
 * The "We Wallet" is the platform's central treasury that receives all platform income.
 * 
 * CRITICAL SECURITY REQUIREMENTS:
 * - Requires 3-email authentication for ALL operations
 * - Only accessible by Super Admins
 * - Only transacts with Admin wallets (not regular users)
 * - All operations are logged and audited
 * - Email addresses are encrypted in environment variables
 */

import { PrismaClient, WalletType, WalletStatus, UserRole } from '@prisma/client';
import { generateOTP, verifyOTP, OTPPurpose } from './OTPService';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION - WE WALLET AUTHORIZED EMAILS (ENCRYPTED)
// ============================================================================

/**
 * These email addresses are the ONLY ones authorized to approve We Wallet operations.
 * They are stored encrypted in environment variables for security.
 * 
 * PRODUCTION: Store these in .env as encrypted values
 */
const WE_WALLET_AUTHORIZED_EMAILS = [
  decryptEmail(process.env.WE_WALLET_EMAIL_1 || 'divinegiftx@gmail.com'),
  decryptEmail(process.env.WE_WALLET_EMAIL_2 || 'bizoppventures@gmail.com'),
  decryptEmail(process.env.WE_WALLET_EMAIL_3 || 'ivuomachimaobi1@gmail.com'),
];

/**
 * Decrypt email from environment variable
 * In production, emails should be encrypted in .env
 */
function decryptEmail(encrypted: string): string {
  // If already decrypted (not encrypted in env), return as-is
  if (encrypted.includes('@')) {
    return encrypted;
  }

  // Decrypt using encryption key
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-32-bytes!!', 'utf-8');
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted email format');
    }
    
    const iv = Buffer.from(parts[0]!, 'hex');
    const encryptedText = parts[1]!;
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting email:', error);
    return encrypted; // Fallback to original
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface WeWalletOperationInput {
  operationType: 'TRANSFER_OUT' | 'TRANSFER_IN' | 'VIEW_BALANCE' | 'VIEW_TRANSACTIONS' | 'ADJUST_BALANCE';
  initiatedBy: string; // Super Admin user ID
  amount?: number;
  targetWalletId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

interface WeWalletAuthSession {
  sessionId: string;
  operationType: string;
  initiatedBy: string;
  initiatedAt: Date;
  otpIds: string[];
  verifiedEmails: string[];
  status: 'PENDING' | 'PARTIAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresAt: Date;
}

interface WeWalletOperationResult {
  success: boolean;
  sessionId?: string;
  requiresOTP?: boolean;
  otpSentTo?: string[];
  error?: string;
  data?: any;
}

// ============================================================================
// WE WALLET CREATION & RETRIEVAL
// ============================================================================

/**
 * Get or create We Wallet
 * Only callable by Super Admin
 */
export async function getWeWallet(superAdminId: string): Promise<any> {
  // Verify super admin
  await verifySuperAdmin(superAdminId);

  // Find existing We Wallet
  let weWallet = await prisma.wallet.findFirst({
    where: {
      walletType: WalletType.WE_WALLET,
    },
  });

  // Create if doesn't exist
  if (!weWallet) {
    weWallet = await prisma.wallet.create({
      data: {
        walletType: WalletType.WE_WALLET,
        userId: null, // No specific user
        walletAddress: generateWeWalletAddress(),
        availableBalance: 0,
        lockedBalance: 0,
        stakedBalance: 0,
        totalBalance: 0,
        cePoints: 0,
        joyTokens: 0,
        currency: 'PLATFORM_TOKEN',
        twoFactorRequired: true,
        otpRequired: true,
        status: WalletStatus.ACTIVE,
      },
    });

    // Log creation
    await logWeWalletAction(superAdminId, 'CREATED', 'We Wallet created');
  }

  return {
    id: weWallet.id,
    walletAddress: weWallet.walletAddress,
    availableBalance: weWallet.availableBalance,
    totalBalance: weWallet.totalBalance,
    status: weWallet.status,
  };
}

/**
 * Generate unique We Wallet address
 */
function generateWeWalletAddress(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `WE-${timestamp}-${random}`.toUpperCase();
}

// ============================================================================
// 3-EMAIL AUTHENTICATION SYSTEM
// ============================================================================

/**
 * Initiate We Wallet operation - sends OTP to all 3 authorized emails
 */
export async function initiateWeWalletOperation(
  input: WeWalletOperationInput
): Promise<WeWalletOperationResult> {
  try {
    const { operationType, initiatedBy, amount, targetWalletId, reason, metadata } = input;

    // 1. Verify super admin
    await verifySuperAdmin(initiatedBy);

    // 2. Validate operation
    await validateWeWalletOperation(input);

    // 3. Create authentication session
    const sessionId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 4. Generate OTPs for all 3 authorized emails
    const otpIds: string[] = [];
    const otpPromises = WE_WALLET_AUTHORIZED_EMAILS.map(async (email) => {
      const result = await generateOTP({
        userId: initiatedBy,
        userEmail: email,
        purpose: OTPPurpose.WE_WALLET_ACCESS,
        metadata: {
          sessionId,
          operationType,
          amount,
          targetWalletId,
        },
      });

      if (result.success && result.otpId) {
        otpIds.push(result.otpId);
      }

      return result;
    });

    await Promise.all(otpPromises);

    // 5. Create authentication session record
    await prisma.weWalletAuthSession.create({
      data: {
        sessionId,
        operationType,
        initiatedBy,
        amount: amount ?? null,
        targetWalletId: targetWalletId ?? null,
        reason: reason ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        otpIds: JSON.stringify(otpIds),
        verifiedEmails: JSON.stringify([]),
        status: 'PENDING',
        expiresAt,
      },
    });

    // 6. Log operation initiation
    await logWeWalletAction(initiatedBy, 'OPERATION_INITIATED', operationType, {
      sessionId,
      amount,
      targetWalletId,
    });

    return {
      success: true,
      sessionId,
      requiresOTP: true,
      otpSentTo: WE_WALLET_AUTHORIZED_EMAILS,
    };
  } catch (error: any) {
    console.error('Error initiating We Wallet operation:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate We Wallet operation',
    };
  }
}

/**
 * Verify OTP for We Wallet operation
 */
export async function verifyWeWalletOTP(
  sessionId: string,
  email: string,
  otpCode: string
): Promise<WeWalletOperationResult> {
  try {
    // 1. Get authentication session
    const session = await prisma.weWalletAuthSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return { success: false, error: 'Invalid session ID' };
    }

    // 2. Check if session expired
    if (new Date() > session.expiresAt) {
      await prisma.weWalletAuthSession.update({
        where: { sessionId },
        data: { status: 'EXPIRED' },
      });
      return { success: false, error: 'Session expired. Please initiate a new operation.' };
    }

    // 3. Verify email is authorized
    if (!WE_WALLET_AUTHORIZED_EMAILS.includes(email)) {
      await logWeWalletAction(session.initiatedBy, 'UNAUTHORIZED_EMAIL_ATTEMPT', email);
      return { success: false, error: 'Unauthorized email address' };
    }

    // 4. Check if email already verified
    const verifiedEmails = JSON.parse(session.verifiedEmails || '[]');
    if (verifiedEmails.includes(email)) {
      return { success: false, error: 'Email already verified for this session' };
    }

    // 5. Verify OTP
    const otpResult = await verifyOTP({
      userId: session.initiatedBy,
      code: otpCode,
      purpose: OTPPurpose.WE_WALLET_ACCESS,
    });

    if (!otpResult.success) {
      await logWeWalletAction(session.initiatedBy, 'OTP_VERIFICATION_FAILED', email);
      return { success: false, error: otpResult.error || 'OTP verification failed' };
    }

    // 6. Add email to verified list
    verifiedEmails.push(email);
    const allVerified = verifiedEmails.length === 3;

    // 7. Update session
    await prisma.weWalletAuthSession.update({
      where: { sessionId },
      data: {
        verifiedEmails: JSON.stringify(verifiedEmails),
        status: allVerified ? 'APPROVED' : 'PARTIAL',
      },
    });

    // 8. Log verification
    await logWeWalletAction(session.initiatedBy, 'OTP_VERIFIED', email, {
      sessionId,
      verifiedCount: verifiedEmails.length,
    });

    // 9. If all 3 emails verified, execute operation
    if (allVerified) {
      const result = await executeWeWalletOperation(session);
      return result;
    }

    return {
      success: true,
      data: {
        verifiedCount: verifiedEmails.length,
        remainingCount: 3 - verifiedEmails.length,
        status: 'PARTIAL',
      },
    };
  } catch (error: any) {
    console.error('Error verifying We Wallet OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify OTP',
    };
  }
}

// ============================================================================
// OPERATION EXECUTION
// ============================================================================

/**
 * Execute We Wallet operation after all 3 OTPs verified
 */
async function executeWeWalletOperation(
  session: any
): Promise<WeWalletOperationResult> {
  try {
    const { operationType, initiatedBy, amount, targetWalletId, reason } = session;

    // Get We Wallet
    const weWallet = await prisma.wallet.findFirst({
      where: { walletType: WalletType.WE_WALLET },
    });

    if (!weWallet) {
      throw new Error('We Wallet not found');
    }

    let result: any;

    switch (operationType) {
      case 'TRANSFER_OUT':
        result = await executeTransferOut(weWallet, targetWalletId!, amount!, reason, initiatedBy);
        break;

      case 'TRANSFER_IN':
        result = await executeTransferIn(weWallet, targetWalletId!, amount!, reason, initiatedBy);
        break;

      case 'VIEW_BALANCE':
        result = await getWeWalletBalance(weWallet.id);
        break;

      case 'VIEW_TRANSACTIONS':
        result = await getWeWalletTransactions(weWallet.id);
        break;

      case 'ADJUST_BALANCE':
        result = await adjustWeWalletBalance(weWallet, amount!, reason!, initiatedBy);
        break;

      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }

    // Mark session as completed
    await prisma.weWalletAuthSession.update({
      where: { sessionId: session.sessionId },
      data: {
        status: 'APPROVED',
        completedAt: new Date(),
      },
    });

    // Log successful operation
    await logWeWalletAction(initiatedBy, 'OPERATION_EXECUTED', operationType, {
      sessionId: session.sessionId,
      result,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Error executing We Wallet operation:', error);
    
    // Mark session as rejected
    await prisma.weWalletAuthSession.update({
      where: { sessionId: session.sessionId },
      data: {
        status: 'REJECTED',
        rejectionReason: error.message,
      },
    });

    return {
      success: false,
      error: error.message || 'Failed to execute operation',
    };
  }
}

/**
 * Transfer from We Wallet to Admin Wallet
 */
async function executeTransferOut(
  weWallet: any,
  targetWalletId: string,
  amount: number,
  reason: string,
  initiatedBy: string
) {
  // Verify target is an admin wallet
  const targetWallet = await prisma.wallet.findUnique({
    where: { id: targetWalletId },
    include: { user: true },
  });

  if (!targetWallet) {
    throw new Error('Target wallet not found');
  }

  if (!targetWallet.user || 
      (targetWallet.user.role !== UserRole.SUPER_ADMIN && 
       targetWallet.user.role !== UserRole.ADMIN)) {
    throw new Error('We Wallet can only transfer to Admin wallets');
  }

  // Check sufficient balance
  if (weWallet.availableBalance < amount) {
    throw new Error('Insufficient balance in We Wallet');
  }

  // Execute transfer
  return await prisma.$transaction(async (tx) => {
    // Deduct from We Wallet
    await tx.wallet.update({
      where: { id: weWallet.id },
      data: {
        availableBalance: weWallet.availableBalance - amount,
        totalBalance: weWallet.totalBalance - amount,
      },
    });

    // Add to target wallet
    await tx.wallet.update({
      where: { id: targetWalletId },
      data: {
        availableBalance: targetWallet.availableBalance + amount,
        totalBalance: targetWallet.totalBalance + amount,
      },
    });

    // Create transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        transactionHash: crypto.randomBytes(32).toString('hex'),
        transactionType: 'TRANSFER',
        operationType: 'WE_WALLET_TRANSFER_OUT',
        fromWalletId: weWallet.id,
        toWalletId: targetWalletId,
        amount,
        currency: 'PLATFORM_TOKEN',
        fee: 0,
        netAmount: amount,
        purpose: 'WE_WALLET_TRANSFER',
        description: reason,
        status: 'COMPLETED',
        otpVerified: true,
        requiresApproval: false,
        approvedBy: initiatedBy,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return {
      transactionId: transaction.id,
      transactionHash: transaction.transactionHash,
      amount,
      from: weWallet.walletAddress,
      to: targetWallet.walletAddress,
    };
  });
}

/**
 * Transfer to We Wallet from Admin Wallet
 */
async function executeTransferIn(
  weWallet: any,
  sourceWalletId: string,
  amount: number,
  reason: string,
  initiatedBy: string
) {
  // Similar to transferOut but reversed
  const sourceWallet = await prisma.wallet.findUnique({
    where: { id: sourceWalletId },
    include: { user: true },
  });

  if (!sourceWallet) {
    throw new Error('Source wallet not found');
  }

  if (!sourceWallet.user || 
      (sourceWallet.user.role !== UserRole.SUPER_ADMIN && 
       sourceWallet.user.role !== UserRole.ADMIN)) {
    throw new Error('We Wallet can only receive from Admin wallets');
  }

  if (sourceWallet.availableBalance < amount) {
    throw new Error('Insufficient balance in source wallet');
  }

  // Execute transfer (similar to transferOut but reversed)
  return await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: sourceWalletId },
      data: {
        availableBalance: sourceWallet.availableBalance - amount,
        totalBalance: sourceWallet.totalBalance - amount,
      },
    });

    await tx.wallet.update({
      where: { id: weWallet.id },
      data: {
        availableBalance: weWallet.availableBalance + amount,
        totalBalance: weWallet.totalBalance + amount,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        transactionHash: crypto.randomBytes(32).toString('hex'),
        transactionType: 'TRANSFER',
        operationType: 'WE_WALLET_TRANSFER_IN',
        fromWalletId: sourceWalletId,
        toWalletId: weWallet.id,
        amount,
        currency: 'PLATFORM_TOKEN',
        fee: 0,
        netAmount: amount,
        purpose: 'WE_WALLET_DEPOSIT',
        description: reason,
        status: 'COMPLETED',
        otpVerified: true,
        requiresApproval: false,
        approvedBy: initiatedBy,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return {
      transactionId: transaction.id,
      transactionHash: transaction.transactionHash,
      amount,
      from: sourceWallet.walletAddress,
      to: weWallet.walletAddress,
    };
  });
}

/**
 * Get We Wallet balance
 */
async function getWeWalletBalance(walletId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  return {
    availableBalance: wallet?.availableBalance,
    lockedBalance: wallet?.lockedBalance,
    stakedBalance: wallet?.stakedBalance,
    totalBalance: wallet?.totalBalance,
    cePoints: wallet?.cePoints,
    joyTokens: wallet?.joyTokens,
  };
}

/**
 * Get We Wallet transactions
 */
async function getWeWalletTransactions(walletId: string) {
  const transactions = await prisma.walletTransaction.findMany({
    where: {
      OR: [
        { fromWalletId: walletId },
        { toWalletId: walletId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return transactions;
}

/**
 * Adjust We Wallet balance (emergency only)
 */
async function adjustWeWalletBalance(
  weWallet: any,
  amount: number,
  reason: string,
  initiatedBy: string
) {
  const newBalance = weWallet.availableBalance + amount;

  if (newBalance < 0) {
    throw new Error('Adjustment would result in negative balance');
  }

  await prisma.wallet.update({
    where: { id: weWallet.id },
    data: {
      availableBalance: newBalance,
      totalBalance: weWallet.totalBalance + amount,
    },
  });

  return {
    previousBalance: weWallet.availableBalance,
    adjustment: amount,
    newBalance,
    reason,
  };
}

// ============================================================================
// VALIDATION & SECURITY
// ============================================================================

/**
 * Verify user is Super Admin
 */
async function verifySuperAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Only Super Admins can access We Wallet');
  }
}

/**
 * Validate We Wallet operation
 */
async function validateWeWalletOperation(input: WeWalletOperationInput): Promise<void> {
  const { operationType, amount, targetWalletId } = input;

  if (['TRANSFER_OUT', 'TRANSFER_IN', 'ADJUST_BALANCE'].includes(operationType)) {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
  }

  if (['TRANSFER_OUT', 'TRANSFER_IN'].includes(operationType)) {
    if (!targetWalletId) {
      throw new Error('Target wallet ID is required');
    }
  }
}

/**
 * Log We Wallet action
 */
async function logWeWalletAction(
  userId: string,
  action: string,
  description: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.financeOperationLog.create({
      data: {
        operationType: `WE_WALLET_${action}`,
        operationCategory: 'WE_WALLET_OPERATIONS',
        performedBy: userId,
        inputData: JSON.stringify({ action, description, metadata }),
        status: 'SUCCESS',
        ipAddress: '', // Should be passed from request context
        userAgent: '',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error logging We Wallet action:', error);
  }
}

export default {
  getWeWallet,
  initiateWeWalletOperation,
  verifyWeWalletOTP,
};
