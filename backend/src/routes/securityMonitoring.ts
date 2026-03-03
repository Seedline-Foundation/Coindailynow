/**
 * Security Monitoring API Routes
 *
 * Provides endpoints for the super-admin dashboard (jet.coindaily.online)
 * to access security reports, service health, and threat data.
 *
 * All routes require SUPER_ADMIN authentication.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getSecurityMonitoringAgent } from '../agents/SecurityMonitoringAgent';

const router = Router();

// Middleware: require SUPER_ADMIN role
const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Super admin access required' }
    });
  }
  next();
};

export function createSecurityMonitoringRoutes(prisma: PrismaClient): Router {
  const agent = getSecurityMonitoringAgent(prisma);

  /**
   * GET /api/security-monitoring/health
   * Current health status of all monitored services
   */
  router.get('/health', requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const health = await agent.getServiceHealth();
      res.json({
        data: health,
        cache: { expires_at: new Date(Date.now() + 30_000), hit: false }
      });
    } catch (error: any) {
      res.status(500).json({
        error: { code: 'HEALTH_CHECK_FAILED', message: error.message }
      });
    }
  });

  /**
   * GET /api/security-monitoring/threats
   * Recent security threats
   */
  router.get('/threats', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const threats = agent.getRecentThreats(limit);
      res.json({
        data: threats,
        total: threats.length
      });
    } catch (error: any) {
      res.status(500).json({
        error: { code: 'THREATS_FETCH_FAILED', message: error.message }
      });
    }
  });

  /**
   * POST /api/security-monitoring/threats/:id/resolve
   * Mark a threat as resolved
   */
  router.post('/threats/:id/resolve', requireSuperAdmin, (req: Request, res: Response) => {
    try {
      const resolved = agent.resolveThreat(req.params.id);
      if (resolved) {
        res.json({ data: { resolved: true } });
      } else {
        res.status(404).json({
          error: { code: 'THREAT_NOT_FOUND', message: 'Threat not found' }
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: { code: 'RESOLVE_FAILED', message: error.message }
      });
    }
  });

  /**
   * GET /api/security-monitoring/report
   * Get the latest monitoring report
   */
  router.get('/report', requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const report = await agent.getLatestReport();
      if (report) {
        res.json({ data: report });
      } else {
        res.status(404).json({
          error: { code: 'NO_REPORT', message: 'No report available yet' }
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: { code: 'REPORT_FETCH_FAILED', message: error.message }
      });
    }
  });

  /**
   * POST /api/security-monitoring/report/generate
   * Trigger an on-demand report
   */
  router.post('/report/generate', requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const report = await agent.generateOnDemandReport();
      res.json({ data: report });
    } catch (error: any) {
      res.status(500).json({
        error: { code: 'REPORT_GENERATION_FAILED', message: error.message }
      });
    }
  });

  /**
   * GET /api/security-monitoring/status
   * Quick status overview for the dashboard
   */
  router.get('/status', requireSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const health = await agent.getServiceHealth();
      const threats = agent.getRecentThreats(100);
      const unresolvedThreats = threats.filter(t => !t.resolved);
      const criticalThreats = unresolvedThreats.filter(
        t => t.severity === 'critical' || t.severity === 'high'
      );

      const healthyCount = health.filter(s => s.status === 'healthy').length;
      const degradedCount = health.filter(s => s.status === 'degraded').length;
      const downCount = health.filter(s => s.status === 'down').length;

      res.json({
        data: {
          services: {
            total: health.length,
            healthy: healthyCount,
            degraded: degradedCount,
            down: downCount,
          },
          threats: {
            total: unresolvedThreats.length,
            critical: criticalThreats.length,
            categories: Object.fromEntries(
              [...new Set(unresolvedThreats.map(t => t.category))].map(cat => [
                cat,
                unresolvedThreats.filter(t => t.category === cat).length
              ])
            ),
          },
          lastCheck: health[0]?.lastChecked || null,
          overallStatus: downCount > 0 ? 'critical' : degradedCount > 0 ? 'warning' : 'healthy',
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: { code: 'STATUS_FAILED', message: error.message }
      });
    }
  });

  return router;
}

export default createSecurityMonitoringRoutes;
