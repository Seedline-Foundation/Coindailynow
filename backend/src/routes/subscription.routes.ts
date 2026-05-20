/**
 * Subscription API — plans, trial, checkout (YellowCard / ChangeNOW), cancel, paywall status.
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { subscriptionService } from '../services/subscriptionService';
import { validateBody } from '../middleware/validate';
import { checkoutSchema, confirmPaymentSchema } from '../validation/subscription.schemas';

const router = Router();

router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.listPlans();
    res.json({ success: true, data: plans });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sub = await subscriptionService.getUserSubscription(req.user!.id);
    const hasPaywallAccess =
      !!sub &&
      ['ACTIVE', 'TRIAL'].includes(sub.status) &&
      sub.currentPeriodEnd > new Date();
    res.json({
      success: true,
      data: sub,
      paywall: { hasAccess: hasPaywallAccess, tier: req.user!.subscriptionTier },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/trial', authMiddleware, async (req: Request, res: Response) => {
  try {
    const planId = req.body.planId || process.env.DEFAULT_SUBSCRIPTION_PLAN_ID;
    if (!planId) {
      res.status(400).json({ success: false, error: 'planId required' });
      return;
    }
    const sub = await subscriptionService.startTrial(req.user!.id, planId, req.body.trialDays);
    res.json({ success: true, data: sub });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/checkout', authMiddleware, validateBody(checkoutSchema), async (req: Request, res: Response) => {
  try {
    const { planId, provider } = req.body;
    const session = await subscriptionService.createCheckoutSession({
      userId: req.user!.id,
      planId,
      provider: provider === 'changenow' ? 'changenow' : 'yellowcard',
      successUrl: req.body.successUrl,
      cancelUrl: req.body.cancelUrl,
    });
    res.json({ success: true, data: session });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/confirm', authMiddleware, validateBody(confirmPaymentSchema), async (req: Request, res: Response) => {
  try {
    const { planId, gatewayTxId, amount, paymentMethod, paymentGateway, currency } = req.body;
    const result = await subscriptionService.confirmPayment({
      userId: req.user!.id,
      planId,
      gatewayTxId,
      amount: Number(amount) || 0,
      paymentMethod: paymentMethod || 'CARD',
      paymentGateway: paymentGateway || 'YELLOWCARD',
      currency,
    });
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sub = await subscriptionService.cancelAtPeriodEnd(req.user!.id);
    res.json({ success: true, data: sub });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Paywall probe for E2E — optional auth returns access flag. */
router.get('/paywall/check', optionalAuthMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.json({ success: true, hasAccess: false, reason: 'anonymous' });
    return;
  }
  const sub = await subscriptionService.getUserSubscription(userId);
  const hasAccess =
    !!sub &&
    ['ACTIVE', 'TRIAL'].includes(sub.status) &&
    sub.currentPeriodEnd > new Date();
  res.json({
    success: true,
    hasAccess,
    status: sub?.status,
    periodEnd: sub?.currentPeriodEnd,
  });
});

export default router;
