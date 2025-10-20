# Replace all redisClient calls with safe wrapper functions

$filePath = "c:\Users\onech\Desktop\news-platform\backend\src\services\aiAnalyticsService.ts"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace setex calls
$content = $content -replace 'await redisClient!\.setex\(([^,]+),\s*([^,]+),\s*([^)]+)\);', 'await safeRedisSetex($1, $2, $3);'

# Replace set calls  
$content = $content -replace 'await redisClient!\.set\(([^,]+),\s*([^)]+)\);', 'await safeRedisSet($1, $2);'

# Replace get calls
$content = $content -replace 'await redisClient!\.get\(([^)]+)\)', 'await safeRedisGet($1)'
$content = $content -replace 'await redisClient\?\.get\(([^)]+)\)', 'await safeRedisGet($1)'

# Save the fixed content
[System.IO.File]::WriteAllText($filePath, $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Replaced redis calls with safe wrappers" -ForegroundColor Green
