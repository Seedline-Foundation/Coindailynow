/**
 * AI Configuration Management REST API
 * Provides endpoints for managing AI agent configurations, workflow templates,
 * cost budgets, and quality thresholds
 * 
 * Task 6.2: AI Configuration Management
 * Performance Target: < 300ms response time (cached)
 */

import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as configService from '../services/aiConfigurationService';
import { logger } from '../utils/logger';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(requireRole(['SUPER_ADMIN', 'admin']));

// ==================== AGENT CONFIGURATION ====================

/**
 * GET /api/ai/config/agents/:agentId
 * Get agent configuration
 */
router.get(
  '/agents/:agentId',
  param('agentId').isString().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }
      
      const agentId = req.params.agentId as string;
      
      const config = await configService.getAgentConfiguration(agentId);
      
      if (!config) {
        res.status(404).json({ error: 'Agent configuration not found' });
        return;
      }
      
      const duration = Date.now() - startTime;
      logger.info(`GET /api/ai/config/agents/${agentId} - ${duration}ms`);
      
      res.json({
        data: config,
        meta: {
          duration,
          cached: duration < 100,
        },
      });
    } catch (error) {
      logger.error('Error getting agent configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/ai/config/agents/:agentId
 * Update agent configuration
 */
router.put(
  '/agents/:agentId',
  param('agentId').isString().notEmpty(),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('maxTokens').optional().isInt({ min: 1, max: 128000 }),
  body('topP').optional().isFloat({ min: 0, max: 1 }),
  body('frequencyPenalty').optional().isFloat({ min: -2, max: 2 }),
  body('presencePenalty').optional().isFloat({ min: -2, max: 2 }),
  body('modelProvider').optional().isString(),
  body('modelName').optional().isString(),
  body('timeout').optional().isInt({ min: 1000 }),
  body('maxRetries').optional().isInt({ min: 0, max: 10 }),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const agentId = req.params.agentId as string;
      const updates = req.body;
      const updatedBy = req.user?.id;
      
      const config = await configService.updateAgentConfiguration(agentId, updates, updatedBy);
      
      const duration = Date.now() - startTime;
      logger.info(`PUT /api/ai/config/agents/${agentId} - ${duration}ms`);
      
      res.json({
        data: config,
        meta: {
          duration,
          message: 'Configuration updated successfully. Changes will take effect within 30 seconds.',
        },
      });
    } catch (error) {
      logger.error('Error updating agent configuration:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

/**
 * POST /api/ai/config/agents/:agentId/ab-testing/enable
 * Enable A/B testing for an agent
 */
router.post(
  '/agents/:agentId/ab-testing/enable',
  param('agentId').isString().notEmpty(),
  body('variant').isIn(['A', 'B']),
  body('trafficSplit').isFloat({ min: 0, max: 100 }),
  body('testId').optional().isString(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const agentId = req.params.agentId as string;
      const { variant, trafficSplit, testId } = req.body;
      
      const config = await configService.enableABTesting(agentId, variant, trafficSplit, testId);
      
      const duration = Date.now() - startTime;
      logger.info(`POST /api/ai/config/agents/${agentId}/ab-testing/enable - ${duration}ms`);
      
      res.json({
        data: config,
        meta: {
          duration,
          message: 'A/B testing enabled successfully',
        },
      });
    } catch (error) {
      logger.error('Error enabling A/B testing:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

/**
 * POST /api/ai/config/agents/:agentId/ab-testing/disable
 * Disable A/B testing for an agent
 */
router.post(
  '/agents/:agentId/ab-testing/disable',
  param('agentId').isString().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const agentId = req.params.agentId as string;
      
      const config = await configService.disableABTesting(agentId);
      
      const duration = Date.now() - startTime;
      logger.info(`POST /api/ai/config/agents/${agentId}/ab-testing/disable - ${duration}ms`);
      
      res.json({
        data: config,
        meta: {
          duration,
          message: 'A/B testing disabled successfully',
        },
      });
    } catch (error) {
      logger.error('Error disabling A/B testing:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

// ==================== WORKFLOW TEMPLATES ====================

/**
 * POST /api/ai/config/workflow-templates
 * Create workflow template
 */
router.post(
  '/workflow-templates',
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('stages').isArray({ min: 1 }),
  body('qualityThresholds').isObject(),
  body('timeout').isInt({ min: 1000 }),
  body('maxRetries').isInt({ min: 0, max: 10 }),
  body('contentType').optional().isString(),
  body('isDefault').isBoolean(),
  body('isActive').isBoolean(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const template = await configService.createWorkflowTemplate({
        ...req.body,
        createdBy: req.user?.id,
      });
      
      const duration = Date.now() - startTime;
      logger.info(`POST /api/ai/config/workflow-templates - ${duration}ms`);
      
      res.status(201).json({
        data: template,
        meta: {
          duration,
          message: 'Workflow template created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating workflow template:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

/**
 * GET /api/ai/config/workflow-templates
 * List workflow templates
 */
router.get(
  '/workflow-templates',
  query('isActive').optional().isBoolean(),
  query('contentType').optional().isString(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const filter: any = {};
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      if (req.query.contentType) {
        filter.contentType = req.query.contentType;
      }
      
      const templates = await configService.listWorkflowTemplates(filter);
      
      const duration = Date.now() - startTime;
      logger.info(`GET /api/ai/config/workflow-templates - ${duration}ms`);
      
      res.json({
        data: templates,
        meta: {
          duration,
          count: templates.length,
          cached: duration < 100,
        },
      });
    } catch (error) {
      logger.error('Error listing workflow templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/ai/config/workflow-templates/:id
 * Get workflow template
 */
router.get(
  '/workflow-templates/:id',
  param('id').isString().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const id = req.params.id as string;
      
      const template = await configService.getWorkflowTemplate(id);
      
      if (!template) {
        res.status(404).json({ error: 'Workflow template not found' });
      }
      
      const duration = Date.now() - startTime;
      logger.info(`GET /api/ai/config/workflow-templates/${id} - ${duration}ms`);
      
      res.json({
        data: template,
        meta: {
          duration,
          cached: duration < 100,
        },
      });
    } catch (error) {
      logger.error('Error getting workflow template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/ai/config/workflow-templates/:id
 * Update workflow template
 */
router.put(
  '/workflow-templates/:id',
  param('id').isString().notEmpty(),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('stages').optional().isArray({ min: 1 }),
  body('qualityThresholds').optional().isObject(),
  body('timeout').optional().isInt({ min: 1000 }),
  body('maxRetries').optional().isInt({ min: 0, max: 10 }),
  body('isActive').optional().isBoolean(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const id = req.params.id as string;
      const updates = req.body;
      
      const template = await configService.updateWorkflowTemplate(id, updates);
      
      const duration = Date.now() - startTime;
      logger.info(`PUT /api/ai/config/workflow-templates/${id} - ${duration}ms`);
      
      res.json({
        data: template,
        meta: {
          duration,
          message: 'Workflow template updated successfully',
        },
      });
    } catch (error) {
      logger.error('Error updating workflow template:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/ai/config/workflow-templates/:id
 * Delete workflow template
 */
router.delete(
  '/workflow-templates/:id',
  param('id').isString().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const id = req.params.id as string;
      
      await configService.deleteWorkflowTemplate(id);
      
      const duration = Date.now() - startTime;
      logger.info(`DELETE /api/ai/config/workflow-templates/${id} - ${duration}ms`);
      
      res.json({
        meta: {
          duration,
          message: 'Workflow template deleted successfully',
        },
      });
    } catch (error) {
      logger.error('Error deleting workflow template:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

// ==================== COST BUDGETS ====================

/**
 * GET /api/ai/config/budgets/:agentId?
 * Get cost budget (global if agentId not provided)
 */
router.get(
  '/budgets/:agentId?',
  param('agentId').optional().isString(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const agentId = req.params.agentId;
      
      const budget = await configService.getCostBudget(agentId);
      
      if (!budget) {
        res.status(404).json({ error: 'Cost budget not found' });
      }
      
      const duration = Date.now() - startTime;
      logger.info(`GET /api/ai/config/budgets/${agentId || 'global'} - ${duration}ms`);
      
      res.json({
        data: budget,
        meta: {
          duration,
          cached: duration < 100,
        },
      });
    } catch (error) {
      logger.error('Error getting cost budget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/ai/config/budgets
 * Update cost budget
 */
router.put(
  '/budgets',
  body('id').isString().notEmpty(),
  body('agentId').optional().isString(),
  body('dailyLimit').optional().isFloat({ min: 0 }),
  body('weeklyLimit').optional().isFloat({ min: 0 }),
  body('monthlyLimit').optional().isFloat({ min: 0 }),
  body('alerts').optional().isArray(),
  body('enforceHardLimit').optional().isBoolean(),
  body('throttleAtPercent').optional().isFloat({ min: 0, max: 100 }),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const budget = await configService.updateCostBudget(req.body);
      
      const duration = Date.now() - startTime;
      logger.info(`PUT /api/ai/config/budgets - ${duration}ms`);
      
      res.json({
        data: budget,
        meta: {
          duration,
          message: 'Cost budget updated successfully. Limits enforced in real-time.',
        },
      });
    } catch (error) {
      logger.error('Error updating cost budget:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

/**
 * GET /api/ai/config/budgets/:agentId/check
 * Check if budget exceeded
 */
router.get(
  '/budgets/:agentId/check',
  param('agentId').isString().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const agentId = req.params.agentId as string;
      
      const exceeded = await configService.isBudgetExceeded(agentId);
      
      const duration = Date.now() - startTime;
      logger.info(`GET /api/ai/config/budgets/${agentId}/check - ${duration}ms`);
      
      res.json({
        data: {
          agentId,
          exceeded,
          timestamp: new Date(),
        },
        meta: {
          duration,
        },
      });
    } catch (error) {
      logger.error('Error checking budget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ==================== QUALITY THRESHOLDS ====================

/**
 * GET /api/ai/config/quality-thresholds/:id
 * Get quality threshold configuration
 */
router.get(
  '/quality-thresholds/:id',
  param('id').isString().notEmpty(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const id = req.params.id as string;
      
      const config = await configService.getQualityThresholdConfig(id);
      
      if (!config) {
        res.status(404).json({ error: 'Quality threshold configuration not found' });
      }
      
      const duration = Date.now() - startTime;
      logger.info(`GET /api/ai/config/quality-thresholds/${id} - ${duration}ms`);
      
      res.json({
        data: config,
        meta: {
          duration,
          cached: duration < 100,
        },
      });
    } catch (error) {
      logger.error('Error getting quality threshold config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/ai/config/quality-thresholds
 * Create or update quality threshold configuration
 */
router.put(
  '/quality-thresholds',
  body('id').isString().notEmpty(),
  body('stages').isObject(),
  body('contentType').optional().isString(),
  body('criteria').isObject(),
  body('isActive').isBoolean(),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      
      const config = await configService.upsertQualityThresholdConfig(req.body);
      
      const duration = Date.now() - startTime;
      logger.info(`PUT /api/ai/config/quality-thresholds - ${duration}ms`);
      
      res.json({
        data: config,
        meta: {
          duration,
          message: 'Quality threshold configuration updated successfully',
        },
      });
    } catch (error) {
      logger.error('Error upserting quality threshold config:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
);

// ==================== HEALTH CHECK ====================

/**
 * GET /api/ai/config/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const duration = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      service: 'ai-configuration',
      timestamp: new Date(),
      meta: {
        duration,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      service: 'ai-configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
