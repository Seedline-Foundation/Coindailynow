/**
 * Market Data Service
 * Task 22: API client for market data and African exchanges
 * 
 * Features:
 * - Real-time market data fetching
 * - African exchange rate integration
 * - Mobile money correlation data
 * - Chart data with multiple timeframes
 * - Caching for performance optimization
 */

import { logger } from '../utils/logger';

// Types
export interface MarketDataPoint {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AfricanExchange {
  name: string;
  btcPrice: number;
  ethPrice: number;
  tradingFee: number;
  depositMethods: string[];
  supportedCountries: string[];
}

export interface MobileMoneyRate {
  name: string;
  country: string;
  currency: string;
  btcRate: number;
  usdRate: number;
  lastUpdated: string;
}

class MarketDataService {
  private baseUrl: string;
  private cache = new Map<string, { data: any; expires: number }>();

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() > timestamp;
  }

  private async fetchWithCache<T>(
    endpoint: string, 
    params?: any, 
    cacheMinutes: number = 1
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached.expires)) {
      return cached.data;
    }

    try {
      const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await fetch(`${this.baseUrl}${endpoint}${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + (cacheMinutes * 60 * 1000)
      });

      return data;
    } catch (error) {
      logger.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get real-time market data for specified symbols
   */
  async getMarketData(symbols: string[]): Promise<MarketDataPoint[]> {
    return this.fetchWithCache<MarketDataPoint[]>(
      '/api/market-data',
      { symbols: symbols.join(',') },
      0.5 // 30 seconds cache for real-time data
    );
  }

  /**
   * Get chart data for a specific symbol and timeframe
   */
  async getChartData(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
    return this.fetchWithCache<ChartDataPoint[]>(
      `/api/market-data/${symbol}/chart`,
      { timeframe },
      5 // 5 minutes cache for chart data
    );
  }

  /**
   * Get African exchange rates and data
   */
  async getAfricanExchangeRates(): Promise<Record<string, AfricanExchange>> {
    return this.fetchWithCache<Record<string, AfricanExchange>>(
      '/api/african-exchanges',
      undefined,
      2 // 2 minutes cache for exchange data
    );
  }

  /**
   * Get mobile money correlation rates
   */
  async getMobileMoneyRates(): Promise<Record<string, MobileMoneyRate>> {
    return this.fetchWithCache<Record<string, MobileMoneyRate>>(
      '/api/mobile-money-rates',
      undefined,
      5 // 5 minutes cache for mobile money rates
    );
  }

  /**
   * Get portfolio data for authenticated user
   */
  async getPortfolioData(userId: string): Promise<any> {
    return this.fetchWithCache<any>(
      `/api/portfolio/${userId}`,
      undefined,
      1 // 1 minute cache for portfolio data
    );
  }

  /**
   * Get user's price alerts
   */
  async getAlerts(userId: string): Promise<any[]> {
    return this.fetchWithCache<any[]>(
      `/api/alerts/${userId}`,
      undefined,
      2 // 2 minutes cache for alerts
    );
  }

  /**
   * Create a new price alert
   */
  async createAlert(userId: string, alert: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...alert }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Invalidate alerts cache
      const cacheKey = this.getCacheKey(`/api/alerts/${userId}`);
      this.cache.delete(cacheKey);

      return response.json();
    } catch (error) {
      logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Delete a price alert
   */
  async deleteAlert(userId: string, alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Invalidate alerts cache
      const cacheKey = this.getCacheKey(`/api/alerts/${userId}`);
      this.cache.delete(cacheKey);
    } catch (error) {
      logger.error('Failed to delete alert:', error);
      throw error;
    }
  }

  /**
   * Get market overview with African focus
   */
  async getAfricanMarketOverview(): Promise<any> {
    return this.fetchWithCache<any>(
      '/api/african-market-overview',
      undefined,
      3 // 3 minutes cache for market overview
    );
  }

  /**
   * Get trading volume by region
   */
  async getRegionalTradingVolume(): Promise<any> {
    return this.fetchWithCache<any>(
      '/api/regional-trading-volume',
      undefined,
      10 // 10 minutes cache for regional data
    );
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Market data cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const marketDataService = new MarketDataService();