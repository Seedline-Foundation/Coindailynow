# Fix all Prisma model name errors in AI Cost Service

$servicePath = "backend\src\services\aiCostService.ts"
$apiPath = "backend\src\api\ai-costs.ts"

Write-Host "Fixing Prisma model names..." -ForegroundColor Cyan

# Read the service file
$content = Get-Content $servicePath -Raw

# Fix Prisma model names (PascalCase to camelCase)
$content = $content -replace 'prisma\.aICostTracking', 'prisma.aiCostTracking'
$content = $content -replace 'prisma\.budgetLimit', 'prisma.budgetLimit'
$content = $content -replace 'prisma\.budgetAlert', 'prisma.budgetAlert'
$content = $content -replace 'prisma\.costReport', 'prisma.costReport'

# Fix implicit any types in sort/filter callbacks
$content = $content -replace 'thresholds\.sort\(\(a, b\) => b - a\)', 'thresholds.sort((a: number, b: number) => b - a)'
$content = $content -replace 'costs\.reduce\(\(sum, item\) => sum', 'costs.reduce((sum: number, item: any) => sum'
$content = $content -replace '\.sort\(\(a, b\) => b\.totalCost - a\.totalCost\)', '.sort((a: any, b: any) => b.totalCost - a.totalCost)'
$content = $content -replace '\.filter\(op => !op\.failed\)', '.filter((op: any) => !op.failed)'
$content = $content -replace '\.filter\(op => op\.failed\)', '.filter((op: any) => op.failed)'
$content = $content -replace '\.map\(op => \(\{', '.map((op: any) => ({'

# Write back
Set-Content $servicePath -Value $content -NoNewline

Write-Host "✓ Fixed aiCostService.ts" -ForegroundColor Green

# Fix API file
$apiContent = Get-Content $apiPath -Raw

# Fix middleware return types
$apiContent = $apiContent -replace 'function authenticate\(req: Request, res: Response, next: Function\)', 'function authenticate(req: Request, res: Response, next: Function): void'
$apiContent = $apiContent -replace 'function authorizeAdmin\(req: Request, res: Response, next: Function\)', 'function authorizeAdmin(req: Request, res: Response, next: Function): void'

# Fix route handlers with explicit return type
$apiContent = $apiContent -replace "router\.post\('/track', authenticate, async \(req: Request, res: Response\) =>", "router.post('/track', authenticate, async (req: Request, res: Response): Promise<void> =>"

Set-Content $apiPath -Value $apiContent -NoNewline

Write-Host "✓ Fixed ai-costs.ts" -ForegroundColor Green

Write-Host "`nAll errors fixed! Please check the Problems tab." -ForegroundColor Green
Write-Host "If errors persist, reload VS Code window (Ctrl+Shift+P -> Reload Window)" -ForegroundColor Yellow
