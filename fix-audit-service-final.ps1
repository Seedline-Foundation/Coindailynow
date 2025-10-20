# Final fix for aiAuditService.ts with correct Prisma names
$filePath = "backend\src\services\aiAuditService.ts"

Write-Host "Updating aiAuditService.ts with correct Prisma model names..." -ForegroundColor Cyan

# Read the file
$content = Get-Content -Path $filePath -Raw

# Replace all aIAuditLog with aIOperationLog
$content = $content -replace 'prisma\.aIAuditLog', 'prisma.aIOperationLog'

# Replace all aIDecisionLog with aIDecision  
$content = $content -replace 'prisma\.aIDecisionLog', 'prisma.aIDecision'

# Write back
$content | Set-Content -Path $filePath -NoNewline

Write-Host "✓ Updated service file:" -ForegroundColor Green
Write-Host "  - aIAuditLog -> aIOperationLog" -ForegroundColor Gray
Write-Host "  - aIDecisionLog -> aIDecision" -ForegroundColor Gray
