/**
 * Payment Widget Callback Routes
 * 
 * Handles webhooks from:
 * - YellowCard (African markets)
 * - ChangeNOW (International markets)
 * 
 * Features:
 * - Webhook signature verification
 * - Atomic wallet balance updates
 * - Real-time notifications
 * - Comprehensive audit logging
 */

import express, { Request, Response } from 'express';
import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import crypto from 'crypto';
import { Redis } from 'ioredis';

const router = express.Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify YellowCard webhook signature
 */
function verifyYellowCardSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Verify ChangeNOW webhook signature
 */
function verifyChangeNOWSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send real-time notification to user via WebSocket
 */
async function notifyUser(
  userId: string,
  type: 'deposit' | 'swap',
  data: any
): Promise<void> {
  try {
    await redis.publish(
      `user:${userId}:notifications`,
      JSON.stringify({
        type: type === 'deposit' ? 'DEPOSIT_CONFIRMED' : 'SWAP_COMPLETED',
        title: type === 'deposit' ? 'Deposit Confirmed' : 'Swap Completed',
        message:
          type === 'deposit'
            ? `Your deposit of ${data.amount} JY has been confirmed`
            : `Your swap has been completed. Transaction: ${data.txHash}`,
        data,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// ============================================================================
// YELLOWCARD DEPOSIT CALLBACK
// ============================================================================

/**
 * POST /api/wallet/deposit/callback
 * 
 * Handles deposit confirmations from YellowCard
 */
router.post('/deposit/callback', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-yellowcard-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const webhookSecret = process.env.YELLOWCARD_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('YELLOWCARD_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook configuration error' });
    }

    const isValid = verifyYellowCardSignature(payload, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid YellowCard webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Extract deposit data
    const {
      transaction_id,
      user_id,
      wallet_id,
      amount,
      currency,
      status,
      tx_hash,
      metadata,
    } = req.body;

    // Only process completed deposits
    if (status !== 'completed') {
      return res.status(200).json({ message: 'Status acknowledged' });
    }

    // Update wallet balance and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Find wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: wallet_id },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Add JY tokens to wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet_id },
        data: {
          joyTokens: { increment: parseFloat(amount) },
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          toWalletId: wallet_id, // Deposit: money going into wallet
          transactionType: TransactionType.DEPOSIT,
          operationType: 'DEPOSIT_YELLOWCARD',
          amount: parseFloat(amount),
          currency: 'JY',
          netAmount: parseFloat(amount),
          purpose: 'DEPOSIT',
          status: TransactionStatus.COMPLETED,
          description: `Deposit via YellowCard: ${amount} ${currency}`,
          blockchainTxHash: tx_hash,
          metadata: JSON.stringify({
            provider: 'YellowCard',
            externalTransactionId: transaction_id,
            originalCurrency: currency,
            ...metadata,
          }),
          initiatedAt: new Date(),
          processedAt: new Date(),
          completedAt: new Date(),
          transactionHash: `yellowcard_${transaction_id}`,
        },
      });

      // Create audit log
      await tx.auditEvent.create({
        data: {
          userId: user_id,
          type: 'WALLET_OPERATION',
          action: 'DEPOSIT_CONFIRMED',
          details: `YellowCard deposit confirmed: ${amount} JY (txHash: ${tx_hash}, transactionId: ${transaction.id})`,
        },
      });

      return { transaction, updatedWallet };
    });

    // Send notification to user
    await notifyUser(user_id, 'deposit', {
      amount,
      currency: 'JY',
      txHash: tx_hash,
      provider: 'YellowCard',
    });

    // Publish wallet update event
    await redis.publish(
      'wallet:updates',
      JSON.stringify({
        walletId: wallet_id,
        userId: user_id,
        type: 'deposit',
        amount,
        provider: 'YellowCard',
      })
    );

    console.log(`YellowCard deposit confirmed: ${amount} JY for user ${user_id}`);

    return res.status(200).json({
      success: true,
      message: 'Deposit processed successfully',
      transactionId: result.transaction.id,
    });
  } catch (error: any) {
    console.error('YellowCard deposit callback error:', error);
    return res.status(500).json({
      error: 'Failed to process deposit',
      details: error.message,
    });
  }
});

// ============================================================================
// CHANGENOW SWAP CALLBACK
// ============================================================================

/**
 * POST /api/wallet/swap/callback
 * 
 * Handles swap confirmations from ChangeNOW
 */
