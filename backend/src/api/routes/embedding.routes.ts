/**
 * Semantic Embedding & Vector Index Routes
 * Task 72: API endpoints for vector search and entity recognition
 */

import express from 'express';
import * as embeddingService from '../../services/embeddingService';
import { authMiddleware, requireRole } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/embedding/stats
 * Get embedding statistics
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await embeddingService.getEmbeddingStats();
    return res.json(stats);
  } catch (error: any) {
    console.error('Error getting embedding stats:', error);
    return res.status(500).json({ error: 'Failed to get embedding stats' });
  }
});

/**
 * POST /api/embedding/process-article
 * Process article for embeddings and entity recognition
 */
router.post('/process-article', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    const result = await embeddingService.processArticleForEmbedding(articleId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing article:', error);
    return res.status(500).json({ error: error.message || 'Failed to process article' });
  }
});

/**
 * POST /api/embedding/process-queue
 * Process embedding update queue
 */
router.post('/process-queue', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.body;

    const result = await embeddingService.processEmbeddingQueue(limit);
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing queue:', error);
    return res.status(500).json({ error: 'Failed to process queue' });
  }
});

/**
 * POST /api/embedding/search
 * Hybrid search endpoint
 */
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      contentTypes,
      limit = 10,
      keywordWeight = 0.5,
      vectorWeight = 0.5,
      filters,
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await embeddingService.hybridSearch({
      query,
      contentTypes,
      limit,
      keywordWeight,
      vectorWeight,
      filters,
    });

    return res.json(results);
  } catch (error: any) {
    console.error('Error in hybrid search:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/embedding/entities
 * Search entities
 */
router.get('/entities', async (req, res) => {
  try {
    const { query, type, limit = 20 } = req.query;

    const entities = await embeddingService.searchEntities(
      query as string,
      type as string,
      parseInt(limit as string)
    );

    return res.json({ entities, total: entities.length });
  } catch (error: any) {
    console.error('Error searching entities:', error);
    return res.status(500).json({ error: 'Failed to search entities' });
  }
});

/**
 * GET /api/embedding/entities/:id
 * Get entity by ID
 */
router.get('/entities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const entity = await embeddingService.getEntity(id);

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    return res.json(entity);
  } catch (error: any) {
    console.error('Error getting entity:', error);
    return res.status(500).json({ error: 'Failed to get entity' });
  }
});

/**
 * POST /api/embedding/rebuild-index
 * Rebuild vector index
 */
router.post('/rebuild-index', authMiddleware, requireRole(['super_admin']), async (req, res) => {
  try {
    const result = await embeddingService.rebuildIndex();
    return res.json(result);
  } catch (error: any) {
    console.error('Error rebuilding index:', error);
    return res.status(500).json({ error: 'Failed to rebuild index' });
  }
});

/**
 * GET /api/embedding/search-analytics
 * Get search analytics
 */
router.get('/search-analytics', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const analytics = await embeddingService.getSearchAnalytics(parseInt(days as string));
    return res.json(analytics);
  } catch (error: any) {
    console.error('Error getting search analytics:', error);
    return res.status(500).json({ error: 'Failed to get search analytics' });
  }
});

export default router;
