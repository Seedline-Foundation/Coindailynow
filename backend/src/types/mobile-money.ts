/**
 * Mobile Money Integration Types
 * Task 15: Mobile Money Integration Implementation
 * 
 * Comprehensive type definitions for African mobile money providers
 */

// ========== Mobile Money Provider Types ==========

export enum MobileMoneyProvider {
  MPESA = 'MPESA',                    // Kenya, Tanzania, Uganda
  ORANGE_MONEY = 'ORANGE_MONEY',      // West & Central Africa
  MTN_MONEY = 'MTN_MONEY',            // Ghana, Uganda, Rwanda, Cameroon
  ECOCASH = 'ECOCASH',                // Zimbabwe
  AIRTEL_MONEY = 'AIRTEL_MONEY',      // Multiple African countries
  TIGO_PESA = 'TIGO_PESA',           // Tanzania
  VODAFONE_CASH = 'VODAFONE_CASH',    // Ghana
  ORANGE_CASH = 'ORANGE_CASH',        // Mali, Senegal, Burkina Faso
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED'
}

export enum TransactionType {
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  PREMIUM_CONTENT = 'PREMIUM_CONTENT',
  TOP_UP = 'TOP_UP',
  REFUND = 'REFUND'
}

export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ========== Provider Configuration ==========

export interface MobileMoneyConfig {
  provider: MobileMoneyProvider;
  country: string;
  currency: string;
  apiEndpoint: string;
  merchantId: string;
  apiKey: string;
  secretKey: string;
  isActive: boolean;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  fees: {
    fixed: number;
    percentage: number;
  };
  timeout: number; // in seconds
}

// ========== Payment Request Types ==========

export interface PaymentRequest {
  id: string;
  userId: string;
  provider: MobileMoneyProvider;
  amount: number;
  currency: string;
  phoneNumber: string;
  description: string;
  transactionType: TransactionType;
  subscriptionId?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
  expiresAt: Date;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  message: string;
  checkoutUrl?: string;
  qrCode?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

// ========== Transaction Types ==========

export interface MobileMoneyTransaction {
  id: string;
  userId: string;
  provider: MobileMoneyProvider;
  providerTransactionId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  status: PaymentStatus;
  transactionType: TransactionType;
  description: string;
  subscriptionId?: string;
  fees: {
    providerFee: number;
    platformFee: number;
    totalFee: number;
  };
  metadata: Record<string, any>;
  failureReason?: string;
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ========== Verification Types ==========

export interface PaymentVerificationRequest {
  transactionId: string;
  provider: MobileMoneyProvider;
  providerTransactionId: string;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  completedAt?: Date;
  errorMessage?: string;
}

// ========== Subscription Integration ==========

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  userId: string;
  paymentMethod: 'mobile_money';
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ========== Fraud Detection Types ==========

export interface FraudDetectionRules {
  maxDailyTransactions: number;
  maxDailyAmount: number;
  maxMonthlyAmount: number;
  velocityCheckMinutes: number;
  maxVelocityTransactions: number;
  suspiciousPatterns: string[];
  blockedPhoneNumbers: string[];
  blockedCountries: string[];
}

export interface FraudAnalysis {
  transactionId: string;
  riskLevel: FraudRiskLevel;
  riskScore: number; // 0-100
  flags: FraudFlag[];
  recommendation: 'approve' | 'review' | 'decline';
  reason: string;
  analyzedAt: Date;
}

export interface FraudFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: Record<string, any>;
}

// ========== Regulatory Compliance ==========

export interface ComplianceRequirement {
  country: string;
  provider: MobileMoneyProvider;
  requirements: {
    kycRequired: boolean;
    maxTransactionAmount: number;
    maxDailyAmount: number;
    maxMonthlyAmount: number;
    identityVerification: boolean;
    taxReporting: boolean;
    dataRetentionDays: number;
  };
  restrictions: string[];
  updatedAt: Date;
}

export interface ComplianceCheck {
  transactionId: string;
  country: string;
  provider: MobileMoneyProvider;
  checks: {
    amountLimits: boolean;
    kycStatus: boolean;
    sanctionsScreen: boolean;
    taxCompliance: boolean;
  };
  passed: boolean;
  violations: string[];
  checkedAt: Date;
}

// ========== Webhook Types ==========

export interface MobileMoneyWebhook {
  provider: MobileMoneyProvider;
  eventType: string;
  transactionId: string;
  providerTransactionId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  timestamp: Date;
  signature: string;
  payload: Record<string, any>;
}

// ========== Analytics Types ==========

export interface PaymentAnalytics {
  timeframe: {
    start: Date;
    end: Date;
  };
  totalTransactions: number;
  totalAmount: number;
  currency: string;
  successRate: number;
  averageAmount: number;
  providerBreakdown: {
    provider: MobileMoneyProvider;
    transactions: number;
    amount: number;
    successRate: number;
  }[];
  countryBreakdown: {
    country: string;
    transactions: number;
    amount: number;
    successRate: number;
  }[];
  failureReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

// ========== Service Response Types ==========

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    processingTime: number;
    cacheHit?: boolean;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ========== Configuration Types ==========

export interface MobileMoneyServiceConfig {
  providers: MobileMoneyConfig[];
  defaultTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  fraudDetection: {
    enabled: boolean;
    rules: FraudDetectionRules;
  };
  compliance: {
    enabled: boolean;
    strictMode: boolean;
  };
  webhook: {
    enabled: boolean;
    endpoints: Record<MobileMoneyProvider, string>;
    secrets: Record<MobileMoneyProvider, string>;
  };
  caching: {
    enabled: boolean;
    ttl: number;
  };
}

// ========== Error Types ==========

export class MobileMoneyError extends Error {
  public readonly code: string;
  public readonly provider?: MobileMoneyProvider | undefined;
  public readonly transactionId?: string | undefined;
  public readonly details?: Record<string, any> | undefined;

  constructor(
    message: string,
    code: string,
    provider?: MobileMoneyProvider | undefined,
    transactionId?: string | undefined,
    details?: Record<string, any> | undefined
  ) {
    super(message);
    this.name = 'MobileMoneyError';
    this.code = code;
    this.provider = provider;
    this.transactionId = transactionId;
    this.details = details;
  }
}

export enum ErrorCodes {
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_DECLINED = 'TRANSACTION_DECLINED',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  TIMEOUT = 'TIMEOUT',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  CURRENCY_NOT_SUPPORTED = 'CURRENCY_NOT_SUPPORTED',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED'
}

// ========== Additional Provider Types ==========

export interface ProviderInfo {
  provider: MobileMoneyProvider;
  name: string;
  isAvailable: boolean;
  supportedCurrencies: string[];
  limits: ProviderLimits;
  fees: ProviderFees;
}

export interface ProviderLimits {
  min: number;
  max: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface ProviderFees {
  fixed: number;
  percentage: number;
}

export interface ProviderStats {
  provider: MobileMoneyProvider;
  transactions: number;
  amount: number;
  successRate: number;
}

export interface CountryStats {
  country: string;
  transactions: number;
  amount: number;
  successRate: number;
}

export interface FailureStats {
  reason: string;
  count: number;
  percentage: number;
}