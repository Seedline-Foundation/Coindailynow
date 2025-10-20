# Task 5.1 Integration Checklist

Use this checklist to integrate the AI Agent CRUD Operations into your application.

## ✅ Pre-Integration Checklist

### Dependencies
- [ ] Node.js 18+ installed
- [ ] Redis installed and running
- [ ] Prisma CLI installed (`npm install -g prisma`)
- [ ] All npm dependencies installed (`npm install` in backend directory)

### Environment Setup
- [ ] `DATABASE_URL` configured in `.env`
- [ ] `REDIS_URL` configured in `.env`
- [ ] Database migrations applied (`npx prisma migrate dev`)
- [ ] Prisma client generated (`npx prisma generate`)

### Redis Verification
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### Database Verification
```bash
# Check if AIAgent table exists
npx prisma studio
# Navigate to AIAgent model - should see table structure
```

---

## 🔌 Integration Steps

### Step 1: Import REST API Routes ⏳

**File**: `backend/src/index.ts` (or your main app file)

```typescript
import aiAgentsRouter from './api/routes/ai-agents';

// Add this AFTER your Express app is created
app.use('/api/ai', aiAgentsRouter);
```

**Verification**:
```bash
curl http://localhost:3000/api/ai/agents
# Should return empty array or error if not registered yet
```

- [ ] Route imported
- [ ] Route registered with `/api/ai` prefix
- [ ] API responds to GET requests
- [ ] Error handling works

---

### Step 2: Register Agents on Startup ⏳

**File**: `backend/src/index.ts`

```typescript
import { registerAllAgentsOnStartup } from './services/aiOrchestratorIntegration';
import { startMetricsUpdateTask } from './services/aiAgentService';

async function startApplication() {
  try {
    // Register all AI agents
    console.log('Registering AI agents...');
    await registerAllAgentsOnStartup();
    console.log('✓ All agents registered');
    
    // Start background metrics updates
    startMetricsUpdateTask();
    console.log('✓ Metrics update task started');
    
    // Start your server
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();
```

**Verification**:
```bash
# Start the app and check console output
npm run dev

# Expected output:
# Registering AI agents...
# ✓ Registered: Content Generation Agent
# ✓ Registered: Market Analysis Agent
# ✓ Registered: Translation Agent
# ✓ Registered: Image Generation Agent
# ✓ Registered: Quality Review Agent
# ✓ Registered: Sentiment Analysis Agent
# Successfully registered 6/6 agents
# ✓ All agents registered
# ✓ Metrics update task started
# Server running on http://localhost:3000
```

- [ ] Agents registration function imported
- [ ] Function called before server starts
- [ ] All 6 agents registered successfully
- [ ] Background task started
- [ ] No errors in console

---

### Step 3: Verify Agents in Database ⏳

```bash
# Option 1: Using Prisma Studio
npx prisma studio
# Navigate to AIAgent model - should see 6 agents

# Option 2: Using API
curl http://localhost:3000/api/ai/agents
# Should return array of 6 agents

# Option 3: Using GraphQL (if integrated)
# Query: { aiAgents { id name type } }
```

**Expected Agents**:
1. content-generation-agent
2. market-analysis-agent
3. translation-agent
4. image-generation-agent
5. quality-review-agent
6. sentiment-analysis-agent

- [ ] All 6 agents visible in database
- [ ] Each agent has `isActive: true`
- [ ] Each agent has initial metrics (totalTasks: 0)
- [ ] createdAt and updatedAt timestamps present

---

### Step 4: Test REST API Endpoints ⏳

**Test 1: List Agents**
```bash
curl http://localhost:3000/api/ai/agents
```
- [ ] Returns 200 status
- [ ] Returns 6 agents
- [ ] Response time < 500ms

**Test 2: Get Single Agent**
```bash
curl http://localhost:3000/api/ai/agents/content-generation-agent
```
- [ ] Returns 200 status
- [ ] Returns agent details
- [ ] Response time < 500ms (first call)
- [ ] Response time < 100ms (second call - cached)

**Test 3: Update Configuration**
```bash
curl -X PUT http://localhost:3000/api/ai/agents/content-generation-agent \
  -H "Content-Type: application/json" \
  -d '{"configuration": {"temperature": 0.9}}'
```
- [ ] Returns 200 status
- [ ] Configuration updated
- [ ] Changes persist in database

**Test 4: Get Metrics**
```bash
curl http://localhost:3000/api/ai/agents/content-generation-agent/metrics
```
- [ ] Returns 200 status
- [ ] Returns performance metrics
- [ ] Metrics structure correct

**Test 5: Toggle Agent**
```bash
curl -X PATCH http://localhost:3000/api/ai/agents/content-generation-agent/toggle \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```
- [ ] Returns 200 status
- [ ] Agent deactivated
- [ ] Can be re-activated

---

### Step 5: Test GraphQL API (Optional) ⏳

**Prerequisites**: GraphQL server must be set up

**File**: Your GraphQL schema setup file

```typescript
import { aiAgentTypeDefs, aiAgentResolvers } from './api/resolvers/aiAgentResolvers';

const schema = makeExecutableSchema({
  typeDefs: [
    aiAgentTypeDefs,
    // ... other type defs
  ],
  resolvers: {
    ...aiAgentResolvers,
    // ... other resolvers
  },
});
```

**Test Query**:
```graphql
query {
  aiAgents {
    id
    name
    type
    isActive
  }
}
```

- [ ] GraphQL types registered
- [ ] Resolvers integrated
- [ ] Query returns agents
- [ ] Mutations work correctly

---

### Step 6: Verify Caching ⏳

