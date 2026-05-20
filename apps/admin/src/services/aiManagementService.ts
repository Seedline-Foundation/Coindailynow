/**
 * AI Management Service (admin-local copy — avoids cross-app webpack resolution).
 */
import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from '@/lib/auth';

export type AIAgentType =
  | 'content_generation'
  | 'image_generation'
  | 'translation'
  | 'market_analysis'
  | 'review'
  | 'moderation'
  | 'analysis'
  | 'data'
  | 'research'
  | 'content'
  | 'engineering'
  | 'business'
  | 'finance'
  | 'legal';

export type AIAgentCategory =
  | 'analysis'
  | 'data'
  | 'research'
  | 'content'
  | 'engineering'
  | 'business'
  | 'finance'
  | 'legal';

export interface AIAgent {
  id: string;
  name: string;
  type: AIAgentType;
  category?: AIAgentCategory;
  status: 'active' | 'idle' | 'error' | 'disabled';
  description: string;
  capabilities: string[];
  model?: string;
  configuration: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };
  metrics: {
    tasksProcessed: number;
    tasksInQueue: number;
    successRate: number;
    avgProcessingTime: number;
    avgCost: number;
    errorCount: number;
    lastTaskAt?: string;
  };
  health: {
    score: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues?: string[];
  };
  currentTask?: AITask | null;
  queuedTasks?: AITask[];
  completedTasks?: AITask[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AITask {
  id: string;
  agentType: string;
  agentId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  inputData: unknown;
  outputData?: unknown;
  error?: string;
  metrics?: {
    processingTime: number;
    cost: number;
    tokensUsed?: number;
    qualityScore?: number;
  };
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface ContentWorkflow {
  id: string;
  articleId?: string;
  status: 'in_progress' | 'pending_review' | 'completed' | 'failed' | 'paused';
  currentStage:
    | 'research'
    | 'content_review'
    | 'writing'
    | 'final_review'
    | 'translation'
    | 'translation_review'
    | 'human_approval';
  stages: {
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    taskId?: string;
    qualityScore?: number;
    completedAt?: string;
    error?: string;
  }[];
  researchTaskId?: string;
  contentTaskId?: string;
  translationTaskId?: string;
  qualityScores?: {
    research?: number;
    content?: number;
    translation?: number;
    overall?: number;
  };
  humanReviewNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AnalyticsOverview {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksInQueue: number;
  avgSuccessRate: number;
  avgProcessingTime: number;
  totalCost: number;
  cacheHitRate: number;
  systemHealth: {
    score: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues?: string[];
  };
}

export interface AgentAnalytics {
  agentId: string;
  agentName: string;
  agentType: string;
  period: { start: string; end: string };
  metrics: {
    tasksProcessed: number;
    successRate: number;
    avgProcessingTime: number;
    avgCost: number;
    totalCost: number;
    errorRate: number;
  };
  trends: {
    timestamp: string;
    tasksProcessed: number;
    successRate: number;
    avgProcessingTime: number;
    cost: number;
  }[];
  topErrors?: { error: string; count: number }[];
}

export interface CostBreakdown {
  period: { start: string; end: string };
  totalCost: number;
  byAgent: {
    agentId: string;
    agentName: string;
    agentType: string;
    cost: number;
    percentage: number;
  }[];
  byDay: { date: string; cost: number; tasksProcessed: number }[];
  budget?: { daily?: number; weekly?: number; monthly?: number };
  projectedCost: number;
}

export interface PerformanceTrends {
  period: { start: string; end: string };
  successRate: {
    data: { timestamp: string; value: number }[];
    avg: number;
    trend: 'up' | 'down' | 'stable';
  };
  processingTime: {
    data: { timestamp: string; value: number }[];
    avg: number;
    trend: 'up' | 'down' | 'stable';
  };
  cost: {
    data: { timestamp: string; value: number }[];
    total: number;
    trend: 'up' | 'down' | 'stable';
  };
  taskVolume: {
    data: { timestamp: string; value: number }[];
    total: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface OptimizationRecommendation {
  id: string;
  type: 'cost' | 'performance' | 'quality' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  estimatedSavings?: { cost?: number; time?: number };
  createdAt: string;
}

export interface TaskQueueStatus {
  total: number;
  byPriority: { urgent: number; high: number; normal: number; low: number };
  byStatus: { queued: number; processing: number };
  byAgent: { agentType: string; count: number }[];
  avgWaitTime: number;
  oldestTask?: { id: string; age: number };
}

export interface TaskListResponse {
  tasks: AITask[];
  total: number;
  totalPages?: number;
  page?: number;
}

function normalizeTaskListResponse(data: {
  tasks?: AITask[];
  total?: number;
  totalPages?: number;
  page?: number;
}): TaskListResponse {
  const tasks = data.tasks ?? [];
  return {
    tasks,
    total: data.total ?? tasks.length,
    totalPages: data.totalPages,
    page: data.page,
  };
}

class AIManagementService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.api.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getAgents(filter?: { status?: string; type?: string }): Promise<AIAgent[]> {
    const response = await this.api.get('/api/ai/agents', { params: filter });
    return response.data.agents || [];
  }

  async toggleAgent(agentId: string, isActive: boolean): Promise<AIAgent> {
    const response = await this.api.put(`/api/ai/agents/${agentId}`, { isActive });
    return response.data.agent;
  }

  async resetAgent(agentId: string): Promise<void> {
    await this.api.post(`/api/ai/agents/${agentId}/reset`);
  }

  async getTasks(params?: Record<string, unknown>): Promise<TaskListResponse> {
    const response = await this.api.get('/api/ai/tasks', { params });
    return normalizeTaskListResponse(response.data);
  }

  async cancelTask(taskId: string): Promise<AITask> {
    const response = await this.api.put(`/api/ai/tasks/${taskId}/cancel`);
    return response.data.task;
  }

  async retryTask(taskId: string): Promise<AITask> {
    const response = await this.api.get(`/api/ai/tasks/${taskId}/retry`);
    return response.data.task;
  }

  async batchCancelTasks(taskIds: string[]): Promise<void> {
    await Promise.all(taskIds.map((id) => this.cancelTask(id)));
  }

  async batchRetryTasks(taskIds: string[]): Promise<void> {
    await Promise.all(taskIds.map((id) => this.retryTask(id)));
  }

  async getTaskQueueStatus(): Promise<TaskQueueStatus> {
    const response = await this.api.get('/api/ai/tasks/queue/status');
    return response.data;
  }

  async getWorkflows(params?: Record<string, unknown>) {
    const response = await this.api.get('/api/ai/workflows', { params });
    return response.data;
  }

  async pauseWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/pause`);
    return response.data.workflow;
  }

  async resumeWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/resume`);
    return response.data.workflow;
  }

  async rollbackWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.put(`/api/ai/workflows/${workflowId}/rollback`);
    return response.data.workflow;
  }

  async processReviewDecision(
    workflowId: string,
    decision: 'approve' | 'reject' | 'revise',
    feedback?: string,
  ): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/review-decision`, {
      decision,
      feedback,
    });
    return response.data.workflow;
  }

  async getHumanApprovalQueue(): Promise<ContentWorkflow[]> {
    const response = await this.api.get('/api/ai/workflows/queue/human-approval');
    return response.data.workflows || [];
  }

  async getApprovalQueue(params?: Record<string, unknown>) {
    const response = await this.api.get('/api/ai/approval/queue', { params });
    return response.data;
  }

  async getContentReviewDetails(workflowId: string): Promise<unknown> {
    const response = await this.api.get(`/api/ai/approval/${workflowId}`);
    return response.data;
  }

  async approveContent(workflowId: string, data: { notes?: string; qualityScore?: number }) {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/approve`, data);
    return response.data;
  }

  async rejectContent(workflowId: string, data: { reason: string; feedback?: string }) {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/reject`, data);
    return response.data;
  }

  async requestRevision(
    workflowId: string,
    data: { feedback: string; requiredChanges: string[]; priority?: string },
  ) {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/request-revision`, data);
    return response.data;
  }

  async processBatchApproval(data: {
    workflowIds: string[];
    action: 'approve' | 'reject';
    notes?: string;
    reason?: string;
  }) {
    const response = await this.api.post('/api/ai/approval/batch', data);
    return response.data;
  }

  async getAnalyticsOverview(dateRange?: { start: string; end: string }): Promise<AnalyticsOverview> {
    const response = await this.api.get('/api/ai/analytics/overview', { params: dateRange });
    return response.data;
  }

  async getAgentAnalytics(agentId: string, dateRange?: { start: string; end: string }) {
    const response = await this.api.get(`/api/ai/analytics/agents/${agentId}`, { params: dateRange });
    return response.data;
  }

  async getCostBreakdown(dateRange?: { start: string; end: string }): Promise<CostBreakdown> {
    const response = await this.api.get('/api/ai/analytics/costs', { params: dateRange });
    return response.data;
  }

  async getPerformanceTrends(dateRange?: { start: string; end: string }): Promise<PerformanceTrends> {
    const response = await this.api.get('/api/ai/analytics/performance', { params: dateRange });
    return response.data;
  }

  async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const response = await this.api.get('/api/ai/analytics/recommendations');
    return response.data.recommendations || [];
  }

  async getAllRegistryAgents(filter?: { category?: string; status?: string }): Promise<AIAgent[]> {
    try {
      const response = await this.api.get('/api/ai/registry/agents', { params: filter });
      return response.data.agents || [];
    } catch {
      return this.getAgents(filter ? { type: filter.category, status: filter.status } : undefined);
    }
  }

  async getRunningTasks(): Promise<AITask[]> {
    try {
      const response = await this.api.get('/api/ai/registry/tasks/running');
      return response.data.tasks || [];
    } catch {
      const data = await this.getTasks({ status: 'processing', limit: 100 });
      return data.tasks;
    }
  }

  async getCompletedTasksList(params?: Record<string, unknown>): Promise<TaskListResponse> {
    try {
      const response = await this.api.get('/api/ai/registry/tasks/completed', { params });
      return normalizeTaskListResponse(response.data);
    } catch {
      return this.getTasks({ status: 'completed', ...params });
    }
  }

  async getTaskHistory(params?: Record<string, unknown>): Promise<TaskListResponse> {
    try {
      const response = await this.api.get('/api/ai/registry/tasks/history', { params });
      return normalizeTaskListResponse(response.data);
    } catch {
      return this.getTasks(params);
    }
  }

  async getAgentRunningTasks(agentId: string): Promise<AITask[]> {
    try {
      const response = await this.api.get(`/api/ai/registry/agents/${agentId}/tasks/running`);
      return response.data.tasks || [];
    } catch {
      return [];
    }
  }

  async getAgentCompletedTasks(agentId: string, limit = 50): Promise<AITask[]> {
    try {
      const response = await this.api.get(`/api/ai/registry/agents/${agentId}/tasks/completed`, {
        params: { limit },
      });
      return response.data.tasks || [];
    } catch {
      return [];
    }
  }

  async getAgentTaskHistory(
    agentId: string,
    params?: { limit?: number; page?: number },
  ): Promise<TaskListResponse> {
    try {
      const response = await this.api.get(`/api/ai/registry/agents/${agentId}/tasks/history`, {
        params,
      });
      return normalizeTaskListResponse(response.data);
    } catch {
      return { tasks: [], total: 0 };
    }
  }
}

export const aiManagementService = new AIManagementService();
export default AIManagementService;
