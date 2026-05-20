/**
 * Points-to-Token Conversion Bridge (W5)
 *
 * Bridges the off-chain CDP points ledger with the on-chain CDPPoints contract.
 * Users accumulate points via reading / sharing / referrals and can convert them
 * to JOY tokens through this service.
 *
 * On-chain reference: contracts/sol/CDPPoints.sol
 *   - 100 CDP = 1 JOY (default cdpPerJoy)
 *   - convertToJOY(cdpAmount) burns CDP and transfers JOY via SafeERC20
 */

import { ethers } from 'ethers';
import prisma from '../lib/prisma';

// ─── Configuration ───────────────────────────────────────────────────────

const CDP_POINTS_ADDRESS = process.env.CDP_POINTS_CONTRACT_ADDRESS || '';
const RPC_URL = process.env.POLYGON_RPC_URL || process.env.RPC_URL || '';
const OPERATOR_PRIVATE_KEY = process.env.CDP_OPERATOR_PRIVATE_KEY || '';

const CDP_POINTS_ABI = [
  'function cdpPerJoy() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function convertToJOY(uint256 cdpAmount)',
  'function conversionsPaused() view returns (bool)',
  'function JOY_DECIMAL_FACTOR() view returns (uint256)',
  'event PointsConverted(address indexed user, uint256 cdpBurned, uint256 joyReceived)',
];

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ─── Types ───────────────────────────────────────────────────────────────

export interface ConversionRate {
  cdpPerJoy: number;
  joyPerCdp: number;
  conversionsPaused: boolean;
  updatedAt: Date;
}

