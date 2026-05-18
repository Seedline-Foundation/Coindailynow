/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     ADMIN QUEUE MANAGEMENT SYSTEM                        ║
 * ║                                                                          ║
 * ║  REST API for admin approval workflow                                   ║
 * ║  - View pending articles                                                ║
 * ║  - Approve for publication                                              ║
 * ║  - Request edits with routing to appropriate agent                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getRedis } from '../../lib/redis';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { AIReviewAgent } from '../../agents/review/aiReviewAgent';
import { runEditorialPipelineJob } from '../../services/aiEditorialPipelineService';
import AIModerationService from '../../services/aiModerationService';
import ContentModerationAgent from '../../agents/moderation/contentModerationAgent';
import { AdminQueueItem, EditRequest } from '../../types/admin-types';
import { canPublishContent } from '../../lib/editorialRoles';

const router = Router();
router.use(authMiddleware as any);
const redis = getRedis();
const reviewAgent = new AIReviewAgent(redis, logger, prisma as any);
const moderationAgent = new ContentModerationAgent();
const perspectiveModeration = new AIModerationService(
  prisma,
  redis,
  process.env.PERSPECTIVE_API_KEY || process.env.GOOGLE_PERSPECTIVE_API_KEY || '',
);

// ============================================================================
// GET /api/admin/queue - Get all pending articles
// ============================================================================

router.get('/queue', async (req: Request, res: Response) => {
  try {
    const pendingItems = await redis.lrange('admin_queue:pending', 0, -1);
    
    const queue: AdminQueueItem[] = await Promise.all(
      pendingItems.map(async (item) => JSON.parse(item))
    );

    // Sort by submission time (newest first)
    queue.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    res.json({
      success: true,
      count: queue.length,
      queue: queue.map(item => ({
        id: item.id,
        article_id: item.article_id,
        title: item.articles.english.title,
        topic: item.articles.research.topic,
        status: item.status,
        submitted_at: item.submitted_at,
        word_count: item.articles.english.word_count,
        languages: [
          'English',
          ...item.articles.translations.map(t => t.language)
        ],
        seo_score: item.articles.english.seo_score,
        image_url: item.articles.image.url
      }))
    });

  } catch (error) {
    console.error('[Admin Queue API] Error fetching queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin queue'
    });
  }
});

// ============================================================================
// GET /api/admin/queue/:id - Get specific queue item details
// ============================================================================

router.get('/queue/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemData = await redis.get(`admin_queue:item:${id}`);

    if (!itemData) {
      return res.status(404).json({
        success: false,
        error: 'Queue item not found'
      });
    }

    const item: AdminQueueItem = JSON.parse(itemData);

    res.json({
      success: true,
      item: {
        ...item,
        // Full details for admin review
        english_article: item.articles.english,
        translations: item.articles.translations,
        image: item.articles.image,
        research: item.articles.research,
        edit_history: item.edit_requests || []
      }
    });

  } catch (error) {
    console.error('[Admin Queue API] Error fetching queue item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue item'
    });
  }
});

// ============================================================================
// POST /api/admin/queue/:id/approve - Approve article for publication
// ============================================================================

