/**
 * Image Optimization API Routes - Task 81
 * RESTful endpoints for image optimization system
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { createImageOptimizationService } from '../services/imageOptimizationService';
import { Redis } from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const imageService = createImageOptimizationService(redis);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, AVIF, and SVG are allowed.'));
    }
  },
});

/**
 * GET /api/image-optimization/statistics
 * Get overall optimization statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await imageService.getStatistics();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/image-optimization/optimize
 * Optimize a single image
 */
router.post('/optimize', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const options: any = {
      quality: parseInt(req.body.quality) || 80,
      generateThumbnails: req.body.generateThumbnails !== 'false',
      preserveMetadata: req.body.preserveMetadata === 'true',
      smartCrop: req.body.smartCrop === 'true',
    };
    
    // Only add optional properties if they have values
    if (req.body.width) options.width = parseInt(req.body.width);
    if (req.body.height) options.height = parseInt(req.body.height);
    if (req.body.format) options.format = req.body.format;
    if (req.body.watermarkId) {
      options.watermark = {
        watermarkId: req.body.watermarkId,
        position: req.body.watermarkPosition,
      };
      if (req.body.watermarkOpacity) {
        options.watermark.opacity = parseFloat(req.body.watermarkOpacity);
      }
    }

    // Save file temporarily
    const tempPath = `/tmp/${Date.now()}_${req.file.originalname}`;
    const fs = require('fs').promises;
    await fs.writeFile(tempPath, req.file.buffer);

    const result = await imageService.optimizeImage(tempPath, options);

    // Clean up temp file
    await fs.unlink(tempPath);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Optimization error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/image-optimization/batch
 * Start batch optimization
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { name, description, imagePaths, options } = req.body;

    if (!name || !imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch configuration',
      });
    }

    const batchId = await imageService.batchOptimizeImages({
      name,
      description,
      imagePaths,
      options: options || {},
    });

    return res.json({
      success: true,
      data: { batchId },
    });
  } catch (error: any) {
    console.error('Batch creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/image-optimization/batch/:batchId
 * Get batch status and progress
 */
router.get('/batch/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    
    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: 'Batch ID is required',
      });
    }
    
    const batch = await prisma.imageBatch.findUnique({
      where: { id: batchId },
      include: {
        Images: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    return res.json({
      success: true,
      data: batch,
    });
  } catch (error: any) {
    console.error('Batch retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/image-optimization/batches
 * Get all batches
 */
router.get('/batches', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      prisma.imageBatch.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { Images: true },
          },
        },
      }),
      prisma.imageBatch.count(),
    ]);

    res.json({
      success: true,
      data: {
        batches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Batches retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/image-optimization/images
 * Get optimized images
 */
router.get('/images', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where = status ? { status } : {};

    const [images, total] = await Promise.all([
      prisma.optimizedImage.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.optimizedImage.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Images retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/image-optimization/formats
 * Get format statistics
 */
router.get('/formats', async (req: Request, res: Response) => {
  try {
    const formats = await prisma.imageFormat.findMany({
      orderBy: { usageCount: 'desc' },
    });

    res.json({
      success: true,
      data: formats,
    });
  } catch (error: any) {
    console.error('Formats retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/image-optimization/watermarks
 * Get all watermarks
 */
router.get('/watermarks', async (req: Request, res: Response) => {
  try {
    const watermarks = await prisma.imageWatermark.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
    });

    res.json({
      success: true,
      data: watermarks,
    });
  } catch (error: any) {
    console.error('Watermarks retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/image-optimization/watermarks
 * Create a new watermark
 */
router.post('/watermarks', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No watermark image provided',
      });
    }

    const { name, position, opacity, scale } = req.body;

    // Save watermark file
    const fs = require('fs').promises;
    const watermarkPath = `/uploads/watermarks/${Date.now()}_${req.file.originalname}`;
    await fs.writeFile(watermarkPath, req.file.buffer);

    const watermark = await prisma.imageWatermark.create({
      data: {
        name,
        imagePath: watermarkPath,
        defaultPosition: position || 'bottom-right',
        defaultOpacity: opacity ? parseFloat(opacity) : 0.3,
        defaultScale: scale ? parseFloat(scale) : 0.1,
        isActive: true,
      },
    });

    return res.json({
      success: true,
      data: watermark,
    });
  } catch (error: any) {
    console.error('Watermark creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/image-optimization/metrics/daily
 * Get daily metrics
 */
router.get('/metrics/daily', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await prisma.imageOptimizationMetrics.findMany({
      where: {
        metricDate: {
          gte: startDate,
        },
      },
      orderBy: { metricDate: 'asc' },
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
