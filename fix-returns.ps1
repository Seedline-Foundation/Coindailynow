# Fix remaining 5 routes by adding return in catch blocks
$file = "backend\src\api\ai-quality-validation.ts"
$content = Get-Content $file -Raw

# Add return statement in all catch blocks that don't have it
$content = $content -replace '(console\.error\(''Error validating agent performance''[\s\S]{1,300}?\}\);)(\s+}\s+}\);)', '$1
    return;$2'

$content = $content -replace '(console\.error\(''Error generating quality report''[\s\S]{1,300}?\}\);)(\s+}\s+}\);)', '$1
    return;$2'

$content = $content -replace '(console\.error\(''Error fetching quality report''[\s\S]{1,300}?\}\);)(\s+}\s+}\);)', '$1
    return;$2'

$content = $content -replace '(console\.error\(''Error fetching quality trends''[\s\S]{1,300}?\}\);)(\s+}\s+}\);)', '$1
    return;$2'

$content = $content -replace '(console\.error\(''Error invalidating cache''[\s\S]{1,300}?\}\);)(\s+}\s+}\);)', '$1
    return;$2'

$content | Set-Content $file -NoNewline
Write-Host "✅ Fixed all remaining route return statements" -ForegroundColor Green
