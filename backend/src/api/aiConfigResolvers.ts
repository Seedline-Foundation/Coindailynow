/**
 * AI Configuration GraphQL Resolvers
 * Implements queries, mutations, and subscriptions for AI configuration management
 * 
 * Task 6.2: AI Configuration Management
 */

import { PubSub } from 'graphql-subscriptions';
import * as configService from '../services/aiConfigurationService';
import { logger } from '../utils/logger';

const pubsub = new PubSub();

// Subscribe to configuration change events
configService.onConfigurationChange((event: any) => {
  // Determine event type
  if (event.agentId && event.config) {
    pubsub.publish('CONFIGURATION_CHANGED', {
      configurationChanged: {
        type: 'agent_config',
        agentId: event.agentId,
        config: event.config,
        updatedBy: event.updatedBy,
        timestamp: event.timestamp,
      },
    });
  } else if (event.alert) {
    pubsub.publish('BUDGET_ALERT', {
      budgetAlert: event,
    });
  }
});

// ==================== RESOLVERS ====================

export const aiConfigResolvers = {
  // ==================== QUERIES ====================
  
  Query: {
    /**
     * Get agent configuration
     */
    agentConfiguration: async (_: any, { agentId }: { agentId: string }) => {
      try {
        return await configService.getAgentConfiguration(agentId);
      } catch (error) {
        logger.error('Error in agentConfiguration query:', error);
        throw error;
      }
    },
    
    /**
     * Get workflow template
     */
    workflowTemplate: async (_: any, { id }: { id: string }) => {
      try {
        return await configService.getWorkflowTemplate(id);
      } catch (error) {
        logger.error('Error in workflowTemplate query:', error);
        throw error;
      }
    },
    
    /**
     * List workflow templates
     */
    workflowTemplates: async (_: any, { filter }: { filter?: any }) => {
      try {
        return await configService.listWorkflowTemplates(filter);
      } catch (error) {
        logger.error('Error in workflowTemplates query:', error);
        throw error;
      }
    },
    
    /**
     * Get cost budget
     */
    costBudget: async (_: any, { agentId }: { agentId?: string }) => {
      try {
        return await configService.getCostBudget(agentId);
      } catch (error) {
        logger.error('Error in costBudget query:', error);
        throw error;
      }
    },
    
    /**
     * Check if budget exceeded
     */
    checkBudget: async (_: any, { agentId }: { agentId: string }) => {
      try {
        const exceeded = await configService.isBudgetExceeded(agentId);
        return {
          agentId,
          exceeded,
          timestamp: new Date(),
        };
      } catch (error) {
        logger.error('Error in checkBudget query:', error);
        throw error;
      }
    },
    
    /**
     * Get quality threshold configuration
     */
    qualityThresholdConfig: async (_: any, { id }: { id: string }) => {
      try {
        return await configService.getQualityThresholdConfig(id);
      } catch (error) {
        logger.error('Error in qualityThresholdConfig query:', error);
        throw error;
      }
    },
  },
  
  // ==================== MUTATIONS ====================
  
  Mutation: {
    /**
     * Update agent configuration
     */
    updateAgentConfiguration: async (
      _: any,
      { agentId, input }: { agentId: string; input: any },
      context: any
    ) => {
      try {
        const updatedBy = context.user?.id;
        return await configService.updateAgentConfiguration(agentId, input, updatedBy);
      } catch (error) {
        logger.error('Error in updateAgentConfiguration mutation:', error);
        throw error;
      }
    },
    
    /**
     * Enable A/B testing
     */
    enableABTesting: async (
      _: any,
      { agentId, input }: { agentId: string; input: any }
    ) => {
      try {
        const { variant, trafficSplit, testId } = input;
        return await configService.enableABTesting(agentId, variant, trafficSplit, testId);
      } catch (error) {
        logger.error('Error in enableABTesting mutation:', error);
        throw error;
      }
    },
    
    /**
     * Disable A/B testing
     */
    disableABTesting: async (_: any, { agentId }: { agentId: string }) => {
      try {
        return await configService.disableABTesting(agentId);
      } catch (error) {
        logger.error('Error in disableABTesting mutation:', error);
        throw error;
      }
    },
    
    /**
     * Create workflow template
     */
    createWorkflowTemplate: async (
      _: any,
      { input }: { input: any },
      context: any
    ) => {
      try {
        const createdBy = context.user?.id;
        return await configService.createWorkflowTemplate({
          ...input,
          createdBy,
        });
      } catch (error) {
        logger.error('Error in createWorkflowTemplate mutation:', error);
        throw error;
      }
    },
    
    /**
     * Update workflow template
     */
    updateWorkflowTemplate: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      try {
        return await configService.updateWorkflowTemplate(id, input);
      } catch (error) {
        logger.error('Error in updateWorkflowTemplate mutation:', error);
        throw error;
      }
    },
    
    /**
     * Delete workflow template
     */
    deleteWorkflowTemplate: async (_: any, { id }: { id: string }) => {
      try {
        await configService.deleteWorkflowTemplate(id);
        return true;
      } catch (error) {
        logger.error('Error in deleteWorkflowTemplate mutation:', error);
        throw error;
      }
    },
    
    /**
     * Update cost budget
     */
    updateCostBudget: async (_: any, { input }: { input: any }) => {
      try {
        return await configService.updateCostBudget(input);
      } catch (error) {
        logger.error('Error in updateCostBudget mutation:', error);
        throw error;
      }
    },
    
    /**
     * Upsert quality threshold configuration
     */
    upsertQualityThreshold: async (_: any, { input }: { input: any }) => {
      try {
        return await configService.upsertQualityThresholdConfig(input);
      } catch (error) {
        logger.error('Error in upsertQualityThreshold mutation:', error);
        throw error;
      }
    },
  },
  
  // ==================== SUBSCRIPTIONS ====================
  
  Subscription: {
    /**
     * Subscribe to configuration changes
     */
    configurationChanged: {
      subscribe: (_: any, { agentId }: { agentId?: string }) => {
        // TODO: Filter by agentId if provided
        return pubsub.asyncIterator(['CONFIGURATION_CHANGED']);
      },
    },
    
    /**
     * Subscribe to budget alerts
     */
    budgetAlert: {
      subscribe: (_: any, { agentId }: { agentId?: string }) => {
        // TODO: Filter by agentId if provided
        return pubsub.asyncIterator(['BUDGET_ALERT']);
      },
    },
  },
};

export default aiConfigResolvers;
