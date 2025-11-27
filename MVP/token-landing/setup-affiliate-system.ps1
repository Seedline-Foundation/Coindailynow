# SETUP SCRIPT - Run this to fix all errors
# PowerShell script for Windows

Write-Host "🚀 Setting up Affiliate System..." -ForegroundColor Cyan
Write-Host ""

# Navigate to token-landing directory
Set-Location "c:\Users\onech\Desktop\news-platform\MVP\token-landing"

Write-Host "📦 Step 1: Installing required packages..." -ForegroundColor Yellow
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

Write-Host ""
Write-Host "✅ Packages installed!" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Step 2: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host ""
Write-Host "✅ Prisma Client generated!" -ForegroundColor Green
Write-Host ""

Write-Host "📄 Step 3: Checking environment variables..." -ForegroundColor Yellow

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "JWT_SECRET") {
        Write-Host "✅ JWT_SECRET found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  JWT_SECRET not found - Please add to .env.local" -ForegroundColor Red
        Write-Host "   Add this line: JWT_SECRET=your-super-secret-jwt-key-min-32-characters" -ForegroundColor Yellow
    }
    
    if ($envContent -match "NEXT_PUBLIC_BASE_URL") {
        Write-Host "✅ NEXT_PUBLIC_BASE_URL found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  NEXT_PUBLIC_BASE_URL not found - Please add to .env.local" -ForegroundColor Red
        Write-Host "   Add this line: NEXT_PUBLIC_BASE_URL=https://joytoken.io" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env.local file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    
    $envTemplate = @"
# JWT Secret for affiliate authentication (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters

# Base URL for affiliate links
NEXT_PUBLIC_BASE_URL=https://joytoken.io

# Database URL (if not already set)
# DATABASE_URL=your-database-url-here
"@
    
    $envTemplate | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ .env.local created! Please update with your actual values." -ForegroundColor Green
}

Write-Host ""
Write-Host "🗄️  Step 4: Pushing database schema..." -ForegroundColor Yellow
Write-Host "   Run manually: npx prisma db push" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update JWT_SECRET in .env.local with a strong secret" -ForegroundColor White
Write-Host "   2. Update NEXT_PUBLIC_BASE_URL with your actual domain" -ForegroundColor White
Write-Host "   3. Run: npx prisma db push" -ForegroundColor White
Write-Host "   4. Add tracking to your homepage (see documentation)" -ForegroundColor White
Write-Host ""
Write-Host "🎉 All errors should be fixed now!" -ForegroundColor Green
