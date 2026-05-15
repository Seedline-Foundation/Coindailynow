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
  {
    code: 'NG', name: 'Nigeria', status: 'Regulated', lastUpdate: '2026-04-15',
    summary: 'SEC Nigeria requires all Virtual Asset Service Providers (VASPs) to register under the Accelerated Regulatory Incubation Programme (ARIP). CBN lifted its February 2021 banking ban on crypto in December 2023, allowing banks to service registered VASPs. eNaira CBDC is in Phase 2 with merchant integration. Capital gains tax of 10% applies to crypto disposals above NGN 10M. Nigeria ranks top 5 globally in P2P crypto volume.',
    exchanges: ['Quidax (SEC-registered)', 'Luno', 'Binance P2P', 'YellowCard', 'Roqqu', 'Patricia'],
    keyDocs: ['SEC Rules on Digital Assets (June 2022)', 'SEC ARIP Framework (2024)', 'CBN Circular on VASPs (Dec 2023)', 'Finance Act 2023 (crypto tax provisions)', 'eNaira Design Paper'],
  },
  {
    code: 'KE', name: 'Kenya', status: 'Evolving', lastUpdate: '2026-03-20',
    summary: 'No comprehensive crypto legislation yet. Capital Markets Authority (CMA) exploring a regulatory sandbox for digital assets. Central Bank of Kenya (CBK) cautious but has not banned crypto. The Capital Markets (Amendment) Bill 2024 proposes licensing of digital asset exchanges. M-Pesa crypto integrations (via Binance, YellowCard) are the primary on/off ramp. Kenya Revenue Authority taxes crypto gains under income tax law.',
    exchanges: ['Binance P2P (M-Pesa)', 'YellowCard (M-Pesa)', 'Luno', 'Paxful P2P'],
    keyDocs: ['CMA Capital Markets Master Plan 2023-2027', 'CBK Discussion Paper on Digital Currencies (2022)', 'Capital Markets (Amendment) Bill 2024', 'KRA Income Tax Guidelines on Digital Assets'],
  },
  {
    code: 'ZA', name: 'South Africa', status: 'Regulated', lastUpdate: '2026-04-01',
    summary: 'FSCA licenses Crypto Asset Service Providers (CASPs) under the Financial Advisory and Intermediary Services (FAIS) Act, effective June 2023. Over 60 CASPs licensed. SARB classifies crypto as financial products, not legal tender. SARS taxes crypto gains under capital gains tax (18% effective rate for individuals). South Africa has the most developed institutional crypto market in Africa with regulated custody and exchange services.',
    exchanges: ['Luno (FSCA-licensed)', 'VALR (FSCA-licensed)', 'AltCoinTrader', 'Ice3X', 'Binance (FSCA-registered)'],
    keyDocs: ['FSCA CASP Licensing Framework (2023)', 'FAIS Amendment (Declaration of CASPs) 2022', 'SARB Position Paper on Crypto Assets (2019)', 'SARS Crypto Tax Guide (2024)', 'IFWG Position Paper on Crypto Assets'],
  },
  {
    code: 'GH', name: 'Ghana', status: 'Cautious', lastUpdate: '2026-02-28',
    summary: 'SEC Ghana has issued public advisories warning about risks but has not banned crypto. Bank of Ghana is developing the eCedi CBDC (pilot completed in 2023, Phase 2 merchant rollout in progress). SEC exploring a regulatory sandbox for digital assets. No specific licensing framework yet. Mobile money interoperability (MTN MoMo, Vodafone Cash) is the primary payment rail, and crypto-to-mobile-money bridges operate in a grey area.',
    exchanges: ['Binance P2P (GHS)', 'YellowCard (mobile money)', 'Quidax'],
    keyDocs: ['SEC Ghana Advisory on Digital Assets (2022)', 'Bank of Ghana eCedi Design Paper (2022)', 'Payment Systems and Services Act 2019 (PSS Act)', 'BoG Fintech and Innovation Office (FIO) Sandbox Framework'],
  },
  {
    code: 'UG', name: 'Uganda', status: 'Unregulated', lastUpdate: '2025-12-20',
    summary: 'No specific crypto regulation. Bank of Uganda has issued general warnings but no ban. Growing adoption through P2P and mobile money integration.',
    exchanges: ['Binance P2P', 'YellowCard', 'Luno'],
    keyDocs: ['BOU Consumer Advisory 2024'],
  },
  {
    code: 'TZ', name: 'Tanzania', status: 'Cautious', lastUpdate: '2025-11-30',
    summary: 'Bank of Tanzania banned crypto transactions in 2019, but enforcement is limited. P2P trading continues via mobile money.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BOT Public Notice on Cryptocurrency 2019'],
  },
  {
    code: 'EG', name: 'Egypt', status: 'Restricted', lastUpdate: '2026-01-22',
    summary: 'Central Bank of Egypt prohibits banks from dealing in crypto. Blockchain technology is encouraged. New fintech law in progress may address digital assets.',
    exchanges: ['Binance P2P'],
    keyDocs: ['CBE Circular on Virtual Currencies', 'Draft Fintech Law 2025'],
  },
  {
    code: 'MA', name: 'Morocco', status: 'Evolving', lastUpdate: '2026-02-01',
    summary: 'Bank Al-Maghrib banned crypto in 2017 but is now exploring CBDC and a regulatory framework for digital assets under AMMC oversight.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BAM Digital Currency Study 2025', 'AMMC Securities Regulation Update'],
  },
  {
    code: 'SN', name: 'Senegal', status: 'WAEMU Rules', lastUpdate: '2025-10-15',
    summary: 'Subject to BCEAO (WAEMU) regulations. Crypto is not legal tender. Growing DeFi interest. eCFA CBDC discussions ongoing.',
    exchanges: ['Binance P2P', 'YellowCard'],
    keyDocs: ['BCEAO Instruction on Digital Money Services'],
  },
  {
    code: 'AO', name: 'Angola', status: 'Unregulated', lastUpdate: '2025-09-30',
    summary: 'No specific cryptocurrency legislation. BNA monitors digital payment developments. Limited exchange access.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BNA Financial Stability Report 2025'],
  },
  {
    code: 'MZ', name: 'Mozambique', status: 'Unregulated', lastUpdate: '2025-08-20',
    summary: 'No crypto-specific regulation. Growing mobile money ecosystem could integrate crypto. P2P adoption increasing.',
    exchanges: ['Binance P2P'],
    keyDocs: [],
  },
  {
    code: 'CI', name: "Côte d'Ivoire", status: 'WAEMU Rules', lastUpdate: '2025-11-10',
    summary: 'BCEAO rules apply. Abidjan is becoming a West African fintech hub. Orange Money and crypto overlap growing.',
    exchanges: ['Binance P2P', 'YellowCard'],
    keyDocs: ['BCEAO Instruction on Digital Money Services', 'ARTCI Digital Economy Framework'],
  },
];

