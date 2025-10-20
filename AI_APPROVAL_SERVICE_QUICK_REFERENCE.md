# 🎯 AIManagementService - Human Approval Methods Quick Reference

**Added**: October 16, 2025  
**Location**: `frontend/src/services/aiManagementService.ts`  
**Purpose**: Complete service layer for human approval workflow (Task 6.3)

---

## 📚 Method Reference

### 1. getApprovalQueue()
**Get approval queue with filtering and pagination**

```typescript
async getApprovalQueue(params?: {
  priority?: string;      // 'critical' | 'high' | 'medium' | 'low'
  contentType?: string;   // 'article' | 'news' | 'analysis'
  status?: string;        // 'pending' | 'in_review' | 'approved'
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 20)
}): Promise<{
  items: any[];
  total: number;
  page: number;
  totalPages: number;
}>
```

**Usage Example:**
```typescript
const queue = await aiManagementService.getApprovalQueue({
  priority: 'high',
  page: 1,
  limit: 20
});
console.log(queue.items); // Array of approval items
console.log(queue.totalPages); // Total pages available
```

---

### 2. getContentReviewDetails()
**Get detailed content review information**

```typescript
async getContentReviewDetails(workflowId: string): Promise<any>
```

**Usage Example:**
```typescript
const details = await aiManagementService.getContentReviewDetails('workflow-123');
console.log(details.content); // Article content
console.log(details.qualityScores); // Quality scores
console.log(details.translations); // Translation previews
```

---

### 3. approveContent()
**Approve content with optional notes and quality score**

```typescript
async approveContent(
  workflowId: string, 
  data: {
    notes?: string;       // Optional approval notes
    qualityScore?: number; // Quality score (0-1)
  }
): Promise<any>
```

**Usage Example:**
```typescript
await aiManagementService.approveContent('workflow-123', {
  notes: 'Excellent content, well-researched',
  qualityScore: 0.95
});
```

---

### 4. rejectContent()
**Reject content with reason and feedback**

```typescript
async rejectContent(
  workflowId: string,
  data: {
    reason: string;       // Required rejection reason
    feedback?: string;    // Optional detailed feedback
  }
): Promise<any>
```

**Usage Example:**
```typescript
await aiManagementService.rejectContent('workflow-123', {
  reason: 'Poor quality',
  feedback: 'Article lacks depth and contains factual errors in the market analysis section.'
});
```

---

### 5. requestRevision()
**Request content revision with structured feedback**

```typescript
async requestRevision(
  workflowId: string,
  data: {
    feedback: string;           // General feedback
    requiredChanges: string[];  // List of required changes
    priority?: string;          // Revision priority
  }
): Promise<any>
```

**Usage Example:**
```typescript
await aiManagementService.requestRevision('workflow-123', {
  feedback: 'Good overall but needs improvements',
  requiredChanges: [
    'Introduction: Add more context about market trends',
    'Section 2: Fix grammar errors',
    'Conclusion: Strengthen the call-to-action'
  ],
  priority: 'high'
});
```

---

### 6. processBatchApproval()
**Process multiple approvals or rejections in one call**

```typescript
async processBatchApproval(data: {
  workflowIds: string[];           // Array of workflow IDs
  action: 'approve' | 'reject';    // Batch action
  notes?: string;                  // Optional notes for all
  reason?: string;                 // Optional reason for rejections
}): Promise<{
  succeeded: string[];             // Successfully processed IDs
  failed: Array<{                  // Failed operations
    workflowId: string;
    error: string;
  }>;
}>
```

**Usage Example:**
```typescript
const result = await aiManagementService.processBatchApproval({
  workflowIds: ['workflow-1', 'workflow-2', 'workflow-3'],
  action: 'approve',
  notes: 'Batch approval - all meet quality standards'
});
console.log(`${result.succeeded.length} approved`);
console.log(`${result.failed.length} failed`);
```

---

### 7. assignEditor()
**Assign specific editor to content review**

```typescript
async assignEditor(
  workflowId: string,
  editorId: string
): Promise<any>
```

**Usage Example:**
```typescript
await aiManagementService.assignEditor('workflow-123', 'editor-456');
```

---

### 8. getAvailableEditors()
**Get list of available editors with workload information**

```typescript
async getAvailableEditors(): Promise<any[]>
```

**Usage Example:**
```typescript
const editors = await aiManagementService.getAvailableEditors();
editors.forEach(editor => {
  console.log(`${editor.name}: ${editor.currentWorkload}/${editor.maxWorkload}`);
});
```

---

### 9. getEditorMetrics()
**Get performance metrics for specific editor**

```typescript
async getEditorMetrics(
  editorId: string,
  dateRange?: {
    start: string;  // ISO date string
    end: string;    // ISO date string
  }
): Promise<any>
```

**Usage Example:**
```typescript
const metrics = await aiManagementService.getEditorMetrics('editor-456', {
  start: '2025-10-01',
  end: '2025-10-16'
});
console.log(`Approval rate: ${metrics.approvalRate}%`);
console.log(`Avg review time: ${metrics.avgReviewTime}ms`);
```

---

### 10. getApprovalStatistics()
**Get system-wide approval statistics**

```typescript
async getApprovalStatistics(dateRange?: {
  start: string;
  end: string;
}): Promise<any>
```

