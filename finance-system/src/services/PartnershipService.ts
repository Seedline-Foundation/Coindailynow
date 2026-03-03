import db from '../database/connection';
import { Partnership } from '../types';
import { paymentProcessor } from './PaymentProcessor';
import { walletService } from './WalletService';
import { notificationService } from './NotificationService';
import { auditService } from './AuditService';
import crypto from 'crypto';

/**
 * PartnershipService
 * Partnerships are paid ONLY after AI verifies the contract docs.
 * Requirements: duly signed, proper dates, both parties' signatures, no errors.
 */
export class PartnershipService {

  async createPartnership(data: {
    partnerName: string;
    partnerWalletId: string;
    contractAmount: number;
    currency?: string;
    createdBy: string;
  }): Promise<Partnership> {
    const id = db.generateId();
    const result = await db.query<Partnership>(
      `INSERT INTO partnerships (id, partner_name, partner_wallet_id, contract_amount, currency, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'PENDING_DOCS', $6)
       RETURNING *`,
      [id, data.partnerName, data.partnerWalletId, data.contractAmount, data.currency || 'JY', data.createdBy]
    );

    await notificationService.notifySuperAdmin(
      `Partnership Created — ${data.partnerName}`,
      `Amount: ${data.contractAmount} ${data.currency || 'JY'}. Awaiting contract documents.`,
      'PARTNERSHIP', 'MEDIUM', 'PARTNERSHIP', id
    );

    return result.rows[0];
  }

  async submitDocuments(partnershipId: string, data: {
    contractDocUrl: string;
    contractDocContent: string; // Raw document content for hashing
    contractSignedDate: string;
    contractParties: { name: string; signature: string; date: string; role: string }[];
  }): Promise<Partnership> {
    const partnership = await this.getPartnership(partnershipId);
    if (!partnership) throw new Error(`Partnership ${partnershipId} not found`);
    if (partnership.status !== 'PENDING_DOCS' && partnership.status !== 'DOCS_REJECTED') {
      throw new Error(`Cannot submit docs in state: ${partnership.status}`);
    }

    // Hash the document for integrity
    const docHash = crypto.createHash('sha512').update(data.contractDocContent).digest('hex');

    const result = await db.query<Partnership>(
      `UPDATE partnerships SET 
        status = 'DOCS_SUBMITTED',
        contract_doc_url = $1,
        contract_doc_hash = $2,
        contract_signed_date = $3,
        contract_parties = $4,
        rejection_reason = NULL,
        updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [data.contractDocUrl, docHash, data.contractSignedDate, JSON.stringify(data.contractParties), partnershipId]
    );

    await notificationService.notifySuperAdmin(
      `Partnership Docs Submitted — ${partnership.partner_name}`,
      `Documents uploaded for AI review. Hash: ${docHash.substring(0, 16)}...`,
      'PARTNERSHIP', 'MEDIUM', 'PARTNERSHIP', partnershipId
    );

    await auditService.log({
      action: 'PARTNERSHIP_DOCS_SUBMITTED',
      actor: 'PARTNER',
      entity_type: 'PARTNERSHIP',
      entity_id: partnershipId,
      new_value: { docUrl: data.contractDocUrl, signedDate: data.contractSignedDate, parties: data.contractParties.length }
    });

    return result.rows[0];
  }

  async processPayment(partnershipId: string): Promise<void> {
    // Delegates to PaymentProcessor which runs AI document verification
    await paymentProcessor.processPartnershipPayment(partnershipId);
  }

  async getPartnership(partnershipId: string): Promise<Partnership | null> {
    const result = await db.query<Partnership>('SELECT * FROM partnerships WHERE id = $1', [partnershipId]);
    return result.rows[0] || null;
  }

  async listPartnerships(status?: string): Promise<Partnership[]> {
    let query = 'SELECT * FROM partnerships';
    const params: any[] = [];
    if (status) {
      params.push(status);
      query += ' WHERE status = $1';
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query<Partnership>(query, params);
    return result.rows;
  }
}

export const partnershipService = new PartnershipService();
