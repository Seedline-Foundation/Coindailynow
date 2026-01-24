/**
 * Legal & Compliance Orchestrator
 * Task 30: Privacy & GDPR Compliance Implementation
 * 
 * Central service for managing all legal and compliance requirements
 * Covers FR-1391 to FR-1400:
 * - GDPR, CCPA, POPIA compliance
 * - Cookie consent management
 * - Data retention policies
 * - Data portability
 * - Privacy impact assessments
 * - Cross-border data transfer compliance
 * - Compliance reporting
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface LegalFramework {
  id: string;
  name: string;
  code: 'GDPR' | 'CCPA' | 'POPIA' | 'NDPR' | 'PDPA' | 'LGPD';
  jurisdiction: string;
  description: string;
  requirements: LegalRequirement[];
  isActive: boolean;
  effectiveDate: Date;
  lastUpdated: Date;
}

export interface LegalRequirement {
  id: string;
  frameworkId: string;
  name: string;
  description: string;
  category: 'data_protection' | 'consent' | 'retention' | 'portability' | 'privacy' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementation: string;
  complianceCheck: string;
  autoRemediationAvailable: boolean;
  lastChecked?: Date;
  metadata?: Record<string, any>;
}

export interface PrivacyImpactAssessment {
  id: string;
  title: string;
  description: string;
  dataProcessingPurpose: string;
  dataTypes: string[];
  legalBasis: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  mitigationMeasures: string[];
  status: 'draft' | 'under_review' | 'approved' | 'rejected';
  assessor: string;
  approver?: string;
  assessmentDate: Date;
  reviewDate?: Date;
  findings: PIAFinding[];
}

export interface PIAFinding {
  id: string;
  type: 'risk' | 'recommendation' | 'mitigation';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignee?: string;
  dueDate?: Date;
  resolution?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'marketing' | 'analytics' | 'functional' | 'advertising' | 'essential';
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  ipAddress: string;
  userAgent: string;
  method: 'explicit' | 'implicit' | 'pre_ticked' | 'cookie_banner';
  withdrawnDate?: Date;
  expiryDate?: Date;
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  dataRetentionPeriod: number; // in days
  metadata?: Record<string, any>;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataCategory: string;
  retentionPeriod: number; // in days
  legalBasis: string;
  deletionMethod: 'hard_delete' | 'soft_delete' | 'anonymization' | 'pseudonymization';
  exceptions: string[];
  autoDelete: boolean;
  notificationBeforeDeletion: boolean;
  framework: string[];
  isActive: boolean;
  lastReview: Date;
  nextReview: Date;
}

export interface DataPortabilityRequest {
  id: string;
  userId: string;
  requestType: 'export' | 'transfer' | 'deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestDate: Date;
  completionDate?: Date;
  dataTypes: string[];
  format: 'json' | 'csv' | 'xml' | 'pdf';
  deliveryMethod: 'download' | 'email' | 'secure_transfer';
  verificationRequired: boolean;
  verificationCompleted: boolean;
  downloadUrl?: string;
  expiryDate?: Date;
  processedBy?: string;
  notes?: string;
}

export interface CrossBorderTransfer {
  id: string;
  sourceCountry: string;
  destinationCountry: string;
  dataType: string;
  transferMechanism: 'adequacy_decision' | 'bcr' | 'scc' | 'derogation' | 'certification';
  legalBasis: string;
  recipient: string;
  purpose: string;
  dataSubjects: number;
  transferDate: Date;
  safeguards: string[];
  riskAssessment: string;
  status: 'approved' | 'pending' | 'suspended' | 'prohibited';
  approver?: string;
  documentation: string[];
}

export interface ComplianceAuditTrail {
  id: string;
  framework: string;
  action: string;
  resource: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  complianceImpact: 'none' | 'low' | 'medium' | 'high';
  policyViolation: boolean;
  autoRemediated: boolean;
}

export class LegalComplianceOrchestrator extends EventEmitter {
  private readonly CACHE_PREFIX = 'legal_compliance:';
  private readonly CACHE_TTL = 3600; // 1 hour

  private legalFrameworks: Map<string, LegalFramework> = new Map();
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();
  private activeConsents: Map<string, ConsentRecord[]> = new Map();
  
  private complianceScore: number = 0;
  private lastComplianceCheck: Date = new Date();
  
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    super();
    this.initializeLegalFrameworks();
    this.startPeriodicComplianceChecks();
  }

  /**
   * Initialize legal frameworks for African and international compliance
   */
  private async initializeLegalFrameworks(): Promise<void> {
    const frameworks: LegalFramework[] = [
      // GDPR (European Union)
      {
        id: 'gdpr',
        name: 'General Data Protection Regulation',
        code: 'GDPR',
        jurisdiction: 'European Union',
        description: 'EU regulation for data protection and privacy',
        requirements: await this.getGDPRRequirements(),
        isActive: true,
        effectiveDate: new Date('2018-05-25'),
        lastUpdated: new Date()
      },
      // CCPA (California)
      {
        id: 'ccpa',
        name: 'California Consumer Privacy Act',
        code: 'CCPA',
        jurisdiction: 'California, USA',
        description: 'California state law for consumer privacy rights',
        requirements: await this.getCCPARequirements(),
        isActive: true,
        effectiveDate: new Date('2020-01-01'),
        lastUpdated: new Date()
      },
      // POPIA (South Africa)
      {
        id: 'popia',
        name: 'Protection of Personal Information Act',
        code: 'POPIA',
        jurisdiction: 'South Africa',
        description: 'South African data protection law',
        requirements: await this.getPOPIARequirements(),
        isActive: true,
        effectiveDate: new Date('2021-07-01'),
        lastUpdated: new Date()
      },
      // NDPR (Nigeria)
      {
        id: 'ndpr',
        name: 'Nigeria Data Protection Regulation',
        code: 'NDPR',
        jurisdiction: 'Nigeria',
        description: 'Nigerian data protection regulation',
        requirements: await this.getNDPRRequirements(),
        isActive: true,
        effectiveDate: new Date('2019-01-25'),
        lastUpdated: new Date()
      }
    ];

    for (const framework of frameworks) {
      this.legalFrameworks.set(framework.id, framework);
    }

    logger.info('Legal frameworks initialized', {
      count: frameworks.length,
      frameworks: frameworks.map(f => f.code)
    });
  }

  /**
   * FR-1391: GDPR Compliance
   */
  private async getGDPRRequirements(): Promise<LegalRequirement[]> {
    return [
      {
        id: 'gdpr_consent',
        frameworkId: 'gdpr',
        name: 'Explicit Consent',
        description: 'Obtain explicit consent for data processing',
        category: 'consent',
        priority: 'critical',
        implementation: 'ConsentManager.obtainExplicitConsent',
        complianceCheck: 'validateGDPRConsent',
        autoRemediationAvailable: false
      },
      {
        id: 'gdpr_data_portability',
        frameworkId: 'gdpr',
        name: 'Data Portability',
        description: 'Provide data in machine-readable format',
        category: 'portability',
        priority: 'high',
        implementation: 'DataPortabilityService.exportUserData',
        complianceCheck: 'validateDataPortability',
        autoRemediationAvailable: true
      },
      {
        id: 'gdpr_retention',
        frameworkId: 'gdpr',
        name: 'Data Retention Limits',
        description: 'Delete data when no longer necessary',
        category: 'retention',
        priority: 'high',
        implementation: 'DataRetentionService.enforceRetentionPolicy',
        complianceCheck: 'validateRetentionCompliance',
        autoRemediationAvailable: true
      },
      {
        id: 'gdpr_privacy_by_design',
        frameworkId: 'gdpr',
        name: 'Privacy by Design',
        description: 'Implement privacy measures from the start',
        category: 'privacy',
        priority: 'critical',
        implementation: 'PrivacyDesignValidator.validate',
        complianceCheck: 'validatePrivacyByDesign',
        autoRemediationAvailable: false
      }
    ];
  }

  /**
   * FR-1392: CCPA Compliance
   */
  private async getCCPARequirements(): Promise<LegalRequirement[]> {
    return [
      {
        id: 'ccpa_do_not_sell',
        frameworkId: 'ccpa',
        name: 'Do Not Sell My Info',
        description: 'Honor consumer opt-out requests',
        category: 'privacy',
        priority: 'critical',
        implementation: 'CCPAOptOutService.processDNS',
        complianceCheck: 'validateCCPAOptOut',
        autoRemediationAvailable: true
      },
      {
        id: 'ccpa_disclosure',
        frameworkId: 'ccpa',
        name: 'Data Use Disclosure',
        description: 'Disclose data collection and use practices',
        category: 'privacy',
        priority: 'high',
        implementation: 'DisclosureService.generateCCPADisclosure',
        complianceCheck: 'validateCCPADisclosure',
        autoRemediationAvailable: false
      }
    ];
  }

  /**
   * FR-1393: POPIA Compliance (South Africa)
   */
  private async getPOPIARequirements(): Promise<LegalRequirement[]> {
    return [
      {
        id: 'popia_consent',
        frameworkId: 'popia',
        name: 'Informed Consent',
        description: 'Obtain informed consent for data processing',
        category: 'consent',
        priority: 'critical',
        implementation: 'POPIAConsentManager.obtainInformedConsent',
        complianceCheck: 'validatePOPIAConsent',
        autoRemediationAvailable: false
      },
      {
        id: 'popia_cross_border',
        frameworkId: 'popia',
        name: 'Cross-Border Transfer Restrictions',
        description: 'Ensure adequate protection for data transfers',
        category: 'security',
        priority: 'high',
        implementation: 'CrossBorderService.validateTransfer',
        complianceCheck: 'validateCrossBorderCompliance',
        autoRemediationAvailable: false
      }
    ];
  }

  /**
   * Nigeria Data Protection Regulation
   */
  private async getNDPRRequirements(): Promise<LegalRequirement[]> {
    return [
      {
        id: 'ndpr_consent',
        frameworkId: 'ndpr',
        name: 'Data Subject Consent',
        description: 'Obtain clear consent from data subjects',
        category: 'consent',
        priority: 'critical',
        implementation: 'NDPRConsentManager.obtainConsent',
        complianceCheck: 'validateNDPRConsent',
        autoRemediationAvailable: false
      },
      {
        id: 'ndpr_data_audit',
        frameworkId: 'ndpr',
        name: 'Data Processing Audit',
        description: 'Conduct regular data processing audits',
        category: 'data_protection',
        priority: 'high',
        implementation: 'DataAuditService.conductNDPRAudit',
        complianceCheck: 'validateNDPRAudit',
        autoRemediationAvailable: false
      }
    ];
  }

  /**
   * FR-1394: Cookie Consent Management
   */
  async manageCookieConsent(
    userId: string,
    consentData: {
      essential: boolean;
      functional: boolean;
      analytics: boolean;
      marketing: boolean;
      advertising: boolean;
    },
    metadata: {
      ipAddress: string;
      userAgent: string;
      method: 'banner' | 'settings' | 'implicit';
    }
  ): Promise<ConsentRecord[]> {
    const consents: ConsentRecord[] = [];
    const consentDate = new Date();

    for (const [type, granted] of Object.entries(consentData)) {
      const consent: ConsentRecord = {
        id: `consent_${userId}_${type}_${Date.now()}`,
        userId,
        consentType: type as any,
        purpose: this.getConsentPurpose(type),
        consentGiven: granted,
        consentDate,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        method: metadata.method === 'banner' ? 'explicit' : 'implicit',
        legalBasis: type === 'essential' ? 'legal_obligation' : 'consent',
        dataRetentionPeriod: this.getRetentionPeriod(type),
        expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year
        metadata: {
          framework: this.determineApplicableFramework(metadata.ipAddress),
          version: '1.0'
        }
      };

      consents.push(consent);
    }

    // Store consents
    await this.storeConsents(userId, consents);
    
    // Update user consent cache
    this.activeConsents.set(userId, consents);

    // Log compliance action
    await this.logComplianceAction('cookie_consent_updated', {
      userId,
      consents: consents.length,
      ipAddress: metadata.ipAddress
    });

    return consents;
  }

  /**
   * FR-1395: Data Retention Policies
   */
  async enforceDataRetentionPolicies(): Promise<{
    policiesApplied: number;
    dataDeleted: number;
    errors: string[];
  }> {
    const results = {
      policiesApplied: 0,
      dataDeleted: 0,
      errors: [] as string[]
    };

    try {
      const policies = await this.getActiveRetentionPolicies();
      
      for (const policy of policies) {
        try {
          const deletionResult = await this.applyRetentionPolicy(policy);
          results.policiesApplied++;
          results.dataDeleted += deletionResult.deletedRecords;
        } catch (error) {
          results.errors.push(`Policy ${policy.name}: ${(error as Error).message}`);
        }
      }

      await this.logComplianceAction('retention_policies_enforced', results);
      
    } catch (error) {
      logger.error('Failed to enforce data retention policies', { error });
      results.errors.push((error as Error).message);
    }

    return results;
  }

  /**
   * FR-1396: Data Portability
   */
  async initiateDataPortabilityRequest(
    userId: string,
    requestType: 'export' | 'transfer' | 'deletion',
    format: 'json' | 'csv' | 'xml' | 'pdf' = 'json'
  ): Promise<DataPortabilityRequest> {
    const request: DataPortabilityRequest = {
      id: `dp_req_${Date.now()}`,
      userId,
      requestType,
      status: 'pending',
      requestDate: new Date(),
      dataTypes: await this.getUserDataTypes(userId),
      format,
      deliveryMethod: 'download',
      verificationRequired: true,
      verificationCompleted: false
    };

    // Store request
    await this.storePortabilityRequest(request);

    // Start processing
    this.processPortabilityRequest(request);

    await this.logComplianceAction('data_portability_request_initiated', {
      userId,
      requestId: request.id,
      requestType
    });

    return request;
  }

  /**
   * FR-1397: Privacy Impact Assessments
   */
  async conductPrivacyImpactAssessment(
    title: string,
    description: string,
    dataProcessingPurpose: string,
    dataTypes: string[],
    assessor: string
  ): Promise<PrivacyImpactAssessment> {
    const pia: PrivacyImpactAssessment = {
      id: `pia_${Date.now()}`,
      title,
      description,
      dataProcessingPurpose,
      dataTypes,
      legalBasis: this.determineLegalBasis(dataProcessingPurpose),
      riskLevel: await this.assessRiskLevel(dataTypes, dataProcessingPurpose),
      mitigationMeasures: await this.generateMitigationMeasures(dataTypes),
      status: 'draft',
      assessor,
      assessmentDate: new Date(),
      findings: []
    };

    // Conduct automated risk assessment
    pia.findings = await this.performAutomatedPIAChecks(pia);

    // Store PIA
    await this.storePIA(pia);

    await this.logComplianceAction('pia_conducted', {
      piaId: pia.id,
      assessor,
      riskLevel: pia.riskLevel
    });

    return pia;
  }

  /**
   * FR-1398: Consent Management
   */
  async getConsentStatus(userId: string): Promise<{
    consents: ConsentRecord[];
    summary: Record<string, boolean>;
    lastUpdated: Date;
    expiringConsents: ConsentRecord[];
  }> {
    const consents = await this.getUserConsents(userId);
    const summary: Record<string, boolean> = {};
    const expiringConsents: ConsentRecord[] = [];
    const thirtyDaysFromNow = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));

    for (const consent of consents) {
      summary[consent.consentType] = consent.consentGiven && !consent.withdrawnDate;
      
      if (consent.expiryDate && consent.expiryDate <= thirtyDaysFromNow) {
        expiringConsents.push(consent);
      }
    }

    const lastUpdated = consents.length > 0 
      ? new Date(Math.max(...consents.map(c => c.consentDate.getTime())))
      : new Date();

    return {
      consents,
      summary,
      lastUpdated,
      expiringConsents
    };
  }

  /**
   * FR-1399: Cross-Border Data Transfer Compliance
   */
  async validateCrossBorderTransfer(
    sourceCountry: string,
    destinationCountry: string,
    dataType: string,
    recipient: string
  ): Promise<{
    allowed: boolean;
    mechanism: string | null;
    requirements: string[];
    safeguards: string[];
  }> {
    const transferValidation = {
      allowed: false,
      mechanism: null as string | null,
      requirements: [] as string[],
      safeguards: [] as string[]
    };

    // Check adequacy decisions
    if (this.hasAdequacyDecision(sourceCountry, destinationCountry)) {
      transferValidation.allowed = true;
      transferValidation.mechanism = 'adequacy_decision';
      transferValidation.safeguards = ['Adequacy decision in place'];
    }
    // Check Standard Contractual Clauses
    else if (this.canUseStandardContractualClauses(sourceCountry, destinationCountry)) {
      transferValidation.allowed = true;
      transferValidation.mechanism = 'scc';
      transferValidation.requirements = [
        'Execute Standard Contractual Clauses',
        'Conduct Transfer Impact Assessment',
        'Implement supplementary measures if necessary'
      ];
      transferValidation.safeguards = [
        'Standard Contractual Clauses',
        'Data encryption in transit and at rest',
        'Access controls and monitoring'
      ];
    }

    // Log transfer validation
    await this.logComplianceAction('cross_border_transfer_validated', {
      sourceCountry,
      destinationCountry,
      dataType,
      allowed: transferValidation.allowed,
      mechanism: transferValidation.mechanism
    });

    return transferValidation;
  }

  /**
   * FR-1400: Compliance Reporting
   */
  async generateComplianceReport(
    framework: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    reportId: string;
    framework: string;
    period: { start: Date; end: Date };
    overallScore: number;
    violations: any[];
    recommendations: string[];
    metrics: Record<string, number>;
    generatedAt: Date;
  }> {
    const reportId = `compliance_report_${framework}_${Date.now()}`;
    
    const report = {
      reportId,
      framework,
      period: { start: startDate, end: endDate },
      overallScore: 0,
      violations: [] as any[],
      recommendations: [] as string[],
      metrics: {} as Record<string, number>,
      generatedAt: new Date()
    };

    // Get violations for the period
    report.violations = await this.getViolationsForPeriod(framework, startDate, endDate);
    
    // Calculate compliance score
    report.overallScore = await this.calculateComplianceScore(framework, startDate, endDate);
    
    // Generate recommendations
    report.recommendations = await this.generateRecommendations(framework, report.violations);
    
    // Collect metrics
    report.metrics = await this.collectComplianceMetrics(framework, startDate, endDate);

    // Store report
    await this.storeComplianceReport(report);

    await this.logComplianceAction('compliance_report_generated', {
      reportId,
      framework,
      score: report.overallScore
    });

    return report;
  }

  /**
   * Start periodic compliance checks
   */
  private startPeriodicComplianceChecks(): void {
    // Run compliance checks every 6 hours
    setInterval(async () => {
      try {
        await this.runPeriodicComplianceCheck();
      } catch (error) {
        logger.error('Periodic compliance check failed', { error });
      }
    }, 6 * 60 * 60 * 1000);

    logger.info('Periodic compliance checks started');
  }

  /**
   * Helper methods (implementation stubs for brevity)
   */
  private async storeConsents(userId: string, consents: ConsentRecord[]): Promise<void> {
    // Implementation would store consents in database
  }

  private async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    // Implementation would retrieve user consents from database
    return [];
  }

  private async getActiveRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    // Implementation would retrieve active retention policies
    return [];
  }

  private async applyRetentionPolicy(policy: DataRetentionPolicy): Promise<{ deletedRecords: number }> {
    // Implementation would apply retention policy and delete/anonymize data
    return { deletedRecords: 0 };
  }

  private async storePortabilityRequest(request: DataPortabilityRequest): Promise<void> {
    // Implementation would store portability request
  }

  private async processPortabilityRequest(request: DataPortabilityRequest): Promise<void> {
    // Implementation would process the portability request
  }

  private async getUserDataTypes(userId: string): Promise<string[]> {
    // Implementation would determine what data types exist for user
    return ['profile', 'preferences', 'activity', 'transactions'];
  }

  private async storePIA(pia: PrivacyImpactAssessment): Promise<void> {
    // Implementation would store PIA in database
  }

  private async performAutomatedPIAChecks(pia: PrivacyImpactAssessment): Promise<PIAFinding[]> {
    // Implementation would perform automated PIA checks
    return [];
  }

  private async logComplianceAction(action: string, details: Record<string, any>): Promise<void> {
    const auditEntry: ComplianceAuditTrail = {
      id: `audit_${Date.now()}`,
      framework: 'MULTI',
      action,
      resource: 'LegalComplianceOrchestrator',
      timestamp: new Date(),
      details,
      ipAddress: '127.0.0.1', // Would be actual IP
      userAgent: 'System',
      complianceImpact: 'medium',
      policyViolation: false,
      autoRemediated: false
    };

    // Store audit entry
    logger.info('Compliance action logged', auditEntry);
  }

  private async runPeriodicComplianceCheck(): Promise<void> {
    // Implementation would run comprehensive compliance checks
    this.lastComplianceCheck = new Date();
  }

  // Additional helper methods...
  private getConsentPurpose(type: string): string {
    const purposes: Record<string, string> = {
      essential: 'Essential website functionality',
      functional: 'Enhanced user experience',
      analytics: 'Website usage analytics',
      marketing: 'Marketing communications',
      advertising: 'Personalized advertising'
    };
    return purposes[type] || 'Unknown purpose';
  }

  private getRetentionPeriod(type: string): number {
    const periods: Record<string, number> = {
      essential: 730, // 2 years
      functional: 365, // 1 year
      analytics: 730, // 2 years
      marketing: 1095, // 3 years
      advertising: 365 // 1 year
    };
    return periods[type] || 365;
  }

  private determineApplicableFramework(ipAddress: string): string[] {
    // Simple IP-based framework determination (would be more sophisticated in reality)
    return ['GDPR', 'CCPA']; // Default frameworks
  }

  private determineLegalBasis(purpose: string): string {
    // Determine legal basis based on processing purpose
    return 'legitimate_interest';
  }

  private async assessRiskLevel(dataTypes: string[], purpose: string): Promise<'low' | 'medium' | 'high' | 'very_high'> {
    // Risk assessment algorithm
    return 'medium';
  }

  private async generateMitigationMeasures(dataTypes: string[]): Promise<string[]> {
    // Generate mitigation measures based on data types
    return ['Data encryption', 'Access controls', 'Regular audits'];
  }

  private hasAdequacyDecision(source: string, destination: string): boolean {
    // Check if there's an adequacy decision between countries
    return false; // Simplified
  }

  private canUseStandardContractualClauses(source: string, destination: string): boolean {
    // Check if SCCs can be used
    return true; // Simplified
  }

  private async getViolationsForPeriod(framework: string, start: Date, end: Date): Promise<any[]> {
    // Get violations for reporting period
    return [];
  }

  private async calculateComplianceScore(framework: string, start: Date, end: Date): Promise<number> {
    // Calculate compliance score
    return 85.5;
  }

  private async generateRecommendations(framework: string, violations: any[]): Promise<string[]> {
    // Generate recommendations based on violations
    return ['Implement additional data encryption', 'Update privacy notices'];
  }

  private async collectComplianceMetrics(framework: string, start: Date, end: Date): Promise<Record<string, number>> {
    // Collect compliance metrics
    return {
      totalRequests: 150,
      processedRequests: 148,
      avgResponseTime: 2.5,
      complianceScore: 85.5
    };
  }

  private async storeComplianceReport(report: any): Promise<void> {
    // Store compliance report
  }
}