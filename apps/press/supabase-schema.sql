-- SENDPRESS Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- ===========================================
-- PRESS SITES (Partner websites)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42),
    owner_email VARCHAR(255),
    owner_name VARCHAR(255),
    site_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Status: pitched, pending, verified, suspended, rejected
    status VARCHAR(20) DEFAULT 'pitched' CHECK (status IN ('pitched', 'pending', 'verified', 'suspended', 'rejected')),
    
    -- Domain Height (DH) scoring
    dh_score DECIMAL(5,2) DEFAULT 0,
    dr_score INTEGER DEFAULT 0,  -- Ahrefs Domain Rating
    da_score INTEGER DEFAULT 0,  -- Moz Domain Authority
    ur_score INTEGER DEFAULT 0,  -- URL Rating
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    traffic_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Tier: reject, bronze, silver, gold, platinum
    tier VARCHAR(10) DEFAULT 'reject' CHECK (tier IN ('reject', 'bronze', 'silver', 'gold', 'platinum')),
    
    -- Security status: no_threat, moderate, high, very_high
    threat_level VARCHAR(20) DEFAULT 'no_threat' CHECK (threat_level IN ('no_threat', 'moderate', 'high', 'very_high')),
    
    -- Metadata
    pitch_sent_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    last_crawl_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_sites_domain ON press_sites(domain);
CREATE INDEX IF NOT EXISTS idx_press_sites_status ON press_sites(status);
CREATE INDEX IF NOT EXISTS idx_press_sites_tier ON press_sites(tier);
CREATE INDEX IF NOT EXISTS idx_press_sites_dh_score ON press_sites(dh_score DESC);

-- ===========================================
-- PRESS POSITIONS (Display slots on sites)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES press_sites(id) ON DELETE CASCADE,
    
    selector_or_slug VARCHAR(255) NOT NULL,
    display_type VARCHAR(10) DEFAULT 'card' CHECK (display_type IN ('card', 'full')),
    
    max_words INTEGER DEFAULT 500,
    media_types TEXT[] DEFAULT ARRAY['image'],
    price_joy DECIMAL(18,8),
    
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(site_id, selector_or_slug)
);

CREATE INDEX IF NOT EXISTS idx_press_positions_site ON press_positions(site_id);
CREATE INDEX IF NOT EXISTS idx_press_positions_available ON press_positions(available);

-- ===========================================
-- PRESS PUBLISHERS (Users who distribute PRs)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    wallet_address VARCHAR(42) NOT NULL,
    company_name VARCHAR(255),
    contact_email VARCHAR(255),
    
    joy_balance DECIMAL(18,8) DEFAULT 0,
    total_distributions INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_publishers_wallet ON press_publishers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_press_publishers_user ON press_publishers(user_id);

-- ===========================================
-- PRESS RELEASES (PR content)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID NOT NULL REFERENCES press_publishers(id),
    origin_site_id UUID REFERENCES press_sites(id),
    
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    url VARCHAR(2048),
    canonical_hash VARCHAR(64),
    
    word_count INTEGER DEFAULT 0,
    media_meta JSONB DEFAULT '{}',
    
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'distributed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_releases_publisher ON press_releases(publisher_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(status);

-- ===========================================
-- PRESS DISTRIBUTIONS (Distribution orders)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id UUID NOT NULL REFERENCES press_releases(id),
    publisher_id UUID NOT NULL REFERENCES press_publishers(id),
    
    target_sites UUID[] NOT NULL,
    target_tiers VARCHAR(10)[] DEFAULT ARRAY['silver'],
    
    credits_locked DECIMAL(18,8) DEFAULT 0,
    credits_released DECIMAL(18,8) DEFAULT 0,
    credits_refunded DECIMAL(18,8) DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'released', 'refunded', 'failed')),
    
    escrow_tx_hash VARCHAR(66),
    release_tx_hash VARCHAR(66),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_press_distributions_pr ON press_distributions(pr_id);
CREATE INDEX IF NOT EXISTS idx_press_distributions_publisher ON press_distributions(publisher_id);
CREATE INDEX IF NOT EXISTS idx_press_distributions_status ON press_distributions(status);

-- ===========================================
-- PRESS PARTNERSHIPS (Affiliate agreements)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_site_id UUID NOT NULL REFERENCES press_sites(id),
    partner_site_id UUID NOT NULL REFERENCES press_sites(id),
    
    agreement_type VARCHAR(20) DEFAULT 'paid' CHECK (agreement_type IN ('paid', 'affiliate', 'free')),
    
    quota_limit INTEGER,
    quota_used INTEGER DEFAULT 0,
    
    terms JSONB DEFAULT '{}',
    notification_endpoint VARCHAR(2048),
    onchain_ref VARCHAR(66),
    
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'terminated')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(origin_site_id, partner_site_id)
);

CREATE INDEX IF NOT EXISTS idx_press_partnerships_origin ON press_partnerships(origin_site_id);
CREATE INDEX IF NOT EXISTS idx_press_partnerships_partner ON press_partnerships(partner_site_id);
CREATE INDEX IF NOT EXISTS idx_press_partnerships_status ON press_partnerships(status);

