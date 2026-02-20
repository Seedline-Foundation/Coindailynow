import { Router, Request, Response } from 'express';

const router = Router();

function getPrisma(req: Request): any {
  return (req.app as any).locals.prisma;
}

function getRedis(req: Request): any {
  return (req.app as any).locals.redis;
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

const fallbackProviders = [
  { name: 'Yellow Card', slug: 'yellowcard', type: 'regulated_exchange', countries: ['NG', 'GH', 'KE', 'UG', 'ZA'], assets: ['USDT', 'USDC', 'BTC'], trustScore: 85 },
  { name: 'Binance P2P', slug: 'binance-p2p', type: 'p2p_marketplace', countries: ['NG', 'GH'], assets: ['USDT', 'USDC', 'BNB'], trustScore: 80 },
  { name: 'Bitnob', slug: 'bitnob', type: 'crypto_remittance', countries: ['NG', 'GH', 'KE'], assets: ['BTC', 'USDT'], trustScore: 78 },
  { name: 'Chipper Cash', slug: 'chipper', type: 'fintech', countries: ['NG', 'GH', 'KE', 'UG', 'TZ'], assets: ['USDC'], trustScore: 76 },
  { name: 'MTN MoMo', slug: 'mtn-momo', type: 'mobile_money', countries: ['GH', 'NG', 'CM', 'CI'], assets: ['NGN', 'GHS', 'XAF', 'XOF'], trustScore: 70 },
];

/**
 * GET /api/v1/onramp/providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const providers = await safeQuery(async () => {
    const rows = await prisma.onRampProvider.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' } });
    return rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      countries: JSON.parse(p.countries || '[]'),
      assets: JSON.parse(p.assets || '[]'),
      trustScore: p.trustScore ?? null,
    }));
  }, null as any);

  if (!providers) return res.json({ data: fallbackProviders });
  return res.json({ data: providers });
});

/**
 * GET /api/v1/onramp/quotes?country=NG&fiat=NGN&amount=100000&asset=USDT
 */
router.get('/quotes', async (req: Request, res: Response) => {
  const redis = getRedis(req);
  const prisma = getPrisma(req);

  const country = String(req.query.country || 'NG').toUpperCase().trim();
  const fiat = String(req.query.fiat || req.query.fiatCurrency || 'NGN').toUpperCase().trim();
  const asset = String(req.query.asset || 'USDT').toUpperCase().trim();
  const amount = Number(req.query.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'amount is required' } });
  }

  const cacheKey = `onramp:quotes:${country}:${fiat}:${asset}:${Math.round(amount)}`;
  const cached = await safeQuery(async () => redis.get(cacheKey), null as any);
  if (cached) {
    return res.json({ data: JSON.parse(cached), cache: { hit: true, ttlSec: await safeQuery(async () => redis.ttl(cacheKey), -1) } });
  }

  const providers = await safeQuery(async () => {
    const rows = await prisma.onRampProvider.findMany({ where: { isActive: true }, take: 50 });
    return rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      countries: JSON.parse(p.countries || '[]'),
      assets: JSON.parse(p.assets || '[]'),
      trustScore: p.trustScore ?? 50,
    }));
  }, fallbackProviders);

  // Stub quote generation: best-effort ranking; real integration plugs in provider adapters.
  const quotes = providers
    .filter((p: any) => (p.countries || []).includes(country) && (p.assets || []).includes(asset))
    .map((p: any) => {
      const feePercent = p.type === 'p2p_marketplace' ? 0.012 : 0.009;
      const feeAmount = amount * feePercent;
      const estRate = 1; // fiat -> stablecoin approx in fiat units per USD is unknown; keep as 1 for placeholder
      const assetAmount = Math.max(0, (amount - feeAmount) * estRate);
      const settlementEta = p.type === 'mobile_money' ? 'instant' : p.type === 'p2p_marketplace' ? '10-60 min' : 'instant-1hr';
      const score = (p.trustScore || 50) - feePercent * 1000;

      return {
        provider: { name: p.name, slug: p.slug, trustScore: p.trustScore || null },
        fiatCurrency: fiat,
        fiatAmount: amount,
        asset,
        assetAmount,
        feeAmount,
        feePercent,
        settlementEta,
        paymentMethod: p.type === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer',
        score,
      };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10);

  const payload = {
    country,
    fiatCurrency: fiat,
    fiatAmount: amount,
    asset,
    quotes,
    asOf: new Date().toISOString(),
  };

  await safeQuery(async () => redis.setex(cacheKey, 30, JSON.stringify(payload)), null);
  return res.json({ data: payload, cache: { hit: false, ttlSec: 30 } });
});

export default router;
