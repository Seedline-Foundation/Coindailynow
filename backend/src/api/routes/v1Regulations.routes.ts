import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

type CountrySummary = {
  code: string;
  name: string;
  status: string;
  lastUpdate: string;
  summary: string;
  exchanges: string[];
  keyDocs: string[];
};

// Fallback dataset (keeps frontend working even before DB is migrated/seeded)
const fallbackCountries: CountrySummary[] = [
  { code: 'NG', name: 'Nigeria', status: 'Regulated', lastUpdate: '2026-02-10', summary: 'SEC Nigeria requires all VASPs to register. CBN lifted banking ban in 2023. eNaira CBDC in Phase 2.', exchanges: ['Quidax', 'Luno', 'Binance P2P'], keyDocs: ['SEC Digital Assets Framework 2025', 'CBN Circular on VASPs'] },
  { code: 'KE', name: 'Kenya', status: 'Evolving', lastUpdate: '2026-01-28', summary: 'CMA exploring sandbox for digital assets. CBK cautious but not hostile. M-Pesa crypto integrations underway.', exchanges: ['Binance P2P', 'Luno', 'Yellow Card'], keyDocs: ['CMA Capital Markets Master Plan 2023-2027', 'CBK Emerging Payments Discussion Paper'] },
  { code: 'ZA', name: 'South Africa', status: 'Regulated', lastUpdate: '2026-02-05', summary: 'FSCA requires crypto asset service providers to obtain licenses. SARB classifies crypto as financial products.', exchanges: ['Luno', 'VALR', 'Ice3X'], keyDocs: ['FSCA CASP Licensing Framework 2024', 'Financial Sector Regulation Act Amendment'] },
  { code: 'GH', name: 'Ghana', status: 'Cautious', lastUpdate: '2026-01-15', summary: 'SEC Ghana issued warnings but no outright ban. Bank of Ghana developing eCedi CBDC. Sandbox exploration ongoing.', exchanges: ['Binance P2P', 'Yellow Card'], keyDocs: ['SEC Ghana Advisory on Digital Assets', 'Bank of Ghana eCedi White Paper'] },
  { code: 'UG', name: 'Uganda', status: 'Unregulated', lastUpdate: '2025-12-20', summary: 'No specific crypto regulation. Bank of Uganda has issued general warnings. Growing adoption through P2P.', exchanges: ['Binance P2P', 'Yellow Card', 'Luno'], keyDocs: ['BOU Consumer Advisory 2024'] },
  { code: 'TZ', name: 'Tanzania', status: 'Cautious', lastUpdate: '2025-11-30', summary: 'Bank of Tanzania banned crypto transactions in 2019, but enforcement is limited. P2P trading continues.', exchanges: ['Binance P2P'], keyDocs: ['BOT Public Notice on Cryptocurrency 2019'] },
  { code: 'EG', name: 'Egypt', status: 'Restricted', lastUpdate: '2026-01-22', summary: 'CBE prohibits banks from dealing in crypto. However, blockchain technology is encouraged. New fintech law in progress.', exchanges: ['Binance P2P'], keyDocs: ['CBE Circular on Virtual Currencies', 'Draft Fintech Law 2025'] },
  { code: 'MA', name: 'Morocco', status: 'Evolving', lastUpdate: '2026-02-01', summary: 'Bank Al-Maghrib banned crypto in 2017 but is now exploring CBDC and regulatory framework for digital assets.', exchanges: ['Binance P2P'], keyDocs: ['BAM Digital Currency Study 2025', 'AMMC Securities Regulation Update'] },
  { code: 'SN', name: 'Senegal', status: 'WAEMU Rules', lastUpdate: '2025-10-15', summary: 'Subject to BCEAO (WAEMU) regulations. Crypto is not legal tender. Growing DeFi interest. eCFA discussions ongoing.', exchanges: ['Binance P2P', 'Yellow Card'], keyDocs: ['BCEAO Instruction on Digital Money Services'] },
  { code: 'AO', name: 'Angola', status: 'Unregulated', lastUpdate: '2025-09-30', summary: 'No specific cryptocurrency legislation. BNA monitors digital payment developments. Limited exchange access.', exchanges: ['Binance P2P'], keyDocs: ['BNA Financial Stability Report 2025'] },
  { code: 'MZ', name: 'Mozambique', status: 'Unregulated', lastUpdate: '2025-08-20', summary: 'No crypto-specific regulation. Growing mobile money ecosystem could integrate crypto. P2P adoption increasing.', exchanges: ['Binance P2P'], keyDocs: [] },
  { code: 'CI', name: "Côte d'Ivoire", status: 'WAEMU Rules', lastUpdate: '2025-11-10', summary: 'BCEAO rules apply. Abidjan becoming West African fintech hub. Orange Money and crypto overlap growing.', exchanges: ['Binance P2P', 'Yellow Card'], keyDocs: ['BCEAO Instruction on Digital Money Services', 'ARTCI Digital Economy Framework'] },
];

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

