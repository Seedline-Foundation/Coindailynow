/**
 * Luno Exchange Adapter
 * Task 13: Market Data Aggregator Implementation
 * 
 * South Africa's leading cryptocurrency exchange integration
 * Supports: South Africa, Nigeria, Kenya, Uganda, Zambia
 */

import { BaseExchangeAdapter } from './BaseExchangeAdapter';
import {
  MarketDataPoint,
  ExchangeIntegration,
  TradingPair,
  AfricanExchangeData,
  MobileMoneyProvider,
  ComplianceLevel
} from '../../types/market-data';
import { logger } from '../../utils/logger';

interface LunoTicker {
  pair: string;
  timestamp: number;
  bid: string;
  ask: string;
  last_trade: string;
  rolling_24_hour_volume: string;
  status: string;
}

interface LunoOrderbook {
  timestamp: number;
  bids: [string, string][];
  asks: [string, string][];
}

export class LunoExchangeAdapter extends BaseExchangeAdapter {
  private readonly supportedPairs = new Map([
    ['BTC', 'XBTZAR'], // Bitcoin to South African Rand
    ['ETH', 'ETHZAR'], // Ethereum to ZAR
    ['BCH', 'BCHZAR'], // Bitcoin Cash to ZAR
    ['LTC', 'LTCZAR'], // Litecoin to ZAR
    ['XRP', 'XRPZAR'], // Ripple to ZAR
    // Nigerian Naira pairs
    ['BTC_NGN', 'XBTNGN'],
    ['ETH_NGN', 'ETHNGN'],
    // Kenyan Shilling pairs (limited)
    ['BTC_KES', 'XBTKES'],
    // Global USD pairs
    ['BTC_USD', 'XBTUSD'],
    ['ETH_USD', 'ETHUSD']
  ]);

  private readonly countryConfig = new Map([
    ['ZA', { currency: 'ZAR', mobileMoney: [], compliance: ComplianceLevel.FULL }],
    ['NG', { currency: 'NGN', mobileMoney: [MobileMoneyProvider.MTN_MONEY], compliance: ComplianceLevel.FULL }],
    ['KE', { currency: 'KES', mobileMoney: [MobileMoneyProvider.MPESA], compliance: ComplianceLevel.PARTIAL }],
    ['UG', { currency: 'UGX', mobileMoney: [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY], compliance: ComplianceLevel.PARTIAL }]
  ]);

  constructor(integration: ExchangeIntegration) {
    super(integration);
    logger.info('Luno exchange adapter initialized', { 
      region: integration.region,
      supportedCountries: integration.supportedCountries 
    });
  }

