/**
 * AI Content Preview Service Tests - Task 7.2
 * Comprehensive unit and integration tests
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Logger } from 'winston';
import AIContentPreviewService from '../services/aiContentPreviewService';

// Mock dependencies
jest.mock('ioredis');
jest.mock('openai');

describe('AIContentPreviewService', () => {
  let service: AIContentPreviewService;
  let prisma: any;
  let redis: any;
  let logger: any;

  beforeEach(() => {
    // Create mock Prisma client with Jest mock functions
    const mockArticleFindUnique = jest.fn();
    const mockArticleFindMany = jest.fn();
    const mockTranslationFindUnique = jest.fn();
    const mockTranslationFindMany = jest.fn();
    const mockAnalyticsCreate = jest.fn();

    prisma = {
      article: {
        findUnique: mockArticleFindUnique,
        findMany: mockArticleFindMany,
      },
      articleTranslation: {
        findUnique: mockTranslationFindUnique,
        findMany: mockTranslationFindMany,
      },
      analyticsEvent: {
        create: mockAnalyticsCreate,
      },
      $queryRaw: jest.fn(),
    };

    redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      ping: jest.fn(),
    };

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    service = new AIContentPreviewService(prisma, redis, logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== SUMMARY TESTS ====================

  describe('generateSummary', () => {
    it('should return cached summary if available', async () => {
      const cachedSummary = {
        articleId: 'article-1',
        tldr: 'Test summary',
        keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
        readingTimeMinutes: 5,
        generatedAt: new Date(),
        cacheExpiry: new Date(Date.now() + 7200000),
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedSummary));

      const result = await service.generateSummary('article-1');

      expect(result).toEqual(cachedSummary);
      expect(redis.get).toHaveBeenCalledWith('article:summary:article-1');
      expect(prisma.article.findUnique).not.toHaveBeenCalled();
    });

    it('should generate new summary if not cached', async () => {
      const article = {
        id: 'article-1',
        title: 'Test Article',
        content: 'This is a test article about cryptocurrency. '.repeat(50),
        excerpt: 'Test excerpt',
      };

      redis.get.mockResolvedValue(null);
      prisma.article.findUnique.mockResolvedValue(article as any);

      // Mock OpenAI response
      const mockOpenAI = require('openai');
      mockOpenAI.prototype.chat = {
        completions: {
          create: jest.fn()
            .mockResolvedValueOnce({
              choices: [{ message: { content: 'AI generated summary' } }],
            })
            .mockResolvedValueOnce({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      takeaways: ['Key point 1', 'Key point 2', 'Key point 3'],
                    }),
                  },
                },
              ],
            }),
        },
      };

      const result = await service.generateSummary('article-1');

      expect(result.articleId).toBe('article-1');
      expect(result.tldr).toBeDefined();
      expect(result.keyTakeaways).toBeInstanceOf(Array);
      expect(result.readingTimeMinutes).toBeGreaterThan(0);
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should throw error if article not found', async () => {
      redis.get.mockResolvedValue(null);
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.generateSummary('invalid-id')).rejects.toThrow(
        'Article not found: invalid-id'
      );
    });

    it('should calculate reading time correctly', async () => {
      const article = {
        id: 'article-1',
        title: 'Test',
        content: 'word '.repeat(200), // 200 words = 1 minute
        excerpt: 'Test',
      };

      redis.get.mockResolvedValue(null);
      prisma.article.findUnique.mockResolvedValue(article as any);

      const mockOpenAI = require('openai');
      mockOpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Summary' } }],
          }),
        },
      };

      const result = await service.generateSummary('article-1');
      expect(result.readingTimeMinutes).toBe(1);
    });
  });

  // ==================== TRANSLATION TESTS ====================

  describe('getTranslationPreview', () => {
    it('should return cached translation if available', async () => {
      const cachedTranslation = {
        articleId: 'article-1',
        languageCode: 'fr',
        title: 'Test Title',
        excerpt: 'Test Excerpt',
        content: 'Test Content',
        qualityScore: 95,
        qualityIndicator: 'high',
        aiGenerated: true,
        humanReviewed: false,
        translationStatus: 'COMPLETED',
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedTranslation));

      const result = await service.getTranslationPreview('article-1', 'fr');

      expect(result).toMatchObject(cachedTranslation);
      expect(redis.get).toHaveBeenCalledWith('article:translation:article-1:fr');
    });

    it('should fetch translation from database if not cached', async () => {
      const translation = {
        articleId: 'article-1',
        languageCode: 'fr',
        title: 'Test Title',
        excerpt: 'Test Excerpt',
        content: 'Test Content',
        qualityScore: 85,
        aiGenerated: true,
        humanReviewed: true,
        translationStatus: 'COMPLETED',
      };

      redis.get.mockResolvedValue(null);
      prisma.articleTranslation.findUnique.mockResolvedValue(translation as any);

      const result = await service.getTranslationPreview('article-1', 'fr');

      expect(result?.qualityIndicator).toBe('high');
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should return null if translation not found', async () => {
      redis.get.mockResolvedValue(null);
      prisma.articleTranslation.findUnique.mockResolvedValue(null);

      const result = await service.getTranslationPreview('article-1', 'unknown');
      expect(result).toBeNull();
    });
  });

  describe('switchLanguage', () => {
    it('should switch language and track analytics', async () => {
      const translation = {
        articleId: 'article-1',
        languageCode: 'sw',
        title: 'Test',
        excerpt: 'Test',
        content: 'Test',
        qualityScore: 90,
        aiGenerated: true,
        humanReviewed: false,
        translationStatus: 'COMPLETED',
      };

      redis.get.mockResolvedValue(null);
      prisma.articleTranslation.findUnique.mockResolvedValue(translation as any);
      prisma.analyticsEvent.create.mockResolvedValue({} as any);

      const result = await service.switchLanguage('article-1', 'en', 'sw');

      expect(result).toBeDefined();
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'language_switched',
            resourceId: 'article-1',
          }),
        })
      );
    });
  });

  // ==================== QUALITY INDICATORS TESTS ====================

  describe('getQualityIndicators', () => {
    it('should return cached quality indicators if available', async () => {
      const cachedIndicators = {
        articleId: 'article-1',
        aiConfidenceScore: 95,
        factCheckStatus: 'verified',
        humanReviewStatus: 'approved',
        contentQualityScore: 90,
        qualityFactors: {
          accuracy: 95,
          relevance: 90,
          readability: 85,
          sources: 90,
        },
        indicators: [],
        lastUpdated: new Date(),
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedIndicators));

      const result = await service.getQualityIndicators('article-1');

      expect(result).toEqual(cachedIndicators);
      expect(redis.get).toHaveBeenCalledWith('article:quality:article-1');
    });

    it('should generate quality indicators from article data', async () => {
      const article = {
        id: 'article-1',
        title: 'Test',
        content: 'Test content. '.repeat(50),
        viewCount: 100,
        isPremium: false,
        ContentWorkflow: {
          WorkflowStep: [
            {
              AITask: [
                {
                  taskType: 'fact_check',
                  status: 'COMPLETED',
                  qualityScore: 90,
                },
                {
                  taskType: 'content_generation',
                  status: 'COMPLETED',
                  qualityScore: 95,
                },
              ],
            },
          ],
        },
      };

      redis.get.mockResolvedValue(null);
      prisma.article.findUnique.mockResolvedValue(article as any);

      const result = await service.getQualityIndicators('article-1');

      expect(result.aiConfidenceScore).toBeGreaterThan(0);
      expect(result.factCheckStatus).toBeDefined();
      expect(result.humanReviewStatus).toBeDefined();
      expect(result.indicators).toBeInstanceOf(Array);
    });
  });

  // ==================== CACHE MANAGEMENT TESTS ====================

  describe('invalidateArticleCache', () => {
    it('should delete all cache keys for an article', async () => {
      const translations = [
        { languageCode: 'fr' },
        { languageCode: 'sw' },
      ];

      prisma.articleTranslation.findMany.mockResolvedValue(translations as any);
      redis.del.mockResolvedValue(1);

      await service.invalidateArticleCache('article-1');

      expect(redis.del).toHaveBeenCalledTimes(5); // summary, quality, languages, + 2 translations
    });
  });

  describe('warmupCache', () => {
    it('should preload cache for multiple articles', async () => {
      const articleIds = ['article-1', 'article-2', 'article-3'];

      prisma.article.findUnique.mockResolvedValue({
        id: 'article-1',
        title: 'Test',
        content: 'Test content',
        excerpt: 'Test',
        ContentWorkflow: null,
      } as any);

      prisma.articleTranslation.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);
      redis.setex.mockResolvedValue('OK');

      await service.warmupCache(articleIds);

      // Should call summary, quality, and languages for each article
      expect(prisma.article.findUnique).toHaveBeenCalledTimes(articleIds.length * 2);
    });
  });

  // ==================== REPORTING TESTS ====================

  describe('reportTranslationIssue', () => {
    it('should create analytics event for translation issue', async () => {
      const report = {
        articleId: 'article-1',
        languageCode: 'fr',
        issueType: 'inaccuracy' as const,
        description: 'Translation is incorrect',
        reportedBy: 'user-1',
        severity: 'high' as const,
      };

      prisma.analyticsEvent.create.mockResolvedValue({} as any);

      const result = await service.reportTranslationIssue(report);

      expect(result.createdAt).toBeDefined();
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'translation_issue_reported',
            resourceId: 'article-1',
          }),
        })
      );
    });
  });

  // ==================== PERFORMANCE TESTS ====================

  describe('Performance', () => {
    it('should respond within 500ms for cached data', async () => {
      const cachedSummary = {
        articleId: 'article-1',
        tldr: 'Test',
        keyTakeaways: [],
        readingTimeMinutes: 5,
        generatedAt: new Date(),
        cacheExpiry: new Date(),
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedSummary));

      const start = Date.now();
      await service.generateSummary('article-1');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should handle concurrent requests efficiently', async () => {
      redis.get.mockResolvedValue(null);
      prisma.article.findUnique.mockResolvedValue({
        id: 'article-1',
        title: 'Test',
        content: 'Test content',
        excerpt: 'Test',
      } as any);

      const promises = Array(10)
        .fill(null)
        .map(() => service.generateSummary('article-1'));

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
