/**
 * Mobile Money Service Implementation
 * Task 15: Mobile Money Integration - Clean Implementation
 * 
 * Handles mobile money payment processing, fraud detection, compliance checks,
 * and transaction management with sub-500ms performance requirements
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import {
  MobileMoneyProvider,
  PaymentRequest,
  PaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  MobileMoneyTransaction,
  ServiceResponse,
  PaginatedResponse,
  PaymentAnalytics,
  ProviderInfo,
  ProviderStats,
  ProviderLimits,
  ProviderFees,
  MobileMoneyError,
  PaymentStatus,
  TransactionType,
  ErrorCodes,
  FraudAnalysis,
  FraudRiskLevel,
  ComplianceCheck,
  SubscriptionPayment
} from '../types/mobile-money';
import { IMobileMoneyService } from './interfaces/mobile-money.interface';
import { FraudDetectionService } from './fraud-detection.service';
import { ComplianceService } from './compliance.service';

// Service Result helper
class ServiceResult {
  static success<T>(data: T): ServiceResponse<T> {
    return { success: true, data };
  }

  static error<T>(code: string, message: string, details?: string): ServiceResponse<T> {
    return {
      success: false,
      error: { code, message, ...(details && { details }) }
    };
  }
}

export class MobileMoneyService implements IMobileMoneyService {
  private readonly prisma: PrismaClient;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly fraudDetector: FraudDetectionService;
  private readonly complianceService: ComplianceService;

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    logger: Logger,
    fraudDetector: FraudDetectionService,
    complianceService: ComplianceService
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
    this.fraudDetector = fraudDetector;
    this.complianceService = complianceService;
  }

  /**
   * Initiate a mobile money payment
   */
  async initiatePayment(request: PaymentRequest): Promise<ServiceResponse<PaymentResponse>> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info('Initiating mobile money payment', {
        requestId,
        provider: request.provider,
        amount: request.amount,
        userId: request.userId
      });

      // Validate request
      const validationResult = await this.validatePaymentRequest(request);
      if (!validationResult.success) {
        return ServiceResult.error(
          validationResult.error?.code || 'VALIDATION_ERROR',
          validationResult.error?.message || 'Validation failed'
        );
      }

      // Create transaction record
      const transaction = await this.createTransaction(request, requestId);

      // Fraud detection
      const fraudAnalysis = await this.fraudDetector.analyze({
        id: transaction.id,
        userId: request.userId,
        provider: request.provider,
        amount: request.amount,
        currency: request.currency,
        phoneNumber: request.phoneNumber,
        status: PaymentStatus.PENDING,
        transactionType: request.transactionType,
        description: request.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: request.metadata || {}
      });

      if (fraudAnalysis.recommendation === 'decline') {
        await this.updateTransactionStatus(
          transaction.id,
          PaymentStatus.FAILED,
          { failureReason: 'Fraud detected', fraudAnalysis }
        );

        return ServiceResult.error(
          ErrorCodes.FRAUD_DETECTED,
          'Transaction declined due to fraud detection',
          fraudAnalysis.reason
        );
      }

      // Compliance check
      const complianceCheck = await this.complianceService.validateTransaction(
        {
          id: transaction.id,
          userId: request.userId,
          provider: request.provider,
          amount: request.amount,
          currency: request.currency,
          phoneNumber: request.phoneNumber,
          status: PaymentStatus.PENDING,
          transactionType: request.transactionType,
          description: request.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: request.metadata || {}
        },
        request.provider
      );

      if (complianceCheck.status !== 'COMPLIANT') {
        await this.updateTransactionStatus(
          transaction.id,
          PaymentStatus.FAILED,
          { failureReason: 'Compliance violation', complianceCheck }
        );

        return ServiceResult.error(
          ErrorCodes.COMPLIANCE_VIOLATION,
          'Transaction failed compliance check',
          complianceCheck.violations.join(', ')
        );
      }

      // Mock payment processing (in production, would call actual provider APIs)
      const response: PaymentResponse = {
        success: true,
        transactionId: transaction.id,
        providerTransactionId: `${request.provider}_${Date.now()}`,
        status: PaymentStatus.PROCESSING,
        message: 'Payment initiated successfully',
        checkoutUrl: `https://checkout.${request.provider.toLowerCase()}.com/${transaction.id}`,
        qrCode: `QR_${transaction.id}`
      };

      await this.updateTransactionStatus(
        transaction.id,
        PaymentStatus.PROCESSING,
        { providerTransactionId: response.providerTransactionId }
      );

      this.logger.info('Payment initiation completed', {
        requestId,
        success: true,
        processingTime: Date.now() - startTime
      });

      return ServiceResult.success(response);

    } catch (error: any) {
      this.logger.error('Payment initiation failed', {
        requestId,
        error: error.message,
        stack: error.stack,
        processingTime: Date.now() - startTime
      });

      return ServiceResult.error(
        'INTERNAL_ERROR',
        'Payment initiation failed',
        error.message
      );
    }
  }

  /**
   * Verify payment status - supports both PaymentVerificationRequest and simple transactionId
   */
  async verifyPayment(requestOrTransactionId: PaymentVerificationRequest | string, userId?: string): Promise<ServiceResponse<PaymentVerificationResponse | any>> {
    try {
      // Handle different parameter types
      if (typeof requestOrTransactionId === 'string') {
        // Simple transactionId verification
        const transactionId = requestOrTransactionId;
        this.logger.info('Verifying payment by transaction ID', { transactionId, userId });

        // Find the transaction
        const transaction = await this.prisma.mobileMoneyTransaction.findFirst({
          where: {
            id: transactionId,
            ...(userId && { userId })
          },
          include: {
            MobileMoneyProvider: true,
            User: true
          }
        });

        if (!transaction) {
          return ServiceResult.error('TRANSACTION_NOT_FOUND', 'Transaction not found');
        }

        // Check cache first
        const cacheKey = `transaction_status:${transactionId}`;
        const cachedStatus = await this.redis.get(cacheKey);
        
        if (cachedStatus && transaction.status === 'COMPLETED') {
          return ServiceResult.success({
            verified: true,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            completedAt: transaction.completedAt
          });
        }

        // Return current transaction status
        return ServiceResult.success({
          verified: true,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          completedAt: transaction.completedAt
        });

      } else {
        // PaymentVerificationRequest object
        const request = requestOrTransactionId;
        this.logger.info('Verifying payment with provider', { request });

        // Mock verification (in production, would call provider APIs)
        const response: PaymentVerificationResponse = {
          verified: true,
          status: PaymentStatus.COMPLETED,
          amount: 10000,
          currency: 'KES',
          completedAt: new Date()
        };

        if (response.verified) {
          await this.updateTransactionStatus(
            request.transactionId,
            response.status
          );
        }

        return ServiceResult.success(response);
      }

    } catch (error: any) {
      this.logger.error('Payment verification failed', {
        error: error.message,
        requestOrTransactionId
      });

      return ServiceResult.error(
        'VERIFICATION_ERROR',
        'Payment verification failed',
        error.message
      );
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<ServiceResponse<MobileMoneyTransaction>> {
    try {
      const cacheKey = `mobile_money:transaction:${transactionId}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return ServiceResult.success(JSON.parse(cached));
      }

      // Mock implementation - in production would query actual mobile money transactions
      const mockTransaction: MobileMoneyTransaction = {
        id: transactionId,
        userId: 'user_mock',
        provider: MobileMoneyProvider.MPESA,
        providerTransactionId: `mock_${transactionId}`,
        amount: 10000,
        currency: 'KES',
        phoneNumber: '+254700123456',
        status: PaymentStatus.COMPLETED,
        transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
        description: 'Mock transaction',
        fees: { providerFee: 50, platformFee: 25, totalFee: 75 },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { mock: true }
      };

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(mockTransaction));

      return ServiceResult.success(mockTransaction);

    } catch (error: any) {
      this.logger.error('Failed to get transaction', { error: error.message, transactionId });
      return ServiceResult.error('DATABASE_ERROR', 'Failed to fetch transaction');
    }
  }

  /**
   * Get user transactions with pagination and filtering
   */
  async getUserTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      provider?: MobileMoneyProvider;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ServiceResponse<PaginatedResponse<MobileMoneyTransaction>>> {
    try {
      this.logger.info('Getting user transactions', { userId, options });

      // Mock implementation
      const result: PaginatedResponse<MobileMoneyTransaction> = {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };

      return ServiceResult.success(result);

    } catch (error: any) {
      this.logger.error('Failed to get user transactions', { error: error.message });
      return ServiceResult.error('DATABASE_ERROR', 'Failed to fetch user transactions');
    }
  }

  /**
   * Get available providers for a country
   */
  async getAvailableProviders(country: string): Promise<ServiceResponse<MobileMoneyProvider[]>> {
    try {
      const cacheKey = `mobile_money:providers:${country}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return ServiceResult.success(JSON.parse(cached));
      }

      // Country-specific provider mapping
      const countryProviders: Record<string, MobileMoneyProvider[]> = {
        'KE': [MobileMoneyProvider.MPESA, MobileMoneyProvider.AIRTEL_MONEY],
        'GH': [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.VODAFONE_CASH, MobileMoneyProvider.AIRTEL_MONEY],
        'NG': [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY],
        'ZW': [MobileMoneyProvider.ECOCASH],
        'CI': [MobileMoneyProvider.ORANGE_MONEY, MobileMoneyProvider.MTN_MONEY],
        'CM': [MobileMoneyProvider.ORANGE_MONEY, MobileMoneyProvider.MTN_MONEY],
        'SN': [MobileMoneyProvider.ORANGE_MONEY, MobileMoneyProvider.TIGO_PESA],
        'TZ': [MobileMoneyProvider.TIGO_PESA, MobileMoneyProvider.AIRTEL_MONEY, MobileMoneyProvider.MPESA],
        'UG': [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY],
        'RW': [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY]
      };

      const availableProviderTypes = countryProviders[country.toUpperCase()] || [];
      
      // Return simple provider enum values for interface compliance
      const providers = availableProviderTypes;

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(providers));

      return ServiceResult.success(providers);

    } catch (error: any) {
      this.logger.error('Failed to get available providers', { 
        error: error.message, 
        country 
      });
      return ServiceResult.error('PROVIDER_FETCH_ERROR', 'Failed to fetch available providers');
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(options: {
    startDate: Date;
    endDate: Date;
    country?: string;
    provider?: MobileMoneyProvider;
    userId?: string;
  }): Promise<ServiceResponse<PaymentAnalytics>> {
    try {
      // Mock implementation
      const analytics: PaymentAnalytics = {
        totalTransactions: 100,
        totalAmount: 1000000,
        currency: 'KES',
        successRate: 95.5,
        averageAmount: 10000,
        timeframe: { start: new Date(), end: new Date() },
        providerBreakdown: [],
        countryBreakdown: [],
        failureReasons: []
      };

      return ServiceResult.success(analytics);

    } catch (error: any) {
      this.logger.error('Failed to get payment analytics', { error: error.message });
      return ServiceResult.error('ANALYTICS_ERROR', 'Failed to fetch payment analytics');
    }
  }

  /**
   * Get fraud analysis
   */
  async getFraudAnalysis(): Promise<ServiceResponse<FraudAnalysis>> {
    try {
      // Mock implementation
      const analysis: FraudAnalysis = {
        transactionId: 'tx_mock',
        riskLevel: 'LOW' as any,
        riskScore: 15,
        flags: [],
        recommendation: 'approve',
        reason: 'Low risk transaction',
        analyzedAt: new Date()
      };

      return ServiceResult.success(analysis);

    } catch (error: any) {
      this.logger.error('Failed to get fraud analysis', { error: error.message });
      return ServiceResult.error('DATABASE_ERROR', 'Failed to fetch fraud analysis');
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(
    subscriptionId: string,
    provider: MobileMoneyProvider,
    phoneNumber: string
  ): Promise<ServiceResponse<SubscriptionPayment>> {
    try {
      // Mock implementation
      const payment: SubscriptionPayment = {
        id: `sub_pay_${Date.now()}`,
        subscriptionId,
        userId: 'user_mock',
        paymentMethod: 'mobile_money',
        provider,
        amount: 5000,
        currency: 'KES',
        status: PaymentStatus.COMPLETED,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        attemptCount: 1,
        maxAttempts: 3,
        completedAt: new Date(),
        phoneNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return ServiceResult.success(payment);

    } catch (error: any) {
      this.logger.error('Failed to process subscription payment', { 
        error: error.message,
        subscriptionId 
      });
      return ServiceResult.error('SUBSCRIPTION_ERROR', 'Failed to process subscription payment');
    }
  }

  /**
   * Check provider health
   */
  async checkProviderHealth(provider: MobileMoneyProvider): Promise<ServiceResponse<{ status: string; latency: number }>> {
    try {
      this.logger.info('Checking provider health', { provider });
      const startTime = Date.now();
      
      // Mock health check
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const latency = Date.now() - startTime;

      return ServiceResult.success({
        status: 'healthy',
        latency
      });

    } catch (error: any) {
      this.logger.error('Provider health check failed', { error: error.message });
      return ServiceResult.error('HEALTH_CHECK_ERROR', 'Failed to check provider health');
    }
  }

  /**
   * Process webhook
   */
  async processWebhook(
    provider: MobileMoneyProvider,
    payload: any,
    signature?: string
  ): Promise<ServiceResponse<{ processed: boolean; transactionId?: string }>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Processing mobile money webhook', {
        provider,
        timestamp: new Date().toISOString()
      });

      // Validate webhook signature
      if (signature) {
        const isValid = await this.validateWebhookSignature(provider, payload, signature);
        if (!isValid) {
          return ServiceResult.error('INVALID_SIGNATURE', 'Webhook signature validation failed');
        }
      }

      // Extract transaction ID from payload (provider-specific)
      let transactionId: string | undefined;
      let status: PaymentStatus;
      let providerTransactionId: string | undefined;

      switch (provider) {
        case 'MPESA':
          transactionId = payload.Body?.stkCallback?.CheckoutRequestID;
          providerTransactionId = payload.Body?.stkCallback?.MpesaReceiptNumber;
          status = payload.Body?.stkCallback?.ResultCode === 0 ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
          break;
        
        case 'MTN_MONEY':
          transactionId = payload.externalId;
          providerTransactionId = payload.financialTransactionId;
          status = payload.status === 'SUCCESSFUL' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
          break;
        
        case 'ORANGE_MONEY':
          transactionId = payload.order_id;
          providerTransactionId = payload.txnid;
          status = payload.status === 'SUCCESS' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
          break;
        
        case 'AIRTEL_MONEY':
          transactionId = payload.transaction?.id;
          providerTransactionId = payload.transaction?.airtel_money_id;
          status = payload.transaction?.status === 'TS' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
          break;
        
        default:
          return ServiceResult.error('UNSUPPORTED_PROVIDER', `Webhook not supported for provider: ${provider}`);
      }

      if (!transactionId) {
        return ServiceResult.error('INVALID_PAYLOAD', 'Transaction ID not found in webhook payload');
      }

      // Find transaction in database
      const whereConditions: any[] = [{ id: transactionId }];
      if (providerTransactionId) {
        whereConditions.push({ providerTransactionId });
      }

      const transaction = await this.prisma.mobileMoneyTransaction.findFirst({
        where: {
          OR: whereConditions
        }
      });

      if (!transaction) {
        this.logger.warn('Transaction not found for webhook', { transactionId, providerTransactionId });
        return ServiceResult.error('TRANSACTION_NOT_FOUND', 'Transaction not found');
      }

      // Update transaction status
      const now = new Date();
      await this.prisma.mobileMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status,
          providerTransactionId: providerTransactionId || transaction.providerTransactionId,
          processedAt: status === 'COMPLETED' ? now : transaction.processedAt,
          completedAt: status === 'COMPLETED' ? now : null,
          failureReason: status === 'FAILED' ? payload.errorMessage || 'Payment failed' : null,
          updatedAt: now
        }
      });

      // Clear cache for this transaction
      const cacheKey = `mobile_money:transaction:${transaction.id}`;
      await this.redis.del(cacheKey);

      const duration = Date.now() - startTime;
      this.logger.info('Webhook processed successfully', {
        transactionId: transaction.id,
        status,
        duration
      });

      return ServiceResult.success({
        processed: true,
        transactionId: transaction.id
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error('Webhook processing failed', {
        error: error.message,
        provider,
        duration
      });
      return ServiceResult.error('WEBHOOK_ERROR', 'Failed to process webhook', error.message);
    }
  }

  /**
   * Validate webhook signature
   */
  async validateWebhookSignature(
    provider: MobileMoneyProvider,
    payload: any,
    signature: string
  ): Promise<boolean> {
    try {
      const crypto = require('crypto');
      
      // Get provider secret from environment
      const secrets: Record<string, string | undefined> = {
        MPESA: process.env.MPESA_WEBHOOK_SECRET,
        MTN_MONEY: process.env.MTN_WEBHOOK_SECRET,
        ORANGE_MONEY: process.env.ORANGE_WEBHOOK_SECRET,
        AIRTEL_MONEY: process.env.AIRTEL_WEBHOOK_SECRET
      };

      const secret = secrets[provider];
      if (!secret) {
        this.logger.warn('Webhook secret not configured for provider', { provider });
        return true; // Allow if not configured (for testing)
      }

      // Calculate expected signature (HMAC-SHA256)
      const payloadString = JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payloadString);
      const expectedSignature = hmac.digest('hex');

      return signature === expectedSignature;

    } catch (error: any) {
      this.logger.error('Webhook signature validation error', { error: error.message, provider });
      return false;
    }
  }

  /**
   * Get success rates
   */
  async getSuccessRates(options: {
    period: 'day' | 'week' | 'month';
    provider?: MobileMoneyProvider;
    country?: string;
  }): Promise<ServiceResponse<{ provider: string; successRate: number; totalTransactions: number }[]>> {
    const startTime = Date.now();
    
    try {
      // Calculate date range based on period
      const now = new Date();
      let start: Date;
      
      switch (options.period) {
        case 'day':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      const end = now;

      this.logger.info('Calculating success rates', {
        period: options.period,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        provider: options.provider,
        country: options.country
      });

      // Check cache first
      const cacheKey = `mobile_money:success_rates:${options.period}:${options.provider || 'all'}:${options.country || 'all'}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return ServiceResult.success(JSON.parse(cached));
      }

      // Build provider filter
      const providerFilter: any = { isActive: true };
      if (options.provider) {
        providerFilter.name = options.provider;
      }
      if (options.country) {
        providerFilter.supportedCountries = {
          contains: options.country
        };
      }

      // Get all providers
      const providers = await this.prisma.mobileMoneyProvider.findMany({
        where: providerFilter
      });

      const successRates = await Promise.all(
        providers.map(async (provider) => {
          // Get transaction counts
          const [total, successful, failed] = await Promise.all([
            this.prisma.mobileMoneyTransaction.count({
              where: {
                providerId: provider.id,
                createdAt: {
                  gte: start,
                  lte: end
                }
              }
            }),
            this.prisma.mobileMoneyTransaction.count({
              where: {
                providerId: provider.id,
                status: 'COMPLETED',
                createdAt: {
                  gte: start,
                  lte: end
                }
              }
            }),
            this.prisma.mobileMoneyTransaction.count({
              where: {
                providerId: provider.id,
                status: 'FAILED',
                createdAt: {
                  gte: start,
                  lte: end
                }
              }
            })
          ]);

          const successRate = total > 0 ? (successful / total) * 100 : 0;

          return {
            provider: provider.name,
            successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
            totalTransactions: total
          };
        })
      );

      // Cache for 1 hour
      await this.redis.setex(cacheKey, 3600, JSON.stringify(successRates));

      const duration = Date.now() - startTime;
      this.logger.info('Success rates calculated', {
        providersCount: successRates.length,
        duration
      });

      return ServiceResult.success(successRates);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to calculate success rates', {
        error: error.message,
        duration
      });
      return ServiceResult.error('CALCULATION_ERROR', 'Failed to calculate success rates', error.message);
    }
  }

  /**
   * Process refund for a mobile money transaction
   */
  async processRefund(
    transactionId: string,
    reason: string,
    userId: string
  ): Promise<ServiceResponse<{
    refundId: string;
    originalTransactionId: string;
    amount: number;
    status: string;
  }>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Processing mobile money refund', {
        transactionId,
        reason,
        userId
      });

      // Find original transaction
      const originalTransaction = await this.prisma.mobileMoneyTransaction.findUnique({
        where: { id: transactionId },
        include: {
          MobileMoneyProvider: true
        }
      });

      if (!originalTransaction) {
        return ServiceResult.error('TRANSACTION_NOT_FOUND', 'Original transaction not found');
      }

      // Validate transaction can be refunded
      if (originalTransaction.status !== 'COMPLETED') {
        return ServiceResult.error(
          'INVALID_STATUS',
          'Only completed transactions can be refunded'
        );
      }

      // Check if already refunded
      const existingRefund = await this.prisma.mobileMoneyTransaction.findFirst({
        where: {
          providerTransactionId: originalTransaction.id,
          transactionType: 'REFUND'
        }
      });

      if (existingRefund) {
        return ServiceResult.error('ALREADY_REFUNDED', 'Transaction has already been refunded');
      }

      // Create refund transaction
      const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const refundTransaction = await this.prisma.mobileMoneyTransaction.create({
        data: {
          id: refundId,
          userId: originalTransaction.userId,
          providerId: originalTransaction.providerId,
          providerTransactionId: originalTransaction.id, // Link to original transaction
          amount: originalTransaction.amount,
          currency: originalTransaction.currency,
          phoneNumber: originalTransaction.phoneNumber,
          status: 'PENDING',
          transactionType: 'REFUND',
          description: `Refund for transaction ${transactionId}: ${reason}`,
          providerFee: 0, // No fees for refunds
          platformFee: 0,
          totalFee: 0,
          metadata: JSON.stringify({
            originalTransactionId: transactionId,
            refundReason: reason,
            initiatedBy: userId
          }),
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours expiry
        }
      });

      // In a real implementation, you would call the provider's refund API here
      // For now, we'll mark it as processing
      await this.prisma.mobileMoneyTransaction.update({
        where: { id: refundId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Clear cache
      await this.redis.del(`mobile_money:transaction:${transactionId}`);
      await this.redis.del(`mobile_money:transaction:${refundId}`);

      const duration = Date.now() - startTime;
      this.logger.info('Refund processed successfully', {
        refundId,
        originalTransactionId: transactionId,
        amount: originalTransaction.amount,
        duration
      });

      return ServiceResult.success({
        refundId,
        originalTransactionId: transactionId,
        amount: originalTransaction.amount,
        status: 'PROCESSING'
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error('Refund processing failed', {
        error: error.message,
        transactionId,
        duration
      });
      return ServiceResult.error('REFUND_ERROR', 'Failed to process refund', error.message);
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<MobileMoneyTransaction>> {
    try {
      // Mock implementation
      const transaction: MobileMoneyTransaction = {
        id: transactionId,
        userId: 'user_mock',
        provider: MobileMoneyProvider.MPESA,
        providerTransactionId: `mock_${transactionId}`,
        amount: 10000,
        currency: 'KES',
        phoneNumber: '+254700123456',
        status: status as PaymentStatus,
        transactionType: TransactionType.SUBSCRIPTION_PAYMENT,
        description: 'Updated transaction',
        fees: { providerFee: 50, platformFee: 25, totalFee: 75 },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: metadata || {}
      };

      return ServiceResult.success(transaction);

    } catch (error: any) {
      this.logger.error('Failed to update transaction status', { 
        error: error.message, 
        transactionId,
        status 
      });
      return ServiceResult.error('UPDATE_ERROR', 'Failed to update transaction status');
    }
  }

  // Private helper methods

  /**
   * Validate payment request
   */
  private async validatePaymentRequest(request: PaymentRequest): Promise<ServiceResponse<boolean>> {
    // Amount validation
    if (request.amount <= 0) {
      return ServiceResult.error('INVALID_AMOUNT', 'Amount must be greater than 0');
    }

    // Phone number validation
    if (!this.isValidPhoneNumber(request.phoneNumber)) {
      return ServiceResult.error('INVALID_PHONE', 'Invalid phone number format');
    }

    // Provider validation
    if (!Object.values(MobileMoneyProvider).includes(request.provider)) {
      return ServiceResult.error('INVALID_PROVIDER', 'Invalid mobile money provider');
    }

    return ServiceResult.success(true);
  }

  /**
   * Create transaction record
   */
  private async createTransaction(request: PaymentRequest, requestId: string): Promise<any> {
    // Mock implementation - would create actual transaction record in production
    return {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      provider: request.provider,
      amount: request.amount,
      currency: request.currency,
      phoneNumber: request.phoneNumber,
      status: PaymentStatus.PENDING,
      transactionType: request.transactionType,
      description: request.description,
      subscriptionId: request.subscriptionId,
      metadata: JSON.stringify(request.metadata),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation for African formats
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/[\s-()]/g, ''));
  }

  /**
   * Extract country code from phone number
   */
  private extractCountryFromPhone(phoneNumber: string): string {
    // Simple country extraction based on common African prefixes
    const cleanNumber = phoneNumber.replace(/[\s-+()]/g, '');
    
    if (cleanNumber.startsWith('254')) return 'KE'; // Kenya
    if (cleanNumber.startsWith('233')) return 'GH'; // Ghana
    if (cleanNumber.startsWith('234')) return 'NG'; // Nigeria
    if (cleanNumber.startsWith('263')) return 'ZW'; // Zimbabwe
    if (cleanNumber.startsWith('225')) return 'CI'; // Ivory Coast
    if (cleanNumber.startsWith('237')) return 'CM'; // Cameroon
    if (cleanNumber.startsWith('221')) return 'SN'; // Senegal
    if (cleanNumber.startsWith('255')) return 'TZ'; // Tanzania
    if (cleanNumber.startsWith('256')) return 'UG'; // Uganda
    if (cleanNumber.startsWith('250')) return 'RW'; // Rwanda
    
    return 'Unknown';
  }

  /**
   * Get provider configuration
   */
  private getProviderConfig(provider: MobileMoneyProvider) {
    const configs = {
      [MobileMoneyProvider.MPESA]: {
        name: 'M-Pesa',
        supportedCurrencies: ['KES', 'TZS'],
        limits: { min: 100, max: 500000, dailyLimit: 300000, monthlyLimit: 5000000 },
        fees: { fixed: 0, percentage: 0.05 }
      },
      [MobileMoneyProvider.MTN_MONEY]: {
        name: 'MTN Money',
        supportedCurrencies: ['GHS', 'UGX', 'RWF', 'XAF', 'NGN'],
        limits: { min: 50, max: 200000, dailyLimit: 150000, monthlyLimit: 3000000 },
        fees: { fixed: 0, percentage: 0.03 }
      },
      [MobileMoneyProvider.ORANGE_MONEY]: {
        name: 'Orange Money',
        supportedCurrencies: ['XOF', 'XAF'],
        limits: { min: 100, max: 300000, dailyLimit: 200000, monthlyLimit: 4000000 },
        fees: { fixed: 10, percentage: 0.02 }
      },
      [MobileMoneyProvider.AIRTEL_MONEY]: {
        name: 'Airtel Money',
        supportedCurrencies: ['KES', 'UGX', 'GHS', 'TZS', 'NGN'],
        limits: { min: 100, max: 400000, dailyLimit: 250000, monthlyLimit: 4500000 },
        fees: { fixed: 5, percentage: 0.025 }
      },
      [MobileMoneyProvider.ECOCASH]: {
        name: 'EcoCash',
        supportedCurrencies: ['ZWL'],
        limits: { min: 200, max: 1000000, dailyLimit: 500000, monthlyLimit: 10000000 },
        fees: { fixed: 0, percentage: 0.04 }
      },
      [MobileMoneyProvider.TIGO_PESA]: {
        name: 'Tigo Pesa',
        supportedCurrencies: ['TZS', 'XOF'],
        limits: { min: 100, max: 350000, dailyLimit: 200000, monthlyLimit: 3500000 },
        fees: { fixed: 0, percentage: 0.035 }
      },
      [MobileMoneyProvider.VODAFONE_CASH]: {
        name: 'Vodafone Cash',
        supportedCurrencies: ['GHS'],
        limits: { min: 100, max: 250000, dailyLimit: 150000, monthlyLimit: 2500000 },
        fees: { fixed: 0, percentage: 0.03 }
      },
      [MobileMoneyProvider.ORANGE_CASH]: {
        name: 'Orange Cash',
        supportedCurrencies: ['XAF'],
        limits: { min: 100, max: 300000, dailyLimit: 180000, monthlyLimit: 3000000 },
        fees: { fixed: 5, percentage: 0.025 }
      }
    };

    return configs[provider] || {
      name: 'Unknown Provider',
      supportedCurrencies: ['USD'],
      limits: { min: 100, max: 100000, dailyLimit: 50000, monthlyLimit: 1000000 },
      fees: { fixed: 0, percentage: 0.05 }
    };
  }

  // ========== Missing Interface Methods ==========

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<ServiceResponse<PaymentResponse>> {
    try {
      this.logger.info('Processing refund', { transactionId, amount, reason });

      // Mock refund implementation
      const refundResponse: PaymentResponse = {
        success: true,
        transactionId,
        status: PaymentStatus.COMPLETED,
        message: 'Refund processed successfully',
        providerTransactionId: `refund_${Date.now()}`
      };

      return ServiceResult.success(refundResponse);

    } catch (error: any) {
      this.logger.error('Refund failed', { error: error.message, transactionId });
      return ServiceResult.error('REFUND_FAILED', 'Failed to process refund', error.message);
    }
  }

  async retrySubscriptionPayment(paymentId: string): Promise<ServiceResponse<SubscriptionPayment>> {
    try {
      this.logger.info('Retrying subscription payment', { paymentId });

      // Mock retry implementation
      const retryPayment: SubscriptionPayment = {
        id: paymentId,
        subscriptionId: `sub_${Date.now()}`,
        userId: 'user_retry',
        paymentMethod: 'mobile_money',
        provider: MobileMoneyProvider.MPESA,
        phoneNumber: '+254700000000',
        amount: 1000,
        currency: 'KES',
        status: PaymentStatus.PENDING,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        attemptCount: 2,
        maxAttempts: 3,
        nextAttemptAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return ServiceResult.success(retryPayment);

    } catch (error: any) {
      this.logger.error('Retry subscription payment failed', { error: error.message, paymentId });
      return ServiceResult.error('RETRY_FAILED', 'Failed to retry subscription payment', error.message);
    }
  }

  async getSubscriptionPayments(
    subscriptionId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ServiceResponse<PaginatedResponse<SubscriptionPayment>>> {
    try {
      this.logger.info('Getting subscription payments', { subscriptionId, options });

      // Mock subscription payments list
      const result: PaginatedResponse<SubscriptionPayment> = {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };

      return ServiceResult.success(result);

    } catch (error: any) {
      this.logger.error('Get subscription payments failed', { error: error.message, subscriptionId });
      return ServiceResult.error('SUBSCRIPTION_PAYMENTS_FETCH_ERROR', 'Failed to get subscription payments', error.message);
    }
  }

  async analyzeFraud(
    transactionId: string,
    additionalData?: Record<string, any>
  ): Promise<ServiceResponse<FraudAnalysis>> {
    try {
      this.logger.info('Analyzing transaction for fraud', { transactionId, additionalData });

      // Mock fraud analysis
      const analysis: FraudAnalysis = {
        transactionId,
        riskLevel: FraudRiskLevel.LOW,
        riskScore: 15,
        recommendation: 'approve',
        reason: 'Transaction appears legitimate',
        flags: [],
        analyzedAt: new Date()
      };

      return ServiceResult.success(analysis);

    } catch (error: any) {
      this.logger.error('Fraud analysis failed', { error: error.message, transactionId });
      return ServiceResult.error('FRAUD_ANALYSIS_ERROR', 'Failed to analyze transaction for fraud', error.message);
    }
  }

  async updateFraudDecision(
    analysisId: string,
    decision: 'approved' | 'declined',
    reviewedBy: string,
    notes?: string
  ): Promise<ServiceResponse<FraudAnalysis>> {
    try {
      this.logger.info('Updating fraud decision', { analysisId, decision, reviewedBy, notes });

      // Mock updated fraud analysis
      const updatedAnalysis: FraudAnalysis = {
        transactionId: `tx_${analysisId}`,
        riskLevel: decision === 'approved' ? FraudRiskLevel.LOW : FraudRiskLevel.HIGH,
        riskScore: decision === 'approved' ? 10 : 90,
        recommendation: decision === 'approved' ? 'approve' : 'decline',
        reason: notes || `Manual ${decision} by ${reviewedBy}`,
        flags: decision === 'declined' ? [{ 
          type: 'manual_review', 
          severity: 'high', 
          description: `Manually ${decision} by ${reviewedBy}`,
          details: { reviewedBy, notes }
        }] : [],
        analyzedAt: new Date()
      };

      return ServiceResult.success(updatedAnalysis);

    } catch (error: any) {
      this.logger.error('Update fraud decision failed', { error: error.message, analysisId });
      return ServiceResult.error('FRAUD_DECISION_UPDATE_ERROR', 'Failed to update fraud decision', error.message);
    }
  }

  async performComplianceCheck(
    transactionId: string,
    country: string,
    provider: MobileMoneyProvider
  ): Promise<ServiceResponse<ComplianceCheck>> {
    try {
      this.logger.info('Performing compliance check', { transactionId, country, provider });

      // Mock compliance check
      const complianceCheck: ComplianceCheck = {
        transactionId,
        country,
        provider,
        checks: {
          amountLimits: true,
          kycStatus: true,
          sanctionsScreen: true,
          taxCompliance: true
        },
        passed: true,
        violations: [],
        checkedAt: new Date()
      };

      return ServiceResult.success(complianceCheck);

    } catch (error: any) {
      this.logger.error('Compliance check failed', { error: error.message, transactionId });
      return ServiceResult.error('COMPLIANCE_CHECK_ERROR', 'Failed to perform compliance check', error.message);
    }
  }

  async getComplianceRequirements(
    country: string,
    provider?: MobileMoneyProvider
  ): Promise<ServiceResponse<any>> {
    try {
      this.logger.info('Getting compliance requirements', { country, provider });

      // Mock compliance requirements
      const requirements = {
        country,
        provider,
        requirements: [
          {
            type: 'KYC',
            description: 'Know Your Customer verification required',
            mandatory: true
          },
          {
            type: 'AML',
            description: 'Anti-Money Laundering screening required',
            mandatory: true
          },
          {
            type: 'TRANSACTION_LIMITS',
            description: 'Transaction amount limits apply',
            mandatory: true,
            limits: {
              daily: 100000,
              monthly: 1000000,
              single: 50000
            }
          }
        ],
        lastUpdated: new Date()
      };

      return ServiceResult.success(requirements);

    } catch (error: any) {
      this.logger.error('Get compliance requirements failed', { error: error.message, country });
      return ServiceResult.error('COMPLIANCE_REQUIREMENTS_ERROR', 'Failed to get compliance requirements', error.message);
    }
  }

  /**
   * Get provider information and limits
   */
  async getProviderInfo(provider: MobileMoneyProvider): Promise<ServiceResponse<any>> {
    try {
      this.logger.info('Getting provider info', { provider });

      // Get provider configuration from database
      const providerConfig = await this.prisma.mobileMoneyProvider.findUnique({
        where: { code: provider }
      });

      if (!providerConfig) {
        return ServiceResult.error('PROVIDER_NOT_FOUND', 'Provider not found');
      }

      const providerInfo = {
        provider,
        name: providerConfig.displayName,
        isAvailable: providerConfig.isActive,
        supportedCurrencies: providerConfig.supportedCurrencies.split(','),
        limits: {
          min: providerConfig.minAmount,
          max: providerConfig.maxAmount,
          dailyLimit: 100000, // Default limits
          monthlyLimit: 1000000
        },
        fees: {
          fixed: providerConfig.fixedFee,
          percentage: providerConfig.percentageFee
        },
        country: providerConfig.country
      };

      return ServiceResult.success(providerInfo);

    } catch (error: any) {
      this.logger.error('Get provider info failed', { error: error.message, provider });
      return ServiceResult.error('PROVIDER_INFO_ERROR', 'Failed to get provider info', error.message);
    }
  }
}