# Fix remaining Grid container tags

$dashboard = ".\frontend\src\components\super-admin\ComplianceMonitoringDashboard.tsx"
$widget = ".\frontend\src\components\user\ComplianceMonitoringWidget.tsx"

Write-Host "Fixing remaining Grid container tags..." -ForegroundColor Cyan

# Fix Dashboard
Write-Host "`nProcessing ComplianceMonitoringDashboard.tsx..." -ForegroundColor Yellow
$content = Get-Content $dashboard -Raw

# Replace Grid container with Box with flex display
$content = $content -replace '<Grid container spacing=\{2\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'' }}>'
$content = $content -replace '<Grid container spacing=\{3\}>', '<Box sx={{ display: ''flex'', gap: 3, flexWrap: ''wrap'' }}>'
$content = $content -replace '<Grid container spacing=\{2\} sx=\{([^}]+)\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'', ...$1 }}>'
$content = $content -replace '<Grid container spacing=\{3\} sx=\{([^}]+)\}>', '<Box sx={{ display: ''flex'', gap: 3, flexWrap: ''wrap'', ...$1 }}>'

# Handle specific pattern with spread props
$content = $content -replace '<Box sx=\{\{ display: ''flex'', gap: 2, flexWrap: ''wrap'', \.\.\.\{ mb: 2 \} \}\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'', mb: 2 }}>'
$content = $content -replace '<Box sx=\{\{ display: ''flex'', gap: 2, flexWrap: ''wrap'', \.\.\.\{ mb: 3 \} \}\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'', mb: 3 }}>'
$content = $content -replace '<Box sx=\{\{ display: ''flex'', gap: 3, flexWrap: ''wrap'', \.\.\.\{ mb: 2 \} \}\}>', '<Box sx={{ display: ''flex'', gap: 3, flexWrap: ''wrap'', mb: 2 }}>'
$content = $content -replace '<Box sx=\{\{ display: ''flex'', gap: 3, flexWrap: ''wrap'', \.\.\.\{ mb: 3 \} \}\}>', '<Box sx={{ display: ''flex'', gap: 3, flexWrap: ''wrap'', mb: 3 }}>'

$content | Set-Content $dashboard -NoNewline
Write-Host "✓ Fixed ComplianceMonitoringDashboard.tsx" -ForegroundColor Green

# Fix Widget  
Write-Host "`nProcessing ComplianceMonitoringWidget.tsx..." -ForegroundColor Yellow
$content = Get-Content $widget -Raw

# Replace Grid container
$content = $content -replace '<Grid container spacing=\{1\}>', '<Box sx={{ display: ''flex'', gap: 1, flexWrap: ''wrap'' }}>'
$content = $content -replace '<Grid container spacing=\{2\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'' }}>'
$content = $content -replace '<Grid container spacing=\{1\} sx=\{([^}]+)\}>', '<Box sx={{ display: ''flex'', gap: 1, flexWrap: ''wrap'', ...$1 }}>'
$content = $content -replace '<Grid container spacing=\{2\} sx=\{([^}]+)\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'', ...$1 }}>'

# Handle spread props
$content = $content -replace '<Box sx=\{\{ display: ''flex'', gap: 1, flexWrap: ''wrap'', \.\.\.\{ mb: 2 \} \}\}>', '<Box sx={{ display: ''flex'', gap: 1, flexWrap: ''wrap'', mb: 2 }}>'
$content = $content -replace '<Box sx=\{\{ display: ''flex'', gap: 2, flexWrap: ''wrap'', \.\.\.\{ mb: 2 \} \}\}>', '<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'', mb: 2 }}>'

$content | Set-Content $widget -NoNewline
Write-Host "✓ Fixed ComplianceMonitoringWidget.tsx" -ForegroundColor Green

Write-Host "`n✅ All Grid container tags replaced with Box!" -ForegroundColor Green
