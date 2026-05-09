/**
 * GraphQL API client for the CoinDaily news frontend
 * Connects to backend at /graphql for all data queries
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function graphqlFetch<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: { revalidate?: number; tags?: string[] }
): Promise<T> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: options ? { revalidate: options.revalidate, tags: options.tags } : { revalidate: 60 },
  });

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }

  return json.data as T;
}

// ---- Article Queries ----

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string | null;
  status: string;
  isPremium: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  User?: { id: string; username: string; firstName: string; lastName: string; avatarUrl: string | null };
  Category?: { id: string; name: string; slug: string };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
}

const ARTICLE_FIELDS = `
  id
  title
  slug
  excerpt
  content
  featuredImageUrl
  status
  isPremium
  viewCount
  likeCount
  commentCount
  readingTimeMinutes
  publishedAt
  createdAt
  User {
    id
    username
    firstName
    lastName
    avatarUrl
  }
  Category {
    id
    name
    slug
  }
`;

export async function fetchArticles(params?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  status?: string;
}): Promise<Article[]> {
  const { limit = 20, offset = 0, categoryId, status = 'PUBLISHED' } = params || {};

  const data = await graphqlFetch<{ articles: Article[] }>(
    `query Articles($limit: Int, $offset: Int, $categoryId: ID, $status: ArticleStatus) {
      articles(limit: $limit, offset: $offset, categoryId: $categoryId, status: $status) {
        ${ARTICLE_FIELDS}
      }
    }`,
    { limit, offset, categoryId, status },
    { revalidate: 60, tags: ['articles'] }
  );

  return data.articles || [];
}

export async function fetchArticle(slug: string): Promise<Article | null> {
  const data = await graphqlFetch<{ article: Article | null }>(
    `query Article($slug: String!) {
      article(slug: $slug) {
        ${ARTICLE_FIELDS}
      }
    }`,
    { slug },
    { revalidate: 30, tags: ['article', slug] }
  );

  return data.article;
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await graphqlFetch<{ categories: Category[] }>(
    `query Categories {
      categories {
        id
        name
        slug
      }
    }`,
    {},
    { revalidate: 3600, tags: ['categories'] }
  );

  return data.categories || [];
}

export async function fetchTrendingArticles(limit = 5): Promise<Article[]> {
  try {
    const data = await graphqlFetch<{ trendingArticles: Article[] }>(
      `query Trending($limit: Int) {
        trendingArticles(limit: $limit) {
          ${ARTICLE_FIELDS}
        }
      }`,
      { limit },
      { revalidate: 300 }
    );
    return data.trendingArticles || [];
  } catch {
    // Fallback: fetch latest articles ordered by views
    return fetchArticles({ limit });
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  // Use REST endpoint for search if available, or fallback to fetching all
  try {
    const res = await fetch(`${API_URL}/api/super-admin/articles?search=${encodeURIComponent(query)}&limit=20`);
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}
