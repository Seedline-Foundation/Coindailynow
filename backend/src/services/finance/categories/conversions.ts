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

export class FinanceConversions {
  // CATEGORY 7: CONVERSION OPERATIONS (3/3 operations) ✅
  // ==========================================================================

  /**
   * 26. Convert CE Points to JOY Token
   * Users can convert earned CE Points to platform JOY token (one-way conversion)
   */
  static async convertCEToJOY(input: {
    userId: string;
    cePointsAmount: number;
    conversionRate: number; // How many CE Points = 1 JOY token
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { userId, cePointsAmount, conversionRate, metadata } = input;

      if (cePointsAmount <= 0) {
        return { success: false, error: 'CE Points amount must be positive' };
      }

      if (conversionRate <= 0) {
        return { success: false, error: 'Invalid conversion rate' };
      }

      // Calculate JOY tokens to receive
      const joyTokenAmount = cePointsAmount / conversionRate;

      // Get user's wallet
      const wallet = await prisma.wallet.findFirst({
        where: { userId, walletType: WalletType.USER_WALLET },
      });

      if (!wallet) {
        return { success: false, error: 'User wallet not found' };
      }

      // Check if user has enough CE Points
      if (wallet.cePoints < cePointsAmount) {
        return { success: false, error: 'Insufficient CE Points balance' };
      }

      // Deduct CE Points and add JOY tokens
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          cePoints: wallet.cePoints - cePointsAmount,
          availableBalance: wallet.availableBalance + joyTokenAmount,
        },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: wallet.id,
          toWalletId: wallet.id,
          transactionType: TransactionType.CONVERSION,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.CONVERT_CE_TO_JOY,
          netAmount: joyTokenAmount,
          purpose: 'CE Points to JOY Token Conversion',
          amount: cePointsAmount,
          currency: 'JOY',
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          metadata: JSON.stringify({ 
            ...metadata, 
            cePointsAmount, 
            joyTokenAmount, 
            conversionRate 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.CONVERT_CE_TO_JOY,
        userId,
        transactionId: transaction.id,
        metadata: { cePointsAmount, joyTokenAmount, conversionRate },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('CE to JOY conversion failed:', error);
      return { success: false, error: 'CE to JOY conversion failed' };
    }
  }

  /**
   * 27. Convert JOY Token to Fiat
   * Users can swap JOY tokens to any supported fiat currency
   */
  static async convertJOYToFiat(input: {
    userId: string;
    walletId: string;
    joyTokenAmount: number;
    targetCurrency: string; // USD, EUR, NGN, KES, ZAR, etc.
    exchangeRate: number; // 1 JOY = X fiat
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { userId, walletId, joyTokenAmount, targetCurrency, exchangeRate, metadata } = input;

      if (joyTokenAmount <= 0) {
        return { success: false, error: 'JOY token amount must be positive' };
      }

      if (exchangeRate <= 0) {
        return { success: false, error: 'Invalid exchange rate' };
      }

      // Calculate fiat amount to receive
      const fiatAmount = joyTokenAmount * exchangeRate;

      // Get user's wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });

      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet or access denied' };
      }

      // Check if user has enough JOY tokens
      if (wallet.availableBalance < joyTokenAmount) {
        return { success: false, error: 'Insufficient JOY token balance' };
      }

      // Deduct JOY tokens
      await WalletService.updateWalletBalance(walletId, {
        availableBalance: -joyTokenAmount,
      });

      // Create fiat wallet if it doesn't exist, or update existing
      let fiatWallet = await prisma.wallet.findFirst({
        where: { 
          userId, 
          currency: targetCurrency,
          walletType: WalletType.USER_WALLET 
        },
      });

      if (!fiatWallet) {
        // Create new fiat wallet
        fiatWallet = await prisma.wallet.create({
          data: {
            userId,
            walletType: WalletType.USER_WALLET,
            walletAddress: `${userId}_${targetCurrency}_${Date.now()}`,
            currency: targetCurrency,
            availableBalance: fiatAmount,
            totalBalance: fiatAmount,
            stakedBalance: 0,
            lockedBalance: 0,
            cePoints: 0,
          },
        });
      } else {
        // Update existing fiat wallet
        await WalletService.updateWalletBalance(fiatWallet.id, {
          availableBalance: fiatAmount,
        });
      }

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          toWalletId: fiatWallet.id,
          transactionType: TransactionType.CONVERSION,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.CONVERT_JOY_TO_FIAT,
          netAmount: fiatAmount,
          purpose: `JOY Token to ${targetCurrency} Conversion`,
          amount: joyTokenAmount,
          currency: targetCurrency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          metadata: JSON.stringify({ 
            ...metadata, 
            joyTokenAmount, 
            fiatAmount, 
            targetCurrency, 
            exchangeRate 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.CONVERT_JOY_TO_FIAT,
        userId,
        transactionId: transaction.id,
        metadata: { joyTokenAmount, fiatAmount, targetCurrency, exchangeRate },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('JOY to fiat conversion failed:', error);
      return { success: false, error: 'JOY to fiat conversion failed' };
    }
  }

  /**
   * 28. Convert JOY Token to Other Cryptocurrency
   * Users can swap JOY tokens to any supported cryptocurrency via ChangeNOW or similar exchanges
   */
  static async convertJOYToCrypto(input: {
    userId: string;
    walletId: string;
    joyTokenAmount: number;
    targetCrypto: string; // BTC, ETH, USDT, BNB, etc.
    exchangeRate: number; // 1 JOY = X target crypto
    externalWalletAddress: string; // User's external wallet to receive crypto
    swapProvider?: string; // ChangeNOW, SimpleSwap, etc.
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { 
        userId, 
        walletId, 
        joyTokenAmount, 
        targetCrypto, 
        exchangeRate, 
        externalWalletAddress,
        swapProvider = 'ChangeNOW',
        metadata 
      } = input;

      if (joyTokenAmount <= 0) {
        return { success: false, error: 'JOY token amount must be positive' };
      }

      if (exchangeRate <= 0) {
        return { success: false, error: 'Invalid exchange rate' };
      }

      if (!externalWalletAddress) {
        return { success: false, error: 'External wallet address is required' };
      }

      // Validate crypto symbol format (uppercase, 2-10 characters)
      if (!/^[A-Z]{2,10}$/.test(targetCrypto)) {
        return { success: false, error: 'Target crypto must be a valid symbol (e.g., BTC, ETH, USDT)' };
      }

      // Calculate crypto amount to receive
      const cryptoAmount = joyTokenAmount * exchangeRate;

      // Get user's wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });

      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet or access denied' };
      }

      // Check if user has enough JOY tokens
      if (wallet.availableBalance < joyTokenAmount) {
        return { success: false, error: 'Insufficient JOY token balance' };
      }

      // Deduct JOY tokens
      await WalletService.updateWalletBalance(walletId, {
        availableBalance: -joyTokenAmount,
      });

      // Create transaction record (PENDING until swap completes)
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          transactionType: TransactionType.CONVERSION,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.CONVERT_JOY_TO_CRYPTO,
          netAmount: cryptoAmount,
          purpose: `JOY Token to ${targetCrypto} Swap via ${swapProvider}`,
          amount: joyTokenAmount,
          currency: targetCrypto,
          status: TransactionStatus.PENDING, // Will update to COMPLETED when swap confirms
          paymentMethod: PaymentMethod.CRYPTO,
          externalReference: externalWalletAddress,
          metadata: JSON.stringify({ 
            ...metadata, 
            joyTokenAmount, 
            cryptoAmount, 
            targetCrypto, 
            exchangeRate,
            externalWalletAddress,
            swapProvider,
            swapStatus: 'initiated'
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.CONVERT_JOY_TO_CRYPTO,
        userId,
        transactionId: transaction.id,
        metadata: { 
          joyTokenAmount, 
          cryptoAmount, 
          targetCrypto, 
          exchangeRate,
          swapProvider,
          externalWalletAddress
        },
      });

      // TODO: Integrate with ChangeNOW API
      // 1. Create swap order via ChangeNOW API
      // 2. Get deposit address for JOY tokens
      // 3. Transfer JOY to ChangeNOW deposit address
      // 4. Poll for swap completion
      // 5. Update transaction status to COMPLETED
      // 6. Notify user of successful swap

      return { 
        success: true, 
        transactionId: transaction.id
      };
    } catch (error) {
      console.error('JOY to crypto conversion failed:', error);
      return { success: false, error: 'JOY to crypto conversion failed' };
    }
  }

}
