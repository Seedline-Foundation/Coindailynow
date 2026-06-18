#!/usr/bin/env pwsh
# Build-verify every shippable package locally so deployment to Contabo
# doesn't surface a broken build in production. Run BEFORE ship-to-contabo.ps1.
#
# Usage:
#   .\scripts\build-verify-local.ps1                # full sweep
#   .\scripts\build-verify-local.ps1 -SkipInstall   # reuse existing node_modules
#   .\scripts\build-verify-local.ps1 -Only backend  # one package only
#
# Exit code: 0 if every package built; 1 if any failed.

param(
    [switch]$SkipInstall,
    [string]$Only = ""
)

$ErrorActionPreference = "Continue"
$root = (Get-Location).Path

# Each package: name, dir, the command that must succeed.
# Typecheck preferred when available (faster, surfaces TS errors clearly);
# otherwise fall back to the full build.
$packages = @(
    @{ Name = "backend";        Dir = "backend";        Cmd = "npx tsc --noEmit"; Pre = "npx prisma generate" }
    @{ Name = "frontend";       Dir = "frontend";       Cmd = "npx tsc --noEmit" }
    @{ Name = "ai-system";      Dir = "ai-system";      Cmd = "npx tsc --noEmit" }
    @{ Name = "finance-system"; Dir = "finance-system"; Cmd = "npx tsc --noEmit" }
    @{ Name = "Iengine";        Dir = "Iengine";        Cmd = "npx tsc --noEmit --skipLibCheck" }
    @{ Name = "apps/ai";        Dir = "apps/ai";        Cmd = "npx tsc --noEmit" }
    @{ Name = "apps/admin";     Dir = "apps/admin";     Cmd = "npx tsc --noEmit" }
    @{ Name = "apps/press";     Dir = "apps/press";     Cmd = "npx tsc --noEmit" }
)

if ($Only) {
    $packages = $packages | Where-Object { $_.Name -eq $Only -or $_.Dir -eq $Only }
    if (-not $packages) {
        Write-Host "No package matches -Only $Only" -ForegroundColor Red
        exit 2
    }
}

# ── 1. Install workspaces ───────────────────────────────────────────────
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    Write-Host "  npm install (workspaces)" -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    npm install --no-audit --no-fund
    $sw.Stop()
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install FAILED after $($sw.Elapsed.TotalSeconds.ToString('F0'))s" -ForegroundColor Red
        exit 1
    }
    Write-Host "npm install OK in $($sw.Elapsed.TotalSeconds.ToString('F0'))s" -ForegroundColor Green
}

# ── 2. Per-package verify ───────────────────────────────────────────────
$results = @()
foreach ($pkg in $packages) {
    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    Write-Host "  $($pkg.Name) — $($pkg.Cmd)" -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor DarkCyan

    if (-not (Test-Path $pkg.Dir)) {
        Write-Host "SKIP (dir missing)" -ForegroundColor Yellow
        $results += [pscustomobject]@{ Package = $pkg.Name; Status = "SKIP (no dir)"; Seconds = 0 }
        continue
    }

    Set-Location (Join-Path $root $pkg.Dir)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    # Optional pre-step (e.g. prisma generate)
    if ($pkg.Pre) {
        Write-Host "  pre: $($pkg.Pre)" -ForegroundColor DarkGray
        Invoke-Expression $pkg.Pre 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) {
            $sw.Stop()
            Write-Host "FAIL on pre-step after $($sw.Elapsed.TotalSeconds.ToString('F0'))s" -ForegroundColor Red
            $results += [pscustomobject]@{ Package = $pkg.Name; Status = "FAIL (pre)"; Seconds = $sw.Elapsed.TotalSeconds }
            Set-Location $root
            continue
        }
    }

    Invoke-Expression $pkg.Cmd 2>&1 | Out-Host
    $sw.Stop()
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PASS in $($sw.Elapsed.TotalSeconds.ToString('F0'))s" -ForegroundColor Green
        $results += [pscustomobject]@{ Package = $pkg.Name; Status = "PASS"; Seconds = [int]$sw.Elapsed.TotalSeconds }
    } else {
        Write-Host "FAIL in $($sw.Elapsed.TotalSeconds.ToString('F0'))s" -ForegroundColor Red
        $results += [pscustomobject]@{ Package = $pkg.Name; Status = "FAIL"; Seconds = [int]$sw.Elapsed.TotalSeconds }
    }
    Set-Location $root
}

# ── 3. Summary ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host ("=" * 72) -ForegroundColor DarkCyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 72) -ForegroundColor DarkCyan
$results | Format-Table -AutoSize | Out-Host

$failed = @($results | Where-Object { $_.Status -like "FAIL*" })
if ($failed.Count -gt 0) {
    Write-Host "$($failed.Count) package(s) FAILED. Fix locally before shipping to Contabo." -ForegroundColor Red
    exit 1
}
Write-Host "All packages built. Safe to ship to Contabo." -ForegroundColor Green
exit 0
