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

export class FinanceExpenses {
  // ==========================================================================
  // EXPENSE OPERATIONS
  // ==========================================================================

  /**
   * 54. Expense Creator Payment
   * Pay content creators for their work
   */
  static async expenseCreatorPayment(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        recipientId,
        recipientWalletId,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      if (!recipientId || !recipientWalletId) {
        return { success: false, error: 'Recipient ID and wallet ID are required' };
      }

      // Get platform wallet (source of payment)
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      // Check platform wallet has sufficient balance
      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Get recipient's wallet
      const recipientWallet = await prisma.wallet.findUnique({
        where: { id: recipientWalletId },
      });

      if (!recipientWallet || recipientWallet.userId !== recipientId) {
        return { success: false, error: 'Invalid recipient wallet' };
      }

      // Create expense transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: recipientWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_CREATOR_PAYMENT,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'CREATOR_PAYMENT',
            recipientId,
            approvedBy: approvedByUserId,
            contentId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      // Add to creator's wallet
      await WalletService.updateWalletBalance(recipientWalletId, {
        availableBalance: amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_CREATOR_PAYMENT,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { recipientId, amount, currency, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Creator payment expense failed:', error);
      return { success: false, error: 'Failed to process creator payment' };
    }
  }

  /**
   * 55. Expense Referral Payout
   * Pay referral rewards to users
   */
  static async expenseReferralPayout(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        recipientId,
        recipientWalletId,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      if (!recipientId || !recipientWalletId) {
        return { success: false, error: 'Recipient ID and wallet ID are required' };
      }

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Get recipient's wallet
      const recipientWallet = await prisma.wallet.findUnique({
        where: { id: recipientWalletId },
      });

      if (!recipientWallet || recipientWallet.userId !== recipientId) {
        return { success: false, error: 'Invalid recipient wallet' };
      }

      // Create expense transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: recipientWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_REFERRAL_PAYOUT,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'REFERRAL_PAYOUT',
            recipientId,
            approvedBy: approvedByUserId,
            referralId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      // Add to recipient's wallet
      await WalletService.updateWalletBalance(recipientWalletId, {
        availableBalance: amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_REFERRAL_PAYOUT,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { recipientId, amount, currency, referralId: sourceReferenceId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Referral payout expense failed:', error);
      return { success: false, error: 'Failed to process referral payout' };
    }
  }

  /**
   * 56. Expense Operational
   * Record operational expenses (servers, infrastructure, tools, etc.)
   */
  static async expenseOperational(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        externalRecipient,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Create expense transaction (external payment)
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: null, // External payment
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_OPERATIONAL,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'OPERATIONAL',
            externalRecipient,
            approvedBy: approvedByUserId,
            invoiceId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_OPERATIONAL,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { amount, currency, externalRecipient, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Operational expense failed:', error);
      return { success: false, error: 'Failed to record operational expense' };
    }
  }

  /**
   * 57. Expense Marketing
   * Record marketing and advertising expenses
   */
  static async expenseMarketing(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        externalRecipient,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Create expense transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: null,
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_MARKETING,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'MARKETING',
            externalRecipient,
            approvedBy: approvedByUserId,
            campaignId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_MARKETING,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { amount, currency, externalRecipient, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Marketing expense failed:', error);
      return { success: false, error: 'Failed to record marketing expense' };
    }
  }

  /**
   * 58. Expense Development
   * Record development and technology expenses
   */
  static async expenseDevelopment(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        recipientId,
        recipientWalletId,
        externalRecipient,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Determine if internal or external payment
      let toWalletId = null;
      if (recipientWalletId && recipientId) {
        const recipientWallet = await prisma.wallet.findUnique({
          where: { id: recipientWalletId },
        });
        if (recipientWallet && recipientWallet.userId === recipientId) {
          toWalletId = recipientWalletId;
        }
      }

      // Create expense transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId,
          transactionType: toWalletId ? TransactionType.TRANSFER : TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_DEVELOPMENT,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: toWalletId ? PaymentMethod.WALLET : PaymentMethod.BANK_TRANSFER,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'DEVELOPMENT',
            recipientId,
            externalRecipient,
            approvedBy: approvedByUserId,
            projectId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      // Add to recipient's wallet if internal
      if (toWalletId) {
        await WalletService.updateWalletBalance(toWalletId, {
          availableBalance: amount,
        });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_DEVELOPMENT,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { amount, currency, recipientId, externalRecipient, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Development expense failed:', error);
      return { success: false, error: 'Failed to record development expense' };
    }
  }

  /**
   * 59. Expense Support
   * Record customer support and service expenses
   */
  static async expenseSupport(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        recipientId,
        recipientWalletId,
        externalRecipient,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Determine if internal or external payment
      let toWalletId = null;
      if (recipientWalletId && recipientId) {
        const recipientWallet = await prisma.wallet.findUnique({
          where: { id: recipientWalletId },
        });
        if (recipientWallet && recipientWallet.userId === recipientId) {
          toWalletId = recipientWalletId;
        }
      }

      // Create expense transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId,
          transactionType: toWalletId ? TransactionType.TRANSFER : TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_SUPPORT,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: toWalletId ? PaymentMethod.WALLET : PaymentMethod.BANK_TRANSFER,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'SUPPORT',
            recipientId,
            externalRecipient,
            approvedBy: approvedByUserId,
            ticketId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      // Add to recipient's wallet if internal
      if (toWalletId) {
        await WalletService.updateWalletBalance(toWalletId, {
          availableBalance: amount,
        });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_SUPPORT,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { amount, currency, recipientId, externalRecipient, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Support expense failed:', error);
      return { success: false, error: 'Failed to record support expense' };
    }
  }

  /**
   * 60. Expense Compliance
   * Record legal, compliance, and regulatory expenses
   */
  static async expenseCompliance(input: ExpenseInput): Promise<TransactionResult> {
    try {
      const { 
        amount, 
        currency, 
        externalRecipient,
        description,
        approvedByUserId,
        sourceReferenceId,
        metadata 
      } = input;

      // Get platform wallet
      const weWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.WE_WALLET },
      });

      if (!weWallet) {
        return { success: false, error: 'Platform wallet not found' };
      }

      if (weWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient platform balance. Required: ${amount}, Available: ${weWallet.availableBalance}` 
        };
      }

      // Create expense transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: weWallet.id,
          toWalletId: null,
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.EXPENSE_COMPLIANCE,
          netAmount: amount,
          purpose: description,
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          externalReference: sourceReferenceId || null,
          metadata: JSON.stringify({ 
            ...metadata,
            expenseType: 'COMPLIANCE',
            externalRecipient,
            approvedBy: approvedByUserId,
            caseId: sourceReferenceId
          }),
        },
      });

      // Deduct from platform wallet
      await WalletService.updateWalletBalance(weWallet.id, {
        availableBalance: -amount,
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.EXPENSE_COMPLIANCE,
        userId: approvedByUserId,
        transactionId: transaction.id,
        metadata: { amount, currency, externalRecipient, description },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Compliance expense failed:', error);
      return { success: false, error: 'Failed to record compliance expense' };
    }
  }
}
