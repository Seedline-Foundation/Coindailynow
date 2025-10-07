/**
 * CDN API Routes - Simplified and Fixed Version
 * Implements CDN optimization endpoints for image processing and caching
 */

import { Router, Request, Response } from 'express';
import { CDNService } from '../services/cdn.service';
import { ImageOptimizationService, ImageProcessingOptions } from '../services/image-optimization.service';
import { Redis } from 'ioredis';
import axios from 'axios';
import { performance } from 'perf_hooks';

const multer = require('multer');

interface OptimizeQuery {
  url?: string;
  w?: string;
  h?: string;
  q?: string;
  f?: 'webp' | 'avif' | 'jpeg' | 'png';
  progressive?: string;
  blur?: string;
  grayscale?: string;
}

interface MulterRequest extends Request {
  file?: any;
  body: any;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function createCDNRoutes(cdnService: CDNService, imageService: ImageOptimizationService, redis: Redis): Router {
  const router = Router();

  /**
   * GET /api/cdn/optimize - Image optimization endpoint
   */
  router.get('/optimize', async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = performance.now();
      const query = req.query as OptimizeQuery;
      
      if (!query.url) {
        res.status(400).json({ error: 'Missing required parameter: url' });
        return;
      }

      // Download original image
      const imageResponse = await axios.get(query.url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data);

      // Parse optimization options
      const options: ImageProcessingOptions = {
        quality: query.q ? parseInt(query.q) : 80,
        format: query.f || 'webp',
        progressive: query.progressive === 'true',
        grayscale: query.grayscale === 'true'
      };

      if (query.w) options.width = parseInt(query.w);
      if (query.h) options.height = parseInt(query.h);
      if (query.blur) options.blur = parseFloat(query.blur);

      // Optimize image
      const optimized = await imageService.optimizeImage(imageBuffer, options);

      // Set cache headers
      const cacheHeaders = await cdnService.setIntelligentCacheHeaders(
        query.url,
        `image/${optimized.metadata.format}`,
        new Date()
      );

      Object.entries(cacheHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.setHeader('Content-Type', `image/${optimized.metadata.format}`);
      res.setHeader('X-Processing-Time', `${(performance.now() - startTime).toFixed(2)}ms`);
      res.send(optimized.buffer);

    } catch (error) {
      console.error('Image optimization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to optimize image',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  /**
   * GET /api/cdn/optimized/:cacheKey - Serve cached images
   */
  router.get('/optimized/:cacheKey', async (req: Request, res: Response): Promise<void> => {
    try {
      const { cacheKey } = req.params;
      
      const cached = await redis.hgetall(`image:cache:${cacheKey}`);
      if (!cached || !cached.buffer || !cached.metadata) {
        res.status(404).json({ error: 'Image not found in cache' });
        return;
      }

      const buffer = Buffer.from(cached.buffer, 'base64');
      const metadata = JSON.parse(cached.metadata);

      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', `image/${metadata.format}`);
      res.setHeader('X-Cache', 'HIT');
      res.send(buffer);

    } catch (error) {
      console.error('Cached image serving error:', error);
      res.status(500).json({ error: 'Failed to serve cached image' });
    }
  });

  /**
   * POST /api/cdn/upload - Upload and optimize images
   */
  router.post('/upload', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
    try {
      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const options: ImageProcessingOptions = {
        quality: multerReq.body.quality ? parseInt(multerReq.body.quality) : 80,
        format: multerReq.body.format || 'webp',
        progressive: multerReq.body.progressive === 'true'
      };

      if (multerReq.body.width) options.width = parseInt(multerReq.body.width);
      if (multerReq.body.height) options.height = parseInt(multerReq.body.height);

      const optimized = await imageService.optimizeImage(multerReq.file.buffer, options);

      res.json({
        success: true,
        data: {
          cacheKey: optimized.cacheKey,
          url: `/api/cdn/optimized/${optimized.cacheKey}`,
          metadata: optimized.metadata
        }
      });

    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to upload and optimize image',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  /**
   * POST /api/cdn/purge - Cache purging
   */
  router.post('/purge', async (req: Request, res: Response) => {
    try {
      const { urls, purgeAll } = req.body;

      if (purgeAll) {
        await cdnService.purgeCache();
        res.json({ success: true, message: 'All cache purged successfully' });
      } else if (urls && Array.isArray(urls)) {
        await cdnService.purgeCache(urls);
        res.json({ success: true, message: `${urls.length} URLs purged successfully` });
      } else {
        res.status(400).json({ error: 'Invalid purge request' });
      }
    } catch (error) {
      console.error('Cache purge error:', error);
      res.status(500).json({ error: 'Failed to purge cache' });
    }
  });

  /**
   * GET /api/cdn/health - Health check endpoint
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const startTime = performance.now();
      const testImageBuffer = Buffer.alloc(1024 * 100); // 100KB test
      
      await imageService.optimizeImage(testImageBuffer, { format: 'webp', quality: 80 });
      const processingTime = performance.now() - startTime;
      const cacheStats = await imageService.getCacheStats();

      const health = {
        status: 'healthy',
        checks: {
          imageProcessing: {
            status: processingTime < 1000 ? 'healthy' : 'degraded',
            responseTime: `${processingTime.toFixed(2)}ms`
          },
          cache: {
            status: cacheStats.hitRate > 0.7 ? 'healthy' : 'degraded',
            hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`
          }
        }
      };

      res.json({ success: true, data: health });
    } catch (error) {
      res.status(500).json({ success: false, data: { status: 'unhealthy' } });
    }
  });

  return router;
}