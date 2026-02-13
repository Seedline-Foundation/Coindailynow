# Deploy AI Dashboard to Contabo Server
# Run from: PowerShell in project root

param(
    [string]$ServerHost = "5.189.133.47",  # Your Contabo IP
    [string]$ServerUser = "root",
    [string]$DeployPath = "/opt/coindaily"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying CoinDaily AI System to $ServerHost" -ForegroundColor Cyan

# Build the AI app
Write-Host "`n📦 Building AI Dashboard..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\apps\ai"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Set-Location $PSScriptRoot

# Create deployment archive
Write-Host "`n📁 Creating deployment package..." -ForegroundColor Yellow
$filesToInclude = @(
    "apps/ai/.next",
    "apps/ai/public", 
    "apps/ai/package.json",
    "apps/ai/next.config.js",
    "apps/ai/Dockerfile",
    "docker-compose.ai.yml"
)

# Use tar if available, otherwise zip
$archiveName = "ai-deploy.tar.gz"
tar -czf $archiveName $filesToInclude 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Using zip instead of tar..."
    $archiveName = "ai-deploy.zip"
    Compress-Archive -Path $filesToInclude -DestinationPath $archiveName -Force
}

# Upload to server
Write-Host "`n📤 Uploading to server..." -ForegroundColor Yellow
scp $archiveName "${ServerUser}@${ServerHost}:${DeployPath}/"

# Deploy on server
Write-Host "`n🔧 Deploying on server..." -ForegroundColor Yellow
$deployScript = @"
cd $DeployPath
tar -xzf ai-deploy.tar.gz 2>/dev/null || unzip -o ai-deploy.zip

# Build and start the AI dashboard
docker-compose -f docker-compose.ai.yml build ai-dashboard
docker-compose -f docker-compose.ai.yml up -d ai-dashboard

# Verify deployment
docker-compose -f docker-compose.ai.yml ps ai-dashboard

rm -f ai-deploy.tar.gz ai-deploy.zip
echo "✅ AI Dashboard deployed!"
"@

ssh "${ServerUser}@${ServerHost}" $deployScript

# Cleanup local
Remove-Item $archiveName -ErrorAction SilentlyContinue

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Access at: https://ai.coindaily.online" -ForegroundColor Cyan
Write-Host "🔍 Health check: https://ai.coindaily.online/api/health" -ForegroundColor Cyan
