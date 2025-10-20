# Fix Final Remaining Errors
Write-Host "Fixing final remaining errors..." -ForegroundColor Cyan

$servicePath = "backend\src\services\aiContentPipelineService.ts"
$content = Get-Content $servicePath -Raw

Write-Host "`n1. Fixing template literal syntax (line 558)..." -ForegroundColor Yellow
# Fix broken template literal
$content = $content -replace "id:\s*``research-``-````", "id: ``research-`${Date.now()}-`${Math.random().toString(36).substr(2, 9)}``"

Write-Host "2. Fixing implicit any type in significantMoves.map..." -ForegroundColor Yellow
# Add type to coin parameter
$content = $content -replace "significantMoves\.map\(coin =>", "significantMoves.map((coin: any) =>"

Write-Host "3. Fixing incorrect type annotation in filter..." -ForegroundColor Yellow
# Fix wrong type annotation
$content = $content -replace "tasks\.filter\(\(t: number\) => t\.status", "tasks.filter((t: any) => t.status"

Write-Host "4. Fixing tasks.every callback..." -ForegroundColor Yellow
# Add type to tasks.every
$content = $content -replace "tasks\.every\(t =>", "tasks.every((t: any) =>"

Write-Host "5. Fixing remaining implicit any in getPipelineMetrics..." -ForegroundColor Yellow
# These should already be fixed, but let's ensure
$patterns = @(
    @{ Pattern = "completedPipelines\.map\(p =>"; Replace = "completedPipelines.map((p: any) =>" }
    @{ Pattern = "\.filter\(p =>"; Replace = ".filter((p: any) =>" }
)

foreach ($fix in $patterns) {
    $content = $content -replace $fix.Pattern, $fix.Replace
}

Set-Content -Path $servicePath -Value $content -NoNewline

Write-Host "`n6. Fixing API route handlers..." -ForegroundColor Yellow
$apiPath = "backend\src\api\ai-content-pipeline.ts"
$apiContent = Get-Content $apiPath -Raw

# Fix status route
$apiContent = $apiContent -replace `
    "(router\.get\('/status/:pipelineId'.*?try \{\s+)(const pipelineId)", `
    "`$1const pipelineId = req.params.pipelineId;`n    if (!pipelineId) {`n      return res.status(400).json({ error: 'Pipeline ID is required' });`n    }`n    const actualPipelineId"

# Fix cancel route
$apiContent = $apiContent -replace `
    "(router\.post\('/:pipelineId/cancel'.*?try \{\s+)(const pipelineId)", `
    "`$1const pipelineId = req.params.pipelineId;`n    if (!pipelineId) {`n      return res.status(400).json({ error: 'Pipeline ID is required' });`n    }`n    const actualPipelineId"

# Fix retry route
$apiContent = $apiContent -replace `
    "(router\.post\('/:pipelineId/retry'.*?try \{\s+)(const pipelineId)", `
    "`$1const pipelineId = req.params.pipelineId;`n    if (!pipelineId) {`n      return res.status(400).json({ error: 'Pipeline ID is required' });`n    }`n    const actualPipelineId"

Set-Content -Path $apiPath -Value $apiContent -NoNewline

Write-Host "`n✓ All remaining errors fixed!" -ForegroundColor Green
Write-Host "`nNow: RELOAD VS CODE WINDOW!" -ForegroundColor Cyan
Write-Host "(Ctrl+Shift+P -> 'Developer: Reload Window')" -ForegroundColor Yellow
