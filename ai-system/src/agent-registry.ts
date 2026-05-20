/**
 * Unified Agent Registry
 *
 * Central registry that maps every agent name to its module path and lazily
 * instantiates agents on first use (addresses AI-1-6: lazy-load unused agents).
 *
 * Usage:
 *   const registry = AgentRegistry.getInstance();
 *   const agent   = await registry.getAgent('sentiment-analysis-agent');
 *   const all     = registry.listAgents();
 *   const status  = await registry.getAgentStatus('news-curator-agent');
 */

import { BaseAgent, AgentInfo, AgentHealthData } from '../agents/base/BaseAgent.js';

// ---------------------------------------------------------------------------
// Agent descriptor – static metadata used before the agent is instantiated
// ---------------------------------------------------------------------------

export interface AgentDescriptor {
  id: string;
  name: string;
  category: string;
  /** Relative module path from the agents/ directory (without extension). */
  modulePath: string;
  /** Named export inside the module.  Falls back to `default` when omitted. */
  exportName?: string;
}

// ---------------------------------------------------------------------------
// The full catalogue of BaseAgent-derived agents shipped in agents/
// ---------------------------------------------------------------------------

const AGENT_CATALOGUE: AgentDescriptor[] = [
  // Analysis
  { id: 'sentiment-analysis-agent',  name: 'Sentiment Analysis Agent',  category: 'analysis',     modulePath: '../agents/analysis/SentimentAnalysisAgent',  exportName: 'SentimentAnalysisAgent' },
  { id: 'trend-analysis-agent',      name: 'Trend Analysis Agent',      category: 'analysis',     modulePath: '../agents/analysis/TrendAnalysisAgent',      exportName: 'TrendAnalysisAgent' },
  { id: 'enhanced-sentiment-agent',  name: 'Enhanced Sentiment Agent',  category: 'analysis',     modulePath: '../agents/analysis/EnhancedSentimentAgent',  exportName: 'EnhancedSentimentAgent' },
  { id: 'market-pulse-agent',        name: 'Market Pulse Agent',        category: 'analysis',     modulePath: '../agents/analysis/MarketPulseAgent',        exportName: 'MarketPulseAgent' },
  { id: 'forecast-agent',            name: 'Forecast Agent',            category: 'analysis',     modulePath: '../agents/analysis/ForecastAgent',           exportName: 'ForecastAgent' },

  // Data
  { id: 'data-scrape-agent',         name: 'Data Scrape Agent',         category: 'data',         modulePath: '../agents/data/DataScrapeAgent',             exportName: 'DataScrapeAgent' },
  { id: 'data-clean-agent',          name: 'Data Clean Agent',          category: 'data',         modulePath: '../agents/data/DataCleanAgent',              exportName: 'DataCleanAgent' },

  // Research
  { id: 'news-aggregation-agent',    name: 'News Aggregation Agent',    category: 'research',     modulePath: '../agents/research/NewsAggregationAgent',    exportName: 'NewsAggregationAgent' },
  { id: 'crypto-research-agent',     name: 'Crypto Research Agent',     category: 'research',     modulePath: '../agents/research/CryptoResearchAgent',     exportName: 'CryptoResearchAgent' },

  // Content
  { id: 'news-curator-agent',        name: 'NewsCurator Agent',         category: 'content',      modulePath: '../agents/content/NewsCuratorAgent',         exportName: 'NewsCuratorAgent' },
  { id: 'social-media-agent',        name: 'Social Media Agent',        category: 'content',      modulePath: '../agents/content/SocialMediaAgent',         exportName: 'SocialMediaAgent' },
  { id: 'research-writer-agent',     name: 'Research Writer Agent',     category: 'content',      modulePath: '../agents/content/ResearchWriterAgent',      exportName: 'ResearchWriterAgent' },
  { id: 'content-moderation-agent',  name: 'Content Moderation Agent',  category: 'content',      modulePath: '../agents/moderation/ContentModerationAgent' },

  // Engineering
  { id: 'code-review-agent',         name: 'Code Review Agent',         category: 'engineering',  modulePath: '../agents/engineering/CodeReviewAgent',       exportName: 'CodeReviewAgent' },
  { id: 'devops-agent',              name: 'DevOps Agent',              category: 'engineering',  modulePath: '../agents/engineering/DevOpsAgent',           exportName: 'DevOpsAgent' },
  { id: 'test-agent',                name: 'Test Agent',                category: 'engineering',  modulePath: '../agents/engineering/TestAgent',             exportName: 'TestAgent' },

  // Business
  { id: 'support-agent',             name: 'Support Agent',             category: 'business',     modulePath: '../agents/business/SupportAgent',            exportName: 'SupportAgent' },
  { id: 'sales-agent',               name: 'Sales Agent',               category: 'business',     modulePath: '../agents/business/SalesAgent',              exportName: 'SalesAgent' },
  { id: 'lead-gen-agent',            name: 'Lead Gen Agent',            category: 'business',     modulePath: '../agents/business/LeadGenAgent',            exportName: 'LeadGenAgent' },
  { id: 'onboarding-agent',          name: 'Onboarding Agent',          category: 'business',     modulePath: '../agents/business/OnboardingAgent',         exportName: 'OnboardingAgent' },
  { id: 'churn-predict-agent',       name: 'Churn Predict Agent',       category: 'business',     modulePath: '../agents/business/ChurnPredictAgent',       exportName: 'ChurnPredictAgent' },

  // Finance
  { id: 'trade-bot-agent',           name: 'Trade Bot Agent',           category: 'finance',      modulePath: '../agents/finance/TradeBotAgent',            exportName: 'TradeBotAgent' },
  { id: 'billing-agent',             name: 'Billing Agent',             category: 'finance',      modulePath: '../agents/finance/BillingAgent',             exportName: 'BillingAgent' },
  { id: 'pricing-agent',             name: 'Pricing Agent',             category: 'finance',      modulePath: '../agents/finance/PricingAgent',             exportName: 'PricingAgent' },

  // Legal
  { id: 'compliance-agent',          name: 'Compliance Agent',          category: 'legal',        modulePath: '../agents/legal/ComplianceAgent',            exportName: 'ComplianceAgent' },
  { id: 'contract-agent',            name: 'Contract Agent',            category: 'legal',        modulePath: '../agents/legal/ContractAgent',              exportName: 'ContractAgent' },
  { id: 'kyc-agent',                 name: 'KYC Agent',                 category: 'legal',        modulePath: '../agents/legal/KYCAgent',                   exportName: 'KYCAgent' },
];

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AgentCategory =
  | 'analysis'
  | 'data'
  | 'research'
  | 'content'
  | 'engineering'
  | 'business'
  | 'finance'
  | 'legal';

