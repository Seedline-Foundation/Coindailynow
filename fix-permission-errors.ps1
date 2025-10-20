# Fix PermissionService type errors
Write-Host "🔧 Fixing PermissionService.ts type errors..." -ForegroundColor Cyan

$file = "c:\Users\onech\Desktop\news-platform\backend\src\services\PermissionService.ts"
$content = Get-Content $file -Raw

Write-Host "📝 Fixing undefined to null conversions..." -ForegroundColor Yellow

# Fix type incompatibilities - change undefined to null
$content = $content -replace '(\s+reason:\s+)reason(\s+\|\|\s+null)', '$1reason ?? null'
$content = $content -replace '(\s+notes:\s+)notes(\s+\|\|\s+null)', '$1notes ?? null'
$content = $content -replace '(\s+expiresAt:\s+)expiresAt(\s+\|\|\s+null)', '$1expiresAt ?? null'
$content = $content -replace '(\s+revokeReason:\s+)revokeReason', '$1revokeReason ?? null'
$content = $content -replace '(\s+resourceId:\s+)resourceId', '$1resourceId ?? null'
$content = $content -replace '(\s+errorMessage:\s+)errorMessage', '$1errorMessage ?? null'

$content | Set-Content $file -NoNewline

Write-Host "✅ PermissionService.ts fixed!" -ForegroundColor Green
