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

export class FinanceRevenue {
  // ==========================================================================
  // REVENUE TRACKING OPERATIONS
  // ==========================================================================

  /**
   * 51. Track Transaction Fees Revenue
   * Records platform fees collected from transactions as revenue
   */
  static async trackTransactionFeesRevenue(input: RevenueTrackingInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        sourceReferenceId, 
        description,
        metadata 
      } = input;

      // Get platform wallet (destination for revenue)
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Create revenue transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null, // Revenue from external/fees
          toWalletId: weWallet.id,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REVENUE_TRANSACTION_FEES,
          netAmount: amount,
          purpose: description || 'Transaction Fees Revenue',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: sourceReferenceId,
          metadata: JSON.stringify({ 
            ...metadata,
            revenueType: 'TRANSACTION_FEES',
            sourceReferenceId,
            recordedAt: new Date().toISOString()
          }),
        },
      });

      // Add revenue to platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REVENUE_TRANSACTION_FEES,
        userId: 'SYSTEM',
        transactionId: transaction.id,
        metadata: { 
          amount, 
          currency, 
          sourceReferenceId,
          revenueType: 'TRANSACTION_FEES'
        },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Track transaction fees revenue failed:', error);
      return { success: false, error: 'Failed to track transaction fees revenue' };
    }
  }

  /**
   * 52. Track Services Revenue
   * Records revenue from service bookings and professional services
   */
  static async trackServicesRevenue(input: RevenueTrackingInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        sourceReferenceId, 
        sourceType,
        description,
        metadata 
      } = input;

      // Get platform wallet (destination for revenue)
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Create revenue transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null, // Revenue from service payments
          toWalletId: weWallet.id,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REVENUE_SERVICES,
          netAmount: amount,
          purpose: description || 'Services Revenue',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: sourceReferenceId,
          metadata: JSON.stringify({ 
            ...metadata,
            revenueType: 'SERVICES',
            sourceType: sourceType || 'SERVICE_BOOKING',
            sourceReferenceId,
            recordedAt: new Date().toISOString()
          }),
        },
      });

      // Add revenue to platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REVENUE_SERVICES,
        userId: 'SYSTEM',
        transactionId: transaction.id,
        metadata: { 
          amount, 
          currency, 
          sourceReferenceId, 
          sourceType,
          revenueType: 'SERVICES'
        },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Track services revenue failed:', error);
      return { success: false, error: 'Failed to track services revenue' };
    }
  }

  /**
   * 53. Track Partnerships Revenue
   * Records revenue from strategic partnerships and collaborations
   */
  static async trackPartnershipsRevenue(input: RevenueTrackingInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        sourceReferenceId, 
        sourceType,
        description,
        metadata 
      } = input;

      // Get platform wallet (destination for revenue)
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Create revenue transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null, // Revenue from partnerships
          toWalletId: weWallet.id,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.REVENUE_PARTNERSHIPS,
          netAmount: amount,
          purpose: description || 'Partnership Revenue',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: sourceReferenceId,
          metadata: JSON.stringify({ 
            ...metadata,
            revenueType: 'PARTNERSHIPS',
            sourceType: sourceType || 'STRATEGIC_PARTNERSHIP',
            sourceReferenceId,
            recordedAt: new Date().toISOString()
          }),
        },
      });

      // Add revenue to platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.REVENUE_PARTNERSHIPS,
        userId: 'SYSTEM',
        transactionId: transaction.id,
        metadata: { 
          amount, 
          currency, 
          sourceReferenceId, 
          sourceType,
          revenueType: 'PARTNERSHIPS'
        },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Track partnerships revenue failed:', error);
      return { success: false, error: 'Failed to track partnerships revenue' };
    }
  }
}
