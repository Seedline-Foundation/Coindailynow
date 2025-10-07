// Phase 4 Dashboard Orchestrator
// Coordinates analytics, monitoring, and campaign management systems

import { ComprehensiveAnalyticsSystem } from './analytics/comprehensive-analytics';
import { RealTimeMonitoringSystem } from './monitoring/real-time-monitoring';
import { CampaignManagementSystem } from './management/campaign-management';
import { createAuditLog, AuditActions } from '@/lib/audit';

interface DashboardConfig {
  analytics: {
    enabled: boolean;
    defaultTimeframe: 'hour' | 'day' | 'week' | 'month';
    cacheTimeout: number; // minutes
  };
  monitoring: {
    enabled: boolean;
    checkInterval: number; // seconds
    alertThresholds: {
      responseTime: number;
      errorRate: number;
      uptime: number;
    };
  };
  campaigns: {
    enabled: boolean;
    maxActiveCampaigns: number;
    defaultTimezone: string;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook?: string;
  };
}

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'analyst';
  permissions: {
    analytics: boolean;
    monitoring: boolean;
    campaigns: boolean;
    systemManagement: boolean;
  };
  preferences: {
    defaultDashboard: 'overview' | 'analytics' | 'monitoring' | 'campaigns';
    timezone: string;
    notifications: boolean;
  };
}

interface DashboardSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  active: boolean;
}

interface UnifiedDashboard {
  overview: {
    systemHealth: 'healthy' | 'warning' | 'critical';
    totalArticles: number;
    activeCampaigns: number;
    totalUsers: number;
    engagementRate: number;
    alerts: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
    }>;
  };
  analytics: {
    summary: Awaited<ReturnType<ComprehensiveAnalyticsSystem['getDashboardSummary']>>;
    quickMetrics: {
      todayViews: number;
      yesterdayViews: number;
      viewsGrowth: number;
      emailOpenRate: number;
      pushClickRate: number;
      socialEngagement: number;
    };
  };
  monitoring: {
    status: Awaited<ReturnType<RealTimeMonitoringSystem['getDashboard']>>;
    liveMetrics: {
      requestsPerMinute: number;
      averageResponseTime: number;
      systemsOnline: number;
      systemsTotal: number;
    };
  };
  campaigns: {
    summary: Awaited<ReturnType<CampaignManagementSystem['getCampaignPerformanceSummary']>>;
    recent: Array<{
      id: string;
      name: string;
      status: string;
      performance: number;
      lastUpdate: Date;
    }>;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
}

interface SystemReport {
  reportId: string;
  generatedAt: Date;
  timeframe: {
    start: Date;
    end: Date;
    period: string;
  };
  sections: {
    executive: {
      summary: string;
      keyMetrics: Record<string, number>;
      recommendations: string[];
    };
    analytics: {
      contentPerformance: Record<string, unknown>;
      audienceInsights: Record<string, unknown>;
      trends: Record<string, unknown>;
    };
    system: {
      uptime: Record<string, number>;
      performance: Record<string, unknown>;
      incidents: Array<Record<string, unknown>>;
    };
    campaigns: {
      performance: Record<string, unknown>;
      roi: Record<string, number>;
      optimization: string[];
    };
  };
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: unknown[];
    metadata: Record<string, unknown>;
  }>;
}

export class Phase4DashboardOrchestrator {
  private analytics: ComprehensiveAnalyticsSystem;
  private monitoring: RealTimeMonitoringSystem;
  private campaigns: CampaignManagementSystem;
  private config: DashboardConfig;
  private activeSessions: Map<string, DashboardSession> = new Map();
  private users: Map<string, DashboardUser> = new Map();
  private notifications: Array<UnifiedDashboard['notifications'][0]> = [];

  constructor(config?: Partial<DashboardConfig>) {
    this.analytics = new ComprehensiveAnalyticsSystem();
    this.monitoring = new RealTimeMonitoringSystem();
    this.campaigns = new CampaignManagementSystem();
    
    this.config = {
      analytics: {
        enabled: true,
        defaultTimeframe: 'day',
        cacheTimeout: 5
      },
      monitoring: {
        enabled: true,
        checkInterval: 30,
        alertThresholds: {
          responseTime: 5000,
          errorRate: 10,
          uptime: 95
        }
      },
      campaigns: {
        enabled: true,
        maxActiveCampaigns: 50,
        defaultTimezone: 'UTC'
      },
      notifications: {
        email: true,
        slack: true
      },
      ...config
    };

    this.initializeSystem();
  }

