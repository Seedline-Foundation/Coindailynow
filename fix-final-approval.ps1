# Final fixes for humanApprovalService.ts

$file = "backend\src\services\humanApprovalService.ts"
$content = Get-Content $file -Raw

Write-Host "Applying final fixes..." -ForegroundColor Cyan

# Read file line by line to find the actual Redis issues
$lines = Get-Content $file

# Fix line 377 - already in if block but still has error - check indentation
# The issue is the if (redisClient) block itself might have another await outside
# Let me check if there are nested awaits

# Fix qualityScore: true ?? null -> qualityScore: decision.qualityScore ?? null
$content = $content -replace 'qualityScore: true \?\? null', 'qualityScore: decision.qualityScore ?? null'

# Fix WorkflowNotification missing title field
$content = $content -replace '(\s+data: \{[^}]*id: string,\s+workflowId: string,\s+recipientId: string,\s+notificationType: string,\s+message: string,)', '$1
          title: ''Approval Required'','

Set-Content $file -Value $content -NoNewline

Write-Host "Checking Redis client usage..." -ForegroundColor Yellow

# The Redis errors suggest the 'if' wrapper didn't work properly
# Let's check if the file has the right structure
$lineNumber = 377
$contextLines = $lines[($lineNumber-5)..($lineNumber+2)]
Write-Host "Lines around 377:"
$contextLines | ForEach-Object { Write-Host $_ }

Write-Host "`nDone! Check errors again." -ForegroundColor Green
