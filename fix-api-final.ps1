# Fix remaining API route errors
$file = "backend\src\api\ai-quality-validation.ts"
$content = Get-Content $file -Raw

# Fix 1: Agent performance route - add return before catch
$content = $content -replace '(\s+\}\);\s+)(}\s+catch \(error\) \{\s+console\.error\(''Error validating agent performance'')', '    });
    return;$2'

# Fix 2: Reports generate route - add return before catch  
$content = $content -replace '(router\.post\(''/reports/generate''[\s\S]{1,1500}?}\);)(\s+}\s+catch \(error\) \{\s+console\.error\(''Error generating quality report'')', '$1
    return;$2'

# Fix 3: Get report route - add return before catch
$content = $content -replace '(router\.get\(''/reports/:reportId''[\s\S]{1,500}?}\);)(\s+}\s+catch \(error\) \{\s+console\.error\(''Error fetching quality report'')', '$1
    return;$2'

# Fix 4: Trends route - add return before catch
$content = $content -replace '(router\.get\(''/trends''[\s\S]{1,900}?}\);)(\s+}\s+catch \(error\) \{\s+console\.error\(''Error fetching quality trends'')', '$1
    return;$2'

# Fix 5: Cache invalidate route - add return before catch
$content = $content -replace '(router\.post\(''/cache/invalidate''[\s\S]{1,600}?}\);)(\s+}\s+catch \(error\) \{\s+console\.error\(''Error invalidating cache'')', '$1
    return;$2'

# Fix 6: Redis client initialization - fix password
$content = $content -replace 'const client = new redis\(\{[\s\S]*?password: process\.env\.REDIS_PASSWORD,[\s\S]*?\}\);', @"
const redisConf: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };
    if (process.env.REDIS_PASSWORD) {
      redisConf.password = process.env.REDIS_PASSWORD;
    }
    const client = new redis(redisConf);
"@

$content | Set-Content $file -NoNewline
Write-Host "✅ Fixed all API route errors" -ForegroundColor Green
