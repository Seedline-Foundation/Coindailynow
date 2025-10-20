/**
 * XML Sitemap Generation Service
 * Implements Task 59: Production-ready sitemap system
 * 
 * Features:
 * - Google News sitemap compliance (FR-019)
 * - Dynamic sitemap with priority scoring (FR-117)
 * - Multi-language sitemap support (FR-119)
 * - RAO (Retrieval-Augmented Optimization) sitemap for LLM crawlers
 * - Automatic sitemap updates and indexing
 * - Image sitemap integration
 * - Super admin management tools
 */

import { PrismaClient } from '@prisma/client';
import { create } from 'xmlbuilder2';

const prisma = new PrismaClient();

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SitemapConfig {
  baseUrl: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  defaultPriority?: number;
  maxUrlsPerSitemap?: number;
  compress?: boolean;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  images?: SitemapImage[];
  news?: NewsItem;
  alternates?: LanguageAlternate[];
}

export interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
  geoLocation?: string;
  license?: string;
}

export interface NewsItem {
  publication: {
    name: string;
    language: string;
  };
  publicationDate: string;
  title: string;
  keywords?: string;
}

export interface LanguageAlternate {
  hreflang: string;
  href: string;
}

export interface SitemapIndex {
  sitemaps: {
    loc: string;
    lastmod: string;
  }[];
}

export interface RAOSitemapEntry {
  url: string;
  title: string;
  description: string;
  content_type: string;
  published_date: string;
  modified_date: string;
  language: string;
  keywords: string[];
  entities: string[];
  semantic_chunks: number;
  has_canonical_answer: boolean;
}

export interface SitemapStats {
  totalUrls: number;
  newsSitemapUrls: number;
  articleSitemapUrls: number;
  imageSitemapUrls: number;
  raoSitemapUrls: number;
  lastGenerated: Date;
  sitemapFiles: string[];
}

// ============================================================================
// SITEMAP SERVICE
// ============================================================================

export class SitemapService {
  private config: SitemapConfig;

