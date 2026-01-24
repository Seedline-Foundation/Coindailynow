import { PrismaClient, TransactionType, WalletType } from '@prisma/client';
import { FinanceAuditService } from '../FinanceAuditService';

export interface TokenVelocityMetrics {
  totalVolume: number;
  uniqueUsers: number;
  averageTransactionSize: number;
  turnoverRate: number;
  peakHour: number;
  timeframe: string;
}

export interface StakingMetrics {
  totalStakers: number;
  totalStaked: number;
  averageStakeSize: number;
  averageStakeDuration: number;
  rewardsDistributed: number;
  participationRate: number;
}

export interface ConversionMetrics {
  totalConversions: number;
  conversionRate: number;
  averageConversionSize: number;
  popularProducts: Array<{
    product: string;
    conversions: number;
    volume: number;
  }>;
  failureRate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenueByService: Array<{
    service: string;
    revenue: number;
    transactionCount: number;
  }>;
  revenueByDate: Array<{
    date: string;
    revenue: number;
  }>;
  monthlyGrowth: number;
  projectedRevenue: number;
}

export interface UserEarningMetrics {
  userId: string;
  totalEarnings: number;
  earningsByType: Array<{
    type: string;
    amount: number;
  }>;
  potentialEarnings: number;
  suggestions: string[];
  rank: number;
}

export interface AnalyticsDashboard {
  tokenVelocity: TokenVelocityMetrics;
  staking: StakingMetrics;
  conversions: ConversionMetrics;
  revenue: RevenueMetrics;
  topEarners: UserEarningMetrics[];
  systemHealth: {
    totalTransactions: number;
    errorRate: number;
    averageResponseTime: number;
    activeUsers: number;
  };
}

