/**
 * Workflow Orchestration API Routes - Task 69
 * RESTful endpoints for automation workflows, alerts, version control, and API orchestration
 */

import { Router, Request, Response } from 'express';
import * as orchestrationService from '../services/workflowOrchestrationService';

const router = Router();

// ===================================
// WORKFLOW MANAGEMENT ROUTES
// ===================================

// Create workflow
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const workflow = await orchestrationService.createWorkflow(req.body);
    res.json({ success: true, workflow });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update workflow
router.put('/workflows/:id', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Workflow ID is required' });
    }
    const workflow = await orchestrationService.updateWorkflow(req.params.id, req.body);
    return res.json({ success: true, workflow });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete workflow
router.delete('/workflows/:id', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Workflow ID is required' });
    }
    await orchestrationService.deleteWorkflow(req.params.id);
    return res.json({ success: true, message: 'Workflow deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// List workflows
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      workflowType: req.query.workflowType as string,
      isActive: req.query.isActive === 'true',
      createdBy: req.query.createdBy as string,
      search: req.query.search as string,
    };
    const workflows = await orchestrationService.listWorkflows(filters);
    res.json({ success: true, workflows, count: workflows.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get workflow by ID
router.get('/workflows/:id', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Workflow ID is required' });
    }
    const workflow = await orchestrationService.getWorkflowById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    return res.json({ success: true, workflow });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Execute workflow
router.post('/workflows/:id/execute', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Workflow ID is required' });
    }
    const execution = await orchestrationService.executeWorkflow(
      req.params.id,
      req.body.triggerType || 'manual',
      req.body.triggerData
    );
    return res.json({ success: true, execution });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get workflow stats
router.get('/workflows/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await orchestrationService.getWorkflowStats(req.params.id);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// ALERT ROUTES
// ===================================

// Create alert
router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const alert = await orchestrationService.createAlert(req.body);
    res.json({ success: true, alert });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// VERSION CONTROL ROUTES
// ===================================

// Create content version
router.post('/versions', async (req: Request, res: Response) => {
  try {
    const version = await orchestrationService.createContentVersion(req.body);
    res.json({ success: true, version });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get version history
router.get('/versions/:articleId', async (req: Request, res: Response) => {
  try {
    if (!req.params.articleId) {
      return res.status(400).json({ success: false, error: 'Article ID is required' });
    }
    const history = await orchestrationService.getVersionHistory(req.params.articleId);
    return res.json({ success: true, history, count: history.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Revert to version
router.post('/versions/:articleId/revert', async (req: Request, res: Response) => {
  try {
    if (!req.params.articleId) {
      return res.status(400).json({ success: false, error: 'Article ID is required' });
    }
    const { versionNumber, userId } = req.body;
    const article = await orchestrationService.revertToVersion(
      req.params.articleId,
      versionNumber,
      userId
    );
    return res.json({ success: true, article });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// API ORCHESTRATION ROUTES
// ===================================

// Create orchestration
router.post('/orchestrations', async (req: Request, res: Response) => {
  try {
    const orchestration = await orchestrationService.createOrchestration(req.body);
    res.json({ success: true, orchestration });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute orchestration
router.post('/orchestrations/:id/execute', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Orchestration ID is required' });
    }
    const result = await orchestrationService.executeOrchestration(
      req.params.id,
      req.body.context
    );
    return res.json({ success: true, result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// INTEGRATION CONNECTION ROUTES
// ===================================

// Create connection
router.post('/connections', async (req: Request, res: Response) => {
  try {
    const connection = await orchestrationService.createConnection(req.body);
    res.json({ success: true, connection });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify connection
router.post('/connections/:id/verify', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Connection ID is required' });
    }
    const isVerified = await orchestrationService.verifyConnection(req.params.id);
    return res.json({ success: true, isVerified });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// ANALYTICS ROUTES
// ===================================

// Get overall stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await orchestrationService.getWorkflowStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
