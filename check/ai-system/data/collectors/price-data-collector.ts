// Price Data Collector - Real-time cryptocurrency price collection for African markets
// Optimized for single I/O operations with comprehensive caching

import { createAuditLog, AuditActions } from '../../../lib/audit';
import { DataCollectionResult } from '../../types/ai-types';

export interface PriceDataRequest {
  symbols: string[];
  currency?: 'USD' | 'NGN' | 'KES' | 'ZAR' | 'GHS'; // African currencies
  timeframe?: '1m' | '5m' | '15m' | '1h' | '24h';
  includeVolume?: boolean;
  includeMarketCap?: boolean;
}

interface PriceDataPoint {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h?: number;
  marketCap?: number;
  currency: string;
  timestamp: Date;
  source: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export class PriceDataCollector {
  private coinGeckoApiKey?: string;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private priceCache: Map<string, DataCollectionResult> = new Map();
  private readonly cacheTimeout = 60 * 1000; // 1 minute cache for price data
  private isInitialized: boolean = false;

  // African exchanges and their supported currencies
  private readonly africanExchanges = {
    'NGN': ['binance', 'luno', 'quidax', 'buycoins'],
    'KES': ['binance', 'luno', 'paxful'],
    'ZAR': ['binance', 'luno', 'valr', 'ice3x'],
    'GHS': ['binance', 'luno', 'paxful']
  };

  constructor() {
    this.coinGeckoApiKey = process.env.COINGECKO_API_KEY;
  }

  async initialize(): Promise<void> {
    console.log('💰 Initializing Price Data Collector...');

    try {
      // Test CoinGecko API connection
      const testResponse = await fetch('https://api.coingecko.com/api/v3/ping');
      
      if (!testResponse.ok) {
        throw new Error(`CoinGecko API connection failed: ${testResponse.statusText}`);
      }

      // Initialize exchange rates for African currencies
      await this.updateExchangeRates();

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'price_data_collector',
        resourceId: 'coingecko',
        details: { 
          initialized: true, 
          supportedCurrencies: Object.keys(this.africanExchanges),
          hasApiKey: !!this.coinGeckoApiKey,
          capabilities: ['price_collection', 'volume_tracking', 'market_cap_monitoring', 'african_currency_conversion']
        }
      });

      console.log('✅ Price Data Collector initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'price_data_collector',
        resourceId: 'coingecko',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async collectPriceData(request: PriceDataRequest): Promise<DataCollectionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = this.priceCache.get(cacheKey);
    if (cachedResult) {
      console.log(`📋 Using cached price data for ${request.symbols.join(', ')}`);
      return cachedResult;
    }

    console.log(`💰 Collecting price data for ${request.symbols.length} symbols...`);

    try {
      // Single I/O operation to fetch all price data
      const priceData = await this.fetchPriceData(request);
      
      // Convert to requested currency if needed
      const convertedData = await this.convertCurrency(priceData, request.currency || 'USD');
      
      const result: DataCollectionResult = {
        data: convertedData.map(item => ({
          symbol: item.symbol,
          price: item.price,
          change24h: item.change24h,
          changePercent24h: item.changePercent24h,
          volume24h: item.volume24h,
          marketCap: item.marketCap,
          currency: item.currency,
          timestamp: item.timestamp.toISOString(),
          source: item.source,
          africanExchanges: this.getAfricanExchangeAvailability(item.symbol, request.currency)
        })),
        summary: {
          totalRecords: convertedData.length,
          timeRange: request.timeframe || '24h',
          dataQuality: this.calculateDataQuality(convertedData)
        },
        metadata: {
          source: 'coingecko',
          collectionTime: Date.now() - startTime,
          lastUpdate: new Date()
        }
      };

      // Cache result
      this.priceCache.set(cacheKey, result);
      setTimeout(() => this.priceCache.delete(cacheKey), this.cacheTimeout);

      // Log successful collection
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'price_data_collection',
        resourceId: `collection_${Date.now()}`,
        details: {
          symbolCount: request.symbols.length,
          currency: request.currency || 'USD',
          dataPoints: convertedData.length,
          processingTime: result.metadata?.collectionTime,
          includeVolume: request.includeVolume,
          includeMarketCap: request.includeMarketCap
        }
      });

      console.log(`✅ Price data collection completed: ${convertedData.length} data points`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Price data collection failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'price_data_collection',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          symbolCount: request.symbols.length,
          currency: request.currency
        }
      });

      throw new Error(`Price data collection failed: ${errorMessage}`);
    }
  }

  private async fetchPriceData(request: PriceDataRequest): Promise<PriceDataPoint[]> {
    const symbolsParam = request.symbols.map(s => s.toLowerCase()).join(',');
    const currency = request.currency?.toLowerCase() || 'usd';
    
    // Build API URL with required parameters
    const baseUrl = 'https://api.coingecko.com/api/v3/simple/price';
    const params = new URLSearchParams({
      ids: symbolsParam,
      vs_currencies: currency,
      include_24hr_change: 'true',
      include_24hr_vol: request.includeVolume ? 'true' : 'false',
      include_market_cap: request.includeMarketCap ? 'true' : 'false'
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.coinGeckoApiKey) {
      headers['x-cg-demo-api-key'] = this.coinGeckoApiKey;
    }

    const response = await fetch(`${baseUrl}?${params}`, { headers });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return this.parsePriceResponse(data, request);
  }

  private parsePriceResponse(data: Record<string, unknown>, request: PriceDataRequest): PriceDataPoint[] {
    const priceData: PriceDataPoint[] = [];
    const currency = request.currency || 'USD';
    const currencyKey = currency.toLowerCase();
    
    for (const [symbol, priceInfo] of Object.entries(data)) {
      if (priceInfo && typeof priceInfo === 'object') {
        priceData.push({
          symbol: symbol.toUpperCase(),
          price: priceInfo[currencyKey] || 0,
          change24h: priceInfo[`${currencyKey}_24h_change`] || 0,
          changePercent24h: priceInfo[`${currencyKey}_24h_change`] || 0,
          volume24h: request.includeVolume ? priceInfo[`${currencyKey}_24h_vol`] : undefined,
          marketCap: request.includeMarketCap ? priceInfo[`${currencyKey}_market_cap`] : undefined,
          currency: currency,
          timestamp: new Date(),
          source: 'coingecko'
        });
      }
    }
    
    return priceData;
  }

  private async convertCurrency(priceData: PriceDataPoint[], targetCurrency: string): Promise<PriceDataPoint[]> {
    if (targetCurrency === 'USD' || !this.isAfricanCurrency(targetCurrency)) {
      return priceData;
    }

    const exchangeRate = await this.getExchangeRate('USD', targetCurrency);
    
    return priceData.map(item => ({
      ...item,
      price: item.price * exchangeRate.rate,
      volume24h: item.volume24h ? item.volume24h * exchangeRate.rate : undefined,
      marketCap: item.marketCap ? item.marketCap * exchangeRate.rate : undefined,
      currency: targetCurrency
    }));
  }

  private async updateExchangeRates(): Promise<void> {
    try {
      // Update exchange rates for African currencies
      const currencies = Object.keys(this.africanExchanges);
      
      for (const currency of currencies) {
        if (currency !== 'USD') {
          const rate = await this.fetchExchangeRate('USD', currency);
          this.exchangeRates.set(`USD-${currency}`, rate);
        }
      }
      
      console.log(`📊 Updated exchange rates for ${currencies.length} African currencies`);
      
    } catch {
      console.warn('Failed to update exchange rates, using fallback rates');
      this.setFallbackExchangeRates();
    }
  }

  private async fetchExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    try {
      // Use a free exchange rate API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      
      if (!response.ok) {
        throw new Error('Exchange rate API failed');
      }
      
      const data = await response.json();
      
      return {
        from,
        to,
        rate: data.rates[to] || 1,
        timestamp: new Date()
      };
      
    } catch {
      // Fallback to approximate rates
      return this.getFallbackExchangeRate(from, to);
    }
  }

  private async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    const cacheKey = `${from}-${to}`;
    const cached = this.exchangeRates.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < 30 * 60 * 1000) { // 30 min cache
      return cached;
    }
    
    const rate = await this.fetchExchangeRate(from, to);
    this.exchangeRates.set(cacheKey, rate);
    
    return rate;
  }

  private setFallbackExchangeRates(): void {
    // Approximate exchange rates (should be updated regularly in production)
    const fallbackRates = {
      'USD-NGN': 750,
      'USD-KES': 150,
      'USD-ZAR': 18,
      'USD-GHS': 12
    };
    
    for (const [pair, rate] of Object.entries(fallbackRates)) {
      const [from, to] = pair.split('-');
      this.exchangeRates.set(pair, {
        from,
        to,
        rate,
        timestamp: new Date()
      });
    }
  }

  private getFallbackExchangeRate(from: string, to: string): ExchangeRate {
    const fallbackRates: Record<string, number> = {
      'USD-NGN': 750,
      'USD-KES': 150,
      'USD-ZAR': 18,
      'USD-GHS': 12
    };
    
    return {
      from,
      to,
      rate: fallbackRates[`${from}-${to}`] || 1,
      timestamp: new Date()
    };
  }

  private getAfricanExchangeAvailability(symbol: string, currency?: string): string[] {
    if (!currency || !this.isAfricanCurrency(currency)) {
      return [];
    }
    
    return this.africanExchanges[currency as keyof typeof this.africanExchanges] || [];
  }

  private isAfricanCurrency(currency: string): boolean {
    return Object.keys(this.africanExchanges).includes(currency);
  }

  private calculateDataQuality(priceData: PriceDataPoint[]): number {
    if (priceData.length === 0) return 0;
    
    // Quality based on data completeness and freshness
    const completeRecords = priceData.filter(item => 
      item.price > 0 && 
      item.change24h !== undefined && 
      item.timestamp
    ).length;
    
    const completeness = completeRecords / priceData.length;
    const freshness = 1; // Assume fresh data from API
    
    return (completeness * 0.7 + freshness * 0.3);
  }

  private generateCacheKey(request: PriceDataRequest): string {
    return `price_data:${request.symbols.sort().join(',')}:${request.currency || 'USD'}:${request.timeframe || '24h'}`;
  }

  // Public method to get real-time prices for specific symbols
  async getRealTimePrices(symbols: string[], currency: string = 'USD'): Promise<PriceDataPoint[]> {
    const request: PriceDataRequest = {
      symbols,
      currency: currency as 'USD' | 'NGN' | 'KES' | 'ZAR' | 'GHS',
      includeVolume: true,
      includeMarketCap: true
    };
    
    const result = await this.collectPriceData(request);
    
    // Type-safe conversion
    const priceDataPoints: PriceDataPoint[] = [];
    if (Array.isArray(result.data)) {
      result.data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const dataItem = item as Record<string, unknown>;
          if (
            typeof dataItem.symbol === 'string' &&
            typeof dataItem.price === 'number' &&
            typeof dataItem.currency === 'string'
          ) {
            priceDataPoints.push({
              symbol: dataItem.symbol,
              price: dataItem.price,
              change24h: typeof dataItem.change24h === 'number' ? dataItem.change24h : 0,
              changePercent24h: typeof dataItem.changePercent24h === 'number' ? dataItem.changePercent24h : 0,
              volume24h: typeof dataItem.volume24h === 'number' ? dataItem.volume24h : undefined,
              marketCap: typeof dataItem.marketCap === 'number' ? dataItem.marketCap : undefined,
              currency: dataItem.currency,
              timestamp: dataItem.timestamp instanceof Date ? dataItem.timestamp : new Date(),
              source: typeof dataItem.source === 'string' ? dataItem.source : 'unknown'
            });
          }
        }
      });
    }
    
    return priceDataPoints;
  }

  // Public method to get African exchange rates
  getAfricanExchangeRates(): Record<string, number> {
    const rates: Record<string, number> = {};
    
    for (const [pair, exchangeRate] of this.exchangeRates.entries()) {
      if (pair.startsWith('USD-') && this.isAfricanCurrency(exchangeRate.to)) {
        rates[exchangeRate.to] = exchangeRate.rate;
      }
    }
    
    return rates;
  }

  // Public method to get cache statistics
  getCacheStats(): { size: number; hitRate: number; exchangeRateCount: number } {
    return {
      size: this.priceCache.size,
      hitRate: 0.8, // Mock hit rate for demo
      exchangeRateCount: this.exchangeRates.size
    };
  }
}

// Create singleton instance
export const priceDataCollector = new PriceDataCollector();
