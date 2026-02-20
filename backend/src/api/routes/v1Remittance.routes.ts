import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

function getPrisma(req: Request): any {
  return (req.app as any).locals.prisma;
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

const fallbackCorridors = [
  { from: 'USD', to: 'NGN', label: 'US → Nigeria', sourceCurrency: 'USD', destinationCurrency: 'NGN' },
  { from: 'GBP', to: 'NGN', label: 'UK → Nigeria', sourceCurrency: 'GBP', destinationCurrency: 'NGN' },
  { from: 'USD', to: 'KES', label: 'US → Kenya', sourceCurrency: 'USD', destinationCurrency: 'KES' },
  { from: 'EUR', to: 'GHS', label: 'EU → Ghana', sourceCurrency: 'EUR', destinationCurrency: 'GHS' },
  { from: 'USD', to: 'ZAR', label: 'US → South Africa', sourceCurrency: 'USD', destinationCurrency: 'ZAR' },
  { from: 'EUR', to: 'XOF', label: 'EU → West Africa (CFA)', sourceCurrency: 'EUR', destinationCurrency: 'XOF' },
];

const fallbackProviders = [
  { name: 'Western Union', feeUsd: 12.99, rate: 1580, time: '1-3 days', markup: 3.2 },
  { name: 'MoneyGram', feeUsd: 9.99, rate: 1575, time: '1-2 days', markup: 2.8 },
  { name: 'WorldRemit', feeUsd: 3.99, rate: 1560, time: 'Minutes-1 day', markup: 1.8 },
  { name: 'RLUSD (Ripple)', feeUsd: 0.5, rate: 1550, time: '3-5 seconds', markup: 0.5 },
  { name: 'USDC (Circle)', feeUsd: 0.8, rate: 1548, time: '15-60 seconds', markup: 0.4 },
  { name: 'USDT (Tether)', feeUsd: 0.5, rate: 1552, time: '1-5 minutes', markup: 0.6 },
];

/**
 * GET /api/v1/remittance/corridors
 */
router.get('/corridors', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const data = await safeQuery(async () => {
    const rows = await prisma.remittanceCorridor.findMany({
      orderBy: [{ popularRoute: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
    });
    return rows;
  }, null as any);

  if (!data) return res.json({ data: fallbackCorridors });
  return res.json({ data });
});

/**
 * GET /api/v1/remittance/compare?from=USD&to=NGN&amount=500
 * Returns computed provider results for the corridor.
 */
router.get('/compare', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);

  const from = String(req.query.from || req.query.sourceCurrency || 'USD').toUpperCase().trim();
  const to = String(req.query.to || req.query.destinationCurrency || 'NGN').toUpperCase().trim();
  const amount = Math.max(0, Number(req.query.amount || 0));
  if (!amount || !Number.isFinite(amount)) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'amount is required' } });
  }

  const corridor = await safeQuery(async () => {
    return prisma.remittanceCorridor.findFirst({
      where: { sourceCurrency: from, destinationCurrency: to },
      select: { id: true, sourceCurrency: true, destinationCurrency: true },
    });
  }, null as any);

  const dbRates = corridor ? await safeQuery(async () => {
    return prisma.remittanceProviderRate.findMany({
      where: { corridorId: corridor.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }, [] as any[]) : [];

  const providers = dbRates.length > 0
    ? dbRates.map((r: any) => ({
        name: r.providerName,
        feeUsd: Number(r.feeFixed || 0),
        rate: Number(r.sellRate || r.buyRate || 0),
        time: r.processingTime || 'unknown',
        markup: Number(r.feePercentage || 0),
      }))
    : fallbackProviders;

  const results = providers.map((p: any) => {
    const feeUsd = Number(p.feeUsd || 0);
    const rate = Number(p.rate || 0);
    const total = Math.max(0, (amount - feeUsd) * rate);
    return {
      name: p.name,
      fee: feeUsd,
      rate,
      time: p.time,
      markup: Number(p.markup || 0),
      total,
    };
  });

  const wuTotal = results.find(r => r.name.toLowerCase().includes('western union'))?.total ?? (results[0]?.total ?? 0);
  const withSavings = results.map(r => ({ ...r, savings: r.total - wuTotal }));
  const bestOption = withSavings.reduce((a, b) => (a.total > b.total ? a : b), withSavings[0]);

  return res.json({
    data: {
      from,
      to,
      amount,
      bestOption,
      results: withSavings,
    }
  });
});

/**
 * POST /api/v1/remittance/reviews
 */
router.post('/reviews', authMiddleware, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { providerName, rating, reviewText, transactionSuccessful, completedAt } = req.body || {};

  const name = String(providerName || '').trim();
  const r = Number(rating);
  if (!name) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'providerName is required' } });
  if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'rating must be 1-5' } });

  const created = await safeQuery(async () => {
    return prisma.remittanceProviderReview.create({
      data: {
        providerName: name,
        userId: req.user!.id,
        rating: Math.round(r),
        reviewText: reviewText ? String(reviewText).slice(0, 2000) : null,
        transactionSuccessful: transactionSuccessful !== undefined ? Boolean(transactionSuccessful) : null,
        completedAt: completedAt ? new Date(String(completedAt)) : null,
      }
    });
  }, null as any);

  if (!created) {
    return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Reviews unavailable (DB not ready)' } });
  }

  return res.status(201).json({ data: created });
});

export default router;