export interface AgentStatusInfo {
  id: string;
  name: string;
  category: string;
  loaded: boolean;
  info?: AgentInfo;
  health?: AgentHealthData;
}

// ---------------------------------------------------------------------------
// AgentRegistry – singleton, lazy-loading
// ---------------------------------------------------------------------------

export class AgentRegistry {
  private static instance: AgentRegistry;

  /** Loaded (instantiated) agents keyed by id. */
  private agents: Map<string, BaseAgent> = new Map();

  /** Quick lookup from id → descriptor. */
  private descriptors: Map<string, AgentDescriptor> = new Map();

  private constructor() {
    for (const d of AGENT_CATALOGUE) {
      this.descriptors.set(d.id, d);
    }
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  // -----------------------------------------------------------------------
  // Core API
  // -----------------------------------------------------------------------

  /**
   * Return an agent instance by id, lazily instantiating it on first access.
   */
  async getAgent(id: string): Promise<BaseAgent | undefined> {
    const existing = this.agents.get(id);
    if (existing) return existing;

    const descriptor = this.descriptors.get(id);
    if (!descriptor) return undefined;

    return this.loadAgent(descriptor);
  }

  /**
   * List every registered agent (loaded or not) with lightweight metadata.
   */
  listAgents(): Array<{ id: string; name: string; category: string; loaded: boolean }> {
    return AGENT_CATALOGUE.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      loaded: this.agents.has(d.id),
    }));
  }

  /**
   * Get detailed status for a specific agent (loads it if necessary).
   */
  async getAgentStatus(id: string): Promise<AgentStatusInfo | undefined> {
    const descriptor = this.descriptors.get(id);
    if (!descriptor) return undefined;

    const loaded = this.agents.has(id);
    const agent = loaded ? this.agents.get(id)! : undefined;

    return {
      id: descriptor.id,
      name: descriptor.name,
      category: descriptor.category,
      loaded,
      info: agent?.getInfo(),
      health: agent ? await agent.checkHealth() : undefined,
    };
  }

  /**
   * Get agents filtered by category (only returns already-loaded agents).
   */
  getLoadedAgentsByCategory(category: AgentCategory): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.getInfo().category === category,
    );
  }

  /**
   * Return all currently loaded agent instances.
   */
  getLoadedAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Eagerly load every agent in the catalogue (useful at startup if desired).
   */
  async loadAll(): Promise<void> {
    await Promise.all(
      AGENT_CATALOGUE.map((d) => this.loadAgent(d)),
    );
  }

  /**
   * Total number of agents in the catalogue (loaded + unloaded).
   */
  get size(): number {
    return AGENT_CATALOGUE.length;
  }

  /**
   * Number of agents currently instantiated.
   */
  get loadedCount(): number {
    return this.agents.size;
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private async loadAgent(descriptor: AgentDescriptor): Promise<BaseAgent> {
    if (this.agents.has(descriptor.id)) {
      return this.agents.get(descriptor.id)!;
    }

    try {
      const mod = await import(descriptor.modulePath);
      const AgentClass = descriptor.exportName
        ? mod[descriptor.exportName]
        : mod.default;

      if (!AgentClass) {
        throw new Error(
          `Module ${descriptor.modulePath} does not export "${descriptor.exportName || 'default'}"`,
        );
      }

      const agent: BaseAgent = new AgentClass();
      this.agents.set(descriptor.id, agent);
      return agent;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load agent "${descriptor.id}": ${message}`);
    }
  }
}

export default AgentRegistry;
