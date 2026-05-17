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

export class FinanceSubscriptions {
  static async subscriptionAutoRenew(input: SubscriptionAutoRenewInput): Promise<SubscriptionResult> {
    try {
      const { subscriptionId, userId, walletId, amount, currency, paymentMethod, metadata } = input;

      // Validate subscription exists and is active
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { SubscriptionPlan: true }
      });

      if (!subscription || subscription.userId !== userId) {
        return { success: false, error: 'Invalid subscription' };
      }

      if (subscription.status !== 'ACTIVE') {
        return { success: false, error: 'Subscription is not active' };
      }

      // Check if subscription is set to cancel at period end
      if (subscription.cancelAtPeriodEnd) {
        return { success: false, error: 'Subscription is set to cancel' };
      }

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance for auto-renewal' };
      }

      // Create auto-renewal transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          toWalletId: null,
          transactionType: TransactionType.PAYMENT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_AUTO_RENEW,
          netAmount: amount,
          purpose: 'Subscription Auto-Renewal',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          description: `Auto-renewal for ${subscription.SubscriptionPlan.name} plan`,
          metadata: JSON.stringify({ 
            ...metadata, 
            subscriptionId, 
            planId: subscription.planId,
            billingPeriod: subscription.SubscriptionPlan.billingInterval 
          }),
        },
      });

      // Update wallet balance
      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });

      // Update subscription period
      const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
      const newPeriodStart = currentPeriodEnd;
      const newPeriodEnd = new Date(currentPeriodEnd);
      
      // Calculate next period based on billing interval
      if (subscription.SubscriptionPlan.billingInterval === 'MONTHLY') {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      } else if (subscription.SubscriptionPlan.billingInterval === 'YEARLY') {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      }

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          updatedAt: new Date(),
        },
      });

      // Create subscription payment record
      await prisma.subscriptionPaymentRecord.create({
        data: {
          subscriptionId,
          transactionId: transaction.id,
          userId,
          amount,
          currency,
          paymentMethod,
          status: 'COMPLETED',
          nextBillingDate: newPeriodEnd,
          invoiceNumber: `INV-${Date.now()}-${subscriptionId.slice(-8)}`,
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_AUTO_RENEW,
        userId,
        transactionId: transaction.id,
        metadata: { subscriptionId, amount, currency, nextBillingDate: newPeriodEnd },
      });

      return {
        success: true,
        subscriptionId,
        transactionId: transaction.id,
        newStatus: 'ACTIVE',
        nextBillingDate: newPeriodEnd,
      };
    } catch (error) {
      console.error('Subscription auto-renewal failed:', error);
      return { success: false, error: 'Auto-renewal failed' };
    }
  }

  /**
   * 79. Subscription Upgrade
   */
  static async subscriptionUpgrade(input: SubscriptionUpgradeInput): Promise<SubscriptionResult> {
    try {
      const { subscriptionId, userId, walletId, newPlanId, prorationAmount = 0, currency, paymentMethod, metadata } = input;

      // Validate subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { SubscriptionPlan: true }
      });

      if (!subscription || subscription.userId !== userId) {
        return { success: false, error: 'Invalid subscription' };
      }

      // Validate new plan
      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId }
      });

      if (!newPlan || !newPlan.isActive) {
        return { success: false, error: 'Invalid or inactive plan' };
      }

      // Validate that this is actually an upgrade (higher price)
      if (newPlan.priceCents <= subscription.SubscriptionPlan.priceCents) {
        return { success: false, error: 'New plan must be higher tier than current plan' };
      }

      // Validate wallet if proration amount > 0
      if (prorationAmount > 0) {
        const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
        if (!wallet || wallet.userId !== userId) {
          return { success: false, error: 'Invalid wallet' };
        }

        if (wallet.availableBalance < prorationAmount) {
          return { success: false, error: 'Insufficient balance for upgrade' };
        }
      }

      let transactionId: string | undefined;

      // Create upgrade transaction if there's a proration amount
      if (prorationAmount > 0) {
        const transaction = await prisma.walletTransaction.create({
          data: {
            fromWalletId: walletId,
            toWalletId: null,
            transactionType: TransactionType.PAYMENT,
            transactionHash: generateTransactionHash(),
            operationType: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_UPGRADE,
            netAmount: prorationAmount,
            purpose: 'Subscription Upgrade',
            amount: prorationAmount,
            currency,
            status: TransactionStatus.COMPLETED,
            description: `Upgrade from ${subscription.SubscriptionPlan.name} to ${newPlan.name}`,
            metadata: JSON.stringify({ 
              ...metadata, 
              subscriptionId, 
              oldPlanId: subscription.planId,
              newPlanId,
              prorationAmount 
            }),
          },
        });

        transactionId = transaction.id;

        // Update wallet balance
        await WalletService.updateWalletBalance(walletId, { availableBalance: -prorationAmount });
      }

      // Update subscription plan
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlanId,
          updatedAt: new Date(),
        },
      });

      // Create subscription payment record
      if (transactionId) {
        await prisma.subscriptionPaymentRecord.create({
          data: {
            subscriptionId,
            transactionId,
            userId,
            amount: prorationAmount,
            currency,
            paymentMethod,
            status: 'COMPLETED',
            invoiceNumber: `INV-UPG-${Date.now()}-${subscriptionId.slice(-8)}`,
          },
        });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_UPGRADE,
        userId,
        transactionId: transactionId || subscriptionId,
        metadata: { subscriptionId, oldPlanId: subscription.planId, newPlanId, prorationAmount },
      });

      return {
        success: true,
        subscriptionId,
        transactionId: transactionId || null,
        newStatus: 'ACTIVE',
        prorationAmount,
      };
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      return { success: false, error: 'Upgrade failed' };
    }
  }

  /**
   * 80. Subscription Downgrade
   */
  static async subscriptionDowngrade(input: SubscriptionDowngradeInput): Promise<SubscriptionResult> {
    try {
      const { subscriptionId, userId, walletId, newPlanId, refundAmount = 0, currency, effectiveDate, metadata } = input;

      // Validate subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { SubscriptionPlan: true }
      });

      if (!subscription || subscription.userId !== userId) {
        return { success: false, error: 'Invalid subscription' };
      }

      // Validate new plan
      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId }
      });

      if (!newPlan || !newPlan.isActive) {
        return { success: false, error: 'Invalid or inactive plan' };
      }

      // Validate that this is actually a downgrade (lower price)
      if (newPlan.priceCents >= subscription.SubscriptionPlan.priceCents) {
        return { success: false, error: 'New plan must be lower tier than current plan' };
      }

      let transactionId: string | undefined;

      // Process refund if applicable
      if (refundAmount > 0 && walletId) {
        const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
        if (!wallet || wallet.userId !== userId) {
          return { success: false, error: 'Invalid wallet for refund' };
        }

        const transaction = await prisma.walletTransaction.create({
          data: {
            fromWalletId: null,
            toWalletId: walletId,
            transactionType: TransactionType.REFUND,
            transactionHash: generateTransactionHash(),
            operationType: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_DOWNGRADE,
            netAmount: refundAmount,
            purpose: 'Subscription Downgrade Refund',
            amount: refundAmount,
            currency: currency || 'USD',
            status: TransactionStatus.COMPLETED,
            description: `Downgrade refund from ${subscription.SubscriptionPlan.name} to ${newPlan.name}`,
            metadata: JSON.stringify({ 
              ...metadata, 
              subscriptionId, 
              oldPlanId: subscription.planId,
              newPlanId,
              refundAmount 
            }),
          },
        });

        transactionId = transaction.id;

        // Update wallet balance
        await WalletService.updateWalletBalance(walletId, { availableBalance: refundAmount });
      }

      // Update subscription - either immediately or at effective date
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (!effectiveDate || effectiveDate <= new Date()) {
        // Immediate downgrade
        updateData.planId = newPlanId;
      } else {
        // Schedule downgrade for end of current period
        updateData.cancelAtPeriodEnd = true;
        // Note: In a real implementation, you'd need a job scheduler to handle the actual downgrade
      }

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
      });

      // Create subscription payment record for the refund
      if (transactionId) {
        await prisma.subscriptionPaymentRecord.create({
          data: {
            subscriptionId,
            transactionId,
            userId,
            amount: -refundAmount, // Negative for refund
            currency: currency || 'USD',
            paymentMethod: 'WALLET_REFUND' as PaymentMethod,
            status: 'COMPLETED',
            invoiceNumber: `INV-DWN-${Date.now()}-${subscriptionId.slice(-8)}`,
          },
        });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_DOWNGRADE,
        userId,
        transactionId: transactionId || subscriptionId,
        metadata: { subscriptionId, oldPlanId: subscription.planId, newPlanId, refundAmount, effectiveDate },
      });

      return {
        success: true,
        subscriptionId,
        transactionId: transactionId || null,
        newStatus: !effectiveDate || effectiveDate <= new Date() ? 'ACTIVE' : 'PENDING_DOWNGRADE',
        refundAmount,
      };
    } catch (error) {
      console.error('Subscription downgrade failed:', error);
      return { success: false, error: 'Downgrade failed' };
    }
  }

  /**
   * 81. Subscription Pause
   */
  static async subscriptionPause(input: SubscriptionPauseInput): Promise<SubscriptionResult> {
    try {
      const { subscriptionId, userId, pauseReason, pauseDuration, resumeDate, refundAmount = 0, walletId, currency, metadata } = input;

      // Validate subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { SubscriptionPlan: true }
      });

      if (!subscription || subscription.userId !== userId) {
        return { success: false, error: 'Invalid subscription' };
      }

      if (subscription.status !== 'ACTIVE') {
        return { success: false, error: 'Can only pause active subscriptions' };
      }

      let transactionId: string | undefined;
      let calculatedResumeDate: Date | undefined;

      // Calculate resume date if duration is provided
      if (pauseDuration && !resumeDate) {
        calculatedResumeDate = new Date();
        calculatedResumeDate.setDate(calculatedResumeDate.getDate() + pauseDuration);
      } else if (resumeDate) {
        calculatedResumeDate = new Date(resumeDate);
      }

      // Process refund if applicable
      if (refundAmount > 0 && walletId) {
        const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
        if (!wallet || wallet.userId !== userId) {
          return { success: false, error: 'Invalid wallet for refund' };
        }

        const transaction = await prisma.walletTransaction.create({
          data: {
            fromWalletId: null,
            toWalletId: walletId,
            transactionType: TransactionType.REFUND,
            transactionHash: generateTransactionHash(),
            operationType: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_PAUSE,
            netAmount: refundAmount,
            purpose: 'Subscription Pause Refund',
            amount: refundAmount,
            currency: currency || 'USD',
            status: TransactionStatus.COMPLETED,
            description: `Pause refund for ${subscription.SubscriptionPlan.name} plan`,
            metadata: JSON.stringify({ 
              ...metadata, 
              subscriptionId, 
              pauseReason,
              pauseDuration,
              resumeDate: calculatedResumeDate,
              refundAmount 
            }),
          },
        });

        transactionId = transaction.id;

        // Update wallet balance
        await WalletService.updateWalletBalance(walletId, { availableBalance: refundAmount });
      }

      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'PAUSED',
          updatedAt: new Date(),
          // Note: In a real implementation, you'd add fields for pause metadata
        },
      });

      // Create subscription payment record for the pause (if there's a refund)
      if (transactionId) {
        await prisma.subscriptionPaymentRecord.create({
          data: {
            subscriptionId,
            transactionId,
            userId,
            amount: -refundAmount, // Negative for refund
            currency: currency || 'USD',
            paymentMethod: 'WALLET_REFUND' as PaymentMethod,
            status: 'COMPLETED',
            invoiceNumber: `INV-PSE-${Date.now()}-${subscriptionId.slice(-8)}`,
          },
        });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_PAUSE,
        userId,
        transactionId: transactionId || subscriptionId,
        metadata: { subscriptionId, pauseReason, pauseDuration, resumeDate: calculatedResumeDate, refundAmount },
      });

      return {
        success: true,
        subscriptionId,
        transactionId: transactionId || null,
        newStatus: 'PAUSED',
        refundAmount,
        resumeDate: calculatedResumeDate || null,
      };
    } catch (error) {
      console.error('Subscription pause failed:', error);
      return { success: false, error: 'Pause failed' };
    }
  }

  /**
   * 82. Subscription Cancel
   */
  static async subscriptionCancel(input: SubscriptionCancelInput): Promise<SubscriptionResult> {
    try {
      const { subscriptionId, userId, walletId, cancelReason, immediateCancel, refundAmount = 0, currency, metadata } = input;

      // Validate subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { SubscriptionPlan: true }
      });

      if (!subscription || subscription.userId !== userId) {
        return { success: false, error: 'Invalid subscription' };
      }

      if (subscription.status === 'CANCELLED') {
        return { success: false, error: 'Subscription is already cancelled' };
      }

      let transactionId: string | undefined;

      // Process refund if applicable
      if (refundAmount > 0 && walletId) {
        const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
        if (!wallet || wallet.userId !== userId) {
          return { success: false, error: 'Invalid wallet for refund' };
        }

        const transaction = await prisma.walletTransaction.create({
          data: {
            fromWalletId: null,
            toWalletId: walletId,
            transactionType: TransactionType.REFUND,
            transactionHash: generateTransactionHash(),
            operationType: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_CANCEL,
            netAmount: refundAmount,
            purpose: 'Subscription Cancellation Refund',
            amount: refundAmount,
            currency: currency || 'USD',
            status: TransactionStatus.COMPLETED,
            description: `Cancellation refund for ${subscription.SubscriptionPlan.name} plan`,
            metadata: JSON.stringify({ 
              ...metadata, 
              subscriptionId, 
              cancelReason,
              immediateCancel,
              refundAmount 
            }),
          },
        });

        transactionId = transaction.id;

        // Update wallet balance
        await WalletService.updateWalletBalance(walletId, { availableBalance: refundAmount });
      }

      // Update subscription
      const updateData: any = {
        updatedAt: new Date(),
        cancelledAt: new Date(),
      };

      if (immediateCancel) {
        updateData.status = 'CANCELLED';
      } else {
        // Cancel at period end
        updateData.cancelAtPeriodEnd = true;
      }

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
      });

      // Create subscription payment record for the cancellation (if there's a refund)
      if (transactionId) {
        await prisma.subscriptionPaymentRecord.create({
          data: {
            subscriptionId,
            transactionId,
            userId,
            amount: -refundAmount, // Negative for refund
            currency: currency || 'USD',
            paymentMethod: 'WALLET_REFUND' as PaymentMethod,
            status: 'COMPLETED',
            invoiceNumber: `INV-CAN-${Date.now()}-${subscriptionId.slice(-8)}`,
          },
        });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.SUBSCRIPTION_CANCEL,
        userId,
        transactionId: transactionId || subscriptionId,
        metadata: { subscriptionId, cancelReason, immediateCancel, refundAmount },
      });

      return {
        success: true,
        subscriptionId,
        transactionId: transactionId || null,
        newStatus: immediateCancel ? 'CANCELLED' : 'PENDING_CANCELLATION',
        refundAmount,
      };
    } catch (error) {
      console.error('Subscription cancel failed:', error);
      return { success: false, error: 'Cancellation failed' };
    }
  }
}