  private async initializeSystem(): Promise<void> {
    try {
      // Start monitoring if enabled
      if (this.config.monitoring.enabled) {
        await this.monitoring.startMonitoring();
      }

      // Initialize default admin user
      this.createDefaultUser();

      await createAuditLog({
        action: AuditActions.USER_UPDATE,
        resource: 'dashboard_orchestrator',
        resourceId: 'initialization',
        details: {
          analyticsEnabled: this.config.analytics.enabled,
          monitoringEnabled: this.config.monitoring.enabled,
          campaignsEnabled: this.config.campaigns.enabled
        }
      });

    } catch (error) {
      console.error('Dashboard orchestrator initialization failed:', error);
    }
  }

  private createDefaultUser(): void {
    const defaultUser: DashboardUser = {
      id: 'admin_default',
      name: 'System Administrator',
      email: 'admin@coindaily.africa',
      role: 'admin',
      permissions: {
        analytics: true,
        monitoring: true,
        campaigns: true,
        systemManagement: true
      },
      preferences: {
        defaultDashboard: 'overview',
        timezone: 'UTC',
        notifications: true
      }
    };

    this.users.set(defaultUser.id, defaultUser);
  }

  async createUserSession(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    
    try {
      const user = this.users.get(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const sessionId = `session_${userId}_${Date.now()}`;
      const session: DashboardSession = {
        id: sessionId,
        userId,
        startTime: new Date(),
        lastActivity: new Date(),
        ipAddress,
        userAgent,
        active: true
      };

      this.activeSessions.set(sessionId, session);

      await createAuditLog({
        action: AuditActions.USER_LOGIN,
        resource: 'dashboard_session',
        resourceId: sessionId,
        details: {
          userId,
          userRole: user.role,
          ipAddress,
          userAgent: userAgent.substring(0, 100)
        }
      });

      return {
        success: true,
        sessionId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session creation failed';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getUnifiedDashboard(sessionId: string): Promise<UnifiedDashboard | null> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.active) {
        return null;
      }

      const user = this.users.get(session.userId);
      if (!user) {
        return null;
      }

      // Update session activity
      session.lastActivity = new Date();
      this.activeSessions.set(sessionId, session);

      // Gather data based on user permissions
      const [
        analyticsData,
        monitoringData,
        campaignsData
      ] = await Promise.allSettled([
        user.permissions.analytics ? this.getAnalyticsData() : Promise.resolve(null),
        user.permissions.monitoring ? this.getMonitoringData() : Promise.resolve(null),
        user.permissions.campaigns ? this.getCampaignsData() : Promise.resolve(null)
      ]);

      const analytics = analyticsData.status === 'fulfilled' ? analyticsData.value : null;
      const monitoring = monitoringData.status === 'fulfilled' ? monitoringData.value : null;
      const campaigns = campaignsData.status === 'fulfilled' ? campaignsData.value : null;

      const dashboard: UnifiedDashboard = {
        overview: {
          systemHealth: monitoring?.status === 'operational' ? 'healthy' : 
                       monitoring?.status === 'degraded' ? 'warning' : 
                       monitoring?.status === 'outage' ? 'critical' :
                       monitoring?.status === 'maintenance' ? 'warning' : 'healthy',
          totalArticles: analytics?.overview.totalArticles || 0,
          activeCampaigns: campaigns?.active || 0,
          totalUsers: 45678, // Mock data
          engagementRate: analytics?.keyMetrics.emailOpenRate || 0,
          alerts: [
            ...(monitoring?.metrics?.alerts || []).map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              message: alert.message,
              timestamp: alert.timestamp
            })),
            ...(analytics?.alerts || []).map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              message: alert.message,
              timestamp: alert.timestamp
            }))
          ].slice(0, 10) // Show only top 10 alerts
        },
        analytics: {
          summary: analytics || await this.getEmptyAnalyticsSummary(),
          quickMetrics: {
            todayViews: 12543,
            yesterdayViews: 11876,
            viewsGrowth: 5.6,
            emailOpenRate: analytics?.keyMetrics.emailOpenRate || 0,
            pushClickRate: analytics?.keyMetrics.pushClickRate || 0,
            socialEngagement: analytics?.keyMetrics.socialEngagement || 0
          }
        },
        monitoring: {
          status: monitoring || await this.getEmptyMonitoringStatus(),
          liveMetrics: {
            requestsPerMinute: monitoring?.metrics.overall.requestsPerMinute || 0,
            averageResponseTime: monitoring?.metrics.performance.averageResponseTime || 0,
            systemsOnline: monitoring?.metrics.systems.filter(s => s.status === 'healthy').length || 0,
            systemsTotal: monitoring?.metrics.systems.length || 5
          }
        },
        campaigns: {
          summary: campaigns || await this.getEmptyCampaignsSummary(),
          recent: await this.getRecentCampaigns(5)
        },
        notifications: this.getUnreadNotifications()
      };

      await createAuditLog({
        action: AuditActions.USER_UPDATE,
        resource: 'dashboard_view',
        resourceId: sessionId,
        details: {
          userId: user.id,
          sectionsAccessed: Object.keys(dashboard)
        }
      });

      return dashboard;

    } catch (error) {
      console.error('Failed to generate unified dashboard:', error);
      return null;
    }
  }

  private async getAnalyticsData() {
    const timeframe = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date(),
      period: 'day' as const
    };

    return await this.analytics.getDashboardSummary(timeframe);
  }

  private async getMonitoringData() {
    return await this.monitoring.getDashboard();
  }

  private async getCampaignsData() {
    return await this.campaigns.getCampaignPerformanceSummary();
  }

  private async getEmptyAnalyticsSummary() {
    const timeframe = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
      period: 'day' as const
    };

    return {
      timeframe,
      overview: {
        totalArticles: 0,
        totalViews: 0,
        totalEngagement: 0,
        averageEngagementRate: 0,
        topPerformingCategory: ''
      },
      systemHealth: {
        overallHealth: 'healthy' as const,
        systemsUp: 0,
        systemsDown: 0,
        criticalErrors: 0
      },
      keyMetrics: {
        emailOpenRate: 0,
        pushClickRate: 0,
        videoViewTime: 0,
        socialEngagement: 0,
        aiOptimizationImpact: 0
      },
      alerts: []
    };
  }

  private async getEmptyMonitoringStatus() {
    return {
      status: 'operational' as const,
      uptime: {
        current: 0,
        last24h: 0,
        last7d: 0,
        last30d: 0
      },
      incidents: [],
      metrics: {
        timestamp: new Date(),
        overall: {
          articlesProcessed: 0,
          totalUsers: 0,
          activeConnections: 0,
          requestsPerMinute: 0
        },
        systems: [],
        alerts: [],
        performance: {
          averageResponseTime: 0,
          totalErrors: 0,
          successRate: 0,
          healthScore: 0
        }
      }
    };
  }

  private async getEmptyCampaignsSummary() {
    return {
      total: 0,
      active: 0,
      completed: 0,
      failed: 0,
      totalReach: 0,
      averageEngagement: 0,
      topPerforming: []
    };
  }

  private async getRecentCampaigns(limit: number = 5) {
    const campaigns = await this.campaigns.getCampaigns();
    
    return campaigns.slice(0, limit).map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      performance: campaign.performance.sent > 0 ? 
        (campaign.performance.clicked / campaign.performance.sent) * 100 : 0,
      lastUpdate: campaign.updatedAt
    }));
  }

  private getUnreadNotifications(): UnifiedDashboard['notifications'] {
    // Return user-specific notifications
    return this.notifications
      .filter(notification => !notification.read)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  async generateSystemReport(
    timeframe: { start: Date; end: Date; period: string },
    sections: Array<'executive' | 'analytics' | 'system' | 'campaigns'> = ['executive', 'analytics', 'system', 'campaigns']
  ): Promise<SystemReport> {
    
    try {
      const reportId = `report_${Date.now()}`;
      
      const [analyticsData, monitoringData, campaignsData] = await Promise.allSettled([
        this.analytics.getDashboardSummary({
          start: timeframe.start,
          end: timeframe.end,
          period: timeframe.period as 'day'
        }),
        this.monitoring.getDashboard(),
        this.campaigns.getCampaignPerformanceSummary()
      ]);

      const analytics = analyticsData.status === 'fulfilled' ? analyticsData.value : null;
      const monitoring = monitoringData.status === 'fulfilled' ? monitoringData.value : null;
      const campaigns = campaignsData.status === 'fulfilled' ? campaignsData.value : null;

      const report: SystemReport = {
        reportId,
        generatedAt: new Date(),
        timeframe,
        sections: {
          executive: sections.includes('executive') ? {
            summary: this.generateExecutiveSummary(analytics, monitoring, campaigns),
            keyMetrics: {
              totalArticles: analytics?.overview.totalArticles || 0,
              averageEngagement: analytics?.overview.averageEngagementRate || 0,
              systemUptime: monitoring?.uptime.current || 0,
              activeCampaigns: campaigns?.active || 0,
              totalReach: campaigns?.totalReach || 0
            },
            recommendations: this.generateRecommendations(analytics, monitoring, campaigns)
          } : {
            summary: '',
            keyMetrics: {},
            recommendations: []
          },
          analytics: sections.includes('analytics') ? {
            contentPerformance: analytics?.overview || {},
            audienceInsights: {}, 
            trends: {} 
          } : {
            contentPerformance: {},
            audienceInsights: {},
            trends: {}
          },
          system: sections.includes('system') ? {
            uptime: monitoring?.uptime || {},
            performance: monitoring?.metrics.performance || {},
            incidents: monitoring?.incidents || []
          } : {
            uptime: {},
            performance: {},
            incidents: []
          },
          campaigns: sections.includes('campaigns') ? {
            performance: campaigns || {},
            roi: {
              totalInvestment: 50000, // Mock data
              totalRevenue: 75000,
              roi: 50
            },
            optimization: [
              'Increase email send frequency for better engagement',
              'Focus on video content for higher reach',
              'Optimize send times based on audience timezone'
            ]
          } : {
            performance: {},
            roi: {},
            optimization: []
          }
        },
        charts: await this.generateReportCharts(analytics, monitoring, campaigns)
      };

      await createAuditLog({
        action: AuditActions.USER_UPDATE,
        resource: 'system_report',
        resourceId: reportId,
        details: {
          timeframe,
          sections,
          totalArticles: report.sections.executive.keyMetrics?.totalArticles || 0
        }
      });

      return report;

    } catch (error) {
      console.error('System report generation failed:', error);
      throw new Error('Failed to generate system report');
    }
  }

  private generateExecutiveSummary(
    analytics: Awaited<ReturnType<ComprehensiveAnalyticsSystem['getDashboardSummary']>> | null,
    monitoring: Awaited<ReturnType<RealTimeMonitoringSystem['getDashboard']>> | null,
    campaigns: Awaited<ReturnType<CampaignManagementSystem['getCampaignPerformanceSummary']>> | null
  ): string {
    
    const articlesCount = analytics?.overview.totalArticles || 0;
    const engagementRate = analytics?.overview.averageEngagementRate || 0;
    const systemHealth = monitoring?.status || 'operational';
    const activeCampaigns = campaigns?.active || 0;

    return `
    Executive Summary:
    
    During this reporting period, the CoinDaily Africa platform processed ${articlesCount} articles 
    with an average engagement rate of ${engagementRate.toFixed(1)}%. The system maintained 
    ${systemHealth} status with ${activeCampaigns} active campaigns delivering content to our 
    African crypto community.
    
    Key highlights include strong performance in content distribution across multiple channels,
    with email and push notifications showing particularly strong engagement metrics. The AI 
    content optimization system continues to improve article performance, while our video 
    automation system has expanded reach across social media platforms.
    
    System reliability remained high with minimal downtime, and the campaign management system
    successfully orchestrated multi-channel distribution campaigns. Overall platform performance
    demonstrates strong growth in audience engagement and content reach.
    `;
  }

  private generateRecommendations(
    analytics: Awaited<ReturnType<ComprehensiveAnalyticsSystem['getDashboardSummary']>> | null,
    monitoring: Awaited<ReturnType<RealTimeMonitoringSystem['getDashboard']>> | null,
    campaigns: Awaited<ReturnType<CampaignManagementSystem['getCampaignPerformanceSummary']>> | null
  ): string[] {
    
    const recommendations: string[] = [];

    if (analytics) {
      if (analytics.keyMetrics.emailOpenRate < 25) {
        recommendations.push('Improve email subject lines and send time optimization');
      }
      if (analytics.keyMetrics.socialEngagement < 50) {
        recommendations.push('Increase social media content frequency and engagement');
      }
    }

    if (monitoring && monitoring.status !== 'operational') {
      recommendations.push('Address system performance issues to maintain high availability');
    }

    if (campaigns && campaigns.averageEngagement < 10) {
      recommendations.push('Optimize campaign targeting and content personalization');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current optimization strategies and explore new growth opportunities');
    }

    return recommendations;
  }

  private async generateReportCharts(
    analytics: Awaited<ReturnType<ComprehensiveAnalyticsSystem['getDashboardSummary']>> | null,
    monitoring: Awaited<ReturnType<RealTimeMonitoringSystem['getDashboard']>> | null,
    campaigns: Awaited<ReturnType<CampaignManagementSystem['getCampaignPerformanceSummary']>> | null
  ): Promise<SystemReport['charts']> {
    
    const charts: SystemReport['charts'] = [];

    // Engagement over time chart
    charts.push({
      type: 'line',
      title: 'Engagement Rate Over Time',
      data: [
        { date: '2024-01-01', value: 12.3 },
        { date: '2024-01-02', value: 13.1 },
        { date: '2024-01-03', value: 12.8 },
        { date: '2024-01-04', value: 14.2 },
        { date: '2024-01-05', value: 13.9 }
      ],
      metadata: { metric: 'engagement_rate', unit: 'percentage' }
    });

    // Channel performance chart
    charts.push({
      type: 'bar',
      title: 'Performance by Channel',
      data: [
        { channel: 'Email', engagement: analytics?.keyMetrics.emailOpenRate || 0 },
        { channel: 'Push', engagement: analytics?.keyMetrics.pushClickRate || 0 },
        { channel: 'Social', engagement: analytics?.keyMetrics.socialEngagement || 0 },
        { channel: 'Video', engagement: analytics?.keyMetrics.videoViewTime || 0 }
      ],
      metadata: { metric: 'engagement', unit: 'rate' }
    });

    // System health pie chart
    if (monitoring) {
      charts.push({
        type: 'pie',
        title: 'System Health Distribution',
        data: [
          { status: 'Healthy', count: monitoring.metrics.systems.filter(s => s.status === 'healthy').length },
          { status: 'Warning', count: monitoring.metrics.systems.filter(s => s.status === 'warning').length },
          { status: 'Critical', count: monitoring.metrics.systems.filter(s => s.status === 'critical').length }
        ],
        metadata: { metric: 'system_health', unit: 'count' }
      });
    }

    // Campaign ROI chart
    if (campaigns) {
      charts.push({
        type: 'area',
        title: 'Campaign ROI Trend',
        data: [
          { date: '2024-01-01', roi: 45 },
          { date: '2024-01-02', roi: 52 },
          { date: '2024-01-03', roi: 48 },
          { date: '2024-01-04', roi: 61 },
          { date: '2024-01-05', roi: 58 }
        ],
        metadata: { metric: 'roi', unit: 'percentage' }
      });
    }

    return charts;
  }

  async addNotification(notification: Omit<UnifiedDashboard['notifications'][0], 'id' | 'read'>): Promise<void> {
    const notificationWithId = {
      ...notification,
      id: `notification_${Date.now()}`,
      read: false
    };

    this.notifications.unshift(notificationWithId);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    notification.read = true;
    return { success: true };
  }

  async endUserSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      session.active = false;
      this.activeSessions.set(sessionId, session);

      await createAuditLog({
        action: AuditActions.USER_LOGOUT,
        resource: 'dashboard_session',
        resourceId: sessionId,
        details: {
          userId: session.userId,
          sessionDuration: Date.now() - session.startTime.getTime()
        }
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session end failed';
      return { success: false, error: errorMessage };
    }
  }

  async getSystemStatus(): Promise<{
    status: 'operational' | 'degraded' | 'outage';
    components: Array<{
      name: string;
      status: 'operational' | 'degraded' | 'outage';
      description?: string;
    }>;
    uptime: Record<string, number>;
  }> {
    
    const monitoringStatus = await this.monitoring.getDashboard();
    
    return {
      status: monitoringStatus.status === 'maintenance' ? 'degraded' : monitoringStatus.status,
      components: [
        {
          name: 'Analytics System',
          status: this.config.analytics.enabled ? 'operational' : 'outage',
          description: 'Content and performance analytics'
        },
        {
          name: 'Monitoring System',
          status: this.config.monitoring.enabled ? 'operational' : 'outage',
          description: 'Real-time system monitoring'
        },
        {
          name: 'Campaign Management',
          status: this.config.campaigns.enabled ? 'operational' : 'outage',
          description: 'Distribution campaign management'
        },
        {
          name: 'Content Distribution',
          status: monitoringStatus.status === 'operational' ? 'operational' : 'degraded',
          description: 'Multi-channel content distribution'
        }
      ],
      uptime: monitoringStatus.uptime
    };
  }

  destroy(): void {
    this.monitoring.stopMonitoring();
    this.campaigns.destroy();
  }
}

// Export interfaces for use in other modules
export type { UnifiedDashboard, DashboardUser, DashboardSession, SystemReport };
