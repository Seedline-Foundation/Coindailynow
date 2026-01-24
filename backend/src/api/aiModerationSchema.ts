import { gql } from 'apollo-server-express';

export const aiModerationTypeDefs = gql`
  # Enums
  enum ViolationType {
    RELIGIOUS_CONTENT
    HATE_SPEECH
    HARASSMENT
    SEXUAL_CONTENT
    BULLYING
    INSULTS
    SPAM
    OFF_TOPIC
    UNLISTED_TOKEN
    MISINFORMATION
    OTHER
  }

  enum PenaltyType {
    WARNING
    SHADOW_BAN
    OUTRIGHT_BAN
    OFFICIAL_BAN
  }

  enum SeverityLevel {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum ModerationStatus {
    PENDING
    PROCESSED
    CONFIRMED
    FALSE_POSITIVE
  }

  enum AlertSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  # Types
  type ModerationQueueItem {
    id: ID!
    user: User!
    contentType: String!
    contentId: String!
    content: String!
    violationType: ViolationType!
    severity: SeverityLevel!
    aiConfidence: Float!
    evidence: String!
    flaggedText: String!
    recommendedAction: PenaltyType!
    reason: String!
    priority: Int!
    status: ModerationStatus!
    createdAt: DateTime!
    processedAt: DateTime
    reviewedBy: String
    reviewedAt: DateTime
    notes: String
  }

  type UserViolation {
    id: ID!
    user: User!
    violationType: ViolationType!
    severity: SeverityLevel!
    content: String!
    contentType: String!
    contentId: String!
    detectedAt: DateTime!
    aiConfidence: Float!
    evidence: String!
    flaggedText: String!
    penaltyType: PenaltyType!
    penaltyReason: String!
    status: String!
    createdAt: DateTime!
  }

  type UserPenalty {
    id: ID!
    user: User!
    penaltyType: PenaltyType!
    reason: String!
    duration: Int
    startDate: DateTime!
    endDate: DateTime
    isActive: Boolean!
    appliedBy: String!
    appliedByUser: User
    notes: String
    createdAt: DateTime!
  }

  type AdminAlert {
    id: ID!
    type: String!
    title: String!
    message: String!
    severity: AlertSeverity!
    user: User
    contentType: String
    contentId: String
    isRead: Boolean!
    readAt: DateTime
    readBy: String
    createdAt: DateTime!
  }

  type ModerationStats {
    totalViolations: Int!
    violationsByType: [ViolationTypeCount!]!
    violationsBySeverity: [SeverityCount!]!
    pendingReviews: Int!
    falsePositiveRate: Float!
    accuracy: Float!
  }

  type ViolationTypeCount {
    violationType: ViolationType!
    count: Int!
  }

  type SeverityCount {
    severity: SeverityLevel!
    count: Int!
  }

  type ModerationSystemStatus {
    isRunning: Boolean!
    queueSize: Int!
    criticalAlerts: Int!
    lastProcessed: DateTime!
    health: String!
  }

  type ContentModerationResult {
    approved: Boolean!
    confidence: Float!
    violations: [ViolationResult!]
    penalty: PenaltyRecommendation
    requiresHumanReview: Boolean
    priorityScore: Int
  }

  type ViolationResult {
    isViolation: Boolean!
    type: ViolationType
    severity: SeverityLevel
    confidence: Float
    evidence: String
    flaggedText: String
    keywords: [String!]
  }

  type PenaltyRecommendation {
    recommendedPenalty: PenaltyType!
    duration: Int!
    reason: String!
    confidence: Float!
    requiresHumanReview: Boolean!
    escalationPath: [String!]!
  }

  # Pagination Types
  type ModerationQueueConnection {
    items: [ModerationQueueItem!]!
    total: Int!
    page: Int!
    totalPages: Int!
    hasNextPage: Boolean!
  }

  type UserViolationConnection {
    violations: [UserViolation!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type UserPenaltyConnection {
    penalties: [UserPenalty!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type AdminAlertConnection {
    alerts: [AdminAlert!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  # Input Types
  input ModerationQueueFilter {
    status: ModerationStatus
    violationType: ViolationType
    severity: SeverityLevel
    page: Int = 1
    limit: Int = 20
  }

  input ModerateContentInput {
    contentId: String!
    contentType: String!
    text: String!
    userId: String!
  }

  input AdjustPenaltyInput {
    penaltyType: PenaltyType!
    duration: Int
    reason: String!
    notes: String
  }

  input BulkModerationAction {
    queueIds: [String!]!
    action: String!
    notes: String
  }

  input ManualBanInput {
    penaltyType: PenaltyType!
    duration: Int
    reason: String!
  }

  # Queries
  extend type Query {
    # Moderation Queue
    moderationQueue(filter: ModerationQueueFilter): ModerationQueueConnection!
    moderationQueueItem(id: ID!): ModerationQueueItem
    
    # User Management
    userViolations(userId: ID!, page: Int = 1, limit: Int = 10): UserViolationConnection!
    userPenalties(userId: ID!, page: Int = 1, limit: Int = 10): UserPenaltyConnection!
    
    # Statistics & Analytics
    moderationStats(days: Int = 30): ModerationStats!
    moderationSystemStatus: ModerationSystemStatus!
    
    # Alerts
    moderationAlerts(severity: AlertSeverity, page: Int = 1, limit: Int = 10): AdminAlertConnection!
    unreadAlertsCount: Int!
  }

  # Mutations
  extend type Mutation {
    # Queue Management
    confirmViolation(queueId: ID!, notes: String): Boolean!
    markFalsePositive(queueId: ID!, notes: String!): Boolean!
    adjustPenalty(queueId: ID!, input: AdjustPenaltyInput!): Boolean!
    
    # Bulk Actions
    bulkModerationAction(input: BulkModerationAction!): BulkActionResult!
    
    # User Management
    banUser(userId: ID!, input: ManualBanInput!): Boolean!
    unbanUser(userId: ID!, reason: String): Boolean!
    
    # Content Moderation
    moderateContent(input: ModerateContentInput!): ContentModerationResult!
    
    # Alert Management
    markAlertRead(alertId: ID!): Boolean!
    markAllAlertsRead: Int!
    
    # System Control
    startModerationService: Boolean!
    stopModerationService: Boolean!
    restartModerationService: Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Real-time moderation updates
    moderationQueueUpdated: ModerationQueueItem!
    newViolationDetected: UserViolation!
    criticalAlertCreated: AdminAlert!
    
    # System status updates
    moderationSystemStatusChanged: ModerationSystemStatus!
    
    # Statistics updates
    moderationStatsUpdated: ModerationStats!
  }

  # Additional result types
  type BulkActionResult {
    processed: Int!
    errors: Int!
    details: [BulkActionDetail!]!
  }

  type BulkActionDetail {
    queueId: String!
    status: String!
    error: String
  }
`;

export default aiModerationTypeDefs;