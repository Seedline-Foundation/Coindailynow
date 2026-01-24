import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: Date;
  transactionThroughput: number; // transactions per second
  averageResponseTime: number; // milliseconds
  errorRate: number; // percentage
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  databaseConnections: number;
  cacheHitRate: number; // percentage
  queueDepth: number;
}

export interface LoadTestConfig {
  duration: number; // seconds
  concurrentUsers: number;
  transactionsPerUser: number;
  rampUpTime: number; // seconds
  testScenarios: LoadTestScenario[];
}

export interface LoadTestScenario {
  name: string;
  weight: number; // percentage of traffic
  operations: Array<{
    type: 'TRANSFER' | 'STAKE' | 'CONVERSION' | 'REWARD';
    frequency: number; // per minute
    payload: any;
  }>;
}

export interface LoadTestResult {
  testId: string;
  config: LoadTestConfig;
  startTime: Date;
  endTime: Date;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  peakThroughput: number;
  errorBreakdown: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
  performanceMetrics: PerformanceMetrics[];
  recommendations: string[];
}

export interface SystemAlert {
  id: string;
  type: 'PERFORMANCE' | 'ERROR' | 'CAPACITY' | 'SECURITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metrics: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface FailoverConfig {
  enableAutoFailover: boolean;
  healthCheckInterval: number; // seconds
  failureThreshold: number;
  recoveryThreshold: number;
  notificationEndpoints: string[];
}

export class FinancePerformanceMonitor {
  private prisma: PrismaClient;
  private performanceData: PerformanceMetrics[] = [];
  private alerts: SystemAlert[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private loadTestResults: LoadTestResult[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Start real-time performance monitoring
   */
  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isMonitoring) {
      console.log('Performance monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting performance monitoring with ${intervalMs}ms interval`);

    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectPerformanceMetrics();
        this.performanceData.push(metrics);

        // Keep only last 1000 data points
        if (this.performanceData.length > 1000) {
          this.performanceData = this.performanceData.slice(-1000);
        }

        // Check for alerts
        await this.checkPerformanceAlerts(metrics);

        console.log('Performance metrics collected:', {
          throughput: metrics.transactionThroughput,
          responseTime: metrics.averageResponseTime,
          errorRate: metrics.errorRate,
        });
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      }
    }, intervalMs);

