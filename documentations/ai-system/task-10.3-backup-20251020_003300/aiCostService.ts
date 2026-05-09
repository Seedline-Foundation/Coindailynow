/**
 * AI Cost Control & Budget Management Service
 * Task 10.3 - Production-Ready Implementation
 * 
 * Features:
 * - Per-agent cost tracking with granular metrics
 * - Budget limits (daily/weekly/monthly) with automatic enforcement
 * - Real-time budget alerts (80%, 90%, 100% thresholds)
 * - Automatic throttling at budget cap
 * - Cost trend analysis and forecasting
 * - Comprehensive cost reports with recommendations
 * - Multi-provider cost tracking (OpenAI, Anthropic, Google, Meta, X.AI)
 * - Cost optimization recommendations
 * 
 * @module aiCostService
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ===================================
// TYPES & INTERFACES
// ===================================

export interface CostTrackingInput {
  operationType: 'api_call' | 'agent_task' | 'workflow' | 'batch_processing';
  agentId?: string;
  agentType?: string;
  taskId?: string;
  workflowId?: string;
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'xai';
  model: string;
  apiEndpoint?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  responseTimeMs?: number;
  retryCount?: number;
  failed?: boolean;
  errorCode?: string;
  userId?: string;
  organizationId?: string;
  requestMetadata?: Record<string, any>;
  responseMetadata?: Record<string, any>;
  tags?: string[];
}

export interface BudgetLimitInput {
  scope: 'global' | 'agent_type' | 'user' | 'organization';
  scopeId?: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  throttleEnabled?: boolean;
  throttleAt?: number;
  alertEnabled?: boolean;
  alertThresholds?: number[];
  description?: string;
  createdBy?: string;
}

export interface CostOverview {
  totalCost: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  currency: string;
  budgetStatus: {
    daily?: BudgetStatus;
    weekly?: BudgetStatus;
    monthly?: BudgetStatus;
  };
  topAgents: AgentCostSummary[];
  topProviders: ProviderCostSummary[];
  trends: CostTrends;
}

export interface BudgetStatus {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isThrottled: boolean;
  alertLevel?: number;
}

export interface AgentCostSummary {
  agentType: string;
  totalCost: number;
  operationCount: number;
  averageCost: number;
  tokenCount: number;
}

export interface ProviderCostSummary {
  provider: string;
  totalCost: number;
  operationCount: number;
  averageCost: number;
  tokenCount: number;
}

export interface CostTrends {
  direction: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  forecastNextPeriod: number;
  forecastConfidence: number;
}

export interface CostForecast {
  period: 'daily' | 'weekly' | 'monthly';
  predictedCost: number;
  confidence: number;
  basedOnDays: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

// ===================================
// PRICING CONFIGURATION
// ===================================

const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI pricing (per 1M tokens)
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'text-embedding-3-small': { input: 0.02, output: 0.0 },
  'text-embedding-3-large': { input: 0.13, output: 0.0 },
  'dall-e-3': { input: 40.0, output: 0.0 }, // per image (standard quality)
  
  // Anthropic pricing
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'claude-3-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  
  // Google pricing
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-pro-vision': { input: 0.5, output: 1.5 },
  'gemini-ultra': { input: 10.0, output: 30.0 },
  
  // Meta pricing (approximated)
  'nllb-200': { input: 0.1, output: 0.2 },
  
  // X.AI pricing (approximated)
  'grok-1': { input: 5.0, output: 15.0 },
};

// ===================================
// COST TRACKING
// ===================================

/**
 * Track cost for an AI operation
 */
