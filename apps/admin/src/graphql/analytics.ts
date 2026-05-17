import { gql } from '@apollo/client';

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

export const GENERATE_SYSTEM_REPORT = gql`
  mutation GenerateSystemReport($config: ReportConfigInput!) {
    generateSystemReport(config: $config) {
      reportPeriod
      totalRevenue
      totalExpenses
      netProfit
      userGrowth
      transactionVolume
    }
  }
`;

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
