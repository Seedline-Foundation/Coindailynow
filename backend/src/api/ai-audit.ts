/**
 * AI Audit & Compliance Logging REST API
 * 
 * Endpoints for audit log retrieval, decision reasoning, and compliance reporting.
 * 
 * Features:
 * - Audit log querying with filters
 * - Decision log retrieval with full explanations
 * - Compliance report generation and export
 * - User consent management
 * - Data retention statistics
 * - GDPR compliance endpoints
 * 
 * @module api/ai-audit
 */

import { Router, Request, Response } from 'express';
import aiAuditService from '../services/aiAuditService';

const router = Router();

// ================================
// MIDDLEWARE
// ================================

/**
 * Authentication middleware (placeholder - implement based on your auth system)
 */
function authenticate(req: Request, res: Response, next: Function) {
  // TODO: Implement authentication
  // For now, assume user is authenticated
  (req as any).user = { id: 'user-123', role: 'admin' };
  next();
}

/**
 * Admin authorization middleware
 */
function requireAdmin(req: Request, res: Response, next: Function): void {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    return;
  }
  next();
}

// ================================
// AUDIT LOG ENDPOINTS
// ================================

/**
 * GET /api/ai/audit/logs
 * Get audit logs with filtering and pagination
 */
router.get('/logs', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const {
      operationType,
      operationCategory,
      agentType,
      userId,
      status,
      startDate,
      endDate,
      humanReviewed,
      limit = '100',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    
    const options = {
      operationType: operationType as string,
      operationCategory: operationCategory as string,
      agentType: agentType as string,
      userId: userId as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      humanReviewed: humanReviewed === 'true' ? true : humanReviewed === 'false' ? false : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as 'createdAt' | 'processingTimeMs' | 'actualCost',
      sortOrder: sortOrder as 'asc' | 'desc',
    };
    
    const result = await aiAuditService.getAuditLogs(options);
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: result.logs.map(log => ({
        ...log,
        inputData: JSON.parse(log.inputData),
        outputData: log.outputData ? JSON.parse(log.outputData) : null,
        alternatives: log.alternatives ? JSON.parse(log.alternatives) : null,
        thresholds: log.thresholds ? JSON.parse(log.thresholds) : null,
        dataSources: log.dataSources ? JSON.parse(log.dataSources) : null,
        citations: log.citations ? JSON.parse(log.citations) : null,
        externalAPIs: log.externalAPIs ? JSON.parse(log.externalAPIs) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        tags: log.tags ? JSON.parse(log.tags) : null,
      })),
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting audit logs:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve audit logs',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/audit/logs/:id
 * Get a specific audit log by ID
 */
router.get('/logs/:id', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ID', message: 'Log ID is required' } });
      return;
    }
    const log = await aiAuditService.getAuditLogById(id);
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: {
        ...log,
        inputData: JSON.parse(log.inputData),
        outputData: log.outputData ? JSON.parse(log.outputData) : null,
        alternatives: log.alternatives ? JSON.parse(log.alternatives) : null,
        thresholds: log.thresholds ? JSON.parse(log.thresholds) : null,
        dataSources: log.dataSources ? JSON.parse(log.dataSources) : null,
        citations: log.citations ? JSON.parse(log.citations) : null,
        externalAPIs: log.externalAPIs ? JSON.parse(log.externalAPIs) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        tags: log.tags ? JSON.parse(log.tags) : null,
        AIDecisionLog: log.AIDecisionLog.map(decision => ({
          ...decision,
          contributingFactors: decision.contributingFactors ? JSON.parse(decision.contributingFactors) : null,
          alternativeOptions: decision.alternativeOptions ? JSON.parse(decision.alternativeOptions) : null,
          dataPoints: decision.dataPoints ? JSON.parse(decision.dataPoints) : null,
          weights: decision.weights ? JSON.parse(decision.weights) : null,
          thresholds: decision.thresholds ? JSON.parse(decision.thresholds) : null,
          rulesApplied: decision.rulesApplied ? JSON.parse(decision.rulesApplied) : null,
          policiesFollowed: decision.policiesFollowed ? JSON.parse(decision.policiesFollowed) : null,
          exceptions: decision.exceptions ? JSON.parse(decision.exceptions) : null,
          biasCheck: decision.biasCheck ? JSON.parse(decision.biasCheck) : null,
          visualData: decision.visualData ? JSON.parse(decision.visualData) : null,
        })),
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting audit log:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: {
        code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve audit log',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/ai/audit/logs/:id/review
 * Record human review of an AI operation
 */
router.post('/logs/:id/review', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { decision, overrideReason, feedbackToAI } = req.body;
    const user = (req as any).user;
    
    if (!decision || !['approved', 'rejected', 'modified'].includes(decision)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid decision. Must be: approved, rejected, or modified',
        },
      });
    }
    
    const log = await aiAuditService.recordHumanReview(
      id,
      user.id,
      decision,
      overrideReason,
      feedbackToAI
    );
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: log,
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error recording review:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to record review',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ================================
// DECISION LOG ENDPOINTS
// ================================

/**
 * GET /api/ai/audit/decisions/:id
 * Get a specific decision log with full reasoning
 */
router.get('/decisions/:id', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const decision = await aiAuditService.getDecisionById(id);
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: {
        ...decision,
        contributingFactors: decision.contributingFactors ? JSON.parse(decision.contributingFactors) : null,
        alternativeOptions: decision.alternativeOptions ? JSON.parse(decision.alternativeOptions) : null,
        dataPoints: decision.dataPoints ? JSON.parse(decision.dataPoints) : null,
        weights: decision.weights ? JSON.parse(decision.weights) : null,
        thresholds: decision.thresholds ? JSON.parse(decision.thresholds) : null,
        rulesApplied: decision.rulesApplied ? JSON.parse(decision.rulesApplied) : null,
        policiesFollowed: decision.policiesFollowed ? JSON.parse(decision.policiesFollowed) : null,
        exceptions: decision.exceptions ? JSON.parse(decision.exceptions) : null,
        biasCheck: decision.biasCheck ? JSON.parse(decision.biasCheck) : null,
        visualData: decision.visualData ? JSON.parse(decision.visualData) : null,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting decision:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: {
        code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve decision',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/audit/logs/:auditLogId/decisions
 * Get all decision logs for an audit log
 */
router.get('/logs/:auditLogId/decisions', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { auditLogId } = req.params;
    const decisions = await aiAuditService.getDecisionLogs(auditLogId);
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: decisions.map(decision => ({
        ...decision,
        contributingFactors: decision.contributingFactors ? JSON.parse(decision.contributingFactors) : null,
        alternativeOptions: decision.alternativeOptions ? JSON.parse(decision.alternativeOptions) : null,
        dataPoints: decision.dataPoints ? JSON.parse(decision.dataPoints) : null,
        weights: decision.weights ? JSON.parse(decision.weights) : null,
        thresholds: decision.thresholds ? JSON.parse(decision.thresholds) : null,
        rulesApplied: decision.rulesApplied ? JSON.parse(decision.rulesApplied) : null,
        policiesFollowed: decision.policiesFollowed ? JSON.parse(decision.policiesFollowed) : null,
        exceptions: decision.exceptions ? JSON.parse(decision.exceptions) : null,
        biasCheck: decision.biasCheck ? JSON.parse(decision.biasCheck) : null,
        visualData: decision.visualData ? JSON.parse(decision.visualData) : null,
      })),
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting decisions:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve decisions',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ================================
// COMPLIANCE REPORT ENDPOINTS
// ================================

/**
 * POST /api/ai/audit/export
 * Generate a compliance report
 */
router.post('/export', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const {
      reportType,
      title,
      description,
      startDate,
      endDate,
      userId,
      agentTypes,
      operationTypes,
      format = 'JSON',
    } = req.body;
    
    const user = (req as any).user;
    
    // Validation
    if (!reportType || !['gdpr_export', 'audit_summary', 'cost_analysis', 'quality_review'].includes(reportType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid report type',
        },
      });
    }
    
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required fields: title, startDate, endDate',
        },
      });
    }
    
    const report = await aiAuditService.generateComplianceReport({
      reportType,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId,
      agentTypes,
      operationTypes,
      requestedBy: user.id,
      format,
    });
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: {
        ...report,
        reportData: JSON.parse(report.reportData),
        agentTypes: report.agentTypes ? JSON.parse(report.agentTypes) : null,
        operationTypes: report.operationTypes ? JSON.parse(report.operationTypes) : null,
        dataRetention: report.dataRetention ? JSON.parse(report.dataRetention) : null,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error generating report:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to generate compliance report',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/audit/export/:id
 * Get a compliance report
 */
router.get('/export/:id', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { format } = req.query;
    
    if (format && !['JSON', 'CSV', 'XML'].includes(format as string)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid format. Must be: JSON, CSV, or XML',
        },
      });
    }
    
    if (format) {
      // Export in requested format
      const exported = await aiAuditService.exportComplianceReport(id, format as any);
      const duration = Date.now() - startTime;
      
      res.setHeader('Content-Type', format === 'JSON' ? 'application/json' : format === 'CSV' ? 'text/csv' : 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      res.send(exported.data);
    } else {
      // Get report metadata
      const report = await aiAuditService.getComplianceReport(id);
      const duration = Date.now() - startTime;
      
      res.json({
        data: {
          ...report,
          reportData: JSON.parse(report.reportData),
          agentTypes: report.agentTypes ? JSON.parse(report.agentTypes) : null,
          operationTypes: report.operationTypes ? JSON.parse(report.operationTypes) : null,
          dataRetention: report.dataRetention ? JSON.parse(report.dataRetention) : null,
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting report:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: {
        code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve compliance report',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ================================
// USER CONSENT ENDPOINTS
// ================================

/**
 * GET /api/ai/audit/consent
 * Get user consents (for authenticated user)
 */
router.get('/consent', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const user = (req as any).user;
    const { consentType } = req.query;
    
    const consents = await aiAuditService.getUserConsents(
      user.id,
      consentType as string
    );
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: consents.map(consent => ({
        ...consent,
        scope: JSON.parse(consent.scope),
        metadata: consent.metadata ? JSON.parse(consent.metadata) : null,
      })),
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting consents:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve consents',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/ai/audit/consent
 * Record user consent
 */
router.post('/consent', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const user = (req as any).user;
    const {
      consentType,
      purpose,
      scope,
      consented,
      consentMethod,
      consentVersion,
      legalBasis,
      expiresAt,
    } = req.body;
    
    if (!consentType || !purpose || !scope || consented === undefined || !consentVersion || !legalBasis) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required fields',
        },
      });
    }
    
    const consentInput: any = {
      userId: user.id,
      consentType,
      purpose,
      scope,
      consented,
      consentMethod,
      consentVersion,
      legalBasis,
      ipAddress: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    };
    
    if (expiresAt) {
      consentInput.expiresAt = new Date(expiresAt);
    }
    
    const consent = await aiAuditService.recordUserConsent(consentInput);
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: {
        ...consent,
        scope: JSON.parse(consent.scope),
        metadata: consent.metadata ? JSON.parse(consent.metadata) : null,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error recording consent:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to record consent',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/ai/audit/consent/:id/withdraw
 * Withdraw user consent
 */
router.post('/consent/:id/withdraw', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { reason, deleteData = false } = req.body;
    
    const consent = await aiAuditService.withdrawUserConsent(
      id,
      reason,
      deleteData
    );
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: {
        ...consent,
        scope: JSON.parse(consent.scope),
        metadata: consent.metadata ? JSON.parse(consent.metadata) : null,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error withdrawing consent:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to withdraw consent',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// ================================
// ANALYTICS & STATISTICS ENDPOINTS
// ================================

/**
 * GET /api/ai/audit/statistics
 * Get audit statistics for dashboard
 */
router.get('/statistics', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const { days = '30' } = req.query;
    const stats = await aiAuditService.getAuditStatistics(parseInt(days as string));
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: stats,
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting statistics:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve statistics',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/audit/retention
 * Get data retention statistics
 */
router.get('/retention', authenticate,${3}async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  
  try {
    const stats = await aiAuditService.getRetentionStats();
    
    const duration = Date.now() - startTime;
    
    res.json({
      data: stats,
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Audit API] Error getting retention stats:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve retention statistics',
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/audit/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-audit-api',
    timestamp: new Date().toISOString(),
  });
});

export default router;
