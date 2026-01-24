/**
 * AI Configuration Management Service
 * Handles agent configuration, workflow templates, cost management, and quality thresholds
 * 
 * Features:
 * - Agent configuration management (temperature, tokens, model selection)
 * - Workflow template creation and management
 * - Cost budgets and alerts
 * - Quality threshold configuration
 * - A/B testing support
 * - Real-time configuration updates
 * 
 * Task 6.2: AI Configuration Management
 * Priority: High
 * Performance Target: < 300ms response time (cached), changes effective within 30s
 */

import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import EventEmitter from 'events';

const prisma = new PrismaClient();
const configEventEmitter = new EventEmitter();

// Helper function for safe Redis operations
async function safeRedisSet(key: string, ttl: number, value: string): Promise<void> {
  try {
    if (redisClient?.isOpen) {
      // @ts-ignore - Redis client is checked for isOpen
      await redisClient.setex(key, ttl, value);
    }
  } catch (error) {
    logger.warn(`Failed to cache key ${key}:`, error);
  }
}

// ==================== TYPES AND INTERFACES ====================

export interface AgentConfiguration {
  id: string;
  agentId: string;
  // Model Parameters
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  modelProvider: string;
  modelName: string;
  
  // Capabilities
  capabilities: {
    textGeneration: boolean;
    imageGeneration: boolean;
    translation: boolean;
    analysis: boolean;
    moderation: boolean;
  };
  
  // Performance Settings
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  
  // A/B Testing
  abTesting?: {
    enabled: boolean;
    variant: 'A' | 'B';
    trafficSplit: number; // percentage for variant B
    testId?: string;
  };
  
  // Advanced Settings
  customSettings?: Record<string, any>;
  
  updatedAt: Date;
  updatedBy?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Stage Configuration
  stages: WorkflowStage[];
  
  // Quality Settings
  qualityThresholds: {
    minimum: number; // 0-1
    autoApproval: number; // 0-1
    humanReview: number; // 0-1
  };
  
  // Performance Settings
  timeout: number; // milliseconds
  maxRetries: number;
  retryDelay: number;
  
  // Content Type Specific
  contentType?: string;
  isDefault: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface WorkflowStage {
  id: string;
  name: string;
  agentType: string;
  order: number;
  
  // Quality Requirements
  minQualityScore: number;
  skipOnFailure: boolean;
  
  // Timeout Settings
  timeout: number;
  maxRetries: number;
  
  // Dependencies
  dependsOn?: string[]; // stage IDs
}

export interface CostBudget {
  id: string;
  agentId?: string; // if null, applies to all agents
  
  // Budget Limits
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  
  // Current Usage
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  
  // Alerts
  alerts: CostAlert[];
  
  // Enforcement
  enforceHardLimit: boolean;
  throttleAtPercent: number; // start throttling at this % of budget
  
  updatedAt: Date;
}

export interface CostAlert {
  id: string;
  threshold: number; // percentage of budget
  channels: ('email' | 'slack' | 'webhook')[];
  recipients: string[];
  isTriggered: boolean;
  lastTriggeredAt?: Date;
}

export interface QualityThresholdConfig {
  id: string;
  
  // Stage-specific thresholds
  stages: {
    [stageName: string]: {
      minScore: number;
      autoApproval: number;
      humanReview: number;
    };
  };
  
  // Content type specific
  contentType?: string;
  
  // Review Criteria
  criteria: QualityReviewCriteria;
  
