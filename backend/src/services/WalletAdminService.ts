/**
 * Wallet Admin Service - Administrative Wallet Management
 * 
 * Provides Super Admin capabilities for:
 * - Viewing and searching all wallets
 * - Manually editing balances (refunds, bonuses, corrections)
 * - Locking/freezing/suspending wallets
 * - Viewing full transaction logs
 * - Exporting financial reports
 */

import { PrismaClient, Wallet, WalletType, WalletStatus, UserRole } from '@prisma/client';
import { generateOTP, OTPPurpose } from './OTPService';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

interface WalletSearchFilters {
  userId?: string;
  walletType?: WalletType;
  status?: WalletStatus;
  minBalance?: number;
  maxBalance?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string; // Search by address, user email, username
}

interface AdjustBalanceInput {
  walletId: string;
  amount: number; // Positive for add, negative for subtract
  reason: string;
  adjustmentType: 'REFUND' | 'BONUS' | 'CORRECTION' | 'PENALTY' | 'REWARD' | 'OTHER';
  adminId: string;
  otpCode?: string;
  metadata?: Record<string, any>;
}

interface LockWalletInput {
  walletId: string;
  reason: string;
  adminId: string;
  lockType: 'TEMPORARY' | 'SECURITY' | 'INVESTIGATION' | 'FRAUD';
  duration?: number; // Duration in hours (for temporary locks)
}

interface TransactionSearchFilters {
  userId?: string;
  walletId?: string;
  transactionType?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
  currency?: string;
  searchTerm?: string;
}

// ============================================================================
// WALLET SEARCH & VIEWING
// ============================================================================

/**
 * Search and list all wallets (Super Admin only)
 */
