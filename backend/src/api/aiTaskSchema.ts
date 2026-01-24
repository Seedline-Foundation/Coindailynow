/**
 * AI Task GraphQL Schema Definitions
 * Defines types, queries, mutations, and subscriptions for AI task management
 */

export const aiTaskTypeDefs = `
  # ==================== ENUMS ====================

  enum TaskStatus {
    QUEUED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
    TIMEOUT
  }

  enum TaskPriority {
    URGENT
    HIGH
    NORMAL
    LOW
  }

  enum QueueHealth {
    healthy
    warning
    critical
  }

  # ==================== INPUT TYPES ====================

  input CreateAITaskInput {
    agentId: ID!
    taskType: String!
    inputData: JSON
    priority: TaskPriority
    estimatedCost: Float
    maxRetries: Int
    scheduledAt: DateTime
    timeoutMs: Int
    workflowStepId: ID
  }

  input AITaskFilter {
    status: TaskStatus
    statuses: [TaskStatus!]
    priority: TaskPriority
    priorities: [TaskPriority!]
    agentId: ID
    taskType: String
    startDate: DateTime
    endDate: DateTime
  }

  input PaginationInput {
    page: Int
    limit: Int
    sortBy: String
    sortOrder: String
  }

  input TaskMetricsInput {
    actualCost: Float
    processingTimeMs: Int
    qualityScore: Float
  }

  # ==================== OBJECT TYPES ====================

  type AITask {
    id: ID!
    agentId: ID!
    agent: AIAgent
    taskType: String!
    inputData: JSON
    outputData: JSON
    status: TaskStatus!
    priority: TaskPriority!
    estimatedCost: Float!
    actualCost: Float
    processingTimeMs: Int
    waitTimeMs: Int
    qualityScore: Float
    errorMessage: String
    retryCount: Int!
    maxRetries: Int!
    scheduledAt: DateTime
    startedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    workflowStepId: ID
    workflowStep: WorkflowStep
    isRetryable: Boolean!
    canBeCancelled: Boolean!
  }

  type AITaskConnection {
    tasks: [AITask!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  type TaskQueueStatus {
    totalTasks: Int!
    queuedTasks: Int!
    processingTasks: Int!
    completedTasks: Int!
    failedTasks: Int!
    averageWaitTime: Float!
    averageProcessingTime: Float!
    queueHealth: QueueHealth!
  }

  type TaskStatistics {
    totalTasks: Int!
    completedTasks: Int!
    failedTasks: Int!
    cancelledTasks: Int!
    successRate: Float!
    totalCost: Float!
    averageCost: Float!
    averageProcessingTime: Float!
    averageQuality: Float!
  }

  type BatchTaskResult {
    created: [AITask!]!
    failed: [BatchTaskError!]!
    summary: BatchTaskSummary!
  }

  type BatchTaskError {
    input: JSON!
    error: String!
  }

  type BatchTaskSummary {
    total: Int!
    successful: Int!
    failed: Int!
  }

  type CleanupResult {
    success: Boolean!
    deletedCount: Int!
    message: String!
  }

  type TimeoutResult {
    success: Boolean!
    timedOutCount: Int!
    message: String!
  }

  # ==================== QUERIES ====================

  type Query {
    """
    Get a single AI task by ID
    """
    aiTask(id: ID!): AITask

    """
    List AI tasks with filtering and pagination
    """
    aiTasks(
      filter: AITaskFilter
      pagination: PaginationInput
    ): AITaskConnection!

    """
    Get current task queue status and metrics
    """
    taskQueueStatus: TaskQueueStatus!

    """
    Get task statistics and analytics
    """
    taskStatistics(filter: AITaskFilter): TaskStatistics!
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    """
    Create a new AI task
    """
    createAITask(input: CreateAITaskInput!): AITask!

    """
    Create multiple tasks in batch (max 100)
    """
    createAITasksBatch(inputs: [CreateAITaskInput!]!): BatchTaskResult!

    """
    Cancel a task (only for QUEUED or PROCESSING tasks)
    """
    cancelAITask(id: ID!): AITask!

    """
    Retry a failed task (if retries remaining)
    """
    retryAITask(id: ID!): AITask!

    """
    Start processing a task (for internal use by agents)
    """
    startTaskProcessing(id: ID!): AITask!

    """
    Complete a task with results (for internal use by agents)
    """
    completeTask(
      id: ID!
      outputData: JSON!
      metrics: TaskMetricsInput!
    ): AITask!

    """
    Mark task as failed (for internal use by agents)
    """
    failTask(id: ID!, errorMessage: String!): AITask!

    """
    Clean up old completed tasks (admin only)
    7-day retention policy
    """
    cleanupOldTasks: CleanupResult!

    """
    Timeout stale processing tasks (admin only)
    Default timeout: 1 hour
    """
    timeoutStaleTasks(timeoutMs: Int): TimeoutResult!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    """
    Subscribe to task status changes
    Optionally filter by specific taskId
    """
    aiTaskStatusChanged(taskId: ID): AITask!

    """
    Subscribe to task queue status updates
    Updated every 5 seconds
    """
    taskQueueUpdated: TaskQueueStatus!
  }

  # ==================== SCALAR TYPES ====================

  scalar DateTime
  scalar JSON
`;

export default aiTaskTypeDefs;
