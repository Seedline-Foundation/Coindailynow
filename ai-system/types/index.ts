/**
 * AI System Core Types
 * Defines the foundational types for the AI agent orchestration system
 */

// Agent Types and Interfaces
export enum AgentType {
  CONTENT_GENERATION = 'content_generation',
  MARKET_ANALYSIS = 'market_analysis',
  QUALITY_REVIEW = 'quality_review',
  TRANSLATION = 'translation',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  MODERATION = 'moderation'
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

export enum TaskStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY = 'retry'
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Core Task Interface
export interface AITask {
  id: string;
  type: AgentType;
  priority: TaskPriority;
  status: TaskStatus;
  payload: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    assignedAgent?: string | undefined;
    retryCount: number;
    maxRetries: number;
    timeoutMs?: number;
    dependencies?: string[];
  };
  result?: {
    data?: any;
    error?: string;
    metrics?: TaskMetrics;
  };
}

// Agent Interface
export interface AIAgent {
  id: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  config: AgentConfig;
  metrics: AgentMetrics;
  lastHeartbeat: Date;
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  healthCheckInterval: number;
  [key: string]: any; // Agent-specific config
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelayMs: number;
  maxDelayMs: number;
}

// Metrics and Monitoring
export interface TaskMetrics {
  startTime: Date;
  endTime?: Date;
  processingTimeMs?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  customMetrics?: Record<string, number>;
}

export interface AgentMetrics {
  tasksProcessed: number;
  tasksSuccessful: number;
  tasksFailed: number;
  averageProcessingTime: number;
  uptime: number;
  lastError?: {
    message: string;
    timestamp: Date;
    taskId?: string;
  };
}

// Communication Protocols
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  payload: any;
  timestamp: Date;
  correlationId?: string;
}

export enum MessageType {
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_UPDATE = 'task_update',
  TASK_COMPLETE = 'task_complete',
  TASK_FAILED = 'task_failed',
  HEARTBEAT = 'heartbeat',
  HEALTH_CHECK = 'health_check',
  SHUTDOWN = 'shutdown'
}

// Queue Configuration
export interface QueueConfig {
  name: string;
  maxSize: number;
  processTimeout: number;
  retryPolicy: RetryPolicy;
  priorityLevels: TaskPriority[];
  deadLetterQueue: boolean;
}

// Orchestrator Configuration
export interface OrchestratorConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  agents: {
    [key in AgentType]: {
      minInstances: number;
      maxInstances: number;
      autoScaling: boolean;
      config: Partial<AgentConfig>;
    };
  };
  queues: {
    [key in AgentType]: QueueConfig;
  };
  monitoring: {
    metricsInterval: number;
    alertThresholds: {
      queueSize: number;
      errorRate: number;
      responseTime: number;
    };
  };
  performance: {
    maxResponseTimeMs: number;
    maxConcurrentTasks: number;
    enableCircuitBreaker: boolean;
  };
}

// Events
export interface OrchestratorEvent {
  type: OrchestratorEventType;
  timestamp: Date;
  data: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export enum OrchestratorEventType {
  AGENT_REGISTERED = 'agent_registered',
  AGENT_DISCONNECTED = 'agent_disconnected',
  AGENT_HEALTH_CHANGED = 'agent_health_changed',
  TASK_QUEUED = 'task_queued',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  QUEUE_OVERFLOW = 'queue_overflow',
  PERFORMANCE_THRESHOLD_EXCEEDED = 'performance_threshold_exceeded'
}

// African Market Specific Types
export interface AfricanMarketContext {
  region: 'west' | 'east' | 'north' | 'south' | 'central';
  countries: string[];
  languages: string[];
  exchanges: string[];
  mobileMoneyProviders: string[];
  timezone: string;
  culturalContext?: Record<string, any>;
}

export interface ContentGenerationTask extends AITask {
  payload: {
    topic: string;
    targetLanguages: string[];
    africanContext: AfricanMarketContext;
    contentType: 'article' | 'summary' | 'social_post' | 'newsletter';
    keywords: string[];
    sources?: string[];
  };
}

export interface MarketAnalysisTask extends AITask {
  payload: {
    symbols: string[];
    exchanges: string[];
    analysisType: 'memecoin_surge' | 'whale_tracking' | 'sentiment' | 'correlation';
    timeRange: {
      start: Date;
      end: Date;
    };
    africanContext: AfricanMarketContext;
  };
}

export interface QualityReviewTask extends AITask {
  payload: {
    contentId: string;
    content: string;
    contentType: string;
    reviewCriteria: string[];
    africanContext: AfricanMarketContext;
    requiresFactCheck: boolean;
  };
}