export async function trackCost(input: CostTrackingInput): Promise<string> {
  try {
    // Calculate cost
    const pricing = PRICING[input.model] || { input: 1.0, output: 2.0 };
    const inputCostPer1k = pricing.input / 1000;
    const outputCostPer1k = pricing.output / 1000;
    
    const inputCost = ((input.inputTokens || 0) / 1000) * pricing.input;
    const outputCost = ((input.outputTokens || 0) / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    // Get current billing period
    const billingPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    // Create cost tracking record
        // Track cost in database
    const costRecord = await prisma.aiCostTracking.create({
      data: {
        id: uuidv4(),
        operationType: input.operationType,
        agentId: input.agentId,
        agentType: input.agentType,
        taskId: input.taskId,
        workflowId: input.workflowId,
        provider: input.provider,
        model: input.model,
        apiEndpoint: input.apiEndpoint,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens || ((input.inputTokens || 0) + (input.outputTokens || 0)),
        inputCostPer1k,
        outputCostPer1k,
        totalCost,
        currency: 'USD',
        responseTimeMs: input.responseTimeMs,
        retryCount: input.retryCount || 0,
        failed: input.failed || false,
        errorCode: input.errorCode,
        userId: input.userId,
        organizationId: input.organizationId,
        requestMetadata: input.requestMetadata ? JSON.stringify(input.requestMetadata) : null,
        responseMetadata: input.responseMetadata ? JSON.stringify(input.responseMetadata) : null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        billingPeriod,
      },
    });
    
    // Update budget spending (async, don't wait)
    updateBudgetSpending(input.agentType, input.userId, input.organizationId, totalCost).catch(console.error);
    
    // Invalidate relevant caches
    await Promise.all([
      redis.del('ai:costs:overview'),
      redis.del(`ai:costs:agent:${input.agentType}`),
      redis.del(`ai:costs:provider:${input.provider}`),
      redis.del(`ai:costs:user:${input.userId}`),
    ]);
    
    return costRecord.id;
  } catch (error) {
    console.error('Error tracking cost:', error);
    throw new Error('Failed to track cost');
  }
}

/**
 * Update budget spending and check thresholds
 */
async function updateBudgetSpending(
  agentType?: string,
  userId?: string,
  organizationId?: string,
  cost?: number
): Promise<void> {
  if (!cost || cost <= 0) return;
  
  try {
    const now = new Date();
    const budgets: any[] = [];
    
    // Find applicable budgets
    const globalBudget = await prisma.budgetLimit.findFirst({
      where: { scope: 'global', isActive: true },
    });
    if (globalBudget) budgets.push(globalBudget);
    
    if (agentType) {
      const agentBudget = await prisma.budgetLimit.findFirst({
        where: { scope: 'agent_type', scopeId: agentType, isActive: true },
      });
      if (agentBudget) budgets.push(agentBudget);
    }
    
    if (userId) {
      const userBudget = await prisma.budgetLimit.findFirst({
        where: { scope: 'user', scopeId: userId, isActive: true },
      });
      if (userBudget) budgets.push(userBudget);
    }
    
    if (organizationId) {
      const orgBudget = await prisma.budgetLimit.findFirst({
        where: { scope: 'organization', scopeId: organizationId, isActive: true },
      });
      if (orgBudget) budgets.push(orgBudget);
    }
    
    // Update each budget
    for (const budget of budgets) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Check if we need to reset periods
      const daysSinceDaily = Math.floor((now.getTime() - budget.lastDailyReset.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceDaily >= 1) {
        updates.dailySpent = 0;
        updates.lastDailyReset = now;
        needsUpdate = true;
      }
      
      const daysSinceWeekly = Math.floor((now.getTime() - budget.lastWeeklyReset.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceWeekly >= 7) {
        updates.weeklySpent = 0;
        updates.lastWeeklyReset = now;
        needsUpdate = true;
      }
      
      const daysSinceMonthly = Math.floor((now.getTime() - budget.lastMonthlyReset.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceMonthly >= 30) {
        updates.monthlySpent = 0;
        updates.lastMonthlyReset = now;
        needsUpdate = true;
      }
      
      // Add cost to spending
      updates.dailySpent = (needsUpdate && updates.dailySpent === 0) ? cost : budget.dailySpent + cost;
      updates.weeklySpent = (needsUpdate && updates.weeklySpent === 0) ? cost : budget.weeklySpent + cost;
      updates.monthlySpent = (needsUpdate && updates.monthlySpent === 0) ? cost : budget.monthlySpent + cost;
      
      // Update budget
      await prisma.budgetLimit.update({
        where: { id: budget.id },
        data: updates,
      });
      
      // Check thresholds and create alerts
      await checkBudgetThresholds(budget.id);
    }
  } catch (error) {
    console.error('Error updating budget spending:', error);
  }
}

/**
 * Check budget thresholds and create alerts
 */
async function checkBudgetThresholds(budgetId: string): Promise<void> {
  try {
    const budget = await prisma.budgetLimit.findUnique({
      where: { id: budgetId },
    });
    
    if (!budget || !budget.alertEnabled) return;
    
    const thresholds = budget.alertThresholds ? JSON.parse(budget.alertThresholds) : [80, 90, 100];
    
    // Check each period
    const periods = [
      { name: 'daily', spent: budget.dailySpent, limit: budget.dailyLimit },
      { name: 'weekly', spent: budget.weeklySpent, limit: budget.weeklyLimit },
      { name: 'monthly', spent: budget.monthlySpent, limit: budget.monthlyLimit },
    ];
    
    for (const period of periods) {
      if (!period.limit) continue;
      
      const percentUsed = (period.spent / period.limit) * 100;
      
      // Find highest threshold exceeded
      let triggeredThreshold = 0;
      for (const threshold of thresholds.sort((a: number, b: number) => b - a)) {
        if (percentUsed >= threshold) {
          triggeredThreshold = threshold;
          break;
        }
      }
      
      // Create alert if threshold exceeded and not already alerted
      if (triggeredThreshold > 0 && (!budget.lastAlertLevel || triggeredThreshold > budget.lastAlertLevel)) {
        await createBudgetAlert(budget, period.name as any, triggeredThreshold, period.spent, period.limit);
        
        // Update last alert info
        await prisma.budgetLimit.update({
          where: { id: budget.id },
          data: {
            lastAlertSent: new Date(),
            lastAlertLevel: triggeredThreshold,
          },
        });
        
        // Throttle if at 100%
        if (triggeredThreshold >= 100 && budget.throttleEnabled && !budget.isThrottled) {
          await prisma.budgetLimit.update({
            where: { id: budget.id },
            data: {
              isThrottled: true,
              throttledAt: new Date(),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget thresholds:', error);
  }
}

/**
 * Create budget alert
 */
async function createBudgetAlert(
  budget: any,
  period: 'daily' | 'weekly' | 'monthly',
  thresholdPercent: number,
  currentSpent: number,
  budgetLimit: number
): Promise<void> {
  try {
    const alertType = thresholdPercent >= 100 ? 'budget_exceeded' : 'threshold_warning';
    const severity = thresholdPercent >= 100 ? 'critical' : thresholdPercent >= 90 ? 'warning' : 'info';
    
    const message = `${budget.scope} budget ${thresholdPercent >= 100 ? 'exceeded' : `${thresholdPercent}% threshold reached`} for ${period} period. ` +
      `Spent: $${currentSpent.toFixed(2)} / $${budgetLimit.toFixed(2)}`;
    
    const recommendation = getRecommendation(thresholdPercent, budget.scope);
    
    await prisma.budgetAlert.create({
      data: {
        id: uuidv4(),
        budgetLimitId: budget.id,
        alertType,
        severity,
        period,
        thresholdPercent,
        currentSpent,
        budgetLimit,
        scope: budget.scope,
        scopeId: budget.scopeId,
        message,
        recommendation,
        notificationSent: false,
      },
    });
    
    // Invalidate cache
    await redis.del('ai:costs:alerts');
  } catch (error) {
    console.error('Error creating budget alert:', error);
  }
}

/**
 * Get cost optimization recommendation
 */
function getRecommendation(thresholdPercent: number, scope: string): string {
  if (thresholdPercent >= 100) {
    return 'Budget exceeded. Consider: 1) Increasing budget limits, 2) Optimizing agent usage, 3) Using cheaper models, 4) Implementing caching.';
  } else if (thresholdPercent >= 90) {
    return 'Approaching budget limit. Review high-cost operations and consider cost-saving measures.';
  } else {
    return 'Budget usage is within normal range. Continue monitoring for unusual spikes.';
  }
}

// ===================================
// BUDGET MANAGEMENT
// ===================================

/**
 * Create or update budget limit
 */
export async function setBudgetLimit(input: BudgetLimitInput): Promise<string> {
  try {
    // Check if budget already exists
    const existing = await prisma.budgetLimit.findFirst({
      where: {
        scope: input.scope,
        scopeId: input.scopeId || null,
        isActive: true,
      },
    });
    
    const data = {
      scope: input.scope,
      scopeId: input.scopeId,
      dailyLimit: input.dailyLimit,
      weeklyLimit: input.weeklyLimit,
      monthlyLimit: input.monthlyLimit,
      throttleEnabled: input.throttleEnabled ?? true,
      throttleAt: input.throttleAt ?? 100,
      alertEnabled: input.alertEnabled ?? true,
      alertThresholds: JSON.stringify(input.alertThresholds || [80, 90, 100]),
      description: input.description,
    };
    
    if (existing) {
      // Update existing budget
      const updated = await prisma.budgetLimit.update({
        where: { id: existing.id },
        data,
      });
      
      // Invalidate cache
      await redis.del('ai:costs:overview');
      
      return updated.id;
    } else {
      // Create new budget
      const created = await prisma.budgetLimit.create({
        data: {
          id: uuidv4(),
          ...data,
          dailySpent: 0,
          weeklySpent: 0,
          monthlySpent: 0,
          lastDailyReset: new Date(),
          lastWeeklyReset: new Date(),
          lastMonthlyReset: new Date(),
          isThrottled: false,
        },
      });
      
      // Invalidate cache
      await redis.del('ai:costs:overview');
      
      return created.id;
    }
  } catch (error) {
    console.error('Error setting budget limit:', error);
    throw new Error('Failed to set budget limit');
  }
}

/**
 * Get budget limit
 */
export async function getBudgetLimit(scope: string, scopeId?: string): Promise<any> {
  try {
    const cacheKey = `ai:budget:${scope}:${scopeId || 'global'}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Get from database
    const budget = await prisma.budgetLimit.findFirst({
      where: {
        scope,
        scopeId: scopeId || null,
        isActive: true,
      },
      include: {
        alerts: {
          where: { acknowledged: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    
    if (!budget) return null;
    
    // Calculate status
    const result = {
      ...budget,
      status: {
        daily: calculateBudgetStatus(budget.dailySpent, budget.dailyLimit, budget.isThrottled),
        weekly: calculateBudgetStatus(budget.weeklySpent, budget.weeklyLimit, budget.isThrottled),
        monthly: calculateBudgetStatus(budget.monthlySpent, budget.monthlyLimit, budget.isThrottled),
      },
    };
    
    // Cache for 1 minute
    await redis.setex(cacheKey, 60, JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error getting budget limit:', error);
    throw new Error('Failed to get budget limit');
  }
}

/**
 * Calculate budget status
 */
function calculateBudgetStatus(spent: number, limit: number | null, isThrottled: boolean): BudgetStatus | null {
  if (!limit) return null;
  
  return {
    limit,
    spent,
    remaining: Math.max(0, limit - spent),
    percentUsed: (spent / limit) * 100,
    isThrottled,
  };
}

/**
 * Check if operation is allowed under budget
 */
export async function isOperationAllowed(agentType?: string, userId?: string, organizationId?: string): Promise<boolean> {
  try {
    // Check global budget
    const globalBudget = await prisma.budgetLimit.findFirst({
      where: { scope: 'global', isActive: true },
    });
    
    if (globalBudget?.isThrottled) {
      return false;
    }
    
    // Check agent type budget
    if (agentType) {
      const agentBudget = await prisma.budgetLimit.findFirst({
        where: { scope: 'agent_type', scopeId: agentType, isActive: true },
      });
      
      if (agentBudget?.isThrottled) {
        return false;
      }
    }
    
    // Check user budget
    if (userId) {
      const userBudget = await prisma.budgetLimit.findFirst({
        where: { scope: 'user', scopeId: userId, isActive: true },
      });
      
      if (userBudget?.isThrottled) {
        return false;
      }
    }
    
    // Check organization budget
    if (organizationId) {
      const orgBudget = await prisma.budgetLimit.findFirst({
        where: { scope: 'organization', scopeId: organizationId, isActive: true },
      });
      
      if (orgBudget?.isThrottled) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking operation allowance:', error);
    return true; // Allow on error to avoid blocking operations
  }
}

// ===================================
// COST OVERVIEW & ANALYTICS
// ===================================

/**
 * Get cost overview
 */
export async function getCostOverview(): Promise<CostOverview> {
  try {
    const cacheKey = 'ai:costs:overview';
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get costs
    const [totalResult, dailyResult, weeklyResult, monthlyResult] = await Promise.all([
      prisma.aiCostTracking.aggregate({ _sum: { totalCost: true } }),
      prisma.aiCostTracking.aggregate({
        where: { timestamp: { gte: today } },
        _sum: { totalCost: true },
      }),
      prisma.aiCostTracking.aggregate({
        where: { timestamp: { gte: weekAgo } },
        _sum: { totalCost: true },
      }),
      prisma.aiCostTracking.aggregate({
        where: { timestamp: { gte: monthAgo } },
        _sum: { totalCost: true },
      }),
    ]);
    
    // Get budgets
    const globalBudget = await getBudgetLimit('global');
    
    // Get top agents
    const agentCosts = await prisma.aiCostTracking.groupBy({
      by: ['agentType'],
      where: {
        timestamp: { gte: monthAgo },
        agentType: { not: null },
      },
      _sum: {
        totalCost: true,
        totalTokens: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          totalCost: 'desc',
        },
      },
      take: 10,
    });
    
    const topAgents: AgentCostSummary[] = agentCosts.map((item: any) => ({
      agentType: item.agentType,
      totalCost: item._sum.totalCost || 0,
      operationCount: item._count,
      averageCost: (item._sum.totalCost || 0) / item._count,
      tokenCount: item._sum.totalTokens || 0,
    }));
    
    // Get top providers
    const providerCosts = await prisma.aiCostTracking.groupBy({
      by: ['provider'],
      where: {
        timestamp: { gte: monthAgo },
      },
      _sum: {
        totalCost: true,
        totalTokens: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          totalCost: 'desc',
        },
      },
    });
    
    const topProviders: ProviderCostSummary[] = providerCosts.map((item: any) => ({
      provider: item.provider,
      totalCost: item._sum.totalCost || 0,
      operationCount: item._count,
      averageCost: (item._sum.totalCost || 0) / item._count,
      tokenCount: item._sum.totalTokens || 0,
    }));
    
    // Calculate trends
    const trends = await calculateCostTrends();
    
    const overview: CostOverview = {
      totalCost: totalResult._sum.totalCost || 0,
      dailyCost: dailyResult._sum.totalCost || 0,
      weeklyCost: weeklyResult._sum.totalCost || 0,
      monthlyCost: monthlyResult._sum.totalCost || 0,
      currency: 'USD',
      budgetStatus: globalBudget?.status || {},
      topAgents,
      topProviders,
      trends,
    };
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(overview));
    
    return overview;
  } catch (error) {
    console.error('Error getting cost overview:', error);
    throw new Error('Failed to get cost overview');
  }
}

/**
 * Get cost breakdown by agent type
 */
export async function getCostBreakdown(
  startDate?: Date,
  endDate?: Date,
  groupBy: 'agentType' | 'provider' | 'user' = 'agentType'
): Promise<any[]> {
  try {
    const where: any = {};
    
    if (startDate) {
      where.timestamp = { gte: startDate };
    }
    
    if (endDate) {
      where.timestamp = { ...where.timestamp, lte: endDate };
    }
    
    const results = await prisma.aiCostTracking.groupBy({
      by: [groupBy as any],
      where,
      _sum: {
        totalCost: true,
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
      _avg: {
        totalCost: true,
        responseTimeMs: true,
      },
      orderBy: {
        _sum: {
          totalCost: 'desc',
        },
      },
    });
    
    return results.map((item: any) => ({
      [groupBy]: item[groupBy],
      totalCost: item._sum.totalCost || 0,
      totalTokens: item._sum.totalTokens || 0,
      inputTokens: item._sum.inputTokens || 0,
      outputTokens: item._sum.outputTokens || 0,
      operationCount: item._count,
      averageCost: item._avg.totalCost || 0,
      averageResponseTime: item._avg.responseTimeMs || 0,
    }));
  } catch (error) {
    console.error('Error getting cost breakdown:', error);
    throw new Error('Failed to get cost breakdown');
  }
}

/**
 * Calculate cost trends
 */
async function calculateCostTrends(): Promise<CostTrends> {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const [recentCost, previousCost] = await Promise.all([
      prisma.aiCostTracking.aggregate({
        where: { timestamp: { gte: last7Days } },
        _sum: { totalCost: true },
      }),
      prisma.aiCostTracking.aggregate({
        where: {
          timestamp: {
            gte: previous7Days,
            lt: last7Days,
          },
        },
        _sum: { totalCost: true },
      }),
    ]);
    
    const recent = recentCost._sum.totalCost || 0;
    const previous = previousCost._sum.totalCost || 0;
    
    const changePercent = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    const direction = Math.abs(changePercent) < 5 ? 'stable' : changePercent > 0 ? 'increasing' : 'decreasing';
    
    // Simple linear forecast
    const forecastNextPeriod = recent * (1 + changePercent / 100);
    const forecastConfidence = Math.max(50, Math.min(95, 80 - Math.abs(changePercent)));
    
    return {
      direction,
      changePercent,
      forecastNextPeriod,
      forecastConfidence,
    };
  } catch (error) {
    console.error('Error calculating cost trends:', error);
    return {
      direction: 'stable',
      changePercent: 0,
      forecastNextPeriod: 0,
      forecastConfidence: 50,
    };
  }
}

/**
 * Get cost forecast
 */
export async function getCostForecast(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<CostForecast> {
  try {
    const cacheKey = `ai:costs:forecast:${period}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const now = new Date();
    let days = 30;
    if (period === 'daily') days = 7;
    if (period === 'weekly') days = 28;
    
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Get historical costs
    const costs = await prisma.aiCostTracking.groupBy({
      by: ['billingPeriod'],
      where: {
        timestamp: { gte: startDate },
      },
      _sum: {
        totalCost: true,
      },
    });
    
    const totalCost = costs.reduce((sum: number, item: any) => sum + (item._sum.totalCost || 0), 0);
    const avgDailyCost = totalCost / days;
    
    // Calculate trend
    const trends = await calculateCostTrends();
    
    // Predict based on trend
    let multiplier = 1;
    if (period === 'daily') multiplier = 1;
    if (period === 'weekly') multiplier = 7;
    if (period === 'monthly') multiplier = 30;
    
    const predictedCost = avgDailyCost * multiplier * (1 + trends.changePercent / 100);
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (trends.changePercent > 20) {
      recommendations.push('Costs are increasing rapidly. Review high-cost operations and consider optimization.');
    }
    if (predictedCost > 1000) {
      recommendations.push('High cost predicted. Consider implementing aggressive caching and batch processing.');
    }
    recommendations.push('Monitor cost trends daily to catch anomalies early.');
    
    const forecast: CostForecast = {
      period,
      predictedCost,
      confidence: trends.forecastConfidence,
      basedOnDays: days,
      trend: trends.direction,
      recommendations,
    };
    
    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(forecast));
    
    return forecast;
  } catch (error) {
    console.error('Error getting cost forecast:', error);
    throw new Error('Failed to get cost forecast');
  }
}

// ===================================
// BUDGET ALERTS
// ===================================

/**
 * Get budget alerts
 */
export async function getBudgetAlerts(acknowledged: boolean = false, limit: number = 50): Promise<any[]> {
  try {
    const cacheKey = `ai:costs:alerts:${acknowledged}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const alerts = await prisma.budgetAlert.findMany({
      where: { acknowledged },
      include: {
        BudgetLimit: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    // Cache for 1 minute
    await redis.setex(cacheKey, 60, JSON.stringify(alerts));
    
    return alerts;
  } catch (error) {
    console.error('Error getting budget alerts:', error);
    throw new Error('Failed to get budget alerts');
  }
}

/**
 * Acknowledge budget alert
 */
export async function acknowledgeBudgetAlert(alertId: string, userId: string): Promise<void> {
  try {
    await prisma.budgetAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
    
    // Invalidate cache
    await redis.del('ai:costs:alerts:false');
    await redis.del('ai:costs:alerts:true');
  } catch (error) {
    console.error('Error acknowledging budget alert:', error);
    throw new Error('Failed to acknowledge budget alert');
  }
}

// ===================================
// COST REPORTS
// ===================================

/**
 * Generate cost report
 */
export async function generateCostReport(
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom',
  startDate?: Date,
  endDate?: Date,
  scope: 'global' | 'agent_type' | 'provider' | 'user' | 'organization' = 'global',
  scopeId?: string,
  generatedBy?: string
): Promise<string> {
  try {
    // Calculate date range
    const now = new Date();
    let start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = endDate || now;
    
    if (!startDate) {
      if (reportType === 'daily') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (reportType === 'weekly') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (reportType === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (reportType === 'quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
      }
    }
    
    // Get costs
    const where: any = {
      timestamp: {
        gte: start,
        lte: end,
      },
    };
    
    if (scope === 'agent_type' && scopeId) {
      where.agentType = scopeId;
    } else if (scope === 'provider' && scopeId) {
      where.provider = scopeId;
    } else if (scope === 'user' && scopeId) {
      where.userId = scopeId;
    } else if (scope === 'organization' && scopeId) {
      where.organizationId = scopeId;
    }
    
    const [totalResult, operations, agentBreakdown, providerBreakdown] = await Promise.all([
      prisma.aiCostTracking.aggregate({
        where,
        _sum: {
          totalCost: true,
          totalTokens: true,
          inputTokens: true,
          outputTokens: true,
        },
        _count: true,
        _avg: {
          totalCost: true,
          responseTimeMs: true,
        },
      }),
      prisma.aiCostTracking.findMany({
        where,
        select: {
          agentType: true,
          provider: true,
          totalCost: true,
          failed: true,
        },
      }),
      prisma.aiCostTracking.groupBy({
        by: ['agentType'],
        where: { ...where, agentType: { not: null } },
        _sum: { totalCost: true },
      }),
      prisma.aiCostTracking.groupBy({
        by: ['provider'],
        where,
        _sum: { totalCost: true },
      }),
    ]);
    
    // Calculate metrics
    const totalCost = totalResult._sum.totalCost || 0;
    const totalOperations = totalResult._count;
    const averageCostPerOp = totalResult._avg.totalCost || 0;
    
    const successfulOps = operations.filter((op: any) => !op.failed).length;
    const failedOps = operations.filter((op: any) => op.failed).length;
    const successRate = totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;
    
    // Agent type breakdown
    const agentCosts: Record<string, number> = {};
    agentBreakdown.forEach((item: any) => {
      if (item.agentType) {
        agentCosts[item.agentType] = item._sum.totalCost || 0;
      }
    });
    
    // Provider breakdown
    const providerCosts: Record<string, number> = {};
    providerBreakdown.forEach((item: any) => {
      providerCosts[item.provider] = item._sum.totalCost || 0;
    });
    
    // Get previous period for comparison
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousEnd = start;
    
    const previousResult = await prisma.aiCostTracking.aggregate({
      where: {
        ...where,
        timestamp: {
          gte: previousStart,
          lt: previousEnd,
        },
      },
      _sum: { totalCost: true },
    });
    
    const previousPeriodCost = previousResult._sum.totalCost || 0;
    const costChange = previousPeriodCost > 0 ? ((totalCost - previousPeriodCost) / previousPeriodCost) * 100 : 0;
    const costChangeAmount = totalCost - previousPeriodCost;
    
    // Determine trend
    const trendDirection = Math.abs(costChange) < 5 ? 'stable' : costChange > 0 ? 'increasing' : 'decreasing';
    
    // Generate forecast
    const forecast = await getCostForecast(reportType === 'daily' ? 'daily' : reportType === 'weekly' ? 'weekly' : 'monthly');
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (costChange > 20) {
      recommendations.push('Cost increased by more than 20%. Review high-cost operations.');
    }
    if (failedOps > totalOperations * 0.1) {
      recommendations.push(`High failure rate (${((failedOps / totalOperations) * 100).toFixed(1)}%). Investigate error causes.`);
    }
    
    // Find high-cost operations
    const highCostOps = operations
      .sort((a: any, b: any) => b.totalCost - a.totalCost)
      .slice(0, 10)
      .map((op: any) => ({
        agentType: op.agentType,
        provider: op.provider,
        cost: op.totalCost,
      }));
    
    // Get budget info
    const budget = await getBudgetLimit(scope, scopeId);
    const budgetLimit = reportType === 'daily' ? budget?.dailyLimit : 
                       reportType === 'weekly' ? budget?.weeklyLimit :
                       budget?.monthlyLimit;
    
    const budgetUtilization = budgetLimit ? (totalCost / budgetLimit) * 100 : null;
    const budgetRemaining = budgetLimit ? Math.max(0, budgetLimit - totalCost) : null;
    
    // Create report
    const report = await prisma.costReport.create({
      data: {
        id: uuidv4(),
        reportType,
        startDate: start,
        endDate: end,
        billingPeriod: start.toISOString().substring(0, 7),
        scope,
        scopeId,
        totalCost,
        totalOperations,
        averageCostPerOp,
        contentGenCost: agentCosts['content_generation'] || 0,
        translationCost: agentCosts['translation'] || 0,
        moderationCost: agentCosts['moderation'] || 0,
        marketAnalysisCost: agentCosts['market_analysis'] || 0,
        imageGenCost: agentCosts['image_generation'] || 0,
        otherCost: Object.values(agentCosts).reduce((sum, cost) => sum + cost, 0) - 
                   (agentCosts['content_generation'] || 0) - (agentCosts['translation'] || 0) -
                   (agentCosts['moderation'] || 0) - (agentCosts['market_analysis'] || 0) -
                   (agentCosts['image_generation'] || 0),
        openaiCost: providerCosts['openai'] || 0,
        anthropicCost: providerCosts['anthropic'] || 0,
        googleCost: providerCosts['google'] || 0,
        metaCost: providerCosts['meta'] || 0,
        xaiCost: providerCosts['xai'] || 0,
        totalTokens: totalResult._sum.totalTokens || 0,
        totalInputTokens: totalResult._sum.inputTokens || 0,
        totalOutputTokens: totalResult._sum.outputTokens || 0,
        avgResponseTime: totalResult._avg.responseTimeMs,
        successRate,
        retryRate: 0, // Would need additional tracking
        previousPeriodCost,
        costChange,
        costChangeAmount,
        trendDirection,
        forecastNextPeriod: forecast.predictedCost,
        forecastConfidence: forecast.confidence,
        recommendations: JSON.stringify(recommendations),
        highCostOperations: JSON.stringify(highCostOps),
        budgetLimit,
        budgetUtilization,
        budgetRemaining,
        detailedData: JSON.stringify({
          agentCosts,
          providerCosts,
          dailyBreakdown: [], // Would need additional calculation
        }),
        chartData: JSON.stringify({
          agentPie: agentCosts,
          providerPie: providerCosts,
          timeline: [], // Would need additional calculation
        }),
        generatedBy: generatedBy || 'system',
        generationType: generatedBy ? 'manual' : 'automatic',
        format: 'JSON',
        status: 'completed',
        generatedAt: new Date(),
      },
    });
    
    return report.id;
  } catch (error) {
    console.error('Error generating cost report:', error);
    throw new Error('Failed to generate cost report');
  }
}

/**
 * Get cost report
 */
export async function getCostReport(reportId: string): Promise<any> {
  try {
    const report = await prisma.costReport.findUnique({
      where: { id: reportId },
    });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return {
      ...report,
      recommendations: report.recommendations ? JSON.parse(report.recommendations) : [],
      highCostOperations: report.highCostOperations ? JSON.parse(report.highCostOperations) : [],
      detailedData: report.detailedData ? JSON.parse(report.detailedData) : {},
      chartData: report.chartData ? JSON.parse(report.chartData) : {},
    };
  } catch (error) {
    console.error('Error getting cost report:', error);
    throw new Error('Failed to get cost report');
  }
}

/**
 * List cost reports
 */
export async function listCostReports(limit: number = 20): Promise<any[]> {
  try {
    const reports = await prisma.costReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return reports;
  } catch (error) {
    console.error('Error listing cost reports:', error);
    throw new Error('Failed to list cost reports');
  }
}

// ===================================
// CACHE MANAGEMENT
// ===================================

/**
 * Invalidate all cost caches
 */
export async function invalidateAllCaches(): Promise<void> {
  try {
    const keys = await redis.keys('ai:costs:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Error invalidating caches:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<any> {
  try {
    const keys = await redis.keys('ai:costs:*');
    const budgetKeys = await redis.keys('ai:budget:*');
    
    return {
      totalKeys: keys.length + budgetKeys.length,
      costKeys: keys.length,
      budgetKeys: budgetKeys.length,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalKeys: 0, costKeys: 0, budgetKeys: 0 };
  }
}

// ===================================
// HEALTH CHECK
// ===================================

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: Date }> {
  try {
    // Test database
    await prisma.$queryRaw`SELECT 1`;
    
    // Test Redis
    await redis.ping();
    
    return {
      status: 'healthy',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date(),
    };
  }
}

// ===================================
// EXPORTS
// ===================================

export default {
  // Cost tracking
  trackCost,
  isOperationAllowed,
  
  // Budget management
  setBudgetLimit,
  getBudgetLimit,
  
  // Analytics
  getCostOverview,
  getCostBreakdown,
  getCostForecast,
  
  // Alerts
  getBudgetAlerts,
  acknowledgeBudgetAlert,
  
  // Reports
  generateCostReport,
  getCostReport,
  listCostReports,
  
  // Cache
  invalidateAllCaches,
  getCacheStats,
  
  // Health
  healthCheck,
};