router.post('/swap/callback', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-changenow-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const webhookSecret = process.env.CHANGENOW_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CHANGENOW_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook configuration error' });
    }

    const isValid = verifyChangeNOWSignature(payload, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid ChangeNOW webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Extract swap data
    const {
      id: exchangeId,
      user_id,
      wallet_id,
      fromAmount,
      fromCurrency,
      toAmount,
      toCurrency,
      status,
      payoutHash,
      metadata,
    } = req.body;

    // Only process finished swaps
    if (status !== 'finished') {
      return res.status(200).json({ message: 'Status acknowledged' });
    }

    // Determine swap direction
    const swapDirection = toCurrency === 'JY' ? 'FIAT_TO_JY' : 'JY_TO_FIAT';

    // Update wallet balance and create/update transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Find wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: wallet_id },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update wallet balance based on swap direction
      let updatedWallet;
      if (swapDirection === 'FIAT_TO_JY') {
        // Add JY tokens (user bought JY with fiat)
        updatedWallet = await tx.wallet.update({
          where: { id: wallet_id },
          data: {
            joyTokens: { increment: parseFloat(toAmount) },
          },
        });
      } else {
        // JY_TO_FIAT - JY already deducted when swap was initiated
        updatedWallet = wallet;
      }

      // Find or create transaction record
      let transaction = await tx.walletTransaction.findFirst({
        where: {
          OR: [
            { fromWalletId: wallet_id },
            { toWalletId: wallet_id },
          ],
          transactionType: TransactionType.CONVERSION,
          transactionHash: { contains: exchangeId }, // Find by exchange ID in transaction hash
        },
      });

      if (transaction) {
        // Update existing transaction
        transaction = await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.COMPLETED,
            blockchainTxHash: payoutHash,
            processedAt: new Date(),
            completedAt: new Date(),
          },
        });
      } else {
        // Create new transaction
        transaction = await tx.walletTransaction.create({
          data: {
            ...(swapDirection === 'FIAT_TO_JY' 
              ? { toWalletId: wallet_id } // Money coming in
              : { fromWalletId: wallet_id }), // Money going out
            transactionType: TransactionType.CONVERSION,
            operationType: 'SWAP_CHANGENOW',
            amount: swapDirection === 'FIAT_TO_JY' ? parseFloat(toAmount) : parseFloat(fromAmount),
            currency: 'JY',
            netAmount: swapDirection === 'FIAT_TO_JY' ? parseFloat(toAmount) : parseFloat(fromAmount),
            purpose: 'CONVERSION',
            status: TransactionStatus.COMPLETED,
            description: `Swap via ChangeNOW: ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`,
            blockchainTxHash: payoutHash,
            metadata: JSON.stringify({
              provider: 'ChangeNOW',
              externalTransactionId: exchangeId,
              swapDirection,
              fromAmount,
              fromCurrency,
              toAmount,
              toCurrency,
              ...metadata,
            }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `changenow_${exchangeId}`,
          },
        });
      }

      // Create audit log
      await tx.auditEvent.create({
        data: {
          userId: user_id,
          type: 'WALLET_OPERATION',
          action: 'SWAP_COMPLETED',
          details: `ChangeNOW swap completed: ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency} (txHash: ${payoutHash}, transactionId: ${transaction.id})`,
        },
      });

      return { transaction, updatedWallet };
    });

    // Send notification to user
    await notifyUser(user_id, 'swap', {
      fromAmount,
      fromCurrency,
      toAmount,
      toCurrency,
      txHash: payoutHash,
      provider: 'ChangeNOW',
    });

    // Publish wallet update event
    await redis.publish(
      'wallet:updates',
      JSON.stringify({
        walletId: wallet_id,
        userId: user_id,
        type: 'swap',
        fromAmount,
        fromCurrency,
        toAmount,
        toCurrency,
        provider: 'ChangeNOW',
      })
    );

    console.log(
      `ChangeNOW swap completed: ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency} for user ${user_id}`
    );

    return res.status(200).json({
      success: true,
      message: 'Swap processed successfully',
      transactionId: result.transaction.id,
    });
  } catch (error: any) {
    console.error('ChangeNOW swap callback error:', error);
    return res.status(500).json({
      error: 'Failed to process swap',
      details: error.message,
    });
  }
});

// ============================================================================
// TEST ENDPOINTS (Development only)
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * POST /api/wallet/deposit/test
   * Test deposit callback (dev only)
   */
  router.post('/deposit/test', async (req: Request, res: Response) => {
    try {
      const { wallet_id, amount, user_id } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet_id },
          data: { joyTokens: { increment: parseFloat(amount) } },
        });

        const transaction = await tx.walletTransaction.create({
          data: {
            toWalletId: wallet_id,
            transactionType: TransactionType.DEPOSIT,
            operationType: 'TEST_DEPOSIT',
            amount: parseFloat(amount),
            currency: 'JY',
            netAmount: parseFloat(amount),
            purpose: 'TEST',
            status: TransactionStatus.COMPLETED,
            description: `TEST: Deposit ${amount} JY`,
            metadata: JSON.stringify({ test: true }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `test_deposit_${Date.now()}`,
          },
        });

        return { transaction };
      });

      res.status(200).json({
        success: true,
        message: 'Test deposit processed',
        transactionId: result.transaction.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/wallet/swap/test
   * Test swap callback (dev only)
   */
  router.post('/swap/test', async (req: Request, res: Response) => {
    try {
      const { wallet_id, amount, direction, user_id } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        if (direction === 'FIAT_TO_JY') {
          await tx.wallet.update({
            where: { id: wallet_id },
            data: { joyTokens: { increment: parseFloat(amount) } },
          });
        }

        const transaction = await tx.walletTransaction.create({
          data: {
            ...(direction === 'FIAT_TO_JY' 
              ? { toWalletId: wallet_id } 
              : { fromWalletId: wallet_id }),
            transactionType: TransactionType.CONVERSION,
            operationType: 'TEST_SWAP',
            amount: parseFloat(amount),
            currency: 'JY',
            netAmount: parseFloat(amount),
            purpose: 'TEST',
            status: TransactionStatus.COMPLETED,
            description: `TEST: Swap ${direction}`,
            metadata: JSON.stringify({ test: true, direction }),
            initiatedAt: new Date(),
            processedAt: new Date(),
            completedAt: new Date(),
            transactionHash: `test_swap_${Date.now()}`,
          },
        });

        return { transaction };
      });

      res.status(200).json({
        success: true,
        message: 'Test swap processed',
        transactionId: result.transaction.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default router;
