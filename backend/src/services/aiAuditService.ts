/**
 * AI Audit & Compliance Logging Service
 * 
 * Comprehensive audit logging system for all AI operations with GDPR compliance,
 * decision tracking, data retention management, and compliance reporting.
 * 
 * Features:
 * - Complete audit trail for all AI operations
 * - Decision reasoning and explainability
 * - GDPR compliance and user consent management
 * - 2-year data retention with automatic archival
 * - Compliance report generation
 * - Right to explanation for AI decisions
 * 
 * @module aiAuditService
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ================================
// TYPES & INTERFACES
// ================================

export interface AuditLogInput {
  operationType: string;
  operationCategory: string;
  agentType: string;
  agentId?: string;
  userId?: string;
  requestId: string;
  endpoint?: string;
  httpMethod?: string;
  inputData: any;
  inputTokens?: number;
  modelProvider: string;
  modelName: string;
  modelVersion?: string;
  outputData?: any;
  outputTokens?: number;
  reasoning?: string;
  confidence?: number;
  alternatives?: any[];
  qualityScore?: number;
  thresholds?: any;
  passed?: boolean;
  dataSources?: any[];
  citations?: any[];
  externalAPIs?: any[];
  estimatedCost?: number;
  actualCost?: number;
  processingTimeMs?: number;
  cacheHit?: boolean;
  retryCount?: number;
  status: 'success' | 'failed' | 'partial' | 'timeout';
  errorMessage?: string;
  errorCode?: string;
  metadata?: any;
  tags?: string[];
}

export interface DecisionLogInput {
  auditLogId: string;
  decisionPoint: string;
  decisionType: string;
  decisionOutcome: string;
  primaryReason: string;
  contributingFactors?: any;
  confidenceScore: number;
  alternativeOptions?: any[];
  dataPoints?: any;
  weights?: any;
  thresholds?: any;
  rulesApplied?: any[];
  policiesFollowed?: any[];
  exceptions?: any[];
  expectedImpact?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  biasCheck?: any;
  humanExplanation?: string;
  technicalDetails?: string;
  visualData?: any;
  requiresConsent?: boolean;
  consentObtained?: boolean;
  userNotified?: boolean;
}

export interface ComplianceReportInput {
  reportType: 'gdpr_export' | 'audit_summary' | 'cost_analysis' | 'quality_review';
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  userId?: string;
  agentTypes?: string[];
  operationTypes?: string[];
  requestedBy: string;
  accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  format?: 'JSON' | 'PDF' | 'CSV' | 'XML';
}

export interface UserConsentInput {
  userId: string;
  consentType: string;
  purpose: string;
  scope: any;
  consented: boolean;
  consentMethod?: string;
  consentVersion: string;
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  expiresAt?: Date;
}

export interface AuditQueryOptions {
  operationType?: string;
  operationCategory?: string;
  agentType?: string;
  userId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  humanReviewed?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'processingTimeMs' | 'actualCost';
  sortOrder?: 'asc' | 'desc';
}

// ================================
// AUDIT LOGGING FUNCTIONS
// ================================

/**
 * Create a comprehensive audit log entry for an AI operation
 */
