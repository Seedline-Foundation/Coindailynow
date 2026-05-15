import { Header } from '@/components/landing';
import MarqueeWrapper from '@/components/landing/MarqueeWrapper';
import TickerBar from '@/components/landing/TickerBar';
import Footer from '@/components/footer/Footer';
import LanguageBanner from '@/components/geo/LanguageBanner';
import CountrySwitcher from '@/components/news/CountrySwitcher';
import { countryCodeToRoute, routeToCountryCode } from '@/lib/geo';
import Link from 'next/link';
import { cookies } from 'next/headers';

// Mock data for demonstration
const mockTrendingTokens = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.00,
    change24h: 1250.50,
    changePercent24h: 2.98,
    isHot: true,
    marketCap: 846000000000,
    volume24h: 24500000000,
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.75,
    change24h: -32.25,
    changePercent24h: -1.20,
    marketCap: 318000000000,
    volume24h: 12300000000,
  },
  {
    id: '3',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.082,
    change24h: 0.0045,
    changePercent24h: 5.81,
    isHot: true,
    marketCap: 11800000000,
    volume24h: 890000000,
  },
  {
    id: '4',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    price: 0.000024,
    change24h: 0.0000012,
    changePercent24h: 5.26,
    isHot: true,
    marketCap: 14200000000,
    volume24h: 567000000,
  },
  {
    id: '5',
    symbol: 'PEPE',
    name: 'Pepe',
    price: 0.00000125,
    change24h: 0.000000087,
    changePercent24h: 7.48,
    isHot: true,
    marketCap: 525000000,
    volume24h: 234000000,
  },
];

interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: { name?: string | null; slug?: string | null } | null;
}

async function getHomepageArticles(countryCode: string, languageCode: string): Promise<ArticleListItem[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:4000';
  const response = await fetch(`${backendUrl}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query HomepageArticles($limit: Int!, $status: ArticleStatus, $countryCode: String, $language: String) {
          articles(limit: $limit, status: $status, countryCode: $countryCode, language: $language) {
            id
            slug
            title
            excerpt
            featuredImageUrl
            publishedAt
            updatedAt
            category {
              name
              slug
            }
          }
        }
      `,
      variables: { limit: 24, status: 'PUBLISHED', countryCode, language: languageCode },
    }),
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data?.data?.articles ?? [];
}

function formatDate(dateString?: string | null) {
  if (!dateString) return 'Draft';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Draft';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { country?: string; lang?: string };
}) {
  const params = searchParams || {};
  const cookieStore = await cookies();
  const countryCode = routeToCountryCode(params.country || cookieStore.get('country')?.value || 'ng');
  const countrySlug = countryCodeToRoute(countryCode);
  const languageCode = params.lang || cookieStore.get('lang')?.value || 'en';
  const articles = await getHomepageArticles(countryCode, languageCode);
  const featured = articles[0];
  const latest = articles.slice(1, 7);
  const more = articles.slice(7);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showDateTime={true} />
      <LanguageBanner />

      {/* Bloomberg-style 5-strip ticker bar */}
      <TickerBar />

      {/* Legacy single marquee (hidden — kept for admin-pushed marquees) */}
      <div className="hidden">
        <MarqueeWrapper
          useDynamic={true}
          position="header"
          fallbackTokens={mockTrendingTokens}
          speed={60}
          showVolume={true}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <CountrySwitcher currentCountryCode={countryCode} />

        {featured ? (
          <section className="mb-10">
            <Link href={`/${countrySlug}/news/${featured.slug}`} className="group block">
              <div className="relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
                {featured.featuredImageUrl ? (
                  <img
                    src={featured.featuredImageUrl}
                    alt={featured.title}
                    className="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-[380px] bg-gradient-to-br from-primary-500/20 to-dark-800 flex items-center justify-center">
                    <span className="text-6xl">N</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                    {featured.title}
                  </h1>
                  <p className="text-gray-200 text-lg max-w-2xl line-clamp-2">{featured.excerpt}</p>
                </div>
              </div>
            </Link>
          </section>
        ) : (
          <section className="mb-10 rounded-2xl bg-dark-800 border border-dark-700 p-12 text-center">
            <h2 className="text-2xl font-display font-bold text-white mb-3">Welcome to CoinDaily</h2>
            <p className="text-gray-400">No published articles yet for this country and language.</p>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {latest.length > 0 && (
              <section>
                <h2 className="text-xl font-display font-bold text-gray-900 mb-5">Latest News</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {latest.map((article) => (
                    <Link
                      key={article.id}
                      href={`/${countrySlug}/news/${article.slug}`}
                      className="group rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden border"
                    >
                      {article.featuredImageUrl ? (
                        <img src={article.featuredImageUrl} alt={article.title} className="h-44 w-full object-cover" />
                      ) : (
                        <div className="h-44 w-full bg-gradient-to-br from-blue-50 to-purple-50" />
                      )}
                      <div className="p-4">
                        <div className="text-xs text-gray-500 mb-2">
                          {article.category?.name || 'News'} · {formatDate(article.publishedAt || article.updatedAt)}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition">
                          {article.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {more.length > 0 && (
              <section>
                <h2 className="text-xl font-display font-bold text-gray-900 mb-5">More Stories</h2>
                <div className="space-y-3">
                  {more.map((article) => (
                    <Link
                      key={article.id}
                      href={`/${countrySlug}/news/${article.slug}`}
                      className="block bg-white border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {article.category?.name || 'News'} · {formatDate(article.publishedAt || article.updatedAt)}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{article.title}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Country Feed</h3>
              <p className="text-sm text-gray-600">
                You are reading localized coverage for <span className="font-semibold">{countryCode}</span>.
              </p>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

