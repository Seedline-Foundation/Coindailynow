/**
 * JY Token Service - Backend Integration
 * Handles all JY token operations: staking, conversion, revenue distribution
 */

import { ethers } from 'ethers';
import { PrismaClient, Prisma } from '@prisma/client';
// import { JY_TOKEN_ABI } from '../contracts/abis/JoyToken';

// Temporary ABI placeholder - replace with actual ABI
const JY_TOKEN_ABI: any[] = [];

const prisma = new PrismaClient();

export interface JYTokenConfig {
  contractAddress: string;
  rpcUrl: string;
  privateKey: string;
  networkId: number;
}

export interface StakeInfo {
  amount: number;
  startTime: Date;
  lastClaimTime: Date;
  pendingRewards: number;
  unstakeRequestTime: Date | null;
  unstakeUnlockTime: Date | null;
}

export interface StakingStats {
  totalStaked: number;
  totalStakers: number;
  currentAPR: number;
  totalYieldDistributed: number;
  availableYieldPool: number;
}

export interface ConversionResult {
  success: boolean;
  jyAmount: number;
  cePointsUsed: number;
  transactionHash: string;
  timestamp: Date;
}

export class JYTokenService {
  private contract: ethers.Contract;
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private config: JYTokenConfig;

  constructor(config: JYTokenConfig) {
    this.config = config;
    
    // Initialize provider
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize signer (for admin operations)
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    
    // Initialize contract
    this.contract = new ethers.Contract(
      config.contractAddress,
      JY_TOKEN_ABI,
      this.signer
    );
  }

  // ========== CE POINTS TO JY CONVERSION ==========

  /**
   * Convert CE Points to JY tokens
   * Rate: 100 CE Points = 1 JY
   */
  async convertCEToJY(userId: string, cePoints: number): Promise<ConversionResult> {
    try {
      // Validate input
      if (cePoints < 100) {
        throw new Error('Minimum 100 CE Points required for conversion');
      }

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { Wallets: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get the primary wallet (first wallet or the one with cePoints)
      const wallet = user.Wallets.find(w => w.walletType === 'USER_WALLET' && w.cePoints > 0) || user.Wallets[0];
      
      if (!wallet) {
        throw new Error('User wallet not found');
      }

      if (wallet.cePoints < cePoints) {
        throw new Error(`Insufficient CE Points. Have: ${wallet.cePoints}, Need: ${cePoints}`);
      }

      // Calculate JY amount
      const jyAmount = cePoints / 100; // 100 CE = 1 JY

      // Check contract balance
      const contractBalance = await this.contract.balanceOf(this.contract.address);
      const requiredBalance = ethers.utils.parseEther(jyAmount.toString());

      if (contractBalance.lt(requiredBalance)) {
        throw new Error('Insufficient JY in contract. Please contact support.');
      }

      // Call smart contract
      const tx = await this.contract.convertCEPointsToJY(
        wallet.walletAddress,
        cePoints
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      // Update database in transaction
      await prisma.$transaction([
        // Deduct CE Points from wallet
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            cePoints: { decrement: cePoints },
            updatedAt: new Date()
          }
        }),

        // Add JY to wallet
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            joyTokens: { increment: jyAmount },
            totalBalance: { increment: jyAmount },
            lastTransactionAt: new Date(),
            updatedAt: new Date()
          }
        }),

        // Create transaction record
        prisma.walletTransaction.create({
          data: {
            transactionHash: receipt.transactionHash,
            transactionType: 'CONVERSION',
            operationType: 'CE_TO_JY',
            fromWalletId: null,
            toWalletId: wallet.id,
            amount: jyAmount,
            currency: 'JY',
            netAmount: jyAmount,
            purpose: 'CE_POINTS_CONVERSION',
            status: 'COMPLETED',
            blockchainTxHash: receipt.transactionHash,
            blockchainConfirmations: 1,
            metadata: JSON.stringify({
              cePoints,
              conversionRate: 100,
              userId,
              timestamp: new Date()
            })
          }
        }),

