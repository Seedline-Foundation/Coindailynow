# Fix Grid components by switching to Box/Stack layout

$dashboard = ".\frontend\src\components\super-admin\ComplianceMonitoringDashboard.tsx"
$widget = ".\frontend\src\components\user\ComplianceMonitoringWidget.tsx"

Write-Host "Fixing Grid components by switching to Box..." -ForegroundColor Cyan

# Fix Dashboard
Write-Host "`nProcessing ComplianceMonitoringDashboard.tsx..." -ForegroundColor Yellow
$content = Get-Content $dashboard -Raw

# Update imports - remove Grid, add Stack if needed
$content = $content -replace 'Grid,\s*', ''
$content = $content -replace ',\s*Grid', ''

# Replace Grid components with Box
# Pattern 1: <Grid xs={12} md={3}> becomes <Box sx={{ flex: '1 1 25%', minWidth: '250px', p: 1 }}>
$content = $content -replace '<Grid xs=\{12\} md=\{3\}>', '<Box sx={{ flex: ''1 1 25%'', minWidth: ''250px'', p: 1 }}>'
$content = $content -replace '<Grid xs=\{12\} md=\{4\}>', '<Box sx={{ flex: ''1 1 33%'', minWidth: ''300px'', p: 1 }}>'
$content = $content -replace '<Grid xs=\{12\}>', '<Box sx={{ width: ''100%'', p: 1 }}>'
$content = $content -replace '<Grid xs=\{6\}>', '<Box sx={{ flex: ''1 1 50%'', minWidth: ''200px'', p: 1 }}>'
$content = $content -replace '<Grid xs=\{4\}>', '<Box sx={{ flex: ''1 1 33%'', minWidth: ''150px'', p: 1 }}>'

# Handle Grid with key attribute
$content = $content -replace '<Grid xs=\{12\} key=\{([^}]+)\}>', '<Box key={$1} sx={{ width: ''100%'', p: 1 }}>'

# Replace closing Grid tags
$content = $content -replace '</Grid>', '</Box>'

# Wrap multiple Box items in Box with display flex
# Find the section with score cards (4 cards in a row)
$content = $content -replace '(<Typography[^>]*>Score Cards</Typography>.*?)<Box sx=\{\{ flex:', '$1<Box sx={{ display: ''flex'', gap: 2, flexWrap: ''wrap'', mb: 3 }}><Box sx={{ flex:'

$content | Set-Content $dashboard -NoNewline
Write-Host "✓ Fixed ComplianceMonitoringDashboard.tsx" -ForegroundColor Green

# Fix Widget
Write-Host "`nProcessing ComplianceMonitoringWidget.tsx..." -ForegroundColor Yellow
$content = Get-Content $widget -Raw

# Update imports
$content = $content -replace 'Grid,\s*', ''
$content = $content -replace ',\s*Grid', ''

# Replace Grid components
$content = $content -replace '<Grid xs=\{4\}>', '<Box sx={{ flex: ''1 1 33%'', minWidth: ''120px'', p: 0.5 }}>'
$content = $content -replace '<Grid xs=\{6\}>', '<Box sx={{ flex: ''1 1 50%'', minWidth: ''150px'', p: 1 }}>'
$content = $content -replace '<Grid xs=\{12\}>', '<Box sx={{ width: ''100%'', p: 1 }}>'
$content = $content -replace '</Grid>', '</Box>'

$content | Set-Content $widget -NoNewline
Write-Host "✓ Fixed ComplianceMonitoringWidget.tsx" -ForegroundColor Green

Write-Host "`n✅ All Grid components replaced with Box!" -ForegroundColor Green
Write-Host "`nNote: You may need to adjust spacing/layout manually." -ForegroundColor Cyan
