/**
 * AI Management Service
 * Handles all API calls for AI agents, tasks, workflows, and analytics
 * 
 * Backend Integration:
 * - /api/ai/agents - AI agent management
 * - /api/ai/tasks - Task management
 * - /api/ai/workflows - Workflow orchestration
 * - /api/ai/analytics - Performance analytics
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AIAgent {
  id: string;
  name: string;
  type: 'content_generation' | 'image_generation' | 'translation' | 'market_analysis' | 'review' | 'moderation';
  status: 'active' | 'idle' | 'error' | 'disabled';
  description: string;
  capabilities: string[];
  configuration: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
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
  inputData: any;
  outputData?: any;
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
  currentStage: 'research' | 'content_review' | 'writing' | 'final_review' | 'translation' | 'translation_review' | 'human_approval';
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
  period: {
    start: string;
    end: string;
  };
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
  topErrors?: {
    error: string;
    count: number;
  }[];
}

export interface CostBreakdown {
  period: {
    start: string;
    end: string;
  };
  totalCost: number;
  byAgent: {
    agentId: string;
    agentName: string;
    agentType: string;
    cost: number;
    percentage: number;
  }[];
  byDay: {
    date: string;
    cost: number;
    tasksProcessed: number;
  }[];
  budget?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  projectedCost: number;
}

export interface PerformanceTrends {
  period: {
    start: string;
    end: string;
  };
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
  estimatedSavings?: {
    cost?: number;
    time?: number;
  };
  createdAt: string;
}

export interface TaskQueueStatus {
  total: number;
  byPriority: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  byStatus: {
    queued: number;
    processing: number;
  };
  byAgent: {
    agentType: string;
    count: number;
  }[];
  avgWaitTime: number;
  oldestTask?: {
    id: string;
    age: number;
  };
}

// ============================================================================
// AI Management Service Class
// ============================================================================

class AIManagementService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.api.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response error interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('AI Management API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token');
    }
    return null;
  }

  // ============================================================================
  // AI Agents
  // ============================================================================

  /**
   * Get all AI agents
   */
  async getAgents(filter?: { status?: string; type?: string }): Promise<AIAgent[]> {
    const response = await this.api.get('/api/ai/agents', { params: filter });
    return response.data.agents || [];
  }

  /**
   * Get single agent details
   */
  async getAgent(agentId: string): Promise<AIAgent> {
    const response = await this.api.get(`/api/ai/agents/${agentId}`);
    return response.data.agent;
  }

  /**
   * Update agent configuration
   */
  async updateAgentConfig(agentId: string, config: any): Promise<AIAgent> {
    const response = await this.api.put(`/api/ai/agents/${agentId}`, { configuration: config });
    return response.data.agent;
  }

  /**
   * Toggle agent active status
   */
  async toggleAgent(agentId: string, isActive: boolean): Promise<AIAgent> {
    const response = await this.api.put(`/api/ai/agents/${agentId}`, { isActive });
    return response.data.agent;
  }

  /**
   * Reset agent state
   */
  async resetAgent(agentId: string): Promise<void> {
    await this.api.post(`/api/ai/agents/${agentId}/reset`);
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(agentId: string, dateRange?: { start: string; end: string }): Promise<any> {
    const response = await this.api.get(`/api/ai/agents/${agentId}/metrics`, {
      params: dateRange,
    });
    return response.data.metrics;
  }

  // ============================================================================
  // AI Tasks
  // ============================================================================

  /**
   * Get all tasks with filtering and pagination
   */
  async getTasks(params?: {
    status?: string;
    priority?: string;
    agentType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: AITask[]; total: number; page: number; totalPages: number }> {
    const response = await this.api.get('/api/ai/tasks', { params });
    return response.data;
  }

  /**
   * Get single task details
   */
  async getTask(taskId: string): Promise<AITask> {
    const response = await this.api.get(`/api/ai/tasks/${taskId}`);
    return response.data.task;
  }

  /**
   * Create new task
   */
  async createTask(taskData: {
    agentType: string;
    priority: string;
    inputData: any;
  }): Promise<AITask> {
    const response = await this.api.post('/api/ai/tasks', taskData);
    return response.data.task;
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<AITask> {
    const response = await this.api.put(`/api/ai/tasks/${taskId}/cancel`);
    return response.data.task;
  }

  /**
   * Retry failed task
   */
  async retryTask(taskId: string): Promise<AITask> {
    const response = await this.api.get(`/api/ai/tasks/${taskId}/retry`);
    return response.data.task;
  }

  /**
   * Get task queue status
   */
  async getTaskQueueStatus(): Promise<TaskQueueStatus> {
    const response = await this.api.get('/api/ai/tasks/queue/status');
    return response.data;
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(filter?: {
    agentType?: string;
    status?: string;
    dateRange?: { start: string; end: string };
  }): Promise<any> {
    const response = await this.api.get('/api/ai/tasks/statistics/summary', {
      params: filter,
    });
    return response.data;
  }

  /**
   * Batch cancel tasks
   */
  async batchCancelTasks(taskIds: string[]): Promise<void> {
    await Promise.all(taskIds.map((id) => this.cancelTask(id)));
  }

  /**
   * Batch retry tasks
   */
  async batchRetryTasks(taskIds: string[]): Promise<void> {
    await Promise.all(taskIds.map((id) => this.retryTask(id)));
  }

  // ============================================================================
  // Workflows
  // ============================================================================

  /**
   * Get all workflows
   */
  async getWorkflows(params?: {
    status?: string;
    stage?: string;
    page?: number;
    limit?: number;
  }): Promise<{ workflows: ContentWorkflow[]; total: number }> {
    const response = await this.api.get('/api/ai/workflows', { params });
    return response.data;
  }

  /**
   * Get single workflow
   */
  async getWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.get(`/api/ai/workflows/${workflowId}`);
    return response.data.workflow;
  }

  /**
   * Create new workflow
   */
  async createWorkflow(data: { articleId?: string; initialData?: any }): Promise<ContentWorkflow> {
    const response = await this.api.post('/api/ai/workflows', data);
    return response.data.workflow;
  }

  /**
   * Advance workflow to next stage
   */
  async advanceWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.put(`/api/ai/workflows/${workflowId}/advance`);
    return response.data.workflow;
  }

  /**
   * Rollback workflow to previous stage
   */
  async rollbackWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.put(`/api/ai/workflows/${workflowId}/rollback`);
    return response.data.workflow;
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/pause`);
    return response.data.workflow;
  }

  /**
   * Resume workflow
   */
  async resumeWorkflow(workflowId: string): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/resume`);
    return response.data.workflow;
  }

  /**
   * Submit workflow for human review
   */
  async submitForReview(workflowId: string, notes?: string): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/human-review`, {
      notes,
    });
    return response.data.workflow;
  }

  /**
   * Process review decision
   */
  async processReviewDecision(
    workflowId: string,
    decision: 'approve' | 'reject' | 'revise',
    feedback?: string
  ): Promise<ContentWorkflow> {
    const response = await this.api.post(`/api/ai/workflows/${workflowId}/review-decision`, {
      decision,
      feedback,
    });
    return response.data.workflow;
  }

  /**
   * Get human approval queue
   */
  async getHumanApprovalQueue(): Promise<ContentWorkflow[]> {
    const response = await this.api.get('/api/ai/workflows/queue/human-approval');
    return response.data.workflows || [];
  }

  // ============================================================================
  // Human Approval Workflow (Task 6.3)
  // ============================================================================

  /**
   * Get approval queue with filtering
   */
  async getApprovalQueue(params?: {
    priority?: string;
    contentType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number; page: number; totalPages: number }> {
    const response = await this.api.get('/api/ai/approval/queue', { params });
    return response.data;
  }

  /**
   * Get content review details
   */
  async getContentReviewDetails(workflowId: string): Promise<any> {
    const response = await this.api.get(`/api/ai/approval/${workflowId}`);
    return response.data;
  }

  /**
   * Approve content
   */
  async approveContent(workflowId: string, data: {
    notes?: string;
    qualityScore?: number;
  }): Promise<any> {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/approve`, data);
    return response.data;
  }

  /**
   * Reject content
   */
  async rejectContent(workflowId: string, data: {
    reason: string;
    feedback?: string;
  }): Promise<any> {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/reject`, data);
    return response.data;
  }

  /**
   * Request revision
   */
  async requestRevision(workflowId: string, data: {
    feedback: string;
    requiredChanges: string[];
    priority?: string;
  }): Promise<any> {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/request-revision`, data);
    return response.data;
  }

  /**
   * Process batch approval
   */
  async processBatchApproval(data: {
    workflowIds: string[];
    action: 'approve' | 'reject';
    notes?: string;
    reason?: string;
  }): Promise<{ succeeded: string[]; failed: Array<{ workflowId: string; error: string }> }> {
    const response = await this.api.post('/api/ai/approval/batch', data);
    return response.data;
  }

  /**
   * Assign editor to workflow
   */
  async assignEditor(workflowId: string, editorId: string): Promise<any> {
    const response = await this.api.post(`/api/ai/approval/${workflowId}/assign`, { editorId });
    return response.data;
  }

  /**
   * Get available editors
   */
  async getAvailableEditors(): Promise<any[]> {
    const response = await this.api.get('/api/ai/approval/editors');
    return response.data.editors || [];
  }

  /**
   * Get editor metrics
   */
  async getEditorMetrics(editorId: string, dateRange?: { start: string; end: string }): Promise<any> {
    const response = await this.api.get(`/api/ai/approval/editors/${editorId}/metrics`, {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get approval statistics
   */
  async getApprovalStatistics(dateRange?: { start: string; end: string }): Promise<any> {
    const response = await this.api.get('/api/ai/approval/stats', {
      params: dateRange,
    });
    return response.data;
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get system-wide analytics overview
   */
  async getAnalyticsOverview(dateRange?: { start: string; end: string }): Promise<AnalyticsOverview> {
    const response = await this.api.get('/api/ai/analytics/overview', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get per-agent analytics
   */
  async getAgentAnalytics(
    agentId: string,
    dateRange?: { start: string; end: string }
  ): Promise<AgentAnalytics> {
    const response = await this.api.get(`/api/ai/analytics/agents/${agentId}`, {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get cost breakdown
   */
  async getCostBreakdown(dateRange?: { start: string; end: string }): Promise<CostBreakdown> {
    const response = await this.api.get('/api/ai/analytics/costs', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(dateRange?: { start: string; end: string }): Promise<PerformanceTrends> {
    const response = await this.api.get('/api/ai/analytics/performance', {
      params: dateRange,
    });
    return response.data;
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const response = await this.api.get('/api/ai/analytics/recommendations');
    return response.data.recommendations || [];
  }

  /**
   * Set budget configuration
   */
  async setBudgetConfig(config: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  }): Promise<void> {
    await this.api.post('/api/ai/analytics/budget', config);
  }

  /**
   * Get budget configuration
   */
  async getBudgetConfig(): Promise<{ daily?: number; weekly?: number; monthly?: number }> {
    const response = await this.api.get('/api/ai/analytics/budget');
    return response.data.budget;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; uptime: number }> {
    const response = await this.api.get('/api/ai/analytics/health');
    return response.data;
  }
}

// Export singleton instance
export const aiManagementService = new AIManagementService();

// Export service class for testing
export default AIManagementService;
