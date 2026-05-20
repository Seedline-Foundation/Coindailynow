import { Router, Request, Response } from 'express';
import creatorEarningsService from '../../services/creatorEarningsService';

const router = Router();

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await creatorEarningsService.getCreatorProfile(userId);
    if (!profile) return res.status(404).json({ error: 'Creator profile not found' });

    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const period = req.query.period as string;
    const earnings = await creatorEarningsService.getCreatorEarnings(userId, period);
    if (!earnings) return res.status(404).json({ error: 'Creator not found' });

    res.json({ success: true, data: earnings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/apply', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await creatorEarningsService.applyForCreator({
      userId,
      ...req.body,
    });

    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/review/:creatorId', async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    const { decision, note, tier } = req.body;

    const result = await creatorEarningsService.reviewApplication(creatorId, decision, note, tier);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/process-earnings', async (req: Request, res: Response) => {
  try {
    const { periodStart, periodEnd } = req.body;
    const result = await creatorEarningsService.processTrendingEarnings(
      new Date(periodStart),
      new Date(periodEnd)
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
