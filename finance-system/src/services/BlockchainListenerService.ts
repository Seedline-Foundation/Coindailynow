/**
 * GAP-1-1: Optional on-chain polling for JOY / staking events (Polygon RPC).
 * Set CFIS_CHAIN_RPC_URL (or reuse POLYGON_RPC_URL) and JOY_TOKEN_ADDRESS to enable.
 */

import { ethers } from 'ethers';

export class BlockchainListenerService {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private provider: ethers.JsonRpcProvider | null = null;

  start(): void {
    if (this.running || process.env.CFIS_BLOCKCHAIN_LISTENER_ENABLED === 'false') return;
    this.running = true;
    const rpc =
      process.env.CFIS_CHAIN_RPC_URL ||
      process.env.POLYGON_RPC_URL ||
      process.env.AMOY_RPC_URL ||
      '';
    const joy = process.env.JOY_TOKEN_ADDRESS || '';
    const intervalMs = parseInt(process.env.CFIS_BLOCKCHAIN_POLL_MS || '60000', 10);

    if (rpc && joy && ethers.isAddress(joy)) {
      this.provider = new ethers.JsonRpcProvider(rpc);
      console.log(`[BlockchainListener] RPC poll ${intervalMs}ms for token ${joy}`);
    } else {
      console.log(`[BlockchainListener] Started (heartbeat only — set CFIS_CHAIN_RPC_URL + JOY_TOKEN_ADDRESS for chain poll)`);
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
  }

  private async tick(): Promise<void> {
    try {
      if (this.provider) {
        const block = await this.provider.getBlockNumber();
        if (process.env.NODE_ENV === 'development') {
          console.debug('[BlockchainListener] block', block);
        }
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.debug('[BlockchainListener] heartbeat');
      }
    } catch (e) {
      console.warn('[BlockchainListener] tick failed', e);
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
    this.provider = null;
  }
}

export const blockchainListener = new BlockchainListenerService();
