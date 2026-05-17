import { Prisma } from '@prisma/client';
import {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  StakingStatus,
  EscrowStatus,
  AirdropStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../../../lib/prisma';
import { WalletService } from '../../WalletService';
import { PermissionService } from '../../PermissionService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import {
  ALL_FINANCE_OPERATIONS,
  requiresOTP,
  requiresApproval,
  isHighRisk,
} from '../../../constants/financeOperations';
import { generateTransactionHash, logFinanceOperation } from '../financeHelpers';
import type {
  TransactionResult,
  DepositInput,
  WithdrawalInput,
  TransferInput,
  PaymentInput,
  RefundInput,
  StakingInput,
  ConversionInput,
  AirdropInput,
  EscrowInput,
  GiftInput,
  BatchTransferInput,
  CommissionInput,
  AffiliateCommissionInput,
  RevenueTrackingInput,
  ExpenseInput,
  AuditInput,
  ReportInput,
  AuditResult,
  ReportResult,
  SecurityOTPInput,
  Security2FAInput,
  SecurityWalletFreezeInput,
  SecurityWhitelistInput,
  SecurityFraudDetectionInput,
  SecurityTransactionLimitInput,
  SecurityResult,
  TaxCalculationInput,
  TaxReportInput,
  ComplianceKYCInput,
  ComplianceAMLInput,
  TaxComplianceResult,
  WalletCreateInput,
  WalletViewBalanceInput,
  WalletViewHistoryInput,
  WalletSetLimitsInput,
  WalletRecoveryInput,
  WalletOperationResult,
  GatewayStripeInput,
  GatewayPayPalInput,
  GatewayMobileMoneyInput,
  GatewayCryptoInput,
  GatewayBankTransferInput,
  GatewayResult,
  BulkTransferAdvancedInput,
  ScheduledPaymentInput,
  RecurringPaymentInput,
  PaymentLinkInput,
  InvoiceGenerationInput,
  BulkTransferResult,
  ScheduledPaymentResult,
  RecurringPaymentResult,
  PaymentLinkResult,
  InvoiceResult,
  SubscriptionAutoRenewInput,
  SubscriptionUpgradeInput,
  SubscriptionDowngradeInput,
  SubscriptionPauseInput,
  SubscriptionCancelInput,
  SubscriptionResult,
} from '../financeTypes';

export class FinanceWalletManagement {
  static async walletCreate(input: WalletCreateInput): Promise<WalletOperationResult> {
    try {
      const { userId, walletType, currency, dailyWithdrawalLimit, transactionLimit, metadata } = input;

      // Validate user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if user already has this wallet type
      const existingWallet = await prisma.wallet.findFirst({
        where: { userId, walletType: walletType || WalletType.USER_WALLET }
      });

      if (existingWallet) {
        return { success: false, error: 'User already has this wallet type' };
      }

      // Create wallet using WalletService
      // JOY Token (JY) is the primary platform currency denominated in USD
      const walletInput: any = {
        userId,
        walletType: walletType || WalletType.USER_WALLET,
        currency: currency || 'JY', // JOY Token is default platform currency
      };
      
      if (dailyWithdrawalLimit !== undefined) {
        walletInput.dailyWithdrawalLimit = dailyWithdrawalLimit;
      }
      
      if (transactionLimit !== undefined) {
        walletInput.transactionLimit = transactionLimit;
      }
      
      const wallet = await WalletService.createWallet(walletInput);

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WALLET_CREATE,
        userId,
        transactionId: wallet.id,
        metadata: { walletId: wallet.id, walletType: wallet.walletType, ...metadata },
      });

