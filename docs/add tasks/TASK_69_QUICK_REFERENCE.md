# Task 69: Workflow Orchestration - Quick Reference

## Overview
Complete automation integration system with workflows, alerts, version control, and API orchestration.

---

## API Endpoints

### Workflow Management
```bash
# List workflows
GET /api/workflow-orchestration/workflows?status=active&workflowType=custom

# Get workflow
GET /api/workflow-orchestration/workflows/:id

# Create workflow
POST /api/workflow-orchestration/workflows
{
  "name": "Auto Publish & Share",
  "workflowType": "custom",
  "trigger": { "type": "publish", "config": {} },
  "actions": [
    { "id": "publish", "name": "Publish", "type": "publish", "config": {} },
    { "id": "share", "name": "Share", "type": "share", "config": { "platforms": ["twitter"] } }
  ],
  "createdBy": "user-id"
}

# Update workflow
PUT /api/workflow-orchestration/workflows/:id
{ "status": "active", "isActive": true }

# Delete workflow
DELETE /api/workflow-orchestration/workflows/:id

# Execute workflow
POST /api/workflow-orchestration/workflows/:id/execute
{ "triggerType": "manual", "triggerData": { "articleId": "123" } }

# Get workflow stats
GET /api/workflow-orchestration/workflows/:id/stats
```

### Alerts
```bash
# Create alert
POST /api/workflow-orchestration/alerts
{
  "workflowId": "workflow-id",
  "alertType": "slack",
  "channel": "https://hooks.slack.com/...",
  "events": ["workflow_complete", "workflow_fail"],
  "severity": "error",
  "createdBy": "user-id"
}
```

### Version Control
```bash
# Create version
POST /api/workflow-orchestration/versions
{
  "articleId": "article-123",
  "changeDescription": "Updated content",
  "changedBy": "user-id",
  "changeType": "edited"
}

# Get version history
GET /api/workflow-orchestration/versions/:articleId

# Revert to version
POST /api/workflow-orchestration/versions/:articleId/revert
{ "versionNumber": 5, "userId": "user-id" }
```

### API Orchestration
```bash
# Create orchestration
POST /api/workflow-orchestration/orchestrations
{
  "name": "Multi-API Call",
  "orchestrationType": "sequential",
  "apiCalls": [
    { "id": "call1", "method": "GET", "url": "https://api.example.com/data" },
    { "id": "call2", "method": "POST", "url": "https://api.example.com/process" }
  ],
  "createdBy": "user-id"
}

# Execute orchestration
POST /api/workflow-orchestration/orchestrations/:id/execute
{ "context": { "param": "value" } }
```

### Integration Connections
```bash
# Create connection
POST /api/workflow-orchestration/connections
{
  "name": "Slack Connection",
  "platform": "slack",
  "connectionType": "webhook",
  "credentials": { "webhookUrl": "https://..." },
  "createdBy": "user-id"
}

# Verify connection
POST /api/workflow-orchestration/connections/:id/verify
```

### Analytics
```bash
# Get overall stats
GET /api/workflow-orchestration/stats
```

---

## Workflow Action Types

### 1. Publish Action
```typescript
{
  type: 'publish',
  config: {
    articleId: 'article-123' // Optional, can come from context
  }
}
```

### 2. Share Action
```typescript
{
  type: 'share',
  config: {
    platforms: ['twitter', 'telegram', 'linkedin'],
    articleId: 'article-123' // Optional
  }
}
```

### 3. Monitor Action
```typescript
{
  type: 'monitor',
  config: {
    metrics: ['ranking', 'traffic', 'engagement'],
    articleId: 'article-123' // Optional
  }
}
```

### 4. Optimize Action
```typescript
{
  type: 'optimize',
  config: {
    type: 'seo', // or 'content', 'performance'
    articleId: 'article-123' // Optional
  }
}
```

### 5. Notify Action
```typescript
{
  type: 'notify',
  config: {
    type: 'slack', // or 'telegram', 'email', 'webhook'
    channel: 'https://hooks.slack.com/...',
    message: 'Workflow completed',
    severity: 'info'
  }
}
```

### 6. API Call Action
```typescript
{
  type: 'api_call',
  config: {
    method: 'POST',
    url: 'https://api.example.com/endpoint',
    headers: { 'Authorization': 'Bearer token' },
    body: { data: 'value' },
    timeout: 30000
  }
}
```