  isActive: boolean;
  updatedAt: Date;
}

export interface QualityReviewCriteria {
  grammar: { weight: number; minScore: number };
  relevance: { weight: number; minScore: number };
  accuracy: { weight: number; minScore: number };
  seoOptimization: { weight: number; minScore: number };
  readability: { weight: number; minScore: number };
  engagement: { weight: number; minScore: number };
  sentiment: { weight: number; minScore: number };
}

// ==================== CACHING CONSTANTS ====================

const CACHE_TTL = {
  AGENT_CONFIG: 300, // 5 minutes
  WORKFLOW_TEMPLATE: 600, // 10 minutes
  COST_BUDGET: 60, // 1 minute
  QUALITY_THRESHOLD: 300, // 5 minutes
};

const CACHE_KEYS = {
  AGENT_CONFIG: (agentId: string) => `ai:config:agent:${agentId}`,
  WORKFLOW_TEMPLATE: (id: string) => `ai:config:workflow:${id}`,
  WORKFLOW_TEMPLATES_LIST: 'ai:config:workflows:list',
  COST_BUDGET: (agentId?: string) => `ai:config:budget:${agentId || 'global'}`,
  QUALITY_THRESHOLD: (id: string) => `ai:config:quality:${id}`,
};

// ==================== AGENT CONFIGURATION ====================

/**
 * Get agent configuration
 */
export async function getAgentConfiguration(agentId: string): Promise<AgentConfiguration | null> {
  const startTime = Date.now();
  
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.AGENT_CONFIG(agentId);
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      logger.info(`Agent configuration retrieved from cache: ${agentId}`, {
        duration: Date.now() - startTime,
      });
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      return null;
    }
    
    // Parse configuration
    const config: AgentConfiguration = {
      id: agent.id,
      agentId: agent.id,
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      modelProvider: agent.modelProvider,
      modelName: agent.modelName,
      capabilities: {
        textGeneration: true,
        imageGeneration: false,
        translation: false,
        analysis: false,
        moderation: false,
      },
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      updatedAt: agent.updatedAt,
      ...(agent.configuration ? JSON.parse(agent.configuration) : {}),
    };
    
    // Cache it
    await safeRedisSet(cacheKey, CACHE_TTL.AGENT_CONFIG, JSON.stringify(config));
    
    logger.info(`Agent configuration retrieved from database: ${agentId}`, {
      duration: Date.now() - startTime,
    });
    
    return config;
  } catch (error) {
    logger.error('Error getting agent configuration:', error);
    throw error;
  }
}

/**
 * Update agent configuration
 */
export async function updateAgentConfiguration(
  agentId: string,
  updates: Partial<AgentConfiguration>,
  updatedBy?: string
): Promise<AgentConfiguration> {
  const startTime = Date.now();
  
  try {
    // Get current configuration
    const current = await getAgentConfiguration(agentId);
    if (!current) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    // Validate updates
    validateAgentConfiguration(updates);
    
    // Merge configurations
    const updated: AgentConfiguration = {
      ...current,
      ...updates,
      updatedAt: new Date(),
      updatedBy: updatedBy || current.updatedBy || 'system',
    };
    
    // Update database
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        configuration: JSON.stringify(updated),
        modelProvider: updated.modelProvider,
        modelName: updated.modelName,
        updatedAt: new Date(),
      },
    });
    
    // Invalidate cache
    await redisClient.del(CACHE_KEYS.AGENT_CONFIG(agentId));
    
    // Emit configuration change event
    configEventEmitter.emit('agent:config:updated', {
      agentId,
      config: updated,
      updatedBy,
      timestamp: new Date(),
    });
    
    logger.info(`Agent configuration updated: ${agentId}`, {
      duration: Date.now() - startTime,
      updatedBy,
    });
    
    return updated;
  } catch (error) {
    logger.error('Error updating agent configuration:', error);
    throw error;
  }
}

/**
 * Validate agent configuration
 */
function validateAgentConfiguration(config: Partial<AgentConfiguration>): void {
  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    throw new Error('Temperature must be between 0 and 2');
  }
  
  if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 128000)) {
    throw new Error('Max tokens must be between 1 and 128000');
  }
  
  if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
    throw new Error('Top P must be between 0 and 1');
  }
  
  if (config.timeout !== undefined && config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }
}

/**
 * Enable A/B testing for an agent
 */
export async function enableABTesting(
  agentId: string,
  variant: 'A' | 'B',
  trafficSplit: number,
  testId?: string
): Promise<AgentConfiguration> {
  if (trafficSplit < 0 || trafficSplit > 100) {
    throw new Error('Traffic split must be between 0 and 100');
  }
  
  return updateAgentConfiguration(agentId, {
    abTesting: {
      enabled: true,
      variant,
      trafficSplit,
      ...(testId && { testId }),
    },
  });
}

/**
 * Disable A/B testing for an agent
 */
export async function disableABTesting(agentId: string): Promise<AgentConfiguration> {
  return updateAgentConfiguration(agentId, {
    abTesting: {
      enabled: false,
      variant: 'A',
      trafficSplit: 0,
    },
  });
}

