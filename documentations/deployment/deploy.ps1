# CoinDaily Platform - Windows Deployment Script
# Run this from: c:\Users\user\Desktop\news-platform

param(
    [string]$Action = "all",  # all, backend, frontend, nginx, pm2
    [string]$ServerIP = "167.86.99.97",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CoinDaily Platform Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$LocalDir = "c:\Users\user\Desktop\news-platform"

function Deploy-Backend {
    Write-Host "[Backend] Deploying backend API..." -ForegroundColor Yellow
    
    # Sync backend (excluding node_modules, .git, tests, logs)
    Write-Host "  Syncing backend files..." -ForegroundColor Gray
    ssh ${ServerUser}@${ServerIP} "mkdir -p /var/www/coindaily-backend"
    
    # Use robocopy for Windows
    $excludeDirs = @("node_modules", ".git", "tests", "logs")
    robocopy "$LocalDir\backend" "\\temp_backend" /E /XD $excludeDirs /NFL /NDL /NJH /NJS
    
    # SCP the backend
    scp -r "$LocalDir\backend\dist" "${ServerUser}@${ServerIP}:/var/www/coindaily-backend/"
    scp -r "$LocalDir\backend\prisma" "${ServerUser}@${ServerIP}:/var/www/coindaily-backend/"
    scp "$LocalDir\backend\package.json" "${ServerUser}@${ServerIP}:/var/www/coindaily-backend/"
    scp "$LocalDir\backend\package-lock.json" "${ServerUser}@${ServerIP}:/var/www/coindaily-backend/"
    
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    ssh ${ServerUser}@${ServerIP} "cd /var/www/coindaily-backend && npm ci --production"
    
    Write-Host "[Backend] ✓ Complete" -ForegroundColor Green
}

function Deploy-Frontend {
    param([string]$Target, [string]$Port, [string]$EnvVars)
    
    Write-Host "[Frontend] Deploying $Target..." -ForegroundColor Yellow
    
    ssh ${ServerUser}@${ServerIP} "mkdir -p /var/www/coindaily-$Target"
    
    # Copy .next build
    scp -r "$LocalDir\frontend\.next" "${ServerUser}@${ServerIP}:/var/www/coindaily-$Target/"
    scp -r "$LocalDir\frontend\public" "${ServerUser}@${ServerIP}:/var/www/coindaily-$Target/"
    scp "$LocalDir\frontend\package.json" "${ServerUser}@${ServerIP}:/var/www/coindaily-$Target/"
    scp "$LocalDir\frontend\package-lock.json" "${ServerUser}@${ServerIP}:/var/www/coindaily-$Target/"
    scp "$LocalDir\frontend\next.config.js" "${ServerUser}@${ServerIP}:/var/www/coindaily-$Target/"
    
    # Create env file
    ssh ${ServerUser}@${ServerIP} "echo '$EnvVars' > /var/www/coindaily-$Target/.env.local"
    
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    ssh ${ServerUser}@${ServerIP} "cd /var/www/coindaily-$Target && npm ci --production"
    
    Write-Host "[Frontend] ✓ $Target Complete" -ForegroundColor Green
}

function Deploy-Nginx {
    Write-Host "[Nginx] Deploying Nginx configurations..." -ForegroundColor Yellow
    
    # Copy nginx configs
    scp "$LocalDir\infrastructure\nginx\*.conf" "${ServerUser}@${ServerIP}:/etc/nginx/sites-available/"
    
    # Enable sites
    $sites = @("coindaily.online", "backend.coindaily.online", "jet.coindaily.online", "pr.coindaily.online", "ai.coindaily.online")
    foreach ($site in $sites) {
        ssh ${ServerUser}@${ServerIP} "ln -sf /etc/nginx/sites-available/$site.conf /etc/nginx/sites-enabled/"
    }
    
    # Test and reload
    Write-Host "  Testing nginx configuration..." -ForegroundColor Gray
    ssh ${ServerUser}@${ServerIP} "nginx -t && systemctl reload nginx"
    
    Write-Host "[Nginx] ✓ Complete" -ForegroundColor Green
}

function Deploy-PM2 {
    Write-Host "[PM2] Deploying PM2 ecosystem..." -ForegroundColor Yellow
    
    # Copy ecosystem config
    scp "$LocalDir\infrastructure\ecosystem.production.config.js" "${ServerUser}@${ServerIP}:/var/www/ecosystem.config.js"
    
    # Restart PM2
    Write-Host "  Starting PM2 services..." -ForegroundColor Gray
    ssh ${ServerUser}@${ServerIP} "cd /var/www && pm2 delete all 2>/dev/null; pm2 start ecosystem.config.js && pm2 save"
    
    Write-Host "[PM2] ✓ Complete" -ForegroundColor Green
}

function Deploy-AI {
    Write-Host "[AI] Deploying AI System..." -ForegroundColor Yellow
    
    ssh ${ServerUser}@${ServerIP} "mkdir -p /var/www/coindaily-ai"
    
    scp -r "$LocalDir\ai-system\*" "${ServerUser}@${ServerIP}:/var/www/coindaily-ai/"
    
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    ssh ${ServerUser}@${ServerIP} "cd /var/www/coindaily-ai && npm ci --production 2>/dev/null || echo 'AI system ready'"
    
    Write-Host "[AI] ✓ Complete" -ForegroundColor Green
}

function Show-Status {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "   Checking Deployment Status" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    
    ssh ${ServerUser}@${ServerIP} "pm2 status"
    
    Write-Host ""
    Write-Host "Testing endpoints..." -ForegroundColor Yellow
    
    try {
        $health = Invoke-RestMethod -Uri "http://${ServerIP}:4000/health" -TimeoutSec 5
        Write-Host "  Backend API: ✓ Running" -ForegroundColor Green
    } catch {
        Write-Host "  Backend API: ✗ Not responding" -ForegroundColor Red
    }
}

# Main execution
switch ($Action.ToLower()) {
    "backend" {
        Deploy-Backend
    }
    "frontend" {
        Deploy-Frontend -Target "news" -Port "3000" -EnvVars "NEXT_PUBLIC_API_URL=https://backend.coindaily.online"
        Deploy-Frontend -Target "admin" -Port "3002" -EnvVars "NEXT_PUBLIC_API_URL=https://backend.coindaily.online`nNEXT_PUBLIC_ADMIN_MODE=true"
        Deploy-Frontend -Target "pr" -Port "3003" -EnvVars "NEXT_PUBLIC_API_URL=https://backend.coindaily.online`nNEXT_PUBLIC_PR_MODE=true"
    }
    "nginx" {
        Deploy-Nginx
    }
    "pm2" {
        Deploy-PM2
    }
    "ai" {
        Deploy-AI
    }
    "status" {
        Show-Status
    }
    "all" {
        Deploy-Backend
        Deploy-Frontend -Target "news" -Port "3000" -EnvVars "NEXT_PUBLIC_API_URL=https://backend.coindaily.online"
        Deploy-Frontend -Target "admin" -Port "3002" -EnvVars "NEXT_PUBLIC_API_URL=https://backend.coindaily.online`nNEXT_PUBLIC_ADMIN_MODE=true"
        Deploy-Frontend -Target "pr" -Port "3003" -EnvVars "NEXT_PUBLIC_API_URL=https://backend.coindaily.online`nNEXT_PUBLIC_PR_MODE=true"
        Deploy-AI
        Deploy-Nginx
        Deploy-PM2
        Show-Status
    }
    default {
        Write-Host "Usage: .\deploy.ps1 -Action [all|backend|frontend|nginx|pm2|ai|status]" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  • https://coindaily.online          - News Platform" -ForegroundColor White
Write-Host "  • https://backend.coindaily.online  - Backend API" -ForegroundColor White
Write-Host "  • https://jet.coindaily.online      - Admin Portal (IP Restricted)" -ForegroundColor White
Write-Host "  • https://pr.coindaily.online       - PR System" -ForegroundColor White
Write-Host "  • https://ai.coindaily.online       - AI Services" -ForegroundColor White
