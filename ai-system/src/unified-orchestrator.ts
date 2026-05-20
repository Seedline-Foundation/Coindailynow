/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                      UNIFIED AI ORCHESTRATOR                                ║
 * ║                                                                             ║
 * ║  Consolidates the three previously disconnected AI architectures into a     ║
 * ║  single entry point:                                                        ║
 * ║                                                                             ║
 * ║  1. BaseAgent Registry (27 agents in agents/)                               ║
 * ║     - Each agent extends BaseAgent and implements processTask()              ║
 * ║     - Lazy-loaded via AgentRegistry on first use                            ║
 * ║                                                                             ║
 * ║  2. AIAgentOrchestrator (Redis queues in orchestrator/)                      ║
 * ║     - Manages Redis-backed task queues, circuit breakers, metrics            ║
 * ║     - Handles agent lifecycle, health checks, dead-letter queues            ║
 * ║                                                                             ║
 * ║  3. Review Agent Pipeline (4 agents in agents/review/)                      ║
 * ║     - AIReviewAgent orchestrates Research → Write → Image → Translate       ║
 * ║     - Self-hosted editorial review via Ollama before admin queue            ║
 * ║                                                                             ║
 * ║  This unified orchestrator provides:                                        ║
 * ║    processTask(taskType, input) — single API that routes to the correct     ║
 * ║    subsystem based on task type:                                            ║
 * ║                                                                             ║
 * ║    • "agent.<id>"          → BaseAgent registry (lazy-loaded)               ║
 * ║    • "queue.<AgentType>"   → Redis queue orchestrator                       ║
 * ║    • "review.pipeline"     → Full editorial review pipeline                 ║
 * ║    • "review.validate.*"   → Individual review validation steps             ║
 * ║    • "imo.<task>"          → Imo prompt optimization orchestrator           ║
 * ║                                                                             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import { AgentRegistry } from './agent-registry.js';
import type { AgentTask } from '../agents/base/BaseAgent.js';
import type { AIAgentOrchestrator } from '../orchestrator/index.js';
import type { ImoOrchestrator } from '../orchestrator/imo-orchestrator.js';
import type { AgentType, AITask, TaskPriority, TaskStatus } from '../types/index.js';

// ---------------------------------------------------------------------------
// Result envelope returned by every processTask call
// ---------------------------------------------------------------------------

export interface UnifiedTaskResult {
  taskId: string;
  taskType: string;
  status: 'completed' | 'failed' | 'queued';
  data?: any;
  error?: string;
  metrics?: {
    processingTimeMs: number;
    subsystem: 'agent-registry' | 'redis-queue' | 'review-pipeline' | 'imo';
    agentId?: string;
  };
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface UnifiedOrchestratorConfig {
  /** Whether to eagerly load all BaseAgent agents at init (default: false = lazy). */
  eagerLoadAgents?: boolean;
  /** Redis URL for the queue orchestrator. */
  redisUrl?: string;
}

// ---------------------------------------------------------------------------
// Unified Orchestrator
// ---------------------------------------------------------------------------

export class UnifiedOrchestrator extends EventEmitter {
  private registry: AgentRegistry;
  private queueOrchestrator: AIAgentOrchestrator | null = null;
  private imoOrchestrator: ImoOrchestrator | null = null;
  private initialized = false;
  private config: UnifiedOrchestratorConfig;

  constructor(config: UnifiedOrchestratorConfig = {}) {
    super();
    this.config = config;
    this.registry = AgentRegistry.getInstance();
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.eagerLoadAgents) {
      await this.registry.loadAll();
    }

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Optionally attach an existing AIAgentOrchestrator so that queue-routed
   * tasks flow through the Redis-backed system.
   */
  attachQueueOrchestrator(orchestrator: AIAgentOrchestrator): void {
    this.queueOrchestrator = orchestrator;
  }

  /**
   * Optionally attach the Imo prompt-optimization orchestrator.
   */
  attachImoOrchestrator(imo: ImoOrchestrator): void {
    this.imoOrchestrator = imo;
  }

  // -----------------------------------------------------------------------
  // Single unified API
  // -----------------------------------------------------------------------

