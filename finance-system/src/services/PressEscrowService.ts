import db from '../database/connection';
import { PressEscrow } from '../types';
import { walletService } from './WalletService';
import { transactionService } from './TransactionService';
import { paymentProcessor } from './PaymentProcessor';
import { notificationService } from './NotificationService';
import { auditService } from './AuditService';

/**
 * PressEscrowService
 * Handles the full lifecycle of press/PR escrow payments:
 * 1. Publisher buys token and selects site owner/influencer
 * 2. Publisher pays → funds go to CFIS escrow
 * 3. 24 hours pass + AI verifies press was placed + receiving views
 * 4. CFIS releases payment to site owner/influencer
 * 5. Admin is notified at every step
 */
export class PressEscrowService {

  async createEscrow(data: {
    publisherWalletId: string;
    recipientWalletId: string;
    amount: number;
    pressOrderId: string;
    siteUrl: string;
  }): Promise<PressEscrow> {
    const escrowWallet = await walletService.getEscrowWallet();
    const id = db.generateId();
    const releaseAfter = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Step 1: Debit publisher wallet → credit escrow wallet
    const tx = await transactionService.createTransaction({
      tx_type: 'PRESS_ESCROW_IN',
      from_wallet_id: data.publisherWalletId,
      to_wallet_id: escrowWallet.id,
      amount: data.amount,
      currency: 'JY',
      description: `Press escrow for ${data.siteUrl}`,
      requested_by: 'SYSTEM',
      metadata: { pressOrderId: data.pressOrderId, siteUrl: data.siteUrl }
    });

    // Move funds
    await walletService.debitWallet(data.publisherWalletId, 'balance_jy', data.amount);
    await walletService.creditWallet(escrowWallet.id, 'balance_jy', data.amount);
    await transactionService.updateStatus(tx.id, 'COMPLETED', 'SYSTEM');

    // Step 2: Create escrow record
    const result = await db.query<PressEscrow>(
      `INSERT INTO press_escrows (id, publisher_wallet_id, recipient_wallet_id, amount, currency, press_order_id, site_url, status, release_after, transaction_in_id)
       VALUES ($1, $2, $3, $4, 'JY', $5, $6, 'FUNDED', $7, $8)
       RETURNING *`,
      [id, data.publisherWalletId, data.recipientWalletId, data.amount, data.pressOrderId, data.siteUrl, releaseAfter, tx.id]
    );

    // Notify admin
    await notificationService.notifySuperAdmin(
      `Press Escrow CREATED — ${data.amount} JY`,
      `Publisher funded escrow for ${data.siteUrl}. Releases after ${releaseAfter.toISOString()}. Order: ${data.pressOrderId}`,
      'PRESS', 'MEDIUM', 'ESCROW', id
    );

    await auditService.log({
      action: 'PRESS_ESCROW_CREATED',
      actor: 'SYSTEM',
      entity_type: 'ESCROW',
      entity_id: id,
      new_value: { amount: data.amount, siteUrl: data.siteUrl, releaseAfter: releaseAfter.toISOString() }
    });

    return result.rows[0];
  }

  async releaseEscrow(escrowId: string): Promise<void> {
    // Delegates to PaymentProcessor which handles AI verification
    await paymentProcessor.processEscrowRelease(escrowId);
  }

  async refundEscrow(escrowId: string, reason: string): Promise<void> {
    const escrowResult = await db.query('SELECT * FROM press_escrows WHERE id = $1', [escrowId]);
    const escrow = escrowResult.rows[0];
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);

    const escrowWallet = await walletService.getEscrowWallet();
    const grossAmount = parseFloat(escrow.amount);

    // ─── Gas Fee Deduction ───────────────────────────────────────
    // When refunding, deduct gas/processing fees that were incurred
    // for the original escrow creation on-chain.
    // Configurable via GAS_FEE_PERCENT env var (default 2.5%)
    const gasFeePercent = parseFloat(process.env.GAS_FEE_PERCENT || '2.5');
    const gasFee = Math.round(grossAmount * (gasFeePercent / 100) * 1e6) / 1e6; // 6 decimal precision for JY
    const netRefund = grossAmount - gasFee;

