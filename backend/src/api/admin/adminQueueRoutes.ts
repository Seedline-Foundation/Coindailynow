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
import Redis from 'ioredis';
import { AIReviewAgent } from '../agents/review/aiReviewAgent';
import { AdminQueueItem, EditRequest } from '../types/admin-types';

const router = Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const reviewAgent = new AIReviewAgent(redis);

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

    // TODO: Trigger publication workflow
    // - Save to database (Prisma)
    // - Upload image to CDN
    // - Generate URLs for all 16 articles
    // - Update Elasticsearch index
    // - Clear caches

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
    const approvedCount = await redis.llen('admin_queue:approved');

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
        approved_today: approvedCount, // TODO: Filter by today
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

export default router;
