/**
 * Translated News Listing Page
 * /[lang]/news  — e.g. /sw/news, /ha/news, /fr/news
 * Shows published articles in the selected language
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

// Canonical language list — keep in sync with shared/languages.ts
const VALID_LANGS: Record<string, string> = {
  en: 'English', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo', pcm: 'Pidgin',
  wol: 'Wolof', sw: 'Swahili', kin: 'Kinyarwanda', am: 'Amharic',
  so: 'Somali', om: 'Oromo', zu: 'Zulu', af: 'Afrikaans', sn: 'Shona',
  ar: 'Arabic', fr: 'French', pt: 'Portuguese', es: 'Spanish',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TranslatedArticle {
  id: string;
  articleId: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImageUrl?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  author?: string | null;
}

async function getTranslatedArticles(lang: string): Promise<TranslatedArticle[]> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4000';

  try {
    // If English, just fetch normal articles
    if (lang === 'en') {
      const res = await fetch(`${backendUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { articles(limit: 24, status: PUBLISHED) {
            id slug title excerpt featuredImageUrl publishedAt
            category { name } author { username firstName lastName }
          }}`,
        }),
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.data?.articles ?? []).map((a: any) => ({
        id: a.id, articleId: a.id, slug: a.slug,
        title: a.title, excerpt: a.excerpt || '',
        featuredImageUrl: a.featuredImageUrl,
        publishedAt: a.publishedAt,
        category: a.category?.name,
        author: a.author?.firstName
          ? `${a.author.firstName} ${a.author.lastName || ''}`.trim()
          : a.author?.username,
      }));
    }

    // For other languages, fetch translations
    const res = await fetch(`${backendUrl}/api/articles/translations?lang=${lang}&status=COMPLETED&limit=24`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.translations ?? [];
  } catch {
    return [];
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props { params: { lang: string } }

export async function generateMetadata({ params }: Props) {
  const langName = VALID_LANGS[params.lang];
  if (!langName) return { title: 'Not Found' };
  return {
    title: `CoinDaily News — ${langName}`,
    description: `Latest cryptocurrency and memecoin news in ${langName}`,
  };
}

export default async function TranslatedNewsPage({ params }: Props) {
  const { lang } = params;
  if (!VALID_LANGS[lang]) notFound();

  const langName = VALID_LANGS[lang];
  const articles = await getTranslatedArticles(lang);
  const isRtl = lang === 'ar';

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header with language selector */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {lang === 'en' ? 'Latest News' : `Latest News — ${langName}`}
            </h1>
            <p className="text-gray-600 mt-2">
              Africa-first crypto coverage in {langName}.
            </p>
          </div>
          {/* Language pills */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(VALID_LANGS).map(([code, name]) => (
              <Link
                key={code}
                href={code === 'en' ? '/news' : `/${code}/news`}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                  code === lang
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            No translated articles available in {langName} yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${lang}/news/${article.slug}`}
                className="group rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {article.featuredImageUrl ? (
                  <img src={article.featuredImageUrl} alt={article.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-purple-50" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    {article.category && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{article.category}</span>
                    )}
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
                  )}
                  {article.author && (
                    <div className="mt-4 text-xs text-gray-500">{article.author}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
