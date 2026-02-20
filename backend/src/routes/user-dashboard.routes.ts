// backend/src/routes/user-dashboard.routes.ts
// User Dashboard API: bookmarks, reading history, notifications, profile, settings
// Routes for authenticated user features

import { Router, Request, Response } from 'express';
import _prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

// Note: tsc --noEmit validates full Prisma types correctly.
// The 'any' cast works around VS Code TS server caching stale generated types.
const prisma = _prisma as any;

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// PROFILE
// ============================================================

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile data
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        subscriptionTier: true,
        emailVerified: true,
        preferredLanguage: true,
        location: true,
        createdAt: true,
        _count: {
          select: {
            UserBookmarks: true,
            ReadingHistories: true,
            UserNotifications: true,
            Article: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    res.json({ data: user });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile fields
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, bio, avatarUrl, preferredLanguage, location } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        ...(location !== undefined && { location }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        preferredLanguage: true,
        location: true,
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================================
// BOOKMARKS
// ============================================================

/**
 * GET /api/user/bookmarks
 * List user's bookmarked articles (paginated)
 */
router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.userBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              featuredImageUrl: true,
              publishedAt: true,
              readingTimeMinutes: true,
              viewCount: true,
              Category: { select: { id: true, name: true, slug: true } },
              User: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.userBookmark.count({ where: { userId } }),
    ]);

    res.json({
      data: bookmarks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/user/bookmarks
 * Add an article to bookmarks
 */
router.post('/bookmarks', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELD', message: 'articleId is required' } });
    }

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return res.status(404).json({ error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
    }

    const bookmark = await prisma.userBookmark.upsert({
      where: { userId_articleId: { userId, articleId } },
      update: {},
      create: { userId, articleId },
    });

    res.status(201).json({ data: bookmark });
  } catch (error: any) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * DELETE /api/user/bookmarks/:articleId
 * Remove a bookmark
 */
router.delete('/bookmarks/:articleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { articleId } = req.params;

    await prisma.userBookmark.deleteMany({
      where: { userId, articleId },
    });

    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/user/bookmarks/check/:articleId
 * Check if article is bookmarked
 */
router.get('/bookmarks/check/:articleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { articleId } = req.params;

    const bookmark = await prisma.userBookmark.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });

    res.json({ data: { bookmarked: !!bookmark } });
  } catch (error: any) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================================
// READING HISTORY
// ============================================================

/**
 * GET /api/user/reading-history
 * List user's reading history (paginated)
 */
router.get('/reading-history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.readingHistory.findMany({
        where: { userId },
        orderBy: { readAt: 'desc' },
        skip,
        take: limit,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              featuredImageUrl: true,
              publishedAt: true,
              readingTimeMinutes: true,
              Category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      prisma.readingHistory.count({ where: { userId } }),
    ]);

    res.json({
      data: history,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching reading history:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/user/reading-history
 * Track reading progress (upserts)
 */
router.post('/reading-history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { articleId, readDurationSec, scrollPercent, completed } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: { code: 'MISSING_FIELD', message: 'articleId is required' } });
    }

    // Upsert — update if user already has an entry for this article
    const existing = await prisma.readingHistory.findFirst({
      where: { userId, articleId },
      orderBy: { readAt: 'desc' },
    });

    let entry;
    if (existing) {
      entry = await prisma.readingHistory.update({
        where: { id: existing.id },
        data: {
          readAt: new Date(),
          ...(readDurationSec !== undefined && { readDurationSec }),
          ...(scrollPercent !== undefined && { scrollPercent }),
          ...(completed !== undefined && { completed }),
        },
      });
    } else {
      entry = await prisma.readingHistory.create({
        data: {
          userId,
          articleId,
          readDurationSec: readDurationSec || 0,
          scrollPercent: scrollPercent || 0,
          completed: completed || false,
        },
      });
    }

    res.status(201).json({ data: entry });
  } catch (error: any) {
    console.error('Error tracking reading history:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * DELETE /api/user/reading-history
 * Clear all reading history
 */
router.delete('/reading-history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.readingHistory.deleteMany({ where: { userId } });
    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Error clearing reading history:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================================
// NOTIFICATIONS
// ============================================================

/**
 * GET /api/user/notifications
 * List user's notifications (paginated)
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const where = { userId, ...(unreadOnly && { read: false }) };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userNotification.count({ where }),
      prisma.userNotification.count({ where: { userId, read: false } }),
    ]);

    res.json({
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * PATCH /api/user/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.userNotification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }

    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * PATCH /api/user/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.userNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * DELETE /api/user/notifications/:id
 * Delete a single notification
 */
router.delete('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await prisma.userNotification.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }

    res.json({ data: { success: true } });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// ============================================================
// DASHBOARD STATS
// ============================================================

/**
 * GET /api/user/stats
 * Aggregate dashboard stats for the authenticated user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [bookmarkCount, historyCount, unreadNotifications, recentHistory] = await Promise.all([
      prisma.userBookmark.count({ where: { userId } }),
      prisma.readingHistory.count({ where: { userId } }),
      prisma.userNotification.count({ where: { userId, read: false } }),
      prisma.readingHistory.findMany({
        where: { userId },
        orderBy: { readAt: 'desc' },
        take: 5,
        include: {
          article: {
            select: { id: true, title: true, slug: true, featuredImageUrl: true },
          },
        },
      }),
    ]);

    // Calculate total reading time
    const readingStats = await prisma.readingHistory.aggregate({
      where: { userId },
      _sum: { readDurationSec: true },
      _count: { _all: true },
    });

    res.json({
      data: {
        bookmarkCount,
        articlesRead: historyCount,
        unreadNotifications,
        totalReadingTimeSec: readingStats._sum.readDurationSec || 0,
        recentlyRead: recentHistory,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export default router;
