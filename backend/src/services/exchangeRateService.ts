import axios from 'axios';
import type { Redis } from 'ioredis';

type FxResponse = {
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix?: number;
};

export class ExchangeRateService {
  constructor(private redis: Redis) {}

  /**
   * Gets FX rate for 1 USD -> target currency.
   * Uses a public rate feed with Redis caching.
   */
  async getUsdRate(targetCurrency: string): Promise<number> {
    const code = String(targetCurrency || '').toUpperCase().trim();
    if (!code) throw new Error('targetCurrency is required');

    const cacheKey = `fx:usd:${code}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = Number(cached);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    // Public feed: https://open.er-api.com (no key)
    const resp = await axios.get<FxResponse>('https://open.er-api.com/v6/latest/USD', {
      timeout: 2500,
      validateStatus: s => s >= 200 && s < 300,
    });

    const rate = resp.data?.rates?.[code];
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`FX rate unavailable for ${code}`);
    }

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, String(rate));
    return rate;
  }
}
