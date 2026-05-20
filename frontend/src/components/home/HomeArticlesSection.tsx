import Link from 'next/link';
import { HomeArticlesSkeleton } from '@/components/ui/InstantSkeleton';

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

async function getHomepageArticles(
  countryCode: string,
  languageCode: string,
): Promise<ArticleListItem[]> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:4000';
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

export function HomeArticlesFallback() {
  return <HomeArticlesSkeleton />;
}

export async function HomeArticlesSection({
  countryCode,
  countrySlug,
  languageCode = 'en',
}: {
  countryCode: string;
  countrySlug: string;
  languageCode?: string;
}) {
  const lang = languageCode;
  const articles = await getHomepageArticles(countryCode, lang);
  const featured = articles[0];
  const latest = articles.slice(1, 7);
  const more = articles.slice(7);

  return (
    <>
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
                      <img
                        src={article.featuredImageUrl}
                        alt={article.title}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="h-44 w-full bg-gradient-to-br from-blue-50 to-purple-50" />
                    )}
                    <div className="p-4">
                      <div className="text-xs text-gray-500 mb-2">
                        {article.category?.name || 'News'} ·{' '}
                        {formatDate(article.publishedAt || article.updatedAt)}
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
                      {article.category?.name || 'News'} ·{' '}
                      {formatDate(article.publishedAt || article.updatedAt)}
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
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
              Country Feed
            </h3>
            <p className="text-sm text-gray-600">
              You are reading localized coverage for{' '}
              <span className="font-semibold">{countryCode}</span>.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