  /**
   * Fetch market data for specified symbols
   */
  async fetchMarketData(symbols: string[]): Promise<MarketDataPoint[]> {
    const startTime = Date.now();
    const marketData: MarketDataPoint[] = [];

    try {
      // Get all supported pairs first
      const pairs = this.convertSymbolsToPairs(symbols);
      
      if (pairs.length === 0) {
        logger.warn('No supported pairs found for symbols', { symbols });
        return [];
      }

      // Fetch tickers for all pairs in parallel
      const tickerPromises = pairs.map(pair => this.fetchPairTicker(pair));
      const tickers = await Promise.allSettled(tickerPromises);

      // Process successful ticker responses
      for (let i = 0; i < tickers.length; i++) {
        const result = tickers[i];
        const pair = pairs[i];
        if (!pair || !result) continue;
        
        if (result.status === 'fulfilled' && result.value) {
          try {
            const dataPoint = await this.convertTickerToMarketData(result.value, pair);
            marketData.push(dataPoint);
          } catch (error) {
            logger.error('Failed to convert ticker to market data', { 
              error: error instanceof Error ? error.message : String(error), 
              pair 
            });
          }
        } else if (result.status === 'rejected') {
          logger.warn('Failed to fetch ticker', { 
            pair, 
            error: result.reason instanceof Error ? result.reason.message : String(result.reason)
          });
        }
      }

      const responseTime = Date.now() - startTime;
      logger.info('Luno market data fetch completed', {
        requestedSymbols: symbols.length,
        fetchedPairs: pairs.length,
        successfulData: marketData.length,
        responseTime
      });

      return marketData;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Luno market data fetch failed', {
        error: error instanceof Error ? error.message : String(error),
        symbols,
        responseTime
      });
      throw error;
    }
  }

  /**
   * Fetch available trading pairs
   */
  async fetchTradingPairs(): Promise<TradingPair[]> {
    try {
      const tickers = await this.makeRequest('/api/1/tickers');
      const pairs: TradingPair[] = [];

      for (const [pairName, ticker] of Object.entries(tickers.tickers)) {
        const tickerData = ticker as LunoTicker;
        
        if (tickerData.status === 'ACTIVE') {
          const [base, quote] = this.parsePairName(pairName);
          
          pairs.push({
            base,
            quote,
            price: parseFloat(tickerData.last_trade),
            volume24h: parseFloat(tickerData.rolling_24_hour_volume),
            lastTraded: new Date(tickerData.timestamp)
          });
        }
      }

      logger.info('Luno trading pairs fetched', { count: pairs.length });
      return pairs;

    } catch (error) {
      logger.error('Failed to fetch Luno trading pairs', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Normalize symbol from standard format to Luno format
   */
  normalizeSymbol(symbol: string): string {
    return this.supportedPairs.get(symbol) || symbol;
  }

  /**
   * Convert Luno pair back to standard symbol
   */
  denormalizeSymbol(lunoSymbol: string): string {
    for (const [symbol, lunoPair] of Array.from(this.supportedPairs.entries())) {
      if (lunoPair === lunoSymbol) {
        const baseCurrency = symbol.includes('_') ? symbol.split('_')[0] : symbol;
        return baseCurrency || symbol;
      }
    }
    return lunoSymbol;
  }

  /**
   * Get African-specific market data with local currency and mobile money context
   */
  async getAfricanMarketData(symbols: string[], country: string): Promise<AfricanExchangeData[]> {
    const marketData = await this.fetchMarketData(symbols);
    const countryInfo = this.countryConfig.get(country);

    if (!countryInfo) {
      logger.warn('Unsupported country for African market data', { country });
      return marketData as AfricanExchangeData[];
    }

    // Get local currency exchange rates
    const localRates = await this.fetchLocalCurrencyRates(countryInfo.currency);

    const africanData: AfricanExchangeData[] = marketData.map(data => ({
      ...data,
      localCurrency: {
        code: countryInfo.currency,
        rate: localRates[countryInfo.currency] || 1,
        priceLocal: data.priceUsd * (localRates[countryInfo.currency] || 1)
      },
      mobileMoneyIntegration: {
        providers: countryInfo.mobileMoney,
        depositMethods: this.getAvailableDepositMethods(countryInfo.mobileMoney),
        withdrawMethods: this.getAvailableWithdrawMethods(countryInfo.mobileMoney)
      },
      regulations: {
        country,
        compliance: countryInfo.compliance,
        restrictions: this.getCountryRestrictions(country)
      }
    }));

    logger.info('African market data enriched', { 
      country, 
      currency: countryInfo.currency,
      dataPoints: africanData.length 
    });

    return africanData;
  }

  // ========== Private Methods ==========

  private convertSymbolsToPairs(symbols: string[]): string[] {
    const pairs: string[] = [];
    
    for (const symbol of symbols) {
      const lunoPair = this.supportedPairs.get(symbol);
      if (lunoPair) {
        pairs.push(lunoPair);
      } else {
        // Try common ZAR pairs for unmapped symbols
        const zarPair = `${symbol}ZAR`;
        if (this.supportedPairs.has(symbol) || symbol.length <= 4) {
          pairs.push(zarPair);
        }
      }
    }

    return Array.from(new Set(pairs)); // Remove duplicates
  }

  private async fetchPairTicker(pair: string): Promise<LunoTicker | null> {
    try {
      const response = await this.makeRequest(`/api/1/ticker?pair=${pair}`);
      return {
        pair,
        ...response
      };
    } catch (error) {
      // Handle specific Luno errors
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 
          'status' in error.response && error.response.status === 404) {
        logger.debug('Trading pair not found on Luno', { pair });
        return null;
      }
      throw error;
    }
  }

  private async convertTickerToMarketData(
    ticker: LunoTicker, 
    pair: string
  ): Promise<MarketDataPoint> {
    const symbol = this.denormalizeSymbol(pair);
    const [base, quote] = this.parsePairName(pair);
    
    // Calculate 24h price change (Luno doesn't provide this directly)
    const priceChange24h = await this.calculate24hPriceChange(pair, parseFloat(ticker.last_trade));
    
    // Get order book for additional data
    const orderBook = await this.fetchOrderBook(pair);
    
    const source = this.createDataSource(`/api/1/ticker?pair=${pair}`, 100);
    
    return this.createMarketDataPoint({
      price: ticker.last_trade,
      volume24h: ticker.rolling_24_hour_volume,
      high24h: await this.get24hHigh(pair),
      low24h: await this.get24hLow(pair),
      priceChange24h: priceChange24h.toString(),
      changePercent24h: ((priceChange24h / parseFloat(ticker.last_trade)) * 100).toString(),
      marketCap: 0, // Luno doesn't provide market cap
      pairs: [{
        base,
        quote,
        price: parseFloat(ticker.last_trade),
        volume24h: parseFloat(ticker.rolling_24_hour_volume),
        lastTraded: new Date(ticker.timestamp)
      }],
      timestamp: ticker.timestamp,
      spread: this.calculateSpread(orderBook)
    }, symbol, source);
  }

  private parsePairName(pair: string): [string, string] {
    // Luno uses specific naming conventions
    if (pair.startsWith('XBT')) {
      const quote = pair.substring(3);
      return ['BTC', quote];
    } else if (pair.length === 6) {
      return [pair.substring(0, 3), pair.substring(3)];
    } else {
      // Handle custom pairs
      const match = pair.match(/^([A-Z]{2,4})([A-Z]{3})$/);
      return match && match[1] && match[2] ? [match[1], match[2]] : [pair, 'USD'];
    }
  }

  private async calculate24hPriceChange(pair: string, currentPrice: number): Promise<number> {
    try {
      // Get historical data for 24h ago (Luno doesn't have direct endpoint)
      // This is a simplified calculation - in production, you'd store historical data
      return 0; // Placeholder
    } catch (error) {
      logger.debug('Failed to calculate 24h price change', { pair, error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  private async fetchOrderBook(pair: string): Promise<LunoOrderbook | null> {
    try {
      return await this.makeRequest(`/api/1/orderbook?pair=${pair}`);
    } catch (error) {
      logger.debug('Failed to fetch order book', { pair, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  private async get24hHigh(pair: string): Promise<number> {
    // Luno doesn't provide 24h high/low directly
    // This would require historical data or trades endpoint
    return 0;
  }

  private async get24hLow(pair: string): Promise<number> {
    // Luno doesn't provide 24h high/low directly
    return 0;
  }

  private calculateSpread(orderBook: LunoOrderbook | null): number {
    if (!orderBook || !orderBook.bids.length || !orderBook.asks.length) {
      return 0;
    }

    const bestBid = parseFloat(orderBook.bids[0]?.[0] || '0');
    const bestAsk = parseFloat(orderBook.asks[0]?.[0] || '0');
    
    return bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk) * 100 : 0;
  }

  private async fetchLocalCurrencyRates(currency: string): Promise<Record<string, number>> {
    try {
      // In production, you'd use a forex API or Luno's currency conversion
      // This is a placeholder implementation
      const rates: Record<string, number> = {
        'ZAR': 18.5, // USD to ZAR
        'NGN': 460,  // USD to NGN
        'KES': 110,  // USD to KES
        'UGX': 3700  // USD to UGX
      };

      return rates;
    } catch (error) {
      logger.error('Failed to fetch local currency rates', { currency, error: error instanceof Error ? error.message : String(error) });
      return { [currency]: 1 };
    }
  }

  private getAvailableDepositMethods(providers: MobileMoneyProvider[]): string[] {
    const methods = ['bank_transfer', 'card'];
    
    for (const provider of providers) {
      switch (provider) {
        case MobileMoneyProvider.MPESA:
          methods.push('mpesa');
          break;
        case MobileMoneyProvider.MTN_MONEY:
          methods.push('mtn_money');
          break;
        case MobileMoneyProvider.AIRTEL_MONEY:
          methods.push('airtel_money');
          break;
      }
    }

    return methods;
  }

  private getAvailableWithdrawMethods(providers: MobileMoneyProvider[]): string[] {
    // Generally same as deposit methods for Luno
    return this.getAvailableDepositMethods(providers);
  }

  private getCountryRestrictions(country: string): string[] {
    const restrictions: Record<string, string[]> = {
      'ZA': [], // No major restrictions
      'NG': ['daily_limit_usd_1000'], // Nigerian regulatory limits
      'KE': ['institutional_only'], // Kenya has some restrictions
      'UG': ['verification_required'] // Uganda requires KYC
    };

    return restrictions[country] || [];
  }

  /**
   * Health check specific to Luno API
   */
  override async healthCheck() {
    try {
      await this.makeRequest('/api/1/ticker?pair=XBTZAR', 'GET', {}, { timeout: 5000 });
      return await super.healthCheck();
    } catch (error) {
      logger.warn('Luno health check failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get Luno-specific market statistics
   */
  async getMarketStatistics(): Promise<any> {
    try {
      const [tickers, orderBooks] = await Promise.all([
        this.makeRequest('/api/1/tickers'),
        this.fetchAllOrderBooks()
      ]);

      return {
        totalPairs: Object.keys(tickers.tickers).length,
        activePairs: Object.values(tickers.tickers).filter((t: any) => t.status === 'ACTIVE').length,
        totalVolume24h: this.calculateTotalVolume(tickers.tickers),
        avgSpread: this.calculateAverageSpread(orderBooks),
        lastUpdate: new Date()
      };

    } catch (error) {
      logger.error('Failed to fetch Luno market statistics', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private async fetchAllOrderBooks(): Promise<Record<string, LunoOrderbook>> {
    const orderBooks: Record<string, LunoOrderbook> = {};
    const mainPairs = ['XBTZAR', 'ETHZAR', 'XBTNGN', 'ETHNGN'];

    for (const pair of mainPairs) {
      try {
        const orderBook = await this.fetchOrderBook(pair);
        if (orderBook) {
          orderBooks[pair] = orderBook;
        }
      } catch (error) {
        logger.debug('Failed to fetch order book', { pair, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return orderBooks;
  }

  private calculateTotalVolume(tickers: Record<string, LunoTicker>): number {
    return Object.values(tickers)
      .filter(ticker => ticker.status === 'ACTIVE')
      .reduce((total, ticker) => total + parseFloat(ticker.rolling_24_hour_volume || '0'), 0);
  }

  private calculateAverageSpread(orderBooks: Record<string, LunoOrderbook>): number {
    const spreads = Object.values(orderBooks)
      .map(orderBook => this.calculateSpread(orderBook))
      .filter(spread => spread > 0);

    return spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
  }
}