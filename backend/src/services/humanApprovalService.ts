/**
 * Human Approval Workflow Service
 * Manages content review, approval, and editor assignment
 * 
 * Features:
 * - Priority-based approval queue management
 * - Editor assignment and workload balancing
 * - Revision workflow with feedback loop
 * - Batch operations for efficiency
 * - Real-time notifications
 * - Performance tracking for editors
 * 
 * @module HumanApprovalService
 */

import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import EventEmitter from 'events';
import aiWorkflowService from './aiWorkflowService';

const prisma = new PrismaClient();

// ==================== PRISMA TYPES ====================

type WorkflowWithRelations = Prisma.ContentWorkflowGetPayload<{
  include: {
    Article: {
      include: {
        ArticleTranslation: true;
      };
    };
    WorkflowStep: true;
    WorkflowTransition: true;
    User: true;
  };
}>;

type EditorWithWorkflows = Prisma.UserGetPayload<{
  include: {
    ContentWorkflow: true;
  };
}>;

// ==================== TYPES AND ENUMS ====================

export enum ApprovalStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum ContentType {
  ARTICLE = 'ARTICLE',
  BREAKING_NEWS = 'BREAKING_NEWS',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  TUTORIAL = 'TUTORIAL',
  TRANSLATION = 'TRANSLATION'
}

export interface ApprovalQueueItem {
  id: string;
  workflowId: string;
  articleId: string;
  articleTitle: string;
  contentType: ContentType;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  assignedEditorId?: string | undefined;
  assignedEditorName?: string | undefined;
  aiConfidenceScore: number;
  qualityMetrics: QualityMetrics;
  contentPreview: string;
  submittedAt: Date;
  reviewStartedAt?: Date | undefined;
  reviewCompletedAt?: Date | undefined;
  estimatedReviewTime: number; // in minutes
  revisionCount: number;
  languageCode?: string | undefined;
}

export interface QualityMetrics {
  overallScore: number;
  seoScore?: number;
  readabilityScore?: number;
  sentimentScore?: number;
  factualityScore?: number;
  translationQuality?: number;
  grammarScore?: number;
  originalityScore?: number;
}

export interface ContentReviewDetails {
  workflow: ApprovalQueueItem;
  fullContent: string;
  formattedContent: string;
  qualityScores: QualityMetrics;
  researchSources?: ResearchSource[] | undefined;
  translations?: TranslationPreview[] | undefined;
  revisionHistory?: RevisionRecord[] | undefined;
  aiGenerationMetadata?: AIMetadata | undefined;
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  citedInContent: boolean;
}

export interface TranslationPreview {
  languageCode: string;
  languageName: string;
  translatedTitle: string;
  translatedExcerpt: string;
  qualityScore: number;
  status: string;
}

export interface RevisionRecord {
  revisionNumber: number;
  requestedBy: string;
  requestedAt: Date;
  feedback: string;
  requestedChanges: string[];
  completedAt?: Date;
  qualityImprovement?: number;
}

export interface AIMetadata {
  model: string;
  tokensUsed: number;
  generationTime: number;
  confidence: number;
  detectedTopics: string[];
  keyEntities: string[];
}

export interface ApprovalDecision {
  workflowId: string;
  editorId: string;
  decision: 'approve' | 'reject' | 'request_revision';
  feedback?: string | undefined;
  requestedChanges?: RequestedChange[] | undefined;
  qualityOverride?: number | undefined;
}

export interface RequestedChange {
  section: string;
  issueType: 'accuracy' | 'clarity' | 'style' | 'grammar' | 'seo' | 'other';
  description: string;
  priority: 'must_fix' | 'should_fix' | 'nice_to_have';
  suggestion?: string;
}

export interface BatchOperation {
  workflowIds: string[];
  operation: 'approve' | 'reject' | 'assign' | 'cancel';
  editorId?: string;
  assignToEditorId?: string;
  feedback?: string;
}

