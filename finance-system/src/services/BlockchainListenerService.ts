/**
 * CFIS Blockchain Listener — WebSocket-based on-chain event listener for Polygon.
 *
 * Connects to a Polygon RPC WebSocket endpoint and subscribes to events emitted by:
 *   - StakingVault  (Staked, Unstaked, RewardClaimed, RewardPoolFunded)
 *   - JoyToken      (Transfer)
 *   - Subscription   (Subscribed)
 *
 * Each captured event is forwarded to EventProcessorService for recording in the
 * CFIS database and wallet balance adjustments.
 *
 * Env vars:
 *   POLYGON_WS_RPC_URL          — WebSocket RPC endpoint (wss://…)
 *   STAKING_VAULT_ADDRESS       — Deployed StakingVault contract address
 *   JOY_TOKEN_ADDRESS           — Deployed JoyToken contract address
 *   SUBSCRIPTION_ADDRESS        — Deployed Subscription contract address
 *   ENABLE_BLOCKCHAIN_LISTENER  — "true" to start the listener (default: disabled)
 */

import { ethers } from 'ethers';
import { eventProcessor, BlockchainEvent } from './EventProcessorService';

// ── ABI fragments (event signatures only) ───────────────────────────

const STAKING_VAULT_ABI = [
  'event Staked(address indexed user, uint256 amount, uint256 tierId, uint256 lockupEnd)',
  'event Unstaked(address indexed user, uint256 amount, uint256 rewards)',
  'event RewardClaimed(address indexed user, uint256 amount)',
  'event RewardPoolFunded(address indexed funder, uint256 amount)',
];

const JOY_TOKEN_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

const SUBSCRIPTION_ABI = [
  'event Subscribed(address indexed user, uint256 planId, uint256 expiry)',
];

// ── Service ─────────────────────────────────────────────────────────

export class BlockchainListenerService {
  private provider: ethers.WebSocketProvider | null = null;
  private contracts: ethers.Contract[] = [];
  private running = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private lastBlockSeen = 0;
  private eventsProcessed = 0;
  private startedAt: Date | null = null;

  private static readonly MAX_RECONNECT_DELAY_MS = 60_000;
  private static readonly BASE_RECONNECT_DELAY_MS = 1_000;

  // ── Lifecycle ──────────────────────────────────────────────────────

  start(): void {
    if (this.running) return;

    const enabled =
      process.env.ENABLE_BLOCKCHAIN_LISTENER === 'true' ||
      process.env.CFIS_BLOCKCHAIN_LISTENER_ENABLED === 'true';

    if (!enabled) {
      console.log('[BlockchainListener] Disabled — set ENABLE_BLOCKCHAIN_LISTENER=true to activate');
      return;
    }

    const wsUrl = process.env.POLYGON_WS_RPC_URL;
    if (!wsUrl) {
      console.warn('[BlockchainListener] POLYGON_WS_RPC_URL not set — cannot start');
      return;
    }

    this.running = true;
    this.startedAt = new Date();
    this.connect(wsUrl);
  }

  stop(): void {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.teardownProvider();
    console.log('[BlockchainListener] Stopped');
  }

  // ── Health ─────────────────────────────────────────────────────────

  getHealth(): {
    running: boolean;
    connected: boolean;
    lastBlockSeen: number;
    eventsProcessed: number;
    reconnectAttempts: number;
    uptimeMs: number;
  } {
    return {
      running: this.running,
      connected: this.provider !== null,
      lastBlockSeen: this.lastBlockSeen,
      eventsProcessed: this.eventsProcessed,
      reconnectAttempts: this.reconnectAttempts,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
    };
  }

  // ── Connection ────────────────────────────────────────────────────

  private connect(wsUrl: string): void {
    try {
      console.log(`[BlockchainListener] Connecting to ${wsUrl.replace(/\/[^/]{10,}$/, '/***')}…`);
      this.provider = new ethers.WebSocketProvider(wsUrl);

      this.provider.on('block', (blockNumber: number) => {
        this.lastBlockSeen = blockNumber;
        this.reconnectAttempts = 0;
      });

      this.provider.on('error', (err: Error) => {
        console.error('[BlockchainListener] Provider error:', err.message);
        this.scheduleReconnect(wsUrl);
      });

      const ws = (this.provider as any).websocket ?? (this.provider as any)._websocket;
      if (ws && typeof ws.on === 'function') {
        ws.on('close', () => {
          console.warn('[BlockchainListener] WebSocket closed');
          this.scheduleReconnect(wsUrl);
        });
      }

      this.subscribeToEvents();

      console.log('[BlockchainListener] Connected — listening for on-chain events');
    } catch (err: any) {
      console.error('[BlockchainListener] Connection failed:', err.message);
      this.scheduleReconnect(wsUrl);
    }
  }

