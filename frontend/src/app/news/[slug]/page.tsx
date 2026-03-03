/**
 * Dynamic News Article Page
 * Displays individual news articles by slug
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

// Canonical language list
const LANG_NAMES: Record<string, string> = {
  en: 'English', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo', pcm: 'Pidgin',
  wol: 'Wolof', sw: 'Swahili', kin: 'Kinyarwanda', am: 'Amharic',
  so: 'Somali', om: 'Oromo', zu: 'Zulu', af: 'Afrikaans', sn: 'Shona',
  ar: 'Arabic', fr: 'French', pt: 'Portuguese', es: 'Spanish',
};

interface NewsPageProps {
  params: {
    slug: string;
  };
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt?: string | null;
  updatedAt?: string;
  featuredImageUrl?: string | null;
  author?: {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  } | null;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  translations?: {
    languageCode: string;
    translationStatus: string;
  }[];
}

async function getArticle(slug: string): Promise<Article | null> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:4000';

  const response = await fetch(`${backendUrl}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetArticleBySlug($slug: String!) {
          article(slug: $slug) {
            id
            title
            excerpt
            content
            featuredImageUrl
            publishedAt
            updatedAt
            author {
              username
              firstName
              lastName
              avatarUrl
            }
            category {
              name
              slug
            }
            translations {
              languageCode
              translationStatus
            }
          }
        }
      `,
      variables: { slug }
    }),
    next: { revalidate: 60 }
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data?.data?.article ?? null;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return 'Draft';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Draft';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | CoinDaily Africa`,
    description: article.excerpt,
  };
}

export default async function NewsPage({ params }: NewsPageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  const availableTranslations = (article.translations || [])
    .filter(t => t.translationStatus === 'COMPLETED')
    .map(t => t.languageCode);

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Language Switcher */}
        {availableTranslations.length > 0 && (
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 flex-wrap">
            <span className="text-sm font-medium text-gray-500 mr-1">Read in:</span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-white">
              English
            </span>
            {availableTranslations.map((code: string) => (
              <Link
                key={code}
                href={`/${code}/news/${params.slug}`}
                className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                {LANG_NAMES[code] || code}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">
            {article.category?.name || 'News'}
          </span>
          <span>{formatDate(article.publishedAt || article.updatedAt)}</span>
          <span>
            {(article.author?.firstName || article.author?.lastName || article.author?.username) && (
              <>
                {article.author?.firstName || ''} {article.author?.lastName || ''}
                {(!article.author?.firstName && !article.author?.lastName) ? article.author?.username : ''}
              </>
            )}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        {article.excerpt && (
          <p className="text-lg text-gray-600 mb-8">{article.excerpt}</p>
        )}
        {article.featuredImageUrl && (
          <img
            src={article.featuredImageUrl}
            alt={article.title}
            className="w-full rounded-xl mb-8 object-cover max-h-[420px]"
          />
        )}
        <div className="prose prose-lg">
          <div
            dangerouslySetInnerHTML={{
              __html: article.content || '<p>Content coming soon.</p>'
            }}
          />
        </div>

        {/* Bottom Language Switcher */}
        {availableTranslations.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Also available in:</h3>
            <div className="flex flex-wrap gap-2">
              {availableTranslations.map((code: string) => (
                <Link
                  key={code}
                  href={`/${code}/news/${params.slug}`}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  {LANG_NAMES[code] || code}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
