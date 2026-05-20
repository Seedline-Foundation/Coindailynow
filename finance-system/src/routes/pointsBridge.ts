import { Router, Request, Response } from 'express';
import { walletService } from '../services/WalletService';
import { ledgerService } from '../services/LedgerService';

const router = Router();

/**
 * GAP-1-5: Points → JOY bridge with ledger journal entry.
 */
router.post('/stake', async (req: Request, res: Response) => {
  const { walletId, points } = req.body;
  if (!walletId || !points || points <= 0) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'walletId and positive points required' } });
    return;
  }

  const rate = parseFloat(process.env.POINTS_TO_JOY_RATE || '0.01');
  const joyAmount = points * rate;

  try {
    await walletService.debitWallet(walletId, 'balance_points', points);
    const updated = await walletService.creditWallet(walletId, 'balance_jy', joyAmount);

    await ledgerService.createJournalEntry({
      description: `Points bridge: ${points} points → ${joyAmount} JY`,
      reference_type: 'POINT_TO_TOKEN',
      reference_id: walletId,
      created_by: 'SYSTEM',
      lines: [
        { account_code: '120001', debit: joyAmount, credit: 0, currency: 'JY', description: 'JOY credited to wallet' },
        { account_code: '310001', debit: 0, credit: joyAmount, currency: 'JY', description: 'Points converted to JY' },
      ],
    });

    res.json({
      success: true,
      data: {
        walletId,
        pointsStaked: points,
        joyMinted: joyAmount,
        rate,
        balance: updated,
      },
    });
  } catch (e: any) {
    res.status(400).json({ error: { code: 'BRIDGE_FAILED', message: e.message } });
  }
});

export default router;
