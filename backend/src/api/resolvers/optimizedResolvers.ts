import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from '../context';
import { DatabaseOptimizer } from '../../services/databaseOptimizer';
import { AdvancedCacheStrategy } from '../../services/advancedCacheStrategy';
import { performanceMonitor } from '../../middleware/performance';
import { logger } from '../../utils/logger';

export interface OptimizedResolverContext extends GraphQLContext {
  dbOptimizer: DatabaseOptimizer;
  cacheStrategy: AdvancedCacheStrategy;
}

/**
 * Performance-optimized GraphQL resolvers
 * - Implements sub-500ms response times
 * - Uses advanced caching strategies
 * - Optimizes database queries
 * - Tracks performance metrics
 */
export const optimizedResolvers: IResolvers<any, OptimizedResolverContext> = {
  Query: {
    // Optimized health check with performance metrics
    health: async (_: any, __: any, context: OptimizedResolverContext) => {
      const startTime = Date.now();
      
      try {
        // Check database connection
        await context.prisma.$queryRaw`SELECT 1`;
        
        // Get performance metrics
        const metrics = await performanceMonitor.getStats('hour');
        const cacheHealth = await context.cacheStrategy.getCacheHealth();
        
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'OK',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          performance: {
            responseTime,
            averageResponseTime: metrics.averageResponseTime,
            cacheHitRate: cacheHealth.averageHitRate,
            slowQueries: metrics.slowQueries,
          },
        };
      } catch (error) {
        logger.error('Health check failed', error);
        return {
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          error: 'Database connection failed',
        };
      }
    },

    // Optimized articles query with caching and performance tracking
    articles: async (
      _: any,
      args: {
        limit?: number;
        offset?: number;
        categoryId?: string;
        isPremium?: boolean;
        status?: string;
        includeTranslations?: boolean;
      },
      context: OptimizedResolverContext
    ) => {
      const startTime = Date.now();
      const { limit = 20, offset = 0, categoryId, isPremium, status, includeTranslations = false } = args;
      
      try {
        // Use optimized database query
        const articles = await context.dbOptimizer.getArticles({
          limit: Math.min(limit, 50), // Enforce reasonable limits
          offset,
          ...(categoryId && { categoryId }),
          ...(isPremium !== undefined && { isPremium }),
          status: status || 'PUBLISHED',
          includeTranslations,
        });

        const responseTime = Date.now() - startTime;
        
        // Log performance if slow
        if (responseTime > 200) {
          logger.warn('Slow articles query', {
            responseTime,
            args,
            resultCount: articles.length,
          });
        }

        return articles;
      } catch (error) {
        logger.error('Error fetching articles', error);
        throw new Error('Failed to fetch articles');
      }
    },

    // Optimized single article query
    article: async (
      _: any,
      args: {
        id?: string;
        slug?: string;
        includeContent?: boolean;
        includeTranslations?: boolean;
        languageCode?: string;
      },
      context: OptimizedResolverContext
    ) => {
      const startTime = Date.now();
      const { id, slug, includeContent = true, includeTranslations = false, languageCode } = args;

      if (!id && !slug) {
        throw new Error('Either id or slug must be provided');
      }

      try {
        // Use optimized database query with caching
        const article = await context.dbOptimizer.getArticle({
          ...(id && { id }),
          ...(slug && { slug }),
          includeContent,
          includeTranslations,
          ...(languageCode && { languageCode }),
        });

        const responseTime = Date.now() - startTime;

        if (responseTime > 200) {
          logger.warn('Slow article query', {
            responseTime,
            args,
            found: !!article,
          });
        }

        // Update view count asynchronously (non-blocking)
        if (article && id) {
          setImmediate(() => {
            context.dbOptimizer.batchUpdateViewCounts([id]).catch((error) => {
              logger.error('Failed to update view count', error);
            });
          });
        }

        return article;
      } catch (error) {
        logger.error('Error fetching article', error);
        throw new Error('Failed to fetch article');
      }
    },

    // Optimized tokens query with market data
    tokens: async (
      _: any,
      args: {
        limit?: number;
        offset?: number;
        isListed?: boolean;
        includeMarketData?: boolean;
      },
      context: OptimizedResolverContext
    ) => {
      const startTime = Date.now();
      const { limit = 50, offset = 0, isListed = true, includeMarketData = true } = args;

      try {
        // Check cache first
        const cacheKey = `tokens_list:${limit}:${offset}:${isListed}:${includeMarketData}`;
        const cached = await context.cacheStrategy.get('tokens', cacheKey);
        
        if (cached) {
          return cached;
        }

        // Use optimized database query
        const tokens = await context.dbOptimizer.getTokens({
          limit: Math.min(limit, 100), // Enforce reasonable limits
          offset,
          isListed,
          includeMarketData,
        });

        const responseTime = Date.now() - startTime;

        // Cache the results
        await context.cacheStrategy.set('tokens', cacheKey, tokens);

        if (responseTime > 200) {
          logger.warn('Slow tokens query', {
            responseTime,
            args,
            resultCount: tokens.length,
          });
        }

        return tokens;
      } catch (error) {
        logger.error('Error fetching tokens', error);
        throw new Error('Failed to fetch tokens');
      }
    },

    // Optimized categories query with caching
    categories: async (
      _: any,
      args: { parentId?: string },
      context: OptimizedResolverContext
    ) => {
      const startTime = Date.now();
      const { parentId } = args;

      try {
        // Check cache first
        const cacheKey = `categories:${parentId || 'root'}`;
        const cached = await context.cacheStrategy.get('categories', cacheKey);
        
        if (cached) {
          return cached;
        }

        const categories = await context.prisma.category.findMany({
          where: {
            isActive: true,
            ...(parentId ? { parentId } : { parentId: null }),
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            iconUrl: true,
            colorHex: true,
            sortOrder: true,
            isActive: true,
            articleCount: true,
          },
          orderBy: { sortOrder: 'asc' },
        });

        const responseTime = Date.now() - startTime;

        // Cache the results for 1 hour
        await context.cacheStrategy.set('categories', cacheKey, categories, undefined, 3600);

        if (responseTime > 100) {
          logger.warn('Slow categories query', {
            responseTime,
            args,
            resultCount: categories.length,
          });
        }

        return categories;
      } catch (error) {
        logger.error('Error fetching categories', error);
        throw new Error('Failed to fetch categories');
      }
    },

    // Performance monitoring endpoint
    performanceStats: async (
      _: any,
      args: { timeRange?: 'hour' | 'day' },
      context: OptimizedResolverContext
    ) => {
      try {
        const { timeRange = 'hour' } = args;
        
        const [apiStats, cacheHealth] = await Promise.all([
          performanceMonitor.getStats(timeRange),
          context.cacheStrategy.getCacheHealth(),
        ]);

        return {
          timeRange,
          api: {
            totalRequests: apiStats.totalRequests,
            averageResponseTime: apiStats.averageResponseTime,
            p95ResponseTime: apiStats.p95ResponseTime,
            p99ResponseTime: apiStats.p99ResponseTime,
            slowQueries: apiStats.slowQueries,
            errorRate: apiStats.errorRate,
            requestsPerMinute: apiStats.requestsPerMinute,
          },
          cache: {
            hitRate: cacheHealth.averageHitRate,
            totalKeys: cacheHealth.totalKeys,
            memoryUsage: cacheHealth.totalMemoryUsage,
            strategiesHealth: cacheHealth.strategiesHealth,
          },
        };
      } catch (error) {
        logger.error('Error fetching performance stats', error);
        throw new Error('Failed to fetch performance statistics');
      }
    },
  },

  Mutation: {
    // Optimized cache invalidation
    invalidateCache: async (
      _: any,
      args: { strategy?: string; pattern?: string; tag?: string },
      context: OptimizedResolverContext
    ) => {
      try {
        const { strategy, pattern, tag } = args;
        let invalidatedCount = 0;

        if (tag) {
          invalidatedCount = await context.cacheStrategy.invalidateByTag(tag);
        } else if (strategy) {
          invalidatedCount = await context.cacheStrategy.invalidate(strategy, pattern);
        } else {
          // Invalidate all strategies
          for (const strategyName of ['articles', 'tokens', 'categories', 'search_results']) {
            invalidatedCount += await context.cacheStrategy.invalidate(strategyName);
          }
        }

        return {
          success: true,
          invalidatedCount,
          message: `Invalidated ${invalidatedCount} cache entries`,
        };
      } catch (error) {
        logger.error('Error invalidating cache', error);
        return {
          success: false,
          invalidatedCount: 0,
          message: 'Failed to invalidate cache',
        };
      }
    },

    // Optimized cache warmup
    warmupCache: async (
      _: any,
      args: { strategy: string },
      context: OptimizedResolverContext
    ) => {
      try {
        const { strategy } = args;
        
        if (strategy === 'articles' || strategy === 'all') {
          // Warm up popular articles
          const popularArticles = await context.dbOptimizer.getArticles({
            limit: 20,
            offset: 0,
            status: 'PUBLISHED',
          });

          const warmupData = popularArticles.map((article) => ({
            key: `articles:popular:20:0`,
            value: popularArticles,
          }));

          await context.cacheStrategy.warmup('articles', warmupData);
        }

        if (strategy === 'categories' || strategy === 'all') {
          // Warm up categories
          const categories = await context.prisma.category.findMany({
            where: { isActive: true, parentId: null },
            orderBy: { sortOrder: 'asc' },
          });

          await context.cacheStrategy.warmup('categories', [
            { key: 'categories:root', value: categories },
          ]);
        }

        return {
          success: true,
          message: `Cache warmed up for strategy: ${strategy}`,
        };
      } catch (error) {
        logger.error('Error warming up cache', error);
        return {
          success: false,
          message: 'Failed to warm up cache',
        };
      }
    },
  },
};

export default optimizedResolvers;