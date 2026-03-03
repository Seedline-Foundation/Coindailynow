import db from '../database/connection';
import { Wallet, WalletOwnerType } from '../types';

export class WalletService {

  async createWallet(ownerType: WalletOwnerType, ownerId: string, walletAddress?: string): Promise<Wallet> {
    const id = db.generateId();
    const result = await db.query<Wallet>(
      `INSERT INTO wallets (id, owner_type, owner_id, wallet_address, balance_points, balance_jy, balance_usd, is_active, is_verified)
       VALUES ($1, $2, $3, $4, 0, 0, 0, true, false)
       RETURNING *`,
      [id, ownerType, ownerId, walletAddress || null]
    );
    return result.rows[0];
  }

  async getWallet(walletId: string): Promise<Wallet | null> {
    const result = await db.query<Wallet>('SELECT * FROM wallets WHERE id = $1', [walletId]);
    return result.rows[0] || null;
  }

  async getWalletByOwner(ownerType: WalletOwnerType, ownerId: string): Promise<Wallet | null> {
    const result = await db.query<Wallet>(
      'SELECT * FROM wallets WHERE owner_type = $1 AND owner_id = $2',
      [ownerType, ownerId]
    );
    return result.rows[0] || null;
  }

  async getTreasuryWallet(): Promise<Wallet> {
    let wallet = await this.getWalletByOwner('TREASURY', 'CFIS_TREASURY');
    if (!wallet) {
      wallet = await this.createWallet('TREASURY', 'CFIS_TREASURY');
    }
    return wallet;
  }

  async getEscrowWallet(): Promise<Wallet> {
    let wallet = await this.getWalletByOwner('ESCROW', 'CFIS_ESCROW');
    if (!wallet) {
      wallet = await this.createWallet('ESCROW', 'CFIS_ESCROW');
    }
    return wallet;
  }

  async creditWallet(walletId: string, field: 'balance_jy' | 'balance_points' | 'balance_usd', amount: number): Promise<Wallet> {
    const result = await db.query<Wallet>(
      `UPDATE wallets SET ${field} = ${field} + $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [amount, walletId]
    );
    if (!result.rows[0]) throw new Error(`Wallet ${walletId} not found`);
    return result.rows[0];
  }

  async debitWallet(walletId: string, field: 'balance_jy' | 'balance_points' | 'balance_usd', amount: number): Promise<Wallet> {
    // Check balance first
    const wallet = await this.getWallet(walletId);
    if (!wallet) throw new Error(`Wallet ${walletId} not found`);
    if ((wallet as any)[field] < amount) {
      throw new Error(`Insufficient ${field} balance. Available: ${(wallet as any)[field]}, Requested: ${amount}`);
    }
    const result = await db.query<Wallet>(
      `UPDATE wallets SET ${field} = ${field} - $1, updated_at = NOW() WHERE id = $2 AND ${field} >= $1 RETURNING *`,
      [amount, walletId]
    );
    if (!result.rows[0]) throw new Error(`Insufficient balance or wallet not found`);
    return result.rows[0];
  }

  async listWallets(filters?: { owner_type?: WalletOwnerType; is_active?: boolean }): Promise<Wallet[]> {
    let query = 'SELECT * FROM wallets WHERE 1=1';
    const params: any[] = [];
    if (filters?.owner_type) {
      params.push(filters.owner_type);
      query += ` AND owner_type = $${params.length}`;
    }
    if (filters?.is_active !== undefined) {
      params.push(filters.is_active);
      query += ` AND is_active = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query<Wallet>(query, params);
    return result.rows;
  }

  async verifyWallet(walletId: string): Promise<Wallet> {
    const result = await db.query<Wallet>(
      'UPDATE wallets SET is_verified = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [walletId]
    );
    if (!result.rows[0]) throw new Error(`Wallet ${walletId} not found`);
    return result.rows[0];
  }

  async setWalletAddress(walletId: string, address: string): Promise<Wallet> {
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid wallet address format');
    }
    const result = await db.query<Wallet>(
      'UPDATE wallets SET wallet_address = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [address, walletId]
    );
    if (!result.rows[0]) throw new Error(`Wallet ${walletId} not found`);
    return result.rows[0];
  }

  /**
   * Find a wallet by owner ID and type — throws if not found.
   * Used by press order flow to locate existing publisher wallets.
   */
  async findWalletByOwner(ownerId: string, ownerType: WalletOwnerType): Promise<Wallet> {
    const wallet = await this.getWalletByOwner(ownerType, ownerId);
    if (!wallet) throw new Error(`No ${ownerType} wallet found for owner ${ownerId}`);
    return wallet;
  }
}

export const walletService = new WalletService();
