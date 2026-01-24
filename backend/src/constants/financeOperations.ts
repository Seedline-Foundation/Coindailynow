/**
 * Finance Operations Registry - All 90+ Transaction Operations
 * 
 * This file contains all finance operation constants that define
 * the types of financial transactions supported by the platform.
 */

// ============================================================================
// DEPOSIT OPERATIONS (4 Types)
// ============================================================================

export const DEPOSIT_OPERATIONS = {
  DEPOSIT_EXTERNAL: 'deposit_external',                 // Deposit from external wallet (blockchain)
  DEPOSIT_MOBILE_MONEY: 'deposit_mobile_money',         // M-Pesa, Orange Money, MTN Money
  DEPOSIT_CARD: 'deposit_card',                         // Credit/debit card via Stripe/PayPal
  DEPOSIT_BANK_TRANSFER: 'deposit_bank_transfer',       // Bank transfer deposits
} as const;

// ============================================================================
// WITHDRAWAL OPERATIONS (3 Types)
// ============================================================================

export const WITHDRAWAL_OPERATIONS = {
  WITHDRAWAL_EXTERNAL: 'withdrawal_external',           // Withdraw to external wallet
  WITHDRAWAL_MOBILE_MONEY: 'withdrawal_mobile_money',   // Withdraw to mobile money
  WITHDRAWAL_BANK: 'withdrawal_bank',                   // Withdraw to bank account
} as const;

// ============================================================================
// INTERNAL TRANSFER OPERATIONS (6 Types)
// ============================================================================

export const TRANSFER_OPERATIONS = {
  TRANSFER_USER_TO_USER: 'transfer_user_to_user',       // User sends to another user
  TRANSFER_ADMIN_TO_USER: 'transfer_admin_to_user',     // Admin sends to user
  TRANSFER_SUPER_ADMIN_TO_USER: 'transfer_super_admin_to_user', // Super admin bonus/refund
  TRANSFER_WE_TO_USER: 'transfer_we_to_user',           // Platform pays user (earnings)
  TRANSFER_USER_TO_WE: 'transfer_user_to_we',           // User pays platform (subscriptions)
  TRANSFER_ADMIN_TO_ADMIN: 'transfer_admin_to_admin',   // Inter-admin transfers
} as const;

// ============================================================================
// PAYMENT OPERATIONS (5 Types)
// ============================================================================

export const PAYMENT_OPERATIONS = {
  PAYMENT_SUBSCRIPTION: 'payment_subscription',         // Subscription payments
  PAYMENT_PRODUCT: 'payment_product',                   // Digital product purchases
  PAYMENT_SERVICE: 'payment_service',                   // Service bookings
  PAYMENT_PREMIUM_CONTENT: 'payment_premium_content',   // Pay-per-article
  PAYMENT_BOOST_CAMPAIGN: 'payment_boost_campaign',     // Post promotion payments
} as const;

// ============================================================================
// REFUND OPERATIONS (4 Types)
// ============================================================================

export const REFUND_OPERATIONS = {
  REFUND_FULL: 'refund_full',                           // Full refund
  REFUND_PARTIAL: 'refund_partial',                     // Partial refund
  REFUND_SUBSCRIPTION: 'refund_subscription',           // Subscription refund
  REFUND_CHARGEBACK: 'refund_chargeback',               // Dispute/chargeback handling
} as const;

// ============================================================================
// STAKING OPERATIONS (3 Types)
// ============================================================================

export const STAKING_OPERATIONS = {
  STAKE_LOCK: 'stake_lock',                             // Lock tokens for staking
  STAKE_UNLOCK: 'stake_unlock',                         // Unlock staked tokens
  STAKE_CLAIM_REWARDS: 'stake_claim_rewards',           // Claim staking rewards
} as const;

// ============================================================================
// CONVERSION OPERATIONS (3 Types)
// ============================================================================

