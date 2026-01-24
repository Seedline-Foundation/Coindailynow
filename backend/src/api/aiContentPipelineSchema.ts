/**
 * AI Content Pipeline GraphQL Schema
 * 
 * Type definitions for automated content pipeline.
 */

import { gql } from 'apollo-server-express';

export const aiContentPipelineTypeDefs = gql`
  # ============================================================================
  # TYPES
  # ============================================================================

  """
  Trending topic for automated article creation
  """
  type TrendingTopic {
    keyword: String!
    volume: Float!
    sentiment: SentimentType!
    urgency: UrgencyLevel!
    sources: [String!]!
    relatedTokens: [String!]!
    timestamp: DateTime!
  }

  """
  Pipeline configuration
  """
  type PipelineConfig {
    autoPublishThreshold: Float!
    breakingNewsTimeout: Int!
    translationTimeout: Int!
    imageGenerationTimeout: Int!
    targetLanguages: [String!]!
    enableAutoPublish: Boolean!
    enableTranslationAutomation: Boolean!
    enableImageGeneration: Boolean!
    enableSEOOptimization: Boolean!
    maxConcurrentPipelines: Int!
  }

  """
  Pipeline stage information
  """
  type PipelineStage {
    name: String!
    status: StageStatus!
    startedAt: DateTime
    completedAt: DateTime
    duration: Int
    output: JSON
    error: String
  }

  """
  Pipeline status
  """
  type PipelineStatus {
    pipelineId: ID!
    articleId: ID
    status: PipelineStatusType!
    currentStage: String!
    progress: Int!
    qualityScore: Float
    startedAt: DateTime!
    estimatedCompletion: DateTime
    completedAt: DateTime
    errors: [String!]!
    stages: [PipelineStage!]!
  }

  """
  Pipeline metrics
  """
  type PipelineMetrics {
    totalPipelines: Int!
    activePipelines: Int!
    completedPipelines: Int!
    failedPipelines: Int!
    averageCompletionTime: Float!
    breakingNewsAverageTime: Float!
    translationAverageTime: Float!
    imageGenerationAverageTime: Float!
    autoPublishRate: Float!
    qualityScoreAverage: Float!
  }

  """
  Batch operation result
  """
  type BatchOperationResult {
    total: Int!
    successful: Int!
    failed: Int!
    pipelines: [PipelineStatus!]!
  }

  # ============================================================================
  # ENUMS
  # ============================================================================

  enum SentimentType {
    bullish
    bearish
    neutral
  }

  enum UrgencyLevel {
    breaking
    high
    medium
    low
  }

  enum StageStatus {
    pending
    in_progress
    completed
    failed
    skipped
  }

  enum PipelineStatusType {
    initiated
    researching
    reviewing
    generating
    translating
    generating_images
    optimizing_seo
    publishing
    completed
    failed
  }

  # ============================================================================
  # INPUTS
  # ============================================================================

  """
  Article generation request
  """
  input ArticleGenerationInput {
    topic: String!
    urgency: UrgencyLevel!
    targetLanguages: [String!]
    generateImages: Boolean
    autoPublish: Boolean
    qualityThreshold: Float
  }

  """
  Pipeline configuration update
  """
  input PipelineConfigInput {
    autoPublishThreshold: Float
    breakingNewsTimeout: Int
    translationTimeout: Int
    imageGenerationTimeout: Int
    targetLanguages: [String!]
    enableAutoPublish: Boolean
    enableTranslationAutomation: Boolean
    enableImageGeneration: Boolean
    enableSEOOptimization: Boolean
    maxConcurrentPipelines: Int
  }

  """
  Batch initiate input
  """
  input BatchInitiateInput {
    topics: [String!]!
    urgency: UrgencyLevel!
    autoPublish: Boolean
  }

  """
  Auto-discover input
  """
  input AutoDiscoverInput {
    maxTopics: Int
    urgencyFilter: [UrgencyLevel!]
    autoPublish: Boolean
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  extend type Query {
    """
    Get current pipeline configuration
    """
    pipelineConfig: PipelineConfig!

    """
    Get trending topics for automated article creation
    """
    trendingTopics: [TrendingTopic!]!

    """
    Get pipeline status by ID
    """
    pipelineStatus(pipelineId: ID!): PipelineStatus

    """
    Get all active pipelines
    """
    activePipelines: [PipelineStatus!]!

    """
    Get pipeline metrics
    """
    pipelineMetrics: PipelineMetrics!

    """
    Health check for pipeline system
    """
    pipelineHealth: HealthStatus!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  extend type Mutation {
    """
    Update pipeline configuration (Admin only)
    """
    updatePipelineConfig(input: PipelineConfigInput!): PipelineConfig!

    """
    Initiate automated article generation pipeline
    """
    initiateArticlePipeline(input: ArticleGenerationInput!): PipelineStatus!

    """
    Cancel a running pipeline
    """
    cancelPipeline(pipelineId: ID!): StandardResponse!

    """
    Retry a failed pipeline
    """
    retryPipeline(pipelineId: ID!): PipelineStatus!

    """
    Batch initiate pipelines from topics
    """
    batchInitiatePipelines(input: BatchInitiateInput!): BatchOperationResult!

    """
    Batch cancel pipelines
    """
    batchCancelPipelines(pipelineIds: [ID!]!): StandardResponse!

    """
    Auto-discover trending topics and initiate pipelines (Admin only)
    """
    autoDiscoverAndInitiate(input: AutoDiscoverInput!): BatchOperationResult!
  }

  # ============================================================================
  # SUBSCRIPTIONS
  # ============================================================================

  extend type Subscription {
    """
    Subscribe to pipeline status updates
    """
    pipelineStatusUpdated(pipelineId: ID!): PipelineStatus!

    """
    Subscribe to all pipeline updates
    """
    pipelinesUpdated: PipelineStatus!

    """
    Subscribe to trending topics updates
    """
    trendingTopicsUpdated: [TrendingTopic!]!

    """
    Subscribe to pipeline metrics updates
    """
    pipelineMetricsUpdated: PipelineMetrics!
  }

  # ============================================================================
  # SHARED TYPES
  # ============================================================================

  scalar DateTime
  scalar JSON

  type StandardResponse {
    success: Boolean!
    message: String!
  }

  type HealthStatus {
    status: String!
    details: JSON!
  }
`;

export default aiContentPipelineTypeDefs;
