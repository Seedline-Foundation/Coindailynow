# Regenerate Prisma Clients for Frontend and Backend
# Run this script to update Prisma types after schema changes

Write-Host "🔄 Starting Prisma Client Regeneration..." -ForegroundColor Cyan
Write-Host ""

# Frontend Prisma Generation
Write-Host "📦 Regenerating Frontend Prisma Client..." -ForegroundColor Yellow
Set-Location "c:\Users\onech\Desktop\news-platform\frontend"

# Clear cache
if (Test-Path "node_modules\.prisma") {
    Write-Host "  Clearing frontend Prisma cache..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
}

# Generate
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend Prisma Client Generated Successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend Prisma Generation Failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Backend Prisma Generation
Write-Host "📦 Regenerating Backend Prisma Client..." -ForegroundColor Yellow
Set-Location "c:\Users\onech\Desktop\news-platform\backend"

# Clear cache
if (Test-Path "node_modules\.prisma") {
    Write-Host "  Clearing backend Prisma cache..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
}

# Generate
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend Prisma Client Generated Successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Prisma Generation Failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Prisma Regeneration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart VS Code (File → Close Workspace → Reopen)" -ForegroundColor White
Write-Host "  2. Wait for TypeScript server to initialize" -ForegroundColor White
Write-Host "  3. Verify errors dropped to ~5 or less" -ForegroundColor White
Write-Host ""

Set-Location "c:\Users\onech\Desktop\news-platform"
