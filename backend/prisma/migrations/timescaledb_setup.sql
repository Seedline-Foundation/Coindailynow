-- TimescaleDB Migration
-- Converts price_ticks and fiat_stablecoin_pairs tables to hypertables
-- with continuous aggregates for fast OHLC queries.
--
-- Prerequisites:
--   1. Install TimescaleDB extension on the self-hosted Postgres:
--      CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
--   2. Run this AFTER Prisma migrations have created the base tables.
--
-- WARNING: This migration is NOT reversible via Prisma.
--          Keep a backup before running.
-- ─────────────────────────────────────────────────────────────────

-- Step 0: Enable TimescaleDB extension (safe guard)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
    CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
  ELSE
    RAISE EXCEPTION 'timescaledb extension not available. Use timescale/timescaledb image or install package first.';
  END IF;
END $$;

-- ─── Step 1: Convert price_ticks to a hypertable ────────────────
-- Drop the Prisma-generated primary key (hypertables need the time
-- column in any unique constraint)
DO $$
BEGIN
  IF to_regclass('public.price_ticks') IS NULL THEN
    RAISE NOTICE 'Skipping price_ticks hypertable setup because table is missing';
    RETURN;
  END IF;

  ALTER TABLE price_ticks DROP CONSTRAINT IF EXISTS price_ticks_pkey;

  PERFORM create_hypertable(
    'price_ticks',
    'timestamp',
    migrate_data        => true,
    if_not_exists       => true,
    chunk_time_interval => INTERVAL '1 day'
  );
END $$;

-- Add a plain serial surrogate if needed, but hypertable prefers
-- composite. We keep the existing unique constraint.
-- The unique constraint already includes timestamp, so it's compatible.

-- ─── Step 2: Convert fiat_stablecoin_pairs to hypertable ────────
DO $$
BEGIN
  IF to_regclass('public.fiat_stablecoin_pairs') IS NULL THEN
    RAISE NOTICE 'Skipping fiat_stablecoin_pairs hypertable setup because table is missing';
    RETURN;
  END IF;

  ALTER TABLE fiat_stablecoin_pairs DROP CONSTRAINT IF EXISTS fiat_stablecoin_pairs_pkey;

  PERFORM create_hypertable(
    'fiat_stablecoin_pairs',
    'snapshot',
    migrate_data        => true,
    if_not_exists       => true,
    chunk_time_interval => INTERVAL '1 day'
  );
END $$;

-- ─── Step 3: Retention policies ─────────────────────────────────
-- Keep 1-min ticks for 90 days, then auto-drop old chunks
DO $$
BEGIN
  IF to_regclass('public.price_ticks') IS NOT NULL THEN
    PERFORM add_retention_policy('price_ticks', INTERVAL '90 days', if_not_exists => true);
  END IF;
  IF to_regclass('public.fiat_stablecoin_pairs') IS NOT NULL THEN
    PERFORM add_retention_policy('fiat_stablecoin_pairs', INTERVAL '180 days', if_not_exists => true);
  END IF;
END $$;

-- ─── Step 4: Continuous aggregates — 1-hour OHLC rollups ────────
CREATE MATERIALIZED VIEW IF NOT EXISTS price_ticks_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS bucket,
  symbol,
  exchange,
  first(open,  timestamp) AS open,
  max(high)               AS high,
  min(low)                AS low,
  last(close, timestamp)  AS close,
  sum(volume)             AS volume
FROM price_ticks
WHERE "interval" = '1m'
GROUP BY bucket, symbol, exchange;

-- Refresh policy: materialise every 30 minutes, covering last 2 hours
SELECT add_continuous_aggregate_policy('price_ticks_1h',
  start_offset  => INTERVAL '2 hours',
  end_offset    => INTERVAL '30 minutes',
  schedule_interval => INTERVAL '30 minutes',
  if_not_exists => true
);

-- ─── Step 5: Continuous aggregate — 1-day OHLC rollups ──────────
CREATE MATERIALIZED VIEW IF NOT EXISTS price_ticks_1d
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS bucket,
  symbol,
  exchange,
  first(open,  timestamp) AS open,
  max(high)               AS high,
  min(low)                AS low,
  last(close, timestamp)  AS close,
  sum(volume)             AS volume
FROM price_ticks
WHERE "interval" = '1m'
GROUP BY bucket, symbol, exchange;

SELECT add_continuous_aggregate_policy('price_ticks_1d',
  start_offset    => INTERVAL '3 days',
  end_offset      => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists   => true
);

-- ─── Step 6: NGN Premium continuous aggregate ───────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS ngn_premium_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', snapshot) AS bucket,
  "fiatCurrency",
  stablecoin,
  exchange,
  avg("premiumPct")  AS avg_premium,
  max("premiumPct")  AS max_premium,
  min("premiumPct")  AS min_premium,
  avg("spreadPct")   AS avg_spread
FROM fiat_stablecoin_pairs
GROUP BY bucket, "fiatCurrency", stablecoin, exchange;

SELECT add_continuous_aggregate_policy('ngn_premium_1h',
  start_offset    => INTERVAL '2 hours',
  end_offset      => INTERVAL '30 minutes',
  schedule_interval => INTERVAL '30 minutes',
  if_not_exists   => true
);

-- ─── Step 7: Compression (optional — saves ~90% disk) ───────────
ALTER TABLE price_ticks SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol, exchange, interval',
  timescaledb.compress_orderby   = 'timestamp DESC'
);

DO $$
BEGIN
  IF to_regclass('public.price_ticks') IS NOT NULL THEN
    PERFORM add_compression_policy('price_ticks', INTERVAL '7 days', if_not_exists => true);
  END IF;
END $$;