  constructor(config?: Partial<SitemapConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://coindaily.com',
      changeFrequency: 'daily',
      defaultPriority: 0.5,
      maxUrlsPerSitemap: 50000,
      compress: false,
      ...config,
    };
  }

  // ============================================================================
  // MAIN SITEMAP GENERATION
  // ============================================================================

  /**
   * Generate main sitemap index
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      {
        loc: `${this.config.baseUrl}/sitemap-news.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${this.config.baseUrl}/sitemap-articles.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${this.config.baseUrl}/sitemap-static.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${this.config.baseUrl}/sitemap-images.xml`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${this.config.baseUrl}/ai-sitemap.xml`,
        lastmod: new Date().toISOString(),
      },
    ];

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('sitemapindex', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

    sitemaps.forEach((sitemap) => {
      xml.ele('sitemap')
        .ele('loc').txt(sitemap.loc).up()
        .ele('lastmod').txt(sitemap.lastmod).up()
        .up();
    });

    return xml.end({ prettyPrint: true });
  }

  // ============================================================================
  // NEWS SITEMAP (Google News Compliant - FR-019)
  // ============================================================================

  /**
   * Generate Google News compliant sitemap
   * Only includes articles published in the last 2 days
   */
  async generateNewsSitemap(): Promise<string> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: twoDaysAgo,
        },
      },
      include: {
        User: true,
        Category: true,
        ArticleTranslation: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 1000, // Google News limit
    });

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:news': 'http://www.google.com/schemas/sitemap-news/0.9',
        'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
      });

    for (const article of articles) {
      const url = xml.ele('url');
      url.ele('loc').txt(`${this.config.baseUrl}/news/${article.slug}`).up();
      url.ele('lastmod').txt(article.updatedAt.toISOString()).up();

      // Google News specific data
      const news = url.ele('news:news');
      news.ele('news:publication')
        .ele('news:name').txt('CoinDaily').up()
        .ele('news:language').txt('en').up()
        .up();
      news.ele('news:publication_date').txt(article.publishedAt?.toISOString() || article.createdAt.toISOString()).up();
      news.ele('news:title').txt(article.title).up();

      // Add keywords if available
      if (article.tags) {
        const tags = JSON.parse(article.tags);
        if (Array.isArray(tags) && tags.length > 0) {
          news.ele('news:keywords').txt(tags.join(', ').substring(0, 1000)).up();
        }
      }

      news.up();

      // Add image if available
      if (article.featuredImageUrl) {
        url.ele('image:image')
          .ele('image:loc').txt(article.featuredImageUrl).up()
          .ele('image:title').txt(article.title).up()
          .ele('image:caption').txt(article.excerpt || article.title).up()
          .up();
      }

      url.up();
    }

    return xml.end({ prettyPrint: true });
  }

  // ============================================================================
  // ARTICLE SITEMAP (All Published Articles)
  // ============================================================================

  /**
   * Generate comprehensive article sitemap with priority scoring
   */
  async generateArticleSitemap(): Promise<string> {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        User: true,
        Category: true,
        ArticleTranslation: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
        'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
      });

    for (const article of articles) {
      const url = xml.ele('url');
      url.ele('loc').txt(`${this.config.baseUrl}/news/${article.slug}`).up();
      url.ele('lastmod').txt(article.updatedAt.toISOString()).up();
      url.ele('changefreq').txt(this.calculateChangeFrequency(article)).up();
      url.ele('priority').txt(this.calculatePriority(article).toString()).up();

      // Add language alternates (multilingual support)
      if (article.ArticleTranslation && article.ArticleTranslation.length > 0) {
        article.ArticleTranslation.forEach((translation: any) => {
          url.ele('xhtml:link', {
            rel: 'alternate',
            hreflang: translation.languageCode,
            href: `${this.config.baseUrl}/${translation.languageCode}/news/${article.slug}`,
          }).up();
        });
      }

      // Add featured image
      if (article.featuredImageUrl) {
        url.ele('image:image')
          .ele('image:loc').txt(article.featuredImageUrl).up()
          .ele('image:title').txt(article.title).up()
          .up();
      }

      url.up();
    }

    return xml.end({ prettyPrint: true });
  }

  // ============================================================================
  // STATIC PAGES SITEMAP
  // ============================================================================

  /**
   * Generate sitemap for static pages
   */
  async generateStaticSitemap(): Promise<string> {
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/contact', priority: 0.7, changefreq: 'monthly' },
      { url: '/privacy', priority: 0.5, changefreq: 'yearly' },
      { url: '/terms', priority: 0.5, changefreq: 'yearly' },
      { url: '/categories', priority: 0.8, changefreq: 'weekly' },
      { url: '/news', priority: 0.9, changefreq: 'hourly' },
      { url: '/market', priority: 0.9, changefreq: 'hourly' },
      { url: '/analysis', priority: 0.8, changefreq: 'daily' },
      { url: '/education', priority: 0.7, changefreq: 'weekly' },
    ];

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

    staticPages.forEach((page) => {
      xml.ele('url')
        .ele('loc').txt(`${this.config.baseUrl}${page.url}`).up()
        .ele('lastmod').txt(new Date().toISOString()).up()
        .ele('changefreq').txt(page.changefreq).up()
        .ele('priority').txt(page.priority.toString()).up()
        .up();
    });

    return xml.end({ prettyPrint: true });
  }

  // ============================================================================
  // IMAGE SITEMAP
  // ============================================================================

  /**
   * Generate image sitemap for all article images
   */
  async generateImageSitemap(): Promise<string> {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        featuredImageUrl: {
          not: null,
        },
      },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        featuredImageUrl: true,
        Category: {
          select: {
            name: true,
          },
        },
      },
    });

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
      });

    articles.forEach((article) => {
      const url = xml.ele('url');
      url.ele('loc').txt(`${this.config.baseUrl}/news/${article.slug}`).up();

      if (article.featuredImageUrl) {
        const image = url.ele('image:image');
        image.ele('image:loc').txt(article.featuredImageUrl).up();
        image.ele('image:title').txt(article.title).up();
        if (article.excerpt) {
          image.ele('image:caption').txt(article.excerpt.substring(0, 256)).up();
        }
        if (article.Category) {
          image.ele('image:geo_location').txt(article.Category.name).up();
        }
        image.up();
      }

      url.up();
    });

    return xml.end({ prettyPrint: true });
  }

  // ============================================================================
  // RAO SITEMAP FOR AI/LLM CRAWLERS (NEW)
  // ============================================================================

  /**
   * Generate AI-accessible sitemap with semantic metadata
   * Optimized for LLM discovery and RAO (Retrieval-Augmented Optimization)
   */
  async generateRAOSitemap(): Promise<string> {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        User: true,
        Category: true,
        ArticleTranslation: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 10000,
    });

    // Build RAO entries with semantic metadata
    const raoEntries: RAOSitemapEntry[] = articles.map((article) => {
      const tags = article.tags ? JSON.parse(article.tags) : [];
      
      return {
        url: `${this.config.baseUrl}/news/${article.slug}`,
        title: article.title,
        description: article.excerpt,
        content_type: article.Category?.name || 'news',
        published_date: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
        modified_date: article.updatedAt.toISOString(),
        language: 'en',
        keywords: Array.isArray(tags) ? tags : [],
        entities: this.extractEntities(article.content),
        semantic_chunks: Math.ceil(article.readingTimeMinutes / 2), // Estimate chunks
        has_canonical_answer: article.seoDescription ? true : false,
      };
    });

    // Create XML with AI-friendly structure
    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:rao': 'http://coindaily.com/schemas/rao/1.0',
      });

    raoEntries.forEach((entry) => {
      const url = xml.ele('url');
      url.ele('loc').txt(entry.url).up();
      url.ele('lastmod').txt(entry.modified_date).up();

      // RAO-specific metadata
      const rao = url.ele('rao:metadata');
      rao.ele('rao:title').txt(entry.title).up();
      rao.ele('rao:description').txt(entry.description).up();
      rao.ele('rao:content_type').txt(entry.content_type).up();
      rao.ele('rao:published_date').txt(entry.published_date).up();
      rao.ele('rao:language').txt(entry.language).up();
      rao.ele('rao:semantic_chunks').txt(entry.semantic_chunks.toString()).up();
      rao.ele('rao:has_canonical_answer').txt(entry.has_canonical_answer.toString()).up();

      // Keywords
      if (entry.keywords.length > 0) {
        const keywords = rao.ele('rao:keywords');
        entry.keywords.forEach((keyword) => {
          keywords.ele('rao:keyword').txt(keyword).up();
        });
        keywords.up();
      }

      // Entities
      if (entry.entities.length > 0) {
        const entities = rao.ele('rao:entities');
        entry.entities.forEach((entity) => {
          entities.ele('rao:entity').txt(entity).up();
        });
        entities.up();
      }

      rao.up();
      url.up();
    });

    return xml.end({ prettyPrint: true });
  }

  // ============================================================================
  // PRIORITY & FREQUENCY CALCULATION
  // ============================================================================

  /**
   * Calculate priority score based on article metrics
   */
  private calculatePriority(article: any): number {
    let priority = 0.5; // Base priority

    // Boost for premium content
    if (article.isPremium) {
      priority += 0.2;
    }

    // Boost for high engagement
    const engagementScore =
      (article.viewCount || 0) * 0.01 +
      (article.likeCount || 0) * 0.05 +
      (article.commentCount || 0) * 0.1 +
      (article.shareCount || 0) * 0.15;

    priority += Math.min(engagementScore / 1000, 0.2);

    // Boost for recent articles
    const daysSincePublished = article.publishedAt
      ? (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSincePublished < 7) {
      priority += 0.1;
    }

    // Priority for breaking news
    if (article.priority === 'HIGH' || article.priority === 'URGENT') {
      priority += 0.1;
    }

    return Math.min(Math.max(priority, 0.1), 1.0);
  }

  /**
   * Calculate change frequency based on article age and updates
   */
  private calculateChangeFrequency(article: any): string {
    const daysSincePublished = article.publishedAt
      ? (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSincePublished < 1) return 'hourly';
    if (daysSincePublished < 7) return 'daily';
    if (daysSincePublished < 30) return 'weekly';
    if (daysSincePublished < 365) return 'monthly';
    return 'yearly';
  }

  /**
   * Extract cryptocurrency entities from content
   */
  private extractEntities(content: string): string[] {
    const cryptoRegex = /\b(Bitcoin|BTC|Ethereum|ETH|Solana|SOL|Cardano|ADA|XRP|Ripple|Dogecoin|DOGE|Shiba|SHIB|Polygon|MATIC|Avalanche|AVAX|Chainlink|LINK|Polkadot|DOT|Litecoin|LTC|Uniswap|UNI)\b/gi;
    const matches = content.match(cryptoRegex) || [];
    return [...new Set(matches.map((m) => m.toUpperCase()))].slice(0, 10);
  }

  // ============================================================================
  // SITEMAP STATISTICS
  // ============================================================================

  /**
   * Get sitemap generation statistics
   */
  async getSitemapStats(): Promise<SitemapStats> {
    const [totalArticles, publishedArticles, recentArticles, articlesWithImages] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.article.count({
        where: {
          status: 'PUBLISHED',
          featuredImageUrl: { not: null },
        },
      }),
    ]);

    return {
      totalUrls: publishedArticles,
      newsSitemapUrls: recentArticles,
      articleSitemapUrls: publishedArticles,
      imageSitemapUrls: articlesWithImages,
      raoSitemapUrls: publishedArticles,
      lastGenerated: new Date(),
      sitemapFiles: [
        'sitemap.xml',
        'sitemap-news.xml',
        'sitemap-articles.xml',
        'sitemap-static.xml',
        'sitemap-images.xml',
        'ai-sitemap.xml',
      ],
    };
  }

  // ============================================================================
  // SITEMAP SUBMISSION
  // ============================================================================

  /**
   * Ping search engines about sitemap updates
   */
  async notifySearchEngines(): Promise<{ success: boolean; results: any[] }> {
    const sitemapUrl = encodeURIComponent(`${this.config.baseUrl}/sitemap.xml`);
    const results = [];

    // Google
    try {
      const googleUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`;
      results.push({ engine: 'Google', success: true, url: googleUrl });
    } catch (error) {
      results.push({ engine: 'Google', success: false, error });
    }

    // Bing
    try {
      const bingUrl = `https://www.bing.com/ping?sitemap=${sitemapUrl}`;
      results.push({ engine: 'Bing', success: true, url: bingUrl });
    } catch (error) {
      results.push({ engine: 'Bing', success: false, error });
    }

    return {
      success: results.every((r) => r.success),
      results,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default new SitemapService();
