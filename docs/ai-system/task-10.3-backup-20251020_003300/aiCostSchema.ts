/**
 * AI Cost Control GraphQL Schema
 * Task 10.3 - Production-Ready Implementation
 * 
 * @module api/aiCostSchema
 */

import { gql } from 'apollo-server-express';

export const aiCostTypeDefs = gql`
  # ===================================
  # TYPES
  # ===================================
  
  type CostOverview {
    totalCost: Float!
    dailyCost: Float!
    weeklyCost: Float!
    monthlyCost: Float!
    currency: String!
    budgetStatus: BudgetStatusGroup!
    topAgents: [AgentCostSummary!]!
    topProviders: [ProviderCostSummary!]!
    trends: CostTrends!
  }
  
  type BudgetStatusGroup {
    daily: BudgetStatus
    weekly: BudgetStatus
    monthly: BudgetStatus
  }
  
  type BudgetStatus {
    limit: Float!
    spent: Float!
    remaining: Float!
    percentUsed: Float!
    isThrottled: Boolean!
    alertLevel: Int
  }
  
  type AgentCostSummary {
    agentType: String!
    totalCost: Float!
    operationCount: Int!
    averageCost: Float!
    tokenCount: Int!
  }
  
  type ProviderCostSummary {
    provider: String!
    totalCost: Float!
    operationCount: Int!
    averageCost: Float!
    tokenCount: Int!
  }
  
  type CostTrends {
    direction: TrendDirection!
    changePercent: Float!
    forecastNextPeriod: Float!
    forecastConfidence: Float!
  }
  
  enum TrendDirection {
    increasing
    decreasing
    stable
  }
  
  type CostBreakdownItem {
    key: String!
    totalCost: Float!
    totalTokens: Int!
    inputTokens: Int!
    outputTokens: Int!
    operationCount: Int!
    averageCost: Float!
    averageResponseTime: Float
  }
  
  type CostForecast {
    period: String!
    predictedCost: Float!
    confidence: Float!
    basedOnDays: Int!
    trend: TrendDirection!
    recommendations: [String!]!
  }
  
  type BudgetLimit {
    id: ID!
    scope: BudgetScope!
    scopeId: String
    dailyLimit: Float
    weeklyLimit: Float
    monthlyLimit: Float
    dailySpent: Float!
    weeklySpent: Float!
    monthlySpent: Float!
    lastDailyReset: DateTime!
    lastWeeklyReset: DateTime!
    lastMonthlyReset: DateTime!
    throttleEnabled: Boolean!
    throttleAt: Float!
    isThrottled: Boolean!
    throttledAt: DateTime
    alertEnabled: Boolean!
    alertThresholds: [Int!]!
    lastAlertSent: DateTime
    lastAlertLevel: Int
    isActive: Boolean!
    description: String
    createdBy: String
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    status: BudgetStatusGroup!
    alerts: [BudgetAlert!]!
  }
  
  enum BudgetScope {
    global
    agent_type
    user
    organization
  }
  
  type BudgetAlert {
    id: ID!
    budgetLimitId: String!
    alertType: AlertType!
    severity: AlertSeverity!
    period: Period!
    thresholdPercent: Float!
    currentSpent: Float!
    budgetLimit: Float!
    scope: BudgetScope!
    scopeId: String
    message: String!
    recommendation: String
    notificationSent: Boolean!
    sentAt: DateTime
    recipients: [String!]
    acknowledged: Boolean!
    acknowledgedBy: String
    acknowledgedAt: DateTime
    resolvedAt: DateTime
    metadata: JSON
    createdAt: DateTime!
  }
  
  enum AlertType {
    threshold_warning
    budget_exceeded
    throttling_activated
  }
  
  enum AlertSeverity {
    info
    warning
    critical
  }
  
  enum Period {
    daily
    weekly
    monthly
  }
  
  type CostReport {
    id: ID!
    reportType: ReportType!
    startDate: DateTime!
    endDate: DateTime!
    billingPeriod: String
    scope: BudgetScope!
    scopeId: String
    totalCost: Float!
    totalOperations: Int!
    averageCostPerOp: Float!
    contentGenCost: Float!
    translationCost: Float!
    moderationCost: Float!
    marketAnalysisCost: Float!
    imageGenCost: Float!
    otherCost: Float!
    openaiCost: Float!
    anthropicCost: Float!
    googleCost: Float!
    metaCost: Float!
    xaiCost: Float!
    totalTokens: Int!
    totalInputTokens: Int!
    totalOutputTokens: Int!
    avgResponseTime: Float
    successRate: Float
    retryRate: Float
    previousPeriodCost: Float
    costChange: Float
    costChangeAmount: Float
    trendDirection: TrendDirection
    forecastNextPeriod: Float
    forecastConfidence: Float
    recommendations: [String!]
    highCostOperations: [HighCostOperation!]
    budgetLimit: Float
    budgetUtilization: Float
    budgetRemaining: Float
    detailedData: JSON!
    chartData: JSON
    generatedBy: String
    generationType: String!
    format: String!
    fileUrl: String
    fileSize: Int
    status: ReportStatus!
    errorMessage: String
    generatedAt: DateTime
    createdAt: DateTime!
  }
  
  enum ReportType {
    daily
    weekly
    monthly
    quarterly
    custom
  }
  
  enum ReportStatus {
    generating
    completed
    failed
  }
  
  type HighCostOperation {
    agentType: String
    provider: String
    cost: Float!
  }
  
  type CostTrackingResponse {
    id: ID!
    tracked: Boolean!
  }
  
  type BudgetLimitResponse {
    id: ID!
    created: Boolean!
  }
  
  type BudgetAlertResponse {
    id: ID!
    acknowledged: Boolean!
  }
  
  type CostReportResponse {
    id: ID!
    generated: Boolean!
  }
  
  type OperationAllowedResponse {
    allowed: Boolean!
    message: String!
  }
  
  type CacheInvalidationResponse {
    invalidated: Boolean!
    message: String!
  }
  
  type CacheStats {
    totalKeys: Int!
    costKeys: Int!
    budgetKeys: Int!
  }
  
  type HealthCheckResponse {
    status: String!
    timestamp: DateTime!
  }
  
  # ===================================
  # INPUTS
  # ===================================
  
  input CostTrackingInput {
    operationType: OperationType!
    agentId: String
    agentType: String
    taskId: String
    workflowId: String
    provider: Provider!
    model: String!
    apiEndpoint: String
    inputTokens: Int
    outputTokens: Int
    totalTokens: Int
    responseTimeMs: Int
    retryCount: Int
    failed: Boolean
    errorCode: String
    userId: String
    organizationId: String
    requestMetadata: JSON
    responseMetadata: JSON
    tags: [String!]
  }
  
  enum OperationType {
    api_call
    agent_task
    workflow
    batch_processing
  }
  
  enum Provider {
    openai
    anthropic
    google
    meta
    xai
  }
  
  input BudgetLimitInput {
    scope: BudgetScope!
    scopeId: String
    dailyLimit: Float
    weeklyLimit: Float
    monthlyLimit: Float
    throttleEnabled: Boolean
    throttleAt: Float
    alertEnabled: Boolean
    alertThresholds: [Int!]
    description: String
  }
  
  input CostReportInput {
    reportType: ReportType!
    startDate: DateTime
    endDate: DateTime
    scope: BudgetScope
    scopeId: String
  }
  
  # ===================================
  # QUERIES
  # ===================================
  
  type Query {
    # Cost overview and analytics
    costOverview: CostOverview!
    costBreakdown(
      startDate: DateTime
      endDate: DateTime
      groupBy: GroupBy = agentType
    ): [CostBreakdownItem!]!
    costForecast(period: Period = monthly): CostForecast!
    
    # Budget management
    budgetLimit(scope: BudgetScope!, scopeId: String): BudgetLimit
    isOperationAllowed(
      agentType: String
      userId: String
      organizationId: String
    ): OperationAllowedResponse!
    
    # Budget alerts
    budgetAlerts(acknowledged: Boolean = false, limit: Int = 50): [BudgetAlert!]!
    
    # Cost reports
    costReport(id: ID!): CostReport!
    costReports(limit: Int = 20): [CostReport!]!
    
    # Cache management
    cacheStats: CacheStats!
    
    # Health check
    healthCheck: HealthCheckResponse!
  }
  
  enum GroupBy {
    agentType
    provider
    user
  }
  
  # ===================================
  # MUTATIONS
  # ===================================
  
  type Mutation {
    # Cost tracking
    trackCost(input: CostTrackingInput!): CostTrackingResponse!
    
    # Budget management
    setBudgetLimit(input: BudgetLimitInput!): BudgetLimitResponse!
    
    # Budget alerts
    acknowledgeBudgetAlert(id: ID!): BudgetAlertResponse!
    
    # Cost reports
    generateCostReport(input: CostReportInput!): CostReportResponse!
    
    # Cache management
    invalidateAllCaches: CacheInvalidationResponse!
  }
  
  # ===================================
  # SUBSCRIPTIONS
  # ===================================
  
  type Subscription {
    # Real-time budget alerts
    budgetAlertCreated: BudgetAlert!
    
    # Real-time cost updates
    costOverviewUpdated: CostOverview!
    
    # Real-time budget threshold exceeded
    budgetThresholdExceeded(scope: BudgetScope!, scopeId: String): BudgetAlert!
  }
  
  # ===================================
  # SCALARS
  # ===================================
  
  scalar DateTime
  scalar JSON
`;

export default aiCostTypeDefs;
