# Fix all remaining TypeScript errors in aiAnalyticsService.ts

$filePath = "c:\Users\onech\Desktop\news-platform\backend\src\services\aiAnalyticsService.ts"
$content = Get-Content $filePath -Raw

# Fix all redis calls that are still using optional chaining after if statement
$content = $content -replace 'if \(redisClient\) \{\s+await redisClient\.setex', 'if (redisClient) {
      await redisClient.setex'

# Fix any remaining await redisClient?.setex to await redisClient.setex when inside if check
$content = $content -replace '(\s+)await redisClient\?\.setex', '$1await redisClient.setex'
$content = $content -replace '(\s+)await redisClient\?\.set\(', '$1await redisClient.set('
$content = $content -replace '(\s+)await redisClient\?\.get\(', '$1await redisClient.get('

# Save the fixed content
$content | Set-Content $filePath -NoNewline

Write-Host "Fixed redis calls in aiAnalyticsService.ts" -ForegroundColor Green
