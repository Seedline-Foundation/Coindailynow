import { GraphQLResolveInfo } from 'graphql';
import { PrismaClient } from '@prisma/client';
import { FinanceAnalyticsService } from '../../services/finance/FinanceAnalyticsService';
import { FinanceReportingService } from '../../services/finance/FinanceReportingService';
import { FinancePerformanceMonitor } from '../../services/finance/FinancePerformanceMonitor';
import { FinanceVersionManager } from '../../services/finance/FinanceVersionManager';

// GraphQL type definitions for analytics
export const analyticsTypeDefs = `
  type TokenVelocityMetrics {
    totalVolume: Float!
    uniqueUsers: Int!
    averageTransactionSize: Float!
    turnoverRate: Float!
    peakHour: Int!
    timeframe: String!
  }

  type StakingMetrics {
    totalStakers: Int!
    totalStaked: Float!
    averageStakeSize: Float!
    averageStakeDuration: Float!
    rewardsDistributed: Float!
    participationRate: Float!
  }

  type ConversionMetrics {
    totalConversions: Int!
    conversionRate: Float!
    averageConversionSize: Float!
    popularProducts: [PopularProduct!]!
    failureRate: Float!
  }

  type PopularProduct {
    product: String!
    conversions: Int!
    volume: Float!
  }

  type RevenueMetrics {
    totalRevenue: Float!
    revenueByService: [ServiceRevenue!]!
    revenueByDate: [DailyRevenue!]!
    monthlyGrowth: Float!
    projectedRevenue: Float!
  }

  type ServiceRevenue {
    service: String!
    revenue: Float!
    transactionCount: Int!
  }

  type DailyRevenue {
    date: String!
    revenue: Float!
  }

  type UserEarningMetrics {
    userId: String!
    totalEarnings: Float!
    earningsByType: [EarningByType!]!
    potentialEarnings: Float!
    suggestions: [String!]!
    rank: Int!
  }

  type EarningByType {
    type: String!
    amount: Float!
  }

  type SystemHealth {
    totalTransactions: Int!
    errorRate: Float!
    averageResponseTime: Float!
    activeUsers: Int!
  }

  type AnalyticsDashboard {
    tokenVelocity: TokenVelocityMetrics!
    staking: StakingMetrics!
    conversions: ConversionMetrics!
    revenue: RevenueMetrics!
    topEarners: [UserEarningMetrics!]!
    systemHealth: SystemHealth!
  }

  type PerformanceMetrics {
    timestamp: String!
    transactionThroughput: Float!
    averageResponseTime: Float!
    errorRate: Float!
    memoryUsage: Float!
    cpuUsage: Float!
    databaseConnections: Int!
    cacheHitRate: Float!
    queueDepth: Int!
  }

  type SystemAlert {
    id: String!
    type: String!
    severity: String!
    message: String!
    timestamp: String!
    resolved: Boolean!
    resolvedAt: String
  }

  type SystemHealthStatus {
    status: String!
    metrics: PerformanceMetrics!
    activeAlerts: [SystemAlert!]!
    recommendations: [String!]!
  }

  type LoadTestResult {
    testId: String!
    startTime: String!
    endTime: String!
    totalTransactions: Int!
    successfulTransactions: Int!
    failedTransactions: Int!
    averageResponseTime: Float!
    peakThroughput: Float!
    recommendations: [String!]!
  }

  type UserFinancialReport {
    userId: String!
    reportPeriod: String!
    totalEarnings: Float!
    totalSpending: Float!
    netBalance: Float!
    transactionCount: Int!
    earningBreakdown: [EarningBreakdown!]!
    spendingBreakdown: [SpendingBreakdown!]!
    monthlyTrend: [MonthlyTrend!]!
    recommendations: [String!]!
  }

  type EarningBreakdown {
    type: String!
    amount: Float!
    percentage: Float!
  }

  type SpendingBreakdown {
    type: String!
    amount: Float!
    percentage: Float!
  }

  type MonthlyTrend {
    month: String!
    earnings: Float!
    spending: Float!
  }

  type SystemFinancialReport {
    reportPeriod: String!
    totalRevenue: Float!
    totalExpenses: Float!
    netProfit: Float!
    userGrowth: Float!
    transactionVolume: Int!
    systemHealth: SystemHealthReport!
    topMetrics: TopMetrics!
    complianceStatus: ComplianceStatus!
  }

  type SystemHealthReport {
    uptime: Float!
    errorRate: Float!
    performanceScore: Float!
  }

  type TopMetrics {
    highestEarner: UserEarningMetrics!
    mostActiveUser: String!
    popularService: String!
  }

  type ComplianceStatus {
    auditCompliant: Boolean!
    dataRetentionCompliant: Boolean!
    securityCompliant: Boolean!
  }

  type ApiVersion {
    version: String!
    releaseDate: String!
    deprecated: Boolean!
    deprecationDate: String
    endOfLifeDate: String
    features: [String!]!
    breakingChanges: [String!]!
    securityLevel: String!
    supportStatus: String!
  }

  input DateRangeInput {
    startDate: String!
    endDate: String!
  }

  input LoadTestConfigInput {
    duration: Int!
    concurrentUsers: Int!
    transactionsPerUser: Int!
    rampUpTime: Int!
  }

  input ReportConfigInput {
    startDate: String!
    endDate: String!
    includeUserData: Boolean!
    includeSystemMetrics: Boolean!
    includeFinancialData: Boolean!
    format: String!
    recipients: [String!]
  }

  extend type Query {
    # Analytics queries
    getAnalyticsDashboard(dateRange: DateRangeInput!): AnalyticsDashboard!
    getTokenVelocityMetrics(dateRange: DateRangeInput!, walletType: String): TokenVelocityMetrics!
    getStakingMetrics(dateRange: DateRangeInput!): StakingMetrics!
    getConversionMetrics(dateRange: DateRangeInput!): ConversionMetrics!
    getRevenueMetrics(dateRange: DateRangeInput!): RevenueMetrics!
    getUserEarningMetrics(userId: String!, dateRange: DateRangeInput!): UserEarningMetrics!
    getTopEarners(dateRange: DateRangeInput!, limit: Int): [UserEarningMetrics!]!
    
    # Performance monitoring queries
    getSystemHealth: SystemHealthStatus!
    getPerformanceHistory(hours: Int): [PerformanceMetrics!]!
    getActiveAlerts: [SystemAlert!]!
    getLoadTestHistory: [LoadTestResult!]!
    
    # Reporting queries
    getUserFinancialReport(userId: String!, config: ReportConfigInput!): UserFinancialReport!
    getSystemFinancialReport(config: ReportConfigInput!): SystemFinancialReport!
    
    # Version management queries
    getSupportedVersions: [ApiVersion!]!
    getVersionCompatibility(clientVersion: String!): VersionCompatibility!
  }

  type VersionCompatibility {
    compatible: Boolean!
    supported: Boolean!
    deprecated: Boolean!
    recommendedVersion: String!
    endOfLifeDate: String
  }

  extend type Mutation {
    # Performance monitoring mutations
    startPerformanceMonitoring(intervalMs: Int): Boolean!
    stopPerformanceMonitoring: Boolean!
    runLoadTest(config: LoadTestConfigInput!): LoadTestResult!
    resolveAlert(alertId: String!): Boolean!
    
    # Reporting mutations
    generateUserReport(userId: String!, config: ReportConfigInput!): UserFinancialReport!
    generateSystemReport(config: ReportConfigInput!): SystemFinancialReport!
    scheduleAutomatedReports: Boolean!
    
    # Version management mutations
    createNewVersion(versionData: String!): ApiVersion!
    deprecateVersion(version: String!, endOfLifeDate: String!): Boolean!
    scheduleUpgrade(targetVersion: String!, scheduledDate: String!, maintenanceStart: String!, maintenanceEnd: String!): Boolean!
  }
`;

