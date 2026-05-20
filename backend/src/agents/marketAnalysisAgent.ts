/**
 * Market Analysis Agent - Task 11
 *
 * @deprecated THIN WRAPPER — canonical implementation lives in ai-system.
 * This file delegates to the ai-system service via HTTP (see aiSystemClient).
 * Do not add business logic here; extend ai-system/agents/analysis/ instead.
 */

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import {
  MarketAnalysisTask,
  AfricanMarketContext,
  TaskStatus,
  AgentType,
  AITask
} from '../types/ai-system';
import { proxyMarketAnalysis } from '../services/aiSystemClient';

export interface MarketAnalysisConfig {
  grokApiKey: string;
  grokApiUrl: string;
  exchangeApis: {
    [key: string]: {
      baseUrl: string;
      apiKey: string;
      rateLimitPerMinute: number;
    };
  };
  whaleThresholds: {
    [symbol: string]: number; // Minimum amount for whale detection
  };
  memecoinSurgeThreshold: number; // Percentage threshold for surge detection
  sentimentSources: string[];
  cacheTimeoutMs: number;
  maxRetries: number;
  timeoutMs: number;
  enableRealTimeAlerts: boolean;
  africanExchangeFocus: boolean;
}

export interface WhaleTransaction {
  transactionHash: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  exchange: string;
  timestamp: Date;
  direction: 'inflow' | 'outflow';
  fromAddress?: string;
  toAddress?: string;
}

export interface MemecoinSurgeData {
  symbol: string;
  priceChange24h: number;
  priceChangePercentage: number;
  volume24h: number;
  volumeChange: number;
  marketCap: number;
  socialMentions: number;
  confidence: number;
  exchanges: string[];
}

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  sources: {
    [platform: string]: {
      sentiment: number; // -1 to 1
      mentions: number;
      engagement: number;
    };
  };
  africanRegions: {
    [region: string]: {
      sentiment: number;
      dominantCurrency: string;
      tradingVolume: number;
    };
  };
  mobileMoneyCorrelation: {
    correlationScore: number;
    mobileMoneyImpact: {
      [provider: string]: {
        adoptionRate: number;
        cryptoCorrelation: number;
      };
    };
    regionalInsights: string[];
  };
}

export interface MarketAlert {
  id: string;
  type: 'memecoin_surge' | 'whale_activity' | 'market_anomaly' | 'sentiment_shift';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  symbol: string;
  exchange?: string;
  message: string;
  data: any;
  timestamp: Date;
  africanContext: AfricanMarketContext;
  africanExchange?: string;
}

export interface ExchangeIntegrationTest {
  success: boolean;
  exchange: string;
  responseTime: number;
  error?: string;
  dataQuality?: number;
}

export interface AccuracyMetrics {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export class MarketAnalysisAgent {
  private readonly logger: Logger;

  constructor(
    _config: MarketAnalysisConfig,
    logger: Logger,
    _prisma: PrismaClient,
    _redis: Redis,
  ) {
    this.logger = logger;
    this.logger.info('[MarketAnalysisAgent] Thin wrapper initialised — delegates to ai-system');
  }

  getAgentType(): AgentType {
    return AgentType.MARKET_ANALYSIS;
  }

  getCapabilities(): string[] {
    return [
      'memecoin_surge_detection',
      'whale_tracking',
      'african_exchange_monitoring',
      'market_sentiment_analysis',
      'mobile_money_correlation',
    ];
  }

  async executeTask(task: MarketAnalysisTask): Promise<AITask> {
    const startTime = Date.now();
    try {
      this.logger.info(`[MarketAnalysisAgent] Proxying task to ai-system: ${task.id}`);
      const result = await proxyMarketAnalysis(task as any);
      task.status = TaskStatus.COMPLETED;
      task.result = {
        data: result,
        metrics: { startTime: new Date(startTime), endTime: new Date(), processingTimeMs: Date.now() - startTime },
      };
      return task;
    } catch (error) {
      this.logger.error(`[MarketAnalysisAgent] ai-system proxy failed: ${task.id}`, error);
      task.status = TaskStatus.FAILED;
      task.result = {
        error: error instanceof Error ? error.message : 'ai-system unreachable',
        metrics: { startTime: new Date(startTime), endTime: new Date(), processingTimeMs: Date.now() - startTime },
      };
      return task;
    }
  }

  async testExchangeConnection(exchange: string): Promise<ExchangeIntegrationTest> {
    return { success: false, exchange, responseTime: 0, error: 'Delegated to ai-system — direct exchange test unavailable' };
  }

  async generateAlert(type: MarketAlert['type'], data: any): Promise<MarketAlert> {
    return {
      id: `alert_${Date.now()}`,
      type,
      priority: 'normal',
      symbol: data.symbol,
      exchange: data.exchange,
      message: `Market event for ${data.symbol}`,
      data,
      timestamp: new Date(),
      africanContext: data.africanContext || ({} as AfricanMarketContext),
      africanExchange: data.exchange,
    };
  }

  calculateAccuracy(predictions: Array<{ predicted: boolean; actual: boolean }>): number {
    const correct = predictions.filter((p) => p.predicted === p.actual).length;
    return predictions.length ? correct / predictions.length : 0;
  }

  async validateAfricanExchangeData(symbol: string, exchanges: string[]): Promise<{ isValid: boolean; dataQuality: number; exchangeCoverage: string[] }> {
    return { isValid: true, dataQuality: 0, exchangeCoverage: exchanges };
  }
}