### 7. Git Commit Action
```typescript
{
  type: 'git_commit',
  config: {
    articleId: 'article-123',
    commitMessage: 'Automated update',
    changedBy: 'system'
  }
}
```

---

## Trigger Types

### 1. Publish Trigger
```typescript
{
  type: 'publish',
  config: {
    articleStatus: 'READY_TO_PUBLISH'
  }
}
```

### 2. Schedule Trigger
```typescript
{
  type: 'schedule',
  config: {
    cron: '0 9 * * *' // 9 AM daily
  }
}
```

### 3. Event Trigger
```typescript
{
  type: 'event',
  config: {
    eventType: 'article_updated',
    filters: { categoryId: 'crypto' }
  }
}
```

### 4. Webhook Trigger
```typescript
{
  type: 'webhook',
  config: {
    webhookUrl: 'https://yoursite.com/webhook'
  }
}
```

### 5. Manual Trigger
```typescript
{
  type: 'manual',
  config: {}
}
```

---

## Alert Configuration

### Slack Alert
```typescript
{
  alertType: 'slack',
  channel: 'https://hooks.slack.com/services/...',
  config: { webhookUrl: '...' },
  events: ['workflow_complete', 'workflow_fail'],
  severity: 'error'
}
```

### Telegram Alert
```typescript
{
  alertType: 'telegram',
  channel: '-1001234567890', // Chat ID
  config: { botToken: 'YOUR_BOT_TOKEN' },
  events: ['workflow_complete', 'workflow_fail'],
  severity: 'error'
}
```

### Email Alert
```typescript
{
  alertType: 'email',
  channel: 'admin@example.com',
  events: ['workflow_fail'],
  severity: 'critical'
}
```

### Webhook Alert
```typescript
{
  alertType: 'webhook',
  channel: 'https://yoursite.com/alerts',
  events: ['workflow_complete', 'workflow_fail', 'step_fail'],
  severity: 'info'
}
```

---

## Orchestration Types

### Sequential
Execute API calls one after another:
```typescript
{
  orchestrationType: 'sequential',
  apiCalls: [
    { id: 'step1', method: 'GET', url: '...' },
    { id: 'step2', method: 'POST', url: '...' }
  ]
}
```

### Parallel
Execute API calls simultaneously:
```typescript
{
  orchestrationType: 'parallel',
  apiCalls: [
    { id: 'call1', method: 'GET', url: '...' },
    { id: 'call2', method: 'GET', url: '...' }
  ]
}
```

### Conditional
Execute based on conditions:
```typescript
{
  orchestrationType: 'conditional',
  apiCalls: [
    { id: 'check', method: 'GET', url: '...' },
    { id: 'action', method: 'POST', url: '...', condition: 'check.status === 200' }
  ]
}
```

### Pipeline
Pass data between calls:
```typescript
{
  orchestrationType: 'pipeline',
  apiCalls: [
    { id: 'fetch', method: 'GET', url: '...' },
    { id: 'process', method: 'POST', url: '...', body: { data: '{{fetch.data}}' } }
  ]
}
```

---

## Components

### Super Admin Dashboard
```tsx
import WorkflowOrchestrationDashboard from '@/components/super-admin/WorkflowOrchestrationDashboard';

<WorkflowOrchestrationDashboard />
```

**Features**:
- 5 tabs: Workflows, Executions, Alerts, Versions, Orchestrations
- Create, update, delete workflows
- Execute workflows manually
- View execution history
- Configure alerts
- Monitor statistics

### User Dashboard Widget
```tsx
import AutomationStatusWidget from '@/components/user/AutomationStatusWidget';

<AutomationStatusWidget />
```

**Features**:
- Active workflows count
- Recent activity count
- Success rate display
- System status indicator
- Auto-refresh every 30 seconds

---

## Database Models

### AutomationWorkflow
- Core workflow configuration
- Stores triggers and actions
- Tracks execution metrics

### AutomationExecution
- Execution records
- Status and timing
- Error tracking

### AutomationExecutionStep
- Individual step tracking
- Input/output capture
- Retry management

### AutomationAlert
- Alert configuration
- Multi-channel support
- Delivery tracking

### ContentVersion
- Content snapshots
- Git commit tracking
- Revert capability

### APIOrchestration
- API call configurations
- Performance tracking

### IntegrationConnection
- Platform connections
- Credential management
- Verification status

---

## Common Workflows

