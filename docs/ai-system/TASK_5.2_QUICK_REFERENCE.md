# AI Task Management System - Quick Reference

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install socket.io graphql-subscriptions
```

### 2. Integrate with Your App
```typescript
import { integrateAITaskSystem } from './integrations/aiTaskIntegration';

const app = express();
const httpServer = http.createServer(app);

await integrateAITaskSystem(app, httpServer);

httpServer.listen(4000);
```

### 3. Test the System
```bash
# Create a task
curl -X POST http://localhost:4000/api/ai/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent_123","taskType":"test","priority":"HIGH"}'

# Check queue status
curl http://localhost:4000/api/ai/tasks/queue/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 API Endpoints Cheat Sheet

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/tasks` | Create task |
| GET | `/api/ai/tasks` | List tasks |
| GET | `/api/ai/tasks/:id` | Get task |
| PUT | `/api/ai/tasks/:id/cancel` | Cancel task |
| GET | `/api/ai/tasks/:id/retry` | Retry task |
| GET | `/api/ai/tasks/queue/status` | Queue status |
| POST | `/api/ai/tasks/batch` | Batch create |
| GET | `/api/ai/tasks/statistics/summary` | Statistics |

## 🔌 WebSocket Events

### Subscribe
```typescript
socket.emit('subscribe:task', taskId);
socket.emit('subscribe:queue');
socket.emit('subscribe:agent', agentId);
```

### Listen
```typescript
socket.on('task:status', (data) => {});
socket.on('queue:update', (data) => {});
socket.on('task:failed', (data) => {});
```

## 💾 GraphQL Queries

```graphql
# List tasks
query {
  aiTasks(filter: {status: QUEUED}) {
    tasks { id status taskType }
  }
}

# Create task
mutation {
  createAITask(input: {
    agentId: "agent_123"
    taskType: "content_generation"
    priority: HIGH
  }) { id status }
}

# Subscribe
subscription {
  aiTaskStatusChanged { id status }
}
```

## 🔧 Common Operations

### Create Task Programmatically
```typescript
import * as aiTaskService from './services/aiTaskService';

const task = await aiTaskService.createAITask({
  agentId: 'agent_id',
  taskType: 'content_generation',
  inputData: { topic: 'Crypto news' },
  priority: 'HIGH'
});
```

### Check Queue Health
```typescript
const status = await aiTaskService.getTaskQueueStatus();
console.log(status.queueHealth); // 'healthy', 'warning', or 'critical'
```

### Get Statistics
```typescript
const stats = await aiTaskService.getTaskStatistics({
  agentId: 'agent_id',
  startDate: new Date('2024-01-01')
});
```

## 🎯 Task Priorities

- `URGENT` - Processed first
- `HIGH` - High priority
- `NORMAL` - Standard priority (default)
- `LOW` - Lowest priority

## 🔄 Task Statuses

- `QUEUED` - Waiting in queue
- `PROCESSING` - Currently executing
- `COMPLETED` - Successfully finished
- `FAILED` - Failed (may retry)
- `CANCELLED` - Manually cancelled
- `TIMEOUT` - Exceeded timeout

## ⚙️ Configuration

### Worker Settings
Edit `backend/src/workers/aiTaskWorker.ts`:
```typescript
const WORKER_CONFIG = {
  pollIntervalMs: 1000,        // Poll frequency
  concurrentTasks: 10,         // Max concurrent
  maintenanceIntervalMs: 3600000, // Maintenance
  taskTimeoutMs: 3600000,      // Task timeout
};
```

### Cache TTLs
Edit `backend/src/services/aiTaskService.ts`:
```typescript
const CACHE_TTL = {
  TASK: 60,           // 1 minute
  TASK_LIST: 30,      // 30 seconds
  QUEUE_STATUS: 5,    // 5 seconds
};
```

## 🚨 Troubleshooting

### Worker Not Running
```typescript
import { startTaskWorker } from './workers/aiTaskWorker';
await startTaskWorker();
```

### Clear Task Cache
```typescript
import { redisClient } from './config/redis';
await redisClient.del('ai:tasks:*');
```

### Manual Cleanup
```bash
curl -X POST http://localhost:4000/api/ai/tasks/cleanup/old \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:4000/api/ai/tasks/health
```

### Worker Stats
```typescript
import { getWorkerStats } from './workers/aiTaskWorker';
console.log(getWorkerStats());
```

### WebSocket Health
```typescript
import { getWebSocketHealth } from './services/websocket/aiTaskWebSocket';
console.log(getWebSocketHealth());
```

## 🔐 Security

### Authentication Required
All endpoints require JWT token:
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Admin-Only Operations
- Cleanup old tasks
- Timeout stale tasks

## 📈 Performance Tips

1. **Enable caching** - Redis cache reduces DB load by 75%
2. **Batch operations** - Use batch creation for multiple tasks
3. **Adjust concurrency** - Increase `concurrentTasks` for better throughput
4. **Monitor queue health** - Watch for 'warning' or 'critical' status
5. **Regular cleanup** - Run maintenance hourly

## 🎓 Best Practices

1. Set realistic `estimatedCost` for budget tracking
2. Use appropriate `priority` for time-sensitive tasks
3. Implement `timeoutMs` for long-running tasks
4. Monitor `retryCount` to detect persistent failures
5. Track `qualityScore` for AI output validation
6. Subscribe to WebSocket for real-time updates
7. Use batch creation for bulk operations

## 📚 Related Documentation

- Full Implementation: `TASK_5.2_IMPLEMENTATION.md`
- GraphQL Schema: `backend/src/api/aiTaskSchema.ts`
- Service API: `backend/src/services/aiTaskService.ts`
- REST API: `backend/src/api/ai-tasks.ts`

---

**Quick Reference Version:** 1.0  
**Last Updated:** December 2024
