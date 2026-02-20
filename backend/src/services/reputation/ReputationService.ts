/**
 * Reputation Service
 * Feature 07: On-Chain Reputation & Merchant Scoring System
 * 
 * Backend service for managing merchant reputation scores and badges.
 * Integrates with Polygon-deployed ReputationSBT contract.
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

// Badge types matching the Solidity contract
export enum BadgeType {
  NONE = 0,
  VERIFIED_MERCHANT = 1,
  ECO_EARLY_ADOPTER = 2,
  FAST_SETTLER = 3,
  HIGH_VOLUME_TRADER = 4,
  DISPUTE_FREE = 5,
}

export interface ReputationData {
  walletAddress: string;
  score: number;
  totalTransactions: number;
  successfulTransactions: number;
  volumeUsd: number;
  disputeCount: number;
  settlementScore: number;
  zkVerified: boolean;
  badges: BadgeType[];
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
}

export interface TransactionRecord {
  walletAddress: string;
  volumeUsd: number;
  successful: boolean;
  sameDaySettlement: boolean;
}

// Reputation score tier thresholds
const TIER_THRESHOLDS = {
  DIAMOND: 900,
  PLATINUM: 750,
  GOLD: 500,
  SILVER: 250,
  BRONZE: 0,
};

// ReputationSBT contract ABI (key functions)
const REPUTATION_ABI = [
  'function calculateScore(address walletAddress) view returns (uint256)',
  'function getReputation(address walletAddress) view returns (uint256 score, uint256 totalTransactions, uint256 successfulTransactions, uint256 volumeUsd, uint256 disputeCount, uint256 settlementScore, bool zkVerified, uint256 badgeCount)',
  'function getBadges(address walletAddress) view returns (uint8[])',
  'function mintReputation(address to) returns (uint256)',
  'function recordTransaction(address merchant, uint256 volumeCentsUsd, bool successful, bool sameDaySettlement)',
  'function recordDispute(address merchant)',
  'function setZKVerified(address merchant)',
  'function awardBadge(address merchant, uint8 badge)',
  'function walletToToken(address) view returns (uint256)',
];

export class ReputationService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Wallet | null = null;
  private prisma: PrismaClient;
  private contractAddress: string;
  private isInitialized = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.contractAddress = process.env.REPUTATION_CONTRACT_ADDRESS || '';
  }

  /**
   * Initialize connection to Polygon network
   */
  async initialize(): Promise<boolean> {
    try {
      const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
      const privateKey = process.env.REPUTATION_SIGNER_KEY;

      if (!this.contractAddress) {
        console.warn('[ReputationService] No contract address configured - running in mock mode');
        this.isInitialized = false;
        return false;
      }

      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(this.contractAddress, REPUTATION_ABI, this.signer);
      } else {
        this.contract = new ethers.Contract(this.contractAddress, REPUTATION_ABI, this.provider);
      }

      this.isInitialized = true;
      console.log('[ReputationService] Initialized on Polygon');
      return true;
    } catch (error) {
      console.error('[ReputationService] Initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get tier from score
   */
  private scoreTier(score: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' {
    if (score >= TIER_THRESHOLDS.DIAMOND) return 'DIAMOND';
    if (score >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
    if (score >= TIER_THRESHOLDS.GOLD) return 'GOLD';
    if (score >= TIER_THRESHOLDS.SILVER) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Calculate reputation score using Blueprint algorithm (off-chain fallback)
   */
  calculateScoreOffchain(data: {
    totalTransactions: number;
    successfulTransactions: number;
    volumeUsd: number;
    disputeCount: number;
    firstTxTimestamp: Date;
    zkVerified: boolean;
  }): number {
    const { totalTransactions, successfulTransactions, volumeUsd, disputeCount, firstTxTimestamp, zkVerified } = data;

    // Success rate component (max 300 points)
    const total = Math.max(totalTransactions, 1);
    const successRate = (successfulTransactions / total) * 300;

    // Volume score component (max 500 points, $10,000 = max)
    const volumeScore = Math.min(volumeUsd / 20, 500);

    // Longevity bonus (max 100 points)
    const ageDays = (Date.now() - firstTxTimestamp.getTime()) / (1000 * 60 * 60 * 24);
    const longevityBonus = Math.min(ageDays / 30, 100);

    // Dispute penalty (50 points per dispute)
    const disputePenalty = disputeCount * 50;

    // ZK verification bonus (100 points)
    const zkBonus = zkVerified ? 100 : 0;

    // Calculate and clamp final score
    const rawScore = successRate + volumeScore + longevityBonus + zkBonus - disputePenalty;
    return Math.max(0, Math.min(1000, Math.round(rawScore)));
  }

  /**
   * Get reputation data for a wallet
   */
  async getReputation(walletAddress: string): Promise<ReputationData | null> {
    try {
      const address = walletAddress.toLowerCase();

      // Try on-chain first
      if (this.isInitialized && this.contract) {
        try {
          const tokenId = await this.contract.walletToToken(address);
          if (tokenId.toString() !== '0') {
            const [score, totalTx, successTx, volumeUsd, disputes, settlement, zkVerified] = 
              await this.contract.getReputation(address);
            const badgesRaw = await this.contract.getBadges(address);
            const badges = badgesRaw.map((b: number) => b as BadgeType);

            return {
              walletAddress: address,
              score: Number(score),
              totalTransactions: Number(totalTx),
              successfulTransactions: Number(successTx),
              volumeUsd: Number(volumeUsd) / 100, // Convert cents to dollars
              disputeCount: Number(disputes),
              settlementScore: Number(settlement),
              zkVerified,
              badges,
              tier: this.scoreTier(Number(score)),
            };
          }
        } catch (contractError) {
          console.warn('[ReputationService] On-chain query failed, falling back to DB:', contractError);
        }
      }

      // Fallback to database
      const dbRecord = await this.prisma.merchantReputation.findUnique({
        where: { walletAddress: address },
        include: { badges: true },
      });

      if (!dbRecord) return null;

      const score = this.calculateScoreOffchain({
        totalTransactions: dbRecord.totalTransactions,
        successfulTransactions: dbRecord.successfulTransactions,
        volumeUsd: Number(dbRecord.volumeUsd),
        disputeCount: dbRecord.disputeCount,
        firstTxTimestamp: dbRecord.firstTxAt,
        zkVerified: dbRecord.zkVerified,
      });

      return {
        walletAddress: address,
        score,
        totalTransactions: dbRecord.totalTransactions,
        successfulTransactions: dbRecord.successfulTransactions,
        volumeUsd: Number(dbRecord.volumeUsd),
        disputeCount: dbRecord.disputeCount,
        settlementScore: dbRecord.settlementScore,
        zkVerified: dbRecord.zkVerified,
        badges: dbRecord.badges.map(b => b.badgeType as unknown as BadgeType),
        tier: this.scoreTier(score),
      };
    } catch (error) {
      console.error('[ReputationService] getReputation error:', error);
      return null;
    }
  }

  /**
   * Initialize reputation for a new merchant
   */
  async initializeReputation(walletAddress: string, userId?: string): Promise<ReputationData | null> {
    try {
      const address = walletAddress.toLowerCase();

      // Check if already exists
      const existing = await this.prisma.merchantReputation.findUnique({
        where: { walletAddress: address },
      });
      if (existing) {
        return this.getReputation(address);
      }

      // Create in database
      const record = await this.prisma.merchantReputation.create({
        data: {
          walletAddress: address,
          userId,
          totalTransactions: 0,
          successfulTransactions: 0,
          volumeUsd: 0,
          disputeCount: 0,
          settlementScore: 100,
          zkVerified: false,
          firstTxAt: new Date(),
        },
      });

      // Mint on-chain if connected
      if (this.isInitialized && this.contract && this.signer) {
        try {
          const tx = await this.contract.mintReputation(address);
          await tx.wait();
          console.log(`[ReputationService] Minted SBT for ${address}`);
        } catch (mintError) {
          console.error('[ReputationService] On-chain mint failed:', mintError);
        }
      }

      return {
        walletAddress: address,
        score: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        volumeUsd: 0,
        disputeCount: 0,
        settlementScore: 100,
        zkVerified: false,
        badges: [],
        tier: 'BRONZE',
      };
    } catch (error) {
      console.error('[ReputationService] initializeReputation error:', error);
      return null;
    }
  }

  /**
   * Record a completed transaction
   */
  async recordTransaction(data: TransactionRecord): Promise<boolean> {
    try {
      const address = data.walletAddress.toLowerCase();

      // Update database
      const updated = await this.prisma.merchantReputation.update({
        where: { walletAddress: address },
        data: {
          totalTransactions: { increment: 1 },
          successfulTransactions: data.successful ? { increment: 1 } : undefined,
          volumeUsd: { increment: data.volumeUsd },
          // Recalculate settlement score as weighted average
          settlementScore: {
            // This is simplified; real implementation would use a transaction
          },
        },
      });

      // Update on-chain
      if (this.isInitialized && this.contract && this.signer) {
        try {
          const volumeCents = Math.round(data.volumeUsd * 100);
          const tx = await this.contract.recordTransaction(
            address,
            volumeCents,
            data.successful,
            data.sameDaySettlement
          );
          await tx.wait();
        } catch (chainError) {
          console.error('[ReputationService] On-chain recordTransaction failed:', chainError);
        }
      }

      // Check for badge eligibility
      await this.checkAndAwardBadges(address);

      return true;
    } catch (error) {
      console.error('[ReputationService] recordTransaction error:', error);
      return false;
    }
  }

  /**
   * Record a dispute
   */
  async recordDispute(walletAddress: string): Promise<boolean> {
    try {
      const address = walletAddress.toLowerCase();

      await this.prisma.merchantReputation.update({
        where: { walletAddress: address },
        data: { disputeCount: { increment: 1 } },
      });

      if (this.isInitialized && this.contract && this.signer) {
        try {
          const tx = await this.contract.recordDispute(address);
          await tx.wait();
        } catch (chainError) {
          console.error('[ReputationService] On-chain recordDispute failed:', chainError);
        }
      }

      return true;
    } catch (error) {
      console.error('[ReputationService] recordDispute error:', error);
      return false;
    }
  }

  /**
   * Set ZK verification status
   */
  async setZKVerified(walletAddress: string): Promise<boolean> {
    try {
      const address = walletAddress.toLowerCase();

      await this.prisma.merchantReputation.update({
        where: { walletAddress: address },
        data: { zkVerified: true },
      });

      if (this.isInitialized && this.contract && this.signer) {
        try {
          const tx = await this.contract.setZKVerified(address);
          await tx.wait();
        } catch (chainError) {
          console.error('[ReputationService] On-chain setZKVerified failed:', chainError);
        }
      }

      return true;
    } catch (error) {
      console.error('[ReputationService] setZKVerified error:', error);
      return false;
    }
  }

  /**
   * Check and award eligible badges
   */
  private async checkAndAwardBadges(walletAddress: string): Promise<void> {
    const rep = await this.getReputation(walletAddress);
    if (!rep) return;

    const badgesToAward: BadgeType[] = [];

    // HIGH_VOLUME_TRADER: $10,000+ USD volume
    if (rep.volumeUsd >= 10000 && !rep.badges.includes(BadgeType.HIGH_VOLUME_TRADER)) {
      badgesToAward.push(BadgeType.HIGH_VOLUME_TRADER);
    }

    // FAST_SETTLER: 95%+ same-day settlement with 20+ tx
    if (rep.settlementScore >= 95 && rep.totalTransactions >= 20 && !rep.badges.includes(BadgeType.FAST_SETTLER)) {
      badgesToAward.push(BadgeType.FAST_SETTLER);
    }

    // DISPUTE_FREE: 50+ transactions with zero disputes
    if (rep.totalTransactions >= 50 && rep.disputeCount === 0 && !rep.badges.includes(BadgeType.DISPUTE_FREE)) {
      badgesToAward.push(BadgeType.DISPUTE_FREE);
    }

    // Award badges
    for (const badge of badgesToAward) {
      await this.awardBadge(walletAddress, badge);
    }
  }

  /**
   * Award a specific badge
   */
  async awardBadge(walletAddress: string, badge: BadgeType): Promise<boolean> {
    try {
      const address = walletAddress.toLowerCase();

      const rep = await this.prisma.merchantReputation.findUnique({
        where: { walletAddress: address },
      });
      if (!rep) return false;

      // Check if badge already exists
      const existingBadge = await this.prisma.merchantBadge.findFirst({
        where: { reputationId: rep.id, badgeType: badge.toString() },
      });
      if (existingBadge) return true;

      // Create badge in DB
      await this.prisma.merchantBadge.create({
        data: {
          reputationId: rep.id,
          badgeType: badge.toString(),
          awardedAt: new Date(),
        },
      });

      // Award on-chain
      if (this.isInitialized && this.contract && this.signer) {
        try {
          const tx = await this.contract.awardBadge(address, badge);
          await tx.wait();
        } catch (chainError) {
          console.error('[ReputationService] On-chain awardBadge failed:', chainError);
        }
      }

      return true;
    } catch (error) {
      console.error('[ReputationService] awardBadge error:', error);
      return false;
    }
  }

  /**
   * Get leaderboard of top merchants
   */
  async getLeaderboard(limit: number = 50): Promise<ReputationData[]> {
    try {
      const records = await this.prisma.merchantReputation.findMany({
        take: limit,
        include: { badges: true },
        orderBy: [
          { successfulTransactions: 'desc' },
          { volumeUsd: 'desc' },
        ],
      });

      return records.map(r => {
        const score = this.calculateScoreOffchain({
          totalTransactions: r.totalTransactions,
          successfulTransactions: r.successfulTransactions,
          volumeUsd: Number(r.volumeUsd),
          disputeCount: r.disputeCount,
          firstTxTimestamp: r.firstTxAt,
          zkVerified: r.zkVerified,
        });

        return {
          walletAddress: r.walletAddress,
          score,
          totalTransactions: r.totalTransactions,
          successfulTransactions: r.successfulTransactions,
          volumeUsd: Number(r.volumeUsd),
          disputeCount: r.disputeCount,
          settlementScore: r.settlementScore,
          zkVerified: r.zkVerified,
          badges: r.badges.map(b => parseInt(b.badgeType) as BadgeType),
          tier: this.scoreTier(score),
        };
      }).sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('[ReputationService] getLeaderboard error:', error);
      return [];
    }
  }
}

export default ReputationService;
