/**
 * Content Recommendation Resolvers - Task 17
 * GraphQL resolvers for AI-powered content recommendation system
 */

import { 
  ContentRecommendationService, 
  RecommendationRequest, 
  RecommendationResult,
  RecommendedContent 
} from '../../services/contentRecommendationService';
import { logger } from '../../utils/logger';

interface Context {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export class ContentRecommendationResolvers {
  constructor(
    private readonly recommendationService: ContentRecommendationService
  ) {}

  /**
   * Get personalized recommendations for user
   */
  async getPersonalizedRecommendations(
    request: RecommendationRequest,
    context: Context
  ): Promise<RecommendationResult> {
    try {
      // Ensure user is authenticated for personalized recommendations
      if (!context.user) {
        throw new Error('Authentication required for personalized recommendations');
      }

      const recommendations = await this.recommendationService.getRecommendations({
        ...request,
        userId: context.user.id
      });

      logger.info('Personalized recommendations generated', {
        userId: context.user.id,
        recommendationCount: recommendations.recommendations.length,
        processingTime: recommendations.metadata.processingTimeMs
      });

      return recommendations;

    } catch (error) {
      logger.error('Failed to get personalized recommendations', {
        userId: context.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trending African content
   */
  async getTrendingAfricanContent(
    limit: number = 10
  ): Promise<RecommendedContent[]> {
    try {
      const trendingContent = await this.recommendationService.getTrendingAfricanContent(limit);

      logger.info('Trending African content retrieved', {
        contentCount: trendingContent.length
      });

      return trendingContent;

    } catch (error) {
      logger.error('Failed to get trending African content', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update user behavior for real-time personalization
   */
  async recordUserBehavior(
    userId: string,
    engagement: {
      articleId: string;
      actionType: string;
      durationSeconds?: number;
      deviceType?: string;
    }
  ): Promise<boolean> {
    try {
      await this.recommendationService.updateUserBehavior(userId, engagement);

      logger.debug('User behavior recorded', { userId, engagement });

      return true;

    } catch (error) {
      logger.error('Failed to record user behavior', {
        userId,
        engagement,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get recommendation metrics
   */
  getRecommendationMetrics() {
    return this.recommendationService.getMetrics();
  }
}

// GraphQL Type Definitions
export const contentRecommendationTypeDefs = `
  # Content Recommendation Types
  type RecommendedContent {
    articleId: ID!
    title: String!
    excerpt: String!
    categoryName: String!
    tags: [String!]!
    authorName: String!
    publishedAt: DateTime!
    readingTime: Int!
    recommendationScore: Float!
    reasons: [RecommendationReason!]!
    africanRelevance: AfricanRelevance!
    marketContext: MarketContext
  }

  type RecommendationReason {
    type: RecommendationReasonType!
    description: String!
    confidence: Float!
    weight: Float!
  }

  enum RecommendationReasonType {
    BEHAVIORAL
    TRENDING
    SIMILAR_CONTENT
    AFRICAN_FOCUS
    MARKET_TREND
  }

  type AfricanRelevance {
    score: Float!
    countries: [String!]!
    exchanges: [String!]!
    culturalContext: [String!]!
  }

  type MarketContext {
    trendingTokens: [String!]!
    recentMarketEvents: [String!]!
    relevantExchanges: [String!]!
  }

  type RecommendationResult {
    recommendations: [RecommendedContent!]!
    metadata: RecommendationMetadata!
    userProfile: UserBehaviorProfile
  }

  type RecommendationMetadata {
    totalCandidates: Int!
    processingTimeMs: Int!
    diversityScore: Float!
    personalizedScore: Float!
    marketContextApplied: Boolean!
    cacheHit: Boolean!
  }

  type UserBehaviorProfile {
    userId: ID!
    preferredCategories: [String!]!
    readingPatterns: ReadingPatterns!
    topicInterests: JSON!
    africanMarketFocus: AfricanMarketFocus!
    engagementScore: Float!
    lastUpdated: DateTime!
  }

  type ReadingPatterns {
    averageReadingTime: Float!
    preferredContentLength: ContentLength!
    activeHours: [Int!]!
    devicePreference: String!
  }

  enum ContentLength {
    SHORT
    MEDIUM
    LONG
  }

  type AfricanMarketFocus {
    preferredCountries: [String!]!
    preferredExchanges: [String!]!
    mobileMoneyInterest: Boolean!
  }

  # Input Types
  input RecommendationRequest {
    contentType: String
    limit: Int
    excludeReadArticles: Boolean
    includeAfricanFocus: Boolean
    timeRange: TimeRange
    diversityLevel: DiversityLevel
    realTimeMarketContext: Boolean
  }

  enum TimeRange {
    TWENTY_FOUR_H
    SEVEN_D
    THIRTY_D
    ALL
  }

  enum DiversityLevel {
    LOW
    MEDIUM
    HIGH
  }

  input UserEngagementInput {
    articleId: ID!
    actionType: String!
    durationSeconds: Int
    deviceType: String
  }

  # Query Extensions
  extend type Query {
    # Get personalized recommendations for authenticated user
    getPersonalizedRecommendations(input: RecommendationRequest!): RecommendationResult!
    
    # Get trending African cryptocurrency content
    getTrendingAfricanContent(limit: Int): [RecommendedContent!]!
    
    # Get recommendation service metrics
    getRecommendationMetrics: JSON!
  }

  # Mutation Extensions
  extend type Mutation {
    # Record user behavior for personalization
    recordUserBehavior(input: UserEngagementInput!): Boolean!
  }
`;

// GraphQL Resolvers
export const contentRecommendationResolvers = (
  recommendationService: ContentRecommendationService
) => {
  const resolvers = new ContentRecommendationResolvers(recommendationService);

  return {
    Query: {
      getPersonalizedRecommendations: async (
        _: any,
        { input }: { input: RecommendationRequest },
        context: Context
      ) => {
        return resolvers.getPersonalizedRecommendations(input, context);
      },

      getTrendingAfricanContent: async (
        _: any,
        { limit }: { limit?: number }
      ) => {
        return resolvers.getTrendingAfricanContent(limit);
      },

      getRecommendationMetrics: async () => {
        return resolvers.getRecommendationMetrics();
      }
    },

    Mutation: {
      recordUserBehavior: async (
        _: any,
        { input }: { input: any },
        context: Context
      ) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        return resolvers.recordUserBehavior(context.user.id, input);
      }
    }
  };
};