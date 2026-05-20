/**
 * AI Cost Control & Budget Management Service
 * 
 * Production implementation backed by AICostRecord and AICostBudget models.
 * Delegates to the full aiCostTrackingService for real tracking.
 * This file maintains backward compatibility with existing imports.
 */

import aiCostTrackingService from './aiCostTrackingService';
import { logger } from '../utils/logger';

export const aiCostService = {
  async trackCost(data: any) {
    return aiCostTrackingService.trackCost(data);
  },

  async createBudgetLimit(data: any) {
    return aiCostTrackingService.createBudget(data);
  },

  async checkBudgetStatus(budgetId: string) {
    const budgets = await aiCostTrackingService.getBudgetStatus(budgetId);
    const budget = budgets[0];
    return budget || {
      budgetId,
      percentageUsed: 0,
      isOverBudget: false,
      remainingBudget: 1000,
    };
  },

  async getBudgetAlerts(_params: any) {
    const budgets = await aiCostTrackingService.getBudgetStatus();
    return budgets.filter(b => b.alertThreshold80 || b.alertThreshold90 || b.alertThreshold100);
  },

  async getCostOverview(params: any) {
    return aiCostTrackingService.getCostOverview({
      startDate: params?.startDate,
      endDate: params?.endDate,
      agentName: params?.agentName,
      groupBy: params?.groupBy,
    });
  },

  async forecastCosts(params: any) {
    const days = params?.days || 30;
    return aiCostTrackingService.forecastCosts(days);
  },

  async generateReport(params: any) {
    logger.info('Generate report called', params);
    const overview = await aiCostTrackingService.getCostOverview({
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
    return {
      id: `report-${Date.now()}`,
      reportType: params?.reportType || 'overview',
      ...overview,
    };
  },

  async getOptimizationRecommendations(_params: any) {
    const overview = await aiCostTrackingService.getCostOverview({ groupBy: 'agent' });
    const recommendations = [];

    if (overview.averageCostPerTask > 0.5) {
      recommendations.push({
        type: 'MODEL_OPTIMIZATION',
        message: 'Consider using cheaper models for low-stakes tasks (social posts, summaries)',
        impact: 'Could reduce costs by 30-40%',
      });
    }

    if (overview.totalTasks > 1000 && overview.averageLatency > 3000) {
      recommendations.push({
        type: 'CACHING',
        message: 'High task volume with slow latency — implement response caching for repeated queries',
        impact: 'Could reduce API calls by 20-30%',
      });
    }

    return recommendations;
  },
};

export default aiCostService;
