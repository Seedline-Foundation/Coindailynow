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
import { fetchWireReleases, type WireItem } from '@/lib/wireApi';
import { subscribeWireAlerts } from '@/lib/wireAlerts';

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
  const [items, setItems] = useState<WireItem[]>([]);
  const [dataSource, setDataSource] = useState<'database' | 'supabase' | 'empty'>('empty');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { items: liveItems, source } = await fetchWireReleases();
      setItems(liveItems);
      setDataSource(source);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load wire feed');
      setItems([]);
      setDataSource('empty');
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

  const handleAlert = async (source: string) => {
    const updated = toggleAlert(source);
    setAlerts(updated);
    const enabling = updated.includes(source);
    if (enabling) {
      const email =
        typeof window !== 'undefined'
          ? window.prompt('Email for wire alerts (optional — leave blank to skip remote delivery)')
          : null;
      if (email) {
        try {
          await subscribeWireAlerts({ email, sources: updated });
        } catch (err) {
          console.warn('[WireFeed] Remote alert subscribe failed:', err);
        }
      }
    }
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
        {loading && items.length === 0 ? (
          <div className="text-center py-20">
            <RefreshCw className="w-10 h-10 text-dark-600 mx-auto mb-4 animate-spin" />
            <p className="text-dark-500 text-sm font-mono">Loading wire feed…</p>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-dark-700 mx-auto mb-4" />
            {items.length === 0 ? (
              <>
                <p className="text-dark-400 text-sm font-mono mb-1">No published releases on the wire yet.</p>
                <p className="text-dark-600 text-xs font-mono max-w-md mx-auto">
                  Approved releases from CoinDaily API or SENDPRESS Supabase appear here automatically.
                  {fetchError ? ` (${fetchError})` : ''}
                </p>
                <Link
                  href="/dashboard/distribute"
                  className="inline-block mt-4 text-xs text-primary-400 hover:text-primary-300 font-mono"
                >
                  Submit a press release →
                </Link>
              </>
            ) : (
              <>
                <p className="text-dark-500 text-sm font-mono">No releases match your filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setIndustry('All'); setCountry('All'); setAssetClass('All'); }}
                  className="mt-3 text-xs text-primary-400 hover:text-primary-300 font-mono"
                >
                  Clear filters
                </button>
              </>
            )}
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
