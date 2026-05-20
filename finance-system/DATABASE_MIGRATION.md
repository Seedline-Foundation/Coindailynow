# CFIS Database Migration Plan

> **Ticket**: N11 — CFIS → Supabase DB alignment  
> **Status**: Planning  
> **Last updated**: 2026-05-18

---

## 1. Current State

The CoinDaily platform runs a **split database architecture**:

| Component | Database Host | Connection | Notes |
|-----------|--------------|------------|-------|
| CFIS (Finance System) | **Supabase** (managed, `aws-1-eu-central-2.pooler.supabase.com:6543`) | `DATABASE_URL` with PgBouncer pooling, SSL required | Dedicated `postgres` database via Supabase project |
| Backend / API | **Contabo VPS** (self-hosted PostgreSQL, `localhost:5432`) | `DATABASE_URL` pointing to `coindaily` database | Self-hosted on Contabo VPS |
| Frontend / Apps | N/A (reads via Backend API) | — | No direct DB access |
| TimescaleDB (market data) | **Contabo VPS** (extension on self-hosted Postgres) | Same host as Backend | OHLC, ticks, time-series |

### Why this is a problem

- **Two separate Postgres hosts** increase operational complexity and cost.
- Cross-system queries (e.g., correlating user wallets in CFIS with user accounts in Backend) require API calls instead of JOINs.
- Backups, monitoring, and failover must be managed for two independent systems.
- The `.env.example` already notes this as **GAP-3-3**: *"use ONE host in production (Supabase OR Contabo Postgres, not both)"*.

### CFIS Database Connection Logic

`finance-system/src/database/connection.ts` uses a singleton `Database` class:

1. If `DATABASE_URL` is set → uses it as a connection string; enables SSL if the URL contains `supabase`.
2. If `DATABASE_URL` is not set → falls back to individual params: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`.
3. Pool settings: max 10 connections, 30 s idle timeout, 10 s connection timeout.

---

## 2. Migration Plan: CFIS → Self-Hosted Contabo Postgres

### Phase 1: Preparation

1. **Create the `cfis_db` database** on the Contabo Postgres instance:
   ```sql
   CREATE DATABASE cfis_db OWNER coindaily;
   \c cfis_db
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```
2. **Run the schema** from `finance-system/database/schema.sql` against the new database.
3. **Create a dedicated DB user** for CFIS:
   ```sql
   CREATE ROLE cfis WITH LOGIN PASSWORD '<strong-password>';
   GRANT ALL PRIVILEGES ON DATABASE cfis_db TO cfis;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cfis;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cfis;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cfis;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cfis;
   ```

### Phase 2: Data Migration

1. **Export from Supabase** using `pg_dump`:
   ```bash
   pg_dump "postgresql://postgres.PROJECT:PASSWORD@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?sslmode=require" \
     --no-owner --no-acl --data-only \
     -t accounts -t journal_entries -t journal_lines \
     -t wallets -t transactions -t ai_verifications \
     -t press_escrows -t staff_payroll -t payroll_schedule \
     -t partnerships -t airdrop_campaigns -t airdrop_distributions \
     -t bonus_payments -t notifications -t audit_log -t system_config \
     > cfis_data_export.sql
   ```
2. **Import into Contabo**:
   ```bash
   psql "postgresql://cfis:PASSWORD@localhost:5432/cfis_db" < cfis_data_export.sql
   ```
3. **Verify row counts** match between source and destination for every table.

### Phase 3: Switchover

1. Put CFIS into **maintenance mode** (stop the service).
2. Run a final incremental export/import for any rows created since Phase 2.
3. Update environment variables (see Section 4 below).
4. Restart CFIS and verify connectivity via the `/health` endpoint.
5. Run smoke tests: login, view dashboard, check a transaction.

### Phase 4: Cleanup

1. Remove legacy Supabase env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.) from the root `.env`.
2. Remove Supabase-specific SSL detection in `connection.ts` (the `connectionString.includes('supabase')` check).
3. Cancel the Supabase project after a 30-day observation period.

---

## 3. Backup Procedures

### Supabase (current CFIS database)

- **Automatic backups**: Supabase Pro plan includes daily backups with 7-day retention.
- **Manual backup**:
  ```bash
  pg_dump "postgresql://postgres.PROJECT:PASSWORD@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?sslmode=require" \
    --format=custom --compress=9 \
    -f cfis_supabase_backup_$(date +%Y%m%d).dump
  ```
- **Restore**:
  ```bash
  pg_restore --no-owner --no-acl -d "postgresql://..." cfis_supabase_backup_YYYYMMDD.dump
  ```

### Contabo Self-Hosted Postgres (target / rest of stack)

- **Automated daily backup** (set up via cron):
  ```bash
  # /etc/cron.d/pg-backup
  0 2 * * * postgres pg_dump -Fc --compress=9 coindaily > /backups/coindaily_$(date +\%Y\%m\%d).dump
  0 3 * * * postgres pg_dump -Fc --compress=9 cfis_db   > /backups/cfis_db_$(date +\%Y\%m\%d).dump
  ```
- **Retention**: Keep 30 daily + 12 monthly backups; sync to off-site storage (Backblaze B2).
- **Restore**:
  ```bash
  pg_restore --no-owner --clean -d cfis_db /backups/cfis_db_YYYYMMDD.dump
  ```

---

## 4. Environment Variables That Need to Change

### `finance-system/.env`

| Variable | Before (Supabase) | After (Contabo) |
|----------|-------------------|-----------------|
| `DATABASE_URL` | `postgresql://postgres.PROJECT:PASSWORD@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true` | `postgresql://cfis:PASSWORD@127.0.0.1:5432/cfis_db?sslmode=disable` |
| `DIRECT_URL` | `postgresql://postgres.PROJECT:PASSWORD@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?sslmode=require` | `postgresql://cfis:PASSWORD@127.0.0.1:5432/cfis_db?sslmode=disable` |
| `DB_HOST` | `aws-1-eu-central-2.pooler.supabase.com` | `127.0.0.1` (or Contabo VPS IP) |
| `DB_PORT` | `6543` | `5432` |
| `DB_USER` | `postgres.PROJECT` | `cfis` |
| `DB_PASSWORD` | Supabase password | New strong password |
| `DB_NAME` | `postgres` | `cfis_db` |
| `DB_SSL` | `true` | `false` (local) or `true` (remote with certs) |

