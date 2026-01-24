/**
 * AI Workflow GraphQL Schema
 * Type definitions for workflow management
 */

import { gql } from 'apollo-server-express';

export const workflowTypeDefs = gql`
  # ==================== ENUMS ====================
  
  enum WorkflowState {
    RESEARCH
    RESEARCH_REVIEW
    CONTENT_GENERATION
    CONTENT_REVIEW
    TRANSLATION
    TRANSLATION_REVIEW
    HUMAN_APPROVAL
    PUBLISHED
    FAILED
    PAUSED
    CANCELLED
  }

  enum WorkflowPriority {
    CRITICAL
    HIGH
    NORMAL
    LOW
  }

  enum WorkflowType {
    ARTICLE_PUBLISHING
    BREAKING_NEWS
    MARKET_ANALYSIS
    TUTORIAL
  }

  # ==================== TYPES ====================

  type ContentWorkflow {
    id: ID!
    articleId: String!
    workflowType: WorkflowType!
    currentState: WorkflowState!
    previousState: WorkflowState
    priority: WorkflowPriority!
    assignedReviewerId: String
    completionPercentage: Float!
    estimatedCompletionAt: String
    actualCompletionAt: String
    errorMessage: String
    retryCount: Int!
    maxRetries: Int!
    metadata: JSON
    createdAt: String!
    updatedAt: String!
    
    # Relations
    Article: Article
    User: User
    WorkflowStep: [WorkflowStep!]!
    WorkflowTransition: [WorkflowTransition!]!
    WorkflowNotification: [WorkflowNotification!]!
    
    # Computed fields
    qualityScores: [WorkflowQualityScore!]!
    currentStepConfig: WorkflowStepConfig!
    canAdvance: Boolean!
    canRollback: Boolean!
    canPause: Boolean!
    waitTime: Int
  }

  type WorkflowStep {
    id: ID!
    workflowId: String!
    stepName: String!
    stepOrder: Int!
    status: String!
    assigneeId: String
    estimatedDurationMs: Int
    actualDurationMs: Int
    startedAt: String
    completedAt: String
    output: JSON
    errorMessage: String
    qualityScore: Float
    humanFeedback: String
    createdAt: String!
    updatedAt: String!
    
    # Relations
    AITask: [AITask!]!
    User: User
  }

  type WorkflowTransition {
    id: ID!
    workflowId: String!
    fromState: String!
    toState: String!
    transitionType: String!
    triggeredBy: String
    triggerConditions: String
    transitionReason: String
    metadata: JSON
    createdAt: String!
  }

  type WorkflowNotification {
    id: ID!
    workflowId: String!
    recipientId: String!
    notificationType: String!
    title: String!
    message: String!
    sentAt: String
    readAt: String
    status: String!
    errorMessage: String
    metadata: JSON
    createdAt: String!
  }

  type WorkflowQualityScore {
    stage: WorkflowState!
    score: Float!
    passed: Boolean!
    metrics: JSON
    feedback: String
    reviewedBy: String
    reviewedAt: String
  }

  type WorkflowStepConfig {
    stepName: String!
    agentType: String!
    qualityThreshold: Float!
    estimatedDurationMs: Int!
    requiresHumanReview: Boolean!
    autoAdvanceOnPass: Boolean!
  }

  type WorkflowStats {
    totalWorkflows: Int!
    activeWorkflows: Int!
    completedWorkflows: Int!
    failedWorkflows: Int!
    averageCompletionTime: Float!
    successRate: Float!
    humanApprovalQueueLength: Int!
    byState: [WorkflowStateCount!]!
    byPriority: [WorkflowPriorityCount!]!
  }

  type WorkflowStateCount {
    state: WorkflowState!
    count: Int!
  }

  type WorkflowPriorityCount {
    priority: WorkflowPriority!
    count: Int!
  }

  # ==================== INPUTS ====================

  input CreateWorkflowInput {
    articleId: String!
    workflowType: WorkflowType
    priority: WorkflowPriority
    assignedReviewerId: String
    metadata: JSON
  }

  input WorkflowQualityScoreInput {
    stage: WorkflowState!
    score: Float!
    passed: Boolean!
    metrics: JSON
    feedback: String
    reviewedBy: String
  }

  input HumanReviewInput {
    workflowId: ID!
    reviewerId: ID!
    approved: Boolean!
    feedback: String
    requestedChanges: [String!]
  }

  input WorkflowFilterInput {
    currentState: WorkflowState
    priority: WorkflowPriority
    workflowType: WorkflowType
    assignedReviewerId: String
    startDate: String
    endDate: String
  }

  # ==================== QUERIES ====================

  type Query {
    """Get workflow by ID"""
    contentWorkflow(id: ID!): ContentWorkflow

    """List workflows with filters"""
    contentWorkflows(filter: WorkflowFilterInput): [ContentWorkflow!]!

    """Get human approval queue"""
    humanApprovalQueue(priority: WorkflowPriority): [ContentWorkflow!]!

    """Get workflow statistics"""
    workflowStats(
      startDate: String
      endDate: String
    ): WorkflowStats!

    """Get workflow by article ID"""
    workflowByArticleId(articleId: ID!): ContentWorkflow
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    """Create a new content workflow"""
    createContentWorkflow(input: CreateWorkflowInput!): ContentWorkflow!

    """Advance workflow to next stage"""
    advanceWorkflow(
      id: ID!
      qualityScore: WorkflowQualityScoreInput
    ): ContentWorkflow!

    """Rollback workflow to previous stage"""
    rollbackWorkflow(
      id: ID!
      reason: String
    ): ContentWorkflow!

    """Pause workflow execution"""
    pauseWorkflow(
      id: ID!
      reason: String
    ): ContentWorkflow!

    """Resume paused workflow"""
    resumeWorkflow(id: ID!): ContentWorkflow!

    """Submit workflow for human review"""
    submitForHumanReview(
      id: ID!
      reviewerId: String
    ): ContentWorkflow!

    """Process human review decision"""
    processHumanReview(input: HumanReviewInput!): ContentWorkflow!

    """Cancel workflow"""
    cancelWorkflow(
      id: ID!
      reason: String
    ): ContentWorkflow!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    """Subscribe to workflow state changes"""
    workflowStateChanged(workflowId: ID): ContentWorkflow!

    """Subscribe to human approval queue updates"""
    humanApprovalQueueUpdated: [ContentWorkflow!]!

    """Subscribe to workflow notifications"""
    workflowNotification(userId: ID!): WorkflowNotification!
  }
`;

export default workflowTypeDefs;
