import { gql } from '@apollo/client';

// Query for getting analytics dashboard data
export const GET_ANALYTICS_DASHBOARD = gql`
  query GetAnalyticsDashboard($dateRange: DateRangeInput!) {
    getAnalyticsDashboard(dateRange: $dateRange) {
      tokenVelocity {
        totalVolume
        uniqueUsers
        averageTransactionSize
        turnoverRate
        peakHour
        timeframe
      }
      staking {
        totalStakers
        totalStaked
        averageStakeSize
        averageStakeDuration
        rewardsDistributed
        participationRate
      }
      conversions {
        totalConversions
        conversionRate
        averageConversionSize
        popularProducts {
          product
          conversions
          volume
        }
        failureRate
      }
      revenue {
        totalRevenue
        revenueByService {
          service
          revenue
          transactionCount
        }
        revenueByDate {
          date
          revenue
        }
        monthlyGrowth
        projectedRevenue
      }
      topEarners {
        userId
        totalEarnings
        earningsByType {
          type
          amount
        }
        potentialEarnings
        suggestions
        rank
      }
      systemHealth {
        totalTransactions
        errorRate
        averageResponseTime
        activeUsers
      }
    }
  }
`;

// Query for getting system health status
export const GET_SYSTEM_HEALTH = gql`
  query GetSystemHealth {
    getSystemHealth {
      status
      metrics {
        timestamp
        transactionThroughput
        averageResponseTime
        errorRate
        memoryUsage
        cpuUsage
        databaseConnections
        cacheHitRate
        queueDepth
      }
      activeAlerts {
        id
        type
        severity
        message
        timestamp
        resolved
        resolvedAt
      }
      recommendations
    }
  }
`;

// Query for getting performance history
export const GET_PERFORMANCE_HISTORY = gql`
  query GetPerformanceHistory($hours: Int) {
    getPerformanceHistory(hours: $hours) {
      timestamp
      transactionThroughput
      averageResponseTime
      errorRate
      memoryUsage
      cpuUsage
      databaseConnections
      cacheHitRate
      queueDepth
    }
  }
`;

// Query for getting top earners
export const GET_TOP_EARNERS = gql`
  query GetTopEarners($dateRange: DateRangeInput!, $limit: Int) {
    getTopEarners(dateRange: $dateRange, limit: $limit) {
      userId
      totalEarnings
      earningsByType {
        type
        amount
      }
      potentialEarnings
      suggestions
      rank
    }
  }
`;

// Query for getting user earning metrics
export const GET_USER_EARNING_METRICS = gql`
  query GetUserEarningMetrics($userId: String!, $dateRange: DateRangeInput!) {
    getUserEarningMetrics(userId: $userId, dateRange: $dateRange) {
      userId
      totalEarnings
      earningsByType {
        type
        amount
      }
      potentialEarnings
      suggestions
      rank
    }
  }
`;

// Query for getting token velocity metrics
export const GET_TOKEN_VELOCITY_METRICS = gql`
  query GetTokenVelocityMetrics($dateRange: DateRangeInput!, $walletType: String) {
    getTokenVelocityMetrics(dateRange: $dateRange, walletType: $walletType) {
      totalVolume
      uniqueUsers
      averageTransactionSize
      turnoverRate
      peakHour
      timeframe
    }
  }
`;

// Query for getting staking metrics
export const GET_STAKING_METRICS = gql`
  query GetStakingMetrics($dateRange: DateRangeInput!) {
    getStakingMetrics(dateRange: $dateRange) {
      totalStakers
      totalStaked
      averageStakeSize
      averageStakeDuration
      rewardsDistributed
      participationRate
    }
  }
`;

// Query for getting conversion metrics
export const GET_CONVERSION_METRICS = gql`
  query GetConversionMetrics($dateRange: DateRangeInput!) {
    getConversionMetrics(dateRange: $dateRange) {
      totalConversions
      conversionRate
      averageConversionSize
      popularProducts {
        product
        conversions
        volume
      }
      failureRate
    }
  }
`;