/**
 * GET /api/v1/regulations/countries
 */
router.get('/countries', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);

  const rows = await safeQuery(async () => {
    const countries = await prisma.regulatoryCountry.findMany({
      select: {
        code: true,
        name: true,
        statuses: {
          orderBy: { lastUpdated: 'desc' },
          take: 1,
          select: { status: true, lastUpdated: true, notes: true, sourceUrl: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return countries.map((c: any) => ({
      code: c.code,
      name: c.name,
      status: c.statuses?.[0]?.status || 'Unspecified',
      lastUpdate: c.statuses?.[0]?.lastUpdated ? new Date(c.statuses[0].lastUpdated).toISOString().slice(0, 10) : null,
      summary: c.statuses?.[0]?.notes || '',
      sourceUrl: c.statuses?.[0]?.sourceUrl || null,
    }));
  }, null as any);

  if (!rows) return res.json({ data: fallbackCountries });
  return res.json({ data: rows });
});

/**
 * GET /api/v1/regulations/export.csv
 */
router.get('/export.csv', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);

  const data = await safeQuery(async () => {
    const countries = await prisma.regulatoryCountry.findMany({
      include: { statuses: { orderBy: { lastUpdated: 'desc' }, take: 1 } },
      orderBy: { name: 'asc' },
    });
    return countries.map((c: any) => ({
      code: c.code,
      name: c.name,
      status: c.statuses?.[0]?.status || '',
      lastUpdate: c.statuses?.[0]?.lastUpdated ? new Date(c.statuses[0].lastUpdated).toISOString().slice(0, 10) : '',
      sourceUrl: c.statuses?.[0]?.sourceUrl || '',
      notes: (c.statuses?.[0]?.notes || '').replace(/\s+/g, ' ').trim(),
    }));
  }, fallbackCountries.map(c => ({
    code: c.code,
    name: c.name,
    status: c.status,
    lastUpdate: c.lastUpdate,
    sourceUrl: '',
    notes: c.summary.replace(/\s+/g, ' ').trim(),
  })));

  const header = ['code', 'name', 'status', 'lastUpdate', 'sourceUrl', 'notes'];
  const lines = [header.join(',')].concat(
    data.map((row: any) => header.map(h => {
      const v = String(row[h] ?? '');
      const escaped = v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
      return escaped;
    }).join(','))
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="coindaily-regulations.csv"');
  return res.send(lines.join('\n'));
});

/**
 * GET /api/v1/regulations/:countryCode
 */
router.get('/:countryCode', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const code = String(req.params.countryCode || '').toUpperCase().trim();
  if (!code || code.length !== 2) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'countryCode must be 2-letter ISO' } });
  }

  const record = await safeQuery(async () => {
    const c = await prisma.regulatoryCountry.findUnique({
      where: { code },
      include: {
        statuses: { orderBy: { lastUpdated: 'desc' }, take: 1 },
        events: { orderBy: { eventDate: 'desc' }, take: 50 },
        requirements: { orderBy: { licenseType: 'asc' } },
      }
    });
    return c;
  }, null as any);

  if (!record) {
    const fallback = fallbackCountries.find(c => c.code === code);
    if (!fallback) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Country not found' } });
    return res.json({ data: fallback });
  }

  return res.json({ data: record });
});

/**
 * GET /api/v1/regulations/:countryCode/events
 */
router.get('/:countryCode/events', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const code = String(req.params.countryCode || '').toUpperCase().trim();

  const events = await safeQuery(async () => {
    return prisma.regulatoryEvent.findMany({
      where: { countryCode: code },
      orderBy: { eventDate: 'desc' },
      take: 200,
    });
  }, [] as any[]);

  return res.json({ data: events });
});

/**
 * GET /api/v1/regulations/export.csv
 */
/**
 * POST /api/v1/regulations/submissions
 * Community reporting (requires auth) — stored for admin review.
 */
router.post('/submissions', authMiddleware, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = req.user!.id;
  const { countryCode, title, details, sourceUrl } = req.body || {};

  const code = String(countryCode || '').toUpperCase().trim();
  if (!code || code.length !== 2) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'countryCode must be 2-letter ISO' } });
  }
  if (!title || String(title).trim().length < 5) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'title is required (min 5 chars)' } });
  }
  if (!details || String(details).trim().length < 20) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'details is required (min 20 chars)' } });
  }

  const submission = await safeQuery(async () => {
    return prisma.regulatorySubmission.create({
      data: {
        countryCode: code,
        userId,
        title: String(title).trim(),
        details: String(details).trim(),
        sourceUrl: sourceUrl ? String(sourceUrl).trim() : null,
      }
    });
  }, null as any);

  if (!submission) {
    return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Regulatory submissions unavailable (DB not ready)' } });
  }

  return res.status(201).json({ data: submission });
});

export default router;