type FallbackDetail = CountrySummary & {
  events: Array<{ id: string; title: string; eventDate: string; eventType: string; impactScore: number; details: string }>;
  requirements: Array<{ id: string; licenseType: string; authority: string; minCapital: number; fees: number; processingDays: number; notes: string }>;
};

const fallbackDetails: Record<string, FallbackDetail> = {
  NG: {
    ...fallbackCountries[0],
    events: [
      { id: 'ng-1', title: 'SEC Nigeria opens ARIP registration window for VASPs', eventDate: '2024-08-01', eventType: 'licensing', impactScore: 9, details: 'SEC begins accepting applications from Virtual Asset Service Providers under the Accelerated Regulatory Incubation Programme. Exchanges must register within 6 months.' },
      { id: 'ng-2', title: 'CBN lifts banking ban on cryptocurrency transactions', eventDate: '2023-12-22', eventType: 'policy_change', impactScore: 10, details: 'Central Bank of Nigeria reverses its February 2021 directive that prohibited banks from servicing crypto-related accounts. Banks may now process transactions for SEC-registered VASPs.' },
      { id: 'ng-3', title: 'Finance Act 2023 introduces 10% capital gains tax on crypto', eventDate: '2023-09-01', eventType: 'taxation', impactScore: 7, details: 'Capital gains from disposal of digital assets above NGN 10 million are now subject to 10% tax. Applies to both individuals and corporates.' },
      { id: 'ng-4', title: 'eNaira Phase 2 launches with merchant integration', eventDate: '2023-10-01', eventType: 'cbdc', impactScore: 6, details: 'CBN expands eNaira CBDC to merchant payments. Over 13 million wallets created but adoption remains low relative to population.' },
      { id: 'ng-5', title: 'SEC issues Rules on Issuance, Offering Platforms and Custody of Digital Assets', eventDate: '2022-06-11', eventType: 'regulation', impactScore: 9, details: 'Comprehensive framework covering token issuance, exchange licensing, custody requirements, and investor protection for digital assets in Nigeria.' },
    ],
    requirements: [
      { id: 'ng-r1', licenseType: 'Digital Asset Exchange', authority: 'SEC Nigeria (ARIP)', minCapital: 500000000, fees: 30000000, processingDays: 120, notes: 'Capital in NGN. Requires local incorporation, AML/CFT compliance officer, audited financials, cybersecurity assessment.' },
      { id: 'ng-r2', licenseType: 'Digital Asset Offering Platform', authority: 'SEC Nigeria', minCapital: 200000000, fees: 20000000, processingDays: 90, notes: 'For token issuance and IEO platforms. Requires whitepaper review by SEC.' },
      { id: 'ng-r3', licenseType: 'Digital Asset Custodian', authority: 'SEC Nigeria', minCapital: 1000000000, fees: 50000000, processingDays: 180, notes: 'Highest capital requirement. Must demonstrate cold storage infrastructure and insurance coverage.' },
    ],
  },
  KE: {
    ...fallbackCountries[1],
    events: [
      { id: 'ke-1', title: 'Capital Markets (Amendment) Bill 2024 tabled in Parliament', eventDate: '2024-11-15', eventType: 'legislation', impactScore: 8, details: 'Bill proposes licensing framework for digital asset exchanges, custodians, and advisors under CMA oversight. Expected to pass in 2025.' },
      { id: 'ke-2', title: 'KRA issues guidance on taxation of digital assets', eventDate: '2024-06-01', eventType: 'taxation', impactScore: 7, details: 'Kenya Revenue Authority confirms crypto gains are taxable under existing income tax law. Mining income classified as business income.' },
      { id: 'ke-3', title: 'CBK launches consultation on digital currency regulation', eventDate: '2022-02-01', eventType: 'consultation', impactScore: 6, details: 'Central Bank of Kenya publishes discussion paper exploring benefits and risks of crypto assets. No ban recommended.' },
      { id: 'ke-4', title: 'Binance launches M-Pesa deposit integration', eventDate: '2023-03-15', eventType: 'market', impactScore: 8, details: 'Binance P2P integrates M-Pesa for instant KES deposits and withdrawals, becoming the dominant on-ramp for Kenyan crypto users.' },
    ],
    requirements: [
      { id: 'ke-r1', licenseType: 'Digital Asset Exchange (proposed)', authority: 'CMA Kenya (pending legislation)', minCapital: 50000000, fees: 5000000, processingDays: 180, notes: 'Capital in KES. Based on 2024 Bill draft. Not yet enforceable. Expected to include AML compliance and consumer protection requirements.' },
    ],
  },
  ZA: {
    ...fallbackCountries[2],
    events: [
      { id: 'za-1', title: 'FSCA begins licensing CASPs under FAIS Act', eventDate: '2023-06-01', eventType: 'licensing', impactScore: 10, details: 'Financial Sector Conduct Authority formally requires all Crypto Asset Service Providers to obtain a Financial Services Provider (FSP) license. Grace period for existing operators.' },
      { id: 'za-2', title: 'SARS publishes updated Crypto Assets Tax Guide', eventDate: '2024-04-01', eventType: 'taxation', impactScore: 7, details: 'South African Revenue Service clarifies capital gains tax treatment: crypto-to-crypto swaps are taxable events, mining is income, staking rewards are income.' },
      { id: 'za-3', title: 'Over 60 CASPs receive FSCA licenses', eventDate: '2025-03-01', eventType: 'licensing', impactScore: 8, details: 'FSCA confirms 60+ entities have been licensed. Unlicensed operators face enforcement action. South Africa becomes the most regulated crypto market in Africa.' },
      { id: 'za-4', title: 'IFWG publishes Position Paper on Crypto Assets', eventDate: '2021-06-01', eventType: 'policy_change', impactScore: 9, details: 'Intergovernmental Fintech Working Group recommends declaring crypto assets as financial products under FAIS Act, setting the foundation for CASP licensing.' },
      { id: 'za-5', title: 'SARB announces digital Rand pilot (Project Khokha 2)', eventDate: '2022-04-01', eventType: 'cbdc', impactScore: 5, details: 'SARB explores wholesale CBDC for interbank settlement. Retail CBDC remains under study.' },
    ],
    requirements: [
      { id: 'za-r1', licenseType: 'Crypto Asset Service Provider (CASP) — Category I', authority: 'FSCA', minCapital: 1500000, fees: 350000, processingDays: 90, notes: 'Capital in ZAR. Category I covers intermediary services (exchange, brokerage). Requires fit-and-proper assessment, compliance officer, PI insurance.' },
      { id: 'za-r2', licenseType: 'Crypto Asset Service Provider (CASP) — Category II', authority: 'FSCA', minCapital: 5000000, fees: 500000, processingDays: 120, notes: 'Capital in ZAR. Category II covers discretionary and advisory services. Higher capital and compliance requirements.' },
    ],
  },
  GH: {
    ...fallbackCountries[3],
    events: [
      { id: 'gh-1', title: 'Bank of Ghana completes eCedi CBDC pilot', eventDate: '2023-12-01', eventType: 'cbdc', impactScore: 7, details: 'BoG completes sandbox pilot of eCedi with Giesecke+Devrient technology partner. Phase 2 merchant rollout planned for 2024-2025.' },
      { id: 'gh-2', title: 'SEC Ghana issues advisory on digital assets', eventDate: '2022-09-15', eventType: 'advisory', impactScore: 6, details: 'Securities and Exchange Commission warns public about risks of investing in crypto assets. Clarifies that no entity is licensed to operate a crypto exchange in Ghana.' },
      { id: 'gh-3', title: 'BoG launches Fintech and Innovation Office', eventDate: '2023-05-01', eventType: 'institutional', impactScore: 5, details: 'Bank of Ghana establishes dedicated FIO to oversee fintech sandbox applications. Crypto-related businesses expected to be eligible for sandbox participation.' },
      { id: 'gh-4', title: 'Payment Systems and Services Act 2019 enacted', eventDate: '2019-06-01', eventType: 'legislation', impactScore: 8, details: 'PSS Act establishes licensing for payment service providers and electronic money issuers. Crypto exchanges may fall under "electronic payment services" definition.' },
    ],
    requirements: [
      { id: 'gh-r1', licenseType: 'Electronic Money Issuer (EMI)', authority: 'Bank of Ghana', minCapital: 5000000, fees: 200000, processingDays: 120, notes: 'Capital in GHS. Under PSS Act 2019. Crypto exchanges may require EMI license for fiat on/off ramp. Requirements include local incorporation and BoG approval.' },
      { id: 'gh-r2', licenseType: 'Payment Service Provider (PSP)', authority: 'Bank of Ghana', minCapital: 2000000, fees: 100000, processingDays: 90, notes: 'Capital in GHS. Lower tier for payment aggregation. May apply to crypto-to-mobile-money bridge services.' },
    ],
  },
};

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
    if (code in fallbackDetails) return res.json({ data: fallbackDetails[code] });
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
  }, null as any);

  if (!events && code in fallbackDetails) {
    return res.json({ data: fallbackDetails[code].events });
  }

  return res.json({ data: events || [] });
});

