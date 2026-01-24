/**
 * AI Agent GraphQL Resolvers
 * Provides GraphQL API for AI agent management
 * 
 * Supports:
 * - Queries: aiAgent, aiAgents, aiAgentMetrics
 * - Mutations: registerAIAgent, updateAIAgentConfig, toggleAIAgent
 * - Subscriptions: (future implementation)
 */

import {
  registerAIAgent,
  getAIAgentById,
  getAllAIAgents,
  updateAIAgentConfig,
  toggleAIAgent,
  getAIAgentMetrics,
  resetAgentState,
  logAIOperation,
} from '../../services/aiAgentService';
import { logger } from '../../utils/logger';

// ==================== TYPE DEFINITIONS ====================

export const aiAgentTypeDefs = `
  type AIAgent {
    id: ID!
    name: String!
    type: String!
    modelProvider: String!
    modelName: String!
    configuration: JSON
    isActive: Boolean!
    performanceMetrics: AgentPerformanceMetrics
    createdAt: DateTime!
    updatedAt: DateTime!
    recentTasks: [AITask!]
  }

  type AgentPerformanceMetrics {
    totalTasks: Int!
    successfulTasks: Int!
    failedTasks: Int!
    averageResponseTime: Float!
    successRate: Float!
    totalCost: Float!
    averageCost: Float!
    lastHealthCheck: DateTime
    uptime: Int
  }

  type AITask {
    id: ID!
    agentId: String!
    taskType: String!
    status: String!
    priority: String!
    createdAt: DateTime!
    completedAt: DateTime
  }

  input AIAgentFilter {
    type: String
    isActive: Boolean
  }

  input RegisterAIAgentInput {
    id: ID!
    name: String!
    type: String!
    modelProvider: String!
    modelName: String!
    configuration: JSON
    isActive: Boolean
  }

  input DateRangeInput {
    startDate: DateTime
    endDate: DateTime
  }

  type AgentMetrics {
    agentId: ID!
    metrics: AgentPerformanceMetrics!
    dateRange: DateRangeOutput
  }

  type DateRangeOutput {
    startDate: DateTime
    endDate: DateTime
  }

  type Query {
    """
    Get a single AI agent by ID
    """
    aiAgent(id: ID!): AIAgent

    """
    Get all AI agents with optional filtering
    """
    aiAgents(filter: AIAgentFilter): [AIAgent!]!

    """
    Get performance metrics for an agent
    """
    aiAgentMetrics(agentId: ID!, dateRange: DateRangeInput): AgentMetrics!
  }

  type Mutation {
    """
    Register a new AI agent
    """
    registerAIAgent(input: RegisterAIAgentInput!): AIAgent!

    """
    Update AI agent configuration
    """
    updateAIAgentConfig(id: ID!, config: JSON!): AIAgent!

    """
    Toggle AI agent active status
    """
    toggleAIAgent(id: ID!, isActive: Boolean!): AIAgent!

    """
    Reset AI agent state
    """
    resetAIAgent(id: ID!): AIAgent!
  }

  scalar JSON
  scalar DateTime
`;

// ==================== RESOLVERS ====================

