/**
 * Content Automation API Routes
 * Task 62: AI-Driven Content Automation System
 */

import { Router, Request, Response } from 'express';
import contentAutomationService from '../services/contentAutomationService';

const router = Router();

// ===== Feed Source Management =====

router.post('/feeds', async (req: Request, res: Response) => {
  try {
    const feed = await contentAutomationService.createFeedSource(req.body);
    res.json({ success: true, data: feed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/feeds', async (req: Request, res: Response) => {
  try {
    const { type, category, isActive } = req.query;
    const feeds = await contentAutomationService.getFeedSources({
      type: type as string,
      category: category as string,
      isActive: isActive === 'true'
    });
    res.json({ success: true, data: feeds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/feeds/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Feed ID is required' });
      return;
    }
    const feed = await contentAutomationService.updateFeedSource(req.params.id, req.body);
    res.json({ success: true, data: feed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/feeds/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Feed ID is required' });
      return;
    }
    await contentAutomationService.deleteFeedSource(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Content Collection =====

router.post('/collect', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.body;
    const articles = await contentAutomationService.collectContentFromFeeds(limit);
    res.json({ success: true, data: articles, count: articles.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all automated articles
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const articles = await prisma.automatedArticle.findMany({
      include: {
        feedSource: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    await prisma.$disconnect();
    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Content Processing =====

router.post('/articles/:id/rewrite', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const result = await contentAutomationService.rewriteContent(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/articles/:id/optimize', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const result = await contentAutomationService.optimizeHeadline(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/articles/:id/categorize', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const result = await contentAutomationService.categorizeContent(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/articles/:id/translate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const { languages } = req.body;
    const result = await contentAutomationService.translateContent(req.params.id, languages);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/articles/:id/process', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const result = await contentAutomationService.processArticlePipeline(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/batch-process', async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.body;
    const result = await contentAutomationService.processBatch(limit);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Approval & Publishing =====

router.post('/articles/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const { approvedById } = req.body;
    const result = await contentAutomationService.approveArticle(req.params.id, approvedById);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/articles/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const { reason } = req.body;
    const result = await contentAutomationService.rejectArticle(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/articles/:id/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, error: 'Article ID is required' });
      return;
    }
    const { authorId } = req.body;
    const result = await contentAutomationService.publishArticle(req.params.id, authorId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Settings =====

router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await contentAutomationService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await contentAutomationService.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Statistics =====

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { timeRange = 'day' } = req.query;
    const stats = await contentAutomationService.getStats(timeRange as any);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
