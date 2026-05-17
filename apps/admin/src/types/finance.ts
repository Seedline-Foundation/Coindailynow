/**
 * Finance Types - Wallet, Transaction, and Financial Operations
 * 
 * TypeScript definitions for the financial module matching backend GraphQL schema
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum WalletType {
  USER_WALLET = 'USER_WALLET',
  ADMIN_WALLET = 'ADMIN_WALLET',
  WE_WALLET = 'WE_WALLET',
  ESCROW_WALLET = 'ESCROW_WALLET'
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  FROZEN = 'FROZEN',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  REWARD = 'REWARD',
  STAKING = 'STAKING',
  UNSTAKING = 'UNSTAKING',
  CONVERSION = 'CONVERSION',
  CE_CONVERSION = 'CE_CONVERSION',
  AIRDROP = 'AIRDROP',
  GIFT = 'GIFT',
  COMMISSION = 'COMMISSION',
  FEE = 'FEE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  WALLET_BALANCE = 'WALLET_BALANCE',
  CRYPTO = 'CRYPTO',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  CE_POINTS = 'CE_POINTS',
  JOY_TOKENS = 'JOY_TOKENS',
  MIXED = 'MIXED'
}

export enum PaymentType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  PREMIUM_CONTENT = 'PREMIUM_CONTENT',
  BOOST_CAMPAIGN = 'BOOST_CAMPAIGN'
}

export enum WithdrawalDestinationType {
  EXTERNAL_WALLET = 'EXTERNAL_WALLET',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_ACCOUNT = 'BANK_ACCOUNT'
}

export enum RefundType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL'
}

export enum StakingStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING_UNSTAKE = 'PENDING_UNSTAKE'
}

export enum AirdropStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum EscrowStatus {
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

export enum SubscriptionTier {
  APOSTLE = 'APOSTLE',
  EVANGELIST = 'EVANGELIST',
  PROPHET = 'PROPHET'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING'
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Wallet {
  id: string;
  userId: string;
  walletType: WalletType;
  walletAddress: string;
  currency: string;
  availableBalance: number;
  lockedBalance: number;
  stakedBalance: number;
  totalBalance: number;
  cePoints: number;
  joyTokens: number;
  status: WalletStatus;
  dailyWithdrawalLimit?: number;
  transactionLimit?: number;
  twoFactorRequired: boolean;
  otpRequired: boolean;
  whitelistedAddresses?: string[];
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  transactionHash: string;
  transactionType: TransactionType;
  operationType: string;
  fromWalletId?: string;
  toWalletId?: string;
  fromWallet?: Wallet;
  toWallet?: Wallet;
  amount: number;
  currency: string;
  netAmount: number;
  fee?: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  externalReference?: string;
  purpose?: string;
  description?: string; // Added for transaction details
  transactionDate: Date; // Added for timestamp
  completedAt?: Date; // Added for completion timestamp
  metadata?: Record<string, any>;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staking {
  id: string;
  userId: string;
  walletId: string;
  wallet?: Wallet;
  amount: number;
  currency: string;
  status: StakingStatus;
  aprRate: number;
  startDate: Date;
  stakingDate: Date; // Alias for startDate
  endDate: Date;
  expectedUnstakingDate: Date; // Alias for endDate
  rewardsEarned: number;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  walletId?: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  features: string[];
}

export interface Airdrop {
  id: string;
  name: string;
  description?: string;
  tokenAmount: number;
  currency: string;
  totalRecipients: number;
  status: AirdropStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AirdropRecipient {
  id: string;
  airdropId: string;
  userId: string;
  walletId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionId?: string;
  error?: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

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
  destinationType: WithdrawalDestinationType;
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
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface RefundInput {
  originalTransactionId: string;
  amount?: number;
  reason: string;
  refundType: RefundType;
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

export interface UnstakingInput {
  stakingId: string;
  userId: string;
  walletId: string;
  metadata?: Record<string, any>;
}

export interface CEConversionInput {
  userId: string;
  walletId: string;
  cePoints: number;
  targetCurrency: string;
  otpCode?: string;
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

export interface GiftInput {
  fromUserId: string;
  fromWalletId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface BatchTransferRecipient {
  toUserId: string;
  toWalletId: string;
  amount: number;
  description?: string;
}

export interface BatchTransferInput {
  fromUserId: string;
  fromWalletId: string;
  transfers: BatchTransferRecipient[];
  currency: string;
  metadata?: Record<string, any>;
}

export interface AirdropInput {
  name: string;
  description?: string;
  tokenAmount: number;
  currency: string;
  recipients: Array<{
    userId: string;
    walletId: string;
    amount: number;
  }>;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  requiresOTP?: boolean;
  requiresApproval?: boolean;
}

export interface WalletBalance {
  walletId: string;
  currency: string;
  availableBalance: number;
  lockedBalance: number;
  stakedBalance: number;
  totalBalance: number;
  cePoints: number;
  joyTokens: number;
}

export interface TransactionFilters {
  walletId?: string;
  userId?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AdminWalletOverview {
  totalWallets: number;
  activeWallets: number;
  totalBalance: number;
  totalLockedBalance: number;
  totalStakedBalance: number;
  totalCEPoints: number;
  totalJoyTokens: number;
  pendingWithdrawals: number;
  pendingTransactions: number;
  totalTransactionsToday: number;
  totalVolumeToday: number;
}

export interface CEPointsOperation {
  userId: string;
  walletId: string;
  amount: number;
  operation: 'ASSIGN' | 'DEDUCT';
  reason: string;
  metadata?: Record<string, any>;
}

export interface BulkCEPointsOperation {
  operations: CEPointsOperation[];
  reason: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedTransactions {
  transactions: WalletTransaction[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface PaginatedStakings {
  stakings: Staking[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  byType: Record<TransactionType, {
    count: number;
    volume: number;
  }>;
  byStatus: Record<TransactionStatus, number>;
}