-- ===========================================
-- PRESS DH METRICS (Domain Height scoring data)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_dh_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES press_sites(id) ON DELETE CASCADE,
    
    backlinks_count INTEGER DEFAULT 0,
    referring_domains INTEGER DEFAULT 0,
    backlink_quality_score DECIMAL(5,2) DEFAULT 0,
    traffic_estimate INTEGER DEFAULT 0,
    
    dr_score INTEGER DEFAULT 0,
    da_score INTEGER DEFAULT 0,
    ur_score INTEGER DEFAULT 0,
    relevance_coefficient DECIMAL(3,2) DEFAULT 1.0,
    traffic_validity DECIMAL(3,2) DEFAULT 1.0,
    
    dh_score DECIMAL(5,2) DEFAULT 0,
    tier VARCHAR(10) DEFAULT 'reject',
    
    data_source VARCHAR(50),
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_dh_metrics_site ON press_dh_metrics(site_id);
CREATE INDEX IF NOT EXISTS idx_press_dh_metrics_computed ON press_dh_metrics(computed_at DESC);

-- ===========================================
-- PRESS VERIFICATIONS (AI verification records)
-- ===========================================
CREATE TABLE IF NOT EXISTS press_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distribution_id UUID REFERENCES press_distributions(id),
    site_id UUID NOT NULL REFERENCES press_sites(id),
    
    verification_type VARCHAR(20) DEFAULT 'placement' CHECK (verification_type IN ('placement', 'site', 'security')),
    
    result VARCHAR(20) DEFAULT 'pending' CHECK (result IN ('pending', 'passed', 'failed', 'warning')),
    confidence DECIMAL(3,2),
    
    snapshot_url VARCHAR(2048),
    screenshot_url VARCHAR(2048),
    dom_hash VARCHAR(64),
    
    logs JSONB DEFAULT '{}',
    
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_verifications_distribution ON press_verifications(distribution_id);
CREATE INDEX IF NOT EXISTS idx_press_verifications_site ON press_verifications(site_id);
CREATE INDEX IF NOT EXISTS idx_press_verifications_result ON press_verifications(result);

-- ===========================================
-- PRESS ONCHAIN EVENTS
-- ===========================================
CREATE TABLE IF NOT EXISTS press_onchain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    distribution_id UUID REFERENCES press_distributions(id),
    
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('lock', 'release', 'refund', 'transfer')),
    
    amount DECIMAL(18,8) NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    
    block_number BIGINT,
    gas_used BIGINT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_onchain_tx ON press_onchain_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_press_onchain_distribution ON press_onchain_events(distribution_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION press_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'press_sites_updated_at') THEN
        CREATE TRIGGER press_sites_updated_at BEFORE UPDATE ON press_sites
            FOR EACH ROW EXECUTE FUNCTION press_update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'press_positions_updated_at') THEN
        CREATE TRIGGER press_positions_updated_at BEFORE UPDATE ON press_positions
            FOR EACH ROW EXECUTE FUNCTION press_update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'press_publishers_updated_at') THEN
        CREATE TRIGGER press_publishers_updated_at BEFORE UPDATE ON press_publishers
            FOR EACH ROW EXECUTE FUNCTION press_update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'press_releases_updated_at') THEN
        CREATE TRIGGER press_releases_updated_at BEFORE UPDATE ON press_releases
            FOR EACH ROW EXECUTE FUNCTION press_update_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'press_partnerships_updated_at') THEN
        CREATE TRIGGER press_partnerships_updated_at BEFORE UPDATE ON press_partnerships
            FOR EACH ROW EXECUTE FUNCTION press_update_updated_at();
    END IF;
END;
$$;

-- Function to calculate DH score and tier
CREATE OR REPLACE FUNCTION calculate_dh_score(
    p_dr INTEGER,
    p_da INTEGER,
    p_ur INTEGER,
    p_relevance DECIMAL,
    p_traffic DECIMAL
) RETURNS TABLE(dh_score DECIMAL, tier VARCHAR) AS $$
DECLARE
    baseline DECIMAL;
    final_dh DECIMAL;
    result_tier VARCHAR(10);
BEGIN
    -- DH = (B + A + P) × R × T where P = UR / 2
    baseline := p_dr + p_da + (p_ur / 2.0);
    final_dh := baseline * p_relevance * p_traffic;
    
    -- Normalize to 0-100 scale
    final_dh := LEAST(final_dh / 2.5, 100);
    
    -- Determine tier
    IF final_dh < 20 THEN
        result_tier := 'reject';
    ELSIF final_dh < 40 THEN
        result_tier := 'bronze';
    ELSIF final_dh < 60 THEN
        result_tier := 'silver';
    ELSIF final_dh < 80 THEN
        result_tier := 'gold';
    ELSE
        result_tier := 'platinum';
    END IF;
    
    RETURN QUERY SELECT final_dh, result_tier;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate DH score on site update
CREATE OR REPLACE FUNCTION press_update_site_dh_score()
RETURNS TRIGGER AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result FROM calculate_dh_score(
        NEW.dr_score,
        NEW.da_score,
        NEW.ur_score,
        NEW.relevance_score,
        NEW.traffic_score
    );
    
    NEW.dh_score := result.dh_score;
    NEW.tier := result.tier;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'press_sites_dh_update') THEN
        CREATE TRIGGER press_sites_dh_update
            BEFORE INSERT OR UPDATE OF dr_score, da_score, ur_score, relevance_score, traffic_score
            ON press_sites
            FOR EACH ROW EXECUTE FUNCTION press_update_site_dh_score();
    END IF;
END;
$$;