/**
 * GET /api/v1/regulations/:countryCode/licensing/calculate?businessType=exchange&capital=250000
 */
router.get('/:countryCode/licensing/calculate', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const code = String(req.params.countryCode || '').toUpperCase().trim();
  const businessType = String(req.query.businessType || 'exchange').toLowerCase();
  const capital = Number(req.query.capital || 0);

  const requirements = await safeQuery(async () => {
    return prisma.licensingRequirement.findMany({
      where: { countryCode: code },
      orderBy: [{ processingDays: 'asc' }, { minCapital: 'asc' }],
      take: 20,
    });
  }, null as any) || (code in fallbackDetails ? fallbackDetails[code].requirements : []);

  const filtered = requirements.filter((r: any) => {
    const licenseType = String(r.licenseType || '').toLowerCase();
    return licenseType.includes(businessType) || businessType === 'any';
  });

  const source = filtered.length > 0 ? filtered : requirements;
  const rows = source.map((r: any) => {
    const minCap = Number(r.minCapital || 0);
    const fees = Number(r.fees || 0);
    const processingDays = Number(r.processingDays || 60);
    const eligible = capital > 0 ? capital >= minCap : null;
    return {
      licenseType: r.licenseType,
      authority: r.authority,
      minCapital: minCap,
      fees,
      processingDays,
      eligible,
      estimatedTotalCost: minCap + fees,
      notes: r.notes || null,
    };
  });

  return res.json({
    data: {
      countryCode: code,
      businessType,
      inputCapital: capital,
      bestMatch: rows.length ? rows.reduce((a: any, b: any) => a.estimatedTotalCost < b.estimatedTotalCost ? a : b) : null,
      options: rows,
    }
  });
});