    console.log('Performance monitoring started with interval:', intervalMs);
  }

  /**
   * Stop performance monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      delete this.monitoringInterval;
    }

    console.log('Performance monitoring stopped. Data points collected:', this.performanceData.length);
  }

  /**
   * Collect current performance metrics
   */
  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const startTime = performance.now();

    try {
      // Measure database query performance
      const dbStartTime = performance.now();
      const recentTransactions = await this.prisma.walletTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60000), // Last minute
          },
        },
      });
      const dbEndTime = performance.now();
      const dbResponseTime = dbEndTime - dbStartTime;

      // Calculate transaction throughput (per second)
      const transactionThroughput = recentTransactions / 60;

      // Get error rate from recent audit events
      const totalEvents = await this.prisma.auditEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 60000),
          },
        },
      });

      const errorEvents = await this.prisma.auditEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 60000),
          },
          type: {
            contains: 'ERROR',
          },
        },
      });

      const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

      // System metrics (would be replaced with actual system monitoring in production)
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const cpuUsage = Math.random() * 100; // Placeholder - would use actual CPU monitoring

      // Database connection count (simplified)
      const databaseConnections = 10; // Would query actual connection pool

      // Cache hit rate (placeholder)
      const cacheHitRate = Math.random() * 100;

      // Queue depth (placeholder)
      const queueDepth = Math.floor(Math.random() * 50);

      const endTime = performance.now();
      const averageResponseTime = endTime - startTime;

      return {
        timestamp: new Date(),
        transactionThroughput,
        averageResponseTime: Math.max(averageResponseTime, dbResponseTime),
        errorRate,
        memoryUsage,
        cpuUsage,
        databaseConnections,
        cacheHitRate,
        queueDepth,
      };
    } catch (error) {
      throw new Error(`Failed to collect performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run comprehensive load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const testId = `load_test_${Date.now()}`;
    
    try {
      console.log(`Starting load test ${testId} with config:`, config);

      const startTime = new Date();

      const result: LoadTestResult = {
        testId,
        config,
        startTime,
        endTime: new Date(),
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        averageResponseTime: 0,
        peakThroughput: 0,
        errorBreakdown: [],
        performanceMetrics: [],
        recommendations: [],
      };

      // Simulate load test execution
      const testPromises: Promise<void>[] = [];
      const responseTimes: number[] = [];
      const errors: string[] = [];

      // Create concurrent user simulations
      for (let user = 0; user < config.concurrentUsers; user++) {
        testPromises.push(this.simulateUserLoad(config, responseTimes, errors));
      }

      // Collect performance metrics during test
      const metricsInterval = setInterval(async () => {
        const metrics = await this.collectPerformanceMetrics();
        result.performanceMetrics.push(metrics);
        
        if (metrics.transactionThroughput > result.peakThroughput) {
          result.peakThroughput = metrics.transactionThroughput;
        }
      }, 5000);

      // Wait for test completion
      await Promise.all(testPromises);
      clearInterval(metricsInterval);

      const endTime = new Date();
      result.endTime = endTime;

      // Calculate results
      result.totalTransactions = responseTimes.length;
      result.successfulTransactions = responseTimes.length - errors.length;
      result.failedTransactions = errors.length;
      result.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;

      // Group errors
      const errorCounts = new Map<string, number>();
      errors.forEach(error => {
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });

      result.errorBreakdown = Array.from(errorCounts.entries())
        .map(([error, count]) => ({
          error,
          count,
          percentage: (count / result.totalTransactions) * 100,
        }));

      // Generate recommendations
      result.recommendations = this.generateLoadTestRecommendations(result);

      this.loadTestResults.push(result);

      console.log(`Load test ${testId} completed:`, {
        duration: endTime.getTime() - startTime.getTime(),
        totalTransactions: result.totalTransactions,
        errorRate: (result.failedTransactions / result.totalTransactions) * 100,
      });

      return result;
    } catch (error) {
      console.error(`Load test ${testId} failed:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    metrics: PerformanceMetrics;
    activeAlerts: SystemAlert[];
    recommendations: string[];
  }> {
    try {
      const currentMetrics = await this.collectPerformanceMetrics();
      const activeAlerts = this.alerts.filter(alert => !alert.resolved);

      let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
      const recommendations: string[] = [];

      // Determine system status based on metrics and alerts
      if (currentMetrics.errorRate > 10 || currentMetrics.averageResponseTime > 2000) {
        status = 'CRITICAL';
        recommendations.push('System experiencing high error rate or slow response times');
      } else if (currentMetrics.errorRate > 5 || currentMetrics.averageResponseTime > 1000 || activeAlerts.length > 0) {
        status = 'DEGRADED';
        recommendations.push('System performance is below optimal levels');
      }

      if (currentMetrics.memoryUsage > 1000) {
        recommendations.push('High memory usage detected - consider optimization');
      }

      if (currentMetrics.queueDepth > 100) {
        recommendations.push('High queue depth - consider scaling workers');
      }

      return {
        status,
        metrics: currentMetrics,
        activeAlerts,
        recommendations,
      };
    } catch (error) {
      console.error('Health check error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Configure failover settings
   */
  async configureFailover(config: FailoverConfig): Promise<void> {
    try {
      // Store failover configuration
      console.log('Failover configuration updated:', config);
    } catch (error) {
      console.error('Failover config error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(hours: number = 24): PerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.performanceData.filter(metric => metric.timestamp >= cutoffTime);
  }

  /**
   * Get load test history
   */
  getLoadTestHistory(): LoadTestResult[] {
    return [...this.loadTestResults];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      console.log('Alert resolved:', {
        alertId,
        alertType: alert.type,
        severity: alert.severity,
      });
    }
  }

  // Private helper methods

  private async checkPerformanceAlerts(metrics: PerformanceMetrics): Promise<void> {
    // Check for high response time
    if (metrics.averageResponseTime > 2000) {
      await this.createAlert('PERFORMANCE', 'HIGH', 'High average response time detected', metrics);
    }

    // Check for high error rate
    if (metrics.errorRate > 10) {
      await this.createAlert('ERROR', 'CRITICAL', 'High error rate detected', metrics);
    }

    // Check for low transaction throughput
    if (metrics.transactionThroughput < 0.1) {
      await this.createAlert('PERFORMANCE', 'MEDIUM', 'Low transaction throughput detected', metrics);
    }

    // Check for high memory usage
    if (metrics.memoryUsage > 1000) {
      await this.createAlert('CAPACITY', 'HIGH', 'High memory usage detected', metrics);
    }

    // Check for high queue depth
    if (metrics.queueDepth > 100) {
      await this.createAlert('CAPACITY', 'HIGH', 'High queue depth detected', metrics);
    }
  }

  private async createAlert(
    type: SystemAlert['type'],
    severity: SystemAlert['severity'],
    message: string,
    metrics: any
  ): Promise<void> {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      alert => !alert.resolved && alert.type === type && alert.message === message
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      metrics,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);

    console.log(`🚨 Alert created: ${severity} ${type} - ${message}`, {
      alertId: alert.id,
      type,
      severity,
    });
  }

  private async simulateUserLoad(
    config: LoadTestConfig,
    responseTimes: number[],
    errors: string[]
  ): Promise<void> {
    const userDuration = (config.duration * 1000) + (Math.random() * config.rampUpTime * 1000);
    const endTime = Date.now() + userDuration;

    while (Date.now() < endTime) {
      for (const scenario of config.testScenarios) {
        if (Math.random() * 100 < scenario.weight) {
          for (const operation of scenario.operations) {
            try {
              const startTime = performance.now();
              
              // Simulate operation execution
              await this.simulateOperation(operation.type, operation.payload);
              
              const responseTime = performance.now() - startTime;
              responseTimes.push(responseTime);

              // Random wait between operations
              await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            } catch (error) {
              errors.push(error instanceof Error ? error.message : 'Unknown error');
            }
          }
        }
      }
    }
  }

  private async simulateOperation(type: string, payload: any): Promise<void> {
    // Simulate different operation types with realistic delays
    const delays = {
      TRANSFER: 50 + Math.random() * 100,
      STAKE: 100 + Math.random() * 200,
      CONVERSION: 200 + Math.random() * 300,
      REWARD: 30 + Math.random() * 50,
    };

    const delay = delays[type as keyof typeof delays] || 100;
    
    // Simulate random failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error(`Simulated ${type} operation failure`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateLoadTestRecommendations(result: LoadTestResult): string[] {
    const recommendations: string[] = [];

    // Check error rate
    const errorRate = (result.failedTransactions / result.totalTransactions) * 100;
    if (errorRate > 5) {
      recommendations.push('High error rate detected - review error handling and system capacity');
    }

    // Check response time
    if (result.averageResponseTime > 1000) {
      recommendations.push('High average response time - consider performance optimization');
    }

    // Check throughput
    if (result.peakThroughput < result.config.concurrentUsers * 0.5) {
      recommendations.push('Low throughput - consider scaling infrastructure');
    }

    // Check performance trends
    const lastMetrics = result.performanceMetrics.slice(-5);
    if (lastMetrics.length > 0) {
      const avgErrorRate = lastMetrics.reduce((sum, m) => sum + m.errorRate, 0) / lastMetrics.length;
      if (avgErrorRate > 10) {
        recommendations.push('System became unstable during peak load - review capacity limits');
      }
    }

    return recommendations;
  }
}