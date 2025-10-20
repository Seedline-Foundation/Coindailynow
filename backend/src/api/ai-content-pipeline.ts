/**
 * AI Content Pipeline REST API
 * 
 * Endpoints for automated content pipeline management.
 */

import express, { Request, Response } from 'express';
import { aiContentPipelineService } from '../services/aiContentPipelineService';
import type { 
  ArticleGenerationRequest, 
  PipelineConfig 
} from '../services/aiContentPipelineService';

const router = express.Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Authentication middleware (admin only for sensitive operations)
 */
const requireAuth = (req: Request, res: Response, next: any) => {
  // TODO: Implement JWT authentication
  // For now, pass through
  next();
};

/**
 * Admin-only middleware
 */
const requireAdmin = (req: Request, res: Response, next: any) => {
  // TODO: Implement role-based access control
  // For now, pass through
  next();
};

/**
 * Cache tracking middleware
 */
const trackCache = (req: Request, res: Response, next: any) => {
  const originalJson = res.json;
  res.json = function (data: any) {
    if (data && typeof data === 'object') {
      data._cache = {
        hit: res.locals.cacheHit || false,
        timestamp: new Date().toISOString()
      };
    }
    return originalJson.call(this, data);
  };
  next();
};

router.use(trackCache);

// ============================================================================
// PIPELINE CONFIGURATION
// ============================================================================

/**
 * GET /api/ai/pipeline/config
 * Get current pipeline configuration
 */
router.get('/config', requireAuth, async (req: Request, res: Response) => {
  try {
    const config = await aiContentPipelineService.getConfiguration();
    
    res.json({
      success: true,
      data: config
    });
      return;
  } catch (error) {
    console.error('Error getting pipeline config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get configuration'
      }
    });
    return;
  }
});

/**
 * PUT /api/ai/pipeline/config
 * Update pipeline configuration (admin only)
 */
router.put('/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates: Partial<PipelineConfig> = req.body;

    // Validate configuration
    if (updates.autoPublishThreshold !== undefined) {
      if (updates.autoPublishThreshold < 0 || updates.autoPublishThreshold > 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'autoPublishThreshold must be between 0 and 1'
          }
        });
      }
    }

    if (updates.maxConcurrentPipelines !== undefined) {
      if (updates.maxConcurrentPipelines < 1 || updates.maxConcurrentPipelines > 50) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'maxConcurrentPipelines must be between 1 and 50'
          }
        });
      }
    }

    const config = await aiContentPipelineService.updateConfiguration(updates);
    
    res.json({
      success: true,
      data: config,
      message: 'Configuration updated successfully'
    });
      return;
  } catch (error) {
    console.error('Error updating pipeline config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIG_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update configuration'
      }
    });
    return;
  }
});

// ============================================================================
// TRENDING TOPICS
// ============================================================================

/**
 * GET /api/ai/pipeline/trending
 * Get current trending topics for automated article creation
 */
router.get('/trending', requireAuth, async (req: Request, res: Response) => {
  try {
    const topics = await aiContentPipelineService.monitorTrendingTopics();
    
    res.json({
      success: true,
      data: topics,
      count: topics.length
    });
      return;
  } catch (error) {
    console.error('Error getting trending topics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDING_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get trending topics'
      }
    });
    return;
  }
});

// ============================================================================
// PIPELINE MANAGEMENT
// ============================================================================

/**
 * POST /api/ai/pipeline/initiate
 * Initiate automated article generation pipeline
 * 
 * Body:
 * {
 *   "topic": "Bitcoin breaks $100k",
 *   "urgency": "breaking" | "high" | "medium" | "low",
 *   "targetLanguages": ["en", "sw", "ha"],
 *   "generateImages": true,
 *   "autoPublish": true,
 *   "qualityThreshold": 0.8
 * }
 */
router.post('/initiate', requireAuth, async (req: Request, res: Response) => {
  try {
    const request: ArticleGenerationRequest = req.body;

    // Validate request
    if (!request.topic || typeof request.topic !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Topic is required and must be a string'
        }
      });
    }

    if (!request.urgency || !['breaking', 'high', 'medium', 'low'].includes(request.urgency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Urgency must be one of: breaking, high, medium, low'
        }
      });
    }

    if (request.qualityThreshold !== undefined) {
      if (request.qualityThreshold < 0 || request.qualityThreshold > 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'qualityThreshold must be between 0 and 1'
          }
        });
      }
    }

    const status = await aiContentPipelineService.initiateArticlePipeline(request);
    
    res.status(201).json({
      success: true,
      data: status,
      message: 'Pipeline initiated successfully'
    });
      return;
  } catch (error) {
    console.error('Error initiating pipeline:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initiate pipeline'
      }
    });
    return;
  }
});

/**
 * GET /api/ai/pipeline/status/:pipelineId
 * Get pipeline status
 */
router.get('/status/:pipelineId', requireAuth, async (req: Request, res: Response) => {
  try {
    const pipelineId = req.params.pipelineId;
    if (!pipelineId) {
      return res.status(400).json({ error: 'Pipeline ID is required' });
    }
    
    const status = await aiContentPipelineService.getPipelineStatus(pipelineId);
    
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting pipeline status:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get pipeline status'
      }
    });
  }
});

/**
 * GET /api/ai/pipeline/active
 * Get all active pipelines
 */
