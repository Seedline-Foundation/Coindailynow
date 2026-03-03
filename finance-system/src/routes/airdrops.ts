import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { airdropService } from '../services/AirdropService';

const router = Router();

// GET /api/airdrops
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string;
    const campaigns = await airdropService.listCampaigns(status);
    res.json({ data: campaigns });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'LIST_ERROR', message: error.message } });
  }
});

// POST /api/airdrops
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { projectName, projectOwnerWalletId, tokenAddress, totalFundAmount, fundingWalletAddress, campaignStart, campaignEnd, qualificationCriteria } = req.body;
    if (!projectName || !totalFundAmount || !fundingWalletAddress) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'projectName, totalFundAmount, fundingWalletAddress required' } });
      return;
    }
    const campaign = await airdropService.createCampaign({
      projectName, projectOwnerWalletId, tokenAddress,
      totalFundAmount, fundingWalletAddress,
      campaignStart, campaignEnd,
      qualificationCriteria: qualificationCriteria || {}
    });
    res.status(201).json({ data: campaign });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'CREATE_ERROR', message: error.message } });
  }
});

// GET /api/airdrops/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const campaign = await airdropService.getCampaign(req.params.id);
    if (!campaign) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } }); return; }
    res.json({ data: campaign });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'GET_ERROR', message: error.message } });
  }
});

// GET /api/airdrops/:id/summary
router.get('/:id/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await airdropService.getCampaignSummary(req.params.id);
    res.json({ data: summary });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SUMMARY_ERROR', message: error.message } });
  }
});

// POST /api/airdrops/:id/verify-funding
router.post('/:id/verify-funding', async (req: AuthenticatedRequest, res) => {
  try {
    await airdropService.verifyFunding(req.params.id);
    res.json({ data: { message: 'Funding verification initiated' } });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'VERIFY_ERROR', message: error.message } });
  }
});

// POST /api/airdrops/:id/activate
router.post('/:id/activate', async (req: AuthenticatedRequest, res) => {
  try {
    await airdropService.activateCampaign(req.params.id);
    res.json({ data: { message: 'Campaign activated' } });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'ACTIVATE_ERROR', message: error.message } });
  }
});

// POST /api/airdrops/:id/record-distribution
router.post('/:id/record-distribution', async (req: AuthenticatedRequest, res) => {
  try {
    const { recipientAddress, recipientWalletId, amount, txHash } = req.body;
    if (!recipientAddress || !amount || !txHash) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'recipientAddress, amount, txHash required' } });
      return;
    }
    await airdropService.recordDistribution({
      campaignId: req.params.id,
      recipientAddress, recipientWalletId, amount, txHash
    });
    res.json({ data: { message: 'Distribution recorded' } });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'DISTRIBUTION_ERROR', message: error.message } });
  }
});

// GET /api/airdrops/:id/distributions
router.get('/:id/distributions', async (req: AuthenticatedRequest, res) => {
  try {
    const distributions = await airdropService.getCampaignDistributions(req.params.id);
    res.json({ data: distributions });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'LIST_ERROR', message: error.message } });
  }
});

export default router;
