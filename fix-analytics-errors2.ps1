# Fix remaining TypeScript errors in aiAnalyticsService.ts by using non-null assertions

$filePath = "c:\Users\onech\Desktop\news-platform\backend\src\services\aiAnalyticsService.ts"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace all patterns where we check if redisClient exists but TypeScript still complains
# Pattern: if (redisClient) { await redisClient.setex(
$content = $content -replace 'if \(redisClient\) \{\s+await redisClient\.setex\(', 'if (redisClient) {
      await redisClient!.setex('

$content = $content -replace 'if \(!redisClient\) return;\s+const stats = await redisClient\.get\(', 'if (!redisClient) return;
    const stats = await redisClient!.get('

$content = $content -replace '(\s+)await redisClient\.setex\(', '$1await redisClient!.setex('

# Save the fixed content
[System.IO.File]::WriteAllText($filePath, $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Fixed redis non-null assertions in aiAnalyticsService.ts" -ForegroundColor Green
