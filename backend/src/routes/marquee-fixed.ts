import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import MarqueeService, { MarqueeData, MarqueeItemData, MarqueeTemplateData } from '../services/MarqueeService';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();
const marqueeService = new MarqueeService(prisma);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }
  next();
};

// Simple auth middleware (replace with real auth)
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // For demo purposes, we'll skip authentication
  // In production, verify JWT token here
  next();
};

const requireRole = (role: string) => (req: Request, res: Response, next: NextFunction) => {
  // For demo purposes, we'll skip role checking
  // In production, check user role here
  next();
};

// Validation schemas
const createMarqueeValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('type').isIn(['token', 'news', 'custom']).withMessage('Invalid type'),
  body('position').isIn(['header', 'footer', 'content']).withMessage('Invalid position'),
  body('priority').isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  body('isPublished').isBoolean().withMessage('isPublished must be boolean'),
];

const updateMarqueeValidation = [
  param('id').notEmpty().withMessage('Marquee ID is required'),
  body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
  body('type').optional().isIn(['token', 'news', 'custom']).withMessage('Invalid type'),
  body('position').optional().isIn(['header', 'footer', 'content']).withMessage('Invalid position'),
  body('priority').optional().isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be boolean'),
];

const createItemValidation = [
  param('marqueeId').notEmpty().withMessage('Marquee ID is required'),
  body('type').isIn(['token', 'news', 'custom', 'link']).withMessage('Invalid item type'),
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('isVisible').optional().isBoolean().withMessage('isVisible must be boolean'),
  body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
];

// PUBLIC ROUTES

// Get marquees by position
router.get('/', 
  query('position').optional().isIn(['header', 'footer', 'content']).withMessage('Invalid position'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { position } = req.query;
      const marquees = await marqueeService.getPublishedMarquees(position as string);
      
      return res.json({
        success: true,
        data: marquees
      });
    } catch (error) {
      console.error('Error fetching marquees:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch marquees'
      });
    }
  }
);

// Track click analytics
router.post('/:id/click',
  param('id').notEmpty().withMessage('Marquee ID is required'),
  body('itemId').optional().notEmpty().withMessage('Item ID cannot be empty'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { itemId } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Marquee ID is required'
        });
      }
      
      await marqueeService.trackClick(id, itemId);
      
      return res.json({
        success: true,
        message: 'Click tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking click:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to track click'
      });
    }
  }
);

// ADMIN ROUTES

// Get all marquees (admin)
router.get('/admin',
  authenticateUser,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const marquees = await marqueeService.getAllMarquees();
      
      return res.json({
        success: true,
        data: marquees
      });
    } catch (error) {
      console.error('Error fetching admin marquees:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch marquees'
      });
    }
  }
);

// Create marquee
router.post('/admin',
  authenticateUser,
  requireRole('admin'),
  createMarqueeValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const marqueeData: MarqueeData = req.body;
      const marquee = await marqueeService.createMarquee(marqueeData, 'admin-user-id');
      
      return res.status(201).json({
        success: true,
        data: marquee
      });
    } catch (error) {
      console.error('Error creating marquee:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create marquee'
      });
    }
  }
);

// Update marquee
router.put('/admin/:id',
  authenticateUser,
  requireRole('admin'),
  updateMarqueeValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const marqueeData: Partial<MarqueeData> = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Marquee ID is required'
        });
      }
      
      const marquee = await marqueeService.updateMarquee(id, marqueeData);
      
      return res.json({
        success: true,
        data: marquee
      });
    } catch (error) {
      console.error('Error updating marquee:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update marquee'
      });
    }
  }
);

// Delete marquee
router.delete('/admin/:id',
  authenticateUser,
  requireRole('admin'),
  param('id').notEmpty().withMessage('Marquee ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Marquee ID is required'
        });
      }
      
      await marqueeService.deleteMarquee(id);
      
      return res.json({
        success: true,
        message: 'Marquee deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting marquee:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete marquee'
      });
    }
  }
);

// ITEM MANAGEMENT ROUTES

// Get marquee items
router.get('/admin/:marqueeId/items',
  authenticateUser,
  requireRole('admin'),
  param('marqueeId').notEmpty().withMessage('Marquee ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { marqueeId } = req.params;
      
      if (!marqueeId) {
        return res.status(400).json({
          success: false,
          error: 'Marquee ID is required'
        });
      }
      
      const marquee = await marqueeService.getMarqueeById(marqueeId);
      
      return res.json({
        success: true,
        data: marquee?.items || []
      });
    } catch (error) {
      console.error('Error fetching marquee items:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch marquee items'
      });
    }
  }
);

// Add item to marquee
router.post('/admin/:marqueeId/items',
  authenticateUser,
  requireRole('admin'),
  createItemValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { marqueeId } = req.params;
      const itemData: MarqueeItemData = req.body;
      
      if (!marqueeId) {
        return res.status(400).json({
          success: false,
          error: 'Marquee ID is required'
        });
      }
      
      const item = await marqueeService.addMarqueeItem(marqueeId, itemData);
      
      return res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error adding marquee item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add marquee item'
      });
    }
  }
);

// Update marquee item
router.put('/admin/:marqueeId/items/:itemId',
  authenticateUser,
  requireRole('admin'),
  param('marqueeId').notEmpty().withMessage('Marquee ID is required'),
  param('itemId').notEmpty().withMessage('Item ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const itemData: Partial<MarqueeItemData> = req.body;
      
      if (!itemId) {
        return res.status(400).json({
          success: false,
          error: 'Item ID is required'
        });
      }
      
      const item = await marqueeService.updateMarqueeItem(itemId, itemData);
      
      return res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error updating marquee item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update marquee item'
      });
    }
  }
);

// Delete marquee item
router.delete('/admin/:marqueeId/items/:itemId',
  authenticateUser,
  requireRole('admin'),
  param('marqueeId').notEmpty().withMessage('Marquee ID is required'),
  param('itemId').notEmpty().withMessage('Item ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      
      if (!itemId) {
        return res.status(400).json({
          success: false,
          error: 'Item ID is required'
        });
      }
      
      await marqueeService.deleteMarqueeItem(itemId);
      
      return res.json({
        success: true,
        message: 'Marquee item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting marquee item:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete marquee item'
      });
    }
  }
);

// TEMPLATE ROUTES

// Get templates
router.get('/templates',
  async (req: Request, res: Response) => {
    try {
      const templates = await marqueeService.getTemplates();
      
      return res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  }
);

// Create template (admin only)
router.post('/admin/templates',
  authenticateUser,
  requireRole('admin'),
  body('name').notEmpty().trim().withMessage('Template name is required'),
  body('type').isIn(['token', 'news', 'custom']).withMessage('Invalid template type'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const templateData: MarqueeTemplateData = req.body;
      const template = await marqueeService.createTemplate(templateData);
      
      return res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  }
);

export default router;