router.get('/active', requireAuth, async (req: Request, res: Response) => {
  try {
    const pipelines = await aiContentPipelineService.getActivePipelines();
    
    res.json({
      success: true,
      data: pipelines,
      count: pipelines.length
    });
      return;
  } catch (error) {
    console.error('Error getting active pipelines:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get active pipelines'
      }
    });
    return;
  }
});

/**
 * POST /api/ai/pipeline/:pipelineId/cancel
 * Cancel a running pipeline
 */
router.post('/:pipelineId/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const pipelineId = req.params.pipelineId;
    if (!pipelineId) {
      return res.status(400).json({ error: 'Pipeline ID is required' });
    }
    
    await aiContentPipelineService.cancelPipeline(pipelineId);
    
    return res.json({
      success: true,
      message: 'Pipeline cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling pipeline:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    if (error instanceof Error && error.message.includes('Cannot cancel')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: error.message
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel pipeline'
      }
    });
  }
});

/**
 * POST /api/ai/pipeline/:pipelineId/retry
 * Retry a failed pipeline
 */
router.post('/:pipelineId/retry', requireAuth, async (req: Request, res: Response) => {
  try {
    const pipelineId = req.params.pipelineId;
    if (!pipelineId) {
      return res.status(400).json({ error: 'Pipeline ID is required' });
    }
    
    const status = await aiContentPipelineService.retryPipeline(pipelineId);
    
    return res.json({
      success: true,
      data: status,
      message: 'Pipeline retry initiated'
    });
  } catch (error) {
    console.error('Error retrying pipeline:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    if (error instanceof Error && error.message.includes('Can only retry')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: error.message
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'RETRY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retry pipeline'
      }
    });
  }
});

// ============================================================================
// METRICS & ANALYTICS
// ============================================================================

/**
 * GET /api/ai/pipeline/metrics
 * Get pipeline performance metrics
 */
router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const metrics = await aiContentPipelineService.getPipelineMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
      return;
  } catch (error) {
    console.error('Error getting pipeline metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get pipeline metrics'
      }
    });
    return;
  }
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * POST /api/ai/pipeline/batch/initiate
 * Initiate multiple pipelines from trending topics
 * 
 * Body:
 * {
 *   "topics": ["topic1", "topic2"],
 *   "urgency": "high",
 *   "autoPublish": true
 * }
 */
router.post('/batch/initiate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { topics, urgency = 'medium', autoPublish = false } = req.body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Topics must be a non-empty array'
        }
      });
    }

    if (topics.length > 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Maximum 10 topics per batch'
        }
      });
    }

    // Initiate pipelines for each topic
    const results = await Promise.allSettled(
      topics.map((topic: string) =>
        aiContentPipelineService.initiateArticlePipeline({
          topic,
          urgency,
          autoPublish
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        total: topics.length,
        successful,
        failed,
        pipelines: results.map(r => 
          r.status === 'fulfilled' ? r.value : null
        ).filter(Boolean)
      },
      message: `Initiated ${successful} pipelines successfully, ${failed} failed`
    });
      return;
  } catch (error) {
    console.error('Error in batch initiate:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initiate batch pipelines'
      }
    });
    return;
  }
});

/**
 * POST /api/ai/pipeline/batch/cancel
 * Cancel multiple pipelines
 * 
 * Body:
 * {
 *   "pipelineIds": ["id1", "id2"]
 * }
 */
router.post('/batch/cancel', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { pipelineIds } = req.body;

    if (!Array.isArray(pipelineIds) || pipelineIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'pipelineIds must be a non-empty array'
        }
      });
    }

    const results = await Promise.allSettled(
      pipelineIds.map((id: string) =>
        aiContentPipelineService.cancelPipeline(id)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        total: pipelineIds.length,
        successful,
        failed
      },
      message: `Cancelled ${successful} pipelines successfully, ${failed} failed`
    });
      return;
  } catch (error) {
    console.error('Error in batch cancel:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel batch pipelines'
      }
    });
    return;
  }
});

// ============================================================================
// AUTO-DISCOVERY FROM TRENDING
// ============================================================================

/**
 * POST /api/ai/pipeline/auto-discover
 * Automatically discover trending topics and initiate pipelines
 * (Admin only - this is powerful!)
 */
router.post('/auto-discover', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      maxTopics = 5,
      urgencyFilter = ['breaking', 'high'],
      autoPublish = false
    } = req.body;

    // Get trending topics
    const topics = await aiContentPipelineService.monitorTrendingTopics();

    // Filter by urgency
    const filteredTopics = topics.filter(t => 
      urgencyFilter.includes(t.urgency)
    ).slice(0, maxTopics);

    if (filteredTopics.length === 0) {
      return res.json({
        success: true,
        data: { pipelines: [] },
        message: 'No trending topics found matching criteria'
      });
    }

    // Initiate pipelines
    const results = await Promise.allSettled(
      filteredTopics.map(topic =>
        aiContentPipelineService.initiateArticlePipeline({
          topic: topic.keyword,
          urgency: topic.urgency,
          autoPublish
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        total: filteredTopics.length,
        successful,
        failed,
        pipelines: results.map(r => 
          r.status === 'fulfilled' ? r.value : null
        ).filter(Boolean)
      },
      message: `Auto-discovered ${filteredTopics.length} topics, initiated ${successful} pipelines`
    });
      return;
  } catch (error) {
    console.error('Error in auto-discover:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTO_DISCOVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to auto-discover topics'
      }
    });
    return;
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/ai/pipeline/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await aiContentPipelineService.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      ...health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed'
    });
    return;
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
