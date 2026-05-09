# CoinDaily Platform - Directory Reorganization Script
$RootPath = "C:\Users\user\Desktop\news-platform"
$DocumentationsPath = "$RootPath\documentations"

Write-Host "CoinDaily Platform Reorganization" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# === STEP 1: CREATE SUBDIRECTORIES ===
Write-Host "STEP 1: Creating documentation subdirectories..." -ForegroundColor Yellow

$DocDirs = @("ai", "deployment", "features", "architecture", "tasks", "guides", "technical", "assets", "progress", "scripts", "backups", "marketing", "content")

foreach ($dir in $DocDirs) {
    $fullPath = Join-Path $DocumentationsPath $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "[+] Created: documentations/$dir" -ForegroundColor Green
    }
}

# === STEP 2: MOVE FILES BY CATEGORY ===
Write-Host ""
Write-Host "STEP 2: Organizing documentation files..." -ForegroundColor Yellow

$FileCategories = @{
    "ai" = @("AI_MODELS_MIGRATION_COMPLETE.md","AI_MODERATION_FIXES_PROGRESS.md","AI_SELF_HOSTING_GUIDE.md","AI_SYSTEM_INTEGRATION_COMPLETE.md","AI_SYSTEM_QUICK_REFERENCE.md","test-agents.mjs","test-agents.ps1","test-complete-workflow.ts","test-llama.ts","test-lm-studio.ps1","test-translation.ts","DEPLOY_AI_SERVER.md","deploy-ai.ps1","deploy-ai.sh")
    "deployment" = @("DEPLOYMENT_CHECKLIST.md","DEPLOYMENT_GUIDE.md","DEPLOYMENT_PACKAGE_SUMMARY.md","DEPLOYMENT_QUICKSTART.md","DEPLOYMENT_README.md","CONTABO_DEPLOYMENT_GUIDE.md","CONTABO_DB_MIGRATION_RUNBOOK.md","CONTABO_FIX_COMING_SOON.md","deploy-production.sh","deploy.ps1","deploy-all.ps1","deploy-affiliate-updates.sh","START_HERE_DEPLOYMENT.md","PRE_DEPLOYMENT_PREP.md","PRODUCTION_DEPLOYMENT_CHECKLIST.md","PRODUCTION_READY_STATUS.md","fix-server-domains.sh")
    "features" = @("WALLET_INTEGRATION_COMPLETE.md","WALLET_FRAUD_DETECTION_STATUS.md","WALLET_FRAUD_SYSTEM_COMPLETE.md","WALLET_MODALS_COMPLETE.md","WALLET_MODALS_QUICK_REFERENCE.md","WALLET_MODALS_STATUS.md","WALLET_QUICK_REFERENCE.md","WITHDRAWAL_FRONTEND_COMPLETE.md","WITHDRAWAL_SYSTEM_COMPLETE.md","HYBRID_WALLET_CONFIRMATION.md","FRAUD_ALERT_API_REFERENCE.md","FRAUD_DETECTION_DEPLOYMENT_CHECKLIST.md","WALLET_SCHEMA_ENHANCEMENTS.prisma","COMING_SOON_COMPLETE.md","START_COMING_SOON.md","FIX_COMING_SOON_NOW.md","EXPANDED_PERMISSIONS_FINANCE_FEATURES.md")
    "architecture" = @("PLATFORM_ARCHITECTURE.md","CoinDaily_CFIS_Architecture.md","CoinDaily_Platform_Blueprint.md","BLUEPRINT_AUDIT_REPORT.md","INTEGRATION_COMPLETE.md","BACKEND_IMPLEMENTATION_COMPLETE.md","BACKEND_ENDPOINT_CONNECTIONS_COMPLETE.md","NEW_FEATURES_COMPLETE.md")
    "guides" = @("QUICK_START_GUIDE.md","QUICK_START_TESTING.md","QUICK_REFERENCE_CARD.md","LOGIN_QUICK_REFERENCE.txt","NAVIGATION_LINKS_REFERENCE.md","SUPABASE_MIGRATION_GUIDE.md","SUPABASE_QUICK_REFERENCE.md","WIREGUARD_VPN_SECURITY_GUIDE.md","NEWS_SOURCES_AND_APIS.md")
    "technical" = @("BUILD_FIX_PROGRESS.md","BUILD_FIX_TYPESCRIPT_COMPLETE.md","BUILD_STATUS_REPORT.md","ERROR_FIXES_SUMMARY.md","TYPESCRIPT_FIXES_COMPLETED.md","404_ERRORS_FIXED.md","UNIMPLEMENTED_TASKS_AND_ERRORS.md","MIGRATION_COMPLETE.md","COMPLETION_SUMMARY.md")
    "assets" = @("correction.png","correction1.png","debug-page.html")
    "progress" = @("DAY2_PROGRESS_REPORT.md","SESSION_SUMMARY.md","TODAYS_PROGRESS.md")
    "marketing" = @("CRYPTO_BASICS_AFRICA_THREAD.md","TWEET_THREAD_PARTNERSHIP_MOAT.md","TWEET_THREAD_READY_TO_POST.md","TWITTER_THREAD_100X_MATH.md","TWITTER_THREAD_WEB3_PR_MARKET.md","X_TWITTER_30DAY_STRATEGY.md","JY_TOKEN_LAUNCH_THREAD.md","INVESTOR_PITCH_50K.md","Coindadily PR Distribution MAchine.md")
    "content" = @("Articles to do.md","Products to develop.md")
}

