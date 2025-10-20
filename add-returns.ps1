# Add return to ALL response calls in ai-approval.ts

$file = "backend\src\api\ai-approval.ts"
$content = Get-Content $file -Raw

Write-Host "Adding return to all response calls..." -ForegroundColor Cyan

# Add return before all res.json() calls that don't have it
$content = $content -replace '(\n\s+)(res\.json\(\{)', '$1return $2'

# Add return before all res.status() calls that don't have return already
$content = $content -replace '(\n\s+)(res\.status\(\d+\))', '$1return $2'

# Clean up any double returns
$content = $content -replace 'return return', 'return'

Set-Content $file -Value $content -NoNewline

Write-Host "All response calls now have returns!" -ForegroundColor Green
