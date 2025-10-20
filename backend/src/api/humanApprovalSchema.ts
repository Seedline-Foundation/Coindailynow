/**
 * Human Approval GraphQL Schema
 * Type definitions for approval workflow operations
 */

import { gql } from 'apollo-server-express';

export const humanApprovalSchema = gql`
  # ==================== ENUMS ====================

  enum ApprovalStatus {
    PENDING
    IN_REVIEW
    APPROVED
    REJECTED
    REVISION_REQUESTED
    CANCELLED
  }

  enum ApprovalPriority {
    CRITICAL
    HIGH
    MEDIUM
    LOW
  }

  enum ContentType {
    ARTICLE
    BREAKING_NEWS
    MARKET_ANALYSIS
    TUTORIAL
    TRANSLATION
  }

  enum IssueType {
    ACCURACY
    CLARITY
    STYLE
    GRAMMAR
    SEO
    OTHER
  }

  enum ChangePriority {
    MUST_FIX
    SHOULD_FIX
    NICE_TO_HAVE
  }

  # ==================== INPUT TYPES ====================

  input ApprovalQueueFiltersInput {
    status: [ApprovalStatus!]
    priority: [ApprovalPriority!]
    contentType: [ContentType!]
    assignedEditorId: ID
    languageCode: String
    dateFrom: DateTime
    dateTo: DateTime
    minConfidenceScore: Float
    maxConfidenceScore: Float
  }

  input RequestedChangeInput {
    section: String!
    issueType: IssueType!
    description: String!
    priority: ChangePriority!
    suggestion: String
  }

  input ApproveContentInput {
    workflowId: ID!
    editorId: ID!
    feedback: String
    qualityOverride: Float
  }

  input RejectContentInput {
    workflowId: ID!
    editorId: ID!
    feedback: String!
  }

  input RequestRevisionInput {
    workflowId: ID!
    editorId: ID!
    feedback: String!
    requestedChanges: [RequestedChangeInput!]!
  }

  input BatchOperationInput {
    workflowIds: [ID!]!
    operation: String!
    editorId: ID
    assignToEditorId: ID
    feedback: String
  }

  input PaginationInput {
    page: Int
    limit: Int
  }

  # ==================== OBJECT TYPES ====================

  type QualityMetrics {
    overallScore: Float!
    seoScore: Float
    readabilityScore: Float
    sentimentScore: Float
    factualityScore: Float
    translationQuality: Float
    grammarScore: Float
    originalityScore: Float
  }

  type ApprovalQueueItem {
    id: ID!
    workflowId: ID!
    articleId: ID!
    articleTitle: String!
    contentType: ContentType!
    priority: ApprovalPriority!
    status: ApprovalStatus!
    assignedEditorId: ID
    assignedEditorName: String
    aiConfidenceScore: Float!
    qualityMetrics: QualityMetrics!
    contentPreview: String!
    submittedAt: DateTime!
    reviewStartedAt: DateTime
    reviewCompletedAt: DateTime
    estimatedReviewTime: Int!
    revisionCount: Int!
    languageCode: String
  }

  type ResearchSource {
    url: String!
    title: String!
    snippet: String!
    relevanceScore: Float!
    citedInContent: Boolean!
  }

  type TranslationPreview {
    languageCode: String!
    languageName: String!
    translatedTitle: String!
    translatedExcerpt: String!
    qualityScore: Float!
    status: String!
  }

  type RevisionRecord {
    revisionNumber: Int!
    requestedBy: String!
    requestedAt: DateTime!
    feedback: String!
    requestedChanges: [String!]!
    completedAt: DateTime
    qualityImprovement: Float
  }

  type AIMetadata {
    model: String!
    tokensUsed: Int!
    generationTime: Int!
    confidence: Float!
    detectedTopics: [String!]!
    keyEntities: [String!]!
  }

  type ContentReviewDetails {
    workflow: ApprovalQueueItem!
    fullContent: String!
    formattedContent: String!
    qualityScores: QualityMetrics!
    researchSources: [ResearchSource!]
    translations: [TranslationPreview!]
    revisionHistory: [RevisionRecord!]
    aiGenerationMetadata: AIMetadata
  }

  type EditorPerformanceMetrics {
    totalReviews: Int!
    approvalRate: Float!
    averageReviewTime: Float!
    qualityScore: Float!
    revisionRate: Float!
    throughputPerDay: Float!
  }

  type EditorAssignment {
    editorId: ID!
    editorName: String!
    contentTypes: [ContentType!]!
    languages: [String!]!
    maxWorkload: Int!
    currentWorkload: Int!
    performanceMetrics: EditorPerformanceMetrics!
  }

  type ApprovalQueueConnection {
    items: [ApprovalQueueItem!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type ApprovalQueueStats {
    total: Int!
    byStatus: JSON!
    byPriority: JSON!
    byContentType: JSON!
    averageWaitTime: Float!
    averageReviewTime: Float!
    oldestPendingAge: Float!
  }

  type BatchOperationResult {
    success: Int!
    failed: Int!
    errors: [String!]!
  }

  # ==================== QUERIES ====================

  type Query {
    """
    Get approval queue with filtering and pagination
    """
    approvalQueue(
      filters: ApprovalQueueFiltersInput
      pagination: PaginationInput
    ): ApprovalQueueConnection!

    """
    Get detailed content review information
    """
    contentReviewDetails(workflowId: ID!): ContentReviewDetails!

    """
    Get available editors with workload information
    """
    availableEditors: [EditorAssignment!]!

    """
    Get editor performance metrics
    """
    editorPerformanceMetrics(editorId: ID!): EditorPerformanceMetrics!

    """
    Get approval queue statistics
    """
    approvalQueueStats: ApprovalQueueStats!
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    """
    Approve content
    """
    approveContent(input: ApproveContentInput!): SuccessResponse!

    """
    Reject content
    """
    rejectContent(input: RejectContentInput!): SuccessResponse!

    """
    Request revision for content
    """
    requestRevision(input: RequestRevisionInput!): SuccessResponse!

    """
    Assign editor to workflow
    """
    assignEditor(workflowId: ID!, editorId: ID!): SuccessResponse!

    """
    Process batch operation
    """
    processBatchOperation(input: BatchOperationInput!): BatchOperationResult!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    """
    Subscribe to approval queue updates
    """
    approvalQueueUpdated: ApprovalQueueItem!

    """
    Subscribe to content review updates
    """
    contentReviewUpdated(workflowId: ID!): ContentReviewDetails!

    """
    Subscribe to editor assignments
    """
    editorAssigned: EditorAssignment!

    """
    Subscribe to notifications
    """
    approvalNotification(editorId: ID!): ApprovalNotification!
  }

  # ==================== ADDITIONAL TYPES ====================

  type SuccessResponse {
    success: Boolean!
    message: String!
    timestamp: DateTime!
  }

  type ApprovalNotification {
    workflowId: ID!
    type: String!
    message: String!
    timestamp: DateTime!
  }

  scalar DateTime
  scalar JSON
`;
