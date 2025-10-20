# Developer Documentation - Quick Reference

## CoinDaily AI System Quick Reference Guide

Essential commands, common patterns, and troubleshooting for developers.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Common API Calls](#common-api-calls)
3. [GraphQL Queries](#graphql-queries)
4. [WebSocket Events](#websocket-events)
5. [Authentication](#authentication)
6. [Error Codes](#error-codes)
7. [Performance Tips](#performance-tips)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/coindaily-platform.git
cd coindaily-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# Setup database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Project Structure

```
backend/
├── src/
│   ├── api/           # REST & GraphQL routes
│   ├── services/      # Business logic
│   ├── agents/        # AI agent implementations
│   ├── middleware/    # Auth, validation, etc.
│   └── utils/         # Helper functions
├── prisma/            # Database schema
└── tests/             # Test suites

frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Next.js pages
│   ├── services/      # API clients
│   └── hooks/         # Custom hooks
└── tests/             # Frontend tests
```

---

## Common API Calls

### REST API

#### List AI Agents
```bash
curl -X GET https://api.coindaily.com/api/ai/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create AI Task
```bash
curl -X POST https://api.coindaily.com/api/ai/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-123",
    "type": "content_generation",
    "priority": "high",
    "inputData": {
      "topic": "Bitcoin ETF"
    }
  }'
```

#### Get Market Sentiment
```bash
curl -X GET "https://api.coindaily.com/api/ai/market/sentiment?tokens=BTC,ETH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Start Content Pipeline
```bash
curl -X POST https://api.coindaily.com/api/ai/content-pipeline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Ethereum Upgrade",
    "category": "technology",
    "priority": "breaking",
    "autoPublish": false,
    "languages": ["en", "sw", "ha"]
  }'
```

#### Get Cost Overview
```bash
curl -X GET "https://api.coindaily.com/api/ai/costs/overview?period=day" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## GraphQL Queries

### Get Active Agents
```graphql
query GetActiveAgents {
  aiAgents(status: ACTIVE) {
    id
    name
    type
    model
    metrics {
      successRate
      avgResponseTime
      totalCost
    }
  }
}
```

### Create and Monitor Task
```graphql
# Create task
mutation CreateTask {
  createAITask(input: {
    agentId: "agent-123"
    type: "article_generation"
    priority: HIGH
    inputData: {
      topic: "Bitcoin Price Analysis"
    }
  }) {
    id
    status
  }
}

# Subscribe to updates
subscription WatchTask($taskId: ID!) {
  taskStatusChanged(taskId: $taskId) {
    id
    status
    qualityScore
    outputData
  }
}
```

### Market Sentiment
```graphql
query GetSentiment {
  marketSentiment(tokens: ["BTC", "ETH"]) {
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
  
  trendingMemecoins(limit: 10) {
    token
    rank
    sentimentScore
    priceChange24h
  }
}
```

---

## WebSocket Events

### Connect to WebSocket
```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.coindaily.com', {
  path: '/ws',
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected');
});
```

### Subscribe to Market Updates
```javascript
// Subscribe
socket.emit('subscribe_market_sentiment', {
  tokens: ['BTC', 'ETH', 'SOL']
});

// Listen for updates
socket.on('market_sentiment_update', (data) => {
  console.log('Sentiment:', data);
  // { token: 'BTC', sentiment: 'bullish', score: 0.75, ... }
});

// Unsubscribe
socket.emit('unsubscribe_market_sentiment');
```

### Monitor Task Progress
```javascript
socket.emit('subscribe_task_updates', {
  taskId: 'task-123'
});

socket.on('task_status_update', (data) => {
  console.log('Task:', data.status);
  if (data.status === 'completed') {
    console.log('Result:', data.outputData);
  }
});
```

### Budget Alerts
```javascript
socket.emit('subscribe_budget_alerts', {
  agentId: 'agent-123' // optional
});

socket.on('budget_alert', (alert) => {
  console.warn('Budget alert:', alert.message);
  // Alert at 80%, 90%, 100% thresholds
});
```

---

## Authentication

### Get JWT Token
```bash
curl -X POST https://api.coindaily.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

### Refresh Token
```bash
curl -X POST https://api.coindaily.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

### Generate API Key
```bash
curl -X POST https://api.coindaily.com/api/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "permissions": ["read:agents", "write:tasks"],
    "expires_at": "2026-01-01T00:00:00Z"
  }'
```

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `UNAUTHENTICATED` | Missing/invalid token | Refresh or re-authenticate |
| `FORBIDDEN` | Insufficient permissions | Check user role/permissions |
| `NOT_FOUND` | Resource not found | Verify ID is correct |
| `VALIDATION_ERROR` | Invalid input | Check request body schema |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait for retry-after period |
| `BUDGET_EXCEEDED` | Cost budget reached | Increase budget or wait for reset |
| `AGENT_UNAVAILABLE` | Agent is down | Try different agent or wait |
| `TASK_TIMEOUT` | Task took too long | Retry with smaller input |

---

## Performance Tips

### 1. Use Caching
```typescript
// Check cache before API call
const cacheKey = `market_sentiment:${token}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// Make API call and cache
const result = await fetchSentiment(token);
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min
```

### 2. Batch Requests
```typescript
// ❌ Bad: Multiple requests
for (const token of tokens) {
  await getSentiment(token);
}

// ✅ Good: Single batched request
const sentiments = await getSentiments(tokens);
```

### 3. Use GraphQL Field Selection
```graphql
# ❌ Bad: Request all fields
query {
  aiAgents {
    id name type status model provider config metrics
    createdAt updatedAt
  }
}

# ✅ Good: Request only needed fields
query {
  aiAgents {
    id
    name
    metrics {
      successRate
    }
  }
}
```

### 4. Implement Pagination
```typescript
// ❌ Bad: Load all data
const tasks = await prisma.aITask.findMany();

// ✅ Good: Paginate
const tasks = await prisma.aITask.findMany({
  take: 20,
  skip: (page - 1) * 20
});
```

### 5. Use Subscriptions for Real-time Data
```typescript
// ❌ Bad: Polling
setInterval(() => {
  fetch('/api/ai/market/sentiment');
}, 1000);

// ✅ Good: WebSocket subscription
socket.on('market_sentiment_update', handleUpdate);
```

---

## Troubleshooting

### Agent Not Responding

```bash
# Check agent status
curl https://api.coindaily.com/api/ai/agents/{agentId}

# Check agent health
curl https://api.coindaily.com/api/ai/agents/{agentId}/health

# Restart agent (admin only)
curl -X POST https://api.coindaily.com/api/ai/agents/{agentId}/restart \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### High Response Times

```typescript
// Check cache hit rate
const stats = await redis.info('stats');
console.log('Cache hit rate:', stats.keyspace_hits / stats.keyspace_misses);

// Monitor slow queries
await prisma.$queryRaw`
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
`;
```

### Budget Exceeded

```bash
# Check current spend
curl https://api.coindaily.com/api/ai/costs/overview?period=day

# Check budget limits
curl https://api.coindaily.com/api/ai/costs/budget

# Increase budget (admin only)
curl -X PUT https://api.coindaily.com/api/ai/costs/budget/{budgetId} \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"amount": 2000}'
```

### Task Stuck in Queue

```bash
# Check task status
curl https://api.coindaily.com/api/ai/tasks/{taskId}

# Cancel and retry
curl -X POST https://api.coindaily.com/api/ai/tasks/{taskId}/cancel
curl -X POST https://api.coindaily.com/api/ai/tasks/{taskId}/retry
```

### WebSocket Connection Issues

```javascript
// Enable debug logging
localStorage.debug = 'socket.io-client:*';

// Check connection status
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  
  if (error.message === 'Authentication failed') {
    // Refresh token
    refreshAuthToken();
  }
});

// Manual reconnection
socket.disconnect();
socket.connect();
```

---

## Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Run specific test file
npm test -- agents/contentAgent.test.ts

# Database commands
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Apply migrations
npx prisma studio            # Open database GUI
npx prisma generate          # Generate Prisma client

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Build for production
npm run build

# Start production server
npm start

# Docker commands
docker-compose up -d          # Start all services
docker-compose logs -f api    # View API logs
docker-compose restart api    # Restart API service
docker-compose down           # Stop all services
```

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/coindaily
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
GROK_API_KEY=...
GEMINI_API_KEY=...

# Optional
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
CACHE_TTL=3600
MAX_RETRIES=3
RATE_LIMIT=100
```

---

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# API shortcuts
alias cdapi='curl -H "Authorization: Bearer $CD_TOKEN"'
alias cdgql='curl -X POST -H "Authorization: Bearer $CD_TOKEN" -H "Content-Type: application/json" https://api.coindaily.com/graphql'

# Docker shortcuts
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'

# Database shortcuts
alias dbmigrate='npx prisma migrate dev'
alias dbstudio='npx prisma studio'

# Test shortcuts
alias testwatch='npm run test:watch'
alias testcov='npm run test:coverage'
```

---

## Common Patterns

### Error Handling
```typescript
try {
  const result = await aiAgent.execute(task);
  return { data: result, error: null };
} catch (error) {
  if (error instanceof ValidationError) {
    return { data: null, error: { code: 'VALIDATION_ERROR', message: error.message } };
  } else if (error instanceof AuthError) {
    return { data: null, error: { code: 'UNAUTHENTICATED', message: 'Invalid token' } };
  } else {
    return { data: null, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } };
  }
}
```

### Retry Logic
```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### Rate Limiting
```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

---

## Resources

- **API Documentation**: https://docs.coindaily.com/api
- **GraphQL Playground**: https://api.coindaily.com/graphql
- **Status Page**: https://status.coindaily.com
- **Support**: api@coindaily.com
- **GitHub**: https://github.com/your-org/coindaily-platform

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
