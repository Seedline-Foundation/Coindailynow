/**
 * User Feedback GraphQL Schema
 * 
 * GraphQL type definitions for user feedback system
 * 
 * @module UserFeedbackSchema
 */

import { gql } from 'apollo-server-express';

export const userFeedbackTypeDefs = gql`
  # ============================================================================
  # Enums
  # ============================================================================

  enum FeedbackType {
    CONTENT_RATING
    TRANSLATION_ISSUE
    RECOMMENDATION_QUALITY
  }

  enum ContentFeedbackType {
    helpful
    not_helpful
    inaccurate
    well_written
    poor_quality
  }

  enum TranslationIssueType {
    inaccurate
    grammar
    context_lost
    formatting
    offensive
    other
  }

  enum TranslationSeverity {
    low
    medium
    high
    critical
  }

  enum RecommendationFeedbackType {
    relevant
    not_relevant
    already_read
    not_interested
    excellent
  }

  # ============================================================================
  # Input Types
  # ============================================================================

  input SubmitContentFeedbackInput {
    articleId: ID!
    rating: Int!
    feedbackType: ContentFeedbackType!
    comment: String
    aiGenerated: Boolean
  }

  input SubmitTranslationFeedbackInput {
    articleId: ID!
    translationId: ID!
    language: String!
    issueType: TranslationIssueType!
    originalText: String!
    suggestedText: String
    comment: String
    severity: TranslationSeverity
  }

  input SubmitRecommendationFeedbackInput {
    recommendationId: ID!
    articleId: ID!
    rating: Int!
    feedbackType: RecommendationFeedbackType!
    comment: String
  }

  input FeedbackAnalyticsInput {
    startDate: String
    endDate: String
    userId: ID
  }

  # ============================================================================
  # Object Types
  # ============================================================================

  type ContentFeedbackResult {
    id: ID!
    message: String!
    impactScore: Float!
  }

  type TranslationFeedbackResult {
    id: ID!
    message: String!
    ticketNumber: String!
    priorityLevel: String!
  }

  type RecommendationFeedbackResult {
    id: ID!
    message: String!
    updatedRecommendations: Boolean!
  }

  type ContentFeedbackStats {
    averageRating: Float!
    totalFeedback: Int!
    ratingDistribution: RatingDistribution!
    userFeedback: UserFeedback
  }

  type RatingDistribution {
    one: Int!
    two: Int!
    three: Int!
    four: Int!
    five: Int!
  }

  type TranslationFeedbackStats {
    totalIssues: Int!
    issuesByType: JSON!
    issuesBySeverity: JSON!
    resolvedIssues: Int!
    averageResolutionTime: Int!
    qualityScore: Float!
  }

  type RecommendationFeedbackAnalytics {
    totalFeedback: Int!
    averageRating: Float!
    relevanceScore: Float!
    feedbackByType: JSON!
    trends: FeedbackTrends!
  }

  type FeedbackTrends {
    improving: Boolean!
    changePercent: Float!
  }

  type FeedbackAnalytics {
    totalFeedback: Int!
    averageRating: Float!
    ratingDistribution: RatingDistribution!
    feedbackTypes: JSON!
    aiGeneratedFeedback: AIGeneratedFeedback!
    translationIssues: TranslationIssuesSummary!
    recommendationAccuracy: RecommendationAccuracy!
  }

  type AIGeneratedFeedback {
    total: Int!
    averageRating: Float!
  }

  type TranslationIssuesSummary {
    total: Int!
    byLanguage: JSON!
    bySeverity: JSON!
  }

  type RecommendationAccuracy {
    totalRecommendations: Int!
    averageRating: Float!
    relevanceScore: Float!
  }

  type AILearningData {
    contentQualityInsights: ContentQualityInsights!
    translationQualityInsights: TranslationQualityInsights!
    recommendationInsights: RecommendationInsights!
  }

  type ContentQualityInsights {
    highRatedPatterns: [String!]!
    lowRatedPatterns: [String!]!
    improvementSuggestions: [String!]!
  }

  type TranslationQualityInsights {
    commonIssues: [TranslationIssue!]!
    qualityScoreByLanguage: JSON!
  }

  type TranslationIssue {
    language: String!
    issueType: String!
    frequency: Int!
    examples: [String!]!
  }

  type RecommendationInsights {
    userPreferences: JSON!
    accuracyMetrics: AccuracyMetrics!
    improvementAreas: [String!]!
  }

  type AccuracyMetrics {
    precision: Float!
    recall: Float!
    f1Score: Float!
  }

  type AIUpdateResult {
    success: Boolean!
    modelsUpdated: [String!]!
    improvementMetrics: JSON!
  }

  type UserFeedback {
    id: ID!
    userId: ID!
    articleId: ID
    relatedId: String
    feedbackType: FeedbackType!
    feedbackCategory: String
    rating: Int
    comment: String
    metadata: JSON
    resolvedAt: String
    createdAt: String!
    updatedAt: String!
    article: Article
  }

  type UserFeedbackConnection {
    feedback: [UserFeedback!]!
    pagination: PaginationInfo!
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  # ============================================================================
  # Queries
  # ============================================================================

  type Query {
    """
    Get content feedback for an article
    """
    contentFeedback(articleId: ID!): ContentFeedbackStats!

    """
    Get translation feedback statistics
    """
    translationFeedbackStats(language: String): TranslationFeedbackStats!

    """
    Get recommendation feedback analytics
    """
    recommendationFeedbackAnalytics: RecommendationFeedbackAnalytics!

    """
    Get comprehensive feedback analytics
    """
    feedbackAnalytics(input: FeedbackAnalyticsInput): FeedbackAnalytics!

    """
    Get AI learning data (Admin only)
    """
    aiLearningData: AILearningData!

    """
    Get user's own feedback history
    """
    myFeedback(
      page: Int
      limit: Int
      feedbackType: FeedbackType
    ): UserFeedbackConnection!

    """
    Get feedback by ID
    """
    userFeedback(id: ID!): UserFeedback
  }

  # ============================================================================
  # Mutations
  # ============================================================================

  type Mutation {
    """
    Submit content rating feedback
    """
    submitContentFeedback(input: SubmitContentFeedbackInput!): ContentFeedbackResult!

    """
    Submit translation error report
    """
    submitTranslationFeedback(input: SubmitTranslationFeedbackInput!): TranslationFeedbackResult!

    """
    Submit recommendation quality feedback
    """
    submitRecommendationFeedback(input: SubmitRecommendationFeedbackInput!): RecommendationFeedbackResult!

    """
    Apply feedback to AI models (Super Admin only)
    """
    applyFeedbackToAI(feedbackType: String!): AIUpdateResult!

    """
    Resolve a feedback issue (Admin only)
    """
    resolveFeedback(feedbackId: ID!, resolution: String): UserFeedback!
  }

  # ============================================================================
  # Subscriptions
  # ============================================================================

  type Subscription {
    """
    Subscribe to new feedback submissions
    """
    feedbackSubmitted(userId: ID): UserFeedback!

    """
    Subscribe to AI model updates
    """
    aiModelUpdated: AIUpdateResult!

    """
    Subscribe to translation issue updates
    """
    translationIssueUpdated(language: String): TranslationFeedbackStats!
  }
`;

export default userFeedbackTypeDefs;