export const CONVERSION_OPERATIONS = {
  CONVERT_CE_TO_JOY: 'convert_ce_to_joy',               // CE Points to JOY Token (one-way)
  CONVERT_JOY_TO_FIAT: 'convert_joy_to_fiat',           // JOY Token to Fiat currency (swap)
  CONVERT_JOY_TO_CRYPTO: 'convert_joy_to_crypto',       // JOY Token to other crypto (via ChangeNOW)
} as const;

// ============================================================================
// AIRDROP OPERATIONS (3 Types)
// ============================================================================

export const AIRDROP_OPERATIONS = {
  AIRDROP_CREATE: 'airdrop_create',                     // Create airdrop campaign
  AIRDROP_CLAIM: 'airdrop_claim',                       // Users claim airdrop
  AIRDROP_DISTRIBUTE: 'airdrop_distribute',             // Batch airdrop distribution
} as const;

// ============================================================================
// ESCROW OPERATIONS (3 Types)
// ============================================================================

export const ESCROW_OPERATIONS = {
  ESCROW_CREATE: 'escrow_create',                       // Create escrow transaction
  ESCROW_RELEASE: 'escrow_release',                     // Release escrow funds
  ESCROW_DISPUTE: 'escrow_dispute',                     // Handle escrow disputes
} as const;

// ============================================================================
// GIFT & DONATION OPERATIONS (3 Types)
// ============================================================================

export const GIFT_OPERATIONS = {
  GIFT_SEND: 'gift_send',                               // Send gift to another user
  TIP_SEND: 'tip_send',                                 // Tip content creator
  DONATION_SEND: 'donation_send',                       // Donate to creator/charity
} as const;

// ============================================================================
// FEE & COMMISSION OPERATIONS (5 Types)
// ============================================================================

export const FEE_OPERATIONS = {
  FEE_TRANSACTION: 'fee_transaction',                   // Transaction fees
  FEE_WITHDRAWAL: 'fee_withdrawal',                     // Withdrawal fees
  FEE_SUBSCRIPTION: 'fee_subscription',                 // Subscription processing fees
  FEE_GAS: 'fee_gas',                                   // Blockchain gas fees
  FEE_CALCULATE: 'fee_calculate',                       // Dynamic fee calculation
  COMMISSION_REFERRAL: 'commission_referral',           // Referral commissions
  COMMISSION_AFFILIATE: 'commission_affiliate',         // Affiliate commissions
} as const;

// ============================================================================
// REVENUE OPERATIONS (9 Types - To "We" Wallet)
// ============================================================================

export const REVENUE_OPERATIONS = {
  REVENUE_SUBSCRIPTION: 'revenue_subscription',         // Subscription revenue
  REVENUE_TRANSACTION_FEES: 'revenue_transaction_fees', // Platform fees
  REVENUE_ADVERTISING: 'revenue_advertising',           // Ad revenue
  REVENUE_ADS: 'revenue_ads',                           // Ad revenue (alias)
  REVENUE_ECOMMERCE: 'revenue_ecommerce',               // Product sales
  REVENUE_SERVICES: 'revenue_services',                 // Service bookings
  REVENUE_PREMIUM_CONTENT: 'revenue_premium_content',   // Premium article sales
  REVENUE_BOOST: 'revenue_boost',                       // Boost campaign revenue
  REVENUE_AFFILIATE: 'revenue_affiliate',               // Affiliate commissions
  REVENUE_PARTNERSHIPS: 'revenue_partnerships',         // Partner revenue
} as const;

// ============================================================================
// EXPENSE OPERATIONS (7 Types - From "We" Wallet)
// ============================================================================

export const EXPENSE_OPERATIONS = {
  EXPENSE_CREATOR_PAYMENT: 'expense_creator_payment',   // Pay content creators
  EXPENSE_REFERRAL_PAYOUT: 'expense_referral_payout',   // Referral rewards
  EXPENSE_OPERATIONAL: 'expense_operational',           // Operational costs
  EXPENSE_MARKETING: 'expense_marketing',               // Marketing expenses
  EXPENSE_DEVELOPMENT: 'expense_development',           // Development costs
  EXPENSE_SUPPORT: 'expense_support',                   // Customer support costs
  EXPENSE_COMPLIANCE: 'expense_compliance',             // Legal/compliance costs
} as const;

