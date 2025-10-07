/**
 * AI Agent Orchestrator - Task 9
 * Central orchestrator for AI agents with microservices architecture and message queues
 * Implements agent lifecycle management, task queuing, and African market specialization
 */

import { Redis, Logger } from '../../backend/src/ai/dependencies';
import { EventEmitter } from 'events';
import {
  AITask,
  AIAgent,
  AgentType,
  AgentStatus,
  TaskStatus,
  TaskPriority,
  OrchestratorConfig,
  OrchestratorEvent,
  OrchestratorEventType,
  AgentMessage,
  MessageType,
  TaskMetrics,
  AgentMetrics
} from '../types';

export interface TaskAssignment {
  agentId: string;
  task: AITask;
  assignedAt: Date;
}

export interface QueueMetrics {
  queueSize: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageWaitTime: number;
}

export interface SystemMetrics {
  totalTasks: number;
  activeTasks: number;
  totalAgents: number;
  activeAgents: number;
  averageResponseTime: number;
  errorRate: number;
  queueMetrics: Record<AgentType, QueueMetrics>;
}

/**
 * Central AI Agent Orchestrator
 * Manages agent lifecycle, task distribution, and system monitoring
 */
export class AIAgentOrchestrator extends EventEmitter {
  private readonly config: OrchestratorConfig;
  private readonly logger: Logger;
  private readonly redis: Redis;
  private readonly agents: Map<string, AIAgent>;
  private readonly tasks: Map<string, AITask>;
  private readonly queues: Map<AgentType, AITask[]>;
  private readonly deadLetterQueues: Map<AgentType, AITask[]>;
  private readonly activeAssignments: Map<string, TaskAssignment>;
  private readonly circuitBreakers: Map<AgentType, CircuitBreaker>;
  private running: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: OrchestratorConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.redis = new Redis(config.redis);
    this.agents = new Map();
    this.tasks = new Map();
    this.queues = new Map();
    this.deadLetterQueues = new Map();
    this.activeAssignments = new Map();
    this.circuitBreakers = new Map();

    // Initialize queues for each agent type
    Object.values(AgentType).forEach(agentType => {
      this.queues.set(agentType, []);
      this.deadLetterQueues.set(agentType, []);
      
      if (config.performance.enableCircuitBreaker) {
        this.circuitBreakers.set(agentType, new CircuitBreaker({
          errorThreshold: 5,
          timeoutMs: config.performance.maxResponseTimeMs,
          resetTimeoutMs: 30000
        }));
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting AI Agent Orchestrator...');
      
      await this.redis.ping();
      this.logger.info('Redis connection established');

      // Start health check monitoring
      this.healthCheckInterval = setInterval(() => {
        this.performHealthChecks();
      }, 30000); // Every 30 seconds

      // Start metrics collection
      this.metricsInterval = setInterval(() => {
        this.collectMetrics();
      }, this.config.monitoring.metricsInterval);

      this.running = true;
      
      this.emit('orchestratorStarted');
      this.logger.info('AI Agent Orchestrator started successfully');
    } catch (error) {
      this.logger.error('Failed to start AI Agent Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Shutdown the orchestrator gracefully
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down AI Agent Orchestrator...');
      
      this.running = false;

      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      // Notify all agents of shutdown
      const shutdownMessage: AgentMessage = {
        id: `shutdown-${Date.now()}`,
        from: 'orchestrator',
        to: 'all',
        type: MessageType.SHUTDOWN,
        payload: { reason: 'graceful_shutdown' },
        timestamp: new Date()
      };

      await this.broadcastMessage(shutdownMessage);

      // Close Redis connection
      await this.redis.quit();

      this.emit('orchestratorShutdown');
      this.logger.info('AI Agent Orchestrator shut down successfully');
    } catch (error) {
      this.logger.error('Error during orchestrator shutdown:', error);
      throw error;
    }
  }

  /**
   * Check if orchestrator is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: AIAgent): Promise<boolean> {
    try {
      this.agents.set(agent.id, agent);
      
      // Store in Redis for persistence
      await this.redis.hset(
        'agents',
        agent.id,
        JSON.stringify(agent)
      );

      this.logger.info(`Agent registered: ${agent.id} (${agent.type})`);
      
      this.emitEvent({
        type: OrchestratorEventType.AGENT_REGISTERED,
        timestamp: new Date(),
        data: { agentId: agent.id, agentType: agent.type },
        severity: 'info'
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to register agent ${agent.id}:`, error);
      return false;
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return false;
      }

      // Reassign any active tasks
      await this.reassignAgentTasks(agentId);

      this.agents.delete(agentId);
      await this.redis.hdel('agents', agentId);

      this.logger.info(`Agent unregistered: ${agentId}`);
      
      this.emitEvent({
        type: OrchestratorEventType.AGENT_DISCONNECTED,
        timestamp: new Date(),
        data: { agentId, agentType: agent.type },
        severity: 'warning'
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AIAgent | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * Update agent heartbeat
   */
  async updateAgentHeartbeat(agentId: string, timestamp: Date): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = timestamp;
      this.agents.set(agentId, agent);
      
      // Update in Redis
      await this.redis.hset(
        'agents',
        agentId,
        JSON.stringify(agent)
      );
    }
  }

