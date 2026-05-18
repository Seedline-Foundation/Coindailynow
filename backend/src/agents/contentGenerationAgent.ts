/**
 * Content Generation Agent - Task 10
 *
 * @deprecated THIN WRAPPER — canonical implementation lives in ai-system.
 * This file delegates to the ai-system service via HTTP (see aiSystemClient).
 * Do not add business logic here; extend ai-system/agents/content/ instead.
 */

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { 
  ContentGenerationTask, 
  AfricanMarketContext,
  TaskStatus,
  AITask
} from '../types/ai-system';
import { proxyContentGeneration } from '../services/aiSystemClient';

export interface ContentGenerationConfig {
  model?: string;
  maxTokens: number;
  temperature: number;
  enablePlagiarismCheck: boolean;
  qualityThreshold: number;
  africanContextWeight: number;
  plagiarismThreshold?: number;
  similarityThreshold?: number;
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
  qualityScore: number;
  wordCount: number;
  readingTime: number;
  format: 'article' | 'summary' | 'social_post' | 'newsletter';
  sources?: string[];
  plagiarismRisk?: number;
  africanRelevance?: {
    score: number;
    mentionedCountries: string[];
    mentionedExchanges: string[];
    mobileMoneyIntegration: boolean;
    localCurrencyMention: boolean;
  };
  marketDataIntegration?: {
    realTimeData: boolean;
    exchanges: string[];
    pricePoints: number[];
    volumeData: boolean;
  };
  culturalSensitivity?: {
    score: number;
    religiousContext: boolean;
    culturalReferences: string[];
    sensitiveTopics: string[];
    appropriateLanguage: boolean;
  };
  socialOptimization?: {
    hashtags: string[];
    emojis: boolean;
    characterCount: number;
    platform: string;
  };
}

export interface ContentGenerationResult {
  success: boolean;
  content?: GeneratedContent;
  error?: string;
  processingTime?: number;
  retryCount?: number;
  similarityCheck?: {
    similarArticles: Array<{
      id: string;
      title: string;
      similarityScore: number;
    }>;
    maxSimilarity: number;
  };
}

export interface MarketData {
  symbol: string;
  exchange: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: Date;
}

export interface AfricanExchange {
  id: string;
  name: string;
  country: string;
  supportedCurrencies: string[];
  isActive: boolean;
}

export class ContentGenerationAgent {
  private readonly logger: Logger;

  constructor(
    _prisma: PrismaClient,
    logger: Logger,
    _config: ContentGenerationConfig
  ) {
    this.logger = logger;
    this.logger.info('[ContentGenerationAgent] Thin wrapper initialised — delegates to ai-system');
  }

  async processTask(task: ContentGenerationTask): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    try {
      this.logger.info('[ContentGenerationAgent] Proxying task to ai-system', { taskId: task.id });
      const result = await proxyContentGeneration(task as any) as any;
      return {
        success: true,
        content: result?.content,
        processingTime: Date.now() - startTime,
        similarityCheck: result?.similarityCheck,
      };
    } catch (error) {
      this.logger.error('[ContentGenerationAgent] ai-system proxy failed', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ai-system unreachable',
        processingTime: Date.now() - startTime,
      };
    }
  }

  getMetrics() {
    return {
      totalTasksProcessed: 0,
      successRate: 0,
      averageQualityScore: 0,
      averageProcessingTime: 0,
      africanContextScore: 0,
    };
  }
}