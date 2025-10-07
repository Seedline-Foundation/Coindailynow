/**
 * Binance Africa Exchange Adapter
 * Task 13: Market Data Aggregator Implementation
 * 
 * Binance's African operations integration with P2P and mobile money support
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

interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface BinanceP2PData {
  symbol: string;
  localCurrency: string;
  buyPrice: number;
  sellPrice: number;
  volume24h: number;
  mobileMoneyMethods: string[];
}

export class BinanceAfricaAdapter extends BaseExchangeAdapter {
  private readonly africanCurrencies = new Set(['NGN', 'ZAR', 'KES', 'GHS', 'UGX', 'TZS']);
  
  private readonly mobileMoneyMapping = new Map([
    ['NGN', [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY]],
    ['ZAR', []], // South Africa uses traditional banking
    ['KES', [MobileMoneyProvider.MPESA, MobileMoneyProvider.AIRTEL_MONEY]],
    ['GHS', [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY]],
    ['UGX', [MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.AIRTEL_MONEY]],
    ['TZS', [MobileMoneyProvider.MPESA, MobileMoneyProvider.AIRTEL_MONEY]]
  ]);

  private readonly complianceMap = new Map([
    ['NG', ComplianceLevel.FULL],
    ['ZA', ComplianceLevel.FULL], 
    ['KE', ComplianceLevel.PARTIAL],
    ['GH', ComplianceLevel.PARTIAL],
    ['UG', ComplianceLevel.PENDING],
    ['TZ', ComplianceLevel.PARTIAL]
  ]);

  constructor(integration: ExchangeIntegration) {
    super(integration);
    logger.info('Binance Africa adapter initialized', {
      region: integration.region,
      supportedCountries: integration.supportedCountries
    });
  }

  /**
   * Fetch market data from Binance with African context
   */
  async fetchMarketData(symbols: string[]): Promise<MarketDataPoint[]> {
    const startTime = Date.now();
    
    try {
      // Get USDT pairs for the symbols (most liquid on Binance)
      const pairs = symbols.map(symbol => `${symbol}USDT`);
      
      // Fetch 24hr ticker statistics for all pairs
      const tickers = await this.fetch24hrTickers(pairs);
      
      // Get P2P data for African markets
      const p2pData = await this.fetchAfricanP2PData(symbols);
      
      // Convert to market data points
      const marketData: MarketDataPoint[] = [];
      
      for (const ticker of tickers) {
        const symbol = ticker.symbol.replace('USDT', '');
        const p2p = p2pData.get(symbol);
        
        const dataPoint = this.convertBinanceTickerToMarketData(ticker, p2p);
        marketData.push(dataPoint);
      }

      const responseTime = Date.now() - startTime;
      logger.info('Binance Africa market data fetch completed', {
        symbols: symbols.length,
        fetchedPairs: tickers.length,
        responseTime
      });

      return marketData;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logger.error('Binance Africa market data fetch failed', {
        error: error.message,
        symbols,
        responseTime
      });
      throw error;
    }
  }

  /**
   * Fetch trading pairs from Binance
   */
  async fetchTradingPairs(): Promise<TradingPair[]> {
    try {
      const exchangeInfo = await this.makeRequest('/api/v3/exchangeInfo');
      const pairs: TradingPair[] = [];

      for (const symbol of exchangeInfo.symbols) {
        if (symbol.status === 'TRADING') {
          // Focus on USDT pairs for African markets
          if (symbol.quoteAsset === 'USDT') {
            pairs.push({
              base: symbol.baseAsset,
              quote: symbol.quoteAsset,
              price: 0, // Will be filled by ticker data
              volume24h: 0, // Will be filled by ticker data
              lastTraded: new Date()
            });
          }
        }
      }

      logger.info('Binance trading pairs fetched', { count: pairs.length });
      return pairs;

    } catch (error: any) {
      logger.error('Failed to fetch Binance trading pairs', { error: error.message });
      throw error;
    }
  }

  /**
   * Normalize symbol for Binance (usually add USDT)
   */
  normalizeSymbol(symbol: string): string {
    if (symbol.includes('USDT')) {
      return symbol;
    }
    return `${symbol}USDT`;
  }

  /**
   * Convert Binance symbol back to standard format
   */
  denormalizeSymbol(binanceSymbol: string): string {
    return binanceSymbol.replace('USDT', '').replace('BUSD', '').replace('BTC', '');
  }

  /**
   * Get African P2P market data with mobile money integration
   */
  async getAfricanP2PData(symbols: string[]): Promise<Map<string, BinanceP2PData>> {
    const p2pData = new Map<string, BinanceP2PData>();

    for (const currency of Array.from(this.africanCurrencies)) {
      for (const symbol of symbols) {
        try {
          // Simulate P2P API call (Binance P2P API is complex and requires special access)
          const p2pPrice = await this.fetchP2PPrice(symbol, currency);
          
          if (p2pPrice) {
            const mobileMethods = this.getMobileMoneyMethods(currency);
            
            p2pData.set(`${symbol}_${currency}`, {
              symbol,
              localCurrency: currency,
              buyPrice: p2pPrice.buy,
              sellPrice: p2pPrice.sell,
              volume24h: p2pPrice.volume,
              mobileMoneyMethods: mobileMethods
            });
          }

        } catch (error: any) {
          logger.debug('Failed to fetch P2P data', { symbol, currency, error: error.message });
        }
      }
    }

    return p2pData;
  }

  /**
   * Get comprehensive African market data
   */
  async getAfricanMarketData(symbols: string[], country: string): Promise<AfricanExchangeData[]> {
    const baseData = await this.fetchMarketData(symbols);
    const countryCode = country.toUpperCase();
    const localCurrency = this.getLocalCurrency(countryCode);
    
    // Get P2P data for the specific country
    const p2pData = await this.getAfricanP2PData(symbols);
    
    // Get local fiat rates
    const fiatRates = await this.fetchFiatRates(localCurrency);

    const africanData: AfricanExchangeData[] = baseData.map(data => {
      const p2pKey = `${data.symbol}_${localCurrency}`;
      const p2p = p2pData.get(p2pKey);
      const rate = fiatRates[localCurrency] || 1;

      return {
        ...data,
        localCurrency: {
          code: localCurrency,
          rate,
          priceLocal: p2p ? (p2p.buyPrice + p2p.sellPrice) / 2 : data.priceUsd * rate
        },
        mobileMoneyIntegration: {
          providers: this.mobileMoneyMapping.get(localCurrency) || [],
          depositMethods: this.getDepositMethods(localCurrency),
          withdrawMethods: this.getWithdrawMethods(localCurrency)
        },
        regulations: {
          country: countryCode,
          compliance: this.complianceMap.get(countryCode) || ComplianceLevel.PENDING,
          restrictions: this.getCountryRestrictions(countryCode)
        }
      };
    });

    logger.info('Binance African market data enriched', {
      country,
      currency: localCurrency,
      dataPoints: africanData.length
    });

    return africanData;
  }

  // ========== Private Methods ==========

  private async fetch24hrTickers(pairs: string[]): Promise<BinanceTicker24hr[]> {
    try {
      // Binance allows fetching multiple tickers in one call
      if (pairs.length === 1) {
        const ticker = await this.makeRequest(`/api/v3/ticker/24hr?symbol=${pairs[0]}`);
        return [ticker];
      } else {
        // Fetch all tickers and filter for our pairs
        const allTickers = await this.makeRequest('/api/v3/ticker/24hr');
        return allTickers.filter((ticker: BinanceTicker24hr) => pairs.includes(ticker.symbol));
      }
    } catch (error: any) {
      logger.error('Failed to fetch Binance 24hr tickers', { pairs, error: error.message });
      throw error;
    }
  }

  private async fetchAfricanP2PData(symbols: string[]): Promise<Map<string, any>> {
    const p2pData = new Map();
    
    // This would integrate with Binance P2P API
    // For now, returning placeholder data
    for (const symbol of symbols) {
      for (const currency of Array.from(this.africanCurrencies)) {
        p2pData.set(`${symbol}_${currency}`, {
          averagePrice: 0, // Would be calculated from P2P orders
          volume24h: 0,
          spread: 0,
          mobileMoney: this.mobileMoneyMapping.get(currency) || []
        });
      }
    }

    return p2pData;
  }

  private convertBinanceTickerToMarketData(
    ticker: BinanceTicker24hr, 
    p2pData?: any
  ): MarketDataPoint {
    const symbol = this.denormalizeSymbol(ticker.symbol);
    const source = this.createDataSource(`/api/v3/ticker/24hr?symbol=${ticker.symbol}`, 50);

    return this.createMarketDataPoint({
      price: ticker.lastPrice,
      priceChange24h: ticker.priceChange,
      changePercent24h: ticker.priceChangePercent,
      volume24h: ticker.volume,
      high24h: ticker.highPrice,
      low24h: ticker.lowPrice,
      marketCap: 0, // Binance doesn't provide market cap in ticker
      pairs: [{
        base: symbol,
        quote: 'USDT',
        price: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume),
        lastTraded: new Date(ticker.closeTime)
      }],
      timestamp: ticker.closeTime,
      bid: ticker.bidPrice,
      ask: ticker.askPrice,
      spread: this.calculateSpread(parseFloat(ticker.bidPrice), parseFloat(ticker.askPrice))
    }, symbol, source);
  }

  private calculateSpread(bid: number, ask: number): number {
    if (bid <= 0 || ask <= 0) return 0;
    return ((ask - bid) / ask) * 100;
  }

  private async fetchP2PPrice(symbol: string, fiat: string): Promise<{ buy: number; sell: number; volume: number } | null> {
    try {
      // This would call Binance P2P API
      // Placeholder implementation
      return {
        buy: 0,
        sell: 0,
        volume: 0
      };
    } catch (error: any) {
      logger.debug('Failed to fetch P2P price', { symbol, fiat, error: error.message });
      return null;
    }
  }

  private getMobileMoneyMethods(currency: string): string[] {
    const providers = this.mobileMoneyMapping.get(currency) || [];
    return providers.map(provider => provider.toLowerCase());
  }

  private getLocalCurrency(countryCode: string): string {
    const currencyMap: Record<string, string> = {
      'NG': 'NGN',
      'ZA': 'ZAR', 
      'KE': 'KES',
      'GH': 'GHS',
      'UG': 'UGX',
      'TZ': 'TZS',
      'RW': 'RWF',
      'ET': 'ETB'
    };

    return currencyMap[countryCode] || 'USD';
  }

  private async fetchFiatRates(currency: string): Promise<Record<string, number>> {
    try {
      // In production, use Binance's fiat price endpoint or external forex API
      const rates: Record<string, number> = {
        'NGN': 770,   // USD to NGN
        'ZAR': 18.5,  // USD to ZAR
        'KES': 145,   // USD to KES
        'GHS': 12,    // USD to GHS
        'UGX': 3700,  // USD to UGX
        'TZS': 2500   // USD to TZS
      };

      return rates;
    } catch (error: any) {
      logger.error('Failed to fetch fiat rates', { currency, error: error.message });
      return { [currency]: 1 };
    }
  }

  private getDepositMethods(currency: string): string[] {
    const methods = ['bank_transfer', 'p2p'];
    const mobileProviders = this.mobileMoneyMapping.get(currency) || [];
    
    return [...methods, ...mobileProviders.map(p => p.toLowerCase())];
  }

  private getWithdrawMethods(currency: string): string[] {
    // Similar to deposit methods for Binance
    return this.getDepositMethods(currency);
  }

  private getCountryRestrictions(countryCode: string): string[] {
    const restrictions: Record<string, string[]> = {
      'NG': ['daily_limit_usd_10000', 'kyc_required'],
      'ZA': ['kyc_required'],
      'KE': ['institutional_verification', 'kyc_required'],
      'GH': ['daily_limit_usd_5000', 'kyc_required'],
      'UG': ['pending_regulation', 'kyc_required'],
      'TZ': ['bank_approval_required', 'kyc_required']
    };

    return restrictions[countryCode] || ['kyc_required'];
  }

  /**
   * Get Binance system status
   */
  async getSystemStatus(): Promise<any> {
    try {
      return await this.makeRequest('/api/v3/ping');
    } catch (error: any) {
      logger.error('Failed to get Binance system status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get server time (useful for API calls that require timestamps)
   */
  async getServerTime(): Promise<number> {
    try {
      const response = await this.makeRequest('/api/v3/time');
      return response.serverTime;
    } catch (error: any) {
      logger.error('Failed to get Binance server time', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check with African market specific checks
   */
  override async healthCheck() {
    try {
      // Check main API
      await this.getSystemStatus();
      
      // Check if we can fetch African market data
      await this.fetch24hrTickers(['BTCUSDT']);
      
      return await super.healthCheck();
    } catch (error: any) {
      logger.warn('Binance Africa health check failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get market depth for a specific symbol
   */
  async getMarketDepth(symbol: string, limit: number = 100): Promise<any> {
    try {
      const binanceSymbol = this.normalizeSymbol(symbol);
      return await this.makeRequest(`/api/v3/depth?symbol=${binanceSymbol}&limit=${limit}`);
    } catch (error: any) {
      logger.error('Failed to get market depth', { symbol, error: error.message });
      throw error;
    }
  }

  /**
   * Get recent trades for analysis
   */
  async getRecentTrades(symbol: string, limit: number = 100): Promise<any> {
    try {
      const binanceSymbol = this.normalizeSymbol(symbol);
      return await this.makeRequest(`/api/v3/trades?symbol=${binanceSymbol}&limit=${limit}`);
    } catch (error: any) {
      logger.error('Failed to get recent trades', { symbol, error: error.message });
      throw error;
    }
  }
}