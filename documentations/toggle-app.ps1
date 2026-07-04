# Toggle Script - Switch Between Coming Soon and Main App

Write-Host "🔄 Sygn - App Switcher" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

$currentDir = Get-Location
$projectRoot = Split-Path -Parent $currentDir

Write-Host "Current status:" -ForegroundColor Yellow
Write-Host ""

# Check PM2 processes
try {
    $pm2List = pm2 jlist | ConvertFrom-Json
    
    $comingSoon = $pm2List | Where-Object { $_.name -eq "sygn-coming-soon" }
    $mainApp = $pm2List | Where-Object { $_.name -eq "sygn-main" }
    
    if ($comingSoon) {
        Write-Host "Coming Soon Page: " -NoNewline
        if ($comingSoon.pm2_env.status -eq "online") {
            Write-Host "RUNNING ✅" -ForegroundColor Green
        } else {
            Write-Host "STOPPED ❌" -ForegroundColor Red
        }
    } else {
        Write-Host "Coming Soon Page: NOT CONFIGURED" -ForegroundColor Gray
    }
    
    if ($mainApp) {
        Write-Host "Main App: " -NoNewline
        if ($mainApp.pm2_env.status -eq "online") {
            Write-Host "RUNNING ✅" -ForegroundColor Green
        } else {
            Write-Host "STOPPED ❌" -ForegroundColor Red
        }
    } else {
        Write-Host "Main App: NOT CONFIGURED" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "⚠️  PM2 not found or no processes running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Show Coming Soon Page (hide main app)" -ForegroundColor White
Write-Host "2. Show Main App (hide coming soon)" -ForegroundColor White
Write-Host "3. Start both (different ports)" -ForegroundColor White
Write-Host "4. Stop all" -ForegroundColor White
Write-Host "5. View status" -ForegroundColor White
Write-Host "6. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔄 Switching to Coming Soon Page..." -ForegroundColor Yellow
        
        # Stop main app if running
        pm2 stop sygn-main 2>$null
        
        # Start/restart coming soon
        Set-Location "$projectRoot\coming"
        pm2 restart sygn-coming-soon 2>$null
        if ($LASTEXITCODE -ne 0) {
            pm2 start npm --name "sygn-coming-soon" -- start
        }
        
        pm2 save
        
        Write-Host "✅ Coming Soon Page is now active on port 3001" -ForegroundColor Green
        Write-Host "Visit: http://localhost:3001" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Switching to Main App..." -ForegroundColor Yellow
        
        # Stop coming soon if running
        pm2 stop sygn-coming-soon 2>$null
        
        # Start/restart main app
        Set-Location "$projectRoot\frontend"
        pm2 restart sygn-main 2>$null
        if ($LASTEXITCODE -ne 0) {
            pm2 start npm --name "sygn-main" -- start
        }
        
        pm2 save
        
        Write-Host "✅ Main App is now active on port 3000" -ForegroundColor Green
        Write-Host "Visit: http://localhost:3000" -ForegroundColor Cyan
    }
    
    "3" {
        Write-Host ""
        Write-Host "🚀 Starting both applications..." -ForegroundColor Yellow
        
        # Start coming soon on port 3001
        Set-Location "$projectRoot\coming"
        pm2 restart sygn-coming-soon 2>$null
        if ($LASTEXITCODE -ne 0) {
            pm2 start npm --name "sygn-coming-soon" -- start
        }
        
        # Start main app on port 3000
        Set-Location "$projectRoot\frontend"
        pm2 restart sygn-main 2>$null
        if ($LASTEXITCODE -ne 0) {
            pm2 start npm --name "sygn-main" -- start
        }
        
        pm2 save
        
        Write-Host "✅ Both applications are running" -ForegroundColor Green
        Write-Host "Coming Soon: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "Main App: http://localhost:3000" -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host ""
        Write-Host "🛑 Stopping all applications..." -ForegroundColor Yellow
        
        pm2 stop sygn-coming-soon 2>$null
        pm2 stop sygn-main 2>$null
        pm2 save
        
        Write-Host "✅ All applications stopped" -ForegroundColor Green
    }
    
    "5" {
        Write-Host ""
        pm2 status
        Write-Host ""
        pm2 logs --lines 20
    }
    
    "6" {
        Write-Host ""
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Run 'pm2 status' to check process status" -ForegroundColor Gray
Write-Host "Run 'pm2 logs' to view application logs" -ForegroundColor Gray

Set-Location $currentDir
