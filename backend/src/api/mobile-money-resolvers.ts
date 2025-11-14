/**
 * Mobile Money GraphQL Resolvers
 * Task 15: Mobile Money Integration - GraphQL API
 * 
 * GraphQL resolvers for mobile money operations
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import { MobileMoneyService } from '../services/mobileMoneyService';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { ComplianceService } from '../services/compliance.service';
import {
  MobileMoneyProvider,
  PaymentRequest,
  TransactionType,
  PaymentStatus
} from '../types/mobile-money';
import { GraphQLError } from 'graphql';

// GraphQL Schema Extension for Mobile Money
export const mobileMoneyTypeDefs = `
  # Mobile Money Types
  enum MobileMoneyProvider {
    MPESA
    ORANGE_MONEY
    MTN_MONEY
    ECOCASH
    AIRTEL_MONEY
    TIGO_PESA
    VODAFONE_CASH
    ORANGE_CASH
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
    REFUNDED
    EXPIRED
  }

  enum TransactionType {
    SUBSCRIPTION_PAYMENT
    PREMIUM_CONTENT
    TOP_UP
    REFUND
  }

  enum FraudRiskLevel {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type MobileMoneyTransaction {
    id: ID!
    userId: ID!
    provider: MobileMoneyProvider!
    providerTransactionId: String
    amount: Int!
    currency: String!
    phoneNumber: String!
    status: PaymentStatus!
    transactionType: TransactionType!
    description: String!
    subscriptionId: ID
    fees: TransactionFees!
    metadata: JSON
    failureReason: String
    processedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    fraudAnalysis: FraudAnalysis
    complianceCheck: ComplianceCheck
  }

  type TransactionFees {
    providerFee: Int!
    platformFee: Int!
    totalFee: Int!
  }

  type PaymentResponse {
    success: Boolean!
    transactionId: String!
    providerTransactionId: String
    status: PaymentStatus!
    message: String!
    checkoutUrl: String
    qrCode: String
    errorCode: String
  }

  type PaymentVerification {
    verified: Boolean!
    status: PaymentStatus!
    amount: Int
    currency: String
    completedAt: DateTime
    errorMessage: String
  }

  type FraudAnalysis {
    id: ID!
    transactionId: ID
    riskLevel: FraudRiskLevel!
    riskScore: Int!
    flags: [FraudFlag!]!
    recommendation: String!
    reason: String!
    analyzedAt: DateTime!
    reviewedAt: DateTime
    reviewedBy: String
    finalDecision: String
    notes: String
  }

  type FraudFlag {
    type: String!
    severity: String!
    description: String!
    details: JSON
  }

  type ComplianceCheck {
    id: ID!
    transactionId: ID
    passed: Boolean!
    violations: [String!]
    checkedAt: DateTime!
    checkedBy: String!
  }

  type ProviderLimits {
    min: Int!
    max: Int!
    dailyLimit: Int!
    monthlyLimit: Int!
  }

  type ProviderInfo {
    provider: MobileMoneyProvider!
    name: String!
    isAvailable: Boolean!
    supportedCurrencies: [String!]!
    limits: ProviderLimits!
    fees: ProviderFees!
  }

  type ProviderFees {
    fixed: Int!
    percentage: Float!
  }

  type PaymentAnalytics {
    totalTransactions: Int!
    totalAmount: Int!
    currency: String!
    successRate: Float!
    averageAmount: Float!
    providerBreakdown: [ProviderStats!]!
    countryBreakdown: [CountryStats!]!
    failureReasons: [FailureStats!]!
  }

  type ProviderStats {
    provider: MobileMoneyProvider!
    transactions: Int!
    amount: Int!
    successRate: Float!
  }

  type CountryStats {
    country: String!
    transactions: Int!
    amount: Int!
    successRate: Float!
  }

  type FailureStats {
    reason: String!
    count: Int!
    percentage: Float!
  }

  # Input Types
  input PaymentRequestInput {
    provider: MobileMoneyProvider!
    amount: Int!
    currency: String!
    phoneNumber: String!
    description: String!
    transactionType: TransactionType!
    subscriptionId: ID
    metadata: JSON
    callbackUrl: String
  }

  input PaymentVerificationInput {
    transactionId: ID!
    provider: MobileMoneyProvider!
    providerTransactionId: String!
  }

  input TransactionFilters {
    status: PaymentStatus
    provider: MobileMoneyProvider
    startDate: DateTime
    endDate: DateTime
    transactionType: TransactionType
  }

  input AnalyticsFilters {
    startDate: DateTime!
    endDate: DateTime!
    country: String
    provider: MobileMoneyProvider
    userId: ID
  }

  # Queries
  extend type Query {
    # Get user's mobile money transactions
    mobileMoneyTransactions(
      userId: ID
      filters: TransactionFilters
      page: Int = 1
      limit: Int = 20
    ): [MobileMoneyTransaction!]!

    # Get specific transaction
    mobileMoneyTransaction(id: ID!): MobileMoneyTransaction

    # Get available providers for country
    availableMobileMoneyProviders(country: String!): [ProviderInfo!]!

    # Get provider health status
    mobileMoneyProviderHealth(provider: MobileMoneyProvider!): ProviderInfo!

    # Get payment analytics
    mobileMoneyAnalytics(filters: AnalyticsFilters!): PaymentAnalytics!

    # Get fraud analysis
    fraudAnalysis(id: ID!): FraudAnalysis

    # Get compliance check
    complianceCheck(id: ID!): ComplianceCheck
  }

  # Mutations
  extend type Mutation {
    # Initiate mobile money payment
    initiateMobileMoneyPayment(input: PaymentRequestInput!): PaymentResponse!

    # Verify payment status
    verifyMobileMoneyPayment(input: PaymentVerificationInput!): PaymentVerification!

    # Process refund
    refundMobileMoneyPayment(
      transactionId: ID!
      amount: Int
      reason: String
    ): PaymentResponse!

    # Update fraud analysis decision
    updateFraudDecision(
      analysisId: ID!
      decision: String!
      notes: String
    ): FraudAnalysis!

    # Process subscription payment
    processMobileMoneySubscription(
      subscriptionId: ID!
      provider: MobileMoneyProvider!
      phoneNumber: String!
    ): PaymentResponse!

    # Retry failed subscription payment
    retryMobileMoneySubscription(paymentId: ID!): PaymentResponse!
  }

  # Subscriptions
  extend type Subscription {
    # Transaction status updates
    mobileMoneyTransactionUpdates(userId: ID!): MobileMoneyTransaction!

    # Provider status updates
    mobileMoneyProviderUpdates: ProviderInfo!
  }
`;

// Resolvers
export const mobileMoneyResolvers = {
  Query: {
    mobileMoneyTransactions: async (
      _: any,
      args: {
        userId?: string;
        filters?: any;
        page?: number;
        limit?: number;
      },
      context: any
    ) => {
      try {
        const { userId, filters, page = 1, limit = 20 } = args;
        
        // Authentication check
        if (!context.user && !userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const targetUserId = userId || context.user?.id;
        
        // Authorization check - users can only see their own transactions
        if (context.user?.id !== targetUserId && !context.user?.roles?.includes('ADMIN')) {
          throw new GraphQLError('Not authorized to view these transactions', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        const result = await mobileMoneyService.getUserTransactions(targetUserId!, filters);

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Failed to fetch transactions', {
            extensions: { code: result.error?.code || 'INTERNAL_ERROR' }
          });
        }

        return result.data?.data || [];

      } catch (error: any) {
        context.logger.error('Failed to fetch mobile money transactions', {
          error: error.message,
          userId: args.userId,
          filters: args.filters
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Failed to fetch transactions', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },

    mobileMoneyTransaction: async (
      _: any,
      args: { id: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        const result = await mobileMoneyService.getTransaction(args.id);

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Transaction not found', {
            extensions: { code: result.error?.code || 'NOT_FOUND' }
          });
        }

        const transaction = result.data;
        
        // Authorization check
        if (transaction?.userId !== context.user.id && !context.user.roles?.includes('ADMIN')) {
          throw new GraphQLError('Not authorized to view this transaction', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        return transaction;

      } catch (error: any) {
        context.logger.error('Failed to fetch mobile money transaction', {
          error: error.message,
          transactionId: args.id,
          userId: context.user?.id
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Failed to fetch transaction', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },

    availableMobileMoneyProviders: async (
      _: any,
      args: { country: string },
      context: any
    ) => {
      try {
        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        const result = await mobileMoneyService.getAvailableProviders(args.country);

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Failed to fetch providers', {
            extensions: { code: result.error?.code || 'INTERNAL_ERROR' }
          });
        }

        return result.data || [];

      } catch (error: any) {
        context.logger.error('Failed to fetch available providers', {
          error: error.message,
          country: args.country
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Failed to fetch providers', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    },

    mobileMoneyAnalytics: async (
      _: any,
      args: { filters: any },
      context: any
    ) => {
      try {
        // Admin only feature
        if (!context.user?.roles?.includes('ADMIN')) {
          throw new GraphQLError('Admin access required', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        const result = await mobileMoneyService.getPaymentAnalytics({
          startDate: args.filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: args.filters?.endDate || new Date(),
          country: args.filters?.country,
          provider: args.filters?.provider,
          userId: args.filters?.userId
        });

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Failed to fetch analytics', {
            extensions: { code: result.error?.code || 'INTERNAL_ERROR' }
          });
        }

        return result.data;

      } catch (error: any) {
        context.logger.error('Failed to fetch mobile money analytics', {
          error: error.message,
          filters: args.filters
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Failed to fetch analytics', {
          extensions: { code: 'INTERNAL_ERROR' }
        });
      }
    }
  },

  Mutation: {
    initiateMobileMoneyPayment: async (
      _: any,
      args: { input: any },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const paymentRequest: PaymentRequest = {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: context.user.id,
          provider: args.input.provider,
          amount: args.input.amount,
          currency: args.input.currency,
          phoneNumber: args.input.phoneNumber,
          description: args.input.description,
          transactionType: args.input.transactionType,
          subscriptionId: args.input.subscriptionId,
          metadata: args.input.metadata,
          callbackUrl: args.input.callbackUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        const result = await mobileMoneyService.initiatePayment(paymentRequest);

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Payment initiation failed', {
            extensions: { 
              code: result.error?.code || 'PAYMENT_FAILED',
              details: result.error?.details
            }
          });
        }

        return result.data;

      } catch (error: any) {
        context.logger.error('Failed to initiate mobile money payment', {
          error: error.message,
          userId: context.user?.id,
          provider: args.input.provider,
          amount: args.input.amount
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Payment initiation failed', {
          extensions: { code: 'PAYMENT_FAILED' }
        });
      }
    },

    verifyMobileMoneyPayment: async (
      _: any,
      args: { input: any },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        
        // Check if user owns the transaction
        const transaction = await mobileMoneyService.getTransaction(args.input.transactionId);
        if (transaction.data?.userId !== context.user.id && !context.user.roles?.includes('ADMIN')) {
          throw new GraphQLError('Not authorized to verify this transaction', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const result = await mobileMoneyService.verifyPayment(args.input);

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Payment verification failed', {
            extensions: { code: result.error?.code || 'VERIFICATION_FAILED' }
          });
        }

        return result.data;

      } catch (error: any) {
        context.logger.error('Failed to verify mobile money payment', {
          error: error.message,
          transactionId: args.input.transactionId,
          userId: context.user?.id
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Payment verification failed', {
          extensions: { code: 'VERIFICATION_FAILED' }
        });
      }
    },

    refundMobileMoneyPayment: async (
      _: any,
      args: { transactionId: string; amount?: number; reason?: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Validate reason
        if (!args.reason || args.reason.trim().length === 0) {
          throw new GraphQLError('Refund reason is required', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        // Admin only for refunds
        if (!context.user.roles?.includes('ADMIN')) {
          throw new GraphQLError('Admin access required for refunds', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
        
        // Process refund
        const result = await mobileMoneyService.processRefund(
          args.transactionId,
          args.reason,
          context.user.id
        );

        if (!result.success) {
          throw new GraphQLError(result.error?.message || 'Refund failed', {
            extensions: { 
              code: result.error?.code || 'REFUND_ERROR',
              details: result.error?.details
            }
          });
        }

        return {
          success: true,
          refund: {
            id: result.data!.refundId,
            transactionId: result.data!.originalTransactionId,
            amount: result.data!.amount,
            status: result.data!.status,
            reason: args.reason,
            processedAt: new Date(),
            createdAt: new Date()
          }
        };

      } catch (error: any) {
        context.logger.error('Failed to process mobile money refund', {
          error: error.message,
          transactionId: args.transactionId,
          userId: context.user?.id
        });

        if (error instanceof GraphQLError) {
          throw error;
        }

        throw new GraphQLError('Refund processing failed', {
          extensions: { code: 'REFUND_FAILED' }
        });
      }
    }
  },

  // Field Resolvers
  MobileMoneyTransaction: {
    user: async (parent: any, _: any, context: any) => {
      return context.loaders.userLoader.load(parent.userId);
    },

    fraudAnalysis: async (parent: any, _: any, context: any) => {
      if (!parent.fraudAnalysisId) return null;
      const mobileMoneyService = context.services.mobileMoneyService as MobileMoneyService;
      // Mock fraud analysis for now - implementation incomplete
      const result = {
        success: true,
        data: {
          id: parent.fraudAnalysisId,
          riskLevel: 'LOW',
          riskScore: 25,
          recommendation: 'APPROVE',
          reason: 'Low risk transaction'
        }
      };
      return result.success ? result.data : null;
    },

    complianceCheck: async (parent: any, _: any, context: any) => {
      if (!parent.complianceCheckId) return null;
      // Implementation would load compliance check
      return null;
    },

    fees: (parent: any) => ({
      providerFee: parent.providerFee || 0,
      platformFee: parent.platformFee || 0,
      totalFee: parent.totalFee || 0
    }),

    metadata: (parent: any) => {
      try {
        return parent.metadata ? JSON.parse(parent.metadata) : null;
      } catch {
        return null;
      }
    }
  },

  FraudAnalysis: {
    flags: (parent: any) => {
      try {
        return parent.flags ? JSON.parse(parent.flags) : [];
      } catch {
        return [];
      }
    }
  },

  ComplianceCheck: {
    violations: (parent: any) => {
      try {
        return parent.violations ? JSON.parse(parent.violations) : [];
      } catch {
        return [];
      }
    }
  }
};

export default {
  typeDefs: mobileMoneyTypeDefs,
  resolvers: mobileMoneyResolvers
};