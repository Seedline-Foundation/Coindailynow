/**
 * CoinDaily Agent Registry
 * Central registry for all AI agents - provides discovery, management, and monitoring
 */

// Base
export { BaseAgent, type AgentTask, type AgentMetricsData, type AgentHealthData, type AgentInfo } from './base/BaseAgent';

// Analysis Agents
export { SentimentAnalysisAgent } from './analysis/SentimentAnalysisAgent';
export { TrendAnalysisAgent } from './analysis/TrendAnalysisAgent';
export { EnhancedSentimentAgent } from './analysis/EnhancedSentimentAgent';
export { MarketPulseAgent } from './analysis/MarketPulseAgent';
export { ForecastAgent } from './analysis/ForecastAgent';

// Data Agents
export { DataScrapeAgent } from './data/DataScrapeAgent';
export { DataCleanAgent } from './data/DataCleanAgent';

// Research Agents
export { NewsAggregationAgent } from './research/NewsAggregationAgent';
export { CryptoResearchAgent } from './research/CryptoResearchAgent';

// Content Agents
export { NewsCuratorAgent } from './content/NewsCuratorAgent';
export { SocialMediaAgent } from './content/SocialMediaAgent';
export { ResearchWriterAgent } from './content/ResearchWriterAgent';

// Engineering Agents
export { CodeReviewAgent } from './engineering/CodeReviewAgent';
export { DevOpsAgent } from './engineering/DevOpsAgent';
export { TestAgent } from './engineering/TestAgent';

// Business Agents
export { SupportAgent } from './business/SupportAgent';
export { SalesAgent } from './business/SalesAgent';
export { LeadGenAgent } from './business/LeadGenAgent';
export { OnboardingAgent } from './business/OnboardingAgent';
export { ChurnPredictAgent } from './business/ChurnPredictAgent';

// Finance Agents
export { TradeBotAgent } from './finance/TradeBotAgent';
export { BillingAgent } from './finance/BillingAgent';
export { PricingAgent } from './finance/PricingAgent';

// Legal Agents
export { ComplianceAgent } from './legal/ComplianceAgent';
export { ContractAgent } from './legal/ContractAgent';
export { KYCAgent } from './legal/KYCAgent';

// ============================================================
// Agent Registry - Central management for all agents
// ============================================================

import { BaseAgent, AgentInfo } from './base/BaseAgent';
import { SentimentAnalysisAgent } from './analysis/SentimentAnalysisAgent';
import { TrendAnalysisAgent } from './analysis/TrendAnalysisAgent';
import { EnhancedSentimentAgent } from './analysis/EnhancedSentimentAgent';
import { MarketPulseAgent } from './analysis/MarketPulseAgent';
import { ForecastAgent } from './analysis/ForecastAgent';
import { DataScrapeAgent } from './data/DataScrapeAgent';
import { DataCleanAgent } from './data/DataCleanAgent';
import { NewsAggregationAgent } from './research/NewsAggregationAgent';
import { CryptoResearchAgent } from './research/CryptoResearchAgent';
import { NewsCuratorAgent } from './content/NewsCuratorAgent';
import { SocialMediaAgent } from './content/SocialMediaAgent';
import { ResearchWriterAgent } from './content/ResearchWriterAgent';
import { CodeReviewAgent } from './engineering/CodeReviewAgent';
import { DevOpsAgent } from './engineering/DevOpsAgent';
import { TestAgent } from './engineering/TestAgent';
import { SupportAgent } from './business/SupportAgent';
import { SalesAgent } from './business/SalesAgent';
import { LeadGenAgent } from './business/LeadGenAgent';
import { OnboardingAgent } from './business/OnboardingAgent';
import { ChurnPredictAgent } from './business/ChurnPredictAgent';
import { TradeBotAgent } from './finance/TradeBotAgent';
import { BillingAgent } from './finance/BillingAgent';
import { PricingAgent } from './finance/PricingAgent';
import { ComplianceAgent } from './legal/ComplianceAgent';
import { ContractAgent } from './legal/ContractAgent';
import { KYCAgent } from './legal/KYCAgent';

export interface AgentRegistryEntry {
  id: string;
  name: string;
  category: string;
  type: string;
  instance: BaseAgent;
}

export type AgentCategory = 'analysis' | 'data' | 'research' | 'content' | 'engineering' | 'business' | 'finance' | 'legal';

