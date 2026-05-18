/**
 * AIPolicyAgentService — W4: AI-driven financial policy analysis for CFIS.
 *
 * Gathers market data (JOY token price, swap volume, infrastructure costs),
 * computes CPA, and generates pricing / staking suggestions.
 * Results are persisted to the database for the CFIS dashboard.
 */

import db from '../database/connection';

// ─── External data source configuration ──────────────────────────────────
const COINGECKO_API = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const JOY_TOKEN_ID = process.env.JOY_COINGECKO_ID || 'joystream';

// ─── Types ───────────────────────────────────────────────────────────────

export interface MarketData {
  joyPriceUsd: number;
  joyVolume24h: number;
  joyMarketCap: number;
  infrastructureCostUsd: number;
  fetchedAt: Date;
}

export interface CPAResult {
  marketingSpend: number;
  newRegistrations: number;
  cpa: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface PricingSuggestion {
  currentSubscriptionPrice: number;
  cpa: number;
  suggestedPrice: number;
  rationale: string;
  confidence: number;
}

export interface StakingSuggestion {
  currentAPR: number;
  suggestedAPR: number;
  totalStaked: number;
  circulatingSupply: number;
  rationale: string;
  confidence: number;
}

export interface AnalysisResult {
  id?: string;
  runAt: Date;
  marketData: MarketData;
  cpa: CPAResult;
  pricingSuggestions: PricingSuggestion[];
  stakingSuggestions: StakingSuggestion[];
}

// ─── Service ─────────────────────────────────────────────────────────────

export class AIPolicyAgentService {
  /**
   * Fetch JOY token price, 24 h swap volume, and estimated infrastructure costs.
   */
  async gatherMarketData(): Promise<MarketData> {
    let joyPriceUsd = 0;
    let joyVolume24h = 0;
    let joyMarketCap = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(
        `${COINGECKO_API}/simple/price?ids=${JOY_TOKEN_ID}&vs_currencies=usd&include_24hr_vol=true&include_market_cap=true`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: any = await res.json();
        const coin = data[JOY_TOKEN_ID] || {};
        joyPriceUsd = coin.usd ?? 0;
        joyVolume24h = coin.usd_24h_vol ?? 0;
        joyMarketCap = coin.usd_market_cap ?? 0;
      }
    } catch {
      console.warn('[AIPolicyAgent] Failed to fetch market data from CoinGecko — using fallback zeros');
    }

    const infraCostRow = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE tx_type = 'GAS_FEE_COLLECTION'
         AND status = 'COMPLETED'
         AND created_at >= NOW() - INTERVAL '30 days'`,
    ).catch(() => ({ rows: [{ total: 0 }] }));

    const infrastructureCostUsd = parseFloat(infraCostRow.rows[0]?.total ?? '0');

    return {
      joyPriceUsd,
      joyVolume24h,
      joyMarketCap,
      infrastructureCostUsd,
      fetchedAt: new Date(),
    };
  }

  /**
   * Compute Cost Per Acquisition from the last 30 days of marketing spend
   * vs. new user registrations recorded in the backend.
   */
  async calculateCPA(): Promise<CPAResult> {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    const spendResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE tx_type IN ('BONUS_PAYMENT', 'AIRDROP_DISTRIBUTE', 'PARTNERSHIP_PAYMENT')
         AND status = 'COMPLETED'
         AND created_at >= $1 AND created_at <= $2`,
      [periodStart.toISOString(), periodEnd.toISOString()],
    ).catch(() => ({ rows: [{ total: 0 }] }));

    const marketingSpend = parseFloat(spendResult.rows[0]?.total ?? '0');

