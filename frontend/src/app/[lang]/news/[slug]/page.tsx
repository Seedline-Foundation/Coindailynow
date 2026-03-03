/**
 * Translated Article Detail Page
 * /[lang]/news/[slug]  — e.g. /sw/news/bitcoin-update, /ha/news/bitcoin-update
 * Displays a single article in the requested language with a language switcher.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

// Canonical language list — mirrors shared/languages.ts
const VALID_LANGS: Record<string, string> = {
  en: 'English', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo', pcm: 'Pidgin',
  wol: 'Wolof', sw: 'Swahili', kin: 'Kinyarwanda', am: 'Amharic',
  so: 'Somali', om: 'Oromo', zu: 'Zulu', af: 'Afrikaans', sn: 'Shona',
  ar: 'Arabic', fr: 'French', pt: 'Portuguese', es: 'Spanish',
};

interface TranslatedArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt?: string | null;
  featuredImageUrl?: string | null;
  languageCode: string;
  translationStatus: string;
  qualityScore?: number | null;
  humanReviewed?: boolean;
  author?: string | null;
  category?: string | null;
  slug: string;
  availableLanguages?: string[];
}

interface Props {
  params: { lang: string; slug: string };
}

async function getTranslatedArticle(lang: string, slug: string): Promise<TranslatedArticle | null> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4000';

  try {
    // If English, fetch the original article
    if (lang === 'en') {
      const res = await fetch(`${backendUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query GetArticle($slug: String!) {
            article(slug: $slug) {
              id title excerpt content featuredImageUrl publishedAt
              author { username firstName lastName }
              category { name }
              translations { languageCode translationStatus }
            }
          }`,
          variables: { slug },
        }),
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const a = data?.data?.article;
      if (!a) return null;
      return {
        id: a.id, slug,
        title: a.title, excerpt: a.excerpt || '', content: a.content || '',
        publishedAt: a.publishedAt, featuredImageUrl: a.featuredImageUrl,
        languageCode: 'en', translationStatus: 'ORIGINAL',
        author: a.author?.firstName
          ? `${a.author.firstName} ${a.author.lastName || ''}`.trim()
          : a.author?.username ?? null,
        category: a.category?.name ?? null,
        availableLanguages: ['en', ...(a.translations || [])
          .filter((t: any) => t.translationStatus === 'COMPLETED')
          .map((t: any) => t.languageCode)],
      };
    }

    // For other languages, fetch translated article by slug + language
    const res = await fetch(
      `${backendUrl}/api/articles/by-slug/${slug}/translations/${lang}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.translation ?? null;
  } catch {
    return null;
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getTranslatedArticle(params.lang, params.slug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.title} | CoinDaily Africa (${VALID_LANGS[params.lang] || params.lang})`,
    description: article.excerpt,
  };
}

export default async function TranslatedArticlePage({ params }: Props) {
  const { lang, slug } = params;
  if (!VALID_LANGS[lang]) notFound();

  const article = await getTranslatedArticle(lang, slug);
  if (!article) notFound();

  const isRtl = lang === 'ar';
  const availableLangs = article.availableLanguages || [lang, 'en'];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRtl ? 'rtl' : 'ltr'}>
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Language Switcher Bar */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 flex-wrap">
          <span className="text-sm font-medium text-gray-500 mr-1">Read in:</span>
          {availableLangs.map((code: string) => (
            <Link
              key={code}
              href={code === 'en' ? `/news/${slug}` : `/${code}/news/${slug}`}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                code === lang
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {VALID_LANGS[code] || code}
            </Link>
          ))}
        </div>

        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
          {article.category && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">
              {article.category}
            </span>
          )}
          <span>{formatDate(article.publishedAt)}</span>
          {article.author && <span>{article.author}</span>}
          {article.humanReviewed && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700 text-xs">
              ✓ Human Reviewed
            </span>
          )}
          {article.qualityScore != null && (
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700 text-xs">
              Quality: {article.qualityScore}%
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-lg text-gray-600 mb-8">{article.excerpt}</p>
        )}

        {/* Featured Image */}
        {article.featuredImageUrl && (
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            className="w-full rounded-xl mb-8 object-cover max-h-[420px]"
          />
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content || '<p>Content coming soon.</p>' }} />
        </div>

        {/* Bottom Language Switcher */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Also available in:</h3>
          <div className="flex flex-wrap gap-2">
            {availableLangs
              .filter((code: string) => code !== lang)
              .map((code: string) => (
                <Link
                  key={code}
                  href={code === 'en' ? `/news/${slug}` : `/${code}/news/${slug}`}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  {VALID_LANGS[code] || code}
                </Link>
              ))}
          </div>
        </div>

        {/* Back to listing */}
        <div className="mt-8">
          <Link
            href={lang === 'en' ? '/news' : `/${lang}/news`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to {VALID_LANGS[lang]} News
          </Link>
        </div>
      </article>
    </div>
  );
}