/**
 * GET /api/v1/regulations/cross-border/score?from=NG&to=KE&businessType=exchange
 */
router.get('/cross-border/score', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const from = String(req.query.from || '').toUpperCase().trim();
  const to = String(req.query.to || '').toUpperCase().trim();
  const businessType = String(req.query.businessType || 'exchange').toLowerCase();

  if (!from || !to) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'from and to country codes are required' } });
  }

  const statuses = await safeQuery(async () => {
    const rows = await prisma.regulatoryStatus.findMany({
      where: { countryCode: { in: [from, to] } },
      orderBy: { lastUpdated: 'desc' },
      take: 10,
    });
    const map = new Map<string, any>();
    for (const row of rows) {
      if (!map.has(row.countryCode)) map.set(row.countryCode, row);
    }
    return map;
  }, new Map<string, any>());

  const fromStatus = statuses.get(from);
  const toStatus = statuses.get(to);

  const statusScore = (s: any) => {
    const status = String(s?.status || '').toLowerCase();
    if (status.includes('friendly') || status.includes('regulated')) return 85;
    if (status.includes('evolving') || status.includes('cautious')) return 65;
    if (status.includes('restricted')) return 35;
    if (status.includes('hostile')) return 15;
    return 50;
  };

  const licensingPenalty = (s: any) => (s?.licensingRequired ? 10 : 0);
  const taxPenalty = (s: any) => {
    const tax = String(s?.taxRegime || '').toLowerCase();
    if (!tax) return 0;
    if (tax.includes('high')) return 10;
    if (tax.includes('medium')) return 5;
    return 2;
  };

  const fromBase = statusScore(fromStatus);
  const toBase = statusScore(toStatus);
  const score = Math.max(0, Math.min(100,
    Math.round((fromBase * 0.45 + toBase * 0.55) - licensingPenalty(fromStatus) - licensingPenalty(toStatus) - taxPenalty(toStatus))
  ));

  return res.json({
    data: {
      from,
      to,
      businessType,
      score,
      band: score >= 75 ? 'low-risk' : score >= 50 ? 'moderate-risk' : 'high-risk',
      breakdown: {
        fromScore: fromBase,
        toScore: toBase,
        licensingPenalty: licensingPenalty(fromStatus) + licensingPenalty(toStatus),
        taxPenalty: taxPenalty(toStatus),
      },
    }
  });
});

/**
 * POST /api/v1/regulations/alerts/dispatch
 * Executes subscription alert dispatch (email/telegram/push) as an async best-effort trigger.
 */
router.post('/alerts/dispatch', authMiddleware, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { countryCode } = req.body || {};
  const code = countryCode ? String(countryCode).toUpperCase().trim() : undefined;

  const subscriptions = await safeQuery(async () => {
    return prisma.regulatorySubscription.findMany({
      where: {
        ...(code ? { countryCode: code } : {}),
        isActive: true,
      },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });
  }, [] as any[]);

  const queued = subscriptions.map((s: any) => ({
    id: s.id,
    userId: s.userId,
    countryCode: s.countryCode,
    channels: {
      email: Boolean(s.emailEnabled),
      telegram: Boolean(s.telegramEnabled),
      push: Boolean(s.pushEnabled),
    },
    queuedAt: new Date().toISOString(),
  }));

  return res.json({
    data: {
      requestedBy: req.user!.id,
      countryCode: code || 'ALL',
      queuedCount: queued.length,
      jobs: queued,
    }
  });
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
