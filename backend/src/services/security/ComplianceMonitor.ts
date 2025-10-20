import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface ComplianceRule {
  id: string;
  framework: 'GDPR' | 'CCPA' | 'POPIA' | 'PDPA' | 'CUSTOM';
  category: string;
  name: string;
  description: string;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  checkFunction: string; // Function name to execute for this rule
  active: boolean;
  lastChecked?: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  framework: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  timestamp: Date;
  resolvedAt?: Date;
  userId?: string;
  resource?: string;
}

export interface ComplianceReport {
  id: string;
  framework: string;
  period: { start: Date; end: Date };
  overallScore: number;
  violations: ComplianceViolation[];
  recommendations: string[];
  generatedAt: Date;
}

export interface ComplianceConfig {
  gdprCompliance: boolean;
  popiCompliance: boolean;
  ccpaCompliance: boolean;
  customRules: string[];
}

export class ComplianceMonitor extends EventEmitter {
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private activeViolations: Map<string, ComplianceViolation> = new Map();
  private complianceScore: number = 0;
  
  private readonly CACHE_PREFIX = 'compliance:';
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: ComplianceConfig
  ) {
    super();
    
    this.initializeComplianceRules();
    this.startContinuousMonitoring();
  }

  /**
   * Perform compliance check
   */
  async performComplianceCheck(
    scope: 'full' | 'gdpr' | 'ccpa' | 'popia' | 'custom' = 'full'
  ): Promise<{
    checkId: string;
    score: number;
    violations: ComplianceViolation[];
    recommendations: string[];
    frameworkScores: Record<string, number>;
  }> {
    const checkId = `compliance_check_${Date.now()}`;
    
    try {
      const violations: ComplianceViolation[] = [];
      const frameworkScores: Record<string, number> = {};
      const recommendations: string[] = [];

      // Get applicable rules based on scope
      const applicableRules = Array.from(this.complianceRules.values())
        .filter(rule => {
          if (scope === 'full') return rule.active;
          return rule.active && rule.framework.toLowerCase() === scope;
        });

      // Check each rule
      for (const rule of applicableRules) {
        try {
          const ruleViolations = await this.checkComplianceRule(rule);
          violations.push(...ruleViolations);

          // Update framework scores
          const framework = rule.framework;
          if (!frameworkScores[framework]) {
            frameworkScores[framework] = 100;
          }

          // Reduce score based on violations
          const violationPenalty = ruleViolations.length * this.getViolationPenalty(rule.severity);
          frameworkScores[framework] = Math.max(0, frameworkScores[framework] - violationPenalty);

        } catch (error) {
          logger.error('Compliance rule check failed', { error, ruleId: rule.id });
        }
      }

      // Calculate overall score
      const scores = Object.values(frameworkScores);
      const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(violations));

      // Store violations
      for (const violation of violations) {
        this.activeViolations.set(violation.id, violation);
        
        if (violation.severity === 'high' || violation.severity === 'critical') {
          this.emit('complianceViolation', violation);
        }
      }

      // Update compliance score
      this.complianceScore = overallScore;

      logger.info('Compliance check completed', {
        checkId,
        score: overallScore,
        violations: violations.length,
        scope,
      });

      return {
        checkId,
        score: overallScore,
        violations,
        recommendations,
        frameworkScores,
      };

    } catch (error) {
      logger.error('Compliance check failed', { error, checkId, scope });
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    framework: 'GDPR' | 'CCPA' | 'POPIA' | 'ALL',
    period: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    try {
      const reportId = `report_${Date.now()}`;

      // Get violations for the period
      const violations = Array.from(this.activeViolations.values())
        .filter(v => {
          const inPeriod = v.timestamp >= period.start && v.timestamp <= period.end;
          const matchesFramework = framework === 'ALL' || v.framework === framework;
          return inPeriod && matchesFramework;
        });

      // Calculate compliance score for the period
      const overallScore = this.calculatePeriodComplianceScore(violations, framework);

      // Generate recommendations
      const recommendations = this.generateRecommendations(violations);

      const report: ComplianceReport = {
        id: reportId,
        framework,
        period,
        overallScore,
        violations,
        recommendations,
        generatedAt: new Date(),
      };

      // Store report in database
      await this.storeComplianceReport(report);

      logger.info('Compliance report generated', {
        reportId,
        framework,
        period,
        score: overallScore,
        violations: violations.length,
      });

      return report;

    } catch (error) {
      logger.error('Failed to generate compliance report', { error, framework });
      throw error;
    }
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetention(): Promise<{
    violations: ComplianceViolation[];
    expiredData: Array<{
      table: string;
      count: number;
      oldestRecord: Date;
    }>;
  }> {
    try {
      const violations: ComplianceViolation[] = [];
      const expiredData: any[] = [];

      // Define retention policies
      const retentionPolicies = [
        { table: 'auditEvent', retention: 2555 }, // 7 years
        { table: 'userSession', retention: 90 }, // 3 months
        { table: 'securityEvent', retention: 1095 }, // 3 years
        { table: 'apiLog', retention: 365 }, // 1 year
      ];

      for (const policy of retentionPolicies) {
        const cutoffDate = new Date(Date.now() - policy.retention * 24 * 60 * 60 * 1000);

        try {
          // Check for expired records (this is conceptual - actual implementation would vary by table)
          const expiredCount = await this.countExpiredRecords(policy.table, cutoffDate);
          
          if (expiredCount > 0) {
            const oldestRecord = await this.getOldestRecord(policy.table);
            
            expiredData.push({
              table: policy.table,
              count: expiredCount,
              oldestRecord,
            });

            // Create violation for data retention
            violations.push({
              id: this.generateViolationId(),
              ruleId: 'data_retention',
              framework: 'GDPR',
              severity: 'medium',
              description: `Data retention policy violation: ${expiredCount} expired records in ${policy.table}`,
              details: {
                table: policy.table,
                expiredCount,
                retentionDays: policy.retention,
                cutoffDate,
                oldestRecord,
              },
              status: 'open',
              timestamp: new Date(),
            });
          }
        } catch (error) {
          logger.error('Failed to check retention for table', { error, table: policy.table });
        }
      }

      return { violations, expiredData };

    } catch (error) {
      logger.error('Data retention check failed', { error });
      throw error;
    }
  }

  /**
   * Check consent management compliance
   */
  async checkConsentCompliance(): Promise<{
    violations: ComplianceViolation[];
    consentStatus: {
      totalUsers: number;
      withConsent: number;
      withoutConsent: number;
      expiredConsent: number;
    };
  }> {
    try {
      const violations: ComplianceViolation[] = [];

      // Get consent status
      const consentStatus = await this.getConsentStatus();

      // Check for users without proper consent
      if (consentStatus.withoutConsent > 0) {
        violations.push({
          id: this.generateViolationId(),
          ruleId: 'consent_required',
          framework: 'GDPR',
          severity: 'high',
          description: `${consentStatus.withoutConsent} users without proper consent`,
          details: {
            usersWithoutConsent: consentStatus.withoutConsent,
            totalUsers: consentStatus.totalUsers,
            complianceRate: (consentStatus.withConsent / consentStatus.totalUsers) * 100,
          },
          status: 'open',
          timestamp: new Date(),
        });
      }

      // Check for expired consent
      if (consentStatus.expiredConsent > 0) {
        violations.push({
          id: this.generateViolationId(),
          ruleId: 'consent_expired',
          framework: 'GDPR',
          severity: 'medium',
          description: `${consentStatus.expiredConsent} users with expired consent`,
          details: {
            expiredConsent: consentStatus.expiredConsent,
            totalUsers: consentStatus.totalUsers,
          },
          status: 'open',
          timestamp: new Date(),
        });
      }

      return { violations, consentStatus };

    } catch (error) {
      logger.error('Consent compliance check failed', { error });
      throw error;
    }
  }

  /**
   * Check data processing compliance
   */
  async checkDataProcessingCompliance(): Promise<{
    violations: ComplianceViolation[];
    processingActivities: Array<{
      purpose: string;
      legalBasis: string;
      dataTypes: string[];
      compliant: boolean;
    }>;
  }> {
    try {
      const violations: ComplianceViolation[] = [];
      
      // Define processing activities
      const processingActivities = [
        {
          purpose: 'User Account Management',
          legalBasis: 'Contract',
          dataTypes: ['email', 'profile_data'],
          compliant: true,
        },
        {
          purpose: 'Marketing Communications',
          legalBasis: 'Consent',
          dataTypes: ['email', 'preferences'],
          compliant: true,
        },
        {
          purpose: 'Analytics',
          legalBasis: 'Legitimate Interest',
          dataTypes: ['usage_data', 'ip_address'],
          compliant: true,
        },
      ];

      // Check each processing activity
      for (const activity of processingActivities) {
        if (!activity.compliant) {
          violations.push({
            id: this.generateViolationId(),
            ruleId: 'data_processing',
            framework: 'GDPR',
            severity: 'high',
            description: `Data processing activity "${activity.purpose}" is not compliant`,
            details: {
              purpose: activity.purpose,
              legalBasis: activity.legalBasis,
              dataTypes: activity.dataTypes,
            },
            status: 'open',
            timestamp: new Date(),
          });
        }
      }

      return { violations, processingActivities };

    } catch (error) {
      logger.error('Data processing compliance check failed', { error });
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    operational: boolean;
    score: number;
    activeRules: number;
    activeViolations: number;
    lastCheck: Date | null;
  }> {
    try {
      const activeRules = Array.from(this.complianceRules.values())
        .filter(r => r.active).length;

      const lastCheck = Array.from(this.complianceRules.values())
        .map(r => r.lastChecked)
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0] || null;

      return {
        operational: true,
        score: this.complianceScore,
        activeRules,
        activeViolations: this.activeViolations.size,
        lastCheck,
      };

    } catch (error) {
      logger.error('Failed to get compliance status', { error });
      return {
        operational: false,
        score: 0,
        activeRules: 0,
        activeViolations: 0,
        lastCheck: null,
      };
    }
  }

  /**
   * Perform security scan
   */
  async performScan(): Promise<{
    scanId: string;
    timestamp: Date;
    complianceScore: number;
    frameworkScores: Record<string, number>;
    violations: number;
    recommendations: string[];
  }> {
    const scanId = `compliance_scan_${Date.now()}`;
    
    try {
      const result = await this.performComplianceCheck('full');

      return {
        scanId,
        timestamp: new Date(),
        complianceScore: result.score,
        frameworkScores: result.frameworkScores,
        violations: result.violations.length,
        recommendations: result.recommendations,
      };

    } catch (error) {
      logger.error('Compliance scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<ComplianceConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // Reactivate rules based on new config
    await this.updateRuleActivation();

    logger.info('Compliance config updated', { newConfig });
  }

  /**
   * Get metrics
   */
  async getMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    violations: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    frameworkScores: Record<string, number>;
  }> {
    try {
      const timeframeMs = this.getTimeframeMs(timeframe);
      const since = new Date(Date.now() - timeframeMs);

      const violations = Array.from(this.activeViolations.values())
        .filter(v => v.timestamp > since);

      // Calculate framework scores
      const frameworkScores: Record<string, number> = {};
      const frameworks = ['GDPR', 'CCPA', 'POPIA'];
      
      for (const framework of frameworks) {
        const frameworkViolations = violations.filter(v => v.framework === framework);
        frameworkScores[framework] = Math.max(0, 100 - frameworkViolations.length * 5);
      }

      return {
        violations: violations.length,
        score: this.complianceScore,
        trend: 'stable', // Would calculate based on historical data
        frameworkScores,
      };

    } catch (error) {
      logger.error('Failed to get compliance metrics', { error });
      return {
        violations: 0,
        score: 0,
        trend: 'stable',
        frameworkScores: {},
      };
    }
  }

  /**
   * Process security event
   */
  async processEvent(event: any): Promise<void> {
    if (event.type === 'compliance') {
      // Process compliance-related events
      const violation: ComplianceViolation = {
        id: event.id,
        ruleId: event.metadata.ruleId || 'unknown',
        framework: event.metadata.framework || 'CUSTOM',
        severity: event.severity,
        description: event.description,
        details: event.metadata,
        status: 'open',
        timestamp: event.timestamp,
        userId: event.userId,
        resource: event.metadata.resource,
      };

      this.activeViolations.set(violation.id, violation);
    }
  }

  private async initializeComplianceRules(): Promise<void> {
    const defaultRules: ComplianceRule[] = [
      // GDPR Rules
      {
        id: 'gdpr_data_retention',
        framework: 'GDPR',
        category: 'Data Retention',
        name: 'Data Retention Compliance',
        description: 'Ensure data is not retained longer than necessary',
        requirement: 'Article 5(1)(e) - Storage limitation',
        severity: 'high',
        checkFunction: 'checkDataRetention',
        active: this.config.gdprCompliance,
      },
      {
        id: 'gdpr_consent',
        framework: 'GDPR',
        category: 'Consent',
        name: 'Valid Consent Required',
        description: 'Ensure all users have provided valid consent',
        requirement: 'Article 7 - Conditions for consent',
        severity: 'critical',
        checkFunction: 'checkConsentCompliance',
        active: this.config.gdprCompliance,
      },
      {
        id: 'gdpr_data_processing',
        framework: 'GDPR',
        category: 'Data Processing',
        name: 'Lawful Basis for Processing',
        description: 'Ensure all data processing has a lawful basis',
        requirement: 'Article 6 - Lawfulness of processing',
        severity: 'critical',
        checkFunction: 'checkDataProcessingCompliance',
        active: this.config.gdprCompliance,
      },

      // POPIA Rules (South Africa)
      {
        id: 'popia_data_minimization',
        framework: 'POPIA',
        category: 'Data Minimization',
        name: 'Data Minimization Principle',
        description: 'Collect only data that is necessary',
        requirement: 'Section 11 - Data minimisation',
        severity: 'medium',
        checkFunction: 'checkDataMinimization',
        active: this.config.popiCompliance,
      },

      // CCPA Rules
      {
        id: 'ccpa_right_to_know',
        framework: 'CCPA',
        category: 'Consumer Rights',
        name: 'Right to Know',
        description: 'Consumers must be informed about data collection',
        requirement: 'CCPA Section 1798.100',
        severity: 'high',
        checkFunction: 'checkRightToKnow',
        active: this.config.ccpaCompliance,
      },
    ];

    for (const rule of defaultRules) {
      this.complianceRules.set(rule.id, rule);
    }

    logger.info('Compliance rules initialized', { count: defaultRules.length });
  }

  private async checkComplianceRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    // Update last checked time
    rule.lastChecked = new Date();

    // Call the appropriate check function
    switch (rule.checkFunction) {
      case 'checkDataRetention':
        return (await this.checkDataRetention()).violations;
      case 'checkConsentCompliance':
        return (await this.checkConsentCompliance()).violations;
      case 'checkDataProcessingCompliance':
        return (await this.checkDataProcessingCompliance()).violations;
      default:
        logger.warn('Unknown compliance check function', { function: rule.checkFunction });
        return [];
    }
  }

  private getViolationPenalty(severity: string): number {
    const penalties = { low: 1, medium: 3, high: 7, critical: 15 };
    return penalties[severity as keyof typeof penalties] || 1;
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];
    const violationsByFramework = this.groupBy(violations, 'framework');

    for (const [framework, frameworkViolations] of Object.entries(violationsByFramework)) {
      if (frameworkViolations.length > 0) {
        recommendations.push(`${framework}: Address ${frameworkViolations.length} compliance violations`);
        
        const criticalViolations = frameworkViolations.filter(v => v.severity === 'critical');
        if (criticalViolations.length > 0) {
          recommendations.push(`${framework}: Immediately address ${criticalViolations.length} critical violations`);
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All compliance frameworks are in good standing');
    }

    return recommendations;
  }

  private calculatePeriodComplianceScore(violations: ComplianceViolation[], framework: string): number {
    if (violations.length === 0) return 100;

    const totalPenalty = violations.reduce((sum, violation) => {
      return sum + this.getViolationPenalty(violation.severity);
    }, 0);

    return Math.max(0, 100 - totalPenalty);
  }

  private async storeComplianceReport(report: ComplianceReport): Promise<void> {
    try {
      // TODO: Create ComplianceReport model in Prisma schema
      // await this.prisma.complianceReport.create({
      //   data: {
      //     id: report.id,
      //     framework: report.framework,
      //     periodStart: report.period.start,
      //     periodEnd: report.period.end,
      //     overallScore: report.overallScore,
      //     violations: JSON.stringify(report.violations),
      //     recommendations: JSON.stringify(report.recommendations),
      //     generatedAt: report.generatedAt,
      //   },
      // });
      logger.info('Compliance report generated (storage not implemented)', { reportId: report.id });
    } catch (error) {
      logger.error('Failed to store compliance report', { error, reportId: report.id });
    }
  }

  private async countExpiredRecords(table: string, cutoffDate: Date): Promise<number> {
    // This would need to be implemented for each specific table
    // For now, return a placeholder
    return 0;
  }

  private async getOldestRecord(table: string): Promise<Date> {
    // This would need to be implemented for each specific table
    // For now, return a placeholder
    return new Date();
  }

  private async getConsentStatus(): Promise<{
    totalUsers: number;
    withConsent: number;
    withoutConsent: number;
    expiredConsent: number;
  }> {
    try {
      const totalUsers = await this.prisma.user.count();
      // TODO: Fix Profile relation - UserProfile model may not exist in current schema
      // const withConsent = await this.prisma.user.count({
      //   where: {
      //     Profile: {
      //       consentGiven: true,
      //       consentDate: { not: null },
      //     },
      //   },
      // });
      const withConsent = 0; // Placeholder until schema is updated

      const expiredConsentDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      // TODO: Fix Profile relation - UserProfile model may not exist in current schema
      // const expiredConsent = await this.prisma.user.count({
      //   where: {
      //     profile: {
      //       consentGiven: true,
      //       consentDate: { lt: expiredConsentDate },
      //     },
      //   },
      // });
      const expiredConsent = 0; // Placeholder until schema is updated

      return {
        totalUsers,
        withConsent,
        withoutConsent: totalUsers - withConsent,
        expiredConsent,
      };

    } catch (error) {
      logger.error('Failed to get consent status', { error });
      return {
        totalUsers: 0,
        withConsent: 0,
        withoutConsent: 0,
        expiredConsent: 0,
      };
    }
  }

  private startContinuousMonitoring(): void {
    // Run compliance checks every 4 hours
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performComplianceCheck('full');
      } catch (error) {
        logger.error('Scheduled compliance check failed', { error });
      }
    }, 4 * 60 * 60 * 1000);

    logger.info('Compliance continuous monitoring started');
  }

  private async updateRuleActivation(): Promise<void> {
    for (const rule of this.complianceRules.values()) {
      switch (rule.framework) {
        case 'GDPR':
          rule.active = this.config.gdprCompliance;
          break;
        case 'CCPA':
          rule.active = this.config.ccpaCompliance;
          break;
        case 'POPIA':
          rule.active = this.config.popiCompliance;
          break;
      }
    }
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  private generateViolationId(): string {
    return `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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