class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private initialized = false;

  /**
   * Initialize all agents and register them
   */
  initialize(): void {
    if (this.initialized) return;

    const agentClasses = [
      // Analysis
      SentimentAnalysisAgent,
      TrendAnalysisAgent,
      EnhancedSentimentAgent,
      MarketPulseAgent,
      ForecastAgent,
      // Data
      DataScrapeAgent,
      DataCleanAgent,
      // Research
      NewsAggregationAgent,
      CryptoResearchAgent,
      // Content
      NewsCuratorAgent,
      SocialMediaAgent,
      ResearchWriterAgent,
      // Engineering
      CodeReviewAgent,
      DevOpsAgent,
      TestAgent,
      // Business
      SupportAgent,
      SalesAgent,
      LeadGenAgent,
      OnboardingAgent,
      ChurnPredictAgent,
      // Finance
      TradeBotAgent,
      BillingAgent,
      PricingAgent,
      // Legal
      ComplianceAgent,
      ContractAgent,
      KYCAgent,
    ];

    for (const AgentClass of agentClasses) {
      const agent = new AgentClass();
      const info = agent.getInfo();
      this.agents.set(info.id, agent);
    }

    this.initialized = true;
    console.log(`[AgentRegistry] Initialized ${this.agents.size} agents`);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent info objects (lightweight version without instances)
   */
  getAllAgentInfo(): AgentInfo[] {
    return this.getAllAgents().map(agent => agent.getInfo());
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: AgentCategory): BaseAgent[] {
    return this.getAllAgents().filter(agent => agent.getInfo().category === category);
  }

  /**
   * Get all categories with their agents
   */
  getCategories(): Record<AgentCategory, AgentInfo[]> {
    const categories: Record<string, AgentInfo[]> = {};
    for (const agent of this.getAllAgents()) {
      const info = agent.getInfo();
      if (!categories[info.category]) {
        categories[info.category] = [];
      }
      categories[info.category].push(info);
    }
    return categories as Record<AgentCategory, AgentInfo[]>;
  }

  /**
   * Get registry summary stats
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    totalTasksProcessed: number;
    totalTasksInQueue: number;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const agents = this.getAllAgents();
    const infos = agents.map(a => a.getInfo());
    
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = { active: 0, inactive: 0, error: 0 };
    let totalTasksProcessed = 0;
    let totalTasksInQueue = 0;
    let healthyCount = 0;

    for (const info of infos) {
      byCategory[info.category] = (byCategory[info.category] || 0) + 1;
      if (info.isActive) {
        byStatus.active++;
      } else {
        byStatus.inactive++;
      }
      totalTasksProcessed += info.metrics.totalTasks;
      totalTasksInQueue += info.metrics.queuedTasks;
      if (info.health.status === 'healthy') healthyCount++;
    }

    const healthRatio = agents.length > 0 ? healthyCount / agents.length : 0;
    const overallHealth = healthRatio > 0.8 ? 'healthy' : healthRatio > 0.5 ? 'degraded' : 'unhealthy';

    return {
      totalAgents: agents.length,
      activeAgents: byStatus.active,
      byCategory,
      byStatus,
      totalTasksProcessed,
      totalTasksInQueue,
      overallHealth,
    };
  }

  /**
   * Get all running tasks across all agents
   */
  getRunningTasks(): Array<{ agentId: string; agentName: string; task: any }> {
    const running: Array<{ agentId: string; agentName: string; task: any }> = [];
    for (const agent of this.getAllAgents()) {
      const info = agent.getInfo();
      const currentTask = agent.getCurrentTask();
      if (currentTask) {
        running.push({
          agentId: info.id,
          agentName: info.name,
          task: currentTask,
        });
      }
    }
    return running;
  }

  /**
   * Get all completed tasks across all agents
   */
  getCompletedTasks(limit = 50): Array<{ agentId: string; agentName: string; task: any }> {
    const completed: Array<{ agentId: string; agentName: string; task: any }> = [];
    for (const agent of this.getAllAgents()) {
      const info = agent.getInfo();
      const tasks = agent.getCompletedTasks();
      for (const task of tasks) {
        completed.push({
          agentId: info.id,
          agentName: info.name,
          task,
        });
      }
    }
    // Sort by completion time descending
    completed.sort((a, b) => {
      const timeA = a.task.completedAt || a.task.startedAt || 0;
      const timeB = b.task.completedAt || b.task.startedAt || 0;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
    return completed.slice(0, limit);
  }

  /**
   * Get full task history across all agents
   */
  getTaskHistory(limit = 100): Array<{ agentId: string; agentName: string; task: any }> {
    const history: Array<{ agentId: string; agentName: string; task: any }> = [];
    for (const agent of this.getAllAgents()) {
      const info = agent.getInfo();
      const tasks = agent.getTaskHistory();
      for (const task of tasks) {
        history.push({
          agentId: info.id,
          agentName: info.name,
          task,
        });
      }
    }
    history.sort((a, b) => {
      const timeA = a.task.createdAt || 0;
      const timeB = b.task.createdAt || 0;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
    return history.slice(0, limit);
  }

  /**
   * Get queued tasks across all agents
   */
  getQueuedTasks(): Array<{ agentId: string; agentName: string; task: any }> {
    const queued: Array<{ agentId: string; agentName: string; task: any }> = [];
    for (const agent of this.getAllAgents()) {
      const info = agent.getInfo();
      const tasks = agent.getQueuedTasks();
      for (const task of tasks) {
        queued.push({
          agentId: info.id,
          agentName: info.name,
          task,
        });
      }
    }
    return queued;
  }

  /**
   * Submit a task to a specific agent
   */
  async submitTask(agentId: string, taskInput: any, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return agent.submitTask(taskInput, priority);
  }

  /**
   * Health check all agents
   */
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    for (const [id, agent] of this.agents) {
      results[id] = await agent.checkHealth();
    }
    return results;
  }

  /**
   * Activate/deactivate an agent
   */
  setAgentActive(agentId: string, active: boolean): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.setActive(active);
    return true;
  }

  /**
   * Reset an agent
   */
  resetAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.reset();
    return true;
  }

  /**
   * Get total agent count
   */
  get size(): number {
    return this.agents.size;
  }
}

// Singleton registry instance
export const agentRegistry = new AgentRegistry();

export default agentRegistry;
