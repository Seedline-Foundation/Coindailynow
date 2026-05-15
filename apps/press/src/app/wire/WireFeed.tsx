'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Zap,
  Globe,
  ArrowUpRight,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ── Types ── */

interface WireItem {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  publishedAt: string;
  url: string | null;
  tags: string[];
  industry: string;
  country: string;
  assetClass: string;
  status: string;
}

/* ── Filter options ── */

const INDUSTRIES = [
  'All',
  'DeFi',
  'NFTs',
  'Layer 1',
  'Layer 2',
  'Exchange',
  'Stablecoin',
  'Regulation',
  'Mining',
  'Payments',
  'GameFi',
  'Infrastructure',
];

const COUNTRIES = [
  'All',
  'NG', 'KE', 'ZA', 'GH', 'TZ',
  'EG', 'RW', 'UG', 'SN', 'CI',
  'US', 'UK', 'AE', 'SG',
];

const COUNTRY_LABELS: Record<string, string> = {
  NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', GH: 'Ghana', TZ: 'Tanzania',
  EG: 'Egypt', RW: 'Rwanda', UG: 'Uganda', SN: 'Senegal', CI: "Cote d'Ivoire",
  US: 'United States', UK: 'United Kingdom', AE: 'UAE', SG: 'Singapore',
};

const ASSET_CLASSES = ['All', 'Token', 'Protocol', 'Fund', 'Company', 'DAO', 'Infrastructure'];

/* ── Realistic mock data for pre-launch ── */

