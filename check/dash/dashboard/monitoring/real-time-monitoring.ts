// Real-Time System Monitoring for Phase 4 Dashboard
// Monitors all distribution systems with live updates and alerts

import { Phase3DistributionOrchestrator } from '@/distribution/phase3-orchestrator';
import { createAuditLog, AuditActions } from '@/lib/audit';

interface MonitoringConfig {
  checkInterval: number; // milliseconds
  alertThresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    uptime: number; // percentage
    queueSize: number; // number of items
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook?: string;
  };
}

interface SystemStatus {
  system: 'video' | 'email' | 'push' | 'ai' | 'social' | 'orchestrator';
  status: 'healthy' | 'warning' | 'critical' | 'down';
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    throughput: number;
    queueSize: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  lastCheck: Date;
  lastError?: {
    message: string;
    timestamp: Date;
    stack?: string;
  };
}

interface Alert {
  id: string;
  system: SystemStatus['system'];
  type: 'performance' | 'error' | 'threshold' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface LiveMetrics {
  timestamp: Date;
  overall: {
    articlesProcessed: number;
    totalUsers: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
  systems: SystemStatus[];
  alerts: Alert[];
  performance: {
    averageResponseTime: number;
    totalErrors: number;
    successRate: number;
    healthScore: number;
  };
}

interface AlertRule {
  id: string;
  system: SystemStatus['system'];
  metric: keyof SystemStatus['metrics'];
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: Alert['severity'];
  enabled: boolean;
  description: string;
}

interface MonitoringDashboard {
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  uptime: {
    current: number;
    last24h: number;
    last7d: number;
    last30d: number;
  };
  incidents: Array<{
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    severity: 'minor' | 'major' | 'critical';
    startTime: Date;
    endTime?: Date;
    updates: Array<{
      timestamp: Date;
      message: string;
      status: string;
    }>;
  }>;
  metrics: LiveMetrics;
}

export class RealTimeMonitoringSystem {
  private orchestrator: Phase3DistributionOrchestrator;
  private config: MonitoringConfig;
  private activeAlerts: Map<string, Alert> = new Map();
  private alertRules: AlertRule[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsHistory: LiveMetrics[] = [];
  private websocketConnections: Set<WebSocket> = new Set();

  constructor(config?: Partial<MonitoringConfig>) {
    this.orchestrator = new Phase3DistributionOrchestrator();
    
    this.config = {
      checkInterval: 30000, // 30 seconds
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 10, // 10%
        uptime: 95, // 95%
        queueSize: 1000 // 1000 items
      },
      notifications: {
        email: true,
        slack: true
      },
      ...config
    };

    this.initializeAlertRules();
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'response_time_high',
        system: 'orchestrator',
        metric: 'responseTime',
        operator: 'gt',
        threshold: this.config.alertThresholds.responseTime,
        severity: 'high',
        enabled: true,
        description: 'System response time is too high'
      },
      {
        id: 'error_rate_high',
        system: 'orchestrator',
        metric: 'errorRate',
        operator: 'gt',
        threshold: this.config.alertThresholds.errorRate,
        severity: 'critical',
        enabled: true,
        description: 'Error rate is above acceptable threshold'
      },
      {
        id: 'uptime_low',
        system: 'orchestrator',
        metric: 'uptime',
        operator: 'lt',
        threshold: this.config.alertThresholds.uptime,
        severity: 'critical',
        enabled: true,
        description: 'System uptime is below threshold'
      },
      {
        id: 'queue_size_high',
        system: 'orchestrator',
        metric: 'queueSize',
        operator: 'gt',
        threshold: this.config.alertThresholds.queueSize,
        severity: 'medium',
        enabled: true,
        description: 'Processing queue is getting large'
      },
      {
        id: 'memory_usage_high',
        system: 'orchestrator',
        metric: 'memoryUsage',
        operator: 'gt',
        threshold: 85, // 85%
        severity: 'high',
        enabled: true,
        description: 'Memory usage is high'
      }
    ];
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    await createAuditLog({
      action: AuditActions.USER_UPDATE,
      resource: 'monitoring_system',
      resourceId: 'start',
      details: {
        checkInterval: this.config.checkInterval,
        alertRulesCount: this.alertRules.filter(r => r.enabled).length
      }
    });

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    }, this.config.checkInterval);

    // Perform initial check
    await this.performHealthCheck();
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    await createAuditLog({
      action: AuditActions.USER_UPDATE,
      resource: 'monitoring_system',
      resourceId: 'stop',
      details: {
        runtime: Date.now(),
        alertsGenerated: this.activeAlerts.size
      }
    });
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Get system health from orchestrator
      const orchestratorHealth = await this.orchestrator.healthCheck();
      const activeProcessing = this.orchestrator.getActiveProcessing();
      
      // Generate system statuses
      const systems: SystemStatus[] = await this.generateSystemStatuses(orchestratorHealth, activeProcessing);
      
      // Check for alerts
      await this.checkAlerts(systems);
      
      // Create live metrics
      const metrics: LiveMetrics = {
        timestamp,
        overall: {
          articlesProcessed: orchestratorHealth.metrics.totalArticlesProcessed,
          totalUsers: 45678, // Mock data - would come from user service
          activeConnections: this.websocketConnections.size,
          requestsPerMinute: 150 // Mock data - would come from analytics
        },
        systems,
        alerts: Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved),
        performance: {
          averageResponseTime: this.calculateAverageResponseTime(systems),
          totalErrors: this.countTotalErrors(systems),
          successRate: this.calculateSuccessRate(systems),
          healthScore: this.calculateHealthScore(systems)
        }
      };

      // Store metrics history (keep last 24 hours)
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 2880) { // 24 hours at 30-second intervals
        this.metricsHistory.shift();
      }

      // Broadcast to connected clients
      this.broadcastMetrics(metrics);

    } catch (error) {
      console.error('Health check failed:', error);
      
      // Generate critical alert for monitoring system failure
      await this.generateAlert({
        system: 'orchestrator',
        type: 'error',
        severity: 'critical',
        message: `Monitoring system health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: error instanceof Error ? error.stack : undefined }
      });
    }
  }

  private async generateSystemStatuses(
    orchestratorHealth: Awaited<ReturnType<typeof this.orchestrator.healthCheck>>,
    activeProcessing: ReturnType<typeof this.orchestrator.getActiveProcessing>
  ): Promise<SystemStatus[]> {
    
    const systems: SystemStatus[] = [];
    
    // Map orchestrator systems to our monitoring format
    Object.entries(orchestratorHealth.systems).forEach(([systemName, health]) => {
      const system = systemName as SystemStatus['system'];
      
      systems.push({
        system,
        status: health.status === 'up' ? 'healthy' : 'down',
        metrics: {
          responseTime: health.responseTime || 0,
          errorRate: Math.random() * 5, // Mock error rate
          uptime: health.status === 'up' ? 99.5 : 0,
          throughput: Math.random() * 100 + 50,
          queueSize: activeProcessing.length,
          memoryUsage: Math.random() * 30 + 40, // 40-70%
          cpuUsage: Math.random() * 50 + 20 // 20-70%
        },
        lastCheck: new Date()
      });
    });

    // Add orchestrator system
    systems.push({
      system: 'orchestrator',
      status: orchestratorHealth.status === 'healthy' ? 'healthy' : 
              orchestratorHealth.status === 'degraded' ? 'warning' : 'critical',
      metrics: {
        responseTime: 150, // Mock response time
        errorRate: 2.1,
        uptime: 99.8,
        throughput: orchestratorHealth.metrics.totalArticlesProcessed,
        queueSize: activeProcessing.length,
        memoryUsage: 65,
        cpuUsage: 45
      },
      lastCheck: new Date()
    });

    return systems;
  }

  private async checkAlerts(systems: SystemStatus[]): Promise<void> {
    for (const system of systems) {
      for (const rule of this.alertRules) {
        if (!rule.enabled || rule.system !== system.system) {
          continue;
        }

        const metricValue = system.metrics[rule.metric];
        const shouldAlert = this.evaluateAlertRule(metricValue, rule);

        if (shouldAlert) {
          await this.generateAlert({
            system: system.system,
            type: 'threshold',
            severity: rule.severity,
            message: `${rule.description}: ${rule.metric} is ${metricValue} (threshold: ${rule.threshold})`,
            metadata: {
              rule: rule.id,
              metricValue,
              threshold: rule.threshold
            }
          });
        }
      }
    }
  }

  private evaluateAlertRule(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'eq': return value === rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lte': return value <= rule.threshold;
      default: return false;
    }
  }

  private async generateAlert(alertData: {
    system: SystemStatus['system'];
    type: Alert['type'];
    severity: Alert['severity'];
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    
    const alertId = `${alertData.system}_${alertData.type}_${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      alert => alert.system === alertData.system && 
               alert.type === alertData.type && 
               !alert.resolved &&
               alert.message === alertData.message
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: alertId,
      system: alertData.system,
      type: alertData.type,
      severity: alertData.severity,
      message: alertData.message,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: alertData.metadata
    };

    this.activeAlerts.set(alertId, alert);

    // Send notifications
    await this.sendAlertNotifications(alert);

    // Log the alert
    await createAuditLog({
      action: AuditActions.USER_UPDATE,
      resource: 'monitoring_alert',
      resourceId: alertId,
      details: {
        system: alert.system,
        severity: alert.severity,
        message: alert.message
      }
    });
  }

  private async sendAlertNotifications(alert: Alert): Promise<void> {
    try {
      if (this.config.notifications.email) {
        // Send email notification (would integrate with email service)
        console.log(`Email alert: ${alert.message}`);
      }

      if (this.config.notifications.slack) {
        // Send Slack notification (would integrate with Slack API)
        console.log(`Slack alert: ${alert.message}`);
      }

      if (this.config.notifications.webhook) {
        // Send webhook notification
        await fetch(this.config.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      }
    } catch (error) {
      console.error('Failed to send alert notifications:', error);
    }
  }

  private calculateAverageResponseTime(systems: SystemStatus[]): number {
    if (systems.length === 0) return 0;
    return systems.reduce((sum, system) => sum + system.metrics.responseTime, 0) / systems.length;
  }

  private countTotalErrors(systems: SystemStatus[]): number {
    return systems.reduce((sum, system) => sum + (system.metrics.errorRate / 100 * system.metrics.throughput), 0);
  }

  private calculateSuccessRate(systems: SystemStatus[]): number {
    if (systems.length === 0) return 100;
    const averageErrorRate = systems.reduce((sum, system) => sum + system.metrics.errorRate, 0) / systems.length;
    return Math.max(0, 100 - averageErrorRate);
  }

  private calculateHealthScore(systems: SystemStatus[]): number {
    if (systems.length === 0) return 100;
    
    const healthyCount = systems.filter(s => s.status === 'healthy').length;
    const warningCount = systems.filter(s => s.status === 'warning').length;
    const criticalCount = systems.filter(s => s.status === 'critical').length;
    const downCount = systems.filter(s => s.status === 'down').length;
    
    const score = (healthyCount * 100 + warningCount * 70 + criticalCount * 30 + downCount * 0) / systems.length;
    return Math.round(score);
  }

  private broadcastMetrics(metrics: LiveMetrics): void {
    const message = JSON.stringify({ type: 'metrics', data: metrics });
    
    this.websocketConnections.forEach(ws => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        } else {
          this.websocketConnections.delete(ws);
        }
      } catch (error) {
        console.error('Failed to send websocket message:', error);
        this.websocketConnections.delete(ws);
      }
    });
  }

  async getDashboard(): Promise<MonitoringDashboard> {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    
    if (!latestMetrics) {
      throw new Error('No metrics available - monitoring may not be started');
    }

    return {
      status: this.determineOverallStatus(latestMetrics),
      uptime: this.calculateUptimeStats(),
      incidents: await this.getRecentIncidents(),
      metrics: latestMetrics
    };
  }

  private determineOverallStatus(metrics: LiveMetrics): MonitoringDashboard['status'] {
    const criticalAlerts = metrics.alerts.filter(a => a.severity === 'critical' && !a.resolved);
    const downSystems = metrics.systems.filter(s => s.status === 'down');
    
    if (criticalAlerts.length > 0 || downSystems.length > 0) {
      return 'outage';
    }
    
    const highAlerts = metrics.alerts.filter(a => a.severity === 'high' && !a.resolved);
    const warningSystems = metrics.systems.filter(s => s.status === 'warning');
    
    if (highAlerts.length > 0 || warningSystems.length > 0) {
      return 'degraded';
    }
    
    return 'operational';
  }

  private calculateUptimeStats(): MonitoringDashboard['uptime'] {
    // In a real implementation, this would calculate from historical data
    return {
      current: 99.8,
      last24h: 99.6,
      last7d: 99.9,
      last30d: 99.7
    };
  }

  private async getRecentIncidents(): Promise<MonitoringDashboard['incidents']> {
    // Mock incidents - in production would fetch from incident management system
    return [
      {
        id: 'inc_001',
        title: 'Email System Slow Response',
        status: 'resolved',
        severity: 'minor',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updates: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            message: 'Investigating slow email delivery',
            status: 'investigating'
          },
          {
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            message: 'Issue resolved - email service back to normal',
            status: 'resolved'
          }
        ]
      }
    ];
  }

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return { success: false, error: 'Alert not found' };
      }

      alert.acknowledged = true;
      this.activeAlerts.set(alertId, alert);

      await createAuditLog({
        action: AuditActions.USER_UPDATE,
        resource: 'monitoring_alert',
        resourceId: alertId,
        details: {
          action: 'acknowledged',
          system: alert.system
        }
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async resolveAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return { success: false, error: 'Alert not found' };
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.activeAlerts.set(alertId, alert);

      await createAuditLog({
        action: AuditActions.USER_UPDATE,
        resource: 'monitoring_alert',
        resourceId: alertId,
        details: {
          action: 'resolved',
          system: alert.system,
          duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
        }
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async getMetricsHistory(hours: number = 24): Promise<LiveMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(metrics => metrics.timestamp >= cutoff);
  }

  addWebSocketConnection(ws: WebSocket): void {
    this.websocketConnections.add(ws);
    
    // Send current metrics immediately
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (latestMetrics) {
      ws.send(JSON.stringify({ type: 'metrics', data: latestMetrics }));
    }
  }

  removeWebSocketConnection(ws: WebSocket): void {
    this.websocketConnections.delete(ws);
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<{ success: boolean; error?: string }> {
    try {
      const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
      if (ruleIndex === -1) {
        return { success: false, error: 'Alert rule not found' };
      }

      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };

      await createAuditLog({
        action: AuditActions.USER_UPDATE,
        resource: 'alert_rule',
        resourceId: ruleId,
        details: {
          updates,
          enabled: this.alertRules[ruleIndex].enabled
        }
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }
}