**Test Cache Performance**:
```bash
# First request (uncached)
time curl http://localhost:3000/api/ai/agents/content-generation-agent

# Second request (cached)
time curl http://localhost:3000/api/ai/agents/content-generation-agent
```

**Check Redis**:
```bash
redis-cli
> KEYS ai:agent:*
# Should show cached agent keys

> TTL ai:agent:content-generation-agent
# Should show ~30 seconds remaining

> GET ai:agent:content-generation-agent
# Should show cached JSON data
```

- [ ] First request takes 100-200ms
- [ ] Second request takes < 50ms
- [ ] Data cached in Redis
- [ ] Cache expires after 30 seconds
- [ ] Cache invalidated on updates

---

### Step 7: Verify Background Tasks ⏳

**Metrics Update Task** (runs every 30 seconds):

```bash
# Check logs after 30 seconds
# Should see: "Metrics updated for X active agents"

# Or check database
npx prisma studio
# AIAgent.performanceMetrics.lastHealthCheck should update every 30s
```

- [ ] Background task running
- [ ] Metrics updated every 30 seconds
- [ ] No errors in console
- [ ] lastHealthCheck timestamp updates

---

### Step 8: Run Integration Tests ⏳

```bash
cd backend
npm test -- aiAgentCrud.integration.test.ts
```

**Expected Results**:
- [ ] All tests pass
- [ ] No errors or warnings
- [ ] Performance tests meet targets
- [ ] Test coverage satisfactory

---

## 🔍 Post-Integration Verification

### Functionality Checks
- [ ] Can register new agents via API
- [ ] Can list all agents
- [ ] Can get individual agent details
- [ ] Can update agent configuration
- [ ] Can toggle agent active status
- [ ] Can retrieve agent metrics
- [ ] Can reset agent state
- [ ] Batch operations work

### Performance Checks
- [ ] Cached requests < 100ms
- [ ] Uncached requests < 500ms
- [ ] Database queries optimized
- [ ] Cache hit rate > 75%
- [ ] No memory leaks

### Database Checks
- [ ] All agents in database
- [ ] Metrics tracked correctly
- [ ] Timestamps accurate
- [ ] Relationships intact
- [ ] Indexes working

### Redis Checks
- [ ] Redis connection stable
- [ ] Cache keys properly formatted
- [ ] TTL expiration working
- [ ] Cache invalidation on updates
- [ ] No stale data

### Monitoring Checks
- [ ] Logs show agent operations
- [ ] Audit trail in AnalyticsEvent
- [ ] Error handling works
- [ ] No console warnings

---

## 🚨 Troubleshooting

### Issue: Agents Not Registering
**Symptoms**: No agents in database after startup  
**Checks**:
- [ ] Is `registerAllAgentsOnStartup()` called?
- [ ] Is Prisma client initialized?
- [ ] Is database connection working?
- [ ] Check console for errors

**Solution**:
```typescript
// Add error logging
try {
  await registerAllAgentsOnStartup();
} catch (error) {
  console.error('Agent registration failed:', error);
  throw error;
}
```

### Issue: Slow API Responses
**Symptoms**: Requests taking > 500ms  
**Checks**:
- [ ] Is Redis running?
- [ ] Is cache enabled?
- [ ] Are database indexes created?
- [ ] Check Redis connection

**Solution**:
```bash
# Test Redis
redis-cli ping

# Check cache keys
redis-cli
> KEYS ai:*

# Verify database indexes
npx prisma studio
```

### Issue: Metrics Not Updating
**Symptoms**: lastHealthCheck not changing  
**Checks**:
- [ ] Is background task started?
- [ ] Are agents active?
- [ ] Check console for errors

**Solution**:
```typescript
// Ensure task is started
import { startMetricsUpdateTask } from './services/aiAgentService';
startMetricsUpdateTask();
console.log('Background task started');
```

### Issue: Cache Not Working
**Symptoms**: All requests slow, no cache hits  
**Checks**:
- [ ] Is Redis URL correct in .env?
- [ ] Is Redis service running?
- [ ] Check Redis logs

**Solution**:
```bash
# Check Redis status
systemctl status redis  # Linux
brew services list  # Mac
docker ps  # Docker

# Test connection
redis-cli -h localhost -p 6379 ping
```

---

## 📊 Success Criteria

### All Green ✅
- ✅ All 6 agents registered
- ✅ REST API fully functional
- ✅ Caching working (< 100ms cached)
- ✅ Background tasks running
- ✅ Tests passing
- ✅ No errors in console
- ✅ Database queries optimized
- ✅ Metrics tracking correctly

### Ready for Production ✅
- ✅ All integration steps completed
- ✅ All verification checks passed
- ✅ All troubleshooting tested
- ✅ Documentation reviewed
- ✅ Team trained on usage

---

## 📚 Next Steps After Integration

1. **Monitor Performance**
   - Check response times daily
   - Monitor cache hit rate
   - Track error rates

2. **Implement Dashboard** (Task 6.1)
   - Connect frontend to APIs
   - Add real-time monitoring
   - Build admin interface

3. **Add Task Management** (Task 5.2)
   - Implement task queue
   - Add retry logic
   - Build workflow system

4. **Deploy to Production**
   - Environment configuration
   - Load testing
   - Monitoring setup

---

## 📞 Support

- **Documentation**: `/docs/ai-system/TASK_5.1_IMPLEMENTATION.md`
- **Quick Reference**: `/docs/ai-system/QUICK_REFERENCE.md`
- **Summary**: `/docs/ai-system/TASK_5.1_SUMMARY.md`
- **This Checklist**: `/docs/ai-system/INTEGRATION_CHECKLIST.md`

---

**Last Updated**: December 2024  
**Checklist Version**: 1.0
