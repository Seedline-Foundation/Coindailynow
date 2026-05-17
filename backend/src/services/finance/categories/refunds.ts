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

export class FinanceRefunds {
  // CATEGORY 5: REFUND OPERATIONS (4/4 operations) ✅
  // ==========================================================================

  /**
   * 19. Process Full Refund
   */
  static async processFullRefund(input: RefundInput): Promise<TransactionResult> {
    try {
      const { originalTransactionId, reason, metadata } = input;

      // Get the original transaction
      const originalTx = await prisma.walletTransaction.findUnique({
        where: { id: originalTransactionId },
      });

      if (!originalTx) {
        return { success: false, error: 'Original transaction not found' };
      }

      if (originalTx.status === TransactionStatus.REFUNDED) {
        return { success: false, error: 'Transaction already refunded' };
      }

      // Create refund transaction (reverse the original)
      const refundTransaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: originalTx.toWalletId,
          toWalletId: originalTx.fromWalletId,
          transactionType: TransactionType.REFUND,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REFUND_FULL,
          netAmount: originalTx.amount,
          purpose: 'Full Refund',
          amount: originalTx.amount,
          currency: originalTx.currency,
          status: TransactionStatus.PENDING,
          paymentMethod: originalTx.paymentMethod,
          externalReference: originalTransactionId,
          description: reason,
          metadata: JSON.stringify({ ...metadata, originalTransactionId, reason }),
        },
      });

      // Reverse the wallet balances
      if (originalTx.fromWalletId) {
        await WalletService.updateWalletBalance(originalTx.fromWalletId, { 
          availableBalance: originalTx.amount 
        });
      }
      if (originalTx.toWalletId) {
        await WalletService.updateWalletBalance(originalTx.toWalletId, { 
          availableBalance: -originalTx.amount 
        });
      }

      // Update both transactions
      await prisma.walletTransaction.update({
        where: { id: originalTransactionId },
        data: { status: TransactionStatus.REFUNDED },
      });

      await prisma.walletTransaction.update({
        where: { id: refundTransaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REFUND_FULL,
        userId: 'system',
        transactionId: refundTransaction.id,
        metadata: { originalTransactionId, reason },
      });

      return { success: true, transactionId: refundTransaction.id };
    } catch (error) {
      console.error('Full refund failed:', error);
      return { success: false, error: 'Full refund failed' };
    }
  }

  /**
   * 20. Process Partial Refund
   */
  static async processPartialRefund(input: RefundInput): Promise<TransactionResult> {
    try {
      const { originalTransactionId, amount, reason, metadata } = input;

      if (!amount || amount <= 0) {
        return { success: false, error: 'Refund amount must be greater than zero' };
      }

      const originalTx = await prisma.walletTransaction.findUnique({
        where: { id: originalTransactionId },
      });

      if (!originalTx) {
        return { success: false, error: 'Original transaction not found' };
      }

      if (amount > originalTx.amount) {
        return { success: false, error: 'Refund amount exceeds original transaction amount' };
      }

      // Create partial refund transaction
      const refundTransaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: originalTx.toWalletId,
          toWalletId: originalTx.fromWalletId,
          transactionType: TransactionType.REFUND,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REFUND_PARTIAL,
          netAmount: amount,
          purpose: 'Partial Refund',
          amount,
          currency: originalTx.currency,
          status: TransactionStatus.PENDING,
          paymentMethod: originalTx.paymentMethod,
          externalReference: originalTransactionId,
          description: reason,
          metadata: JSON.stringify({ ...metadata, originalTransactionId, reason, partialAmount: amount }),
        },
      });

      // Reverse partial amount
      if (originalTx.fromWalletId) {
        await WalletService.updateWalletBalance(originalTx.fromWalletId, { 
          availableBalance: amount 
        });
      }
      if (originalTx.toWalletId) {
        await WalletService.updateWalletBalance(originalTx.toWalletId, { 
          availableBalance: -amount 
        });
      }

      await prisma.walletTransaction.update({
        where: { id: refundTransaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REFUND_PARTIAL,
        userId: 'system',
        transactionId: refundTransaction.id,
        metadata: { originalTransactionId, reason, partialAmount: amount },
      });

      return { success: true, transactionId: refundTransaction.id };
    } catch (error) {
      console.error('Partial refund failed:', error);
      return { success: false, error: 'Partial refund failed' };
    }
  }

  /**
   * 21. Process Subscription Refund
   */
  static async processSubscriptionRefund(input: RefundInput): Promise<TransactionResult> {
    try {
      const { originalTransactionId, amount, reason, metadata } = input;

      const originalTx = await prisma.walletTransaction.findUnique({
        where: { id: originalTransactionId },
      });

      if (!originalTx) {
        return { success: false, error: 'Original subscription payment not found' };
      }

      if (originalTx.operationType !== ALL_FINANCE_OPERATIONS.PAYMENT_SUBSCRIPTION) {
        return { success: false, error: 'Transaction is not a subscription payment' };
      }

      const refundAmount = amount || originalTx.amount;

      // Create subscription refund transaction
      const refundTransaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: originalTx.toWalletId,
          toWalletId: originalTx.fromWalletId,
          transactionType: TransactionType.REFUND,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REFUND_SUBSCRIPTION,
          netAmount: refundAmount,
          purpose: 'Subscription Refund',
          amount: refundAmount,
          currency: originalTx.currency,
          status: TransactionStatus.PENDING,
          paymentMethod: originalTx.paymentMethod,
          externalReference: originalTransactionId,
          description: reason,
          metadata: JSON.stringify({ ...metadata, originalTransactionId, reason, subscriptionRefund: true }),
        },
      });

      // Reverse the subscription payment
      if (originalTx.fromWalletId) {
        await WalletService.updateWalletBalance(originalTx.fromWalletId, { 
          availableBalance: refundAmount 
        });
      }
      if (originalTx.toWalletId) {
        await WalletService.updateWalletBalance(originalTx.toWalletId, { 
          availableBalance: -refundAmount 
        });
      }

      await prisma.walletTransaction.update({
        where: { id: originalTransactionId },
        data: { status: TransactionStatus.REFUNDED },
      });

      await prisma.walletTransaction.update({
        where: { id: refundTransaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REFUND_SUBSCRIPTION,
        userId: 'system',
        transactionId: refundTransaction.id,
        metadata: { originalTransactionId, reason, subscriptionId: originalTx.externalReference },
      });

      return { success: true, transactionId: refundTransaction.id };
    } catch (error) {
      console.error('Subscription refund failed:', error);
      return { success: false, error: 'Subscription refund failed' };
    }
  }

  /**
   * 22. Handle Chargeback
   */
  static async handleChargeback(input: RefundInput): Promise<TransactionResult> {
    try {
      const { originalTransactionId, reason, metadata } = input;

      const originalTx = await prisma.walletTransaction.findUnique({
        where: { id: originalTransactionId },
      });

      if (!originalTx) {
        return { success: false, error: 'Original transaction not found' };
      }

      // Create chargeback transaction
      const chargebackTransaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: originalTx.toWalletId,
          toWalletId: originalTx.fromWalletId,
          transactionType: TransactionType.REFUND,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REFUND_CHARGEBACK,
          netAmount: originalTx.amount,
          purpose: 'Chargeback',
          amount: originalTx.amount,
          currency: originalTx.currency,
          status: TransactionStatus.PENDING,
          paymentMethod: originalTx.paymentMethod,
          externalReference: originalTransactionId,
          description: reason,
          metadata: JSON.stringify({ ...metadata, originalTransactionId, reason, chargeback: true, disputeReason: reason }),
        },
      });

      // Reverse the transaction due to chargeback
      if (originalTx.fromWalletId) {
        await WalletService.updateWalletBalance(originalTx.fromWalletId, { 
          availableBalance: originalTx.amount 
        });
      }
      if (originalTx.toWalletId) {
        await WalletService.updateWalletBalance(originalTx.toWalletId, { 
          availableBalance: -originalTx.amount 
        });
      }

      // Update original transaction status
      await prisma.walletTransaction.update({
        where: { id: originalTransactionId },
        data: { status: TransactionStatus.CANCELLED },
      });

      await prisma.walletTransaction.update({
        where: { id: chargebackTransaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REFUND_CHARGEBACK,
        userId: 'system',
        transactionId: chargebackTransaction.id,
        metadata: { originalTransactionId, reason, chargeback: true },
      });

      return { success: true, transactionId: chargebackTransaction.id };
    } catch (error) {
      console.error('Chargeback handling failed:', error);
      return { success: false, error: 'Chargeback handling failed' };
    }
  }

}
