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

export class FinanceGifts {
  // CATEGORY 10: GIFT & DONATION OPERATIONS (3/3 operations) ✅
  // ==========================================================================

  /**
   * 35. Send Gift
   * Send a gift to another user
   */
  static async sendGift(input: GiftInput): Promise<TransactionResult> {
    try {
      const { 
        fromUserId, 
        fromWalletId, 
        toUserId, 
        amount, 
        currency, 
        message,
        metadata 
      } = input;

      // Get sender's wallet
      const fromWallet = await prisma.wallet.findUnique({
        where: { id: fromWalletId },
      });

      if (!fromWallet) {
        return { success: false, error: 'Sender wallet not found' };
      }

      // Check if sender has sufficient balance
      if (fromWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Required: ${amount}, Available: ${fromWallet.availableBalance}` 
        };
      }

      // Get recipient's wallet
      const toWallet = await prisma.wallet.findFirst({
        where: { userId: toUserId, walletType: WalletType.USER_WALLET },
      });

      if (!toWallet) {
        return { success: false, error: 'Recipient wallet not found' };
      }

      // Deduct from sender
      await WalletService.updateWalletBalance(fromWalletId, {
        availableBalance: -amount,
      });

      // Add to recipient
      await WalletService.updateWalletBalance(toWallet.id, {
        availableBalance: amount,
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId: toWallet.id,
          transactionType: TransactionType.GIFT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.GIFT_SEND,
          netAmount: amount,
          purpose: message || 'Gift',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          metadata: JSON.stringify({ 
            ...metadata, 
            fromUserId,
            toUserId,
            message,
            type: 'GIFT'
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.GIFT_SEND,
        userId: fromUserId,
        transactionId: transaction.id,
        metadata: { toUserId, amount, currency, message },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Send gift failed:', error);
      return { success: false, error: 'Send gift failed' };
    }
  }

  /**
   * 36. Send Tip
   * Tip a content creator
   */
  static async sendTip(input: {
    fromUserId: string;
    fromWalletId: string;
    toUserId: string;
    contentId?: string;
    amount: number;
    currency: string;
    message?: string;
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { 
        fromUserId, 
        fromWalletId, 
        toUserId, 
        contentId,
        amount, 
        currency, 
        message,
        metadata 
      } = input;

      // Get sender's wallet
      const fromWallet = await prisma.wallet.findUnique({
        where: { id: fromWalletId },
      });

      if (!fromWallet) {
        return { success: false, error: 'Sender wallet not found' };
      }

      // Check if sender has sufficient balance
      if (fromWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Required: ${amount}, Available: ${fromWallet.availableBalance}` 
        };
      }

      // Get creator's wallet
      const toWallet = await prisma.wallet.findFirst({
        where: { userId: toUserId, walletType: WalletType.USER_WALLET },
      });

      if (!toWallet) {
        return { success: false, error: 'Creator wallet not found' };
      }

      // Calculate platform fee (e.g., 5% of tip)
      const platformFeePercentage = 0.05;
      const platformFee = amount * platformFeePercentage;
      const creatorAmount = amount - platformFee;

      // Get WE wallet for platform fee
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Deduct from sender
      await WalletService.updateWalletBalance(fromWalletId, {
        availableBalance: -amount,
      });

      // Add to creator (minus platform fee)
      await WalletService.updateWalletBalance(toWallet.id, {
        availableBalance: creatorAmount,
      });

      // Add platform fee to WE wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: platformFee,
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId: toWallet.id,
          transactionType: TransactionType.GIFT, // Using GIFT type for tips
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.TIP_SEND,
          netAmount: creatorAmount,
          fee: platformFee,
          purpose: message || 'Tip for content',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: contentId || null,
          metadata: JSON.stringify({ 
            ...metadata, 
            fromUserId,
            toUserId,
            contentId,
            message,
            platformFee,
            creatorAmount,
            type: 'TIP'
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.TIP_SEND,
        userId: fromUserId,
        transactionId: transaction.id,
        metadata: { toUserId, contentId, amount, currency, platformFee },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Send tip failed:', error);
      return { success: false, error: 'Send tip failed' };
    }
  }

  /**
   * 37. Send Donation
   * Donate to a creator or charity
   */
  static async sendDonation(input: {
    fromUserId: string;
    fromWalletId: string;
    toUserId: string;
    causeId?: string;
    amount: number;
    currency: string;
    message?: string;
    isAnonymous?: boolean;
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { 
        fromUserId, 
        fromWalletId, 
        toUserId, 
        causeId,
        amount, 
        currency, 
        message,
        isAnonymous = false,
        metadata 
      } = input;

      // Get sender's wallet
      const fromWallet = await prisma.wallet.findUnique({
        where: { id: fromWalletId },
      });

      if (!fromWallet) {
        return { success: false, error: 'Sender wallet not found' };
      }

      // Check if sender has sufficient balance
      if (fromWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Required: ${amount}, Available: ${fromWallet.availableBalance}` 
        };
      }

      // Get recipient's wallet (creator/charity)
      const toWallet = await prisma.wallet.findFirst({
        where: { userId: toUserId, walletType: WalletType.USER_WALLET },
      });

      if (!toWallet) {
        return { success: false, error: 'Recipient wallet not found' };
      }

      // Deduct from sender
      await WalletService.updateWalletBalance(fromWalletId, {
        availableBalance: -amount,
      });

      // Add to recipient (full amount for donations, no platform fee)
      await WalletService.updateWalletBalance(toWallet.id, {
        availableBalance: amount,
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId,
          toWalletId: toWallet.id,
          transactionType: TransactionType.DONATION,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.DONATION_SEND,
          netAmount: amount,
          purpose: message || 'Donation',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: causeId || null,
          metadata: JSON.stringify({ 
            ...metadata, 
            fromUserId: isAnonymous ? 'ANONYMOUS' : fromUserId,
            toUserId,
            causeId,
            message,
            isAnonymous,
            type: 'DONATION'
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.DONATION_SEND,
        userId: fromUserId,
        transactionId: transaction.id,
        metadata: { toUserId, causeId, amount, currency, isAnonymous },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Send donation failed:', error);
      return { success: false, error: 'Send donation failed' };
    }
  }

}
