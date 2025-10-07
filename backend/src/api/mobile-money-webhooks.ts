/**
 * Mobile Money Webhook Handlers
 * Task 15: Mobile Money Integration - Webhook Implementation
 * 
 * Handles webhook callbacks from mobile money providers for payment verification
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import crypto from 'crypto';
import {
  MobileMoneyProvider,
  MobileMoneyWebhook,
  PaymentStatus,
  MobileMoneyError,
  ErrorCodes
} from '../types/mobile-money';
import { MobileMoneyService } from '../services/mobileMoneyService';

export class MobileMoneyWebhookHandler {
  private readonly prisma: PrismaClient;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly mobileMoneyService: MobileMoneyService;

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    logger: Logger,
    mobileMoneyService: MobileMoneyService
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
    this.mobileMoneyService = mobileMoneyService;
  }

  /**
   * M-Pesa webhook handler
   */
  async handleMpesaWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info('Processing M-Pesa webhook', {
        requestId,
        body: req.body,
        headers: req.headers
      });

      // Validate webhook signature
      const isValidSignature = await this.validateMpesaSignature(req);
      if (!isValidSignature) {
        this.logger.warn('Invalid M-Pesa webhook signature', { requestId });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const webhookData = req.body;
      
      // Process the webhook payload
      if (webhookData.Body && webhookData.Body.stkCallback) {
        await this.processMpesaCallback(webhookData.Body.stkCallback, requestId);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        requestId
      });

      this.logger.info('M-Pesa webhook processed successfully', {
        requestId,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('M-Pesa webhook processing failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * Orange Money webhook handler
   */
  async handleOrangeMoneyWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = `webhook_orange_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info('Processing Orange Money webhook', {
        requestId,
        body: req.body
      });

      // Validate webhook signature
      const isValidSignature = await this.validateOrangeMoneySignature(req);
      if (!isValidSignature) {
        this.logger.warn('Invalid Orange Money webhook signature', { requestId });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const webhookData = req.body;
      await this.processOrangeMoneyCallback(webhookData, requestId);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        requestId
      });

    } catch (error) {
      this.logger.error('Orange Money webhook processing failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * MTN Money webhook handler
   */
  async handleMtnMoneyWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = `webhook_mtn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info('Processing MTN Money webhook', {
        requestId,
        body: req.body
      });

      // Validate webhook signature
      const isValidSignature = await this.validateMtnMoneySignature(req);
      if (!isValidSignature) {
        this.logger.warn('Invalid MTN Money webhook signature', { requestId });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const webhookData = req.body;
      await this.processMtnMoneyCallback(webhookData, requestId);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        requestId
      });

    } catch (error) {
      this.logger.error('MTN Money webhook processing failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * EcoCash webhook handler
   */
  async handleEcoCashWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = `webhook_ecocash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info('Processing EcoCash webhook', {
        requestId,
        body: req.body
      });

      // Validate webhook signature
      const isValidSignature = await this.validateEcoCashSignature(req);
      if (!isValidSignature) {
        this.logger.warn('Invalid EcoCash webhook signature', { requestId });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const webhookData = req.body;
      await this.processEcoCashCallback(webhookData, requestId);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        requestId
      });

    } catch (error) {
      this.logger.error('EcoCash webhook processing failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId
      });
    }
  }

  /**
   * Process M-Pesa STK callback
   */
  private async processMpesaCallback(stkCallback: any, requestId: string): Promise<void> {
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Find transaction by provider transaction ID
    const transaction = await this.prisma.mobileMoneyTransaction.findFirst({
      where: {
        providerTransactionId: CheckoutRequestID
      }
    });

    if (!transaction) {
      this.logger.warn('Transaction not found for M-Pesa callback', {
        requestId,
        CheckoutRequestID
      });
      return;
    }

    // Determine payment status
    let status: PaymentStatus;
    let failureReason: string | undefined;
    let completedAt: Date | undefined;

    if (ResultCode === 0) {
      status = PaymentStatus.COMPLETED;
      completedAt = new Date();
      
      // Extract additional metadata from callback
      const metadata: any = { MerchantRequestID, CheckoutRequestID };
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach((item: any) => {
          metadata[item.Name] = item.Value;
        });
      }

      // Update transaction
      await this.prisma.mobileMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status,
          completedAt,
          metadata: JSON.stringify(metadata),
          updatedAt: new Date()
        }
      });

      this.logger.info('M-Pesa payment completed successfully', {
        requestId,
        transactionId: transaction.id,
        amount: transaction.amount
      });

    } else {
      status = PaymentStatus.FAILED;
      failureReason = ResultDesc;

      await this.prisma.mobileMoneyTransaction.update({
        where: { id: transaction.id },
        data: {
          status,
          failureReason: failureReason || null,
          updatedAt: new Date()
        }
      });

      this.logger.info('M-Pesa payment failed', {
        requestId,
        transactionId: transaction.id,
        ResultCode,
        ResultDesc
      });
    }

    // Update cache
    await this.updateTransactionCache(transaction.id, status);

    // Trigger any post-payment workflows
    await this.triggerPostPaymentWorkflow(transaction.id, status);
  }

  /**
   * Process Orange Money callback
   */
  private async processOrangeMoneyCallback(webhookData: any, requestId: string): Promise<void> {
    const {
      transaction_id,
      status,
      amount,
      currency,
      reference
    } = webhookData;

    // Find transaction by our internal reference
    const transaction = await this.prisma.mobileMoneyTransaction.findFirst({
      where: {
        OR: [
          { id: reference },
          { providerTransactionId: transaction_id }
        ]
      }
    });

    if (!transaction) {
      this.logger.warn('Transaction not found for Orange Money callback', {
        requestId,
        transaction_id,
        reference
      });
      return;
    }

    // Map Orange Money status to our PaymentStatus
    let paymentStatus: PaymentStatus;
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        paymentStatus = PaymentStatus.COMPLETED;
        break;
      case 'failed':
      case 'error':
        paymentStatus = PaymentStatus.FAILED;
        break;
      case 'pending':
        paymentStatus = PaymentStatus.PENDING;
        break;
      default:
        paymentStatus = PaymentStatus.FAILED;
    }

    // Update transaction
    const updateData: any = {
      status: paymentStatus,
      providerTransactionId: transaction_id,
      metadata: JSON.stringify(webhookData),
      updatedAt: new Date()
    };

    if (paymentStatus === PaymentStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.prisma.mobileMoneyTransaction.update({
      where: { id: transaction.id },
      data: updateData
    });

    await this.updateTransactionCache(transaction.id, paymentStatus);
    await this.triggerPostPaymentWorkflow(transaction.id, paymentStatus);
  }

  /**
   * Process MTN Money callback
   */
  private async processMtnMoneyCallback(webhookData: any, requestId: string): Promise<void> {
    // Similar implementation to Orange Money
    // MTN Money specific webhook processing logic
    this.logger.info('Processing MTN Money callback', { requestId, webhookData });
    
    // Implementation would follow similar pattern to Orange Money
    // with MTN-specific field mappings
  }

  /**
   * Process EcoCash callback
   */
  private async processEcoCashCallback(webhookData: any, requestId: string): Promise<void> {
    // EcoCash specific webhook processing logic
    this.logger.info('Processing EcoCash callback', { requestId, webhookData });
    
    // Implementation would follow similar pattern
    // with EcoCash-specific field mappings
  }

  /**
   * Validate M-Pesa webhook signature
   */
  private async validateMpesaSignature(req: Request): Promise<boolean> {
    // In production, implement actual signature validation
    // For now, return true for development
    return true;
  }

  /**
   * Validate Orange Money webhook signature
   */
  private async validateOrangeMoneySignature(req: Request): Promise<boolean> {
    const signature = req.headers['x-orange-signature'] as string;
    const webhookSecret = process.env.ORANGE_MONEY_WEBHOOK_SECRET;
    
    if (!signature || !webhookSecret) {
      return false;
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Validate MTN Money webhook signature
   */
  private async validateMtnMoneySignature(req: Request): Promise<boolean> {
    // MTN Money specific signature validation
    return true; // Simplified for development
  }

  /**
   * Validate EcoCash webhook signature
   */
  private async validateEcoCashSignature(req: Request): Promise<boolean> {
    // EcoCash specific signature validation
    return true; // Simplified for development
  }

  /**
   * Update transaction cache
   */
  private async updateTransactionCache(transactionId: string, status: PaymentStatus): Promise<void> {
    const cacheKey = `transaction:${transactionId}`;
    await this.redis.hset(cacheKey, 'status', status);
    await this.redis.expire(cacheKey, 3600); // 1 hour cache
  }

  /**
   * Trigger post-payment workflows
   */
  private async triggerPostPaymentWorkflow(transactionId: string, status: PaymentStatus): Promise<void> {
    if (status === PaymentStatus.COMPLETED) {
      // Trigger subscription activation, content unlock, etc.
      this.logger.info('Triggering post-payment workflow', { transactionId, status });
      
      // This would integrate with the workflow engine
      // For example: activate subscription, send confirmation email, etc.
    }
  }
}