  /**
   * Get offline agents
   */
  async getOfflineAgents(): Promise<AIAgent[]> {
    const offlineThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    return Array.from(this.agents.values()).filter(agent => {
      return (now - agent.lastHeartbeat.getTime()) > offlineThreshold;
    });
  }

  /**
   * Queue a new task
   */
  async queueTask(task: AITask): Promise<boolean> {
    try {
      // Validate task
      if (!this.validateTask(task)) {
        throw new Error('Invalid task format');
      }

      // Check queue size limits
      const queue = this.queues.get(task.type);
      const queueConfig = this.config.queues[task.type];
      
      if (queue && queue.length >= queueConfig.maxSize) {
        await this.triggerAlert(
          `Queue size limit exceeded for ${task.type}`,
          'error',
          { agentType: task.type, queueSize: queue.length, limit: queueConfig.maxSize }
        );
        
        this.emitEvent({
          type: OrchestratorEventType.QUEUE_OVERFLOW,
          timestamp: new Date(),
          data: { agentType: task.type, queueSize: queue.length },
          severity: 'error'
        });
        throw new Error('Queue size limit exceeded');
      }

      // Add task to queue and maps
      task.status = TaskStatus.QUEUED;
      task.metadata.updatedAt = new Date();
      
      this.tasks.set(task.id, task);
      
      // Insert task in priority order
      this.insertTaskByPriority(task);
      
      // Store in Redis
      await this.redis.hset(
        'tasks',
        task.id,
        JSON.stringify(task)
      );

      this.logger.info(`Task queued: ${task.id} (${task.type}, priority: ${task.priority})`);
      
      this.emitEvent({
        type: OrchestratorEventType.TASK_QUEUED,
        timestamp: new Date(),
        data: { taskId: task.id, agentType: task.type, priority: task.priority },
        severity: 'info'
      });

      // Try to assign immediately if agents are available
      await this.assignTask(task.type);

      return true;
    } catch (error) {
      this.logger.error(`Failed to queue task ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<AITask | null> {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get next task from queue
   */
  async getNextTask(agentType: AgentType): Promise<AITask | null> {
    const queue = this.queues.get(agentType);
    if (!queue || queue.length === 0) {
      return null;
    }

    return queue[0] || null;
  }

  /**
   * Assign task to available agent
   */
  async assignTask(agentType: AgentType): Promise<TaskAssignment | null> {
    try {
      // Find available agent
      const availableAgent = this.findAvailableAgent(agentType);
      if (!availableAgent) {
        return null;
      }

      // Get next task from queue
      const queue = this.queues.get(agentType);
      if (!queue || queue.length === 0) {
        return null;
      }

      const task = queue.shift()!;
      task.status = TaskStatus.PROCESSING;
      task.metadata.assignedAgent = availableAgent.id;
      task.metadata.updatedAt = new Date();

      // Create assignment
      const assignment: TaskAssignment = {
        agentId: availableAgent.id,
        task,
        assignedAt: new Date()
      };

      // Update agent status
      availableAgent.status = AgentStatus.BUSY;
      this.agents.set(availableAgent.id, availableAgent);

      // Store assignment
      this.activeAssignments.set(task.id, assignment);

      // Update in storage
      await this.redis.hset('tasks', task.id, JSON.stringify(task));
      await this.redis.hset('agents', availableAgent.id, JSON.stringify(availableAgent));

      this.logger.info(`Task assigned: ${task.id} to agent ${availableAgent.id}`);
      
      this.emitEvent({
        type: OrchestratorEventType.TASK_STARTED,
        timestamp: new Date(),
        data: { taskId: task.id, agentId: availableAgent.id },
        severity: 'info'
      });

      // Send task to agent
      const taskMessage: AgentMessage = {
        id: `task-${task.id}`,
        from: 'orchestrator',
        to: availableAgent.id,
        type: MessageType.TASK_ASSIGNMENT,
        payload: task,
        timestamp: new Date()
      };

      await this.sendMessage(taskMessage);

      return assignment;
    } catch (error) {
      this.logger.error(`Failed to assign task for ${agentType}:`, error);
      return null;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus, 
    result?: { data?: any; error?: string; metrics?: TaskMetrics }
  ): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        return false;
      }

      const oldStatus = task.status;
      task.status = status;
      task.metadata.updatedAt = new Date();
      
      if (result) {
        task.result = result;
      }

      // Handle status-specific logic
      await this.handleStatusChange(task, oldStatus, status);

      // Update storage
      this.tasks.set(taskId, task);
      await this.redis.hset('tasks', taskId, JSON.stringify(task));

      this.logger.info(`Task status updated: ${taskId} from ${oldStatus} to ${status}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to update task status ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Get dead letter tasks
   */
  async getDeadLetterTasks(agentType: AgentType): Promise<AITask[]> {
    return this.deadLetterQueues.get(agentType) || [];
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    const agent = this.agents.get(agentId);
    return agent ? agent.metrics : null;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(agentType: AgentType): Promise<QueueMetrics> {
    const queue = this.queues.get(agentType) || [];
    const deadLetterQueue = this.deadLetterQueues.get(agentType) || [];
    
    // Calculate metrics from all tasks of this type
    const allTasks = Array.from(this.tasks.values()).filter(task => task.type === agentType);
    const processingTasks = allTasks.filter(task => task.status === TaskStatus.PROCESSING);
    const completedTasks = allTasks.filter(task => task.status === TaskStatus.COMPLETED);
    const failedTasks = allTasks.filter(task => task.status === TaskStatus.FAILED);

    // Calculate average wait time
    const completedTasksWithTiming = completedTasks.filter(task => 
      task.result?.metrics?.startTime && task.result?.metrics?.endTime
    );
    
    const averageWaitTime = completedTasksWithTiming.length > 0 
      ? completedTasksWithTiming.reduce((sum, task) => {
          const start = task.metadata.createdAt.getTime();
          const processing = task.result!.metrics!.startTime.getTime();
          return sum + (processing - start);
        }, 0) / completedTasksWithTiming.length
      : 0;

    return {
      queueSize: queue.length,
      pendingTasks: queue.length,
      processingTasks: processingTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length + deadLetterQueue.length,
      averageWaitTime
    };
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const totalTasks = this.tasks.size;
    const activeTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PROCESSING).length;
    
    const totalAgents = this.agents.size;
    const activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.status !== AgentStatus.OFFLINE).length;

    // Calculate average response time
    const completedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.COMPLETED && task.result?.metrics?.processingTimeMs);
    
    const averageResponseTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => sum + (task.result!.metrics!.processingTimeMs || 0), 0) / completedTasks.length
      : 0;

    // Calculate error rate
    const totalProcessedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED).length;
    
