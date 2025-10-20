import { gql } from 'apollo-server-express';

export const moderationTypeDefs = gql`
  # Enums
  enum ViolationType {
    TOXICITY
    RELIGIOUS_CONTENT
    HATE_SPEECH
    HARASSMENT
    SEXUAL_CONTENT
    SPAM
    PROFANITY
    THREATS
    SELF_HARM
    PRIVACY_VIOLATION
    IMPERSONATION
    COPYRIGHT_VIOLATION
    MISINFORMATION
    CLICKBAIT
  }

  enum SeverityLevel {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum ViolationStatus {
    PENDING
    CONFIRMED
    FALSE_POSITIVE
    APPEALED
  }

  enum PenaltyType {
    WARNING
    SHADOW_BAN
    OUTRIGHT_BAN
    OFFICIAL_BAN
  }

  enum PenaltyStatus {
    ACTIVE
    EXPIRED
    REVOKED
  }

  # Types
  type ViolationReport {
    id: ID!
    contentId: String!
    contentType: String!
    content: String!
    violationType: ViolationType!
    severity: SeverityLevel!
    status: ViolationStatus!
    confidence: Float!
    aiPrediction: JSON
    humanReview: Boolean!
    adminNotes: String
    userId: ID!
    user: User!
    penalties: [UserPenalty!]!
    falsePositives: [FalsePositive!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    reviewedAt: DateTime
    reviewedBy: ID
    reviewer: User
  }

  type UserPenalty {
    id: ID!
    userId: ID!
    user: User!
    penaltyType: PenaltyType!
    reason: String!
    status: PenaltyStatus!
    isActive: Boolean!
    expiresAt: DateTime
    appliedBy: ID!
    appliedByUser: User!
    violationId: ID
    violation: ViolationReport
    notes: String
    appealable: Boolean!
    createdAt: DateTime!
    revokedAt: DateTime
    revokedBy: ID
  }

  type UserReputation {
    id: ID!
    userId: ID!
    user: User!
    score: Int!
    totalViolations: Int!
    confirmedViolations: Int!
    falsePositives: Int!
    shadowBanCount: Int!
    outrightBanCount: Int!
    officialBanCount: Int!
    lastViolation: DateTime
    trustLevel: String!
    riskLevel: String!
    updatedAt: DateTime!
  }

  type FalsePositive {
    id: ID!
    violationId: ID!
    violation: ViolationReport!
    reportedBy: ID!
    reportedByUser: User!
    reason: String!
    notes: String
    impact: String
    createdAt: DateTime!
  }

  type ModerationSettings {
    id: ID!
    toxicityThreshold: Float!
    religiousContentThreshold: Float!
    hateSpeechThreshold: Float!
    harassmentThreshold: Float!
    sexualContentThreshold: Float!
    spamThreshold: Float!
    autoShadowBanEnabled: Boolean!
    autoOutrightBanEnabled: Boolean!
    autoOfficialBanEnabled: Boolean!
    level1Threshold: Int!
    level2Threshold: Int!
    level3Threshold: Int!
    shadowBanDuration: Int!
    outrightBanDuration: Int!
    officialBanDuration: Int
    backgroundMonitoringEnabled: Boolean!
    realTimeAlertsEnabled: Boolean!
    monitoringInterval: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ModerationAlert {
    id: ID!
    type: String!
    severity: SeverityLevel!
    message: String!
    data: JSON
    isRead: Boolean!
    userId: ID
    user: User
    violationId: ID
    violation: ViolationReport
    createdAt: DateTime!
    readAt: DateTime
  }

  type ModerationMetrics {
    totalViolations: Int!
    pendingReviews: Int!
    confirmedViolations: Int!
    falsePositives: Int!
    activeUsers: Int!
    bannedUsers: Int!
    violationsByType: [ViolationTypeCount!]!
    violationsBySeverity: [SeverityCount!]!
    penaltiesApplied: Int!
    averageResponseTime: Float!
    falsePositiveRate: Float!
    automationAccuracy: Float!
    recentTrends: ModerationTrends!
  }

  type ViolationTypeCount {
    type: ViolationType!
    count: Int!
  }

  type SeverityCount {
    severity: SeverityLevel!
    count: Int!
  }

  type ModerationTrends {
    daily: [DailyCount!]!
    weekly: [WeeklyCount!]!
    monthly: [MonthlyCount!]!
  }

  type DailyCount {
    date: Date!
    violations: Int!
    confirmed: Int!
    falsePositives: Int!
  }

  type WeeklyCount {
    week: String!
    violations: Int!
    confirmed: Int!
    falsePositives: Int!
  }

  type MonthlyCount {
    month: String!
    violations: Int!
    confirmed: Int!
    falsePositives: Int!
  }

  type ContentModerationResult {
    isViolation: Boolean!
    violations: [DetectedViolation!]!
    shouldBlock: Boolean!
    recommendedAction: String!
    confidence: Float!
    priority: Int!
  }

  type DetectedViolation {
    type: ViolationType!
    severity: SeverityLevel!
    confidence: Float!
    reason: String!
    context: String
  }

  type ModerationQueueItem {
    id: ID!
    violation: ViolationReport!
    priority: Int!
    timeInQueue: Int!
    userContext: UserContext!
  }

  type UserContext {
    user: User!
    reputation: UserReputation
    recentViolations: [ViolationReport!]!
    activePenalties: [UserPenalty!]!
    riskLevel: String!
    trustLevel: String!
  }

  # Input Types
  input ModerationQueueFilters {
    status: ViolationStatus
    violationType: ViolationType
    severity: SeverityLevel
    userId: ID
    dateFrom: DateTime
    dateTo: DateTime
    humanReview: Boolean
    page: Int = 1
    limit: Int = 20
  }

  input ContentModerationInput {
    content: String!
    contentType: String!
    contentId: String!
    userId: ID!
    context: String
  }

  input ViolationReviewInput {
    violationId: ID!
    action: String!
    notes: String
    customPenalty: PenaltyInput
  }

  input PenaltyInput {
    type: PenaltyType!
    duration: Int
    reason: String!
    appealable: Boolean = true
  }

  input FalsePositiveInput {
    violationId: ID!
    reason: String!
    notes: String
    impact: String
  }

  input ModerationSettingsInput {
    toxicityThreshold: Float
    religiousContentThreshold: Float
    hateSpeechThreshold: Float
    harassmentThreshold: Float
    sexualContentThreshold: Float
    spamThreshold: Float
    autoShadowBanEnabled: Boolean
    autoOutrightBanEnabled: Boolean
    autoOfficialBanEnabled: Boolean
    level1Threshold: Int
    level2Threshold: Int
    level3Threshold: Int
    shadowBanDuration: Int
    outrightBanDuration: Int
    officialBanDuration: Int
    backgroundMonitoringEnabled: Boolean
    realTimeAlertsEnabled: Boolean
    monitoringInterval: Int
  }

  input BulkModerationAction {
    violationIds: [ID!]!
    action: String!
    reason: String!
    notes: String
  }

  # Queries
  extend type Query {
    # Moderation Queue
    getModerationQueue(filters: ModerationQueueFilters): [ModerationQueueItem!]!
    getViolation(id: ID!): ViolationReport
    getModerationMetrics(timeframe: String = "7d"): ModerationMetrics!
    getModerationAlerts(page: Int = 1, limit: Int = 20): [ModerationAlert!]!
    
    # User Management
    getUserViolations(userId: ID!, page: Int = 1, limit: Int = 20): [ViolationReport!]!
    getUserPenalties(userId: ID!, status: PenaltyStatus): [UserPenalty!]!
    getUserReputation(userId: ID!): UserReputation
    
    # Settings & Configuration
    getModerationSettings: ModerationSettings!
    getSystemHealth: JSON!
    
    # Content Moderation
    moderateContent(input: ContentModerationInput!): ContentModerationResult!
    
    # Analytics
    getModerationTrends(timeframe: String = "30d"): ModerationTrends!
    getViolationAnalytics(type: ViolationType, severity: SeverityLevel): JSON!
  }

  # Mutations
  extend type Mutation {
    # Violation Review
    confirmViolation(input: ViolationReviewInput!): ViolationReport!
    markFalsePositive(input: FalsePositiveInput!): FalsePositive!
    appealViolation(violationId: ID!, reason: String!): ViolationReport!
    
    # Penalty Management
    applyPenalty(userId: ID!, penalty: PenaltyInput!): UserPenalty!
    revokePenalty(penaltyId: ID!, reason: String!): UserPenalty!
    adjustPenalty(penaltyId: ID!, penalty: PenaltyInput!): UserPenalty!
    
    # User Management
    banUser(userId: ID!, penalty: PenaltyInput!): UserPenalty!
    unbanUser(userId: ID!, reason: String!): UserPenalty!
    updateUserReputation(userId: ID!, score: Int!): UserReputation!
    
    # Settings
    updateModerationSettings(input: ModerationSettingsInput!): ModerationSettings!
    
    # Bulk Actions
    performBulkAction(action: BulkModerationAction!): [ViolationReport!]!
    
    # Alerts
    markAlertRead(alertId: ID!): ModerationAlert!
    markAllAlertsRead: Boolean!
    
    # System
    clearModerationCache: Boolean!
    triggerSystemHealthCheck: JSON!
  }

  # Subscriptions
  extend type Subscription {
    # Real-time Moderation Updates
    violationDetected: ViolationReport!
    moderationAlert: ModerationAlert!
    queueUpdated: ModerationQueueItem!
    
    # User Activity
    userPenaltyApplied(userId: ID!): UserPenalty!
    userReputationChanged(userId: ID!): UserReputation!
    
    # System Events
    systemHealthChanged: JSON!
    settingsUpdated: ModerationSettings!
    
    # Analytics Updates
    metricsUpdated: ModerationMetrics!
  }
`;

export default moderationTypeDefs;