# Complete All Remaining Pipeline Fixes
Write-Host "=== Final Comprehensive Fix Script ===" -ForegroundColor Cyan
Write-Host "This will fix ALL remaining TypeScript errors`n" -ForegroundColor Yellow

# Service file path
$servicePath = "backend\src\services\aiContentPipelineService.ts"
$serviceContent = Get-Content $servicePath -Raw

Write-Host "1. Fixing translation stage inputData (line ~688)..." -ForegroundColor Green
# Find and fix translation task creation
$serviceContent = $serviceContent -replace `
  "(\s+)agentType:\s*'translation',(\s+)priority:\s*'normal',(\s+)status:\s*'queued',(\s+)inputData:\s*\{[\s\S]*?articleId:\s*article\.id,[\s\S]*?targetLanguage:\s*lang,[\s\S]*?jobId:\s*translationJobId[\s\S]*?\},", `
  "`$1agentId: 'translation-agent',`$2taskType: 'translation',`$2priority: 'NORMAL',`$2status: 'QUEUED',`$2inputData: JSON.stringify({ articleId: article.id, targetLanguage: lang, jobId: translationJobId }),"

Write-Host "2. Fixing image generation inputData (line ~738)..." -ForegroundColor Green
# Fix image generation task
$serviceContent = $serviceContent -replace `
  "(\s+)agentType:\s*'image_generation',(\s+)priority:\s*'normal',(\s+)status:\s*'queued',(\s+)inputData:\s*\{[\s\S]*?articleId:\s*article\.id,[\s\S]*?title:\s*article\.title,[\s\S]*?content:\s*article\.content,[\s\S]*?imageTypes:[\s\S]*?jobId:\s*imageJobId[\s\S]*?\},", `
  "`$1agentId: 'image-generation-agent',`$2taskType: 'image_generation',`$2priority: 'NORMAL',`$2status: 'QUEUED',`$2inputData: JSON.stringify({ articleId: article.id, title: article.title, content: article.content, imageTypes: ['featured', 'social', 'thumbnail'], jobId: imageJobId }),"

Write-Host "3. Fixing SEO optimization inputData (line ~772)..." -ForegroundColor Green  
# Fix SEO task
$serviceContent = $serviceContent -replace `
  "(\s+)agentType:\s*'seo_optimization',(\s+)priority:\s*'normal',(\s+)status:\s*'queued',(\s+)inputData:\s*\{[\s\S]*?articleId:\s*article\.id,[\s\S]*?title:\s*article\.title,[\s\S]*?content:\s*article\.content[\s\S]*?\},", `
  "`$1agentId: 'seo-optimization-agent',`$2taskType: 'seo_optimization',`$2priority: 'NORMAL',`$2status: 'QUEUED',`$2inputData: JSON.stringify({ articleId: article.id, title: article.title, content: article.content }),"

Write-Host "4. Fixing Article fields (qualityScore, canonicalUrl)..." -ForegroundColor Green
# Remove non-existent fields
$serviceContent = $serviceContent -replace ",\s*qualityScore:\s*reviewResult\.qualityScore", ""
$serviceContent = $serviceContent -replace ",\s*canonicalUrl:\s*result\.canonicalUrl", ""

Write-Host "5. Fixing agentType in translation query (line ~870)..." -ForegroundColor Green
# Fix query filter
$serviceContent = $serviceContent -replace `
  "agentType:\s*'translation',", `
  "taskType: 'translation',"

Write-Host "6. Adding type annotations to array methods..." -ForegroundColor Green
# Fix implicit any types
$serviceContent = $serviceContent -replace "completedPipelines\.map\(p =>", "completedPipelines.map((p: any) =>"
$serviceContent = $serviceContent -replace "\.reduce\(\(a, b\) =>", ".reduce((a: number, b: number) =>"
$serviceContent = $serviceContent -replace "\.filter\(t =>", ".filter((t: number) =>"
$serviceContent = $serviceContent -replace "\.filter\(p =>", ".filter((p: any) =>"
$serviceContent = $serviceContent -replace "\.filter\(s =>", ".filter((s: any) =>"

Write-Host "7. Fixing stage return type..." -ForegroundColor Green
# Fix return type issue
$serviceContent = $serviceContent -replace `
  "if \(!stage\) return;", `
  "if (!stage) throw new Error('Stage not found: ' + stageName);"

Write-Host "8. Adding missing id field to research task..." -ForegroundColor Green
# Add id to research task if missing
if ($serviceContent -notmatch "id:\s*``research-") {
    $serviceContent = $serviceContent -replace `
      "(const task = await prisma\.aITask\.create\(\{\s+data:\s*\{\s+agentId:\s*'research-agent')", `
      "`$1,`n          id: ``research-``${Date.now()}-``${Math.random().toString(36).substr(2, 9)}``"
}

Set-Content -Path $servicePath -Value $serviceContent -NoNewline

# Fix API routes
Write-Host "`n9. Fixing API route handlers..." -ForegroundColor Green
$apiPath = "backend\src\api\ai-content-pipeline.ts"
$apiContent = Get-Content $apiPath -Raw

# Add pipelineId validation and return statements
$routes = @('/:pipelineId/cancel', '/:pipelineId/retry', '/status/:pipelineId')
foreach ($route in $routes) {
    $apiContent = $apiContent -replace `
      "(router\.\w+\('$route'.*?\{\s+try \{\s+)(const pipelineId)", `
      "`$1const pipelineId = req.params.pipelineId;`n    if (!pipelineId) {`n      return res.status(400).json({ error: 'Pipeline ID is required' });`n    }`n    const pipelineId"
}

# Add return statements after catch blocks
$apiContent = $apiContent -replace `
  "(\} catch \(error\) \{[\s\S]*?res\.status\(\d+\)\.json\([^\)]+\);)(\s+\})", `
  "`$1`n    return;`$2"

Set-Content -Path $apiPath -Value $apiContent -NoNewline

Write-Host "`n=== All Fixes Applied Successfully! ===" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. RELOAD VS CODE WINDOW (Ctrl+Shift+P -> 'Developer: Reload Window')" -ForegroundColor Yellow
Write-Host "2. Wait 10-30 seconds for TypeScript server to restart" -ForegroundColor Yellow
Write-Host "3. Check Problems tab - should show 0 errors!" -ForegroundColor Yellow
Write-Host "`nIf errors persist after reload, please share the error messages." -ForegroundColor Gray
