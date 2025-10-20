# Task 6.1 Installation & Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Task 6.1: AI Management Dashboard Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the frontend directory
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the frontend directory." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Checking dependencies..." -ForegroundColor Yellow

# Check if socket.io-client is installed
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$hasSocketIO = $null -ne $packageJson.dependencies."socket.io-client"
$hasRecharts = $null -ne $packageJson.dependencies."recharts"
$hasAxios = $null -ne $packageJson.dependencies."axios"

if ($hasSocketIO -and $hasRecharts) {
    Write-Host "✓ All required dependencies are already installed!" -ForegroundColor Green
} else {
    Write-Host "Installing missing dependencies..." -ForegroundColor Yellow
    
    $toInstall = @()
    if (!$hasSocketIO) { $toInstall += "socket.io-client@^4.7.2" }
    if (!$hasRecharts) { $toInstall += "recharts@^3.2.1" }
    if (!$hasAxios) { $toInstall += "axios@^1.6.0" }
    
    if ($toInstall.Count -gt 0) {
        npm install $toInstall
        Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 2: Verifying file structure..." -ForegroundColor Yellow

# Check if key files exist
$filesToCheck = @(
    "src/services/aiManagementService.ts",
    "src/services/aiWebSocketService.ts",
    "src/app/super-admin/ai-management/page.tsx",
    "src/components/admin/ai/AIAgentsTab.tsx",
    "src/components/admin/ai/AITasksTab.tsx",
    "src/components/admin/ai/WorkflowsTab.tsx",
    "src/components/admin/ai/AnalyticsTab.tsx",
    "src/components/admin/ai/HumanApprovalTab.tsx"
)

$allFilesExist = $true
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

if ($allFilesExist) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Ensure backend API server is running on port 5000" -ForegroundColor White
    Write-Host "2. Ensure WebSocket server is running" -ForegroundColor White
    Write-Host "3. Set environment variables:" -ForegroundColor White
    Write-Host "   - NEXT_PUBLIC_API_URL=http://localhost:5000" -ForegroundColor Gray
    Write-Host "   - NEXT_PUBLIC_WS_URL=ws://localhost:5000" -ForegroundColor Gray
    Write-Host "4. Run: npm run dev" -ForegroundColor White
    Write-Host "5. Navigate to: http://localhost:3000/super-admin/ai-management" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Yellow
    Write-Host "- Complete Report: docs/ai-system/TASK_6.1_COMPLETION_REPORT.md" -ForegroundColor Gray
    Write-Host "- Quick Reference: docs/ai-system/TASK_6.1_QUICK_REFERENCE.md" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "⚠ Setup Incomplete" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Some files are missing. Please ensure all Task 6.1 files have been created." -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
