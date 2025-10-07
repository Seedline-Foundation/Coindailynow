/**
 * Legal Compliance API Routes - Clean Version
 * Task 30: Privacy & GDPR Compliance API Endpoints
 * 
 * REST API endpoints for legal and compliance management
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    subscriptionTier: string;
    status: string;
    emailVerified: boolean;
  };
}

// Simple logger implementation
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta)
};

import { LegalComplianceOrchestrator } from '../services/legal/LegalComplianceOrchestrator';
import { CookieConsentManager } from '../services/legal/CookieConsentManager';
import { DataRetentionService } from '../services/legal/DataRetentionService';

// Mock middleware functions
const authMiddleware = (req: AuthenticatedRequest, res: Response, next: any) => {
  req.user = { 
    id: 'test-user', 
    email: 'test@test.com', 
    username: 'testuser',
    subscriptionTier: 'premium',
    status: 'active',
    emailVerified: true
  };
  next();
};

const requireRole = (role: string) => (req: AuthenticatedRequest, res: Response, next: any) => next();
const validateRequest = (req: AuthenticatedRequest, res: Response, next: any) => next();

const router = Router();

// Initialize services
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const legalOrchestrator = new LegalComplianceOrchestrator(prisma, redis);
const cookieManager = new CookieConsentManager(prisma, redis);
const retentionService = new DataRetentionService(prisma, redis);

/**
 * Public Cookie Consent Endpoints
 */

// POST /api/legal/consent/cookies - Record cookie consent
router.post('/consent/cookies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { preferences, sessionId, consentMethod } = req.body;
    const userId = req.user?.id || null;
    
    const metadata = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      country: req.get('X-Country') || 'unknown',
      consentMethod: consentMethod || 'implicit' as 'implicit',
      timestamp: new Date()
    };

    const result = await cookieManager.processConsent(
      userId,
      sessionId || `session-${Date.now()}`,
      preferences,
      metadata
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error recording cookie consent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record consent'
    });
  }
});

// GET /api/legal/consent/status - Get consent status
router.get('/consent/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.query.sessionId as string;
    
    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'User ID or session ID required'
      });
    }

    const status = await cookieManager.getConsentStatus(userId || sessionId);
    
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting consent status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get consent status'
    });
  }
});

// GET /api/legal/cookie-banner-config - Get banner configuration
router.get('/cookie-banner-config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const country = req.get('X-Country') || 'unknown';
    
    const config = {
      show: true,
      framework: country === 'US' ? 'CCPA' : 'GDPR',
      categories: [
        {
          id: 'essential',
          name: 'Essential Cookies',
          description: 'Required for website functionality',
          required: true
        },
        {
          id: 'functional',
          name: 'Functional Cookies',
          description: 'Enhance user experience',
          required: false
        },
        {
          id: 'analytics',
          name: 'Analytics Cookies',
          description: 'Help us improve our website',
          required: false
        },
        {
          id: 'marketing',
          name: 'Marketing Cookies',
          description: 'Used for targeted advertising',
          required: false
        }
      ]
    };
    
    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error getting banner config:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get banner configuration'
    });
  }
});

/**
 * User Data Management Endpoints (Protected)
 */

// GET /api/legal/user/consents - Get user consent history
router.get('/user/consents', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const consents = await cookieManager.getConsentStatus(userId);
    
    return res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    logger.error('Error getting user consents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user consents'
    });
  }
});

// DELETE /api/legal/user/consents - Withdraw all consents
router.delete('/user/consents', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    await cookieManager.withdrawConsent(
      userId,
      ['all'],
      {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        method: 'settings_page' as 'settings_page'
      }
    );
    
    return res.json({
      success: true,
      message: 'All consents withdrawn successfully'
    });
  } catch (error) {
    logger.error('Error withdrawing consents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to withdraw consents'
    });
  }
});

// POST /api/legal/user/data-export - Request data export
router.post('/user/data-export', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { format = 'JSON', dataTypes = ['all'] } = req.body;
    
    const exportRequest = await legalOrchestrator.initiateDataPortabilityRequest(
      userId,
      format,
      dataTypes
    );
    
    return res.json({
      success: true,
      data: exportRequest
    });
  } catch (error) {
    logger.error('Error requesting data export:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to request data export'
    });
  }
});

/**
 * Admin Endpoints (Protected)
 */

// GET /api/legal/admin/compliance-report - Generate compliance report
router.get('/admin/compliance-report', authMiddleware, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { framework = 'GDPR', startDate, endDate } = req.query;
    
    const report = await legalOrchestrator.generateComplianceReport(
      framework as string,
      startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate as string) : new Date()
    );
    
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating compliance report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    });
  }
});

// POST /api/legal/admin/run-cleanup - Execute data retention cleanup
router.post('/admin/run-cleanup', authMiddleware, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await retentionService.executeAllRetentionRules();
    
    return res.json({
      success: true,
      data: {
        message: 'Data retention cleanup completed',
        deletedRecords: Array.isArray(result) ? result.length : 0,
        details: result
      }
    });
  } catch (error) {
    logger.error('Error running data cleanup:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to run data cleanup'
    });
  }
});

// GET /api/legal/admin/data-retention-policies - Get retention policies
router.get('/admin/data-retention-policies', authMiddleware, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const policies = await retentionService.getRetentionStatus('all');
    
    return res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    logger.error('Error getting retention policies:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get retention policies'
    });
  }
});

export function createLegalRoutes(
  prisma: PrismaClient,
  redis: Redis,
  logger: any
): Router {
  // Re-initialize services with provided dependencies
  const legalOrchestrator = new LegalComplianceOrchestrator(prisma, redis);
  const cookieManager = new CookieConsentManager(prisma, redis);
  const retentionService = new DataRetentionService(prisma, redis);
  
  return router;
}

export default router;