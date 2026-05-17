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

export class FinanceFeesCommissions {
  // FEE & COMMISSION OPERATIONS
  // ==========================================================================

  /**
   * 43. Commission Referral - Pay referral commissions
   * When a referred user completes a qualifying action, pay commission to referrer
   */
  static async commissionReferral(input: CommissionInput): Promise<TransactionResult> {
    try {
      const { 
        referrerId, 
        refereeId, 
        referralId, 
        amount, 
        currency, 
        commissionRate,
        sourceTransactionId,
        metadata 
      } = input;

      // Calculate commission amount
      const commissionAmount = amount * (commissionRate / 100);

      // Get platform wallet (source of commission payment)
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Check platform wallet has sufficient balance
      if (weWallet.availableBalance < commissionAmount) {
        return { 
          success: false, 
          error: 'Insufficient platform balance for commission payment' 
        };
      }

      // Get referrer's wallet
      const referrerWallet = await prisma.wallet.findFirst({
        where: { 
          userId: referrerId, 
          walletType: WalletType.USER_WALLET 
        },
      });

      if (!referrerWallet) {
        return { success: false, error: 'Referrer wallet not found' };
      }

      // Create commission transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: referrerWallet.id,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.COMMISSION_REFERRAL,
          netAmount: commissionAmount,
          purpose: 'Referral Commission',
          amount: commissionAmount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: referralId,
          metadata: JSON.stringify({ 
            ...metadata,
            referrerId,
            refereeId,
            referralId,
            commissionRate,
            originalAmount: amount,
            sourceTransactionId,
            type: 'REFERRAL_COMMISSION'
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -commissionAmount,
      });

      // Add to referrer's wallet
      await WalletService.updateWalletBalance(referrerWallet.id, {
        availableBalance: commissionAmount,
      });

      // Update referral record to mark rewards as paid
      await prisma.referral.update({
        where: { id: referralId },
        data: { 
          rewardsPaid: true,
          referrerReward: commissionAmount,
          status: 'COMPLETED',
          completedAt: new Date()
        },
      });

      // Create user reward record for tracking
      await prisma.userReward.create({
        data: {
          userId: referrerId,
          rewardType: 'REFERRAL',
          points: Math.floor(commissionAmount), // Convert to points if needed
          source: referralId,
          sourceType: 'REFERRAL',
          description: `Referral commission for referring user`,
          metadata: JSON.stringify({
            refereeId,
            commissionAmount,
            currency,
            transactionId: transaction.id
          }),
          isProcessed: true,
          processedAt: new Date(),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.COMMISSION_REFERRAL,
        userId: referrerId,
        transactionId: transaction.id,
        metadata: { 
          refereeId, 
          referralId, 
          commissionAmount, 
          commissionRate, 
          currency 
        },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Referral commission failed:', error);
      return { success: false, error: 'Referral commission payment failed' };
    }
  }

  /**
   * 44. Commission Affiliate - Pay affiliate/influencer commissions
   * Pay commissions to affiliates and influencers for conversions and sales
   */
  static async commissionAffiliate(input: AffiliateCommissionInput): Promise<TransactionResult> {
    try {
      const { 
        affiliateUserId, 
        influencerId,
        partnershipId,
        amount, 
        currency, 
        commissionRate,
        sourceType,
        sourceReferenceId,
        metadata 
      } = input;

      // Calculate commission amount
      const commissionAmount = amount * (commissionRate / 100);

      // Get platform wallet (source of commission payment)
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Check platform wallet has sufficient balance
      if (weWallet.availableBalance < commissionAmount) {
        return { 
          success: false, 
          error: 'Insufficient platform balance for affiliate commission' 
        };
      }

      // Get affiliate's wallet
      const affiliateWallet = await prisma.wallet.findFirst({
        where: { 
          userId: affiliateUserId, 
          walletType: WalletType.USER_WALLET 
        },
      });

      if (!affiliateWallet) {
        return { success: false, error: 'Affiliate wallet not found' };
      }

      // Create commission transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: affiliateWallet.id,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.COMMISSION_AFFILIATE,
          netAmount: commissionAmount,
          purpose: `Affiliate Commission - ${sourceType}`,
          amount: commissionAmount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: sourceReferenceId,
          metadata: JSON.stringify({ 
            ...metadata,
            affiliateUserId,
            influencerId,
            partnershipId,
            commissionRate,
            originalAmount: amount,
            sourceType,
            sourceReferenceId,
            type: 'AFFILIATE_COMMISSION'
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -commissionAmount,
      });

      // Add to affiliate's wallet
      await WalletService.updateWalletBalance(affiliateWallet.id, {
        availableBalance: commissionAmount,
      });

      // Update influencer metrics if applicable
      if (influencerId) {
        await prisma.africanInfluencer.update({
          where: { id: influencerId },
          data: { 
            conversions: { increment: 1 },
            totalReach: { increment: 1 }
          },
        });
      }

      // Create user reward record for tracking
      await prisma.userReward.create({
        data: {
          userId: affiliateUserId,
          rewardType: 'AFFILIATE',
          points: Math.floor(commissionAmount), // Convert to points if needed
          source: sourceReferenceId,
          sourceType: sourceType,
          description: `Affiliate commission for ${sourceType.toLowerCase()}`,
          metadata: JSON.stringify({
            influencerId,
            partnershipId,
            commissionAmount,
            currency,
            transactionId: transaction.id,
            sourceType
          }),
          isProcessed: true,
          processedAt: new Date(),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.COMMISSION_AFFILIATE,
        userId: affiliateUserId,
        transactionId: transaction.id,
        metadata: { 
          influencerId,
          partnershipId,
          commissionAmount, 
          commissionRate, 
          sourceType,
          sourceReferenceId,
          currency 
        },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Affiliate commission failed:', error);
      return { success: false, error: 'Affiliate commission payment failed' };
    }
  }
}
