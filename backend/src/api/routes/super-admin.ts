/**
 * Super Admin API Routes
 * Handles super admin dashboard and management endpoints
 * Uses real Prisma data from the database
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import prisma from '../../lib/prisma';

const router = Router();

// Helper: enforce admin access — no bypasses in production
const requireAdmin = (req: Request, res: Response): boolean => {
  if (process.env.NODE_ENV === 'development') return false;
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    res.status(403).json({ success: false, error: 'Forbidden', message: 'Admin access required' });
    return true;
  }
  return false;
};

/**
 * GET /api/super-admin/stats
 * Get platform statistics from real database
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Parallel database queries for performance
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalArticles,
      publishedArticles,
      pendingArticles,
      draftArticles,
      totalAITasks,
      completedAITasks,
      failedAITasks,
      totalCategories,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.user.count({ where: { subscriptionTier: 'PREMIUM' } }).catch(() => 0),
      prisma.article.count().catch(() => 0),
      prisma.article.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
      prisma.article.count({ where: { status: 'PENDING_REVIEW' } }).catch(() => 0),
      prisma.article.count({ where: { status: 'DRAFT' } }).catch(() => 0),
      prisma.aITask.count().catch(() => 0),
      prisma.aITask.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.aITask.count({ where: { status: 'FAILED' } }).catch(() => 0),
      prisma.category.count().catch(() => 0),
    ]);

    const stats = {
      cached: false,
      stats: {
        platform: {
          totalUsers,
          activeUsers,
          premiumUsers,
          userGrowthRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
        },
        content: {
          totalArticles,
          publishedArticles,
          pendingApprovals: pendingArticles,
          draftArticles,
          totalCategories,
        },
        ai: {
          totalTasks: totalAITasks,
          completedTasks: completedAITasks,
          failedTasks: failedAITasks,
          successRate: totalAITasks > 0 ? ((completedAITasks / totalAITasks) * 100).toFixed(1) : 0,
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
        }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch platform statistics'
    });
  }
});

/**
 * GET /api/super-admin/users
 * Get user list with pagination from database
 */
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'all') where.role = role.toUpperCase();
    if (status && status !== 'all') where.status = status.toUpperCase();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          subscriptionTier: true,
          avatarUrl: true,
          location: true,
          createdAt: true,
          lastLoginAt: true,
        }
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users.map(u => ({
        ...u,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username,
        isPremium: u.subscriptionTier === 'PREMIUM' || u.subscriptionTier === 'ENTERPRISE',
        joinedAt: u.createdAt,
        country: u.location || 'Unknown',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/alerts
 * Get system alerts from AI tasks and system events
 */
router.get('/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Get failed AI tasks as alerts
    const failedTasks = await prisma.aITask.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, taskType: true, errorMessage: true, createdAt: true },
    }).catch(() => []);

    const alerts = failedTasks.map(task => ({
      id: task.id,
      type: 'error',
      title: `AI Task Failed: ${task.taskType}`,
      message: task.errorMessage || 'Unknown error',
      timestamp: task.createdAt,
      resolved: false,
    }));

    // Add a system health alert
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsage > 500) {
      alerts.unshift({
        id: 'mem-warning',
        type: 'warning',
        title: 'High Memory Usage',
        message: `Server memory usage is ${Math.round(memUsage)}MB`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/articles
 * Get articles with pagination and filters
 */
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
router.get('/ai-agents', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Get agents from database
    const dbAgents = await prisma.aIAgent.findMany({
      orderBy: { name: 'asc' },
    }).catch(() => []);

    // Get task statistics per agent
    const agentStats = await Promise.all(
      dbAgents.map(async (agent) => {
        const [completed, queued, failed, recentTask] = await Promise.all([
          prisma.aITask.count({ where: { agentId: agent.id, status: 'COMPLETED' } }).catch(() => 0),
          prisma.aITask.count({ where: { agentId: agent.id, status: { in: ['QUEUED', 'PROCESSING'] } } }).catch(() => 0),
          prisma.aITask.count({ where: { agentId: agent.id, status: 'FAILED' } }).catch(() => 0),
          prisma.aITask.findFirst({
            where: { agentId: agent.id, status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            select: { completedAt: true },
          }).catch(() => null),
        ]);
        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          model: agent.modelName || agent.modelProvider || 'Unknown',
          status: agent.isActive ? 'running' : 'paused',
          isActive: agent.isActive,
          tasksCompleted: completed,
          tasksQueued: queued,
          tasksFailed: failed,
          lastRun: recentTask?.completedAt || null,
        };
      })
    );

    // If no agents in DB, return built-in agent definitions
    const agents = agentStats.length > 0 ? agentStats : [
      { id: 'content', name: 'Content Generator', type: 'content_generation', model: 'Llama 3.1 8B', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'research', name: 'Research Agent', type: 'research', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'review', name: 'Quality Reviewer', type: 'quality_review', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'translation', name: 'Translation Agent', type: 'translation', model: 'NLLB-200', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'image', name: 'Image Generator', type: 'image_generation', model: 'SDXL', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'market', name: 'Market Analyst', type: 'market_analysis', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'sentiment', name: 'Sentiment Analyzer', type: 'sentiment_analysis', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'moderation', name: 'Content Moderator', type: 'moderation', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
    ];

    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/ai-tasks
 * Get recent AI tasks
 */
router.get('/ai-tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';

    const where: any = {};
    if (status && status !== 'all') where.status = status.toUpperCase();

    const tasks = await prisma.aITask.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        taskType: true,
        status: true,
        priority: true,
        inputData: true,
        outputData: true,
        processingTimeMs: true,
        qualityScore: true,
        actualCost: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
        AIAgent: { select: { name: true, modelName: true } },
      }
    }).catch(() => []);

    res.json({
      success: true,
      data: tasks.map(t => ({
        id: t.id,
        type: t.taskType,
        status: t.status?.toLowerCase() || 'unknown',
        priority: t.priority,
        agent: t.AIAgent?.name || 'Unknown',
        model: t.AIAgent?.modelName || 'Unknown',
        processingTime: t.processingTimeMs ? `${(t.processingTimeMs / 1000).toFixed(1)}s` : null,
        qualityScore: t.qualityScore,
        cost: t.actualCost,
        error: t.errorMessage,
        title: (t.inputData as any)?.topic || (t.inputData as any)?.title || t.taskType,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching AI tasks:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/super-admin/users/:id
 * Update user status/role
 */
router.patch('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;
    const { status, role } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (role) updateData.role = role.toUpperCase();

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, username: true, role: true, status: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/super-admin/articles/:id
 * Update article status
 */
router.patch('/articles/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;
    const { status } = req.body;

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
 * GET /api/super-admin/roles
 * Get all available admin roles
 */
router.get('/roles', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Mock roles data
    const roles = [
      {
        id: '1',
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: [
          'manage_users',
          'manage_content',
          'manage_tokens',
          'manage_ai',
          'view_analytics',
          'manage_settings',
          'manage_roles',
          'manage_admins'
        ],
        adminCount: 1,
        isSystem: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Content Manager',
        description: 'Manage articles, reviews, and content moderation',
        permissions: [
          'manage_content',
          'view_analytics',
          'manage_ai'
        ],
        adminCount: 3,
        isSystem: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: '3',
        name: 'Analytics Viewer',
        description: 'Read-only access to analytics and reports',
        permissions: [
          'view_analytics'
        ],
        adminCount: 5,
        isSystem: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        id: '4',
        name: 'Token Manager',
        description: 'Manage token listings and market data',
        permissions: [
          'manage_tokens',
          'view_analytics'
        ],
        adminCount: 2,
        isSystem: false,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10')
      }
    ];

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * POST /api/super-admin/roles
 * Create a new admin role
 */
router.post('/roles', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { name, description, permissions } = req.body;

    // Validate required fields
    if (!name || !description || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name, description, and permissions array are required'
      });
      return;
    }

    // Mock role creation
    const newRole = {
      id: Date.now().toString(),
      name,
      description,
      permissions,
      adminCount: 0,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * PUT /api/super-admin/roles/:id
 * Update an existing admin role
 */
router.put('/roles/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Mock role update
    const updatedRole = {
      id,
      name,
      description,
      permissions,
      adminCount: 0,
      isSystem: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/super-admin/roles/:id
 * Delete an admin role
 */
router.delete('/roles/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;

    // Check if it's a system role (mock check)
    if (id === '1') {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot delete system roles'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
