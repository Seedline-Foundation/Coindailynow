'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/* ── Types ── */

interface SearchHit {
  id: string;
  type: 'article' | 'factsheet' | 'press_release';
  title: string;
  excerpt?: string | null;
  slug: string;
  category?: string | null;
  categorySlug?: string | null;
  country?: string | null;
  language?: string | null;
  publishedAt?: string | null;
  featuredImageUrl?: string | null;
  tags?: string[];
  score?: number;
}

interface FacetBucket {
  key: string;
  count: number;
}

interface SearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hits: SearchHit[];
  facets: {
    categories: FacetBucket[];
    countries: FacetBucket[];
    languages: FacetBucket[];
    types: FacetBucket[];
  };
  took: number;
  source: 'elasticsearch' | 'prisma';
}

/* ── Factsheet local search ── */

interface FactsheetHit {
  id: string;
  type: 'factsheet';
  title: string;
  excerpt: string;
  slug: string;
  category: string;
}

function searchFactsheets(query: string): FactsheetHit[] {
  // Import factsheets at module level would be better but this is safe for client
  try {
    // We'll do inline matching against known entities
    const FACTSHEET_ENTITIES = [
      { name: 'Bitcoin', ticker: 'BTC', slug: 'bitcoin', type: 'Crypto', tagline: 'The original cryptocurrency and digital gold standard' },
      { name: 'Ethereum', ticker: 'ETH', slug: 'ethereum', type: 'Crypto', tagline: 'Programmable blockchain powering DeFi and smart contracts' },
      { name: 'BNB', ticker: 'BNB', slug: 'bnb', type: 'Crypto', tagline: 'Binance ecosystem token with low-fee transactions' },
      { name: 'Solana', ticker: 'SOL', slug: 'solana', type: 'Crypto', tagline: 'High-speed blockchain for DeFi and NFTs' },
      { name: 'Binance', ticker: null, slug: 'binance', type: 'Exchange', tagline: 'World\'s largest crypto exchange by volume' },
      { name: 'Luno', ticker: null, slug: 'luno', type: 'Exchange', tagline: 'Leading African crypto exchange' },
      { name: 'Quidax', ticker: null, slug: 'quidax', type: 'Exchange', tagline: 'Nigerian crypto exchange' },
      { name: 'YellowCard', ticker: null, slug: 'yellowcard', type: 'Exchange', tagline: 'Pan-African crypto on/off ramp' },
      { name: 'Nigeria', ticker: 'NG', slug: 'nigeria', type: 'Country', tagline: 'Africa\'s largest crypto market' },
      { name: 'Kenya', ticker: 'KE', slug: 'kenya', type: 'Country', tagline: 'East Africa\'s fintech hub' },
      { name: 'South Africa', ticker: 'ZA', slug: 'south-africa', type: 'Country', tagline: 'Africa\'s most regulated crypto market' },
      { name: 'Ghana', ticker: 'GH', slug: 'ghana', type: 'Country', tagline: 'West Africa\'s emerging crypto market' },
      { name: 'MTN Group', ticker: null, slug: 'mtn-group', type: 'Company', tagline: 'Africa\'s largest mobile network operator' },
      { name: 'Safaricom', ticker: null, slug: 'safaricom', type: 'Company', tagline: 'Home of M-Pesa mobile money' },
      { name: 'Standard Bank', ticker: null, slug: 'standard-bank', type: 'Company', tagline: 'Africa\'s largest bank by assets' },
      { name: 'Naspers', ticker: null, slug: 'naspers', type: 'Company', tagline: 'South African tech investment giant' },
    ];

    const q = query.toLowerCase();
    return FACTSHEET_ENTITIES
      .filter((e) => e.name.toLowerCase().includes(q) || e.ticker?.toLowerCase().includes(q) || e.tagline.toLowerCase().includes(q))
      .map((e) => ({
        id: `factsheet-${e.slug}`,
        type: 'factsheet' as const,
        title: `${e.name}${e.ticker ? ` (${e.ticker})` : ''}`,
        excerpt: e.tagline,
        slug: e.slug,
        category: e.type,
      }));
  } catch {
    return [];
  }
}

/* ── Labels ── */

const COUNTRY_LABELS: Record<string, string> = {
  NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', GH: 'Ghana',
  TZ: 'Tanzania', ET: 'Ethiopia', EG: 'Egypt', UG: 'Uganda',
};

const LANG_LABELS: Record<string, string> = {
  en: 'English', ha: 'Hausa', yo: 'Yoruba', sw: 'Swahili', zu: 'Zulu', fr: 'French',
};

/* ── Component ── */

interface SearchClientProps {
  initialQuery: string;
  initialCategory: string;
  initialCountry: string;
  initialLang: string;
  initialPage: number;
}

