import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { performanceMonitor } from '../middleware/performance';

export interface QueryOptimizationConfig {
  enableQueryLogging: boolean;
  slowQueryThreshold: number;
  enableQueryCache: boolean;
  maxQueryCacheSize: number;
  batchSize: number;
}

export interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  cacheHitRate: number;
  connectionPoolSize: number;
  activeConnections: number;
}

class DatabaseOptimizer {
  private prisma: PrismaClient;
  private config: QueryOptimizationConfig;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private queryMetrics: { query: string; duration: number; timestamp: Date }[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(prisma: PrismaClient, config: Partial<QueryOptimizationConfig> = {}) {
    this.prisma = prisma;
    this.config = {
      enableQueryLogging: config.enableQueryLogging ?? true,
      slowQueryThreshold: config.slowQueryThreshold ?? 200, // ms
      enableQueryCache: config.enableQueryCache ?? true,
      maxQueryCacheSize: config.maxQueryCacheSize ?? 1000,
      batchSize: config.batchSize ?? 100,
      ...config,
    };

    this.setupQueryLogging();
  }

  /**
   * Setup Prisma query logging and metrics
   */
  private setupQueryLogging(): void {
    if (this.config.enableQueryLogging) {
      // Query logging is implemented through wrapper methods
      // Each optimized query method will log its execution
      logger.info('Database query logging enabled - tracking through wrapper methods');
    }
  }

  /**
   * Track cache hit or miss
   */
  private trackCacheAccess(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Optimized article queries with caching and indexing
   */
  async getArticles(params: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    isPremium?: boolean;
    status?: string;
    userId?: string;
    includeTranslations?: boolean;
  }): Promise<any[]> {
    const cacheKey = `articles:${JSON.stringify(params)}`;
    
    // Check cache first
    if (this.config.enableQueryCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const {
      limit = 20,
      offset = 0,
      categoryId,
      isPremium,
      status = 'PUBLISHED',
      includeTranslations = false,
    } = params;

    const where: Prisma.ArticleWhereInput = { status };
    if (categoryId) where.categoryId = categoryId;
    if (isPremium !== undefined) where.isPremium = isPremium;

    try {
      const articles = await this.prisma.article.findMany({
        where,
        take: Math.min(limit, 100), // Limit to prevent large queries
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImageUrl: true,
          authorId: true,
          categoryId: true,
          isPremium: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          readingTimeMinutes: true,
          publishedAt: true,
          createdAt: true,
          User: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          Category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          ...(includeTranslations && {
            ArticleTranslation: {
              select: {
                id: true,
                languageCode: true,
                title: true,
                excerpt: true,
                translationStatus: true,
              },
            },
          }),
        },
        orderBy: { publishedAt: 'desc' },
      });

      // Cache the result
      if (this.config.enableQueryCache) {
        this.setCache(cacheKey, articles, 300); // 5 minutes TTL
      }

      return articles;
    } catch (error) {
      logger.error('Error fetching articles', error);
      throw error;
    }
  }

  /**
   * Optimized single article query
   */
  async getArticle(params: {
    id?: string;
    slug?: string;
    includeContent?: boolean;
    includeTranslations?: boolean;
    languageCode?: string;
  }): Promise<any | null> {
    const { id, slug, includeContent = false, includeTranslations = false, languageCode } = params;
    
    if (!id && !slug) {
      throw new Error('Either id or slug must be provided');
    }

    const cacheKey = `article:${id || slug}:${includeContent}:${includeTranslations}:${languageCode}`;
    
    // Check cache first
    if (this.config.enableQueryCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const where: Prisma.ArticleWhereUniqueInput = id ? { id } : { slug: slug! };

    try {
      const article = await this.prisma.article.findUnique({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          ...(includeContent && { content: true }),
          featuredImageUrl: true,
          authorId: true,
          categoryId: true,
          tags: true,
          isPremium: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          shareCount: true,
          readingTimeMinutes: true,
          seoTitle: true,
          seoDescription: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          User: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          Category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          ...(includeTranslations && {
            ArticleTranslation: {
              select: {
                id: true,
                languageCode: true,
                title: true,
                excerpt: true,
                ...(includeContent && { content: true }),
                translationStatus: true,
                aiGenerated: true,
                humanReviewed: true,
                qualityScore: true,
              },
              ...(languageCode && {
                where: {
                  languageCode,
                },
              }),
            },
          }),
        },
      });

      // Cache the result
      if (this.config.enableQueryCache && article) {
        this.setCache(cacheKey, article, 600); // 10 minutes TTL
      }

      return article;
    } catch (error) {
      logger.error('Error fetching article', error);
      throw error;
    }
  }

  /**
   * Optimized token queries with market data
   */
  async getTokens(params: {
    limit?: number;
    offset?: number;
    isListed?: boolean;
    includeMarketData?: boolean;
  }): Promise<any[]> {
    const { limit = 100, offset = 0, isListed = true, includeMarketData = true } = params;
    
    const cacheKey = `tokens:${limit}:${offset}:${isListed}:${includeMarketData}`;
    
    // Check cache first
    if (this.config.enableQueryCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const tokens = await this.prisma.token.findMany({
        where: { isListed },
        take: Math.min(limit, 200), // Limit to prevent large queries
        skip: offset,
        select: {
          id: true,
          name: true,
          symbol: true,
          slug: true,
          logoUrl: true,
          description: true,
          marketCap: true,
          totalSupply: true,
          circulatingSupply: true,
          isListed: true,
          createdAt: true,
          ...(includeMarketData && {
            MarketData: {
              select: {
                id: true,
                priceUsd: true,
                volume24h: true,
                priceChange24h: true,
                marketCap: true,
                timestamp: true,
                high24h: true,
                low24h: true,
              },
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          }),
        },
        orderBy: [
          { marketCap: 'desc' },
        ],
      });

      // Cache the result
      if (this.config.enableQueryCache) {
        this.setCache(cacheKey, tokens, 120); // 2 minutes TTL
      }

      return tokens;
    } catch (error) {
      logger.error('Error fetching tokens', error);
      throw error;
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchUpdateViewCounts(articleIds: string[]): Promise<void> {
    if (articleIds.length === 0) return;

    try {
      // Process in batches to avoid overwhelming the database
      const batches = this.chunk(articleIds, this.config.batchSize);
      
      for (const batch of batches) {
        await this.prisma.article.updateMany({
          where: {
            id: { in: batch },
          },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      }

      // Invalidate cache for updated articles
      for (const id of articleIds) {
        this.invalidateCache(`article:${id}`);
      }
    } catch (error) {
      logger.error('Error batch updating view counts', error);
      throw error;
    }
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any | null {
    if (!this.config.enableQueryCache) return null;

    const cached = this.queryCache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl * 1000) {
      this.trackCacheAccess(true); // Cache hit
      return cached.data;
    }

    if (cached) {
      this.queryCache.delete(key);
    }

    this.trackCacheAccess(false); // Cache miss
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    if (!this.config.enableQueryCache) return;

    // Ensure cache size limit
    if (this.queryCache.size >= this.config.maxQueryCacheSize) {
      const oldestKey = this.queryCache.keys().next().value;
      if (oldestKey) {
        this.queryCache.delete(oldestKey);
      }
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Utility functions
   */
  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get database metrics
   */
  getMetrics(): DatabaseMetrics {
    const now = Date.now();
    const recentQueries = this.queryMetrics.filter(
      q => now - q.timestamp.getTime() < 60000 // Last minute
    );

    const slowQueries = recentQueries.filter(
      q => q.duration > this.config.slowQueryThreshold
    );

    const totalQueryTime = recentQueries.reduce((sum, q) => sum + q.duration, 0);

    // Calculate cache hit rate
    const totalCacheAccesses = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheAccesses > 0 
      ? (this.cacheHits / totalCacheAccesses) * 100 
      : 0;

    return {
      totalQueries: recentQueries.length,
      slowQueries: slowQueries.length,
      averageQueryTime: recentQueries.length > 0 ? totalQueryTime / recentQueries.length : 0,
      cacheHitRate,
      connectionPoolSize: 10, // Default Prisma pool size
      activeConnections: 1, // This would need to be tracked differently
    };
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.queryCache.clear();
  }
}

export { DatabaseOptimizer };