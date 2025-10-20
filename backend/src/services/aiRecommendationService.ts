/**
 * AI Recommendation Service
 * 
 * Provides personalized content recommendations based on:
 * - User behavior analysis
 * - Reading history tracking
 * - Content affinity scoring
 * - Portfolio-based market insights
 * 
 * Performance targets:
 * - Response time: < 500ms
 * - Cache hit rate: 75%+
 * - Recommendation relevance: >0.7 score
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache TTLs
const CACHE_TTL = {
  RECOMMENDATIONS: 300, // 5 minutes
  USER_PREFERENCES: 600, // 10 minutes
  AI_INSIGHTS: 180, // 3 minutes
  READING_HISTORY: 300, // 5 minutes
};

// Recommendation scoring weights
const SCORING_WEIGHTS = {
  READING_HISTORY: 0.35,
  CATEGORY_AFFINITY: 0.25,
  RECENCY: 0.15,
  POPULARITY: 0.10,
  PORTFOLIO_RELEVANCE: 0.10,
  LANGUAGE_PREFERENCE: 0.05,
};

// Content difficulty levels
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Notification frequency
export enum NotificationFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface UserPreferences {
  userId: string;
  favoriteCategories: string[];
  favoriteTopics: string[];
  languagePreferences: string[];
  contentDifficulty: DifficultyLevel;
  notificationFrequency: NotificationFrequency;
  enableMemecoinAlerts: boolean;
  enableMarketInsights: boolean;
  portfolioSymbols?: string[];
  excludedTopics?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentRecommendation {
  articleId: string;
  title: string;
  excerpt: string;
  category: string;
  topics: string[];
  relevanceScore: number;
  reason: string;
  imageUrl?: string;
  publishedAt: Date;
  readingTime: number;
  difficulty?: DifficultyLevel;
}

export interface MemecoinAlert {
  symbol: string;
  name: string;
  alertType: 'surge' | 'drop' | 'whale_activity' | 'new_listing';
  relevanceScore: number;
  priceChange24h: number;
  volume24h: number;
  message: string;
  timestamp: Date;
}

export interface MarketInsight {
  insightId: string;
  type: 'portfolio' | 'market_trend' | 'sentiment' | 'prediction';
  title: string;
  description: string;
  relevanceScore: number;
  relatedSymbols: string[];
  actionable: boolean;
  confidence: number;
  timestamp: Date;
}

export interface RecommendationResponse {
  recommendations: ContentRecommendation[];
  memecoinAlerts: MemecoinAlert[];
  marketInsights: MarketInsight[];
  userPreferences: UserPreferences;
  lastUpdated: Date;
  cacheHit: boolean;
}

export interface ReadingHistoryEntry {
  articleId: string;
  userId: string;
  readAt: Date;
  readDuration: number; // seconds
  completed: boolean;
  category: string;
  topics: string[];
}

export interface ContentAffinityScore {
  category: string;
  score: number;
  readCount: number;
  avgReadDuration: number;
  completionRate: number;
}

export interface BehaviorAnalysis {
  userId: string;
  totalArticlesRead: number;
  avgReadingTime: number;
  categoryAffinities: ContentAffinityScore[];
  topicAffinities: Map<string, number>;
  preferredDifficulty: DifficultyLevel;
  activeHours: number[];
  lastActive: Date;
}

class AIRecommendationService {
  /**
   * Get personalized content recommendations for a user
   */
  async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = `recommendations:${userId}:${limit}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`[Recommendations] Cache hit for user ${userId} (${Date.now() - startTime}ms)`);
        return { ...data, cacheHit: true };
      }

      // Fetch user preferences
      const preferences = await this.getUserPreferences(userId);

      // Get user behavior analysis
      const behaviorAnalysis = await this.analyzeBehavior(userId);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        userId,
        preferences,
        behaviorAnalysis,
        limit
      );

      // Get memecoin alerts if enabled
      const memecoinAlerts = preferences.enableMemecoinAlerts
        ? await this.getMemecoinAlerts(userId, preferences)
        : [];

      // Get market insights if enabled
      const marketInsights = preferences.enableMarketInsights
        ? await this.getMarketInsights(userId, preferences)
        : [];

      const response: RecommendationResponse = {
        recommendations,
        memecoinAlerts,
        marketInsights,
        userPreferences: preferences,
        lastUpdated: new Date(),
        cacheHit: false,
      };

      // Cache the response
      await redis.setex(
        cacheKey,
        CACHE_TTL.RECOMMENDATIONS,
        JSON.stringify(response)
      );

      const duration = Date.now() - startTime;
      console.log(`[Recommendations] Generated for user ${userId} (${duration}ms)`);

      return response;
    } catch (error) {
      console.error('[Recommendations] Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Analyze user behavior from reading history
   */
  async analyzeBehavior(userId: string): Promise<BehaviorAnalysis> {
    const cacheKey = `behavior:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Fetch reading history (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const readingHistory = await prisma.analyticsEvent.findMany({
        where: {
          userId,
          eventType: 'article_read',
          timestamp: { gte: ninetyDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 500,
      });

      // Calculate category affinities
      const categoryStats = new Map<string, { reads: number; duration: number; completed: number }>();
      const topicAffinities = new Map<string, number>();
      let totalReadingTime = 0;
      let lastActive = new Date(0);

      for (const event of readingHistory) {
        const metadata = event.metadata as any;
        const category = metadata?.category || 'general';
        const topics = metadata?.topics || [];
        const duration = metadata?.readDuration || 0;
        const completed = metadata?.completed || false;

        // Update category stats
        const stats = categoryStats.get(category) || { reads: 0, duration: 0, completed: 0 };
        stats.reads += 1;
        stats.duration += duration;
        if (completed) stats.completed += 1;
        categoryStats.set(category, stats);

        // Update topic affinities
        for (const topic of topics) {
          topicAffinities.set(topic, (topicAffinities.get(topic) || 0) + 1);
        }

        totalReadingTime += duration;

        if (event.timestamp > lastActive) {
          lastActive = event.timestamp;
        }
      }

      // Calculate category affinity scores
      const categoryAffinities: ContentAffinityScore[] = [];
      for (const [category, stats] of categoryStats.entries()) {
        const completionRate = stats.completed / stats.reads;
        const avgDuration = stats.duration / stats.reads;
        
        // Affinity score combines read count, completion rate, and time spent
        const score = (
          (stats.reads / readingHistory.length) * 0.4 +
          completionRate * 0.3 +
          Math.min(avgDuration / 300, 1) * 0.3 // Normalize to 5 minutes
        );

        categoryAffinities.push({
          category,
          score: Math.min(score, 1),
          readCount: stats.reads,
          avgReadDuration: avgDuration,
          completionRate,
        });
      }

      // Sort by score
      categoryAffinities.sort((a, b) => b.score - a.score);

      // Determine preferred difficulty
      const avgReadingTime = readingHistory.length > 0 
        ? totalReadingTime / readingHistory.length 
        : 180;
      
      let preferredDifficulty = DifficultyLevel.INTERMEDIATE;
      if (avgReadingTime < 120) {
        preferredDifficulty = DifficultyLevel.BEGINNER;
      } else if (avgReadingTime > 300) {
        preferredDifficulty = DifficultyLevel.ADVANCED;
      }

      const analysis: BehaviorAnalysis = {
        userId,
        totalArticlesRead: readingHistory.length,
        avgReadingTime,
        categoryAffinities,
        topicAffinities,
        preferredDifficulty,
        activeHours: this.extractActiveHours(readingHistory),
        lastActive,
      };

      // Cache for 5 minutes
      await redis.setex(
        cacheKey,
        CACHE_TTL.READING_HISTORY,
        JSON.stringify(analysis)
      );

      return analysis;
    } catch (error) {
      console.error('[Recommendations] Error analyzing behavior:', error);
      // Return default analysis
      return {
        userId,
        totalArticlesRead: 0,
        avgReadingTime: 180,
        categoryAffinities: [],
        topicAffinities: new Map(),
        preferredDifficulty: DifficultyLevel.INTERMEDIATE,
        activeHours: [],
        lastActive: new Date(),
      };
    }
  }

  /**
   * Generate personalized content recommendations
   */
  private async generateRecommendations(
    userId: string,
    preferences: UserPreferences,
    behavior: BehaviorAnalysis,
    limit: number
  ): Promise<ContentRecommendation[]> {
    try {
      // Build query conditions
      const categoryFilter = preferences.favoriteCategories.length > 0
        ? preferences.favoriteCategories
        : behavior.categoryAffinities.slice(0, 5).map(a => a.category);

      // Fetch candidate articles
      const whereClause: any = {
        status: 'published',
        isPremium: false, // Consider user subscription level
      };
      
      if (categoryFilter.length > 0) {
        whereClause.categoryId = { in: categoryFilter };
      }
      
      const candidates = await prisma.article.findMany({
        where: whereClause,
        include: {
          Category: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit * 5, // Get more candidates for scoring
      });

      // Score each candidate
      const scoredRecommendations = candidates.map(article => {
        const score = this.calculateRelevanceScore(
          article,
          preferences,
          behavior
        );

        // Parse tags from JSON string
        let topics: string[] = [];
        try {
          topics = article.tags ? JSON.parse(article.tags) : [];
        } catch (e) {
          topics = [];
        }

        const recommendation: ContentRecommendation = {
          articleId: article.id,
          title: article.title,
          excerpt: article.excerpt || article.content.substring(0, 200),
          category: article.Category.name,
          topics,
          relevanceScore: score.total,
          reason: score.reason,
          publishedAt: article.publishedAt!,
          readingTime: Math.ceil(article.content.length / 1000), // Rough estimate
          difficulty: this.estimateDifficulty(article),
        };
        
        if (article.featuredImageUrl) {
          recommendation.imageUrl = article.featuredImageUrl;
        }
        
        return recommendation;
      });

      // Sort by relevance and return top N
      scoredRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return scoredRecommendations.slice(0, limit);
    } catch (error) {
      console.error('[Recommendations] Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score for an article
   */
  private calculateRelevanceScore(
    article: any,
    preferences: UserPreferences,
    behavior: BehaviorAnalysis
  ): { total: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // Category affinity
    const categoryAffinity = behavior.categoryAffinities.find(
      a => a.category === article.category.id
    );
    if (categoryAffinity) {
      const categoryScore = categoryAffinity.score * SCORING_WEIGHTS.CATEGORY_AFFINITY;
      score += categoryScore;
      if (categoryScore > 0.15) {
        reasons.push(`You enjoy ${article.category.name} content`);
      }
    }

    // Topic affinity
    const articleTopics = article.tags.map((t: any) => t.name);
    let topicScore = 0;
    for (const topic of articleTopics) {
      const affinity = behavior.topicAffinities.get(topic) || 0;
      topicScore += affinity / behavior.totalArticlesRead;
    }
    topicScore = Math.min(topicScore, 1) * SCORING_WEIGHTS.READING_HISTORY;
    score += topicScore;
    if (topicScore > 0.2) {
      reasons.push(`Covers topics you follow`);
    }

    // Recency
    const daysSincePublished = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSincePublished / 7) * SCORING_WEIGHTS.RECENCY;
    score += recencyScore;
    if (daysSincePublished < 1) {
      reasons.push('Fresh content');
    }

    // Popularity (view count)
    const popularityScore = Math.min(article.viewCount / 10000, 1) * SCORING_WEIGHTS.POPULARITY;
    score += popularityScore;
    if (article.viewCount > 5000) {
      reasons.push('Trending article');
    }

    // Difficulty match
    const articleDifficulty = this.estimateDifficulty(article);
    if (articleDifficulty === preferences.contentDifficulty || 
        articleDifficulty === behavior.preferredDifficulty) {
      score += 0.05;
      reasons.push(`Matches your ${preferences.contentDifficulty} level`);
    }

    // Language preference
    if (preferences.languagePreferences.includes(article.language || 'en')) {
      score += SCORING_WEIGHTS.LANGUAGE_PREFERENCE;
    }

    // Normalize score to 0-1 range
    score = Math.min(score, 1);

    return {
      total: score,
      reason: reasons.join(' • ') || 'Recommended for you',
    };
  }

  /**
   * Get memecoin alerts for user
   */
  private async getMemecoinAlerts(
    userId: string,
    preferences: UserPreferences
  ): Promise<MemecoinAlert[]> {
    const cacheKey = `memecoin_alerts:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Get trending memecoins (placeholder - integrate with real market data)
      // Note: Token table doesn't have priceChange24h, volume24h fields yet
      // TODO: Add MarketData table or update Token schema
      const alerts: MemecoinAlert[] = [];
      
      // Temporary: Return empty alerts until market data integration is complete
      // This prevents database errors while keeping the API functional

      // Cache for 3 minutes
      await redis.setex(cacheKey, CACHE_TTL.AI_INSIGHTS, JSON.stringify(alerts));

      return alerts;
    } catch (error) {
      console.error('[Recommendations] Error fetching memecoin alerts:', error);
      return [];
    }
  }

  /**
   * Get market insights for user
   */
  private async getMarketInsights(
    userId: string,
    preferences: UserPreferences
  ): Promise<MarketInsight[]> {
    const cacheKey = `market_insights:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const insights: MarketInsight[] = [];

      // Portfolio-based insights
      if (preferences.portfolioSymbols && preferences.portfolioSymbols.length > 0) {
        for (const symbol of preferences.portfolioSymbols.slice(0, 5)) {
          const token = await prisma.token.findUnique({
            where: { symbol },
          });

          if (token) {
            insights.push({
              insightId: `portfolio_${symbol}_${Date.now()}`,
              type: 'portfolio',
              title: `${token.name} (${token.symbol}) Update`,
              description: this.generatePortfolioInsight(token),
              relevanceScore: 0.9,
              relatedSymbols: [token.symbol],
              actionable: true,
              confidence: 0.85,
              timestamp: new Date(),
            });
          }
        }
      }

      // Market trend insights
      const trendingCategories = await this.getTrendingCategories();
      if (trendingCategories.length > 0) {
        insights.push({
          insightId: `trend_${Date.now()}`,
          type: 'market_trend',
          title: 'Trending in Crypto',
          description: `${trendingCategories.join(', ')} are seeing increased activity`,
          relevanceScore: 0.75,
          relatedSymbols: [],
          actionable: false,
          confidence: 0.8,
          timestamp: new Date(),
        });
      }

      // Cache for 3 minutes
      await redis.setex(cacheKey, CACHE_TTL.AI_INSIGHTS, JSON.stringify(insights));

      return insights.slice(0, 5);
    } catch (error) {
      console.error('[Recommendations] Error fetching market insights:', error);
      return [];
    }
  }

  /**
   * Get or create user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = `preferences:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const dbPreferences = await prisma.userPreference.findUnique({
        where: { userId },
      });

      let preferences: UserPreferences;

      if (dbPreferences) {
        preferences = {
          userId: dbPreferences.userId,
          favoriteCategories: JSON.parse(dbPreferences.favoriteCategories || '[]'),
          favoriteTopics: JSON.parse(dbPreferences.preferredTopics || '[]'),
          languagePreferences: JSON.parse(dbPreferences.contentLanguages || '["en"]'),
          contentDifficulty: (dbPreferences.readingLevel.toLowerCase() as DifficultyLevel) || DifficultyLevel.INTERMEDIATE,
          notificationFrequency: (dbPreferences.digestFrequency.toLowerCase() as NotificationFrequency) || NotificationFrequency.DAILY,
          enableMemecoinAlerts: dbPreferences.priceAlerts ?? true,
          enableMarketInsights: dbPreferences.aiRecommendations ?? true,
          portfolioSymbols: [],  // TODO: Add to UserPreference schema
          excludedTopics: [],    // TODO: Add to UserPreference schema
          createdAt: dbPreferences.createdAt,
          updatedAt: dbPreferences.updatedAt,
        };
      } else {
        // Create default preferences
        preferences = {
          userId,
          favoriteCategories: [],
          favoriteTopics: [],
          languagePreferences: ['en'],
          contentDifficulty: DifficultyLevel.INTERMEDIATE,
          notificationFrequency: NotificationFrequency.DAILY,
          enableMemecoinAlerts: true,
          enableMarketInsights: true,
          portfolioSymbols: [],
          excludedTopics: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Cache for 10 minutes
      await redis.setex(
        cacheKey,
        CACHE_TTL.USER_PREFERENCES,
        JSON.stringify(preferences)
      );

      return preferences;
    } catch (error) {
      console.error('[Recommendations] Error fetching preferences:', error);
      // Return default preferences
      return {
        userId,
        favoriteCategories: [],
        favoriteTopics: [],
        languagePreferences: ['en'],
        contentDifficulty: DifficultyLevel.INTERMEDIATE,
        notificationFrequency: NotificationFrequency.DAILY,
        enableMemecoinAlerts: true,
        enableMarketInsights: true,
      };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      // Get current preferences
      const current = await this.getUserPreferences(userId);

      // Merge updates
      const updated = { ...current, ...updates, updatedAt: new Date() };

      // Map our UserPreferences to database fields
      const dbData: any = {
        userId,
      };
      
      if (updated.favoriteCategories) dbData.favoriteCategories = JSON.stringify(updated.favoriteCategories);
      if (updated.favoriteTopics) dbData.preferredTopics = JSON.stringify(updated.favoriteTopics);
      if (updated.languagePreferences) dbData.contentLanguages = JSON.stringify(updated.languagePreferences);
      if (updated.contentDifficulty) dbData.readingLevel = updated.contentDifficulty.toUpperCase();
      if (updated.notificationFrequency) dbData.digestFrequency = updated.notificationFrequency.toUpperCase();
      if (updated.enableMemecoinAlerts !== undefined) dbData.priceAlerts = updated.enableMemecoinAlerts;
      if (updated.enableMarketInsights !== undefined) dbData.aiRecommendations = updated.enableMarketInsights;
      
      // Save to database
      await prisma.userPreference.upsert({
        where: { userId },
        create: dbData,
        update: dbData,
      });

      // Invalidate cache
      const cacheKey = `preferences:${userId}`;
      await redis.del(cacheKey);
      await redis.del(`recommendations:${userId}:*`);
      await redis.del(`behavior:${userId}`);

      console.log(`[Recommendations] Updated preferences for user ${userId}`);

      return updated;
    } catch (error) {
      console.error('[Recommendations] Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Track article read event
   */
  async trackArticleRead(
    userId: string,
    articleId: string,
    readDuration: number,
    completed: boolean
  ): Promise<void> {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { Category: true },
      });

      if (!article) return;

      // Store in analytics
      await prisma.analyticsEvent.create({
        data: {
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${userId}_${Date.now()}`,
          userId,
          eventType: 'article_read',
          resourceId: articleId,
          resourceType: 'article',
          properties: JSON.stringify({
            readDuration,
            completed,
          }),
          metadata: JSON.stringify({
            articleId,
            category: article.Category.id,
            topics: article.tags ? JSON.parse(article.tags) : [],
            readDuration,
            completed,
          }),
        },
      });

      // Invalidate behavior cache
      await redis.del(`behavior:${userId}`);
      await redis.del(`recommendations:${userId}:*`);

      console.log(`[Recommendations] Tracked read for user ${userId}, article ${articleId}`);
    } catch (error) {
      console.error('[Recommendations] Error tracking article read:', error);
    }
  }

  /**
   * Helper: Extract active hours from reading history
   */
  private extractActiveHours(readingHistory: any[]): number[] {
    const hourCounts = new Array(24).fill(0);

    for (const event of readingHistory) {
      const hour = event.createdAt.getHours();
      hourCounts[hour] += 1;
    }

    // Return top 3 active hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);
  }

  /**
   * Helper: Estimate article difficulty
   */
  private estimateDifficulty(article: any): DifficultyLevel {
    const wordCount = article.content.split(/\s+/).length;
    const hasComplexTerms = /blockchain|cryptography|consensus|protocol/i.test(article.content);

    if (wordCount < 500 && !hasComplexTerms) {
      return DifficultyLevel.BEGINNER;
    } else if (wordCount > 1500 || hasComplexTerms) {
      return DifficultyLevel.ADVANCED;
    }

    return DifficultyLevel.INTERMEDIATE;
  }

  /**
   * Helper: Calculate memecoin relevance
   */
  private calculateMemecoinRelevance(coin: any, preferences: UserPreferences): number {
    let score = 0.5; // Base score

    // Check if in portfolio
    if (preferences.portfolioSymbols?.includes(coin.symbol)) {
      score += 0.3;
    }

    // Adjust based on price change magnitude
    const changePercent = Math.abs(coin.priceChange24h);
    if (changePercent > 50) score += 0.2;
    else if (changePercent > 20) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Helper: Generate alert message
   */
  private generateAlertMessage(coin: any): string {
    const change = coin.priceChange24h;
    const direction = change > 0 ? 'up' : 'down';
    const emoji = change > 0 ? '🚀' : '📉';

    return `${emoji} ${coin.name} is ${direction} ${Math.abs(change).toFixed(2)}% in 24h`;
  }

  /**
   * Helper: Generate portfolio insight
   */
  private generatePortfolioInsight(token: any): string {
    const change = token.priceChange24h;
    
    if (change > 5) {
      return `Strong upward momentum with ${change.toFixed(2)}% gain. Consider monitoring for profit-taking opportunities.`;
    } else if (change < -5) {
      return `Price correction of ${Math.abs(change).toFixed(2)}%. Review fundamentals and consider DCA strategy.`;
    }

    return `Stable price action. Current volume: ${token.volume24h.toLocaleString()}`;
  }

  /**
   * Helper: Get trending categories
   */
  private async getTrendingCategories(): Promise<string[]> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const trending = await prisma.article.groupBy({
        by: ['categoryId'],
        where: {
          publishedAt: { gte: oneDayAgo },
          status: 'published',
        },
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
        take: 3,
      });

      const categoryIds = trending.map(t => t.categoryId);
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      return categories.map(c => c.name);
    } catch (error) {
      console.error('[Recommendations] Error fetching trending categories:', error);
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; redis: boolean; database: boolean }> {
    let redisHealthy = false;
    let databaseHealthy = false;

    try {
      await redis.ping();
      redisHealthy = true;
    } catch (error) {
      console.error('[Recommendations] Redis health check failed:', error);
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (error) {
      console.error('[Recommendations] Database health check failed:', error);
    }

    return {
      status: redisHealthy && databaseHealthy ? 'healthy' : 'degraded',
      redis: redisHealthy,
      database: databaseHealthy,
    };
  }
}

export default new AIRecommendationService();