const MOCK_WIRE: WireItem[] = [
  {
    id: 'w-001',
    title: 'Luno Nigeria Launches Instant USDT-Naira Ramp With Zero Fees Until Q3',
    summary: 'Luno exchange rolls out a zero-fee USDT/NGN corridor targeting the 14M unbanked diaspora remittance market across West Africa.',
    source: 'Luno Exchange',
    publishedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    url: null,
    tags: ['usdt', 'naira', 'remittance', 'luno'],
    industry: 'Exchange',
    country: 'NG',
    assetClass: 'Company',
  },
  {
    id: 'w-002',
    title: 'Kenya Central Bank Publishes Draft Framework for Stablecoin Licensing',
    summary: 'The CBK issues a 48-page consultation paper outlining capital requirements and consumer protections for stablecoin issuers operating in Kenya.',
    source: 'Central Bank of Kenya',
    publishedAt: new Date(Date.now() - 38 * 60000).toISOString(),
    url: null,
    tags: ['regulation', 'stablecoin', 'cbk', 'licensing'],
    industry: 'Regulation',
    country: 'KE',
    assetClass: 'Infrastructure',
  },
  {
    id: 'w-003',
    title: 'Valr Raises $55M Series B to Expand Across 12 African Markets',
    summary: 'South African crypto exchange Valr closes Series B led by Pantera Capital with participation from Coinbase Ventures and Alameda Research successor fund.',
    source: 'Valr',
    publishedAt: new Date(Date.now() - 74 * 60000).toISOString(),
    url: null,
    tags: ['fundraise', 'series-b', 'valr', 'expansion'],
    industry: 'Exchange',
    country: 'ZA',
    assetClass: 'Company',
  },
  {
    id: 'w-004',
    title: 'Flutterwave Integrates Bitcoin Lightning for Merchant Settlements in Ghana',
    summary: 'Fintech giant Flutterwave adds Lightning Network support, enabling Ghanaian merchants to receive BTC settlements in under 3 seconds.',
    source: 'Flutterwave',
    publishedAt: new Date(Date.now() - 2.1 * 3600000).toISOString(),
    url: null,
    tags: ['lightning', 'payments', 'ghana', 'flutterwave'],
    industry: 'Payments',
    country: 'GH',
    assetClass: 'Company',
  },
  {
    id: 'w-005',
    title: 'Africa DeFi Alliance Launches $20M Grant Program for Layer 2 Builders',
    summary: 'The newly formed Africa DeFi Alliance allocates $20M in grants to developers building L2 infrastructure for African DeFi protocols.',
    source: 'Africa DeFi Alliance',
    publishedAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
    url: null,
    tags: ['grants', 'defi', 'layer2', 'builders'],
    industry: 'DeFi',
    country: 'KE',
    assetClass: 'DAO',
  },
  {
    id: 'w-006',
    title: 'Nigerian SEC Approves First Tokenized Real Estate Fund on Polygon',
    summary: 'Securities and Exchange Commission Nigeria greenlights a $10M tokenized real estate fund, the first regulated RWA product in West Africa.',
    source: 'SEC Nigeria',
    publishedAt: new Date(Date.now() - 4.8 * 3600000).toISOString(),
    url: null,
    tags: ['rwa', 'real-estate', 'tokenization', 'sec'],
    industry: 'Regulation',
    country: 'NG',
    assetClass: 'Fund',
  },
  {
    id: 'w-007',
    title: 'Celo Foundation Announces Migration to Ethereum L2 With Africa-First Sequencer',
    summary: 'Celo completes its transition to an Ethereum Layer 2 with a geographically distributed sequencer prioritizing low-latency access from African nodes.',
    source: 'Celo Foundation',
    publishedAt: new Date(Date.now() - 6.2 * 3600000).toISOString(),
    url: null,
    tags: ['celo', 'ethereum', 'layer2', 'migration'],
    industry: 'Layer 2',
    country: 'US',
    assetClass: 'Protocol',
  },
  {
    id: 'w-008',
    title: 'Quidax Launches AI-Powered Trading Bot Targeting Nigerian Retail Investors',
    summary: 'Nigerian exchange Quidax releases an AI trading assistant that auto-rebalances portfolios based on macro signals from African markets.',
    source: 'Quidax',
    publishedAt: new Date(Date.now() - 8.5 * 3600000).toISOString(),
    url: null,
    tags: ['ai', 'trading', 'quidax', 'retail'],
    industry: 'Exchange',
    country: 'NG',
    assetClass: 'Company',
  },
  {
    id: 'w-009',
    title: 'Rwanda Partners With Ripple for Cross-Border CBDC Settlement Pilot',
    summary: 'National Bank of Rwanda selects Ripple as technology partner for a 6-month CBDC cross-border settlement pilot with Kenya and Uganda.',
    source: 'National Bank of Rwanda',
    publishedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    url: null,
    tags: ['cbdc', 'ripple', 'cross-border', 'pilot'],
    industry: 'Payments',
    country: 'RW',
    assetClass: 'Infrastructure',
  },
  {
    id: 'w-010',
    title: 'Yellow Card Surpasses 2M Users Across 20 African Countries',
    summary: 'Pan-African crypto on-ramp Yellow Card crosses the 2M user milestone, reporting 340% YoY growth driven by P2P stablecoin demand in Nigeria and Ghana.',
    source: 'Yellow Card',
    publishedAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    url: null,
    tags: ['milestone', 'growth', 'p2p', 'stablecoin'],
    industry: 'Exchange',
    country: 'NG',
    assetClass: 'Company',
  },
  {
    id: 'w-011',
    title: 'Binance Africa Fund Invests in 6 Early-Stage GameFi Studios From Lagos and Nairobi',
    summary: 'Binance Labs Africa vertical deploys $4.2M seed capital into 6 GameFi startups building play-to-earn titles for mobile-first African audiences.',
    source: 'Binance Labs',
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    url: null,
    tags: ['gamefi', 'investment', 'seed', 'binance'],
    industry: 'GameFi',
    country: 'NG',
    assetClass: 'Fund',
  },
  {
    id: 'w-012',
    title: 'South Africa FSCA Issues Warning on 14 Unlicensed Crypto Platforms',
    summary: 'The Financial Sector Conduct Authority adds 14 crypto platforms to its public warning list, citing unlicensed FAIS activities and missing disclosures.',
    source: 'FSCA',
    publishedAt: new Date(Date.now() - 22 * 3600000).toISOString(),
    url: null,
    tags: ['warning', 'fsca', 'compliance', 'unlicensed'],
    industry: 'Regulation',
    country: 'ZA',
    assetClass: 'Infrastructure',
  },
];

/* ── Time formatting ── */

function formatWireTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });
}

function formatWireDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}m AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h AGO`;
  const days = Math.floor(hrs / 24);
  return `${days}d AGO`;
}

/* ── Alert storage ── */

const ALERT_KEY = 'sendpress:wire:alerts';

function getAlerts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ALERT_KEY) || '[]');
  } catch { return []; }
}

function toggleAlert(source: string): string[] {
  const current = getAlerts();
  const idx = current.indexOf(source);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(source);
  }
  localStorage.setItem(ALERT_KEY, JSON.stringify(current));
  return [...current];
}

/* ── Component ── */

export default function WireFeed() {
  const [items, setItems] = useState<WireItem[]>(MOCK_WIRE);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [industry, setIndustry] = useState('All');
  const [country, setCountry] = useState('All');
  const [assetClass, setAssetClass] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Load alerts from localStorage
  useEffect(() => {
    setAlerts(getAlerts());
  }, []);

  // Try to fetch real data from Supabase
  const fetchReleases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('press_releases')
        .select('*, publisher:press_publishers(company_name)')
        .in('status', ['approved', 'distributed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        const mapped: WireItem[] = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          summary: r.summary,
          source: r.publisher?.company_name || 'SENDPRESS',
          publishedAt: r.created_at,
          url: r.url,
          tags: r.media_meta?.tags || [],
          industry: r.media_meta?.industry || 'DeFi',
          country: r.media_meta?.country || 'NG',
          assetClass: r.media_meta?.assetClass || 'Token',
          status: r.status,
        }));
        setItems(mapped);
      }
      // If no data or error, keep mock data
    } catch {
      // Supabase unavailable — keep mock data
    }
    setLoading(false);
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchReleases, 60000);
    return () => clearInterval(interval);
  }, [fetchReleases]);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (industry !== 'All' && item.industry !== industry) return false;
      if (country !== 'All' && item.country !== country) return false;
      if (assetClass !== 'All' && item.assetClass !== assetClass) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.summary?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, industry, country, assetClass, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, WireItem[]> = {};
    for (const item of filtered) {
      const dateKey = formatWireDate(item.publishedAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }
    return groups;
  }, [filtered]);

  const activeFilterCount = [industry, country, assetClass].filter((f) => f !== 'All').length;

  const handleAlert = (source: string) => {
    const updated = toggleAlert(source);
    setAlerts(updated);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-dark-950/95 backdrop-blur-md border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top bar */}
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-primary-500" />
                <span className="font-display font-bold text-lg text-white">SENDPRESS</span>
              </Link>
              <span className="text-dark-600 text-sm">|</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-mono font-semibold text-primary-400 tracking-wider uppercase">Wire</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={fetchReleases}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500 rounded transition-colors"
                title="Refresh feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline font-mono">
                  {new Date(lastRefresh).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
              </button>

              {/* Alerts badge */}
              {alerts.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/10 border border-primary-500/20 rounded text-xs text-primary-400 font-mono">
                  <Bell className="w-3 h-3" />
                  {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                </div>
              )}

              <Link
                href="/"
                className="text-xs text-dark-400 hover:text-white transition-colors"
              >
                Back to SENDPRESS
              </Link>
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="pb-3 flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Search wire... (company, keyword, tag)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-dark-700 rounded text-sm text-white placeholder:text-dark-500 font-mono focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded text-sm font-mono transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                  : 'bg-dark-900 border-dark-700 text-dark-400 hover:text-white hover:border-dark-500'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 bg-primary-500 text-dark-950 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable filter panel */}
          {showFilters && (
            <div className="pb-4 border-t border-dark-800 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Industry */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-dark-500 font-semibold mb-1.5">
                  Industry
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        industry === ind
                          ? 'bg-primary-500 text-dark-950 font-semibold'
                          : 'bg-dark-900 text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-dark-500 font-semibold mb-1.5">
                  Country
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCountry(c)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        country === c
                          ? 'bg-primary-500 text-dark-950 font-semibold'
                          : 'bg-dark-900 text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500'
                      }`}
                      title={COUNTRY_LABELS[c] || c}
                    >
                      {c === 'All' ? 'All' : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset Class */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-dark-500 font-semibold mb-1.5">
                  Asset Class
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ASSET_CLASSES.map((ac) => (
                    <button
                      key={ac}
                      onClick={() => setAssetClass(ac)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        assetClass === ac
                          ? 'bg-primary-500 text-dark-950 font-semibold'
                          : 'bg-dark-900 text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500'
                      }`}
                    >
                      {ac}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <div className="sm:col-span-3">
                  <button
                    onClick={() => { setIndustry('All'); setCountry('All'); setAssetClass('All'); }}
                    className="text-xs text-dark-500 hover:text-primary-400 font-mono transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Wire Feed ── */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-dark-500 font-semibold font-mono">
                LIVE
              </span>
            </div>
            <span className="text-xs text-dark-600 font-mono">
              {filtered.length} release{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-[10px] text-dark-600 font-mono">
            AUTO-REFRESH 60s
          </span>
        </div>

        {/* Feed */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-dark-700 mx-auto mb-4" />
            <p className="text-dark-500 text-sm font-mono">No releases match your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setIndustry('All'); setCountry('All'); setAssetClass('All'); }}
              className="mt-3 text-xs text-primary-400 hover:text-primary-300 font-mono"
            >
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateItems]) => (
            <div key={date} className="mb-6">
              {/* Date header */}
              <div className="sticky top-[105px] z-10 bg-dark-950/90 backdrop-blur-sm py-1.5 mb-1 border-b border-dark-800">
                <span className="text-[10px] uppercase tracking-widest text-dark-500 font-semibold font-mono">
                  {date}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-0">
                {dateItems.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isAlerted = alerts.includes(item.source);

                  return (
                    <div
                      key={item.id}
                      className={`group border-l-2 transition-colors ${
                        isAlerted
                          ? 'border-l-primary-500 bg-primary-500/[0.02]'
                          : 'border-l-transparent hover:border-l-dark-600'
                      }`}
                    >
                      {/* Main row */}
                      <div
                        className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-dark-900/50 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        {/* Timestamp */}
                        <div className="shrink-0 w-[72px] pt-0.5">
                          <span className="text-xs font-mono text-dark-500 tabular-nums">
                            {formatWireTime(item.publishedAt)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Source + tags */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono font-semibold text-primary-400 uppercase tracking-wider truncate">
                              {item.source}
                            </span>
                            <span className="text-dark-700">·</span>
                            <span className="text-[10px] font-mono text-dark-600 uppercase">
                              {item.industry}
                            </span>
                            {item.country !== 'All' && (
                              <>
                                <span className="text-dark-700">·</span>
                                <span className="text-[10px] font-mono text-dark-600">
                                  {item.country}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-sm text-white font-medium leading-snug group-hover:text-primary-300 transition-colors">
                            {item.title}
                          </h3>
                        </div>

                        {/* Right side */}
                        <div className="shrink-0 flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono text-dark-600 hidden sm:inline">
                            {relativeTime(item.publishedAt)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-dark-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-dark-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-3 pb-3 ml-[84px]">
                          {item.summary && (
                            <p className="text-sm text-dark-300 leading-relaxed mb-3">
                              {item.summary}
                            </p>
                          )}

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-dark-900 border border-dark-700 rounded text-[10px] font-mono text-dark-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-mono transition-colors"
                              >
                                Open source <ArrowUpRight className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAlert(item.source); }}
                              className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${
                                isAlerted
                                  ? 'text-primary-400 hover:text-primary-300'
                                  : 'text-dark-500 hover:text-primary-400'
                              }`}
                              title={isAlerted ? `Remove alert for ${item.source}` : `Alert me when ${item.source} publishes`}
                            >
                              {isAlerted ? (
                                <>
                                  <BellOff className="w-3.5 h-3.5" />
                                  Remove alert
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3.5 h-3.5" />
                                  Alert me when {item.source} publishes
                                </>
                              )}
                            </button>
                          </div>

                          {/* Metadata */}
                          <div className="mt-3 flex items-center gap-4 text-[10px] font-mono text-dark-600">
                            <span>INDUSTRY: {item.industry.toUpperCase()}</span>
                            <span>COUNTRY: {COUNTRY_LABELS[item.country] || item.country}</span>
                            <span>CLASS: {item.assetClass.toUpperCase()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Wire footer */}
        <div className="mt-8 py-6 border-t border-dark-800 text-center">
          <p className="text-xs text-dark-600 font-mono mb-2">
            END OF WIRE — {filtered.length} RELEASES SHOWN
          </p>
          <p className="text-[10px] text-dark-700 font-mono">
            SENDPRESS WIRE SERVICE &mdash; REAL-TIME PRESS RELEASE DISTRIBUTION
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="text-xs text-dark-500 hover:text-primary-400 font-mono transition-colors"
            >
              SENDPRESS HOME
            </Link>
            <span className="text-dark-800">|</span>
            <Link
              href="/register"
              className="text-xs text-primary-500 hover:text-primary-400 font-mono transition-colors"
            >
              DISTRIBUTE YOUR PR
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
