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

export class FinanceDeposits {
  // ==========================================================================
  // CATEGORY 1: DEPOSIT OPERATIONS (4/4 operations) ✅
  // ==========================================================================

  /**
   * 1. Deposit from External Wallet
   */
  static async depositFromExternalWallet(input: DepositInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, externalReference, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        return { success: false, error: 'Wallet is not active' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.DEPOSIT_EXTERNAL,
          netAmount: amount,
          purpose: 'External Wallet Deposit',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.CRYPTO,
          externalReference: externalReference ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.DEPOSIT_EXTERNAL,
        userId,
        transactionId: transaction.id,
        metadata: { externalReference },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Deposit from external wallet failed:', error);
      return { success: false, error: 'Deposit failed' };
    }
  }

  /**
   * 2. Deposit via Mobile Money
   */
  static async depositViaMobileMoney(input: DepositInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, externalReference, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.DEPOSIT_MOBILE_MONEY,
          netAmount: amount,
          purpose: 'Mobile Money Deposit',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.MOBILE_MONEY,
          externalReference: externalReference ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.DEPOSIT_MOBILE_MONEY,
        userId,
        transactionId: transaction.id,
        metadata: { externalReference },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Deposit via mobile money failed:', error);
      return { success: false, error: 'Deposit failed' };
    }
  }

  /**
   * 3. Deposit via Card
   */
  static async depositViaCard(input: DepositInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, externalReference, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.DEPOSIT_CARD,
          netAmount: amount,
          purpose: 'Card Deposit',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.CARD,
          externalReference: externalReference ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.DEPOSIT_CARD,
        userId,
        transactionId: transaction.id,
        metadata: { externalReference },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Deposit via card failed:', error);
      return { success: false, error: 'Deposit failed' };
    }
  }

  /**
   * 4. Deposit via Bank Transfer
   */
  static async depositViaBankTransfer(input: DepositInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, externalReference, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.DEPOSIT_BANK_TRANSFER,
          netAmount: amount,
          purpose: 'Bank Transfer Deposit',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          externalReference: externalReference ?? null,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.DEPOSIT_BANK_TRANSFER,
        userId,
        transactionId: transaction.id,
        metadata: { externalReference },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Deposit via bank transfer failed:', error);
      return { success: false, error: 'Deposit failed' };
    }
  }
}
