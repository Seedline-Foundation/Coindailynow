import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

// Type-safe workaround for Prisma client caching issues
interface ExtendedPrismaClient extends PrismaClient {
  auditEvent: any; // Will be properly typed at runtime
}

export interface AuditEventInput {
  type: 'authentication' | 'authorization' | 'data_access' | 'configuration_change' | 'security_event' | 'system_event';
  action: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resource?: string | null;
  success: boolean;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
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
    dateRange?: { start: Date; end: Date };
    severity?: string;
  };
}

export class SecurityAuditService extends EventEmitter {
  private readonly AUDIT_CACHE_PREFIX = 'audit:';
  private readonly BATCH_SIZE = 100;
  private eventBuffer: AuditEventRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: AuditConfig
  ) {
    super();
    
    if (config.enabled) {
      this.startBatchProcessor();
    }
  }

  /**
   * Convert undefined to null for consistent handling
   */
  private normalizeOptionalString(value?: string): string | null {
    return value ?? null;
  }

  /**
   * Log a security audit event
   */
  async logEvent(event: Omit<AuditEventRecord, 'id' | 'timestamp'>): Promise<string> {
    const auditEvent: AuditEventRecord = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    try {
      // Add to buffer for batch processing
      this.eventBuffer.push(auditEvent);

      // Cache recent event for real-time access
      await this.redis.lpush(
        `${this.AUDIT_CACHE_PREFIX}recent`,
        JSON.stringify(auditEvent)
      );
      
      // Keep only last 1000 events in cache
      await this.redis.ltrim(`${this.AUDIT_CACHE_PREFIX}recent`, 0, 999);

      // For critical events, process immediately
      if (auditEvent.severity === 'critical') {
        await this.flushEvents();
      }

      this.emit('auditEvent', auditEvent);

      logger.debug('Audit event logged', {
        eventId: auditEvent.id,
        type: auditEvent.type,
        action: auditEvent.action,
        severity: auditEvent.severity,
      });

      return auditEvent.id;

    } catch (error) {
      logger.error('Failed to log audit event', { error, event });
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'mfa_enabled' | 'mfa_disabled',
    userId?: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const severity = action === 'login_failed' ? 'medium' : 'low';
    const success = !action.includes('failed');

    return this.logEvent({
      type: 'authentication',
      action,
      userId: this.normalizeOptionalString(userId),
      ipAddress: this.normalizeOptionalString(ipAddress),
      userAgent: this.normalizeOptionalString(userAgent),
      success,
      severity,
      category: 'auth',
      details: JSON.stringify({
        ...details,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Log authorization events
   */
  async logAuthorization(
    action: 'access_granted' | 'access_denied' | 'permission_changed' | 'role_assigned' | 'role_removed',
    userId?: string,
    resource?: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<string> {
    const severity = action === 'access_denied' ? 'medium' : 'low';
    const success = action !== 'access_denied';

    return this.logEvent({
      type: 'authorization',
      action,
      userId: this.normalizeOptionalString(userId),
      resource: this.normalizeOptionalString(resource),
      success,
      severity,
      category: 'access',
      details: JSON.stringify({
        ...details,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: this.normalizeOptionalString(ipAddress),
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'read' | 'create' | 'update' | 'delete' | 'export' | 'import',
    resource: string,
    userId?: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<string> {
    const severity = ['delete', 'export'].includes(action) ? 'medium' : 'low';

    return this.logEvent({
      type: 'data_access',
      action,
      userId: this.normalizeOptionalString(userId),
      resource,
      success: true,
      severity,
      category: 'data',
      details: JSON.stringify({
        ...details,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: this.normalizeOptionalString(ipAddress),
    });
  }

  /**
   * Log configuration changes
   */
  async logConfigurationChange(
    resource: string,
    changes: Record<string, any>,
    userId?: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      type: 'configuration_change',
      action: 'config_updated',
      userId: this.normalizeOptionalString(userId),
      resource,
      success: true,
      severity: 'medium',
      category: 'config',
      details: JSON.stringify({
        changes,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: this.normalizeOptionalString(ipAddress),
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      type: 'security_event',
      action,
      userId: this.normalizeOptionalString(userId),
      success: true,
      severity,
      category: 'security',
      details: JSON.stringify({
        ...details,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: this.normalizeOptionalString(ipAddress),
    });
  }

  /**
   * Log scan operations
   */
  async logScan(
    scanId: string,
    scanType: string,
    status: 'started' | 'completed' | 'failed',
    results?: any
  ): Promise<string> {
    return this.logEvent({
      type: 'system_event',
      action: `scan_${status}`,
      success: status !== 'failed',
      severity: status === 'failed' ? 'medium' : 'low',
      category: 'scan',
      details: JSON.stringify({
        scanId,
        scanType,
        results,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Retrieve audit trail with filtering
   */
  async getAuditTrail(filters: {
    userId?: string;
    type?: string;
    action?: string;
    severity?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditTrail> {
    try {
      const {
        userId,
        type,
        action,
        severity,
        dateRange,
        limit = 100,
        offset = 0,
      } = filters;

      // Build where clause
      const where: any = {};
      
      if (userId) where.userId = userId;
      if (type) where.type = type;
      if (action) where.action = action;
      if (severity) where.severity = severity;
      if (dateRange) {
        where.timestamp = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      // Get events from database
      const [events, totalCount] = await Promise.all([
        this.prisma.auditEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.auditEvent.count({ where }),
      ]);

      return {
        events: events.map((event: any) => ({
          ...event,
          details: typeof event.details === 'string' 
            ? JSON.parse(event.details) 
            : event.details,
        })) as AuditEventRecord[],
        totalCount,
        filters,
      };

    } catch (error) {
      logger.error('Failed to retrieve audit trail', { error, filters });
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byAction: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    failureRate: number;
  }> {
    try {
      const timeframeMs = this.getTimeframeMs(timeframe);
      const since = new Date(Date.now() - timeframeMs);

      const events = await this.prisma.auditEvent.findMany({
        where: {
          timestamp: { gte: since },
        },
        select: {
          type: true,
          severity: true,
          action: true,
          userId: true,
          resource: true,
          success: true,
        },
      });

      const totalEvents = events.length;
      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byAction: Record<string, number> = {};
      const userCounts: Record<string, number> = {};
      const resourceCounts: Record<string, number> = {};
      let failedEvents = 0;

      for (const event of events) {
        // Count by type
        byType[event.type] = (byType[event.type] || 0) + 1;
        
        // Count by severity
        bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
        
        // Count by action
        byAction[event.action] = (byAction[event.action] || 0) + 1;
        
        // Count by user
        if (event.userId) {
          userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
        }
        
        // Count by resource
        if (event.resource) {
          resourceCounts[event.resource] = (resourceCounts[event.resource] || 0) + 1;
        }
        
        // Count failures
        if (!event.success) {
          failedEvents++;
        }
      }

      const topUsers = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count }));

      const topResources = Object.entries(resourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([resource, count]) => ({ resource, count }));

      const failureRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

      return {
        totalEvents,
        byType,
        bySeverity,
        byAction,
        topUsers,
        topResources,
        failureRate,
      };

    } catch (error) {
      logger.error('Failed to get audit statistics', { error, timeframe });
      throw error;
    }
  }

  /**
   * Search audit events
   */
  async searchEvents(query: {
    searchTerm?: string;
    filters?: {
      type?: string;
      severity?: string;
      dateRange?: { start: Date; end: Date };
    };
    limit?: number;
    offset?: number;
  }): Promise<AuditTrail> {
    try {
      const { searchTerm, filters, limit = 100, offset = 0 } = query;

      const where: any = {};

      if (filters?.type) where.type = filters.type;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.dateRange) {
        where.timestamp = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        };
      }

      if (searchTerm) {
        where.OR = [
          { action: { contains: searchTerm, mode: 'insensitive' } },
          { resource: { contains: searchTerm, mode: 'insensitive' } },
          { details: { path: '$.searchableText', string_contains: searchTerm } },
        ];
      }

      const [events, totalCount] = await Promise.all([
        this.prisma.auditEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.auditEvent.count({ where }),
      ]);

      return {
        events: events.map((event: any) => ({
          ...event,
          details: typeof event.details === 'string' 
            ? JSON.parse(event.details) 
            : event.details,
        })) as AuditEventRecord[],
        totalCount,
        filters: filters || {},
      };

    } catch (error) {
      logger.error('Failed to search audit events', { error, query });
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    operational: boolean;
    eventsInBuffer: number;
    lastAudit: Date | null;
    retentionPeriod: number;
  }> {
    try {
      const lastEvent = await this.prisma.auditEvent.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      return {
        operational: this.config.enabled,
        eventsInBuffer: this.eventBuffer.length,
        lastAudit: lastEvent?.timestamp || null,
        retentionPeriod: this.config.retentionPeriod,
      };

    } catch (error) {
      logger.error('Failed to get audit service status', { error });
      return {
        operational: false,
        eventsInBuffer: this.eventBuffer.length,
        lastAudit: null,
        retentionPeriod: this.config.retentionPeriod,
      };
    }
  }

  /**
   * Perform audit scan
   */
  async performScan(): Promise<{
    scanId: string;
    timestamp: Date;
    eventCount: number;
    anomalies: any[];
    recommendations: string[];
  }> {
    const scanId = `audit_scan_${Date.now()}`;
    
    try {
      // Count recent events
      const eventCount = await this.prisma.auditEvent.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      // Look for anomalies
      const anomalies = await this.detectAnomalies();

      const recommendations: string[] = [];
      
      if (eventCount < 10) {
        recommendations.push('Very low audit event volume - verify logging is working properly');
      }
      
      if (anomalies.length > 0) {
        recommendations.push(`Found ${anomalies.length} audit anomalies requiring investigation`);
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Audit trail appears healthy with no anomalies detected');
      }

      return {
        scanId,
        timestamp: new Date(),
        eventCount,
        anomalies,
        recommendations,
      };

    } catch (error) {
      logger.error('Audit scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Update audit configuration
   */
  async updateConfig(newConfig: Partial<AuditConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && !this.flushTimer) {
        this.startBatchProcessor();
      } else if (!newConfig.enabled && this.flushTimer) {
        this.stopBatchProcessor();
      }
    }

    logger.info('Audit service config updated', { newConfig });
  }

  /**
   * Get audit metrics
   */
  async getMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    events: number;
    failures: number;
    criticalEvents: number;
    averageEventsPerHour: number;
  }> {
    try {
      const timeframeMs = this.getTimeframeMs(timeframe);
      const since = new Date(Date.now() - timeframeMs);

      const events = await this.prisma.auditEvent.findMany({
        where: {
          timestamp: { gte: since },
        },
        select: {
          success: true,
          severity: true,
          timestamp: true,
        },
      });

      const totalEvents = events.length;
      const failures = events.filter((e: any) => !e.success).length;
      const criticalEvents = events.filter((e: any) => e.severity === 'critical').length;
      const hours = timeframeMs / (60 * 60 * 1000);
      const averageEventsPerHour = totalEvents / hours;

      return {
        events: totalEvents,
        failures,
        criticalEvents,
        averageEventsPerHour,
      };

    } catch (error) {
      logger.error('Failed to get audit metrics', { error });
      return {
        events: 0,
        failures: 0,
        criticalEvents: 0,
        averageEventsPerHour: 0,
      };
    }
  }

  /**
   * Process security event
   */
  async processEvent(event: any): Promise<void> {
    // Log all security events to audit trail
    await this.logSecurityEvent(
      event.description,
      event.severity,
      event.metadata,
      event.userId,
      event.ipAddress
    );
  }

  /**
   * Clean up old audit events
   */
  async cleanupOldEvents(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
      
      const result = await this.prisma.auditEvent.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });

      logger.info('Cleaned up old audit events', { deletedCount: result.count, cutoffDate });
      return result.count;

    } catch (error) {
      logger.error('Failed to cleanup old audit events', { error });
      throw error;
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = this.eventBuffer.splice(0, this.BATCH_SIZE);

    try {
      await this.prisma.auditEvent.createMany({
        data: eventsToFlush.map(event => ({
          id: event.id,
          type: event.type,
          action: event.action,
          userId: event.userId ?? null,
          ipAddress: event.ipAddress ?? null,
          userAgent: event.userAgent ?? null,
          resource: event.resource ?? null,
          timestamp: event.timestamp,
          success: event.success,
          details: JSON.stringify(event.details),
          severity: event.severity,
          category: event.category,
        })),
      });

      logger.debug('Flushed audit events to database', { count: eventsToFlush.length });

    } catch (error) {
      logger.error('Failed to flush audit events', { error, count: eventsToFlush.length });
      // Re-add events to buffer on failure
      this.eventBuffer.unshift(...eventsToFlush);
      throw error;
    }
  }

  private startBatchProcessor(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushEvents();
    }, 5000); // Flush every 5 seconds

    logger.info('Audit batch processor started');
  }

  private stopBatchProcessor(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush remaining events
    this.flushEvents();
    
    logger.info('Audit batch processor stopped');
  }

  private async detectAnomalies(): Promise<any[]> {
    // Placeholder for anomaly detection logic
    // In a real implementation, this would analyze patterns for:
    // - Unusual access patterns
    // - Failed login clusters
    // - Privilege escalation attempts
    // - Data access anomalies
    return [];
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }
}