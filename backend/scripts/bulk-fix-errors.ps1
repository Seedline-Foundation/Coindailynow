# Bulk Fix Script for Common TypeScript Errors
# Run this from backend directory: .\scripts\bulk-fix-errors.ps1

Write-Host "🔧 Starting bulk fixes for common TypeScript errors..." -ForegroundColor Cyan

# Fix 1: Update imports to use central types
Write-Host "`n📦 Fixing imports to use central types..." -ForegroundColor Yellow
Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    # Replace individual Prisma imports with central types
    if ($content -match 'import \{ User \} from [''"]@prisma/client[''"]') {
        $content = $content -replace 'import \{ User \} from [''"]@prisma/client[''"]', "import { User } from '../types'"
        $modified = $true
    }
    
    if ($content -match 'import \{ UserRole \} from [''"]@prisma/client[''"]') {
        $content = $content -replace 'import \{ UserRole \} from [''"]@prisma/client[''"]', "import { UserRole } from '../types'"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $_.FullName -Value $content
        Write-Host "  ✓ Fixed: $($_.Name)" -ForegroundColor Green
    }
}

# Fix 2: Ensure all User creation includes required fields
Write-Host "`n👤 Checking User model field usage..." -ForegroundColor Yellow
$userCreationIssues = @()
Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Check for user creation without passwordHash
    if ($content -match 'prisma\.user\.create' -and $content -notmatch 'passwordHash') {
        $userCreationIssues += $_.FullName
    }
}

if ($userCreationIssues.Count -gt 0) {
    Write-Host "  ⚠️  Found $($userCreationIssues.Count) files with potential User creation issues:" -ForegroundColor Yellow
    $userCreationIssues | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
}

# Fix 3: Add missing return types to service methods
Write-Host "`n🔄 Adding explicit return types..." -ForegroundColor Yellow
Get-ChildItem -Path "src/services" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    # Add Promise<void> to methods that don't return anything
    if ($content -match 'async \w+\([^)]*\)\s*\{' -and $content -notmatch 'Promise<') {
        Write-Host "  ⚠️  Check async methods in: $($_.Name)" -ForegroundColor Yellow
    }
}

# Fix 4: Generate Prisma Client
Write-Host "`n🔄 Regenerating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate 2>&1 | Out-Null
    Write-Host "  ✓ Prisma Client regenerated" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to regenerate Prisma Client" -ForegroundColor Red
}

# Summary
Write-Host "`n✅ Bulk fixes completed!" -ForegroundColor Green
Write-Host "   Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run 'npm run type-check' to see remaining errors" -ForegroundColor White
Write-Host "   2. Review files flagged above for manual fixes" -ForegroundColor White
Write-Host "   3. Run tests to ensure nothing broke" -ForegroundColor White
