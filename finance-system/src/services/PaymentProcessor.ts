import db from '../database/connection';
import { Transaction, TxType, Wallet } from '../types';
import { walletService } from './WalletService';
import { transactionService } from './TransactionService';
import { ledgerService } from './LedgerService';
import { notificationService } from './NotificationService';
import { auditService } from './AuditService';
import { aiVerificationAgent } from '../agents/AIVerificationAgent';

/**
 * PaymentProcessor — THE central payment gateway for CFIS.
 * ALL money movements go through this processor.
 * NO payments happen outside CFIS.
 * Super Admin is NOTIFIED of every transaction.
 */
export class PaymentProcessor {

  // ============================================================
  // 1. USER POINTS → TOKEN WITHDRAWAL
  //    Flow: User earns points → Admin records → User requests withdrawal
  //    → CFIS AI verifies activity → CFIS sends tokens → Admin notified
  // ============================================================
  async processUserWithdrawal(data: {
    userId: string;
    walletId: string;
    amount: number;
    activityData: any;
  }): Promise<Transaction> {
    // Step 1: Create pending transaction
    const tx = await transactionService.createTransaction({
      tx_type: 'TOKEN_WITHDRAWAL',
      from_wallet_id: (await walletService.getTreasuryWallet()).id,
      to_wallet_id: data.walletId,
      amount: data.amount,
      currency: 'JY',
      description: `User withdrawal: ${data.amount} JY for user ${data.userId}`,
      requested_by: `USER:${data.userId}`,
      metadata: { activityData: data.activityData }
    });

    // Step 2: AI verification
    await transactionService.updateStatus(tx.id, 'AI_REVIEW');
    const verification = await aiVerificationAgent.verifyUserWithdrawal({
      userId: data.userId,
      walletId: data.walletId,
      amount: data.amount,
      currency: 'JY',
      activityData: data.activityData
    });
    await transactionService.setAIVerification(tx.id, verification.id);

    if (verification.result !== 'APPROVED') {
      await transactionService.updateStatus(tx.id, 'REJECTED', 'ARIA_AGENT');
      await notificationService.notifySuperAdmin(
        `Withdrawal REJECTED — User ${data.userId}`,
        `Amount: ${data.amount} JY. Reason: ${verification.reasoning}`,
        'PAYMENT', 'HIGH', 'TRANSACTION', tx.id
      );
      return (await transactionService.getTransaction(tx.id))!;
    }

    // Step 3: Execute payment
    return this.executePayment(tx.id, 'USER_WITHDRAWAL');
  }

  // ============================================================
  // 2. STAFF PAYROLL
  //    Flow: Super Admin sets schedule → CFIS auto-pays on date
  //    → CFIS records → Admin notified
  // ============================================================
  async processStaffPayroll(data: {
    staffWalletId: string;
    staffName: string;
    amount: number;
    payrollId: string;
  }): Promise<Transaction> {
    const treasury = await walletService.getTreasuryWallet();
    const tx = await transactionService.createTransaction({
      tx_type: 'STAFF_PAYROLL',
      from_wallet_id: treasury.id,
      to_wallet_id: data.staffWalletId,
      amount: data.amount,
      currency: 'JY',
      description: `Monthly payroll for ${data.staffName}`,
      requested_by: 'SYSTEM',
      metadata: { payrollId: data.payrollId, staffName: data.staffName }
    });

    // Payroll doesn't need AI verification — it's pre-approved by schedule
    return this.executePayment(tx.id, 'STAFF_PAYROLL');
  }

  // ============================================================
  // 3. PRESS ESCROW RELEASE
  //    Flow: Publisher pays → escrow holds → 24hrs + AI verification
  //    → tokens released to site owner/influencer → Admin notified
  // ============================================================
  async processEscrowRelease(escrowId: string): Promise<Transaction> {
    const escrowResult = await db.query('SELECT * FROM press_escrows WHERE id = $1', [escrowId]);
    const escrow = escrowResult.rows[0];
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (escrow.status !== 'FUNDED' && escrow.status !== 'ACTIVE') {
      throw new Error(`Escrow ${escrowId} not in releasable state: ${escrow.status}`);
    }

    // AI verification of press placement
    const verification = await aiVerificationAgent.verifyPressPlacement({
      escrowId,
      siteUrl: escrow.site_url,
      pressOrderId: escrow.press_order_id,
      publisherWalletId: escrow.publisher_wallet_id,
      recipientWalletId: escrow.recipient_wallet_id,
      amount: parseFloat(escrow.amount)
    });

    if (verification.result !== 'APPROVED') {
      await db.query(
        "UPDATE press_escrows SET status = 'VERIFICATION_PENDING', ai_verification_id = $1, updated_at = NOW() WHERE id = $2",
        [verification.id, escrowId]
      );
      await notificationService.notifySuperAdmin(
        `Press Escrow HELD — ${escrow.site_url}`,
        `Escrow ${escrowId} NOT released. AI: ${verification.reasoning}`,
        'PRESS', 'HIGH', 'ESCROW', escrowId
      );
      throw new Error(`Press verification failed: ${verification.reasoning}`);
    }

    // Create release transaction
    const escrowWallet = await walletService.getEscrowWallet();
    const tx = await transactionService.createTransaction({
      tx_type: 'PRESS_ESCROW_RELEASE',
      from_wallet_id: escrowWallet.id,
      to_wallet_id: escrow.recipient_wallet_id,
      amount: parseFloat(escrow.amount),
      currency: escrow.currency || 'JY',
      description: `Press escrow release for ${escrow.site_url}`,
      requested_by: 'SYSTEM',
      metadata: { escrowId, pressOrderId: escrow.press_order_id }
    });
    await transactionService.setAIVerification(tx.id, verification.id);

    const completedTx = await this.executePayment(tx.id, 'PRESS_ESCROW_RELEASE');

    // Update escrow record
    await db.query(
      `UPDATE press_escrows SET status = 'RELEASED', released_at = NOW(), ai_verification_id = $1, transaction_out_id = $2, updated_at = NOW() WHERE id = $3`,
      [verification.id, tx.id, escrowId]
    );

    return completedTx;
  }

