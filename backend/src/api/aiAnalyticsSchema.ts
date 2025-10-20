/**
 * AI Analytics GraphQL Schema
 * 
 * GraphQL type definitions for AI performance analytics and monitoring
 */

import { gql } from 'apollo-server-express';

export const aiAnalyticsSchema = gql`
  # ==================== TYPES ====================

  type SystemOverview {
    timestamp: DateTime!
    totalAgents: Int!
    activeAgents: Int!
    inactiveAgents: Int!
    totalTasks: Int!
    queuedTasks: Int!
    processingTasks: Int!
    completedTasks: Int!
    failedTasks: Int!
    cancelledTasks: Int!
    overallSuccessRate: Float!
    averageResponseTime: Float!
    totalCost: Float!
    costToday: Float!
    costThisWeek: Float!
    costThisMonth: Float!
    cacheHitRate: Float!
    systemHealth: SystemHealth!
    alerts: [Alert!]!
  }

  enum SystemHealth {
    healthy
    warning
    critical
  }

  type AgentAnalytics {
    agentId: ID!
    agentName: String!
    agentType: String!
    isActive: Boolean!
    performance: PerformanceMetrics!
    costs: CostMetrics!
    quality: QualityMetrics!
    errors: ErrorMetrics!
    capacity: CapacityMetrics!
    trends: AgentTrends!
  }

  type PerformanceMetrics {
    totalTasks: Int!
    successfulTasks: Int!
    failedTasks: Int!
    cancelledTasks: Int!
    successRate: Float!
    averageResponseTime: Float!
    medianResponseTime: Float!
    p95ResponseTime: Float!
    p99ResponseTime: Float!
    tasksPerHour: Float!
    currentLoad: Int!
  }

  type CostMetrics {
    totalCost: Float!
    averageCostPerTask: Float!
    costToday: Float!
    costThisWeek: Float!
    costThisMonth: Float!
    estimatedMonthlyBurn: Float!
  }

  type QualityMetrics {
    averageQualityScore: Float!
    qualityTrend: QualityTrend!
    lowQualityTaskCount: Int!
  }

  enum QualityTrend {
    improving
    stable
    declining
  }

  type ErrorMetrics {
    errorRate: Float!
    commonErrors: [CommonError!]!
    lastError: LastError
  }

  type CommonError {
    error: String!
    count: Int!
  }

  type LastError {
    message: String!
    timestamp: DateTime!
  }

  type CapacityMetrics {
    utilizationRate: Float!
    averageQueueWait: Float!
    peakLoad: Int!
    bottleneck: Boolean!
  }

  type AgentTrends {
    hourly: [MetricPoint!]!
    daily: [MetricPoint!]!
    weekly: [MetricPoint!]!
  }

  type MetricPoint {
    timestamp: DateTime!
    value: Float!
    label: String
  }

  type CostBreakdown {
    timestamp: DateTime!
    totalCost: Float!
    costToday: Float!
    costYesterday: Float!
    costThisWeek: Float!
    costLastWeek: Float!
    costThisMonth: Float!
    costLastMonth: Float!
    byAgent: [AgentCostBreakdown!]!
    byTaskType: [TaskTypeCostBreakdown!]!
    trends: CostTrends!
    projections: CostProjections!
  }

  type AgentCostBreakdown {
    agentId: ID!
    agentName: String!
    agentType: String!
    totalCost: Float!
    percentage: Float!
    tasksCompleted: Int!
    averageCostPerTask: Float!
  }

  type TaskTypeCostBreakdown {
    taskType: String!
    totalCost: Float!
    percentage: Float!
    tasksCompleted: Int!
    averageCostPerTask: Float!
  }

  type CostTrends {
    daily: [DailyCost!]!
    weekly: [WeeklyCost!]!
    monthly: [MonthlyCost!]!
  }

  type DailyCost {
    date: String!
    cost: Float!
  }

  type WeeklyCost {
    week: String!
    cost: Float!
  }

  type MonthlyCost {
    month: String!
    cost: Float!
  }

  type CostProjections {
    estimatedDailyCost: Float!
    estimatedWeeklyCost: Float!
    estimatedMonthlyCost: Float!
    budgetUtilization: Float
  }

  type PerformanceTrends {
    timestamp: DateTime!
    period: TrendPeriod!
    successRate: TrendMetric!
    responseTime: TrendMetric!
    taskThroughput: TrendMetric!
    errorRate: TrendMetric!
    cacheHitRate: TrendMetric!
    qualityScore: TrendMetric!
  }

  enum TrendPeriod {
    hourly
    daily
    weekly
    monthly
  }

  type TrendMetric {
    current: Float!
    previous: Float!
    trend: QualityTrend!
    data: [MetricPoint!]!
  }

  type OptimizationRecommendation {
    id: ID!
    type: RecommendationType!
    severity: RecommendationSeverity!
    title: String!
    description: String!
    impact: String!
    recommendation: String!
    estimatedSavings: Float
    estimatedImprovement: Float
    agentId: ID
    agentName: String
    createdAt: DateTime!
  }

  enum RecommendationType {
    cost
    performance
    quality
    capacity
  }

  enum RecommendationSeverity {
    low
    medium
    high
    critical
  }

  type Alert {
    id: ID!
    type: AlertType!
    severity: AlertSeverity!
    title: String!
    message: String!
    agentId: ID
    agentName: String
    threshold: Float!
    currentValue: Float!
    createdAt: DateTime!
    acknowledged: Boolean!
  }

  enum AlertType {
    success_rate
    response_time
    cost
    error_rate
    health
    capacity
  }

  enum AlertSeverity {
    warning
    critical
  }

  type BudgetConfig {
    dailyLimit: Float
    weeklyLimit: Float
    monthlyLimit: Float
    alertThreshold: Float
  }

  type CleanupResult {
    deleted: Int!
    message: String!
  }

  # ==================== INPUTS ====================

  input DateRangeInput {
    startDate: DateTime
    endDate: DateTime
    period: PeriodType
  }

  enum PeriodType {
    hour
    day
    week
    month
  }

  input BudgetConfigInput {
    dailyLimit: Float
    weeklyLimit: Float
    monthlyLimit: Float
    alertThreshold: Float
  }

  # ==================== QUERIES ====================

  type Query {
    """
    Get comprehensive system-wide analytics overview
    """
    systemOverview: SystemOverview!

    """
    Get detailed analytics for a specific agent
    """
    agentAnalytics(agentId: ID!, dateRange: DateRangeInput): AgentAnalytics!

    """
    Get comprehensive cost breakdown and analysis
    """
    costBreakdown(dateRange: DateRangeInput): CostBreakdown!

    """
    Get performance trends over time
    """
    performanceTrends(period: TrendPeriod, dateRange: DateRangeInput): PerformanceTrends!

    """
    Get AI system optimization recommendations
    """
    optimizationRecommendations: [OptimizationRecommendation!]!

    """
    Get current budget configuration
    """
    budgetConfig: BudgetConfig

    """
    Get all active alerts
    """
    activeAlerts: [Alert!]!
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    """
    Set budget configuration
    """
    setBudgetConfig(input: BudgetConfigInput!): BudgetConfig!

    """
    Acknowledge an alert
    """
    acknowledgeAlert(alertId: ID!): Alert!

    """
    Cleanup old analytics data (admin only)
    """
    cleanupOldAnalytics: CleanupResult!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    """
    Subscribe to system overview updates (every 30 seconds)
    """
    systemOverviewUpdated: SystemOverview!

    """
    Subscribe to new alerts
    """
    newAlert: Alert!

    """
    Subscribe to agent analytics updates
    """
    agentAnalyticsUpdated(agentId: ID!): AgentAnalytics!
  }
`;

export default aiAnalyticsSchema;
