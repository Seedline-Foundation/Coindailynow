// SEO Automation Routes - Task 63
// API endpoints for automated SEO monitoring and optimization

import { Router, Request, Response } from 'express';
import SEOAutomationService, { AutomationConfig } from '../services/seoAutomationService';
import { authMiddleware, requireRole } from '../middleware/auth';

// Helper to create super admin role checker
const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

const router = Router();

// Initialize service with configuration
let automationService: SEOAutomationService | null = null;

const getAutomationService = (): SEOAutomationService => {
  if (!automationService) {
    const config: AutomationConfig = {
      googleSearchConsole: {
        enabled: process.env.GSC_ENABLED === 'true',
        apiKey: process.env.GSC_API_KEY || '',
        siteUrl: process.env.SITE_URL || 'https://coindaily.com',
      },
      ahrefs: {
        enabled: process.env.AHREFS_ENABLED === 'true',
        apiKey: process.env.AHREFS_API_KEY || '',
      },
      semrush: {
        enabled: process.env.SEMRUSH_ENABLED === 'true',
        apiKey: process.env.SEMRUSH_API_KEY || '',
      },
      monitoring: {
        rankTracking: true,
        brokenLinks: true,
        internalLinks: true,
        schemaValidation: true,
      },
      schedules: {
        rankTracking: '0 */6 * * *', // Every 6 hours
        brokenLinkCheck: '0 2 * * *', // Daily at 2 AM
        schemaAudit: '0 3 * * *', // Daily at 3 AM
        internalLinkReflow: '0 4 * * 0', // Weekly on Sunday at 4 AM
      },
    };

    automationService = new SEOAutomationService(config);
  }

  return automationService;
};

// ============= AUTOMATION ENDPOINTS =============

/**
 * POST /api/seo-automation/run
 * Run SEO automation tasks
 * Requires: Super Admin
 */
router.post('/run', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { type = 'all' } = req.body;
    
    if (!['all', 'ranking', 'links', 'internal-links', 'schema'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid automation type',
        validTypes: ['all', 'ranking', 'links', 'internal-links', 'schema'],
      });
    }

    const service = getAutomationService();
    const results = await service.runAutomation(type as any);

    return res.json({
      success: true,
      type,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error running SEO automation:', error);
    return res.status(500).json({
      error: 'Failed to run SEO automation',
      message: error.message,
    });
  }
});

/**
 * GET /api/seo-automation/stats
 * Get automation statistics
 * Requires: Authentication
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const service = getAutomationService();
    const stats = await service.getAutomationStats();

    return res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting automation stats:', error);
    return res.status(500).json({
      error: 'Failed to get automation stats',
      message: error.message,
    });
  }
});

/**
 * POST /api/seo-automation/broken-links/fix
 * Fix a broken link by creating a redirect
 * Requires: Super Admin
 */
router.post('/broken-links/fix', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { issueId, redirectUrl } = req.body;

    if (!issueId || !redirectUrl) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['issueId', 'redirectUrl'],
      });
    }

    const service = getAutomationService();
    const success = await service['linkMonitor'].fixBrokenLink(issueId, redirectUrl);

    if (!success) {
      return res.status(404).json({
        error: 'Issue not found or could not be fixed',
      });
    }

    return res.json({
      success: true,
      message: 'Redirect created successfully',
    });
  } catch (error: any) {
    console.error('Error fixing broken link:', error);
    return res.status(500).json({
      error: 'Failed to fix broken link',
      message: error.message,
    });
  }
});

/**
 * POST /api/seo-automation/internal-links/implement
 * Implement an internal link suggestion
 * Requires: Super Admin
 */
router.post('/internal-links/implement', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { suggestionId } = req.body;

    if (!suggestionId) {
      return res.status(400).json({
        error: 'Missing suggestionId',
      });
    }

    const service = getAutomationService();
    const success = await service['linkOptimizer'].implementSuggestion(suggestionId);

    if (!success) {
      return res.status(404).json({
        error: 'Suggestion not found',
      });
    }

    return res.json({
      success: true,
      message: 'Link suggestion implemented',
    });
  } catch (error: any) {
    console.error('Error implementing link suggestion:', error);
    return res.status(500).json({
      error: 'Failed to implement link suggestion',
      message: error.message,
    });
  }
});

/**
 * GET /api/seo-automation/config
 * Get current automation configuration
 * Requires: Super Admin
 */
router.get('/config', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const service = getAutomationService();
    const config = (service as any).config;

    return res.json({
      success: true,
      config: {
        ...config,
        // Hide sensitive API keys
        googleSearchConsole: {
          ...config.googleSearchConsole,
          apiKey: config.googleSearchConsole.apiKey ? '***' : null,
        },
        ahrefs: {
          ...config.ahrefs,
          apiKey: config.ahrefs.apiKey ? '***' : null,
        },
        semrush: {
          ...config.semrush,
          apiKey: config.semrush.apiKey ? '***' : null,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting automation config:', error);
    return res.status(500).json({
      error: 'Failed to get automation config',
      message: error.message,
    });
  }
});

/**
 * PUT /api/seo-automation/config
 * Update automation configuration
 * Requires: Super Admin
 */
router.put('/config', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing config object',
      });
    }

    // Create new service instance with updated config
    automationService = new SEOAutomationService(config);

    return res.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating automation config:', error);
    return res.status(500).json({
      error: 'Failed to update automation config',
      message: error.message,
    });
  }
});

/**
 * GET /api/seo-automation/health
 * Check automation service health
 * Public endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const service = getAutomationService();
    const config = (service as any).config;

    return res.json({
      success: true,
      health: {
        status: 'operational',
        integrations: {
          googleSearchConsole: config.googleSearchConsole.enabled,
          ahrefs: config.ahrefs.enabled,
          semrush: config.semrush.enabled,
        },
        monitoring: config.monitoring,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error checking health:', error);
    return res.status(500).json({
      error: 'Health check failed',
      message: error.message,
    });
  }
});

export default router;
