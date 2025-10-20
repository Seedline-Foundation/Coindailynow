# Fix remaining TypeScript errors in humanApprovalService.ts

$file = "backend\src\services\humanApprovalService.ts"

Write-Host "Fixing remaining TypeScript errors..." -ForegroundColor Cyan

# Fix all remaining Redis setex calls (wrap in if)
Write-Host "1. Fixing Redis null safety..." -ForegroundColor Yellow
$content = Get-Content $file -Raw

# Fix Redis calls - add null checks
$content = $content -replace 'await redisClient\.setex\(cacheKey, CACHE_TTL\.ITEM, JSON\.stringify\(details\)\);', 'if (redisClient) {
        await redisClient.setex(cacheKey, CACHE_TTL.ITEM, JSON.stringify(details));
      }'

$content = $content -replace 'await redisClient\.setex\(cacheKey, CACHE_TTL\.EDITOR, JSON\.stringify\(editorAssignments\)\);', 'if (redisClient) {
        await redisClient.setex(cacheKey, CACHE_TTL.EDITOR, JSON.stringify(editorAssignments));
      }'

$content = $content -replace 'await redisClient\.setex\(cacheKey, CACHE_TTL\.EDITOR, JSON\.stringify\(metrics\)\);', 'if (redisClient) {
        await redisClient.setex(cacheKey, CACHE_TTL.EDITOR, JSON.stringify(metrics));
      }'

$content = $content -replace 'await redisClient\.setex\(cacheKey, CACHE_TTL\.STATS, JSON\.stringify\(stats\)\);', 'if (redisClient) {
        await redisClient.setex(cacheKey, CACHE_TTL.STATS, JSON.stringify(stats));
      }'

# Fix redis.del spread operator
$content = $content -replace 'await redisClient\.del\(\.\.\.keys\);', 'if (redisClient && keys.length > 0) {
          for (const key of keys) {
            await redisClient.del(key);
          }
        }'

# Fix rollbackWorkflow call - change number to string
$content = $content -replace 'await aiWorkflowService\.rollbackWorkflow\(decision\.workflowId, 1\);', 'await aiWorkflowService.rollbackWorkflow(decision.workflowId, ''CONTENT_REVIEW'');'

# Fix feedback type in processApprovalDecision calls - provide default empty string
$content = $content -replace 'feedback: operation\.feedback,\s*qualityScore', 'feedback: operation.feedback || '''',
                qualityScore'

$content = $content -replace 'feedback: operation\.feedback\s*\}\);', 'feedback: operation.feedback || ''''
            });'

# Fix UserRole enums
$content = $content -replace "role: \{ in: \['EDITOR', 'ADMIN', 'SUPER_ADMIN'\] \}", "role: { in: ['editor', 'admin', 'super_admin'] as UserRole[] }"

# Fix isRead field - remove it (doesn't exist in Prisma schema)
$content = $content -replace 'isRead: false,\s*', ''

Set-Content $file -Value $content -NoNewline

Write-Host "2. Fixing Prisma create data types..." -ForegroundColor Yellow

# Fix humanFeedback and qualityScore - convert undefined to null
$content = Get-Content $file -Raw

# Replace humanFeedback: decision.feedback with humanFeedback: decision.feedback || null
$content = $content -replace '(humanFeedback: )([a-zA-Z.]+)(,)', '$1$2 || null$3'

# Replace qualityScore: decision.qualityScore with qualityScore: decision.qualityScore ?? null
$content = $content -replace '(qualityScore: )([a-zA-Z.?]+)(,)', '$1$2 ?? null$3'

Set-Content $file -Value $content -NoNewline

Write-Host "3. Fixing EditorWithWorkflows type..." -ForegroundColor Yellow

# Need to add ContentWorkflow to the editor query
$content = Get-Content $file -Raw

# Find the editor query and add ContentWorkflow include
$content = $content -replace '(const editors = await prisma\.user\.findMany\(\{[^}]+where: \{[^}]+status: ''active'',[^}]+\},)', '$1
          include: {
            ContentWorkflow: true,
          },'

Set-Content $file -Value $content -NoNewline

Write-Host "4. Fixing WorkflowStep array access..." -ForegroundColor Yellow

# Fix w.WorkflowStep[0].actualDurationMs
$content = Get-Content $file -Raw
$content = $content -replace '(workflows\.filter\(w => w\.WorkflowStep\.length > 0 && )w\.WorkflowStep\[0\]\.actualDurationMs === null', '$1w.WorkflowStep[0]?.actualDurationMs === null'

Set-Content $file -Value $content -NoNewline

Write-Host "`nAll fixes applied!" -ForegroundColor Green
Write-Host "Please check the errors again with: npm run type-check" -ForegroundColor Cyan