export interface EditorAssignment {
  editorId: string;
  editorName: string;
  contentTypes: ContentType[];
  languages: string[];
  maxWorkload: number;
  currentWorkload: number;
  performanceMetrics: EditorPerformanceMetrics;
}

export interface EditorPerformanceMetrics {
  totalReviews: number;
  approvalRate: number;
  averageReviewTime: number; // in minutes
  qualityScore: number;
  revisionRate: number;
  throughputPerDay: number;
}

export interface ApprovalQueueFilters {
  status?: ApprovalStatus[];
  priority?: ApprovalPriority[];
  contentType?: ContentType[];
  assignedEditorId?: string;
  languageCode?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minConfidenceScore?: number;
  maxConfidenceScore?: number;
}

export interface ApprovalQueueStats {
  total: number;
  byStatus: Record<ApprovalStatus, number>;
  byPriority: Record<ApprovalPriority, number>;
  byContentType: Record<ContentType, number>;
  averageWaitTime: number; // in minutes
  averageReviewTime: number;
  oldestPendingAge: number; // in hours
}

// ==================== CONSTANTS ====================

const CACHE_TTL = {
  QUEUE: 60, // 1 minute
  ITEM: 300, // 5 minutes
  EDITOR: 600, // 10 minutes
  STATS: 120, // 2 minutes
};

const CACHE_PREFIX = {
  QUEUE: 'approval:queue',
  ITEM: 'approval:item',
  EDITOR: 'approval:editor',
  STATS: 'approval:stats',
};

const REVIEW_TIME_ESTIMATES = {
  ARTICLE: 15,
  BREAKING_NEWS: 5,
  MARKET_ANALYSIS: 10,
  TUTORIAL: 20,
  TRANSLATION: 8,
};

const PRIORITY_WEIGHTS = {
  CRITICAL: 1000,
  HIGH: 100,
  MEDIUM: 10,
  LOW: 1,
};

// ==================== EVENT EMITTER ====================

class HumanApprovalEventEmitter extends EventEmitter {}
const approvalEvents = new HumanApprovalEventEmitter();

// ==================== MAIN SERVICE CLASS ====================

