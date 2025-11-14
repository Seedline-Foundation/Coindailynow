/**
 * Admin Fraud Alert Routes
 * 
 * REST API endpoints for admin fraud alert management.
 * Provides real-time alert streaming, statistics, and resolution actions.
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../../../middleware/auth';
import { redisClient } from '../../../config/redis';

const router = express.Router();
const prisma = new PrismaClient();

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/admin/fraud-alerts
 * Get all fraud alerts with filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      severity,
      resolved,
      alertType,
      page = '1',
      limit = '50',
    } = req.query;

    const where: any = {};

    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    if (resolved === 'RESOLVED') {
      where.resolved = true;
    } else if (resolved === 'UNRESOLVED') {
      where.resolved = false;
    }

    if (alertType && alertType !== 'ALL') {
      where.alertType = alertType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [alerts, total] = await Promise.all([
      prisma.fraudAlert.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              username: true,
            },
          },
          wallet: {
            select: {
              walletAddress: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.fraudAlert.count({ where }),
    ]);

    return res.json({
      success: true,
      alerts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch fraud alerts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fraud alerts',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/fraud-alerts/stats
 * Get fraud alert statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalAlerts,
      criticalAlerts,
      resolvedAlerts,
      walletsAutoFrozen,
      alertsByType,
      alertsBySeverity,
      avgFraudScore,
    ] = await Promise.all([
      prisma.fraudAlert.count(),
      prisma.fraudAlert.count({ where: { severity: 'CRITICAL' } }),
      prisma.fraudAlert.count({ where: { resolved: true } }),
      prisma.fraudAlert.count({ where: { autoFrozen: true } }),
      prisma.fraudAlert.groupBy({
        by: ['alertType'],
        _count: true,
      }),
      prisma.fraudAlert.groupBy({
        by: ['severity'],
        _count: true,
      }),
      prisma.fraudAlert.aggregate({
        _avg: {
          fraudScore: true,
        },
      }),
    ]);

    const alertsByTypeMap: Record<string, number> = {};
    alertsByType.forEach((item) => {
      alertsByTypeMap[item.alertType] = item._count;
    });

    const alertsBySeverityMap: Record<string, number> = {};
    alertsBySeverity.forEach((item) => {
      alertsBySeverityMap[item.severity] = item._count;
    });

    return res.json({
      success: true,
      totalAlerts,
      criticalAlerts,
      resolvedAlerts,
      walletsAutoFrozen,
      averageFraudScore: avgFraudScore._avg.fraudScore || 0,
      alertsByType: alertsByTypeMap,
      alertsBySeverity: alertsBySeverityMap,
    });
  } catch (error: any) {
    console.error('Failed to fetch fraud stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fraud statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/fraud-alerts/stream
 * Server-Sent Events endpoint for real-time fraud alerts
 */
router.get('/stream', async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Subscribe to Redis fraud alerts channel
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.subscribe('fraud:alerts', (message) => {
    try {
      const alert = JSON.parse(message);
      res.write(`data: ${JSON.stringify(alert)}\n\n`);
    } catch (error) {
      console.error('Failed to parse fraud alert message:', error);
    }
  });

  // Clean up on client disconnect
  req.on('close', async () => {
    await subscriber.unsubscribe('fraud:alerts');
    await subscriber.quit();
    res.end();
  });
});

/**
 * GET /api/admin/fraud-alerts/:id
 * Get a specific fraud alert by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID is required',
      });
    }

    const alert = await prisma.fraudAlert.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        wallet: {
          select: {
            id: true,
            walletAddress: true,
            status: true,
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Fraud alert not found',
      });
    }

    return res.json({
      success: true,
      alert,
    });
  } catch (error: any) {
    console.error('Failed to fetch fraud alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fraud alert',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/fraud-alerts/:id/resolve
 * Resolve a fraud alert
 */
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = (req as any).user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID is required',
      });
    }

    if (!resolution) {
      return res.status(400).json({
        success: false,
        error: 'Resolution notes are required',
      });
    }

    const alert = await prisma.fraudAlert.update({
      where: { id },
      data: {
        resolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution,
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        type: 'FRAUD_ALERT',
        action: 'RESOLVED',
        userId: adminId,
        resource: 'FraudAlert',
        details: JSON.stringify({
          alertId: id,
          resolution,
        }),
        severity: 'low',
        category: 'fraud_detection',
      },
    });

    return res.json({
      success: true,
      alert,
    });
  } catch (error: any) {
    console.error('Failed to resolve fraud alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve fraud alert',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/wallets/:walletId/freeze
 * Manually freeze a wallet
 */
router.post('/wallets/:walletId/freeze', async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    if (!walletId) {
      return res.status(400).json({
        success: false,
        error: 'Wallet ID is required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Freeze reason is required',
      });
    }

    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        status: 'FROZEN',
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        type: 'WALLET',
        action: 'FROZEN',
        userId: adminId,
        resource: 'Wallet',
        details: JSON.stringify({
          walletId,
          reason,
        }),
        severity: 'high',
        category: 'security',
      },
    });

    // Publish notification
    await redisClient.publish(
      'wallet:status',
      JSON.stringify({
        type: 'WALLET_FROZEN',
        walletId,
        reason,
        timestamp: new Date(),
      })
    );

    return res.json({
      success: true,
      wallet,
    });
  } catch (error: any) {
    console.error('Failed to freeze wallet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to freeze wallet',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/wallets/:walletId/unfreeze
 * Unfreeze a wallet
 */
router.post('/wallets/:walletId/unfreeze', async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    const adminId = (req as any).user.id;

    if (!walletId) {
      return res.status(400).json({
        success: false,
        error: 'Wallet ID is required',
      });
    }

    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        status: 'ACTIVE',
      },
    });

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        type: 'WALLET',
        action: 'UNFROZEN',
        userId: adminId,
        resource: 'Wallet',
        details: JSON.stringify({
          walletId,
        }),
        severity: 'low',
        category: 'security',
      },
    });

    // Publish notification
    await redisClient.publish(
      'wallet:status',
      JSON.stringify({
        type: 'WALLET_UNFROZEN',
        walletId,
        timestamp: new Date(),
      })
    );

    return res.json({
      success: true,
      wallet,
    });
  } catch (error: any) {
    console.error('Failed to unfreeze wallet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unfreeze wallet',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/fraud-alerts/export
 * Export fraud alerts to CSV
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const alerts = await prisma.fraudAlert.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
        wallet: {
          select: {
            walletAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV
    const csv = [
      'ID,Type,Severity,Fraud Score,User,Wallet,Auto-Frozen,Resolved,Created At',
      ...alerts.map((alert) =>
        [
          alert.id,
          alert.alertType,
          alert.severity,
          alert.fraudScore,
          alert.user.username,
          alert.wallet.walletAddress,
          alert.autoFrozen,
          alert.resolved,
          alert.createdAt.toISOString(),
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fraud-alerts.csv');
    return res.send(csv);
  } catch (error: any) {
    console.error('Failed to export fraud alerts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export fraud alerts',
      message: error.message,
    });
  }
});

export default router;
