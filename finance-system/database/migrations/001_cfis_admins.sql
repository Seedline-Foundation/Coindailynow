-- ============================================================
-- Migration 001: CFIS Admins table
-- Adds per-user credentials with bcrypt password hashing
-- and TOTP (time-based one-time password) support.
-- Replaces the single shared-password env-var auth.
-- ============================================================

CREATE TABLE IF NOT EXISTS cfis_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,          -- bcrypt hash (cost 12)
    totp_secret VARCHAR(64) NOT NULL,             -- Base32-encoded TOTP secret
    totp_enrolled BOOLEAN DEFAULT false,          -- true after first successful TOTP verification
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,                     -- NULL = not locked
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cfis_admins_email ON cfis_admins(email);

-- Track migrations
CREATE TABLE IF NOT EXISTS cfis_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cfis_migrations (name) VALUES ('001_cfis_admins')
ON CONFLICT (name) DO NOTHING;
