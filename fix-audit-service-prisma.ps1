# Fix aiAuditService.ts Prisma client calls
$filePath = "backend\src\services\aiAuditService.ts"

Write-Host "Fixing Prisma client calls in $filePath..." -ForegroundColor Cyan

# Read the file
$content = Get-Content -Path $filePath -Raw

# Replace all aIAuditLog with aiAuditLog
$content = $content -replace 'prisma\.aIAuditLog', 'prisma.aiAuditLog'

# Replace all aIDecisionLog with aiDecisionLog
$content = $content -replace 'prisma\.aIDecisionLog', 'prisma.aiDecisionLog'

# Write back
$content | Set-Content -Path $filePath -NoNewline

Write-Host "✓ Fixed all Prisma client calls" -ForegroundColor Green
Write-Host "  - aIAuditLog -> aiAuditLog" -ForegroundColor Gray
Write-Host "  - aIDecisionLog -> aiDecisionLog" -ForegroundColor Gray
