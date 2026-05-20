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

export class FinancePayments {
  // CATEGORY 4: PAYMENT OPERATIONS (5/5 operations) ✅
  // ==========================================================================

  /**
   * 14. Process Subscription Payment
   */
  static async processSubscriptionPayment(input: PaymentInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, referenceId, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          toWalletId: weWallet.id,
          transactionType: TransactionType.PAYMENT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.PAYMENT_SUBSCRIPTION,
          netAmount: amount,
          purpose: 'Subscription Payment',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: referenceId,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(weWallet.id, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.PAYMENT_SUBSCRIPTION,
        userId,
        transactionId: transaction.id,
        metadata: { subscriptionId: referenceId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Subscription payment failed:', error);
      return { success: false, error: 'Subscription payment failed' };
    }
  }

  /**
   * 15. Process Product Payment
   */
  static async processProductPayment(input: PaymentInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, referenceId, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
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
          fromWalletId: walletId,
          toWalletId: weWallet.id,
          transactionType: TransactionType.PAYMENT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.PAYMENT_PRODUCT,
          netAmount: amount,
          purpose: 'Product Purchase',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: referenceId,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(weWallet.id, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.PAYMENT_PRODUCT,
        userId,
        transactionId: transaction.id,
        metadata: { productId: referenceId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Product payment failed:', error);
      return { success: false, error: 'Product payment failed' };
    }
  }

  /**
   * 16. Process Service Payment
   */
  static async processServicePayment(input: PaymentInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, referenceId, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
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
          fromWalletId: walletId,
          toWalletId: weWallet.id,
          transactionType: TransactionType.PAYMENT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.PAYMENT_SERVICE,
          netAmount: amount,
          purpose: 'Service Booking Payment',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: referenceId,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(weWallet.id, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.PAYMENT_SERVICE,
        userId,
        transactionId: transaction.id,
        metadata: { serviceId: referenceId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Service payment failed:', error);
      return { success: false, error: 'Service payment failed' };
    }
  }

  /**
   * 17. Process Premium Content Payment
   */
  static async processPremiumContentPayment(input: PaymentInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, referenceId, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
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
          fromWalletId: walletId,
          toWalletId: weWallet.id,
          transactionType: TransactionType.PAYMENT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.PAYMENT_PREMIUM_CONTENT,
          netAmount: amount,
          purpose: 'Premium Content Payment',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: referenceId,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(weWallet.id, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.PAYMENT_PREMIUM_CONTENT,
        userId,
        transactionId: transaction.id,
        metadata: { contentId: referenceId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Premium content payment failed:', error);
      return { success: false, error: 'Premium content payment failed' };
    }
  }

  /**
   * 18. Process Boost Campaign Payment
   */
  static async processBoostCampaignPayment(input: PaymentInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, referenceId, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
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
          fromWalletId: walletId,
          toWalletId: weWallet.id,
          transactionType: TransactionType.PAYMENT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.PAYMENT_BOOST_CAMPAIGN,
          netAmount: amount,
          purpose: 'Boost Campaign Payment',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: referenceId,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });
      await WalletService.updateWalletBalance(weWallet.id, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.PAYMENT_BOOST_CAMPAIGN,
        userId,
        transactionId: transaction.id,
        metadata: { campaignId: referenceId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Boost campaign payment failed:', error);
      return { success: false, error: 'Boost campaign payment failed' };
    }
  }

}
