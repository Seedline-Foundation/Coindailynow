/**
 * News Listing Page
 * Shows latest published articles
 */

import Link from 'next/link';

interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  author?: {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

async function getLatestArticles(): Promise<ArticleListItem[]> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:3001';

  const response = await fetch(`${backendUrl}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetLatestArticles($limit: Int!, $status: ArticleStatus) {
          articles(limit: $limit, status: $status) {
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
            author {
              username
              firstName
              lastName
            }
          }
        }
      `,
      variables: { limit: 24, status: 'PUBLISHED' }
    }),
    next: { revalidate: 60 }
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data?.data?.articles ?? [];
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

export default async function NewsIndexPage() {
  const articles = await getLatestArticles();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Latest News</h1>
            <p className="text-gray-600 mt-2">Africa-first crypto coverage, updated daily.</p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            No published articles yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {article.featuredImageUrl ? (
                  <img
                    src={article.featuredImageUrl}
                    alt={article.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-purple-50" />
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                      {article.category?.name || 'News'}
                    </span>
                    <span>{formatDate(article.publishedAt || article.updatedAt)}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
                  )}
                  <div className="mt-4 text-xs text-gray-500">
                    {(article.author?.firstName || article.author?.lastName || article.author?.username) && (
                      <span>
                        {article.author?.firstName || ''} {article.author?.lastName || ''}
                        {(!article.author?.firstName && !article.author?.lastName) ? article.author?.username : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}