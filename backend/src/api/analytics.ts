/**
 * Analytics REST API Routes
 * Implements analytics endpoints as per REST API specification
 */

import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { authMiddleware } from '../middleware/auth';
import { AnalyticsEventType, DeviceType, GroupByOptions } from '../types/analytics';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// Cast to compatible type
const analyticsService = new AnalyticsService(prisma, redis as any);

// Content Performance Analytics
router.get('/content/:content_id', authMiddleware, async (req, res) => {
  try {
    const { content_id } = req.params;
    const { date_range = '30d', start_date, end_date } = req.query;

    if (!content_id) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    const analytics = await analyticsService.getContentPerformanceAnalytics(content_id);

    return res.json({
      performance: {
        views: analytics.performanceMetrics.totalViews,
        unique_views: analytics.performanceMetrics.uniqueViews,
        likes: analytics.engagementAnalytics.reactions.likes,
        shares: analytics.engagementAnalytics.socialShares.reduce((sum, share) => sum + share.shares, 0),
        comments: analytics.engagementAnalytics.comments.totalComments,
        reading_time_avg: analytics.performanceMetrics.avgReadingTime,
        bounce_rate: analytics.performanceMetrics.bounceRate,
        conversion_rate: analytics.conversionMetrics.subscriptionConversions / Math.max(analytics.performanceMetrics.totalViews, 1)
      },
      trends: analytics.audienceAnalytics.geographicDistribution.map(geo => ({
        date: new Date().toISOString(),
        views: Math.round(analytics.performanceMetrics.totalViews * geo.percentage / 100),
        engagement: geo.engagementScore
      })),
      demographics: {
        age_groups: analytics.audienceAnalytics.demographics.ageGroups.map(age => ({
          age_range: age.ageRange,
          percentage: age.percentage
        })),
        countries: analytics.audienceAnalytics.geographicDistribution.map(geo => ({
          country: geo.country,
          percentage: geo.percentage
        })),
        devices: Object.entries(analytics.audienceAnalytics.deviceBreakdown).map(([device, count]) => ({
          device,
          percentage: (count / analytics.performanceMetrics.totalViews) * 100
        }))
      }
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    return res.status(500).json({ error: 'Failed to retrieve content analytics' });
  }
});

// User Behavior Analytics
router.get('/user/:user_id/behavior', authMiddleware, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { date_range = '30d', start_date, end_date } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify user access (only allow users to view their own data or admin)
    if (!req.user || (req.user.id !== user_id && req.user.subscriptionTier !== 'ENTERPRISE')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const behavior = await analyticsService.getUserBehaviorAnalytics(user_id);

    return res.json({
      engagement_metrics: {
        total_sessions: behavior.sessionAnalytics.sessionsCount,
        avg_session_duration: behavior.sessionAnalytics.averageSessionDuration,
        bounce_rate: behavior.sessionAnalytics.bounceRate,
        pages_per_session: behavior.sessionAnalytics.pagesPerSession,
        total_engagements: behavior.engagementMetrics.totalEngagements,
        engagement_rate: behavior.engagementMetrics.engagementRate,
        avg_reading_time: behavior.engagementMetrics.avgReadingTime
      },
      content_preferences: {
        preferred_categories: behavior.contentPreferences.preferredCategories.map(cat => ({
          category: cat.categoryName,
          engagement_score: cat.engagementScore,
          reading_time: cat.readingTime
        })),
        reading_time_preference: behavior.contentPreferences.readingTimePreference,
        language_preferences: behavior.contentPreferences.languagePreferences.map(lang => ({
          language: lang.language,
          engagement_rate: lang.engagementRate
        }))
      },
      african_market_behavior: {
        preferred_exchanges: behavior.africanMarketBehavior.preferredExchanges,
        mobile_money_usage: {
          provider: behavior.africanMarketBehavior.mobileMoneyUsage.provider,
          frequency: behavior.africanMarketBehavior.mobileMoneyUsage.frequency
        },
        local_currency_focus: behavior.africanMarketBehavior.localCurrencyFocus,
        cross_border_interest: behavior.africanMarketBehavior.crossBorderInterest,
        trading_experience: behavior.africanMarketBehavior.tradingExperienceLevel
      },
      device_patterns: {
        primary_device: behavior.deviceUsagePatterns.primaryDevice,
        device_distribution: behavior.deviceUsagePatterns.deviceDistribution,
        operating_system: behavior.deviceUsagePatterns.operatingSystem,
        browser_preference: behavior.deviceUsagePatterns.browserPreference
      }
    });
  } catch (error) {
    console.error('User behavior analytics error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user behavior analytics' });
  }
});

