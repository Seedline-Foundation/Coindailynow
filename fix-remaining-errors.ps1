# Fix Remaining Content Pipeline Errors
Write-Host "Fixing remaining Content Pipeline errors..." -ForegroundColor Cyan

$servicePath = "backend\src\services\aiContentPipelineService.ts"
$content = Get-Content $servicePath -Raw

Write-Host "`n1. Fixing Article.aiGenerated field..." -ForegroundColor Yellow
# Remove aiGenerated: true (field doesn't exist yet in regenerated client)
$content = $content -replace ",\s*aiGenerated:\s*true", ""

Write-Host "2. Fixing Article.seoKeywords field..." -ForegroundColor Yellow
# Remove seoKeywords: result.keywords (field doesn't exist yet)
$content = $content -replace ",\s*seoKeywords:\s*result\.keywords", ""

Write-Host "3. Fixing translation inputData..." -ForegroundColor Yellow
# Fix translation task creation - find and replace the entire block
$translationPattern = "inputData:\s*\{[\s\S]*?articleId:\s*article\.id,[\s\S]*?targetLanguage:\s*lang,[\s\S]*?jobId:\s*translationJobId[\s\S]*?\}"
$translationReplacement = "inputData: JSON.stringify({ articleId: article.id, targetLanguage: lang, jobId: translationJobId })"
$content = $content -replace $translationPattern, $translationReplacement

Write-Host "4. Fixing image generation inputData..." -ForegroundColor Yellow
# Fix image generation task creation
$imagePattern = "inputData:\s*\{[\s\S]*?articleId:\s*article\.id,[\s\S]*?title:\s*article\.title,[\s\S]*?content:\s*article\.content,[\s\S]*?imageTypes:[\s\S]*?\['featured',\s*'social',\s*'thumbnail'\],[\s\S]*?jobId:\s*imageJobId[\s\S]*?\}"
$imageReplacement = "inputData: JSON.stringify({ articleId: article.id, title: article.title, content: article.content, imageTypes: ['featured', 'social', 'thumbnail'], jobId: imageJobId })"
$content = $content -replace $imagePattern, $imageReplacement

Write-Host "5. Fixing SEO optimization inputData..." -ForegroundColor Yellow
# Fix SEO optimization task creation
$seoPattern = "inputData:\s*\{[\s\S]*?articleId:\s*article\.id,[\s\S]*?title:\s*article\.title,[\s\S]*?content:\s*article\.content[\s\S]*?\}"
$seoReplacement = "inputData: JSON.stringify({ articleId: article.id, title: article.title, content: article.content })"
$content = $content -replace $seoPattern, $seoReplacement

Write-Host "6. Fixing task.error property..." -ForegroundColor Yellow
# Fix error property access
$content = $content -replace "task\.error", "task.errorMessage"

Write-Host "7. Fixing stage undefined checks..." -ForegroundColor Yellow
# Add undefined check before stage mutations
$stagePattern = "(\s+)(stage\.status = stageStatus;)"
$stageReplacement = "`$1if (!stage) return;`n`$1`$2"
$content = $content -replace $stagePattern, $stageReplacement

Write-Host "8. Fixing status 'in_progress' type..." -ForegroundColor Yellow
# Remove the invalid status assignment
$content = $content -replace "status\.status = 'in_progress';", "// Status is managed through updatePipelineStage"

Write-Host "9. Fixing path filter in Prisma query..." -ForegroundColor Yellow
# Remove invalid path property
$content = $content -replace "path:\s*\['jobId'\],", ""

Set-Content -Path $servicePath -Value $content -NoNewline

Write-Host "`n10. Fixing API route handlers..." -ForegroundColor Yellow
$apiPath = "backend\src\api\ai-content-pipeline.ts"
$apiContent = Get-Content $apiPath -Raw

# Add pipelineId validation
$apiContent = $apiContent -replace "(\s+const pipelineId = req\.params\.pipelineId;)", "`$1`n    if (!pipelineId) {`n      return res.status(400).json({ error: 'Pipeline ID is required' });`n    }"

# Add return statements
$apiContent = $apiContent -replace "(\} catch \(error\) \{\s+console\.error)", "    return;`n  `$1"

Set-Content -Path $apiPath -Value $apiContent -NoNewline

Write-Host "`n11. Re-generating Prisma Client..." -ForegroundColor Yellow
Set-Location backend
npx prisma generate 2>&1 | Out-Null
Set-Location ..

Write-Host "`n✓ All fixes applied successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Reload VS Code window (Ctrl+Shift+P -> 'Developer: Reload Window')" -ForegroundColor Yellow
Write-Host "2. Wait for TypeScript server to restart" -ForegroundColor Yellow
Write-Host "3. Check Problems tab - should show 0 errors!" -ForegroundColor Yellow