// ============================================================================
// AUDIT & REPORTING OPERATIONS (6 Types)
// ============================================================================

export const AUDIT_OPERATIONS = {
  AUDIT_WALLET: 'audit_wallet',                         // Wallet audit
  AUDIT_USER_FINANCIAL: 'audit_user_financial',         // User financial audit
  REPORT_TRANSACTION: 'report_transaction',             // Transaction reports
  REPORT_REVENUE: 'report_revenue',                     // Revenue reports
  REPORT_PAYOUTS: 'report_payouts',                     // Payout reports
  REPORT_RECONCILIATION: 'report_reconciliation',       // Financial reconciliation
} as const;

// ============================================================================
// SECURITY & FRAUD PREVENTION OPERATIONS (7 Types)
// ============================================================================

export const SECURITY_OPERATIONS = {
  SECURITY_OTP_VERIFY: 'security_otp_verify',           // OTP verification
  SECURITY_2FA: 'security_2fa',                         // Two-factor authentication
  SECURITY_WALLET_FREEZE: 'security_wallet_freeze',     // Freeze suspicious wallets
  SECURITY_WHITELIST_ADD: 'security_whitelist_add',     // Add wallet to whitelist
  SECURITY_WHITELIST_REMOVE: 'security_whitelist_remove', // Remove from whitelist
  SECURITY_FRAUD_DETECTION: 'security_fraud_detection', // Automated fraud detection
  SECURITY_TRANSACTION_LIMIT: 'security_transaction_limit', // Enforce transaction limits
} as const;

// ============================================================================
// TAX & COMPLIANCE OPERATIONS (4 Types)
// ============================================================================

export const TAX_OPERATIONS = {
  TAX_CALCULATION: 'tax_calculation',                   // Calculate applicable taxes
  TAX_REPORT_GENERATE: 'tax_report_generate',           // Generate tax reports
  COMPLIANCE_KYC: 'compliance_kyc',                     // KYC verification
  COMPLIANCE_AML: 'compliance_aml',                     // AML checks
} as const;

// ============================================================================
// SUBSCRIPTION-SPECIFIC OPERATIONS (5 Types)
// ============================================================================

export const SUBSCRIPTION_OPERATIONS = {
  SUBSCRIPTION_AUTO_RENEW: 'subscription_auto_renew',   // Auto-renewal processing
  SUBSCRIPTION_UPGRADE: 'subscription_upgrade',         // Upgrade subscription tier
  SUBSCRIPTION_DOWNGRADE: 'subscription_downgrade',     // Downgrade subscription
  SUBSCRIPTION_PAUSE: 'subscription_pause',             // Pause subscription
  SUBSCRIPTION_CANCEL: 'subscription_cancel',           // Cancel subscription
} as const;

// ============================================================================
// WALLET MANAGEMENT OPERATIONS (5 Types)
// ============================================================================

export const WALLET_OPERATIONS = {
  WALLET_CREATE: 'wallet_create',                       // Create user wallet
  WALLET_VIEW_BALANCE: 'wallet_view_balance',           // View wallet balance
  WALLET_VIEW_HISTORY: 'wallet_view_history',           // View transaction history
  WALLET_SET_LIMITS: 'wallet_set_limits',               // Set wallet limits
  WALLET_RECOVERY: 'wallet_recovery',                   // Wallet recovery
} as const;

// ============================================================================
// PAYMENT GATEWAY OPERATIONS (5 Types)
// ============================================================================

export const GATEWAY_OPERATIONS = {
  GATEWAY_STRIPE: 'gateway_stripe',                     // Stripe payment processing
  GATEWAY_PAYPAL: 'gateway_paypal',                     // PayPal integration
  GATEWAY_MOBILE_MONEY: 'gateway_mobile_money',         // Mobile money integration
  GATEWAY_CRYPTO: 'gateway_crypto',                     // Cryptocurrency payments
  GATEWAY_BANK_TRANSFER: 'gateway_bank_transfer',       // Direct bank integration
} as const;

