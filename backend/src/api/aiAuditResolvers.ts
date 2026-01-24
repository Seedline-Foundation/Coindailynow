/**
 * AI Audit & Compliance Logging GraphQL Resolvers
 * 
 * Complete resolver implementation for audit logging, decision tracking, and compliance reporting.
 * 
 * @module api/aiAuditResolvers
 */

import { PubSub } from 'graphql-subscriptions';
import aiAuditService from '../services/aiAuditService';

const pubsub = new PubSub();

// Subscription topics
const AUDIT_LOG_CREATED = 'AUDIT_LOG_CREATED';
const HUMAN_REVIEW_RECORDED = 'HUMAN_REVIEW_RECORDED';
const COMPLIANCE_REPORT_GENERATED = 'COMPLIANCE_REPORT_GENERATED';

export const aiAuditResolvers = {
  Query: {
    /**
     * Get audit logs with filtering and pagination
     */
    getAuditLogs: async (_: any, { options }: any, context: any) => {
      const result = await aiAuditService.getAuditLogs(options || {});
      return {
        ...result,
        hasMore: result.offset + result.limit < result.total,
      };
    },
    
    /**
     * Get a specific audit log by ID
     */
    getAuditLog: async (_: any, { id }: any, context: any) => {
      return await aiAuditService.getAuditLogById(id);
    },
    
    /**
     * Get decision logs for an audit log
     */
    getDecisionLogs: async (_: any, { auditLogId }: any, context: any) => {
      return await aiAuditService.getDecisionLogs(auditLogId);
    },
    
    /**
     * Get a specific decision log
     */
    getDecision: async (_: any, { id }: any, context: any) => {
      return await aiAuditService.getDecisionById(id);
    },
    
    /**
     * Get a compliance report
     */
    getComplianceReport: async (_: any, { id }: any, context: any) => {
      return await aiAuditService.getComplianceReport(id);
    },
    
    /**
     * Get user consents
     */
    getUserConsents: async (_: any, { consentType }: any, context: any) => {
      const userId = context.user?.id;
      if (!userId) throw new Error('Authentication required');
      
      return await aiAuditService.getUserConsents(userId, consentType);
    },
    
    /**
     * Check if user has given consent
     */
    checkUserConsent: async (_: any, { consentType }: any, context: any) => {
      const userId = context.user?.id;
      if (!userId) throw new Error('Authentication required');
      
      return await aiAuditService.checkUserConsent(userId, consentType);
    },
    
    /**
     * Get audit statistics
     */
    getAuditStatistics: async (_: any, { days = 30 }: any, context: any) => {
      // Require admin access
      if (context.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      return await aiAuditService.getAuditStatistics(days);
    },
    
    /**
     * Get retention statistics
     */
    getRetentionStatistics: async (_: any, __: any, context: any) => {
      // Require admin access
      if (context.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      return await aiAuditService.getRetentionStats();
    },
  },
  
  Mutation: {
    /**
     * Create an audit log entry
     */
    createAuditLog: async (_: any, { input }: any, context: any) => {
      const log = await aiAuditService.createAuditLog(input);
      
      // Publish to subscribers
      pubsub.publish(AUDIT_LOG_CREATED, {
        auditLogCreated: log,
      });
      
      return log;
    },
    
    /**
     * Create a decision log
     */
    createDecisionLog: async (_: any, { input }: any, context: any) => {
      return await aiAuditService.createDecisionLog(input);
    },
    
    /**
     * Record human review
     */
    recordHumanReview: async (
      _: any,
      { auditLogId, decision, overrideReason, feedbackToAI }: any,
      context: any
    ) => {
      // Require admin access
      if (context.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      const log = await aiAuditService.recordHumanReview(
        auditLogId,
        context.user.id,
        decision,
        overrideReason,
        feedbackToAI
      );
      
      // Publish to subscribers
      pubsub.publish(HUMAN_REVIEW_RECORDED, {
        humanReviewRecorded: log,
      });
      
      return log;
    },
    
    /**
     * Generate a compliance report
     */
    generateComplianceReport: async (_: any, { input }: any, context: any) => {
      // Require admin access
      if (context.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      const report = await aiAuditService.generateComplianceReport({
        ...input,
        requestedBy: context.user.id,
      });
      
      // Publish to subscribers
      pubsub.publish(COMPLIANCE_REPORT_GENERATED, {
        complianceReportGenerated: report,
      });
      
      return report;
    },
    
    /**
     * Record user consent
     */
    recordUserConsent: async (_: any, { input }: any, context: any) => {
      const userId = context.user?.id;
      if (!userId) throw new Error('Authentication required');
      
      return await aiAuditService.recordUserConsent({
        ...input,
        userId,
        ipAddress: context.req?.ip,
        userAgent: context.req?.headers['user-agent'],
      });
    },
    
    /**
     * Withdraw user consent
     */
    withdrawUserConsent: async (
      _: any,
      { consentId, reason, deleteData = false }: any,
      context: any
    ) => {
      const userId = context.user?.id;
      if (!userId) throw new Error('Authentication required');
      
      return await aiAuditService.withdrawUserConsent(
        consentId,
        reason,
        deleteData
      );
    },
    
    /**
     * Archive old logs (admin only)
     */
    archiveOldLogs: async (_: any, { olderThanDays = 365 }: any, context: any) => {
      // Require admin access
      if (context.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      const result = await aiAuditService.archiveOldLogs(olderThanDays);
      return result.count;
    },
    
    /**
     * Delete expired logs (admin only)
     */
    deleteExpiredLogs: async (_: any, __: any, context: any) => {
      // Require admin access
      if (context.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }
      
      const result = await aiAuditService.deleteExpiredLogs();
      return result.count;
    },
  },
  
  Subscription: {
    /**
     * Subscribe to new audit logs
     */
    auditLogCreated: {
      subscribe: (
        _: any,
        { operationType }: any,
        context: any
      ) => {
        // Filter by operation type if provided
        const asyncIterator = pubsub.asyncIterator([AUDIT_LOG_CREATED]);
        
        if (operationType) {
          return {
            [Symbol.asyncIterator]() {
              return {
                async next(): Promise<IteratorResult<any>> {
                  const result = await asyncIterator.next();
                  
                  if (result.done) return result;
                  
                  const log = (result.value as any).auditLogCreated;
                  if (log.operationType === operationType) {
                    return result;
                  }
                  
                  // Skip logs that don't match filter
                  return this.next();
                },
                return: asyncIterator.return,
                throw: asyncIterator.throw,
              };
            },
          };
        }
        
        return asyncIterator;
      },
    },
    
    /**
     * Subscribe to human reviews
     */
    humanReviewRecorded: {
      subscribe: () => pubsub.asyncIterator([HUMAN_REVIEW_RECORDED]),
    },
    
    /**
     * Subscribe to compliance report generation
     */
    complianceReportGenerated: {
      subscribe: () => pubsub.asyncIterator([COMPLIANCE_REPORT_GENERATED]),
    },
  },
  
  // Field resolvers
  AIAuditLog: {
    inputData: (parent: any) => {
      return typeof parent.inputData === 'string'
        ? JSON.parse(parent.inputData)
        : parent.inputData;
    },
    outputData: (parent: any) => {
      if (!parent.outputData) return null;
      return typeof parent.outputData === 'string'
        ? JSON.parse(parent.outputData)
        : parent.outputData;
    },
    alternatives: (parent: any) => {
      if (!parent.alternatives) return null;
      return typeof parent.alternatives === 'string'
        ? JSON.parse(parent.alternatives)
        : parent.alternatives;
    },
    thresholds: (parent: any) => {
      if (!parent.thresholds) return null;
      return typeof parent.thresholds === 'string'
        ? JSON.parse(parent.thresholds)
        : parent.thresholds;
    },
    dataSources: (parent: any) => {
      if (!parent.dataSources) return null;
      return typeof parent.dataSources === 'string'
        ? JSON.parse(parent.dataSources)
        : parent.dataSources;
    },
    citations: (parent: any) => {
      if (!parent.citations) return null;
      return typeof parent.citations === 'string'
        ? JSON.parse(parent.citations)
        : parent.citations;
    },
    externalAPIs: (parent: any) => {
      if (!parent.externalAPIs) return null;
      return typeof parent.externalAPIs === 'string'
        ? JSON.parse(parent.externalAPIs)
        : parent.externalAPIs;
    },
    metadata: (parent: any) => {
      if (!parent.metadata) return null;
      return typeof parent.metadata === 'string'
        ? JSON.parse(parent.metadata)
        : parent.metadata;
    },
    tags: (parent: any) => {
      if (!parent.tags) return null;
      return typeof parent.tags === 'string'
        ? JSON.parse(parent.tags)
        : parent.tags;
    },
    decisionLogs: async (parent: any) => {
      if (parent.AIDecisionLog) return parent.AIDecisionLog;
      return await aiAuditService.getDecisionLogs(parent.id);
    },
  },
  
  AIDecisionLog: {
    contributingFactors: (parent: any) => {
      if (!parent.contributingFactors) return null;
      return typeof parent.contributingFactors === 'string'
        ? JSON.parse(parent.contributingFactors)
        : parent.contributingFactors;
    },
    alternativeOptions: (parent: any) => {
      if (!parent.alternativeOptions) return null;
      return typeof parent.alternativeOptions === 'string'
        ? JSON.parse(parent.alternativeOptions)
        : parent.alternativeOptions;
    },
    dataPoints: (parent: any) => {
      if (!parent.dataPoints) return null;
      return typeof parent.dataPoints === 'string'
        ? JSON.parse(parent.dataPoints)
        : parent.dataPoints;
    },
    weights: (parent: any) => {
      if (!parent.weights) return null;
      return typeof parent.weights === 'string'
        ? JSON.parse(parent.weights)
        : parent.weights;
    },
    thresholds: (parent: any) => {
      if (!parent.thresholds) return null;
      return typeof parent.thresholds === 'string'
        ? JSON.parse(parent.thresholds)
        : parent.thresholds;
    },
    rulesApplied: (parent: any) => {
      if (!parent.rulesApplied) return null;
      return typeof parent.rulesApplied === 'string'
        ? JSON.parse(parent.rulesApplied)
        : parent.rulesApplied;
    },
    policiesFollowed: (parent: any) => {
      if (!parent.policiesFollowed) return null;
      return typeof parent.policiesFollowed === 'string'
        ? JSON.parse(parent.policiesFollowed)
        : parent.policiesFollowed;
    },
    exceptions: (parent: any) => {
      if (!parent.exceptions) return null;
      return typeof parent.exceptions === 'string'
        ? JSON.parse(parent.exceptions)
        : parent.exceptions;
    },
    biasCheck: (parent: any) => {
      if (!parent.biasCheck) return null;
      return typeof parent.biasCheck === 'string'
        ? JSON.parse(parent.biasCheck)
        : parent.biasCheck;
    },
    visualData: (parent: any) => {
      if (!parent.visualData) return null;
      return typeof parent.visualData === 'string'
        ? JSON.parse(parent.visualData)
        : parent.visualData;
    },
    auditLog: async (parent: any) => {
      if (parent.AIAuditLog) return parent.AIAuditLog;
      return await aiAuditService.getAuditLogById(parent.auditLogId);
    },
  },
  
  ComplianceReport: {
    agentTypes: (parent: any) => {
      if (!parent.agentTypes) return null;
      return typeof parent.agentTypes === 'string'
        ? JSON.parse(parent.agentTypes)
        : parent.agentTypes;
    },
    operationTypes: (parent: any) => {
      if (!parent.operationTypes) return null;
      return typeof parent.operationTypes === 'string'
        ? JSON.parse(parent.operationTypes)
        : parent.operationTypes;
    },
    dataRetention: (parent: any) => {
      return typeof parent.dataRetention === 'string'
        ? JSON.parse(parent.dataRetention)
        : parent.dataRetention;
    },
    consentStatus: (parent: any) => {
      if (!parent.consentStatus) return null;
      return typeof parent.consentStatus === 'string'
        ? JSON.parse(parent.consentStatus)
        : parent.consentStatus;
    },
    reportData: (parent: any) => {
      return typeof parent.reportData === 'string'
        ? JSON.parse(parent.reportData)
        : parent.reportData;
    },
    recommendations: (parent: any) => {
      if (!parent.recommendations) return null;
      return typeof parent.recommendations === 'string'
        ? JSON.parse(parent.recommendations)
        : parent.recommendations;
    },
  },
  
  UserConsent: {
    scope: (parent: any) => {
      return typeof parent.scope === 'string'
        ? JSON.parse(parent.scope)
        : parent.scope;
    },
    metadata: (parent: any) => {
      if (!parent.metadata) return null;
      return typeof parent.metadata === 'string'
        ? JSON.parse(parent.metadata)
        : parent.metadata;
    },
  },
};

export default aiAuditResolvers;
