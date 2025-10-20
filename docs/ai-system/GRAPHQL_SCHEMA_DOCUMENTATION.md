# GraphQL Schema Documentation

## CoinDaily AI System GraphQL API

Complete GraphQL API documentation for the CoinDaily AI System, including all queries, mutations, subscriptions, and type definitions.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Type Definitions](#type-definitions)
4. [Queries](#queries)
5. [Mutations](#mutations)
6. [Subscriptions](#subscriptions)
7. [Error Handling](#error-handling)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Overview

### Endpoint
```
https://api.coindaily.com/graphql
```

### GraphQL Playground (Development)
```
http://localhost:4000/graphql
```

### Features
- **Type Safety**: Strong typing with TypeScript
- **Real-time Updates**: Subscriptions for live data
- **Batching**: Automatic query batching
- **Caching**: Apollo Client caching support
- **Pagination**: Cursor-based and offset pagination
- **Field Selection**: Request only the data you need

---

## Authentication

Include JWT token in HTTP headers:

```http
Authorization: Bearer <your-jwt-token>
```

For subscriptions via WebSocket:
```javascript
{
  connectionParams: {
    authorization: 'Bearer <your-jwt-token>'
  }
}
```

---

## Type Definitions

### Scalar Types

```graphql
# Custom scalar types
scalar DateTime
scalar JSON
scalar Upload
```

### Enums

```graphql
enum AgentType {
  CONTENT_GENERATION
  TRANSLATION
  IMAGE_GENERATION
  QUALITY_REVIEW
  MARKET_ANALYSIS
  SENTIMENT_ANALYSIS
  MODERATION
  SEO_OPTIMIZATION
}

enum AgentStatus {
  ACTIVE
  INACTIVE
  ERROR
  MAINTENANCE
}

enum TaskStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum TaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum PipelineStatus {
  PENDING
  RESEARCH
  WRITING
  REVIEW
  TRANSLATION
  IMAGE_GENERATION
  SEO_OPTIMIZATION
  COMPLETED
  FAILED
}

enum SentimentType {
  VERY_BULLISH
  BULLISH
  NEUTRAL
  BEARISH
  VERY_BEARISH
}

enum Platform {
  TWITTER
  FACEBOOK
  INSTAGRAM
  LINKEDIN
}

enum BudgetPeriod {
  DAILY
  WEEKLY
  MONTHLY
}

enum ViolationSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum PenaltyLevel {
  SHADOW_BAN
  OUTRIGHT_BAN
  OFFICIAL_BAN
}
```

### Core Types

```graphql
# AI Agent
type AIAgent {
  id: ID!
  name: String!
  type: AgentType!
  status: AgentStatus!
  model: String!
  provider: String!
  config: JSON
  metrics: AgentMetrics
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AgentMetrics {
  successRate: Float!
  avgResponseTime: Float!
  totalTasks: Int!
  failedTasks: Int!
  totalCost: Float!
  avgQualityScore: Float!
}

# AI Task
type AITask {
  id: ID!
  agentId: ID!
  agent: AIAgent!
  type: String!
  status: TaskStatus!
  priority: TaskPriority!
  inputData: JSON!
  outputData: JSON
  metadata: JSON
  qualityScore: Float
  cost: Float
  retryCount: Int!
  maxRetries: Int!
  errorMessage: String
  createdAt: DateTime!
  startedAt: DateTime
  completedAt: DateTime
  duration: Int # milliseconds
}

# Content Pipeline
type ContentPipeline {
  id: ID!
  articleId: ID!
  article: Article
  status: PipelineStatus!
  stages: [PipelineStage!]!
  metadata: JSON
  createdAt: DateTime!
  completedAt: DateTime
  totalDuration: Int # milliseconds
}

type PipelineStage {
  name: String!
  status: String!
  startedAt: DateTime
  completedAt: DateTime
  duration: Int # milliseconds
  result: JSON
}

# Market Sentiment
type MarketSentiment {
  token: String!
  sentiment: SentimentType!
  score: Float! # -1 to 1
  confidence: Float! # 0 to 1
  sources: SentimentSources!
  trendingRank: Int
  priceChange24h: Float
  volume24h: Float
  updatedAt: DateTime!
}

type SentimentSources {
  social: Float!
  news: Float!
  whale: Float!
  technical: Float!
}

# Trending Memecoin
type TrendingMemecoin {
  token: String!
  rank: Int!
  sentimentScore: Float!
  volume24h: Float!
  priceChange24h: Float!
  trendingScore: Float!
  marketCap: Float
  exchanges: [String!]!
}

# Social Media Post
type SocialMediaPost {
  id: ID!
  articleId: ID!
  platform: Platform!
  content: String!
  status: String!
  scheduledTime: DateTime
  postedAt: DateTime
  engagement: PostEngagement
  metadata: JSON
}

type PostEngagement {
  likes: Int!
  shares: Int!
  comments: Int!
  clicks: Int!
  impressions: Int!
  engagementRate: Float!
}

type EngagementPrediction {
  platform: Platform!
  predictedLikes: Int!
  predictedShares: Int!
  predictedComments: Int!
  viralityScore: Float! # 0-100
  confidence: Float! # 0-1
  optimalPostTime: DateTime!
}

# Search Results
type SearchResult {
  id: ID!
  title: String!
  excerpt: String!
  url: String!
  relevanceScore: Float!
  qualityScore: Float!
  publishedAt: DateTime!
  category: String
  tags: [String!]!
}

type SearchSuggestion {
  query: String!
  source: String! # 'ai', 'analytics', 'tags'
  score: Float!
}

# Moderation
type ViolationReport {
  id: ID!
  userId: ID!
  contentType: String!
  contentId: ID!
  violationType: String!
  severity: ViolationSeverity!
  confidence: Float!
  status: String!
  aiReasoning: String!
  reviewedBy: ID
  reviewedAt: DateTime
  penaltyApplied: PenaltyLevel
  createdAt: DateTime!
}

type UserPenalty {
  id: ID!
  userId: ID!
  level: PenaltyLevel!
  reason: String!
  startDate: DateTime!
  endDate: DateTime
  isActive: Boolean!
}

type UserReputation {
  userId: ID!
  score: Float! # 0-100
  violationCount: Int!
  falsePositiveCount: Int!
  totalContent: Int!
  lastViolation: DateTime
}

# Audit Logs
type AuditLog {
  id: ID!
  agentId: ID
  agent: AIAgent
  eventType: String!
  eventData: JSON!
  userId: ID
  ipAddress: String
  userAgent: String
  timestamp: DateTime!
  metadata: JSON
}

type DecisionLog {
  id: ID!
  auditLogId: ID!
  decision: String!
  reasoning: String!
  confidence: Float!
  alternatives: [JSON!]
  rulesApplied: [String!]
  dataSources: [String!]
}

type ComplianceReport {
  id: ID!
  title: String!
  format: String!
  startDate: DateTime!
  endDate: DateTime!
  generatedAt: DateTime!
  downloadUrl: String!
  metadata: JSON
}

# Cost Tracking
type CostTracking {
  id: ID!
  agentId: ID!
  agent: AIAgent
  taskId: ID
  model: String!
  provider: String!
  inputTokens: Int!
  outputTokens: Int!
  cost: Float!
  metadata: JSON
  timestamp: DateTime!
}

type BudgetLimit {
  id: ID!
  agentId: ID
  agent: AIAgent
  amount: Float!
  period: BudgetPeriod!
  currentSpend: Float!
  remainingBudget: Float!
  alertThreshold: Float! # percentage
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type BudgetAlert {
  id: ID!
  budgetLimitId: ID!
  budgetLimit: BudgetLimit!
  thresholdReached: Float! # percentage
  message: String!
  resolved: Boolean!
  resolvedAt: DateTime
  createdAt: DateTime!
}

type CostForecast {
  period: String!
  predictedCost: Float!
  confidence: Float!
  trend: String! # 'increasing', 'stable', 'decreasing'
  recommendations: [String!]!
}

# Quality Validation
type ContentQualityValidation {
  articleId: ID!
  overallScore: Float! # 0-1
  seoScore: Float!
  grammarScore: Float!
  readabilityScore: Float!
  factCheckScore: Float!
  keywordRelevance: Float!
  metadataCompleteness: Float!
  issues: [String!]!
  recommendations: [String!]!
  validatedAt: DateTime!
}

type AgentPerformanceValidation {
  agentId: ID!
  successRate: Float!
  avgResponseTime: Float!
  avgQualityScore: Float!
  costEfficiency: Float!
  totalTasks: Int!
  failedTasks: Int!
  meetsThresholds: Boolean!
  issues: [String!]!
  recommendations: [String!]!
}

# Pagination
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  total: Int!
}

# Connection types for cursor-based pagination
type AIAgentConnection {
  edges: [AIAgentEdge!]!
  pageInfo: PageInfo!
}

type AIAgentEdge {
  cursor: String!
  node: AIAgent!
}

type AITaskConnection {
  edges: [AITaskEdge!]!
  pageInfo: PageInfo!
}

type AITaskEdge {
  cursor: String!
  node: AITask!
}
```

### Input Types

```graphql
input CreateAIAgentInput {
  name: String!
  type: AgentType!
  model: String!
  provider: String!
  config: JSON
}

input UpdateAIAgentInput {
  name: String
  status: AgentStatus
  config: JSON
}

input CreateAITaskInput {
  agentId: ID!
  type: String!
  priority: TaskPriority
  inputData: JSON!
  metadata: JSON
}

input StartContentPipelineInput {
  topic: String!
  category: String
  priority: String
  autoPublish: Boolean
  languages: [String!]
}

input GenerateSocialContentInput {
  articleId: ID!
  platform: Platform!
  customMessage: String
}

input CreateBudgetLimitInput {
  agentId: ID
  amount: Float!
  period: BudgetPeriod!
  alertThreshold: Float
}

input SearchInput {
  query: String!
  userId: ID
  language: String
  page: Int
  limit: Int
}

input ModerationInput {
  content: String!
  contentType: String!
  userId: ID!
}

input GenerateComplianceReportInput {
  startDate: DateTime!
  endDate: DateTime!
  format: String!
  includeDecisions: Boolean
  includeConsent: Boolean
}
```

---

## Queries

### AI Agents

```graphql
# Get all agents
aiAgents(
  page: Int
  limit: Int
  type: AgentType
  status: AgentStatus
): [AIAgent!]!

# Get agent by ID
aiAgent(id: ID!): AIAgent

# Get agent metrics
aiAgentMetrics(
  agentId: ID!
  period: String # 'hour', 'day', 'week', 'month'
): AgentMetrics!

# Get agents with cursor-based pagination
aiAgentsConnection(
  first: Int
  after: String
  type: AgentType
  status: AgentStatus
): AIAgentConnection!
```

**Example:**
```graphql
query GetContentAgents {
  aiAgents(type: CONTENT_GENERATION, status: ACTIVE) {
    id
    name
    model
    metrics {
      successRate
      avgResponseTime
      totalCost
    }
  }
}
```

### AI Tasks

```graphql
# Get all tasks
aiTasks(
  page: Int
  limit: Int
  status: TaskStatus
  agentId: ID
  priority: TaskPriority
): [AITask!]!

# Get task by ID
aiTask(id: ID!): AITask

# Get task statistics
aiTaskStats(
  agentId: ID
  period: String
): JSON!
```

**Example:**
```graphql
query GetActiveTasks {
  aiTasks(status: PROCESSING, limit: 10) {
    id
    type
    priority
    agent {
      name
      type
    }
    startedAt
    qualityScore
  }
}
```

### Content Pipeline

```graphql
# Get pipeline status
contentPipeline(id: ID!): ContentPipeline

# Get active pipelines
activeContentPipelines(limit: Int): [ContentPipeline!]!

# Get pipeline statistics
contentPipelineStats(period: String): JSON!
```

**Example:**
```graphql
query GetPipelineStatus($pipelineId: ID!) {
  contentPipeline(id: $pipelineId) {
    status
    stages {
      name
      status
      duration
    }
    article {
      title
      category
    }
    totalDuration
  }
}
```

### Market Insights

```graphql
# Get market sentiment
marketSentiment(tokens: [String!]!): [MarketSentiment!]!

# Get trending memecoins
trendingMemecoins(
  limit: Int
  timeframe: String # '1h', '4h', '24h', '7d'
): [TrendingMemecoin!]!

# Get whale activity
whaleActivity(
  token: String
  minAmount: Float
  limit: Int
): [JSON!]!

# Get market insights
marketInsights(token: String!): JSON!
```

**Example:**
```graphql
query GetBitcoinSentiment {
  marketSentiment(tokens: ["BTC"]) {
    token
    sentiment
    score
    confidence
    sources {
      social
      news
      whale
      technical
    }
  }
  
  trendingMemecoins(limit: 10, timeframe: "24h") {
    token
    rank
    sentimentScore
    priceChange24h
  }
}
```

### Social Media

```graphql
# Get social posts
socialMediaPosts(
  articleId: ID
  platform: Platform
  status: String
): [SocialMediaPost!]!

# Get engagement prediction
engagementPrediction(
  content: String!
  platform: Platform!
  postTime: DateTime
): EngagementPrediction!

# Get analytics
socialMediaAnalytics(
  period: String
  platform: Platform
): JSON!
```

**Example:**
```graphql
query GetSocialAnalytics {
  socialMediaPosts(platform: TWITTER, status: "posted") {
    id
    content
    postedAt
    engagement {
      likes
      shares
      comments
      engagementRate
    }
  }
  
  socialMediaAnalytics(period: "week", platform: TWITTER)
}
```

### Search

```graphql
# AI-enhanced search
searchAIEnhanced(input: SearchInput!): [SearchResult!]!

# Get search suggestions
searchSuggestions(query: String!): [SearchSuggestion!]!

# Semantic search
searchSemantic(
  query: String!
  threshold: Float
  limit: Int
): [SearchResult!]!

# Search analytics
searchAnalytics(period: String): JSON!
```

**Example:**
```graphql
query SearchContent($query: String!) {
  searchAIEnhanced(input: {
    query: $query
    language: "en"
    limit: 20
  }) {
    id
    title
    excerpt
    relevanceScore
    qualityScore
    publishedAt
  }
  
  searchSuggestions(query: $query) {
    query
    source
    score
  }
}
```

### Moderation

```graphql
# Get moderation queue
moderationQueue(
  severity: ViolationSeverity
  status: String
  limit: Int
): [ViolationReport!]!

# Get violation report
violationReport(id: ID!): ViolationReport

# Get user penalties
userPenalties(userId: ID!): [UserPenalty!]!

# Get user reputation
userReputation(userId: ID!): UserReputation

# Get moderation metrics
moderationMetrics(period: String): JSON!
```

**Example:**
```graphql
query GetModerationQueue {
  moderationQueue(severity: HIGH, status: "pending", limit: 50) {
    id
    violationType
    severity
    confidence
    aiReasoning
    createdAt
  }
}
```

### Audit & Compliance

```graphql
# Get audit logs
auditLogs(
  agentId: ID
  eventType: String
  startDate: DateTime
  endDate: DateTime
  page: Int
  limit: Int
): [AuditLog!]!

# Get decision log
decisionLog(auditLogId: ID!): DecisionLog

# Get compliance reports
complianceReports(limit: Int): [ComplianceReport!]!

# Get audit statistics
auditStatistics(period: String): JSON!
```

**Example:**
```graphql
query GetRecentAuditLogs {
  auditLogs(
    eventType: "content_generation"
    limit: 20
  ) {
    id
    eventType
    agent {
      name
      type
    }
    timestamp
    eventData
  }
}
```

### Costs

```graphql
# Get cost overview
costOverview(
  period: String
  agentId: ID
): JSON!

# Get budget limits
budgetLimits(agentId: ID): [BudgetLimit!]!

# Get budget alerts
budgetAlerts(resolved: Boolean): [BudgetAlert!]!

# Get cost forecast
costForecast(days: Int): CostForecast!

# Get cost breakdown
costBreakdown(
  groupBy: String # 'agent', 'model', 'day'
  startDate: DateTime
  endDate: DateTime
): JSON!
```

**Example:**
```graphql
query GetCostAnalysis {
  costOverview(period: "month") {
    totalCost
    byAgent {
      agentId
      name
      cost
    }
  }
  
  budgetAlerts(resolved: false) {
    id
    budgetLimit {
      amount
      period
    }
    thresholdReached
    message
  }
  
  costForecast(days: 30) {
    predictedCost
    confidence
    trend
    recommendations
  }
}
```

### Quality Validation

```graphql
# Validate content quality
validateContentQuality(articleId: ID!): ContentQualityValidation!

# Validate agent performance
validateAgentPerformance(
  agentId: ID!
  period: String!
): AgentPerformanceValidation!

# Get quality reports
qualityReports(
  reportType: String
  startDate: DateTime
  endDate: DateTime
): JSON!

# Get quality trends
qualityTrends(
  metric: String
  days: Int
): JSON!
```

**Example:**
```graphql
query ValidateContent($articleId: ID!) {
  validateContentQuality(articleId: $articleId) {
    overallScore
    seoScore
    grammarScore
    readabilityScore
    issues
    recommendations
  }
}
```

### Analytics

```graphql
# Get system dashboard
aiSystemDashboard(period: String): JSON!

# Get performance analytics
performanceAnalytics(
  agentId: ID
  period: String
): JSON!

# Get system health
systemHealth: JSON!
```

**Example:**
```graphql
query GetDashboard {
  aiSystemDashboard(period: "day") {
    totalTasks
    successRate
    avgResponseTime
    totalCost
    activeAgents
  }
  
  systemHealth {
    status
    services {
      database
      redis
      aiAgents
    }
  }
}
```

---

## Mutations

### AI Agents

```graphql
# Create agent
createAIAgent(input: CreateAIAgentInput!): AIAgent!

# Update agent
updateAIAgent(id: ID!, input: UpdateAIAgentInput!): AIAgent!

# Delete agent
deleteAIAgent(id: ID!): Boolean!

# Restart agent
restartAIAgent(id: ID!): AIAgent!
```

**Example:**
```graphql
mutation CreateContentAgent {
  createAIAgent(input: {
    name: "GPT-4 Content Agent"
    type: CONTENT_GENERATION
    model: "gpt-4-turbo-preview"
    provider: "openai"
    config: {
      temperature: 0.7
      maxTokens: 2000
    }
  }) {
    id
    name
    status
  }
}
```

### AI Tasks

```graphql
# Create task
createAITask(input: CreateAITaskInput!): AITask!

# Cancel task
cancelAITask(id: ID!): AITask!

# Retry task
retryAITask(id: ID!): AITask!
```

**Example:**
```graphql
mutation CreateArticleTask($agentId: ID!) {
  createAITask(input: {
    agentId: $agentId
    type: "article_generation"
    priority: HIGH
    inputData: {
      topic: "Bitcoin ETF Approval"
      category: "regulation"
      targetLength: 1500
    }
  }) {
    id
    status
    createdAt
  }
}
```

### Content Pipeline

```graphql
# Start content pipeline
startContentPipeline(input: StartContentPipelineInput!): ContentPipeline!

# Cancel pipeline
cancelContentPipeline(id: ID!): ContentPipeline!
```

**Example:**
```graphql
mutation StartBreakingNewsPipeline {
  startContentPipeline(input: {
    topic: "Major Bitcoin Price Movement"
    category: "market"
    priority: "breaking"
    autoPublish: false
    languages: ["en", "sw", "ha"]
  }) {
    id
    status
    stages {
      name
      status
    }
  }
}
```

### Social Media

```graphql
# Auto-post to social platforms
autoPostSocial(
  articleId: ID!
  platforms: [Platform!]!
  scheduleTime: DateTime
): [SocialMediaPost!]!

# Generate social content
generateSocialContent(input: GenerateSocialContentInput!): String!
```

**Example:**
```graphql
mutation PostToSocial($articleId: ID!) {
  autoPostSocial(
    articleId: $articleId
    platforms: [TWITTER, FACEBOOK, LINKEDIN]
  ) {
    id
    platform
    content
    status
  }
}
```

### Moderation

```graphql
# Moderate content
moderateContent(input: ModerationInput!): ViolationReport

# Confirm violation
confirmViolation(
  id: ID!
  penaltyLevel: PenaltyLevel
  reason: String
): ViolationReport!

# Mark as false positive
markFalsePositive(
  id: ID!
  reason: String
): ViolationReport!
```

**Example:**
```graphql
mutation ModerateUserComment {
  moderateContent(input: {
    content: "User comment text here"
    contentType: "comment"
    userId: "user-123"
  }) {
    id
    violationType
    severity
    confidence
    aiReasoning
  }
}
```

### Audit & Compliance

```graphql
# Record human review
recordHumanReview(
  auditLogId: ID!
  reviewNotes: String!
): AuditLog!

# Generate compliance report
generateComplianceReport(input: GenerateComplianceReportInput!): ComplianceReport!

# Record user consent
recordUserConsent(
  userId: ID!
  consentType: String!
  granted: Boolean!
): JSON!

# Withdraw consent
withdrawUserConsent(
  userId: ID!
  consentType: String!
): JSON!
```

**Example:**
```graphql
mutation GenerateGDPRReport {
  generateComplianceReport(input: {
    startDate: "2025-01-01T00:00:00Z"
    endDate: "2025-12-31T23:59:59Z"
    format: "json"
    includeDecisions: true
    includeConsent: true
  }) {
    id
    title
    downloadUrl
    generatedAt
  }
}
```

### Costs

```graphql
# Track cost
trackCost(
  agentId: ID!
  taskId: ID
  model: String!
  provider: String!
  inputTokens: Int!
  outputTokens: Int!
  cost: Float!
): CostTracking!

# Create budget limit
createBudgetLimit(input: CreateBudgetLimitInput!): BudgetLimit!

# Update budget limit
updateBudgetLimit(
  id: ID!
  amount: Float
  isActive: Boolean
): BudgetLimit!

# Delete budget limit
deleteBudgetLimit(id: ID!): Boolean!

# Resolve budget alert
resolveBudgetAlert(id: ID!): BudgetAlert!
```

**Example:**
```graphql
mutation SetMonthlyBudget($agentId: ID!) {
  createBudgetLimit(input: {
    agentId: $agentId
    amount: 1000.00
    period: MONTHLY
    alertThreshold: 80
  }) {
    id
    amount
    period
    currentSpend
    remainingBudget
  }
}
```

---

## Subscriptions

Real-time updates via WebSocket connections.

```graphql
# Task status updates
taskStatusChanged(taskId: ID): AITask!

# Pipeline status updates
pipelineStatusChanged(pipelineId: ID): ContentPipeline!

# Market sentiment updates
marketSentimentUpdated(tokens: [String!]): MarketSentiment!

# Budget alerts
budgetAlertCreated: BudgetAlert!

# Moderation queue updates
moderationQueueUpdated: ViolationReport!

# System health updates
systemHealthChanged: JSON!
```

**Example:**
```graphql
subscription WatchTaskProgress($taskId: ID!) {
  taskStatusChanged(taskId: $taskId) {
    id
    status
    qualityScore
    completedAt
  }
}

subscription WatchMarketSentiment {
  marketSentimentUpdated(tokens: ["BTC", "ETH"]) {
    token
    sentiment
    score
    updatedAt
  }
}
```

**JavaScript Client Example:**
```javascript
import { ApolloClient, gql } from '@apollo/client';

const TASK_SUBSCRIPTION = gql`
  subscription OnTaskStatusChanged($taskId: ID!) {
    taskStatusChanged(taskId: $taskId) {
      id
      status
      qualityScore
    }
  }
`;

const subscription = client.subscribe({
  query: TASK_SUBSCRIPTION,
  variables: { taskId: 'task-123' }
}).subscribe({
  next: (data) => console.log('Task updated:', data),
  error: (error) => console.error('Error:', error)
});
```

---

## Error Handling

### Error Types

```graphql
type Error {
  message: String!
  code: String!
  path: [String!]
  extensions: JSON
}
```

### Common Error Codes

- `UNAUTHENTICATED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_SERVER_ERROR`: Server-side error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `BUDGET_EXCEEDED`: Cost budget reached

### Error Example

```json
{
  "errors": [
    {
      "message": "Agent not found",
      "code": "NOT_FOUND",
      "path": ["aiAgent"],
      "extensions": {
        "agentId": "invalid-id"
      }
    }
  ]
}
```

---

## Examples

### Complete Workflow Example

```graphql
# 1. Create an agent
mutation CreateAgent {
  createAIAgent(input: {
    name: "Content Writer"
    type: CONTENT_GENERATION
    model: "gpt-4-turbo-preview"
    provider: "openai"
  }) {
    id
    name
  }
}

# 2. Create a task
mutation CreateTask($agentId: ID!) {
  createAITask(input: {
    agentId: $agentId
    type: "article_generation"
    priority: HIGH
    inputData: {
      topic: "Ethereum 2.0 Update"
    }
  }) {
    id
    status
  }
}

# 3. Subscribe to task updates
subscription WatchTask($taskId: ID!) {
  taskStatusChanged(taskId: $taskId) {
    id
    status
    outputData
    qualityScore
  }
}

# 4. Get results
query GetTask($taskId: ID!) {
  aiTask(id: $taskId) {
    status
    outputData
    qualityScore
    cost
  }
}
```

### Batch Query Example

```graphql
query GetDashboardData {
  # Multiple queries in one request
  agents: aiAgents(status: ACTIVE) {
    id
    name
    metrics {
      successRate
    }
  }
  
  tasks: aiTasks(status: PROCESSING, limit: 10) {
    id
    type
    priority
  }
  
  costs: costOverview(period: "day")
  
  health: systemHealth
}
```

---

## Best Practices

### 1. Request Only Needed Fields

```graphql
# ✅ Good - Specific fields
query {
  aiAgents {
    id
    name
    status
  }
}

# ❌ Bad - All fields (not shown but implied)
```

### 2. Use Variables for Dynamic Values

```graphql
# ✅ Good
query GetAgent($id: ID!) {
  aiAgent(id: $id) {
    name
  }
}

# ❌ Bad
query {
  aiAgent(id: "hardcoded-id") {
    name
  }
}
```

### 3. Use Fragments for Reusable Fields

```graphql
fragment AgentFields on AIAgent {
  id
  name
  type
  status
  metrics {
    successRate
    avgResponseTime
  }
}

query {
  agent1: aiAgent(id: "1") {
    ...AgentFields
  }
  agent2: aiAgent(id: "2") {
    ...AgentFields
  }
}
```

### 4. Handle Errors Gracefully

```javascript
const result = await client.query({ query: GET_AGENTS });

if (result.errors) {
  result.errors.forEach(error => {
    console.error(error.message);
  });
}
```

### 5. Use Subscriptions for Real-time Data

```javascript
// For frequently changing data
const subscription = client.subscribe({
  query: MARKET_SENTIMENT_SUB
});

// Instead of polling
// ❌ setInterval(() => client.query(...), 1000);
```

### 6. Implement Caching

```javascript
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      AIAgent: {
        keyFields: ['id']
      }
    }
  })
});
```

### 7. Use Pagination for Large Datasets

```graphql
query GetTasks($page: Int!, $limit: Int!) {
  aiTasks(page: $page, limit: $limit) {
    id
    status
  }
}
```

---

## Performance Tips

1. **Batch Requests**: Combine multiple queries into one request
2. **Use Persisted Queries**: For production to reduce bandwidth
3. **Enable Compression**: Use gzip for large responses
4. **Implement DataLoader**: For N+1 query prevention
5. **Cache Aggressively**: Use Apollo Client cache effectively
6. **Limit Nesting**: Avoid deeply nested queries
7. **Use Connections**: For efficient pagination

---

## Additional Resources

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [CoinDaily API Support](mailto:api@coindaily.com)
- [GraphQL Playground](http://localhost:4000/graphql)

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