// African Market Insights
router.get('/african-market-insights', authMiddleware, async (req, res) => {
  try {
    const { date_range = '30d', start_date, end_date } = req.query;
    
    const dateRange = parseDateRange(date_range as string, start_date as string, end_date as string);
    const insights = await analyticsService.getAfricanMarketInsights(dateRange);

    res.json({
      market_overview: {
        total_african_users: insights.topCountries.reduce((sum, country) => sum + country.userCount, 0),
        total_content_views: insights.topCountries.reduce((sum, country) => sum + country.contentViews, 0),
        revenue_contribution: insights.topCountries.reduce((sum, country) => sum + country.revenueContribution, 0),
        growth_rate: insights.topCountries.reduce((sum, country) => sum + country.growthRate, 0) / insights.topCountries.length
      },
      top_countries: insights.topCountries.map(country => ({
        country: country.country,
        user_count: country.userCount,
        content_views: country.contentViews,
        revenue_contribution: country.revenueContribution,
        growth_rate: country.growthRate
      })),
      exchange_popularity: insights.exchangePopularity.map(exchange => ({
        exchange: exchange.exchange,
        mentions: exchange.mentions,
        user_interactions: exchange.userInteractions,
        content_association: exchange.contentAssociation
      })),
      mobile_money_adoption: insights.mobileMoneyAdoption.map(provider => ({
        provider: provider.provider,
        user_count: provider.userCount,
        transaction_volume: provider.transactionVolume,
        subscription_conversions: provider.subscriptionConversions
      })),
      language_usage: insights.languageUsage.map(lang => ({
        language: lang.language,
        user_count: lang.userCount,
        content_available: lang.contentAvailable,
        engagement_rate: lang.engagementRate
      })),
      cross_border_activity: {
        total_users: insights.crossBorderActivity.totalCrossBorderUsers,
        popular_routes: insights.crossBorderActivity.popularRoutes.map(route => ({
          from_country: route.fromCountry,
          to_country: route.toCountry,
          user_count: route.userCount,
          transaction_interest: route.transactionInterest
        })),
        remittance_interest: insights.crossBorderActivity.remittanceInterest
      }
    });
  } catch (error) {
    console.error('African market insights error:', error);
    res.status(500).json({ error: 'Failed to retrieve African market insights' });
  }
});

// Real-time Dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const realTimeData = await analyticsService.getRealTimeAnalytics();

    res.json({
      real_time: {
        online_users: realTimeData.onlineUsers,
        live_page_views: realTimeData.livePageViews,
        active_content: realTimeData.activeContent.map(content => ({
          content_id: content.contentId,
          title: content.title,
          current_viewers: content.currentViewers,
          engagement_rate: content.engagementRate
        })),
        trending_topics: realTimeData.trendingTopics.map(topic => ({
          topic: topic.topic,
          mentions: topic.mentions,
          engagement_score: topic.engagementScore,
          growth: topic.growth
        }))
      },
      system_performance: {
        response_time: realTimeData.systemPerformance.responseTime,
        cache_hit_rate: realTimeData.systemPerformance.cacheHitRate,
        error_rate: realTimeData.systemPerformance.errorRate,
        server_load: realTimeData.systemPerformance.serverLoad
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard analytics' });
  }
});

// Analytics Query Endpoint
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const query = req.body;
    
    // Validate query structure
    if (!query.dateRange || !query.metrics) {
      return res.status(400).json({ error: 'Invalid query structure' });
    }

    const result = await analyticsService.queryAnalytics(query);

    return res.json(result);
  } catch (error) {
    console.error('Analytics query error:', error);
    return res.status(500).json({ error: 'Failed to execute analytics query' });
  }
});

// Track Event Endpoint
router.post('/track', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate event data
    if (!eventData.eventType || !eventData.metadata) {
      return res.status(400).json({ error: 'Invalid event data' });
    }

    const result = await analyticsService.trackEvent(eventData);

    return res.json({ success: true, eventId: result.id });
  } catch (error) {
    console.error('Event tracking error:', error);
    return res.status(500).json({ error: 'Failed to track event' });
  }
});

// Export Analytics Data
router.post('/export', authMiddleware, async (req, res) => {
  try {
    const { userId, format = 'JSON', includePersonalData = false } = req.body;

    // Admin check for exporting other users' data
    if (!req.user || (userId !== req.user.id && req.user.subscriptionTier !== 'ENTERPRISE')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const exportResult = await analyticsService.exportUserData(userId, {
      format: format as 'JSON' | 'CSV' | 'PDF',
      includePersonalData
    });

    return res.json(exportResult);
  } catch (error) {
    console.error('Analytics export error:', error);
    return res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// Helper function to parse date ranges
function parseDateRange(dateRange: string, startDate?: string, endDate?: string) {
  const now = new Date();
  
  if (dateRange === 'custom' && startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };
  }

  let daysBack = 30;
  switch (dateRange) {
    case '7d': daysBack = 7; break;
    case '30d': daysBack = 30; break;
    case '90d': daysBack = 90; break;
    case '365d': daysBack = 365; break;
  }

  return {
    startDate: new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000),
    endDate: now
  };
}

export default router;