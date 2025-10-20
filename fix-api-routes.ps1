# Complete Fix for Quality Validation Errors
# This PowerShell script fixes all remaining TypeScript errors

Write-Host "🔧 Applying comprehensive fixes..." -ForegroundColor Cyan

# Fix 1: API Route - articleId validation and return statements
$apiFile = "backend\src\api\ai-quality-validation.ts"
$content = Get-Content $apiFile -Raw

# Add articleId validation before using it
$content = $content -replace 'const \{ articleId \} = req\.params;\s+const skipCache', @"
const { articleId } = req.params;
    if (!articleId) {
      res.status(400).json({ error: 'Article ID is required' });
      return;
    }
    const skipCache
"@

# Add return after res.json in each route

# Batch route
$content = $content -replace '(\s+res\.json\(\{\s+success: true,\s+data: results[\s\S]*?\}\);\s+)(\}\s+catch \(error)', '$1    return;$2'

# Agent performance route  
$content = $content -replace '(router\.get\(''/agent/:agentType/performance''[\s\S]*?res\.json\(\{[\s\S]*?\}\);)(\s+\} catch)', '$1    return;$2'

# Reports route
$content = $content -replace '(router\.post\(''/reports/generate''[\s\S]{1,800}?res\.json\(\{[\s\S]*?\}\);)(\s+\} catch)', '$1    return;$2'

# Get report route  
$content = $content -replace '(router\.get\(''/reports/:reportId''[\s\S]{1,300}?res\.json\(\{[\s\S]*?\}\);)(\s+\} catch)', '$1    return;$2'

# Trends route
$content = $content -replace '(router\.get\(''/trends''[\s\S]{1,600}?res\.json\(\{[\s\S]*?\}\);)(\s+\} catch)', '$1    return;$2'

# Cache invalidate route
$content = $content -replace '(router\.post\(''/cache/invalidate''[\s\S]{1,400}?res\.json\(\{[\s\S]*?\}\);)(\s+\} catch)', '$1    return;$2'

$content | Set-Content $apiFile -NoNewline

Write-Host "✅ Fixed API routes" -ForegroundColor Green

Write-Host "✅ All fixes applied!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart TypeScript server (Ctrl+Shift+P → 'TypeScript: Restart TS Server')" -ForegroundColor White
Write-Host "2. Check Problems tab" -ForegroundColor White