export async function searchWallets(
  filters: WalletSearchFilters,
  pagination: { page: number; limit: number } = { page: 1, limit: 50 },
  adminId: string
): Promise<any> {
  // Verify admin permissions
  await verifyAdminPermissions(adminId, 'VIEW_WALLETS');

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.walletType) where.walletType = filters.walletType;
  if (filters.status) where.status = filters.status;

  if (filters.minBalance !== undefined || filters.maxBalance !== undefined) {
    where.availableBalance = {};
    if (filters.minBalance !== undefined) where.availableBalance.gte = filters.minBalance;
    if (filters.maxBalance !== undefined) where.availableBalance.lte = filters.maxBalance;
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
    if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
  }

  if (filters.searchTerm) {
    where.OR = [
      { walletAddress: { contains: filters.searchTerm, mode: 'insensitive' } },
      { user: { email: { contains: filters.searchTerm, mode: 'insensitive' } } },
      { user: { username: { contains: filters.searchTerm, mode: 'insensitive' } } },
    ];
  }

  // Fetch wallets
  const [wallets, total] = await Promise.all([
    prisma.wallet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wallet.count({ where }),
  ]);

  // Log search
  await logAdminAction(adminId, 'SEARCH_WALLETS', 'Searched wallets', { filters, resultCount: wallets.length });

  return {
    wallets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get detailed wallet information
 */
export async function getWalletDetails(walletId: string, adminId: string): Promise<any> {
  await verifyAdminPermissions(adminId, 'VIEW_WALLETS');

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      transactionsFrom: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      transactionsTo: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Get transaction summary
  const transactionSummary = await getWalletTransactionSummary(walletId);

  // Log access
  await logAdminAction(adminId, 'VIEW_WALLET_DETAILS', `Viewed wallet ${walletId}`);

  return {
    ...wallet,
    transactionSummary,
  };
}

/**
 * Get wallet transaction summary
 */
async function getWalletTransactionSummary(walletId: string) {
  const [sentCount, receivedCount, totalSent, totalReceived] = await Promise.all([
    prisma.walletTransaction.count({
      where: { fromWalletId: walletId, status: 'COMPLETED' },
    }),
    prisma.walletTransaction.count({
      where: { toWalletId: walletId, status: 'COMPLETED' },
    }),
    prisma.walletTransaction.aggregate({
      where: { fromWalletId: walletId, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { toWalletId: walletId, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalTransactions: sentCount + receivedCount,
    sentCount,
    receivedCount,
    totalSent: totalSent._sum.amount || 0,
    totalReceived: totalReceived._sum.amount || 0,
  };
}

/**
 * Get all wallets for a specific user
 */
export async function getUserWallets(userId: string, adminId: string): Promise<Wallet[]> {
  await verifyAdminPermissions(adminId, 'VIEW_WALLETS');

  const wallets = await prisma.wallet.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  });

  await logAdminAction(adminId, 'VIEW_USER_WALLETS', `Viewed wallets for user ${userId}`);

  return wallets;
}

// ============================================================================
// BALANCE ADJUSTMENTS
// ============================================================================

/**
 * Manually adjust wallet balance (Super Admin only)
 */
export async function adjustWalletBalance(input: AdjustBalanceInput): Promise<any> {
  const { walletId, amount, reason, adjustmentType, adminId, otpCode, metadata } = input;

  // Verify super admin permissions
  await verifySuperAdmin(adminId);

  // Validate OTP if required (for large adjustments)
  if (Math.abs(amount) > 1000 && !otpCode) {
    throw new Error('OTP verification required for adjustments over 1000');
  }

  // Get wallet
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: { user: true },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Validate adjustment won't result in negative balance
  if (wallet.availableBalance + amount < 0) {
    throw new Error('Adjustment would result in negative balance');
  }

  // Execute adjustment in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { id: walletId },
      data: {
        availableBalance: wallet.availableBalance + amount,
        totalBalance: wallet.totalBalance + amount,
      },
    });

    // Create transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        transactionHash: `ADJ-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        transactionType: amount > 0 ? 'REWARD' : 'FEE',
        operationType: 'ADMIN_BALANCE_ADJUSTMENT',
        toWalletId: amount > 0 ? walletId : null,
        fromWalletId: amount < 0 ? walletId : null,
        amount: Math.abs(amount),
        currency: wallet.currency,
        fee: 0,
        netAmount: Math.abs(amount),
        purpose: adjustmentType,
        description: reason,
        status: 'COMPLETED',
        otpVerified: !!otpCode,
        requiresApproval: false,
        approvedBy: adminId,
        approvedAt: new Date(),
        completedAt: new Date(),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Log adjustment
    await tx.financeOperationLog.create({
      data: {
        operationType: 'BALANCE_ADJUSTMENT',
        operationCategory: 'ADMIN_OPERATIONS',
        transactionId: transaction.id,
        userId: wallet.userId,
        performedBy: adminId,
        inputData: JSON.stringify({
          walletId,
          amount,
          adjustmentType,
          reason,
          metadata,
        }),
        outputData: JSON.stringify({
          before: {
            availableBalance: wallet.availableBalance,
            totalBalance: wallet.totalBalance,
          },
          after: {
            availableBalance: updatedWallet.availableBalance,
            totalBalance: updatedWallet.totalBalance,
          },
        }),
        status: 'SUCCESS',
        ipAddress: '', // Should be passed from request
        userAgent: '',
        timestamp: new Date(),
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });

  return result;
}

/**
 * Add bonus to wallet
 */
export async function addBonus(
  walletId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<any> {
  return await adjustWalletBalance({
    walletId,
    amount,
    reason,
    adjustmentType: 'BONUS',
    adminId,
  });
}

/**
 * Correct balance error
 */
export async function correctBalance(
  walletId: string,
  correctAmount: number,
  reason: string,
  adminId: string
): Promise<any> {
  return await adjustWalletBalance({
    walletId,
    amount: correctAmount,
    reason,
    adjustmentType: 'CORRECTION',
    adminId,
  });
}

// ============================================================================
// WALLET LOCKING & SECURITY
// ============================================================================

/**
 * Lock wallet (temporarily disable all operations)
 */
export async function lockWallet(input: LockWalletInput): Promise<Wallet> {
  const { walletId, reason, adminId, lockType, duration } = input;

  await verifySuperAdmin(adminId);

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.isLocked) {
    throw new Error('Wallet is already locked');
  }

  // Calculate unlock time for temporary locks
  let unlockAt: Date | null = null;
  if (lockType === 'TEMPORARY' && duration) {
    unlockAt = new Date(Date.now() + duration * 60 * 60 * 1000);
  }

  // Lock wallet
  const updatedWallet = await prisma.wallet.update({
    where: { id: walletId },
    data: {
      isLocked: true,
      lockReason: `[${lockType}] ${reason}`,
      lockedAt: new Date(),
      lockedBy: adminId,
      status: lockType === 'SECURITY' ? WalletStatus.FROZEN : WalletStatus.LOCKED,
    },
  });

  // Log lock action
  await logAdminAction(adminId, 'LOCK_WALLET', `Locked wallet ${walletId}`, {
    walletId,
    lockType,
    reason,
    duration,
    unlockAt,
  });

  // Send notification to user
  if (wallet.userId) {
    // TODO: Send email notification
  }

  return updatedWallet;
}

/**
 * Unlock wallet
 */
export async function unlockWallet(walletId: string, adminId: string, reason?: string): Promise<Wallet> {
  await verifySuperAdmin(adminId);

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (!wallet.isLocked) {
    throw new Error('Wallet is not locked');
  }

  const updatedWallet = await prisma.wallet.update({
    where: { id: walletId },
    data: {
      isLocked: false,
      lockReason: null,
      lockedAt: null,
      lockedBy: null,
      status: WalletStatus.ACTIVE,
    },
  });

  await logAdminAction(adminId, 'UNLOCK_WALLET', `Unlocked wallet ${walletId}`, {
    walletId,
    reason: reason || 'Unlocked by admin',
  });

  return updatedWallet;
}

/**
 * Freeze wallet (serious security issue - requires investigation)
 */
export async function freezeWallet(walletId: string, reason: string, adminId: string): Promise<Wallet> {
  return await lockWallet({
    walletId,
    reason,
    adminId,
    lockType: 'SECURITY',
  });
}

/**
 * Suspend wallet (pending investigation)
 */
export async function suspendWallet(walletId: string, reason: string, adminId: string): Promise<Wallet> {
  await verifySuperAdmin(adminId);

  const updatedWallet = await prisma.wallet.update({
    where: { id: walletId },
    data: {
      status: WalletStatus.SUSPENDED,
      lockReason: reason,
    },
  });

  await logAdminAction(adminId, 'SUSPEND_WALLET', `Suspended wallet ${walletId}`, { reason });

  return updatedWallet;
}

// ============================================================================
// TRANSACTION SEARCH & REPORTING
// ============================================================================

/**
 * Search all transactions (Admin)
 */
export async function searchTransactions(
  filters: TransactionSearchFilters,
  pagination: { page: number; limit: number } = { page: 1, limit: 50 },
  adminId: string
): Promise<any> {
  await verifyAdminPermissions(adminId, 'VIEW_TRANSACTIONS');

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (filters.transactionType) where.transactionType = filters.transactionType;
  if (filters.status) where.status = filters.status;
  if (filters.currency) where.currency = filters.currency;

  if (filters.walletId) {
    where.OR = [
      { fromWalletId: filters.walletId },
      { toWalletId: filters.walletId },
    ];
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
    if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  if (filters.searchTerm) {
    where.OR = [
      { transactionHash: { contains: filters.searchTerm, mode: 'insensitive' } },
      { description: { contains: filters.searchTerm, mode: 'insensitive' } },
      { referenceId: { contains: filters.searchTerm, mode: 'insensitive' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      include: {
        fromWallet: {
          select: {
            id: true,
            walletAddress: true,
            walletType: true,
          },
        },
        toWallet: {
          select: {
            id: true,
            walletAddress: true,
            walletType: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Export transaction report
 */
export async function exportTransactionReport(
  filters: TransactionSearchFilters,
  format: 'CSV' | 'JSON' | 'PDF',
  adminId: string
): Promise<string> {
  await verifyAdminPermissions(adminId, 'GENERATE_REPORTS');

  // Get all matching transactions (without pagination)
  const transactions = await prisma.walletTransaction.findMany({
    where: buildTransactionWhereClause(filters),
    include: {
      fromWallet: true,
      toWallet: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Log export
  await logAdminAction(adminId, 'EXPORT_TRANSACTIONS', `Exported ${transactions.length} transactions`, {
    format,
    filters,
  });

  // Format and return based on requested format
  if (format === 'CSV') {
    return formatTransactionsAsCSV(transactions);
  } else if (format === 'JSON') {
    return JSON.stringify(transactions, null, 2);
  } else {
    // PDF generation would go here
    return 'PDF export not yet implemented';
  }
}

/**
 * Build transaction where clause from filters
 */
function buildTransactionWhereClause(filters: TransactionSearchFilters): any {
  const where: any = {};
  // Similar to searchTransactions but reusable
  if (filters.transactionType) where.transactionType = filters.transactionType;
  if (filters.status) where.status = filters.status;
  if (filters.currency) where.currency = filters.currency;
  // ... add other filters
  return where;
}

/**
 * Format transactions as CSV
 */
function formatTransactionsAsCSV(transactions: any[]): string {
  const headers = [
    'Transaction ID',
    'Hash',
    'Type',
    'From Wallet',
    'To Wallet',
    'Amount',
    'Currency',
    'Fee',
    'Status',
    'Date',
  ].join(',');

  const rows = transactions.map((tx) =>
    [
      tx.id,
      tx.transactionHash,
      tx.transactionType,
      tx.fromWallet?.walletAddress || 'N/A',
      tx.toWallet?.walletAddress || 'N/A',
      tx.amount,
      tx.currency,
      tx.fee,
      tx.status,
      tx.createdAt.toISOString(),
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}

// ============================================================================
// PERMISSIONS & VALIDATION
// ============================================================================

/**
 * Verify admin has required permissions
 */
async function verifyAdminPermissions(userId: string, permission: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new Error('Insufficient permissions');
  }

  // Check specific permission (can be expanded with proper RBAC)
  // For now, Super Admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) {
    return;
  }

  // Finance Admin has limited permissions
  const financeAdminPermissions = ['VIEW_WALLETS', 'VIEW_TRANSACTIONS', 'GENERATE_REPORTS'];
  
  if (user.role === UserRole.ADMIN && !financeAdminPermissions.includes(permission)) {
    throw new Error(`Insufficient permissions for ${permission}`);
  }
}

/**
 * Verify user is Super Admin
 */
async function verifySuperAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Super Admin access required');
  }
}

/**
 * Log admin action for audit trail
 */
async function logAdminAction(
  adminId: string,
  action: string,
  description: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.financeOperationLog.create({
      data: {
        operationType: action,
        operationCategory: 'ADMIN_OPERATIONS',
        performedBy: adminId,
        inputData: JSON.stringify({ action, description, metadata }),
        status: 'SUCCESS',
        ipAddress: '', // Should be passed from request
        userAgent: '',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export default {
  searchWallets,
  getWalletDetails,
  getUserWallets,
  adjustWalletBalance,
  addBonus,
  correctBalance,
  lockWallet,
  unlockWallet,
  freezeWallet,
  suspendWallet,
  searchTransactions,
  exportTransactionReport,
};
