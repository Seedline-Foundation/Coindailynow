import { Router, Request, Response } from 'express';
import { optionalApiKey, requireApiKey } from '../../middleware/apiKeyAuth';
import { ExchangeRateService } from '../../services/exchangeRateService';
import prisma from '../../lib/prisma';

const router = Router();

function getAggregator(req: Request): any {
  return (req.app as any).locals.marketDataAggregator;
}

function getRedis(req: Request): any {
  return (req.app as any).locals.redis;
}

// ---------------------------------------------------------------------------
// Feature 01 (Blueprint): Bloomberg-style market endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/prices/:symbol
 * Public (optionally accepts API key)
 */
router.get('/prices/:symbol', optionalApiKey, async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    if (!symbol) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'symbol is required' } });
    }

    const aggregator = getAggregator(req);
    if (!aggregator) {
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Market data service not initialized' } });
    }

    const result = await aggregator.getMarketData([symbol], { maxAge: 30, includeAfricanData: true });
    const point = (result?.data || [])[0];
    if (!point) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `No market data for ${symbol}` } });
    }

    return res.json({
      symbol: point.symbol,
      price: point.priceUsd,
      change24h: point.priceChangePercent24h,
      volume24h: point.volume24h,
      marketCap: point.marketCap,
      timestamp: point.timestamp,
      source: point.exchange || point.source,
      cache: result?.cache,
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/v1/historical/:symbol
 * Requires API key
 */
router.get('/historical/:symbol', requireApiKey(), async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    const interval = String(req.query.interval || req.query.timeframe || '1H').toUpperCase().trim();
    const startTime = req.query.start ? new Date(String(req.query.start)) : undefined;
    const endTime = req.query.end ? new Date(String(req.query.end)) : undefined;

    const aggregator = getAggregator(req);
    if (!aggregator) {
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Market data service not initialized' } });
    }

    const data = await aggregator.getHistoricalData(symbol, interval, {
      ...(startTime && !Number.isNaN(startTime.getTime()) ? { startTime } : {}),
      ...(endTime && !Number.isNaN(endTime.getTime()) ? { endTime } : {}),
      includeVolume: true,
    });

    return res.json({ symbol, interval, points: data });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/v1/stablecoin/premiums
 * Requires API key
 * Calculates premium/discount vs USD FX rate.
 */
router.get('/stablecoin/premiums', requireApiKey(), async (req: Request, res: Response) => {
  try {
    const symbols = String(req.query.symbols || 'USDT,USDC').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const fiat = String(req.query.fiat || 'NGN').toUpperCase().trim();

    const aggregator = getAggregator(req);
    if (!aggregator) {
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Market data service not initialized' } });
    }

    const redis = getRedis(req);
    const fx = new ExchangeRateService(redis);
    const usdToFiat = await fx.getUsdRate(fiat);

    // We use African exchange data; localCurrency.priceLocal is interpreted as local fiat per 1 unit.
    const market = await aggregator.getMarketData(symbols, { includeAfricanData: true, localCurrency: fiat, maxAge: 60 });
    const premiums = (market?.data || []).map((p: any) => {
      const local = p?.localCurrency?.priceLocal;
      const official = usdToFiat; // 1 USD -> fiat
      const premium = (Number(local) && official) ? ((Number(local) - official) / official) * 100 : null;
      return {
        symbol: p.symbol,
        fiat,
        localPrice: local ?? null,
        officialUsdRate: official,
        premiumPercent: premium,
        timestamp: p.timestamp,
        exchange: p.exchange,
      };
    });

    return res.json({ fiat, premiums, cache: market?.cache });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/v1/market/sentiment
 * Requires API key
 * Basic sentiment aggregate from latest published articles.
 */
router.get('/market/sentiment', requireApiKey(), async (req: Request, res: Response) => {
  try {
    const prisma = (req.app as any).locals.prisma;
    const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));

    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: { title: true, excerpt: true, content: true, publishedAt: true },
    });

    const bullish = ['surge', 'rally', 'bull', 'breakout', 'pump', 'record high', 'all-time high', 'adoption'];
    const bearish = ['crash', 'dump', 'bear', 'hack', 'exploit', 'ban', 'lawsuit', 'scam'];

    let bullScore = 0;
    let bearScore = 0;

    for (const a of articles) {
      const text = `${a.title || ''} ${a.excerpt || ''} ${a.content || ''}`.toLowerCase();
      for (const w of bullish) if (text.includes(w)) bullScore++;
      for (const w of bearish) if (text.includes(w)) bearScore++;
    }

    const sentiment = bullScore > bearScore ? 'bullish' : bearScore > bullScore ? 'bearish' : 'neutral';
    const total = bullScore + bearScore;
    const confidence = total === 0 ? 0.2 : Math.min(0.95, Math.abs(bullScore - bearScore) / total);

    return res.json({
      sentiment,
      confidence,
      sampleSize: articles.length,
      scores: { bullish: bullScore, bearish: bearScore },
      asOf: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// =============================================
// Bloomberg of Crypto — Granular Price Ticks
// =============================================

/**
 * GET /api/v1/market/ticks/:symbol
 * Query params: exchange, interval (1m,5m,15m,1h,4h,1d), from, to, limit
 */
router.get('/ticks/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const exchange = req.query.exchange as string | undefined;
  const interval = (req.query.interval as string) || '1m';
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const limit = Math.min(parseInt(req.query.limit as string) || 500, 2000);

  try {
    const where: any = {
      symbol: symbol.toUpperCase().replace('-', '/'),
      interval,
      timestamp: { gte: from, lte: to },
    };
    if (exchange) where.exchange = exchange;

    const ticks = await prisma.priceTick.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    if (ticks.length === 0) {
      return res.json({
        data: [],
        meta: { symbol: where.symbol, interval, from, to, count: 0 },
        note: 'No tick data available. Ensure the PriceTick ingestion pipeline is running.',
      });
    }

    return res.json({
      data: ticks,
      meta: { symbol: where.symbol, interval, from, to, count: ticks.length },
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/v1/market/fiat-stablecoin
 * Query params: fiat (NGN,KES,ZAR,GHS), stablecoin (USDT,USDC), exchange
 */
router.get('/fiat-stablecoin', async (req: Request, res: Response) => {
  const fiat = req.query.fiat as string | undefined;
  const stablecoin = req.query.stablecoin as string | undefined;
  const exchange = req.query.exchange as string | undefined;

  try {
    const where: any = {};
    if (fiat) where.fiatCurrency = fiat.toUpperCase();
    if (stablecoin) where.stablecoin = stablecoin.toUpperCase();
    if (exchange) where.exchange = exchange;

    // Get latest snapshot per pair
    const pairs = await prisma.fiatStablecoinPair.findMany({
      where,
      orderBy: { snapshot: 'desc' },
      take: 50,
      distinct: ['fiatCurrency', 'stablecoin', 'exchange'],
    });

    if (pairs.length === 0) {
      // Fallback data
      return res.json({
        data: [
          { fiatCurrency: 'NGN', stablecoin: 'USDT', exchange: 'binance_p2p', buyPrice: 1620, sellPrice: 1600, premiumPct: 3.5, spreadPct: 1.25 },
          { fiatCurrency: 'NGN', stablecoin: 'USDC', exchange: 'luno', buyPrice: 1615, sellPrice: 1595, premiumPct: 3.2, spreadPct: 1.24 },
          { fiatCurrency: 'KES', stablecoin: 'USDT', exchange: 'binance_p2p', buyPrice: 155, sellPrice: 153, premiumPct: 2.1, spreadPct: 1.3 },
          { fiatCurrency: 'ZAR', stablecoin: 'USDT', exchange: 'valr', buyPrice: 19.2, sellPrice: 18.9, premiumPct: 1.8, spreadPct: 1.57 },
          { fiatCurrency: 'GHS', stablecoin: 'USDT', exchange: 'binance_p2p', buyPrice: 15.8, sellPrice: 15.5, premiumPct: 2.5, spreadPct: 1.9 },
        ],
        source: 'fallback',
      });
    }

    return res.json({ data: pairs });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/v1/market/fiat-stablecoin/history
 * Query params: fiat, stablecoin, exchange, from, to, limit
 */
router.get('/fiat-stablecoin/history', async (req: Request, res: Response) => {
  const fiat = (req.query.fiat as string || 'NGN').toUpperCase();
  const stablecoin = (req.query.stablecoin as string || 'USDT').toUpperCase();
  const exchange = req.query.exchange as string | undefined;
  const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const limit = Math.min(parseInt(req.query.limit as string) || 200, 1000);

  try {
    const where: any = {
      fiatCurrency: fiat,
      stablecoin,
      snapshot: { gte: from, lte: to },
    };
    if (exchange) where.exchange = exchange;

    const history = await prisma.fiatStablecoinPair.findMany({
      where,
      orderBy: { snapshot: 'desc' },
      take: limit,
    });

    return res.json({
      data: history,
      meta: { fiat, stablecoin, exchange: exchange || 'all', from, to, count: history.length },
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;
