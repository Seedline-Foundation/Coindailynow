import { Router, Request, Response } from 'express';

const router = Router();

function getAggregator(req: Request): any {
  return (req.app as any).locals.marketDataAggregator;
}

/**
 * GET /api/market-data?symbols=BTC,ETH
 */
router.get('/market-data', async (req: Request, res: Response) => {
  try {
    const symbols = String(req.query.symbols || 'BTC,ETH')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const aggregator = getAggregator(req);
    if (!aggregator) {
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Market data service not initialized' } });
    }

    const result = await aggregator.getMarketData(symbols, { maxAge: 30, includeAfricanData: true });
    const mapped = (result?.data || []).map((p: any) => ({
      symbol: p.symbol,
      price: p.priceUsd,
      change24h: p.priceChangePercent24h,
      volume24h: p.volume24h,
      marketCap: p.marketCap,
      lastUpdated: new Date(p.timestamp).toISOString(),
    }));

    return res.json(mapped);
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/market-data/:symbol/chart?timeframe=1H
 */
router.get('/market-data/:symbol/chart', async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    const timeframe = String(req.query.timeframe || '1H').toUpperCase().trim();

    const aggregator = getAggregator(req);
    if (!aggregator) {
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Market data service not initialized' } });
    }

    const points = await aggregator.getHistoricalData(symbol, timeframe, { includeVolume: true });
    const mapped = (points || []).map((p: any) => ({
      timestamp: new Date(p.timestamp).getTime(),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));

    return res.json(mapped);
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/african-exchanges
 */
router.get('/african-exchanges', async (req: Request, res: Response) => {
  try {
    const aggregator = getAggregator(req);
    if (!aggregator) {
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Market data service not initialized' } });
    }

    const symbols = ['BTC', 'ETH'];
    const data = await aggregator.getMarketData(symbols, { includeAfricanData: true, localCurrency: 'NGN', maxAge: 60 });

    const byExchange: Record<string, any> = {};
    for (const p of data.data || []) {
      const name = String(p.exchange || 'unknown');
      byExchange[name] = byExchange[name] || {
        name,
        btcPrice: 0,
        ethPrice: 0,
        tradingFee: 0.01,
        depositMethods: ['Bank Transfer', 'P2P', 'Mobile Money'],
        supportedCountries: ['NG', 'GH', 'KE', 'ZA'],
      };
      if (p.symbol === 'BTC') byExchange[name].btcPrice = p.priceUsd;
      if (p.symbol === 'ETH') byExchange[name].ethPrice = p.priceUsd;
    }

    return res.json(byExchange);
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/mobile-money-rates
 */
router.get('/mobile-money-rates', async (_req: Request, res: Response) => {
  return res.json({});
});

export default router;
