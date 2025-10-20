/**
 * Security Alert API Routes
 * Task 84: Security Alert System
 */

import { Router, Request, Response } from 'express';
import securityAlertService from '../services/securityAlertService';

const router = Router();

// ============================================
// Security Alerts
// ============================================

// Get all security alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { category, severity, isDismissed, showOnHomepage, limit, offset } = req.query;
    
    const result = await securityAlertService.getSecurityAlerts({
      category: category as string,
      severity: severity as string,
      isDismissed: isDismissed === 'true',
      showOnHomepage: showOnHomepage === 'true',
      ...(limit && { limit: parseInt(limit as string) }),
      ...(offset && { offset: parseInt(offset as string) }),
    });

    res.json(result);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create security alert
router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const alert = await securityAlertService.createSecurityAlert(req.body);
    res.status(201).json(alert);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in POST /alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dismiss alert
router.patch('/alerts/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }
    const alert = await securityAlertService.dismissAlert(id, userId || 'system');
    res.json(alert);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in PATCH /alerts/:id/dismiss:', error);
    res.status(500).json({ error: error.message });
  }
});

// Take action on alert
router.patch('/alerts/:id/action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, actionDetails } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }
    const alert = await securityAlertService.takeActionOnAlert(
      id,
      userId || 'system',
      actionDetails
    );
    res.json(alert);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in PATCH /alerts/:id/action:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark alert as read
router.patch('/alerts/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }
    const alert = await securityAlertService.markAlertAsRead(id);
    res.json(alert);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in PATCH /alerts/:id/read:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Threat Logs
// ============================================

// Get threat logs
router.get('/threats', async (req: Request, res: Response) => {
  try {
    const { threatType, threatSource, wasBlocked, startDate, endDate, limit, offset } = req.query;
    
    const result = await securityAlertService.getThreatLogs({
      threatType: threatType as string,
      threatSource: threatSource as string,
      wasBlocked: wasBlocked === 'true',
      ...(startDate && { startDate: new Date(startDate as string) }),
      ...(endDate && { endDate: new Date(endDate as string) }),
      ...(limit && { limit: parseInt(limit as string) }),
      ...(offset && { offset: parseInt(offset as string) }),
    });

    res.json(result);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /threats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log new threat
router.post('/threats', async (req: Request, res: Response) => {
  try {
    const threat = await securityAlertService.logThreat(req.body);
    res.status(201).json(threat);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in POST /threats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Recommendations
// ============================================

// Get recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { category, priority, status, limit, offset } = req.query;
    
    const result = await securityAlertService.getRecommendations({
      category: category as string,
      priority: priority as string,
      status: status as string,
      ...(limit && { limit: parseInt(limit as string) }),
      ...(offset && { offset: parseInt(offset as string) }),
    });

    res.json(result);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create recommendation
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const recommendation = await securityAlertService.createRecommendation(req.body);
    res.status(201).json(recommendation);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in POST /recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update recommendation status
router.patch('/recommendations/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, userId, dismissReason } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Recommendation ID is required' });
    }
    const recommendation = await securityAlertService.updateRecommendationStatus(
      id,
      status,
      userId,
      dismissReason
    );
    res.json(recommendation);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in PATCH /recommendations/:id/status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Compliance Updates
// ============================================

// Get compliance updates
router.get('/compliance', async (req: Request, res: Response) => {
  try {
    const { complianceType, status, limit, offset } = req.query;
    
    const result = await securityAlertService.getComplianceUpdates({
      complianceType: complianceType as string,
      status: status as string,
      ...(limit && { limit: parseInt(limit as string) }),
      ...(offset && { offset: parseInt(offset as string) }),
    });

    res.json(result);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /compliance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create compliance update
router.post('/compliance', async (req: Request, res: Response) => {
  try {
    const update = await securityAlertService.createComplianceUpdate(req.body);
    res.status(201).json(update);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in POST /compliance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge compliance update
router.patch('/compliance/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Compliance update ID is required' });
    }
    const update = await securityAlertService.acknowledgeComplianceUpdate(
      id,
      userId || 'system'
    );
    res.json(update);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in PATCH /compliance/:id/acknowledge:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SEO Security Incidents
// ============================================

// Get SEO incidents
router.get('/seo-incidents', async (req: Request, res: Response) => {
  try {
    const { incidentType, severity, status, limit, offset } = req.query;
    
    const result = await securityAlertService.getSEOIncidents({
      incidentType: incidentType as string,
      severity: severity as string,
      status: status as string,
      ...(limit && { limit: parseInt(limit as string) }),
      ...(offset && { offset: parseInt(offset as string) }),
    });

    res.json(result);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /seo-incidents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create SEO incident
router.post('/seo-incidents', async (req: Request, res: Response) => {
  try {
    const incident = await securityAlertService.createSEOIncident(req.body);
    res.status(201).json(incident);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in POST /seo-incidents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update SEO incident status
router.patch('/seo-incidents/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolutionSteps, recoveryProgress } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'SEO incident ID is required' });
    }
    const incident = await securityAlertService.updateSEOIncidentStatus(
      id,
      status,
      resolutionSteps,
      recoveryProgress
    );
    res.json(incident);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in PATCH /seo-incidents/:id/status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Statistics & Analytics
// ============================================

// Get statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await securityAlertService.getSecurityStatistics();
    res.json(stats);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get alerts by category
router.get('/statistics/by-category', async (req: Request, res: Response) => {
  try {
    const data = await securityAlertService.getAlertsByCategory();
    res.json(data);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /statistics/by-category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get alerts by severity
router.get('/statistics/by-severity', async (req: Request, res: Response) => {
  try {
    const data = await securityAlertService.getAlertsBySeverity();
    res.json(data);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /statistics/by-severity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get threat trends
router.get('/statistics/threat-trends', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const data = await securityAlertService.getThreatTrends(
      days ? parseInt(days as string) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('[SecurityAlert] Error in GET /statistics/threat-trends:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
