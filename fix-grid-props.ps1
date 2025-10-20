# Fix Grid props in frontend components

$dashboard = ".\frontend\src\components\super-admin\ComplianceMonitoringDashboard.tsx"
$widget = ".\frontend\src\components\user\ComplianceMonitoringWidget.tsx"

Write-Host "Fixing Grid components..." -ForegroundColor Cyan

# Fix Dashboard
$content = Get-Content $dashboard -Raw
$content = $content -replace '<Grid item xs', '<Grid xs'
$content = $content -replace '<Grid item>', '<Grid>'
$content | Set-Content $dashboard -NoNewline
Write-Host "✓ Fixed ComplianceMonitoringDashboard.tsx" -ForegroundColor Green

# Fix Widget
$content = Get-Content $widget -Raw
$content = $content -replace '<Grid item xs', '<Grid xs'
$content = $content -replace '<Grid item>', '<Grid>'
$content | Set-Content $widget -NoNewline
Write-Host "✓ Fixed ComplianceMonitoringWidget.tsx" -ForegroundColor Green

Write-Host "`nAll Grid components fixed!" -ForegroundColor Green
