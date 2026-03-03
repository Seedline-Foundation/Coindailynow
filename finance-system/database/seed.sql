-- ═══════════════════════════════════════════════════════════════════
-- CFIS Database Seed — Default Data
-- Run AFTER schema.sql to populate chart of accounts and system config
-- ═══════════════════════════════════════════════════════════════════

-- ──── Chart of Accounts (Double-Entry Ledger) ────
INSERT INTO accounts (code, name, type, description) VALUES
  -- ASSET accounts (increase = DEBIT)
  ('1000', 'Treasury - JY Tokens',       'ASSET',     'Main CFIS JY token treasury'),
  ('1010', 'Treasury - USD',             'ASSET',     'Fiat USD holdings'),
  ('1020', 'Escrow - Press',             'ASSET',     'Funds held in press escrow'),
  ('1030', 'Escrow - Partnership',       'ASSET',     'Funds held for partnership payments'),
  ('1040', 'Accounts Receivable',        'ASSET',     'Money owed to CFIS'),
  ('1050', 'Airdrop - Campaign Funds',   'ASSET',     'Airdrop funds received from projects'),
  
  -- LIABILITY accounts (increase = CREDIT)
  ('2000', 'User Balances Payable',      'LIABILITY', 'Points and tokens owed to users'),
  ('2010', 'Staff Payroll Payable',      'LIABILITY', 'Payroll amounts due to staff'),
  ('2020', 'Partner Payables',           'LIABILITY', 'Amounts owed to partners'),
  ('2030', 'Escrow Obligations',         'LIABILITY', 'Outstanding escrow commitments'),
  
  -- REVENUE accounts (increase = CREDIT)
  ('4000', 'Subscription Revenue',       'REVENUE',   'Premium subscription income'),
  ('4010', 'Advertising Revenue',        'REVENUE',   'Ad placement income'),
  ('4020', 'Token Sale Revenue',         'REVENUE',   'JY token sales'),
  ('4030', 'Press Service Revenue',      'REVENUE',   'Press distribution fees'),
  ('4040', 'Platform Fees',             'REVENUE',   'Transaction and service fees'),
  ('4050', 'Partnership Revenue',        'REVENUE',   'Revenue from partnerships'),
  
  -- EXPENSE accounts (increase = DEBIT)
  ('5000', 'Staff Payroll',             'EXPENSE',   'Monthly staff salary payments'),
  ('5010', 'User Withdrawals',          'EXPENSE',   'Points/token redemptions paid to users'),
  ('5020', 'Press Payments',            'EXPENSE',   'Payments to press/PR sites'),
  ('5030', 'Partnership Payments',      'EXPENSE',   'Payments to partners'),
  ('5040', 'Bonus Payments',            'EXPENSE',   'Ad-hoc bonus disbursements'),
  ('5050', 'Airdrop Distributions',     'EXPENSE',   'Airdrop token distributions'),
  ('5060', 'Infrastructure',            'EXPENSE',   'Server, CDN, hosting costs'),
  ('5070', 'AI Services',               'EXPENSE',   'GPT-4, Gemini, DALL-E API costs'),
  
  -- EQUITY accounts (increase = CREDIT)
  ('3000', 'Retained Earnings',         'EQUITY',    'Accumulated net income'),
  ('3010', 'Owner Equity',              'EQUITY',    'Initial capital and investments')
ON CONFLICT (code) DO NOTHING;

-- ──── System Configuration Defaults ────
INSERT INTO system_config (key, value, description) VALUES
  ('ai_confidence_threshold',     '0.85',     'Minimum AI confidence score for auto-approval'),
  ('ai_flag_threshold',           '0.60',     'Below this score, transaction is rejected'),
  ('escrow_hold_hours',           '24',       'Minimum hours before escrow release'),
  ('min_withdrawal_jy',           '10',       'Minimum JY withdrawal amount'),
  ('max_daily_withdrawal_jy',     '50000',    'Maximum JY withdrawal per day per user'),
  ('points_per_jy',               '1000',     'Points required for 1 JY (1 pt = 0.001 JY)'),
  ('min_redemption_points',       '10000',    'Minimum points for redemption'),
  ('payroll_day_default',         '1',        'Default monthly payroll day'),
  ('max_bonus_amount',            '100000',   'Maximum single bonus payment JY'),
  ('treasury_wallet_owner_id',    'CFIS_TREASURY',  'Owner ID for the treasury wallet'),
  ('escrow_wallet_owner_id',      'CFIS_ESCROW',    'Owner ID for the escrow wallet'),
  ('super_admin_email',           'admin@coindaily.online', 'Super Admin email for auth'),
  ('notification_retention_days', '90',       'Days to keep old notifications'),
  ('audit_retention_days',        '365',      'Days to keep audit log entries'),
  ('jy_token_decimals',           '6',        'Joy Token decimals'),
  ('jy_max_supply',               '5000000',  'Joy Token max supply')
ON CONFLICT (key) DO NOTHING;

-- ──── Treasury & Escrow System Wallets ────
INSERT INTO wallets (id, owner_type, owner_id, wallet_address, balance_jy, balance_points, balance_usd, is_verified, is_active)
VALUES
  (gen_random_uuid(), 'TREASURY', 'CFIS_TREASURY', NULL, 5000000.000000, 0, 0, true, true),
  (gen_random_uuid(), 'ESCROW',   'CFIS_ESCROW',   NULL, 0,             0, 0, true, true)
ON CONFLICT DO NOTHING;

-- ──── Demo/Test Data (optional — remove in production) ────
-- Uncomment the block below to add sample data for testing

/*
-- Sample user wallet
INSERT INTO wallets (id, owner_type, owner_id, wallet_address, balance_jy, balance_points, balance_usd, is_verified)
VALUES 
  (gen_random_uuid(), 'USER', 'user-demo-001', '0xDEMO1234567890abcdef', 150.000000, 25000, 45.00, true),
  (gen_random_uuid(), 'STAFF', 'staff-editor-001', '0xSTAFF1234567890abcdef', 0, 0, 0, true),
  (gen_random_uuid(), 'PRESS', 'press-cmc-001', '0xPRESS1234567890abcdef', 0, 0, 0, true),
  (gen_random_uuid(), 'PARTNER', 'partner-binance-001', '0xPARTNER1234567890abcdef', 0, 0, 0, true);
*/

-- Verify seed
SELECT 'Accounts seeded:' AS info, COUNT(*) FROM accounts;
SELECT 'Config seeded:' AS info, COUNT(*) FROM system_config;
SELECT 'System wallets:' AS info, COUNT(*) FROM wallets WHERE owner_type IN ('TREASURY', 'ESCROW');
