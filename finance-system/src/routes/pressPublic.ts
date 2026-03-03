import { Router, Request, Response } from 'express';
import { pressEscrowService } from '../services/PressEscrowService';
import { walletService } from '../services/WalletService';
import { notificationService } from '../services/NotificationService';
import { auditService } from '../services/AuditService';
import crypto from 'crypto';

const router = Router();

/**
 * PUBLIC PRESS ORDER ENDPOINT
 * Called by the SENDPRESS user dashboard when a publisher places a PR distribution order.
 * This does NOT require Super Admin auth — it uses HMAC signature verification
 * from the press system (service-to-service auth).
 *
 * Flow:
 * 1. User logs into press.coindaily.online/dashboard
 * 2. User writes PR content, selects sites, sets budget
 * 3. User pays in JOY tokens → SENDPRESS backend calls THIS endpoint
 * 4. CFIS creates escrow → Super Admin sees it instantly in CFIS dashboard
 * 5. After 24h + AI verification → escrow releases to site owners
 * 6. If fraud/no-slot/not-placed → Super Admin refunds via CFIS (minus gas fees)
 */

const PRESS_HMAC_SECRET = process.env.PRESS_HMAC_SECRET || process.env.CFIS_HMAC_SECRET || 'press-hmac-secret';

function verifyPressSignature(req: Request): boolean {
  const signature = req.headers['x-press-signature'] as string;
  const timestamp = req.headers['x-press-timestamp'] as string;
  if (!signature || !timestamp) return false;

  // Reject requests older than 5 minutes
  const age = Date.now() - parseInt(timestamp);
  if (isNaN(age) || age > 5 * 60 * 1000) return false;

  const payload = timestamp + '.' + JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', PRESS_HMAC_SECRET).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * POST /api/press-orders/create
 * Called by SENDPRESS when a user places a PR distribution order
 *
 * Body: {
 *   orderId: string           — Distribution ID from SENDPRESS
 *   publisherId: string       — Publisher ID
 *   publisherEmail: string    — Publisher email
 *   publisherWallet: string   — Publisher wallet address (or internal ID)
 *   amount: number            — JOY tokens locked
 *   prTitle: string           — PR title for reference
 *   targetSites: string[]     — Site IDs the PR is distributed to
 *   siteUrl: string           — Primary site URL
 *   tier: string              — Tier level (bronze/silver/gold/platinum)
 * }
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    // Verify HMAC signature from SENDPRESS
    if (!verifyPressSignature(req)) {
      // In development, allow without signature
      if (process.env.NODE_ENV === 'production') {
        res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid press system signature' } });
        return;
      }
    }

    const {
      orderId, publisherId, publisherEmail, publisherWallet,
      amount, prTitle, targetSites, siteUrl, tier
    } = req.body;

    if (!orderId || !publisherId || !amount) {
      res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Required: orderId, publisherId, amount' }
      });
      return;
    }

    // Find or create publisher wallet in CFIS
    let publisherWalletId: string;
    try {
      const existingWallet = await walletService.findWalletByOwner(publisherId, 'PRESS');
      publisherWalletId = existingWallet.id;
    } catch {
      // Auto-create press wallet for this publisher
      const newWallet = await walletService.createWallet('PRESS', publisherId, publisherWallet || undefined);
      publisherWalletId = newWallet.id;
    }

    // Get CFIS escrow wallet as the recipient for now (funds held by CFIS)
    const escrowWallet = await walletService.getEscrowWallet();

    // Create the escrow in CFIS — this makes it instantly visible to Super Admin
    const escrow = await pressEscrowService.createEscrow({
      publisherWalletId,
      recipientWalletId: escrowWallet.id,  // Held in escrow until released
      amount: parseFloat(amount),
      pressOrderId: orderId,
      siteUrl: siteUrl || targetSites?.[0] || 'pending-assignment'
    });

    // Enhanced notification with full context
    await notificationService.notifySuperAdmin(
      `🆕 Press Order Received — ${amount} JOY`,
      `Publisher "${publisherEmail || publisherId}" placed PR order "${prTitle || orderId}".\n` +
      `Tier: ${tier || 'standard'} | Sites: ${targetSites?.length || 0} | Amount: ${amount} JOY.\n` +
      `Escrow ID: ${escrow.id}. Auto-releases in 24h after AI verification.\n` +
      `Review in CFIS Dashboard → Press Escrow.`,
      'PRESS', 'HIGH', 'ESCROW', escrow.id
    );

    await auditService.log({
      action: 'PRESS_ORDER_RECEIVED_FROM_USER',
      actor: `PRESS_SYSTEM:${publisherId}`,
      entity_type: 'ESCROW',
      entity_id: escrow.id,
      new_value: {
        orderId, publisherId, publisherEmail, amount,
        prTitle, targetSites, siteUrl, tier,
        source: 'SENDPRESS_USER_DASHBOARD'
      }
    }).catch(() => {});

    res.status(201).json({
      data: {
        escrowId: escrow.id,
        status: 'FUNDED',
        amount: parseFloat(amount),
        releaseAfter: escrow.release_after,
        message: 'Escrow created in CFIS. Super Admin notified. Auto-release in 24h after AI verification.'
      }
    });

  } catch (error: any) {
    console.error('[CFIS] Press order error:', error.message);
    res.status(500).json({
      error: { code: 'PRESS_ORDER_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/press-orders/status/:orderId
 * Check escrow status for a SENDPRESS order
 */
router.get('/status/:orderId', async (req: Request, res: Response) => {
  try {
    const escrow = await pressEscrowService.getEscrowByOrderId(req.params.orderId);
    if (!escrow) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found in CFIS' } });
      return;
    }

    res.json({
      data: {
        escrowId: escrow.id,
        orderId: escrow.press_order_id,
        status: escrow.status,
        amount: escrow.amount,
        fundedAt: escrow.funded_at || escrow.created_at,
        releaseAfter: escrow.release_after,
        releasedAt: escrow.released_at,
        verificationStatus: escrow.ai_verification_id ? 'VERIFIED' : 'PENDING'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'STATUS_ERROR', message: error.message } });
  }
});

/**
 * POST /api/press-orders/cancel/:orderId
 * User requests cancellation — subject to Super Admin approval + gas fee deduction
 */
router.post('/cancel/:orderId', async (req: Request, res: Response) => {
  try {
    const { reason, publisherId } = req.body;
    const escrow = await pressEscrowService.getEscrowByOrderId(req.params.orderId);
    if (!escrow) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    if (escrow.status !== 'FUNDED') {
      res.status(400).json({
        error: { code: 'CANNOT_CANCEL', message: `Order in "${escrow.status}" state cannot be cancelled` }
      });
      return;
    }

    // Don't auto-refund — flag for Super Admin review
    await notificationService.notifySuperAdmin(
      `⚠️ Cancellation Request — ${escrow.amount} JOY`,
      `Publisher ${publisherId} requested cancellation of order ${req.params.orderId}.\n` +
      `Reason: ${reason || 'Not specified'}.\n` +
      `Review in CFIS Dashboard → Press Escrow → Refund (gas fees will be deducted).`,
      'PRESS', 'HIGH', 'ESCROW', escrow.id
    );

    res.json({
      data: {
        message: 'Cancellation request submitted. Super Admin will review and process refund (minus gas fees).',
        escrowId: escrow.id
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'CANCEL_ERROR', message: error.message } });
  }
});

export default router;
