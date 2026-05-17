/**
 * Faceted Search API
 *
 * GET /api/v1/search?q=bitcoin&type=articles&category=regulation&country=ng&lang=en&page=1&limit=20
 *
 * Tries Elasticsearch first, falls back to Prisma full-text search.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../context';
import { logger } from '../../utils/logger';

const router = Router();

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
  took: number; // ms
  source: 'elasticsearch' | 'prisma';
}

/* ── Elasticsearch attempt ── */

async function tryElasticsearch(
  query: string,
  filters: { type?: string; category?: string; country?: string; lang?: string },
  page: number,
  limit: number,
): Promise<SearchResponse | null> {
  try {
    // Dynamic import so missing ES doesn't crash startup
    const { Client } = await import('@elastic/elasticsearch');
    const esUrl = process.env.ELASTICSEARCH_URL || process.env.ELASTICSEARCH_NODE;
    if (!esUrl) return null;

    const client = new Client({ node: esUrl, requestTimeout: 5000 });

    // Ping first
    await client.ping();

    const must: any[] = [
      {
        multi_match: {
          query,
          fields: ['title^3', 'content^2', 'summary^2', 'tags^1.5', 'excerpt^1.5'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
    ];

    const filterClauses: any[] = [{ term: { status: 'published' } }];
    if (filters.category) filterClauses.push({ term: { category: filters.category } });
    if (filters.country) filterClauses.push({ term: { country: filters.country } });
    if (filters.lang) filterClauses.push({ term: { language: filters.lang } });

    const body: any = {
      query: { bool: { must, filter: filterClauses } },
      sort: [{ _score: { order: 'desc' } }, { publishedAt: { order: 'desc' } }],
      from: (page - 1) * limit,
      size: limit,
      highlight: {
        fields: {
          title: { number_of_fragments: 0 },
          content: { fragment_size: 160, number_of_fragments: 2 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
      aggs: {
        categories: { terms: { field: 'category.keyword', size: 20 } },
        countries: { terms: { field: 'country.keyword', size: 20 } },
        languages: { terms: { field: 'language.keyword', size: 10 } },
      },
    };

    const start = Date.now();
    const res = await client.search({ index: 'coindaily_articles', body });
    const took = Date.now() - start;

    const totalVal = typeof res.hits.total === 'number' ? res.hits.total : res.hits.total?.value || 0;

    const hits: SearchHit[] = res.hits.hits.map((h: any) => ({
      id: h._id,
      type: 'article' as const,
      title: h.highlight?.title?.[0] || h._source.title,
      excerpt: h.highlight?.content?.[0] || h._source.summary || h._source.excerpt,
      slug: h._source.slug || h._id,
      category: h._source.category,
      categorySlug: h._source.categorySlug,
      country: h._source.country,
      language: h._source.language,
      publishedAt: h._source.publishedAt,
      featuredImageUrl: h._source.featuredImageUrl,
      tags: h._source.tags || [],
      score: h._score,
    }));

    const aggs = (res.aggregations || {}) as any;

    return {
      query,
      total: totalVal,
      page,
      limit,
      totalPages: Math.ceil(totalVal / limit),
      hits,
      facets: {
        categories: (aggs.categories?.buckets || []).map((b: any) => ({ key: b.key, count: b.doc_count })),
        countries: (aggs.countries?.buckets || []).map((b: any) => ({ key: b.key, count: b.doc_count })),
        languages: (aggs.languages?.buckets || []).map((b: any) => ({ key: b.key, count: b.doc_count })),
        types: [{ key: 'article', count: totalVal }],
      },
      took,
      source: 'elasticsearch',
    };
  } catch (err: any) {
    logger.warn('[Search] Elasticsearch unavailable, falling back to Prisma', { error: err.message });
    return null;
  }
}

/* ── Prisma fallback ── */

async function prismaSearch(
  query: string,
  filters: { type?: string; category?: string; country?: string; lang?: string },
  page: number,
  limit: number,
): Promise<SearchResponse> {
  const start = Date.now();
  const offset = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (filters.category) {
    where.category = { slug: filters.category };
  }
  if (filters.country) {
    where.countryCode = filters.country.toUpperCase();
  }
  if (filters.lang) {
    where.language = filters.lang;
  }

  // Run count and find in parallel
  const [total, articles, categoryAgg, langAgg] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        territory: true,
        language: true,
        publishedAt: true,
        featuredImageUrl: true,
        Category: { select: { name: true, slug: true } },
      },
      orderBy: [{ publishedAt: 'desc' }],
      skip: offset,
      take: limit,
    }),
    // Category facet
    prisma.article.groupBy({
      by: ['categoryId'],
      where: { status: 'PUBLISHED', OR: where.OR },
      _count: true,
    }),
    // Language facet
    prisma.article.groupBy({
      by: ['language'],
      where: { status: 'PUBLISHED', OR: where.OR },
      _count: true,
    }),
  ]);

  // Resolve category names for facets
  const categoryIds = categoryAgg.map((c: any) => c.categoryId).filter(Boolean);
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const catMap = new Map(categories.map((c: any) => [c.id, c]));

  const hits: SearchHit[] = articles.map((a: any) => ({
    id: a.id,
    type: 'article' as const,
    title: a.title,
    excerpt: a.excerpt,
    slug: a.slug,
    category: a.Category?.name || null,
    categorySlug: a.Category?.slug || null,
    country: Array.isArray(a.territory) && a.territory.length > 0 ? a.territory[0] : a.language,
    language: a.language,
    publishedAt: a.publishedAt?.toISOString() || null,
    featuredImageUrl: a.featuredImageUrl,
    tags: [],
  }));

  const took = Date.now() - start;

  return {
    query,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hits,
    facets: {
      categories: categoryAgg
        .filter((c: any) => c.categoryId)
        .map((c: any) => ({
          key: catMap.get(c.categoryId)?.slug || c.categoryId,
          count: c._count,
        })),
      countries: langAgg
        .filter((l: any) => l.language)
        .map((l: any) => ({ key: l.language, count: l._count })),
      languages: langAgg
        .filter((l: any) => l.language)
        .map((l: any) => ({ key: l.language, count: l._count })),
      types: [{ key: 'article', count: total }],
    },
    took,
    source: 'prisma',
  };
}

/* ── Route ── */

/**
 * GET /api/v1/search
 *
 * Query params:
 *   q        - search query (required)
 *   type     - content type filter (articles, factsheet, press_release)
 *   category - category slug filter
 *   country  - country code filter (ng, ke, za, gh)
 *   lang     - language code filter (en, ha, yo, sw, zu)
 *   page     - page number (default 1)
 *   limit    - results per page (default 20, max 50)
 */
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Missing required query parameter: q' });
  }
  if (q.length > 200) {
    return res.status(400).json({ error: 'Query too long (max 200 characters)' });
  }

  const type = req.query.type as string | undefined;
  const category = req.query.category as string | undefined;
  const country = req.query.country as string | undefined;
  const lang = req.query.lang as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  try {
    const filters = { type, category, country, lang };

    // Try Elasticsearch first
    let result = await tryElasticsearch(q, filters, page, limit);

    // Fallback to Prisma
    if (!result) {
      result = await prismaSearch(q, filters, page, limit);
    }

    res.json(result);
  } catch (err: any) {
    logger.error('[Search] Error:', { error: err.message, query: q });
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

/**
 * GET /api/v1/search/suggest
 *
 * Quick autocomplete suggestions.
 * Query params:
 *   q     - partial query (min 2 chars)
 *   limit - max suggestions (default 5)
 */
router.get('/suggest', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        title: { contains: q, mode: 'insensitive' },
      },
      select: { title: true, slug: true },
      orderBy: { publishedAt: 'desc' },
      take: parseInt(req.query.limit as string) || 5,
    });

    res.json({
      suggestions: articles.map((a: any) => ({
        text: a.title,
        slug: a.slug,
      })),
    });
  } catch (err: any) {
    logger.error('[Search] Suggest error:', { error: err.message });
    res.json({ suggestions: [] });
  }
});

export default router;
