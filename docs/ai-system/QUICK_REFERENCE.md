# AI Agent CRUD Operations - Quick Reference Guide

## 🚀 Quick Start

### 1. Register an Agent (REST)
```bash
curl -X POST http://localhost:3000/api/ai/agents \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-agent",
    "name": "My Agent",
    "type": "content_generation",
    "modelProvider": "openai",
    "modelName": "gpt-4-turbo"
  }'
```

### 2. List All Agents
```bash
curl http://localhost:3000/api/ai/agents
```

### 3. Get Agent Details
```bash
curl http://localhost:3000/api/ai/agents/content-generation-agent
```

### 4. Update Configuration
```bash
curl -X PUT http://localhost:3000/api/ai/agents/my-agent \
  -H "Content-Type: application/json" \
  -d '{
    "configuration": {
      "temperature": 0.8,
      "maxTokens": 5000
    }
  }'
```

### 5. Get Metrics
```bash
curl "http://localhost:3000/api/ai/agents/my-agent/metrics?startDate=2024-12-01&endDate=2024-12-15"
```

---

## 📊 GraphQL Queries

### Get Agent
```graphql
{
  aiAgent(id: "content-generation-agent") {
    id
    name
    type
    isActive
    performanceMetrics {
      totalTasks
      successRate
      averageResponseTime
    }
  }
}
```

### List Agents
```graphql
{
  aiAgents(filter: { isActive: true }) {
    id
    name
    type
    performanceMetrics {
      successRate
      totalTasks
    }
  }
}
```

### Register Agent
```graphql
mutation {
  registerAIAgent(input: {
    id: "new-agent"
    name: "New Agent"
    type: "content_generation"
    modelProvider: "openai"
    modelName: "gpt-4"
  }) {
    id
    name
    isActive
  }
}
```

---

## 🔧 TypeScript Usage

### Import Functions
```typescript
import {
  registerAIAgent,
  getAIAgentById,
  getAllAIAgents,
  updateAIAgentConfig,
  getAIAgentMetrics,
} from './services/aiAgentService';
```

### Register Agent
```typescript
const agent = await registerAIAgent({
  id: 'my-agent',
  name: 'My Agent',
  type: 'content_generation',
  modelProvider: 'openai',
  modelName: 'gpt-4-turbo',
  configuration: {
    temperature: 0.7,
    maxTokens: 4000,
  },
});
```

### Get Agent
```typescript
const agent = await getAIAgentById('my-agent');
console.log(agent.performanceMetrics);
```

### Update Config
```typescript
const updated = await updateAIAgentConfig('my-agent', {
  configuration: {
    temperature: 0.8,
    maxTokens: 5000,
  },
});
```

### Get Metrics
```typescript
const metrics = await getAIAgentMetrics('my-agent', {
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-15'),
});

console.log(`Success Rate: ${metrics.successRate}%`);
console.log(`Avg Response Time: ${metrics.averageResponseTime}ms`);
```

---

## 🔄 Integration with Orchestrator

### Register All Agents on Startup
```typescript
import { registerAllAgentsOnStartup } from './services/aiOrchestratorIntegration';

async function initializeApp() {
  await registerAllAgentsOnStartup();
  console.log('All agents registered');
}
```

### Create and Track Task
```typescript
import { 
  createAITask, 
  updateAITaskStatus 
} from './services/aiOrchestratorIntegration';

// Create task
const task = await createAITask({
  id: 'task-123',
  agentId: 'content-generation-agent',
  taskType: 'article_generation',
  inputData: { title: 'Bitcoin News' },
  estimatedCost: 0.05,
});

// Update status
await updateAITaskStatus('task-123', 'PROCESSING');

// Complete
await updateAITaskStatus('task-123', 'COMPLETED', {
  outputData: { content: '...' },
  actualCost: 0.048,
  processingTimeMs: 3420,
  qualityScore: 0.92,
});
```

---

## 📋 Available Agents

| Agent ID | Name | Type | Provider | Model |
|----------|------|------|----------|-------|
| `content-generation-agent` | Content Generation | content_generation | openai | gpt-4-turbo |
| `market-analysis-agent` | Market Analysis | market_analysis | grok | grok-beta |
| `translation-agent` | Translation | translation | meta | nllb-200-3.3B |
| `image-generation-agent` | Image Generation | image_generation | openai | dall-e-3 |
| `quality-review-agent` | Quality Review | quality_review | google | gemini-pro |
| `sentiment-analysis-agent` | Sentiment Analysis | sentiment_analysis | openai | gpt-4-turbo |

---

## 🎯 Common Patterns

### Pattern 1: Check Agent Health Before Task
```typescript
const agent = await getAIAgentById('content-generation-agent');

if (!agent.isActive) {
  throw new Error('Agent is not active');
}

if (agent.performanceMetrics.successRate < 90) {
  console.warn('Agent success rate is below 90%');
}

// Proceed with task creation
```

### Pattern 2: Track Costs
```typescript
const metrics = await getAIAgentMetrics('content-generation-agent');

console.log(`Total Cost: $${metrics.totalCost.toFixed(2)}`);
console.log(`Average Cost per Task: $${metrics.averageCost.toFixed(4)}`);

if (metrics.totalCost > BUDGET_LIMIT) {
  await toggleAIAgent('content-generation-agent', false);
  console.log('Agent deactivated: budget exceeded');
}
```

### Pattern 3: Monitor Performance
```typescript
const agents = await getAllAIAgents({ isActive: true });

for (const agent of agents) {
  const metrics = agent.performanceMetrics;
  
  if (metrics.successRate < 95) {
    console.warn(`${agent.name}: Low success rate ${metrics.successRate}%`);
  }
  
  if (metrics.averageResponseTime > 5000) {
    console.warn(`${agent.name}: Slow response time ${metrics.averageResponseTime}ms`);
  }
}
```

---

## ⚡ Performance Tips

1. **Use Caching**: Most read operations are cached
2. **Filter Early**: Apply filters in queries, not in-memory
3. **Batch Operations**: Use batch endpoints for multiple agents
4. **Monitor Metrics**: Check metrics regularly to optimize
5. **Clean Up**: Old tasks are auto-cleaned after 7 days

---

## 🐛 Troubleshooting

### Agent Not Found
```typescript
// Always check if agent exists
const agent = await getAIAgentById('my-agent');
if (!agent) {
  console.error('Agent not found');
  // Register agent first
  await registerAIAgent({ ... });
}
```

### Metrics Not Updating
```typescript
// Ensure background task is running
import { startMetricsUpdateTask } from './services/aiAgentService';
startMetricsUpdateTask();
```

### Slow Response Times
```typescript
// Check cache hit rate
const metrics = await getAIAgentMetrics('my-agent');
// If cache miss rate is high, increase TTL or optimize queries
```

---

## 📞 Support

- **Documentation**: `/docs/ai-system/TASK_5.1_IMPLEMENTATION.md`
- **API Reference**: See implementation doc for full API details
- **Issues**: Check logs in `backend/logs/` directory

---

**Last Updated**: December 2024  
**Version**: 1.0