export interface AnalyticsContext {
  prisma: PrismaClient;
  userId?: string;
  userRole?: string;
}

export const analyticsResolvers = {
  Query: {
    // Analytics dashboard resolver
    getAnalyticsDashboard: async (
      parent: any,
      args: { dateRange: { startDate: string; endDate: string } },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getAnalyticsDashboard(startDate, endDate);
    },

    // Token velocity metrics resolver
    getTokenVelocityMetrics: async (
      parent: any,
      args: { dateRange: { startDate: string; endDate: string }; walletType?: string },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getTokenVelocityMetrics(
        startDate,
        endDate,
        args.walletType as any
      );
    },

    // Staking metrics resolver
    getStakingMetrics: async (
      parent: any,
      args: { dateRange: { startDate: string; endDate: string } },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getStakingMetrics(startDate, endDate);
    },

    // Conversion metrics resolver
    getConversionMetrics: async (
      parent: any,
      args: { dateRange: { startDate: string; endDate: string } },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getConversionMetrics(startDate, endDate);
    },

    // Revenue metrics resolver
    getRevenueMetrics: async (
      parent: any,
      args: { dateRange: { startDate: string; endDate: string } },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getRevenueMetrics(startDate, endDate);
    },

    // User earning metrics resolver
    getUserEarningMetrics: async (
      parent: any,
      args: { userId: string; dateRange: { startDate: string; endDate: string } },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getUserEarningMetrics(args.userId, startDate, endDate);
    },

    // Top earners resolver
    getTopEarners: async (
      parent: any,
      args: { dateRange: { startDate: string; endDate: string }; limit?: number },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const analyticsService = new FinanceAnalyticsService(context.prisma);
      const startDate = new Date(args.dateRange.startDate);
      const endDate = new Date(args.dateRange.endDate);

      return await analyticsService.getTopEarners(startDate, endDate, args.limit || 10);
    },

    // System health resolver
    getSystemHealth: async (
      parent: any,
      args: any,
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      return await performanceMonitor.getSystemHealth();
    },

    // Performance history resolver
    getPerformanceHistory: async (
      parent: any,
      args: { hours?: number },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      return performanceMonitor.getPerformanceHistory(args.hours || 24);
    },

    // Active alerts resolver
    getActiveAlerts: async (
      parent: any,
      args: any,
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      return performanceMonitor.getActiveAlerts();
    },

    // Load test history resolver
    getLoadTestHistory: async (
      parent: any,
      args: any,
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      return performanceMonitor.getLoadTestHistory();
    },

    // User financial report resolver
    getUserFinancialReport: async (
      parent: any,
      args: { userId: string; config: any },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const reportingService = new FinanceReportingService(context.prisma);
      const config = {
        ...args.config,
        startDate: new Date(args.config.startDate),
        endDate: new Date(args.config.endDate),
      };

      return await reportingService.generateUserFinancialReport(args.userId, config);
    },

    // System financial report resolver
    getSystemFinancialReport: async (
      parent: any,
      args: { config: any },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const reportingService = new FinanceReportingService(context.prisma);
      const config = {
        ...args.config,
        startDate: new Date(args.config.startDate),
        endDate: new Date(args.config.endDate),
      };

      return await reportingService.generateSystemFinancialReport(config);
    },

    // Supported versions resolver
    getSupportedVersions: async (
      parent: any,
      args: any,
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const versionManager = new FinanceVersionManager(context.prisma);
      return versionManager.getSupportedVersions();
    },

    // Version compatibility resolver
    getVersionCompatibility: async (
      parent: any,
      args: { clientVersion: string },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const versionManager = new FinanceVersionManager(context.prisma);
      return versionManager.getVersionCompatibility(args.clientVersion);
    },
  },

  Mutation: {
    // Start performance monitoring mutation
    startPerformanceMonitoring: async (
      parent: any,
      args: { intervalMs?: number },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      await performanceMonitor.startMonitoring(args.intervalMs || 30000);
      return true;
    },

    // Stop performance monitoring mutation
    stopPerformanceMonitoring: async (
      parent: any,
      args: any,
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      await performanceMonitor.stopMonitoring();
      return true;
    },

    // Run load test mutation
    runLoadTest: async (
      parent: any,
      args: { config: any },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      
      // Convert input to LoadTestConfig
      const config = {
        ...args.config,
        testScenarios: [
          {
            name: 'Standard Operations',
            weight: 100,
            operations: [
              { type: 'TRANSFER', frequency: 10, payload: {} },
              { type: 'STAKE', frequency: 5, payload: {} },
              { type: 'CONVERSION', frequency: 3, payload: {} },
            ],
          },
        ],
      };

      return await performanceMonitor.runLoadTest(config);
    },

    // Resolve alert mutation
    resolveAlert: async (
      parent: any,
      args: { alertId: string },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const performanceMonitor = new FinancePerformanceMonitor(context.prisma);
      await performanceMonitor.resolveAlert(args.alertId);
      return true;
    },

    // Generate user report mutation
    generateUserReport: async (
      parent: any,
      args: { userId: string; config: any },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const reportingService = new FinanceReportingService(context.prisma);
      const config = {
        ...args.config,
        startDate: new Date(args.config.startDate),
        endDate: new Date(args.config.endDate),
      };

      return await reportingService.generateUserFinancialReport(args.userId, config);
    },

    // Generate system report mutation
    generateSystemReport: async (
      parent: any,
      args: { config: any },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const reportingService = new FinanceReportingService(context.prisma);
      const config = {
        ...args.config,
        startDate: new Date(args.config.startDate),
        endDate: new Date(args.config.endDate),
      };

      return await reportingService.generateSystemFinancialReport(config);
    },

    // Schedule automated reports mutation
    scheduleAutomatedReports: async (
      parent: any,
      args: any,
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const reportingService = new FinanceReportingService(context.prisma);
      await reportingService.scheduleAutomatedReports();
      return true;
    },

    // Create new version mutation
    createNewVersion: async (
      parent: any,
      args: { versionData: string },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const versionManager = new FinanceVersionManager(context.prisma);
      const versionData = JSON.parse(args.versionData);
      return await versionManager.createNewVersion(versionData);
    },

    // Deprecate version mutation
    deprecateVersion: async (
      parent: any,
      args: { version: string; endOfLifeDate: string },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const versionManager = new FinanceVersionManager(context.prisma);
      await versionManager.deprecateVersion(args.version, new Date(args.endOfLifeDate));
      return true;
    },

    // Schedule upgrade mutation
    scheduleUpgrade: async (
      parent: any,
      args: {
        targetVersion: string;
        scheduledDate: string;
        maintenanceStart: string;
        maintenanceEnd: string;
      },
      context: AnalyticsContext,
      info: GraphQLResolveInfo
    ) => {
      const versionManager = new FinanceVersionManager(context.prisma);
      await versionManager.scheduleUpgrade(
        args.targetVersion,
        new Date(args.scheduledDate),
        {
          start: new Date(args.maintenanceStart),
          end: new Date(args.maintenanceEnd),
        }
      );
      return true;
    },
  },
};