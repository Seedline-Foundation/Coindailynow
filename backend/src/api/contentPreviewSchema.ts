/**
 * Content Preview GraphQL Schema - Task 7.2
 * GraphQL types, queries, and mutations for AI-powered content preview
 */

import { gql } from 'graphql-tag';

export const contentPreviewTypeDefs = gql`
  # ==================== TYPES ====================

  """
  AI-generated article summary with key takeaways
  """
  type ArticleSummary {
    articleId: ID!
    tldr: String!
    keyTakeaways: [String!]!
    readingTimeMinutes: Int!
    generatedAt: DateTime!
    cacheExpiry: DateTime!
  }

  """
  Translation preview for an article in a specific language
  """
  type TranslationPreview {
    articleId: ID!
    languageCode: String!
    title: String!
    excerpt: String!
    content: String!
    qualityScore: Float!
    qualityIndicator: TranslationQualityIndicator!
    aiGenerated: Boolean!
    humanReviewed: Boolean!
    translationStatus: String!
    cachedAt: DateTime
  }

  """
  Quality indicator levels for translations
  """
  enum TranslationQualityIndicator {
    HIGH
    MEDIUM
    LOW
  }

  """
  Content quality indicators for an article
  """
  type ContentQualityIndicators {
    articleId: ID!
    aiConfidenceScore: Float!
    factCheckStatus: FactCheckStatus!
    humanReviewStatus: HumanReviewStatus!
    contentQualityScore: Float!
    qualityFactors: QualityFactors!
    indicators: [QualityIndicator!]!
    lastUpdated: DateTime!
  }

  """
  Quality factors breakdown
  """
  type QualityFactors {
    accuracy: Float!
    relevance: Float!
    readability: Float!
    sources: Float!
  }

  """
  Individual quality indicator
  """
  type QualityIndicator {
    type: IndicatorType!
    message: String!
    category: IndicatorCategory!
  }

  """
  Indicator types
  """
  enum IndicatorType {
    WARNING
    INFO
    SUCCESS
    ERROR
  }

  """
  Indicator categories
  """
  enum IndicatorCategory {
    AI
    FACTCHECK
    REVIEW
    QUALITY
  }

  """
  Fact-check status
  """
  enum FactCheckStatus {
    VERIFIED
    PENDING
    UNVERIFIED
    FAILED
  }

  """
  Human review status
  """
  enum HumanReviewStatus {
    APPROVED
    PENDING
    REJECTED
    NOT_REQUIRED
  }

  """
  Complete article preview data
  """
  type ArticlePreviewData {
    article: Article!
    summary: ArticleSummary!
    qualityIndicators: ContentQualityIndicators!
    availableLanguages: [String!]!
    currentTranslation: TranslationPreview
  }

  """
  Translation issue report
  """
  type TranslationIssueReport {
    articleId: ID!
    languageCode: String!
    issueType: TranslationIssueType!
    description: String!
    reportedBy: ID!
    severity: IssueSeverity!
    createdAt: DateTime!
  }

  """
  Translation issue types
  """
  enum TranslationIssueType {
    INACCURACY
    CULTURAL
    TECHNICAL
    MISSING
    OTHER
  }

  """
  Issue severity levels
  """
  enum IssueSeverity {
    LOW
    MEDIUM
    HIGH
  }

  """
  Cache warmup result
  """
  type CacheWarmupResult {
    success: Boolean!
    articlesWarmed: Int!
    failedArticles: [ID!]
    message: String!
  }

  # ==================== INPUTS ====================

  """
  Input for reporting translation issues
  """
  input TranslationIssueInput {
    articleId: ID!
    languageCode: String!
    issueType: TranslationIssueType!
    description: String!
    reportedBy: ID!
    severity: IssueSeverity!
  }

  """
  Input for batch cache warmup
  """
  input CacheWarmupInput {
    articleIds: [ID!]!
    includeTranslations: Boolean
  }

  # ==================== QUERIES ====================

  extend type Query {
    """
    Generate or retrieve cached summary for an article
    """
    getArticleSummary(articleId: ID!): ArticleSummary!

    """
    Get translation preview for an article in a specific language
    """
    getTranslationPreview(
      articleId: ID!
      languageCode: String!
    ): TranslationPreview

    """
    Get all available translations for an article
    """
    getAvailableLanguages(articleId: ID!): [String!]!

    """
    Get content quality indicators for an article
    """
    getQualityIndicators(articleId: ID!): ContentQualityIndicators!

    """
    Get complete article preview (summary + quality + translations)
    """
    getArticlePreview(
      articleId: ID!
      languageCode: String
    ): ArticlePreviewData!

    """
    Get multiple article previews in batch
    """
    getBatchArticlePreviews(
      articleIds: [ID!]!
      languageCode: String
    ): [ArticlePreviewData!]!
  }

  # ==================== MUTATIONS ====================

  extend type Mutation {
    """
    Switch article language (returns cached translation if available)
    """
    switchArticleLanguage(
      articleId: ID!
      fromLanguage: String!
      toLanguage: String!
    ): TranslationPreview

    """
    Report an issue with a translation
    """
    reportTranslationIssue(
      input: TranslationIssueInput!
    ): TranslationIssueReport!

    """
    Invalidate cache for an article (admin only)
    """
    invalidateArticleCache(articleId: ID!): Boolean!

    """
    Warm up cache for popular articles (admin only)
    """
    warmupArticleCache(input: CacheWarmupInput!): CacheWarmupResult!

    """
    Regenerate summary for an article (bypasses cache)
    """
    regenerateSummary(articleId: ID!): ArticleSummary!
  }

  # ==================== SUBSCRIPTIONS ====================

  extend type Subscription {
    """
    Subscribe to quality indicator updates for an article
    """
    qualityIndicatorsUpdated(articleId: ID!): ContentQualityIndicators!

    """
    Subscribe to new translation completions
    """
    translationCompleted(articleId: ID!): TranslationPreview!
  }

  # ==================== CUSTOM SCALARS ====================

  """
  DateTime scalar type
  """
  scalar DateTime
`;

export default contentPreviewTypeDefs;