        // Create audit log
        prisma.auditEvent.create({
          data: {
            type: 'TOKEN_CONVERSION',
            action: 'CE_TO_JY_CONVERSION',
            userId: userId,
            timestamp: new Date(),
            details: JSON.stringify({
              cePoints,
              jyAmount,
              txHash: receipt.transactionHash
            })
          }
        })
      ]);

      console.log(`✅ Converted ${cePoints} CE Points to ${jyAmount} JY for user ${userId}`);

      return {
        success: true,
        jyAmount,
        cePointsUsed: cePoints,
        transactionHash: receipt.transactionHash,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ CE to JY conversion failed:', error);
      throw error;
    }
  }

  /**
   * Preview CE to JY conversion
   */
  async previewConversion(cePoints: number): Promise<{
    jyAmount: number;
    conversionRate: number;
    minimumCE: number;
    valid: boolean;
    message: string;
  }> {
    const jyAmount = cePoints / 100;
    const valid = cePoints >= 100;
    const message = valid ? 'Conversion available' : 'Minimum 100 CE Points required';

    return {
      jyAmount,
      conversionRate: 100,
      minimumCE: 100,
      valid,
      message
    };
  }

  // ========== STAKING OPERATIONS ==========

  /**
   * Stake JY tokens
   */
  async stakeJY(userId: string, amount: number): Promise<{ transactionHash: string }> {
    try {
      // Validate minimum stake
      if (amount < 10) {
        throw new Error('Minimum stake is 10 JY');
      }

      // Get user wallet
      const wallet = await prisma.wallet.findFirst({
        where: { userId },
        include: { user: true }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.joyTokens < amount) {
        throw new Error(`Insufficient JY balance. Have: ${wallet.joyTokens}, Need: ${amount}`);
      }

      // Approve contract to spend tokens (if needed)
      // NOTE: Private key management needs proper implementation
      const userContract = this.contract.connect(
        new ethers.Wallet(this.config.privateKey, this.provider)
      );

      // Call stake function
      const tx = await userContract.stake(
        ethers.utils.parseEther(amount.toString())
      );

      const receipt = await tx.wait();

      // Update database
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            joyTokens: { decrement: amount },
            stakedBalance: { increment: amount },
            lastTransactionAt: new Date(),
            updatedAt: new Date()
          }
        }),

        prisma.walletTransaction.create({
          data: {
            transactionHash: receipt.transactionHash,
            transactionType: 'STAKE',
            operationType: 'STAKE_JY',
            fromWalletId: wallet.id,
            toWalletId: null,
            amount: amount,
            currency: 'JY',
            netAmount: amount,
            purpose: 'STAKING',
            status: 'COMPLETED',
            blockchainTxHash: receipt.transactionHash,
            metadata: JSON.stringify({ userId, amount, apr: 30 })
          }
        })
      ]);

      console.log(`✅ Staked ${amount} JY for user ${userId}`);

      return { transactionHash: receipt.transactionHash };

    } catch (error) {
      console.error('❌ Staking failed:', error);
      throw error;
    }
  }

  /**
   * Request unstake (starts 7-day cooldown)
   */
  async requestUnstake(userId: string): Promise<{ unlockTime: Date }> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: { userId },
        include: { user: true }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const userContract = this.contract.connect(
        new ethers.Wallet(this.config.privateKey, this.provider)
      );

      const tx = await userContract.requestUnstake();
      await tx.wait();

      const unlockTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      console.log(`✅ Unstake requested for user ${userId}, unlock time: ${unlockTime}`);

      return { unlockTime };

    } catch (error) {
      console.error('❌ Request unstake failed:', error);
      throw error;
    }
  }

  /**
   * Unstake JY tokens (after cooldown)
   */
  async unstakeJY(userId: string): Promise<{ transactionHash: string; amount: number; rewards: number }> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: { userId },
        include: { user: true }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get stake info from contract
      const stakeInfo = await this.getUserStakeInfo(wallet.walletAddress);

      if (!stakeInfo.unstakeUnlockTime) {
        throw new Error('Unstake not requested');
      }

      if (new Date() < stakeInfo.unstakeUnlockTime) {
        throw new Error('Cooldown period not completed');
      }

      const userContract = this.contract.connect(
        new ethers.Wallet(this.config.privateKey, this.provider)
      );

      const tx = await userContract.unstake();
      const receipt = await tx.wait();

      const amount = stakeInfo.amount;
      const rewards = stakeInfo.pendingRewards;
      const totalAmount = amount + rewards;

      // Update database
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            joyTokens: { increment: totalAmount },
            stakedBalance: { decrement: amount },
            lastTransactionAt: new Date(),
            updatedAt: new Date()
          }
        }),

        prisma.walletTransaction.create({
          data: {
            transactionHash: receipt.transactionHash,
            transactionType: 'UNSTAKE',
            operationType: 'UNSTAKE_JY',
            fromWalletId: null,
            toWalletId: wallet.id,
            amount: totalAmount,
            currency: 'JY',
            netAmount: totalAmount,
            purpose: 'UNSTAKING',
            status: 'COMPLETED',
            blockchainTxHash: receipt.transactionHash,
            metadata: JSON.stringify({ 
              userId, 
              stakedAmount: amount, 
              rewards,
              totalAmount 
            })
          }
        })
      ]);

      console.log(`✅ Unstaked ${amount} JY + ${rewards} rewards for user ${userId}`);

      return { 
        transactionHash: receipt.transactionHash,
        amount,
        rewards
      };

    } catch (error) {
      console.error('❌ Unstaking failed:', error);
      throw error;
    }
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(userId: string): Promise<{ transactionHash: string; amount: number }> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: { userId },
        include: { user: true }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const userContract = this.contract.connect(
        new ethers.Wallet(this.config.privateKey, this.provider)
      );

      // Get pending rewards
      const rewards = await userContract.calculateRewards(wallet.walletAddress);
      const rewardsAmount = parseFloat(ethers.utils.formatEther(rewards));

      if (rewardsAmount === 0) {
        throw new Error('No rewards to claim');
      }

      const tx = await userContract.claimRewards();
      const receipt = await tx.wait();

      // Update database
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            joyTokens: { increment: rewardsAmount },
            lastTransactionAt: new Date(),
            updatedAt: new Date()
          }
        }),

        prisma.walletTransaction.create({
          data: {
            transactionHash: receipt.transactionHash,
            transactionType: 'REWARD',
            operationType: 'CLAIM_JY_REWARDS',
            fromWalletId: null,
            toWalletId: wallet.id,
            amount: rewardsAmount,
            currency: 'JY',
            netAmount: rewardsAmount,
            purpose: 'REWARD',
            status: 'COMPLETED',
            blockchainTxHash: receipt.transactionHash,
            metadata: JSON.stringify({ userId, rewards: rewardsAmount })
          }
        })
      ]);

      console.log(`✅ Claimed ${rewardsAmount} JY rewards for user ${userId}`);

      return {
        transactionHash: receipt.transactionHash,
        amount: rewardsAmount
      };

    } catch (error) {
      console.error('❌ Claim rewards failed:', error);
      throw error;
    }
  }

  // ========== REVENUE OPERATIONS ==========

  /**
   * Deposit protocol revenue for staking yield
   * This is the "Real Yield" mechanism
   */
  async depositRevenue(amount: number, source: string): Promise<{ transactionHash: string }> {
    try {
      const tx = await this.contract.depositRevenue(
        ethers.utils.parseEther(amount.toString()),
        source
      );

      const receipt = await tx.wait();

      // Log revenue deposit
      await prisma.auditEvent.create({
        data: {
          type: 'REVENUE_DEPOSIT',
          action: 'JY_YIELD_FUNDING',
          timestamp: new Date(),
          details: JSON.stringify({
            amount,
            source,
            txHash: receipt.transactionHash
          })
        }
      });

      console.log(`✅ Deposited ${amount} JY revenue from ${source}`);

      return { transactionHash: receipt.transactionHash };

    } catch (error) {
      console.error('❌ Revenue deposit failed:', error);
      throw error;
    }
  }

  // ========== VIEW FUNCTIONS ==========

  /**
   * Get user's stake information
   */
  async getUserStakeInfo(walletAddress: string): Promise<StakeInfo> {
    const stake = await this.contract.getStakeInfo(walletAddress);

    return {
      amount: parseFloat(ethers.utils.formatEther(stake.amount)),
      startTime: new Date(stake.startTime.toNumber() * 1000),
      lastClaimTime: new Date(stake.lastClaimTime.toNumber() * 1000),
      pendingRewards: parseFloat(ethers.utils.formatEther(stake.pendingRewards)),
      unstakeRequestTime: stake.unstakeRequestTime.toNumber() > 0 
        ? new Date(stake.unstakeRequestTime.toNumber() * 1000) 
        : null,
      unstakeUnlockTime: stake.unstakeUnlockTime.toNumber() > 0 
        ? new Date(stake.unstakeUnlockTime.toNumber() * 1000) 
        : null
    };
  }

  /**
   * Get global staking statistics
   */
  async getStakingStats(): Promise<StakingStats> {
    const stats = await this.contract.getStakingStats();

    return {
      totalStaked: parseFloat(ethers.utils.formatEther(stats._totalStaked)),
      totalStakers: stats._totalStakers.toNumber(),
      currentAPR: stats._currentAPR.toNumber(),
      totalYieldDistributed: parseFloat(ethers.utils.formatEther(stats._totalYieldDistributed)),
      availableYieldPool: parseFloat(ethers.utils.formatEther(stats._availableYieldPool))
    };
  }

  /**
   * Get yield pool status (sustainability metrics)
   */
  async getYieldPoolStatus() {
    const status = await this.contract.getYieldPoolStatus();

    return {
      available: parseFloat(ethers.utils.formatEther(status.available)),
      totalDeposited: parseFloat(ethers.utils.formatEther(status.totalDeposited)),
      totalDistributed: parseFloat(ethers.utils.formatEther(status.totalDistributed)),
      currentAPR: status.currentAPR.toNumber(),
      projectedDays: status.projectedDays.toNumber()
    };
  }

  /**
   * Get token statistics
   */
  async getTokenStats() {
    const stats = await this.contract.getTokenStats();

    return {
      totalSupply: parseFloat(ethers.utils.formatEther(stats._totalSupply)),
      circulatingSupply: parseFloat(ethers.utils.formatEther(stats._circulatingSupply)),
      totalBurned: parseFloat(ethers.utils.formatEther(stats._totalBurned)),
      totalStaked: parseFloat(ethers.utils.formatEther(stats._totalStaked)),
      contractBalance: parseFloat(ethers.utils.formatEther(stats._contractBalance))
    };
  }

  /**
   * Get user's JY balance
   */
  async getBalance(walletAddress: string): Promise<number> {
    const balance = await this.contract.balanceOf(walletAddress);
    return parseFloat(ethers.utils.formatEther(balance));
  }
}

// Export singleton instance
export const jyTokenService = new JYTokenService({
  contractAddress: process.env.JY_TOKEN_ADDRESS!,
  rpcUrl: process.env.POLYGON_RPC_URL!,
  privateKey: process.env.ADMIN_PRIVATE_KEY!,
  networkId: parseInt(process.env.POLYGON_NETWORK_ID || '137')
});
