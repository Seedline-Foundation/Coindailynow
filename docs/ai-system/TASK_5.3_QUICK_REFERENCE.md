# Task 5.3: Content Workflow Integration - Quick Reference

## 🚀 Quick Start

### Create Workflow
```bash
curl -X POST http://localhost:3000/api/ai/workflows \
  -H "Content-Type: application/json" \
  -d '{"articleId": "article_123", "priority": "HIGH"}'
```

### Get Status
```bash
curl http://localhost:3000/api/ai/workflows/WORKFLOW_ID
```

### Advance Workflow
```bash
curl -X PUT http://localhost:3000/api/ai/workflows/WORKFLOW_ID/advance \
  -H "Content-Type: application/json" \
  -d '{"qualityScore": {"stage": "RESEARCH", "score": 0.85, "passed": true}}'
```

---

## 📋 Workflow States

```
RESEARCH → RESEARCH_REVIEW → CONTENT_GENERATION → CONTENT_REVIEW → 
TRANSLATION → TRANSLATION_REVIEW → HUMAN_APPROVAL → PUBLISHED
```

**Terminal States**: PUBLISHED, FAILED, CANCELLED  
**Pausable States**: All except terminal and PAUSED

---

## 🎯 Quality Thresholds

| Stage | Threshold | Agent Type |
|-------|-----------|------------|
| Research | 0.7 | RESEARCH_AGENT |
| Research Review | 0.7 | REVIEW_AGENT |
| Content Generation | 0.75 | CONTENT_GENERATION_AGENT |
| Content Review | 0.75 | REVIEW_AGENT |
| Translation | 0.7 | TRANSLATION_AGENT |
| Translation Review | 0.7 | REVIEW_AGENT |
| Human Approval | 0.8 | HUMAN |

---

## 🔌 API Endpoints

### REST API
```
POST   /api/ai/workflows                     - Create workflow
GET    /api/ai/workflows/:id                 - Get status
PUT    /api/ai/workflows/:id/advance         - Advance stage
PUT    /api/ai/workflows/:id/rollback        - Rollback stage
POST   /api/ai/workflows/:id/pause           - Pause workflow
POST   /api/ai/workflows/:id/resume          - Resume workflow
POST   /api/ai/workflows/:id/human-review    - Submit for review
POST   /api/ai/workflows/:id/review-decision - Process review
GET    /api/ai/workflows/queue/human-approval - Get queue
GET    /api/ai/workflows                     - List workflows
GET    /api/ai/workflows/health              - Health check
```

### GraphQL
```graphql
# Query
contentWorkflow(id: ID!): ContentWorkflow
contentWorkflows(filter: WorkflowFilterInput): [ContentWorkflow!]!
humanApprovalQueue(priority: WorkflowPriority): [ContentWorkflow!]!
workflowStats: WorkflowStats!

# Mutation
createContentWorkflow(input: CreateWorkflowInput!): ContentWorkflow!
advanceWorkflow(id: ID!, qualityScore: WorkflowQualityScoreInput): ContentWorkflow!
rollbackWorkflow(id: ID!, reason: String): ContentWorkflow!
processHumanReview(input: HumanReviewInput!): ContentWorkflow!

# Subscription
workflowStateChanged(workflowId: ID): ContentWorkflow!
humanApprovalQueueUpdated: [ContentWorkflow!]!
```

---

## 💻 TypeScript Usage

```typescript
import { aiWorkflowService, WorkflowPriority } from './services/aiWorkflowService';

// Create
const workflow = await aiWorkflowService.createWorkflow({
  articleId: 'article_123',
  priority: WorkflowPriority.HIGH
});

// Get status
const status = await aiWorkflowService.getWorkflow(workflow.id);

// Advance
await aiWorkflowService.advanceWorkflow(workflow.id, {
  stage: 'RESEARCH',
  score: 0.85,
  passed: true
});

// Human review
await aiWorkflowService.processHumanReview({
  workflowId: workflow.id,
  reviewerId: 'user_1',
  approved: true
});
```

---

## 📊 Response Format

```json
{
  "data": {
    "id": "wf_1234567890_abc123",
    "currentState": "CONTENT_REVIEW",
    "completionPercentage": 50,
    "priority": "HIGH",
    "qualityScores": [
      {"stage": "RESEARCH", "score": 0.85, "passed": true},
      {"stage": "RESEARCH_REVIEW", "score": 0.90, "passed": true}
    ]
  },
  "meta": {
    "responseTime": 45,
    "cached": true
  }
}
```

---

## ⚙️ Configuration

```typescript
// Quality thresholds
QUALITY_THRESHOLD = 0.7              // Minimum to pass
MIN_AUTO_APPROVE_SCORE = 0.85        // Auto-approve threshold

// Performance
CACHE_TTL = 300                      // 5 minutes
NOTIFICATION_DELAY_MS = 300000       // 5 minutes

// Retry logic
MAX_RETRIES = 3                      // Maximum retry attempts
```

---

## 🎯 Priority System

```
CRITICAL → HIGH → NORMAL → LOW
```

**Task Priority Mapping**:
- CRITICAL → URGENT
- HIGH → HIGH
- NORMAL → NORMAL
- LOW → LOW

---

## 🌍 Translation Support

**15 African Languages**:
- Swahili (sw)
- Hausa (ha)
- Yoruba (yo)
- Igbo (ig)
- Amharic (am)
- Zulu (zu)
- Xhosa (xh)
- Shona (sn)
- Kinyarwanda (rw)
- Luganda (lg)
- Wolof (wo)
- Fulah (ff)
- Tsonga (ts)
- Sotho (st)
- Tswana (tn)

---

## 🔔 Events

```typescript
import { workflowEvents } from './services/aiWorkflowService';

workflowEvents.on('workflow_created', (workflow) => {});
workflowEvents.on('workflow_advanced', (data) => {});
workflowEvents.on('workflow_rollback', (data) => {});
workflowEvents.on('workflow_paused', (data) => {});
workflowEvents.on('workflow_resumed', (data) => {});
workflowEvents.on('human_review_completed', (data) => {});
workflowEvents.on('article_published', (data) => {});
```

---

## 🚨 Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| WORKFLOW_NOT_FOUND | Invalid workflow ID | Check ID format |
| WORKFLOW_EXISTS | Duplicate workflow | Use existing workflow |
| INVALID_STATE | Cannot transition | Check current state |
| QUALITY_THRESHOLD_NOT_MET | Score too low | Improve content |
| MAX_RETRIES_EXCEEDED | Too many failures | Manual intervention |

---

## 📁 File Locations

```
backend/src/services/aiWorkflowService.ts     - Main service (1,200+ lines)
backend/src/api/ai-workflows.ts               - REST API (700+ lines)
backend/src/api/aiWorkflowSchema.ts           - GraphQL schema (300+ lines)
backend/src/api/aiWorkflowResolvers.ts        - GraphQL resolvers (600+ lines)
backend/src/integrations/aiWorkflowIntegration.ts - Integration module
docs/ai-system/TASK_5.3_IMPLEMENTATION.md     - Full documentation
```

---

## ✅ Status

**Implementation**: ✅ Complete  
**Testing**: ✅ Ready  
**Documentation**: ✅ Complete  
**Production Ready**: ✅ Yes

---

**Last Updated**: December 2024  
**Version**: 1.0.0
