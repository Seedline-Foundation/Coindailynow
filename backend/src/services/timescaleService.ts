/**
 * TimescaleDB Service — time-series queries for market data
 *
 * Uses raw SQL via Prisma.$queryRawUnsafe to leverage TimescaleDB
 * hypertable features (continuous aggregates, time_bucket) that
 * Prisma's query builder doesn't natively support.
 *
 * Architecture:
 *   price_ticks (hypertable)        → raw 1m OHLC data
 *   price_ticks_1h (cagg)           → pre-rolled 1h candles
 *   price_ticks_1d (cagg)           → pre-rolled 1d candles
 *   fiat_stablecoin_pairs (hyper)   → NGN/KES premium snapshots
 *   ngn_premium_1h (cagg)           → hourly premium averages
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface OHLCCandle {
  bucket: Date;
  symbol: string;
  exchange: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PremiumSnapshot {
  bucket: Date;
  fiatCurrency: string;
  stablecoin: string;
  exchange: string;
  avgPremium: number;
  maxPremium: number;
  minPremium: number;
  avgSpread: number;
}

type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const ALLOWED_INTERVALS: ReadonlySet<string> = new Set(['1m', '5m', '15m', '1h', '4h', '1d']);
const ALLOWED_SYMBOLS = /^[A-Z0-9\/]{3,20}$/;
const ALLOWED_EXCHANGES = /^[a-z0-9_]{2,30}$/;
const ALLOWED_CURRENCIES = /^[A-Z]{3,5}$/;

export class TimescaleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Query OHLC candles for a symbol/exchange pair.
   * Uses continuous aggregates for 1h/1d, raw hypertable for smaller intervals.
   */
  async getCandles(
    symbol: string,
    exchange: string,
    interval: Interval,
    from: Date,
    to: Date,
    limit = 500
  ): Promise<OHLCCandle[]> {
    if (!ALLOWED_INTERVALS.has(interval)) throw new Error('Invalid interval');
    if (!ALLOWED_SYMBOLS.test(symbol)) throw new Error('Invalid symbol');
    if (!ALLOWED_EXCHANGES.test(exchange)) throw new Error('Invalid exchange');

    // Use continuous aggregates for 1h and 1d
    if (interval === '1h') {
      return this.queryContinuousAggregate('price_ticks_1h', symbol, exchange, from, to, limit);
    }
    if (interval === '1d') {
      return this.queryContinuousAggregate('price_ticks_1d', symbol, exchange, from, to, limit);
    }

    // For raw intervals, query the hypertable directly with time_bucket
    const rows = await this.prisma.$queryRaw<OHLCCandle[]>`
      SELECT
        time_bucket(${interval}::interval, timestamp) AS bucket,
        symbol,
        exchange,
        first(open::float8,  timestamp) AS open,
        max(high::float8)               AS high,
        min(low::float8)                AS low,
        last(close::float8, timestamp)  AS close,
        sum(volume::float8)             AS volume
      FROM price_ticks
      WHERE symbol   = ${symbol}
        AND exchange  = ${exchange}
        AND interval  = '1m'
        AND timestamp >= ${from}
        AND timestamp <= ${to}
      GROUP BY bucket, symbol, exchange
      ORDER BY bucket DESC
      LIMIT ${limit}
    `;
    return rows;
  }

  private async queryContinuousAggregate(
    view: string,
    symbol: string,
    exchange: string,
    from: Date,
    to: Date,
    limit: number
  ): Promise<OHLCCandle[]> {
    // Safe: view name is hardcoded from the calling method, not user input
    const rows = await this.prisma.$queryRawUnsafe<OHLCCandle[]>(
      `SELECT bucket, symbol, exchange,
              open::float8  AS open,
              high::float8  AS high,
              low::float8   AS low,
              close::float8 AS close,
              volume::float8 AS volume
       FROM ${view}
       WHERE symbol   = $1
         AND exchange  = $2
         AND bucket   >= $3
         AND bucket   <= $4
       ORDER BY bucket DESC
       LIMIT $5`,
      symbol,
      exchange,
      from,
      to,
      limit
    );
    return rows;
  }

  /**
   * Query NGN (or any fiat) premium history.
   */
  async getPremiumHistory(
    fiatCurrency: string,
    stablecoin: string,
    exchange: string,
    from: Date,
    to: Date
  ): Promise<PremiumSnapshot[]> {
    if (!ALLOWED_CURRENCIES.test(fiatCurrency)) throw new Error('Invalid currency');
    if (!ALLOWED_CURRENCIES.test(stablecoin)) throw new Error('Invalid stablecoin');
    if (!ALLOWED_EXCHANGES.test(exchange)) throw new Error('Invalid exchange');

    const rows = await this.prisma.$queryRaw<PremiumSnapshot[]>`
      SELECT
        bucket,
        "fiatCurrency"   AS "fiatCurrency",
        stablecoin,
        exchange,
        avg_premium::float8 AS "avgPremium",
        max_premium::float8 AS "maxPremium",
        min_premium::float8 AS "minPremium",
        avg_spread::float8  AS "avgSpread"
      FROM ngn_premium_1h
      WHERE "fiatCurrency" = ${fiatCurrency}
        AND stablecoin     = ${stablecoin}
        AND exchange       = ${exchange}
        AND bucket        >= ${from}
        AND bucket        <= ${to}
      ORDER BY bucket DESC
      LIMIT 720
    `;
    return rows;
  }

  /**
   * Get latest price for a symbol across all exchanges.
   */
  async getLatestPrice(symbol: string): Promise<OHLCCandle[]> {
    if (!ALLOWED_SYMBOLS.test(symbol)) throw new Error('Invalid symbol');

    return this.prisma.$queryRaw<OHLCCandle[]>`
      SELECT DISTINCT ON (exchange)
        timestamp AS bucket,
        symbol,
        exchange,
        close::float8 AS close,
        open::float8  AS open,
        high::float8  AS high,
        low::float8   AS low,
        volume::float8 AS volume
      FROM price_ticks
      WHERE symbol = ${symbol}
        AND interval = '1m'
      ORDER BY exchange, timestamp DESC
    `;
  }

  /**
   * Check whether TimescaleDB extension is available.
   * Returns false if running on plain Postgres (graceful degradation).
   */
  async isTimescaleAvailable(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw<{ extname: string }[]>`
        SELECT extname FROM pg_extension WHERE extname = 'timescaledb'
      `;
      return result.length > 0;
    } catch {
      return false;
    }
  }
}
