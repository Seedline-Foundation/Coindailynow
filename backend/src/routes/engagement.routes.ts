// backend/src/routes/engagement.routes.ts
// Task 66: Engagement API Routes

import { Router } from 'express';
import engagementService from '../services/engagementService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Initialize user preferences and tracking
 * POST /api/engagement/initialize
 */
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await engagementService.initializeUser(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user preferences
 * PUT /api/engagement/preferences
 */
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const result = await engagementService.updatePreferences(userId, req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track reading behavior
 * POST /api/engagement/track-reading
 */
router.post('/track-reading', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { articleId, duration, scrollPercentage, completed, deviceType } = req.body;

    await engagementService.trackReadingBehavior(userId, articleId, {
      duration,
      scrollPercentage,
      completed,
      deviceType,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking reading behavior:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get personalized recommendations
 * GET /api/engagement/recommendations
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const context = (req.query.context as string) || 'HOME';

    const recommendations = await engagementService.getPersonalizedRecommendations(
      userId,
      { limit, context }
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get trending content (for anonymous users)
 * GET /api/engagement/trending
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const trending = await engagementService.getTrendingContent(limit);
    res.json(trending);
  } catch (error: any) {
    console.error('Error getting trending content:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate voice article
 * POST /api/engagement/voice/:articleId
 */
router.post('/voice/:articleId', authMiddleware, async (req, res) => {
  try {
    const { articleId } = req.params;
    if (!articleId) {
      res.status(400).json({ error: 'Article ID is required' });
      return;
    }
    const voiceArticle = await engagementService.generateVoiceArticle(articleId);
    res.json(voiceArticle);
  } catch (error: any) {
    console.error('Error generating voice article:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Subscribe to push notifications
 * POST /api/engagement/push/subscribe
 */
router.post('/push/subscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { subscription, deviceInfo } = req.body;

    const result = await engagementService.subscribeToPush(
      userId,
      subscription,
      deviceInfo
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send push notification (admin only)
 * POST /api/engagement/push/send
 */
router.post('/push/send', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await engagementService.sendPushNotification(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error generating voice article:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track PWA installation
 * POST /api/engagement/pwa/install
 */
router.post('/pwa/install', async (req, res) => {
  try {
    const { installId, userId, installData } = req.body;
    const result = await engagementService.trackPWAInstall(
      installId,
      userId,
      installData
    );
    res.json(result);
  } catch (error: any) {
    console.error('Error tracking PWA install:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user engagement stats
 * GET /api/engagement/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await engagementService.getUserEngagementStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Error getting engagement stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get engagement analytics (admin only)
 * GET /api/engagement/analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { from, to } = req.query;
    const dateRange = from && to
      ? { from: new Date(from as string), to: new Date(to as string) }
      : undefined;

    const analytics = await engagementService.getEngagementAnalytics(dateRange);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error getting engagement analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

