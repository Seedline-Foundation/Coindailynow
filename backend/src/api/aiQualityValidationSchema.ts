/**
 * AI Quality Validation GraphQL Schema
 */

import { gql } from 'apollo-server-express';

export const aiQualityValidationTypeDefs = gql`
  # ============================================================================
  # TYPES
  # ============================================================================

  """Content quality metrics for an article"""
  type ContentQualityMetrics {
    overallScore: Float!
    seoScore: Float!
    translationAccuracy: Float!
    factCheckAccuracy: Float!
    grammarScore: Float!
    readabilityScore: Float!
    keywordRelevance: Float!
    metadataCompleteness: Float!
  }

  """Agent performance metrics"""
  type AgentPerformanceMetrics {
    agentType: String!
    successRate: Float!
    avgResponseTime: Float!
    taskCount: Int!
    successCount: Int!
    failureCount: Int!
    avgQualityScore: Float!
    avgCost: Float!
    costPerSuccess: Float!
    efficiency: Float!
  }

  """Human review accuracy metrics"""
  type HumanReviewMetrics {
    totalReviews: Int!
    approvedCount: Int!
    rejectedCount: Int!
    overrideCount: Int!
    overrideRate: Float!
    falsePositiveCount: Int!
    falseNegativeCount: Int!
    falsePositiveRate: Float!
    falseNegativeRate: Float!
    avgReviewTime: Float!
    agreementRate: Float!
  }

  """Quality validation report summary"""
  type QualityValidationSummary {
    meetsStandards: Boolean!
    issues: [String!]!
    recommendations: [String!]!
  }

  """Date period for reports"""
  type DatePeriod {
    start: String!
    end: String!
  }

  """Quality validation report"""
  type QualityValidationReport {
    id: ID!
    reportType: ReportType!
    period: DatePeriod!
    contentMetrics: ContentQualityMetrics
    agentMetrics: [AgentPerformanceMetrics!]
    humanReviewMetrics: HumanReviewMetrics
    summary: QualityValidationSummary!
    createdAt: String!
  }

  """Quality trends over time"""
  type QualityTrends {
    dates: [String!]!
    contentQuality: [Float!]!
    agentSuccessRate: [Float!]!
    humanAgreementRate: [Float!]!
  }

  """Cache statistics"""
  type QualityCacheStats {
    totalKeys: Int!
    contentKeys: Int!
    agentKeys: Int!
    humanKeys: Int!
    reportKeys: Int!
    trendKeys: Int!
  }

  """Health check details"""
  type HealthDetails {
    redis: String
    database: String
    error: String
    timestamp: String!
  }

  """Health check result"""
  type HealthCheckResult {
    status: HealthStatus!
    details: HealthDetails!
  }

  # ============================================================================
  # ENUMS
  # ============================================================================

  """Report type"""
  enum ReportType {
    CONTENT
    AGENT
    HUMAN_REVIEW
    COMPREHENSIVE
  }

  """Health status"""
  enum HealthStatus {
    OK
    DEGRADED
    ERROR
  }

  """Cache type"""
  enum CacheType {
    CONTENT
    AGENT
    HUMAN
    ALL
  }

  # ============================================================================
  # INPUTS
  # ============================================================================

  """Date period input"""
  input DatePeriodInput {
    start: String!
    end: String!
  }

  """Quality thresholds input"""
  input QualityThresholdsInput {
    contentQualityScore: Float
    translationAccuracy: Float
    factCheckAccuracy: Float
    agentSuccessRate: Float
    humanOverrideRate: Float
    falsePositiveRate: Float
  }

  """Generate report input"""
  input GenerateReportInput {
    reportType: ReportType!
    period: DatePeriodInput
    articleIds: [ID!]
    agentTypes: [String!]
    thresholds: QualityThresholdsInput
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  type Query {
    """Get content quality metrics for an article"""
    contentQuality(articleId: ID!, skipCache: Boolean): ContentQualityMetrics!

    """Get content quality metrics for multiple articles"""
    contentQualityBatch(articleIds: [ID!]!, skipCache: Boolean): [ContentQualityMetrics!]!

    """Get agent performance metrics"""
    agentPerformance(
      agentType: String
      period: DatePeriodInput
      skipCache: Boolean
    ): [AgentPerformanceMetrics!]!

    """Get human review accuracy metrics"""
    humanReviewAccuracy(
      period: DatePeriodInput
      skipCache: Boolean
    ): HumanReviewMetrics!

    """Get a specific quality validation report"""
    qualityReport(reportId: ID!): QualityValidationReport

    """Get quality trends over time"""
    qualityTrends(days: Int, skipCache: Boolean): QualityTrends!

    """Get cache statistics"""
    qualityCacheStats: QualityCacheStats!

    """Health check"""
    qualityHealth: HealthCheckResult!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  type Mutation {
    """Generate a quality validation report"""
    generateQualityReport(input: GenerateReportInput!): QualityValidationReport!

    """Invalidate quality validation cache"""
    invalidateQualityCache(type: CacheType): Boolean!
  }

  # ============================================================================
  # SUBSCRIPTIONS
  # ============================================================================

  type Subscription {
    """Subscribe to quality validation updates"""
    qualityUpdate(articleId: ID): ContentQualityMetrics!

    """Subscribe to agent performance updates"""
    agentPerformanceUpdate(agentType: String): AgentPerformanceMetrics!

    """Subscribe to human review updates"""
    humanReviewUpdate: HumanReviewMetrics!
  }
`;

export default aiQualityValidationTypeDefs;
