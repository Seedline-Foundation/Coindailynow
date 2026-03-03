import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { partnershipService } from '../services/PartnershipService';

const router = Router();

// GET /api/partnerships
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string;
    const partnerships = await partnershipService.listPartnerships(status);
    res.json({ data: partnerships });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'LIST_ERROR', message: error.message } });
  }
});

// POST /api/partnerships
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { partnerName, partnerWalletId, contractAmount, currency } = req.body;
    if (!partnerName || !partnerWalletId || !contractAmount) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'partnerName, partnerWalletId, contractAmount required' } });
      return;
    }
    const partnership = await partnershipService.createPartnership({
      partnerName, partnerWalletId, contractAmount,
      currency: currency || 'JY',
      createdBy: `admin:${req.admin?.email || 'SUPER_ADMIN'}`
    });
    res.status(201).json({ data: partnership });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'CREATE_ERROR', message: error.message } });
  }
});

// GET /api/partnerships/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const partnership = await partnershipService.getPartnership(req.params.id);
    if (!partnership) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Partnership not found' } }); return; }
    res.json({ data: partnership });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'GET_ERROR', message: error.message } });
  }
});

// POST /api/partnerships/:id/submit-docs
router.post('/:id/submit-docs', async (req: AuthenticatedRequest, res) => {
  try {
    const { contractDocUrl, contractDocContent, contractSignedDate, contractParties } = req.body;
    if (!contractDocUrl || !contractDocContent || !contractSignedDate || !contractParties) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'contractDocUrl, contractDocContent, contractSignedDate, contractParties required' } });
      return;
    }
    const partnership = await partnershipService.submitDocuments(req.params.id, {
      contractDocUrl, contractDocContent, contractSignedDate, contractParties
    });
    res.json({ data: partnership });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'DOCS_ERROR', message: error.message } });
  }
});

// POST /api/partnerships/:id/process-payment
router.post('/:id/process-payment', async (req: AuthenticatedRequest, res) => {
  try {
    await partnershipService.processPayment(req.params.id);
    res.json({ data: { message: 'Partnership payment processed successfully' } });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'PAYMENT_ERROR', message: error.message } });
  }
});

export default router;
