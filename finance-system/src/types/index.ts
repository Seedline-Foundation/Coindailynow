// ============================================================
// CFIS Core Types
// ============================================================

export type TxStatus = 'PENDING' | 'AI_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'REVERSED';

export type TxType =
  | 'POINT_EARN' | 'POINT_REDEEM' | 'POINT_TO_TOKEN'
  | 'TOKEN_TRANSFER' | 'TOKEN_WITHDRAWAL' | 'TOKEN_DEPOSIT'
  | 'FIAT_PAYMENT' | 'FIAT_WITHDRAWAL'
  | 'STAFF_PAYROLL' | 'STAFF_BONUS'
  | 'PRESS_ESCROW_IN' | 'PRESS_ESCROW_RELEASE' | 'PRESS_ESCROW_REFUND'
  | 'AIRDROP_FUND' | 'AIRDROP_DISTRIBUTE'
  | 'PARTNERSHIP_PAYMENT'
  | 'SUBSCRIPTION_PAYMENT' | 'SUBSCRIPTION_REFUND'
  | 'BONUS_PAYMENT'
  | 'GAS_FEE_COLLECTION'
  | 'FEE' | 'TAX';

export type WalletOwnerType =
  | 'USER' | 'STAFF' | 'PRESS' | 'PRESS_PUBLISHER' | 'PRESS_INFLUENCER'
  | 'PARTNER' | 'PROJECT_OWNER' | 'TREASURY' | 'ESCROW' | 'SYSTEM';

export type VerificationResult = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'MANUAL_REVIEW';

export type EscrowStatus = 'FUNDED' | 'ACTIVE' | 'VERIFICATION_PENDING' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'EXPIRED';

export type PartnershipStatus =
  | 'PENDING_DOCS' | 'DOCS_SUBMITTED' | 'DOCS_UNDER_REVIEW' | 'DOCS_APPROVED'
  | 'DOCS_REJECTED' | 'PAYMENT_SCHEDULED' | 'PAYMENT_COMPLETED' | 'CANCELLED';

export type AirdropStatus = 'CREATED' | 'FUNDING_PENDING' | 'FUNDING_VERIFIED' | 'ACTIVE' | 'DISTRIBUTING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export type PayrollStatus = 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ============================================================
// Interfaces
// ============================================================

export interface Wallet {
  id: string;
  owner_type: WalletOwnerType;
  owner_id: string;
  wallet_address?: string;
  balance_points: number;
  balance_jy: number;
  balance_usd: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  tx_type: TxType;
  status: TxStatus;
  from_wallet_id?: string;
  to_wallet_id?: string;
  amount: number;
  currency: string;
  fee: number;
  tx_hash?: string;
  description?: string;
  ai_verification_id?: string;
  journal_entry_id?: string;
  requested_by?: string;
  approved_by?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface AIVerification {
  id: string;
  verification_type: string;
  entity_type: string;
  entity_id: string;
  transaction_id?: string;
  result: VerificationResult;
  confidence_score?: number;
  reasoning?: string;
  evidence: Record<string, any>;
  checks_performed: any[];
  reviewer?: string;
  reviewed_at?: Date;
  created_at: Date;
}

export interface PressEscrow {
  id: string;
  publisher_wallet_id: string;
  recipient_wallet_id: string;
  amount: number;
  currency: string;
  press_order_id?: string;
  site_url?: string;
  status: EscrowStatus;
  funded_at: Date;
  placement_verified_at?: Date;
  views_verified_at?: Date;
  release_after: Date;
  released_at?: Date;
  ai_verification_id?: string;
  transaction_in_id?: string;
  transaction_out_id?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface StaffPayroll {
  id: string;
  staff_wallet_id: string;
  staff_name: string;
  staff_role?: string;
  amount: number;
  currency: string;
  pay_date: string;
  pay_period_start?: string;
  pay_period_end?: string;
  status: PayrollStatus;
  transaction_id?: string;
  approved_by?: string;
  notes?: string;
}

export interface PayrollSchedule {
  id: string;
  staff_wallet_id: string;
  staff_name: string;
  monthly_amount: number;
  currency: string;
  pay_day_of_month: number;
  is_active: boolean;
  created_by?: string;
}

export interface Partnership {
  id: string;
  partner_name: string;
  partner_wallet_id?: string;
  contract_amount: number;
  currency: string;
  status: PartnershipStatus;
  contract_doc_url?: string;
  contract_doc_hash?: string;
  contract_signed_date?: string;
  contract_parties: any[];
  ai_verification_id?: string;
  rejection_reason?: string;
  transaction_id?: string;
  created_by?: string;
}

export interface AirdropCampaign {
  id: string;
  project_name: string;
  project_owner_wallet_id?: string;
  token_address?: string;
  total_fund_amount: number;
  distributed_amount: number;
  remaining_amount: number;
  status: AirdropStatus;
  funding_wallet_address?: string;
  funding_verified_at?: Date;
  ai_verification_id?: string;
  campaign_start?: string;
  campaign_end?: string;
  qualification_criteria: Record<string, any>;
  metadata: Record<string, any>;
}

export interface BonusPayment {
  id: string;
  recipient_wallet_id: string;
  amount: number;
  currency: string;
  reason: string;
  requested_by: string;
  status: string;
  transaction_id?: string;
  ai_verification_id?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface Notification {
  id: string;
  recipient: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category?: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  is_actioned: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  read_at?: Date;
}

export interface JournalEntry {
  id: string;
  entry_number: number;
  date: Date;
  description: string;
  reference_type?: string;
  reference_id?: string;
  created_by: string;
  status: string;
  metadata: Record<string, any>;
  lines?: JournalLine[];
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_code: string;
  debit: number;
  credit: number;
  currency: string;
  description?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalWallets: number;
  activeEscrows: number;
  pendingPayrolls: number;
  pendingPartnerships: number;
  activeAirdrops: number;
  pendingVerifications: number;
  recentTransactions: Transaction[];
  unreadNotifications: number;
}

export interface SuperAdminAuth {
  id: string;
  email: string;
  role: 'SUPER_ADMIN';
  token: string;
  expiresAt: Date;
}
