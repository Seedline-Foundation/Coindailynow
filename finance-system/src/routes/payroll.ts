import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { payrollService } from '../services/PayrollService';

const router = Router();

// GET /api/payroll/schedules
router.get('/schedules', async (req: AuthenticatedRequest, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const schedules = await payrollService.getSchedules(activeOnly);
    res.json({ data: schedules });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SCHEDULE_LIST_ERROR', message: error.message } });
  }
});

// POST /api/payroll/schedules
router.post('/schedules', async (req: AuthenticatedRequest, res) => {
  try {
    const { staffWalletId, staffName, monthlyAmount, currency, payDayOfMonth } = req.body;
    if (!staffWalletId || !staffName || !monthlyAmount || !payDayOfMonth) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'staffWalletId, staffName, monthlyAmount, payDayOfMonth required' } });
      return;
    }
    const schedule = await payrollService.createSchedule({
      staffWalletId, staffName, monthlyAmount,
      currency: currency || 'JY',
      payDayOfMonth,
      createdBy: `admin:${req.admin?.email || 'SUPER_ADMIN'}`
    });
    res.status(201).json({ data: schedule });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'SCHEDULE_ERROR', message: error.message } });
  }
});

// PUT /api/payroll/schedules/:id
router.put('/schedules/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { monthlyAmount, payDayOfMonth, isActive } = req.body;
    const schedule = await payrollService.updateSchedule(
      req.params.id,
      { monthlyAmount, payDayOfMonth, isActive },
      `admin:${req.admin?.email || 'SUPER_ADMIN'}`
    );
    res.json({ data: schedule });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'UPDATE_ERROR', message: error.message } });
  }
});

// POST /api/payroll/process — Run monthly payroll (cron)
router.post('/process', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await payrollService.processMonthlyPayroll();
    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'PAYROLL_ERROR', message: error.message } });
  }
});

// GET /api/payroll/history
router.get('/history', async (req: AuthenticatedRequest, res) => {
  try {
    const staffWalletId = req.query.staffWalletId as string;
    const history = await payrollService.getPayrollHistory(staffWalletId || undefined);
    res.json({ data: history });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'HISTORY_ERROR', message: error.message } });
  }
});

export default router;
