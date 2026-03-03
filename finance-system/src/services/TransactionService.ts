import db from '../database/connection';
import { Transaction, TxType, TxStatus } from '../types';

export class TransactionService {

  async createTransaction(data: {
    tx_type: TxType;
    from_wallet_id?: string;
    to_wallet_id?: string;
    amount: number;
    currency?: string;
    fee?: number;
    description?: string;
    requested_by?: string;
    metadata?: Record<string, any>;
  }): Promise<Transaction> {
    const id = db.generateId();
    const result = await db.query<Transaction>(
      `INSERT INTO transactions (id, tx_type, status, from_wallet_id, to_wallet_id, amount, currency, fee, description, requested_by, metadata)
       VALUES ($1, $2, 'PENDING', $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, data.tx_type,
        data.from_wallet_id || null, data.to_wallet_id || null,
        data.amount, data.currency || 'JY', data.fee || 0,
        data.description || null, data.requested_by || null,
        JSON.stringify(data.metadata || {})
      ]
    );
    return result.rows[0];
  }

  async updateStatus(txId: string, status: TxStatus, approvedBy?: string): Promise<Transaction> {
    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];

    if (approvedBy) {
      params.push(approvedBy);
      updates.push(`approved_by = $${params.length}`);
    }
    if (status === 'COMPLETED') {
      updates.push('completed_at = NOW()');
    }
    params.push(txId);
    const result = await db.query<Transaction>(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!result.rows[0]) throw new Error(`Transaction ${txId} not found`);
    return result.rows[0];
  }

  async setTxHash(txId: string, txHash: string): Promise<void> {
    await db.query('UPDATE transactions SET tx_hash = $1, updated_at = NOW() WHERE id = $2', [txHash, txId]);
  }

  async setAIVerification(txId: string, verificationId: string): Promise<void> {
    await db.query('UPDATE transactions SET ai_verification_id = $1, updated_at = NOW() WHERE id = $2', [verificationId, txId]);
  }

  async setJournalEntry(txId: string, journalEntryId: string): Promise<void> {
    await db.query('UPDATE transactions SET journal_entry_id = $1, updated_at = NOW() WHERE id = $2', [journalEntryId, txId]);
  }

  async getTransaction(txId: string): Promise<Transaction | null> {
    const result = await db.query<Transaction>('SELECT * FROM transactions WHERE id = $1', [txId]);
    return result.rows[0] || null;
  }

  async listTransactions(filters?: {
    tx_type?: TxType;
    status?: TxStatus;
    from_wallet_id?: string;
    to_wallet_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filters?.tx_type) { params.push(filters.tx_type); whereClause += ` AND tx_type = $${params.length}`; }
    if (filters?.status) { params.push(filters.status); whereClause += ` AND status = $${params.length}`; }
    if (filters?.from_wallet_id) { params.push(filters.from_wallet_id); whereClause += ` AND from_wallet_id = $${params.length}`; }
    if (filters?.to_wallet_id) { params.push(filters.to_wallet_id); whereClause += ` AND to_wallet_id = $${params.length}`; }

    const countResult = await db.query(`SELECT COUNT(*) FROM transactions WHERE ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    params.push(limit, offset);

    const result = await db.query<Transaction>(
      `SELECT * FROM transactions WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { transactions: result.rows, total };
  }

  async getTransactionsByWallet(walletId: string, limit = 50): Promise<Transaction[]> {
    const result = await db.query<Transaction>(
      `SELECT * FROM transactions WHERE from_wallet_id = $1 OR to_wallet_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [walletId, limit]
    );
    return result.rows;
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const result = await db.query<Transaction>(
      `SELECT * FROM transactions WHERE status IN ('PENDING','AI_REVIEW','APPROVED','PROCESSING') ORDER BY created_at ASC`
    );
    return result.rows;
  }
}

export const transactionService = new TransactionService();