  private teardownProvider(): void {
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider.destroy().catch(() => {});
      this.provider = null;
    }
    this.contracts = [];
  }

  private scheduleReconnect(wsUrl: string): void {
    if (!this.running) return;

    this.teardownProvider();
    this.reconnectAttempts++;

    const delay = Math.min(
      BlockchainListenerService.BASE_RECONNECT_DELAY_MS * 2 ** (this.reconnectAttempts - 1),
      BlockchainListenerService.MAX_RECONNECT_DELAY_MS,
    );

    console.log(`[BlockchainListener] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})…`);
    this.reconnectTimer = setTimeout(() => this.connect(wsUrl), delay);
  }

  // ── Event subscriptions ───────────────────────────────────────────

  private subscribeToEvents(): void {
    if (!this.provider) return;

    const stakingAddr = process.env.STAKING_VAULT_ADDRESS;
    const joyAddr = process.env.JOY_TOKEN_ADDRESS;
    const subAddr = process.env.SUBSCRIPTION_ADDRESS;

    if (stakingAddr && ethers.isAddress(stakingAddr)) {
      const staking = new ethers.Contract(stakingAddr, STAKING_VAULT_ABI, this.provider);
      this.contracts.push(staking);

      staking.on('Staked', (user: string, amount: bigint, tierId: bigint, lockupEnd: bigint, event: ethers.ContractEventPayload) => {
        this.handleEvent({
          eventName: 'Staked',
          contractName: 'StakingVault',
          contractAddress: stakingAddr,
          args: { user, amount: amount.toString(), tierId: tierId.toString(), lockupEnd: lockupEnd.toString() },
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index,
        });
      });

      staking.on('Unstaked', (user: string, amount: bigint, rewards: bigint, event: ethers.ContractEventPayload) => {
        this.handleEvent({
          eventName: 'Unstaked',
          contractName: 'StakingVault',
          contractAddress: stakingAddr,
          args: { user, amount: amount.toString(), rewards: rewards.toString() },
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index,
        });
      });

      staking.on('RewardClaimed', (user: string, amount: bigint, event: ethers.ContractEventPayload) => {
        this.handleEvent({
          eventName: 'RewardClaimed',
          contractName: 'StakingVault',
          contractAddress: stakingAddr,
          args: { user, amount: amount.toString() },
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index,
        });
      });

      staking.on('RewardPoolFunded', (funder: string, amount: bigint, event: ethers.ContractEventPayload) => {
        this.handleEvent({
          eventName: 'RewardPoolFunded',
          contractName: 'StakingVault',
          contractAddress: stakingAddr,
          args: { funder, amount: amount.toString() },
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index,
        });
      });

      console.log(`[BlockchainListener] Subscribed to StakingVault events at ${stakingAddr}`);
    }

    if (joyAddr && ethers.isAddress(joyAddr)) {
      const joy = new ethers.Contract(joyAddr, JOY_TOKEN_ABI, this.provider);
      this.contracts.push(joy);

      joy.on('Transfer', (from: string, to: string, value: bigint, event: ethers.ContractEventPayload) => {
        this.handleEvent({
          eventName: 'Transfer',
          contractName: 'JoyToken',
          contractAddress: joyAddr,
          args: { from, to, value: value.toString() },
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index,
        });
      });

      console.log(`[BlockchainListener] Subscribed to JoyToken Transfer events at ${joyAddr}`);
    }

    if (subAddr && ethers.isAddress(subAddr)) {
      const sub = new ethers.Contract(subAddr, SUBSCRIPTION_ABI, this.provider);
      this.contracts.push(sub);

      sub.on('Subscribed', (user: string, planId: bigint, expiry: bigint, event: ethers.ContractEventPayload) => {
        this.handleEvent({
          eventName: 'Subscribed',
          contractName: 'Subscription',
          contractAddress: subAddr,
          args: { user, planId: planId.toString(), expiry: expiry.toString() },
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          logIndex: event.log.index,
        });
      });

      console.log(`[BlockchainListener] Subscribed to Subscription events at ${subAddr}`);
    }

    if (!stakingAddr && !joyAddr && !subAddr) {
      console.warn('[BlockchainListener] No contract addresses configured — listening for blocks only');
    }
  }

  // ── Event handling ────────────────────────────────────────────────

  private handleEvent(evt: BlockchainEvent): void {
    this.eventsProcessed++;
    console.log(
      `[BlockchainListener] ${evt.contractName}.${evt.eventName} block=${evt.blockNumber} tx=${evt.txHash}`,
    );
    eventProcessor.process(evt).catch((err) => {
      console.error(`[BlockchainListener] EventProcessor error for ${evt.eventName}:`, err.message);
    });
  }
}

export const blockchainListener = new BlockchainListenerService();
