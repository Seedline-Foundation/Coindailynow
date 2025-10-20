// AI Management Console - Phase 4 Core Implementation
// Real-time monitoring, human approval workflows, and agent configuration management
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAuditLog, AuditActions } from '../../lib/audit';

export interface AIAgentStatus {
  id: string;
  name: string;
  type: 'analysis' | 'content' | 'visual' | 'social';
  status: 'active' | 'idle' | 'error' | 'maintenance';
  lastActive: Date;
  tasksProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  currentLoad: number;
  capabilities: string[];
  configuration: Record<string, unknown>;
  healthScore: number;
  errorCount: number;
  lastError?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  erroredAgents: number;
  totalTasksInQueue: number;
  averageWaitTime: number;
  systemThroughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  costPerTask: number;
  totalCostToday: number;
}

export interface ContentApprovalItem {
  id: string;
  type: 'article' | 'translation' | 'image' | 'social_post';
  title: string;
  content: string;
  generatedBy: string;
  generatedAt: Date;
  confidenceScore: number;
  qualityScore: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  assignedReviewer?: string;
  reviewNotes?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  metadata: Record<string, unknown>;
  aiAnalysis: {
    sentiment: number;
    readability: number;
    factuality: number;
    relevance: number;
    seoScore: number;
  };
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: unknown;
  }>;
  actions: Array<{
    type: 'auto_approve' | 'assign_reviewer' | 'set_priority' | 'send_notification' | 'reject';
    parameters: Record<string, unknown>;
  }>;
  createdAt: Date;
  lastModified: Date;
  executionCount: number;
}

export interface AgentConfiguration {
  agentId: string;
  parameters: Record<string, unknown>;
  modelSettings: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  capabilities: string[];
  limits: {
    maxTasksPerHour?: number;
    maxConcurrentTasks?: number;
    timeoutSeconds?: number;
  };
  fallbackStrategy: 'retry' | 'escalate' | 'skip';
  qualityThresholds: {
    minimumConfidence?: number;
    minimumQuality?: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'error_rate_high' | 'response_time_slow' | 'queue_backlog' | 'agent_down' | 'cost_threshold';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  affectedAgents: string[];
}

export class AIManagementConsole {
  private isInitialized = false;
  private realtimeMonitoringActive = false;
  private agents: Map<string, AIAgentStatus> = new Map();
  private systemMetricsHistory: SystemMetrics[] = [];
  private approvalQueue: ContentApprovalItem[] = [];
  private workflowRules: WorkflowRule[] = [];
  private agentConfigurations: Map<string, AgentConfiguration> = new Map();
  private performanceAlerts: PerformanceAlert[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {}

  async initialize(): Promise<void> {
    console.log('🚀 Initializing AI Management Console...');

    try {
      // Initialize default configurations
      await this.loadAgentConfigurations();
      await this.loadWorkflowRules();
      await this.registerSystemAgents();
      
      this.isInitialized = true;

      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'ai_management_console',
        resourceId: 'system_initialization',
        details: {
          initialized: true,
          agentsRegistered: this.agents.size,
          workflowRules: this.workflowRules.length,
          configurations: this.agentConfigurations.size,
          capabilities: [
            'real_time_monitoring',
            'human_approval_workflows',
            'agent_configuration_management',
            'performance_analytics',
            'automated_quality_control',
            'predictive_alerts'
          ]
        }
      });

      console.log('✅ AI Management Console initialized successfully');
      console.log(`📊 Monitoring ${this.agents.size} agents with ${this.workflowRules.length} workflow rules`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'ai_management_console',
        resourceId: 'initialization_error',
        details: { error: errorMessage, initialized: false }
      });

