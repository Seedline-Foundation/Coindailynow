# CoinDaily Coming Soon - Quick Setup Script (PowerShell)
# This script sets up the coming soon landing page

Write-Host "🚀 CoinDaily - Coming Soon Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Set up environment file
if (-not (Test-Path .env.local)) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
    Write-Host "⚠️  Please edit .env.local with your Resend API key" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host ""

# Set up database
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set up database" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database ready" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "✨ Setup Complete!" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Edit .env.local with your Resend API key" -ForegroundColor White
Write-Host "2. Set your launch date in .env.local" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. Visit: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Happy launching! 🎉" -ForegroundColor Cyan
