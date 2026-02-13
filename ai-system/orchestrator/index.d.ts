import { Logger } from './dependencies';
import { EventEmitter } from 'events';
import { AITask, AIAgent, AgentType, TaskStatus, OrchestratorConfig, TaskMetrics, AgentMetrics } from '../types';
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
export declare class AIAgentOrchestrator extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly redis;
    private readonly agents;
    private readonly tasks;
    private readonly queues;
    private readonly deadLetterQueues;
    private readonly activeAssignments;
    private readonly circuitBreakers;
    private running;
    private healthCheckInterval?;
    private metricsInterval?;
    constructor(config: OrchestratorConfig, logger: Logger);
    start(): Promise<void>;
    shutdown(): Promise<void>;
    isRunning(): boolean;
    registerAgent(agent: AIAgent): Promise<boolean>;
    unregisterAgent(agentId: string): Promise<boolean>;
    getAgent(agentId: string): Promise<AIAgent | null>;
    updateAgentHeartbeat(agentId: string, timestamp: Date): Promise<void>;
    getOfflineAgents(): Promise<AIAgent[]>;
    queueTask(task: AITask): Promise<boolean>;
    getTask(taskId: string): Promise<AITask | null>;
    getNextTask(agentType: AgentType): Promise<AITask | null>;
    assignTask(agentType: AgentType): Promise<TaskAssignment | null>;
    updateTaskStatus(taskId: string, status: TaskStatus, result?: {
        data?: any;
        error?: string;
        metrics?: TaskMetrics;
    }): Promise<boolean>;
    getDeadLetterTasks(agentType: AgentType): Promise<AITask[]>;
    getAgentMetrics(agentId: string): Promise<AgentMetrics | null>;
    getQueueMetrics(agentType: AgentType): Promise<QueueMetrics>;
    getSystemMetrics(): Promise<SystemMetrics>;
    triggerAlert(message: string, severity: 'warning' | 'error' | 'critical', data?: any): Promise<void>;
    private setupEventHandlers;
    private validateTask;
    private insertTaskByPriority;
    private findAvailableAgent;
    private isAgentHealthy;
    private handleStatusChange;
    private handleTaskCompleted;
    private handleTaskFailed;
    private calculateRetryDelay;
    private reassignAgentTasks;
    private performHealthChecks;
    private collectMetrics;
    private checkAlertThresholds;
    private sendMessage;
    private broadcastMessage;
    private emitEvent;
    private handleAgentDisconnected;
}
//# sourceMappingURL=index.d.ts.map