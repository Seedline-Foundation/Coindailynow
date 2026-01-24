/**
 * Human Approval Workflow REST API
 * Endpoints for managing content review and approval
 * 
 * Routes:
 * GET    /api/ai/approval/queue                  - Get approval queue with filters
 * GET    /api/ai/approval/:id                    - Get detailed content review
 * POST   /api/ai/approval/:id/approve            - Approve content
 * POST   /api/ai/approval/:id/reject             - Reject content
 * POST   /api/ai/approval/:id/request-revision   - Request revision
 * POST   /api/ai/approval/batch                  - Batch operations
 * POST   /api/ai/approval/:id/assign             - Assign editor
 * GET    /api/ai/approval/editors                - Get available editors
 * GET    /api/ai/approval/editors/:id/metrics    - Get editor performance metrics
 * GET    /api/ai/approval/stats                  - Get queue statistics
 * GET    /api/ai/approval/health                 - Health check
 */

import { Router, Request, Response } from 'express';
import humanApprovalService, {
  ApprovalQueueFilters,
  ApprovalDecision,
  BatchOperation,
  ApprovalPriority,
  ContentType,
  ApprovalStatus,
} from '../services/humanApprovalService';
import { logger } from '../utils/logger';

const router = Router();

// ==================== MIDDLEWARE ====================

/**
 * Cache tracking middleware
 */
const cacheTracker = (req: Request, res: Response, next: any) => {
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    if (data && typeof data === 'object') {
      data._cache = {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
      };
    }
    return originalJson(data);
  };
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req: Request, res: Response, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[HumanApprovalAPI] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

router.use(cacheTracker);
router.use(requestLogger);

// ==================== ROUTES ====================

/**
 * GET /api/ai/approval/queue
 * Get approval queue with filtering and pagination
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      contentType,
      assignedEditorId,
      languageCode,
      dateFrom,
      dateTo,
      minConfidenceScore,
      maxConfidenceScore,
      page = '1',
      limit = '20',
    } = req.query;

    const filters: ApprovalQueueFilters = {};

    if (status) {
      filters.status = (Array.isArray(status) ? status : [status]) as ApprovalStatus[];
    }

    if (priority) {
      filters.priority = (Array.isArray(priority) ? priority : [priority]) as ApprovalPriority[];
    }

    if (contentType) {
      filters.contentType = (Array.isArray(contentType) ? contentType : [contentType]) as ContentType[];
    }

    if (assignedEditorId) {
      filters.assignedEditorId = assignedEditorId as string;
    }

    if (languageCode) {
      filters.languageCode = languageCode as string;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom as string);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo as string);
    }

    if (minConfidenceScore) {
      filters.minConfidenceScore = parseFloat(minConfidenceScore as string);
    }

    if (maxConfidenceScore) {
      filters.maxConfidenceScore = parseFloat(maxConfidenceScore as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const result = await humanApprovalService.getApprovalQueue(filters, pageNum, limitNum);

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[HumanApprovalAPI] Error getting approval queue:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'QUEUE_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve approval queue',
      },
    });
  }
});

/**
 * GET /api/ai/approval/:id
 * Get detailed content review information
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing workflow ID' });
    const details = await humanApprovalService.getContentReviewDetails(id);

    return res.json({
      success: true,
      data: details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error getting content details:`, error);
    return res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: {
        code: 'CONTENT_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve content details',
      },
    });
  }
});

/**
 * POST /api/ai/approval/:id/approve
 * Approve content
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { editorId, feedback, qualityOverride } = req.body;

    if (!editorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EDITOR_ID',
          message: 'Editor ID is required',
        },
      });
    }

    const decision: ApprovalDecision = {
      workflowId: id as string,
      editorId,
      decision: 'approve',
      feedback,
      qualityOverride,
    };

    await humanApprovalService.processApprovalDecision(decision);

    return res.json({
      success: true,
      message: 'Content approved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error approving content:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to approve content',
      },
    });
  }
});

/**
 * POST /api/ai/approval/:id/reject
 * Reject content
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { editorId, feedback } = req.body;

    if (!editorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EDITOR_ID',
          message: 'Editor ID is required',
        },
      });
    }

    const decision: ApprovalDecision = {
      workflowId: id as string,
      editorId,
      decision: 'reject',
      feedback,
    };

    await humanApprovalService.processApprovalDecision(decision);

    return res.json({
      success: true,
      message: 'Content rejected successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error rejecting content:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REJECTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reject content',
      },
    });
  }
});

/**
 * POST /api/ai/approval/:id/request-revision
 * Request revision for content
 */