**Usage Example:**
```typescript
const stats = await aiManagementService.getApprovalStatistics({
  start: '2025-10-01',
  end: '2025-10-16'
});
console.log(`Total reviewed: ${stats.totalReviewed}`);
console.log(`Approval rate: ${stats.approvalRate}%`);
console.log(`Avg time: ${stats.avgReviewTime}ms`);
```

---

## 🔧 Common Patterns

### Pattern 1: Load Queue with Filters
```typescript
// Component state
const [filters, setFilters] = useState({
  priority: 'high',
  status: 'pending'
});
const [page, setPage] = useState(1);

// Load queue
const loadQueue = async () => {
  const response = await aiManagementService.getApprovalQueue({
    ...filters,
    page,
    limit: 20
  });
  setItems(response.items);
  setTotalPages(response.totalPages);
};
```

### Pattern 2: Review Workflow
```typescript
// 1. Load details
const details = await aiManagementService.getContentReviewDetails(workflowId);

// 2. Make decision
if (approved) {
  await aiManagementService.approveContent(workflowId, {
    notes: feedback,
    qualityScore: 0.9
  });
} else if (needsRevision) {
  await aiManagementService.requestRevision(workflowId, {
    feedback,
    requiredChanges: ['Fix typos', 'Add more details']
  });
} else {
  await aiManagementService.rejectContent(workflowId, {
    reason: 'Does not meet standards',
    feedback
  });
}

// 3. Refresh queue
await loadQueue();
```

### Pattern 3: Batch Operations
```typescript
// Select multiple items
const selectedIds = ['workflow-1', 'workflow-2', 'workflow-3'];

// Process batch
const result = await aiManagementService.processBatchApproval({
  workflowIds: selectedIds,
  action: 'approve',
  notes: 'Bulk approval'
});

// Handle results
if (result.failed.length > 0) {
  console.error('Some operations failed:', result.failed);
}
```

### Pattern 4: Editor Assignment
```typescript
// 1. Get available editors
const editors = await aiManagementService.getAvailableEditors();

// 2. Find best editor (lowest workload)
const bestEditor = editors.sort((a, b) => 
  a.currentWorkload - b.currentWorkload
)[0];

// 3. Assign editor
await aiManagementService.assignEditor(workflowId, bestEditor.id);
```

---

## 🚨 Error Handling

### Standard Pattern
```typescript
try {
  const result = await aiManagementService.approveContent(workflowId, data);
  // Success handling
  showSuccessMessage('Content approved successfully');
  await refreshQueue();
} catch (error) {
  // Error handling
  console.error('Approval failed:', error);
  showErrorMessage(error.message || 'Failed to approve content');
}
```

### Batch Operation Error Handling
```typescript
const result = await aiManagementService.processBatchApproval({
  workflowIds: selectedIds,
  action: 'approve'
});

// Check for partial success
if (result.succeeded.length > 0) {
  showSuccessMessage(`${result.succeeded.length} items approved`);
}

if (result.failed.length > 0) {
  showErrorMessage(`${result.failed.length} items failed`);
  result.failed.forEach(failure => {
    console.error(`${failure.workflowId}: ${failure.error}`);
  });
}
```

---

## 📊 Response Types

### Approval Queue Item
```typescript
interface ApprovalQueueItem {
  id: string;
  workflowId: string;
  title: string;
  contentType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  qualityScore: number;
  aiConfidence: number;
  createdAt: string;
  assignedEditor?: string;
}
```

### Content Review Details
```typescript
interface ContentReviewDetails {
  workflowId: string;
  content: string;
  qualityScores: {
    overallScore: number;
    seoScore?: number;
    readabilityScore?: number;
    sentimentScore?: number;
  };
  translations: Array<{
    language: string;
    content: string;
    qualityScore: number;
  }>;
  researchSources: string[];
  generationMetadata: any;
}
```

### Editor Info
```typescript
interface EditorInfo {
  id: string;
  name: string;
  email: string;
  currentWorkload: number;
  maxWorkload: number;
  approvalRate: number;
  avgReviewTime: number;
}
```

---

## 🎯 Best Practices

### 1. Always Handle Errors
```typescript
// ❌ Bad
await aiManagementService.approveContent(id, data);

// ✅ Good
try {
  await aiManagementService.approveContent(id, data);
} catch (error) {
  handleError(error);
}
```

### 2. Provide User Feedback
```typescript
// ✅ Good
try {
  await aiManagementService.approveContent(id, data);
  showToast('Content approved successfully', 'success');
} catch (error) {
  showToast('Failed to approve content', 'error');
}
```

### 3. Refresh After Changes
```typescript
// ✅ Good
await aiManagementService.approveContent(id, data);
await loadQueue(); // Refresh the queue
```

### 4. Validate Input Data
```typescript
// ✅ Good
const handleApprove = async () => {
  if (!workflowId) {
    showError('Invalid workflow ID');
    return;
  }
  
  if (!feedback.trim()) {
    showError('Please provide feedback');
    return;
  }
  
  await aiManagementService.approveContent(workflowId, {
    notes: feedback,
    qualityScore: score
  });
};
```

---

## 📖 Additional Resources

- **Full Implementation**: `/frontend/src/services/aiManagementService.ts`
- **Backend API**: `/backend/src/api/ai-approval.ts`
- **Component Examples**: 
  - `/frontend/src/components/admin/ai/ApprovalQueueComponent.tsx`
  - `/frontend/src/components/admin/ai/ContentReviewModal.tsx`

---

**Quick Reference Version**: 1.0  
**Last Updated**: October 16, 2025  
**Status**: ✅ Production Ready