// ============================================================================
// ADVANCED OPERATIONS (5 Types)
// ============================================================================

export const ADVANCED_OPERATIONS = {
  BULK_TRANSFER: 'bulk_transfer',                       // Batch/bulk transfers
  SCHEDULED_PAYMENT: 'scheduled_payment',               // Schedule future payments
  RECURRING_PAYMENT: 'recurring_payment',               // Recurring payment management
  PAYMENT_LINK: 'payment_link',                         // Generate payment links
  INVOICE_GENERATION: 'invoice_generation',             // Create invoices
} as const;

// ============================================================================
// ALL FINANCE OPERATIONS REGISTRY
// ============================================================================

export const ALL_FINANCE_OPERATIONS = {
  ...DEPOSIT_OPERATIONS,
  ...WITHDRAWAL_OPERATIONS,
  ...TRANSFER_OPERATIONS,
  ...PAYMENT_OPERATIONS,
  ...REFUND_OPERATIONS,
  ...STAKING_OPERATIONS,
  ...CONVERSION_OPERATIONS,
  ...AIRDROP_OPERATIONS,
  ...ESCROW_OPERATIONS,
  ...GIFT_OPERATIONS,
  ...FEE_OPERATIONS,
  ...REVENUE_OPERATIONS,
  ...EXPENSE_OPERATIONS,
  ...AUDIT_OPERATIONS,
  ...SECURITY_OPERATIONS,
  ...TAX_OPERATIONS,
  ...SUBSCRIPTION_OPERATIONS,
  ...WALLET_OPERATIONS,
  ...GATEWAY_OPERATIONS,
  ...ADVANCED_OPERATIONS,
} as const;

// ============================================================================
// OPERATION CATEGORIES
// ============================================================================

export const OPERATION_CATEGORIES = {
  DEPOSITS: Object.values(DEPOSIT_OPERATIONS),
  WITHDRAWALS: Object.values(WITHDRAWAL_OPERATIONS),
  TRANSFERS: Object.values(TRANSFER_OPERATIONS),
  PAYMENTS: Object.values(PAYMENT_OPERATIONS),
  REFUNDS: Object.values(REFUND_OPERATIONS),
  STAKING: Object.values(STAKING_OPERATIONS),
  CONVERSIONS: Object.values(CONVERSION_OPERATIONS),
  AIRDROPS: Object.values(AIRDROP_OPERATIONS),
  ESCROW: Object.values(ESCROW_OPERATIONS),
  GIFTS: Object.values(GIFT_OPERATIONS),
  FEES: Object.values(FEE_OPERATIONS),
  REVENUE: Object.values(REVENUE_OPERATIONS),
  EXPENSES: Object.values(EXPENSE_OPERATIONS),
  AUDITING: Object.values(AUDIT_OPERATIONS),
  SECURITY: Object.values(SECURITY_OPERATIONS),
  TAX: Object.values(TAX_OPERATIONS),
  SUBSCRIPTIONS: Object.values(SUBSCRIPTION_OPERATIONS),
  WALLET_MANAGEMENT: Object.values(WALLET_OPERATIONS),
  GATEWAYS: Object.values(GATEWAY_OPERATIONS),
  ADVANCED: Object.values(ADVANCED_OPERATIONS),
} as const;

// ============================================================================
// OPERATIONS REQUIRING SUPER ADMIN APPROVAL
// ============================================================================

export const REQUIRES_SUPER_ADMIN_APPROVAL = [
  ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER,
  ALL_FINANCE_OPERATIONS.EXPENSE_CREATOR_PAYMENT,
  ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL, // for amounts > $1000
  ALL_FINANCE_OPERATIONS.REFUND_FULL,
  ALL_FINANCE_OPERATIONS.AIRDROP_CREATE,
  ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
] as const;

