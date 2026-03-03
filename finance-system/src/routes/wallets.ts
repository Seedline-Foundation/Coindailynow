import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { walletService } from '../services/WalletService';
import { transactionService } from '../services/TransactionService';

const router = Router();

// GET /api/wallets
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const ownerType = req.query.owner_type as any;
    const wallets = await walletService.listWallets({ owner_type: ownerType });
    res.json({ data: wallets });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'WALLET_LIST_ERROR', message: error.message } });
  }
});

// POST /api/wallets
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { owner_type, owner_id, wallet_address } = req.body;
    const wallet = await walletService.createWallet(owner_type, owner_id, wallet_address);
    res.status(201).json({ data: wallet });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'WALLET_CREATE_ERROR', message: error.message } });
  }
});

// GET /api/wallets/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const wallet = await walletService.getWallet(req.params.id);
    if (!wallet) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Wallet not found' } }); return; }
    res.json({ data: wallet });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'WALLET_ERROR', message: error.message } });
  }
});

// GET /api/wallets/:id/transactions
router.get('/:id/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const transactions = await transactionService.getTransactionsByWallet(req.params.id);
    res.json({ data: transactions });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'TX_ERROR', message: error.message } });
  }
});

// PUT /api/wallets/:id/verify
router.put('/:id/verify', async (req: AuthenticatedRequest, res) => {
  try {
    const wallet = await walletService.verifyWallet(req.params.id);
    res.json({ data: wallet });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'VERIFY_ERROR', message: error.message } });
  }
});

// PUT /api/wallets/:id/address
router.put('/:id/address', async (req: AuthenticatedRequest, res) => {
  try {
    const { wallet_address } = req.body;
    const wallet = await walletService.setWalletAddress(req.params.id, wallet_address);
    res.json({ data: wallet });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'ADDRESS_ERROR', message: error.message } });
  }
});

export default router;
