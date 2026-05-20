import { Router, Request, Response } from 'express';
import eventsService from '../../services/eventsIntelligenceService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const options = {
      country: req.query.country as string,
      category: req.query.category as string,
      eventType: req.query.eventType as string,
      format: req.query.format as string,
      status: (req.query.status as string) || 'APPROVED',
      startAfter: req.query.startAfter ? new Date(req.query.startAfter as string) : undefined,
      startBefore: req.query.startBefore ? new Date(req.query.startBefore as string) : undefined,
      isFeatured: req.query.featured === 'true' ? true : undefined,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await eventsService.listEvents(options);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/calendar', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    const events = await eventsService.getEventsCalendar(year, month);
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await eventsService.getEventStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/speakers', async (req: Request, res: Response) => {
  try {
    const result = await eventsService.listSpeakers({
      country: req.query.country as string,
      expertise: req.query.expertise as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const event = await eventsService.getEvent(req.params.idOrSlug);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const event = await eventsService.submitEvent(req.body, 'USER', userId);
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/moderate', async (req: Request, res: Response) => {
  try {
    const moderatorId = (req as any).user?.id;
    const { decision, relevanceScore } = req.body;
    const event = await eventsService.moderateEvent(req.params.id, decision, moderatorId, relevanceScore);
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/promote', async (req: Request, res: Response) => {
  try {
    const { promotionType, cpCost } = req.body;
    const promotion = await eventsService.purchasePromotion(req.params.id, promotionType, cpCost);
    res.json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
