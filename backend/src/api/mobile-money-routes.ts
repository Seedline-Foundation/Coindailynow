/**
 * Mobile Money REST API Routes
 * Task 15: Mobile Money Integration - REST API Implementation
 * 
 * RESTful API endpoints for mobile money operations and webhooks
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import { MobileMoneyService } from '../services/mobileMoneyService';
import { MobileMoneyWebhookHandler } from './mobile-money-webhooks';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { ComplianceService } from '../services/compliance.service';
import { authMiddleware } from '../middleware/auth';
import {
  MobileMoneyProvider,
  PaymentRequest,
  TransactionType,
  PaymentStatus
} from '../types/mobile-money';

export function createMobileMoneyRoutes(
  prisma: PrismaClient,
  redis: Redis,
  logger: Logger
): Router {
  const router = Router();
  
  // Initialize services
  const fraudDetectionService = new FraudDetectionService(prisma, redis, logger);
  const complianceService = new ComplianceService(prisma, logger);
  const mobileMoneyService = new MobileMoneyService(
    prisma,
    redis,
    logger,
    fraudDetectionService,
    complianceService
  );
  const webhookHandler = new MobileMoneyWebhookHandler(
    prisma,
    redis,
    logger,
    mobileMoneyService
  );

  // ========== Public Endpoints (No Auth Required) ==========

  /**
   * Get available mobile money providers by country
   * GET /api/mobile-money/providers?country=KE
   */
  router.get('/providers', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const country = req.query.country as string;
      
      logger.info('Fetching mobile money providers', { requestId, country });

      const result = await mobileMoneyService.getAvailableProviders(country);

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.code || 'FETCH_FAILED',
          message: result.error?.message || 'Failed to fetch providers',
          requestId
        });
      }

      return res.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          requestId
        }
      });

    } catch (error) {
      logger.error('Provider fetch failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      });
    }
  });

  /**
   * Get provider information and limits
   * GET /api/mobile-money/providers/MPESA
   */
  router.get('/providers/:provider', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const provider = req.params.provider as MobileMoneyProvider;
      
      logger.info('Fetching provider info', { requestId, provider });

      const result = await mobileMoneyService.getProviderInfo(provider);

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.code || 'FETCH_FAILED',
          message: result.error?.message || 'Failed to fetch provider info',
          requestId
        });
      }

      return res.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          requestId
        }
      });

    } catch (error) {
      logger.error('Provider info fetch failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      });
    }
  });

  // ========== Authenticated Endpoints ==========

  /**
   * Initiate mobile money payment
   * POST /api/mobile-money/payments
   */
  router.post('/payments', authMiddleware, async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'User authentication required',
          requestId
        });
      }

      const {
        provider,
        amount,
        currency,
        phoneNumber,
        description,
        transactionType,
        subscriptionId,
        callbackUrl
      } = req.body;

      logger.info('Initiating mobile money payment', {
        requestId,
        userId,
        provider,
        amount,
        transactionType
      });

      // Create payment request
      const paymentRequest: PaymentRequest = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        provider,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || 'KES',
        phoneNumber,
        description: description || 'CoinDaily Payment',
        transactionType: transactionType || TransactionType.PREMIUM_CONTENT,
        subscriptionId,
        callbackUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      };

      const result = await mobileMoneyService.initiatePayment(paymentRequest);

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.code || 'PAYMENT_FAILED',
          message: result.error?.message || 'Payment initiation failed',
          requestId
        });
      }

      return res.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          requestId
        }
      });

    } catch (error) {
      logger.error('Payment initiation failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      });
    }
  });

  /**
   * Verify payment status
   * GET /api/mobile-money/payments/:transactionId/verify
   */
  router.get('/payments/:transactionId/verify', authMiddleware, async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { transactionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'User authentication required',
          requestId
        });
      }

      if (!transactionId) {
        return res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Transaction ID is required',
          requestId
        });
      }

      logger.info('Verifying payment status', { requestId, transactionId, userId });

      const result = await mobileMoneyService.verifyPayment(transactionId, userId);

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.code || 'VERIFICATION_FAILED',
          message: result.error?.message || 'Payment verification failed',
          requestId
        });
      }

      return res.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          requestId
        }
      });

    } catch (error) {
      logger.error('Payment verification failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      });
    }
  });

  /**
   * Get user transaction history
   * GET /api/mobile-money/transactions?page=1&limit=20
   */
  router.get('/transactions', authMiddleware, async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'User authentication required',
          requestId
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const status = req.query.status as PaymentStatus | undefined;
      const provider = req.query.provider as MobileMoneyProvider | undefined;

      logger.info('Fetching user transactions', {
        requestId,
        userId,
        page,
        limit,
        status,
        provider
      });

      const result = await mobileMoneyService.getUserTransactions(
        userId,
        { 
          page, 
          limit, 
          ...(status && { status: status as string }),
          ...(provider && { provider })
        }
      );

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.code || 'FETCH_FAILED',
          message: result.error?.message || 'Failed to fetch transactions',
          requestId
        });
      }

      return res.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          requestId
        }
      });

    } catch (error) {
      logger.error('Transaction fetch failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      });
    }
  });

  // ========== Webhook Endpoints (No Auth Required) ==========

  /**
   * M-Pesa STK Push Callback
   * POST /api/mobile-money/webhooks/mpesa
   */
  router.post('/webhooks/mpesa', async (req: Request, res: Response) => {
    await webhookHandler.handleMpesaWebhook(req, res);
  });

  /**
   * Orange Money Callback
   * POST /api/mobile-money/webhooks/orange-money
   */
  router.post('/webhooks/orange-money', async (req: Request, res: Response) => {
    await webhookHandler.handleOrangeMoneyWebhook(req, res);
  });

  /**
   * MTN Money Callback
   * POST /api/mobile-money/webhooks/mtn-money
   */
  router.post('/webhooks/mtn-money', async (req: Request, res: Response) => {
    await webhookHandler.handleMtnMoneyWebhook(req, res);
  });

  /**
   * EcoCash Callback
   * POST /api/mobile-money/webhooks/ecocash
   */
  router.post('/webhooks/ecocash', async (req: Request, res: Response) => {
    await webhookHandler.handleEcoCashWebhook(req, res);
  });

  // ========== Admin Endpoints ==========

  /**
   * Get payment analytics
   * GET /api/mobile-money/admin/analytics?timeframe=7d
   */
  router.get('/admin/analytics', authMiddleware, async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check admin permissions - use subscriptionTier or implement proper role checking
      if (req.user?.subscriptionTier !== 'PREMIUM' && req.user?.subscriptionTier !== 'ADMIN') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Admin access required',
          requestId
        });
      }

      const timeframe = req.query.timeframe as string || '7d';
      const provider = req.query.provider as MobileMoneyProvider | undefined;

      // Parse timeframe to dates
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      logger.info('Fetching payment analytics', {
        requestId,
        startDate,
        endDate,
        provider,
        adminId: req.user?.id
      });

      const result = await mobileMoneyService.getPaymentAnalytics({
        startDate,
        endDate,
        ...(provider && { provider })
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.error?.code || 'ANALYTICS_FAILED',
          message: result.error?.message || 'Failed to fetch analytics',
          requestId
        });
      }

      return res.json({
        success: true,
        data: result.data,
        metadata: {
          processingTime: Date.now() - startTime,
          requestId
        }
      });

    } catch (error) {
      logger.error('Analytics fetch failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId
      });
    }
  });

  return router;
}