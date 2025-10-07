import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface SecurityIncident {
  id: string;
  type: 'data_breach' | 'unauthorized_access' | 'malware' | 'ddos' | 'phishing' | 'insider_threat' | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'containing' | 'resolved' | 'closed';
  title: string;
  description: string;
  source: string;
  detectedAt: Date;
  reportedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  affectedSystems: string[];
  affectedUsers: string[];
  indicators: string[];
  timeline: IncidentTimelineEvent[];
  metadata: Record<string, any>;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  description: string;
  user?: string;
  automated: boolean;
  metadata?: Record<string, any>;
}

export interface IncidentResponse {
  action: 'investigate' | 'contain' | 'isolate' | 'block' | 'alert' | 'escalate';
  target: string;
  reason: string;
  automated: boolean;
  timestamp: Date;
  success: boolean;
  details: Record<string, any>;
}

export interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  action: string;
  automated: boolean;
  condition?: string;
  timeout?: number; // minutes
}

export interface IncidentPlaybook {
  id: string;
  name: string;
  incidentTypes: string[];
  severity: string[];
  steps: PlaybookStep[];
  escalationCriteria: string[];
  active: boolean;
}

export interface IncidentConfig {
  enabled: boolean;
  autoResponseEnabled: boolean;
  notificationChannels: string[];
  escalationThreshold: number;
}

export class SecurityIncidentResponse extends EventEmitter {
  private activeIncidents: Map<string, SecurityIncident> = new Map();
  private incidentPlaybooks: Map<string, IncidentPlaybook> = new Map();
  private responseQueue: IncidentResponse[] = [];
  private isProcessingResponses = false;