      throw new Error(`AI Management Console initialization failed: ${errorMessage}`);
    }
  }

  async startRealtimeMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.realtimeMonitoringActive) {
      console.log('⚠️ Real-time monitoring already active');
      return;
    }

    console.log('📡 Starting real-time AI system monitoring...');

    this.realtimeMonitoringActive = true;

    // Start monitoring loop - runs every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.checkAgentHealth();
        await this.processApprovalQueue();
        await this.detectPerformanceIssues();
        await this.cleanupOldData();
      } catch (error) {
        console.error('❌ Monitoring cycle error:', error);
      }
    }, 30000);

    // Initial metrics collection
    await this.collectSystemMetrics();

    console.log('✅ Real-time monitoring started');
  }

  async stopRealtimeMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.realtimeMonitoringActive = false;
    console.log('🛑 Real-time monitoring stopped');
  }

  async getDashboardData(): Promise<{
    systemStatus: 'healthy' | 'warning' | 'critical';
    agents: AIAgentStatus[];
    metrics: SystemMetrics;
    pendingApprovals: ContentApprovalItem[];
    recentAlerts: PerformanceAlert[];
    performance: {
      tasksProcessedToday: number;
      averageProcessingTime: number;
      successRate: number;
      costEfficiency: number;
    };
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const latestMetrics = this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
    const recentAlerts = this.performanceAlerts
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    // Calculate system status
    const systemStatus = this.calculateSystemStatus(latestMetrics, recentAlerts);

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics();

    return {
      systemStatus,
      agents: Array.from(this.agents.values()),
      metrics: latestMetrics || this.createEmptyMetrics(),
      pendingApprovals: this.approvalQueue.filter(item => item.status === 'pending'),
      recentAlerts,
      performance
    };
  }

  async submitForApproval(content: Omit<ContentApprovalItem, 'id' | 'generatedAt' | 'status'>): Promise<string> {
    const approvalItem: ContentApprovalItem = {
      ...content,
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date(),
      status: 'pending'
    };

    // Apply workflow rules
    await this.applyWorkflowRules(approvalItem);

    this.approvalQueue.push(approvalItem);

    await createAuditLog({
      action: AuditActions.ARTICLE_CREATE,
      resource: 'content_approval',
      resourceId: approvalItem.id,
      details: {
        type: approvalItem.type,
        generatedBy: approvalItem.generatedBy,
        confidenceScore: approvalItem.confidenceScore,
        qualityScore: approvalItem.qualityScore,
        priority: approvalItem.priority,
        autoProcessed: approvalItem.status !== 'pending'
      }
    });

    console.log(`📝 Content submitted for approval: ${approvalItem.title} (ID: ${approvalItem.id})`);
    return approvalItem.id;
  }

  async processApprovalDecision(
    contentId: string, 
    decision: 'approve' | 'reject' | 'needs_revision',
    reviewerNotes?: string
  ): Promise<void> {
    const item = this.approvalQueue.find(item => item.id === contentId);
    if (!item) {
      throw new Error(`Content item not found: ${contentId}`);
    }

    item.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'needs_revision';
    if (reviewerNotes) {
      item.reviewNotes = reviewerNotes;
    }

    await createAuditLog({
      action: decision === 'approve' ? AuditActions.ARTICLE_PUBLISH : AuditActions.ARTICLE_DELETE,
      resource: 'content_approval',
      resourceId: contentId,
      details: {
        decision,
        reviewerNotes,
        originalConfidence: item.confidenceScore,
        originalQuality: item.qualityScore
      }
    });

    console.log(`✅ Approval decision processed: ${decision} for ${item.title}`);
  }

  async updateAgentConfiguration(agentId: string, config: Partial<AgentConfiguration>): Promise<void> {
    const existingConfig = this.agentConfigurations.get(agentId);
    const updatedConfig: AgentConfiguration = {
      ...existingConfig,
      ...config,
      agentId
    } as AgentConfiguration;

    this.agentConfigurations.set(agentId, updatedConfig);

    // Update agent status if it's registered
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.configuration = updatedConfig.parameters;
      agent.capabilities = updatedConfig.capabilities;
    }

    await createAuditLog({
      action: AuditActions.SETTINGS_UPDATE,
      resource: 'agent_configuration',
      resourceId: agentId,
      details: {
        configurationUpdate: config,
        previousConfig: existingConfig
      }
    });

    console.log(`⚙️ Agent configuration updated: ${agentId}`);
  }

  async getPerformanceAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    trends: {
      throughput: number[];
      errorRate: number[];
      responseTime: number[];
      cost: number[];
    };
    topPerformingAgents: AIAgentStatus[];
    bottlenecks: string[];
    recommendations: string[];
    costOptimization: {
      currentCost: number;
      projectedSavings: number;
      recommendations: string[];
    };
  }> {
    const cutoffTime = this.getTimeRangeCutoff(timeRange);
    const metricsInRange = this.systemMetricsHistory.filter(m => m.timestamp >= cutoffTime);

    const trends = {
      throughput: metricsInRange.map(m => m.systemThroughput),
      errorRate: metricsInRange.map(m => m.errorRate),
      responseTime: metricsInRange.map(m => m.averageWaitTime),
      cost: metricsInRange.map(m => m.totalCostToday)
    };

    const topPerformingAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'active')
      .sort((a, b) => (b.successRate * b.healthScore) - (a.successRate * a.healthScore))
      .slice(0, 5);

    const bottlenecks = this.identifyBottlenecks(metricsInRange);
    const recommendations = this.generateOptimizationRecommendations(metricsInRange, bottlenecks);
    const costOptimization = this.calculateCostOptimization(metricsInRange);

    return {
      trends,
      topPerformingAgents,
      bottlenecks,
      recommendations,
      costOptimization
    };
  }

  // Private helper methods

  private async loadAgentConfigurations(): Promise<void> {
    // Load default configurations for each agent type
    const defaultConfigs: AgentConfiguration[] = [
      {
        agentId: 'market-analysis',
        parameters: { sensitivity: 0.8, timeframe: '1h' },
        modelSettings: { temperature: 0.3, maxTokens: 2000 },
        capabilities: ['trend_analysis', 'sentiment_analysis', 'market_prediction'],
        limits: { maxTasksPerHour: 100, maxConcurrentTasks: 5, timeoutSeconds: 30 },
        fallbackStrategy: 'retry',
        qualityThresholds: { minimumConfidence: 0.7, minimumQuality: 0.8 }
      },
      {
        agentId: 'content-writer',
        parameters: { creativity: 0.7, length: 'medium', tone: 'professional' },
        modelSettings: { temperature: 0.8, maxTokens: 3000 },
        capabilities: ['article_writing', 'content_optimization', 'headline_generation'],
        limits: { maxTasksPerHour: 50, maxConcurrentTasks: 3, timeoutSeconds: 60 },
        fallbackStrategy: 'escalate',
        qualityThresholds: { minimumConfidence: 0.8, minimumQuality: 0.85 }
      },
      {
        agentId: 'translator',
        parameters: { formality: 'neutral', preserve_style: true },
        modelSettings: { temperature: 0.2, maxTokens: 4000 },
        capabilities: ['multi_language_translation', 'cultural_adaptation', 'localization'],
        limits: { maxTasksPerHour: 80, maxConcurrentTasks: 4, timeoutSeconds: 45 },
        fallbackStrategy: 'retry',
        qualityThresholds: { minimumConfidence: 0.9, minimumQuality: 0.9 }
      }
    ];

    for (const config of defaultConfigs) {
      this.agentConfigurations.set(config.agentId, config);
    }
  }

  private async loadWorkflowRules(): Promise<void> {
    // Load default workflow rules
    this.workflowRules = [
      {
        id: 'auto_approve_high_confidence',
        name: 'Auto-approve High Confidence Content',
        description: 'Automatically approve content with high confidence and quality scores',
        enabled: true,
        conditions: [
          { field: 'confidenceScore', operator: 'greater_than', value: 0.95 },
          { field: 'qualityScore', operator: 'greater_than', value: 0.9 }
        ],
        actions: [
          { type: 'auto_approve', parameters: {} }
        ],
        createdAt: new Date(),
        lastModified: new Date(),
        executionCount: 0
      },
      {
        id: 'priority_breaking_news',
        name: 'Prioritize Breaking News',
        description: 'Set high priority for breaking news content',
        enabled: true,
        conditions: [
          { field: 'type', operator: 'equals', value: 'breaking_news' }
        ],
        actions: [
          { type: 'set_priority', parameters: { priority: 'critical' } },
          { type: 'assign_reviewer', parameters: { reviewer: 'senior_editor' } }
        ],
        createdAt: new Date(),
        lastModified: new Date(),
        executionCount: 0
      },
      {
        id: 'reject_low_quality',
        name: 'Reject Low Quality Content',
        description: 'Automatically reject content with very low quality scores',
        enabled: true,
        conditions: [
          { field: 'qualityScore', operator: 'less_than', value: 0.3 }
        ],
        actions: [
          { type: 'reject', parameters: { reason: 'Quality score below threshold' } }
        ],
        createdAt: new Date(),
        lastModified: new Date(),
        executionCount: 0
      }
    ];
  }

  private async registerSystemAgents(): Promise<void> {
    // Register known AI agents
    const systemAgents: Omit<AIAgentStatus, 'lastActive' | 'tasksProcessed' | 'successRate' | 'averageProcessingTime' | 'currentLoad' | 'healthScore' | 'errorCount'>[] = [
      {
        id: 'market-analysis',
        name: 'Market Analysis Agent',
        type: 'analysis',
        status: 'active',
        capabilities: ['trend_analysis', 'sentiment_analysis', 'market_prediction'],
        configuration: this.agentConfigurations.get('market-analysis')?.parameters || {}
      },
      {
        id: 'advanced-market-analysis',
        name: 'Advanced Market Analysis Agent',
        type: 'analysis',
        status: 'active',
        capabilities: ['crypto_analysis', 'memecoin_tracking', 'whale_detection', 'african_markets'],
        configuration: this.agentConfigurations.get('advanced-market-analysis')?.parameters || {}
      },
      {
        id: 'content-writer',
        name: 'Content Writing Agent',
        type: 'content',
        status: 'active',
        capabilities: ['article_writing', 'content_optimization', 'headline_generation'],
        configuration: this.agentConfigurations.get('content-writer')?.parameters || {}
      },
      {
        id: 'translator',
        name: 'Translation Agent',
        type: 'content',
        status: 'active',
        capabilities: ['multi_language_translation', 'cultural_adaptation', 'localization'],
        configuration: this.agentConfigurations.get('translator')?.parameters || {}
      }
    ];

    for (const agentData of systemAgents) {
      const agent: AIAgentStatus = {
        ...agentData,
        lastActive: new Date(),
        tasksProcessed: 0,
        successRate: 1.0,
        averageProcessingTime: 2000, // 2 seconds default
        currentLoad: 0,
        healthScore: 1.0,
        errorCount: 0
      };

      this.agents.set(agent.id, agent);
    }
  }

  private async collectSystemMetrics(): Promise<void> {
    const now = new Date();
    const activeAgentCount = Array.from(this.agents.values()).filter(a => a.status === 'active').length;
    const idleAgentCount = Array.from(this.agents.values()).filter(a => a.status === 'idle').length;
    const erroredAgentCount = Array.from(this.agents.values()).filter(a => a.status === 'error').length;

    const metrics: SystemMetrics = {
      timestamp: now,
      totalAgents: this.agents.size,
      activeAgents: activeAgentCount,
      idleAgents: idleAgentCount,
      erroredAgents: erroredAgentCount,
      totalTasksInQueue: this.approvalQueue.filter(item => item.status === 'pending').length,
      averageWaitTime: this.calculateAverageWaitTime(),
      systemThroughput: this.calculateSystemThroughput(),
      errorRate: this.calculateErrorRate(),
      cpuUsage: Math.random() * 30 + 40, // Simulated
      memoryUsage: Math.random() * 20 + 60, // Simulated
      networkLatency: Math.random() * 50 + 50, // Simulated
      costPerTask: 0.12, // $0.12 per task average
      totalCostToday: this.calculateTotalCostToday()
    };

    this.systemMetricsHistory.push(metrics);

    // Keep only last 24 hours of metrics
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.systemMetricsHistory = this.systemMetricsHistory.filter(m => m.timestamp >= cutoff);
  }

  private async checkAgentHealth(): Promise<void> {
    for (const agent of this.agents.values()) {
      // Update health score based on performance metrics
      const timeSinceLastActive = Date.now() - agent.lastActive.getTime();
      const healthFactors = {
        uptime: timeSinceLastActive < 300000 ? 1.0 : 0.5, // 5 minutes
        successRate: agent.successRate,
        errorRate: Math.max(0, 1 - (agent.errorCount / Math.max(agent.tasksProcessed, 1))),
        responseTime: agent.averageProcessingTime < 5000 ? 1.0 : 0.7
      };

      agent.healthScore = Object.values(healthFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(healthFactors).length;

      // Update status based on health
      if (agent.healthScore < 0.3) {
        agent.status = 'error';
      } else if (agent.healthScore < 0.7) {
        agent.status = 'idle';
      } else {
        agent.status = 'active';
      }
    }
  }

  private async processApprovalQueue(): Promise<void> {
    // Process items that might need automated handling
    for (const item of this.approvalQueue) {
      if (item.status === 'pending') {
        await this.applyWorkflowRules(item);
      }
    }
  }

  private async applyWorkflowRules(item: ContentApprovalItem): Promise<void> {
    for (const rule of this.workflowRules) {
      if (!rule.enabled) continue;

      // Check if all conditions are met
      const conditionsMet = rule.conditions.every(condition => {
        const itemValue = (item as any)[condition.field];
        const conditionValue = condition.value;
        
        switch (condition.operator) {
          case 'equals': 
            return itemValue === conditionValue;
          case 'greater_than': 
            return typeof itemValue === 'number' && typeof conditionValue === 'number' && itemValue > conditionValue;
          case 'less_than': 
            return typeof itemValue === 'number' && typeof conditionValue === 'number' && itemValue < conditionValue;
          case 'contains': 
            return String(itemValue).includes(String(conditionValue));
          case 'not_contains': 
            return !String(itemValue).includes(String(conditionValue));
          default: 
            return false;
        }
      });

      if (conditionsMet) {
        // Execute actions
        for (const action of rule.actions) {
          await this.executeWorkflowAction(item, action);
        }
        
        rule.executionCount++;
        break; // Only apply first matching rule
      }
    }
  }

  private async executeWorkflowAction(item: ContentApprovalItem, action: { type: string; parameters: Record<string, unknown> }): Promise<void> {
    switch (action.type) {
      case 'auto_approve':
        item.status = 'approved';
        break;
      case 'reject':
        item.status = 'rejected';
        item.reviewNotes = action.parameters.reason as string;
        break;
      case 'set_priority':
        item.priority = action.parameters.priority as 'low' | 'medium' | 'high' | 'critical';
        break;
      case 'assign_reviewer':
        item.assignedReviewer = action.parameters.reviewer as string;
        break;
      case 'send_notification':
        // Would integrate with notification system
        console.log(`📢 Notification: ${action.parameters.message}`);
        break;
    }
  }

  private async detectPerformanceIssues(): Promise<void> {
    const latestMetrics = this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
    if (!latestMetrics) return;

    // Check for various performance issues
    if (latestMetrics.errorRate > 0.05) { // 5% error rate threshold
      this.createAlert('error_rate_high', 'warning', `Error rate is ${(latestMetrics.errorRate * 100).toFixed(1)}%`, {
        errorRate: latestMetrics.errorRate,
        threshold: 0.05
      });
    }

    if (latestMetrics.averageWaitTime > 30000) { // 30 second threshold
      this.createAlert('response_time_slow', 'warning', `Average response time is ${(latestMetrics.averageWaitTime / 1000).toFixed(1)}s`, {
        responseTime: latestMetrics.averageWaitTime,
        threshold: 30000
      });
    }

    if (latestMetrics.totalTasksInQueue > 100) { // Queue backlog threshold
      this.createAlert('queue_backlog', 'error', `Task queue has ${latestMetrics.totalTasksInQueue} pending items`, {
        queueSize: latestMetrics.totalTasksInQueue,
        threshold: 100
      });
    }

    if (latestMetrics.erroredAgents > 0) {
      const erroredAgents = Array.from(this.agents.values()).filter(a => a.status === 'error');
      this.createAlert('agent_down', 'critical', `${latestMetrics.erroredAgents} agents are in error state`, {
        erroredAgents: erroredAgents.map(a => a.id),
        count: latestMetrics.erroredAgents
      });
    }
  }

  private createAlert(type: PerformanceAlert['type'], severity: PerformanceAlert['severity'], message: string, details: Record<string, unknown>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      acknowledged: false,
      affectedAgents: type === 'agent_down' ? details.erroredAgents as string[] : []
    };

    this.performanceAlerts.push(alert);

    // Keep only last 100 alerts
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts = this.performanceAlerts.slice(-100);
    }

    console.log(`🚨 Alert [${severity.toUpperCase()}]: ${message}`);
  }

  private async cleanupOldData(): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Clean up old approval queue items
    this.approvalQueue = this.approvalQueue.filter(item => 
      item.status === 'pending' || item.generatedAt >= oneDayAgo
    );

    // Clean up old alerts
    this.performanceAlerts = this.performanceAlerts.filter(alert =>
      !alert.acknowledged || alert.timestamp >= oneWeekAgo
    );
  }

  // Calculation helper methods
  private calculateAverageWaitTime(): number {
    const pendingItems = this.approvalQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return 0;

    const now = Date.now();
    const totalWaitTime = pendingItems.reduce((sum, item) => sum + (now - item.generatedAt.getTime()), 0);
    return totalWaitTime / pendingItems.length;
  }

  private calculateSystemThroughput(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.systemMetricsHistory.filter(m => m.timestamp >= oneHourAgo);
    
    if (recentMetrics.length === 0) return 0;
    
    const totalTasks = Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.tasksProcessed, 0);
    return totalTasks / Math.max(recentMetrics.length, 1);
  }

  private calculateErrorRate(): number {
    const totalTasks = Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.tasksProcessed, 0);
    const totalErrors = Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.errorCount, 0);
    
    return totalTasks > 0 ? totalErrors / totalTasks : 0;
  }

  private calculateTotalCostToday(): number {
    const tasksToday = Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.tasksProcessed, 0);
    return tasksToday * 0.12; // $0.12 per task
  }

  private calculateSystemStatus(metrics?: SystemMetrics, alerts?: PerformanceAlert[]): 'healthy' | 'warning' | 'critical' {
    if (!metrics) return 'warning';

    const criticalAlerts = alerts?.filter(a => a.severity === 'critical' && !a.acknowledged) || [];
    const warningAlerts = alerts?.filter(a => a.severity === 'warning' && !a.acknowledged) || [];

    if (criticalAlerts.length > 0 || metrics.erroredAgents > 0 || metrics.errorRate > 0.1) {
      return 'critical';
    }

    if (warningAlerts.length > 0 || metrics.errorRate > 0.02 || metrics.averageWaitTime > 15000) {
      return 'warning';
    }

    return 'healthy';
  }

  private calculatePerformanceMetrics() {
    const agents = Array.from(this.agents.values());
    const totalTasks = agents.reduce((sum, agent) => sum + agent.tasksProcessed, 0);
    const avgProcessingTime = agents.reduce((sum, agent) => sum + agent.averageProcessingTime, 0) / Math.max(agents.length, 1);
    const avgSuccessRate = agents.reduce((sum, agent) => sum + agent.successRate, 0) / Math.max(agents.length, 1);
    const totalCost = this.calculateTotalCostToday();

    return {
      tasksProcessedToday: totalTasks,
      averageProcessingTime: avgProcessingTime,
      successRate: avgSuccessRate,
      costEfficiency: totalTasks > 0 ? totalCost / totalTasks : 0
    };
  }

  private createEmptyMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      totalAgents: this.agents.size,
      activeAgents: 0,
      idleAgents: 0,
      erroredAgents: 0,
      totalTasksInQueue: 0,
      averageWaitTime: 0,
      systemThroughput: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      networkLatency: 0,
      costPerTask: 0.12,
      totalCostToday: 0
    };
  }

  private getTimeRangeCutoff(timeRange: string): Date {
    const now = Date.now();
    switch (timeRange) {
      case '1h': return new Date(now - 60 * 60 * 1000);
      case '24h': return new Date(now - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 24 * 60 * 60 * 1000);
    }
  }

  private identifyBottlenecks(metrics: SystemMetrics[]): string[] {
    const bottlenecks: string[] = [];

    if (metrics.some(m => m.averageWaitTime > 10000)) {
      bottlenecks.push('High response times detected in task processing');
    }

    if (metrics.some(m => m.totalTasksInQueue > 50)) {
      bottlenecks.push('Task queue frequently backing up');
    }

    if (metrics.some(m => m.errorRate > 0.03)) {
      bottlenecks.push('Error rate consistently above 3%');
    }

    return bottlenecks;
  }

  private generateOptimizationRecommendations(metrics: SystemMetrics[], bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.some(b => b.includes('response times'))) {
      recommendations.push('Consider scaling up agent instances or optimizing model parameters');
    }

    if (bottlenecks.some(b => b.includes('queue'))) {
      recommendations.push('Implement auto-scaling for agents during peak load periods');
    }

    if (bottlenecks.some(b => b.includes('error rate'))) {
      recommendations.push('Review agent configurations and implement better error handling');
    }

    if (metrics.some(m => m.cpuUsage > 80)) {
      recommendations.push('CPU usage is high - consider horizontal scaling');
    }

    return recommendations;
  }

  private calculateCostOptimization(metrics: SystemMetrics[]) {
    const currentCost = metrics[metrics.length - 1]?.totalCostToday || 0;
    const projectedSavings = currentCost * 0.15; // 15% potential savings

    return {
      currentCost,
      projectedSavings,
      recommendations: [
        'Implement smart agent scheduling to reduce idle time',
        'Optimize model parameters to reduce token usage',
        'Use cached results for repeated similar tasks'
      ]
    };
  }
}

// Export singleton instance
export const aiManagementConsole = new AIManagementConsole();
