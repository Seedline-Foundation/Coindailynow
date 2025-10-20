/**
 * AI Search REST API
 * 
 * Provides AI-powered search capabilities including:
 * - Semantic search using embeddings
 * - Query understanding and expansion
 * - Personalized search results
 * - Multi-language search
 * - Query suggestions
 * 
 * @module api/ai-search
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { OpenAI } from 'openai';
import AISearchService, {
  SearchQuery,
  SemanticSearchParams,
  SearchFilters,
} from '../services/aiSearchService';

const router = express.Router();

// ============================================================================
// Initialize Services
// ============================================================================

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const aiSearchService = new AISearchService(prisma, redis, openai);

// ============================================================================
// Middleware
// ============================================================================

/**
 * Optional authentication middleware
 * Extracts user ID from JWT if present
 */
const optionalAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, validate JWT and extract user ID
    // For now, just pass through
    (req as any).userId = null;
  }
  next();
};

/**
 * Performance timing middleware
 */
const timingMiddleware = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

router.use(optionalAuth);
router.use(timingMiddleware);

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * POST /api/search/ai-enhanced
 * AI-powered search with query understanding, expansion, and personalization
 * 
 * Request Body:
 * {
 *   query: string;
 *   userId?: string;
 *   language?: string;
 *   filters?: {
 *     categoryId?: string;
 *     contentType?: string[];
 *     minQualityScore?: number;
 *     dateRange?: { start: Date; end: Date; };
 *     tags?: string[];
 *     isPremium?: boolean;
 *   };
 *   page?: number;
 *   limit?: number;
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     results: SearchResult[];
 *     totalCount: number;
 *     page: number;
 *     limit: number;
 *     hasMore: boolean;
 *     queryExpansions?: string[];
 *     suggestions?: string[];
 *     processingTime: number;
 *     cached: boolean;
 *   }
 * }
 */
router.post('/ai-enhanced', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      query,
      userId,
      language,
      filters,
      page = 1,
      limit = 10,
    } = req.body;

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameter is required and must be a non-empty string',
        },
      });
    }

    if (limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Limit cannot exceed 100 results per page',
        },
      });
    }

    // Build search params
    const searchParams: SearchQuery = {
      query: query.trim(),
      userId: userId || (req as any).userId,
      language,
      filters: filters as SearchFilters,
      page,
      limit,
    };

    // Execute AI-enhanced search
    const results = await aiSearchService.aiEnhancedSearch(searchParams);

    return res.json({
      success: true,
      data: results,
      meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('AI Enhanced Search API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred during search',
      },
    });
  }
});

/**
 * GET /api/search/suggestions/:query
 * Get AI-powered query suggestions
 * 
 * URL Parameters:
 *   query: string - The search query to get suggestions for
 * 
 * Query Parameters:
 *   limit?: number - Maximum number of suggestions (default: 5)
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     suggestions: Array<{
 *       suggestion: string;
 *       type: 'correction' | 'expansion' | 'related';
 *       score: number;
 *     }>;
 *     processingTime: number;
 *   }
 * }
 */
router.get('/suggestions/:query', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    // Validation
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameter is required',
        },
      });
    }

    if (limit > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Limit cannot exceed 20 suggestions',
        },
      });
    }

    // Get suggestions
    const suggestions = await aiSearchService.getQuerySuggestions(decodeURIComponent(query));

    return res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, limit),
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Query Suggestions API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SUGGESTIONS_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred getting suggestions',
      },
    });
  }
});

/**
 * POST /api/search/semantic
 * Semantic search using embeddings
 * 
 * Request Body:
 * {
 *   query: string;
 *   userId?: string;
 *   language?: string;
 *   limit?: number;
 *   minSimilarity?: number;
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     results: SearchResult[];
 *     processingTime: number;
 *   }
 * }
 */
router.post('/semantic', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      query,
      userId,
      language,
      limit = 10,
      minSimilarity = 0.7,
    } = req.body;

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameter is required and must be a non-empty string',
        },
      });
    }

    if (limit > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Limit cannot exceed 50 results for semantic search',
        },
      });
    }

    if (minSimilarity < 0 || minSimilarity > 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIMILARITY',
          message: 'minSimilarity must be between 0 and 1',
        },
      });
    }

    // Build params
    const params: SemanticSearchParams = {
      query: query.trim(),
      userId: userId || (req as any).userId,
      language,
      limit,
      minSimilarity,
    };

    // Execute semantic search
    const results = await aiSearchService.semanticSearch(params);

    return res.json({
      success: true,
      data: {
        results,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Semantic Search API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SEMANTIC_SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred during semantic search',
      },
    });
  }
});