  private readonly CACHE_PREFIX = 'incident:';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: IncidentConfig
  ) {
    super();
    
    if (config.enabled) {
      this.initializePlaybooks();
      this.startResponseProcessor();
    }
  }

  /**
   * Create new security incident
   */
  async createIncident(incident: Omit<SecurityIncident, 'id' | 'detectedAt' | 'timeline'>): Promise<string> {
    try {
      const incidentId = this.generateIncidentId();
      
      const securityIncident: SecurityIncident = {
        ...incident,
        id: incidentId,
        detectedAt: new Date(),
        timeline: [],
      };

      // Add initial timeline event
      this.addTimelineEvent(securityIncident, 'incident_created', 'Security incident created', true);

      // Store incident
      this.activeIncidents.set(incidentId, securityIncident);

      // Cache for quick access
      await this.redis.setex(
        `${this.CACHE_PREFIX}${incidentId}`,
        3600, // 1 hour
        JSON.stringify(securityIncident)
      );

      // Auto-response if enabled
      if (this.config.autoResponseEnabled) {
        await this.triggerAutoResponse(securityIncident);
      }

      // Send notifications
      await this.sendIncidentNotifications(securityIncident);

      // Check for escalation
      if (this.shouldEscalate(securityIncident)) {
        await this.escalateIncident(incidentId);
      }

      logger.info('Security incident created', {
        incidentId,
        type: incident.type,
        severity: incident.severity,
        source: incident.source,
      });

      this.emit('incidentCreated', securityIncident);

      return incidentId;

    } catch (error) {
      logger.error('Failed to create security incident', { error, incident });
      throw error;
    }
  }

  /**
   * Update incident status
   */
  async updateIncident(
    incidentId: string,
    updates: Partial<Pick<SecurityIncident, 'status' | 'assignedTo' | 'description' | 'metadata'>>,
    user?: string
  ): Promise<void> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      // Update incident
      Object.assign(incident, updates);

      // Add timeline event
      if (updates.status) {
        this.addTimelineEvent(
          incident,
          'status_changed',
          `Incident status changed to ${updates.status}`,
          false,
          user
        );

        // Mark as resolved if status is resolved
        if (updates.status === 'resolved') {
          incident.resolvedAt = new Date();
          this.addTimelineEvent(
            incident,
            'incident_resolved',
            'Security incident resolved',
            false,
            user
          );
        }
      }

      // Update cache
      await this.redis.setex(
        `${this.CACHE_PREFIX}${incidentId}`,
        3600,
        JSON.stringify(incident)
      );

      logger.info('Security incident updated', {
        incidentId,
        updates,
        user,
      });

      this.emit('incidentUpdated', incident);

    } catch (error) {
      logger.error('Failed to update security incident', { error, incidentId });
      throw error;
    }
  }

  /**
   * Handle security event and potentially create incident
   */
  async handleEvent(event: any): Promise<void> {
    try {
      // Determine if event should trigger an incident
      const shouldCreateIncident = await this.shouldCreateIncident(event);

      if (shouldCreateIncident.create) {
        await this.createIncident({
          type: this.mapEventToIncidentType(event.type),
          severity: event.severity,
          status: 'open',
          title: event.description,
          description: event.description,
          source: event.source,
          affectedSystems: [event.source],
          affectedUsers: event.userId ? [event.userId] : [],
          indicators: shouldCreateIncident.indicators,
          metadata: {
            originalEvent: event,
            autoCreated: true,
          },
        });
      } else {
        // Update existing incident if related
        const relatedIncident = await this.findRelatedIncident(event);
        if (relatedIncident) {
          await this.addEventToIncident(relatedIncident.id, event);
        }
      }

    } catch (error) {
      logger.error('Failed to handle security event', { error, event });
    }
  }

  /**
   * Trigger automated response
   */
  async triggerAutoResponse(incident: SecurityIncident): Promise<void> {
    try {
      // Find applicable playbook
      const playbook = this.findApplicablePlaybook(incident);
      
      if (!playbook) {
        logger.warn('No applicable playbook found for incident', { incidentId: incident.id });
        return;
      }

      // Execute playbook steps
      for (const step of playbook.steps) {
        if (step.automated) {
          await this.executePlaybookStep(incident, step);
        }
      }

      this.addTimelineEvent(
        incident,
        'auto_response_triggered',
        `Automated response executed using playbook: ${playbook.name}`,
        true
      );

    } catch (error) {
      logger.error('Auto response failed', { error, incidentId: incident.id });
    }
  }

  /**
   * Escalate incident
   */
  async escalateIncident(incidentId: string): Promise<void> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      // Escalate severity if not already critical
      if (incident.severity !== 'critical') {
        const previousSeverity = incident.severity;
        incident.severity = incident.severity === 'high' ? 'critical' : 'high';
        
        this.addTimelineEvent(
          incident,
          'incident_escalated',
          `Incident escalated from ${previousSeverity} to ${incident.severity}`,
          true
        );
      }

      // Send escalation notifications
      await this.sendEscalationNotifications(incident);

      logger.warn('Security incident escalated', {
        incidentId,
        severity: incident.severity,
      });

      this.emit('incidentEscalated', incident);

    } catch (error) {
      logger.error('Failed to escalate incident', { error, incidentId });
    }
  }

  /**
   * Get incident statistics
   */
  async getIncidentStatistics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    averageResolutionTime: number; // minutes
    incidentsByType: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    topAffectedSystems: Array<{ system: string; count: number }>;
  }> {
    try {
      const timeframeMs = this.getTimeframeMs(timeframe);
      const since = new Date(Date.now() - timeframeMs);

      const incidents = Array.from(this.activeIncidents.values())
        .filter(i => i.detectedAt > since);

      const totalIncidents = incidents.length;
      const openIncidents = incidents.filter(i => ['open', 'investigating', 'containing'].includes(i.status)).length;
      const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

      // Calculate average resolution time
      const resolvedWithTime = incidents.filter(i => i.resolvedAt && i.detectedAt);
      const averageResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, incident) => {
            const resolutionTime = incident.resolvedAt!.getTime() - incident.detectedAt.getTime();
            return sum + (resolutionTime / (1000 * 60)); // Convert to minutes
          }, 0) / resolvedWithTime.length
        : 0;

      // Group by type
      const incidentsByType: Record<string, number> = {};
      incidents.forEach(incident => {
        incidentsByType[incident.type] = (incidentsByType[incident.type] || 0) + 1;
      });

      // Group by severity
      const incidentsBySeverity: Record<string, number> = {};
      incidents.forEach(incident => {
        incidentsBySeverity[incident.severity] = (incidentsBySeverity[incident.severity] || 0) + 1;
      });

      // Top affected systems
      const systemCounts: Record<string, number> = {};
      incidents.forEach(incident => {
        incident.affectedSystems.forEach(system => {
          systemCounts[system] = (systemCounts[system] || 0) + 1;
        });
      });

      const topAffectedSystems = Object.entries(systemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([system, count]) => ({ system, count }));

      return {
        totalIncidents,
        openIncidents,
        resolvedIncidents,
        averageResolutionTime,
        incidentsByType,
        incidentsBySeverity,
        topAffectedSystems,
      };

    } catch (error) {
      logger.error('Failed to get incident statistics', { error });
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    operational: boolean;
    activeIncidents: number;
    recentIncidents: number;
    averageResponseTime: number;
    playbooksLoaded: number;
  }> {
    try {
      const activeIncidents = Array.from(this.activeIncidents.values())
        .filter(i => ['open', 'investigating', 'containing'].includes(i.status)).length;

      const recentIncidents = Array.from(this.activeIncidents.values())
        .filter(i => i.detectedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

      return {
        operational: this.config.enabled,
        activeIncidents,
        recentIncidents,
        averageResponseTime: 5, // minutes - placeholder
        playbooksLoaded: this.incidentPlaybooks.size,
      };

    } catch (error) {
      logger.error('Failed to get incident response status', { error });
      return {
        operational: false,
        activeIncidents: 0,
        recentIncidents: 0,
        averageResponseTime: 0,
        playbooksLoaded: 0,
      };
    }
  }

  /**
   * Perform security scan
   */
  async performScan(): Promise<{
    scanId: string;
    timestamp: Date;
    activeIncidents: number;
    unresolved: number;
    recommendations: string[];
  }> {
    const scanId = `incident_scan_${Date.now()}`;
    const recommendations: string[] = [];

    try {
      const activeIncidents = Array.from(this.activeIncidents.values())
        .filter(i => ['open', 'investigating', 'containing'].includes(i.status));

      const unresolved = activeIncidents.length;
      const oldIncidents = activeIncidents.filter(i => 
        i.detectedAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (unresolved > 5) {
        recommendations.push(`High number of active incidents (${unresolved}) - review response capacity`);
      }

      if (oldIncidents.length > 0) {
        recommendations.push(`${oldIncidents.length} incidents open for >24 hours - review resolution process`);
      }

      if (recommendations.length === 0) {
        recommendations.push('Incident response system is operating normally');
      }

      return {
        scanId,
        timestamp: new Date(),
        activeIncidents: activeIncidents.length,
        unresolved,
        recommendations,
      };

    } catch (error) {
      logger.error('Incident response scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<IncidentConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && this.incidentPlaybooks.size === 0) {
        await this.initializePlaybooks();
      }
    }

    logger.info('Incident response config updated', { newConfig });
  }

  /**
   * Get metrics
   */
  async getMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    incidents: number;
    averageResponseTime: number;
    resolutionRate: number;
    escalations: number;
  }> {
    try {
      const stats = await this.getIncidentStatistics(timeframe);

      const resolutionRate = stats.totalIncidents > 0 
        ? (stats.resolvedIncidents / stats.totalIncidents) * 100 
        : 100;

      return {
        incidents: stats.totalIncidents,
        averageResponseTime: stats.averageResolutionTime,
        resolutionRate,
        escalations: 0, // Would track escalation events
      };

    } catch (error) {
      logger.error('Failed to get incident response metrics', { error });
      return {
        incidents: 0,
        averageResponseTime: 0,
        resolutionRate: 0,
        escalations: 0,
      };
    }
  }

  /**
   * Emergency lockdown
   */
  async emergencyLockdown(): Promise<void> {
    logger.warn('Incident response emergency lockdown activated');

    // Create emergency incident
    await this.createIncident({
      type: 'system_compromise',
      severity: 'critical',
      status: 'containing',
      title: 'Emergency Security Lockdown',
      description: 'Emergency security lockdown activated',
      source: 'SecurityOrchestrator',
      affectedSystems: ['ALL'],
      affectedUsers: [],
      indicators: ['emergency_lockdown'],
      metadata: {
        automated: true,
        lockdownTime: new Date(),
      },
    });

    this.emit('emergencyLockdown', { service: 'SecurityIncidentResponse' });
  }

  /**
   * Process security event
   */
  async processEvent(event: any): Promise<void> {
    await this.handleEvent(event);
  }

  private async initializePlaybooks(): Promise<void> {
    const defaultPlaybooks: IncidentPlaybook[] = [
      {
        id: 'data_breach_response',
        name: 'Data Breach Response',
        incidentTypes: ['data_breach'],
        severity: ['high', 'critical'],
        steps: [
          {
            id: 'isolate_systems',
            name: 'Isolate Affected Systems',
            description: 'Isolate compromised systems to prevent further damage',
            action: 'isolate',
            automated: true,
          },
          {
            id: 'assess_damage',
            name: 'Assess Damage',
            description: 'Determine scope and impact of the breach',
            action: 'investigate',
            automated: false,
          },
          {
            id: 'notify_authorities',
            name: 'Notify Authorities',
            description: 'Notify relevant authorities and stakeholders',
            action: 'alert',
            automated: false,
          },
        ],
        escalationCriteria: ['personal_data_affected', 'public_exposure'],
        active: true,
      },
      {
        id: 'ddos_response',
        name: 'DDoS Attack Response',
        incidentTypes: ['ddos'],
        severity: ['medium', 'high', 'critical'],
        steps: [
          {
            id: 'enable_rate_limiting',
            name: 'Enable Rate Limiting',
            description: 'Activate enhanced rate limiting',
            action: 'contain',
            automated: true,
          },
          {
            id: 'block_attack_sources',
            name: 'Block Attack Sources',
            description: 'Block identified attack source IPs',
            action: 'block',
            automated: true,
          },
        ],
        escalationCriteria: ['service_unavailable'],
        active: true,
      },
    ];

    for (const playbook of defaultPlaybooks) {
      this.incidentPlaybooks.set(playbook.id, playbook);
    }

    logger.info('Incident response playbooks initialized', { count: defaultPlaybooks.length });
  }

  private addTimelineEvent(
    incident: SecurityIncident,
    event: string,
    description: string,
    automated: boolean,
    user?: string
  ): void {
    const timelineEvent: IncidentTimelineEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      event,
      description,
      user,
      automated,
    };

    incident.timeline.push(timelineEvent);
  }

  private async shouldCreateIncident(event: any): Promise<{
    create: boolean;
    indicators: string[];
  }> {
    // Determine if event should create new incident
    const indicators: string[] = [];

    // Check severity
    if (event.severity === 'critical') {
      indicators.push('critical_severity');
      return { create: true, indicators };
    }

    // Check for specific event types
    if (['threat', 'incident'].includes(event.type)) {
      indicators.push('security_event');
      return { create: true, indicators };
    }

    return { create: false, indicators };
  }

  private mapEventToIncidentType(eventType: string): SecurityIncident['type'] {
    const mapping: Record<string, SecurityIncident['type']> = {
      threat: 'unauthorized_access',
      ddos: 'ddos',
      malware: 'malware',
      data_leak: 'data_breach',
      compliance: 'insider_threat',
    };

    return mapping[eventType] || 'unauthorized_access';
  }

  private async findRelatedIncident(event: any): Promise<SecurityIncident | null> {
    // Find existing incident that might be related to this event
    for (const incident of this.activeIncidents.values()) {
      if (incident.status === 'closed' || incident.status === 'resolved') continue;

      // Check for similar source
      if (event.source && incident.source === event.source) {
        return incident;
      }

      // Check for same user
      if (event.userId && incident.affectedUsers.includes(event.userId)) {
        return incident;
      }
    }

    return null;
  }

  private async addEventToIncident(incidentId: string, event: any): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (incident) {
      this.addTimelineEvent(
        incident,
        'related_event',
        `Related event: ${event.description}`,
        true
      );

      // Update indicators
      if (event.metadata?.indicators) {
        incident.indicators.push(...event.metadata.indicators);
      }
    }
  }

  private findApplicablePlaybook(incident: SecurityIncident): IncidentPlaybook | null {
    for (const playbook of this.incidentPlaybooks.values()) {
      if (!playbook.active) continue;

      const typeMatch = playbook.incidentTypes.includes(incident.type);
      const severityMatch = playbook.severity.includes(incident.severity);

      if (typeMatch && severityMatch) {
        return playbook;
      }
    }

    return null;
  }

  private async executePlaybookStep(incident: SecurityIncident, step: PlaybookStep): Promise<void> {
    try {
      // Execute the step based on action type
      switch (step.action) {
        case 'isolate':
          await this.isolateSystems(incident.affectedSystems);
          break;
        case 'block':
          await this.blockThreats(incident.indicators);
          break;
        case 'alert':
          await this.sendAlerts(incident);
          break;
        default:
          logger.warn('Unknown playbook step action', { action: step.action });
      }

      this.addTimelineEvent(
        incident,
        'playbook_step_executed',
        `Executed playbook step: ${step.name}`,
        true
      );

    } catch (error) {
      logger.error('Playbook step execution failed', { error, stepId: step.id });
    }
  }

  private shouldEscalate(incident: SecurityIncident): boolean {
    // Check escalation criteria
    return incident.severity === 'critical' || 
           incident.affectedSystems.length > this.config.escalationThreshold;
  }

  private async sendIncidentNotifications(incident: SecurityIncident): Promise<void> {
    // Send notifications via configured channels
    for (const channel of this.config.notificationChannels) {
      try {
        await this.sendNotification(channel, incident);
      } catch (error) {
        logger.error('Failed to send incident notification', { error, channel });
      }
    }
  }

  private async sendEscalationNotifications(incident: SecurityIncident): Promise<void> {
    // Send escalation notifications
    await this.sendIncidentNotifications(incident);
  }

  private async sendNotification(channel: string, incident: SecurityIncident): Promise<void> {
    // Implement notification sending logic
    logger.info('Notification sent', { channel, incidentId: incident.id });
  }

  private async isolateSystems(systems: string[]): Promise<void> {
    // Implement system isolation logic
    logger.info('Systems isolated', { systems });
  }

  private async blockThreats(indicators: string[]): Promise<void> {
    // Implement threat blocking logic
    logger.info('Threats blocked', { indicators });
  }

  private async sendAlerts(incident: SecurityIncident): Promise<void> {
    // Implement alert sending logic
    logger.info('Alerts sent', { incidentId: incident.id });
  }

  private startResponseProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingResponses && this.responseQueue.length > 0) {
        await this.processResponseQueue();
      }
    }, 1000); // Process every second
  }

  private async processResponseQueue(): Promise<void> {
    this.isProcessingResponses = true;

    try {
      while (this.responseQueue.length > 0) {
        const response = this.responseQueue.shift()!;
        await this.executeResponse(response);
      }
    } catch (error) {
      logger.error('Error processing response queue', { error });
    } finally {
      this.isProcessingResponses = false;
    }
  }

  private async executeResponse(response: IncidentResponse): Promise<void> {
    // Execute the response action
    logger.info('Executing incident response', { response });
  }

  private generateIncidentId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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