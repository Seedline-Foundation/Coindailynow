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

export class FinanceWithdrawals {
  // ==========================================================================
  // CATEGORY 2: WITHDRAWAL OPERATIONS (3/3 operations) ✅
  // ==========================================================================

  /**
   * 5. Withdraw to External Wallet
   */
  static async withdrawToExternalWallet(input: WithdrawalInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, destinationAddress, otpCode, metadata } = input;

      if (requiresOTP(ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL) && !otpCode) {
        return { success: false, error: 'OTP required', requiresOTP: true };
      }

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL,
          netAmount: amount,
          purpose: 'External Wallet Withdrawal',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.CRYPTO,
          externalReference: destinationAddress,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL,
        userId,
        transactionId: transaction.id,
        metadata: { destinationAddress },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Withdrawal to external wallet failed:', error);
      return { success: false, error: 'Withdrawal failed' };
    }
  }

  /**
   * 6. Withdraw via Mobile Money
   */
  static async withdrawViaMobileMoney(input: WithdrawalInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, destinationAddress, otpCode, metadata } = input;

      if (requiresOTP(ALL_FINANCE_OPERATIONS.WITHDRAWAL_MOBILE_MONEY) && !otpCode) {
        return { success: false, error: 'OTP required', requiresOTP: true };
      }

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.WITHDRAWAL_MOBILE_MONEY,
          netAmount: amount,
          purpose: 'Mobile Money Withdrawal',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.MOBILE_MONEY,
          externalReference: destinationAddress,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WITHDRAWAL_MOBILE_MONEY,
        userId,
        transactionId: transaction.id,
        metadata: { destinationAddress },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Withdrawal via mobile money failed:', error);
      return { success: false, error: 'Withdrawal failed' };
    }
  }

  /**
   * 7. Withdraw to Bank Account
   */
  static async withdrawToBankAccount(input: WithdrawalInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, destinationAddress, otpCode, metadata } = input;

      if (requiresOTP(ALL_FINANCE_OPERATIONS.WITHDRAWAL_BANK) && !otpCode) {
        return { success: false, error: 'OTP required', requiresOTP: true };
      }

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          transactionType: TransactionType.WITHDRAWAL,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.WITHDRAWAL_BANK,
          netAmount: amount,
          purpose: 'Bank Transfer Withdrawal',
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          externalReference: destinationAddress,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await WalletService.updateWalletBalance(walletId, { availableBalance: -amount });

      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.WITHDRAWAL_BANK,
        userId,
        transactionId: transaction.id,
        metadata: { destinationAddress },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Withdrawal to bank account failed:', error);
      return { success: false, error: 'Withdrawal failed' };
    }
  }

}
