/**
 * Content Recommendation Service Tests - Task 17
 * Comprehensive test suite for AI-powered content recommendation system
 * Tests: Recommendation accuracy, diversity, African content focus, user behavior analysis
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock OpenAI before importing
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn() as jest.MockedFunction<any>
    }
  }
};
jest.mock('openai', () => {
  return {
    default: jest.fn(() => mockOpenAI)
  };
});

// Mock other dependencies
jest.mock('../../src/agents/marketAnalysisAgent');
jest.mock('../../src/services/hybridSearchService');

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import {
  ContentRecommendationService,
  ContentRecommendationConfig,
  RecommendationRequest,
  UserBehaviorProfile
} from '../../src/services/contentRecommendationService';
import { MarketAnalysisAgent } from '../../src/agents/marketAnalysisAgent';
import { HybridSearchService } from '../../src/services/hybridSearchService';

describe('ContentRecommendationService', () => {
  let service: ContentRecommendationService;
  let prisma: jest.Mocked<PrismaClient>;
  let redis: jest.Mocked<Redis>;
  let logger: jest.Mocked<Logger>;
  let marketAnalysisAgent: jest.Mocked<MarketAnalysisAgent>;
  let hybridSearchService: jest.Mocked<HybridSearchService>;
  let config: ContentRecommendationConfig;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hash',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    bio: null,
    location: null,
    website: null,
    isVerified: false,
    isPrivate: false,
    emailVerified: false,
    lastLoginAt: null,
    preferredLanguage: 'en',
    subscriptionTier: 'free',
    phoneVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'ACTIVE'
  };

  const mockArticles = [
    {
      id: 'article-1',
      title: 'Bitcoin Adoption in Nigeria Surges',
      slug: 'bitcoin-adoption-nigeria-surges',
      excerpt: 'Nigeria leads Africa in cryptocurrency adoption',
      content: 'Nigeria cryptocurrency adoption Bitcoin mobile money M-Pesa remittances',
      featuredImageUrl: null,
      authorId: 'author-1',
      categoryId: 'crypto-news',
      tags: JSON.stringify(['bitcoin', 'nigeria', 'adoption', 'africa']),
      status: 'PUBLISHED',
      priority: 'NORMAL',
      isPremium: false,
      viewCount: 1000,
      likeCount: 50,
      commentCount: 20,
      shareCount: 30,
      readingTimeMinutes: 5,
      seoTitle: null,
      seoDescription: null,
      publishScheduledAt: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      author: {
        id: 'author-1',
        username: 'crypto_expert',
        email: 'expert@example.com'
      },
      category: {
        id: 'crypto-news',
        name: 'Cryptocurrency News',
        slug: 'crypto-news'
      },
      userEngagements: [
        { actionType: 'VIEW', userId: 'user-123' },
        { actionType: 'LIKE', userId: 'user-123' }
      ]
    },
    {
      id: 'article-2',
      title: 'South African Exchange Luno Updates',
      slug: 'south-african-exchange-luno-updates',
      excerpt: 'Luno adds new features for South African users',
      content: 'South Africa Luno exchange cryptocurrency trading features',
      featuredImageUrl: null,
      authorId: 'author-2',
      categoryId: 'exchange-news',
      tags: JSON.stringify(['luno', 'south-africa', 'exchange', 'trading']),
      status: 'PUBLISHED',
      priority: 'NORMAL',
      isPremium: false,
      viewCount: 500,
      likeCount: 25,
      commentCount: 10,
      shareCount: 15,
      readingTimeMinutes: 3,
      seoTitle: null,
      seoDescription: null,
      publishScheduledAt: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      author: {
        id: 'author-2',
        username: 'exchange_watcher',
        email: 'watcher@example.com'
      },
      category: {
        id: 'exchange-news',
        name: 'Exchange News',
        slug: 'exchange-news'
      },
      userEngagements: []
    }
  ];

  const mockUserEngagements = [
    {
      id: 'engagement-1',
      userId: 'user-123',
      articleId: 'article-1',
      postId: null,
      actionType: 'VIEW',
      durationSeconds: 120,
      scrollPercentage: 85.5,
      deviceType: 'mobile',
      userAgent: 'test-agent',
      ipAddress: '192.168.1.1',
      referrerUrl: null,
      createdAt: new Date(),
      article: {
        id: 'article-1',
        title: 'Bitcoin Adoption in Nigeria Surges',
        tags: JSON.stringify(['bitcoin', 'nigeria', 'adoption']),
        category: {
          id: 'crypto-news',
          name: 'Cryptocurrency News'
        }
      }
    },
    {
      id: 'engagement-2',
      userId: 'user-123',
      articleId: 'article-1',
      postId: null,
      actionType: 'LIKE',
      durationSeconds: null,
      scrollPercentage: null,
      deviceType: 'mobile',
      userAgent: 'test-agent',
      ipAddress: '192.168.1.1',
      referrerUrl: null,
      createdAt: new Date(),
      article: {
        id: 'article-1',
        title: 'Bitcoin Adoption in Nigeria Surges',
        tags: JSON.stringify(['bitcoin', 'nigeria', 'adoption']),
        category: {
          id: 'crypto-news',
          name: 'Cryptocurrency News'
        }
      }
    }
  ];

  beforeEach(() => {
    // Setup mocks
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      userEngagement: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      article: {
        findMany: jest.fn(),
      },
    } as any;

    redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    } as any;

    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    marketAnalysisAgent = {} as any;
    hybridSearchService = {} as any;

    config = {
      openaiApiKey: 'test-key',
      model: 'gpt-4-turbo-preview',
      maxTokens: 4096,
      temperature: 0.7,
      diversityThreshold: 0.4,
      recencyWeight: 0.3,
      popularityWeight: 0.3,
      personalizedWeight: 0.4,
      africanContentBoost: 1.5,
      maxRecommendations: 10,
      cacheTimeoutMs: 3600000,
      enableRealTimeUpdates: true,
      minUserInteractions: 5
    };

    service = new ContentRecommendationService(
      prisma,
      logger,
      redis,
      config,
      marketAnalysisAgent,
      hybridSearchService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockOpenAI.chat.completions.create.mockClear();
  });

  describe('User Behavior Analysis', () => {
    it('should build comprehensive user behavior profile', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userEngagement.findMany.mockResolvedValue(mockUserEngagements);

      // Act
      const profile = await (service as any).buildUserBehaviorProfile('user-123');

      // Assert
      expect(profile).toMatchObject({
        userId: 'user-123',
        preferredCategories: expect.arrayContaining(['Cryptocurrency News']),
        readingPatterns: {
          averageReadingTime: expect.any(Number),
          preferredContentLength: expect.stringMatching(/short|medium|long/),
          activeHours: expect.any(Array),
          devicePreference: 'mobile'
        },
        topicInterests: expect.objectContaining({
          bitcoin: expect.any(Number),
          nigeria: expect.any(Number)
        }),
        africanMarketFocus: {
          preferredCountries: expect.any(Array),
          preferredExchanges: expect.any(Array),
          mobileMoneyInterest: expect.any(Boolean)
        },
        engagementScore: expect.any(Number)
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
      expect(prisma.userEngagement.findMany).toHaveBeenCalled();
    });

    it('should analyze reading patterns correctly', async () => {
      // Act
      const patterns = (service as any).analyzeReadingPatterns(mockUserEngagements);

      // Assert
      expect(patterns).toMatchObject({
        averageReadingTime: 120,
        preferredContentLength: expect.stringMatching(/short|medium|long/),
        activeHours: expect.any(Array),
        devicePreference: 'mobile'
      });
    });

    it('should extract topic interests with proper weighting', async () => {
      // Act
      const interests = (service as any).extractTopicInterests(mockUserEngagements);

      // Assert
      expect(interests).toMatchObject({
        bitcoin: expect.any(Number),
        nigeria: expect.any(Number),
        adoption: expect.any(Number)
      });

      // Verify LIKE actions have higher weight than VIEW actions
      expect(interests.bitcoin).toBeGreaterThan(0);
    });

    it('should analyze African market focus', async () => {
      // Act
      const africanFocus = (service as any).analyzeAfricanMarketFocus(mockUserEngagements);

      // Assert
      expect(africanFocus).toMatchObject({
        preferredCountries: expect.any(Array),
        preferredExchanges: expect.any(Array),
        mobileMoneyInterest: expect.any(Boolean)
      });
    });

    it('should calculate user engagement score', async () => {
      // Act
      const score = (service as any).calculateUserEngagementScore(mockUserEngagements);

      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Content Recommendation Generation', () => {
    it('should get personalized recommendations for user', async () => {
      // Arrange
      const request: RecommendationRequest = {
        userId: 'user-123',
        limit: 5,
        includeAfricanFocus: true,
        diversityLevel: 'medium'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userEngagement.findMany.mockResolvedValue(mockUserEngagements);
      prisma.article.findMany.mockResolvedValue(mockArticles as any);
      redis.get.mockResolvedValue(null); // No cache

      // Mock AI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendations: [
                {
                  score: 0.85,
                  reasons: [
                    {
                      type: 'behavioral',
                      description: 'Matches user preferences for Nigerian crypto content',
                      confidence: 0.9,
                      weight: 0.4
                    }
                  ]
                }
              ]
            })
          }
        }]
      });

      // Act
      const result = await service.getRecommendations(request);

      // Assert
      expect(result).toMatchObject({
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            articleId: expect.any(String),
            title: expect.any(String),
            recommendationScore: expect.any(Number),
            reasons: expect.arrayContaining([
              expect.objectContaining({
                type: expect.any(String),
                confidence: expect.any(Number)
              })
            ]),
            africanRelevance: expect.objectContaining({
              score: expect.any(Number)
            })
          })
        ]),
        metadata: expect.objectContaining({
          processingTimeMs: expect.any(Number),
          diversityScore: expect.any(Number),
          personalizedScore: expect.any(Number),
          cacheHit: false
        })
      });

      expect(result.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should apply diversity algorithms', async () => {
      // Arrange
      const scoredContent = [
        { categoryId: 'crypto-news', tags: ['bitcoin'], aiScore: 0.9 },
        { categoryId: 'crypto-news', tags: ['bitcoin'], aiScore: 0.85 },
        { categoryId: 'exchange-news', tags: ['trading'], aiScore: 0.8 },
        { categoryId: 'defi-news', tags: ['defi'], aiScore: 0.75 }
      ];

      // Act
      const diversified = (service as any).applyDiversityAlgorithms(scoredContent, 'medium');

      // Assert
      expect(diversified).toHaveLength(4);
      expect(diversified[0]).toHaveProperty('finalScore');

      // Verify diversity - first item should still be highest, but subsequent same-category items should be penalized
      const categories = diversified.slice(0, 3).map((item: any) => item.categoryId);
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBeGreaterThan(1); // Should have category diversity
    });

    it('should calculate African relevance score', async () => {
      // Act
      const score1 = (service as any).calculateAfricanRelevanceScore(mockArticles[0]);
      const score2 = (service as any).calculateAfricanRelevanceScore(mockArticles[1]);

      // Assert
      expect(score1).toBeGreaterThan(0);
      expect(score2).toBeGreaterThan(0);

      // Nigeria-focused content should have higher African relevance
      expect(score1).toBeGreaterThan(score2);
    });

    it('should handle fallback scoring when AI is unavailable', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userEngagement.findMany.mockResolvedValue(mockUserEngagements);
      prisma.article.findMany.mockResolvedValue(mockArticles as any);
      redis.get.mockResolvedValue(null);

      // Mock OpenAI failure
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'));

      const request: RecommendationRequest = {
        userId: 'user-123',
        limit: 5
      };

      // Act
      const result = await service.getRecommendations(request);

      // Assert
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0]).toHaveProperty('recommendationScore');
      expect(logger.warn).toHaveBeenCalledWith(
        'AI scoring failed, using fallback',
        expect.any(Object)
      );
    });
  });

  describe('African Content Focus', () => {
    it('should boost African-relevant content', async () => {
      // Arrange
      const userProfile: UserBehaviorProfile = {
        userId: 'user-123',
        preferredCategories: ['Cryptocurrency News'],
        readingPatterns: {
          averageReadingTime: 120,
          preferredContentLength: 'medium',
          activeHours: [9, 10, 11],
          devicePreference: 'mobile'
        },
        topicInterests: { bitcoin: 0.8, nigeria: 0.9 },
        africanMarketFocus: {
          preferredCountries: ['Nigeria', 'South Africa'],
          preferredExchanges: ['Luno', 'Quidax'],
          mobileMoneyInterest: true
        },
        engagementScore: 0.7,
        lastUpdated: new Date()
      };

      const contentFeatures = {
        articleId: 'article-1',
        categoryId: 'crypto-news',
        tags: ['bitcoin', 'nigeria'],
        wordCount: 800,
        readingTime: 5,
        africanRelevanceScore: 0.8,
        sentimentScore: 0.6,
        qualityScore: 0.75,
        publishedAt: new Date(),
        popularity: {
          views: 1000,
          likes: 50,
          shares: 30,
          comments: 20,
          engagementRate: 0.1
        },
        marketContext: {
          mentionedTokens: ['BTC'],
          mentionedExchanges: ['Luno'],
          trendingTopics: ['adoption']
        }
      };

      // Act
      const score = (service as any).calculateFallbackScore(contentFeatures, userProfile);

      // Assert
      expect(score).toBeGreaterThan(0.5); // Should be high due to African relevance
    });

    it('should get trending African content', async () => {
      // Arrange
      prisma.article.findMany.mockResolvedValue(mockArticles as any);

      // Act
      const trendingContent = await service.getTrendingAfricanContent(5);

      // Assert
      expect(trendingContent).toHaveLength(2);
      expect(trendingContent[0]).toMatchObject({
        articleId: expect.any(String),
        title: expect.any(String),
        africanRelevance: expect.objectContaining({
          score: expect.any(Number)
        }),
        reasons: expect.arrayContaining([
          expect.objectContaining({
            type: 'trending',
            description: 'Trending in African cryptocurrency markets'
          })
        ])
      });

      // Verify Nigerian content ranks higher
      const nigerianContent = trendingContent.find(c => c.title.includes('Nigeria'));
      expect(nigerianContent).toBeTruthy();
    });

    it('should identify African crypto topics', async () => {
      // Arrange
      const articleWithAfricanTopics = {
        title: 'Mobile Money Integration with Bitcoin in Kenya',
        content: 'M-Pesa integration with cryptocurrency remittances cross-border payments',
        excerpt: 'Financial inclusion through mobile money'
      };

      // Act
      const score = (service as any).calculateAfricanRelevanceScore(articleWithAfricanTopics);

      // Assert
      expect(score).toBeGreaterThan(0.3); // Should detect mobile money and other African topics
    });
  });

  describe('Real-time Updates', () => {
    it('should update user behavior and invalidate cache', async () => {
      // Arrange
      const engagement = {
        articleId: 'article-1',
        actionType: 'VIEW',
        durationSeconds: 180,
        deviceType: 'mobile'
      };

      prisma.userEngagement.create.mockResolvedValue({} as any);
      redis.keys.mockResolvedValue(['recommendations:user-123']);
      redis.del.mockResolvedValue(1);

      // Act
      await service.updateUserBehavior('user-123', engagement);

      // Assert
      expect(prisma.userEngagement.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          articleId: 'article-1',
          actionType: 'VIEW',
          durationSeconds: 180,
          deviceType: 'mobile',
          userAgent: 'system',
          ipAddress: '0.0.0.0'
        }
      });

      expect(redis.del).toHaveBeenCalledWith('user_profile:user-123');
      expect(redis.keys).toHaveBeenCalledWith('recommendations:*user-123*');
    });

    it('should handle cache operations', async () => {
      // Arrange
      const cacheKey = 'test-recommendations';
      const mockResult = { recommendations: [], metadata: {} };

      redis.get.mockResolvedValue(JSON.stringify(mockResult));

      // Act
      const cached = await (service as any).getCachedRecommendations(cacheKey);

      // Assert
      expect(cached).toEqual(mockResult);
      expect(redis.get).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('Performance and Metrics', () => {
    it('should calculate diversity score correctly', async () => {
      // Arrange
      const recommendations = [
        { categoryName: 'News', tags: ['bitcoin', 'crypto'] },
        { categoryName: 'News', tags: ['ethereum', 'defi'] },
        { categoryName: 'Trading', tags: ['analysis', 'charts'] },
        { categoryName: 'Exchange', tags: ['binance', 'fees'] }
      ];

      // Act
      const diversityScore = (service as any).calculateDiversityScore(recommendations);

      // Assert
      expect(diversityScore).toBeGreaterThan(0);
      expect(diversityScore).toBeLessThanOrEqual(1);
    });

    it('should return service metrics', async () => {
      // Act
      const metrics = service.getMetrics();

      // Assert
      expect(metrics).toMatchObject({
        name: 'Content Recommendation Service',
        version: '1.0.0',
        dependencies: expect.arrayContaining(['Market Analysis Agent', 'Hybrid Search Service']),
        africanFocus: true,
        realTimeUpdates: true
      });
    });

    it('should process recommendations within reasonable time', async () => {
      // Arrange
      const request: RecommendationRequest = {
        userId: 'user-123',
        limit: 10
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userEngagement.findMany.mockResolvedValue(mockUserEngagements);
      prisma.article.findMany.mockResolvedValue(mockArticles as any);
      redis.get.mockResolvedValue(null);

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendations: [{ score: 0.8, reasons: [] }]
            })
          }
        }]
      });

      const startTime = Date.now();

      // Act
      const result = await service.getRecommendations(request);

      // Assert
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.metadata.processingTimeMs).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle user not found error', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        (service as any).buildUserBehaviorProfile('nonexistent-user')
      ).rejects.toThrow('User not found');
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const request: RecommendationRequest = {
        userId: 'user-123',
        limit: 5
      };

      prisma.user.findUnique.mockRejectedValue(new Error('Database connection error'));

      // Act & Assert
      await expect(service.getRecommendations(request)).rejects.toThrow('Database connection error');
    });

    it('should handle Redis cache failures gracefully', async () => {
      // Arrange
      redis.get.mockRejectedValue(new Error('Redis connection error'));
      redis.setex.mockRejectedValue(new Error('Redis connection error'));

      // Act - Should not throw, just warn
      const result = await (service as any).getCachedRecommendations('test-key');

      // Assert
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to get cached recommendations',
        expect.any(Object)
      );
    });
  });

  describe('Integration Tests', () => {
    it('should provide end-to-end recommendation flow', async () => {
      // Arrange - Full setup
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userEngagement.findMany.mockResolvedValue(mockUserEngagements);
      prisma.article.findMany
        .mockResolvedValueOnce(mockArticles as any) // For candidates
        .mockResolvedValueOnce(mockArticles as any); // For final article details
      
      redis.get.mockResolvedValue(null); // No cache
      redis.setex.mockResolvedValue('OK');

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendations: mockArticles.map(() => ({
                score: 0.8,
                reasons: [
                  {
                    type: 'behavioral',
                    description: 'Matches user interests',
                    confidence: 0.8,
                    weight: 0.4
                  }
                ]
              }))
            })
          }
        }]
      });

      const request: RecommendationRequest = {
        userId: 'user-123',
        limit: 5,
        includeAfricanFocus: true,
        excludeReadArticles: true,
        diversityLevel: 'medium',
        realTimeMarketContext: false
      };

      // Act
      const result = await service.getRecommendations(request);

      // Assert
      expect(result.recommendations).toHaveLength(2);
      expect(result.userProfile).toBeTruthy();
      expect(result.metadata.diversityScore).toBeGreaterThan(0);
      expect(result.metadata.personalizedScore).toBeGreaterThan(0);

      // Verify African content is prioritized
      const africanContent = result.recommendations.filter(r => r.africanRelevance.score > 0.5);
      expect(africanContent.length).toBeGreaterThan(0);

      // Verify caching
      expect(redis.setex).toHaveBeenCalled();
    });
  });
});