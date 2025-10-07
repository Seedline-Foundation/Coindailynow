import { ElasticsearchService } from '../services/elasticsearchService';
import { CacheService } from './cache';
import { logger } from '../utils/logger';
import { Redis } from 'ioredis';

/**
 * ElasticsearchMiddleware - Integrates Elasticsearch search with the existing cache layer
 * Task 5: Elasticsearch Search Foundation with African language support
 */
export class ElasticsearchMiddleware {
  private elasticsearchService: ElasticsearchService;
  private cacheService: CacheService;

  constructor(elasticsearchService?: ElasticsearchService, cacheService?: CacheService) {
    this.elasticsearchService = elasticsearchService || new ElasticsearchService();
    this.cacheService = cacheService || new CacheService(new Redis(process.env.REDIS_URL || 'redis://localhost:6379'));
  }

  /**
   * Initialize Elasticsearch with health checks
   */
  async initialize(): Promise<void> {
    try {
      // Initialize indexes
      await this.elasticsearchService.initializeIndexes();
      
      // Health check
      const health = await this.elasticsearchService.getClusterHealth();
      logger.info('Elasticsearch cluster health:', health);

      if (health.status === 'red') {
        throw new Error('Elasticsearch cluster is in red state');
      }

      logger.info('Elasticsearch middleware initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch middleware:', error);
      throw error;
    }
  }

