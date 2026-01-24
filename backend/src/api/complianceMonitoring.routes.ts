/**
 * Compliance Monitoring API Routes
 * Task 85: Compliance Monitoring Dashboard
 */

import express from 'express';
import complianceService from '../services/complianceMonitoringService';

const router = express.Router();

// ============================================
// Compliance Rules Routes
// ============================================

// Create compliance rule
router.post('/rules', async (req, res) => {
  try {
    const result = await complianceService.createComplianceRule(req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance rules
router.get('/rules', async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.ruleType) filters.ruleType = req.query.ruleType;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const result = await complianceService.getComplianceRules(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update compliance rule
router.put('/rules/:id', async (req, res) => {
  try {
    const result = await complianceService.updateComplianceRule(req.params.id, req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Compliance Checks Routes
// ============================================

// Create compliance check
router.post('/checks', async (req, res) => {
  try {
    const result = await complianceService.createComplianceCheck(req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance checks
router.get('/checks', async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.ruleId) filters.ruleId = req.query.ruleId as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
    if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

    const result = await complianceService.getComplianceChecks(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve compliance check
router.post('/checks/:id/resolve', async (req, res) => {
  try {
    const { resolvedBy } = req.body;
    const result = await complianceService.resolveComplianceCheck(req.params.id, resolvedBy);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SEO Compliance Rules Routes
// ============================================

// Create SEO compliance rule
router.post('/seo-rules', async (req, res) => {
  try {
    const result = await complianceService.createSEOComplianceRule(req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get SEO compliance rules
router.get('/seo-rules', async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.guidelineType) filters.guidelineType = req.query.guidelineType;
    if (req.query.eeatComponent) filters.eeatComponent = req.query.eeatComponent;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const result = await complianceService.getSEOComplianceRules(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update SEO compliance rule
router.put('/seo-rules/:id', async (req, res) => {
  try {
    const result = await complianceService.updateSEOComplianceRule(req.params.id, req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SEO Compliance Checks Routes
// ============================================

// Create SEO compliance check
router.post('/seo-checks', async (req, res) => {
  try {
    const result = await complianceService.createSEOComplianceCheck(req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get SEO compliance checks
router.get('/seo-checks', async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.ruleId) filters.ruleId = req.query.ruleId as string;
    if (req.query.contentId) filters.contentId = req.query.contentId as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
    if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

    const result = await complianceService.getSEOComplianceChecks(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve SEO compliance check
router.post('/seo-checks/:id/resolve', async (req, res) => {
  try {
    const result = await complianceService.resolveSEOComplianceCheck(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Compliance Scoring Routes
// ============================================

// Calculate compliance score
router.post('/scores/calculate', async (req, res) => {
  try {
    const result = await complianceService.calculateComplianceScore();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get compliance scores
router.get('/scores', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await complianceService.getComplianceScores(fromDate);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest compliance score
router.get('/scores/latest', async (req, res) => {
  try {
    const result = await complianceService.getLatestComplianceScore();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Notifications Routes
// ============================================

// Create notification
router.post('/notifications', async (req, res) => {
  try {
    const result = await complianceService.createComplianceNotification(req.body);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.recipientUserId) filters.recipientUserId = req.query.recipientUserId;
    if (req.query.isRead !== undefined) filters.isRead = req.query.isRead === 'true';
    if (req.query.priority) filters.priority = req.query.priority;

    const result = await complianceService.getComplianceNotifications(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    const result = await complianceService.markNotificationAsRead(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dismiss notification
router.post('/notifications/:id/dismiss', async (req, res) => {
  try {
    const result = await complianceService.dismissNotification(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Statistics & Metrics Routes
// ============================================

// Get compliance statistics
router.get('/statistics', async (req, res) => {
  try {
    const result = await complianceService.getComplianceStatistics();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update metrics
router.post('/metrics/update', async (req, res) => {
  try {
    const result = await complianceService.updateComplianceMetrics();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Automation Routes
// ============================================

// Run automated compliance checks
router.post('/automation/run-checks', async (req, res) => {
  try {
    const result = await complianceService.runAutomatedComplianceChecks();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
