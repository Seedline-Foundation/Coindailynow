import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/auth/verify-email/:token
 * Verify email address using token from verification email.
 * Redirects to frontend with success/error status.
 */
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 32) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://sygn.live';
      return res.redirect(`${frontendUrl}/auth/verify-email?status=error&message=Invalid+verification+link`);
    }

    const result = await authService.verifyEmail(token);
    const frontendUrl = process.env.FRONTEND_URL || 'https://sygn.live';

    if (result.success) {
      return res.redirect(`${frontendUrl}/auth/verify-email?status=success&message=${encodeURIComponent(result.message)}`);
    } else {
      return res.redirect(`${frontendUrl}/auth/verify-email?status=error&message=${encodeURIComponent(result.message)}`);
    }
  } catch (error) {
    logger.error('Email verification route error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://sygn.live';
    return res.redirect(`${frontendUrl}/auth/verify-email?status=error&message=Verification+failed`);
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email via API (for frontend SPA flow).
 * Body: { token: string }
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.length < 32) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    const result = await authService.verifyEmail(token);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Email verification API error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification.
 * Body: { email: string }
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const result = await authService.resendEmailVerification(email);
    // Always return 200 to not reveal if email exists
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend verification' });
  }
});

export default router;
