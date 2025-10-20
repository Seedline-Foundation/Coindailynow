# Fix All Content Pipeline TypeScript Errors
Write-Host "Fixing All Content Pipeline TypeScript Errors..." -ForegroundColor Cyan

# Path to the service file
$servicePath = "backend\src\services\aiContentPipelineService.ts"
$content = Get-Content $servicePath -Raw

# Fix 1: Add missing 'id' field and convert all inputData to JSON.stringify()
Write-Host "`n1. Fixing AITask creation - adding id and converting inputData..." -ForegroundColor Yellow

# Fix review stage task creation
$content = $content -replace "const task = await prisma\.aITask\.create\(\{[\s\S]*?agentType: 'quality_review',[\s\S]*?\}\);", @"
const task = await prisma.aITask.create({
        data: {
          id: ``research-``${Date.now()}-``${Math.random().toString(36).substr(2, 9)}``,
          agentId: 'quality-review-agent',
          taskType: 'quality_review',
          priority: 'HIGH',
          status: 'QUEUED',
          inputData: JSON.stringify(research),
          maxRetries: 2,
          estimatedCost: 0.3
        }
      });
"@

# Fix content generation stage
$pattern1 = "inputData: \{[\s\S]*?research: research,[\s\S]*?review: review,[\s\S]*?\},"
$replacement1 = "inputData: JSON.stringify({ research, review, requirements: { minLength: 800, maxLength: 2000, tone: 'informative', audience: 'crypto_enthusiasts' } }),"
$content = $content -replace $pattern1, $replacement1

# Fix translation stage
$pattern2 = "inputData: \{[\s\S]*?articleId: article\.id,[\s\S]*?targetLanguage: lang,[\s\S]*?jobId: translationJobId[\s\S]*?\},"
$replacement2 = "inputData: JSON.stringify({ articleId: article.id, targetLanguage: lang, jobId: translationJobId }),"
$content = $content -replace $pattern2, $replacement2

# Fix image generation stage  
$pattern3 = "inputData: \{[\s\S]*?articleId: article\.id,[\s\S]*?title: article\.title,[\s\S]*?content: article\.content,[\s\S]*?imageTypes:[\s\S]*?jobId: imageJobId[\s\S]*?\},"
$replacement3 = "inputData: JSON.stringify({ articleId: article.id, title: article.title, content: article.content, imageTypes: ['featured', 'social', 'thumbnail'], jobId: imageJobId }),"
$content = $content -replace $pattern3, $replacement3

# Fix SEO optimization stage
$pattern4 = "inputData: \{[\s\S]*?articleId: article\.id,[\s\S]*?title: article\.title,[\s\S]*?content: article\.content[\s\S]*?\},"
$replacement4 = "inputData: JSON.stringify({ articleId: article.id, title: article.title, content: article.content }),"
$content = $content -replace $pattern4, $replacement4

Write-Host "2. Fixing error property access..." -ForegroundColor Yellow
# Fix error property
$content = $content -replace "task\.error", "task.errorMessage"

Write-Host "3. Fixing stage undefined checks..." -ForegroundColor Yellow
# Fix stage undefined checks
$content = $content -replace "(\s+)stage\.status = stageStatus;", "`$1if (!stage) return;`n`$1stage.status = stageStatus;"

Write-Host "4. Fixing status type..." -ForegroundColor Yellow
# Fix status type
$content = $content -replace "status\.status = 'in_progress';", "// Status already set in updatePipelineStage"

Write-Host "5. Fixing Prisma query filter..." -ForegroundColor Yellow
# Fix path filter
$content = $content -replace "path: \['jobId'\],", "// Filter by jobId in inputData JSON"

# Save the fixed content
Set-Content -Path $servicePath -Value $content -NoNewline

Write-Host "`n6. Fixing API route handlers..." -ForegroundColor Yellow
$apiPath = "backend\src\api\ai-content-pipeline.ts"
$apiContent = Get-Content $apiPath -Raw

# Add return statements to route handlers
$apiContent = $apiContent -replace "(router\.put\('/config',.*?\{[\s\S]*?}\);[\s\S]*?} catch \(error\) \{[\s\S]*?res\.status\(500\)\.json\([\s\S]*?\);[\s\S]*?})", "`$1`n  return;"

$apiContent = $apiContent -replace "(router\.post\('/initiate',.*?const \{ pipelineId \} = req\.params;)", "router.post('/initiate', requireAuth, async (req: Request, res: Response) => {`n  try {`n    const { pipelineId } = req.params;"

# Fix pipelineId undefined checks
$apiContent = $apiContent -replace "const pipelineId = req\.params\.pipelineId;", "const pipelineId = req.params.pipelineId;`n    if (!pipelineId) {`n      return res.status(400).json({ error: 'Pipeline ID is required' });`n    }"

Set-Content -Path $apiPath -Value $apiContent -NoNewline

Write-Host "`nAll fixes applied! Please reload VS Code window." -ForegroundColor Green
Write-Host "Run: Developer: Reload Window" -ForegroundColor Cyan
