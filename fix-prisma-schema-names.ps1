# Fix Prisma schema - rename AI models to avoid naming issues
$schemaPath = "backend\prisma\schema.prisma"

Write-Host "Fixing Prisma schema model names..." -ForegroundColor Cyan

# Read the file
$content = Get-Content -Path $schemaPath -Raw

# Replace model AIAuditLog with AuditLog (but keep @@map("ai_audit_log"))
$content = $content -replace 'model AIAuditLog \{', 'model AuditLog {'
$content = $content -replace 'AIDecisionLog\[\]', 'DecisionLog[]'
$content = $content -replace 'AIAuditLog\[\]', 'AuditLog[]'

# Replace model AIDecisionLog with DecisionLog  
$content = $content -replace 'model AIDecisionLog \{', 'model DecisionLog {'
$content = $content -replace 'AIAuditLog @relation', 'AuditLog @relation'

# Write back
$content | Set-Content -Path $schemaPath -NoNewline

Write-Host "✓ Fixed Prisma schema:" -ForegroundColor Green
Write-Host "  - AIAuditLog -> AuditLog (@@map('ai_audit_log'))" -ForegroundColor Gray
Write-Host "  - AIDecisionLog -> DecisionLog (@@map('ai_decision_log'))" -ForegroundColor Gray