router.post('/queue/:id/approve', async (req: Request, res: Response) => {
  try {
    if (!canPublishContent(req.user?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Content publishing role required',
      });
    }

    const { id } = req.params;
    const { admin_id, admin_notes } = req.body;

    const itemData = await redis.get(`admin_queue:item:${id}`);
    if (!itemData) {
      return res.status(404).json({
        success: false,
        error: 'Queue item not found'
      });
    }

    const item: AdminQueueItem = JSON.parse(itemData);

    const articleText = [
      item.articles?.english?.title,
      item.articles?.english?.content,
    ]
      .filter(Boolean)
      .join('\n\n');

    if (articleText) {
      const agentTask = await moderationAgent.execute(
        { text: articleText, contentId: item.article_id },
        'high',
      );
      const agentOut = (agentTask as { output?: { allowed?: boolean; score?: number } }).output;
      const perspective = await perspectiveModeration.moderateContent({
        contentId: item.article_id,
        contentType: 'article',
        text: articleText,
        userId: admin_id || 'admin',
      } as any);
      const allowed =
        agentOut?.allowed !== false &&
        Number(agentOut?.score ?? 0) < 0.85 &&
        (perspective as { allowed?: boolean }).allowed !== false;
      if (!allowed) {
        return res.status(422).json({
          success: false,
          error: 'Content failed moderation — cannot approve for publication',
          moderation: { agent: agentOut, perspective },
        });
      }
    }

    // Update status to approved
    item.status = 'approved';
    item.reviewed_at = new Date();
    item.admin_notes = admin_notes;

    // Save updated item
    await redis.setex(
      `admin_queue:item:${id}`,
      3600 * 24 * 30, // 30 days
      JSON.stringify(item)
    );

    // Remove from pending queue
    await redis.lrem('admin_queue:pending', 1, itemData);

    // Add to approved queue
    await redis.lpush('admin_queue:approved', JSON.stringify(item));

    // ── Sync approved article to the CMS Article table via Prisma ──
    try {
      const english = item.articles?.english;
      const research = item.articles?.research;
      const image = item.articles?.image;

      if (english) {
        const slug = english.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 200);

        const readingTime = Math.max(1, Math.ceil((english.word_count || 200) / 200));

        // Resolve a default "AI" author and "Crypto" category, or use the first available rows.
        const defaultAuthor = await prisma.user.findFirst({ select: { id: true } });
        const defaultCategory = await prisma.category.findFirst({ select: { id: true } });

        if (defaultAuthor && defaultCategory) {
          await prisma.article.upsert({
            where: { id: item.article_id },
            update: {
              title: english.title,
              content: english.content,
              excerpt: english.content.substring(0, 300),
              status: 'APPROVED',
              seoKeywords: (english.keywords || []).join(', '),
              featuredImageUrl: image?.url || null,
              aiGenerated: true,
              updatedAt: new Date(),
            },
            create: {
              id: item.article_id,
              title: english.title,
              slug: `${slug}-${item.article_id.substring(0, 6)}`,
              content: english.content,
              excerpt: english.content.substring(0, 300),
              authorId: defaultAuthor.id,
              categoryId: defaultCategory.id,
              readingTimeMinutes: readingTime,
              status: 'APPROVED',
              seoKeywords: (english.keywords || []).join(', '),
              featuredImageUrl: image?.url || null,
              aiGenerated: true,
              updatedAt: new Date(),
            },
          });

          // Sync translations
          if (item.articles?.translations?.length) {
            for (const t of item.articles.translations) {
              await prisma.articleTranslation.upsert({
                where: {
                  articleId_languageCode: {
                    articleId: item.article_id,
                    languageCode: t.language_code,
                  },
                },
                update: {
                  title: t.title,
                  content: t.content,
                  excerpt: t.content.substring(0, 300),
                  translationStatus: 'COMPLETED',
                  aiGenerated: true,
                  updatedAt: new Date(),
                },
                create: {
                  id: `${item.article_id}_${t.language_code}`,
                  articleId: item.article_id,
                  languageCode: t.language_code,
                  title: t.title,
                  content: t.content,
                  excerpt: t.content.substring(0, 300),
                  translationStatus: 'COMPLETED',
                  aiGenerated: true,
                  updatedAt: new Date(),
                },
              });
            }
          }

          logger.info(`[Admin Queue API] Article synced to CMS: ${item.article_id}`);
        } else {
          logger.warn('[Admin Queue API] Skipped CMS sync — no default author or category found');
        }
      }
    } catch (syncError) {
      logger.error('[Admin Queue API] CMS sync failed (article still approved in queue)', {
        error: syncError instanceof Error ? syncError.message : String(syncError),
      });
    }

    console.log(`[Admin Queue API] ✅ Approved article: ${item.article_id} by admin: ${admin_id}`);

    res.json({
      success: true,
      message: 'Article approved for publication',
      item: {
        id: item.id,
        article_id: item.article_id,
        status: item.status,
        reviewed_at: item.reviewed_at
      }
    });

  } catch (error) {
    console.error('[Admin Queue API] Error approving article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve article'
    });
  }
});

// ============================================================================
// POST /api/admin/queue/:id/request-edit - Request edits to article
// ============================================================================

