// Agent Lifecycle Manager - Handles AI agent registration, assignment, and monitoring
// Optimized for dynamic agent scaling and load balancing

import { AITaskType, AgentCapability, Agent, AgentCapabilityConfig } from '../types/ai-types';

export interface AgentAssignment {
  agent: Agent;
  estimatedProcessingTime: number;
  confidenceScore: number;
}

export class AgentLifecycle {
  private agents = new Map<string, Agent>();
  private isInitialized = false;
  private assignmentHistory = new Map<string, { agentId: string; success: boolean; processingTime: number }>();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Start monitoring process
    this.startAgentMonitoring();
    this.isInitialized = true;
  }

  async registerAgent(capability: AgentCapabilityConfig): Promise<string> {
    const agentId = `${capability.agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const agent: Agent = {
      id: agentId,
      name: `${capability.agentType} Agent`,
      type: capability.agentType,
      status: 'idle',
      currentTasks: [],
      capabilities: [capability.agentType as AgentCapability],
      maxConcurrentTasks: capability.maxConcurrentTasks,
      performance: {
        totalTasks: 0,
        successfulTasks: 0,
        averageResponseTime: capability.averageProcessingTime,
        lastTaskTime: undefined
      },
      lastPing: Date.now(),
      lastActivity: new Date(),
      totalTasksCompleted: 0,
      successRate: capability.successRate
    };

    this.agents.set(agentId, agent);
    return agentId;
  }

  async assignAgent(taskType: AITaskType, priority: 'low' | 'medium' | 'high' | 'critical'): Promise<Agent | null> {
    const availableAgents = this.getAvailableAgentsForTask(taskType);
    
    if (availableAgents.length === 0) {
      return null;
    }

    // Score agents based on performance, availability, and task fit
    const scoredAgents = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, taskType, priority)
    }));

    // Sort by score (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    const selectedAgent = scoredAgents[0].agent;
    
    // Mark agent as busy
    selectedAgent.status = 'busy';
    selectedAgent.lastActivity = new Date();

    return selectedAgent;
  }

  async releaseAgent(agentId: string, taskId: string, success: boolean, processingTime: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Remove task from agent
    agent.currentTasks = agent.currentTasks.filter(id => id !== taskId);
    
    // Update agent status
    if (agent.currentTasks.length === 0) {
      agent.status = 'idle';
    }

    // Update agent metrics
    agent.totalTasksCompleted++;
    agent.successRate = (agent.successRate * (agent.totalTasksCompleted - 1) + (success ? 1 : 0)) / agent.totalTasksCompleted;
    agent.lastActivity = new Date();

    // Record assignment history for learning
    this.assignmentHistory.set(taskId, {
      agentId,
      success,
      processingTime
    });
  }

  getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status === 'idle' || (agent.status === 'busy' && agent.currentTasks.length < agent.maxConcurrentTasks)
    );
  }

  getActiveAgentCount(): number {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status === 'idle' || agent.status === 'busy'
    ).length;
  }

  async healthCheck(): Promise<boolean> {
    const totalAgents = this.agents.size;
    const healthyAgents = Array.from(this.agents.values()).filter(agent => 
      agent.status !== 'offline' && 
      Date.now() - agent.lastActivity.getTime() < 5 * 60 * 1000 // Active within 5 minutes
    ).length;

    return totalAgents > 0 && healthyAgents / totalAgents >= 0.7; // At least 70% healthy
  }

  getAgentMetrics(): Record<string, {
    totalTasks: number;
    successRate: number;
    averageLoad: number;
    status: string;
  }> {
    const metrics: Record<string, {
      totalTasks: number;
      successRate: number;
      averageLoad: number;
      status: string;
    }> = {};

    for (const agent of this.agents.values()) {
      metrics[agent.id] = {
        totalTasks: agent.totalTasksCompleted,
        successRate: agent.successRate,
        averageLoad: agent.currentTasks.length / agent.maxConcurrentTasks,
        status: agent.status
      };
    }

    return metrics;
  }

  private getAvailableAgentsForTask(taskType: AITaskType): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      this.agentSupportsTask(agent, taskType) &&
      (agent.status === 'idle' || (agent.status === 'busy' && agent.currentTasks.length < agent.maxConcurrentTasks))
    );
  }

  private agentSupportsTask(agent: Agent, taskType: AITaskType): boolean {
    // Map task types to agent capabilities
    const taskCapabilityMap: Record<AITaskType, AgentCapability[]> = {
      'analysis.sentiment': ['market_analysis'],
      'analysis.market': ['market_analysis'],
      'analysis.trending': ['market_analysis'],
      'analysis.performance': ['market_analysis', 'data_analysis'],
      'analysis.user_behavior': ['data_analysis'],
      'analysis.competitive': ['market_analysis', 'research'],
      'analysis.predictive': ['predictive_analysis', 'market_analysis'],
      'content.generate': ['content_generation'],
      'content.optimize': ['content_generation', 'seo_optimization'],
      'content.summarize': ['content_generation'],
      'content.rewrite': ['content_generation'],
      'translation.auto': ['translation'],
      'translation.manual': ['translation'],
      'image.generate': ['image_generation'],
      'image.thumbnail': ['image_generation'],
      'image.chart': ['image_generation'],
      'seo.optimize': ['seo_optimization'],
      'social.enhance': ['social_optimization'],
      'research.crypto': ['research', 'market_analysis'],
      'research.news': ['research'],
      'research.factcheck': ['research'],
      'data.collect': ['data_analysis'],
      'data.process': ['data_analysis'],
      'moderation.content': ['content_moderation'],
      'moderation.spam': ['content_moderation']
    };

    const requiredCapabilities = taskCapabilityMap[taskType] || [];
    return requiredCapabilities.some(cap => agent.capabilities.includes(cap));
  }

  private calculateAgentScore(agent: Agent, taskType: AITaskType, priority: 'low' | 'medium' | 'high' | 'critical'): number {
    let score = 0;

    // Base score from success rate (0-100)
    score += agent.successRate * 100;

    // Availability bonus (0-20)
    const loadFactor = agent.currentTasks.length / agent.maxConcurrentTasks;
    score += (1 - loadFactor) * 20;

    // Task specialization bonus (0-15)
    if (this.agentSupportsTask(agent, taskType)) {
      score += 15;
    }

    // Priority handling bonus based on performance (0-10)
    if (priority === 'critical' && agent.performance.averageResponseTime < 200) {
      score += 10;
    } else if (priority === 'high' && agent.performance.averageResponseTime < 300) {
      score += 5;
    }

    // Recent performance bonus (0-5)
    const recentSuccess = this.getRecentSuccessRate(agent.id);
    if (recentSuccess > 0.9) {
      score += 5;
    }

    return score;
  }

  private getRecentSuccessRate(agentId: string): number {
    const recentTasks = Array.from(this.assignmentHistory.values())
      .filter(history => history.agentId === agentId)
      .slice(-10); // Last 10 tasks

    if (recentTasks.length === 0) return 0;

    const successCount = recentTasks.filter(task => task.success).length;
    return successCount / recentTasks.length;
  }

  private startAgentMonitoring(): void {
    // Monitor agent health every 2 minutes
    setInterval(() => {
      const now = Date.now();
      const timeout = 10 * 60 * 1000; // 10 minutes

      for (const agent of this.agents.values()) {
        // Mark agents as offline if they haven't been active
        if (now - agent.lastActivity.getTime() > timeout && agent.status !== 'offline') {
          agent.status = 'offline';
          agent.currentTasks = []; // Clear stuck tasks
        }
      }
    }, 2 * 60 * 1000);

    // Clean up old assignment history every hour
    setInterval(() => {
      const keysToDelete: string[] = [];

      // Limit to 1000 entries to prevent memory growth
      if (this.assignmentHistory.size > 1000) {
        let count = 0;
        for (const taskId of this.assignmentHistory.keys()) {
          if (count >= this.assignmentHistory.size - 1000) break;
          keysToDelete.push(taskId);
          count++;
        }
      }

      // Remove oldest entries
      keysToDelete.forEach(key => {
        this.assignmentHistory.delete(key);
      });
    }, 60 * 60 * 1000);
  }
}
