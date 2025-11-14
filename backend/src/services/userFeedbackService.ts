/**
 * User Feedback Service
 * 
 * Manages user feedback collection, AI learning integration, and quality improvement.
 * Implements feedback loop for content ratings, translation issues, and recommendations.
 * 
 * Features:
 * - Content rating (1-5 stars)
 * - Translation error reporting
 * - Recommendation quality feedback
 * - AI learning integration
 * - Feedback analytics
 * 
 * @module UserFeedbackService
 */

import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ContentFeedback {
  userId: string;
  articleId: string;
  rating: number; // 1-5 stars
  feedbackType: 'helpful' | 'not_helpful' | 'inaccurate' | 'well_written' | 'poor_quality';
  comment?: string;
  aiGenerated: boolean;
  timestamp: Date;
}

export interface TranslationFeedback {
  userId: string;
  articleId: string;
  translationId: string;
  language: string;
  issueType: 'inaccurate' | 'grammar' | 'context_lost' | 'formatting' | 'offensive' | 'other';
  originalText: string;
  suggestedText?: string;
  comment?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface RecommendationFeedback {
  userId: string;
  recommendationId: string;
  articleId: string;
  rating: number; // 1-5 stars
  feedbackType: 'relevant' | 'not_relevant' | 'already_read' | 'not_interested' | 'excellent';
  comment?: string;
  timestamp: Date;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  feedbackTypes: Record<string, number>;
  aiGeneratedFeedback: {
    total: number;
    averageRating: number;
  };
  translationIssues: {
    total: number;
    byLanguage: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  recommendationAccuracy: {
    totalRecommendations: number;
    averageRating: number;
    relevanceScore: number;
  };
}

export interface AILearningData {
  contentQualityInsights: {
    highRatedPatterns: string[];
    lowRatedPatterns: string[];
    improvementSuggestions: string[];
  };
  translationQualityInsights: {
    commonIssues: Array<{
      language: string;
      issueType: string;
      frequency: number;
      examples: string[];
    }>;
    qualityScoreByLanguage: Record<string, number>;
  };
  recommendationInsights: {
    userPreferences: Record<string, any>;
    accuracyMetrics: {
      precision: number;
      recall: number;
      f1Score: number;
    };
    improvementAreas: string[];
  };
}

// ============================================================================
// User Feedback Service Class
// ============================================================================

export class UserFeedbackService {
  private prisma: PrismaClient;
  private redis: RedisClientType;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly ANALYTICS_CACHE_TTL = 3600; // 1 hour

  constructor(prisma: PrismaClient, redis: RedisClientType) {
    this.prisma = prisma;
    this.redis = redis;
  }

  // ==========================================================================
  // Content Feedback Methods
  // ==========================================================================

  /**
   * Submit content rating feedback
   */
  async submitContentFeedback(feedback: ContentFeedback): Promise<{
    id: string;
    message: string;
    impactScore: number;
  }> {
    try {
      // Validate rating
      if (feedback.rating < 1 || feedback.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user already rated this article
      const existingFeedback = await this.prisma.userFeedback.findFirst({
        where: {
          userId: feedback.userId,
          articleId: feedback.articleId,
          feedbackType: 'CONTENT_RATING',
        },
      });

      let feedbackRecord;

      if (existingFeedback) {
        // Update existing feedback
        feedbackRecord = await this.prisma.userFeedback.update({
          where: { id: existingFeedback.id },
          data: {
            rating: feedback.rating,
            feedbackCategory: feedback.feedbackType,
            comment: feedback.comment,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new feedback
        feedbackRecord = await this.prisma.userFeedback.create({
          data: {
            userId: feedback.userId,
            articleId: feedback.articleId,
            feedbackType: 'CONTENT_RATING',
            rating: feedback.rating,
            feedbackCategory: feedback.feedbackType,
            comment: feedback.comment,
            metadata: JSON.stringify({
              aiGenerated: feedback.aiGenerated,
              timestamp: feedback.timestamp.toISOString(),
            }),
          },
        });
      }

      // Update article rating statistics
      await this.updateArticleRatingStats(feedback.articleId);

      // Clear cache
      await this.clearFeedbackCache(feedback.articleId);

      // Calculate impact score
      const impactScore = await this.calculateFeedbackImpact(feedback);

      // Queue for AI learning if significant
      if (impactScore > 0.7) {
        await this.queueForAILearning('content', feedbackRecord.id);
      }

      return {
        id: feedbackRecord.id,
        message: existingFeedback ? 'Feedback updated successfully' : 'Feedback submitted successfully',
        impactScore,
      };
    } catch (error: any) {
      console.error('Error submitting content feedback:', error);
      throw new Error(`Failed to submit content feedback: ${error.message}`);
    }
  }

  /**
   * Get content feedback for an article
   */
  async getContentFeedback(articleId: string, userId?: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Record<number, number>;
    userFeedback?: any;
  }> {
    try {
      const cacheKey = `content_feedback:${articleId}${userId ? `:${userId}` : ''}`;
      
      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get aggregate stats
      const stats = await this.prisma.userFeedback.groupBy({
        by: ['rating'],
        where: {
          articleId,
          feedbackType: 'CONTENT_RATING',
          rating: { not: null },
        },
        _count: true,
      });

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;
      let totalCount = 0;

      stats.forEach((stat: { rating: number | null; _count: number }) => {
        if (stat.rating) {
          ratingDistribution[stat.rating] = stat._count;
          totalRating += stat.rating * stat._count;
          totalCount += stat._count;
        }
      });

      const averageRating = totalCount > 0 ? totalRating / totalCount : 0;

      let userFeedback = undefined;
      if (userId) {
        userFeedback = await this.prisma.userFeedback.findFirst({
          where: {
            userId,
            articleId,
            feedbackType: 'CONTENT_RATING',
          },
        });
      }

      const result = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalFeedback: totalCount,
        ratingDistribution,
        userFeedback,
      };

      // Cache result
      await this.redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error: any) {
      console.error('Error getting content feedback:', error);
      throw new Error(`Failed to get content feedback: ${error.message}`);
    }
  }

  // ==========================================================================
  // Translation Feedback Methods
  // ==========================================================================

  /**
   * Submit translation error report
   */
  async submitTranslationFeedback(feedback: TranslationFeedback): Promise<{
    id: string;
    message: string;
    ticketNumber: string;
    priorityLevel: string;
  }> {
    try {
      // Create feedback record
      const feedbackRecord = await this.prisma.userFeedback.create({
        data: {
          userId: feedback.userId,
          articleId: feedback.articleId,
          feedbackType: 'TRANSLATION_ISSUE',
          feedbackCategory: feedback.issueType,
          comment: feedback.comment,
          metadata: JSON.stringify({
            language: feedback.language,
            originalText: feedback.originalText,
            suggestedText: feedback.suggestedText,
            translationId: feedback.translationId,
            severity: feedback.severity,
            timestamp: feedback.timestamp.toISOString(),
          }),
        },
      });

      // Generate ticket number
      const ticketNumber = `TR-${Date.now()}-${feedbackRecord.id.slice(0, 8)}`;

      // Update translation quality score
      await this.updateTranslationQualityScore(feedback.translationId, feedback.severity);

      // Determine priority level
      const priorityLevel = this.calculateTranslationPriority(feedback.severity, feedback.issueType);

      // Queue for human review if critical
      if (feedback.severity === 'critical' || feedback.severity === 'high') {
        await this.queueForHumanReview(feedbackRecord.id, priorityLevel);
      }

      // Queue for AI learning
      await this.queueForAILearning('translation', feedbackRecord.id);

      // Clear cache
      await this.clearFeedbackCache(feedback.articleId, feedback.language);

      return {
        id: feedbackRecord.id,
        message: 'Translation issue reported successfully',
        ticketNumber,
        priorityLevel,
      };
    } catch (error: any) {
      console.error('Error submitting translation feedback:', error);
      throw new Error(`Failed to submit translation feedback: ${error.message}`);
    }
  }

  /**
   * Get translation feedback statistics
   */
  async getTranslationFeedbackStats(language?: string): Promise<{
    totalIssues: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    resolvedIssues: number;
    averageResolutionTime: number;
    qualityScore: number;
  }> {
    try {
      const cacheKey = `translation_stats:${language || 'all'}`;

      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const whereClause: any = {
        feedbackType: 'TRANSLATION_ISSUE',
      };

      if (language) {
        whereClause.metadata = {
          path: ['language'],
          equals: language,
        };
      }

      const issues = await this.prisma.userFeedback.findMany({
        where: whereClause,
        select: {
          feedbackCategory: true,
          metadata: true,
          resolvedAt: true,
          createdAt: true,
        },
      });

      const totalIssues = issues.length;
      const issuesByType: Record<string, number> = {};
      const issuesBySeverity: Record<string, number> = {};
      let resolvedCount = 0;
      let totalResolutionTime = 0;

      issues.forEach((issue: any) => {
        // Count by type
        const type = issue.feedbackCategory || 'other';
        issuesByType[type] = (issuesByType[type] || 0) + 1;

        // Count by severity
        const severity = (issue.metadata as any)?.severity || 'low';
        issuesBySeverity[severity] = (issuesBySeverity[severity] || 0) + 1;

        // Calculate resolution time
        if (issue.resolvedAt) {
          resolvedCount++;
          const resolutionTime = issue.resolvedAt.getTime() - issue.createdAt.getTime();
          totalResolutionTime += resolutionTime;
        }
      });

      const averageResolutionTime = resolvedCount > 0 
        ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60)) // Convert to hours
        : 0;

      // Calculate quality score (inverse of issue rate)
      const qualityScore = totalIssues > 0 
        ? Math.max(0, 100 - (totalIssues / 10)) // Simple scoring: reduce by 1 point per issue
        : 100;

      const result = {
        totalIssues,
        issuesByType,
        issuesBySeverity,
        resolvedIssues: resolvedCount,
        averageResolutionTime,
        qualityScore: Math.round(qualityScore * 10) / 10,
      };

      // Cache result
      await this.redis.setEx(cacheKey, this.ANALYTICS_CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error: any) {
      console.error('Error getting translation feedback stats:', error);
      throw new Error(`Failed to get translation feedback stats: ${error.message}`);
    }
  }

  // ==========================================================================
  // Recommendation Feedback Methods
  // ==========================================================================

  /**
   * Submit recommendation quality feedback
   */
  async submitRecommendationFeedback(feedback: RecommendationFeedback): Promise<{
    id: string;
    message: string;
    updatedRecommendations: boolean;
  }> {
    try {
      // Validate rating
      if (feedback.rating < 1 || feedback.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Create feedback record
      const feedbackRecord = await this.prisma.userFeedback.create({
        data: {
          userId: feedback.userId,
          articleId: feedback.articleId,
          feedbackType: 'RECOMMENDATION_QUALITY',
          rating: feedback.rating,
          feedbackCategory: feedback.feedbackType,
          comment: feedback.comment,
          metadata: JSON.stringify({
            recommendationId: feedback.recommendationId,
            timestamp: feedback.timestamp.toISOString(),
          }),
        },
      });

      // Update user preferences based on feedback
      const preferencesUpdated = await this.updateUserPreferences(feedback);

      // Queue for AI learning
      await this.queueForAILearning('recommendation', feedbackRecord.id);

      // Clear recommendation cache for user
      await this.redis.del(`recommendations:${feedback.userId}`);

      return {
        id: feedbackRecord.id,
        message: 'Recommendation feedback submitted successfully',
        updatedRecommendations: preferencesUpdated,
      };
    } catch (error: any) {
      console.error('Error submitting recommendation feedback:', error);
      throw new Error(`Failed to submit recommendation feedback: ${error.message}`);
    }
  }

  /**
   * Get recommendation feedback analytics
   */
  async getRecommendationFeedbackAnalytics(userId?: string): Promise<{
    totalFeedback: number;
    averageRating: number;
    relevanceScore: number;
    feedbackByType: Record<string, number>;
    trends: {
      improving: boolean;
      changePercent: number;
    };
  }> {
    try {
      const cacheKey = `recommendation_analytics:${userId || 'all'}`;

      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const whereClause: any = {
        feedbackType: 'RECOMMENDATION_QUALITY',
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const feedback = await this.prisma.userFeedback.findMany({
        where: whereClause,
        select: {
          rating: true,
          feedbackCategory: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const totalFeedback = feedback.length;
      let totalRating = 0;
      let relevantCount = 0;
      const feedbackByType: Record<string, number> = {};

      feedback.forEach((fb: any) => {
        if (fb.rating) {
          totalRating += fb.rating;
        }

        if (fb.feedbackCategory === 'relevant' || fb.feedbackCategory === 'excellent') {
          relevantCount++;
        }

        const type = fb.feedbackCategory || 'other';
        feedbackByType[type] = (feedbackByType[type] || 0) + 1;
      });

      const averageRating = totalFeedback > 0 ? totalRating / totalFeedback : 0;
      const relevanceScore = totalFeedback > 0 ? (relevantCount / totalFeedback) * 100 : 0;

      // Calculate trend (compare last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentFeedback = feedback.filter((fb: any) => fb.createdAt >= thirtyDaysAgo);
      const previousFeedback = feedback.filter(
        (fb: any) => fb.createdAt >= sixtyDaysAgo && fb.createdAt < thirtyDaysAgo
      );

      const recentAvg = recentFeedback.reduce((sum: number, fb: any) => sum + (fb.rating || 0), 0) / recentFeedback.length || 0;
      const previousAvg = previousFeedback.reduce((sum: number, fb: any) => sum + (fb.rating || 0), 0) / previousFeedback.length || 0;

      const changePercent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

      const result = {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        relevanceScore: Math.round(relevanceScore * 10) / 10,
        feedbackByType,
        trends: {
          improving: changePercent > 0,
          changePercent: Math.round(changePercent * 10) / 10,
        },
      };

      // Cache result
      await this.redis.setEx(cacheKey, this.ANALYTICS_CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error: any) {
      console.error('Error getting recommendation feedback analytics:', error);
      throw new Error(`Failed to get recommendation feedback analytics: ${error.message}`);
    }
  }

  // ==========================================================================
  // AI Learning Integration Methods
  // ==========================================================================

  /**
   * Get AI learning data from accumulated feedback
   */
  async getAILearningData(): Promise<AILearningData> {
    try {
      const cacheKey = 'ai_learning_data';

      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get content quality insights
      const contentQualityInsights = await this.analyzeContentQuality();

      // Get translation quality insights
      const translationQualityInsights = await this.analyzeTranslationQuality();

      // Get recommendation insights
      const recommendationInsights = await this.analyzeRecommendationQuality();

      const learningData: AILearningData = {
        contentQualityInsights,
        translationQualityInsights,
        recommendationInsights,
      };

      // Cache result
      await this.redis.setEx(cacheKey, this.ANALYTICS_CACHE_TTL, JSON.stringify(learningData));

      return learningData;
    } catch (error: any) {
      console.error('Error getting AI learning data:', error);
      throw new Error(`Failed to get AI learning data: ${error.message}`);
    }
  }

  /**
   * Apply feedback to AI models
   */
  async applyFeedbackToAI(feedbackType: 'content' | 'translation' | 'recommendation'): Promise<{
    success: boolean;
    modelsUpdated: string[];
    improvementMetrics: any;
  }> {
    try {
      const learningData = await this.getAILearningData();
      const modelsUpdated: string[] = [];
      let improvementMetrics: any = {};

      switch (feedbackType) {
        case 'content':
          // Update content generation model preferences
          improvementMetrics = await this.updateContentGenerationModel(
            learningData.contentQualityInsights
          );
          modelsUpdated.push('content-generation-agent');
          break;

        case 'translation':
          // Update translation model configurations
          improvementMetrics = await this.updateTranslationModel(
            learningData.translationQualityInsights
          );
          modelsUpdated.push('translation-agent');
          break;

        case 'recommendation':
          // Update recommendation algorithm
          improvementMetrics = await this.updateRecommendationAlgorithm(
            learningData.recommendationInsights
          );
          modelsUpdated.push('recommendation-engine');
          break;
      }

      // Log the update
      await this.logAIUpdate(feedbackType, modelsUpdated, improvementMetrics);

      return {
        success: true,
        modelsUpdated,
        improvementMetrics,
      };
    } catch (error: any) {
      console.error('Error applying feedback to AI:', error);
      throw new Error(`Failed to apply feedback to AI: ${error.message}`);
    }
  }

  // ==========================================================================
  // Analytics Methods
  // ==========================================================================

  /**
   * Get comprehensive feedback analytics
   */
  async getFeedbackAnalytics(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<FeedbackAnalytics> {
    try {
      const whereClause: any = {};

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      const allFeedback = await this.prisma.userFeedback.findMany({
        where: whereClause,
        select: {
          feedbackType: true,
          feedbackCategory: true,
          rating: true,
          metadata: true,
        },
      });

      const analytics: FeedbackAnalytics = {
        totalFeedback: allFeedback.length,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        feedbackTypes: {},
        aiGeneratedFeedback: {
          total: 0,
          averageRating: 0,
        },
        translationIssues: {
          total: 0,
          byLanguage: {},
          bySeverity: {},
        },
        recommendationAccuracy: {
          totalRecommendations: 0,
          averageRating: 0,
          relevanceScore: 0,
        },
      };

      let totalRating = 0;
      let ratingCount = 0;
      let aiGeneratedRating = 0;
      let aiGeneratedCount = 0;
      let recommendationRating = 0;
      let recommendationCount = 0;
      let relevantRecommendations = 0;

      allFeedback.forEach((fb: any) => {
        // Count feedback types
        analytics.feedbackTypes[fb.feedbackType] = (analytics.feedbackTypes[fb.feedbackType] || 0) + 1;

        // Process ratings
        if (fb.rating) {
          totalRating += fb.rating;
          ratingCount++;
          analytics.ratingDistribution[fb.rating as keyof typeof analytics.ratingDistribution]++;

          // AI-generated content ratings
          if ((fb.metadata as any)?.aiGenerated) {
            aiGeneratedRating += fb.rating;
            aiGeneratedCount++;
            analytics.aiGeneratedFeedback.total++;
          }

          // Recommendation ratings
          if (fb.feedbackType === 'RECOMMENDATION_QUALITY') {
            recommendationRating += fb.rating;
            recommendationCount++;
            analytics.recommendationAccuracy.totalRecommendations++;

            if (fb.feedbackCategory === 'relevant' || fb.feedbackCategory === 'excellent') {
              relevantRecommendations++;
            }
          }
        }

        // Translation issues
        if (fb.feedbackType === 'TRANSLATION_ISSUE') {
          analytics.translationIssues.total++;

          const language = (fb.metadata as any)?.language || 'unknown';
          analytics.translationIssues.byLanguage[language] = 
            (analytics.translationIssues.byLanguage[language] || 0) + 1;

          const severity = (fb.metadata as any)?.severity || 'low';
          analytics.translationIssues.bySeverity[severity] = 
            (analytics.translationIssues.bySeverity[severity] || 0) + 1;
        }
      });

      analytics.averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;
      analytics.aiGeneratedFeedback.averageRating = aiGeneratedCount > 0 
        ? Math.round((aiGeneratedRating / aiGeneratedCount) * 10) / 10 
        : 0;
      analytics.recommendationAccuracy.averageRating = recommendationCount > 0 
        ? Math.round((recommendationRating / recommendationCount) * 10) / 10 
        : 0;
      analytics.recommendationAccuracy.relevanceScore = recommendationCount > 0 
        ? Math.round((relevantRecommendations / recommendationCount) * 100 * 10) / 10 
        : 0;

      return analytics;
    } catch (error: any) {
      console.error('Error getting feedback analytics:', error);
      throw new Error(`Failed to get feedback analytics: ${error.message}`);
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Update article rating statistics
   */
  private async updateArticleRatingStats(articleId: string): Promise<void> {
    const stats = await this.prisma.userFeedback.aggregate({
      where: {
        articleId,
        feedbackType: 'CONTENT_RATING',
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    if (stats._count > 0) {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { metadata: true },
      });
      
      const existingMetadata = article?.metadata ? JSON.parse(article.metadata) : {};
      
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          metadata: JSON.stringify({
            ...existingMetadata,
            averageRating: stats._avg.rating,
            totalRatings: stats._count,
          }),
        },
      });
    }
  }

  /**
   * Calculate feedback impact score
   */
  private async calculateFeedbackImpact(feedback: ContentFeedback): Promise<number> {
    // Factors: rating deviation, user engagement, AI vs human content
    const avgRating = await this.getAverageRating(feedback.articleId);
    const deviation = Math.abs(feedback.rating - avgRating) / 5;
    
    const userEngagement = feedback.comment ? 0.3 : 0;
    const aiContentWeight = feedback.aiGenerated ? 0.2 : 0;

    const impactScore = Math.min(1, deviation + userEngagement + aiContentWeight);
    return Math.round(impactScore * 100) / 100;
  }

  /**
   * Get average rating for article
   */
  private async getAverageRating(articleId: string): Promise<number> {
    const stats = await this.prisma.userFeedback.aggregate({
      where: {
        articleId,
        feedbackType: 'CONTENT_RATING',
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
    });

    return stats._avg.rating || 3; // Default to neutral
  }

  /**
   * Update translation quality score
   */
  private async updateTranslationQualityScore(
    translationId: string,
    severity: string
  ): Promise<void> {
    const severityImpact = {
      low: -2,
      medium: -5,
      high: -10,
      critical: -20,
    };

    const impact = severityImpact[severity as keyof typeof severityImpact] || -5;

    await this.prisma.articleTranslation.update({
      where: { id: translationId },
      data: {
        qualityScore: {
          decrement: Math.abs(impact),
        },
      },
    });
  }

  /**
   * Calculate translation issue priority
   */
  private calculateTranslationPriority(
    severity: string,
    issueType: string
  ): string {
    if (severity === 'critical' || issueType === 'offensive') {
      return 'URGENT';
    } else if (severity === 'high') {
      return 'HIGH';
    } else if (severity === 'medium') {
      return 'NORMAL';
    }
    return 'LOW';
  }

  /**
   * Queue feedback for human review
   */
  private async queueForHumanReview(feedbackId: string, priority: string): Promise<void> {
    // Create a task for human review
    await this.prisma.aITask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: 'human-review-agent',
        taskType: 'TRANSLATION_REVIEW',
        priority,
        status: 'QUEUED',
        estimatedCost: 0,
        inputData: JSON.stringify({
          feedbackId,
          reviewType: 'translation_issue',
        }),
      },
    });
  }

  /**
   * Queue feedback for AI learning
   */
  private async queueForAILearning(
    feedbackType: 'content' | 'translation' | 'recommendation',
    feedbackId: string
  ): Promise<void> {
    await this.prisma.aITask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: 'quality-review-agent',
        taskType: 'LEARNING',
        priority: 'LOW',
        status: 'QUEUED',
        estimatedCost: 0,
        inputData: JSON.stringify({
          feedbackId,
          feedbackType,
          learningPurpose: 'model_improvement',
        }),
      },
    });
  }

  /**
   * Update user preferences based on feedback
   */
  private async updateUserPreferences(feedback: RecommendationFeedback): Promise<boolean> {
    try {
      const article = await this.prisma.article.findUnique({
        where: { id: feedback.articleId },
        select: { categoryId: true, tags: true },
      });

      if (!article) return false;

      // Get current preferences
      const userPrefs = await this.prisma.userPreference.findUnique({
        where: { userId: feedback.userId },
      });

      if (!userPrefs) return false;

      const currentPrefs = userPrefs.preferences ? JSON.parse(userPrefs.preferences) : {};

      // Update category preferences
      if (article.categoryId) {
        currentPrefs.categories = currentPrefs.categories || {};
        currentPrefs.categories[article.categoryId] = currentPrefs.categories[article.categoryId] || 0;

        // Increase weight for positive feedback, decrease for negative
        const weight = feedback.rating >= 4 ? 0.1 : -0.05;
        currentPrefs.categories[article.categoryId] += weight;
      }

      // Update tag preferences
      if (article.tags && Array.isArray(article.tags)) {
        currentPrefs.tags = currentPrefs.tags || {};
        article.tags.forEach((tag: string) => {
          currentPrefs.tags[tag] = currentPrefs.tags[tag] || 0;
          const weight = feedback.rating >= 4 ? 0.1 : -0.05;
          currentPrefs.tags[tag] += weight;
        });
      }

      // Save updated preferences
      await this.prisma.userPreference.update({
        where: { userId: feedback.userId },
        data: {
          preferences: currentPrefs,
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Analyze content quality from feedback
   */
  private async analyzeContentQuality(): Promise<{
    highRatedPatterns: string[];
    lowRatedPatterns: string[];
    improvementSuggestions: string[];
  }> {
    const highRated = await this.prisma.userFeedback.findMany({
      where: {
        feedbackType: 'CONTENT_RATING',
        rating: { gte: 4 },
      },
      select: {
        feedbackCategory: true,
        comment: true,
      },
      take: 100,
    });

    const lowRated = await this.prisma.userFeedback.findMany({
      where: {
        feedbackType: 'CONTENT_RATING',
        rating: { lte: 2 },
      },
      select: {
        feedbackCategory: true,
        comment: true,
      },
      take: 100,
    });

    // Extract patterns
    const highRatedPatterns = Array.from(new Set(
      highRated.map((fb: any) => fb.feedbackCategory).filter(Boolean) as string[]
    ));

    const lowRatedPatterns = Array.from(new Set(
      lowRated.map((fb: any) => fb.feedbackCategory).filter(Boolean) as string[]
    ));

    // Generate improvement suggestions
    const improvementSuggestions = [
      lowRatedPatterns.includes('inaccurate') && 'Improve fact-checking and source verification',
      lowRatedPatterns.includes('poor_quality') && 'Enhance content generation quality thresholds',
      !highRatedPatterns.includes('well_written') && 'Focus on writing style and readability',
    ].filter(Boolean) as string[];

    return {
      highRatedPatterns,
      lowRatedPatterns,
      improvementSuggestions,
    };
  }

  /**
   * Analyze translation quality from feedback
   */
  private async analyzeTranslationQuality(): Promise<{
    commonIssues: Array<{
      language: string;
      issueType: string;
      frequency: number;
      examples: string[];
    }>;
    qualityScoreByLanguage: Record<string, number>;
  }> {
    const issues = await this.prisma.userFeedback.findMany({
      where: {
        feedbackType: 'TRANSLATION_ISSUE',
      },
      select: {
        feedbackCategory: true,
        metadata: true,
        comment: true,
      },
    });

    // Group by language and issue type
    const issueMap: Record<string, Record<string, { count: number; examples: string[] }>> = {};

    issues.forEach((issue: any) => {
      const language = (issue.metadata as any)?.language || 'unknown';
      const issueType = issue.feedbackCategory || 'other';

      if (!issueMap[language]) {
        issueMap[language] = {};
      }

      if (!issueMap[language][issueType]) {
        issueMap[language][issueType] = { count: 0, examples: [] };
      }

      issueMap[language][issueType].count++;
      if (issue.comment && issueMap[language][issueType].examples.length < 3) {
        issueMap[language][issueType].examples.push(issue.comment);
      }
    });

    // Convert to array format
    const commonIssues: Array<{
      language: string;
      issueType: string;
      frequency: number;
      examples: string[];
    }> = [];

    Object.entries(issueMap).forEach(([language, types]) => {
      Object.entries(types).forEach(([issueType, data]) => {
        commonIssues.push({
          language,
          issueType,
          frequency: data.count,
          examples: data.examples,
        });
      });
    });

    // Sort by frequency
    commonIssues.sort((a, b) => b.frequency - a.frequency);

    // Calculate quality scores by language
    const qualityScoreByLanguage: Record<string, number> = {};
    Object.keys(issueMap).forEach((language) => {
      const languageIssues = issueMap[language] || {};
      const totalIssues = Object.values(languageIssues).reduce((sum, data) => sum + data.count, 0);
      qualityScoreByLanguage[language] = Math.max(0, 100 - totalIssues * 2); // Simple scoring
    });

    return {
      commonIssues,
      qualityScoreByLanguage,
    };
  }

  /**
   * Analyze recommendation quality from feedback
   */
  private async analyzeRecommendationQuality(): Promise<{
    userPreferences: Record<string, any>;
    accuracyMetrics: {
      precision: number;
      recall: number;
      f1Score: number;
    };
    improvementAreas: string[];
  }> {
    const feedback = await this.prisma.userFeedback.findMany({
      where: {
        feedbackType: 'RECOMMENDATION_QUALITY',
      },
      select: {
        userId: true,
        rating: true,
        feedbackCategory: true,
      },
    });

    // Calculate metrics
    const relevant = feedback.filter(
      (fb: any) => fb.feedbackCategory === 'relevant' || fb.feedbackCategory === 'excellent'
    ).length;
    const total = feedback.length;

    const precision = total > 0 ? relevant / total : 0;
    const recall = precision; // Simplified (would need additional data for true recall)
    const f1Score = precision > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    // Identify improvement areas
    const improvementAreas: string[] = [];
    if (precision < 0.7) {
      improvementAreas.push('Improve recommendation relevance algorithm');
    }
    if (feedback.filter((fb: any) => fb.feedbackCategory === 'already_read').length > total * 0.2) {
      improvementAreas.push('Better tracking of read articles');
    }
    if (feedback.filter((fb: any) => fb.feedbackCategory === 'not_interested').length > total * 0.3) {
      improvementAreas.push('Enhance user preference learning');
    }

    return {
      userPreferences: {}, // Would contain aggregated user preferences
      accuracyMetrics: {
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1Score: Math.round(f1Score * 1000) / 1000,
      },
      improvementAreas,
    };
  }

  /**
   * Update content generation model with feedback
   */
  private async updateContentGenerationModel(insights: any): Promise<any> {
    // In production, this would update AI agent configurations
    return {
      patternsApplied: insights.highRatedPatterns.length,
      patternsAvoided: insights.lowRatedPatterns.length,
      qualityThresholdAdjusted: true,
    };
  }

  /**
   * Update translation model with feedback
   */
  private async updateTranslationModel(insights: any): Promise<any> {
    // In production, this would fine-tune translation models
    return {
      languagesImproved: Object.keys(insights.qualityScoreByLanguage).length,
      issuesAddressed: insights.commonIssues.length,
      modelRetrained: true,
    };
  }

  /**
   * Update recommendation algorithm with feedback
   */
  private async updateRecommendationAlgorithm(insights: any): Promise<any> {
    // In production, this would retrain recommendation models
    return {
      precisionImprovement: insights.accuracyMetrics.precision > 0.7,
      preferencesUpdated: true,
      algorithmRefined: true,
    };
  }

  /**
   * Log AI model update
   */
  private async logAIUpdate(
    feedbackType: string,
    modelsUpdated: string[],
    metrics: any
  ): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        id: `ai-update-${Date.now()}`,
        sessionId: 'ai-system',
        eventType: 'AI_MODEL_UPDATE',
        properties: JSON.stringify({ feedbackType }),
        metadata: JSON.stringify({
          feedbackType,
          modelsUpdated,
          metrics,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }

  /**
   * Clear feedback cache
   */
  private async clearFeedbackCache(articleId: string, language?: string): Promise<void> {
    const patterns = [
      `content_feedback:${articleId}*`,
      'ai_learning_data',
      'recommendation_analytics:*',
    ];

    if (language) {
      patterns.push(`translation_stats:${language}`);
    }

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Check database
      await this.prisma.$queryRaw`SELECT 1`;

      // Check Redis
      await this.redis.ping();

      // Get basic stats
      const feedbackCount = await this.prisma.userFeedback.count();

      return {
        status: 'healthy',
        details: {
          database: 'connected',
          redis: 'connected',
          totalFeedback: feedbackCount,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

export default UserFeedbackService;