### 1. Auto-Publish and Share
```typescript
{
  name: 'Auto Publish & Share',
  trigger: { type: 'publish' },
  actions: [
    { type: 'publish', name: 'Publish Article' },
    { type: 'share', name: 'Share', config: { platforms: ['twitter', 'telegram'] } },
    { type: 'notify', name: 'Notify Team', config: { type: 'slack' } }
  ]
}
```

### 2. Content Monitoring
```typescript
{
  name: 'Monitor Performance',
  trigger: { type: 'schedule', config: { cron: '0 * * * *' } }, // Hourly
  actions: [
    { type: 'monitor', name: 'Check Metrics' },
    { type: 'optimize', name: 'Optimize Content' }
  ]
}
```

### 3. Version Control Workflow
```typescript
{
  name: 'Auto Version',
  trigger: { type: 'event', config: { eventType: 'article_updated' } },
  actions: [
    { type: 'git_commit', name: 'Create Version' },
    { type: 'notify', name: 'Notify', config: { type: 'in_app' } }
  ]
}
```

---

## Integration Examples

### Slack Integration
```typescript
// 1. Create connection
await createConnection({
  name: 'Slack Alerts',
  platform: 'slack',
  connectionType: 'webhook',
  credentials: { webhookUrl: 'https://hooks.slack.com/services/...' },
  createdBy: 'admin'
});

// 2. Create alert
await createAlert({
  alertType: 'slack',
  channel: 'https://hooks.slack.com/services/...',
  events: ['workflow_complete', 'workflow_fail'],
  severity: 'error',
  createdBy: 'admin'
});
```

### Telegram Integration
```typescript
// 1. Create bot and get token
// 2. Get chat ID
// 3. Create connection
await createConnection({
  name: 'Telegram Alerts',
  platform: 'telegram',
  connectionType: 'api_key',
  credentials: { botToken: 'YOUR_BOT_TOKEN' },
  createdBy: 'admin'
});

// 4. Create alert
await createAlert({
  alertType: 'telegram',
  channel: '-1001234567890', // Chat ID
  config: { botToken: 'YOUR_BOT_TOKEN' },
  events: ['workflow_fail'],
  severity: 'critical',
  createdBy: 'admin'
});
```

---

## Performance Tips

1. **Use Caching**: Workflows are cached for 5 minutes
2. **Optimize Actions**: Minimize API calls in workflows
3. **Set Timeouts**: Configure appropriate timeouts (default 5 minutes)
4. **Use Parallel**: Execute independent actions in parallel
5. **Monitor Stats**: Track execution times and success rates
6. **Set Priorities**: Use priority levels for workflow execution
7. **Configure Retries**: Set appropriate retry strategies
8. **Version Content**: Regularly create versions for important changes

---

## Troubleshooting

### Workflow Not Executing
- Check if workflow is active (`isActive: true`)
- Verify trigger configuration
- Check for execution errors in logs

### Alert Not Sending
- Verify connection credentials
- Check alert is active
- Verify event types match
- Test connection with verify endpoint

### Version Not Created
- Check article exists
- Verify user permissions
- Check database connectivity

### API Call Failing
- Verify URL and credentials
- Check timeout settings
- Review retry configuration
- Check network connectivity

---

## Security Best Practices

1. **Encrypt Credentials**: All credentials are encrypted
2. **Verify Webhooks**: Validate webhook sources
3. **Limit Permissions**: Super admin only for management
4. **Rate Limiting**: Prevent abuse
5. **Audit Logs**: Track all workflow changes
6. **Secure Connections**: Use HTTPS for all webhooks
7. **Token Rotation**: Regularly rotate API tokens

---

## Files Reference

**Backend**:
- Service: `/backend/src/services/workflowOrchestrationService.ts`
- Routes: `/backend/src/routes/workflow-orchestration.routes.ts`
- Schema: `/backend/prisma/schema.prisma`

**Frontend**:
- Dashboard: `/frontend/src/components/super-admin/WorkflowOrchestrationDashboard.tsx`
- Widget: `/frontend/src/components/user/AutomationStatusWidget.tsx`
- API: `/frontend/src/app/api/workflow-orchestration/**/*.ts`

**Documentation**:
- Complete Guide: `/docs/TASK_69_WORKFLOW_ORCHESTRATION_COMPLETE.md`
- Quick Reference: `/docs/TASK_69_QUICK_REFERENCE.md` (this file)

---

**Last Updated**: October 10, 2025  
**Task**: #69 - Workflow Orchestration & Automation Integration