router.post('/:id/request-revision', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { editorId, feedback, requestedChanges } = req.body;

    if (!editorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EDITOR_ID',
          message: 'Editor ID is required',
        },
      });
    }

    if (!feedback && (!requestedChanges || requestedChanges.length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FEEDBACK',
          message: 'Feedback or requested changes are required',
        },
      });
    }

    const decision: ApprovalDecision = {
      workflowId: id as string,
      editorId,
      decision: 'request_revision',
      feedback,
      requestedChanges,
    };

    await humanApprovalService.processApprovalDecision(decision);

    return res.json({
      success: true,
      message: 'Revision requested successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error requesting revision:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REVISION_REQUEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to request revision',
      },
    });
  }
});

/**
 * POST /api/ai/approval/batch
 * Process batch operations
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { workflowIds, operation, editorId, assignToEditorId, feedback } = req.body;

    if (!workflowIds || !Array.isArray(workflowIds) || workflowIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKFLOW_IDS',
          message: 'Workflow IDs must be a non-empty array',
        },
      });
    }

    if (!operation || !['approve', 'reject', 'assign', 'cancel'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: 'Operation must be one of: approve, reject, assign, cancel',
        },
      });
    }

    if ((operation === 'approve' || operation === 'reject') && !editorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EDITOR_ID',
          message: 'Editor ID is required for approve/reject operations',
        },
      });
    }

    if (operation === 'assign' && !assignToEditorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ASSIGN_TO_EDITOR_ID',
          message: 'Assign to editor ID is required for assign operation',
        },
      });
    }

    const batchOp: BatchOperation = {
      workflowIds,
      operation,
      editorId,
      assignToEditorId,
      feedback,
    };

    const result = await humanApprovalService.processBatchOperation(batchOp);

    return res.json({
      success: true,
      data: result,
      message: `Batch operation completed: ${result.success} successful, ${result.failed} failed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error processing batch operation:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_OPERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process batch operation',
      },
    });
  }
});

/**
 * POST /api/ai/approval/:id/assign
 * Assign editor to workflow
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { editorId } = req.body;

    if (!editorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EDITOR_ID',
          message: 'Editor ID is required',
        },
      });
    }

    await humanApprovalService.assignEditor(id as string, editorId);

    return res.json({
      success: true,
      message: 'Editor assigned successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error assigning editor:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGNMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to assign editor',
      },
    });
  }
});

/**
 * GET /api/ai/approval/editors
 * Get available editors with workload information
 */
router.get('/editors', async (req: Request, res: Response) => {
  try {
    const editors = await humanApprovalService.getAvailableEditors();

    return res.json({
      success: true,
      data: editors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[HumanApprovalAPI] Error getting editors:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'EDITORS_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve editors',
      },
    });
  }
});

/**
 * GET /api/ai/approval/editors/:id/metrics
 * Get editor performance metrics
 */
router.get('/editors/:id/metrics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing editor ID' });
    const metrics = await humanApprovalService.getEditorPerformanceMetrics(id);

    return res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`[HumanApprovalAPI] Error getting editor metrics:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve editor metrics',
      },
    });
  }
});

/**
 * GET /api/ai/approval/stats
 * Get queue statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await humanApprovalService.getQueueStats();

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[HumanApprovalAPI] Error getting queue stats:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STATS_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve queue stats',
      },
    });
  }
});

/**
 * GET /api/ai/approval/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await humanApprovalService.getQueueStats();

    return res.json({
      success: true,
      status: 'healthy',
      service: 'human-approval',
      timestamp: new Date().toISOString(),
      metrics: {
        queueSize: stats.total,
        averageWaitTime: stats.averageWaitTime,
        oldestPendingAge: stats.oldestPendingAge,
      },
    });
  } catch (error) {
    logger.error('[HumanApprovalAPI] Health check failed:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'human-approval',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ==================== EXPORT ====================

export default router;