export class FinanceAnalyticsService {
  private prisma: PrismaClient;
  private auditService: FinanceAuditService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditService = new FinanceAuditService();
  }

  /**
   * Calculate token velocity metrics for a given timeframe
   */
  async getTokenVelocityMetrics(
    startDate: Date,
    endDate: Date,
    walletType?: WalletType
  ): Promise<TokenVelocityMetrics> {
    try {
      const whereClause: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (walletType) {
        whereClause.OR = [
          { fromWallet: { walletType: walletType } },
          { toWallet: { walletType: walletType } },
        ];
      }

      const transactions = await this.prisma.walletTransaction.findMany({
        where: whereClause,
        include: {
          fromWallet: true,
          toWallet: true,
        },
      });

      const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const uniqueUsers = new Set([
        ...transactions.map(tx => tx.fromWallet?.userId).filter(Boolean),
        ...transactions.map(tx => tx.toWallet?.userId).filter(Boolean),
      ]).size;

      const averageTransactionSize = totalVolume / (transactions.length || 1);

      // Calculate turnover rate (transactions per active wallet per day)
      const daysDiff = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const turnoverRate = transactions.length / (uniqueUsers || 1) / daysDiff;

      // Find peak hour
      const hourlyVolume = new Array(24).fill(0);
      transactions.forEach(tx => {
        const hour = tx.createdAt.getHours();
        hourlyVolume[hour] += tx.amount;
      });
      const peakHour = hourlyVolume.indexOf(Math.max(...hourlyVolume));

      return {
        totalVolume,
        uniqueUsers,
        averageTransactionSize,
        turnoverRate,
        peakHour,
        timeframe: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      };
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Calculate staking participation metrics
   */
  async getStakingMetrics(startDate: Date, endDate: Date): Promise<StakingMetrics> {
    try {
      const stakingTransactions = await this.prisma.walletTransaction.findMany({
        where: {
          transactionType: TransactionType.STAKE,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          fromWallet: true,
          toWallet: true,
        },
      });

      const unstakingTransactions = await this.prisma.walletTransaction.findMany({
        where: {
          transactionType: TransactionType.UNSTAKE,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          fromWallet: true,
        },
      });

      const rewardTransactions = await this.prisma.walletTransaction.findMany({
        where: {
          transactionType: TransactionType.REWARD,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalStakers = new Set(stakingTransactions.map(tx => tx.fromWallet?.userId)).size;
      const totalStaked = stakingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const averageStakeSize = totalStaked / (stakingTransactions.length || 1);
      const rewardsDistributed = rewardTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate average stake duration
      const stakeDurations = await Promise.all(
        stakingTransactions.map(async (stakeTx) => {
          const unstakeTx = unstakingTransactions.find(
            utx => utx.fromWallet?.userId === stakeTx.fromWallet?.userId &&
                   utx.createdAt > stakeTx.createdAt
          );
          if (unstakeTx) {
            return (unstakeTx.createdAt.getTime() - stakeTx.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          }
          return (Date.now() - stakeTx.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        })
      );

      const averageStakeDuration = stakeDurations.reduce((sum, duration) => sum + duration, 0) / 
        (stakeDurations.length || 1);

      // Calculate participation rate (based on total active users)
      const totalActiveUsers = await this.prisma.wallet.count({
        where: {
          user: {
            isNot: null,
          },
          transactionsTo: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      const participationRate = (totalStakers / (totalActiveUsers || 1)) * 100;

      return {
        totalStakers,
        totalStaked,
        averageStakeSize,
        averageStakeDuration,
        rewardsDistributed,
        participationRate,
      };
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Calculate conversion metrics and popular products
   */
  async getConversionMetrics(startDate: Date, endDate: Date): Promise<ConversionMetrics> {
    try {
      const conversions = await this.prisma.conversionRecord.findMany({
        where: {
          convertedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalConversions = conversions.length;
      const successfulConversions = conversions.filter((c: any) => c.status === 'COMPLETED');
      const conversionRate = (successfulConversions.length / (totalConversions || 1)) * 100;
      const averageConversionSize = successfulConversions.reduce((sum: number, c: any) => sum + c.fromAmount, 0) / 
        (successfulConversions.length || 1);

      // Group by currency pair
      const productStats = new Map<string, { conversions: number; volume: number }>();
      successfulConversions.forEach((conversion: any) => {
        const product = `${conversion.fromCurrency}-${conversion.toCurrency}`;
        if (!productStats.has(product)) {
          productStats.set(product, { conversions: 0, volume: 0 });
        }
        const stats = productStats.get(product)!;
        stats.conversions++;
        stats.volume += conversion.fromAmount;
      });

      const popularProducts = Array.from(productStats.entries())
        .map(([product, stats]) => ({ product, ...stats }))
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 10);

      const failureRate = ((totalConversions - successfulConversions.length) / (totalConversions || 1)) * 100;

      return {
        totalConversions,
        conversionRate,
        averageConversionSize,
        popularProducts,
        failureRate,
      };
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Calculate revenue metrics by service and time
   */
  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    try {
      // Get all revenue-generating transactions
      const revenueTransactions = await this.prisma.walletTransaction.findMany({
        where: {
          transactionType: {
            in: [TransactionType.COMMISSION, TransactionType.FEE, TransactionType.FEE],
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          toWallet: true,
        },
      });

      const totalRevenue = revenueTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Group by service type
      const serviceRevenue = new Map<string, { revenue: number; transactionCount: number }>();
      revenueTransactions.forEach(tx => {
        const service = tx.transactionType;
        if (!serviceRevenue.has(service)) {
          serviceRevenue.set(service, { revenue: 0, transactionCount: 0 });
        }
        const stats = serviceRevenue.get(service)!;
        stats.revenue += tx.amount;
        stats.transactionCount++;
      });

      const revenueByService = Array.from(serviceRevenue.entries())
        .map(([service, stats]) => ({ service, ...stats }));

      // Group by date
      const dailyRevenue = new Map<string, number>();
      revenueTransactions.forEach(tx => {
        const date = tx.createdAt.toISOString().split('T')[0];
        if (date) {
          dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + tx.amount);
        }
      });

      const revenueByDate = Array.from(dailyRevenue.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate monthly growth
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const currentMonthRevenue = await this.getMonthlyRevenue(currentMonth, currentMonthEnd);
      const lastMonthRevenue = await this.getMonthlyRevenue(lastMonth, currentMonth);

      const monthlyGrowth = lastMonthRevenue > 0 ? 
        ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Project revenue based on current trends
      const projectedRevenue = this.calculateProjectedRevenue(revenueByDate);

      return {
        totalRevenue,
        revenueByService,
        revenueByDate,
        monthlyGrowth,
        projectedRevenue,
      };
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Get user earning metrics and suggestions
   */
  async getUserEarningMetrics(userId: string, startDate: Date, endDate: Date): Promise<UserEarningMetrics> {
    try {
      const userWallets = await this.prisma.wallet.findMany({
        where: { userId },
        include: {
          transactionsTo: {
            where: {
              transactionType: {
                in: [TransactionType.REWARD, TransactionType.AIRDROP, TransactionType.REWARD, TransactionType.GIFT],
              },
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      const allEarnings = userWallets.flatMap(wallet => wallet.transactionsTo);
      const totalEarnings = allEarnings.reduce((sum, tx) => sum + tx.amount, 0);

      // Group earnings by type
      const earningsByType = new Map<string, number>();
      allEarnings.forEach(tx => {
        const type = tx.transactionType;
        earningsByType.set(type, (earningsByType.get(type) || 0) + tx.amount);
      });

      const earningsByTypeArray = Array.from(earningsByType.entries())
        .map(([type, amount]) => ({ type, amount }));

      // Calculate potential earnings and suggestions
      const { potentialEarnings, suggestions } = await this.calculateEarningPotential(userId);

      // Get user ranking
      const rank = await this.getUserEarningRank(userId, startDate, endDate);

      return {
        userId,
        totalEarnings,
        earningsByType: earningsByTypeArray,
        potentialEarnings,
        suggestions,
        rank,
      };
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Get top earners for leaderboard
   */
  async getTopEarners(startDate: Date, endDate: Date, limit: number = 10): Promise<UserEarningMetrics[]> {
    try {
      const earningsQuery = await this.prisma.walletTransaction.groupBy({
        by: ['toWalletId'],
        where: {
          transactionType: {
            in: [TransactionType.REWARD, TransactionType.AIRDROP, TransactionType.REWARD, TransactionType.GIFT],
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          toWallet: {
            userId: {
              not: null,
            },
          },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: limit,
      });

      const topEarners = await Promise.all(
        earningsQuery.map(async (earning) => {
          if (!earning.toWalletId) return null;
          
          const wallet = await this.prisma.wallet.findUnique({
            where: { id: earning.toWalletId },
            include: { user: true },
          });

          if (!wallet?.userId) {
            return null;
          }

          return this.getUserEarningMetrics(wallet.userId, startDate, endDate);
        })
      );

      return topEarners.filter(Boolean) as UserEarningMetrics[];
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getAnalyticsDashboard(startDate: Date, endDate: Date): Promise<AnalyticsDashboard> {
    try {
      const [tokenVelocity, staking, conversions, revenue, topEarners] = await Promise.all([
        this.getTokenVelocityMetrics(startDate, endDate),
        this.getStakingMetrics(startDate, endDate),
        this.getConversionMetrics(startDate, endDate),
        this.getRevenueMetrics(startDate, endDate),
        this.getTopEarners(startDate, endDate, 5),
      ]);

      // System health metrics
      const totalTransactions = await this.prisma.walletTransaction.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const failedTransactions = await this.prisma.walletTransaction.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'FAILED',
        },
      });

      const errorRate = (failedTransactions / (totalTransactions || 1)) * 100;

      const activeUsers = await this.prisma.wallet.count({
        where: {
          user: {
            isNot: null,
          },
          transactionsTo: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      return {
        tokenVelocity,
        staking,
        conversions,
        revenue,
        topEarners,
        systemHealth: {
          totalTransactions,
          errorRate,
          averageResponseTime: 250, // This would come from APM in production
          activeUsers,
        },
      };
    } catch (error) {
      // Audit logging skipped
      throw error;
    }
  }

  // Private helper methods

  private async getMonthlyRevenue(startDate: Date, endDate: Date): Promise<number> {
    const revenueTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        transactionType: {
          in: [TransactionType.COMMISSION, TransactionType.FEE, TransactionType.FEE],
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return revenueTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateProjectedRevenue(revenueByDate: Array<{ date: string; revenue: number }>): number {
    if (revenueByDate.length < 7) return 0;

    // Simple linear regression for projection
    const recentData = revenueByDate.slice(-7);
    const avgDailyRevenue = recentData.reduce((sum, day) => sum + day.revenue, 0) / recentData.length;
    
    // Project next 30 days
    return avgDailyRevenue * 30;
  }

  private async calculateEarningPotential(userId: string): Promise<{ potentialEarnings: number; suggestions: string[] }> {
    const suggestions: string[] = [];
    let potentialEarnings = 0;

    // Check staking participation
    const hasStaking = await this.prisma.walletTransaction.count({
      where: {
        transactionType: TransactionType.STAKE,
        fromWallet: { userId },
      },
    });

    if (hasStaking === 0) {
      suggestions.push('Start staking your tokens to earn daily rewards');
      potentialEarnings += 100; // Estimated potential
    }

    // Check referral activity
    const referralCount = await this.prisma.walletTransaction.count({
      where: {
        transactionType: TransactionType.REWARD,
        toWallet: { userId },
      },
    });

    if (referralCount < 5) {
      suggestions.push('Refer more friends to earn referral bonuses');
      potentialEarnings += 50 * (5 - referralCount);
    }

    // Check conversion activity
    const conversionCount = await this.prisma.conversionRecord.count({
      where: {
        userId: userId,
        status: 'COMPLETED',
      },
    });

    if (conversionCount === 0) {
      suggestions.push('Convert CE points to tokens for better earning potential');
      potentialEarnings += 25;
    }

    return { potentialEarnings, suggestions };
  }

  private async getUserEarningRank(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const userEarnings = await this.prisma.walletTransaction.aggregate({
      where: {
        transactionType: {
          in: [TransactionType.REWARD, TransactionType.AIRDROP, TransactionType.REWARD, TransactionType.GIFT],
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        toWallet: { userId },
      },
      _sum: {
        amount: true,
      },
    });

    const userTotal = userEarnings._sum.amount || 0;

    const higherEarners = await this.prisma.walletTransaction.groupBy({
      by: ['toWalletId'],
      where: {
        transactionType: {
          in: [TransactionType.REWARD, TransactionType.AIRDROP, TransactionType.REWARD, TransactionType.GIFT],
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        toWallet: {
          userId: {
            not: null,
          },
        },
      },
      _sum: {
        amount: true,
      },
      having: {
        amount: {
          _sum: {
            gt: userTotal,
          },
        },
      },
    });

    return higherEarners.length + 1;
  }
}