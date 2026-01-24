// Central AI Orchestrator - Main coordination hub for all AI agents
// Optimized for CoinDaily Africa's requirements: <500ms response, single I/O, SEO-focused

import { createAuditLog, AuditActions } from '@/lib/audit';
import { TaskManager } from './task-manager';
import { AITask, AITaskType, Agent } from '../types/ai-types';
import { AgentLifecycle } from './agent-lifecycle';
import { contentGenerationAgent, ContentGenerationRequest } from '../agents/content/content-generation-agent';
import { translationAgent, TranslationRequest } from '../agents/content/translation-agent';
import { imageGenerationAgent, ImageGenerationRequest } from '../agents/visual/image-generation-agent';
import { googleReviewAgent, ReviewRequest } from '../agents/review/google-review-agent';

// Core result interfaces for AI operations
export interface AIOrchestrationResult {
  success: boolean;
  taskId: string;
  result?: unknown;
  processingTime: number;
  agentUsed?: string;
  error?: string;
  cached?: boolean;
}

export interface AISystemMetrics {
  totalTasksProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  activeAgents: number;
  queueLength: number;
  agentPerformance: Record<string, {
    tasksCompleted: number;
    successRate: number;
    averageTime: number;
  }>;
  taskTypeMetrics: Record<AITaskType, {
    totalProcessed: number;
    successRate: number;
    averageTime: number;
  }>;
}

export class CentralAIOrchestrator {
  private taskManager: TaskManager;
  private agentLifecycle: AgentLifecycle;
  private isInitialized = false;
  private metrics: AISystemMetrics;
  private cache = new Map<string, { result: unknown; timestamp: number; ttl: number }>();

  constructor() {
    this.taskManager = new TaskManager();
    this.agentLifecycle = new AgentLifecycle();
    this.metrics = this.initializeMetrics();
  }

  // Initialize the AI orchestrator system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const startTime = Date.now();

    try {
      // Initialize core components
      await Promise.all([
        this.taskManager.initialize(),
        this.agentLifecycle.initialize()
      ]);

      // Register available agents
      await this.registerAgents();

      this.isInitialized = true;

      // Log initialization
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'ai_orchestrator',
        resourceId: 'central',
        details: {
          initializationTime: Date.now() - startTime,
          agentsRegistered: this.agentLifecycle.getAvailableAgents().length,
          status: 'initialized'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'ai_orchestrator',
        resourceId: 'central',
        details: {
          error: errorMessage,
          initializationTime: Date.now() - startTime,
          status: 'failed'
        }
      });