    const failedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.FAILED).length;
    
    const errorRate = totalProcessedTasks > 0 ? failedTasks / totalProcessedTasks : 0;

    // Get queue metrics for each agent type
    const queueMetrics: Record<AgentType, QueueMetrics> = {} as any;
    for (const agentType of Object.values(AgentType)) {
      queueMetrics[agentType] = await this.getQueueMetrics(agentType);
    }

    return {
      totalTasks,
      activeTasks,
      totalAgents,
      activeAgents,
      averageResponseTime,
      errorRate,
      queueMetrics
    };
  }

  /**
   * Trigger alert
   */
  async triggerAlert(message: string, severity: 'warning' | 'error' | 'critical', data?: any): Promise<void> {
    const alert = {
      message,
      severity,
      timestamp: new Date(),
      data
    };

    const logLevel = severity === 'critical' ? 'error' : severity;
    (this.logger as any)[logLevel](`ALERT: ${message}`, data);
    
    this.emitEvent({
      type: OrchestratorEventType.PERFORMANCE_THRESHOLD_EXCEEDED,
      timestamp: new Date(),
      data: alert,
      severity
    });

    // Store alert in Redis for monitoring dashboard
    await this.redis.lpush('alerts', JSON.stringify(alert));
    await this.redis.ltrim('alerts', 0, 99); // Keep last 100 alerts
  }

  // Private methods

  private setupEventHandlers(): void {
    this.on('taskCompleted', this.handleTaskCompleted.bind(this));
    this.on('taskFailed', this.handleTaskFailed.bind(this));
    this.on('agentDisconnected', this.handleAgentDisconnected.bind(this));
  }

  private validateTask(task: AITask): boolean {
    return !!(
      task.id &&
      task.type &&
      task.priority &&
      task.payload &&
      task.metadata &&
      task.metadata.maxRetries >= 0
    );
  }

  private insertTaskByPriority(task: AITask): void {
    const queue = this.queues.get(task.type);
    if (!queue) return;

    const priorityOrder = {
      [TaskPriority.URGENT]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.NORMAL]: 2,
      [TaskPriority.LOW]: 3
    };

    const insertIndex = queue.findIndex(queuedTask => 
      priorityOrder[task.priority] < priorityOrder[queuedTask.priority]
    );

    if (insertIndex === -1) {
      queue.push(task);
    } else {
      queue.splice(insertIndex, 0, task);
    }
  }

  private findAvailableAgent(agentType: AgentType): AIAgent | null {
    const availableAgents = Array.from(this.agents.values()).filter(agent =>
      agent.type === agentType &&
      agent.status === AgentStatus.IDLE &&
      this.isAgentHealthy(agent)
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Return agent with best metrics (lowest average processing time)
    return availableAgents.reduce((best, current) =>
      current.metrics.averageProcessingTime < best.metrics.averageProcessingTime ? current : best
    );
  }

  private isAgentHealthy(agent: AIAgent): boolean {
    const healthyThreshold = 2 * 60 * 1000; // 2 minutes
    const now = Date.now();
    return (now - agent.lastHeartbeat.getTime()) < healthyThreshold;
  }

  private async handleStatusChange(task: AITask, oldStatus: TaskStatus, newStatus: TaskStatus): Promise<void> {
    const assignment = this.activeAssignments.get(task.id);

    switch (newStatus) {
      case TaskStatus.COMPLETED:
        await this.handleTaskCompleted(task, assignment);
        break;
      case TaskStatus.FAILED:
        await this.handleTaskFailed(task, assignment);
        break;
    }
  }

  private async handleTaskCompleted(task: AITask, assignment?: TaskAssignment): Promise<void> {
    if (assignment) {
      // Free up the agent
      const agent = this.agents.get(assignment.agentId);
      if (agent) {
        agent.status = AgentStatus.IDLE;
        agent.metrics.tasksProcessed++;
        agent.metrics.tasksSuccessful++;
        
        if (task.result?.metrics?.processingTimeMs) {
          agent.metrics.averageProcessingTime = 
            (agent.metrics.averageProcessingTime * (agent.metrics.tasksProcessed - 1) + task.result.metrics.processingTimeMs) / 
            agent.metrics.tasksProcessed;
        }

        this.agents.set(agent.id, agent);
        await this.redis.hset('agents', agent.id, JSON.stringify(agent));
      }

      this.activeAssignments.delete(task.id);
    }

    this.emitEvent({
      type: OrchestratorEventType.TASK_COMPLETED,
      timestamp: new Date(),
      data: { taskId: task.id, agentId: assignment?.agentId },
      severity: 'info'
    });

    // Try to assign next task
    await this.assignTask(task.type);
  }

  private async handleTaskFailed(task: AITask, assignment?: TaskAssignment): Promise<void> {
    if (assignment) {
      // Free up the agent and update metrics
      const agent = this.agents.get(assignment.agentId);
      if (agent) {
        agent.status = AgentStatus.IDLE;
        agent.metrics.tasksProcessed++;
        agent.metrics.tasksFailed++;
        agent.metrics.lastError = {
          message: task.result?.error || 'Unknown error',
          timestamp: new Date(),
          taskId: task.id
        };

        this.agents.set(agent.id, agent);
        await this.redis.hset('agents', agent.id, JSON.stringify(agent));
      }

      this.activeAssignments.delete(task.id);
    }

    // Handle retry logic
    if (task.metadata.retryCount < task.metadata.maxRetries) {
      task.metadata.retryCount++;
      task.status = TaskStatus.QUEUED;
      task.metadata.assignedAgent = undefined;
      
      // Re-queue with exponential backoff
      const retryPolicy = this.config.queues[task.type].retryPolicy;
      const delay = this.calculateRetryDelay(retryPolicy, task.metadata.retryCount);
      
      setTimeout(() => {
        this.insertTaskByPriority(task);
        this.assignTask(task.type);
      }, delay);

      this.logger.info(`Task ${task.id} queued for retry ${task.metadata.retryCount}/${task.metadata.maxRetries}`);
    } else {
      // Move to dead letter queue
      const deadLetterQueue = this.deadLetterQueues.get(task.type);
      if (deadLetterQueue) {
        deadLetterQueue.push(task);
      }

      this.logger.error(`Task ${task.id} moved to dead letter queue after ${task.metadata.retryCount} retries`);
    }

    this.emitEvent({
      type: OrchestratorEventType.TASK_FAILED,
      timestamp: new Date(),
      data: { 
        taskId: task.id, 
        agentId: assignment?.agentId, 
        error: task.result?.error,
        retryCount: task.metadata.retryCount 
      },
      severity: task.metadata.retryCount >= task.metadata.maxRetries ? 'error' : 'warning'
    });

    // Try to assign next task
    await this.assignTask(task.type);
  }

  private calculateRetryDelay(retryPolicy: any, retryCount: number): number {
    switch (retryPolicy.backoffStrategy) {
      case 'exponential':
        return Math.min(retryPolicy.baseDelayMs * Math.pow(2, retryCount - 1), retryPolicy.maxDelayMs);
      case 'linear':
        return Math.min(retryPolicy.baseDelayMs * retryCount, retryPolicy.maxDelayMs);
      case 'fixed':
      default:
        return retryPolicy.baseDelayMs;
    }
  }

  private async reassignAgentTasks(agentId: string): Promise<void> {
    const assignments = Array.from(this.activeAssignments.entries())
      .filter(([_, assignment]) => assignment.agentId === agentId);

    for (const [taskId, assignment] of assignments) {
      const task = assignment.task;
      task.status = TaskStatus.QUEUED;
      task.metadata.assignedAgent = undefined;
      
      this.activeAssignments.delete(taskId);
      this.insertTaskByPriority(task);
      
      this.logger.info(`Task ${taskId} reassigned due to agent ${agentId} disconnection`);
    }
  }

  private async performHealthChecks(): Promise<void> {
    const offlineAgents = await this.getOfflineAgents();
    
    for (const agent of offlineAgents) {
      if (agent.status !== AgentStatus.OFFLINE) {
        agent.status = AgentStatus.OFFLINE;
        this.agents.set(agent.id, agent);
        
        this.emitEvent({
          type: OrchestratorEventType.AGENT_HEALTH_CHANGED,
          timestamp: new Date(),
          data: { agentId: agent.id, status: AgentStatus.OFFLINE },
          severity: 'warning'
        });

        // Reassign tasks
        await this.reassignAgentTasks(agent.id);
      }
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const systemMetrics = await this.getSystemMetrics();
      
      // Store metrics in Redis
      await this.redis.set('system_metrics', JSON.stringify(systemMetrics));
      
      // Check alert thresholds
      await this.checkAlertThresholds(systemMetrics);
      
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }

  private async checkAlertThresholds(metrics: SystemMetrics): Promise<void> {
    const thresholds = this.config.monitoring.alertThresholds;
    
    // Check queue size thresholds
    for (const [agentType, queueMetrics] of Object.entries(metrics.queueMetrics)) {
      if (queueMetrics.queueSize > thresholds.queueSize) {
        await this.triggerAlert(
          `Queue size threshold exceeded for ${agentType}`,
          'warning',
          { agentType, queueSize: queueMetrics.queueSize, threshold: thresholds.queueSize }
        );
      }
    }
    
    // Check error rate threshold
    if (metrics.errorRate > thresholds.errorRate) {
      await this.triggerAlert(
        'Error rate threshold exceeded',
        'error',
        { errorRate: metrics.errorRate, threshold: thresholds.errorRate }
      );
    }
    
    // Check response time threshold
    if (metrics.averageResponseTime > thresholds.responseTime) {
      await this.triggerAlert(
        'Response time threshold exceeded',
        'warning',
        { responseTime: metrics.averageResponseTime, threshold: thresholds.responseTime }
      );
    }
  }

  private async sendMessage(message: AgentMessage): Promise<void> {
    // In a real implementation, this would send the message via appropriate channel
    // (WebSocket, message queue, HTTP, etc.)
    await this.redis.lpush(`agent_messages:${message.to}`, JSON.stringify(message));
  }

  private async broadcastMessage(message: AgentMessage): Promise<void> {
    // Send message to all registered agents
    const agents = Array.from(this.agents.values());
    for (const agent of agents) {
      const agentMessage = { ...message, to: agent.id };
      await this.sendMessage(agentMessage);
    }
  }

  private emitEvent(event: OrchestratorEvent): void {
    this.emit('orchestratorEvent', event);
    
    // Store event in Redis for monitoring
    this.redis.lpush('orchestrator_events', JSON.stringify(event));
    this.redis.ltrim('orchestrator_events', 0, 999); // Keep last 1000 events
  }

  private async handleAgentDisconnected(agentId: string): Promise<void> {
    await this.reassignAgentTasks(agentId);
  }
}

/**
 * Circuit Breaker for agent reliability
 */
class CircuitBreaker {
  private readonly errorThreshold: number;
  private readonly timeoutMs: number;
  private readonly resetTimeoutMs: number;
  private errorCount: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastErrorTime: number = 0;

  constructor(config: { errorThreshold: number; timeoutMs: number; resetTimeoutMs: number }) {
    this.errorThreshold = config.errorThreshold;
    this.timeoutMs = config.timeoutMs;
    this.resetTimeoutMs = config.resetTimeoutMs;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastErrorTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.timeoutMs)
        )
      ]);

      if (this.state === 'half-open') {
        this.state = 'closed';
        this.errorCount = 0;
      }

      return result;
    } catch (error) {
      this.errorCount++;
      this.lastErrorTime = Date.now();

      if (this.errorCount >= this.errorThreshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }
}