import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  requireAdmin,
  prisma,
  cmsService,
  financeService,
  canEmergencyUnpublish,
  requireFinancePermission,
  getRangeStartDate,
  DEFAULT_ROLES,
  customRoles,
  getStaffMetaPermissions,
  STAFF_DEPARTMENTS,
  ALL_PERMISSIONS,
  getPermissionCategories,
} from './shared';
import { canPublishContent } from '../../../lib/editorialRoles';
import { validateBody } from '../../../middleware/validate';
import {
  emergencyUnpublishSchema,
  patchArticleSchema,
} from '../../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.get('/articles', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const category = (req.query.category as string) || '';
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'all') where.status = status.toUpperCase();
    if (category && category !== 'all') where.categoryId = category;

    const [articles, total, categories] = await Promise.all([
      prisma.article.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          isPremium: true,
          aiGenerated: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          createdAt: true,
          publishedAt: true,
          User: { select: { id: true, username: true, firstName: true, lastName: true } },
          Category: { select: { id: true, name: true } },
        }
      }),
      prisma.article.count({ where }),
      prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    ]);

    res.json({
      success: true,
      data: articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        author: a.User ? [a.User.firstName, a.User.lastName].filter(Boolean).join(' ') || a.User.username : 'Unknown',
        authorId: a.User?.id,
        status: a.status?.toLowerCase() || 'draft',
        category: a.Category?.name || 'Uncategorized',
        categoryId: a.Category?.id,
        views: a.viewCount || 0,
        likes: a.likeCount || 0,
        comments: a.commentCount || 0,
        isAI: a.aiGenerated || false,
        isPremium: a.isPremium || false,
        publishedAt: a.publishedAt,
        createdAt: a.createdAt,
      })),
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/ai-agents
 * Get AI agent status from database
 */

router.patch('/articles/:id', authMiddleware, validateBody(patchArticleSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;
    const { status } = req.body;

    if (status && status.toUpperCase() === 'PUBLISHED' && !canPublishContent(req.user?.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Content publishing role required',
      });
      return;
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'PUBLISHED' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, status: true, publishedAt: true },
    });

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * POST /api/super-admin/articles/:id/emergency-unpublish
 * Immediately unpublish live content (moderation — &lt;2 clicks from admin UI).
 */
router.post(
  '/articles/:id/emergency-unpublish',
  authMiddleware,
  validateBody(emergencyUnpublishSchema),
  async (req: Request, res: Response) => {
  try {
    if (!req.user || !canEmergencyUnpublish(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Editorial moderation role required',
      });
      return;
    }

    const { id } = req.params;
    const reason = String(req.body?.reason || 'Emergency moderation unpublish');

    const article = await cmsService.emergencyUnpublish(id, req.user.id, reason);

    res.json({
      success: true,
      data: {
        id: article.id,
        title: article.title,
        status: article.status,
        publishedAt: article.publishedAt,
      },
    });
  } catch (error: any) {
    console.error('Emergency unpublish error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Emergency unpublish failed',
    });
  }
  },
);

export default router;
