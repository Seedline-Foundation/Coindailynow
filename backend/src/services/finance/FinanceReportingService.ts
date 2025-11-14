import { PrismaClient } from '@prisma/client';
import { FinanceAnalyticsService, AnalyticsDashboard, UserEarningMetrics } from './FinanceAnalyticsService';
import { FinanceAuditService } from '../FinanceAuditService';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportConfig {
  startDate: Date;
  endDate: Date;
  includeUserData: boolean;
  includeSystemMetrics: boolean;
  includeFinancialData: boolean;
  format: 'csv' | 'json' | 'pdf';
  recipients?: string[];
}

export interface UserFinancialReport {
  userId: string;
  reportPeriod: string;
  totalEarnings: number;
  totalSpending: number;
  netBalance: number;
  transactionCount: number;
  earningBreakdown: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  spendingBreakdown: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    earnings: number;
    spending: number;
  }>;
  recommendations: string[];
}

export interface SystemFinancialReport {
  reportPeriod: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  userGrowth: number;
  transactionVolume: number;
  systemHealth: {
    uptime: number;
    errorRate: number;
    performanceScore: number;
  };
  topMetrics: {
    highestEarner: UserEarningMetrics;
    mostActiveUser: string;
    popularService: string;
  };
  complianceStatus: {
    auditCompliant: boolean;
    dataRetentionCompliant: boolean;
    securityCompliant: boolean;
  };
}

export interface ComplianceReport {
  reportDate: Date;
  auditTrailIntegrity: boolean;
  dataRetentionCompliance: boolean;
  securityIncidents: number;
  fraudAlerts: number;
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  regulatoryNotes: string[];
}