// Query for getting revenue metrics
export const GET_REVENUE_METRICS = gql`
  query GetRevenueMetrics($dateRange: DateRangeInput!) {
    getRevenueMetrics(dateRange: $dateRange) {
      totalRevenue
      revenueByService {
        service
        revenue
        transactionCount
      }
      revenueByDate {
        date
        revenue
      }
      monthlyGrowth
      projectedRevenue
    }
  }
`;

// Query for getting active alerts
export const GET_ACTIVE_ALERTS = gql`
  query GetActiveAlerts {
    getActiveAlerts {
      id
      type
      severity
      message
      timestamp
      resolved
      resolvedAt
    }
  }
`;

// Query for getting load test history
export const GET_LOAD_TEST_HISTORY = gql`
  query GetLoadTestHistory {
    getLoadTestHistory {
      testId
      startTime
      endTime
      totalTransactions
      successfulTransactions
      failedTransactions
      averageResponseTime
      peakThroughput
      recommendations
    }
  }
`;

// Query for getting user financial report
export const GET_USER_FINANCIAL_REPORT = gql`
  query GetUserFinancialReport($userId: String!, $config: ReportConfigInput!) {
    getUserFinancialReport(userId: $userId, config: $config) {
      userId
      reportPeriod
      totalEarnings
      totalSpending
      netBalance
      transactionCount
      earningBreakdown {
        type
        amount
        percentage
      }
      spendingBreakdown {
        type
        amount
        percentage
      }
      monthlyTrend {
        month
        earnings
        spending
      }
      recommendations
    }
  }
`;

// Query for getting system financial report
export const GET_SYSTEM_FINANCIAL_REPORT = gql`
  query GetSystemFinancialReport($config: ReportConfigInput!) {
    getSystemFinancialReport(config: $config) {
      reportPeriod
      totalRevenue
      totalExpenses
      netProfit
      userGrowth
      transactionVolume
      systemHealth {
        uptime
        errorRate
        performanceScore
      }
      topMetrics {
        highestEarner {
          userId
          totalEarnings
          rank
        }
        mostActiveUser
        popularService
      }
      complianceStatus {
        auditCompliant
        dataRetentionCompliant
        securityCompliant
      }
    }
  }
`;

// Query for getting supported versions
export const GET_SUPPORTED_VERSIONS = gql`
  query GetSupportedVersions {
    getSupportedVersions {
      version
      releaseDate
      deprecated
      deprecationDate
      endOfLifeDate
      features
      breakingChanges
      securityLevel
      supportStatus
    }
  }
`;

// Query for getting version compatibility
export const GET_VERSION_COMPATIBILITY = gql`
  query GetVersionCompatibility($clientVersion: String!) {
    getVersionCompatibility(clientVersion: $clientVersion) {
      compatible
      supported
      deprecated
      recommendedVersion
      endOfLifeDate
    }
  }
`;

// Mutation for starting performance monitoring
export const START_PERFORMANCE_MONITORING = gql`
  mutation StartPerformanceMonitoring($intervalMs: Int) {
    startPerformanceMonitoring(intervalMs: $intervalMs)
  }
`;

// Mutation for stopping performance monitoring
export const STOP_PERFORMANCE_MONITORING = gql`
  mutation StopPerformanceMonitoring {
    stopPerformanceMonitoring
  }
`;

// Mutation for running load test
export const RUN_LOAD_TEST = gql`
  mutation RunLoadTest($config: LoadTestConfigInput!) {
    runLoadTest(config: $config) {
      testId
      startTime
      endTime
      totalTransactions
      successfulTransactions
      failedTransactions
      averageResponseTime
      peakThroughput
      recommendations
    }
  }
`;

// Mutation for resolving alert
export const RESOLVE_ALERT = gql`
  mutation ResolveAlert($alertId: String!) {
    resolveAlert(alertId: $alertId)
  }
`;

// Mutation for generating user report
export const GENERATE_USER_REPORT = gql`
  mutation GenerateUserReport($userId: String!, $config: ReportConfigInput!) {
    generateUserReport(userId: $userId, config: $config) {
      userId
      reportPeriod
      totalEarnings
      totalSpending
      netBalance
      transactionCount
      earningBreakdown {
        type
        amount
        percentage
      }
      spendingBreakdown {
        type
        amount
        percentage
      }
      monthlyTrend {
        month
        earnings
        spending
      }
      recommendations
    }
  }
`;

