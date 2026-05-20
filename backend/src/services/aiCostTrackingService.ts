import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

interface CostTrackingInput {
  agentName: string;
  agentType?: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  provider: string;
  taskType?: string;
  taskId?: string;
  articleId?: string;
  latencyMs?: number;
  success?: boolean;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  'claude-opus': { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
  'claude-haiku': { input: 0.25 / 1_000_000, output: 1.25 / 1_000_000 },
  'gpt-4o': { input: 2.5 / 1_000_000, output: 10.0 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
};

export class AICostTrackingService {
  /**
   * Track cost for an AI operation
   */
  async trackCost(input: CostTrackingInput) {
    const pricing = MODEL_PRICING[input.modelUsed] || { input: 0.001 / 1_000, output: 0.002 / 1_000 };
    const costUsd = (input.inputTokens * pricing.input) + (input.outputTokens * pricing.output);
    const totalTokens = input.inputTokens + input.outputTokens;

    const record = await prisma.aICostRecord.create({
      data: {
        agentName: input.agentName,
        agentType: input.agentType,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens,
        costUsd,
        modelUsed: input.modelUsed,
        provider: input.provider,
        taskType: input.taskType,
        taskId: input.taskId,
        articleId: input.articleId,
        latencyMs: input.latencyMs,
        success: input.success ?? true,
      },
    });

    await this.checkBudgetAlerts(input.agentName, costUsd);

    return record;
  }

  /**
   * Check and trigger budget alerts
   */
  private async checkBudgetAlerts(agentName: string, newCost: number) {
    const budgets = await prisma.aICostBudget.findMany({
      where: {
        isActive: true,
        OR: [
          { agentName },
          { agentName: null },
        ],
        periodEnd: { gte: new Date() },
      },
    });

    for (const budget of budgets) {
      const newSpend = budget.currentSpend + newCost;
      const percentage = (newSpend / budget.budgetLimit) * 100;

      const updates: any = { currentSpend: { increment: newCost } };

      if (percentage >= 100 && !budget.alertThreshold100) {
        updates.alertThreshold100 = true;
        logger.warn(`AI Budget EXCEEDED: ${budget.name} (${percentage.toFixed(1)}%)`);
        if (budget.hardCap) {
          logger.error(`AI Budget HARD CAP HIT: ${budget.name} — operations may be throttled`);
        }
      } else if (percentage >= 90 && !budget.alertThreshold90) {
        updates.alertThreshold90 = true;
        logger.warn(`AI Budget 90% alert: ${budget.name}`);
      } else if (percentage >= 80 && !budget.alertThreshold80) {
        updates.alertThreshold80 = true;
        logger.info(`AI Budget 80% alert: ${budget.name}`);
      }

      await prisma.aICostBudget.update({
        where: { id: budget.id },
        data: updates,
      });
    }
  }

  /**
   * Create a budget limit
   */
  async createBudget(data: {
    name: string;
    budgetType: string;
    agentName?: string;
    budgetLimit: number;
    periodStart: Date;
    periodEnd: Date;
    hardCap?: boolean;
    notifyEmails?: string[];
  }) {
    return await prisma.aICostBudget.create({
      data: {
        name: data.name,
        budgetType: data.budgetType,
        agentName: data.agentName,
        budgetLimit: data.budgetLimit,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        hardCap: data.hardCap ?? false,
        notifyEmails: data.notifyEmails ? JSON.stringify(data.notifyEmails) : null,
      },
    });
  }

  /**
   * Get cost overview with breakdowns
   */
  async getCostOverview(options: {
    startDate?: Date;
    endDate?: Date;
    agentName?: string;
    groupBy?: 'agent' | 'model' | 'taskType' | 'day';
  }) {
    const where: any = {};
    if (options.startDate) where.createdAt = { gte: options.startDate };
    if (options.endDate) {
      where.createdAt = { ...where.createdAt, lte: options.endDate };
    }
    if (options.agentName) where.agentName = options.agentName;

    const aggregate = await prisma.aICostRecord.aggregate({
      where,
      _sum: { costUsd: true, inputTokens: true, outputTokens: true, totalTokens: true },
      _count: true,
      _avg: { costUsd: true, latencyMs: true },
    });

    let breakdown: any[] = [];

    if (options.groupBy === 'agent') {
      breakdown = await prisma.aICostRecord.groupBy({
        by: ['agentName'],
        where,
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
        _avg: { latencyMs: true },
        orderBy: { _sum: { costUsd: 'desc' } },
      });
    } else if (options.groupBy === 'model') {
      breakdown = await prisma.aICostRecord.groupBy({
        by: ['modelUsed'],
        where,
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
        orderBy: { _sum: { costUsd: 'desc' } },
      });
    } else if (options.groupBy === 'taskType') {
      breakdown = await prisma.aICostRecord.groupBy({
        by: ['taskType'],
        where,
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
        orderBy: { _sum: { costUsd: 'desc' } },
      });
    }

    return {
      totalCost: aggregate._sum.costUsd || 0,
      totalTokens: aggregate._sum.totalTokens || 0,
      totalTasks: aggregate._count,
      averageCostPerTask: aggregate._avg.costUsd || 0,
      averageLatency: aggregate._avg.latencyMs || 0,
      breakdown,
    };
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(budgetId?: string) {
    const where: any = { isActive: true };
    if (budgetId) where.id = budgetId;

    const budgets = await prisma.aICostBudget.findMany({
      where,
      orderBy: { periodEnd: 'desc' },
    });

    return budgets.map(b => ({
      ...b,
      percentageUsed: b.budgetLimit > 0 ? (b.currentSpend / b.budgetLimit) * 100 : 0,
      remainingBudget: Math.max(0, b.budgetLimit - b.currentSpend),
      isOverBudget: b.currentSpend >= b.budgetLimit,
    }));
  }

  /**
   * Get cost per article analysis
   */
  async getCostPerArticle(limit: number = 20) {
    const articles = await prisma.aICostRecord.groupBy({
      by: ['articleId'],
      where: { articleId: { not: null } },
      _sum: { costUsd: true, totalTokens: true },
      _count: true,
      orderBy: { _sum: { costUsd: 'desc' } },
      take: limit,
    });

    return articles;
  }

  /**
   * Forecast costs based on historical trends
   */
  async forecastCosts(days: number = 30) {
    const pastDays = days;
    const since = new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000);

    const historicalCosts = await prisma.aICostRecord.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true },
      _count: true,
    });

    const dailyAverage = (historicalCosts._sum.costUsd || 0) / pastDays;
    const forecastedCost = dailyAverage * days;
    const tasksPerDay = (historicalCosts._count || 0) / pastDays;

    return {
      period: `${days} days`,
      dailyAverage,
      forecastedCost,
      tasksPerDay,
      confidence: Math.min(0.9, pastDays / 90),
      trend: dailyAverage > 0 ? 'active' : 'stable',
    };
  }
}

export default new AICostTrackingService();
