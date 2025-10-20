# Fix Prisma schema - rename to unique model names
$schemaPath = "backend\prisma\schema.prisma"

Write-Host "Fixing Prisma schema with unique model names..." -ForegroundColor Cyan

# Read the file
$content = Get-Content -Path $schemaPath -Raw

# Replace model AuditLog with AIOperationLog at line 7239 only (our new models)
# We need to be specific to avoid changing the existing AuditLog model at line 1152
$content = $content -replace '(?<=\n)model AuditLog \{\s+id\s+String\s+@id\s+// Operation details', 'model AIOperationLog {
  id                String   @id
  
  // Operation details'

# Replace DecisionLog references
$content = $content -replace 'DecisionLog\[\]', 'AIDecision[]'
$content = $content -replace 'model DecisionLog \{', 'model AIDecision {'
$content = $content -replace 'AuditLog @relation\(fields: \[auditLogId\]', 'AIOperationLog @relation(fields: [auditLogId]'

# Replace in User model
$content = $content -replace 'AuditLog\s+AuditLog\[\](?=\s+ComplianceReport)', 'AIOperationLog                AIOperationLog[]'

# Write back
$content | Set-Content -Path $schemaPath -NoNewline

Write-Host "✓ Fixed Prisma schema:" -ForegroundColor Green
Write-Host "  - Renamed to AIOperationLog (@@map('ai_audit_log'))" -ForegroundColor Gray
Write-Host "  - Renamed to AIDecision (@@map('ai_decision_log'))" -ForegroundColor Gray
