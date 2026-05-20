import { Router, Request, Response } from 'express';
import aiCostTrackingService from '../../services/aiCostTrackingService';

const router = Router();

router.post('/track', async (req: Request, res: Response) => {
  try {
    const record = await aiCostTrackingService.trackCost(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overview = await aiCostTrackingService.getCostOverview({
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      agentName: req.query.agentName as string,
      groupBy: req.query.groupBy as any,
    });
    res.json({ success: true, data: overview });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/budgets', async (req: Request, res: Response) => {
  try {
    const budgets = await aiCostTrackingService.getBudgetStatus(req.query.budgetId as string);
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/budgets', async (req: Request, res: Response) => {
  try {
    const budget = await aiCostTrackingService.createBudget(req.body);
    res.status(201).json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/per-article', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await aiCostTrackingService.getCostPerArticle(limit);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const forecast = await aiCostTrackingService.forecastCosts(days);
    res.json({ success: true, data: forecast });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
