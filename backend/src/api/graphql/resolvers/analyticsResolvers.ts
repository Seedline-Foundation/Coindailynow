/**
 * Analytics GraphQL Resolvers
 * Task 18: Advanced Analytics System
 */

import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../../../services/analyticsService';
import { 
  AnalyticsEventType, 
  DeviceType,
  GroupByOptions,
  AfricanMarketContext 
} from '../../../types/analytics';

interface Context {
  prisma: PrismaClient;
  user?: { id: string; role: string };
  redis: any;
}

// Mock Redis for resolver context
const mockRedis = {
  get: async () => null,
  setEx: async () => 'OK',
  incr: async () => 1,
  expire: async () => true,
  del: async () => 1,
  quit: async () => 'OK'
};

export const analyticsResolvers = {
  Query: {
    /**
     * Get user behavior analytics
     */
    getUserBehaviorAnalytics: async (
      _: any,
      { userId }: { userId: string },
      context: Context
    ) => {
      if (!context.user || (context.user.id !== userId && !['ADMIN', 'AI_MANAGER'].includes(context.user.role))) {
        throw new Error('Unauthorized to access user analytics');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getUserBehaviorAnalytics(userId);
    },

    /**
     * Get content performance analytics
     */
    getContentPerformanceAnalytics: async (
      _: any,
      { contentId }: { contentId: string },
      context: Context
    ) => {
      if (!context.user || !['ADMIN', 'EDITOR', 'AI_MANAGER'].includes(context.user.role)) {
        throw new Error('Unauthorized to access content analytics');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getContentPerformanceAnalytics(contentId);
    },

    /**
     * Get African market insights
     */
    getAfricanMarketInsights: async (
      _: any,
      { dateRange }: { 
        dateRange: { 
          startDate: string; 
          endDate: string; 
        } 
      },
      context: Context
    ) => {
      if (!context.user || !['ADMIN', 'AI_MANAGER'].includes(context.user.role)) {
        throw new Error('Unauthorized to access market insights');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getAfricanMarketInsights({
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      });
    },

    /**
     * Get real-time analytics
     */
    getRealTimeAnalytics: async (
      _: any,
      __: any,
      context: Context
    ) => {
      if (!context.user || !['ADMIN', 'AI_MANAGER'].includes(context.user.role)) {
        throw new Error('Unauthorized to access real-time analytics');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getRealTimeAnalytics();
    },

    /**
     * Get top performing content
     */
    getTopPerformingContent: async (
      _: any,
      { limit }: { limit?: number },
      context: Context
    ) => {
      if (!context.user || !['ADMIN', 'EDITOR', 'AI_MANAGER'].includes(context.user.role)) {
        throw new Error('Unauthorized to access content performance data');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getTopPerformingContent(limit);
    },

    /**
     * Query analytics with filters
     */
    queryAnalytics: async (
      _: any,
      { query }: { 
        query: {
          dateRange: { startDate: string; endDate: string };
          filters?: {
            userIds?: string[];
            contentIds?: string[];
            categories?: string[];
            countries?: string[];
            deviceTypes?: string[];
            eventTypes?: string[];
            subscriptionTiers?: string[];
            africanExchanges?: string[];
            mobileMoneyProviders?: string[];
          };
          groupBy?: string;
          metrics: string[];
          sortBy?: { field: string; direction: string };
          limit?: number;
        }
      },
      context: Context
    ) => {
      if (!context.user || !['ADMIN', 'AI_MANAGER'].includes(context.user.role)) {
        throw new Error('Unauthorized to query analytics');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      
      // Convert string enums to proper types with proper filtering
      const filters = query.filters || {};
      const deviceTypes = filters.deviceTypes?.map(dt => dt as DeviceType).filter(dt => 
        Object.values(DeviceType).includes(dt)
      );
      const eventTypes = filters.eventTypes?.map(et => et as AnalyticsEventType).filter(et => 
        Object.values(AnalyticsEventType).includes(et)
      );
      const groupBy = query.groupBy as GroupByOptions;

      return analyticsService.queryAnalytics({
        dateRange: {
          startDate: new Date(query.dateRange.startDate),
          endDate: new Date(query.dateRange.endDate)
        },
        // @ts-ignore - Type compatibility issue with exactOptionalPropertyTypes
        filters: {
          ...filters,
          ...(deviceTypes && deviceTypes.length > 0 && { deviceTypes }),
          ...(eventTypes && eventTypes.length > 0 && { eventTypes })
        },
        groupBy,
        metrics: query.metrics,
        sortBy: query.sortBy ? {
          field: query.sortBy.field,
          direction: query.sortBy.direction as 'ASC' | 'DESC'
        } : undefined,
        limit: query.limit
      });
    },

    /**
     * Get analytics system health
     */
    getAnalyticsHealth: async (
      _: any,
      __: any,
      context: Context
    ) => {
      if (!context.user || !['ADMIN'].includes(context.user.role)) {
        throw new Error('Unauthorized to access system health');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getAnalyticsHealth();
    },

    /**
     * Get session analytics for user
     */
    getSessionAnalytics: async (
      _: any,
      { userId, dateRange }: { 
        userId: string;
        dateRange: { startDate: string; endDate: string };
      },
      context: Context
    ) => {
      if (!context.user || (context.user.id !== userId && !['ADMIN', 'AI_MANAGER'].includes(context.user.role))) {
        throw new Error('Unauthorized to access session analytics');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.getSessionAnalytics(userId, {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      });
    }
  },

  Mutation: {
    /**
     * Track analytics event
     */
    trackEvent: async (
      _: any,
      { eventData }: { 
        eventData: {
          userId?: string;
          sessionId?: string;
          eventType: string;
          resourceId?: string;
          resourceType?: string;
          properties?: any;
          metadata: {
            userAgent: string;
            deviceType: string;
            country: string;
            region: string;
            language: string;
            referrer?: string;
            sessionDuration?: number;
            ipAddress: string;
            africanMarketContext?: {
              country: string;
              exchange?: string;
              mobileMoneyProvider?: string;
              localCurrency: string;
              timezone: string;
              networkConditions?: string;
            };
          };
        }
      },
      context: Context
    ) => {
      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      
      // Convert string to enum
      const eventType = eventData.eventType as AnalyticsEventType;
      const deviceType = eventData.metadata.deviceType as DeviceType;

      // Fix African market context networkConditions
      let processedAfricanMarketContext = eventData.metadata.africanMarketContext;
      if (processedAfricanMarketContext && processedAfricanMarketContext.networkConditions) {
        processedAfricanMarketContext = {
          ...processedAfricanMarketContext,
          networkConditions: processedAfricanMarketContext.networkConditions as 'FAST' | 'SLOW' | 'OFFLINE'
        };
      }

      return analyticsService.trackEvent({
        ...eventData,
        eventType,
        // @ts-ignore - Type compatibility issue with exactOptionalPropertyTypes
        metadata: {
          ...eventData.metadata,
          deviceType,
          ...(processedAfricanMarketContext && { africanMarketContext: processedAfricanMarketContext })
        }
      });
    },

    /**
     * Track mobile money event
     */
    trackMobileMoneyEvent: async (
      _: any,
      { 
        userId,
        mobileMoneyData 
      }: { 
        userId: string;
        mobileMoneyData: {
          provider: string;
          amount: number;
          currency: string;
          transactionType: string;
          status: string;
        };
      },
      context: Context
    ) => {
      if (!context.user || (context.user.id !== userId && !['ADMIN'].includes(context.user.role))) {
        throw new Error('Unauthorized to track mobile money events');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.trackMobileMoneyEvent(userId, mobileMoneyData);
    },

    /**
     * Export user analytics data for GDPR compliance
     */
    exportUserData: async (
      _: any,
      { 
        userId,
        options 
      }: { 
        userId: string;
        options: {
          format: 'CSV' | 'JSON' | 'PDF';
          includePersonalData: boolean;
        };
      },
      context: Context
    ) => {
      if (!context.user || (context.user.id !== userId && !['ADMIN'].includes(context.user.role))) {
        throw new Error('Unauthorized to export user data');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.exportUserData(userId, options);
    },

    /**
     * Clean up old analytics data for compliance
     */
    cleanupOldData: async (
      _: any,
      __: any,
      context: Context
    ) => {
      if (!context.user || !['ADMIN'].includes(context.user.role)) {
        throw new Error('Unauthorized to cleanup data');
      }

      const analyticsService = new AnalyticsService(context.prisma, mockRedis);
      return analyticsService.cleanupOldData();
    }
  }
};