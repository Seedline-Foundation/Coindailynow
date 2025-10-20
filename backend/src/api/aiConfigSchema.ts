/**
 * AI Configuration GraphQL Schema
 * Defines types, queries, and mutations for AI configuration management
 * 
 * Task 6.2: AI Configuration Management
 */

import { gql } from 'apollo-server-express';

export const aiConfigSchema = gql`
  # ==================== TYPES ====================
  
  type AgentConfiguration {
    id: ID!
    agentId: ID!
    temperature: Float!
    maxTokens: Int!
    topP: Float!
    frequencyPenalty: Float!
    presencePenalty: Float!
    modelProvider: String!
    modelName: String!
    capabilities: AgentCapabilities!
    timeout: Int!
    maxRetries: Int!
    retryDelay: Int!
    abTesting: ABTestingConfig
    customSettings: JSON
    updatedAt: DateTime!
    updatedBy: String
  }
  
  type AgentCapabilities {
    textGeneration: Boolean!
    imageGeneration: Boolean!
    translation: Boolean!
    analysis: Boolean!
    moderation: Boolean!
  }
  
  type ABTestingConfig {
    enabled: Boolean!
    variant: String!
    trafficSplit: Float!
    testId: String
  }
  
  type WorkflowTemplate {
    id: ID!
    name: String!
    description: String
    stages: [WorkflowStage!]!
    qualityThresholds: QualityThresholds!
    timeout: Int!
    maxRetries: Int!
    retryDelay: Int!
    contentType: String
    isDefault: Boolean!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
  }
  
  type WorkflowStage {
    id: ID!
    name: String!
    agentType: String!
    order: Int!
    minQualityScore: Float!
    skipOnFailure: Boolean!
    timeout: Int!
    maxRetries: Int!
    dependsOn: [ID!]
  }
  
  type QualityThresholds {
    minimum: Float!
    autoApproval: Float!
    humanReview: Float!
  }
  
  type CostBudget {
    id: ID!
    agentId: ID
    dailyLimit: Float!
    weeklyLimit: Float!
    monthlyLimit: Float!
    dailyUsage: Float!
    weeklyUsage: Float!
    monthlyUsage: Float!
    alerts: [CostAlert!]!
    enforceHardLimit: Boolean!
    throttleAtPercent: Float!
    updatedAt: DateTime!
  }
  
  type CostAlert {
    id: ID!
    threshold: Float!
    channels: [String!]!
    recipients: [String!]!
    isTriggered: Boolean!
    lastTriggeredAt: DateTime
  }
  
  type QualityThresholdConfig {
    id: ID!
    stages: JSON!
    contentType: String
    criteria: QualityReviewCriteria!
    isActive: Boolean!
    updatedAt: DateTime!
  }
  
  type QualityReviewCriteria {
    grammar: QualityCriterion!
    relevance: QualityCriterion!
    accuracy: QualityCriterion!
    seoOptimization: QualityCriterion!
    readability: QualityCriterion!
    engagement: QualityCriterion!
    sentiment: QualityCriterion!
  }
  
  type QualityCriterion {
    weight: Float!
    minScore: Float!
  }
  
  type BudgetCheckResult {
    agentId: ID!
    exceeded: Boolean!
    timestamp: DateTime!
  }
  
  # ==================== INPUT TYPES ====================
  
  input UpdateAgentConfigInput {
    temperature: Float
    maxTokens: Int
    topP: Float
    frequencyPenalty: Float
    presencePenalty: Float
    modelProvider: String
    modelName: String
    capabilities: AgentCapabilitiesInput
    timeout: Int
    maxRetries: Int
    retryDelay: Int
    customSettings: JSON
  }
  
  input AgentCapabilitiesInput {
    textGeneration: Boolean
    imageGeneration: Boolean
    translation: Boolean
    analysis: Boolean
    moderation: Boolean
  }
  
  input EnableABTestingInput {
    variant: String!
    trafficSplit: Float!
    testId: String
  }
  
  input CreateWorkflowTemplateInput {
    name: String!
    description: String
    stages: [WorkflowStageInput!]!
    qualityThresholds: QualityThresholdsInput!
    timeout: Int!
    maxRetries: Int!
    retryDelay: Int!
    contentType: String
    isDefault: Boolean!
    isActive: Boolean!
  }
  
  input UpdateWorkflowTemplateInput {
    name: String
    description: String
    stages: [WorkflowStageInput!]
    qualityThresholds: QualityThresholdsInput
    timeout: Int
    maxRetries: Int
    retryDelay: Int
    isActive: Boolean
  }
  
  input WorkflowStageInput {
    id: ID
    name: String!
    agentType: String!
    order: Int!
    minQualityScore: Float!
    skipOnFailure: Boolean!
    timeout: Int!
    maxRetries: Int!
    dependsOn: [ID!]
  }
  
  input QualityThresholdsInput {
    minimum: Float!
    autoApproval: Float!
    humanReview: Float!
  }
  
  input UpdateCostBudgetInput {
    id: ID!
    agentId: ID
    dailyLimit: Float
    weeklyLimit: Float
    monthlyLimit: Float
    alerts: [CostAlertInput!]
    enforceHardLimit: Boolean
    throttleAtPercent: Float
  }
  
  input CostAlertInput {
    id: ID
    threshold: Float!
    channels: [String!]!
    recipients: [String!]!
  }
  
  input UpsertQualityThresholdInput {
    id: ID!
    stages: JSON!
    contentType: String
    criteria: QualityReviewCriteriaInput!
    isActive: Boolean!
  }
  
  input QualityReviewCriteriaInput {
    grammar: QualityCriterionInput!
    relevance: QualityCriterionInput!
    accuracy: QualityCriterionInput!
    seoOptimization: QualityCriterionInput!
    readability: QualityCriterionInput!
    engagement: QualityCriterionInput!
    sentiment: QualityCriterionInput!
  }
  
  input QualityCriterionInput {
    weight: Float!
    minScore: Float!
  }
  
  input WorkflowTemplateFilter {
    isActive: Boolean
    contentType: String
  }
  
  # ==================== QUERIES ====================
  
  type Query {
    """Get agent configuration"""
    agentConfiguration(agentId: ID!): AgentConfiguration
    
    """Get workflow template"""
    workflowTemplate(id: ID!): WorkflowTemplate
    
    """List workflow templates"""
    workflowTemplates(filter: WorkflowTemplateFilter): [WorkflowTemplate!]!
    
    """Get cost budget"""
    costBudget(agentId: ID): CostBudget
    
    """Check if budget exceeded"""
    checkBudget(agentId: ID!): BudgetCheckResult!
    
    """Get quality threshold configuration"""
    qualityThresholdConfig(id: ID!): QualityThresholdConfig
  }
  
  # ==================== MUTATIONS ====================
  
  type Mutation {
    """Update agent configuration"""
    updateAgentConfiguration(
      agentId: ID!
      input: UpdateAgentConfigInput!
    ): AgentConfiguration!
    
    """Enable A/B testing for an agent"""
    enableABTesting(
      agentId: ID!
      input: EnableABTestingInput!
    ): AgentConfiguration!
    
    """Disable A/B testing for an agent"""
    disableABTesting(agentId: ID!): AgentConfiguration!
    
    """Create workflow template"""
    createWorkflowTemplate(
      input: CreateWorkflowTemplateInput!
    ): WorkflowTemplate!
    
    """Update workflow template"""
    updateWorkflowTemplate(
      id: ID!
      input: UpdateWorkflowTemplateInput!
    ): WorkflowTemplate!
    
    """Delete workflow template"""
    deleteWorkflowTemplate(id: ID!): Boolean!
    
    """Update cost budget"""
    updateCostBudget(input: UpdateCostBudgetInput!): CostBudget!
    
    """Upsert quality threshold configuration"""
    upsertQualityThreshold(
      input: UpsertQualityThresholdInput!
    ): QualityThresholdConfig!
  }
  
  # ==================== SUBSCRIPTIONS ====================
  
  type Subscription {
    """Subscribe to configuration changes"""
    configurationChanged(agentId: ID): ConfigurationChangeEvent!
    
    """Subscribe to budget alerts"""
    budgetAlert(agentId: ID): BudgetAlertEvent!
  }
  
  type ConfigurationChangeEvent {
    type: String!
    agentId: ID
    config: JSON!
    updatedBy: String
    timestamp: DateTime!
  }
  
  type BudgetAlertEvent {
    agentId: ID
    alert: CostAlert!
    currentUsage: BudgetUsage!
    limits: BudgetLimits!
    timestamp: DateTime!
  }
  
  type BudgetUsage {
    daily: Float!
    weekly: Float!
    monthly: Float!
  }
  
  type BudgetLimits {
    daily: Float!
    weekly: Float!
    monthly: Float!
  }
  
  # ==================== CUSTOM SCALARS ====================
  
  scalar DateTime
  scalar JSON
`;

export default aiConfigSchema;
