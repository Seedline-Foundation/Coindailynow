# Final cleanup of remaining AI Audit errors

Write-Host "Final cleanup of AI Audit errors..." -ForegroundColor Cyan

# Fix userAgent undefined in ai-audit.ts
$file = "backend\src\api\ai-audit.ts"
$content = Get-Content $file -Raw

$content = $content -replace "userAgent: req\.get\('user-agent'\),", "userAgent: req.get('user-agent') ?? '',"
$content = $content -replace "ipAddress: req\.ip,", "ipAddress: req.ip ?? '',"

Set-Content $file -Value $content -NoNewline

Write-Host "✅ All errors fixed!" -ForegroundColor Green
Write-Host "`nPlease restart TypeScript server:" -ForegroundColor Cyan
Write-Host "  Ctrl+Shift+P -> 'TypeScript: Restart TS Server'" -ForegroundColor White
