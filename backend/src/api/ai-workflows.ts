/**
 * AI Workflow REST API Routes
 * Handles workflow creation, status, advancement, rollback, and human review
 * 
 * Endpoints:
 * POST   /api/ai/workflows                 - Start new workflow
 * GET    /api/ai/workflows/:id             - Get workflow status
 * PUT    /api/ai/workflows/:id/advance     - Move to next stage
 * PUT    /api/ai/workflows/:id/rollback    - Revert to previous stage
 * POST   /api/ai/workflows/:id/human-review - Submit for human review
 * POST   /api/ai/workflows/:id/pause       - Pause workflow
 * POST   /api/ai/workflows/:id/resume      - Resume paused workflow
 * GET    /api/ai/workflows/queue/human-approval - Get human approval queue
 * POST   /api/ai/workflows/:id/review-decision - Process human review decision
 * GET    /api/ai/workflows                 - List workflows with filters
 * GET    /api/ai/workflows/health          - Health check
 */

import express, { Request, Response } from 'express';
import { aiWorkflowService, WorkflowState, WorkflowPriority, WorkflowType } from '../services/aiWorkflowService';
import { logger } from '../utils/logger';

const router = express.Router();

// ==================== MIDDLEWARE ====================

const validateWorkflowId = (req: Request, res: Response, next: any): void => {
  const { id } = req.params;
  if (!id || !id.startsWith('wf_')) {
    res.status(400).json({
      error: {
        code: 'INVALID_WORKFLOW_ID',
        message: 'Invalid workflow ID format'
      }
    });
    return;
  }
  next();
};

const asyncHandler = (fn: any) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== ROUTES ====================

