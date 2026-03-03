import db from '../database/connection';
import { AirdropCampaign } from '../types';
import { walletService } from './WalletService';
import { transactionService } from './TransactionService';
import { paymentProcessor } from './PaymentProcessor';
import { aiVerificationAgent } from '../agents/AIVerificationAgent';
import { notificationService } from './NotificationService';
import { auditService } from './AuditService';

/**
 * AirdropService
 * Handles airdrop campaigns from project owners.
 * Flow: Project owner posts about project → funds airdrop → CFIS AI monitors
 * → users qualify → project distributes → CFIS records all transactions
 */
export class AirdropService {

  async createCampaign(data: {
    projectName: string;
    projectOwnerWalletId: string;
    tokenAddress: string;
    totalFundAmount: number;
    fundingWalletAddress: string;
    campaignStart: string;
    campaignEnd: string;
    qualificationCriteria: Record<string, any>;
  }): Promise<AirdropCampaign> {
    const id = db.generateId();
    const result = await db.query<AirdropCampaign>(
      `INSERT INTO airdrop_campaigns (id, project_name, project_owner_wallet_id, token_address, total_fund_amount, remaining_amount, status, funding_wallet_address, campaign_start, campaign_end, qualification_criteria)
       VALUES ($1, $2, $3, $4, $5, $5, 'CREATED', $6, $7, $8, $9)
       RETURNING *`,
      [
        id, data.projectName, data.projectOwnerWalletId, data.tokenAddress,
        data.totalFundAmount, data.fundingWalletAddress,
        data.campaignStart, data.campaignEnd,
        JSON.stringify(data.qualificationCriteria)
      ]
    );

    await notificationService.notifySuperAdmin(
      `Airdrop Campaign Created — ${data.projectName}`,
      `Amount: ${data.totalFundAmount} tokens. Funding wallet: ${data.fundingWalletAddress}. Awaiting AI funding verification.`,
      'AIRDROP', 'MEDIUM', 'AIRDROP', id
    );

    return result.rows[0];
  }

  async verifyFunding(campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    const verification = await aiVerificationAgent.verifyAirdropFunding({
      campaignId,
      projectName: campaign.project_name,
      fundingWalletAddress: campaign.funding_wallet_address || '',
      expectedAmount: campaign.total_fund_amount,
      tokenAddress: campaign.token_address || ''
    });

    if (verification.result === 'APPROVED') {
      await db.query(
        `UPDATE airdrop_campaigns SET status = 'FUNDING_VERIFIED', ai_verification_id = $1, funding_verified_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [verification.id, campaignId]
      );
      await notificationService.notifySuperAdmin(
        `Airdrop Funding VERIFIED — ${campaign.project_name}`,
        `Campaign ${campaignId} funding confirmed. Ready to activate.`,
        'AIRDROP', 'MEDIUM', 'AIRDROP', campaignId
      );
    } else {
      await db.query(
        `UPDATE airdrop_campaigns SET status = 'FUNDING_PENDING', ai_verification_id = $1, updated_at = NOW() WHERE id = $2`,
        [verification.id, campaignId]
      );
      await notificationService.notifySuperAdmin(
        `Airdrop Funding NOT VERIFIED — ${campaign.project_name}`,
        `Issues: ${verification.reasoning}`,
        'AIRDROP', 'HIGH', 'AIRDROP', campaignId
      );
    }
  }

  async activateCampaign(campaignId: string): Promise<void> {
    await db.query(
      "UPDATE airdrop_campaigns SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1 AND status = 'FUNDING_VERIFIED'",
      [campaignId]
    );
  }

  async recordDistribution(data: {
    campaignId: string;
    recipientAddress: string;
    recipientWalletId?: string;
    amount: number;
    txHash: string;
  }): Promise<void> {
    const campaign = await this.getCampaign(data.campaignId);
    if (!campaign) throw new Error(`Campaign ${data.campaignId} not found`);

    const id = db.generateId();
    // Record the distribution
    await db.query(
      `INSERT INTO airdrop_distributions (id, campaign_id, recipient_wallet_id, recipient_address, amount, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED')`,
      [id, data.campaignId, data.recipientWalletId || null, data.recipientAddress, data.amount, data.txHash]
    );

    // Update campaign totals
    await db.query(
      `UPDATE airdrop_campaigns SET distributed_amount = distributed_amount + $1, remaining_amount = remaining_amount - $1, updated_at = NOW() WHERE id = $2`,
      [data.amount, data.campaignId]
    );

    // Also record as a transaction in CFIS
    await transactionService.createTransaction({
      tx_type: 'AIRDROP_DISTRIBUTE',
      amount: data.amount,
      currency: campaign.token_address || 'TOKEN',
      description: `Airdrop distribution for ${campaign.project_name} to ${data.recipientAddress}`,
      requested_by: 'PROJECT_OWNER',
      metadata: { campaignId: data.campaignId, txHash: data.txHash, recipientAddress: data.recipientAddress }
    });

    await auditService.log({
      action: 'AIRDROP_DISTRIBUTION',
      actor: 'SYSTEM',
      entity_type: 'AIRDROP',
      entity_id: data.campaignId,
      new_value: { recipientAddress: data.recipientAddress, amount: data.amount, txHash: data.txHash }
    });
  }

  async getCampaign(campaignId: string): Promise<AirdropCampaign | null> {
    const result = await db.query<AirdropCampaign>('SELECT * FROM airdrop_campaigns WHERE id = $1', [campaignId]);
    return result.rows[0] || null;
  }

  async listCampaigns(status?: string): Promise<AirdropCampaign[]> {
    let query = 'SELECT * FROM airdrop_campaigns';
    const params: any[] = [];
    if (status) {
      params.push(status);
      query += ' WHERE status = $1';
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query<AirdropCampaign>(query, params);
    return result.rows;
  }

  async getCampaignDistributions(campaignId: string): Promise<any[]> {
    const result = await db.query(
      'SELECT * FROM airdrop_distributions WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );
    return result.rows;
  }

  async getCampaignSummary(campaignId: string): Promise<any> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    const distResult = await db.query(
      `SELECT COUNT(*) as total_recipients, SUM(amount) as total_distributed FROM airdrop_distributions WHERE campaign_id = $1 AND status = 'CONFIRMED'`,
      [campaignId]
    );

    return {
      campaign,
      totalRecipients: parseInt(distResult.rows[0].total_recipients || '0'),
      totalDistributed: parseFloat(distResult.rows[0].total_distributed || '0'),
      percentComplete: campaign.total_fund_amount > 0
        ? ((parseFloat(distResult.rows[0].total_distributed || '0') / campaign.total_fund_amount) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

export const airdropService = new AirdropService();
