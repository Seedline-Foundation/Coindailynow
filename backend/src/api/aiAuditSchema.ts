/**
 * AI Audit & Compliance Logging GraphQL Schema
 * 
 * Complete GraphQL schema for audit logging, decision tracking, and compliance reporting.
 * 
 * @module api/aiAuditSchema
 */

import { gql } from 'apollo-server-express';

export const aiAuditTypeDefs = gql`
  # ================================
  # TYPES
  # ================================
  
  type AIAuditLog {
    id: ID!
    operationType: String!
    operationCategory: String!
    agentType: String!
    agentId: String
    userId: String
    requestId: String!
    endpoint: String
    httpMethod: String
    inputData: JSON!
    inputHash: String!
    inputTokens: Int
    outputData: JSON
    outputHash: String
    outputTokens: Int
    modelProvider: String!
    modelName: String!
    modelVersion: String
    reasoning: String
    confidence: Float
    alternatives: [JSON]
    qualityScore: Float
    thresholds: JSON
    passed: Boolean
    dataSources: [JSON]
    citations: [JSON]
    externalAPIs: [JSON]
    humanReviewed: Boolean!
    reviewedBy: String
    reviewedAt: DateTime
    humanDecision: String
    overrideReason: String
    feedbackToAI: String
    estimatedCost: Float
    actualCost: Float
    currency: String!
    processingTimeMs: Int
    cacheHit: Boolean!
    retryCount: Int!
    status: String!
    errorMessage: String
    errorCode: String
    gdprCompliant: Boolean!
    retentionCategory: String!
    archivedAt: DateTime
    deletionScheduled: DateTime
    metadata: JSON
    tags: [String]
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User
    decisionLogs: [AIDecisionLog!]!
  }
  
  type AIDecisionLog {
    id: ID!
    auditLogId: String!
    decisionPoint: String!
    decisionType: String!
    decisionOutcome: String!
    primaryReason: String!
    contributingFactors: JSON
    confidenceScore: Float!
    alternativeOptions: [JSON]
    dataPoints: JSON
    weights: JSON
    thresholds: JSON
    rulesApplied: [JSON]
    policiesFollowed: [JSON]
    exceptions: [JSON]
    expectedImpact: String
    riskLevel: String
    biasCheck: JSON
    humanExplanation: String
    technicalDetails: String
    visualData: JSON
    requiresConsent: Boolean!
    consentObtained: Boolean
    userNotified: Boolean!
    rightToExplanation: Boolean!
    createdAt: DateTime!
    auditLog: AIAuditLog!
  }
  
  type ComplianceReport {
    id: ID!
    reportType: String!
    title: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    userId: String
    agentTypes: [String]
    operationTypes: [String]
    totalOperations: Int!
    successfulOps: Int!
    failedOps: Int!
    humanOverrides: Int!
    averageQuality: Float
    totalCost: Float
    gdprCompliant: Int!
    dataRetention: JSON!
    consentStatus: JSON
    reportData: JSON!
    summary: String
    recommendations: JSON
    format: String!
    fileUrl: String
    fileSize: Int
    downloadCount: Int!
    requestedBy: String!
    accessLevel: String!
    expiresAt: DateTime
    status: String!
    generatedAt: DateTime
    errorMessage: String
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
  }
  
  type UserConsent {
    id: ID!
    userId: String!
    consentType: String!
    purpose: String!
    scope: JSON!
    consented: Boolean!
    consentMethod: String
    consentVersion: String!
    legalBasis: String!
    rightToWithdraw: Boolean!
    rightToExplanation: Boolean!
    rightToPortability: Boolean!
    rightToErasure: Boolean!
    withdrawnAt: DateTime
    withdrawalReason: String
    dataDeleted: Boolean!
    deletedAt: DateTime
    ipAddress: String
    userAgent: String
    metadata: JSON
    givenAt: DateTime!
    expiresAt: DateTime
    updatedAt: DateTime!
    user: User!
  }
  
  type AuditStatistics {
    period: Period!
    metrics: Metrics!
    topOperations: [OperationCount!]!
    topAgents: [AgentCount!]!
  }
  
  type Period {
    days: Int!
    startDate: DateTime!
    endDate: DateTime!
  }
  
  type Metrics {
    totalOperations: Int!
    successRate: Float!
    errorRate: Float!
    averageQuality: Float!
    totalCost: Float!
    averageDuration: Float!
    humanOverrideRate: Float!
  }
  
  type OperationCount {
    type: String!
    count: Int!
  }
  
  type AgentCount {
    type: String!
    count: Int!
  }
  
  type RetentionStatistics {
    total: Int!
    byAge: AgeBreakdown!
    archived: Int!
    scheduledDeletion: Int!
  }
  
  type AgeBreakdown {
    lessThanYear: Int!
    oneToTwoYears: Int!
    moreThanTwoYears: Int!
  }
  
  type AuditLogPagination {
    logs: [AIAuditLog!]!
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }
  
  # ================================
  # INPUTS
  # ================================
  
  input AuditLogInput {
    operationType: String!
    operationCategory: String!
    agentType: String!
    agentId: String
    userId: String
    requestId: String!
    endpoint: String
    httpMethod: String
    inputData: JSON!
    inputTokens: Int
    outputData: JSON
    outputTokens: Int
    modelProvider: String!
    modelName: String!
    modelVersion: String
    reasoning: String
    confidence: Float
    alternatives: [JSON]
    qualityScore: Float
    thresholds: JSON
    passed: Boolean
    dataSources: [JSON]
    citations: [JSON]
    externalAPIs: [JSON]
    estimatedCost: Float
    actualCost: Float
    processingTimeMs: Int
    cacheHit: Boolean
    retryCount: Int
    status: String!
    errorMessage: String
    errorCode: String
    metadata: JSON
    tags: [String]
  }
  
  input DecisionLogInput {
    auditLogId: String!
    decisionPoint: String!
    decisionType: String!
    decisionOutcome: String!
    primaryReason: String!
    contributingFactors: JSON
    confidenceScore: Float!
    alternativeOptions: [JSON]
    dataPoints: JSON
    weights: JSON
    thresholds: JSON
    rulesApplied: [JSON]
    policiesFollowed: [JSON]
    exceptions: [JSON]
    expectedImpact: String
    riskLevel: String
    biasCheck: JSON
    humanExplanation: String
    technicalDetails: String
    visualData: JSON
    requiresConsent: Boolean
    consentObtained: Boolean
    userNotified: Boolean
  }
  
  input ComplianceReportInput {
    reportType: String!
    title: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    userId: String
    agentTypes: [String]
    operationTypes: [String]
    format: String
    accessLevel: String
  }
  
  input UserConsentInput {
    consentType: String!
    purpose: String!
    scope: JSON!
    consented: Boolean!
    consentMethod: String
    consentVersion: String!
    legalBasis: String!
    expiresAt: DateTime
  }
  
  input AuditQueryOptions {
    operationType: String
    operationCategory: String
    agentType: String
    userId: String
    status: String
    startDate: DateTime
    endDate: DateTime
    humanReviewed: Boolean
    limit: Int
    offset: Int
    sortBy: String
    sortOrder: String
  }
  
  # ================================
  # QUERIES
  # ================================
  
  type Query {
    """Get audit logs with filtering and pagination"""
    getAuditLogs(options: AuditQueryOptions): AuditLogPagination!
    
    """Get a specific audit log by ID"""
    getAuditLog(id: ID!): AIAuditLog!
    
    """Get decision logs for an audit log"""
    getDecisionLogs(auditLogId: ID!): [AIDecisionLog!]!
    
    """Get a specific decision log with full explanation"""
    getDecision(id: ID!): AIDecisionLog!
    
    """Get a compliance report"""
    getComplianceReport(id: ID!): ComplianceReport!
    
    """Get user consents"""
    getUserConsents(consentType: String): [UserConsent!]!
    
    """Check if user has given consent for an operation"""
    checkUserConsent(consentType: String!): Boolean!
    
    """Get audit statistics for dashboard"""
    getAuditStatistics(days: Int): AuditStatistics!
    
    """Get data retention statistics"""
    getRetentionStatistics: RetentionStatistics!
  }
  
  # ================================
  # MUTATIONS
  # ================================
  
  type Mutation {
    """Create an audit log entry"""
    createAuditLog(input: AuditLogInput!): AIAuditLog!
    
    """Create a decision log"""
    createDecisionLog(input: DecisionLogInput!): AIDecisionLog!
    
    """Record human review of an AI operation"""
    recordHumanReview(
      auditLogId: ID!
      decision: String!
      overrideReason: String
      feedbackToAI: String
    ): AIAuditLog!
    
    """Generate a compliance report"""
    generateComplianceReport(input: ComplianceReportInput!): ComplianceReport!
    
    """Record user consent"""
    recordUserConsent(input: UserConsentInput!): UserConsent!
    
    """Withdraw user consent"""
    withdrawUserConsent(
      consentId: ID!
      reason: String
      deleteData: Boolean
    ): UserConsent!
    
    """Archive old audit logs (admin only)"""
    archiveOldLogs(olderThanDays: Int): Int!
    
    """Delete expired logs (admin only)"""
    deleteExpiredLogs: Int!
  }
  
  # ================================
  # SUBSCRIPTIONS
  # ================================
  
  type Subscription {
    """Subscribe to new audit logs"""
    auditLogCreated(operationType: String): AIAuditLog!
    
    """Subscribe to human reviews"""
    humanReviewRecorded: AIAuditLog!
    
    """Subscribe to compliance report generation"""
    complianceReportGenerated: ComplianceReport!
  }
  
  # ================================
  # SCALARS
  # ================================
  
  scalar DateTime
  scalar JSON
`;

export default aiAuditTypeDefs;
