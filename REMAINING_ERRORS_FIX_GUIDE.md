# Remaining TypeScript Errors - Quick Fix Guide

## Summary
- **Backend humanApprovalService.ts**: ✅ ALL FIXED (0 errors)
- **Backend humanApprovalIntegration.ts**: ✅ ALL FIXED (0 errors)  
- **Backend ai-approval.ts**: 10 errors remaining
- **Frontend ApprovalQueueComponent.tsx**: 5 errors remaining
- **Frontend ContentReviewModal.tsx**: 4 errors remaining

**TOTAL**: 19 errors remaining (down from original 62)

---

## Backend: ai-approval.ts (10 errors)

### Issue 1: Missing return statements in catch blocks (6 routes)
**Lines**: 179, 225, 270, 326, 402, 465

**Fix Pattern**: Add `return` before `res.status(...)` in each catch block

```typescript
// BEFORE
} catch (error) {
  logger.error(...);
  res.status(500).json({ error: ... });
}

// AFTER
} catch (error) {
  logger.error(...);
  return res.status(500).json({ error: ... });
}
```

**Files to fix**:
- Line 179: `router.post('/:id/approve'...`
- Line 225: `router.post('/:id/reject'...`
- Line 270: `router.post('/:id/request-revision'...`
- Line 326: `router.post('/batch'...`
- Line 402: `router.post('/:id/assign'...`
- Line 465: `router.get('/editors/:id/metrics'...`

### Issue 2: Type 'string | undefined' not assignable to 'string' (4 locations)
**Lines**: 195, 241, 296, 417

**Fix**: Cast `id` to `string` after validation check

```typescript
// Line 195, 241, 296 - in processApprovalDecision calls
const { id } = req.params;
if (!id) return res.status(400).json({ error: 'Missing workflow ID' });
await humanApprovalService.processApprovalDecision({
  workflowId: id as string,  // <-- Add "as string"
  ...
});

// Line 417 - in assignEditor call
await humanApprovalService.assignEditor(id as string, editorId);
```

---

## Frontend: ApprovalQueueComponent.tsx (5 errors)

### Fix 1: WebSocket event type (Line 86)
```typescript
// BEFORE
const unsub = aiWebSocketService.on('approval:queue_updated', handleQueueUpdate);

// AFTER
const unsub = aiWebSocketService.on('approval:queue_updated' as any, handleQueueUpdate);
// OR add 'approval:queue_updated' to AIWebSocketEvent type definition
```

### Fix 2-5: Method name mismatches (Lines 93, 132, 425, 439)
```typescript
// Line 93 - BEFORE
const response = await aiManagementService.getApprovalQueue(filters, page, 20);
// AFTER (use suggested name)
const response = await aiManagementService.getHumanApprovalQueue(filters, page, 20);

// Line 132 - BEFORE
await aiManagementService.processBatchApproval({...});
// AFTER
await aiManagementService.processBatchOperation({...});

// Line 425 - BEFORE
await aiManagementService.approveContent(item.id, 'current-user-id', 'Quick approve');
// AFTER - Create wrapper method or call backend directly
await fetch(`/api/ai/approval/${item.id}/approve`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ editorId: 'current-user-id', feedback: 'Quick approve' })
});

// Line 439 - Similar to above
await fetch(`/api/ai/approval/${item.id}/reject`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ editorId: 'current-user-id', feedback: 'Quick reject' })
});
```

---

## Frontend: ContentReviewModal.tsx (4 errors)

### Fix All 4: Method name mismatches (Lines 121, 132, 142, 152)
```typescript
// Line 121 - BEFORE
const data = await aiManagementService.getContentReviewDetails(workflowId);
// AFTER - Call backend directly
const response = await fetch(`/api/ai/approval/${workflowId}`);
const result = await response.json();
const data = result.data;

// Line 132 - BEFORE  
await aiManagementService.approveContent(workflowId, 'current-user-id', feedback);
// AFTER
await fetch(`/api/ai/approval/${workflowId}/approve`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ editorId: 'current-user-id', feedback })
});

// Line 142 - BEFORE
await aiManagementService.rejectContent(workflowId, 'current-user-id', feedback);
// AFTER
await fetch(`/api/ai/approval/${workflowId}/reject`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ editorId: 'current-user-id', feedback })
});

// Line 152 - BEFORE
await aiManagementService.requestRevision(workflowId, 'current-user-id', feedback, requestedChanges);
// AFTER
await fetch(`/api/ai/approval/${workflowId}/request-revision`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ editorId: 'current-user-id', feedback, requestedChanges })
});
```

---

## Quick Fix Commands

### Backend (ai-approval.ts)
Run this PowerShell script:

```powershell
$file = "backend\src\api\ai-approval.ts"
$content = Get-Content $file -Raw

# Add return statements - find all "res.status" in catch blocks and add return
$lines = Get-Content $file
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s+res\.status\(' -and $i -gt 0 -and $lines[$i-1] -match 'logger\.error') {
        $lines[$i] = $lines[$i] -replace 'res\.status\(', 'return res.status('
    }
}
$lines | Set-Content $file

# Add type assertions for id
$content = Get-Content $file -Raw
$content = $content -replace 'workflowId: id,', 'workflowId: id as string,'
$content = $content -replace '\.assignEditor\(id,', '.assignEditor(id as string,'
Set-Content $file -Value $content -NoNewline
```

### Frontend - Replace aiManagementService calls with fetch
Manually update both frontend files to use direct fetch calls as shown above.

---

## Status Check
After applying fixes, run:
```bash
cd backend && npm run type-check
cd ../frontend && npm run type-check
```

Expected: 0 errors ✅
