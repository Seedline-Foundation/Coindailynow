# Comprehensive fix for ai-approval.ts routes

$file = "backend\src\api\ai-approval.ts"
$content = Get-Content $file -Raw

Write-Host "Fixing all route issues..." -ForegroundColor Cyan

# 1. Add return to all catch blocks that don't have one
# Pattern: } catch (error) { ... res.status(...).json(...); } without return before final }
$content = $content -replace '(\s+res\.status\([^)]+\)\.json\([^)]+\);)\s*(\}\s*\});)', '$1
    return;$2'

# 2. Fix the workflowId type issues - cast id to string after validation
$content = $content -replace '(if \(!id\) return res\.status\(400\)\.json[^;]+;)\s+(await humanApprovalService\.processApprovalDecision\(\{)\s+(workflowId: id,)', '$1
    $2
      workflowId: id as string,'

$content = $content -replace '(if \(!id\) return res\.status\(400\)\.json[^;]+;)\s+([^\n]*await humanApprovalService\.assignEditor\(id)', '$1
    await humanApprovalService.assignEditor(id as string'

Set-Content $file -Value $content -NoNewline

Write-Host "Done! Checking errors..." -ForegroundColor Green
