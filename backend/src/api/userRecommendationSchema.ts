/**
 * User Recommendations GraphQL Schema
 */

import { gql } from 'apollo-server-express';

export const userRecommendationSchema = gql`
  # Enums
  enum DifficultyLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }

  enum NotificationFrequency {
    REAL_TIME
    HOURLY
    DAILY
    WEEKLY
  }

  enum AlertType {
    SURGE
    DROP
    WHALE_ACTIVITY
    NEW_LISTING
  }

  enum InsightType {
    PORTFOLIO
    MARKET_TREND
    SENTIMENT
    PREDICTION
  }

  # User Preferences
  type UserPreferences {
    userId: ID!
    favoriteCategories: [String!]!
    favoriteTopics: [String!]!
    languagePreferences: [String!]!
    contentDifficulty: DifficultyLevel!
    notificationFrequency: NotificationFrequency!
    enableMemecoinAlerts: Boolean!
    enableMarketInsights: Boolean!
    portfolioSymbols: [String!]!
    excludedTopics: [String!]!
    createdAt: DateTime
    updatedAt: DateTime
  }

  input UserPreferencesInput {
    favoriteCategories: [String!]
    favoriteTopics: [String!]
    languagePreferences: [String!]
    contentDifficulty: DifficultyLevel
    notificationFrequency: NotificationFrequency
    enableMemecoinAlerts: Boolean
    enableMarketInsights: Boolean
    portfolioSymbols: [String!]
    excludedTopics: [String!]
  }

  # Content Recommendation
  type ContentRecommendation {
    articleId: ID!
    title: String!
    excerpt: String!
    category: String!
    topics: [String!]!
    relevanceScore: Float!
    reason: String!
    imageUrl: String
    publishedAt: DateTime!
    readingTime: Int!
    difficulty: DifficultyLevel
  }

  # Memecoin Alert
  type MemecoinAlert {
    symbol: String!
    name: String!
    alertType: AlertType!
    relevanceScore: Float!
    priceChange24h: Float!
    volume24h: Float!
    message: String!
    timestamp: DateTime!
  }

  # Market Insight
  type MarketInsight {
    insightId: ID!
    type: InsightType!
    title: String!
    description: String!
    relevanceScore: Float!
    relatedSymbols: [String!]!
    actionable: Boolean!
    confidence: Float!
    timestamp: DateTime!
  }

  # Recommendation Response
  type RecommendationResponse {
    recommendations: [ContentRecommendation!]!
    memecoinAlerts: [MemecoinAlert!]!
    marketInsights: [MarketInsight!]!
    userPreferences: UserPreferences!
    lastUpdated: DateTime!
    cacheHit: Boolean!
  }

  # Reading History Entry
  type ReadingHistoryEntry {
    articleId: ID!
    userId: ID!
    readAt: DateTime!
    readDuration: Int!
    completed: Boolean!
    category: String!
    topics: [String!]!
  }

  input TrackReadInput {
    articleId: ID!
    readDuration: Int!
    completed: Boolean!
  }

  # Behavior Analysis
  type ContentAffinityScore {
    category: String!
    score: Float!
    readCount: Int!
    avgReadDuration: Float!
    completionRate: Float!
  }

  type BehaviorAnalysis {
    userId: ID!
    totalArticlesRead: Int!
    avgReadingTime: Float!
    categoryAffinities: [ContentAffinityScore!]!
    topicAffinities: [TopicAffinity!]!
    preferredDifficulty: DifficultyLevel!
    activeHours: [Int!]!
    lastActive: DateTime!
  }

  type TopicAffinity {
    topic: String!
    score: Float!
  }

  # Health Check
  type RecommendationHealthCheck {
    status: String!
    redis: Boolean!
    database: Boolean!
    timestamp: DateTime!
  }

  # Queries
  extend type Query {
    """
    Get personalized content recommendations for the current user
    """
    userRecommendations(limit: Int): RecommendationResponse!

    """
    Get AI-powered market insights for the current user
    """
    userAIInsights: [MarketInsight!]!

    """
    Get memecoin alerts for the current user
    """
    userMemecoinAlerts: [MemecoinAlert!]!

    """
    Get user AI preferences
    """
    userPreferences: UserPreferences!

    """
    Get user behavior analysis
    """
    userBehaviorAnalysis: BehaviorAnalysis!

    """
    Health check for recommendation service
    """
    recommendationHealthCheck: RecommendationHealthCheck!
  }

  # Mutations
  extend type Mutation {
    """
    Update user AI preferences
    """
    updateUserPreferences(input: UserPreferencesInput!): UserPreferences!

    """
    Track article read event for improving recommendations
    """
    trackArticleRead(input: TrackReadInput!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    """
    Subscribe to new recommendations updates
    """
    recommendationsUpdated(userId: ID!): RecommendationResponse!

    """
    Subscribe to new memecoin alerts
    """
    newMemecoinAlert(userId: ID!): MemecoinAlert!

    """
    Subscribe to new market insights
    """
    newMarketInsight(userId: ID!): MarketInsight!
  }

  # Custom scalar for DateTime
  scalar DateTime
`;

export default userRecommendationSchema;
