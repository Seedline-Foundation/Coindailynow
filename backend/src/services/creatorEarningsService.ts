import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

interface TrendingMetrics {
  articleId: string;
  viewCount: number;
  shareCount: number;
  commentCount: number;
  readCompletions: number;
  timeOnPage: number;
}

const TRENDING_THRESHOLDS = {
  STANDARD: { minScore: 0, cpMultiplier: 1.0 },
  RISING: { minScore: 50, cpMultiplier: 1.5 },
  VIRAL: { minScore: 200, cpMultiplier: 3.0 },
  MEGA_VIRAL: { minScore: 500, cpMultiplier: 5.0 },
};

const TIER_CP_RATES: Record<string, number> = {
  COMMUNITY_WRITER: 0.5,
  REGIONAL_EXPERT: 1.0,
  VERIFIED_ANALYST: 1.5,
  SENIOR_FELLOW: 3.0,
  SENIOR_ANALYST: 2.0,
  ADVISORY_BOARD: 4.0,
};

export class CreatorEarningsService {
  /**
   * Calculate trending score for an article based on engagement signals.
   * Higher trending = more CP earned.
   */
  calculateTrendingScore(metrics: TrendingMetrics): number {
    const weights = {
      views: 1,
      shares: 5,
      comments: 3,
      completions: 2,
    };

    return (
      metrics.viewCount * weights.views +
      metrics.shareCount * weights.shares +
      metrics.commentCount * weights.comments +
      metrics.readCompletions * weights.completions
    );
  }

  getEarningTier(trendingScore: number): string {
    if (trendingScore >= TRENDING_THRESHOLDS.MEGA_VIRAL.minScore) return 'MEGA_VIRAL';
    if (trendingScore >= TRENDING_THRESHOLDS.VIRAL.minScore) return 'VIRAL';
    if (trendingScore >= TRENDING_THRESHOLDS.RISING.minScore) return 'RISING';
    return 'STANDARD';
  }

  /**
   * Calculate CP earned for a trending article.
   * Only trending content earns CP — the higher it trends, the more it earns.
   */
  calculateCPEarned(trendingScore: number, creatorTier: string): number {
    const earningTier = this.getEarningTier(trendingScore);
    const tierMultiplier = TRENDING_THRESHOLDS[earningTier as keyof typeof TRENDING_THRESHOLDS].cpMultiplier;
    const baseCPRate = TIER_CP_RATES[creatorTier] || TIER_CP_RATES.COMMUNITY_WRITER;

    const cpPerUnit = baseCPRate * tierMultiplier;
    const units = Math.floor(trendingScore / 100);

    return Math.max(0, cpPerUnit * units);
  }

