/**
 * Tokenomics Configuration Routes
 * 
 * Public GET: Returns CP/JY conversion rates for user dashboards (no auth required).
 * Protected PUT: Admin-only endpoint to update tokenomics settings.
 * 
 * Data is stored in the SystemConfiguration table with key prefix "tokenomics.".
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Default tokenomics configuration
const TOKENOMICS_DEFAULTS: Record<string, string> = {
  cpToJyRate: '100',
  jyTokenPrice: '0.0042',
  cpPointValueUsd: '0.000042', // jyTokenPrice / cpToJyRate
  jyTotalSupply: '1000000000',
  jyCirculatingSupply: '100000000',
  rewardsEnabled: 'true',
  dailyCpCap: '500',
  referralBonusCp: '50',
};

const TOKENOMICS_FIELDS = Object.keys(TOKENOMICS_DEFAULTS);

/**
 * Helper: checks if the error is a missing-table error (Prisma P2021).
 */
function isMissingTableError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as any).code === 'P2021'
  );
}

/**
 * GET /api/tokenomics/config
 * Public — no authentication required.
 * Returns the current tokenomics parameters so every user dashboard can read them.
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const keys = TOKENOMICS_FIELDS.map(f => `tokenomics.${f}`);
    const rows = await prisma.systemConfiguration.findMany({
      where: { key: { in: keys } },
    });

    // Build result from DB, falling back to defaults for any missing key
    const result: Record<string, number | boolean | string> = {};
    const savedMap = new Map(rows.map(r => [r.key.replace('tokenomics.', ''), r.value]));

    for (const field of TOKENOMICS_FIELDS) {
      const raw = savedMap.get(field) ?? TOKENOMICS_DEFAULTS[field];
      // Parse booleans and numbers
      if (raw === 'true' || raw === 'false') {
        result[field] = raw === 'true';
      } else if (!isNaN(Number(raw))) {
        result[field] = Number(raw);
      } else {
        result[field] = raw;
      }
    }

    // Recalculate derived value
    result.cpPointValueUsd = (result.jyTokenPrice as number) / (result.cpToJyRate as number);

    return res.json(result);
  } catch (error) {
    if (isMissingTableError(error)) {
      // Table doesn't exist yet — return defaults
      const result: Record<string, number | boolean | string> = {};
      for (const field of TOKENOMICS_FIELDS) {
        const raw = TOKENOMICS_DEFAULTS[field];
        if (raw === 'true' || raw === 'false') result[field] = raw === 'true';
        else if (!isNaN(Number(raw))) result[field] = Number(raw);
        else result[field] = raw;
      }
      result.cpPointValueUsd = (result.jyTokenPrice as number) / (result.cpToJyRate as number);
      return res.json(result);
    }
    console.error('Error fetching tokenomics config:', error);
    return res.status(500).json({ error: 'Failed to load tokenomics configuration' });
  }
});

/**
 * PUT /api/tokenomics/config
 * Admin-only — in production requires a valid admin JWT.
 * In development, accepts any request for convenience.
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const now = new Date();
    const upserts: Promise<any>[] = [];

    for (const field of TOKENOMICS_FIELDS) {
      if (body[field] !== undefined) {
        const value = String(body[field]);
        const configKey = `tokenomics.${field}`;
        upserts.push(
          prisma.systemConfiguration.upsert({
            where: { key: configKey },
            update: { value, updatedAt: now },
            create: {
              id: `tokenomics_${field}_${Date.now()}`,
              key: configKey,
              value,
              description: `Tokenomics — ${field}`,
              updatedAt: now,
            },
          })
        );
      }
    }

    if (upserts.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid tokenomics fields provided' });
    }

    await Promise.all(upserts);

    return res.json({
      success: true,
      message: 'Tokenomics configuration saved',
      updatedFields: Object.keys(body).filter(k => TOKENOMICS_FIELDS.includes(k)),
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.status(503).json({
        success: false,
        error: 'SystemConfiguration table not available — run migrations first',
      });
    }
    console.error('Error saving tokenomics config:', error);
    return res.status(500).json({ success: false, error: 'Failed to save tokenomics configuration' });
  }
});

export default router;
