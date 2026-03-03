import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { transactionService } from '../services/TransactionService';

const router = Router();

// GET /api/transactions
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { tx_type, status, from_wallet_id, to_wallet_id, limit, offset } = req.query;
    const result = await transactionService.listTransactions({
      tx_type: tx_type as any,
      status: status as any,
      from_wallet_id: from_wallet_id as string,
      to_wallet_id: to_wallet_id as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.json({ data: result.transactions, total: result.total });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'TX_LIST_ERROR', message: error.message } });
  }
});

// GET /api/transactions/pending
router.get('/pending', async (req: AuthenticatedRequest, res) => {
  try {
    const transactions = await transactionService.getPendingTransactions();
    res.json({ data: transactions });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'TX_PENDING_ERROR', message: error.message } });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const tx = await transactionService.getTransaction(req.params.id);
    if (!tx) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } }); return; }
    res.json({ data: tx });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'TX_ERROR', message: error.message } });
  }
});

export default router;
