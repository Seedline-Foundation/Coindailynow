import { Router, Request, Response } from 'express';
import BotService from '../services/botService';

const router = Router();

// Webhook verification token for WhatsApp Cloud API
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'coindaily_verify';

/**
 * POST /api/bots/telegram/webhook
 * Receives update callbacks from Telegram servers
 */
router.post('/telegram/webhook', async (req: Request, res: Response) => {
  try {
    // Process update asynchronously to avoid blocking Telegram's callback timeout
    BotService.handleTelegramUpdate(req.body).catch(err => {
      console.error('[TelegramBot] Async handler error:', err);
    });

    // Always acknowledge Telegram immediately
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in Telegram webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/bots/whatsapp/webhook
 * Handshake verification required by Meta to activate the WhatsApp webhook
 */
router.get('/whatsapp/webhook', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('[WhatsAppWebhook] Verification successful');
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Verification failed' });
  } catch (error) {
    console.error('Error in WhatsApp webhook verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bots/whatsapp/webhook
 * Receives incoming WhatsApp messages from Meta servers
 */
router.post('/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    // Process incoming message asynchronously
    BotService.handleWhatsAppUpdate(req.body).catch(err => {
      console.error('[WhatsAppBot] Async handler error:', err);
    });

    // Acknowledge Meta immediately
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in WhatsApp webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
