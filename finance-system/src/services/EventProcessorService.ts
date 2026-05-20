/**
 * CFIS Event Processor — maps on-chain blockchain events to CFIS transactions.
 *
 * Responsibilities:
 *   1. Map each blockchain event to the appropriate CFIS transaction type
 *   2. Credit / debit user wallets when on-chain state changes
 *   3. Create an audit-trail entry for every processed event
 *   4. Notify the Super Admin of significant on-chain activity
 *
 * The processor is intentionally best-effort: if the DB is unreachable or a
 * wallet lookup fails, the error is logged but never crashes the listener.
 */

import { ethers } from 'ethers';
import { transactionService } from './TransactionService';
import { walletService } from './WalletService';
import { auditService } from './AuditService';
import { notificationService } from './NotificationService';
import { ledgerService } from './LedgerService';
import { TxType } from '../types';

// ── Shared types ─────────────────────────────────────────────────────

export interface BlockchainEvent {
  eventName: string;
  contractName: string;
  contractAddress: string;
  args: Record<string, string>;
  txHash: string;
  blockNumber: number;
  logIndex: number;
}

// JOY token uses 12 decimals
const JOY_DECIMALS = 12;

function formatJoy(raw: string): number {
  return parseFloat(ethers.formatUnits(raw, JOY_DECIMALS));
}

// ── Processor ────────────────────────────────────────────────────────

export class EventProcessorService {
  /**
   * Route an incoming blockchain event to the appropriate handler.
   * Errors are caught so one bad event never kills the listener loop.
   */
  async process(event: BlockchainEvent): Promise<void> {
    try {
      switch (event.eventName) {
        case 'Staked':
          await this.handleStaked(event);
          break;
        case 'Unstaked':
          await this.handleUnstaked(event);
          break;
        case 'RewardClaimed':
          await this.handleRewardClaimed(event);
          break;
        case 'RewardPoolFunded':
          await this.handleRewardPoolFunded(event);
          break;
        case 'Transfer':
          await this.handleTransfer(event);
          break;
        case 'Subscribed':
          await this.handleSubscribed(event);
          break;
        default:
          console.warn(`[EventProcessor] Unhandled event: ${event.eventName}`);
      }

      await this.logAuditTrail(event);
    } catch (err: any) {
      console.error(`[EventProcessor] Failed to process ${event.eventName}:`, err.message);
    }
  }

  // ── Individual handlers ────────────────────────────────────────────

