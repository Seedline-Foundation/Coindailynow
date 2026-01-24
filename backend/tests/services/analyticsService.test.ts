/**
 * Analytics Service Tests - Fixed Version
 * Comprehensive test suite for Task 18: Advanced Analytics System
 */

import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../../src/services/analyticsService';
import { 
  AnalyticsEventType, 
  DeviceType, 
  AnalyticsQuery,
  GroupByOptions,
  AfricanMarketContext
} from '../../src/types/analytics';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  }))
}));

// Create properly typed mock Prisma
const createMockPrisma = () => ({
  analyticsEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn()
  },
  userEngagement: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn()
  },
  article: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn()
  },
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn()
  },
  $disconnect: jest.fn()
});

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockRedis = {
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      quit: jest.fn()
    };
    analyticsService = new AnalyticsService(mockPrisma as any, mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    describe('trackEvent', () => {
      it('should track analytics events successfully', async () => {
        // Arrange
        const eventData = {
          userId: 'user-123',
          eventType: AnalyticsEventType.ARTICLE_VIEW,
          resourceId: 'article-456',
          resourceType: 'article',
          properties: {
            readingTime: 300,
            scrollPercentage: 85
          },
          metadata: {
            userAgent: 'Mozilla/5.0',
            deviceType: DeviceType.MOBILE,
            country: 'Nigeria',
            region: 'Lagos',
            language: 'en',
            ipAddress: '192.168.1.1',
            africanMarketContext: {
              country: 'Nigeria',
              exchange: 'quidax',
              localCurrency: 'NGN',
              timezone: 'Africa/Lagos'
            }
          }
        };

        // Mock Prisma response
        (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-789',
          ...eventData,
          timestamp: new Date()
        });

        // Act
        const result = await analyticsService.trackEvent(eventData);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('event-789');
        expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            eventType: 'ARTICLE_VIEW',
            resourceId: 'article-456',
            properties: JSON.stringify(eventData.properties),
            metadata: JSON.stringify(eventData.metadata)
          })
        });
      });

      it('should handle events without userId', async () => {
        // Arrange
        const eventData = {
          eventType: AnalyticsEventType.PAGE_VIEW,
          properties: {
            path: '/dashboard'
          },
          metadata: {
            userAgent: 'Mozilla/5.0',
            deviceType: DeviceType.DESKTOP,
            country: 'Kenya',
            region: 'Nairobi',
            language: 'en',
            ipAddress: '192.168.1.2'
          }
        };

        (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-anonymous',
          ...eventData,
          timestamp: new Date()
        });

        // Act
        const result = await analyticsService.trackEvent(eventData);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('event-anonymous');
        expect(mockPrisma.analyticsEvent.create).toHaveBeenCalled();
      });

      it('should validate required fields', async () => {
        // Arrange
        const invalidEventData = {
          // missing eventType
          properties: {},
          metadata: {
            userAgent: 'Mozilla/5.0',
            deviceType: DeviceType.MOBILE,
            country: 'Nigeria',
            region: 'Lagos',
            language: 'en',
            ipAddress: '192.168.1.1'
          }
        };

        // Act & Assert
        await expect(
          analyticsService.trackEvent(invalidEventData as any)
        ).rejects.toThrow();
      });
    });

    describe('trackMobileMoneyEvent', () => {
      it('should track mobile money events', async () => {
        // Arrange
        const userId = 'user-123';
        const mobileMoneyData = {
          provider: 'M-Pesa',
          amount: 5000,
          currency: 'KES',
          transactionType: 'DEPOSIT',
          status: 'SUCCESS'
        };

        (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue({
          id: 'event-mm-789',
          userId,
          eventType: 'MOBILE_MONEY_TRANSACTION',
          resourceId: mobileMoneyData.provider,
          properties: JSON.stringify(mobileMoneyData),
          timestamp: new Date()
        });

        // Act
        const result = await analyticsService.trackMobileMoneyEvent(userId, mobileMoneyData);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('event-mm-789');
        expect(mockPrisma.analyticsEvent.create).toHaveBeenCalled();
      });
    });
  });

  describe('Analytics Queries', () => {
    describe('getUserBehaviorAnalytics', () => {
      it('should return comprehensive user behavior analytics', async () => {
        // Arrange
        const userId = 'user-123';
        const mockEngagements = [
          {
            id: 'eng-1',
            articleId: 'article-1',
            actionType: 'VIEW',
            durationSeconds: 300,
            createdAt: new Date(),
            Article: {
              id: 'article-1',
              title: 'Crypto in Nigeria',
              Category: { id: 'cat-1', name: 'Market Analysis' }
            }
          }
        ];

        const mockEvents = [
          {
            id: 'event-1',
            eventType: 'ARTICLE_VIEW',
            timestamp: new Date(),
            properties: '{"readingTime": 300}',
            metadata: '{"country": "Nigeria", "deviceType": "MOBILE"}'
          }
        ];

        (mockPrisma.userEngagement.findMany as jest.Mock).mockResolvedValue(mockEngagements);
        (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        // Act
        const result = await analyticsService.getUserBehaviorAnalytics(userId);

        // Assert
        expect(result).toBeDefined();
        expect(result.userId).toBe(userId);
        expect(result.sessionAnalytics).toBeDefined();
        expect(result.engagementMetrics).toBeDefined();
        expect(result.contentPreferences).toBeDefined();
        expect(result.africanMarketBehavior).toBeDefined();
        expect(result.deviceUsagePatterns).toBeDefined();
      });
    });

    describe('getContentPerformanceAnalytics', () => {
      it('should return content performance analytics', async () => {
        // Arrange
        const contentId = 'article-123';
        const mockArticle = {
          id: contentId,
          title: 'Bitcoin in Kenya',
          viewCount: 1500,
          likeCount: 45,
          shareCount: 12,
          commentCount: 8,
          Category: { id: 'cat-1', name: 'News' },
          User: { id: 'author-1', username: 'cryptowriter' }
        };

        const mockEngagements = [
          {
            id: 'eng-1',
            actionType: 'VIEW',
            durationSeconds: 250,
            User: { id: 'user-1', username: 'reader1' }
          }
        ];

        const mockEvents = [
          {
            id: 'event-1',
            eventType: 'ARTICLE_VIEW',
            timestamp: new Date(),
            properties: '{"source": "social"}',
            metadata: '{"country": "Kenya"}'
          }
        ];

        (mockPrisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
        (mockPrisma.userEngagement.findMany as jest.Mock).mockResolvedValue(mockEngagements);
        (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        // Act
        const result = await analyticsService.getContentPerformanceAnalytics(contentId);

        // Assert
        expect(result).toBeDefined();
        expect(result.contentId).toBe(contentId);
        expect(result.contentType).toBe('article');
        expect(result.performanceMetrics).toBeDefined();
        expect(result.audienceAnalytics).toBeDefined();
        expect(result.engagementAnalytics).toBeDefined();
        expect(result.africanMarketPerformance).toBeDefined();
        expect(result.conversionMetrics).toBeDefined();
      });

      it('should throw error for non-existent content', async () => {
        // Arrange
        const contentId = 'non-existent-article';
        (mockPrisma.article.findUnique as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(
          analyticsService.getContentPerformanceAnalytics(contentId)
        ).rejects.toThrow(`Content not found: ${contentId}`);
      });
    });

    describe('getDashboardAnalytics', () => {
      it('should return comprehensive dashboard analytics', async () => {
        // Arrange
        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        // Mock various count queries
        (mockPrisma.user.count as jest.Mock).mockResolvedValue(1250);
        (mockPrisma.article.count as jest.Mock).mockResolvedValue(850);
        (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(15000);

        // Mock article data
        (mockPrisma.article.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'article-1',
            title: 'Bitcoin trends in Nigeria',
            viewCount: 2500,
            likeCount: 75,
            shareCount: 25,
            commentCount: 15,
            UserEngagement: []
          },
          {
            id: 'article-2',
            title: 'Ethereum adoption in Kenya',
            viewCount: 1800,
            likeCount: 60,
            shareCount: 20,
            commentCount: 12,
            UserEngagement: []
          }
        ]);

        // Act
        const result = await analyticsService.queryAnalytics({
          dateRange,
          filters: {},
          metrics: ['users', 'articles', 'revenue']
        });

        // Assert
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.query).toBeDefined();
        expect(result.metadata.totalRecords).toBeGreaterThanOrEqual(0);
      });
    });

    describe('queryAnalytics', () => {
      it('should execute complex analytics queries', async () => {
        // Arrange
        const query: AnalyticsQuery = {
          dateRange: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31')
          },
          filters: {
            countries: ['Nigeria', 'Kenya'],
            deviceTypes: [DeviceType.MOBILE],
            eventTypes: [AnalyticsEventType.ARTICLE_VIEW]
          },
          groupBy: GroupByOptions.COUNTRY,
          metrics: ['views', 'engagement_rate'],
          sortBy: {
            field: 'views',
            direction: 'DESC'
          },
          limit: 10
        };

        (mockPrisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([
          {
            country: 'Nigeria',
            _count: { id: 8500 }
          },
          {
            country: 'Kenya', 
            _count: { id: 6200 }
          }
        ]);

        // Act
        const result = await analyticsService.queryAnalytics(query);

        // Assert
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.query).toEqual(query);
      });
    });
  });

  describe('African Market Analytics', () => {
    describe('getTopAfricanContent', () => {
      it('should return top performing African content', async () => {
        // Arrange
        const limit = 5;
        const mockArticles = [
          {
            id: 'article-ng-1',
            title: 'Nigerian Crypto Market Update',
            viewCount: 5000,
            likeCount: 150,
            shareCount: 45,
            commentCount: 30,
            UserEngagement: []
          },
          {
            id: 'article-ke-1', 
            title: 'Kenya Mobile Money Integration',
            viewCount: 3500,
            likeCount: 120,
            shareCount: 35,
            commentCount: 25,
            UserEngagement: []
          }
        ];

        (mockPrisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

        // Act
        const result = await analyticsService.getTopPerformingContent(limit);

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(limit);
        expect(result.every((content: any) => 
          content.title.includes('Nigeria') || content.title.includes('Kenya')
        )).toBe(true);
      });
    });

    describe('getAfricanMarketInsights', () => {
      it('should provide comprehensive African market insights', async () => {
        // Arrange
        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        // Mock user data by country
        (mockPrisma.user.groupBy as jest.Mock).mockResolvedValue([
          { country: 'Nigeria', _count: { id: 5000 } },
          { country: 'Kenya', _count: { id: 3500 } },
          { country: 'South Africa', _count: { id: 2800 } }
        ]);

        // Mock analytics events
        (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([
          {
            properties: '{"exchange": "quidax"}',
            metadata: '{"country": "Nigeria"}'
          },
          {
            properties: '{"exchange": "luno"}',
            metadata: '{"country": "South Africa"}'
          }
        ]);

        // Act
        const result = await analyticsService.getAfricanMarketInsights(dateRange);

        // Assert
        expect(result).toBeDefined();
        expect(result.topCountries).toBeDefined();
        expect(result.exchangePopularity).toBeDefined();
        expect(result.mobileMoneyAdoption).toBeDefined();
        expect(result.languageUsage).toBeDefined();
        expect(result.crossBorderActivity).toBeDefined();

        // Check specific insights
        expect(result.topCountries.length).toBeGreaterThan(0);
        if (result.topCountries.length > 0) {
          expect(result.topCountries[0]!.country).toBe('Nigeria');
        }
      });
    });
  });

  describe('Privacy and Compliance', () => {
    describe('anonymizeUserData', () => {
      it('should anonymize sensitive user data', async () => {
        // Arrange
        const userId = 'user-to-anonymize';
        const retentionDays = 90;

        (mockPrisma.analyticsEvent.updateMany as jest.Mock).mockResolvedValue({
          count: 25
        });

        // Act
        const result = await analyticsService.exportUserData(userId, {
          format: 'JSON',
          includePersonalData: false
        });

        // Assert
        expect(result).toBeDefined();
        expect(mockPrisma.analyticsEvent.updateMany).toHaveBeenCalledWith({
          where: {
            userId,
            timestamp: {
              lt: expect.any(Date)
            }
          },
          data: {
            userId: null,
            properties: expect.any(String),
            metadata: expect.any(String)
          }
        });
      });
    });

    describe('cleanupOldAnalyticsData', () => {
      it('should remove analytics data older than retention period', async () => {
        // Arrange
        const retentionDays = 365;

        (mockPrisma.analyticsEvent.deleteMany as jest.Mock).mockResolvedValue({
          count: 1500
        });

        // Act
        const result = await analyticsService.cleanupOldData();

        // Assert
        expect(result).toBeDefined();
        expect(result.deletedRecords).toBe(1500);
        expect(mockPrisma.analyticsEvent.deleteMany).toHaveBeenCalledWith({
          where: {
            timestamp: {
              lt: expect.any(Date)
            }
          }
        });
      });
    });
  });

  describe('Real-time Analytics', () => {
    describe('getRealTimeAnalytics', () => {
      it('should return real-time analytics data', async () => {
        // Arrange
        mockRedis.get.mockImplementation((key: string) => {
          if (key === 'analytics:realtime:online_users') return Promise.resolve('245');
          if (key === 'analytics:realtime:live_page_views') return Promise.resolve('1856'); 
          return Promise.resolve(null);
        });

        (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([
          {
            resourceId: 'article-1',
            timestamp: new Date(),
            properties: '{"engagement": "high"}'
          }
        ]);

        // Act
        const result = await analyticsService.getRealTimeAnalytics();

        // Assert
        expect(result).toBeDefined();
        expect(result.onlineUsers).toBe(245);
        expect(result.livePageViews).toBe(1856);
        expect(result.activeContent).toBeDefined();
        expect(result.trendingTopics).toBeDefined();
        expect(result.systemPerformance).toBeDefined();
      });
    });
  });

  describe('System Health', () => {
    describe('getAnalyticsHealth', () => {
      it('should return system health status', async () => {
        // Arrange
        (mockPrisma.analyticsEvent.findFirst as jest.Mock).mockResolvedValue({
          timestamp: new Date()
        });

        (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(50);
        
        mockRedis.get.mockResolvedValue('25');

        // Act
        const result = await analyticsService.getAnalyticsHealth();

        // Assert
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.dataLatency).toBeDefined();
        expect(result.processingQueue).toBeDefined();
        expect(result.errorRate).toBeDefined();
        expect(result.lastProcessedEvent).toBeDefined();
      });
    });
  });
});