# Comprehensive fix for aiAuditService.ts
$filePath = "backend\src\services\aiAuditService.ts"

Write-Host "Fixing all Prisma client calls and type issues in $filePath..." -ForegroundColor Cyan

# Read the file
$content = Get-Content -Path $filePath -Raw

# Replace all aiAuditLog with aIAuditLog (Prisma generated name)
$content = $content -replace 'prisma\.aiAuditLog', 'prisma.aIAuditLog'

# Replace all aiDecisionLog with aIDecisionLog (Prisma generated name)
$content = $content -replace 'prisma\.aiDecisionLog', 'prisma.aIDecisionLog'

# Fix null check for reportData
$content = $content -replace 'const reportData = JSON\.parse\(report\.reportData\);', 'const reportData = report.reportData ? JSON.parse(report.reportData) : {};'

# Write back
$content | Set-Content -Path $filePath -NoNewline

Write-Host "✓ Fixed all issues:" -ForegroundColor Green
Write-Host "  - Updated aiAuditLog -> aIAuditLog" -ForegroundColor Gray
Write-Host "  - Updated aiDecisionLog -> aIDecisionLog" -ForegroundColor Gray
Write-Host "  - Fixed reportData null check" -ForegroundColor Gray