router.post('/queue/:id/request-edit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { edit_type, instructions, target_language, admin_id } = req.body;

    // Validate edit type
    const validTypes = ['research', 'content', 'image', 'translation'];
    if (!validTypes.includes(edit_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid edit_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // For translation edits, target_language is required
    if (edit_type === 'translation' && !target_language) {
      return res.status(400).json({
        success: false,
        error: 'target_language is required for translation edits'
      });
    }

    const editRequest: EditRequest = {
      type: edit_type,
      target_language,
      instructions,
      requested_by: admin_id,
      requested_at: new Date()
    };

    // Route edit request to appropriate agent
    const routing = await reviewAgent.routeEditRequest(id, editRequest);

    console.log(`[Admin Queue API] ✅ Edit request routed to ${routing.agent}`);
    console.log(`[Admin Queue API] Instructions: ${routing.instructions}`);

    // TODO: Actually call the appropriate agent with edit instructions
    // For now, we just return the routing information

    res.json({
      success: true,
      message: `Edit request sent to ${routing.agent}`,
      routing: {
        agent: routing.agent,
        instructions: routing.instructions,
        edit_request: editRequest
      }
    });

  } catch (error) {
    console.error('[Admin Queue API] Error requesting edit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request edit'
    });
  }
});

// ============================================================================
// GET /api/admin/stats - Get queue statistics
// ============================================================================

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const pendingCount = await redis.llen('admin_queue:pending');

    // Get all approved items to filter by today
    const allApproved = await redis.lrange('admin_queue:approved', 0, -1);
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const approvedTodayCount = allApproved.filter(item => {
      const parsed: AdminQueueItem = JSON.parse(item);
      if (!parsed.reviewed_at) return false;
      return new Date(parsed.reviewed_at).getTime() >= startOfToday;
    }).length;

    // Get items with edit requests
    const allPending = await redis.lrange('admin_queue:pending', 0, -1);
    const editRequestedCount = allPending.filter(item => {
      const parsed: AdminQueueItem = JSON.parse(item);
      return parsed.status === 'edit_requested';
    }).length;

    res.json({
      success: true,
      stats: {
        pending_approval: pendingCount - editRequestedCount,
        edit_requested: editRequestedCount,
        approved_today: approvedTodayCount,
        total_pending: pendingCount
      }
    });

  } catch (error) {
    console.error('[Admin Queue API] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue stats'
    });
  }
});

// ============================================================================
// POST /api/admin/queue/:id/publish - Publish approved article
// ============================================================================

router.post('/queue/:id/publish', async (req: Request, res: Response) => {
  try {
    if (!canPublishContent(req.user?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Content publishing role required',
      });
    }

    const { id } = req.params;

    const itemData = await redis.get(`admin_queue:item:${id}`);
    if (!itemData) {
      return res.status(404).json({
        success: false,
        error: 'Queue item not found'
      });
    }

    const item: AdminQueueItem = JSON.parse(itemData);

    // Check if approved
    if (item.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Article must be approved before publishing'
      });
    }

    // Update status to published
    item.status = 'published';

    await redis.setex(
      `admin_queue:item:${id}`,
      3600 * 24 * 30,
      JSON.stringify(item)
    );

    // Remove from approved queue
    await redis.lrem('admin_queue:approved', 1, itemData);

    // TODO: Actual publication workflow
    // - Update article status in database to 'published'
    // - Set publication timestamp
    // - Trigger cache invalidation
    // - Send notifications
    // - Post to social media (if configured)

    console.log(`[Admin Queue API] ✅ Published article: ${item.article_id}`);

    res.json({
      success: true,
      message: 'Article published successfully',
      published_articles: {
        english: item.articles.english.id,
        translations: item.articles.translations.map(t => ({
          language: t.language,
          id: `${item.articles.english.id}_${t.language_code}`
        }))
      }
    });

  } catch (error) {
    console.error('[Admin Queue API] Error publishing article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish article'
    });
  }
});

// ============================================================================
// POST /api/admin/editorial-queue/run — trigger ai-system pipeline
// ============================================================================

router.post('/run', async (req: Request, res: Response) => {
  try {
    const result = await runEditorialPipelineJob();
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Admin Queue API] Pipeline run failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Editorial pipeline failed',
    });
  }
});

export default router;
