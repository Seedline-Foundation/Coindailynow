import { Router, Request, Response } from 'express';
import _prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const prisma = _prisma as any;
const router = Router();
const AI_SYSTEM_URL = process.env.AI_SYSTEM_URL || 'http://localhost:3004';

// All help routes require authentication
router.use(authMiddleware);

/**
 * POST /api/help/ai-chat
 * Proxies the user's message to the AI system with localized regional context
 */
router.post('/ai-chat', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch user details for regional and language personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, preferredLanguage: true }
    });

    const country = user?.country || 'Global';
    const language = user?.preferredLanguage || 'en';

    // Construct a high-quality regional persona prompt
    const systemPrompt = `You are CoinDaily's AI Concierge, a premium cryptocurrency intelligence assistant.
The user is located in: ${country} and prefers language: ${language}.
Always tailor your explanations, examples, and recommendations to this country's context when relevant:
- If Nigeria: Reference Naira, NGN P2P trading, stablecoin adoption for inflation hedge, local exchange rules.
- If Kenya: Reference KES, M-Pesa mobile money integrations, local regulatory sandboxes.
- If South Africa: Reference ZAR, local exchanges like Luno, SARB guidelines.
- If Brazil: Reference BRL, Pix payment integrations, local stablecoin usage.
- If Latin America (e.g. Argentina, Chile, Paraguay): Reference local inflation hedges, bank/remittance options.
- If Caribbean: Reference local digital banking initiatives, fintech adoption, offshore compliance.

Keep your tone professional, authoritative, and helpful. Use formatting (bullet points, bolding) to make answers easily scannable on mobile screens.`;

    try {
      const response = await fetch(`${AI_SYSTEM_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory,
          systemPrompt
        }),
        signal: AbortSignal.timeout(20000) // 20s timeout
      });

      if (response.ok) {
        const result = await response.json();
        return res.json({
          data: {
            message: result.message,
            sources: result.sources || ['CoinDaily Archives']
          }
        });
      }
      
      console.warn(`AI service responded with status: ${response.status}`);
    } catch (fetchError) {
      console.warn('AI service on port 3004 is unreachable or timed out.', fetchError);
    }

    // Fallback response if the Next.js AI service is fully down
    return res.json({
      data: {
        message: `Thank you for contacting CoinDaily AI Concierge. Our specialized AI models are currently initializing or undergoing quick maintenance. 

Here is some general information:
- For **Mobile Money** or **Local Payment** issues: please open a ticket in the "Support Tickets" tab.
- For **Security** or **Wallet** questions: make sure to store your seed phrase offline and enable app-based MFA.
- For **Market Updates**: check out the live tickers on your main dashboard.

We expect AI services to be fully restored shortly.`,
        sources: ['Offline Cache']
      }
    });

  } catch (error: any) {
    console.error('Error in ai-chat route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/help/contact
 * Submits a contact/department request, stored as UserFeedback
 */
router.post('/contact', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { department, subject, message } = req.body;

    if (!department || !subject || !message) {
      return res.status(400).json({ error: 'Department, subject, and message are required' });
    }

    if (message.length < 20) {
      return res.status(400).json({ error: 'Message must be at least 20 characters long' });
    }

    const ticketNumber = `CT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const initialMetadata = {
      department,
      subject,
      responses: []
    };

    // Store contact request as a UserFeedback entry
    await prisma.userFeedback.create({
      data: {
        userId,
        feedbackType: 'CONTACT',
        feedbackCategory: department,
        comment: message,
        ticketId: ticketNumber,
        metadata: JSON.stringify(initialMetadata),
        isResolved: false
      }
    });

    return res.json({
      data: {
        success: true,
        ticketNumber
      }
    });
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/help/status
 * Probes the AI service health status and returns system operational flags
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    let aiAvailable = false;
    try {
      const response = await fetch(`${AI_SYSTEM_URL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const health = await response.json();
        aiAvailable = health.status === 'operational' || health.status === 'degraded';
      }
    } catch {
      // Ignored: AI service is down
    }

    return res.json({
      data: {
        aiAvailable,
        ticketsEnabled: true,
        contactEnabled: true
      }
    });
  } catch (error: any) {
    console.error('Error fetching help status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
