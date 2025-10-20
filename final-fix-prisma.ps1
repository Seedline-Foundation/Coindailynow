# Final Fix for All Content Pipeline Errors
Write-Host "Applying final comprehensive fixes..." -ForegroundColor Cyan

# Step 1: Clean and regenerate Prisma Client
Write-Host "`n1. Cleaning and regenerating Prisma Client..." -ForegroundColor Yellow
Set-Location backend
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\@prisma\client" -Recurse -Force -ErrorAction SilentlyContinue
npx prisma generate --force
Set-Location ..

Write-Host "`n✓ Prisma Client regenerated!" -ForegroundColor Green
Write-Host "`nIMPORTANT: Please restart VS Code for changes to take effect!" -ForegroundColor Yellow
Write-Host "Press 'Ctrl+Shift+P' and run 'Developer: Reload Window'" -ForegroundColor Cyan