export type ConversionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ConversionRequest {
  id: string;
  userId: string;
  pointsAmount: number;
  joyAmount: number;
  rate: number;
  status: ConversionStatus;
  txHash: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// ─── Service ─────────────────────────────────────────────────────────────

export class PointsTokenBridgeService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Wallet | null = null;

  constructor() {
    if (RPC_URL && CDP_POINTS_ADDRESS) {
      try {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        if (OPERATOR_PRIVATE_KEY) {
          this.signer = new ethers.Wallet(OPERATOR_PRIVATE_KEY, this.provider);
          this.contract = new ethers.Contract(CDP_POINTS_ADDRESS, CDP_POINTS_ABI, this.signer);
        } else {
          this.contract = new ethers.Contract(CDP_POINTS_ADDRESS, CDP_POINTS_ABI, this.provider);
        }
      } catch (err: any) {
        console.warn('[PointsTokenBridge] Failed to initialise on-chain provider:', err.message);
      }
    } else {
      console.warn('[PointsTokenBridge] On-chain integration disabled — missing RPC_URL or CDP_POINTS_CONTRACT_ADDRESS');
    }
  }

  /**
   * Get the current points-to-JOY conversion rate.
   * Falls back to env-configured rate if on-chain read fails.
   */
  async getConversionRate(): Promise<ConversionRate> {
    const fallbackRate = parseInt(process.env.CDP_PER_JOY || '100', 10);

    if (this.contract) {
      try {
        const cdpPerJoy = await this.contract.cdpPerJoy();
        const paused = await this.contract.conversionsPaused();
        const rateNum = cdpPerJoy.toNumber();
        return {
          cdpPerJoy: rateNum,
          joyPerCdp: 1 / rateNum,
          conversionsPaused: paused,
          updatedAt: new Date(),
        };
      } catch (err: any) {
        console.warn('[PointsTokenBridge] On-chain rate fetch failed, using fallback:', err.message);
      }
    }

    return {
      cdpPerJoy: fallbackRate,
      joyPerCdp: 1 / fallbackRate,
      conversionsPaused: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Initiate a points-to-JOY conversion. Validates balance and rate limit,
   * then stores a pending conversion record.
   */
  async requestConversion(userId: string, pointsAmount: number): Promise<ConversionRequest> {
    if (!userId) throw new Error('userId is required');
    if (!pointsAmount || pointsAmount <= 0) throw new Error('pointsAmount must be positive');

    // Rate limit: max 1 conversion per hour per user
    const recentConversion = await prisma.userReward.findFirst({
      where: {
        userId,
        rewardType: 'POINT_TO_TOKEN',
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentConversion) {
      const nextAllowed = new Date(recentConversion.createdAt.getTime() + RATE_LIMIT_WINDOW_MS);
      throw new Error(`Rate limited. Next conversion allowed after ${nextAllowed.toISOString()}`);
    }

    // Verify sufficient off-chain points balance
    const rewards = await prisma.userReward.aggregate({
      where: { userId, isProcessed: false },
      _sum: { points: true },
    });
    const availablePoints = rewards._sum.points ?? 0;

    if (availablePoints < pointsAmount) {
      throw new Error(`Insufficient points. Available: ${availablePoints}, requested: ${pointsAmount}`);
    }

    const rate = await this.getConversionRate();
    if (rate.conversionsPaused) {
      throw new Error('Conversions are currently paused');
    }

    if (pointsAmount < rate.cdpPerJoy) {
      throw new Error(`Minimum conversion is ${rate.cdpPerJoy} points (= 1 JOY)`);
    }

    const joyAmount = pointsAmount / rate.cdpPerJoy;

    // Record the conversion request in UserReward as a POINT_TO_TOKEN entry
    const record = await prisma.userReward.create({
      data: {
        userId,
        rewardType: 'POINT_TO_TOKEN',
        points: -pointsAmount, // negative = deduction
        source: 'points-bridge',
        sourceType: 'CAMPAIGN',
        description: `Convert ${pointsAmount} CDP → ${joyAmount.toFixed(6)} JOY`,
        metadata: JSON.stringify({
          conversionStatus: 'PENDING' as ConversionStatus,
          joyAmount,
          rate: rate.cdpPerJoy,
          txHash: null,
          errorMessage: null,
        }),
        isProcessed: false,
      },
    });

    return {
      id: record.id,
      userId,
      pointsAmount,
      joyAmount,
      rate: rate.cdpPerJoy,
      status: 'PENDING',
      txHash: null,
      errorMessage: null,
      createdAt: record.createdAt,
      completedAt: null,
    };
  }

  /**
   * Execute the on-chain transaction for a pending conversion.
   */
  async processConversion(conversionId: string): Promise<ConversionRequest> {
    const record = await prisma.userReward.findUnique({ where: { id: conversionId } });
    if (!record) throw new Error('Conversion not found');
    if (record.rewardType !== 'POINT_TO_TOKEN') throw new Error('Not a conversion record');

    const meta = JSON.parse(record.metadata || '{}');
    if (meta.conversionStatus === 'COMPLETED') throw new Error('Conversion already completed');
    if (meta.conversionStatus === 'PROCESSING') throw new Error('Conversion already processing');

    // Mark as processing
    meta.conversionStatus = 'PROCESSING';
    await prisma.userReward.update({
      where: { id: conversionId },
      data: { metadata: JSON.stringify(meta) },
    });

    try {
      let txHash: string | null = null;

      if (this.contract && this.signer) {
        const pointsAmount = Math.abs(record.points);
        const tx = await this.contract.convertToJOY(pointsAmount);
        const receipt = await tx.wait();
        txHash = receipt.transactionHash;
      } else {
        console.warn('[PointsTokenBridge] No on-chain contract configured — marking conversion as completed off-chain');
        txHash = `offchain-${conversionId}`;
      }

      meta.conversionStatus = 'COMPLETED';
      meta.txHash = txHash;

      await prisma.userReward.update({
        where: { id: conversionId },
        data: {
          metadata: JSON.stringify(meta),
          isProcessed: true,
          processedAt: new Date(),
        },
      });

      // Mark the spent points as processed
      await this.markPointsProcessed(record.userId, Math.abs(record.points));

      return {
        id: conversionId,
        userId: record.userId,
        pointsAmount: Math.abs(record.points),
        joyAmount: meta.joyAmount,
        rate: meta.rate,
        status: 'COMPLETED',
        txHash,
        errorMessage: null,
        createdAt: record.createdAt,
        completedAt: new Date(),
      };
    } catch (err: any) {
      meta.conversionStatus = 'FAILED';
      meta.errorMessage = err.message;

      await prisma.userReward.update({
        where: { id: conversionId },
        data: { metadata: JSON.stringify(meta) },
      });

      return {
        id: conversionId,
        userId: record.userId,
        pointsAmount: Math.abs(record.points),
        joyAmount: meta.joyAmount,
        rate: meta.rate,
        status: 'FAILED',
        txHash: null,
        errorMessage: err.message,
        createdAt: record.createdAt,
        completedAt: null,
      };
    }
  }

  /**
   * List a user's past conversions.
   */
  async getConversionHistory(userId: string, limit = 50, offset = 0): Promise<ConversionRequest[]> {
    const records = await prisma.userReward.findMany({
      where: { userId, rewardType: 'POINT_TO_TOKEN' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return records.map((r) => {
      const meta = JSON.parse(r.metadata || '{}');
      return {
        id: r.id,
        userId: r.userId,
        pointsAmount: Math.abs(r.points),
        joyAmount: meta.joyAmount ?? 0,
        rate: meta.rate ?? 100,
        status: (meta.conversionStatus ?? 'PENDING') as ConversionStatus,
        txHash: meta.txHash ?? null,
        errorMessage: meta.errorMessage ?? null,
        createdAt: r.createdAt,
        completedAt: r.processedAt ?? null,
      };
    });
  }

  /**
   * Mark unprocessed reward points as consumed (up to the specified amount).
   */
  private async markPointsProcessed(userId: string, amount: number): Promise<void> {
    const unprocessed = await prisma.userReward.findMany({
      where: {
        userId,
        isProcessed: false,
        points: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    });

    let remaining = amount;
    for (const reward of unprocessed) {
      if (remaining <= 0) break;
      if (reward.points <= remaining) {
        await prisma.userReward.update({
          where: { id: reward.id },
          data: { isProcessed: true, processedAt: new Date() },
        });
        remaining -= reward.points;
      } else {
        break;
      }
    }
  }
}

export const pointsTokenBridge = new PointsTokenBridgeService();
