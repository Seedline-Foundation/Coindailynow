import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

// Type-safe workaround for Prisma client caching issues
const createExtendedPrismaClient = (prisma: PrismaClient) => {
  return prisma as any;
};

export interface AuditEventInput {
  type: 'authentication' | 'authorization' | 'data_access' | 'configuration_change' | 'security_event' | 'system_event';
  action: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resource?: string | null;
  success: boolean;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

export interface AuditEventRecord {
  id: string;
  type: string;
  action: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resource?: string | null;
  timestamp: Date;
  success: boolean;
  severity: string;
  category: string;
  details?: string | null;
}

export interface AuditConfig {
  enabled: boolean;
  retentionPeriod: number; // days
  detailedLogging: boolean;
}

export interface AuditTrail {
  events: AuditEventRecord[];
  totalCount: number;
  filters: {
    userId?: string;
    type?: string;
    action?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface AuditAnalytics {
  totalEvents: number;
  successRate: number;
  eventsByType: Record<string, number>;
  topUsers: Array<{ userId: string; count: number }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * SecurityAuditService - Comprehensive audit trail management
 * 
 * Provides enterprise-grade audit logging with batch processing,
 * real-time analytics, and compliance reporting capabilities.
 * 
 * Features:
 * - Automatic event logging with context
 * - Batch processing for high-throughput scenarios
 * - Configurable retention policies
 * - Real-time audit analytics
 * - Compliance reporting (GDPR, CCPA, POPIA)
 */
export class SecurityAuditService extends EventEmitter {
  private readonly prisma: any;
  private readonly redis: Redis;
  private readonly config: AuditConfig;
  private readonly eventBuffer: AuditEventRecord[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    config: Partial<AuditConfig> = {}
  ) {
    super();
    this.prisma = createExtendedPrismaClient(prisma);
    this.redis = redis;
    this.config = {
      enabled: true,
      retentionPeriod: 365, // 1 year default
      detailedLogging: true,
      ...config,
    };

    logger.info('Audit batch processor started');
  }

  /**
   * Log a single audit event
   */
  async logEvent(event: AuditEventInput): Promise<string> {
    const auditEvent: AuditEventRecord = {
      id: this.generateEventId(),
      type: event.type,
      action: event.action,
      userId: event.userId || null,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
      resource: event.resource || null,
      timestamp: new Date(),
      success: event.success,
      severity: event.severity || 'low',
      category: event.category || 'general',
      details: event.details ? JSON.stringify(event.details) : null,
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(auditEvent);

    // Trigger batch processing if buffer is full
    if (this.eventBuffer.length >= this.BATCH_SIZE) {
      await this.processBatch();
    } else if (!this.batchTimer) {
      // Set timer for batch processing
      this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT);
    }

    this.emit('audit_event', auditEvent);
    return auditEvent.id;
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    action: string,
    userId: string | null,
    success: boolean,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    return this.logEvent({
      type: 'authentication',
      action,
      userId,
      success,
      severity,
      category: 'auth',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: string,
    userId: string | null,
    resource: string,
    success: boolean,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<string> {
    return this.logEvent({
      type: 'data_access',
      action,
      userId,
      resource,
      success,
      severity,
      category: 'data',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log configuration changes
   */
  async logConfigurationChange(
    action: string,
    userId: string | null,
    resource: string,
    changes: Record<string, any>,
    success: boolean,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<string> {
    return this.logEvent({
      type: 'configuration_change',
      action,
      userId,
      resource,
      success,
      severity,
      category: 'config',
      details: {
        changes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: string,
    userId: string | null,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent({
      type: 'security_event',
      action,
      userId,
      success: true,
      severity,
      category: 'security',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log system events
   */
  async logSystemEvent(
    action: string,
    success: boolean,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<string> {
    return this.logEvent({
      type: 'system_event',
      action,
      userId: null,
      success,
      severity,
      category: 'system',
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log audit scan results
   */
  async logAuditScan(
    scanId: string,
    scanType: string,
    results: any,
    userId: string | null = null
  ): Promise<string> {
    return this.logEvent({
      type: 'system_event',
      action: 'audit_scan_completed',
      userId,
      success: true,
      severity: 'medium',
      category: 'audit',
      details: {
        scanId,
        scanType,
        results,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get audit trail with pagination and filtering
   */
  async getAuditTrail(
    page: number = 1,
    limit: number = 50,
    filters: {
      userId?: string;
      type?: string;
      action?: string;
      dateRange?: { start: Date; end: Date };
      severity?: string;
      success?: boolean;
    } = {}
  ): Promise<AuditTrail> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.severity) where.severity = filters.severity;
    if (filters.success !== undefined) where.success = filters.success;
    if (filters.dateRange) {
      where.timestamp = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events: events.map((event: any) => ({
        ...event,
        details: event.details ? JSON.parse(event.details) : null,
      })) as AuditEventRecord[],
      totalCount: total,
      filters,
    };
  }

  /**
   * Get audit events for a specific user
   */
  async getUserAuditTrail(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<AuditTrail> {
    const events = await this.prisma.auditEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.auditEvent.count({
      where: { userId },
    });

    return {
      events: events.map((event: any) => ({
        ...event,
        details: event.details ? JSON.parse(event.details) : null,
      })) as AuditEventRecord[],
      totalCount: total,
      filters: { userId },
    };
  }

  /**
   * Get audit analytics
   */
  async getAuditAnalytics(
    dateRange: { start: Date; end: Date }
  ): Promise<AuditAnalytics> {
    const where = {
      timestamp: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    const [totalEvents, successEvents, eventsByType, topUsers] = await Promise.all([
      this.prisma.auditEvent.count({ where }),
      this.prisma.auditEvent.count({ where: { ...where, success: true } }),
      this.prisma.auditEvent.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      this.prisma.auditEvent.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    const successRate = totalEvents > 0 ? (successEvents / totalEvents) * 100 : 0;

    return {
      totalEvents,
      successRate,
      eventsByType: eventsByType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      topUsers: topUsers.map((user: any) => ({
        userId: user.userId,
        count: user._count.userId,
      })),
      timeRange: dateRange,
    };
  }

  /**
   * Search audit events
   */
  async searchAuditEvents(
    query: string,
    page: number = 1,
    limit: number = 50,
    filters: {
      type?: string;
      dateRange?: { start: Date; end: Date };
    } = {}
  ): Promise<AuditTrail> {
    const where: any = {
      OR: [
        { action: { contains: query } },
        { resource: { contains: query } },
        { details: { contains: query } },
      ],
    };

    if (filters.type) where.type = filters.type;
    if (filters.dateRange) {
      where.timestamp = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events: events.map((event: any) => ({
        ...event,
        details: event.details ? JSON.parse(event.details) : null,
      })) as AuditEventRecord[],
      totalCount: total,
      filters: { ...filters, action: query },
    };
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(
    framework: 'GDPR' | 'CCPA' | 'POPIA' = 'GDPR',
    dateRange: { start: Date; end: Date }
  ): Promise<any> {
    const auditEvents = await this.prisma.auditEvent.findMany({
      where: {
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        category: { in: ['auth', 'data', 'security'] },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Check for last security event
    const lastEvent = await this.prisma.auditEvent.findFirst({
      where: {
        type: 'security_event',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return {
      framework,
      reportDate: new Date(),
      dateRange,
      totalEvents: auditEvents.length,
      complianceScore: this.calculateComplianceScore(auditEvents, framework),
      recommendations: this.generateComplianceRecommendations(auditEvents, framework),
      events: auditEvents.slice(0, 100), // Top 100 events
      lastSecurityCheck: lastEvent?.timestamp || null,
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(): Promise<any> {
    const eventCount = await this.prisma.auditEvent.count();
    const recentEvents = await this.prisma.auditEvent.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      totalEvents: eventCount,
      recentEvents,
      isHealthy: this.isAuditSystemHealthy(),
      bufferSize: this.eventBuffer.length,
      lastProcessedAt: new Date(),
    };
  }

  /**
   * Export audit data
   */
  async exportAuditData(
    format: 'json' | 'csv' = 'json',
    filters: {
      dateRange?: { start: Date; end: Date };
      type?: string;
      userId?: string;
    } = {}
  ): Promise<any> {
    const where: any = {};

    if (filters.dateRange) {
      where.timestamp = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }
    if (filters.type) where.type = filters.type;
    if (filters.userId) where.userId = filters.userId;

    const events = await this.prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    if (format === 'json') {
      return {
        exportDate: new Date(),
        filters,
        events: events.map((event: any) => ({
          ...event,
          details: event.details ? JSON.parse(event.details) : null,
        })),
      };
    }

    // CSV format would be implemented here
    return events;
  }

  /**
   * Clean up old audit events based on retention policy
   */
  async cleanupAuditEvents(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

    const result = await this.prisma.auditEvent.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old audit events`);
    return { deletedCount: result.count };
  }

  /**
   * Process batch of audit events
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.eventBuffer.length === 0) return;

    this.isProcessing = true;
    const events = this.eventBuffer.splice(0, this.BATCH_SIZE);

    try {
      await this.prisma.auditEvent.createMany({
        data: events,
        skipDuplicates: true,
      });

      logger.debug(`Processed batch of ${events.length} audit events`);
      this.emit('batch_processed', { count: events.length });
    } catch (error) {
      logger.error('Failed to process audit event batch:', error);
      // Re-add failed events to buffer for retry
      this.eventBuffer.unshift(...events);
      this.emit('batch_error', error);
    } finally {
      this.isProcessing = false;
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(events: any[], framework: string): number {
    // Simplified compliance scoring logic
    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.success).length;
    const securityEvents = events.filter(e => e.type === 'security_event').length;

    if (totalEvents === 0) return 100;

    const successRate = (successfulEvents / totalEvents) * 100;
    const securityCoverage = Math.min((securityEvents / totalEvents) * 100, 100);

    return Math.round((successRate * 0.7 + securityCoverage * 0.3));
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(events: any[], framework: string): string[] {
    const recommendations: string[] = [];

    const failedEvents = events.filter(e => !e.success);
    if (failedEvents.length > events.length * 0.1) {
      recommendations.push('High failure rate detected. Review security policies.');
    }

    const securityEvents = events.filter(e => e.type === 'security_event');
    if (securityEvents.length < events.length * 0.05) {
      recommendations.push('Increase security monitoring coverage.');
    }

    if (framework === 'GDPR') {
      const dataEvents = events.filter(e => e.type === 'data_access');
      if (dataEvents.length === 0) {
        recommendations.push('No data access events logged. Ensure GDPR compliance monitoring.');
      }
    }

    return recommendations;
  }

  /**
   * Check if audit system is healthy
   */
  private isAuditSystemHealthy(): boolean {
    return this.config.enabled && this.eventBuffer.length < this.BATCH_SIZE * 5;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Process remaining events in buffer
    if (this.eventBuffer.length > 0) {
      await this.processBatch();
    }
  }
}