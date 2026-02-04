/**
 * Dynamic News Article Page
 * Displays individual news articles by slug
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';

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
}

async function getArticle(slug: string): Promise<Article | null> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:3001';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto px-4 py-12">
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
      </article>
    </div>
  );
}