    const regResult = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM wallets
       WHERE owner_type = 'USER'
         AND created_at >= $1 AND created_at <= $2`,
      [periodStart.toISOString(), periodEnd.toISOString()],
    ).catch(() => ({ rows: [{ cnt: 0 }] }));

    const newRegistrations = parseInt(regResult.rows[0]?.cnt ?? '0', 10) || 1;
    const cpa = marketingSpend / newRegistrations;

    return { marketingSpend, newRegistrations, cpa, periodStart, periodEnd };
  }

  /**
   * Suggest subscription pricing adjustments based on CPA vs current price.
   */
  generatePricingSuggestions(cpa: CPAResult, marketData: MarketData): PricingSuggestion[] {
    const currentPrice = parseFloat(process.env.SUBSCRIPTION_PRICE_USD || '9.99');
    const suggestions: PricingSuggestion[] = [];

    const cpaToPrice = cpa.cpa / currentPrice;

    if (cpaToPrice > 3) {
      suggestions.push({
        currentSubscriptionPrice: currentPrice,
        cpa: cpa.cpa,
        suggestedPrice: Math.round(currentPrice * 1.15 * 100) / 100,
        rationale: `CPA ($${cpa.cpa.toFixed(2)}) is more than 3× the subscription price ($${currentPrice}). A 15% price increase would improve unit economics without large churn risk.`,
        confidence: 0.72,
      });
    } else if (cpaToPrice < 0.5 && marketData.joyVolume24h > 10_000) {
      suggestions.push({
        currentSubscriptionPrice: currentPrice,
        cpa: cpa.cpa,
        suggestedPrice: Math.round(currentPrice * 0.9 * 100) / 100,
        rationale: `CPA ($${cpa.cpa.toFixed(2)}) is well below subscription price and token trading volume is healthy. A 10% price reduction could accelerate user growth.`,
        confidence: 0.65,
      });
    } else {
      suggestions.push({
        currentSubscriptionPrice: currentPrice,
        cpa: cpa.cpa,
        suggestedPrice: currentPrice,
        rationale: 'CPA and subscription price are balanced. Hold current pricing.',
        confidence: 0.85,
      });
    }

    return suggestions;
  }

  /**
   * Suggest optimal staking APR based on token economics.
   */
  generateStakingSuggestions(marketData: MarketData): StakingSuggestion[] {
    const currentAPR = parseFloat(process.env.STAKING_APR || '0.35');
    const totalStaked = parseFloat(process.env.TOTAL_STAKED_JOY || '0');
    const circulatingSupply = parseFloat(process.env.JOY_CIRCULATING_SUPPLY || '1000000');
    const suggestions: StakingSuggestion[] = [];

    const stakeRatio = circulatingSupply > 0 ? totalStaked / circulatingSupply : 0;

    if (stakeRatio < 0.15) {
      const suggestedAPR = Math.min(currentAPR * 1.2, 0.70);
      suggestions.push({
        currentAPR,
        suggestedAPR: Math.round(suggestedAPR * 10000) / 10000,
        totalStaked,
        circulatingSupply,
        rationale: `Only ${(stakeRatio * 100).toFixed(1)}% of supply is staked. Increasing APR from ${(currentAPR * 100).toFixed(1)}% to ${(suggestedAPR * 100).toFixed(1)}% would incentivize staking and reduce sell pressure.`,
        confidence: 0.70,
      });
    } else if (stakeRatio > 0.6) {
      const suggestedAPR = Math.max(currentAPR * 0.85, 0.05);
      suggestions.push({
        currentAPR,
        suggestedAPR: Math.round(suggestedAPR * 10000) / 10000,
        totalStaked,
        circulatingSupply,
        rationale: `${(stakeRatio * 100).toFixed(1)}% of supply is locked in staking. Reducing APR preserves the reward pool while maintaining healthy participation.`,
        confidence: 0.68,
      });
    } else {
      suggestions.push({
        currentAPR,
        suggestedAPR: currentAPR,
        totalStaked,
        circulatingSupply,
        rationale: 'Stake ratio is healthy. Maintain current APR.',
        confidence: 0.82,
      });
    }

    return suggestions;
  }

  /**
   * Scheduled hourly job: run all analyses and persist to the database.
   */
  async runHourlyAnalysis(): Promise<AnalysisResult> {
    console.log('[AIPolicyAgent] ⏱  Starting hourly analysis...');
    const runAt = new Date();

    const marketData = await this.gatherMarketData();
    const cpa = await this.calculateCPA();
    const pricingSuggestions = this.generatePricingSuggestions(cpa, marketData);
    const stakingSuggestions = this.generateStakingSuggestions(marketData);

    const result: AnalysisResult = {
      runAt,
      marketData,
      cpa,
      pricingSuggestions,
      stakingSuggestions,
    };

    await this.storeAnalysisResult(result);

    console.log('[AIPolicyAgent] ✅ Hourly analysis complete', {
      joyPrice: marketData.joyPriceUsd,
      cpa: cpa.cpa.toFixed(4),
      pricingSuggestions: pricingSuggestions.length,
      stakingSuggestions: stakingSuggestions.length,
    });

    return result;
  }

  /**
   * Persist analysis results to the ai_policy_analyses table (auto-created if missing).
   */
  private async storeAnalysisResult(result: AnalysisResult): Promise<void> {
    try {
      await db.query(
        `CREATE TABLE IF NOT EXISTS ai_policy_analyses (
           id            TEXT PRIMARY KEY,
           run_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
           market_data   JSONB NOT NULL,
           cpa           JSONB NOT NULL,
           pricing       JSONB NOT NULL,
           staking       JSONB NOT NULL,
           created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`,
      );

      const id = db.generateId();
      await db.query(
        `INSERT INTO ai_policy_analyses (id, run_at, market_data, cpa, pricing, staking)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          result.runAt.toISOString(),
          JSON.stringify(result.marketData),
          JSON.stringify(result.cpa),
          JSON.stringify(result.pricingSuggestions),
          JSON.stringify(result.stakingSuggestions),
        ],
      );

      result.id = id;
    } catch (err: any) {
      console.error('[AIPolicyAgent] Failed to store analysis result:', err.message);
    }
  }

  /**
   * Fetch the latest N analysis results for the dashboard.
   */
  async getLatestAnalyses(limit = 24): Promise<AnalysisResult[]> {
    try {
      const res = await db.query(
        `SELECT * FROM ai_policy_analyses ORDER BY run_at DESC LIMIT $1`,
        [limit],
      );
      return res.rows.map((row: any) => ({
        id: row.id,
        runAt: new Date(row.run_at),
        marketData: row.market_data,
        cpa: row.cpa,
        pricingSuggestions: row.pricing,
        stakingSuggestions: row.staking,
      }));
    } catch {
      return [];
    }
  }
}

export const aiPolicyAgentService = new AIPolicyAgentService();