  private async handleStaked(event: BlockchainEvent): Promise<void> {
    const { user, amount, tierId, lockupEnd } = event.args;
    const joyAmount = formatJoy(amount);

    const wallet = await this.findWalletByAddress(user);
    const tx = await transactionService.createTransaction({
      tx_type: 'TOKEN_DEPOSIT',
      from_wallet_id: wallet?.id,
      amount: joyAmount,
      currency: 'JY',
      description: `On-chain stake: ${joyAmount} JOY (tier ${tierId})`,
      metadata: {
        source: 'blockchain',
        event: 'Staked',
        onChainUser: user,
        tierId,
        lockupEnd,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    });

    await transactionService.setTxHash(tx.id, event.txHash);
    await transactionService.updateStatus(tx.id, 'COMPLETED');

    if (wallet) {
      await walletService.debitWallet(wallet.id, 'balance_jy', joyAmount).catch(() => {});
    }

    await this.createJournalEntry(
      'TOKEN_DEPOSIT',
      joyAmount,
      `Staked ${joyAmount} JOY on-chain (tier ${tierId})`,
      tx.id,
    );

    await notificationService.notifySuperAdmin(
      'On-chain Stake Detected',
      `${user} staked ${joyAmount} JOY (tier ${tierId}). Tx: ${event.txHash}`,
      'BLOCKCHAIN',
      'MEDIUM',
      'transaction',
      tx.id,
    );
  }

  private async handleUnstaked(event: BlockchainEvent): Promise<void> {
    const { user, amount, rewards } = event.args;
    const joyAmount = formatJoy(amount);
    const rewardAmount = formatJoy(rewards);
    const total = joyAmount + rewardAmount;

    const wallet = await this.findWalletByAddress(user);
    const tx = await transactionService.createTransaction({
      tx_type: 'TOKEN_WITHDRAWAL',
      to_wallet_id: wallet?.id,
      amount: total,
      currency: 'JY',
      description: `On-chain unstake: ${joyAmount} JOY + ${rewardAmount} reward`,
      metadata: {
        source: 'blockchain',
        event: 'Unstaked',
        onChainUser: user,
        principal: joyAmount,
        rewards: rewardAmount,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    });

    await transactionService.setTxHash(tx.id, event.txHash);
    await transactionService.updateStatus(tx.id, 'COMPLETED');

    if (wallet) {
      await walletService.creditWallet(wallet.id, 'balance_jy', total).catch(() => {});
    }

    await this.createJournalEntry(
      'TOKEN_WITHDRAWAL',
      total,
      `Unstaked ${joyAmount} JOY + ${rewardAmount} reward`,
      tx.id,
    );

    await notificationService.notifySuperAdmin(
      'On-chain Unstake Detected',
      `${user} unstaked ${joyAmount} JOY with ${rewardAmount} reward. Tx: ${event.txHash}`,
      'BLOCKCHAIN',
      'MEDIUM',
      'transaction',
      tx.id,
    );
  }

  private async handleRewardClaimed(event: BlockchainEvent): Promise<void> {
    const { user, amount } = event.args;
    const joyAmount = formatJoy(amount);

    const wallet = await this.findWalletByAddress(user);
    const tx = await transactionService.createTransaction({
      tx_type: 'TOKEN_DEPOSIT',
      to_wallet_id: wallet?.id,
      amount: joyAmount,
      currency: 'JY',
      description: `On-chain reward claim: ${joyAmount} JOY`,
      metadata: {
        source: 'blockchain',
        event: 'RewardClaimed',
        onChainUser: user,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    });

    await transactionService.setTxHash(tx.id, event.txHash);
    await transactionService.updateStatus(tx.id, 'COMPLETED');

    if (wallet) {
      await walletService.creditWallet(wallet.id, 'balance_jy', joyAmount).catch(() => {});
    }
  }

  private async handleRewardPoolFunded(event: BlockchainEvent): Promise<void> {
    const { funder, amount } = event.args;
    const joyAmount = formatJoy(amount);

    const tx = await transactionService.createTransaction({
      tx_type: 'TOKEN_DEPOSIT',
      amount: joyAmount,
      currency: 'JY',
      description: `Reward pool funded: ${joyAmount} JOY by ${funder}`,
      metadata: {
        source: 'blockchain',
        event: 'RewardPoolFunded',
        onChainFunder: funder,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    });

    await transactionService.setTxHash(tx.id, event.txHash);
    await transactionService.updateStatus(tx.id, 'COMPLETED');

    await notificationService.notifySuperAdmin(
      'Reward Pool Funded',
      `${funder} funded the staking reward pool with ${joyAmount} JOY. Tx: ${event.txHash}`,
      'BLOCKCHAIN',
      'HIGH',
      'transaction',
      tx.id,
    );
  }

  private async handleTransfer(event: BlockchainEvent): Promise<void> {
    const { from, to, value } = event.args;
    const joyAmount = formatJoy(value);

    const isMint = from === ethers.ZeroAddress;
    const isBurn = to === ethers.ZeroAddress;

    if (isMint || isBurn) return;

    const senderWallet = await this.findWalletByAddress(from);
    const receiverWallet = await this.findWalletByAddress(to);

    if (!senderWallet && !receiverWallet) return;

    const tx = await transactionService.createTransaction({
      tx_type: 'TOKEN_TRANSFER',
      from_wallet_id: senderWallet?.id,
      to_wallet_id: receiverWallet?.id,
      amount: joyAmount,
      currency: 'JY',
      description: `On-chain JOY transfer: ${joyAmount} from ${from} to ${to}`,
      metadata: {
        source: 'blockchain',
        event: 'Transfer',
        onChainFrom: from,
        onChainTo: to,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    });

    await transactionService.setTxHash(tx.id, event.txHash);
    await transactionService.updateStatus(tx.id, 'COMPLETED');

    if (senderWallet) {
      await walletService.debitWallet(senderWallet.id, 'balance_jy', joyAmount).catch(() => {});
    }
    if (receiverWallet) {
      await walletService.creditWallet(receiverWallet.id, 'balance_jy', joyAmount).catch(() => {});
    }
  }

  private async handleSubscribed(event: BlockchainEvent): Promise<void> {
    const { user, planId, expiry } = event.args;

    const wallet = await this.findWalletByAddress(user);
    const tx = await transactionService.createTransaction({
      tx_type: 'SUBSCRIPTION_PAYMENT',
      from_wallet_id: wallet?.id,
      amount: 0,
      currency: 'JY',
      description: `On-chain subscription: plan ${planId} until ${new Date(Number(expiry) * 1000).toISOString()}`,
      metadata: {
        source: 'blockchain',
        event: 'Subscribed',
        onChainUser: user,
        planId,
        expiry,
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    });

    await transactionService.setTxHash(tx.id, event.txHash);
    await transactionService.updateStatus(tx.id, 'COMPLETED');

    await notificationService.notifySuperAdmin(
      'On-chain Subscription',
      `${user} subscribed to plan ${planId}. Tx: ${event.txHash}`,
      'BLOCKCHAIN',
      'LOW',
      'transaction',
      tx.id,
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────

  /**
   * Attempt to find a CFIS wallet whose on-chain address matches.
   * Returns null if no match (external / unknown address).
   */
  private async findWalletByAddress(address: string): Promise<{ id: string } | null> {
    try {
      const result = await (await import('../database/connection')).default.query<{ id: string }>(
        'SELECT id FROM wallets WHERE LOWER(wallet_address) = LOWER($1) AND is_active = true LIMIT 1',
        [address],
      );
      return result.rows[0] || null;
    } catch {
      return null;
    }
  }

  private async logAuditTrail(event: BlockchainEvent): Promise<void> {
    try {
      await auditService.log({
        action: `BLOCKCHAIN_EVENT:${event.eventName}`,
        actor: 'BLOCKCHAIN_LISTENER',
        entity_type: event.contractName,
        entity_id: event.txHash,
        new_value: {
          contractAddress: event.contractAddress,
          args: event.args,
          blockNumber: event.blockNumber,
          logIndex: event.logIndex,
        },
      });
    } catch {
      // Audit logging is best-effort
    }
  }

  private async createJournalEntry(
    txType: TxType,
    amount: number,
    description: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const debitAccount = txType === 'TOKEN_DEPOSIT' ? '1300' : '5100';
      const creditAccount = txType === 'TOKEN_DEPOSIT' ? '4100' : '1300';

      await ledgerService.createJournalEntry({
        description,
        reference_type: 'transaction',
        reference_id: transactionId,
        created_by: 'BLOCKCHAIN_LISTENER',
        lines: [
          { account_code: debitAccount, debit: amount, credit: 0, currency: 'JY', description },
          { account_code: creditAccount, debit: 0, credit: amount, currency: 'JY', description },
        ],
      });
    } catch {
      // Ledger entry is best-effort during event processing
    }
  }
}

export const eventProcessor = new EventProcessorService();