  // ============================================================
  // 4. PARTNERSHIP PAYMENT
  //    Flow: Contract signed → Docs uploaded → AI verifies docs
  //    → payment released → Admin notified
  // ============================================================
  async processPartnershipPayment(partnershipId: string): Promise<Transaction> {
    const partnerResult = await db.query('SELECT * FROM partnerships WHERE id = $1', [partnershipId]);
    const partner = partnerResult.rows[0];
    if (!partner) throw new Error(`Partnership ${partnershipId} not found`);
    if (partner.status !== 'DOCS_SUBMITTED') {
      throw new Error(`Partnership ${partnershipId} not in correct state: ${partner.status}. Must be DOCS_SUBMITTED.`);
    }

    // AI verifies contract document
    const verification = await aiVerificationAgent.verifyPartnershipDocument({
      partnershipId,
      partnerName: partner.partner_name,
      contractDocUrl: partner.contract_doc_url,
      contractDocHash: partner.contract_doc_hash,
      contractSignedDate: partner.contract_signed_date,
      contractParties: partner.contract_parties,
      contractAmount: parseFloat(partner.contract_amount)
    });

    if (verification.result === 'REJECTED') {
      await db.query(
        `UPDATE partnerships SET status = 'DOCS_REJECTED', ai_verification_id = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
        [verification.id, verification.reasoning, partnershipId]
      );
      await notificationService.notifySuperAdmin(
        `Partnership REJECTED — ${partner.partner_name}`,
        `Docs incomplete/improper. ${verification.reasoning}`,
        'PARTNERSHIP', 'HIGH', 'PARTNERSHIP', partnershipId
      );
      throw new Error(`Partnership document verification failed: ${verification.reasoning}`);
    }

    // Docs approved — process payment
    await db.query(
      `UPDATE partnerships SET status = 'DOCS_APPROVED', ai_verification_id = $1, updated_at = NOW() WHERE id = $2`,
      [verification.id, partnershipId]
    );

    const treasury = await walletService.getTreasuryWallet();
    const tx = await transactionService.createTransaction({
      tx_type: 'PARTNERSHIP_PAYMENT',
      from_wallet_id: treasury.id,
      to_wallet_id: partner.partner_wallet_id,
      amount: parseFloat(partner.contract_amount),
      currency: partner.currency || 'JY',
      description: `Partnership payment to ${partner.partner_name}`,
      requested_by: 'SYSTEM',
      metadata: { partnershipId, partnerName: partner.partner_name }
    });
    await transactionService.setAIVerification(tx.id, verification.id);

    const completedTx = await this.executePayment(tx.id, 'PARTNERSHIP_PAYMENT');

    await db.query(
      `UPDATE partnerships SET status = 'PAYMENT_COMPLETED', transaction_id = $1, updated_at = NOW() WHERE id = $2`,
      [tx.id, partnershipId]
    );

    return completedTx;
  }

  // ============================================================
  // 5. BONUS / AD-HOC PAYMENT
  //    Flow: Super Admin sends wallet + amount to CFIS → AI verifies
  //    → CFIS pays → reports back to Admin
  // ============================================================
  async processBonusPayment(data: {
    recipientWalletId: string;
    amount: number;
    reason: string;
    requestedBy: string;
  }): Promise<Transaction> {
    const verification = await aiVerificationAgent.verifyBonusPayment(data);

    const treasury = await walletService.getTreasuryWallet();
    const tx = await transactionService.createTransaction({
      tx_type: 'BONUS_PAYMENT',
      from_wallet_id: treasury.id,
      to_wallet_id: data.recipientWalletId,
      amount: data.amount,
      currency: 'JY',
      description: `Bonus: ${data.reason}`,
      requested_by: data.requestedBy,
      metadata: { reason: data.reason }
    });
    await transactionService.setAIVerification(tx.id, verification.id);

    if (verification.result !== 'APPROVED') {
      await transactionService.updateStatus(tx.id, 'REJECTED', 'ARIA_AGENT');
      await notificationService.notifySuperAdmin(
        `Bonus REJECTED`,
        `${data.amount} JY to wallet ${data.recipientWalletId}. ${verification.reasoning}`,
        'PAYMENT', 'MEDIUM', 'TRANSACTION', tx.id
      );
      return (await transactionService.getTransaction(tx.id))!;
    }

    return this.executePayment(tx.id, 'BONUS_PAYMENT');
  }

  // ============================================================
  // 6. RECEIVE FUNDS (Incoming money to CFIS)
  //    All receivables go to CFIS, Admin is notified
  // ============================================================
  async receiveFunds(data: {
    fromWalletId: string;
    amount: number;
    currency: string;
    txType: TxType;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<Transaction> {
    const treasury = await walletService.getTreasuryWallet();
    const tx = await transactionService.createTransaction({
      tx_type: data.txType,
      from_wallet_id: data.fromWalletId,
      to_wallet_id: treasury.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      requested_by: 'SYSTEM',
      metadata: data.metadata || {}
    });

    // Credit treasury
    const balanceField = data.currency === 'JY' ? 'balance_jy' : data.currency === 'USD' ? 'balance_usd' : 'balance_points';
    await walletService.creditWallet(treasury.id, balanceField, data.amount);
    await transactionService.updateStatus(tx.id, 'COMPLETED', 'SYSTEM');

    // Record in ledger
    const journalEntry = await ledgerService.createJournalEntry({
      description: `Received: ${data.description}`,
      reference_type: data.txType,
      reference_id: tx.id,
      created_by: 'SYSTEM',
      lines: [
        { account_code: '100001', debit: data.amount, credit: 0, description: 'Cash/Token received' },
        { account_code: '400001', debit: 0, credit: data.amount, description: 'Revenue' }
      ]
    });
    await transactionService.setJournalEntry(tx.id, journalEntry.id);

    // Notify admin
    await notificationService.notifySuperAdmin(
      `Funds Received: ${data.amount} ${data.currency}`,
      data.description,
      'PAYMENT', 'LOW', 'TRANSACTION', tx.id
    );

    await auditService.log({
      action: 'FUNDS_RECEIVED',
      actor: 'SYSTEM',
      entity_type: 'TRANSACTION',
      entity_id: tx.id,
      new_value: { amount: data.amount, currency: data.currency, type: data.txType }
    });

    return (await transactionService.getTransaction(tx.id))!;
  }

  // ============================================================
  // CORE EXECUTE — Private method that actually moves money
  // ============================================================
  private async executePayment(txId: string, context: string): Promise<Transaction> {
    const tx = await transactionService.getTransaction(txId);
    if (!tx) throw new Error(`Transaction ${txId} not found`);

    try {
      await transactionService.updateStatus(txId, 'PROCESSING');

      // Debit source wallet
      if (tx.from_wallet_id) {
        const balanceField = tx.currency === 'JY' ? 'balance_jy' : tx.currency === 'USD' ? 'balance_usd' : 'balance_points';
        await walletService.debitWallet(tx.from_wallet_id, balanceField, tx.amount);
      }

      // Credit destination wallet
      if (tx.to_wallet_id) {
        const balanceField = tx.currency === 'JY' ? 'balance_jy' : tx.currency === 'USD' ? 'balance_usd' : 'balance_points';
        await walletService.creditWallet(tx.to_wallet_id, balanceField, tx.amount);
      }

      // Record in double-entry ledger
      const journalEntry = await ledgerService.createJournalEntry({
        description: tx.description || context,
        reference_type: tx.tx_type,
        reference_id: txId,
        created_by: 'SYSTEM',
        lines: [
          { account_code: '500001', debit: tx.amount, credit: 0, description: `${context} expense` },
          { account_code: '100001', debit: 0, credit: tx.amount, description: `${context} cash out` }
        ]
      });
      await transactionService.setJournalEntry(txId, journalEntry.id);

      // Mark completed
      await transactionService.updateStatus(txId, 'COMPLETED', 'SYSTEM');

      // Notify super admin
      await notificationService.notifySuperAdmin(
        `Payment COMPLETED — ${context}`,
        `${tx.amount} ${tx.currency} sent. TX: ${txId}`,
        'PAYMENT', 'MEDIUM', 'TRANSACTION', txId
      );

      // Audit log
      await auditService.log({
        action: `PAYMENT_COMPLETED_${context}`,
        actor: 'SYSTEM',
        entity_type: 'TRANSACTION',
        entity_id: txId,
        new_value: { amount: tx.amount, currency: tx.currency, context }
      });

      return (await transactionService.getTransaction(txId))!;

    } catch (error: any) {
      await transactionService.updateStatus(txId, 'FAILED');
      await notificationService.notifySuperAdmin(
        `Payment FAILED — ${context}`,
        `TX ${txId} failed: ${error.message}`,
        'PAYMENT', 'CRITICAL', 'TRANSACTION', txId
      );
      await auditService.log({
        action: `PAYMENT_FAILED_${context}`,
        actor: 'SYSTEM',
        entity_type: 'TRANSACTION',
        entity_id: txId,
        new_value: { error: error.message }
      });
      throw error;
    }
  }
}

export const paymentProcessor = new PaymentProcessor();
