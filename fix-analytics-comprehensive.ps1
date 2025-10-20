# Comprehensive fix for all remaining TypeScript errors

$filePath = "c:\Users\onech\Desktop\news-platform\backend\src\services\aiAnalyticsService.ts"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace all remaining redis calls within if blocks
$content = $content -replace 'if \(!dateRange && redisClient\) \{\s+await redisClient!\.setex\(\s*CACHE_KEYS\.AGENT_ANALYTICS\(agentId\),\s*CACHE_TTL\.AGENT_ANALYTICS,\s*JSON\.stringify\(analytics\)\s*\);\s+\}', 'if (!dateRange) {
      await safeRedisSetex(CACHE_KEYS.AGENT_ANALYTICS(agentId), CACHE_TTL.AGENT_ANALYTICS, JSON.stringify(analytics));
    }'

$content = $content -replace 'if \(!dateRange && redisClient\) \{\s+await redisClient!\.setex\(CACHE_KEYS\.COSTS, CACHE_TTL\.COSTS, JSON\.stringify\(breakdown\)\);\s+\}', 'if (!dateRange) {
      await safeRedisSetex(CACHE_KEYS.COSTS, CACHE_TTL.COSTS, JSON.stringify(breakdown));
    }'

$content = $content -replace 'if \(redisClient\) \{\s+await redisClient!\.setex\(cacheKey, CACHE_TTL\.PERFORMANCE, JSON\.stringify\(trends\)\);\s+\}', 'await safeRedisSetex(cacheKey, CACHE_TTL.PERFORMANCE, JSON.stringify(trends));'

$content = $content -replace 'if \(redisClient\) \{\s+await redisClient!\.setex\(\s*CACHE_KEYS\.RECOMMENDATIONS,\s*CACHE_TTL\.RECOMMENDATIONS,\s*JSON\.stringify\(recommendations\)\s*\);\s+\}', 'await safeRedisSetex(CACHE_KEYS.RECOMMENDATIONS, CACHE_TTL.RECOMMENDATIONS, JSON.stringify(recommendations));'

$content = $content -replace 'if \(!redisClient\) return;\s+const stats = await redisClient!\.get\(CACHE_KEYS\.CACHE_STATS\);\s+const current = stats \? JSON\.parse\(stats\) : \{ hits: 0, misses: 0 \};\s+current\.hits\+\+;\s+await redisClient!\.setex\(CACHE_KEYS\.CACHE_STATS, 3600, JSON\.stringify\(current\)\);', 'const stats = await safeRedisGet(CACHE_KEYS.CACHE_STATS);
    const current = stats ? JSON.parse(stats) : { hits: 0, misses: 0 };
    current.hits++;
    await safeRedisSetex(CACHE_KEYS.CACHE_STATS, 3600, JSON.stringify(current));'

$content = $content -replace 'if \(!redisClient\) return;\s+const stats = await redisClient!\.get\(CACHE_KEYS\.CACHE_STATS\);\s+const current = stats \? JSON\.parse\(stats\) : \{ hits: 0, misses: 0 \};\s+current\.misses\+\+;\s+await redisClient!\.setex\(CACHE_KEYS\.CACHE_STATS, 3600, JSON\.stringify\(current\)\);', 'const stats = await safeRedisGet(CACHE_KEYS.CACHE_STATS);
    const current = stats ? JSON.parse(stats) : { hits: 0, misses: 0 };
    current.misses++;
    await safeRedisSetex(CACHE_KEYS.CACHE_STATS, 3600, JSON.stringify(current));'

# Save the fixed content
[System.IO.File]::WriteAllText($filePath, $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Applied comprehensive fixes to aiAnalyticsService.ts" -ForegroundColor Green
