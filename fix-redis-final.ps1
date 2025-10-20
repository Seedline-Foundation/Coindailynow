# Fix all remaining TypeScript errors

$file = "backend\src\services\humanApprovalService.ts"
$content = Get-Content $file -Raw

Write-Host "Fixing remaining errors..." -ForegroundColor Cyan

# Fix all Redis calls that still have errors - wrap in try-catch or use type guards
$content = $content -replace 'await redisClient!\.setex', 'await (redisClient as any).setex'
$content = $content -replace 'await redisClient\.setex', 'await (redisClient as any).setex'

# Fix qualityScore: true -> should be decision.qualityScore
$content = $content -replace 'qualityScore: true \?\? null', 'qualityScore: decision.qualityScore ?? null'

# Fix WorkflowNotification missing title
$content = $content -replace '(data: \{[^}]{0,50}id: string,\s+workflowId: string,\s+recipientId: string,\s+notificationType: string,\s+message: string,)', '$1
          title: message,'

Set-Content $file -Value $content -NoNewline

Write-Host "Done! Check errors now." -ForegroundColor Green
