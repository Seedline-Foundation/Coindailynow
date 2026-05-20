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

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  requiresOTP?: boolean;
  requiresApproval?: boolean;
}

export interface DepositInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  externalReference?: string;
  metadata?: Record<string, any>;
}

export interface WithdrawalInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  destinationType: 'EXTERNAL_WALLET' | 'MOBILE_MONEY' | 'BANK_ACCOUNT';
  destinationAddress: string;
  otpCode?: string;
  metadata?: Record<string, any>;
}

export interface TransferInput {
  fromUserId: string;
  fromWalletId: string;
  toUserId: string;
  toWalletId: string;
  amount: number;
  currency: string; // Denominated in USD, typically 'JY' (JOY Token) on platform
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  paymentType: 'SUBSCRIPTION' | 'PRODUCT' | 'SERVICE' | 'PREMIUM_CONTENT' | 'BOOST_CAMPAIGN';
  referenceId: string;
  metadata?: Record<string, any>;
}

export interface RefundInput {
  originalTransactionId: string;
  amount?: number;
  reason: string;
  refundType: 'FULL' | 'PARTIAL';
  metadata?: Record<string, any>;
}

export interface StakingInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  duration: number;
  aprRate: number;
  metadata?: Record<string, any>;
}

export interface ConversionInput {
  userId: string;
  walletId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  conversionRate: number;
  metadata?: Record<string, any>;
}

export interface AirdropInput {
  campaignName: string;
  totalAmount: number;
  currency: string;
  eligibilityCriteria: Record<string, any>;
  distributionDate: Date;
  createdByUserId: string;
  metadata?: Record<string, any>;
}

export interface EscrowInput {
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  description: string;
  releaseConditions: string;
  metadata?: Record<string, any>;
}