/**
 * @route   POST /api/ai/workflows
 * @desc    Create a new content workflow
 * @access  Private (Admin/Editor)
 */
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { articleId, workflowType, priority, assignedReviewerId, metadata } = req.body;

    // Validation
    if (!articleId) {
      res.status(400).json({
        error: {
          code: 'MISSING_ARTICLE_ID',
          message: 'Article ID is required'
        }
      });
      return;
    }

    // Validate enum values
    if (workflowType && !Object.values(WorkflowType).includes(workflowType)) {
      res.status(400).json({
        error: {
          code: 'INVALID_WORKFLOW_TYPE',
          message: `Invalid workflow type. Must be one of: ${Object.values(WorkflowType).join(', ')}`
        }
      });
      return;
    }

    if (priority && !Object.values(WorkflowPriority).includes(priority)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PRIORITY',
          message: `Invalid priority. Must be one of: ${Object.values(WorkflowPriority).join(', ')}`
        }
      });
      return;
    }

    const workflow = await aiWorkflowService.createWorkflow({
      articleId,
      workflowType,
      priority,
      assignedReviewerId,
      metadata
    });

    const responseTime = Date.now() - startTime;

    res.status(201).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Created workflow ${workflow.id} in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Create workflow error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: {
        code: error.message.includes('already exists') ? 'WORKFLOW_EXISTS' : 'WORKFLOW_CREATE_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   GET /api/ai/workflows/:id
 * @desc    Get workflow status and details
 * @access  Private
 */
router.get('/:id', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }
    
    const workflow = await aiWorkflowService.getWorkflow(id);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        cached: responseTime < 50, // Likely cached if < 50ms
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Get workflow error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: {
        code: 'WORKFLOW_NOT_FOUND',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   PUT /api/ai/workflows/:id/advance
 * @desc    Advance workflow to next stage
 * @access  Private (System/Admin)
 */
router.put('/:id/advance', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }
    
    const { qualityScore } = req.body;

    // Validate quality score if provided
    if (qualityScore) {
      if (typeof qualityScore.score !== 'number' || qualityScore.score < 0 || qualityScore.score > 1) {
        res.status(400).json({
          error: {
            code: 'INVALID_QUALITY_SCORE',
            message: 'Quality score must be a number between 0 and 1'
          }
        });
        return;
      }

      if (!qualityScore.stage || !Object.values(WorkflowState).includes(qualityScore.stage)) {
        res.status(400).json({
          error: {
            code: 'INVALID_STAGE',
            message: 'Invalid workflow stage in quality score'
          }
        });
        return;
      }
    }

    const workflow = await aiWorkflowService.advanceWorkflow(id, qualityScore);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Advanced workflow ${id} in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Advance workflow error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: {
        code: 'WORKFLOW_ADVANCE_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   PUT /api/ai/workflows/:id/rollback
 * @desc    Rollback workflow to previous stage
 * @access  Private (System/Admin)
 */
router.put('/:id/rollback', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }
    
    const { reason } = req.body;

    const workflow = await aiWorkflowService.rollbackWorkflow(id, reason);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Rolled back workflow ${id} in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Rollback workflow error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: {
        code: 'WORKFLOW_ROLLBACK_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   POST /api/ai/workflows/:id/pause
 * @desc    Pause workflow execution
 * @access  Private (Admin)
 */
router.post('/:id/pause', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }
    
    const { reason } = req.body;

    const workflow = await aiWorkflowService.pauseWorkflow(id, reason);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Paused workflow ${id} in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Pause workflow error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: {
        code: 'WORKFLOW_PAUSE_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   POST /api/ai/workflows/:id/resume
 * @desc    Resume paused workflow
 * @access  Private (Admin)
 */
router.post('/:id/resume', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }

    const workflow = await aiWorkflowService.resumeWorkflow(id);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Resumed workflow ${id} in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Resume workflow error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: {
        code: 'WORKFLOW_RESUME_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   POST /api/ai/workflows/:id/human-review
 * @desc    Submit workflow for human review
 * @access  Private (System/Admin)
 */
router.post('/:id/human-review', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }
    
    const { reviewerId } = req.body;

    const workflow = await aiWorkflowService.submitForHumanReview(id, reviewerId);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Submitted workflow ${id} for human review in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Submit for human review error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: {
        code: 'HUMAN_REVIEW_SUBMIT_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   POST /api/ai/workflows/:id/review-decision
 * @desc    Process human review decision (approve/reject)
 * @access  Private (Editor/Admin)
 */
router.post('/:id/review-decision', validateWorkflowId, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }
    
    const { reviewerId, approved, feedback, requestedChanges } = req.body;

    // Validation
    if (!reviewerId) {
      res.status(400).json({
        error: {
          code: 'MISSING_REVIEWER_ID',
          message: 'Reviewer ID is required'
        }
      });
      return;
    }

    if (typeof approved !== 'boolean') {
      res.status(400).json({
        error: {
          code: 'MISSING_APPROVAL_STATUS',
          message: 'Approval status (approved: boolean) is required'
        }
      });
      return;
    }

    const workflow = await aiWorkflowService.processHumanReview({
      workflowId: id,
      reviewerId,
      approved,
      feedback,
      requestedChanges
    });

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflow,
      meta: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`[API] Processed review decision for workflow ${id} in ${responseTime}ms`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Process review decision error:', error);
    
    res.status(error.message.includes('not found') ? 404 : 400).json({
      error: {
        code: 'REVIEW_DECISION_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   GET /api/ai/workflows/queue/human-approval
 * @desc    Get human approval queue
 * @access  Private (Editor/Admin)
 */
router.get('/queue/human-approval', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { priority } = req.query;

    // Validate priority if provided
    if (priority && !Object.values(WorkflowPriority).includes(priority as WorkflowPriority)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PRIORITY',
          message: `Invalid priority. Must be one of: ${Object.values(WorkflowPriority).join(', ')}`
        }
      });
      return;
    }

    const queue = await aiWorkflowService.getHumanApprovalQueue(priority as WorkflowPriority);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: queue,
      meta: {
        count: queue.length,
        responseTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] Get human approval queue error:', error);
    
    res.status(500).json({
      error: {
        code: 'QUEUE_FETCH_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   GET /api/ai/workflows
 * @desc    List workflows with filters
 * @access  Private
 */
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const {
      currentState,
      priority,
      workflowType,
      assignedReviewerId,
      startDate,
      endDate
    } = req.query;

    // Validate enum values
    if (currentState && !Object.values(WorkflowState).includes(currentState as WorkflowState)) {
      res.status(400).json({
        error: {
          code: 'INVALID_STATE',
          message: `Invalid state. Must be one of: ${Object.values(WorkflowState).join(', ')}`
        }
      });
      return;
    }

    if (priority && !Object.values(WorkflowPriority).includes(priority as WorkflowPriority)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PRIORITY',
          message: `Invalid priority. Must be one of: ${Object.values(WorkflowPriority).join(', ')}`
        }
      });
      return;
    }

    if (workflowType && !Object.values(WorkflowType).includes(workflowType as WorkflowType)) {
      res.status(400).json({
        error: {
          code: 'INVALID_WORKFLOW_TYPE',
          message: `Invalid workflow type. Must be one of: ${Object.values(WorkflowType).join(', ')}`
        }
      });
      return;
    }

    const filterParams: any = {};
    if (currentState) filterParams.currentState = currentState as WorkflowState;
    if (priority) filterParams.priority = priority as WorkflowPriority;
    if (workflowType) filterParams.workflowType = workflowType as WorkflowType;
    if (assignedReviewerId) filterParams.assignedReviewerId = assignedReviewerId as string;
    if (startDate) filterParams.startDate = new Date(startDate as string);
    if (endDate) filterParams.endDate = new Date(endDate as string);

    const workflows = await aiWorkflowService.listWorkflows(filterParams);

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      data: workflows,
      meta: {
        count: workflows.length,
        responseTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('[API] List workflows error:', error);
    
    res.status(500).json({
      error: {
        code: 'WORKFLOWS_FETCH_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime
      }
    });
  }
}));

/**
 * @route   GET /api/ai/workflows/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ai-workflows',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}));

// ==================== ERROR HANDLER ====================

router.use((error: any, req: Request, res: Response, next: any) => {
  logger.error('[API] Unhandled error:', error);
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
