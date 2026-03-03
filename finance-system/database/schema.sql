-- ============================================================
-- CFIS Database Schema — PostgreSQL
-- CoinDaily Financial Intelligence System
-- ============================================================
-- This file defines the complete schema for the dedicated CFIS database.
-- It is SEPARATE from the main app database.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ACCOUNTS (Chart of Accounts — Double Entry Bookkeeping)
-- ============================================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,          -- e.g., '100001' for Cash
    name VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','CONTRA')),
    parent_code VARCHAR(10) REFERENCES accounts(code),
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. JOURNAL ENTRIES (Double-Entry Ledger)
-- ============================================================
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number SERIAL UNIQUE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT NOT NULL,
    reference_type VARCHAR(50),                -- 'PAYMENT','PAYROLL','PRESS','AIRDROP','PARTNERSHIP','BONUS','SUBSCRIPTION','ESCROW'
    reference_id UUID,                         -- Links to the source transaction
    created_by VARCHAR(100) NOT NULL,          -- 'SYSTEM','AI_AGENT','SUPER_ADMIN'
    status VARCHAR(20) DEFAULT 'POSTED' CHECK (status IN ('DRAFT','POSTED','REVERSED','VOID')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(10) NOT NULL REFERENCES accounts(code),
    debit NUMERIC(20,6) DEFAULT 0,
    credit NUMERIC(20,6) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    CHECK (debit >= 0 AND credit >= 0),
    CHECK (NOT (debit > 0 AND credit > 0))     -- Cannot have both
);

-- ============================================================
-- 3. WALLETS (CFIS-managed wallets for all entities)
-- ============================================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type VARCHAR(30) NOT NULL CHECK (owner_type IN ('USER','STAFF','PRESS_PUBLISHER','PRESS_INFLUENCER','PARTNER','PROJECT_OWNER','TREASURY','ESCROW','SYSTEM')),
    owner_id VARCHAR(200) NOT NULL,            -- user ID, staff ID, etc.
    wallet_address VARCHAR(100),               -- On-chain wallet address (0x...)
    balance_points NUMERIC(20,6) DEFAULT 0,
    balance_jy NUMERIC(20,6) DEFAULT 0,
    balance_usd NUMERIC(20,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_type, owner_id)
);

