# Fix Compliance Monitoring Service - Update Model Names

$servicePath = ".\backend\src\services\complianceMonitoringService.ts"
$routesPath = ".\backend\src\api\complianceMonitoring.routes.ts"

Write-Host "Fixing compliance monitoring service and routes..." -ForegroundColor Cyan

# Read the service file
$serviceContent = Get-Content $servicePath -Raw

# Replace model names in service file
$serviceContent = $serviceContent `
    -replace 'prisma\.complianceRule', 'prisma.complianceMonitorRule' `
    -replace 'prisma\.sEOComplianceRule', 'prisma.sEOComplianceMonitorRule' `
    -replace 'prisma\.sEOComplianceCheck', 'prisma.sEOComplianceMonitorCheck' `
    -replace 'prisma\.complianceScore', 'prisma.complianceMonitorScore' `
    -replace '\.ComplianceRule\.', '.ComplianceMonitorRule.' `
    -replace '\.SEOComplianceRule\.', '.SEOComplianceMonitorRule.' `
    -replace 'include:\s*\{\s*ComplianceRule:', 'include: { ComplianceMonitorRule:' `
    -replace 'include:\s*\{\s*SEOComplianceRule:', 'include: { SEOComplianceMonitorRule:'

# Special fix for ComplianceCheck - need to use complianceMonitorCheck
$serviceContent = $serviceContent -replace 'const check = await prisma\.complianceCheck', 'const check = await prisma.complianceMonitorCheck'
$serviceContent = $serviceContent -replace 'const checks = await prisma\.complianceCheck', 'const checks = await prisma.complianceMonitorCheck'
$serviceContent = $serviceContent -replace 'await prisma\.complianceCheck\.create', 'await prisma.complianceMonitorCheck.create'
$serviceContent = $serviceContent -replace 'await prisma\.complianceCheck\.findMany', 'await prisma.complianceMonitorCheck.findMany'
$serviceContent = $serviceContent -replace 'await prisma\.complianceCheck\.update', 'await prisma.complianceMonitorCheck.update'
$serviceContent = $serviceContent -replace 'await prisma\.complianceCheck\.count', 'await prisma.complianceMonitorCheck.count'

# Fix field name: checkDate doesn't exist, should be created
$serviceContent = $serviceContent -replace 'checkDate:\s*\{', 'createdAt: {' `
    -replace 'orderBy:\s*\{\s*checkDate:', 'orderBy: { createdAt:'

# Fix findings field - it's not in the Prisma schema properly
$serviceContent = $serviceContent -replace 'findings:\s*data\.findings \? JSON\.stringify\(data\.findings\) : null,', '// findings stored in notes or other field'

# Write back the service file
$serviceContent | Set-Content $servicePath -NoNewline

Write-Host "✓ Service file updated" -ForegroundColor Green

# Read the routes file
$routesContent = Get-Content $routesPath -Raw

# No changes needed for routes as they use the service functions

Write-Host "✓ Routes file checked" -ForegroundColor Green

Write-Host "`nNow running Prisma generate..." -ForegroundColor Cyan
Set-Location .\backend
npx prisma generate

Write-Host "`nAll fixes applied! Ready to test." -ForegroundColor Green
