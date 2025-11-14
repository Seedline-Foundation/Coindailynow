# Error Analysis Script
# Run this to get a detailed breakdown of TypeScript errors
# Usage: .\scripts\analyze-errors.ps1

Write-Host "🔍 Analyzing TypeScript Errors..." -ForegroundColor Cyan
Write-Host ""

# Run TypeScript compiler and capture output
$tscOutput = npx tsc --noEmit 2>&1

# Count total errors
$errors = $tscOutput | Select-String "error TS"
$totalErrors = $errors.Count

Write-Host "📊 Total Errors: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 100) { "Red" } elseif ($totalErrors -gt 50) { "Yellow" } else { "Green" })
Write-Host ""

if ($totalErrors -eq 0) {
    Write-Host "🎉 No TypeScript errors found!" -ForegroundColor Green
    exit 0
}

# Group errors by type
Write-Host "📋 Error Breakdown by Type:" -ForegroundColor Yellow
$errorGroups = $errors | ForEach-Object {
    if ($_ -match "error (TS\d+):") {
        $matches[1]
    }
} | Group-Object | Sort-Object Count -Descending | Select-Object -First 10

$errorGroups | ForEach-Object {
    Write-Host "   $($_.Name): $($_.Count) occurrences" -ForegroundColor White
}
Write-Host ""

# Group errors by file
Write-Host "📁 Top 10 Files with Most Errors:" -ForegroundColor Yellow
$fileErrors = $errors | ForEach-Object {
    if ($_ -match "([^(]+)\(\d+,\d+\):") {
        $matches[1]
    }
} | Group-Object | Sort-Object Count -Descending | Select-Object -First 10

$fileErrors | ForEach-Object {
    $fileName = Split-Path $_.Name -Leaf
    Write-Host "   $fileName`: $($_.Count) errors" -ForegroundColor White
}
Write-Host ""

# Check for common error patterns
Write-Host "🔍 Common Error Patterns:" -ForegroundColor Yellow

$patterns = @{
    "Missing fields" = "Property '.*' is missing in type"
    "Type mismatch" = "Type '.*' is not assignable to type"
    "Cannot find module" = "Cannot find module"
    "Cannot find name" = "Cannot find name"
    "Property does not exist" = "Property '.*' does not exist"
}

foreach ($pattern in $patterns.GetEnumerator()) {
    $count = ($tscOutput | Select-String $pattern.Value).Count
    if ($count -gt 0) {
        Write-Host "   $($pattern.Key): $count" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor Cyan
if ($totalErrors -gt 200) {
    Write-Host "   - Focus on Phase 1: Fix Prisma schema and regenerate client" -ForegroundColor White
} elseif ($totalErrors -gt 100) {
    Write-Host "   - Focus on Phase 2-3: Fix type exports and core services" -ForegroundColor White
} elseif ($totalErrors -gt 50) {
    Write-Host "   - Focus on Phase 4-5: Fix test mocks and bulk patterns" -ForegroundColor White
} else {
    Write-Host "   - Almost there! Focus on Phase 6: Individual service fixes" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Full error log saved to: type-errors-detail.txt" -ForegroundColor Gray
$tscOutput | Out-File -FilePath "type-errors-detail.txt"
