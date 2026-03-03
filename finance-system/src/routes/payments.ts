import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { paymentProcessor } from '../services/PaymentProcessor';

const router = Router();

// POST /api/payments/user-withdrawal
router.post('/user-withdrawal', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, walletId, amount, activityData } = req.body;
    if (!userId || !walletId || !amount || !activityData) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'userId, walletId, amount, and activityData are required' } });
      return;
    }
    const tx = await paymentProcessor.processUserWithdrawal({ userId, walletId, amount, activityData });
    res.json({ data: tx });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'WITHDRAWAL_ERROR', message: error.message } });
  }
});

// POST /api/payments/bonus
router.post('/bonus', async (req: AuthenticatedRequest, res) => {
  try {
    const { recipientWalletId, amount, reason } = req.body;
    if (!recipientWalletId || !amount || !reason) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'recipientWalletId, amount, and reason are required' } });
      return;
    }
    const tx = await paymentProcessor.processBonusPayment({
      recipientWalletId,
      amount,
      reason,
      requestedBy: `admin:${req.admin?.email || 'SUPER_ADMIN'}`
    });
    res.json({ data: tx });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'BONUS_ERROR', message: error.message } });
  }
});

// POST /api/payments/receive
router.post('/receive', async (req: AuthenticatedRequest, res) => {
  try {
    const { fromWalletId, amount, currency, txType, description, metadata } = req.body;
    const tx = await paymentProcessor.receiveFunds({
      fromWalletId, amount, currency: currency || 'JY',
      txType: txType || 'TOKEN_DEPOSIT', description, metadata
    });
    res.json({ data: tx });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'RECEIVE_ERROR', message: error.message } });
  }
});

export default router;
