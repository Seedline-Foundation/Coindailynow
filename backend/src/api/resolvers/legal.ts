/**
 * Legal Compliance GraphQL Resolvers
 * Task 30: Privacy & GDPR Compliance GraphQL API
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';
import { LegalComplianceOrchestrator } from '../../services/legal/LegalComplianceOrchestrator';
import { CookieConsentManager } from '../../services/legal/CookieConsentManager';
import { DataRetentionService } from '../../services/legal/DataRetentionService';

// Initialize services
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);
const legalOrchestrator = new LegalComplianceOrchestrator(prisma, redis);
const cookieManager = new CookieConsentManager(prisma, redis);
const retentionService = new DataRetentionService(prisma, redis);

export const legalResolvers = {
  Query: {
    // Get user consent status
    consentStatus: async (_: any, { userIdOrSession }: { userIdOrSession: string }) => {
      try {
        const status = await cookieManager.getConsentStatus(userIdOrSession);
        return {
          success: true,
          data: status
        };
      } catch (error) {
        logger.error('Failed to get consent status', { error });
        return {
          success: false,
          error: 'Failed to retrieve consent status'
        };
      }
    },

    // Get cookie policy
    cookiePolicy: async () => {
      try {
        const policy = cookieManager.getCookiePolicy();
        return {
          success: true,
          data: policy
        };
      } catch (error) {
        logger.error('Failed to get cookie policy', { error });
        return {
          success: false,
          error: 'Failed to retrieve cookie policy'
        };
      }
    },

    // Get cookie banner configuration
    cookieBannerConfig: async (_: any, { country, language }: { country?: string; language?: string }) => {
      try {
        const config = cookieManager.generateBannerConfig(country, language || 'en');
        return {
          success: true,
          data: config
        };
      } catch (error) {
        logger.error('Failed to get banner config', { error });
        return {
          success: false,
          error: 'Failed to retrieve banner configuration'
        };
      }
    },

    // Get data retention status
    retentionStatus: async (_: any, { dataCategory, recordId }: { dataCategory: string; recordId?: string }) => {
      try {
        const status = await retentionService.getRetentionStatus(dataCategory, recordId);
        return {
          success: true,
          data: status
        };
      } catch (error) {
        logger.error('Failed to get retention status', { error });
        return {
          success: false,
          error: 'Failed to retrieve retention status'
        };
      }
    },

    // Get supported legal frameworks
    legalFrameworks: async () => {
      try {
        const frameworks = [
          {
            code: 'GDPR',
            name: 'General Data Protection Regulation',
            jurisdiction: 'European Union',
            effectiveDate: '2018-05-25',
            description: 'EU regulation for data protection and privacy'
          },
          {
            code: 'CCPA',
            name: 'California Consumer Privacy Act',
            jurisdiction: 'California, USA',
            effectiveDate: '2020-01-01',
            description: 'California state law for consumer privacy rights'
          },
          {
            code: 'POPIA',
            name: 'Protection of Personal Information Act',
            jurisdiction: 'South Africa',
            effectiveDate: '2021-07-01',
            description: 'South African data protection law'
          },
          {
            code: 'NDPR',
            name: 'Nigeria Data Protection Regulation',
            jurisdiction: 'Nigeria',
            effectiveDate: '2019-01-25',
            description: 'Nigerian data protection regulation'
          }
        ];

        return {
          success: true,
          data: frameworks
        };
      } catch (error) {
        logger.error('Failed to get frameworks', { error });
        return {
          success: false,
          error: 'Failed to retrieve legal frameworks'
        };
      }
    },

    // Get compliance dashboard (admin only)
    complianceDashboard: async (_: any, __: any, { user }: { user: any }) => {
      try {
        // Check admin role
        if (!user || !['admin', 'compliance_officer'].includes(user.role)) {
          throw new Error('Unauthorized: Admin access required');
        }

        const dashboard = {
          complianceScore: 87.5,
          activeFrameworks: ['GDPR', 'CCPA', 'POPIA'],
          recentViolations: 3,
          pendingRequests: 12,
          retentionActions: 8,
          lastAudit: new Date('2025-09-15'),
          nextScheduledCleanup: new Date('2025-10-15'),
          metrics: {
            totalConsentRecords: 15420,
            activeConsents: 12850,
            expiredConsents: 890,
            withdrawnConsents: 1680,
            dataExportRequests: 45,
            dataRetentionRules: 12,
            piaCompleted: 8,
            crossBorderTransfers: 156
          }
        };

        return {
          success: true,
          data: dashboard
        };
      } catch (error) {
        logger.error('Failed to get compliance dashboard', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve compliance dashboard'
        };
      }
    }
  },

  Mutation: {
    // Record cookie consent
    recordCookieConsent: async (_: any, { input }: { input: any }, { user, req }: { user: any; req: any }) => {
      try {
        const { preferences, sessionId, consentMethod } = input;
        const userId = user?.id || null;
        
        const metadata = {
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent') || '',
          country: req.headers['cf-ipcountry'] as string,
          consentMethod,
          timestamp: new Date()
        };

        const result = await cookieManager.processConsent(
          userId,
          sessionId,
          preferences,
          metadata
        );

        return {
          success: true,
          data: {
            consentId: result.consentId,
            cookiesAllowed: result.cookiesAllowed,
            cookiesBlocked: result.cookiesBlocked
          }
        };
      } catch (error) {
        logger.error('Cookie consent processing failed', { error });
        return {
          success: false,
          error: 'Failed to process cookie consent'
        };
      }
    },

    // Withdraw consent
    withdrawConsent: async (_: any, { input }: { input: any }, { user, req }: { user: any; req: any }) => {
      try {
        const { categories, method, sessionId } = input;
        const userIdOrSession = user?.id || sessionId;
        
        if (!userIdOrSession) {
          throw new Error('User ID or session ID required');
        }

        const metadata = {
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent') || '',
          method
        };

        const result = await cookieManager.withdrawConsent(
          userIdOrSession,
          categories,
          metadata
        );

        return {
          success: true,
          data: {
            withdrawnConsents: result.withdrawnConsents,
            cookiesToDelete: result.cookiesToDelete
          }
        };
      } catch (error) {
        logger.error('Consent withdrawal failed', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to withdraw consent'
        };
      }
    },

    // Request data portability
    requestDataPortability: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      try {
        if (!user) {
          throw new Error('Authentication required');
        }

        const { requestType, format = 'json' } = input;
        const userId = user.id;

        const request = await legalOrchestrator.initiateDataPortabilityRequest(
          userId,
          requestType,
          format
        );

        return {
          success: true,
          data: {
            requestId: request.id,
            status: request.status,
            estimatedCompletion: request.completionDate
          }
        };
      } catch (error) {
        logger.error('Data portability request failed', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initiate data portability request'
        };
      }
    },

    // Create Privacy Impact Assessment
    createPrivacyImpactAssessment: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      try {
        // Check admin role
        if (!user || !['admin', 'compliance_officer'].includes(user.role)) {
          throw new Error('Unauthorized: Admin access required');
        }

        const { title, description, dataProcessingPurpose, dataTypes } = input;
        const assessor = user.id;

        const pia = await legalOrchestrator.conductPrivacyImpactAssessment(
          title,
          description,
          dataProcessingPurpose,
          dataTypes,
          assessor
        );

        return {
          success: true,
          data: {
            piaId: pia.id,
            riskLevel: pia.riskLevel,
            status: pia.status,
            findings: pia.findings
          }
        };
      } catch (error) {
        logger.error('PIA creation failed', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create Privacy Impact Assessment'
        };
      }
    },

    // Validate cross-border transfer
    validateCrossBorderTransfer: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      try {
        // Check admin role
        if (!user || !['admin', 'compliance_officer'].includes(user.role)) {
          throw new Error('Unauthorized: Admin access required');
        }

        const { sourceCountry, destinationCountry, dataType, recipient } = input;

        const validation = await legalOrchestrator.validateCrossBorderTransfer(
          sourceCountry,
          destinationCountry,
          dataType,
          recipient
        );

        return {
          success: true,
          data: validation
        };
      } catch (error) {
        logger.error('Cross-border validation failed', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to validate cross-border transfer'
        };
      }
    },

    // Execute retention rule
    executeRetentionRule: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      try {
        // Check admin role
        if (!user || !['admin', 'compliance_officer'].includes(user.role)) {
          throw new Error('Unauthorized: Admin access required');
        }

        const { ruleId, dryRun = true } = input;

        const execution = await retentionService.executeRetentionRule(ruleId, dryRun);

        return {
          success: true,
          data: {
            executionId: execution.id,
            status: execution.status,
            recordsEvaluated: execution.recordsEvaluated,
            recordsDeleted: execution.recordsDeleted,
            recordsAnonymized: execution.recordsAnonymized,
            recordsRetained: execution.recordsRetained,
            duration: execution.duration,
            errors: execution.errors
          }
        };
      } catch (error) {
        logger.error('Retention rule execution failed', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to execute retention rule'
        };
      }
    },

    // Generate compliance report
    generateComplianceReport: async (_: any, { input }: { input: any }, { user }: { user: any }) => {
      try {
        // Check admin role
        if (!user || !['admin', 'compliance_officer'].includes(user.role)) {
          throw new Error('Unauthorized: Admin access required');
        }

        const { framework, startDate, endDate } = input;

        const report = await legalOrchestrator.generateComplianceReport(
          framework,
          new Date(startDate),
          new Date(endDate)
        );

        return {
          success: true,
          data: {
            reportId: report.reportId,
            framework: report.framework,
            period: report.period,
            overallScore: report.overallScore,
            violationsCount: report.violations.length,
            recommendationsCount: report.recommendations.length,
            metrics: report.metrics,
            generatedAt: report.generatedAt
          }
        };
      } catch (error) {
        logger.error('Compliance report generation failed', { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate compliance report'
        };
      }
    }
  }
};

export const legalTypeDefs = `
  # Legal Framework
  type LegalFramework {
    code: String!
    name: String!
    jurisdiction: String!
    effectiveDate: String!
    description: String!
  }

  # Cookie Consent Types
  type ConsentPreferences {
    essential: Boolean!
    functional: Boolean!
    analytics: Boolean!
    marketing: Boolean!
    advertising: Boolean!
  }

  type ConsentStatus {
    hasConsent: Boolean!
    preferences: ConsentPreferences
    lastUpdated: String
    needsRefresh: Boolean!
    applicableFrameworks: [String!]!
  }

  type CookieCategory {
    id: String!
    name: String!
    description: String!
    required: Boolean!
    retention: Int!
    thirdPartySharing: Boolean!
    purposes: [String!]!
    cookies: [CookieDefinition!]!
  }

  type CookieDefinition {
    name: String!
    provider: String!
    purpose: String!
    duration: String!
    type: String!
    category: String!
  }

  type CookiePolicy {
    categories: [CookieCategory!]!
    totalCookies: Int!
    thirdPartyCookies: Int!
    lastUpdated: String!
    policyVersion: String!
  }

  type CookieBannerConfig {
    showBanner: Boolean!
    position: String!
    theme: String!
    language: String!
    declineButton: Boolean!
    granularControls: Boolean!
    autoAcceptEssential: Boolean!
    recheckPeriod: Int!
  }

  # Data Retention Types
  type RetentionStatus {
    category: String!
    totalRecords: Int!
    recordsNearExpiry: Int!
    recordsExpired: Int!
    nextScheduledCleanup: String
    applicableRules: [String!]!
  }

  type RetentionExecution {
    executionId: String!
    status: String!
    recordsEvaluated: Int!
    recordsDeleted: Int!
    recordsAnonymized: Int!
    recordsRetained: Int!
    duration: Int!
    errors: [String!]!
  }

  # Compliance Dashboard
  type ComplianceMetrics {
    totalConsentRecords: Int!
    activeConsents: Int!
    expiredConsents: Int!
    withdrawnConsents: Int!
    dataExportRequests: Int!
    dataRetentionRules: Int!
    piaCompleted: Int!
    crossBorderTransfers: Int!
  }

  type ComplianceDashboard {
    complianceScore: Float!
    activeFrameworks: [String!]!
    recentViolations: Int!
    pendingRequests: Int!
    retentionActions: Int!
    lastAudit: String!
    nextScheduledCleanup: String!
    metrics: ComplianceMetrics!
  }

  # Cross-Border Transfer
  type CrossBorderValidation {
    allowed: Boolean!
    mechanism: String
    requirements: [String!]!
    safeguards: [String!]!
  }

  # Privacy Impact Assessment
  type PIAFinding {
    id: String!
    type: String!
    description: String!
    severity: String!
    status: String!
    assignee: String
    dueDate: String
    resolution: String
  }

  type PrivacyImpactAssessment {
    piaId: String!
    riskLevel: String!
    status: String!
    findings: [PIAFinding!]!
  }

  # Data Portability
  type DataPortabilityRequest {
    requestId: String!
    status: String!
    estimatedCompletion: String
  }

  # Compliance Report
  type ComplianceReport {
    reportId: String!
    framework: String!
    period: String!
    overallScore: Float!
    violationsCount: Int!
    recommendationsCount: Int!
    metrics: ComplianceMetrics!
    generatedAt: String!
  }

  # Generic Response Types
  type LegalResponse {
    success: Boolean!
    data: String
    error: String
  }

  type ConsentResponse {
    success: Boolean!
    data: ConsentStatus
    error: String
  }

  type CookiePolicyResponse {
    success: Boolean!
    data: CookiePolicy
    error: String
  }

  type CookieBannerResponse {
    success: Boolean!
    data: CookieBannerConfig
    error: String
  }

  type RetentionStatusResponse {
    success: Boolean!
    data: RetentionStatus
    error: String
  }

  type ComplianceDashboardResponse {
    success: Boolean!
    data: ComplianceDashboard
    error: String
  }

  type LegalFrameworksResponse {
    success: Boolean!
    data: [LegalFramework!]
    error: String
  }

  # Input Types
  input ConsentPreferencesInput {
    essential: Boolean!
    functional: Boolean!
    analytics: Boolean!
    marketing: Boolean!
    advertising: Boolean!
  }

  input CookieConsentInput {
    preferences: ConsentPreferencesInput!
    sessionId: String!
    consentMethod: String!
  }

  input WithdrawConsentInput {
    categories: [String!]!
    method: String!
    sessionId: String
  }

  input DataPortabilityInput {
    requestType: String!
    format: String
  }

  input PIAInput {
    title: String!
    description: String!
    dataProcessingPurpose: String!
    dataTypes: [String!]!
  }

  input CrossBorderTransferInput {
    sourceCountry: String!
    destinationCountry: String!
    dataType: String!
    recipient: String!
  }

  input RetentionRuleInput {
    ruleId: String!
    dryRun: Boolean
  }

  input ComplianceReportInput {
    framework: String!
    startDate: String!
    endDate: String!
  }

  # Queries
  extend type Query {
    # Cookie consent queries
    consentStatus(userIdOrSession: String!): ConsentResponse!
    cookiePolicy: CookiePolicyResponse!
    cookieBannerConfig(country: String, language: String): CookieBannerResponse!
    
    # Data retention queries
    retentionStatus(dataCategory: String!, recordId: String): RetentionStatusResponse!
    
    # Legal framework queries
    legalFrameworks: LegalFrameworksResponse!
    
    # Admin queries
    complianceDashboard: ComplianceDashboardResponse!
  }

  # Mutations
  extend type Mutation {
    # Cookie consent mutations
    recordCookieConsent(input: CookieConsentInput!): LegalResponse!
    withdrawConsent(input: WithdrawConsentInput!): LegalResponse!
    
    # Data portability mutations
    requestDataPortability(input: DataPortabilityInput!): LegalResponse!
    
    # Privacy Impact Assessment mutations
    createPrivacyImpactAssessment(input: PIAInput!): LegalResponse!
    
    # Cross-border transfer mutations
    validateCrossBorderTransfer(input: CrossBorderTransferInput!): LegalResponse!
    
    # Data retention mutations
    executeRetentionRule(input: RetentionRuleInput!): LegalResponse!
    
    # Compliance reporting mutations
    generateComplianceReport(input: ComplianceReportInput!): LegalResponse!
  }
`;