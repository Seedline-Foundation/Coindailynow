/**
 * Article Translation REST API - Task 8.1
 * 
 * Provides endpoints for retrieving article translations in 15 African languages.
 * Implements caching, quality indicators, and automatic fallback to English.
 * 
 * Performance Targets:
 * - Cached responses: < 50ms
 * - Uncached responses: < 300ms
 * - Cache hit rate: > 75%
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../../shared/languages';

const router = Router();

// Initialize services
const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redis.connect().catch(console.error);

// Middleware for cache tracking
let cacheHits = 0;
let cacheMisses = 0;

const trackCache = (hit: boolean) => {
  if (hit) cacheHits++;
  else cacheMisses++;
};

/**
 * GET /api/articles/:id/translations
 * Get all available translations for an article
 * 
 * Response:
 * {
 *   articleId: string;
 *   translations: Array<{
 *     language: string;
 *     languageName: string;
 *     title: string;
 *     excerpt: string;
 *     qualityIndicator: {
 *       score: number;
 *       level: 'excellent' | 'good' | 'fair' | 'needs_review';
 *       confidence: number;
 *       issues?: string[];
 *     };
 *   }>;
 *   availableLanguages: string[];
 *   cache: { hit: boolean; expiresAt: Date };
 * }
 */
router.get('/:id/translations', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Article ID is required' });
  }

  try {
    const cacheKey = `article:${id}:translations:all`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      trackCache(true);
      const responseTime = Date.now() - startTime;
      
      return res.json({
        ...JSON.parse(cached),
        cache: {
          hit: true,
          expiresAt: new Date(Date.now() + 1800000), // 30 min
        },
        performance: {
          responseTime: `${responseTime}ms`,
          cached: true,
        },
      });
    }

    trackCache(false);

    // Fetch all translations from database
    const translations = await prisma.articleTranslation.findMany({
      where: { articleId: id },
      select: {
        id: true,
        languageCode: true,
        title: true,
        excerpt: true,
        content: true,
        qualityScore: true,
        aiGenerated: true,
        humanReviewed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { languageCode: 'asc' },
    });

    // Format translations with quality indicators
    const formattedTranslations = translations.map(t => {
      const langInfo = SUPPORTED_LANGUAGES[t.languageCode as LanguageCode];
      const qualityScore = t.qualityScore || 0;
      
      let qualityLevel: 'excellent' | 'good' | 'fair' | 'needs_review';
      const issues: string[] = [];

      if (qualityScore >= 0.9) qualityLevel = 'excellent';
      else if (qualityScore >= 0.75) qualityLevel = 'good';
      else if (qualityScore >= 0.6) {
        qualityLevel = 'fair';
        issues.push('Translation quality could be improved');
      } else {
        qualityLevel = 'needs_review';
        issues.push('Low quality score - human review recommended');
      }

      // Check AI-generated flag
      if (t.aiGenerated && !t.humanReviewed) {
        issues.push('AI-generated translation pending human review');
      }

      return {
        id: t.id,
        language: t.languageCode,
        languageName: langInfo?.name || t.languageCode,
        nativeName: langInfo?.nativeName || t.languageCode,
        flag: langInfo?.flag || '🌍',
        title: t.title,
        excerpt: t.excerpt,
        contentPreview: t.content?.substring(0, 200) + '...',
        qualityIndicator: {
          score: qualityScore,
          level: qualityLevel,
          confidence: qualityScore,
          issues: issues.length > 0 ? issues : undefined,
        },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    const availableLanguages = translations.map(t => t.languageCode);

    const response = {
      articleId: id,
      translations: formattedTranslations,
      availableLanguages,
      totalLanguages: formattedTranslations.length,
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
    };

    // Cache for 30 minutes
    await redis.setEx(cacheKey, 1800, JSON.stringify(response));

    const responseTime = Date.now() - startTime;

    return res.json({
      ...response,
      cache: {
        hit: false,
        expiresAt: new Date(Date.now() + 1800000),
      },
      performance: {
        responseTime: `${responseTime}ms`,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Error fetching article translations:', error);
    return res.status(500).json({
      error: 'Failed to fetch article translations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/articles/:id/translations/:lang
 * Get specific language translation for an article
 * 
 * Query parameters:
 * - fallback: boolean (default: true) - Enable fallback to English
 * 
 * Response:
 * {
 *   articleId: string;
 *   language: string;
 *   title: string;
 *   content: string;
 *   excerpt: string;
 *   qualityIndicator: object;
 *   isFallback: boolean;
 *   cache: { hit: boolean; expiresAt: Date };
 * }
 */
router.get('/:id/translations/:lang', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { id, lang } = req.params;
  const enableFallback = req.query.fallback !== 'false';

  try {
    // Validate required parameters
    if (!id || !lang) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Both article ID and language code are required',
      });
    }

    // Validate language code
    if (!(lang in SUPPORTED_LANGUAGES)) {
      return res.status(400).json({
        error: 'Unsupported language',
        message: `Language '${lang}' is not supported. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
      });
    }

    const cacheKey = `article:${id}:translation:${lang}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      trackCache(true);
      const responseTime = Date.now() - startTime;
      
      return res.json({
        ...JSON.parse(cached),
        cache: {
          hit: true,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
        performance: {
          responseTime: `${responseTime}ms`,
          cached: true,
        },
      });
    }

    trackCache(false);

    // Fetch translation
    let translation = await prisma.articleTranslation.findUnique({
      where: {
        articleId_languageCode: {
          articleId: id,
          languageCode: lang,
        },
      },
      include: {
        Article: {
          select: {
            id: true,
            title: true,
            content: true,
            excerpt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    let isFallback = false;
    let fallbackReason: string | undefined;

    // Fallback to English if requested language not available
    if (!translation && enableFallback && lang !== 'en') {
      translation = await prisma.articleTranslation.findUnique({
        where: {
          articleId_languageCode: {
            articleId: id,
            languageCode: 'en',
          },
        },
        include: {
          Article: {
            select: {
              id: true,
              title: true,
              content: true,
              excerpt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      
      if (translation) {
        isFallback = true;
        fallbackReason = `Translation not available in ${lang}, showing English version`;
      }
    }

    // Final fallback to original article content
    if (!translation) {
      const article = await prisma.article.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!article) {
        return res.status(404).json({
          error: 'Article not found',
          articleId: id,
        });
      }

      const responseTime = Date.now() - startTime;

      return res.json({
        articleId: id,
        language: 'en',
        languageName: 'English',
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        qualityIndicator: {
          score: 1.0,
          level: 'excellent',
          confidence: 1.0,
        },
        isFallback: true,
        fallbackReason: 'No translation available, showing original content',
        article,
        performance: {
          responseTime: `${responseTime}ms`,
          cached: false,
        },
      });
    }

    // Build quality indicator
    const qualityScore = translation.qualityScore || 0;
    let qualityLevel: 'excellent' | 'good' | 'fair' | 'needs_review';
    const issues: string[] = [];

    if (qualityScore >= 0.9) qualityLevel = 'excellent';
    else if (qualityScore >= 0.75) qualityLevel = 'good';
    else if (qualityScore >= 0.6) {
      qualityLevel = 'fair';
      issues.push('Translation quality could be improved');
    } else {
      qualityLevel = 'needs_review';
      issues.push('Low quality score - human review recommended');
    }

    // Check AI generation and review status
    if (translation.aiGenerated && !translation.humanReviewed) {
      issues.push('AI-generated translation pending human review');
    }

    const langInfo = SUPPORTED_LANGUAGES[translation.languageCode as LanguageCode];

    const response = {
      articleId: id,
      language: translation.languageCode,
      languageName: langInfo?.name || translation.languageCode,
      nativeName: langInfo?.nativeName || translation.languageCode,
      flag: langInfo?.flag || '🌍',
      title: translation.title,
      content: translation.content,
      excerpt: translation.excerpt,
      qualityIndicator: {
        score: qualityScore,
        level: qualityLevel,
        confidence: qualityScore,
        issues: issues.length > 0 ? issues : undefined,
      },
      isFallback,
      fallbackReason,
      article: translation.Article,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt,
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(response));

    const responseTime = Date.now() - startTime;

    return res.json({
      ...response,
      cache: {
        hit: false,
        expiresAt: new Date(Date.now() + 3600000),
      },
      performance: {
        responseTime: `${responseTime}ms`,
        cached: false,
      },
    });
  } catch (error) {
    console.error(`Error fetching ${lang} translation:`, error);
    return res.status(500).json({
      error: 'Failed to fetch translation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/articles/:id/translations/languages/available
 * Get list of available languages for an article
 */
router.get('/:id/translations/languages/available', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Validate article ID
    if (!id) {
      return res.status(400).json({
        error: 'Missing article ID',
        message: 'Article ID is required',
      });
    }

    const translations = await prisma.articleTranslation.findMany({
      where: { articleId: id },
      select: { languageCode: true },
    });

    const availableLanguages = translations.map(t => {
      const langInfo = SUPPORTED_LANGUAGES[t.languageCode as LanguageCode];
      return {
        code: t.languageCode,
        name: langInfo?.name || t.languageCode,
        nativeName: langInfo?.nativeName || t.languageCode,
        flag: langInfo?.flag || '🌍',
      };
    });

    return res.json({
      articleId: id,
      availableLanguages,
      totalAvailable: availableLanguages.length,
      allLanguages: Object.entries(SUPPORTED_LANGUAGES).map(([, info]) => info),
    });
  } catch (error) {
    console.error('Error fetching available languages:', error);
    return res.status(500).json({
      error: 'Failed to fetch available languages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/articles/translations/health
 * Health check endpoint with cache statistics
 */
router.get('/translations/health', async (req: Request, res: Response) => {
  try {
    const [dbCheck, cacheCheck] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);

    const cacheHitRate = cacheHits + cacheMisses > 0
      ? (cacheHits / (cacheHits + cacheMisses)) * 100
      : 0;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cache: cacheCheck === 'PONG' ? 'connected' : 'disconnected',
      },
      cacheStatistics: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: `${cacheHitRate.toFixed(2)}%`,
        target: '75%',
      },
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