### Root `.env` (cleanup after migration)

Remove or comment out:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`

---

## 5. Tables to Migrate

All tables live in the CFIS Supabase database and must be migrated to `cfis_db` on Contabo:

| # | Table | Description | Approx. Rows |
|---|-------|-------------|--------------|
| 1 | `accounts` | Chart of Accounts (double-entry) | ~50 |
| 2 | `journal_entries` | Ledger journal entries | Growing |
| 3 | `journal_lines` | Debit/credit lines per journal entry | Growing |
| 4 | `wallets` | CFIS-managed wallets for all entities | Growing |
| 5 | `transactions` | Every money movement | Growing |
| 6 | `ai_verifications` | AI verification records (ARIA) | Growing |
| 7 | `press_escrows` | Press release escrow payments | Growing |
| 8 | `staff_payroll` | Staff payroll records | Growing |
| 9 | `payroll_schedule` | Recurring payroll schedules | ~10-50 |
| 10 | `partnerships` | Partnership payment records | Growing |
| 11 | `airdrop_campaigns` | Airdrop campaign metadata | Growing |
| 12 | `airdrop_distributions` | Individual airdrop distributions | Growing |
| 13 | `bonus_payments` | Ad-hoc bonus payments | Growing |
| 14 | `notifications` | CFIS → Super Admin notifications | Growing |
| 15 | `audit_log` | Immutable audit trail | Growing |
| 16 | `system_config` | System configuration key-value store | ~10 |

### Custom types to recreate

These `CREATE TYPE` statements in `schema.sql` must be run before table creation:
- `tx_status`
- `tx_type`
- `verification_result`
- `escrow_status`
- `payroll_status`
- `partnership_status`
- `airdrop_status`
- `notification_priority`

### Extensions required on Contabo

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 6. Rollback Plan

If the migration fails or CFIS encounters issues on the Contabo database:

1. Stop CFIS.
2. Revert `finance-system/.env` to Supabase connection string.
3. Restart CFIS — Supabase data remains untouched.
4. Investigate the issue before attempting migration again.

The Supabase project should remain active for at least **30 days** after a successful migration as a safety net.
