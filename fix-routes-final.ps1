# Fix all remaining ai-approval.ts errors systematically

$file = "backend\src\api\ai-approval.ts"
$content = Get-Content $file -Raw

Write-Host "Fixing all remaining route errors..." -ForegroundColor Cyan

# Fix all workflowId: id to workflowId: id as string
$content = $content -replace '(\s+workflowId: )id,', '$1id as string,'

# Fix assignEditor call
$content = $content -replace '(assignEditor\()id,', '$1id as string,'

# Add return to all remaining catch block res.status calls
# Find patterns like "logger.error(...)\n    res.status" and add return
$content = $content -replace '(logger\.error\([^\)]+\);\s+)(res\.status\()', '$1return $2'

Set-Content $file -Value $content -NoNewline

Write-Host "Backend routes fixed!" -ForegroundColor Green
