/// <reference types="node" />
/**
 * Imo Orchestrator - Integration layer between Imo and AI Orchestrator
 * Handles routing tasks through Imo for prompt optimization before execution
 */

import { imoAgent, ImoPromptRequest, ImoPromptResult } from '../agents/prompt/imo-prompt-agent';
import { imoService } from '../agents/prompt/imo-service';
import { imoImageAgent } from '../agents/prompt/imo-image-agent';
import { imoContentAgent } from '../agents/prompt/imo-content-agent';
import { imoTranslationAgent } from '../agents/prompt/imo-translation-agent';
import { ragService } from '../agents/prompt/rag-service';
import { 
  ImoTaskType, 
  ImoCapability, 
  ImoAgent as ImoAgentType,
  ImoConfig,
  DEFAULT_IMO_CONFIG 
} from '../types/imo-types';

/**
 * Task routed through Imo
 */
export interface ImoRoutedTask {
  id: string;
  type: ImoTaskType;
  originalPayload: any;
  optimizedPrompt?: ImoPromptResult;
  status: 'pending' | 'optimizing' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  metrics?: {
    promptOptimizationTime: number;
    executionTime: number;
    totalTime: number;
    qualityScore: string;
  };
}

// Simple event callback type
type EventCallback = (...args: any[]) => void;

/**
 * Imo Orchestrator - Manages prompt optimization for all AI tasks
 */
