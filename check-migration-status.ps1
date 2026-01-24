#!/usr/bin/env pwsh
# Quick Migration Status Check
# Run this to see progress of Prisma → Supabase migration

Write-Host "`n🔍 Checking Prisma to Supabase Migration Status..." -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray

# Check if Supabase is installed
Write-Host "`n📦 Package Installation:" -ForegroundColor Yellow
if (Test-Path "backend/node_modules/@supabase") {
    Write-Host "  ✅ Supabase client installed in backend" -ForegroundColor Green
} else {
    Write-Host "  ❌ Supabase client NOT installed in backend" -ForegroundColor Red
    Write-Host "     Run: cd backend && npm install @supabase/supabase-js" -ForegroundColor Gray
}

if (Test-Path "ai-system/node_modules/@supabase") {
    Write-Host "  ✅ Supabase client installed in ai-system" -ForegroundColor Green
} else {
    Write-Host "  ❌ Supabase client NOT installed in ai-system" -ForegroundColor Red
    Write-Host "     Run: cd ai-system && npm install @supabase/supabase-js" -ForegroundColor Gray
}

# Check environment variables
Write-Host "`n🔐 Environment Variables:" -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "SUPABASE_URL") {
        Write-Host "  ✅ SUPABASE_URL found in .env" -ForegroundColor Green
    } else {
        Write-Host "  ❌ SUPABASE_URL missing from .env" -ForegroundColor Red
    }
    
    if ($envContent -match "SUPABASE_ANON_KEY") {
        Write-Host "  ✅ SUPABASE_ANON_KEY found in .env" -ForegroundColor Green
    } else {
        Write-Host "  ❌ SUPABASE_ANON_KEY missing from .env" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ .env file not found" -ForegroundColor Red
}

# Check migrated files
Write-Host "`n📝 Migrated Files:" -ForegroundColor Yellow
$migratedFiles = @(
    "backend/lib/supabase.ts",
    "ai-system/agents/task-processor.ts",
    "backend/types/database.types.ts"
)

foreach ($file in $migratedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "@supabase/supabase-js") {
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $file (exists but might not be using Supabase)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ $file (not found)" -ForegroundColor Red
    }
}

# Count files still using Prisma
Write-Host "`n🔎 Scanning for Prisma usage..." -ForegroundColor Yellow
$prismaFiles = Get-ChildItem -Path "." -Include "*.ts","*.js" -Recurse -Exclude "node_modules","dist",".git" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "PrismaClient|@prisma/client" } |
    Select-Object -ExpandProperty FullName

if ($prismaFiles) {
    Write-Host "  ⚠️  Found $($prismaFiles.Count) files still using Prisma:" -ForegroundColor Yellow
    $prismaFiles | ForEach-Object {
        $relative = $_ -replace [regex]::Escape($PWD), "."
        Write-Host "     - $relative" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✅ No Prisma usage found!" -ForegroundColor Green
}

# Summary
Write-Host "`n" + "=" * 80 -ForegroundColor Gray
Write-Host "`n📊 Migration Summary:" -ForegroundColor Cyan

$checklist = @(
    @{ Task = "Install Supabase client packages"; Done = (Test-Path "backend/node_modules/@supabase") -and (Test-Path "ai-system/node_modules/@supabase") },
    @{ Task = "Create Supabase client config"; Done = (Test-Path "backend/lib/supabase.ts") },
    @{ Task = "Update environment variables"; Done = ((Test-Path ".env") -and ((Get-Content ".env" -Raw) -match "SUPABASE_URL")) },
    @{ Task = "Migrate AI system files"; Done = (Test-Path "ai-system/agents/task-processor.ts") },
    @{ Task = "Remove all Prisma usage"; Done = -not $prismaFiles }
)

$completed = ($checklist | Where-Object { $_.Done }).Count
$total = $checklist.Count
$percentage = [math]::Round(($completed / $total) * 100)

Write-Host "  Progress: $completed/$total tasks completed ($percentage%)" -ForegroundColor Cyan

foreach ($item in $checklist) {
    if ($item.Done) {
        Write-Host "  ✅ $($item.Task)" -ForegroundColor Green
    } else {
        Write-Host "  ⬜ $($item.Task)" -ForegroundColor Gray
    }
}

Write-Host "`n📖 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Get Supabase credentials from: https://app.supabase.com/project/auakxtwvqqefysprkczv/settings/api" -ForegroundColor Gray
Write-Host "  2. Update .env with SUPABASE_URL and SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "  3. Run: node backend/scripts/migrate-to-supabase.js (for detailed file list)" -ForegroundColor Gray
Write-Host "  4. Migrate remaining files using SUPABASE_MIGRATION_GUIDE.md" -ForegroundColor Gray
Write-Host "  5. Test thoroughly before removing Prisma dependencies" -ForegroundColor Gray

Write-Host "`n✨ For help, see: SUPABASE_MIGRATION_GUIDE.md`n" -ForegroundColor Cyan
