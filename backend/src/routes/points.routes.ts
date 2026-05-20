/**
 * Points-to-Token Bridge API Routes (W5)
 *
 * POST /api/v1/points/convert     — request conversion (auth required)
 * GET  /api/v1/points/rate        — get current conversion rate (public)
 * GET  /api/v1/points/conversions — list user's past conversions (auth required)
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { pointsTokenBridge } from '../services/pointsTokenBridge';

const router = Router();

/**
 * GET /rate — current points-to-JOY conversion rate.
 */
router.get('/rate', async (_req: Request, res: Response) => {
  try {
    const rate = await pointsTokenBridge.getConversionRate();
    res.json({ success: true, data: rate });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /convert — request a points → JOY conversion.
 * Body: { pointsAmount: number }
 * Rate limited to 1 conversion per hour per user (enforced in the service).
 */
router.post('/convert', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { pointsAmount } = req.body;
    if (!pointsAmount || typeof pointsAmount !== 'number' || pointsAmount <= 0) {
      res.status(400).json({ success: false, error: 'pointsAmount must be a positive number' });
      return;
    }

    const conversion = await pointsTokenBridge.requestConversion(req.user!.id, pointsAmount);

    // Auto-process (in production this would be queued)
    const processed = await pointsTokenBridge.processConversion(conversion.id);

    res.json({ success: true, data: processed });
  } catch (e: any) {
    const status = e.message.includes('Rate limited') ? 429
      : e.message.includes('Insufficient') ? 400
      : e.message.includes('paused') ? 503
      : e.message.includes('Minimum') ? 400
      : 500;
    res.status(status).json({ success: false, error: e.message });
  }
});

/**
 * GET /conversions — list past conversions for the authenticated user.
 * Query: ?limit=50&offset=0
 */
router.get('/conversions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const conversions = await pointsTokenBridge.getConversionHistory(req.user!.id, limit, offset);
    res.json({ success: true, data: conversions });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