-- ============================================================
-- 4. TRANSACTIONS (Every money movement)
-- ============================================================
CREATE TYPE tx_status AS ENUM ('PENDING','AI_REVIEW','APPROVED','PROCESSING','COMPLETED','FAILED','REJECTED','REVERSED');
CREATE TYPE tx_type AS ENUM (
    'POINT_EARN','POINT_REDEEM','POINT_TO_TOKEN',
    'TOKEN_TRANSFER','TOKEN_WITHDRAWAL','TOKEN_DEPOSIT',
    'FIAT_PAYMENT','FIAT_WITHDRAWAL',
    'STAFF_PAYROLL','STAFF_BONUS',
    'PRESS_ESCROW_IN','PRESS_ESCROW_RELEASE','PRESS_ESCROW_REFUND',
    'AIRDROP_FUND','AIRDROP_DISTRIBUTE',
    'PARTNERSHIP_PAYMENT',
    'SUBSCRIPTION_PAYMENT','SUBSCRIPTION_REFUND',
    'BONUS_PAYMENT',
    'FEE','TAX'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_type tx_type NOT NULL,
    status tx_status DEFAULT 'PENDING',
    from_wallet_id UUID REFERENCES wallets(id),
    to_wallet_id UUID REFERENCES wallets(id),
    amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'JY', -- 'JY','USD','POINTS','ETH','USDT'
    fee NUMERIC(20,6) DEFAULT 0,
    tx_hash VARCHAR(200),                       -- On-chain hash if applicable
    description TEXT,
    ai_verification_id UUID,                    -- Link to AI verification record
    journal_entry_id UUID REFERENCES journal_entries(id),
    requested_by VARCHAR(200),                  -- User/system that initiated
    approved_by VARCHAR(200),                   -- AI agent or super admin
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 5. AI VERIFICATION RECORDS
-- ============================================================
CREATE TYPE verification_result AS ENUM ('PENDING','APPROVED','REJECTED','FLAGGED','MANUAL_REVIEW');

CREATE TABLE ai_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_type VARCHAR(50) NOT NULL,     -- 'WITHDRAWAL','PRESS_PLACEMENT','AIRDROP_FUNDING','PARTNERSHIP_DOC','ACTIVITY_CHECK'
    entity_type VARCHAR(50) NOT NULL,           -- 'USER','STAFF','PUBLISHER','INFLUENCER','PROJECT_OWNER','PARTNER'
    entity_id VARCHAR(200) NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    result verification_result DEFAULT 'PENDING',
    confidence_score NUMERIC(5,4),              -- 0.0000 to 1.0000
    reasoning TEXT,                             -- AI explanation
    evidence JSONB DEFAULT '{}',                -- Supporting data
    checks_performed JSONB DEFAULT '[]',        -- List of checks and results
    reviewer VARCHAR(100),                      -- 'ARIA_AGENT','SUPER_ADMIN'
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. PRESS ESCROW
-- ============================================================
CREATE TYPE escrow_status AS ENUM ('FUNDED','ACTIVE','VERIFICATION_PENDING','RELEASED','REFUNDED','DISPUTED','EXPIRED');

CREATE TABLE press_escrows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_wallet_id UUID NOT NULL REFERENCES wallets(id),   -- Who pays (publisher)
    recipient_wallet_id UUID NOT NULL REFERENCES wallets(id),   -- Who receives (site owner/influencer)
    amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'JY',
    press_order_id VARCHAR(200),                -- Link to the press order
    site_url TEXT,                               -- The site/asset where PR is placed
    status escrow_status DEFAULT 'FUNDED',
    funded_at TIMESTAMPTZ DEFAULT NOW(),
    placement_verified_at TIMESTAMPTZ,          -- AI verified placement
    views_verified_at TIMESTAMPTZ,              -- AI verified views
    release_after TIMESTAMPTZ,                  -- 24 hrs after funding
    released_at TIMESTAMPTZ,
    ai_verification_id UUID REFERENCES ai_verifications(id),
    transaction_in_id UUID REFERENCES transactions(id),     -- funding tx
    transaction_out_id UUID REFERENCES transactions(id),    -- release tx
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. STAFF PAYROLL
-- ============================================================
CREATE TYPE payroll_status AS ENUM ('SCHEDULED','PROCESSING','COMPLETED','FAILED','CANCELLED');

CREATE TABLE staff_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_wallet_id UUID NOT NULL REFERENCES wallets(id),
    staff_name VARCHAR(200) NOT NULL,
    staff_role VARCHAR(100),
    amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'JY',
    pay_date DATE NOT NULL,
    pay_period_start DATE,
    pay_period_end DATE,
    status payroll_status DEFAULT 'SCHEDULED',
    transaction_id UUID REFERENCES transactions(id),
    approved_by VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_wallet_id UUID NOT NULL REFERENCES wallets(id),
    staff_name VARCHAR(200) NOT NULL,
    monthly_amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'JY',
    pay_day_of_month INT NOT NULL CHECK (pay_day_of_month BETWEEN 1 AND 28),
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(200),                    -- Super admin who set this up
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. PARTNERSHIP PAYMENTS
-- ============================================================
CREATE TYPE partnership_status AS ENUM ('PENDING_DOCS','DOCS_SUBMITTED','DOCS_UNDER_REVIEW','DOCS_APPROVED','DOCS_REJECTED','PAYMENT_SCHEDULED','PAYMENT_COMPLETED','CANCELLED');

CREATE TABLE partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(300) NOT NULL,
    partner_wallet_id UUID REFERENCES wallets(id),
    contract_amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'JY',
    status partnership_status DEFAULT 'PENDING_DOCS',
    contract_doc_url TEXT,                      -- Uploaded signed contract
    contract_doc_hash VARCHAR(128),             -- SHA-512 hash of document
    contract_signed_date DATE,
    contract_parties JSONB DEFAULT '[]',        -- Both signers details
    ai_verification_id UUID REFERENCES ai_verifications(id),
    rejection_reason TEXT,
    transaction_id UUID REFERENCES transactions(id),
    created_by VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. AIRDROP CAMPAIGNS
-- ============================================================
CREATE TYPE airdrop_status AS ENUM ('CREATED','FUNDING_PENDING','FUNDING_VERIFIED','ACTIVE','DISTRIBUTING','COMPLETED','CANCELLED','FAILED');

CREATE TABLE airdrop_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(300) NOT NULL,
    project_owner_wallet_id UUID REFERENCES wallets(id),
    token_address VARCHAR(100),                 -- Which token is being airdropped
    total_fund_amount NUMERIC(20,6) NOT NULL,
    distributed_amount NUMERIC(20,6) DEFAULT 0,
    remaining_amount NUMERIC(20,6),
    status airdrop_status DEFAULT 'CREATED',
    funding_wallet_address VARCHAR(100),        -- Wallet CFIS monitors
    funding_verified_at TIMESTAMPTZ,
    ai_verification_id UUID REFERENCES ai_verifications(id),
    campaign_start DATE,
    campaign_end DATE,
    qualification_criteria JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE airdrop_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES airdrop_campaigns(id),
    recipient_wallet_id UUID REFERENCES wallets(id),
    recipient_address VARCHAR(100) NOT NULL,
    amount NUMERIC(20,6) NOT NULL,
    tx_hash VARCHAR(200),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','CONFIRMED','FAILED')),
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. BONUS PAYMENTS (Ad-hoc)
-- ============================================================
CREATE TABLE bonus_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'JY',
    reason TEXT NOT NULL,
    requested_by VARCHAR(200) NOT NULL,         -- Super admin
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','AI_REVIEW','APPROVED','PROCESSING','COMPLETED','REJECTED')),
    transaction_id UUID REFERENCES transactions(id),
    ai_verification_id UUID REFERENCES ai_verifications(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 11. NOTIFICATIONS (CFIS → Super Admin)
-- ============================================================
CREATE TYPE notification_priority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(200) NOT NULL DEFAULT 'SUPER_ADMIN',
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    priority notification_priority DEFAULT 'MEDIUM',
    category VARCHAR(50),                       -- 'PAYMENT','PAYROLL','PRESS','AIRDROP','PARTNERSHIP','SECURITY','AI_ALERT'
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    is_actioned BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- ============================================================
-- 12. AUDIT LOG (Immutable)
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(200) NOT NULL,                -- 'SYSTEM','AI_AGENT','SUPER_ADMIN:email'
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. SYSTEM CONFIGURATION
-- ============================================================
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by VARCHAR(200),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configs
INSERT INTO system_config (key, value, description) VALUES
('points_to_jy_rate', '{"rate": 0.001, "min_redemption": 10000}', '1 Point = 0.001 JY, min 10000 points'),
('payroll_settings', '{"auto_pay": true, "requires_ai_review": false}', 'Payroll automation settings'),
('press_escrow_settings', '{"release_delay_hours": 24, "min_views_required": 10, "ai_verification_required": true}', 'Press escrow release rules'),
('partnership_settings', '{"require_signed_contract": true, "require_ai_doc_review": true, "min_signatories": 2}', 'Partnership payment rules'),
('airdrop_settings', '{"require_funding_verification": true, "ai_monitor_interval_minutes": 30}', 'Airdrop monitoring settings'),
('withdrawal_settings', '{"require_ai_verification": true, "min_activity_score": 0.5, "daily_limit_jy": 50000}', 'Withdrawal rules'),
('treasury_wallet_id', '"TREASURY_WALLET_UUID_HERE"', 'CFIS treasury wallet ID');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(tx_type);
CREATE INDEX idx_transactions_from ON transactions(from_wallet_id);
CREATE INDEX idx_transactions_to ON transactions(to_wallet_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_wallets_owner ON wallets(owner_type, owner_id);
CREATE INDEX idx_journal_entries_ref ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_press_escrows_status ON press_escrows(status);
CREATE INDEX idx_staff_payroll_date ON staff_payroll(pay_date);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_airdrop_status ON airdrop_campaigns(status);
CREATE INDEX idx_partnerships_status ON partnerships(status);
