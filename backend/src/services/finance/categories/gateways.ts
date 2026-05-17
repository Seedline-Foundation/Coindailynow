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

export class FinanceGateways {
  static async gatewayStripe(input: GatewayStripeInput): Promise<GatewayResult> {
    try {
      const { userId, walletId, amount, currency, paymentMethodId, description, metadata } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // TODO: Integrate with actual Stripe API
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: amount * 100, // Convert to cents
      //   currency: currency.toLowerCase(),
      //   payment_method: paymentMethodId,
      //   confirm: true,
      //   metadata: { userId, walletId, ...metadata }
      // });

      // Simulate Stripe payment
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null,
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.GATEWAY_STRIPE,
          amount,
          netAmount: amount,
          currency: currency || 'USD',
          status: TransactionStatus.COMPLETED,
          description: description || 'Stripe payment deposit',
          purpose: 'GATEWAY_DEPOSIT',
          metadata: JSON.stringify({ 
            ...metadata, 
            paymentIntentId, 
            paymentMethodId,
            gateway: 'stripe' 
          }),
        },
      });

      // Update wallet balance
      await WalletService.updateWalletBalance(walletId, { availableBalance: amount });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.GATEWAY_STRIPE,
        userId,
        transactionId: transaction.id,
        metadata: { walletId, amount, currency, paymentIntentId, ...metadata },
      });

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: paymentIntentId,
        amount,
        currency: currency || 'USD',
        status: 'COMPLETED',
        gateway: 'stripe',
      };
    } catch (error) {
      console.error('Stripe gateway failed:', error);
      return { success: false, error: 'Stripe payment processing failed' };
    }
  }

  /**
   * 89. Gateway PayPal - PayPal integration
   */
  static async gatewayPayPal(input: GatewayPayPalInput): Promise<GatewayResult> {
    try {
      const { userId, walletId, amount, currency, orderId, description, metadata } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Integrate with actual PayPal API
      const clientId = process.env.PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials are not configured');
      }

      const environment = process.env.NODE_ENV === 'production'
        ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
        : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

      const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
      // PayPal SDK automatically sets body to null if not using requestBody()
      // But if we use requestBody it expects typed request data.
      // A capture request on an approved order often requires no body or empty body.
      // If payment_source is not explicitly needed, we can just cast an empty object.
      request.requestBody({} as any);

      const response = await client.execute(request);

      if (response.result.status !== 'COMPLETED') {
        throw new Error(`PayPal order capture failed with status: ${response.result.status}`);
      }

      const captureId = response.result.purchase_units[0].payments.captures[0].id;

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null,
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.GATEWAY_PAYPAL,
          amount,
          netAmount: amount,
          currency: currency || 'USD',
          status: TransactionStatus.COMPLETED,
          description: description || 'PayPal payment deposit',
          purpose: 'GATEWAY_DEPOSIT',
          metadata: JSON.stringify({ 
            ...metadata, 
            orderId, 
            captureId,
            gateway: 'paypal' 
          }),
        },
      });

      // Update wallet balance
      await WalletService.updateWalletBalance(walletId, { availableBalance: amount });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.GATEWAY_PAYPAL,
        userId,
        transactionId: transaction.id,
        metadata: { walletId, amount, currency, orderId, captureId, ...metadata },
      });

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: captureId,
        amount,
        currency: currency || 'USD',
        status: 'COMPLETED',
        gateway: 'paypal',
      };
    } catch (error) {
      console.error('PayPal gateway failed:', error);
      return { success: false, error: 'PayPal payment processing failed' };
    }
  }

  /**
   * 90. Gateway Mobile Money - Mobile money integration
   */
  static async gatewayMobileMoney(input: GatewayMobileMoneyInput): Promise<GatewayResult> {
    try {
      const { userId, walletId, amount, currency, provider, phoneNumber, description, metadata } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Validate mobile money provider
      const validProviders = ['M-PESA', 'ORANGE_MONEY', 'MTN_MONEY', 'ECOCASH', 'AIRTEL_MONEY'];
      if (!validProviders.includes(provider)) {
        return { success: false, error: 'Invalid mobile money provider' };
      }

      // TODO: Integrate with actual mobile money APIs (M-Pesa, Orange Money, etc.)
      // This would vary by provider and country

      // Simulate mobile money transaction
      const providerTransactionId = `MM_${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null,
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.GATEWAY_MOBILE_MONEY,
          amount,
          netAmount: amount,
          currency: currency || 'USD',
          status: TransactionStatus.PENDING, // Mobile money usually starts as pending
          description: description || `${provider} mobile money deposit`,
          purpose: 'GATEWAY_DEPOSIT',
          metadata: JSON.stringify({ 
            ...metadata, 
            provider,
            phoneNumber,
            providerTransactionId,
            gateway: 'mobile_money' 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.GATEWAY_MOBILE_MONEY,
        userId,
        transactionId: transaction.id,
        metadata: { walletId, amount, currency, provider, phoneNumber, providerTransactionId, ...metadata },
      });

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: providerTransactionId,
        amount,
        currency: currency || 'USD',
        status: 'PENDING',
        gateway: 'mobile_money',
        message: `${provider} payment initiated. Please complete on your phone.`,
      };
    } catch (error) {
      console.error('Mobile money gateway failed:', error);
      return { success: false, error: 'Mobile money payment processing failed' };
    }
  }

  /**
   * 91. Gateway Crypto - Cryptocurrency payments
   */
  static async gatewayCrypto(input: GatewayCryptoInput): Promise<GatewayResult> {
    try {
      const { userId, walletId, amount, cryptoCurrency, network, txHash, description, metadata } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Validate crypto currency
      const validCryptos = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'MATIC'];
      if (!validCryptos.includes(cryptoCurrency)) {
        return { success: false, error: 'Unsupported cryptocurrency' };
      }

      // TODO: Integrate with blockchain explorers to verify transaction
      // Use services like Etherscan API, Blockchain.info, etc.
      // Verify txHash on the specified network

      // Simulate crypto transaction verification
      const verificationStatus = txHash && txHash.startsWith('0x') ? 'VERIFIED' : 'PENDING_VERIFICATION';

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null,
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: txHash || generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.GATEWAY_CRYPTO,
          amount,
          netAmount: amount,
          currency: cryptoCurrency,
          status: verificationStatus === 'VERIFIED' ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
          description: description || `${cryptoCurrency} cryptocurrency deposit`,
          purpose: 'GATEWAY_DEPOSIT',
          metadata: JSON.stringify({ 
            ...metadata, 
            cryptoCurrency,
            network,
            txHash,
            verificationStatus,
            gateway: 'crypto' 
          }),
        },
      });

      // Update wallet balance if verified
      if (verificationStatus === 'VERIFIED') {
        await WalletService.updateWalletBalance(walletId, { availableBalance: amount });
      }

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.GATEWAY_CRYPTO,
        userId,
        transactionId: transaction.id,
        metadata: { walletId, amount, cryptoCurrency, network, txHash, verificationStatus, ...metadata },
      });

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: txHash || transaction.transactionHash,
        amount,
        currency: cryptoCurrency,
        status: verificationStatus === 'VERIFIED' ? 'COMPLETED' : 'PENDING',
        gateway: 'crypto',
        message: verificationStatus === 'VERIFIED' 
          ? 'Cryptocurrency deposit verified' 
          : 'Cryptocurrency deposit pending verification',
      };
    } catch (error) {
      console.error('Crypto gateway failed:', error);
      return { success: false, error: 'Cryptocurrency payment processing failed' };
    }
  }

  /**
   * 92. Gateway Bank Transfer - Direct bank integration
   */
  static async gatewayBankTransfer(input: GatewayBankTransferInput): Promise<GatewayResult> {
    try {
      const { userId, walletId, amount, currency, bankAccountNumber, bankName, referenceNumber, description, metadata } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // TODO: Integrate with banking APIs (Plaid, Yodlee, or local bank APIs)
      // Verify bank account and process transfer

      // Simulate bank transfer
      const bankTransactionId = `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction record (bank transfers usually take 1-3 days)
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: null,
          toWalletId: walletId,
          transactionType: TransactionType.DEPOSIT,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.GATEWAY_BANK_TRANSFER,
          amount,
          netAmount: amount,
          currency: currency || 'USD',
          status: TransactionStatus.PENDING,
          description: description || `Bank transfer deposit from ${bankName}`,
          purpose: 'GATEWAY_DEPOSIT',
          metadata: JSON.stringify({ 
            ...metadata, 
            bankAccountNumber: bankAccountNumber.slice(-4), // Only store last 4 digits
            bankName,
            referenceNumber,
            bankTransactionId,
            gateway: 'bank_transfer',
            estimatedCompletionDays: 3
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.GATEWAY_BANK_TRANSFER,
        userId,
        transactionId: transaction.id,
        metadata: { walletId, amount, currency, bankName, referenceNumber, bankTransactionId, ...metadata },
      });

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: bankTransactionId,
        amount,
        currency: currency || 'USD',
        status: 'PENDING',
        gateway: 'bank_transfer',
        message: 'Bank transfer initiated. Processing may take 1-3 business days.',
      };
    } catch (error) {
      console.error('Bank transfer gateway failed:', error);
      return { success: false, error: 'Bank transfer processing failed' };
    }
  }
}