class HumanApprovalService {
  /**
   * Get approval queue with filtering and pagination
   */
  async getApprovalQueue(
    filters: ApprovalQueueFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ApprovalQueueItem[]; total: number; page: number; totalPages: number }> {
    try {
      const cacheKey = `${CACHE_PREFIX.QUEUE}:${JSON.stringify({ filters, page, limit })}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('[HumanApprovalService] Queue retrieved from cache');
        return JSON.parse(cached);
      }

      // Build where clause
      const where: any = {
        currentState: 'HUMAN_APPROVAL',
      };

      if (filters.priority && filters.priority.length > 0) {
        where.priority = { in: filters.priority };
      }

      if (filters.assignedEditorId) {
        where.assignedReviewerId = filters.assignedEditorId;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }

      // Get workflows awaiting approval
      const [workflows, total] = await Promise.all([
        prisma.contentWorkflow.findMany({
          where,
          include: {
            Article: {
              select: {
                id: true,
                title: true,
                excerpt: true,
                content: true,
                categoryId: true,
              },
            },
            User: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
            WorkflowStep: {
              where: {
                stepName: { in: ['CONTENT_REVIEW', 'TRANSLATION_REVIEW'] },
              },
              orderBy: {
                completedAt: 'desc',
              },
              take: 1,
            },
            WorkflowTransition: true,
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
        }) as Promise<WorkflowWithRelations[]>,
        prisma.contentWorkflow.count({ where }),
      ]);

      // Transform to ApprovalQueueItem
      const items: ApprovalQueueItem[] = workflows.map((workflow: WorkflowWithRelations) => {
        const latestReview = workflow.WorkflowStep[0];
        const qualityScore = latestReview?.qualityScore || 0;
        const metadata = workflow.metadata ? JSON.parse(workflow.metadata as string) : {};

        return {
          id: workflow.id,
          workflowId: workflow.id,
          articleId: workflow.articleId,
          articleTitle: workflow.Article.title,
          contentType: this.mapWorkflowTypeToContentType(workflow.workflowType),
          priority: workflow.priority as ApprovalPriority,
          status: ApprovalStatus.PENDING,
          assignedEditorId: workflow.assignedReviewerId || undefined,
          assignedEditorName: workflow.User
            ? `${workflow.User.firstName || ''} ${workflow.User.lastName || ''}`.trim() || workflow.User.username
            : undefined,
          aiConfidenceScore: qualityScore,
          qualityMetrics: {
            overallScore: qualityScore,
            seoScore: metadata.seoScore,
            readabilityScore: metadata.readabilityScore,
            sentimentScore: metadata.sentimentScore,
            factualityScore: metadata.factualityScore,
          },
          contentPreview: workflow.Article.excerpt || workflow.Article.content.substring(0, 200),
          submittedAt: workflow.createdAt,
          estimatedReviewTime: REVIEW_TIME_ESTIMATES[workflow.workflowType as keyof typeof REVIEW_TIME_ESTIMATES] || 15,
          revisionCount: workflow.retryCount,
        };
      });

      const result = {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };

      // Cache result
      await (redisClient as any).setex(cacheKey, CACHE_TTL.QUEUE, JSON.stringify(result));

      logger.info(`[HumanApprovalService] Queue retrieved: ${items.length} items`);
      return result;
    } catch (error) {
      logger.error('[HumanApprovalService] Error getting approval queue:', error);
      throw error;
    }
  }

  /**
   * Get detailed content review information
   */
  async getContentReviewDetails(workflowId: string): Promise<ContentReviewDetails> {
    try {
      const cacheKey = `${CACHE_PREFIX.ITEM}:${workflowId}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('[HumanApprovalService] Content details retrieved from cache');
        return JSON.parse(cached);
      }

      // Get workflow with all related data
      const workflow = await prisma.contentWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          Article: {
            include: {
              ArticleTranslation: true,
            },
          },
          WorkflowStep: {
            orderBy: {
              completedAt: 'desc',
            },
          },
          WorkflowTransition: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          User: true,
        },
      }) as WorkflowWithRelations | null;

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Extract quality metrics from steps
      const qualityMetrics: QualityMetrics = {
        overallScore: 0,
      };

      workflow.WorkflowStep.forEach((step: typeof workflow.WorkflowStep[0]) => {
        if (step.qualityScore) {
          qualityMetrics.overallScore = Math.max(qualityMetrics.overallScore, step.qualityScore);
        }
        if (step.output) {
          try {
            const output = JSON.parse(step.output as string);
            if (output.seoScore) qualityMetrics.seoScore = output.seoScore;
            if (output.readabilityScore) qualityMetrics.readabilityScore = output.readabilityScore;
            if (output.sentimentScore) qualityMetrics.sentimentScore = output.sentimentScore;
            if (output.factualityScore) qualityMetrics.factualityScore = output.factualityScore;
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      // Extract research sources
      const researchSources: ResearchSource[] = [];
      const researchStep = workflow.WorkflowStep.find((s: typeof workflow.WorkflowStep[0]) => s.stepName === 'RESEARCH');
      if (researchStep?.output) {
        try {
          const output = JSON.parse(researchStep.output as string);
          if (output.sources) {
            researchSources.push(...output.sources);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Extract translation previews
      const translations: TranslationPreview[] = workflow.Article.ArticleTranslation.map((trans: typeof workflow.Article.ArticleTranslation[0]) => ({
        languageCode: trans.languageCode,
        languageName: this.getLanguageName(trans.languageCode),
        translatedTitle: trans.title,
        translatedExcerpt: trans.excerpt || '',
        qualityScore: trans.qualityScore || 0,
        status: trans.translationStatus,
      }));

      // Extract revision history
      const revisionHistory: RevisionRecord[] = workflow.WorkflowTransition
        .filter((t: typeof workflow.WorkflowTransition[0]) => t.transitionType === 'REVISION_REQUESTED')
        .map((t: typeof workflow.WorkflowTransition[0], index: number) => ({
          revisionNumber: index + 1,
          requestedBy: t.triggeredBy || 'System',
          requestedAt: t.createdAt,
          feedback: t.transitionReason || '',
          requestedChanges: [],
        }));

      // Build AI metadata
      const contentStep = workflow.WorkflowStep.find((s: typeof workflow.WorkflowStep[0]) => s.stepName === 'CONTENT_GENERATION');
      const aiMetadata: AIMetadata | undefined = contentStep?.output
        ? (() => {
            try {
              const output = JSON.parse(contentStep.output as string);
              return {
                model: output.model || 'gpt-4-turbo',
                tokensUsed: output.tokensUsed || 0,
                generationTime: contentStep.actualDurationMs || 0,
                confidence: contentStep.qualityScore || 0,
                detectedTopics: output.topics || [],
                keyEntities: output.entities || [],
              };
            } catch (e) {
              return undefined;
            }
          })()
        : undefined;

      const queueItem: ApprovalQueueItem = {
        id: workflow.id,
        workflowId: workflow.id,
        articleId: workflow.articleId,
        articleTitle: workflow.Article.title,
        contentType: this.mapWorkflowTypeToContentType(workflow.workflowType),
        priority: workflow.priority as ApprovalPriority,
        status: ApprovalStatus.PENDING,
        assignedEditorId: workflow.assignedReviewerId || undefined,
        aiConfidenceScore: qualityMetrics.overallScore,
        qualityMetrics,
        contentPreview: workflow.Article.excerpt || '',
        submittedAt: workflow.createdAt,
        estimatedReviewTime: REVIEW_TIME_ESTIMATES[workflow.workflowType as keyof typeof REVIEW_TIME_ESTIMATES] || 15,
        revisionCount: workflow.retryCount,
      };

      const details: ContentReviewDetails = {
        workflow: queueItem,
        fullContent: workflow.Article.content,
        formattedContent: this.formatContent(workflow.Article.content),
        qualityScores: qualityMetrics,
        researchSources: researchSources.length > 0 ? researchSources : undefined,
        translations: translations.length > 0 ? translations : undefined,
        revisionHistory: revisionHistory.length > 0 ? revisionHistory : undefined,
        aiGenerationMetadata: aiMetadata,
      };

      // Cache result
      await (redisClient as any).setex(cacheKey, CACHE_TTL.ITEM, JSON.stringify(details));

      logger.info(`[HumanApprovalService] Content details retrieved for workflow ${workflowId}`);
      return details;
    } catch (error) {
      logger.error(`[HumanApprovalService] Error getting content details for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Process approval decision
   */
  async processApprovalDecision(decision: ApprovalDecision): Promise<void> {
    try {
      logger.info(`[HumanApprovalService] Processing decision: ${decision.decision} for ${decision.workflowId}`);

      const workflow = await prisma.contentWorkflow.findUnique({
        where: { id: decision.workflowId },
      });

      if (!workflow) {
        throw new Error(`Workflow ${decision.workflowId} not found`);
      }

      if (decision.decision === 'approve') {
        // Approve and advance to publishing
        await aiWorkflowService.advanceWorkflow(decision.workflowId);
        
        // Update article status
        await prisma.article.update({
          where: { id: workflow.articleId },
          data: {
            status: 'APPROVED',
            publishedAt: new Date(),
          },
        });

        // Create workflow step record
        await prisma.workflowStep.create({
          data: {
            id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflowId: decision.workflowId,
            stepName: 'HUMAN_APPROVAL',
            stepOrder: 999,
            status: 'COMPLETED',
            assigneeId: decision.editorId,
            startedAt: new Date(),
            completedAt: new Date(),
            humanFeedback: decision.feedback || null,
            qualityScore: decision.qualityOverride ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Send notification
        await this.sendNotification(decision.workflowId, 'approved', decision.editorId);

        // Emit event
        approvalEvents.emit('content:approved', {
          workflowId: decision.workflowId,
          articleId: workflow.articleId,
          editorId: decision.editorId,
        });
      } else if (decision.decision === 'reject') {
        // Reject and mark workflow as failed
        await prisma.contentWorkflow.update({
          where: { id: decision.workflowId },
          data: {
            currentState: 'FAILED',
            errorMessage: decision.feedback || 'Content rejected by human reviewer',
            updatedAt: new Date(),
          },
        });

        // Update article status
        await prisma.article.update({
          where: { id: workflow.articleId },
          data: {
            status: 'REJECTED',
          },
        });

        // Create workflow step record
        await prisma.workflowStep.create({
          data: {
            id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflowId: decision.workflowId,
            stepName: 'HUMAN_APPROVAL',
            stepOrder: 999,
            status: 'FAILED',
            assigneeId: decision.editorId,
            startedAt: new Date(),
            completedAt: new Date(),
            humanFeedback: decision.feedback || null,
            errorMessage: 'Rejected by human reviewer',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Send notification
        await this.sendNotification(decision.workflowId, 'rejected', decision.editorId);

        // Emit event
        approvalEvents.emit('content:rejected', {
          workflowId: decision.workflowId,
          articleId: workflow.articleId,
          editorId: decision.editorId,
          feedback: decision.feedback,
        });
      } else if (decision.decision === 'request_revision') {
        // Request revision and roll back to previous stage
        await aiWorkflowService.rollbackWorkflow(decision.workflowId, 'CONTENT_REVIEW');

        // Increment retry count
        await prisma.contentWorkflow.update({
          where: { id: decision.workflowId },
          data: {
            retryCount: { increment: 1 },
            metadata: JSON.stringify({
              ...(workflow.metadata ? JSON.parse(workflow.metadata as string) : {}),
              revisionFeedback: decision.feedback,
              requestedChanges: decision.requestedChanges,
            }),
            updatedAt: new Date(),
          },
        });

        // Create workflow step record
        await prisma.workflowStep.create({
          data: {
            id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workflowId: decision.workflowId,
            stepName: 'REVISION_REQUESTED',
            stepOrder: 998,
            status: 'COMPLETED',
            assigneeId: decision.editorId,
            startedAt: new Date(),
            completedAt: new Date(),
            humanFeedback: decision.feedback || null,
            output: JSON.stringify({ requestedChanges: decision.requestedChanges }),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Send notification
        await this.sendNotification(decision.workflowId, 'revision_requested', decision.editorId);

        // Emit event
        approvalEvents.emit('content:revision_requested', {
          workflowId: decision.workflowId,
          articleId: workflow.articleId,
          editorId: decision.editorId,
          feedback: decision.feedback,
          requestedChanges: decision.requestedChanges,
        });
      }

      // Invalidate caches
      await this.invalidateWorkflowCache(decision.workflowId);

      logger.info(`[HumanApprovalService] Decision processed successfully for ${decision.workflowId}`);
    } catch (error) {
      logger.error(`[HumanApprovalService] Error processing decision:`, error);
      throw error;
    }
  }

  /**
   * Process batch operations
   */
  async processBatchOperation(operation: BatchOperation): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      logger.info(`[HumanApprovalService] Processing batch operation: ${operation.operation} for ${operation.workflowIds.length} workflows`);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const workflowId of operation.workflowIds) {
        try {
          if (operation.operation === 'approve') {
            await this.processApprovalDecision({
              workflowId,
              editorId: operation.editorId!,
              decision: 'approve',
              feedback: operation.feedback,
            });
            results.success++;
          } else if (operation.operation === 'reject') {
            await this.processApprovalDecision({
              workflowId,
              editorId: operation.editorId!,
              decision: 'reject',
              feedback: operation.feedback,
            });
            results.success++;
          } else if (operation.operation === 'assign') {
            await this.assignEditor(workflowId, operation.assignToEditorId!);
            results.success++;
          } else if (operation.operation === 'cancel') {
            await prisma.contentWorkflow.update({
              where: { id: workflowId },
              data: {
                currentState: 'CANCELLED',
                updatedAt: new Date(),
              },
            });
            results.success++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info(`[HumanApprovalService] Batch operation completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error('[HumanApprovalService] Error processing batch operation:', error);
      throw error;
    }
  }

  /**
   * Assign editor to workflow
   */
  async assignEditor(workflowId: string, editorId: string): Promise<void> {
    try {
      logger.info(`[HumanApprovalService] Assigning editor ${editorId} to workflow ${workflowId}`);

      await prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          assignedReviewerId: editorId,
          updatedAt: new Date(),
        },
      });

      // Send notification to editor
      await this.sendNotification(workflowId, 'assigned', editorId);

      // Emit event
      approvalEvents.emit('editor:assigned', {
        workflowId,
        editorId,
      });

      // Invalidate caches
      await this.invalidateWorkflowCache(workflowId);

      logger.info(`[HumanApprovalService] Editor assigned successfully`);
    } catch (error) {
      logger.error('[HumanApprovalService] Error assigning editor:', error);
      throw error;
    }
  }

  /**
   * Get available editors with workload information
   */
  async getAvailableEditors(): Promise<EditorAssignment[]> {
    try {
      const cacheKey = `${CACHE_PREFIX.EDITOR}:list`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('[HumanApprovalService] Editors retrieved from cache');
        return JSON.parse(cached);
      }

      // Get editors (users with role EDITOR or ADMIN)
      const editors = await prisma.user.findMany({
        where: {
          role: { in: [UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN] },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          ContentWorkflow: {
            where: {
              currentState: 'HUMAN_APPROVAL',
              assignedReviewerId: { not: null },
            },
            select: {
              id: true,
            },
          },
        },
      });

      const editorAssignments: EditorAssignment[] = await Promise.all(
        editors.map(async editor => {
          const currentWorkload = editor.ContentWorkflow.length;
          
          // Get performance metrics
          const performanceMetrics = await this.getEditorPerformanceMetrics(editor.id);

          return {
            editorId: editor.id,
            editorName: `${editor.firstName || ''} ${editor.lastName || ''}`.trim() || editor.username,
            contentTypes: [ContentType.ARTICLE, ContentType.MARKET_ANALYSIS, ContentType.TUTORIAL], // TODO: Make configurable
            languages: ['en'], // TODO: Make configurable
            maxWorkload: 10, // TODO: Make configurable
            currentWorkload,
            performanceMetrics,
          };
        })
      );

      // Cache result
      await (redisClient as any).setex(cacheKey, CACHE_TTL.EDITOR, JSON.stringify(editorAssignments));

      logger.info(`[HumanApprovalService] Retrieved ${editorAssignments.length} editors`);
      return editorAssignments;
    } catch (error) {
      logger.error('[HumanApprovalService] Error getting available editors:', error);
      throw error;
    }
  }

  /**
   * Get editor performance metrics
   */
  async getEditorPerformanceMetrics(editorId: string): Promise<EditorPerformanceMetrics> {
    try {
      const cacheKey = `${CACHE_PREFIX.EDITOR}:metrics:${editorId}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get completed reviews in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedReviews = await prisma.workflowStep.findMany({
        where: {
          stepName: 'HUMAN_APPROVAL',
          assigneeId: editorId,
          status: 'COMPLETED',
          completedAt: { gte: thirtyDaysAgo },
        },
        select: {
          actualDurationMs: true,
          qualityScore: true,
          ContentWorkflow: {
            select: {
              currentState: true,
              retryCount: true,
            },
          },
        },
      });

      const totalReviews = completedReviews.length;
      const approvedReviews = completedReviews.filter(r => r.ContentWorkflow.currentState === 'PUBLISHED').length;
      const totalReviewTime = completedReviews.reduce((sum, r) => sum + (r.actualDurationMs || 0), 0);
      const totalQualityScore = completedReviews.reduce((sum, r) => sum + (r.qualityScore || 0), 0);
      const revisionsRequested = completedReviews.filter(r => r.ContentWorkflow.retryCount > 0).length;

      const metrics: EditorPerformanceMetrics = {
        totalReviews,
        approvalRate: totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0,
        averageReviewTime: totalReviews > 0 ? totalReviewTime / totalReviews / 60000 : 0, // Convert to minutes
        qualityScore: totalReviews > 0 ? totalQualityScore / totalReviews : 0,
        revisionRate: totalReviews > 0 ? (revisionsRequested / totalReviews) * 100 : 0,
        throughputPerDay: totalReviews / 30,
      };

      // Cache result
      if (redisClient) {
        await (redisClient as any).setex(cacheKey, CACHE_TTL.EDITOR, JSON.stringify(metrics));
      }

      return metrics;
    } catch (error) {
      logger.error(`[HumanApprovalService] Error getting editor metrics for ${editorId}:`, error);
      return {
        totalReviews: 0,
        approvalRate: 0,
        averageReviewTime: 0,
        qualityScore: 0,
        revisionRate: 0,
        throughputPerDay: 0,
      };
    }
  }

  /**
   * Get approval queue statistics
   */
  async getQueueStats(): Promise<ApprovalQueueStats> {
    try {
      const cacheKey = `${CACHE_PREFIX.STATS}:queue`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('[HumanApprovalService] Queue stats retrieved from cache');
        return JSON.parse(cached);
      }

      const workflows = await prisma.contentWorkflow.findMany({
        where: {
          currentState: 'HUMAN_APPROVAL',
        },
        select: {
          priority: true,
          workflowType: true,
          createdAt: true,
          WorkflowStep: {
            where: {
              stepName: 'HUMAN_APPROVAL',
            },
            select: {
              actualDurationMs: true,
            },
          },
        },
      });

      const total = workflows.length;
      const now = new Date();

      // Calculate stats
      const byStatus: Record<ApprovalStatus, number> = {
        PENDING: workflows.filter(w => w.WorkflowStep.length === 0).length,
        IN_REVIEW: workflows.filter(w => w.WorkflowStep.length > 0 && w.WorkflowStep[0]?.actualDurationMs === null).length,
        APPROVED: 0,
        REJECTED: 0,
        REVISION_REQUESTED: 0,
        CANCELLED: 0,
      };

      const byPriority: Record<ApprovalPriority, number> = {
        CRITICAL: workflows.filter(w => w.priority === 'CRITICAL').length,
        HIGH: workflows.filter(w => w.priority === 'HIGH').length,
        MEDIUM: workflows.filter(w => w.priority === 'MEDIUM').length,
        LOW: workflows.filter(w => w.priority === 'LOW').length,
      };

      const byContentType: Record<ContentType, number> = {
        ARTICLE: workflows.filter(w => w.workflowType === 'ARTICLE_PUBLISHING').length,
        BREAKING_NEWS: workflows.filter(w => w.workflowType === 'BREAKING_NEWS').length,
        MARKET_ANALYSIS: workflows.filter(w => w.workflowType === 'MARKET_ANALYSIS').length,
        TUTORIAL: workflows.filter(w => w.workflowType === 'TUTORIAL').length,
        TRANSLATION: 0,
      };

      const waitTimes = workflows.map(w => {
        const waitTimeMs = now.getTime() - w.createdAt.getTime();
        return waitTimeMs / 60000; // Convert to minutes
      });

      const reviewTimes = workflows
        .flatMap(w => w.WorkflowStep)
        .filter(s => s.actualDurationMs !== null)
        .map(s => s.actualDurationMs! / 60000); // Convert to minutes

      const oldestWorkflow = workflows.reduce((oldest, w) => {
        const age = now.getTime() - w.createdAt.getTime();
        return age > oldest ? age : oldest;
      }, 0);

      const stats: ApprovalQueueStats = {
        total,
        byStatus,
        byPriority,
        byContentType,
        averageWaitTime: waitTimes.length > 0 ? waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length : 0,
        averageReviewTime: reviewTimes.length > 0 ? reviewTimes.reduce((sum, t) => sum + t, 0) / reviewTimes.length : 0,
        oldestPendingAge: oldestWorkflow / 3600000, // Convert to hours
      };

      // Cache result
      if (redisClient) {
        await (redisClient as any).setex(cacheKey, CACHE_TTL.STATS, JSON.stringify(stats));
      }

      logger.info('[HumanApprovalService] Queue stats calculated');
      return stats;
    } catch (error) {
      logger.error('[HumanApprovalService] Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Send notification to editor
   */
  private async sendNotification(workflowId: string, type: string, editorId: string): Promise<void> {
    try {
      const workflow = await prisma.contentWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          Article: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!workflow) return;

      const messages = {
        assigned: `You have been assigned to review: ${workflow.Article.title}`,
        approved: `Content approved: ${workflow.Article.title}`,
        rejected: `Content rejected: ${workflow.Article.title}`,
        revision_requested: `Revision requested for: ${workflow.Article.title}`,
      };

      await prisma.workflowNotification.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workflowId,
          recipientId: editorId,
          notificationType: type.toUpperCase(),
          title: 'Approval Required',
          message: messages[type as keyof typeof messages] || 'Workflow notification',
          createdAt: new Date(),
        },
      });

      // Emit event for real-time notification
      approvalEvents.emit('notification:sent', {
        workflowId,
        editorId,
        type,
      });

      logger.info(`[HumanApprovalService] Notification sent to ${editorId}`);
    } catch (error) {
      logger.error('[HumanApprovalService] Error sending notification:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Helper: Map workflow type to content type
   */
  private mapWorkflowTypeToContentType(workflowType: string): ContentType {
    const mapping: Record<string, ContentType> = {
      ARTICLE_PUBLISHING: ContentType.ARTICLE,
      BREAKING_NEWS: ContentType.BREAKING_NEWS,
      MARKET_ANALYSIS: ContentType.MARKET_ANALYSIS,
      TUTORIAL: ContentType.TUTORIAL,
    };
    return mapping[workflowType] || ContentType.ARTICLE;
  }

  /**
   * Helper: Get language name from code
   */
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      en: 'English',
      sw: 'Swahili',
      ha: 'Hausa',
      yo: 'Yoruba',
      ig: 'Igbo',
      am: 'Amharic',
      zu: 'Zulu',
      xh: 'Xhosa',
      st: 'Sesotho',
      sn: 'Shona',
      rw: 'Kinyarwanda',
      lg: 'Luganda',
      ny: 'Chichewa',
      so: 'Somali',
      ti: 'Tigrinya',
    };
    return languages[code] || code;
  }

  /**
   * Helper: Format content for display
   */
  private formatContent(content: string): string {
    // Add basic HTML formatting
    return content
      .split('\n\n')
      .map(para => `<p>${para}</p>`)
      .join('\n');
  }

  /**
   * Helper: Invalidate workflow cache
   */
  private async invalidateWorkflowCache(workflowId: string): Promise<void> {
    try {
      const keys = await redisClient.keys(`${CACHE_PREFIX.QUEUE}:*`);
      keys.push(`${CACHE_PREFIX.ITEM}:${workflowId}`);
      keys.push(`${CACHE_PREFIX.STATS}:*`);
      
      if (keys.length > 0) {
        if (redisClient && keys.length > 0) {
          for (const key of keys) {
            await redisClient.del(key);
          }
        }
      }
    } catch (error) {
      logger.error('[HumanApprovalService] Error invalidating cache:', error);
    }
  }

  /**
   * Get event emitter for subscriptions
   */
  getEventEmitter(): EventEmitter {
    return approvalEvents;
  }
}

// ==================== EXPORT ====================

const humanApprovalService = new HumanApprovalService();
export default humanApprovalService;