    if (netRefund <= 0) {
      throw new Error(`Refund amount (${grossAmount} JY) is too small to cover gas fees (${gasFee} JY)`);
    }

    // Refund publisher (minus gas fees)
    const tx = await transactionService.createTransaction({
      tx_type: 'PRESS_ESCROW_REFUND',
      from_wallet_id: escrowWallet.id,
      to_wallet_id: escrow.publisher_wallet_id,
      amount: netRefund,
      currency: 'JY',
      description: `Press escrow REFUND: ${reason} (Gas fee: ${gasFee} JY deducted)`,
      requested_by: 'SYSTEM',
      metadata: { escrowId, reason, grossAmount, gasFee, gasFeePercent, netRefund }
    });

    // Move the net refund to publisher
    await walletService.debitWallet(escrowWallet.id, 'balance_jy', grossAmount);
    await walletService.creditWallet(escrow.publisher_wallet_id, 'balance_jy', netRefund);

    // Gas fee goes to treasury (CFIS keeps it to cover on-chain costs)
    if (gasFee > 0) {
      const treasury = await walletService.getTreasuryWallet();
      await walletService.creditWallet(treasury.id, 'balance_jy', gasFee);

      // Record gas fee as separate transaction for accounting
      await transactionService.createTransaction({
        tx_type: 'GAS_FEE_COLLECTION',
        from_wallet_id: escrowWallet.id,
        to_wallet_id: treasury.id,
        amount: gasFee,
        currency: 'JY',
        description: `Gas fee collected from escrow refund ${escrowId}`,
        requested_by: 'SYSTEM',
        metadata: { escrowId, gasFeePercent }
      });
    }

    await transactionService.updateStatus(tx.id, 'COMPLETED', 'SYSTEM');

    await db.query(
      "UPDATE press_escrows SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1",
      [escrowId]
    );

    await notificationService.notifySuperAdmin(
      `Press Escrow REFUNDED — ${netRefund} JY (Fee: ${gasFee} JY)`,
      `Escrow ${escrowId} refunded ${netRefund} JY to publisher (${gasFee} JY gas fee deducted from ${grossAmount} JY). Reason: ${reason}`,
      'PRESS', 'HIGH', 'ESCROW', escrowId
    );
  }

  async getEscrow(escrowId: string): Promise<PressEscrow | null> {
    const result = await db.query<PressEscrow>('SELECT * FROM press_escrows WHERE id = $1', [escrowId]);
    return result.rows[0] || null;
  }

  async listEscrows(status?: string): Promise<PressEscrow[]> {
    let query = 'SELECT * FROM press_escrows';
    const params: any[] = [];
    if (status) {
      params.push(status);
      query += ' WHERE status = $1';
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query<PressEscrow>(query, params);
    return result.rows;
  }

  /**
   * Find escrow by the SENDPRESS distribution order ID.
   * Used by the public press order status endpoint.
   */
  async getEscrowByOrderId(orderId: string): Promise<PressEscrow | null> {
    const result = await db.query<PressEscrow>(
      'SELECT * FROM press_escrows WHERE press_order_id = $1',
      [orderId]
    );
    return result.rows[0] || null;
  }

  async getReleasableEscrows(): Promise<PressEscrow[]> {
    const result = await db.query<PressEscrow>(
      "SELECT * FROM press_escrows WHERE status = 'FUNDED' AND release_after <= NOW() ORDER BY release_after ASC"
    );
    return result.rows;
  }

  // Cron job: Auto-release escrows after 24 hours if press is verified
  async processReleasableEscrows(): Promise<{ released: number; failed: number }> {
    const releasable = await this.getReleasableEscrows();
    let released = 0;
    let failed = 0;

    for (const escrow of releasable) {
      try {
        await this.releaseEscrow(escrow.id);
        released++;
      } catch (error: any) {
        failed++;
        console.error(`Failed to release escrow ${escrow.id}: ${error.message}`);
      }
    }

    if (releasable.length > 0) {
      await notificationService.notifySuperAdmin(
        `Press Escrow Batch: ${released} released, ${failed} failed`,
        `Processed ${releasable.length} releasable escrows.`,
        'PRESS', failed > 0 ? 'HIGH' : 'LOW'
      );
    }

    return { released, failed };
  }
}

export const pressEscrowService = new PressEscrowService();