// Mutation for generating system report
export const GENERATE_SYSTEM_REPORT = gql`
  mutation GenerateSystemReport($config: ReportConfigInput!) {
    generateSystemReport(config: $config) {
      reportPeriod
      totalRevenue
      totalExpenses
      netProfit
      userGrowth
      transactionVolume
      systemHealth {
        uptime
        errorRate
        performanceScore
      }
      topMetrics {
        highestEarner {
          userId
          totalEarnings
          rank
        }
        mostActiveUser
        popularService
      }
      complianceStatus {
        auditCompliant
        dataRetentionCompliant
        securityCompliant
      }
    }
  }
`;

// Mutation for scheduling automated reports
export const SCHEDULE_AUTOMATED_REPORTS = gql`
  mutation ScheduleAutomatedReports {
    scheduleAutomatedReports
  }
`;

// Mutation for creating new version
export const CREATE_NEW_VERSION = gql`
  mutation CreateNewVersion($versionData: String!) {
    createNewVersion(versionData: $versionData) {
      version
      releaseDate
      deprecated
      features
      breakingChanges
      securityLevel
      supportStatus
    }
  }
`;

// Mutation for deprecating version
export const DEPRECATE_VERSION = gql`
  mutation DeprecateVersion($version: String!, $endOfLifeDate: String!) {
    deprecateVersion(version: $version, endOfLifeDate: $endOfLifeDate)
  }
`;

// Mutation for scheduling upgrade
export const SCHEDULE_UPGRADE = gql`
  mutation ScheduleUpgrade(
    $targetVersion: String!
    $scheduledDate: String!
    $maintenanceStart: String!
    $maintenanceEnd: String!
  ) {
    scheduleUpgrade(
      targetVersion: $targetVersion
      scheduledDate: $scheduledDate
      maintenanceStart: $maintenanceStart
      maintenanceEnd: $maintenanceEnd
    )
  }
`;

// Fragments for reusable data structures
export const EARNING_METRICS_FRAGMENT = gql`
  fragment EarningMetricsFragment on UserEarningMetrics {
    userId
    totalEarnings
    earningsByType {
      type
      amount
    }
    potentialEarnings
    suggestions
    rank
  }
`;

export const PERFORMANCE_METRICS_FRAGMENT = gql`
  fragment PerformanceMetricsFragment on PerformanceMetrics {
    timestamp
    transactionThroughput
    averageResponseTime
    errorRate
    memoryUsage
    cpuUsage
    databaseConnections
    cacheHitRate
    queueDepth
  }
`;

export const SYSTEM_ALERT_FRAGMENT = gql`
  fragment SystemAlertFragment on SystemAlert {
    id
    type
    severity
    message
    timestamp
    resolved
    resolvedAt
  }
`;

export const REVENUE_METRICS_FRAGMENT = gql`
  fragment RevenueMetricsFragment on RevenueMetrics {
    totalRevenue
    revenueByService {
      service
      revenue
      transactionCount
    }
    revenueByDate {
      date
      revenue
    }
    monthlyGrowth
    projectedRevenue
  }
`;

// Subscription for real-time updates (if WebSocket support is available)
export const SUBSCRIBE_TO_SYSTEM_HEALTH = gql`
  subscription SubscribeToSystemHealth {
    systemHealthUpdated {
      status
      metrics {
        ...PerformanceMetricsFragment
      }
      activeAlerts {
        ...SystemAlertFragment
      }
      recommendations
    }
  }
  ${PERFORMANCE_METRICS_FRAGMENT}
  ${SYSTEM_ALERT_FRAGMENT}
`;

export const SUBSCRIBE_TO_PERFORMANCE_METRICS = gql`
  subscription SubscribeToPerformanceMetrics {
    performanceMetricsUpdated {
      ...PerformanceMetricsFragment
    }
  }
  ${PERFORMANCE_METRICS_FRAGMENT}
`;

export const SUBSCRIBE_TO_ALERTS = gql`
  subscription SubscribeToAlerts {
    alertCreated {
      ...SystemAlertFragment
    }
    alertResolved {
      ...SystemAlertFragment
    }
  }
  ${SYSTEM_ALERT_FRAGMENT}
`;