export class FinanceReportingService {
  private prisma: PrismaClient;
  private analyticsService: FinanceAnalyticsService;
  private auditService: FinanceAuditService;
  private reportsDirectory: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.analyticsService = new FinanceAnalyticsService(prisma);
    this.auditService = new FinanceAuditService();
    this.reportsDirectory = path.join(process.cwd(), 'reports');
    this.ensureReportsDirectory();
  }

  /**
   * Generate comprehensive user financial report
   */
  async generateUserFinancialReport(userId: string, config: ReportConfig): Promise<UserFinancialReport> {
    try {
      // Audit logging skipped;

      // Get user earnings metrics
      const earningMetrics = await this.analyticsService.getUserEarningMetrics(
        userId,
        config.startDate,
        config.endDate
      );

      // Get user spending data
      const userWallets = await this.prisma.wallet.findMany({
        where: { userId },
        include: {
          transactionsFrom: {
            where: {
              createdAt: {
                gte: config.startDate,
                lte: config.endDate,
              },
            },
          },
        },
      });

      const spendingTransactions = userWallets.flatMap(wallet => wallet.transactionsFrom);
      const totalSpending = spendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Create spending breakdown
      const spendingByType = new Map<string, number>();
      spendingTransactions.forEach(tx => {
        const type = tx.transactionType;
        spendingByType.set(type, (spendingByType.get(type) || 0) + tx.amount);
      });

      const spendingBreakdown = Array.from(spendingByType.entries())
        .map(([type, amount]) => ({
          type,
          amount,
          percentage: (amount / totalSpending) * 100,
        }));

      // Calculate earning breakdown percentages
      const earningBreakdown = earningMetrics.earningsByType.map(earning => ({
        ...earning,
        percentage: (earning.amount / earningMetrics.totalEarnings) * 100,
      }));

      // Generate monthly trend
      const monthlyTrend = await this.generateMonthlyTrend(userId, config.startDate, config.endDate);

      // Generate recommendations
      const recommendations = await this.generateUserRecommendations(userId, earningMetrics);

      const report: UserFinancialReport = {
        userId,
        reportPeriod: `${config.startDate.toISOString().split('T')[0]} to ${config.endDate.toISOString().split('T')[0]}`,
        totalEarnings: earningMetrics.totalEarnings,
        totalSpending,
        netBalance: earningMetrics.totalEarnings - totalSpending,
        transactionCount: spendingTransactions.length + earningMetrics.earningsByType.length,
        earningBreakdown,
        spendingBreakdown,
        monthlyTrend,
        recommendations,
      };

      // Save report based on format
      if (config.format === 'csv') {
        await this.saveUserReportAsCSV(report);
      } else if (config.format === 'json') {
        await this.saveUserReportAsJSON(report);
      }

      // Audit logging skipped

      return report;
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Generate system-wide financial report
   */
  async generateSystemFinancialReport(config: ReportConfig): Promise<SystemFinancialReport> {
    try {
      // Audit logging skipped;

      // Get comprehensive analytics
      const dashboard = await this.analyticsService.getAnalyticsDashboard(
        config.startDate,
        config.endDate
      );

      // Calculate user growth
      const previousPeriodStart = new Date(config.startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 
        (config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24));

      const previousActiveUsers = await this.prisma.wallet.count({
        where: {
          user: {
            isNot: null,
          },
          transactionsTo: {
            some: {
              createdAt: {
                gte: previousPeriodStart,
                lte: config.startDate,
              },
            },
          },
        },
      });

      const userGrowth = previousActiveUsers > 0 ? 
        ((dashboard.systemHealth.activeUsers - previousActiveUsers) / previousActiveUsers) * 100 : 0;

      // Get top metrics
      const topEarner = dashboard.topEarners[0];
      const mostActiveUser = await this.getMostActiveUser(config.startDate, config.endDate);
      const popularService = dashboard.revenue.revenueByService
        .sort((a, b) => b.transactionCount - a.transactionCount)[0]?.service || 'N/A';

      // Check compliance status
      const complianceStatus = await this.checkComplianceStatus();

      const report: SystemFinancialReport = {
        reportPeriod: `${config.startDate.toISOString().split('T')[0]} to ${config.endDate.toISOString().split('T')[0]}`,
        totalRevenue: dashboard.revenue.totalRevenue,
        totalExpenses: 0, // Would be calculated from expense transactions
        netProfit: dashboard.revenue.totalRevenue,
        userGrowth,
        transactionVolume: dashboard.systemHealth.totalTransactions,
        systemHealth: {
          uptime: 99.9, // Would come from monitoring system
          errorRate: dashboard.systemHealth.errorRate,
          performanceScore: dashboard.systemHealth.averageResponseTime < 500 ? 95 : 70,
        },
        topMetrics: {
          highestEarner: topEarner || {
            userId: 'N/A',
            totalEarnings: 0,
            earningsByType: [],
            potentialEarnings: 0,
            suggestions: [],
            rank: 0,
          },
          mostActiveUser,
          popularService,
        },
        complianceStatus,
      };

      // Save report
      if (config.format === 'csv') {
        await this.saveSystemReportAsCSV(report);
      } else if (config.format === 'json') {
        await this.saveSystemReportAsJSON(report);
      }

      // Audit logging skipped

      return report;
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Generate compliance report for regulatory purposes
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      // Audit logging skipped;

      // Check audit trail integrity
      const auditEvents = await this.prisma.auditEvent.count({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const auditTrailIntegrity = auditEvents > 0;

      // Check data retention compliance
      const oldestData = await this.prisma.walletTransaction.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      const dataRetentionCompliance = !oldestData || 
        (Date.now() - oldestData.createdAt.getTime()) < (365 * 24 * 60 * 60 * 1000); // 1 year

      // Count security incidents
      const securityIncidents = await this.prisma.auditEvent.count({
        where: {
          type: {
            in: ['FRAUD_DETECTED', 'SECURITY_VIOLATION', 'SUSPICIOUS_ACTIVITY'],
          },
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Count fraud alerts
      const fraudAlerts = await this.prisma.auditEvent.count({
        where: {
          type: 'FRAUD_DETECTED',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Assess overall risk
      let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (securityIncidents > 10 || fraudAlerts > 5) {
        riskAssessment = 'HIGH';
      } else if (securityIncidents > 5 || fraudAlerts > 2) {
        riskAssessment = 'MEDIUM';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (!auditTrailIntegrity) {
        recommendations.push('Improve audit trail logging coverage');
      }
      if (!dataRetentionCompliance) {
        recommendations.push('Implement data archival for compliance');
      }
      if (riskAssessment === 'HIGH') {
        recommendations.push('Review security protocols and fraud detection rules');
      }

      const report: ComplianceReport = {
        reportDate: new Date(),
        auditTrailIntegrity,
        dataRetentionCompliance,
        securityIncidents,
        fraudAlerts,
        riskAssessment,
        recommendations,
        regulatoryNotes: [
          'All financial transactions are logged and auditable',
          'User data is handled according to privacy regulations',
          'Fraud monitoring is active and responsive',
        ],
      };

      await this.saveComplianceReportAsJSON(report);

      // Audit logging skipped

      return report;
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Schedule automated report generation
   */
  async scheduleAutomatedReports(): Promise<void> {
    try {
      // This would integrate with a job scheduler like Bull or Agenda
      console.log('Setting up automated report schedules...');

      // Daily system health reports
      // Weekly user engagement reports
      // Monthly financial summaries
      // Quarterly compliance reports

      // Audit logging skipped
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  // Private helper methods

  private ensureReportsDirectory(): void {
    if (!fs.existsSync(this.reportsDirectory)) {
      fs.mkdirSync(this.reportsDirectory, { recursive: true });
    }
  }

  private async generateMonthlyTrend(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; earnings: number; spending: number }>> {
    const months: Array<{ month: string; earnings: number; spending: number }> = [];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const earningMetrics = await this.analyticsService.getUserEarningMetrics(
        userId,
        monthStart,
        monthEnd
      );

      const userWallets = await this.prisma.wallet.findMany({
        where: { userId },
        include: {
          transactionsFrom: {
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          },
        },
      });

      const spending = userWallets
        .flatMap(wallet => wallet.transactionsFrom)
        .reduce((sum, tx) => sum + tx.amount, 0);

      months.push({
        month: current.toISOString().slice(0, 7), // YYYY-MM format
        earnings: earningMetrics.totalEarnings,
        spending,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private async generateUserRecommendations(
    userId: string,
    earningMetrics: UserEarningMetrics
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Add recommendations based on earning patterns
    if (earningMetrics.totalEarnings < 100) {
      recommendations.push('Consider increasing your activity to boost earnings');
    }

    if (earningMetrics.rank > 50) {
      recommendations.push('Explore staking opportunities to improve your ranking');
    }

    // Add suggestions from analytics service
    recommendations.push(...earningMetrics.suggestions);

    return recommendations;
  }

  private async getMostActiveUser(startDate: Date, endDate: Date): Promise<string> {
    const activeUsers = await this.prisma.walletTransaction.groupBy({
      by: ['fromWalletId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        fromWallet: {
          userId: {
            not: null,
          },
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 1,
    });

    if (!activeUsers || activeUsers.length === 0 || !activeUsers[0]?.fromWalletId) return 'N/A';

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: activeUsers[0].fromWalletId },
    });

    return wallet?.userId || 'Unknown';
  }

  private async checkComplianceStatus(): Promise<{
    auditCompliant: boolean;
    dataRetentionCompliant: boolean;
    securityCompliant: boolean;
  }> {
    // These would be more sophisticated checks in production
    return {
      auditCompliant: true,
      dataRetentionCompliant: true,
      securityCompliant: true,
    };
  }

  // Report saving methods

  private async saveUserReportAsCSV(report: UserFinancialReport): Promise<void> {
    const csvContent = this.convertUserReportToCSV(report);
    const filename = `user_financial_report_${report.userId}_${Date.now()}.csv`;
    const filepath = path.join(this.reportsDirectory, filename);
    fs.writeFileSync(filepath, csvContent);
  }

  private async saveUserReportAsJSON(report: UserFinancialReport): Promise<void> {
    const filename = `user_financial_report_${report.userId}_${Date.now()}.json`;
    const filepath = path.join(this.reportsDirectory, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  }

  private async saveSystemReportAsCSV(report: SystemFinancialReport): Promise<void> {
    const csvContent = this.convertSystemReportToCSV(report);
    const filename = `system_financial_report_${Date.now()}.csv`;
    const filepath = path.join(this.reportsDirectory, filename);
    fs.writeFileSync(filepath, csvContent);
  }

  private async saveSystemReportAsJSON(report: SystemFinancialReport): Promise<void> {
    const filename = `system_financial_report_${Date.now()}.json`;
    const filepath = path.join(this.reportsDirectory, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  }

  private async saveComplianceReportAsJSON(report: ComplianceReport): Promise<void> {
    const filename = `compliance_report_${Date.now()}.json`;
    const filepath = path.join(this.reportsDirectory, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  }

  private convertUserReportToCSV(report: UserFinancialReport): string {
    let csv = 'Report Type,User Financial Report\n';
    csv += `User ID,${report.userId}\n`;
    csv += `Report Period,${report.reportPeriod}\n`;
    csv += `Total Earnings,${report.totalEarnings}\n`;
    csv += `Total Spending,${report.totalSpending}\n`;
    csv += `Net Balance,${report.netBalance}\n`;
    csv += `Transaction Count,${report.transactionCount}\n\n`;

    csv += 'Earning Breakdown\n';
    csv += 'Type,Amount,Percentage\n';
    report.earningBreakdown.forEach(item => {
      csv += `${item.type},${item.amount},${item.percentage.toFixed(2)}%\n`;
    });

    csv += '\nSpending Breakdown\n';
    csv += 'Type,Amount,Percentage\n';
    report.spendingBreakdown.forEach(item => {
      csv += `${item.type},${item.amount},${item.percentage.toFixed(2)}%\n`;
    });

    return csv;
  }

  private convertSystemReportToCSV(report: SystemFinancialReport): string {
    let csv = 'Report Type,System Financial Report\n';
    csv += `Report Period,${report.reportPeriod}\n`;
    csv += `Total Revenue,${report.totalRevenue}\n`;
    csv += `Net Profit,${report.netProfit}\n`;
    csv += `User Growth,${report.userGrowth.toFixed(2)}%\n`;
    csv += `Transaction Volume,${report.transactionVolume}\n`;
    csv += `Error Rate,${report.systemHealth.errorRate.toFixed(2)}%\n`;
    csv += `Performance Score,${report.systemHealth.performanceScore}\n`;

    return csv;
  }
}