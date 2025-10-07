/**
 * Mobile Money Service Interface
 * Task 15: Mobile Money Integration Implementation
 * 
 * Core service interface for mobile money operations
 */

import {
  MobileMoneyProvider,
  PaymentRequest,
  PaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  MobileMoneyTransaction,
  SubscriptionPayment,
  FraudAnalysis,
  ComplianceCheck,
  ServiceResponse,
  PaginatedResponse,
  PaymentAnalytics,
  MobileMoneyError
} from '../../types/mobile-money';

export interface IMobileMoneyService {
  // ========== Payment Operations ==========
  
  /**
   * Initiate a mobile money payment
   */
  initiatePayment(request: PaymentRequest): Promise<ServiceResponse<PaymentResponse>>;
  
  /**
   * Verify payment status with provider
   */
  verifyPayment(request: PaymentVerificationRequest): Promise<ServiceResponse<PaymentVerificationResponse>>;
  
  /**
   * Process refund for completed transaction
   */
  refundPayment(transactionId: string, amount?: number, reason?: string): Promise<ServiceResponse<PaymentResponse>>;
  
  // ========== Transaction Management ==========
  
  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Promise<ServiceResponse<MobileMoneyTransaction>>;
  
  /**
   * Get user transactions with pagination
   */
  getUserTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      provider?: MobileMoneyProvider;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ServiceResponse<PaginatedResponse<MobileMoneyTransaction>>>;
  
  /**
   * Update transaction status
   */
  updateTransactionStatus(
    transactionId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<MobileMoneyTransaction>>;
  
  // ========== Subscription Payments ==========
  
  /**
   * Process subscription payment
   */
  processSubscriptionPayment(
    subscriptionId: string,
    provider: MobileMoneyProvider,
    phoneNumber: string
  ): Promise<ServiceResponse<SubscriptionPayment>>;
  
  /**
   * Retry failed subscription payment
   */
  retrySubscriptionPayment(paymentId: string): Promise<ServiceResponse<SubscriptionPayment>>;
  
  /**
   * Get subscription payment history
   */
  getSubscriptionPayments(
    subscriptionId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ServiceResponse<PaginatedResponse<SubscriptionPayment>>>;
  
  // ========== Fraud Detection ==========
  
  /**
   * Analyze transaction for fraud
   */
  analyzeFraud(
    transactionId: string,
    additionalData?: Record<string, any>
  ): Promise<ServiceResponse<FraudAnalysis>>;
  
  /**
   * Get fraud analysis results
   */
  getFraudAnalysis(analysisId: string): Promise<ServiceResponse<FraudAnalysis>>;
  
  /**
   * Update fraud analysis decision
   */
  updateFraudDecision(
    analysisId: string,
    decision: 'approved' | 'declined',
    reviewedBy: string,
    notes?: string
  ): Promise<ServiceResponse<FraudAnalysis>>;
  
  // ========== Compliance ==========
  
  /**
   * Perform compliance check
   */
  performComplianceCheck(
    transactionId: string,
    country: string,
    provider: MobileMoneyProvider
  ): Promise<ServiceResponse<ComplianceCheck>>;
  
  /**
   * Get compliance requirements for country/provider
   */
  getComplianceRequirements(
    country: string,
    provider?: MobileMoneyProvider
  ): Promise<ServiceResponse<any>>;
  
  // ========== Provider Management ==========
  
  /**
   * Get available providers for country
   */
  getAvailableProviders(country: string): Promise<ServiceResponse<MobileMoneyProvider[]>>;
  
  /**
   * Check provider health status
   */
  checkProviderHealth(provider: MobileMoneyProvider): Promise<ServiceResponse<{ status: string; latency: number }>>;
  
  // ========== Analytics ==========
  
  /**
   * Get payment analytics
   */
  getPaymentAnalytics(options: {
    startDate: Date;
    endDate: Date;
    country?: string;
    provider?: MobileMoneyProvider;
    userId?: string;
  }): Promise<ServiceResponse<PaymentAnalytics>>;
  
  /**
   * Get transaction success rates
   */
  getSuccessRates(options: {
    period: 'day' | 'week' | 'month';
    provider?: MobileMoneyProvider;
    country?: string;
  }): Promise<ServiceResponse<{ provider: string; successRate: number; totalTransactions: number }[]>>;
  
  // ========== Webhook Handling ==========
  
  /**
   * Process webhook from provider
   */
  processWebhook(
    provider: MobileMoneyProvider,
    signature: string,
    payload: any
  ): Promise<ServiceResponse<{ processed: boolean; transactionId?: string }>>;
  
  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    provider: MobileMoneyProvider,
    payload: string,
    signature: string
  ): Promise<boolean>;
}

export interface IMobileMoneyProvider {
  // ========== Provider Interface ==========
  
  /**
   * Initialize payment with provider
   */
  initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  /**
   * Check payment status with provider
   */
  checkPaymentStatus(providerTransactionId: string): Promise<PaymentVerificationResponse>;
  
  /**
   * Process refund with provider
   */
  processRefund(providerTransactionId: string, amount: number, reason: string): Promise<PaymentResponse>;
  
  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string, country: string): boolean;
  
  /**
   * Calculate fees for transaction
   */
  calculateFees(amount: number, currency: string): {
    providerFee: number;
    platformFee: number;
    totalFee: number;
  };
  
  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[];
  
  /**
   * Get transaction limits
   */
  getTransactionLimits(country: string): {
    min: number;
    max: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  
  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

export interface IMobileMoneyFraudDetector {
  // ========== Fraud Detection Interface ==========
  
  /**
   * Analyze transaction for fraud indicators
   */
  analyze(transaction: Partial<MobileMoneyTransaction>): Promise<FraudAnalysis>;
  
  /**
   * Check velocity rules (transaction frequency)
   */
  checkVelocity(userId: string, phoneNumber: string, timeWindowMinutes: number): Promise<{
    transactionCount: number;
    totalAmount: number;
    exceedsLimit: boolean;
  }>;
  
  /**
   * Check if phone number is blocked
   */
  isPhoneNumberBlocked(phoneNumber: string): Promise<boolean>;
  
  /**
   * Check daily/monthly limits
   */
  checkLimits(userId: string, amount: number, currency: string): Promise<{
    dailyUsed: number;
    monthlyUsed: number;
    exceedsDailyLimit: boolean;
    exceedsMonthlyLimit: boolean;
  }>;
  
  /**
   * Update fraud rules
   */
  updateRules(rules: any): Promise<void>;
}

export interface IMobileMoneyCompliance {
  // ========== Compliance Interface ==========
  
  /**
   * Validate transaction against compliance requirements
   */
  validateTransaction(
    transaction: Partial<MobileMoneyTransaction>,
    country: string,
    provider: MobileMoneyProvider
  ): Promise<ComplianceCheck>;
  
  /**
   * Check KYC status for user
   */
  checkKYCStatus(userId: string, country: string): Promise<{
    verified: boolean;
    level: string;
    documentsRequired: string[];
  }>;
  
  /**
   * Screen against sanctions lists
   */
  sanctionsScreen(phoneNumber: string, country: string): Promise<{
    clear: boolean;
    matches: any[];
  }>;
  
  /**
   * Calculate tax obligations
   */
  calculateTaxObligation(
    amount: number,
    currency: string,
    country: string,
    transactionType: string
  ): Promise<{
    taxableAmount: number;
    taxRate: number;
    taxDue: number;
  }>;
}