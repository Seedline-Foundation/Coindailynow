/**
 * API Route: Crypto Policies Dashboard
 * Aggregates regulatory data from backend /api/v1/regulations/* endpoints
 * with comprehensive fallback data when backend is unavailable.
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// ━━━━ Types ━━━━

export interface CountryPolicy {
  code: string;
  name: string;
  flag: string;
  region: string;
  status: 'Regulated' | 'Evolving' | 'Cautious' | 'Restricted' | 'Unregulated' | 'WAEMU Rules' | 'Banned';
  lastUpdate: string;
  summary: string;
  exchanges: string[];
  keyDocs: string[];
  cbdc: string | null;
  regulatoryBody: string;
  taxRegime: string;
  licensingRequired: boolean;
  events: PolicyEvent[];
  upcomingPolicies: UpcomingPolicy[];
}

export interface PolicyEvent {
  id: string;
  date: string;
  type: 'new_regulation' | 'amendment' | 'announcement' | 'enforcement' | 'consultation' | 'cbdc_update';
  title: string;
  description: string;
  impactScore: number; // 1-10
  source: string;
}

export interface UpcomingPolicy {
  id: string;
  country: string;
  countryCode: string;
  title: string;
  expectedDate: string;
  status: 'proposed' | 'draft' | 'consultation' | 'pending_approval' | 'scheduled';
  description: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PolicyStats {
  totalCountries: number;
  regulated: number;
  evolving: number;
  cautious: number;
  restricted: number;
  unregulated: number;
  waemu: number;
  totalEvents: number;
  recentEvents: number; // last 30 days
  upcomingPolicies: number;
  newReleasesThisMonth: number;
}

// ━━━━ Comprehensive Fallback Data ━━━━

const FALLBACK_COUNTRIES: CountryPolicy[] = [
  {
    code: 'NG', name: 'Nigeria', flag: '🇳🇬', region: 'West Africa',
    status: 'Regulated', lastUpdate: '2026-02-10',
    summary: 'SEC Nigeria requires all VASPs to register. CBN lifted banking ban in 2023. eNaira CBDC in Phase 2. All crypto exchanges must comply with AML/CFT requirements.',
    exchanges: ['Quidax', 'Luno', 'Binance P2P', 'Patricia', 'Roqqu'],
    keyDocs: ['SEC Digital Assets Framework 2025', 'CBN Circular on VASPs', 'NFIU Crypto AML Guidelines'],
    cbdc: 'eNaira (Phase 2 — Merchant Integration)',
    regulatoryBody: 'SEC Nigeria / CBN',
    taxRegime: '10% capital gains tax on crypto profits',
    licensingRequired: true,
    events: [
      { id: 'ng-1', date: '2026-02-10', type: 'new_regulation', title: 'SEC Updates VASP Registration Requirements', description: 'SEC Nigeria released updated compliance checklist for Virtual Asset Service Providers including enhanced KYC/AML requirements.', impactScore: 8, source: 'SEC Nigeria Gazette' },
      { id: 'ng-2', date: '2026-01-25', type: 'enforcement', title: 'CBN Fines Two Unlicensed Exchanges', description: 'Central Bank of Nigeria penalized two crypto exchanges operating without proper registration with N50M fines each.', impactScore: 7, source: 'CBN Press Release' },
      { id: 'ng-3', date: '2026-01-15', type: 'cbdc_update', title: 'eNaira Phase 2 Merchant Rollout', description: 'CBN expanded eNaira to 15,000 merchant points across Lagos, Abuja, and Port Harcourt.', impactScore: 6, source: 'eNaira.gov.ng' },
      { id: 'ng-4', date: '2025-12-20', type: 'amendment', title: 'NFIU Updates Crypto Transaction Reporting Threshold', description: 'NFIU lowered crypto transaction reporting threshold from $10,000 to $5,000 equivalent.', impactScore: 7, source: 'NFIU Circular' },
    ],
    upcomingPolicies: [
      { id: 'ng-up-1', country: 'Nigeria', countryCode: 'NG', title: 'Stablecoin Regulation Framework', expectedDate: '2026-Q2', status: 'draft', description: 'SEC drafting specific framework for stablecoin issuance and trading in Nigeria.', impactLevel: 'high' },
      { id: 'ng-up-2', country: 'Nigeria', countryCode: 'NG', title: 'DeFi Protocol Registration Mandate', expectedDate: '2026-Q3', status: 'proposed', description: 'Proposed requirement for DeFi protocols serving Nigerian users to register with SEC.', impactLevel: 'critical' },
    ],
  },
  {
    code: 'KE', name: 'Kenya', flag: '🇰🇪', region: 'East Africa',
    status: 'Evolving', lastUpdate: '2026-01-28',
    summary: 'CMA exploring sandbox for digital assets. CBK cautious but not hostile. M-Pesa crypto integrations underway. Capital Markets Act amendments pending.',
    exchanges: ['Binance P2P', 'Luno', 'Yellow Card', 'LocalBitcoins'],
    keyDocs: ['CMA Capital Markets Master Plan 2023-2027', 'CBK Emerging Payments Discussion Paper', 'Draft Virtual Assets Bill 2025'],
    cbdc: 'Under Study (CBK Digital Currency Feasibility)',
    regulatoryBody: 'CMA / CBK',
    taxRegime: 'Proposed 3% digital asset tax (Finance Bill 2025)',
    licensingRequired: false,
    events: [
      { id: 'ke-1', date: '2026-01-28', type: 'consultation', title: 'CMA Opens Public Comment on Digital Assets Sandbox', description: 'Capital Markets Authority opened 60-day public consultation period for proposed digital assets regulatory sandbox.', impactScore: 8, source: 'CMA Kenya' },
      { id: 'ke-2', date: '2026-01-10', type: 'announcement', title: 'Safaricom Partners with Binance for M-Pesa Integration', description: 'M-Pesa users can now buy crypto directly via Binance P2P with M-Pesa wallet.', impactScore: 9, source: 'TechWeez' },
      { id: 'ke-3', date: '2025-12-15', type: 'new_regulation', title: 'Finance Bill 2025 Proposes 3% Digital Asset Tax', description: 'Kenya Revenue Authority proposes 3% tax on all digital asset transactions above KES 500,000.', impactScore: 8, source: 'Kenya Gazette' },
    ],
    upcomingPolicies: [
      { id: 'ke-up-1', country: 'Kenya', countryCode: 'KE', title: 'Virtual Assets Bill 2026', expectedDate: '2026-Q2', status: 'pending_approval', description: 'Comprehensive virtual assets legislation currently before Parliament for second reading.', impactLevel: 'critical' },
      { id: 'ke-up-2', country: 'Kenya', countryCode: 'KE', title: 'CMA Digital Assets Sandbox Launch', expectedDate: '2026-Q3', status: 'consultation', description: 'Regulatory sandbox for qualifying crypto/DeFi startups.', impactLevel: 'high' },
    ],
  },
  {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'Southern Africa',
    status: 'Regulated', lastUpdate: '2026-02-05',
    summary: 'FSCA requires crypto asset service providers (CASPs) to obtain licenses. SARB classifies crypto as financial products. Most advanced regulatory framework in Africa.',
    exchanges: ['Luno', 'VALR', 'Ice3X', 'AltCoinTrader', 'Ovex'],
    keyDocs: ['FSCA CASP Licensing Framework 2024', 'Financial Sector Regulation Act Amendment', 'SARB Crypto Assets Position Paper'],
    cbdc: 'Project Khokha (Phase 2 Complete)',
    regulatoryBody: 'FSCA / SARB',
    taxRegime: 'Capital gains tax (18%-45% marginal rate)',
    licensingRequired: true,
    events: [
      { id: 'za-1', date: '2026-02-05', type: 'enforcement', title: 'FSCA Revokes License of Non-Compliant CASP', description: 'FSCA revoked the license of a crypto exchange for failing to meet KYC/AML requirements within the 6-month grace period.', impactScore: 7, source: 'FSCA Gazette' },
      { id: 'za-2', date: '2026-01-20', type: 'new_regulation', title: 'SARB Publishes Stablecoin Guidelines', description: 'South African Reserve Bank issued guidelines defining stablecoins as financial instruments requiring bank-level oversight.', impactScore: 9, source: 'SARB Papers' },
      { id: 'za-3', date: '2025-12-10', type: 'cbdc_update', title: 'Project Khokha Phase 2 Results Published', description: 'SARB completed wholesale CBDC testing showing 70% improvement in cross-border settlement times.', impactScore: 6, source: 'SARB' },
    ],
    upcomingPolicies: [
      { id: 'za-up-1', country: 'South Africa', countryCode: 'ZA', title: 'Travel Rule Implementation Deadline', expectedDate: '2026-06-30', status: 'scheduled', description: 'All CASPs must comply with FATF Travel Rule for crypto transfers above R1,000.', impactLevel: 'high' },
    ],
  },
  {
    code: 'GH', name: 'Ghana', flag: '🇬🇭', region: 'West Africa',
    status: 'Cautious', lastUpdate: '2026-01-15',
    summary: 'SEC Ghana issued warnings but no outright ban. Bank of Ghana developing eCedi CBDC. Sandbox exploration ongoing. Growing fintech interest.',
    exchanges: ['Binance P2P', 'Yellow Card', 'Bundle Africa'],
    keyDocs: ['SEC Ghana Advisory on Digital Assets', 'Bank of Ghana eCedi White Paper', 'Payment Systems Act Amendment 2025'],
    cbdc: 'eCedi (Pilot Phase)',
    regulatoryBody: 'SEC Ghana / Bank of Ghana',
    taxRegime: 'No specific crypto tax law (general income tax applies)',
    licensingRequired: false,
    events: [
      { id: 'gh-1', date: '2026-01-15', type: 'announcement', title: 'Bank of Ghana Launches eCedi Pilot', description: 'eCedi CBDC pilot launched with 5 partner banks across Accra and Kumasi metropolitan areas.', impactScore: 8, source: 'Bank of Ghana' },
      { id: 'gh-2', date: '2025-11-20', type: 'consultation', title: 'SEC Ghana Seeks Input on Crypto Framework', description: 'SEC Ghana published request for information from industry stakeholders on proposed digital asset framework.', impactScore: 7, source: 'SEC Ghana' },
    ],
    upcomingPolicies: [
      { id: 'gh-up-1', country: 'Ghana', countryCode: 'GH', title: 'Digital Assets Regulatory Framework', expectedDate: '2026-Q4', status: 'proposed', description: 'Comprehensive framework for crypto regulation expected after current consultation period ends.', impactLevel: 'high' },
    ],
  },
  {
    code: 'ET', name: 'Ethiopia', flag: '🇪🇹', region: 'East Africa',
    status: 'Restricted', lastUpdate: '2025-12-01',
    summary: 'National Bank of Ethiopia prohibits crypto trading. However, Ethiopia hosts major Bitcoin mining operations. Telebirr mobile money expanding rapidly.',
    exchanges: ['P2P only'],
    keyDocs: ['NBE Foreign Exchange Directive 2024', 'ICT Sector Digital Economy Strategy'],
    cbdc: 'Under Discussion',
    regulatoryBody: 'National Bank of Ethiopia',
    taxRegime: 'N/A (crypto trading prohibited)',
    licensingRequired: false,
    events: [
      { id: 'et-1', date: '2025-12-01', type: 'announcement', title: 'Ethiopia Bitcoin Mining Reaches 600MW', description: 'Grand Renaissance Dam hydropower enables Ethiopia to become Africa\'s largest Bitcoin mining hub.', impactScore: 7, source: 'Reuters Africa' },
    ],
    upcomingPolicies: [
      { id: 'et-up-1', country: 'Ethiopia', countryCode: 'ET', title: 'Digital Currency Study Commission', expectedDate: '2026-Q3', status: 'proposed', description: 'NBE forming commission to study potential benefits of regulated crypto market.', impactLevel: 'medium' },
    ],
  },
  {
    code: 'RW', name: 'Rwanda', flag: '🇷🇼', region: 'East Africa',
    status: 'Evolving', lastUpdate: '2026-01-05',
    summary: 'Rwanda is positioning as innovation hub. National Bank of Rwanda exploring regulatory sandbox. Blockchain-based land registry operational.',
    exchanges: ['Binance P2P', 'Yellow Card'],
    keyDocs: ['BNR Fintech Sandbox Framework 2025', 'ICT Hub Strategy 2024-2029'],
    cbdc: 'Feasibility Study Phase',
    regulatoryBody: 'BNR / RISA',
    taxRegime: 'No specific crypto tax framework',
    licensingRequired: false,
    events: [
      { id: 'rw-1', date: '2026-01-05', type: 'new_regulation', title: 'BNR Opens Fintech Regulatory Sandbox', description: 'National Bank of Rwanda launched sandbox accepting applications from crypto and blockchain startups.', impactScore: 8, source: 'BNR' },
    ],
    upcomingPolicies: [
      { id: 'rw-up-1', country: 'Rwanda', countryCode: 'RW', title: 'Virtual Asset Service Provider Act', expectedDate: '2026-Q4', status: 'draft', description: 'Draft legislation for VASP registration and compliance requirements.', impactLevel: 'high' },
    ],
  },
  {
    code: 'UG', name: 'Uganda', flag: '🇺🇬', region: 'East Africa',
    status: 'Unregulated', lastUpdate: '2025-12-20',
    summary: 'No specific crypto regulation. Bank of Uganda has issued general warnings. Growing adoption through P2P. Binance P2P showing strong volume.',
    exchanges: ['Binance P2P', 'Yellow Card', 'Luno'],
    keyDocs: ['BOU Consumer Advisory 2024'],
    cbdc: 'No plans announced',
    regulatoryBody: 'Bank of Uganda',
    taxRegime: 'Unclear (no specific guidelines)',
    licensingRequired: false,
    events: [],
    upcomingPolicies: [],
  },
  {
    code: 'TZ', name: 'Tanzania', flag: '🇹🇿', region: 'East Africa',
    status: 'Cautious', lastUpdate: '2025-11-30',
    summary: 'Bank of Tanzania banned crypto transactions in 2019 but enforcement is limited. P2P trading continues. Growing demand for regulatory clarity.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BOT Public Notice on Cryptocurrency 2019'],
    cbdc: 'No plans announced',
    regulatoryBody: 'Bank of Tanzania',
    taxRegime: 'N/A (officially prohibited)',
    licensingRequired: false,
    events: [
      { id: 'tz-1', date: '2025-11-30', type: 'consultation', title: 'BOT Revisiting Crypto Ban Policy', description: 'Bank of Tanzania officials indicated willingness to review the 2019 crypto ban amid regional regulatory developments.', impactScore: 8, source: 'The Citizen Tanzania' },
    ],
    upcomingPolicies: [
      { id: 'tz-up-1', country: 'Tanzania', countryCode: 'TZ', title: 'Crypto Policy Review', expectedDate: '2026-Q4', status: 'proposed', description: 'BOT reviewing 2019 ban in light of regional trends and CBDC considerations.', impactLevel: 'high' },
    ],
  },
  {
    code: 'EG', name: 'Egypt', flag: '🇪🇬', region: 'North Africa',
    status: 'Restricted', lastUpdate: '2026-01-22',
    summary: 'CBE prohibits banks from dealing in crypto. However, blockchain technology is encouraged. New fintech law in progress. Growing P2P market.',
    exchanges: ['Binance P2P'],
    keyDocs: ['CBE Circular on Virtual Currencies', 'Draft Fintech Law 2025', 'FRA Sandbox Guidelines'],
    cbdc: 'EGP Digital (Study Phase)',
    regulatoryBody: 'CBE / FRA',
    taxRegime: 'N/A (crypto trading restricted)',
    licensingRequired: false,
    events: [
      { id: 'eg-1', date: '2026-01-22', type: 'new_regulation', title: 'FRA Publishes Fintech Sandbox Rules', description: 'Financial Regulatory Authority launched sandbox allowing regulated experimentation with blockchain-based financial services.', impactScore: 7, source: 'FRA Egypt' },
    ],
    upcomingPolicies: [
      { id: 'eg-up-1', country: 'Egypt', countryCode: 'EG', title: 'Comprehensive Fintech Law', expectedDate: '2026-Q2', status: 'pending_approval', description: 'New fintech law expected to partially ease crypto restrictions for licensed entities.', impactLevel: 'critical' },
    ],
  },
  {
    code: 'MA', name: 'Morocco', flag: '🇲🇦', region: 'North Africa',
    status: 'Evolving', lastUpdate: '2026-02-01',
    summary: 'Bank Al-Maghrib banned crypto in 2017 but is now exploring CBDC and regulatory framework for digital assets. Major policy shift underway.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BAM Digital Currency Study 2025', 'AMMC Securities Regulation Update', 'Draft Crypto Framework 2026'],
    cbdc: 'eMAD (Advanced Study Phase)',
    regulatoryBody: 'BAM / AMMC',
    taxRegime: 'Under development',
    licensingRequired: false,
    events: [
      { id: 'ma-1', date: '2026-02-01', type: 'new_regulation', title: 'Morocco Drafts Crypto Regulatory Framework', description: 'Bank Al-Maghrib and AMMC jointly released draft framework proposing licensed crypto trading under strict supervision.', impactScore: 9, source: 'BAM Press Release' },
    ],
    upcomingPolicies: [
      { id: 'ma-up-1', country: 'Morocco', countryCode: 'MA', title: 'Crypto Licensing Framework', expectedDate: '2026-Q3', status: 'draft', description: 'Framework to legalize crypto trading through licensed exchanges, reversing 2017 ban.', impactLevel: 'critical' },
    ],
  },
  {
    code: 'SN', name: 'Senegal', flag: '🇸🇳', region: 'West Africa',
    status: 'WAEMU Rules', lastUpdate: '2025-10-15',
    summary: 'Subject to BCEAO (WAEMU) regulations. Crypto is not legal tender. Growing DeFi interest. eCFA discussions ongoing across the WAEMU zone.',
    exchanges: ['Binance P2P', 'Yellow Card'],
    keyDocs: ['BCEAO Instruction on Digital Money Services'],
    cbdc: 'eCFA (WAEMU-wide project)',
    regulatoryBody: 'BCEAO',
    taxRegime: 'WAEMU common framework',
    licensingRequired: false,
    events: [],
    upcomingPolicies: [],
  },
  {
    code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', region: 'West Africa',
    status: 'WAEMU Rules', lastUpdate: '2025-11-10',
    summary: 'BCEAO rules apply. Abidjan becoming West African fintech hub. Orange Money and crypto overlap growing.',
    exchanges: ['Binance P2P', 'Yellow Card'],
    keyDocs: ['BCEAO Instruction on Digital Money Services', 'ARTCI Digital Economy Framework'],
    cbdc: 'eCFA (WAEMU-wide project)',
    regulatoryBody: 'BCEAO / ARTCI',
    taxRegime: 'WAEMU common framework',
    licensingRequired: false,
    events: [],
    upcomingPolicies: [],
  },
  {
    code: 'AO', name: 'Angola', flag: '🇦🇴', region: 'Southern Africa',
    status: 'Unregulated', lastUpdate: '2025-09-30',
    summary: 'No specific cryptocurrency legislation. BNA monitors digital payment developments. Limited exchange access. Oil-dependent economy exploring diversification.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BNA Financial Stability Report 2025'],
    cbdc: 'No plans announced',
    regulatoryBody: 'BNA',
    taxRegime: 'No specific guidelines',
    licensingRequired: false,
    events: [],
    upcomingPolicies: [],
  },
  {
    code: 'MZ', name: 'Mozambique', flag: '🇲🇿', region: 'Southern Africa',
    status: 'Unregulated', lastUpdate: '2025-08-20',
    summary: 'No crypto-specific regulation. Growing mobile money ecosystem could integrate crypto. P2P adoption increasing among youth.',
    exchanges: ['Binance P2P'],
    keyDocs: [],
    cbdc: 'No plans announced',
    regulatoryBody: 'Banco de Moçambique',
    taxRegime: 'No specific guidelines',
    licensingRequired: false,
    events: [],
    upcomingPolicies: [],
  },
];

// ━━━━ New releases (policies enacted in last 60 days) ━━━━
const NEW_RELEASES: PolicyEvent[] = [
  { id: 'nr-1', date: '2026-02-10', type: 'new_regulation', title: 'Nigeria: SEC Updates VASP Registration Requirements', description: 'Enhanced KYC/AML requirements for all Virtual Asset Service Providers.', impactScore: 8, source: 'SEC Nigeria' },
  { id: 'nr-2', date: '2026-02-05', type: 'enforcement', title: 'South Africa: FSCA Revokes Non-Compliant CASP License', description: 'First enforcement action under new CASP licensing framework.', impactScore: 7, source: 'FSCA' },
  { id: 'nr-3', date: '2026-02-01', type: 'new_regulation', title: 'Morocco: Draft Crypto Framework Released', description: 'Joint BAM-AMMC draft proposing legalization of licensed crypto trading.', impactScore: 9, source: 'BAM' },
  { id: 'nr-4', date: '2026-01-28', type: 'consultation', title: 'Kenya: CMA Digital Assets Sandbox Consultation', description: 'Public comment period on proposed regulatory sandbox for digital assets.', impactScore: 8, source: 'CMA Kenya' },
  { id: 'nr-5', date: '2026-01-22', type: 'new_regulation', title: 'Egypt: FRA Publishes Fintech Sandbox Rules', description: 'Blockchain-based financial services can now operate in regulated sandbox.', impactScore: 7, source: 'FRA Egypt' },
  { id: 'nr-6', date: '2026-01-15', type: 'cbdc_update', title: 'Ghana: eCedi Pilot Launch', description: 'CBDC pilot with 5 banks across Accra and Kumasi.', impactScore: 8, source: 'Bank of Ghana' },
  { id: 'nr-7', date: '2026-01-05', type: 'new_regulation', title: 'Rwanda: BNR Opens Fintech Sandbox', description: 'Crypto and blockchain startups can apply for sandbox licenses.', impactScore: 8, source: 'BNR Rwanda' },
];

function computeStats(countries: CountryPolicy[]): PolicyStats {
  const allEvents = countries.flatMap(c => c.events);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    totalCountries: countries.length,
    regulated: countries.filter(c => c.status === 'Regulated').length,
    evolving: countries.filter(c => c.status === 'Evolving').length,
    cautious: countries.filter(c => c.status === 'Cautious').length,
    restricted: countries.filter(c => c.status === 'Restricted').length,
    unregulated: countries.filter(c => c.status === 'Unregulated').length,
    waemu: countries.filter(c => c.status === 'WAEMU Rules').length,
    totalEvents: allEvents.length,
    recentEvents: allEvents.filter(e => new Date(e.date) >= thirtyDaysAgo).length,
    upcomingPolicies: countries.reduce((sum, c) => sum + c.upcomingPolicies.length, 0),
    newReleasesThisMonth: NEW_RELEASES.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const tab = searchParams.get('tab') || 'overview'; // overview | upcoming | new-releases | country

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/regulations/countries`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const backendData = await res.json();
      // Merge backend data with our enriched fallback (backend may not have all fields)
      if (backendData?.data?.length) {
        const enriched = backendData.data.map((bd: any) => {
          const fallback = FALLBACK_COUNTRIES.find(f => f.code === bd.code);
          return {
            ...fallback,
            ...bd,
            flag: fallback?.flag || '🏳️',
            region: fallback?.region || 'Africa',
            events: fallback?.events || [],
            upcomingPolicies: fallback?.upcomingPolicies || [],
            exchanges: bd.exchanges || fallback?.exchanges || [],
            keyDocs: bd.keyDocs || fallback?.keyDocs || [],
          };
        });
        // Add countries from fallback not in backend
        for (const fc of FALLBACK_COUNTRIES) {
          if (!enriched.find((e: any) => e.code === fc.code)) {
            enriched.push(fc);
          }
        }
        return NextResponse.json({
          stats: computeStats(enriched),
          countries: enriched,
          newReleases: NEW_RELEASES,
          source: 'backend+fallback',
        });
      }
    }
  } catch {
    // Backend unavailable — use fallback
  }

  // Return fallback data
  const countries = countryCode
    ? FALLBACK_COUNTRIES.filter(c => c.code === countryCode.toUpperCase())
    : FALLBACK_COUNTRIES;

  return NextResponse.json({
    stats: computeStats(FALLBACK_COUNTRIES),
    countries,
    newReleases: NEW_RELEASES,
    source: 'fallback',
  });
}