export default function SearchClient({
  initialQuery,
  initialCategory,
  initialCountry,
  initialLang,
  initialPage,
}: SearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [factsheetResults, setFactsheetResults] = useState<FactsheetHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeCountry, setActiveCountry] = useState(initialCountry);
  const [activeLang, setActiveLang] = useState(initialLang);
  const [page, setPage] = useState(initialPage);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  const doSearch = useCallback(
    async (q: string, cat: string, country: string, lang: string, pg: number) => {
      if (!q.trim()) {
        setResults(null);
        setFactsheetResults([]);
        return;
      }

      setLoading(true);

      // Update URL
      const params = new URLSearchParams();
      params.set('q', q);
      if (cat) params.set('category', cat);
      if (country) params.set('country', country);
      if (lang) params.set('lang', lang);
      if (pg > 1) params.set('page', String(pg));
      router.replace(`/search?${params.toString()}`, { scroll: false });

      // Search factsheets locally
      setFactsheetResults(searchFactsheets(q));

      // Search API
      try {
        const apiParams = new URLSearchParams({ q, page: String(pg), limit: '20' });
        if (cat) apiParams.set('category', cat);
        if (country) apiParams.set('country', country);
        if (lang) apiParams.set('lang', lang);

        const res = await fetch(`${apiBase}/api/v1/search?${apiParams.toString()}`, {
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data);
        } else {
          setResults({
            query: q, total: 0, page: pg, limit: 20, totalPages: 0,
            hits: [], facets: { categories: [], countries: [], languages: [], types: [] },
            took: 0, source: 'prisma',
          });
        }
      } catch {
        setResults({
          query: q, total: 0, page: pg, limit: 20, totalPages: 0,
          hits: [], facets: { categories: [], countries: [], languages: [], types: [] },
          took: 0, source: 'prisma',
        });
      } finally {
        setLoading(false);
      }
    },
    [apiBase, router],
  );

  // Initial search on mount
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery, initialCategory, initialCountry, initialLang, initialPage);
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch(query, activeCategory, activeCountry, activeLang, 1);
  };

  const applyFacet = (type: 'category' | 'country' | 'lang', value: string) => {
    const newCat = type === 'category' ? (value === activeCategory ? '' : value) : activeCategory;
    const newCountry = type === 'country' ? (value === activeCountry ? '' : value) : activeCountry;
    const newLang = type === 'lang' ? (value === activeLang ? '' : value) : activeLang;
    setActiveCategory(newCat);
    setActiveCountry(newCountry);
    setActiveLang(newLang);
    setPage(1);
    doSearch(query, newCat, newCountry, newLang, 1);
  };

  const clearFilters = () => {
    setActiveCategory('');
    setActiveCountry('');
    setActiveLang('');
    setPage(1);
    doSearch(query, '', '', '', 1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    doSearch(query, activeCategory, activeCountry, activeLang, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = activeCategory || activeCountry || activeLang;
  const totalResults = (results?.total || 0) + factsheetResults.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, markets, regulations, factsheets..."
            aria-label="Search"
            className="w-full bg-[#161b22] border border-gray-700 rounded-xl px-5 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Search
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 font-mono">
          Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">/</kbd> to focus search from anywhere
        </p>
      </form>

      {/* Results area */}
      {query && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Facets sidebar */}
          <aside className="lg:col-span-1 space-y-5">
            {/* Active filters */}
            {hasFilters && (
              <div className="bg-[#161b22] rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Active Filters</h3>
                  <button onClick={clearFilters} className="text-xs text-orange-400 hover:text-orange-300">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeCategory && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/15 text-orange-400 rounded text-xs">
                      {activeCategory}
                      <button onClick={() => applyFacet('category', activeCategory)} className="hover:text-white">&times;</button>
                    </span>
                  )}
                  {activeCountry && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-xs">
                      {COUNTRY_LABELS[activeCountry.toUpperCase()] || activeCountry}
                      <button onClick={() => applyFacet('country', activeCountry)} className="hover:text-white">&times;</button>
                    </span>
                  )}
                  {activeLang && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded text-xs">
                      {LANG_LABELS[activeLang] || activeLang}
                      <button onClick={() => applyFacet('lang', activeLang)} className="hover:text-white">&times;</button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Category facet */}
            {results && results.facets.categories.length > 0 && (
              <FacetPanel
                title="Category"
                buckets={results.facets.categories}
                active={activeCategory}
                onSelect={(k) => applyFacet('category', k)}
              />
            )}

            {/* Country facet */}
            {results && results.facets.countries.length > 0 && (
              <FacetPanel
                title="Country"
                buckets={results.facets.countries}
                active={activeCountry}
                onSelect={(k) => applyFacet('country', k)}
                labelMap={COUNTRY_LABELS}
              />
            )}

            {/* Language facet */}
            {results && results.facets.languages.length > 0 && (
              <FacetPanel
                title="Language"
                buckets={results.facets.languages}
                active={activeLang}
                onSelect={(k) => applyFacet('lang', k)}
                labelMap={LANG_LABELS}
              />
            )}
          </aside>

          {/* Results list */}
          <div className="lg:col-span-3">
            {/* Stats bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400 font-mono">
                {loading ? (
                  'Searching...'
                ) : (
                  <>
                    <span className="text-white font-semibold">{totalResults.toLocaleString()}</span> results
                    {results && ` in ${results.took}ms`}
                    {results && (
                      <span className="text-gray-600 ml-2">
                        via {results.source === 'elasticsearch' ? 'ES' : 'DB'}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-[#161b22] rounded-lg border border-gray-800 p-5 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-800 rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <>
                {/* Factsheet results */}
                {factsheetResults.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-3">
                      Factsheets
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {factsheetResults.map((fs) => (
                        <Link
                          key={fs.id}
                          href={`/factsheets/${fs.slug}`}
                          className="block bg-[#161b22] border border-emerald-500/20 rounded-lg p-3 hover:border-emerald-500/50 transition group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded">
                              {fs.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                            {fs.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">{fs.excerpt}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Article results */}
                {results && results.hits.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest mb-3">
                      Articles
                    </h3>
                    {results.hits.map((hit) => (
                      <SearchResultCard key={hit.id} hit={hit} />
                    ))}
                  </div>
                )}

                {/* No results */}
                {results && results.hits.length === 0 && factsheetResults.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-400 text-lg mb-2">No results found</p>
                    <p className="text-gray-600 text-sm">
                      Try different keywords or remove some filters.
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {results && results.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                      className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Prev
                    </button>
                    {paginationRange(page, results.totalPages).map((p, i) =>
                      p === '...' ? (
                        <span key={`dot-${i}`} className="text-gray-600 px-1">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p as number)}
                          className={`px-3 py-1.5 text-sm rounded transition ${
                            p === page
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      disabled={page >= results.totalPages}
                      onClick={() => goToPage(page + 1)}
                      className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">&#128270;</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Search CoinDaily Africa</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Find articles, factsheets, regulatory updates, and market data across Africa&#39;s crypto
            and financial markets.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Bitcoin Nigeria', 'SEC regulation', 'M-Pesa crypto', 'Binance Africa', 'USD NGN'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  doSearch(term, '', '', '', 1);
                }}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full text-sm hover:bg-gray-700 hover:text-white transition"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function SearchResultCard({ hit }: { hit: SearchHit }) {
  const countrySlug = hit.country?.toLowerCase() || 'ng';
  const href = `/${countrySlug}/news/${hit.slug}`;

  return (
    <Link
      href={href}
      className="block bg-[#161b22] border border-gray-800 rounded-lg p-5 hover:border-orange-500/40 hover:bg-[#1c2128] transition group"
    >
      <div className="flex items-start gap-4">
        {hit.featuredImageUrl && (
          <img
            src={hit.featuredImageUrl}
            alt=""
            className="w-24 h-16 object-cover rounded flex-shrink-0 hidden sm:block"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {hit.category && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded">
                {hit.category}
              </span>
            )}
            {hit.country && (
              <span className="text-[9px] text-gray-600 font-mono">
                {COUNTRY_LABELS[hit.country.toUpperCase()] || hit.country}
              </span>
            )}
            {hit.publishedAt && (
              <span className="text-[9px] text-gray-600 font-mono">
                {formatDate(hit.publishedAt)}
              </span>
            )}
          </div>
          <h3
            className="text-base font-semibold text-white group-hover:text-orange-400 transition line-clamp-2"
            dangerouslySetInnerHTML={{ __html: hit.title }}
          />
          {hit.excerpt && (
            <p
              className="text-sm text-gray-500 mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: hit.excerpt }}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

function FacetPanel({
  title,
  buckets,
  active,
  onSelect,
  labelMap,
}: {
  title: string;
  buckets: FacetBucket[];
  active: string;
  onSelect: (key: string) => void;
  labelMap?: Record<string, string>;
}) {
  return (
    <div className="bg-[#161b22] rounded-lg border border-gray-800 p-4">
      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
      <ul className="space-y-1">
        {buckets.map((b) => {
          const isActive = b.key.toLowerCase() === active.toLowerCase();
          const label = labelMap?.[b.key.toUpperCase()] || labelMap?.[b.key] || b.key;
          return (
            <li key={b.key}>
              <button
                onClick={() => onSelect(b.key)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="truncate">{label}</span>
                <span className="text-xs text-gray-600 font-mono tabular-nums ml-2">{b.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Helpers ── */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function paginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