/**
 * POST /api/search/multilang
 * Multi-language search across translations
 * 
 * Request Body:
 * {
 *   query: string;
 *   languages: string[];
 *   limit?: number;
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     results: SearchResult[];
 *     processingTime: number;
 *   }
 * }
 */
router.post('/multilang', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      query,
      languages = ['en'],
      limit = 10,
    } = req.body;

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameter is required',
        },
      });
    }

    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LANGUAGES',
          message: 'Languages must be a non-empty array',
        },
      });
    }

    if (limit > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Limit cannot exceed 50 results',
        },
      });
    }

    // Execute multi-language search
    const results = await aiSearchService.multiLanguageSearch(
      query.trim(),
      languages,
      limit
    );

    return res.json({
      success: true,
      data: {
        results,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Multi-language Search API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'MULTILANG_SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred during multi-language search',
      },
    });
  }
});

/**
 * GET /api/search/analytics
 * Get search analytics
 * 
 * Query Parameters:
 *   days?: number - Number of days to analyze (default: 30)
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     resultCount: number;
 *     clickThroughRate: number;
 *     averagePosition: number;
 *     zeroResultsRate: number;
 *     popularQueries: Array<{
 *       query: string;
 *       count: number;
 *       averageResults: number;
 *     }>;
 *   }
 * }
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    if (days > 365) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DAYS',
          message: 'Days cannot exceed 365',
        },
      });
    }

    const analytics = await aiSearchService.getSearchAnalytics(days);

    return res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Search Analytics API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred retrieving analytics',
      },
    });
  }
});

/**
 * GET /api/search/user/preferences/:userId
 * Get user search preferences
 * 
 * URL Parameters:
 *   userId: string - The user ID
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     userId: string;
 *     favoriteCategories: string[];
 *     favoriteTopics: string[];
 *     readingHistory: string[];
 *     searchHistory: string[];
 *     languagePreference: string;
 *     contentDifficulty?: string;
 *   }
 * }
 */
router.get('/user/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required',
        },
      });
    }

    // In production, validate that requesting user has permission
    // to view these preferences (same user or admin)

    const preferences = await aiSearchService.getUserSearchPreferences(userId);

    return res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('User Preferences API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PREFERENCES_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred retrieving preferences',
      },
    });
  }
});

/**
 * POST /api/search/cache/invalidate
 * Invalidate search cache (Admin only)
 * 
 * Request Body:
 * {
 *   pattern?: string; // Redis key pattern to invalidate (default: 'ai_search:*')
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     keysDeleted: number;
 *   }
 * }
 */
router.post('/cache/invalidate', async (req: Request, res: Response) => {
  try {
    // In production, verify admin authentication
    const { pattern = 'ai_search:*' } = req.body;

    // Get all matching keys
    const keys = await redis.keys(pattern);
    
    // Delete keys
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return res.json({
      success: true,
      data: {
        keysDeleted: keys.length,
        pattern,
      },
    });
  } catch (error) {
    console.error('Cache Invalidation API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred invalidating cache',
      },
    });
  }
});

/**
 * GET /api/search/cache/stats
 * Get cache statistics
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     totalKeys: number;
 *     memoryUsed: string;
 *     keysByType: Record<string, number>;
 *   }
 * }
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    // Get all search-related keys
    const keys = await redis.keys('ai_search:*');
    
    // Count by type
    const keysByType: Record<string, number> = {};
    keys.forEach(key => {
      const type = key.split(':')[1]; // e.g., 'enhanced', 'semantic', 'suggestions'
      if (type) {
        keysByType[type] = (keysByType[type] || 0) + 1;
      }
    });

    // Get memory info
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsed = memoryMatch?.[1]?.trim() || 'Unknown';

    return res.json({
      success: true,
      data: {
        totalKeys: keys.length,
        memoryUsed,
        keysByType,
      },
    });
  } catch (error) {
    console.error('Cache Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_STATS_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred retrieving cache stats',
      },
    });
  }
});

/**
 * GET /api/search/health
 * Health check endpoint
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     status: 'healthy' | 'degraded' | 'unhealthy';
 *     checks: {
 *       database: boolean;
 *       redis: boolean;
 *       openai: boolean;
 *     };
 *     timestamp: Date;
 *   }
 * }
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await aiSearchService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 503 : 500;

    return res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
    });
  } catch (error) {
    console.error('Health Check API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Health check failed',
      },
    });
  }
});

// ============================================================================
// Error Handler
// ============================================================================

router.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('AI Search API Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    },
  });
});

// ============================================================================
// Export
// ============================================================================

export default router;
