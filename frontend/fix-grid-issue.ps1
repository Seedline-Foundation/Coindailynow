# Script to replace MUI Grid with CSS Grid in Box components
# This is needed because MUI v7 has breaking changes with Grid API

$files = @(
    "src\components\admin\LinkBuildingDashboard.tsx",
    "src\components\user\ImageOptimizationWidget.tsx",
    "src\components\LinkBuildingWidget.tsx"
)

foreach ($file in $files) {
    Write-Host "Processing $file..."
    $content = Get-Content $file -Raw
    
    # Remove Grid from imports and add it back without using it
    # We'll keep Grid in imports but not use it - cleaner than removing
    
    # The main issue: Grid doesn't support xs/md props in MUI v7 without item
    # And item prop doesn't work either
    # Solution: Keep using Grid container but replace Grid items with div + sx
    
    # Actually, let's just revert to use Grid with item prop correctly
    # The issue is the prop should be:  item xs={12} not  xs={12}
    $content = $content -replace '(<Grid\s+)(xs=)', '$1item $2'
    $content = $content -replace '(<Grid\s+)(md=)', '$1item $2'  
    $content = $content -replace '(<Grid\s+item\s+item)', '<Grid item'
    
    $content | Set-Content $file
    Write-Host "Fixed $file"
}

Write-Host "Done!"