export const aiAgentResolvers = {
  Query: {
    /**
     * Get single agent by ID
     */
    aiAgent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const startTime = Date.now();
        
        logger.info(`GraphQL Query: aiAgent(${id})`);
        
        const agent = await getAIAgentById(id);
        
        if (!agent) {
          throw new Error(`Agent not found: ${id}`);
        }

        const responseTime = Date.now() - startTime;
        logger.info(`aiAgent query completed in ${responseTime}ms`);

        return agent;
      } catch (error: any) {
        logger.error('Error in aiAgent query:', error);
        throw error;
      }
    },

    /**
     * Get all agents with optional filtering
     */
    aiAgents: async (_: any, { filter }: { filter?: any }, context: any) => {
      try {
        const startTime = Date.now();
        
        logger.info('GraphQL Query: aiAgents', { filter });
        
        const agents = await getAllAIAgents(filter);
        
        const responseTime = Date.now() - startTime;
        logger.info(`aiAgents query completed in ${responseTime}ms - returned ${agents.length} agents`);

        return agents;
      } catch (error: any) {
        logger.error('Error in aiAgents query:', error);
        throw error;
      }
    },

    /**
     * Get agent performance metrics
     */
    aiAgentMetrics: async (
      _: any,
      { agentId, dateRange }: { agentId: string; dateRange?: any },
      context: any
    ) => {
      try {
        const startTime = Date.now();
        
        logger.info(`GraphQL Query: aiAgentMetrics(${agentId})`, { dateRange });
        
        // Convert date range if provided
        const filter = dateRange ? {
          startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
          endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
        } : undefined;

        const metrics = await getAIAgentMetrics(agentId, filter);
        
        const responseTime = Date.now() - startTime;
        logger.info(`aiAgentMetrics query completed in ${responseTime}ms`);

        return {
          agentId,
          metrics,
          dateRange: dateRange || { startDate: null, endDate: null },
        };
      } catch (error: any) {
        logger.error('Error in aiAgentMetrics query:', error);
        throw error;
      }
    },
  },

  Mutation: {
    /**
     * Register new AI agent
     */
    registerAIAgent: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const startTime = Date.now();
        
        logger.info('GraphQL Mutation: registerAIAgent', { 
          id: input.id, 
          type: input.type 
        });
        
        // Validate required fields
        if (!input.id || !input.name || !input.type || !input.modelProvider || !input.modelName) {
          throw new Error('Missing required fields for agent registration');
        }

        const agent = await registerAIAgent(input);
        
        // Log operation
        await logAIOperation('register', agent.id, {
          type: agent.type,
          modelProvider: agent.modelProvider,
          source: 'graphql',
          duration: Date.now() - startTime,
        });
        
        const responseTime = Date.now() - startTime;
        logger.info(`registerAIAgent mutation completed in ${responseTime}ms`);

        return agent;
      } catch (error: any) {
        logger.error('Error in registerAIAgent mutation:', error);
        throw error;
      }
    },

    /**
     * Update agent configuration
     */
    updateAIAgentConfig: async (
      _: any,
      { id, config }: { id: string; config: any },
      context: any
    ) => {
      try {
        const startTime = Date.now();
        
        logger.info(`GraphQL Mutation: updateAIAgentConfig(${id})`);
        
        if (!config) {
          throw new Error('Configuration is required');
        }

        const agent = await updateAIAgentConfig(id, { configuration: config });
        
        // Log operation
        await logAIOperation('update_config', id, {
          configKeys: Object.keys(config),
          source: 'graphql',
          duration: Date.now() - startTime,
        });
        
        const responseTime = Date.now() - startTime;
        logger.info(`updateAIAgentConfig mutation completed in ${responseTime}ms`);

        return agent;
      } catch (error: any) {
        logger.error('Error in updateAIAgentConfig mutation:', error);
        throw error;
      }
    },

    /**
     * Toggle agent active status
     */
    toggleAIAgent: async (
      _: any,
      { id, isActive }: { id: string; isActive: boolean },
      context: any
    ) => {
      try {
        const startTime = Date.now();
        
        logger.info(`GraphQL Mutation: toggleAIAgent(${id}, ${isActive})`);
        
        const agent = await toggleAIAgent(id, isActive);
        
        // Log operation
        await logAIOperation('toggle', id, {
          isActive,
          source: 'graphql',
          duration: Date.now() - startTime,
        });
        
        const responseTime = Date.now() - startTime;
        logger.info(`toggleAIAgent mutation completed in ${responseTime}ms`);

        return agent;
      } catch (error: any) {
        logger.error('Error in toggleAIAgent mutation:', error);
        throw error;
      }
    },

    /**
     * Reset agent state
     */
    resetAIAgent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const startTime = Date.now();
        
        logger.info(`GraphQL Mutation: resetAIAgent(${id})`);
        
        const agent = await resetAgentState(id);
        
        // Log operation
        await logAIOperation('reset', id, {
          source: 'graphql',
          duration: Date.now() - startTime,
        });
        
        const responseTime = Date.now() - startTime;
        logger.info(`resetAIAgent mutation completed in ${responseTime}ms`);

        return agent;
      } catch (error: any) {
        logger.error('Error in resetAIAgent mutation:', error);
        throw error;
      }
    },
  },

  // Custom scalar resolvers
  JSON: {
    __parseValue(value: any) {
      return value; // Value from the client input
    },
    __serialize(value: any) {
      return value; // Value sent to the client
    },
    __parseLiteral(ast: any) {
      if (ast.kind === 'StringValue') {
        return JSON.parse(ast.value);
      }
      return null;
    },
  },

  DateTime: {
    __parseValue(value: any) {
      return new Date(value); // Value from the client input
    },
    __serialize(value: any) {
      return value instanceof Date ? value.toISOString() : value; // Value sent to the client
    },
    __parseLiteral(ast: any) {
      if (ast.kind === 'StringValue') {
        return new Date(ast.value);
      }
      return null;
    },
  },
};

// ==================== EXPORT ====================

export default {
  typeDefs: aiAgentTypeDefs,
  resolvers: aiAgentResolvers,
};