// ============================================================================
// OPERATIONS REQUIRING OTP VERIFICATION
// ============================================================================

export const REQUIRES_OTP = [
  ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL,
  ALL_FINANCE_OPERATIONS.WITHDRAWAL_MOBILE_MONEY,
  ALL_FINANCE_OPERATIONS.WITHDRAWAL_BANK,
  ALL_FINANCE_OPERATIONS.TRANSFER_USER_TO_USER, // for amounts > threshold
  ALL_FINANCE_OPERATIONS.SECURITY_WHITELIST_ADD,
] as const;

// ============================================================================
// HIGH-RISK OPERATIONS (Extra logging and monitoring)
// ============================================================================

export const HIGH_RISK_OPERATIONS = [
  ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER,
  ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL,
  ALL_FINANCE_OPERATIONS.REFUND_FULL,
  ALL_FINANCE_OPERATIONS.SECURITY_WALLET_FREEZE,
  ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
  ALL_FINANCE_OPERATIONS.AIRDROP_DISTRIBUTE,
] as const;

// ============================================================================
// OPERATION METADATA
// ============================================================================

export interface OperationMetadata {
  key: string;
  displayName: string;
  description: string;
  category: string;
  requiresApproval: boolean;
  requiresOTP: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedProcessingTime: string;
}

export const OPERATION_METADATA: Record<string, OperationMetadata> = {
  [ALL_FINANCE_OPERATIONS.DEPOSIT_EXTERNAL]: {
    key: ALL_FINANCE_OPERATIONS.DEPOSIT_EXTERNAL,
    displayName: 'External Wallet Deposit',
    description: 'Deposit from external blockchain wallet',
    category: 'DEPOSITS',
    requiresApproval: false,
    requiresOTP: false,
    riskLevel: 'LOW',
    estimatedProcessingTime: '3-6 blockchain confirmations',
  },
  [ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL]: {
    key: ALL_FINANCE_OPERATIONS.WITHDRAWAL_EXTERNAL,
    displayName: 'External Wallet Withdrawal',
    description: 'Withdraw to external blockchain wallet',
    category: 'WITHDRAWALS',
    requiresApproval: true, // for amounts > $1000
    requiresOTP: true,
    riskLevel: 'HIGH',
    estimatedProcessingTime: 'Instant to 1 hour',
  },
  [ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER]: {
    key: ALL_FINANCE_OPERATIONS.TRANSFER_WE_TO_USER,
    displayName: 'Platform to User Transfer',
    description: 'Transfer from We Wallet to user (earnings, rewards)',
    category: 'TRANSFERS',
    requiresApproval: true,
    requiresOTP: false,
    riskLevel: 'CRITICAL',
    estimatedProcessingTime: 'Instant',
  },
  // Add more metadata as needed...
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all operations in a category
 */
export function getOperationsByCategory(category: keyof typeof OPERATION_CATEGORIES): string[] {
  return OPERATION_CATEGORIES[category];
}

/**
 * Check if operation requires super admin approval
 */
export function requiresApproval(operation: string): boolean {
  return REQUIRES_SUPER_ADMIN_APPROVAL.includes(operation as any);
}

/**
 * Check if operation requires OTP
 */
export function requiresOTP(operation: string): boolean {
  return REQUIRES_OTP.includes(operation as any);
}

/**
 * Check if operation is high risk
 */
export function isHighRisk(operation: string): boolean {
  return HIGH_RISK_OPERATIONS.includes(operation as any);
}

/**
 * Get operation display name
 */
export function getOperationDisplayName(operation: string): string {
  return OPERATION_METADATA[operation]?.displayName || operation;
}

/**
 * Get all operations as array
 */
export function getAllOperations(): string[] {
  return Object.values(ALL_FINANCE_OPERATIONS);
}

/**
 * Get operation count
 */
export function getOperationCount(): number {
  return Object.keys(ALL_FINANCE_OPERATIONS).length;
}

// Export count for verification
console.log(`✅ Total Finance Operations Registered: ${getOperationCount()}`);
