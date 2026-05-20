/**
 * GAP-1-1: Real on-chain event listener for JOY/Staking/Subscription contracts.
 *
 * Subscribes via WebSocket to:
 *   - JoyToken `Transfer(from, to, amount)` events involving treasury / known wallets
 *   - StakingVault `Staked(user, amount, tierId, lockupEnd)` and
 *     `Unstaked(user, amount, rewards)` events
 *   - Subscription `Subscribed(user, planId, expiry)` events
 *
 * Each event is forwarded to backend via BackendNotifier so the backend
 * can update its projection (subscription record, wallet balance,
 * receipt issuance) and refresh its WebSocket-connected admin sessions.
 *
 * Falls back to polling (HTTPS RPC) when only HTTP RPC is configured.
 *
 * Env:
 *   CFIS_CHAIN_RPC_URL or CFIS_CHAIN_WS_URL — RPC endpoint
 *   JOY_TOKEN_ADDRESS — JoyToken address
 *   STAKING_VAULT_ADDRESS — StakingVault address (optional)
 *   SUBSCRIPTION_ADDRESS — Subscription address (optional)
 *   CFIS_BLOCKCHAIN_LISTENER_ENABLED=false to disable
 */

import { ethers } from 'ethers';
import { backendNotifier } from './BackendNotifier';

const ERC20_ABI_FRAGMENTS = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];
const STAKING_ABI_FRAGMENTS = [
  'event Staked(address indexed user, uint256 amount, uint256 tierId, uint256 lockupEnd)',
  'event Unstaked(address indexed user, uint256 amount, uint256 rewards)',
];
const SUBSCRIPTION_ABI_FRAGMENTS = [
  'event Subscribed(address indexed user, uint256 planId, uint256 expiry)',
];

export class BlockchainListenerService {
  private running = false;
  private provider: ethers.JsonRpcProvider | ethers.WebSocketProvider | null = null;
  private contracts: ethers.Contract[] = [];
  private timer: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.running || process.env.CFIS_BLOCKCHAIN_LISTENER_ENABLED === 'false') return;
    this.running = true;

    const wsRpc = process.env.CFIS_CHAIN_WS_URL;
    const httpRpc =
      process.env.CFIS_CHAIN_RPC_URL ||
      process.env.POLYGON_RPC_URL ||
      process.env.AMOY_RPC_URL ||
      '';
    const joy = process.env.JOY_TOKEN_ADDRESS || '';
    const staking = process.env.STAKING_VAULT_ADDRESS || '';
    const subscription = process.env.SUBSCRIPTION_ADDRESS || '';

    if (!joy || !ethers.isAddress(joy)) {
      console.log('[BlockchainListener] No JOY_TOKEN_ADDRESS — heartbeat-only mode');
      this.timer = setInterval(() => this.heartbeat(), 60_000);
      return;
    }

    try {
      if (wsRpc) {
        this.provider = new ethers.WebSocketProvider(wsRpc);
        console.log(`[BlockchainListener] WS connected: ${wsRpc}`);
      } else if (httpRpc) {
        this.provider = new ethers.JsonRpcProvider(httpRpc);
        console.log(`[BlockchainListener] HTTP RPC: ${httpRpc} (poll-mode)`);
      } else {
        console.warn('[BlockchainListener] No RPC URL configured');
        return;
      }

      const joyContract = new ethers.Contract(joy, ERC20_ABI_FRAGMENTS, this.provider);
      this.contracts.push(joyContract);
      joyContract.on('Transfer', (from: string, to: string, value: bigint, ev: any) => {
        void this.handleTransfer(from, to, value, ev?.log?.transactionHash);
      });

      if (staking && ethers.isAddress(staking)) {
        const stakingContract = new ethers.Contract(staking, STAKING_ABI_FRAGMENTS, this.provider);
        this.contracts.push(stakingContract);
        stakingContract.on(
          'Staked',
          (user: string, amount: bigint, tierId: bigint, lockupEnd: bigint, ev: any) => {
            void this.handleStaked(user, amount, tierId, lockupEnd, ev?.log?.transactionHash);
          },
        );
        stakingContract.on(
          'Unstaked',
          (user: string, amount: bigint, rewards: bigint, ev: any) => {
            void this.handleUnstaked(user, amount, rewards, ev?.log?.transactionHash);
          },
        );
      }

      if (subscription && ethers.isAddress(subscription)) {
        const subContract = new ethers.Contract(
          subscription,
          SUBSCRIPTION_ABI_FRAGMENTS,
          this.provider,
        );
        this.contracts.push(subContract);
        subContract.on(
          'Subscribed',
          (user: string, planId: bigint, expiry: bigint, ev: any) => {
            void this.handleSubscribed(user, planId, expiry, ev?.log?.transactionHash);
          },
        );
      }

      console.log(`[BlockchainListener] Subscribed to ${this.contracts.length} contract(s)`);
    } catch (e: any) {
      console.error('[BlockchainListener] start failed', { error: e?.message });
      this.running = false;
    }
  }

  private async handleTransfer(from: string, to: string, value: bigint, txHash?: string) {
    const treasury = process.env.JOY_TREASURY_ADDRESS?.toLowerCase();
    if (!treasury) return; // we only forward when we know whose wallet to credit

    const isInbound = to.toLowerCase() === treasury;
    const isOutbound = from.toLowerCase() === treasury;
    if (!isInbound && !isOutbound) return;

    await backendNotifier.emit(
      isInbound ? 'WALLET_DEPOSIT_CONFIRMED' : 'WALLET_WITHDRAWAL_COMPLETED',
      txHash || `transfer_${Date.now()}`,
      {
        from,
        to,
        value: value.toString(),
        currency: 'JOY',
        txHash,
      },
    );
  }

  private async handleStaked(
    user: string,
    amount: bigint,
    tierId: bigint,
    lockupEnd: bigint,
    txHash?: string,
  ) {
    await backendNotifier.emit(
      'WALLET_DEPOSIT_CONFIRMED',
      txHash || `stake_${Date.now()}`,
      {
        kind: 'STAKE',
        user,
        amount: amount.toString(),
        tierId: tierId.toString(),
        lockupEnd: lockupEnd.toString(),
        currency: 'JOY',
      },
    );
  }

  private async handleUnstaked(user: string, amount: bigint, rewards: bigint, txHash?: string) {
    await backendNotifier.emit(
      'WALLET_WITHDRAWAL_COMPLETED',
      txHash || `unstake_${Date.now()}`,
      {
        kind: 'UNSTAKE',
        user,
        amount: amount.toString(),
        rewards: rewards.toString(),
        currency: 'JOY',
      },
    );
  }

  private async handleSubscribed(user: string, planId: bigint, expiry: bigint, txHash?: string) {
    await backendNotifier.emit(
      'PAYMENT_CONFIRMED',
      txHash || `sub_${Date.now()}`,
      {
        kind: 'ON_CHAIN_SUBSCRIPTION',
        user,
        planId: planId.toString(),
        expiry: expiry.toString(),
        currency: 'JOY',
      },
    );
  }

  private async heartbeat(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[BlockchainListener] heartbeat');
    }
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const c of this.contracts) {
      try {
        c.removeAllListeners();
      } catch {
        /* noop */
      }
    }
    this.contracts = [];
    if (this.provider && 'destroy' in this.provider) {
      try {
        await (this.provider as any).destroy();
      } catch {
        /* noop */
      }
    }
    this.provider = null;
    this.running = false;
  }
}

export const blockchainListener = new BlockchainListenerService();