      return {
        success: true,
        walletId: wallet.id,
        walletAddress: wallet.walletAddress,
        walletType: wallet.walletType,
        currency: wallet.currency,
      };
    } catch (error) {
      console.error('Wallet creation failed:', error);
      return { success: false, error: 'Wallet creation failed' };
    }
  }

  /**
   * 84. Wallet View Balance - View wallet balance
   */
  static async walletViewBalance(input: WalletViewBalanceInput): Promise<WalletOperationResult> {
    try {
      const { userId, walletId } = input;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      });

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Verify ownership
      if (wallet.userId !== userId && wallet.walletType !== WalletType.WE_WALLET) {
        // Check if user has admin permissions to view any wallet
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN, UserRole.MARKETING_ADMIN, UserRole.TECH_ADMIN];
        if (!user || !adminRoles.includes(user.role)) {
          return { success: false, error: 'Unauthorized to view this wallet' };
        }
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WALLET_VIEW_BALANCE,
        userId,
        transactionId: walletId,
        metadata: { walletId, action: 'view_balance' },
      });

      return {
        success: true,
        walletId: wallet.id,
        walletAddress: wallet.walletAddress,
        walletType: wallet.walletType,
        currency: wallet.currency,
        balance: {
          available: wallet.availableBalance,
          locked: wallet.lockedBalance,
          staked: wallet.stakedBalance,
          total: wallet.totalBalance,
          cePoints: wallet.cePoints,
          joyTokens: wallet.joyTokens,
        },
        status: wallet.status,
        limits: {
          dailyWithdrawal: wallet.dailyWithdrawalLimit,
          transaction: wallet.transactionLimit,
        },
        security: {
          twoFactorRequired: wallet.twoFactorRequired,
          otpRequired: wallet.otpRequired,
        }
      };
    } catch (error) {
      console.error('View balance failed:', error);
      return { success: false, error: 'Failed to retrieve balance' };
    }
  }

  /**
   * 85. Wallet View History - View transaction history
   */
  static async walletViewHistory(input: WalletViewHistoryInput): Promise<WalletOperationResult> {
    try {
      const { userId, walletId, limit = 50, offset = 0, startDate, endDate, transactionType } = input;

      // Get wallet and verify ownership
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Verify ownership or admin access
      if (wallet.userId !== userId && wallet.walletType !== WalletType.WE_WALLET) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN, UserRole.MARKETING_ADMIN, UserRole.TECH_ADMIN];
        if (!user || !adminRoles.includes(user.role)) {
          return { success: false, error: 'Unauthorized to view this wallet history' };
        }
      }

      // Build query filters
      const where: any = {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId },
        ],
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      if (transactionType) {
        where.transactionType = transactionType;
      }

      // Get transactions
      const [transactions, totalCount] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          include: {
            fromWallet: {
              select: {
                id: true,
                walletAddress: true,
                walletType: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
            toWallet: {
              select: {
                id: true,
                walletAddress: true,
                walletType: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.walletTransaction.count({ where }),
      ]);

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WALLET_VIEW_HISTORY,
        userId,
        transactionId: walletId,
        metadata: { walletId, limit, offset, transactionType },
      });

      return {
        success: true,
        walletId,
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.transactionType,
          operationType: tx.operationType,
          amount: tx.amount,
          netAmount: tx.netAmount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          purpose: tx.purpose,
          transactionHash: tx.transactionHash,
          fromWallet: tx.fromWallet,
          toWallet: tx.toWallet,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt,
          metadata: tx.metadata ? JSON.parse(tx.metadata as string) : {},
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        }
      };
    } catch (error) {
      console.error('View history failed:', error);
      return { success: false, error: 'Failed to retrieve history' };
    }
  }

  /**
   * 86. Wallet Set Limits - Set wallet limits
   */
  static async walletSetLimits(input: WalletSetLimitsInput): Promise<WalletOperationResult> {
    try {
      const { userId, walletId, dailyWithdrawalLimit, transactionLimit, setByUserId, metadata } = input;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Verify authorization (only owner or admin can set limits)
      const setByUser = await prisma.user.findUnique({ where: { id: setByUserId } });
      if (!setByUser) {
        return { success: false, error: 'Invalid user setting limits' };
      }

      const isOwner = wallet.userId === setByUserId;
      const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.CONTENT_ADMIN, UserRole.MARKETING_ADMIN, UserRole.TECH_ADMIN];
      const isAdmin = adminRoles.includes(setByUser.role);

      if (!isOwner && !isAdmin) {
        return { success: false, error: 'Unauthorized to set wallet limits' };
      }

      // Update limits
      const updateData: any = { updatedAt: new Date() };
      if (dailyWithdrawalLimit !== undefined) updateData.dailyWithdrawalLimit = dailyWithdrawalLimit;
      if (transactionLimit !== undefined) updateData.transactionLimit = transactionLimit;

      const updatedWallet = await prisma.wallet.update({
        where: { id: walletId },
        data: updateData,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WALLET_SET_LIMITS,
        userId: setByUserId,
        transactionId: walletId,
        metadata: { walletId, dailyWithdrawalLimit, transactionLimit, ...metadata },
      });

      return {
        success: true,
        walletId: updatedWallet.id,
        limits: {
          dailyWithdrawal: updatedWallet.dailyWithdrawalLimit,
          transaction: updatedWallet.transactionLimit,
        },
        message: 'Wallet limits updated successfully',
      };
    } catch (error) {
      console.error('Set limits failed:', error);
      return { success: false, error: 'Failed to set wallet limits' };
    }
  }

  /**
   * 87. Wallet Recovery - Wallet recovery
   */
  static async walletRecovery(input: WalletRecoveryInput): Promise<WalletOperationResult> {
    try {
      const { userId, walletId, recoveryMethod, recoveryCode, newSecuritySettings, approvedByUserId, metadata } = input;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Verify ownership
      if (wallet.userId !== userId) {
        return { success: false, error: 'Unauthorized wallet recovery attempt' };
      }

      // TODO: Implement actual recovery code verification
      // This would integrate with email/SMS/authenticator verification
      const isRecoveryValid = recoveryCode && recoveryCode.length >= 6;

      if (!isRecoveryValid) {
        return { success: false, error: 'Invalid recovery code' };
      }

      // Unlock wallet if it was frozen
      const updateData: any = {
        status: WalletStatus.ACTIVE,
        updatedAt: new Date(),
      };

      // Update security settings if provided
      if (newSecuritySettings) {
        if (newSecuritySettings.twoFactorRequired !== undefined) {
          updateData.twoFactorRequired = newSecuritySettings.twoFactorRequired;
        }
        if (newSecuritySettings.otpRequired !== undefined) {
          updateData.otpRequired = newSecuritySettings.otpRequired;
        }
      }

      const recoveredWallet = await prisma.wallet.update({
        where: { id: walletId },
        data: updateData,
      });

      // Log the recovery attempt
      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WALLET_RECOVERY,
        userId,
        transactionId: walletId,
        metadata: { 
          walletId, 
          recoveryMethod, 
          approvedByUserId, 
          previousStatus: wallet.status,
          newStatus: recoveredWallet.status,
          ...metadata 
        },
      });

      return {
        success: true,
        walletId: recoveredWallet.id,
        status: recoveredWallet.status,
        message: 'Wallet recovered successfully',
        security: {
          twoFactorRequired: recoveredWallet.twoFactorRequired,
          otpRequired: recoveredWallet.otpRequired,
        }
      };
    } catch (error) {
      console.error('Wallet recovery failed:', error);
      return { success: false, error: 'Wallet recovery failed' };
    }
  }
}