  /**
   * Search middleware with cache integration
   */
  async searchWithCache(query: string, options: any = {}): Promise<any> {
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    
    try {
      // Check cache first (integrates with Task 4 Redis caching)
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        logger.debug('Search cache hit:', { query, options });
        return cached;
      }

      // Perform Elasticsearch search
      const results = await this.elasticsearchService.searchArticles(query, options);
      
      // Cache results for 5 minutes (300 seconds)
      await this.cacheService.set(cacheKey, results, 300);
      
      logger.debug('Search cache miss, results cached:', { 
        query, 
        options, 
        totalResults: results.total,
        responseTime: results.took 
      });

      return results;
    } catch (error) {
      logger.error('Search with cache failed:', error);
      throw error;
    }
  }

  /**
   * Bulk index articles with cache invalidation
   */
  async bulkIndexWithCacheInvalidation(articles: any[]): Promise<any> {
    try {
      // Perform bulk indexing
      const result = await this.elasticsearchService.bulkIndexArticles(articles);
      
      // Invalidate related search caches
      await this.invalidateSearchCaches(articles);
      
      logger.info('Bulk indexing completed with cache invalidation:', {
        indexed: result.indexed,
        errors: result.errors
      });

      return result;
    } catch (error) {
      logger.error('Bulk indexing with cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Update article with cache invalidation
   */
  async updateArticleWithCacheInvalidation(id: string, updates: any): Promise<any> {
    try {
      // Update article in Elasticsearch
      const result = await this.elasticsearchService.updateArticle(id, updates);
      
      // Invalidate related search caches
      await this.invalidateSearchCaches([{ id, ...updates }]);
      
      logger.info('Article updated with cache invalidation:', { id, updates });

      return result;
    } catch (error) {
      logger.error('Article update with cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Delete article with cache invalidation
   */
  async deleteArticleWithCacheInvalidation(id: string): Promise<any> {
    try {
      // Delete article from Elasticsearch
      const result = await this.elasticsearchService.deleteArticle(id);
      
      // Clear all search caches (simple approach)
      await this.cacheService.deleteByPattern('search:*');
      
      logger.info('Article deleted with cache invalidation:', { id });

      return result;
    } catch (error) {
      logger.error('Article deletion with cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Get search analytics with caching
   */
  async getSearchAnalyticsWithCache(options: any = {}): Promise<any> {
    const cacheKey = `analytics:search:${JSON.stringify(options)}`;
    
    try {
      // Check cache first (analytics data changes less frequently)
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get fresh analytics
      const analytics = await this.elasticsearchService.getSearchAnalytics(options);
      
      // Cache for 15 minutes (900 seconds)
      await this.cacheService.set(cacheKey, analytics, 900);
      
      return analytics;
    } catch (error) {
      logger.error('Search analytics with cache failed:', error);
      throw error;
    }
  }

  /**
   * Get African search analytics with caching
   */
  async getAfricanSearchAnalyticsWithCache(): Promise<any> {
    const cacheKey = 'analytics:african:search';
    
    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get fresh analytics
      const analytics = await this.elasticsearchService.getAfricanSearchAnalytics();
      
      // Cache for 30 minutes (1800 seconds)
      await this.cacheService.set(cacheKey, analytics, 1800);
      
      return analytics;
    } catch (error) {
      logger.error('African search analytics with cache failed:', error);
      throw error;
    }
  }

  /**
   * Market data search with caching
   */
  async searchMarketDataWithCache(filters: any): Promise<any> {
    const cacheKey = `market:search:${JSON.stringify(filters)}`;
    
    try {
      // Check cache first (market data cache for 30 seconds as per Task 4)
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Perform market data search
      const results = await this.elasticsearchService.searchMarketData(filters);
      
      // Cache for 30 seconds (market data changes frequently)
      await this.cacheService.set(cacheKey, results, 30);
      
      return results;
    } catch (error) {
      logger.error('Market data search with cache failed:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions with caching
   */
  async getSuggestionsWithCache(text: string, options: any = {}): Promise<any> {
    const cacheKey = `suggestions:${text}:${JSON.stringify(options)}`;
    
    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get fresh suggestions
      const suggestions = await this.elasticsearchService.getSuggestions(text, options);
      
      // Cache for 10 minutes (600 seconds)
      await this.cacheService.set(cacheKey, suggestions, 600);
      
      return suggestions;
    } catch (error) {
      logger.error('Suggestions with cache failed:', error);
      throw error;
    }
  }

  /**
   * Health check with caching
   */
  async getHealthWithCache(): Promise<any> {
    const cacheKey = 'elasticsearch:health';
    
    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get fresh health status
      const health = await this.elasticsearchService.getClusterHealth();
      
      // Cache for 60 seconds
      await this.cacheService.set(cacheKey, health, 60);
      
      return health;
    } catch (error) {
      logger.error('Health check with cache failed:', error);
      throw error;
    }
  }

  /**
   * Invalidate search caches based on article content
   */
  private async invalidateSearchCaches(articles: any[]): Promise<void> {
    try {
      // Extract keywords that might affect search results
      const keywords = new Set<string>();
      
      for (const article of articles) {
        if (article.title) {
          article.title.split(' ').forEach((word: string) => {
            if (word.length > 3) {
              keywords.add(word.toLowerCase());
            }
          });
        }
        
        if (article.tags) {
          article.tags.forEach((tag: string) => keywords.add(tag.toLowerCase()));
        }
        
        if (article.category) {
          keywords.add(article.category.toLowerCase());
        }
        
        if (article.language) {
          keywords.add(article.language);
        }
      }

      // Invalidate caches containing these keywords
      for (const keyword of keywords) {
        await this.cacheService.deleteByPattern(`search:*${keyword}*`);
      }

      // Also clear general search analytics cache
      await this.cacheService.deleteByPattern('analytics:*');
      
      logger.debug('Search caches invalidated for keywords:', Array.from(keywords));
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
      // Don't throw - cache invalidation failure shouldn't break indexing
    }
  }

  /**
   * Clear all search-related caches
   */
  async clearAllSearchCaches(): Promise<void> {
    try {
      await this.cacheService.deleteByPattern('search:*');
      await this.cacheService.deleteByPattern('analytics:*');
      await this.cacheService.deleteByPattern('suggestions:*');
      await this.cacheService.deleteByPattern('market:search:*');
      
      logger.info('All search caches cleared');
    } catch (error) {
      logger.error('Failed to clear search caches:', error);
      throw error;
    }
  }

  /**
   * Get service instance for direct access
   */
  getElasticsearchService(): ElasticsearchService {
    return this.elasticsearchService;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      // Clear cache
      this.elasticsearchService.clearCache();
      
      logger.info('Elasticsearch middleware shutdown completed');
    } catch (error) {
      logger.error('Elasticsearch middleware shutdown failed:', error);
      throw error;
    }
  }
}