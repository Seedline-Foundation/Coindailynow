import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { pressEscrowService } from '../services/PressEscrowService';

const router = Router();

// GET /api/press/escrows
router.get('/escrows', async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string;
    const escrows = await pressEscrowService.listEscrows(status);
    res.json({ data: escrows });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'ESCROW_LIST_ERROR', message: error.message } });
  }
});

// POST /api/press/escrows
router.post('/escrows', async (req: AuthenticatedRequest, res) => {
  try {
    const { publisherWalletId, recipientWalletId, amount, pressOrderId, siteUrl } = req.body;
    if (!publisherWalletId || !recipientWalletId || !amount || !pressOrderId || !siteUrl) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'All fields required: publisherWalletId, recipientWalletId, amount, pressOrderId, siteUrl' } });
      return;
    }
    const escrow = await pressEscrowService.createEscrow({
      publisherWalletId, recipientWalletId, amount, pressOrderId, siteUrl
    });
    res.status(201).json({ data: escrow });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'ESCROW_CREATE_ERROR', message: error.message } });
  }
});

// GET /api/press/escrows/:id
router.get('/escrows/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const escrow = await pressEscrowService.getEscrow(req.params.id);
    if (!escrow) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Escrow not found' } }); return; }
    res.json({ data: escrow });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'ESCROW_ERROR', message: error.message } });
  }
});

// POST /api/press/escrows/:id/release
router.post('/escrows/:id/release', async (req: AuthenticatedRequest, res) => {
  try {
    await pressEscrowService.releaseEscrow(req.params.id);
    res.json({ data: { message: 'Escrow released successfully' } });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'RELEASE_ERROR', message: error.message } });
  }
});

// POST /api/press/escrows/:id/refund
router.post('/escrows/:id/refund', async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    await pressEscrowService.refundEscrow(req.params.id, reason || 'Admin-initiated refund');
    res.json({ data: { message: 'Escrow refunded successfully' } });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'REFUND_ERROR', message: error.message } });
  }
});

// POST /api/press/process-releasable — Cron endpoint
router.post('/process-releasable', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pressEscrowService.processReleasableEscrows();
    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'PROCESS_ERROR', message: error.message } });
  }
});

export default router;