export class ImoOrchestrator {
  private config: ImoConfig;
  private isInitialized: boolean = false;
  private taskQueue: Map<string, ImoRoutedTask> = new Map();
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private metrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgOptimizationTime: 0,
    avgQualityScore: 0
  };

  constructor(config: Partial<ImoConfig> = {}) {
    this.config = { ...DEFAULT_IMO_CONFIG, ...config };
  }

  // Simple event emitter implementation
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(...args));
  }

  on(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Initialize all Imo components
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Imo Orchestrator...');

      // Initialize core Imo agent
      await imoAgent.initialize();
      console.log('  ✅ Imo Prompt Agent initialized');

      // Initialize service layer
      await imoService.initialize();
      console.log('  ✅ Imo Service initialized');

      // Initialize RAG service
      await ragService.initialize();
      console.log('  ✅ RAG Service initialized');

      // Initialize specialized agents
      await Promise.all([
        imoImageAgent.initialize(),
        imoContentAgent.initialize(),
        imoTranslationAgent.initialize()
      ]);
      console.log('  ✅ Specialized Imo agents initialized');

      this.isInitialized = true;
      this.emit('initialized');
      console.log('✅ Imo Orchestrator fully initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Imo Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Route a task through Imo for prompt optimization
   */
  async routeTask(
    taskType: ImoTaskType,
    payload: any
  ): Promise<ImoRoutedTask> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const taskId = `imo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const task: ImoRoutedTask = {
      id: taskId,
      type: taskType,
      originalPayload: payload,
      status: 'pending',
      createdAt: new Date()
    };

    this.taskQueue.set(taskId, task);
    this.emit('taskCreated', task);

    try {
      // Step 1: Optimize prompt through Imo
      task.status = 'optimizing';
      const promptStartTime = Date.now();
      
      const optimizedPrompt = await this.optimizePrompt(taskType, payload);
      task.optimizedPrompt = optimizedPrompt;
      
      const promptTime = Date.now() - promptStartTime;

      // Step 2: Execute with optimized prompt
      task.status = 'executing';
      const execStartTime = Date.now();
      
      const result = await this.executeTask(taskType, payload, optimizedPrompt);
      task.result = result;
      
      const execTime = Date.now() - execStartTime;

      // Update task status
      task.status = 'completed';
      task.completedAt = new Date();
      task.metrics = {
        promptOptimizationTime: promptTime,
        executionTime: execTime,
        totalTime: Date.now() - startTime,
        qualityScore: optimizedPrompt?.quality?.expectedQuality || 'unknown'
      };

      this.updateMetrics(task);
      this.emit('taskCompleted', task);

      return task;

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
      
      this.metrics.failedTasks++;
      this.emit('taskFailed', task);

      throw error;
    }
  }

  /**
   * Optimize prompt based on task type
   */
  private async optimizePrompt(
    taskType: ImoTaskType,
    payload: any
  ): Promise<ImoPromptResult> {
    switch (taskType) {
      // Image tasks
      case 'imo.image.hero':
        return imoService.generateHeroImagePrompt({
          articleTitle: payload.articleTitle,
          category: payload.category,
          keywords: payload.keywords,
          africanFocus: payload.africanFocus ?? this.config.africanFocusDefault
        });

      case 'imo.image.social':
        return imoService.generateSocialImagePrompt({
          platform: payload.platform,
          topic: payload.topic,
          style: payload.style
        });

      // Content tasks
      case 'imo.content.article':
      case 'imo.content.seo':
        return imoService.generateArticlePrompt({
          topic: payload.topic,
          keywords: payload.keywords || [],
          targetAudience: payload.targetAudience,
          wordCount: payload.wordCount,
          africanFocus: payload.africanFocus ?? this.config.africanFocusDefault
        });

      // Translation tasks
      case 'imo.translation.chain':
        return imoService.generateTranslationPrompt({
          sourceText: payload.text,
          sourceLanguage: payload.sourceLanguage,
          targetLanguage: payload.targetLanguage,
          contentType: payload.contentType
        });

      // RAG/Search tasks
      case 'imo.search.rag':
        return imoService.generateSearchResponsePrompt({
          userQuery: payload.query,
          maxSources: payload.maxSources
        });

      // Prompt tasks
      case 'imo.prompt.chain':
      case 'imo.prompt.writer_editor':
      case 'imo.prompt.rag':
      case 'imo.prompt.negative':
      case 'imo.prompt.simple':
      default:
        return imoAgent.generatePrompt(payload as ImoPromptRequest);
    }
  }

  /**
   * Execute task with optimized prompt
   */
  private async executeTask(
    taskType: ImoTaskType,
    payload: any,
    optimizedPrompt: ImoPromptResult
  ): Promise<any> {
    switch (taskType) {
      case 'imo.image.hero':
        return imoImageAgent.generateArticleHeroImage(
          payload.articleTitle,
          payload.articleSummary,
          payload.category,
          payload.keywords
        );

      case 'imo.image.social':
        return imoImageAgent.generateSocialImage(
          payload.platform,
          payload.topic
        );

      case 'imo.content.article':
      case 'imo.content.seo':
        return imoContentAgent.generateArticle({
          ...payload,
          type: taskType === 'imo.content.seo' ? 'seo' : 'article'
        });

      case 'imo.content.summary':
        return imoContentAgent.generateSummary(
          payload.content,
          payload.summaryType
        );

      case 'imo.translation.chain':
        return imoTranslationAgent.translate({
          ...payload,
          useLLM: true
        });

      case 'imo.translation.batch':
        return imoTranslationAgent.batchTranslate(
          payload.text,
          payload.sourceLanguage,
          payload.targetLanguages,
          true
        );

      case 'imo.search.rag':
        // RAG tasks return the prompt for downstream LLM execution
        return {
          prompt: optimizedPrompt.prompt,
          ragContext: optimizedPrompt.ragContext,
          modelConfig: optimizedPrompt.modelConfig
        };

      // For prompt-only tasks, return the optimized prompt
      default:
        return optimizedPrompt;
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(task: ImoRoutedTask): void {
    this.metrics.totalTasks++;
    this.metrics.completedTasks++;
    
    if (task.metrics) {
      const prevAvg = this.metrics.avgOptimizationTime;
      const count = this.metrics.completedTasks;
      this.metrics.avgOptimizationTime = 
        (prevAvg * (count - 1) + task.metrics.promptOptimizationTime) / count;
    }
  }

  /**
   * Get Imo agent status
   */
  getAgentStatus(): ImoAgentType {
    return {
      id: 'imo-v1',
      name: 'Imo',
      version: '1.0.0',
      capabilities: [
        'prompt_engineering',
        'prompt_chaining',
        'negative_prompting',
        'rag_integration',
        'writer_editor_pattern',
        'multi_language_translation',
        'seo_optimization',
        'image_prompt_optimization'
      ],
      status: this.isInitialized ? 'idle' : 'offline',
      performance: {
        totalPrompts: this.metrics.totalTasks,
        avgQualityScore: this.metrics.avgQualityScore,
        avgProcessingTime: this.metrics.avgOptimizationTime,
        successRate: this.metrics.totalTasks > 0 
          ? (this.metrics.completedTasks / this.metrics.totalTasks) * 100 
          : 100
      }
    };
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.taskQueue.size,
      imoMetrics: imoAgent.getMetrics()
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    components: Record<string, boolean>;
  }> {
    const components: Record<string, boolean> = {};

    try {
      components.imoAgent = await imoAgent.healthCheck();
      components.imoService = await imoService.healthCheck();
      components.imoImageAgent = await imoImageAgent.healthCheck();
      components.imoContentAgent = await imoContentAgent.healthCheck();
      components.imoTranslationAgent = await imoTranslationAgent.healthCheck();
      
      const ragHealth = await ragService.healthCheck();
      components.ragService = ragHealth.healthy;

      const healthy = Object.values(components).every(v => v);

      return { healthy, components };

    } catch (error) {
      return { 
        healthy: false, 
        components: { error: false } 
      };
    }
  }

  /**
   * Clear task queue
   */
  clearQueue(): void {
    this.taskQueue.clear();
  }
}

// Export singleton
export const imoOrchestrator = new ImoOrchestrator();

// Export convenience function for quick routing
export async function routeThroughImo(
  taskType: ImoTaskType,
  payload: any
): Promise<ImoRoutedTask> {
  return imoOrchestrator.routeTask(taskType, payload);
}