export async function createAuditLog(input: AuditLogInput) {
  const startTime = Date.now();
  
  try {
    // Generate hashes for deduplication
    const inputHash = createHash('sha256')
      .update(JSON.stringify(input.inputData))
      .digest('hex');
    
    const outputHash = input.outputData
      ? createHash('sha256')
          .update(JSON.stringify(input.outputData))
          .digest('hex')
      : null;
    
    // Calculate deletion schedule (2 years from now)
    const deletionScheduled = new Date();
    deletionScheduled.setFullYear(deletionScheduled.getFullYear() + 2);
    
    // Create audit log
    const auditLog = await prisma.aIOperationLog.create({
      data: {
        id: uuidv4(),
        operationType: input.operationType,
        operationCategory: input.operationCategory,
        agentType: input.agentType,
        agentId: input.agentId ?? null,
        userId: input.userId ?? null,
        requestId: input.requestId,
        endpoint: input.endpoint ?? null,
        httpMethod: input.httpMethod ?? null,
        inputData: JSON.stringify(input.inputData),
        inputHash,
        inputTokens: input.inputTokens ?? null,
        outputData: input.outputData ? JSON.stringify(input.outputData) : null,
        outputHash,
        outputTokens: input.outputTokens ?? null,
        modelProvider: input.modelProvider ?? null,
        modelName: input.modelName ?? null,
        modelVersion: input.modelVersion ?? null,
        reasoning: input.reasoning ?? null,
        confidence: input.confidence ?? null,
        alternatives: input.alternatives ? JSON.stringify(input.alternatives) : null,
        qualityScore: input.qualityScore ?? null,
        thresholds: input.thresholds ? JSON.stringify(input.thresholds) : null,
        passed: input.passed ?? null,
        dataSources: input.dataSources ? JSON.stringify(input.dataSources) : null,
        citations: input.citations ? JSON.stringify(input.citations) : null,
        externalAPIs: input.externalAPIs ? JSON.stringify(input.externalAPIs) : null,
        estimatedCost: input.estimatedCost ?? null,
        actualCost: input.actualCost ?? null,
        currency: 'USD',
        processingTimeMs: input.processingTimeMs ?? null,
        cacheHit: input.cacheHit || false,
        retryCount: input.retryCount || 0,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        errorCode: input.errorCode ?? null,
        gdprCompliant: true,
        retentionCategory: 'standard_2year',
        deletionScheduled,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Created audit log ${auditLog.id} in ${duration}ms`);
    
    return auditLog;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to create audit log in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Create a detailed decision log for AI reasoning and explainability
 */
export async function createDecisionLog(input: DecisionLogInput) {
  const startTime = Date.now();
  
  try {
    const decisionLog = await prisma.aIDecision.create({
      data: {
        id: uuidv4(),
        auditLogId: input.auditLogId,
        decisionPoint: input.decisionPoint,
        decisionType: input.decisionType,
        decisionOutcome: input.decisionOutcome,
        primaryReason: input.primaryReason,
        contributingFactors: input.contributingFactors ? JSON.stringify(input.contributingFactors) : null,
        confidenceScore: input.confidenceScore,
        alternativeOptions: input.alternativeOptions ? JSON.stringify(input.alternativeOptions) : null,
        dataPoints: input.dataPoints ? JSON.stringify(input.dataPoints) : null,
        weights: input.weights ? JSON.stringify(input.weights) : null,
        thresholds: input.thresholds ? JSON.stringify(input.thresholds) : null,
        rulesApplied: input.rulesApplied ? JSON.stringify(input.rulesApplied) : null,
        policiesFollowed: input.policiesFollowed ? JSON.stringify(input.policiesFollowed) : null,
        exceptions: input.exceptions ? JSON.stringify(input.exceptions) : null,
        expectedImpact: input.expectedImpact ?? null,
        riskLevel: input.riskLevel ?? null,
        biasCheck: input.biasCheck ? JSON.stringify(input.biasCheck) : null,
        humanExplanation: input.humanExplanation ?? null,
        technicalDetails: input.technicalDetails ?? null,
        visualData: input.visualData ? JSON.stringify(input.visualData) : null,
        requiresConsent: input.requiresConsent || false,
        consentObtained: input.consentObtained ?? null,
        userNotified: input.userNotified || false,
        rightToExplanation: true,
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Created decision log ${decisionLog.id} in ${duration}ms`);
    
    return decisionLog;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to create decision log in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: AuditQueryOptions = {}) {
  const startTime = Date.now();
  
  try {
    const where: any = {};
    
    if (options.operationType) where.operationType = options.operationType;
    if (options.operationCategory) where.operationCategory = options.operationCategory;
    if (options.agentType) where.agentType = options.agentType;
    if (options.userId) where.userId = options.userId;
    if (options.status) where.status = options.status;
    if (options.humanReviewed !== undefined) where.humanReviewed = options.humanReviewed;
    
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }
    
    const [logs, total] = await Promise.all([
      prisma.aIOperationLog.findMany({
        where,
        take: options.limit || 100,
        skip: options.offset || 0,
        orderBy: {
          [options.sortBy || 'createdAt']: options.sortOrder || 'desc',
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          AIDecisionLog: true,
        },
      }),
      prisma.aIOperationLog.count({ where }),
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved ${logs.length} audit logs in ${duration}ms`);
    
    return {
      logs,
      total,
      limit: options.limit || 100,
      offset: options.offset || 0,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve audit logs in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get a specific audit log by ID with full details
 */
export async function getAuditLogById(id: string) {
  const startTime = Date.now();
  
  try {
    const log = await prisma.aIOperationLog.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        AIDecisionLog: true,
      },
    });
    
    if (!log) {
      throw new Error(`Audit log ${id} not found`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved audit log ${id} in ${duration}ms`);
    
    return log;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve audit log ${id} in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get decision logs for a specific audit log
 */
export async function getDecisionLogs(auditLogId: string) {
  const startTime = Date.now();
  
  try {
    const decisions = await prisma.aIDecision.findMany({
      where: { auditLogId },
      orderBy: { createdAt: 'asc' },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved ${decisions.length} decision logs in ${duration}ms`);
    
    return decisions;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve decision logs in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get a specific decision log with full explanation
 */
export async function getDecisionById(id: string) {
  const startTime = Date.now();
  
  try {
    const decision = await prisma.aIDecision.findUnique({
      where: { id },
      include: {
        AIAuditLog: {
          include: {
            User: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!decision) {
      throw new Error(`Decision log ${id} not found`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved decision log ${id} in ${duration}ms`);
    
    return decision;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve decision log ${id} in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Record human review of an AI operation
 */
export async function recordHumanReview(
  auditLogId: string,
  reviewedBy: string,
  decision: 'approved' | 'rejected' | 'modified',
  overrideReason?: string,
  feedbackToAI?: string
) {
  const startTime = Date.now();
  
  try {
    const log = await prisma.aIOperationLog.update({
      where: { id: auditLogId },
      data: {
        humanReviewed: true,
        reviewedBy,
        reviewedAt: new Date(),
        humanDecision: decision,
        overrideReason: overrideReason ?? null,
        feedbackToAI: feedbackToAI ?? null,
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Recorded human review for ${auditLogId} in ${duration}ms`);
    
    return log;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to record human review in ${duration}ms:`, error);
    throw error;
  }
}

// ================================
// COMPLIANCE REPORTING
// ================================

/**
 * Generate a compliance report
 */
export async function generateComplianceReport(input: ComplianceReportInput) {
  const startTime = Date.now();
  
  try {
    // Build query filters
    const where: any = {
      createdAt: {
        gte: input.startDate,
        lte: input.endDate,
      },
    };
    
    if (input.userId) where.userId = input.userId;
    if (input.agentTypes?.length) where.agentType = { in: input.agentTypes };
    if (input.operationTypes?.length) where.operationType = { in: input.operationTypes };
    
    // Gather statistics
    const [
      totalOperations,
      successfulOps,
      failedOps,
      humanOverrides,
      qualityStats,
      costStats,
      gdprCompliantCount,
      operations,
    ] = await Promise.all([
      prisma.aIOperationLog.count({ where }),
      prisma.aIOperationLog.count({ where: { ...where, status: 'success' } }),
      prisma.aIOperationLog.count({ where: { ...where, status: 'failed' } }),
      prisma.aIOperationLog.count({ where: { ...where, humanReviewed: true } }),
      prisma.aIOperationLog.aggregate({
        where: { ...where, qualityScore: { not: null } },
        _avg: { qualityScore: true },
      }),
      prisma.aIOperationLog.aggregate({
        where: { ...where, actualCost: { not: null } },
        _sum: { actualCost: true },
      }),
      prisma.aIOperationLog.count({ where: { ...where, gdprCompliant: true } }),
      prisma.aIOperationLog.findMany({
        where,
        select: {
          id: true,
          operationType: true,
          operationCategory: true,
          agentType: true,
          status: true,
          qualityScore: true,
          actualCost: true,
          processingTimeMs: true,
          humanReviewed: true,
          createdAt: true,
        },
      }),
    ]);
    
    // Build report data
    const reportData = {
      summary: {
        totalOperations,
        successfulOps,
        failedOps,
        humanOverrides,
        successRate: totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0,
        overrideRate: totalOperations > 0 ? (humanOverrides / totalOperations) * 100 : 0,
        averageQuality: qualityStats._avg.qualityScore || 0,
        totalCost: costStats._sum.actualCost || 0,
        gdprCompliantRate: totalOperations > 0 ? (gdprCompliantCount / totalOperations) * 100 : 0,
      },
      operations: operations.map((op: any) => ({
        id: op.id,
        type: op.operationType,
        category: op.operationCategory,
        agent: op.agentType,
        status: op.status,
        quality: op.qualityScore,
        cost: op.actualCost,
        duration: op.processingTimeMs,
        reviewed: op.humanReviewed,
        timestamp: op.createdAt,
      })),
      breakdown: {
        byOperationType: await getBreakdownByField(where, 'operationType'),
        byAgentType: await getBreakdownByField(where, 'agentType'),
        byStatus: await getBreakdownByField(where, 'status'),
      },
      compliance: {
        gdprCompliant: gdprCompliantCount,
        dataRetention: {
          total: totalOperations,
          scheduled: await prisma.aIOperationLog.count({
            where: { ...where, deletionScheduled: { not: null } },
          }),
          archived: await prisma.aIOperationLog.count({
            where: { ...where, archivedAt: { not: null } },
          }),
        },
      },
    };
    
    // Generate summary
    const summary = `
Report Period: ${input.startDate.toISOString()} to ${input.endDate.toISOString()}
Total Operations: ${totalOperations}
Success Rate: ${reportData.summary.successRate.toFixed(2)}%
Average Quality: ${(reportData.summary.averageQuality * 100).toFixed(2)}%
Total Cost: $${reportData.summary.totalCost.toFixed(4)}
GDPR Compliance: ${reportData.summary.gdprCompliantRate.toFixed(2)}%
    `.trim();
    
    // Create report record
    const report = await prisma.complianceReport.create({
      data: {
        id: uuidv4(),
        reportType: input.reportType,
        title: input.title,
        description: input.description ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        userId: input.userId ?? null,
        agentTypes: input.agentTypes ? JSON.stringify(input.agentTypes) : null,
        operationTypes: input.operationTypes ? JSON.stringify(input.operationTypes) : null,
        totalOperations,
        successfulOps,
        failedOps,
        humanOverrides,
        averageQuality: qualityStats._avg.qualityScore,
        totalCost: costStats._sum.actualCost,
        gdprCompliant: gdprCompliantCount,
        dataRetention: JSON.stringify(reportData.compliance.dataRetention),
        reportData: JSON.stringify(reportData),
        summary,
        format: input.format || 'JSON',
        requestedBy: input.requestedBy,
        accessLevel: input.accessLevel || 'internal',
        status: 'completed',
        generatedAt: new Date(),
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Generated compliance report ${report.id} in ${duration}ms`);
    
    return report;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to generate compliance report in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Helper function to get breakdown by a specific field
 */
async function getBreakdownByField(where: any, field: string) {
  const results = await prisma.aIOperationLog.groupBy({
    by: [field as any],
    where,
    _count: true,
    _avg: {
      qualityScore: true,
      actualCost: true,
      processingTimeMs: true,
    },
  });
  
  return results.map((r: any) => ({
    value: r[field],
    count: r._count,
    avgQuality: r._avg.qualityScore,
    avgCost: r._avg.actualCost,
    avgDuration: r._avg.processingTimeMs,
  }));
}

/**
 * Get an existing compliance report
 */
export async function getComplianceReport(id: string) {
  const startTime = Date.now();
  
  try {
    const report = await prisma.complianceReport.findUnique({
      where: { id },
    });
    
    if (!report) {
      throw new Error(`Compliance report ${id} not found`);
    }
    
    // Increment download count
    await prisma.complianceReport.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved compliance report ${id} in ${duration}ms`);
    
    return report;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve compliance report ${id} in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Export compliance report in requested format
 */
export async function exportComplianceReport(id: string, format: 'JSON' | 'CSV' | 'XML' = 'JSON') {
  const startTime = Date.now();
  
  try {
    const report = await getComplianceReport(id);
    const reportData = report.reportData ? JSON.parse(report.reportData) : {};
    
    let exportData: string;
    
    switch (format) {
      case 'JSON':
        exportData = JSON.stringify(reportData, null, 2);
        break;
      
      case 'CSV':
        // Convert operations to CSV
        const headers = ['ID', 'Type', 'Category', 'Agent', 'Status', 'Quality', 'Cost', 'Duration', 'Reviewed', 'Timestamp'];
        const rows = reportData.operations.map((op: any) => [
          op.id,
          op.type,
          op.category,
          op.agent,
          op.status,
          op.quality || '',
          op.cost || '',
          op.duration || '',
          op.reviewed,
          op.timestamp,
        ]);
        exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
        break;
      
      case 'XML':
        // Convert to XML
        exportData = `<?xml version="1.0" encoding="UTF-8"?>
<ComplianceReport>
  <Title>${report.title}</Title>
  <Period>
    <Start>${report.startDate}</Start>
    <End>${report.endDate}</End>
  </Period>
  <Summary>
    <TotalOperations>${reportData.summary.totalOperations}</TotalOperations>
    <SuccessRate>${reportData.summary.successRate}</SuccessRate>
    <AverageQuality>${reportData.summary.averageQuality}</AverageQuality>
    <TotalCost>${reportData.summary.totalCost}</TotalCost>
  </Summary>
</ComplianceReport>`;
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Exported compliance report ${id} in ${format} format in ${duration}ms`);
    
    return {
      format,
      data: exportData,
      filename: `compliance_report_${id}.${format.toLowerCase()}`,
      size: Buffer.byteLength(exportData, 'utf8'),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to export compliance report in ${duration}ms:`, error);
    throw error;
  }
}

// ================================
// USER CONSENT MANAGEMENT
// ================================

/**
 * Record user consent for AI processing
 */
export async function recordUserConsent(input: UserConsentInput) {
  const startTime = Date.now();
  
  try {
    const consent = await prisma.userConsent.create({
      data: {
        id: uuidv4(),
        userId: input.userId,
        consentType: input.consentType,
        purpose: input.purpose,
        scope: JSON.stringify(input.scope),
        consented: input.consented,
        consentMethod: input.consentMethod ?? null,
        consentVersion: input.consentVersion,
        legalBasis: input.legalBasis,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        expiresAt: input.expiresAt ?? null,
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Recorded user consent ${consent.id} in ${duration}ms`);
    
    return consent;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to record user consent in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string, consentType?: string) {
  const startTime = Date.now();
  
  try {
    const where: any = { userId };
    if (consentType) where.consentType = consentType;
    
    const consents = await prisma.userConsent.findMany({
      where,
      orderBy: { givenAt: 'desc' },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved ${consents.length} user consents in ${duration}ms`);
    
    return consents;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve user consents in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Withdraw user consent
 */
export async function withdrawUserConsent(
  consentId: string,
  reason?: string,
  deleteData: boolean = false
) {
  const startTime = Date.now();
  
  try {
    const consent = await prisma.userConsent.update({
      where: { id: consentId },
      data: {
        consented: false,
        withdrawnAt: new Date(),
        withdrawalReason: reason ?? null,
        dataDeleted: deleteData,
        deletedAt: deleteData ? new Date() : null,
      },
    });
    
    // If data deletion is requested, mark audit logs for deletion
    if (deleteData) {
      await prisma.aIOperationLog.updateMany({
        where: {
          userId: consent.userId,
          operationType: consent.consentType,
        },
        data: {
          deletionScheduled: new Date(), // Immediate deletion
        },
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Withdrew user consent ${consentId} in ${duration}ms`);
    
    return consent;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to withdraw user consent in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Check if user has given consent for a specific operation
 */
export async function checkUserConsent(userId: string, consentType: string): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    const consent = await prisma.userConsent.findFirst({
      where: {
        userId,
        consentType,
        consented: true,
        withdrawnAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Checked user consent for ${userId}/${consentType} in ${duration}ms: ${!!consent}`);
    
    return !!consent;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to check user consent in ${duration}ms:`, error);
    return false;
  }
}

// ================================
// DATA RETENTION & ARCHIVAL
// ================================

/**
 * Archive old audit logs to cold storage
 */
export async function archiveOldLogs(olderThanDays: number = 365) {
  const startTime = Date.now();
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const archived = await prisma.aIOperationLog.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        archivedAt: null,
      },
      data: {
        archivedAt: new Date(),
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Archived ${archived.count} logs older than ${olderThanDays} days in ${duration}ms`);
    
    return archived;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to archive old logs in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Delete logs scheduled for deletion (2 years retention)
 */
export async function deleteExpiredLogs() {
  const startTime = Date.now();
  
  try {
    const now = new Date();
    
    const deleted = await prisma.aIOperationLog.deleteMany({
      where: {
        deletionScheduled: { lte: now },
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Deleted ${deleted.count} expired logs in ${duration}ms`);
    
    return deleted;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to delete expired logs in ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get retention statistics
 */
export async function getRetentionStats() {
  const startTime = Date.now();
  
  try {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const [
      total,
      lessThanYear,
      oneToTwoYears,
      moreThanTwoYears,
      archived,
      scheduledDeletion,
    ] = await Promise.all([
      prisma.aIOperationLog.count(),
      prisma.aIOperationLog.count({ where: { createdAt: { gte: oneYearAgo } } }),
      prisma.aIOperationLog.count({
        where: {
          createdAt: { gte: twoYearsAgo, lt: oneYearAgo },
        },
      }),
      prisma.aIOperationLog.count({ where: { createdAt: { lt: twoYearsAgo } } }),
      prisma.aIOperationLog.count({ where: { archivedAt: { not: null } } }),
      prisma.aIOperationLog.count({ where: { deletionScheduled: { lte: now } } }),
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved retention stats in ${duration}ms`);
    
    return {
      total,
      byAge: {
        lessThanYear,
        oneToTwoYears,
        moreThanTwoYears,
      },
      archived,
      scheduledDeletion,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve retention stats in ${duration}ms:`, error);
    throw error;
  }
}

// ================================
// ANALYTICS & INSIGHTS
// ================================

/**
 * Get audit statistics for dashboard
 */
export async function getAuditStatistics(days: number = 30) {
  const startTime = Date.now();
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const [
      totalOperations,
      successRate,
      averageQuality,
      totalCost,
      averageDuration,
      humanOverrideRate,
      topOperations,
      topAgents,
      errorRate,
    ] = await Promise.all([
      // Total operations
      prisma.aIOperationLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      
      // Success rate
      prisma.aIOperationLog.aggregate({
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
      }).then(async (total: any) => {
        const successful = await prisma.aIOperationLog.count({
          where: {
            createdAt: { gte: startDate },
            status: 'success',
          },
        });
        return total._count._all > 0 ? (successful / total._count._all) * 100 : 0;
      }),
      
      // Average quality
      prisma.aIOperationLog.aggregate({
        where: {
          createdAt: { gte: startDate },
          qualityScore: { not: null },
        },
        _avg: { qualityScore: true },
      }).then((r: any) => r._avg.qualityScore || 0),
      
      // Total cost
      prisma.aIOperationLog.aggregate({
        where: {
          createdAt: { gte: startDate },
          actualCost: { not: null },
        },
        _sum: { actualCost: true },
      }).then((r: any) => r._sum.actualCost || 0),
      
      // Average duration
      prisma.aIOperationLog.aggregate({
        where: {
          createdAt: { gte: startDate },
          processingTimeMs: { not: null },
        },
        _avg: { processingTimeMs: true },
      }).then((r: any) => r._avg.processingTimeMs || 0),
      
      // Human override rate
      prisma.aIOperationLog.aggregate({
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
      }).then(async (total: any) => {
        const overrides = await prisma.aIOperationLog.count({
          where: {
            createdAt: { gte: startDate },
            humanReviewed: true,
          },
        });
        return total._count._all > 0 ? (overrides / total._count._all) * 100 : 0;
      }),
      
      // Top operations
      prisma.aIOperationLog.groupBy({
        by: ['operationType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      
      // Top agents
      prisma.aIOperationLog.groupBy({
        by: ['agentType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      
      // Error rate
      prisma.aIOperationLog.aggregate({
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
      }).then(async (total) => {
        const errors = await prisma.aIOperationLog.count({
          where: {
            createdAt: { gte: startDate },
            status: 'failed',
          },
        });
        return total._count._all > 0 ? (errors / total._count._all) * 100 : 0;
      }),
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[AI Audit] Retrieved audit statistics in ${duration}ms`);
    
    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      metrics: {
        totalOperations,
        successRate,
        errorRate,
        averageQuality: averageQuality * 100, // Convert to percentage
        totalCost,
        averageDuration,
        humanOverrideRate,
      },
      topOperations: topOperations.map((op: any) => ({
        type: op.operationType,
        count: op._count._all || op._count,
      })),
      topAgents: topAgents.map((agent: any) => ({
        type: agent.agentType,
        count: agent._count._all || agent._count,
      })),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit] Failed to retrieve audit statistics in ${duration}ms:`, error);
    throw error;
  }
}

export default {
  // Audit logging
  createAuditLog,
  createDecisionLog,
  getAuditLogs,
  getAuditLogById,
  getDecisionLogs,
  getDecisionById,
  recordHumanReview,
  
  // Compliance reporting
  generateComplianceReport,
  getComplianceReport,
  exportComplianceReport,
  
  // User consent
  recordUserConsent,
  getUserConsents,
  withdrawUserConsent,
  checkUserConsent,
  
  // Data retention
  archiveOldLogs,
  deleteExpiredLogs,
  getRetentionStats,
  
  // Analytics
  getAuditStatistics,
};
