import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { dashboardService } from '../services/DashboardService';
import { ledgerService } from '../services/LedgerService';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.json({ data: stats });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'DASHBOARD_ERROR', message: error.message } });
  }
});

// GET /api/dashboard/revenue-by-type
router.get('/revenue-by-type', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await dashboardService.getRevenueByType();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'REVENUE_ERROR', message: error.message } });
  }
});

// GET /api/dashboard/monthly-revenue?year=2026
router.get('/monthly-revenue', async (req: AuthenticatedRequest, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await dashboardService.getMonthlyRevenue(year);
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'MONTHLY_ERROR', message: error.message } });
  }
});

// GET /api/dashboard/profit-loss?start=2026-01-01&end=2026-12-31
router.get('/profit-loss', async (req: AuthenticatedRequest, res) => {
  try {
    const start = req.query.start as string || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = req.query.end as string || new Date().toISOString();
    const data = await ledgerService.getProfitAndLoss(start, end);
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'PNL_ERROR', message: error.message } });
  }
});

// GET /api/dashboard/balance-sheet
router.get('/balance-sheet', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await ledgerService.getBalanceSheet();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'BALANCE_SHEET_ERROR', message: error.message } });
  }
});

// GET /api/dashboard/health
router.get('/health', async (req: AuthenticatedRequest, res) => {
  try {
    const health = await dashboardService.getSystemHealth();
    res.json({ data: health });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'HEALTH_ERROR', message: error.message } });
  }
});

export default router;