// ==================== WORKFLOW TEMPLATES ====================

/**
 * Create workflow template
 */
export async function createWorkflowTemplate(
  template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WorkflowTemplate> {
  const startTime = Date.now();
  
  try {
    // Validate template
    validateWorkflowTemplate(template);
    
    const id = `wf_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTemplate: WorkflowTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store in database (using a JSON storage approach since we don't have a WorkflowTemplate table)
    // In production, you'd want a dedicated table
    await prisma.aIAgent.upsert({
      where: { id: `workflow_template_${id}` },
      update: {
        configuration: JSON.stringify(newTemplate),
        updatedAt: new Date(),
      },
      create: {
        id: `workflow_template_${id}`,
        name: newTemplate.name,
        type: 'workflow_template',
        modelProvider: 'system',
        modelName: 'template',
        configuration: JSON.stringify(newTemplate),
        isActive: newTemplate.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Invalidate cache
    await redisClient.del(CACHE_KEYS.WORKFLOW_TEMPLATES_LIST);
    
    logger.info(`Workflow template created: ${id}`, {
      duration: Date.now() - startTime,
    });
    
    return newTemplate;
  } catch (error) {
    logger.error('Error creating workflow template:', error);
    throw error;
  }
}

/**
 * Get workflow template
 */
export async function getWorkflowTemplate(id: string): Promise<WorkflowTemplate | null> {
  const startTime = Date.now();
  
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.WORKFLOW_TEMPLATE(id);
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      logger.info(`Workflow template retrieved from cache: ${id}`, {
        duration: Date.now() - startTime,
      });
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const record = await prisma.aIAgent.findUnique({
      where: { id: `workflow_template_${id}` },
    });
    
    if (!record || !record.configuration) {
      return null;
    }
    
    const template: WorkflowTemplate = JSON.parse(record.configuration);
    
    // Cache it
    await safeRedisSet(cacheKey, CACHE_TTL.WORKFLOW_TEMPLATE, JSON.stringify(template));
    
    logger.info(`Workflow template retrieved from database: ${id}`, {
      duration: Date.now() - startTime,
    });
    
    return template;
  } catch (error) {
    logger.error('Error getting workflow template:', error);
    throw error;
  }
}

/**
 * List workflow templates
 */
export async function listWorkflowTemplates(filter?: {
  isActive?: boolean;
  contentType?: string;
}): Promise<WorkflowTemplate[]> {
  const startTime = Date.now();
  
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.WORKFLOW_TEMPLATES_LIST;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      let templates: WorkflowTemplate[] = JSON.parse(cached);
      
      // Apply filters
      if (filter?.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === filter.isActive);
      }
      if (filter?.contentType) {
        templates = templates.filter(t => t.contentType === filter.contentType);
      }
      
      logger.info('Workflow templates retrieved from cache', {
        count: templates.length,
        duration: Date.now() - startTime,
      });
      
      return templates;
    }
    
    // Fetch from database
    const records = await prisma.aIAgent.findMany({
      where: {
        type: 'workflow_template',
      },
    });
    
    let templates: WorkflowTemplate[] = records
      .filter(r => r.configuration)
      .map(r => JSON.parse(r.configuration!));
    
    // Apply filters
    if (filter?.isActive !== undefined) {
      templates = templates.filter(t => t.isActive === filter.isActive);
    }
    if (filter?.contentType) {
      templates = templates.filter(t => t.contentType === filter.contentType);
    }
    
    // Cache it
    await safeRedisSet(cacheKey, CACHE_TTL.WORKFLOW_TEMPLATE, JSON.stringify(templates));
    
    logger.info('Workflow templates retrieved from database', {
      count: templates.length,
      duration: Date.now() - startTime,
    });
    
    return templates;
  } catch (error) {
    logger.error('Error listing workflow templates:', error);
    throw error;
  }
}

/**
 * Update workflow template
 */
export async function updateWorkflowTemplate(
  id: string,
  updates: Partial<WorkflowTemplate>
): Promise<WorkflowTemplate> {
  const startTime = Date.now();
  
  try {
    const current = await getWorkflowTemplate(id);
    if (!current) {
      throw new Error(`Workflow template not found: ${id}`);
    }
    
    const updated: WorkflowTemplate = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };
    
    // Validate
    validateWorkflowTemplate(updated);
    
    // Update database
    await prisma.aIAgent.update({
      where: { id: `workflow_template_${id}` },
      data: {
        configuration: JSON.stringify(updated),
        updatedAt: new Date(),
      },
    });
    
    // Invalidate cache
    await redisClient.del(CACHE_KEYS.WORKFLOW_TEMPLATE(id));
    await redisClient.del(CACHE_KEYS.WORKFLOW_TEMPLATES_LIST);
    
    logger.info(`Workflow template updated: ${id}`, {
      duration: Date.now() - startTime,
    });
    
    return updated;
  } catch (error) {
    logger.error('Error updating workflow template:', error);
    throw error;
  }
}

/**
 * Delete workflow template
 */
export async function deleteWorkflowTemplate(id: string): Promise<void> {
  try {
    await prisma.aIAgent.delete({
      where: { id: `workflow_template_${id}` },
    });
    
    // Invalidate cache
    await redisClient.del(CACHE_KEYS.WORKFLOW_TEMPLATE(id));
    await redisClient.del(CACHE_KEYS.WORKFLOW_TEMPLATES_LIST);
    
    logger.info(`Workflow template deleted: ${id}`);
  } catch (error) {
    logger.error('Error deleting workflow template:', error);
    throw error;
  }
}

/**
 * Validate workflow template
 */
function validateWorkflowTemplate(template: Partial<WorkflowTemplate>): void {
  if (template.stages) {
    // Check stage order
    const orders = template.stages.map(s => s.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error('Stage orders must be unique');
    }
    
    // Validate quality thresholds
    for (const stage of template.stages) {
      if (stage.minQualityScore < 0 || stage.minQualityScore > 1) {
        throw new Error('Stage quality score must be between 0 and 1');
      }
    }
  }
  
  if (template.qualityThresholds) {
    const { minimum, autoApproval, humanReview } = template.qualityThresholds;
    if (minimum < 0 || minimum > 1 || autoApproval < 0 || autoApproval > 1 || humanReview < 0 || humanReview > 1) {
      throw new Error('Quality thresholds must be between 0 and 1');
    }
  }
}

// ==================== COST MANAGEMENT ====================

/**
 * Get cost budget
 */
export async function getCostBudget(agentId?: string): Promise<CostBudget | null> {
  const startTime = Date.now();
  
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.COST_BUDGET(agentId);
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      logger.info(`Cost budget retrieved from cache: ${agentId || 'global'}`, {
        duration: Date.now() - startTime,
      });
      return JSON.parse(cached);
    }
    
    // Fetch from database (stored in AIAgent configuration)
    const budgetId = `cost_budget_${agentId || 'global'}`;
    const record = await prisma.aIAgent.findUnique({
      where: { id: budgetId },
    });
    
    if (!record || !record.configuration) {
      // Return default budget
      const defaultBudget: CostBudget = {
        id: budgetId,
        ...(agentId && { agentId }),
        dailyLimit: 100,
        weeklyLimit: 500,
        monthlyLimit: 2000,
        dailyUsage: 0,
        weeklyUsage: 0,
        monthlyUsage: 0,
        alerts: [
          {
            id: 'alert_80',
            threshold: 80,
            channels: ['email'],
            recipients: [],
            isTriggered: false,
          },
          {
            id: 'alert_90',
            threshold: 90,
            channels: ['email', 'slack'],
            recipients: [],
            isTriggered: false,
          },
          {
            id: 'alert_100',
            threshold: 100,
            channels: ['email', 'slack', 'webhook'],
            recipients: [],
            isTriggered: false,
          },
        ],
        enforceHardLimit: true,
        throttleAtPercent: 80,
        updatedAt: new Date(),
      };
      
      return defaultBudget;
    }
    
    const budget: CostBudget = JSON.parse(record.configuration);
    
    // Cache it
    await safeRedisSet(cacheKey, CACHE_TTL.COST_BUDGET, JSON.stringify(budget));
    
    logger.info(`Cost budget retrieved from database: ${agentId || 'global'}`, {
      duration: Date.now() - startTime,
    });
    
    return budget;
  } catch (error) {
    logger.error('Error getting cost budget:', error);
    throw error;
  }
}

/**
 * Update cost budget
 */
export async function updateCostBudget(
  budget: Partial<CostBudget> & { id: string }
): Promise<CostBudget> {
  const startTime = Date.now();
  
  try {
    const current = await getCostBudget(budget.agentId);
    if (!current) {
      throw new Error('Cost budget not found');
    }
    
    const updated: CostBudget = {
      ...current,
      ...budget,
      updatedAt: new Date(),
    };
    
    // Validate
    validateCostBudget(updated);
    
    // Update database
    await prisma.aIAgent.upsert({
      where: { id: updated.id },
      update: {
        configuration: JSON.stringify(updated),
        updatedAt: new Date(),
      },
      create: {
        id: updated.id,
        name: `Cost Budget: ${updated.agentId || 'Global'}`,
        type: 'cost_budget',
        modelProvider: 'system',
        modelName: 'budget',
        configuration: JSON.stringify(updated),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Invalidate cache
    await redisClient.del(CACHE_KEYS.COST_BUDGET(updated.agentId));
    
    // Emit event
    configEventEmitter.emit('budget:updated', {
      agentId: updated.agentId,
      budget: updated,
      timestamp: new Date(),
    });
    
    logger.info(`Cost budget updated: ${updated.id}`, {
      duration: Date.now() - startTime,
    });
    
    return updated;
  } catch (error) {
    logger.error('Error updating cost budget:', error);
    throw error;
  }
}

/**
 * Track cost usage
 */
export async function trackCostUsage(agentId: string, cost: number): Promise<void> {
  try {
    const budget = await getCostBudget(agentId);
    if (!budget) return;
    
    // Update usage
    budget.dailyUsage += cost;
    budget.weeklyUsage += cost;
    budget.monthlyUsage += cost;
    
    // Check alerts
    const dailyPercent = (budget.dailyUsage / budget.dailyLimit) * 100;
    const weeklyPercent = (budget.weeklyUsage / budget.weeklyLimit) * 100;
    const monthlyPercent = (budget.monthlyUsage / budget.monthlyLimit) * 100;
    
    const maxPercent = Math.max(dailyPercent, weeklyPercent, monthlyPercent);
    
    for (const alert of budget.alerts) {
      if (maxPercent >= alert.threshold && !alert.isTriggered) {
        alert.isTriggered = true;
        alert.lastTriggeredAt = new Date();
        
        // Emit alert event
        configEventEmitter.emit('budget:alert', {
          agentId,
          alert,
          currentUsage: {
            daily: budget.dailyUsage,
            weekly: budget.weeklyUsage,
            monthly: budget.monthlyUsage,
          },
          limits: {
            daily: budget.dailyLimit,
            weekly: budget.weeklyLimit,
            monthly: budget.monthlyLimit,
          },
          timestamp: new Date(),
        });
      }
    }
    
    // Update budget
    await updateCostBudget(budget);
  } catch (error) {
    logger.error('Error tracking cost usage:', error);
  }
}

/**
 * Check if budget exceeded
 */
export async function isBudgetExceeded(agentId: string): Promise<boolean> {
  try {
    const budget = await getCostBudget(agentId);
    if (!budget || !budget.enforceHardLimit) return false;
    
    return (
      budget.dailyUsage >= budget.dailyLimit ||
      budget.weeklyUsage >= budget.weeklyLimit ||
      budget.monthlyUsage >= budget.monthlyLimit
    );
  } catch (error) {
    logger.error('Error checking budget:', error);
    return false;
  }
}

/**
 * Validate cost budget
 */
function validateCostBudget(budget: CostBudget): void {
  if (budget.dailyLimit <= 0 || budget.weeklyLimit <= 0 || budget.monthlyLimit <= 0) {
    throw new Error('Budget limits must be positive');
  }
  
  if (budget.throttleAtPercent < 0 || budget.throttleAtPercent > 100) {
    throw new Error('Throttle percentage must be between 0 and 100');
  }
}

// ==================== QUALITY THRESHOLDS ====================

/**
 * Get quality threshold configuration
 */
export async function getQualityThresholdConfig(id: string): Promise<QualityThresholdConfig | null> {
  const startTime = Date.now();
  
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.QUALITY_THRESHOLD(id);
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      logger.info(`Quality threshold config retrieved from cache: ${id}`, {
        duration: Date.now() - startTime,
      });
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const record = await prisma.aIAgent.findUnique({
      where: { id: `quality_threshold_${id}` },
    });
    
    if (!record || !record.configuration) {
      return null;
    }
    
    const config: QualityThresholdConfig = JSON.parse(record.configuration);
    
    // Cache it
    await safeRedisSet(cacheKey, CACHE_TTL.QUALITY_THRESHOLD, JSON.stringify(config));
    
    logger.info(`Quality threshold config retrieved from database: ${id}`, {
      duration: Date.now() - startTime,
    });
    
    return config;
  } catch (error) {
    logger.error('Error getting quality threshold config:', error);
    throw error;
  }
}

/**
 * Create or update quality threshold configuration
 */
export async function upsertQualityThresholdConfig(
  config: Omit<QualityThresholdConfig, 'updatedAt'>
): Promise<QualityThresholdConfig> {
  const startTime = Date.now();
  
  try {
    // Validate
    validateQualityThresholdConfig(config);
    
    const updated: QualityThresholdConfig = {
      ...config,
      updatedAt: new Date(),
    };
    
    // Update database
    await prisma.aIAgent.upsert({
      where: { id: `quality_threshold_${config.id}` },
      update: {
        configuration: JSON.stringify(updated),
        updatedAt: new Date(),
      },
      create: {
        id: `quality_threshold_${config.id}`,
        name: `Quality Threshold: ${config.contentType || 'Default'}`,
        type: 'quality_threshold',
        modelProvider: 'system',
        modelName: 'threshold',
        configuration: JSON.stringify(updated),
        isActive: config.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Invalidate cache
    await redisClient.del(CACHE_KEYS.QUALITY_THRESHOLD(config.id));
    
    logger.info(`Quality threshold config updated: ${config.id}`, {
      duration: Date.now() - startTime,
    });
    
    return updated;
  } catch (error) {
    logger.error('Error upserting quality threshold config:', error);
    throw error;
  }
}

/**
 * Validate quality threshold configuration
 */
function validateQualityThresholdConfig(config: Partial<QualityThresholdConfig>): void {
  if (config.stages) {
    for (const [stageName, thresholds] of Object.entries(config.stages)) {
      if (thresholds.minScore < 0 || thresholds.minScore > 1) {
        throw new Error(`Invalid min score for stage ${stageName}`);
      }
      if (thresholds.autoApproval < 0 || thresholds.autoApproval > 1) {
        throw new Error(`Invalid auto-approval threshold for stage ${stageName}`);
      }
      if (thresholds.humanReview < 0 || thresholds.humanReview > 1) {
        throw new Error(`Invalid human review threshold for stage ${stageName}`);
      }
    }
  }
  
  if (config.criteria) {
    const totalWeight = Object.values(config.criteria).reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      throw new Error('Criteria weights must sum to 1');
    }
  }
}

// ==================== EVENT LISTENERS ====================

/**
 * Subscribe to configuration change events
 */
export function onConfigurationChange(
  callback: (event: any) => void
): void {
  configEventEmitter.on('agent:config:updated', callback);
  configEventEmitter.on('budget:updated', callback);
  configEventEmitter.on('budget:alert', callback);
}

/**
 * Unsubscribe from configuration change events
 */
export function offConfigurationChange(
  callback: (event: any) => void
): void {
  configEventEmitter.off('agent:config:updated', callback);
  configEventEmitter.off('budget:updated', callback);
  configEventEmitter.off('budget:alert', callback);
}

// ==================== EXPORTS ====================

export default {
  // Agent Configuration
  getAgentConfiguration,
  updateAgentConfiguration,
  enableABTesting,
  disableABTesting,
  
  // Workflow Templates
  createWorkflowTemplate,
  getWorkflowTemplate,
  listWorkflowTemplates,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  
  // Cost Management
  getCostBudget,
  updateCostBudget,
  trackCostUsage,
  isBudgetExceeded,
  
  // Quality Thresholds
  getQualityThresholdConfig,
  upsertQualityThresholdConfig,
  
  // Events
  onConfigurationChange,
  offConfigurationChange,
};