export interface GiftInput {
  fromUserId: string;
  fromWalletId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface BatchTransferInput {
  fromUserId: string;
  fromWalletId: string;
  transfers: Array<{
    toUserId: string;
    toWalletId: string;
    amount: number;
    description?: string;
  }>;
  currency: string;
  metadata?: Record<string, any>;
}

export interface CommissionInput {
  referrerId: string;
  refereeId: string;
  referralId: string;
  amount: number;
  currency: string;
  commissionRate: number;
  sourceTransactionId?: string;
  metadata?: Record<string, any>;
}

export interface AffiliateCommissionInput {
  affiliateUserId: string;
  influencerId?: string;
  partnershipId?: string;
  amount: number;
  currency: string;
  commissionRate: number;
  sourceType: 'SUBSCRIPTION' | 'PRODUCT' | 'SERVICE' | 'PREMIUM_CONTENT' | 'CLICK' | 'CONVERSION';
  sourceReferenceId: string;
  metadata?: Record<string, any>;
}

export interface RevenueTrackingInput {
  amount: number;
  currency: string;
  revenueType: 'TRANSACTION_FEES' | 'SERVICES' | 'PARTNERSHIPS' | 'SUBSCRIPTION' | 'ADS' | 'ECOMMERCE' | 'PREMIUM_CONTENT' | 'BOOST' | 'AFFILIATE';
  sourceReferenceId: string;
  sourceType?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ExpenseInput {
  amount: number;
  currency: string;
  expenseType: 'CREATOR_PAYMENT' | 'REFERRAL_PAYOUT' | 'OPERATIONAL' | 'MARKETING' | 'DEVELOPMENT' | 'SUPPORT' | 'COMPLIANCE';
  recipientId?: string;
  recipientWalletId?: string;
  externalRecipient?: string;
  description: string;
  approvedByUserId: string;
  sourceReferenceId?: string;
  metadata?: Record<string, any>;
}

export interface AuditInput {
  auditType: 'WALLET' | 'USER_FINANCIAL';
  targetId: string;
  auditedByUserId: string;
  auditScope?: string[];
  metadata?: Record<string, any>;
}

export interface ReportInput {
  reportType: 'TRANSACTION' | 'REVENUE' | 'PAYOUTS' | 'RECONCILIATION';
  startDate: Date;
  endDate: Date;
  filters?: Record<string, any>;
  requestedByUserId: string;
  format?: 'JSON' | 'CSV' | 'PDF';
  metadata?: Record<string, any>;
}

export interface AuditResult {
  success: boolean;
  auditId?: string;
  findings?: {
    walletId?: string;
    userId?: string;
    currentBalance?: number;
    calculatedBalance?: number;
    balanceDiscrepancy?: number;
    totalTransactions?: number;
    lastTransactionDate?: Date | null;
    suspiciousPatterns: string[];
    recommendations: string[];
    riskScore?: number;
    [key: string]: any;
  };
  error?: string;
}

export interface ReportResult {
  success: boolean;
  reportId?: string;
  data?: any;
  downloadUrl?: string;
  error?: string;
}

// Security & Fraud Prevention interfaces
export interface SecurityOTPInput {
  userId: string;
  operationType: string;
  transactionId?: string;
  otpCode: string;
  metadata?: Record<string, any>;
}

export interface Security2FAInput {
  userId: string;
  operationType: string;
  token: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}

export interface SecurityWalletFreezeInput {
  walletId: string;
  reason: string;
  frozenByUserId: string;
  duration?: number; // in hours
  metadata?: Record<string, any>;
}

export interface SecurityWhitelistInput {
  userId: string;
  walletAddress: string;
  operationType: 'ADD' | 'REMOVE';
  approvedByUserId: string;
  metadata?: Record<string, any>;
}

export interface SecurityFraudDetectionInput {
  transactionId?: string;
  userId?: string;
  walletId?: string;
  analysisType: 'TRANSACTION' | 'USER' | 'WALLET' | 'PATTERN';
  metadata?: Record<string, any>;
}

export interface SecurityTransactionLimitInput {
  userId: string;
  walletId: string;
  limitType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TRANSACTION';
  amount: number;
  currency: string;
  setByUserId: string;
  metadata?: Record<string, any>;
}

export interface SecurityResult {
  success: boolean;
  verified?: boolean;
  walletFrozen?: boolean;
  whitelistUpdated?: boolean;
  fraudScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  limitSet?: boolean;
  findings?: Record<string, any>;
  error?: string;
}

// Tax & Compliance interfaces
export interface TaxCalculationInput {
  userId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  transactionType: string;
  jurisdiction: string;
  taxYear: number;
  metadata?: Record<string, any>;
}

export interface TaxReportInput {
  userId?: string;
  fromDate: Date;
  toDate: Date;
  jurisdiction: string;
  reportType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  taxYear: number;
  requestedByUserId: string;
  metadata?: Record<string, any>;
}

export interface ComplianceKYCInput {
  userId: string;
  documentType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID' | 'UTILITY_BILL';
  documentNumber: string;
  documentUrl: string;
  verifiedByUserId: string;
  metadata?: Record<string, any>;
}

export interface ComplianceAMLInput {
  userId: string;
  checkType: 'SANCTIONS' | 'PEP' | 'ADVERSE_MEDIA' | 'COMPREHENSIVE';
  transactionId?: string;
  amount?: number;
  currency?: string;
  performedByUserId: string;
  metadata?: Record<string, any>;
}

export interface TaxComplianceResult {
  success: boolean;
  taxAmount?: number;
  taxRate?: number;
  reportId?: string;
  kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  amlStatus?: 'CLEAR' | 'FLAGGED' | 'REVIEW_REQUIRED';
  riskScore?: number;
  findings?: Record<string, any>;
  error?: string;
}

// Wallet Management interfaces
export interface WalletCreateInput {
  userId: string;
  walletType?: WalletType;
  currency?: string; // Default: 'JY' (JOY Token - primary platform currency denominated in USD)
  dailyWithdrawalLimit?: number;
  transactionLimit?: number;
  metadata?: Record<string, any>;
}

export interface WalletViewBalanceInput {
  userId: string;
  walletId: string;
}

export interface WalletViewHistoryInput {
  userId: string;
  walletId: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  transactionType?: TransactionType;
}

export interface WalletSetLimitsInput {
  userId: string;
  walletId: string;
  dailyWithdrawalLimit?: number;
  transactionLimit?: number;
  setByUserId: string;
  metadata?: Record<string, any>;
}

export interface WalletRecoveryInput {
  userId: string;
  walletId: string;
  recoveryMethod: 'EMAIL' | 'SMS' | 'AUTHENTICATOR' | 'BACKUP_CODES';
  recoveryCode: string;
  newSecuritySettings?: {
    twoFactorRequired?: boolean;
    otpRequired?: boolean;
  };
  approvedByUserId?: string;
  metadata?: Record<string, any>;
}

export interface WalletOperationResult {
  success: boolean;
  walletId?: string;
  walletAddress?: string;
  walletType?: WalletType;
  currency?: string;
  balance?: {
    available: number;
    locked: number;
    staked: number;
    total: number;
    cePoints: number;
    joyTokens: number;
  };
  status?: WalletStatus;
  limits?: {
    dailyWithdrawal: number | null;
    transaction: number | null;
  };
  security?: {
    twoFactorRequired: boolean;
    otpRequired: boolean;
  };
  transactions?: any[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  message?: string;
  error?: string;
}

// Payment Gateway interfaces
export interface GatewayStripeInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  paymentMethodId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GatewayPayPalInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GatewayMobileMoneyInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  provider: 'M-PESA' | 'ORANGE_MONEY' | 'MTN_MONEY' | 'ECOCASH' | 'AIRTEL_MONEY';
  phoneNumber: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GatewayCryptoInput {
  userId: string;
  walletId: string;
  amount: number;
  cryptoCurrency: 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'BNB' | 'SOL' | 'MATIC';
  network: string;
  txHash?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GatewayBankTransferInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  bankAccountNumber: string;
  bankName: string;
  referenceNumber?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GatewayResult {
  success: boolean;
  transactionId?: string;
  gatewayTransactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  gateway?: string;
  message?: string;
  error?: string;
}

// Advanced Operations interfaces
export interface BulkTransferAdvancedInput {
  fromUserId: string;
  fromWalletId: string;
  transfers: Array<{
    toUserId: string;
    toWalletId: string;
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
  }>;
  scheduledDate?: Date;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  metadata?: Record<string, any>;
}

export interface ScheduledPaymentInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  recipientWalletId: string;
  scheduledDate: Date;
  paymentType?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RecurringPaymentInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  recipientWalletId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate?: Date;
  endDate?: Date;
  maxOccurrences?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentLinkInput {
  userId: string;
  walletId: string;
  amount: number;
  currency?: string;
  description?: string;
  expiresAt?: Date;
  maxUses?: number;
  requiresAuth?: boolean;
  customSlug?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceGenerationInput {
  userId: string;
  walletId: string;
  recipientUserId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  currency?: string;
  dueDate?: Date;
  notes?: string;
  taxRate?: number;
  discountAmount?: number;
  metadata?: Record<string, any>;
}

export interface BulkTransferResult {
  success: boolean;
  batchId?: string;
  totalAmount?: number;
  transferCount?: number;
  successCount?: number;
  failureCount?: number;
  results?: any[];
  status?: string;
  scheduledDate?: Date;
  requiredAmount?: number;
  availableAmount?: number;
  message?: string;
  error?: string;
}

export interface ScheduledPaymentResult {
  success: boolean;
  scheduledPaymentId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  scheduledDate?: Date;
  status?: string;
  message?: string;
  error?: string;
}

export interface RecurringPaymentResult {
  success: boolean;
  recurringPaymentId?: string;
  amount?: number;
  currency?: string;
  frequency?: string;
  startDate?: Date;
  endDate?: Date | null;
  maxOccurrences?: number | null;
  status?: string;
  nextPaymentDate?: Date;
  message?: string;
  error?: string;
}

export interface PaymentLinkResult {
  success: boolean;
  linkId?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  amount?: number;
  currency?: string;
  expiresAt?: Date | null;
  maxUses?: number | null;
  status?: string;
  message?: string;
  error?: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  currency?: string;
  status?: string;
  dueDate?: Date | null;
  downloadUrl?: string;
  paymentUrl?: string;
  message?: string;
  error?: string;
}

// Subscription-specific interfaces
export interface SubscriptionAutoRenewInput {
  subscriptionId: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface SubscriptionUpgradeInput {
  subscriptionId: string;
  userId: string;
  walletId: string;
  newPlanId: string;
  prorationAmount?: number;
  currency: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface SubscriptionDowngradeInput {
  subscriptionId: string;
  userId: string;
  walletId?: string;
  newPlanId: string;
  refundAmount?: number;
  currency: string;
  effectiveDate?: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionPauseInput {
  subscriptionId: string;
  userId: string;
  pauseReason: string;
  pauseDuration?: number; // in days, null for indefinite
  resumeDate?: Date;
  refundAmount?: number;
  walletId?: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionCancelInput {
  subscriptionId: string;
  userId: string;
  walletId?: string;
  cancelReason: string;
  immediateCancel: boolean;
  refundAmount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  transactionId?: string | null;
  newStatus?: string;
  prorationAmount?: number;
  refundAmount?: number;
  nextBillingDate?: Date;
  resumeDate?: Date | null;
  error?: string;
}