  /**
   * Process trending content earnings for a specific period.
   * Called by a scheduled job (e.g., daily).
   */
  async processTrendingEarnings(periodStart: Date, periodEnd: Date) {
    try {
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: periodStart, lte: periodEnd },
        },
        select: {
          id: true,
          authorId: true,
          viewCount: true,
          shareCount: true,
          commentCount: true,
        },
      });

      let processedCount = 0;
      const results: Array<{ articleId: string; cpEarned: number; tier: string }> = [];

      for (const article of articles) {
        if (!article.authorId) continue;

        const creator = await prisma.creatorProfile.findUnique({
          where: { userId: article.authorId },
        });

        if (!creator || !creator.isActive) continue;

        const readCompletions = await prisma.readingReward.count({
          where: {
            articleId: article.id,
            completedArticle: true,
            awardedAt: { gte: periodStart, lte: periodEnd },
          },
        });

        const metrics: TrendingMetrics = {
          articleId: article.id,
          viewCount: article.viewCount || 0,
          shareCount: article.shareCount || 0,
          commentCount: article.commentCount || 0,
          readCompletions,
          timeOnPage: 0,
        };

        const trendingScore = this.calculateTrendingScore(metrics);

        if (trendingScore < TRENDING_THRESHOLDS.RISING.minScore) continue;

        const cpEarned = this.calculateCPEarned(trendingScore, creator.tier);
        if (cpEarned <= 0) continue;

        const earningTier = this.getEarningTier(trendingScore);

        await prisma.trendingContentEarning.upsert({
          where: {
            creatorId_articleId_periodStart: {
              creatorId: creator.id,
              articleId: article.id,
              periodStart,
            },
          },
          update: {
            trendingScore,
            viewCount: metrics.viewCount,
            shareCount: metrics.shareCount,
            commentCount: metrics.commentCount,
            readCompletions,
            cpEarned,
            earningTier,
            multiplier: TRENDING_THRESHOLDS[earningTier as keyof typeof TRENDING_THRESHOLDS].cpMultiplier,
          },
          create: {
            creatorId: creator.id,
            articleId: article.id,
            trendingScore,
            viewCount: metrics.viewCount,
            shareCount: metrics.shareCount,
            commentCount: metrics.commentCount,
            readCompletions,
            cpEarned,
            earningTier,
            multiplier: TRENDING_THRESHOLDS[earningTier as keyof typeof TRENDING_THRESHOLDS].cpMultiplier,
            periodStart,
            periodEnd,
          },
        });

        await prisma.creatorProfile.update({
          where: { id: creator.id },
          data: { totalCPEarned: { increment: cpEarned } },
        });

        results.push({ articleId: article.id, cpEarned, tier: earningTier });
        processedCount++;
      }

      logger.info(`Processed trending earnings for ${processedCount} articles`);
      return { processedCount, results };
    } catch (error) {
      logger.error('Error processing trending earnings:', error);
      throw error;
    }
  }

  /**
   * Get creator earnings summary
   */
  async getCreatorEarnings(userId: string, period?: string) {
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creator) return null;

    const now = new Date();
    let periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (period === 'WEEKLY') {
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'YEARLY') {
      periodStart = new Date(now.getFullYear(), 0, 1);
    }

    const earnings = await prisma.trendingContentEarning.findMany({
      where: {
        creatorId: creator.id,
        periodStart: { gte: periodStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCP = earnings.reduce((sum, e) => sum + e.cpEarned, 0);
    const topArticles = earnings
      .sort((a, b) => b.cpEarned - a.cpEarned)
      .slice(0, 10);

    const earningsByTier = earnings.reduce((acc, e) => {
      acc[e.earningTier] = (acc[e.earningTier] || 0) + e.cpEarned;
      return acc;
    }, {} as Record<string, number>);

    return {
      creatorId: creator.id,
      tier: creator.tier,
      totalCPEarned: creator.totalCPEarned,
      periodCP: totalCP,
      earningsByTier,
      topArticles,
      unpaidEarnings: earnings.filter(e => !e.isPaid).reduce((sum, e) => sum + e.cpEarned, 0),
    };
  }

  /**
   * Get creator profile with analytics
   */
  async getCreatorProfile(userId: string) {
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        trendingEarnings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        creatorAnalytics: {
          orderBy: { periodStart: 'desc' },
          take: 12,
        },
      },
    });

    return creator;
  }

  /**
   * Apply for creator program
   */
  async applyForCreator(data: {
    userId: string;
    displayName: string;
    specialties: string[];
    country: string;
    portfolioUrl?: string;
    tagline?: string;
    languages?: string[];
  }) {
    const existing = await prisma.creatorProfile.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      return { success: false, message: 'Application already exists' };
    }

    const profile = await prisma.creatorProfile.create({
      data: {
        userId: data.userId,
        displayName: data.displayName,
        specialties: JSON.stringify(data.specialties),
        country: data.country,
        portfolioUrl: data.portfolioUrl,
        tagline: data.tagline,
        languages: data.languages ? JSON.stringify(data.languages) : '["en"]',
        applicationStatus: 'PENDING',
      },
    });

    return { success: true, profile };
  }

  /**
   * Approve/reject creator application (admin)
   */
  async reviewApplication(creatorId: string, decision: 'APPROVED' | 'REJECTED', note?: string, tier?: string) {
    const update: any = {
      applicationStatus: decision,
      applicationNote: note,
    };

    if (decision === 'APPROVED') {
      update.verifiedAt = new Date();
      update.isActive = true;
      if (tier) update.tier = tier;
    }

    return await prisma.creatorProfile.update({
      where: { id: creatorId },
      data: update,
    });
  }

  /**
   * Update creator analytics snapshot
   */
  async updateCreatorAnalytics(creatorId: string, period: string, periodStart: Date) {
    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
    });

    if (!creator) return null;

    const articles = await prisma.article.findMany({
      where: {
        authorId: creator.userId,
        publishedAt: { gte: periodStart },
      },
    });

    const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    const totalComments = articles.reduce((sum, a) => sum + (a.commentCount || 0), 0);
    const totalShares = articles.reduce((sum, a) => sum + (a.shareCount || 0), 0);

    const earnings = await prisma.trendingContentEarning.findMany({
      where: {
        creatorId,
        periodStart: { gte: periodStart },
      },
    });

    const cpEarned = earnings.reduce((sum, e) => sum + e.cpEarned, 0);

    return await prisma.creatorAnalytics.upsert({
      where: {
        creatorId_period_periodStart: {
          creatorId,
          period,
          periodStart,
        },
      },
      update: {
        articlesPublished: articles.length,
        totalViews,
        comments: totalComments,
        shares: totalShares,
        cpEarned,
      },
      create: {
        creatorId,
        period,
        periodStart,
        articlesPublished: articles.length,
        totalViews,
        comments: totalComments,
        shares: totalShares,
        cpEarned,
      },
    });
  }
}

export default new CreatorEarningsService();
