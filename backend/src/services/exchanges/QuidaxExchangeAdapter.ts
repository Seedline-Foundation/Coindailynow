import { BaseExchangeAdapter } from './BaseExchangeAdapter';
import {
  MarketDataPoint,
  ExchangeIntegration,
  TradingPair,
  DataSource,
} from '../../types/market-data';
import { logger } from '../../utils/logger';

type QuidaxTicker = {
  market: string;
  ticker?: {
    high?: string;
    low?: string;
    buy?: string;
    sell?: string;
    last?: string;
    vol?: string;
  };
};

export class QuidaxExchangeAdapter extends BaseExchangeAdapter {
  private readonly supportedMarkets = new Map<string, string[]>([
    ['BTC', ['btcngn', 'btcusdt']],
    ['ETH', ['ethngn', 'ethusdt']],
    ['USDT', ['usdtngn']],
    ['USDC', ['usdcngn']],
    ['BNB', ['bnbngn', 'bnbusdt']],
    ['SOL', ['solngn', 'solusdt']],
  ]);

  constructor(integration: ExchangeIntegration) {
    super(integration);
    logger.info('Quidax exchange adapter initialized', {
      region: integration.region,
      supportedCountries: integration.supportedCountries,
    });
  }

  async fetchMarketData(symbols: string[]): Promise<MarketDataPoint[]> {
    const output: MarketDataPoint[] = [];
    const markets = this.symbolsToMarkets(symbols);

    for (const market of markets) {
      try {
        const response = await this.makeRequest(`/markets/tickers/${market}`, 'GET');
        const data = this.extractTicker(response, market);
        if (!data) continue;

        const source: DataSource = this.createDataSource(`/markets/tickers/${market}`, 220);
        const symbol = this.denormalizeSymbol(market);
        output.push(this.toMarketDataPoint(symbol, market, data, source));
      } catch (error: any) {
        logger.debug('Quidax ticker fetch failed', {
          market,
          error: error?.message || 'unknown_error',
        });
      }
    }

    return output;
  }

  async fetchTradingPairs(): Promise<TradingPair[]> {
    const pairs: TradingPair[] = [];
    for (const marketList of this.supportedMarkets.values()) {
      for (const market of marketList) {
        pairs.push({
          base: this.denormalizeSymbol(market),
          quote: market.endsWith('ngn') ? 'NGN' : 'USDT',
          price: 0,
          volume24h: 0,
          lastTraded: new Date(),
        });
      }
    }
    return pairs;
  }

  normalizeSymbol(symbol: string): string {
    const code = String(symbol || '').toUpperCase().trim();
    const list = this.supportedMarkets.get(code);
    return list?.[0] || `${code.toLowerCase()}usdt`;
  }

  denormalizeSymbol(exchangeSymbol: string): string {
    const m = String(exchangeSymbol || '').toLowerCase();
    if (m.startsWith('btc')) return 'BTC';
    if (m.startsWith('eth')) return 'ETH';
    if (m.startsWith('usdt')) return 'USDT';
    if (m.startsWith('usdc')) return 'USDC';
    if (m.startsWith('bnb')) return 'BNB';
    if (m.startsWith('sol')) return 'SOL';
    return m.slice(0, 3).toUpperCase();
  }

  private symbolsToMarkets(symbols: string[]): string[] {
    const markets: string[] = [];
    for (const symbol of symbols) {
      const key = String(symbol || '').toUpperCase().trim();
      const mapped = this.supportedMarkets.get(key);
      if (mapped?.length) {
        markets.push(mapped[0]);
      } else {
        markets.push(`${key.toLowerCase()}usdt`);
      }
    }
    return Array.from(new Set(markets));
  }

  private extractTicker(payload: any, market: string): QuidaxTicker['ticker'] | null {
    if (!payload) return null;

    if (payload?.ticker && typeof payload.ticker === 'object') {
      return payload.ticker;
    }

    if (payload?.data?.ticker && typeof payload.data.ticker === 'object') {
      return payload.data.ticker;
    }

    if (payload?.data && typeof payload.data === 'object') {
      const row = payload.data[market] || payload.data[market.toUpperCase()] || payload.data[market.toLowerCase()];
      if (row?.ticker) return row.ticker;
      if (row && typeof row === 'object') return row;
    }

    return null;
  }

  private toMarketDataPoint(symbol: string, market: string, ticker: any, source: DataSource): MarketDataPoint {
    const last = this.parsePrice(ticker.last ?? ticker.sell ?? ticker.buy);
    const high = this.parsePrice(ticker.high ?? last);
    const low = this.parsePrice(ticker.low ?? last);
    const bid = this.parsePrice(ticker.buy ?? last);
    const ask = this.parsePrice(ticker.sell ?? last);
    const volume = this.parseVolume(ticker.vol ?? ticker.volume ?? 0);

    return this.createMarketDataPoint({
      price: last,
      high24h: high,
      low24h: low,
      volume24h: volume,
      marketCap: 0,
      priceChange24h: 0,
      changePercent24h: 0,
      bid,
      ask,
      pairs: [{
        base: symbol,
        quote: market.endsWith('ngn') ? 'NGN' : 'USDT',
        price: last,
        volume24h: volume,
        lastTraded: new Date(),
      }],
      timestamp: Date.now(),
    }, symbol, source);
  }
}
