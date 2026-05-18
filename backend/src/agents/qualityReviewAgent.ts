/**
 * Quality Review Agent - Task 12
 *
 * @deprecated THIN WRAPPER — canonical implementation lives in ai-system.
 * This file delegates to the ai-system service via HTTP (see aiSystemClient).
 * Do not add business logic here; extend ai-system/agents/review/ instead.
 */

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { 
  QualityReviewTask, 
  AfricanMarketContext,
  TaskStatus,
  AITask
} from '../types/ai-system';
import { proxyQualityReview } from '../services/aiSystemClient';

export interface QualityReviewConfig {
  model?: string;
  qualityThreshold: number;
  biasThreshold: number;
  culturalSensitivityThreshold: number;
  maxTokens: number;
  temperature: number;
  timeoutMs?: number;
}

export interface QualityDimensions {
  accuracy: number;
  clarity: number;
  engagement: number;
  structure: number;
  grammar: number;
  factualConsistency: number;
  africanRelevance: number;
  culturalSensitivity: number;
}

export interface BiasAnalysis {
  overallBias: number;
  types: string[];
  concerns: string[];
  details?: {
    culturalBias: number;
    geographicBias: number;
    economicBias: number;
    genderBias: number;
    ageBias: number;
    religiousBias?: number;
  };
}

export interface CulturalAnalysis {
  religiousContext: {
    score: number;
    considerations: string[];
  };
  languageUsage: {
    score: number;
    localTerms: string[];
    appropriateness: 'low' | 'medium' | 'high';
    issues?: string[];
  };
  socialContext: {
    score: number;
    communityAspects: string[];
    economicRealities: string;
  };
}

export interface FactCheck {
  score: number;
  verifiedClaims: string[];
  questionableClaims: string[];
  falseClaims: string[];
  sources: string[];
}

export interface ImprovementSuggestion {
  category: 'structure' | 'engagement' | 'accuracy' | 'african_context' | 'cultural_sensitivity' | 'clarity';
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  specificChanges: string[];
}

export interface QualityReview {
  overallQuality: number;
  dimensions: QualityDimensions;
  biasAnalysis: BiasAnalysis;
  culturalAnalysis?: CulturalAnalysis;
  factCheck?: FactCheck;
  improvementSuggestions?: ImprovementSuggestion[];
  recommendations: string[];
  requiresHumanReview: boolean;
}

export interface QualityReviewResult {
  success: boolean;
  review?: QualityReview;
  error?: string;
  processingTime: number;
}

export interface QualityAgentMetrics {
  totalTasksProcessed: number;
  successRate: number;
  averageQualityScore: number;
  averageProcessingTime: number;
  biasDetectionRate: number;
  culturalSensitivityScore: number;
  factCheckAccuracy: number;
  lastError?: {
    message: string;
    timestamp: Date;
    taskId: string;
  };
}

export class QualityReviewAgent {
  private logger: Logger;
  private metrics: QualityAgentMetrics;

  constructor(
    _prisma: PrismaClient,
    logger: Logger,
    _config: QualityReviewConfig,
  ) {
    this.logger = logger;
    this.metrics = {
      totalTasksProcessed: 0,
      successRate: 0,
      averageQualityScore: 0,
      averageProcessingTime: 0,
      biasDetectionRate: 0,
      culturalSensitivityScore: 0,
      factCheckAccuracy: 0,
    };
    this.logger.info('[QualityReviewAgent] Thin wrapper initialised — delegates to ai-system');
  }

  async processTask(task: QualityReviewTask): Promise<QualityReviewResult> {
    const startTime = Date.now();
    try {
      this.logger.info('[QualityReviewAgent] Proxying task to ai-system', { taskId: task.id });
      const result = await proxyQualityReview(task as any) as any;
      this.metrics.totalTasksProcessed += 1;
      return {
        success: true,
        review: result?.review,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('[QualityReviewAgent] ai-system proxy failed', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      this.metrics.totalTasksProcessed += 1;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ai-system unreachable',
        processingTime: Date.now() - startTime,
      };
    }
  }

  getMetrics(): QualityAgentMetrics {
    return { ...this.metrics };
  }
}