  /**
   * Route a task to the correct subsystem.
   *
   * Task type prefixes:
   *   "agent.<agentId>"            – BaseAgent registry
   *   "queue.<AgentType>"          – Redis queue orchestrator
   *   "review.pipeline"            – Full editorial pipeline
   *   "review.validate.research"   – Validate research only
   *   "review.validate.article"    – Validate article only
   *   "review.validate.image"      – Validate image only
   *   "review.validate.translations" – Validate translations only
   *   "imo.<ImoTaskType>"          – Imo prompt optimization
   *
   * For convenience, bare agent IDs (e.g. "sentiment-analysis-agent") are
   * also accepted and treated as "agent.<id>".
   */
  async processTask(
    taskType: string,
    input: Record<string, any>,
    options?: { priority?: 'low' | 'normal' | 'high' | 'urgent' },
  ): Promise<UnifiedTaskResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const start = Date.now();
    const taskId = `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // ── 1. BaseAgent registry (prefix "agent." or bare agent id) ──
      if (taskType.startsWith('agent.')) {
        return await this.routeToAgent(taskType.slice(6), input, options, taskId, start);
      }

      // Check if the taskType is a bare agent id (exists in registry)
      const registryList = this.registry.listAgents();
      if (registryList.some((a) => a.id === taskType)) {
        return await this.routeToAgent(taskType, input, options, taskId, start);
      }

      // ── 2. Redis queue orchestrator ──
      if (taskType.startsWith('queue.')) {
        return await this.routeToQueue(taskType.slice(6), input, options, taskId, start);
      }

      // ── 3. Review pipeline ──
      if (taskType.startsWith('review.')) {
        return await this.routeToReviewPipeline(taskType, input, taskId, start);
      }

      // ── 4. Imo prompt orchestrator ──
      if (taskType.startsWith('imo.')) {
        return await this.routeToImo(taskType, input, taskId, start);
      }

      // ── Unknown ──
      return {
        taskId,
        taskType,
        status: 'failed',
        error: `Unknown task type: "${taskType}". Use "agent.<id>", "queue.<AgentType>", "review.pipeline", or "imo.<task>".`,
        metrics: { processingTimeMs: Date.now() - start, subsystem: 'agent-registry' },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        taskId,
        taskType,
        status: 'failed',
        error: message,
        metrics: { processingTimeMs: Date.now() - start, subsystem: 'agent-registry' },
      };
    }
  }

  // -----------------------------------------------------------------------
  // Registry delegation helpers
  // -----------------------------------------------------------------------

  getRegistry(): AgentRegistry {
    return this.registry;
  }

  getQueueOrchestrator(): AIAgentOrchestrator | null {
    return this.queueOrchestrator;
  }

  getImoOrchestrator(): ImoOrchestrator | null {
    return this.imoOrchestrator;
  }

  // -----------------------------------------------------------------------
  // Route implementations
  // -----------------------------------------------------------------------

  private async routeToAgent(
    agentId: string,
    input: Record<string, any>,
    options: { priority?: 'low' | 'normal' | 'high' | 'urgent' } | undefined,
    taskId: string,
    start: number,
  ): Promise<UnifiedTaskResult> {
    const agent = await this.registry.getAgent(agentId);
    if (!agent) {
      return {
        taskId,
        taskType: `agent.${agentId}`,
        status: 'failed',
        error: `Agent "${agentId}" not found in registry. Available: ${this.registry.listAgents().map((a) => a.id).join(', ')}`,
        metrics: { processingTimeMs: Date.now() - start, subsystem: 'agent-registry' },
      };
    }

    const result: AgentTask = await agent.execute(input, options?.priority || 'normal');

    return {
      taskId: result.id,
      taskType: `agent.${agentId}`,
      status: result.status === 'completed' ? 'completed' : 'failed',
      data: result.output,
      error: result.error,
      metrics: {
        processingTimeMs: result.processingTimeMs || (Date.now() - start),
        subsystem: 'agent-registry',
        agentId,
      },
    };
  }

  private async routeToQueue(
    agentType: string,
    input: Record<string, any>,
    options: { priority?: 'low' | 'normal' | 'high' | 'urgent' } | undefined,
    taskId: string,
    start: number,
  ): Promise<UnifiedTaskResult> {
    if (!this.queueOrchestrator) {
      return {
        taskId,
        taskType: `queue.${agentType}`,
        status: 'failed',
        error: 'Redis queue orchestrator not attached. Call attachQueueOrchestrator() first.',
        metrics: { processingTimeMs: Date.now() - start, subsystem: 'redis-queue' },
      };
    }

    const task: AITask = {
      id: taskId,
      type: agentType as AgentType,
      priority: (options?.priority || 'normal') as TaskPriority,
      status: 'queued' as TaskStatus,
      payload: input,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
      },
    };

    const queued = await this.queueOrchestrator.queueTask(task);

    return {
      taskId,
      taskType: `queue.${agentType}`,
      status: queued ? 'queued' : 'failed',
      error: queued ? undefined : 'Failed to queue task',
      metrics: { processingTimeMs: Date.now() - start, subsystem: 'redis-queue' },
    };
  }

  private async routeToReviewPipeline(
    taskType: string,
    input: Record<string, any>,
    taskId: string,
    start: number,
  ): Promise<UnifiedTaskResult> {
    // Dynamically import to avoid circular deps and keep the module optional
    const { runEditorialPipeline } = await import('../pipeline/editorialPipeline.js');

    if (taskType === 'review.pipeline') {
      const result = await runEditorialPipeline();
      return {
        taskId,
        taskType,
        status: result ? 'completed' : 'failed',
        data: result,
        metrics: { processingTimeMs: Date.now() - start, subsystem: 'review-pipeline' },
      };
    }

    // Individual validation steps — import the review agent directly
    const { AIReviewAgent } = await import('../agents/review/aiReviewAgent.js');
    const Redis = (await import('ioredis')).default as unknown as typeof import('ioredis').default;
    const winston = (await import('winston')).default;
    const { PrismaClient } = await import('@prisma/client');

    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const logger = winston.createLogger({
      transports: [new winston.transports.Console({ silent: process.env.NODE_ENV === 'test' })],
    });
    const prisma = new PrismaClient();
    const reviewAgent = new AIReviewAgent(redis, logger, prisma);

    try {
      let validationResult: any;

      if (taskType === 'review.validate.research') {
        validationResult = await reviewAgent.validateResearch(input as any);
      } else if (taskType === 'review.validate.article') {
        validationResult = await reviewAgent.validateArticle(input.article, input.research);
      } else if (taskType === 'review.validate.image') {
        validationResult = await reviewAgent.validateImage(input.image, input.article);
      } else if (taskType === 'review.validate.translations') {
        validationResult = await reviewAgent.validateTranslations(input.translations, input.original);
      } else {
        return {
          taskId,
          taskType,
          status: 'failed',
          error: `Unknown review task: "${taskType}"`,
          metrics: { processingTimeMs: Date.now() - start, subsystem: 'review-pipeline' },
        };
      }

      return {
        taskId,
        taskType,
        status: 'completed',
        data: validationResult,
        metrics: { processingTimeMs: Date.now() - start, subsystem: 'review-pipeline' },
      };
    } finally {
      await redis.quit().catch(() => {});
      await prisma.$disconnect().catch(() => {});
    }
  }

  private async routeToImo(
    taskType: string,
    input: Record<string, any>,
    taskId: string,
    start: number,
  ): Promise<UnifiedTaskResult> {
    if (!this.imoOrchestrator) {
      // Lazy-load the singleton
      const { imoOrchestrator } = await import('../orchestrator/imo-orchestrator.js');
      this.imoOrchestrator = imoOrchestrator;
    }

    const imo = this.imoOrchestrator;
    const result = await imo.routeTask(taskType as any, input);

    return {
      taskId: result.id,
      taskType,
      status: result.status === 'completed' ? 'completed' : 'failed',
      data: result.result,
      error: result.error,
      metrics: {
        processingTimeMs: result.metrics?.totalTime || (Date.now() - start),
        subsystem: 'imo',
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Convenience singleton + factory
// ---------------------------------------------------------------------------

let _defaultInstance: UnifiedOrchestrator | null = null;

export function getUnifiedOrchestrator(
  config?: UnifiedOrchestratorConfig,
): UnifiedOrchestrator {
  if (!_defaultInstance) {
    _defaultInstance = new UnifiedOrchestrator(config);
  }
  return _defaultInstance;
}

export default UnifiedOrchestrator;