      throw new Error(`AI Orchestrator initialization failed: ${errorMessage}`);
    }
  }

  // Main entry point for AI task execution
  async executeTask(taskData: Omit<AITask, 'id' | 'status' | 'assignedAgent'>): Promise<AIOrchestrationResult> {
    const startTime = Date.now();
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Generate unique task ID
    const taskId = `ai_${taskData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check cache first (for performance optimization)
    const cacheKey = this.generateCacheKey(taskData);
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return {
        success: true,
        taskId,
        result: cachedResult,
        processingTime: Date.now() - startTime,
        cached: true
      };
    }

    // Create full task object
    const task: AITask = {
      id: taskId,
      status: 'pending',
      ...taskData
    };

    try {
      // Add task to queue
      await this.taskManager.addTask(task);

      // Find and assign suitable agent
      const agent = await this.agentLifecycle.assignAgent(task.type, task.priority);
      if (!agent) {
        throw new Error(`No available agent for task type: ${task.type}`);
      }

      task.assignedAgent = agent.id;
      task.status = 'assigned';

      // Execute task with timeout protection (2 second limit)
      const executionPromise = this.executeWithAgent(agent, task);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Task execution timeout')), 2000)
      );

      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Cache successful results
      if (result && typeof result === 'object') {
        this.setCache(cacheKey, result, 300000); // 5 minutes TTL
      }

      // Update metrics
      this.updateMetrics(task.type, true, Date.now() - startTime, agent.type);

      // Mark task as completed
      task.status = 'completed';
      task.result = result;
      task.processingTime = Date.now() - startTime;

      await this.taskManager.updateTask(task);

      return {
        success: true,
        taskId,
        result,
        processingTime: Date.now() - startTime,
        agentUsed: agent.type
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      
      // Update task status
      task.status = 'failed';
      task.error = errorMessage;
      task.processingTime = Date.now() - startTime;

      await this.taskManager.updateTask(task);

      // Update metrics
      this.updateMetrics(task.type, false, Date.now() - startTime, task.assignedAgent || 'unknown');

      // Log error
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'ai_orchestrator',
        resourceId: taskId,
        details: {
          taskType: task.type,
          error: errorMessage,
          processingTime: Date.now() - startTime,
          assignedAgent: task.assignedAgent
        }
      });

      return {
        success: false,
        taskId,
        processingTime: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  // Execute multiple tasks in parallel (optimized for performance)
  async executeBatch(tasks: Array<Omit<AITask, 'id' | 'status' | 'assignedAgent'>>): Promise<AIOrchestrationResult[]> {
    const batchStartTime = Date.now();

    // Execute tasks in parallel with concurrency limit
    const maxConcurrent = 5; // Prevent overwhelming the system
    const results: AIOrchestrationResult[] = [];

    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(task => this.executeTask(task))
      );
      results.push(...batchResults);
    }

    // Log batch execution
    await createAuditLog({
      action: AuditActions.ARTICLE_PUBLISH,
      resource: 'ai_orchestrator',
      resourceId: 'batch',
      details: {
        totalTasks: tasks.length,
        successfulTasks: results.filter(r => r.success).length,
        totalProcessingTime: Date.now() - batchStartTime,
        averageTaskTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
      }
    });

    return results;
  }

  // Get current system metrics
  getMetrics(): AISystemMetrics {
    return {
      ...this.metrics,
      queueLength: this.taskManager.getQueueLength(),
      activeAgents: this.agentLifecycle.getActiveAgentCount()
    };
  }

  // Health check for the AI system
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    details: {
      orchestrator: boolean;
      taskManager: boolean;
      agentLifecycle: boolean;
      availableAgents: number;
      queueLength: number;
      cacheHitRate: number;
    };
  }> {
    const details = {
      orchestrator: this.isInitialized,
      taskManager: await this.taskManager.healthCheck(),
      agentLifecycle: await this.agentLifecycle.healthCheck(),
      availableAgents: this.agentLifecycle.getAvailableAgents().length,
      queueLength: this.taskManager.getQueueLength(),
      cacheHitRate: this.calculateCacheHitRate()
    };

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (!details.orchestrator || !details.taskManager || !details.agentLifecycle) {
      status = 'critical';
    } else if (details.availableAgents === 0 || details.queueLength > 100) {
      status = 'degraded';
    }

    return { status, details };
  }

  // Private helper methods
  private async registerAgents(): Promise<void> {
    // Phase 1: Analysis Agents
    await this.agentLifecycle.registerAgent({
      agentType: 'market-analysis',
      supportedTasks: ['analysis.market', 'analysis.trending'],
      maxConcurrentTasks: 3,
      averageProcessingTime: 300,
      successRate: 0.95
    });

    await this.agentLifecycle.registerAgent({
      agentType: 'sentiment-analysis',
      supportedTasks: ['analysis.sentiment'],
      maxConcurrentTasks: 5,
      averageProcessingTime: 200,
      successRate: 0.92
    });

    // Phase 2: Content Generation Agents
    await this.agentLifecycle.registerAgent({
      agentType: 'content-generation',
      supportedTasks: ['content.generate', 'content.optimize', 'content.summarize', 'content.rewrite'],
      maxConcurrentTasks: 2,
      averageProcessingTime: 1500, // ChatGPT takes longer
      successRate: 0.98
    });

    await this.agentLifecycle.registerAgent({
      agentType: 'translation',
      supportedTasks: ['translation.auto', 'translation.manual'],
      maxConcurrentTasks: 4,
      averageProcessingTime: 800, // NLLB processing time
      successRate: 0.94
    });

    // Phase 2: Visual Generation Agents
    await this.agentLifecycle.registerAgent({
      agentType: 'image-generation',
      supportedTasks: ['image.generate', 'image.thumbnail', 'image.chart'],
      maxConcurrentTasks: 1, // DALL-E is resource intensive
      averageProcessingTime: 3000, // Image generation takes time
      successRate: 0.91
    });

    // Phase 3: Google Review Agents
    await this.agentLifecycle.registerAgent({
      agentType: 'google-review',
      supportedTasks: ['moderation.content', 'research.factcheck'],
      maxConcurrentTasks: 5,
      averageProcessingTime: 1200, // Google Gemini processing time
      successRate: 0.96
    });

    await this.agentLifecycle.registerAgent({
      agentType: 'seo-optimization',
      supportedTasks: ['seo.optimize'],
      maxConcurrentTasks: 3,
      averageProcessingTime: 500,
      successRate: 0.96
    });

    // Initialize Phase 2 agents
    try {
      await contentGenerationAgent.initialize();
      await translationAgent.initialize();
      await imageGenerationAgent.initialize();
      await googleReviewAgent.initialize();
    } catch (error) {
      console.warn('Some agents failed to initialize:', error);
    }
  }

  private async executeWithAgent(agent: Agent, task: AITask): Promise<unknown> {
    // Route to specific agent implementations based on agent type
    try {
      switch (agent.type) {
        case 'content-generation':
          return await this.executeContentGeneration(task);
        
        case 'translation':
          return await this.executeTranslation(task);
        
        case 'image-generation':
          return await this.executeImageGeneration(task);
        
        case 'google-review':
          return await this.executeReview(task);
        
        case 'market-analysis':
        case 'sentiment-analysis':
          return await this.executeAnalysis(task);
        
        case 'seo-optimization':
          return await this.executeSEOOptimization(task);
        
        default:
          // Fallback for unimplemented agents
          return {
            agentType: agent.type,
            taskType: task.type,
            timestamp: new Date(),
            data: `Processed by ${agent.type} agent (mock result)`
          };
      }
    } catch (error) {
      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeContentGeneration(task: AITask): Promise<unknown> {
    const payload = task.payload as ContentGenerationRequest;
    return await contentGenerationAgent.generateContent(payload);
  }

  private async executeTranslation(task: AITask): Promise<unknown> {
    const payload = task.payload as TranslationRequest;
    return await translationAgent.translateText(payload);
  }

  private async executeImageGeneration(task: AITask): Promise<unknown> {
    const payload = task.payload as ImageGenerationRequest;
    return await imageGenerationAgent.generateImage(payload);
  }

  private async executeReview(task: AITask): Promise<unknown> {
    const payload = task.payload as ReviewRequest;
    return await googleReviewAgent.reviewContent(payload);
  }

  private async executeAnalysis(task: AITask): Promise<unknown> {
    // This would route to the market analysis agent from Phase 1
    // For now, return a structured mock result
    return {
      taskType: task.type,
      analysis: `${task.type} completed`,
      confidence: 0.95,
      timestamp: new Date(),
      data: task.payload
    };
  }

  private async executeSEOOptimization(task: AITask): Promise<unknown> {
    // SEO optimization logic would go here
    return {
      taskType: task.type,
      optimizations: ['keyword density improved', 'meta tags generated', 'readability enhanced'],
      score: 85,
      timestamp: new Date()
    };
  }

  private generateCacheKey(taskData: Omit<AITask, 'id' | 'status' | 'assignedAgent'>): string {
    const keyData = {
      type: taskData.type,
      payload: taskData.payload,
      priority: taskData.priority
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCache(key: string, result: unknown, ttl: number): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup old cache entries
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now > v.timestamp + v.ttl) {
          this.cache.delete(k);
        }
      }
    }
  }

  private updateMetrics(taskType: AITaskType, success: boolean, processingTime: number, agentType: string): void {
    this.metrics.totalTasksProcessed++;
    
    if (success) {
      this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalTasksProcessed - 1) + 1) / this.metrics.totalTasksProcessed;
    } else {
      this.metrics.successRate = (this.metrics.successRate * (this.metrics.totalTasksProcessed - 1)) / this.metrics.totalTasksProcessed;
    }

    this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.totalTasksProcessed - 1) + processingTime) / this.metrics.totalTasksProcessed;

    // Update agent performance
    if (!this.metrics.agentPerformance[agentType]) {
      this.metrics.agentPerformance[agentType] = {
        tasksCompleted: 0,
        successRate: 0,
        averageTime: 0
      };
    }

    const agentMetrics = this.metrics.agentPerformance[agentType];
    agentMetrics.tasksCompleted++;
    agentMetrics.successRate = success ? 
      (agentMetrics.successRate * (agentMetrics.tasksCompleted - 1) + 1) / agentMetrics.tasksCompleted :
      (agentMetrics.successRate * (agentMetrics.tasksCompleted - 1)) / agentMetrics.tasksCompleted;
    agentMetrics.averageTime = (agentMetrics.averageTime * (agentMetrics.tasksCompleted - 1) + processingTime) / agentMetrics.tasksCompleted;

    // Update task type metrics
    if (!this.metrics.taskTypeMetrics[taskType]) {
      this.metrics.taskTypeMetrics[taskType] = {
        totalProcessed: 0,
        successRate: 0,
        averageTime: 0
      };
    }

    const taskMetrics = this.metrics.taskTypeMetrics[taskType];
    taskMetrics.totalProcessed++;
    taskMetrics.successRate = success ?
      (taskMetrics.successRate * (taskMetrics.totalProcessed - 1) + 1) / taskMetrics.totalProcessed :
      (taskMetrics.successRate * (taskMetrics.totalProcessed - 1)) / taskMetrics.totalProcessed;
    taskMetrics.averageTime = (taskMetrics.averageTime * (taskMetrics.totalProcessed - 1) + processingTime) / taskMetrics.totalProcessed;
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    return this.cache.size > 0 ? 0.75 : 0; // Mock value for now
  }

  private initializeMetrics(): AISystemMetrics {
    return {
      totalTasksProcessed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      activeAgents: 0,
      queueLength: 0,
      agentPerformance: {},
      taskTypeMetrics: {} as Record<AITaskType, { totalProcessed: number; successRate: number; averageTime: number; }>
    };
  }
}

// Export singleton instance for global use
export const aiOrchestrator = new CentralAIOrchestrator();