foreach ($category in $FileCategories.GetEnumerator()) {
    $catPath = Join-Path $DocumentationsPath $category.Key
    foreach ($file in $category.Value) {
        $sourcePath = Join-Path $DocumentationsPath $file
        $destPath = Join-Path $catPath $file
        if ((Test-Path $sourcePath) -and $sourcePath -ne $destPath) {
            Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "[+] Files organized into categories" -ForegroundColor Green

# === STEP 3: MOVE TEMP FILES ===
Write-Host ""
Write-Host "STEP 3: Moving temporary files..." -ForegroundColor Yellow

$MiscFiles = @("ollama-test.json", "task-test.json", "tmp-query.json", "build-errors.txt", "errors.txt", "test-output.txt")
$backupPath = Join-Path $DocumentationsPath "backups"

foreach ($file in $MiscFiles) {
    $sourcePath = Join-Path $DocumentationsPath $file
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination "$backupPath\$file" -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "[+] Temporary files moved to backups" -ForegroundColor Green

# === STEP 4: CLEANUP OLD DOCS ===
Write-Host ""
Write-Host "STEP 4: Cleaning up old docs directory..." -ForegroundColor Yellow

$OldDocsPath = "$RootPath\docs"
if (Test-Path $OldDocsPath) {
    Get-ChildItem $OldDocsPath -Directory | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination "$DocumentationsPath\$($_.Name)" -Recurse -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $OldDocsPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[+] Removed old /docs directory" -ForegroundColor Green
}

# === STEP 5: UPDATE GITIGNORE ===
Write-Host ""
Write-Host "STEP 5: Updating .gitignore..." -ForegroundColor Yellow

$GitIgnorePath = "$RootPath\.gitignore"
$Content = Get-Content $GitIgnorePath -Raw

if (-not $Content.Contains("Temporary build")) {
    $Addition = @"

# Temporary build and error files
build-errors.txt
errors.txt
test-output.txt
*.broken.backup*
*.log.old

# Backup files
documentations/backups/
*.backup
*.bak

# Temporary query files
tmp-query.json
task-test.json
ollama-test.json

"@
    Add-Content -Path $GitIgnorePath -Value $Addition
    Write-Host "[+] Updated .gitignore" -ForegroundColor Green
}

# === SUMMARY ===
Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "Reorganization Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "New Structure:" -ForegroundColor Yellow
Get-ChildItem $DocumentationsPath -Directory | ForEach-Object {
    $count = @(Get-ChildItem $_.FullName -Recurse -File).Count
    Write-Host "  - $($_.Name)/ ($count files)" -ForegroundColor Gray
}
