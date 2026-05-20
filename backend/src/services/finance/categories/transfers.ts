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

export class FinanceTransfers {
  // CATEGORY 3: TRANSFER OPERATIONS (6/6 operations) ✅
  // ==========================================================================

  /**
   * 8. Transfer User to User
   */
  static async transferUserToUser(input: TransferInput): Promise<TransactionResult> {
    try {
      const { fromUserId, fromWalletId, toUserId, toWalletId, amount, currency, description, metadata } = input;

      const fromWallet = await prisma.wallet.findUnique({ where: { id: fromWalletId } });
      if (!fromWallet || fromWallet.userId !== fromUserId) {
        return { success: false, error: 'Invalid source wallet' };
      }

      const toWallet = await prisma.wallet.findUnique({ where: { id: toWalletId } });
      if (!toWallet || toWallet.userId !== toUserId) {
        return { success: false, error: 'Invalid destination wallet' };
      }

      if (fromWallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER,
          netAmount: amount,
          purpose: 'Internal Transfer',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          description: description ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(fromWalletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(toWalletId, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER,
        userId: fromUserId,
        transactionId: transaction.id,
        metadata: { toUserId, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('User to user transfer failed:', error);
      return { success: false, error: 'Transfer failed' };
    }
  }

  /**
   * 9. Transfer Admin to User
   */
  static async transferAdminToUser(input: TransferInput): Promise<TransactionResult> {
    try {
      const { fromUserId, fromWalletId, toUserId, toWalletId, amount, currency, description, metadata } = input;

      // Verify admin permissions
      const user = await prisma.user.findUnique({ where: { id: fromUserId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      const hasPermission = await PermissionService.isSuperAdmin(user.role);

      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_ADMIN_TO_USER,
          netAmount: amount,
          purpose: 'Admin Transfer',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: description ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(toWalletId, { availableBalance: amount });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.TRANSFER_ADMIN_TO_USER,
        userId: fromUserId,
        transactionId: transaction.id,
        metadata: { toUserId, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Admin to user transfer failed:', error);
      return { success: false, error: 'Transfer failed' };
    }
  }

  /**
   * 10. Transfer User to We Wallet
   */
  static async transferUserToWeWallet(input: TransferInput): Promise<TransactionResult> {
    try {
      const { fromUserId, fromWalletId, amount, currency, description, metadata } = input;

      const fromWallet = await prisma.wallet.findUnique({ where: { id: fromWalletId } });
      if (!fromWallet || fromWallet.userId !== fromUserId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (fromWallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId: weWallet.id,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_WE,
          netAmount: amount,
          purpose: 'User to Platform Transfer',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          description: description ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(fromWalletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(weWallet.id, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_WE,
        userId: fromUserId,
        transactionId: transaction.id,
        metadata: { description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('User to We Wallet transfer failed:', error);
      return { success: false, error: 'Transfer failed' };
    }
  }

  /**
   * 11. Transfer We Wallet to User
   */
  static async transferWeWalletToUser(input: TransferInput & { approvedByUserId: string }): Promise<TransactionResult> {
    try {
      const { toUserId, toWalletId, amount, currency, description, metadata, approvedByUserId } = input;

      // Verify super admin approval
      const user = await prisma.user.findUnique({ where: { id: approvedByUserId } });
      if (!user) {
        return { success: false, error: 'Approver not found' };
      }

      const isSuperAdmin = await PermissionService.isSuperAdmin(user.role);
      if (!isSuperAdmin) {
        return { success: false, error: 'Super admin approval required' };
      }

      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      const toWallet = await prisma.wallet.findUnique({ where: { id: toWalletId } });
      if (!toWallet || toWallet.userId !== toUserId) {
        return { success: false, error: 'Invalid destination wallet' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER,
          netAmount: amount,
          purpose: 'Platform to User Transfer',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: description ?? null,
          metadata: JSON.stringify({ ...metadata, approvedBy: approvedByUserId }),
        },
      });

      await WalletService.updateWalletBalance(toWalletId, { availableBalance: amount });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { toUserId, description, approvedBy: approvedByUserId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('We Wallet to user transfer failed:', error);
      return { success: false, error: 'Transfer failed' };
    }
  }

  /**
   * 12. Batch Transfer
   */
  static async batchTransfer(input: BatchTransferInput): Promise<TransactionResult> {
    try {
      const { fromUserId, fromWalletId, transfers, currency, metadata } = input;

      const fromWallet = await prisma.wallet.findUnique({ where: { id: fromWalletId } });
      if (!fromWallet || fromWallet.userId !== fromUserId) {
        return { success: false, error: 'Invalid source wallet' };
      }

      const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);

      if (fromWallet.availableBalance < totalAmount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const transactionIds: string[] = [];

      for (const transfer of transfers) {
        const transaction = await prisma.walletTransaction.create({
          data: {
            fromWalletId,
            toWalletId: transfer.toWalletId,
            transactionType: TransactionType.TRANSFER,
            transactionHash: generateTransactionHash(),
            operationType: ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
            netAmount: transfer.amount,
            purpose: 'Bulk Transfer',
            amount: transfer.amount,
            currency,
            status: TransactionStatus.COMPLETED,
            description: transfer.description ?? null,
            metadata: JSON.stringify(metadata || {}),
          },
        });

        await WalletService.updateWalletBalance(fromWalletId, { availableBalance: -transfer.amount });
        await WalletService.updateWalletBalance(transfer.toWalletId, { availableBalance: transfer.amount });

        transactionIds.push(transaction.id);
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
        userId: fromUserId,
        transactionId: transactionIds[0] || '',
        metadata: { transferCount: transfers.length, transactionIds },
      });

      return { success: true, transactionId: transactionIds[0] || "" };
    } catch (error) {
      console.error('Batch transfer failed:', error);
      return { success: false, error: 'Batch transfer failed' };
    }
  }

}
