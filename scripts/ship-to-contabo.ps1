#!/usr/bin/env pwsh
# Ship the current working tree to Contabo, build it there, restart PM2, fix Ollama/SDXL, verify.
# Run AFTER ./scripts/build-verify-local.ps1 has passed.
#
# Usage:
#   .\scripts\ship-to-contabo.ps1
#   .\scripts\ship-to-contabo.ps1 -VpsHost 167.86.99.97 -RemoteUser root -RemoteDir /var/www/coindaily
#   .\scripts\ship-to-contabo.ps1 -SkipVerify   # skip the local build-verify gate
#   .\scripts\ship-to-contabo.ps1 -DryRun       # rsync --dry-run, don't restart anything
#   .\scripts\ship-to-contabo.ps1 -OnlyFix      # only run fix-contabo-ollama-sdxl.sh on remote
#
# Requires rsync + ssh on PATH (Git for Windows ships both via OpenSSH + Cygwin).

param(
    [string]$VpsHost     = "167.86.99.97",
    [string]$RemoteUser  = "root",
    [string]$RemoteDir   = "/var/www/coindaily",
    [string]$SshKey      = "",
    [switch]$SkipVerify,
    [switch]$DryRun,
    [switch]$OnlyFix
)

$ErrorActionPreference = "Stop"
$repoRoot = (Get-Location).Path

function Run-Step {
    param([string]$Title, [scriptblock]$Block)
    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & $Block
    $sw.Stop()
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "FAIL after $($sw.Elapsed.TotalSeconds.ToString('F0'))s (exit $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK in $($sw.Elapsed.TotalSeconds.ToString('F0'))s" -ForegroundColor Green
}

$sshTarget = "$RemoteUser@$VpsHost"
$sshOpts   = @()
if ($SshKey) { $sshOpts += @("-i", $SshKey) }

# ── 0. Sanity: ssh + rsync present ──────────────────────────────────────
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "ssh not on PATH. Install OpenSSH client (Settings → Apps → Optional features → OpenSSH Client)." -ForegroundColor Red
    exit 2
}
if (-not (Get-Command rsync -ErrorAction SilentlyContinue)) {
    Write-Host "rsync not on PATH. Install via Git for Windows + cwRsync, or use WSL." -ForegroundColor Red
    Write-Host "Workaround: skip rsync and use git push to a deploy remote on Contabo." -ForegroundColor Yellow
    exit 2
}

# ── Quick path: only run the Contabo fix script ────────────────────────
if ($OnlyFix) {
    Run-Step "Upload + run fix-contabo-ollama-sdxl.sh" {
        scp @sshOpts "scripts/fix-contabo-ollama-sdxl.sh" "${sshTarget}:/root/fix-contabo-ollama-sdxl.sh"
        ssh @sshOpts $sshTarget "bash /root/fix-contabo-ollama-sdxl.sh"
    }
    exit 0
}

# ── 1. Local build-verify gate ──────────────────────────────────────────
if (-not $SkipVerify) {
    Run-Step "Local build-verify (typecheck every package)" {
        & "$repoRoot/scripts/build-verify-local.ps1" -SkipInstall
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Local builds failed. Fix locally before shipping. (-SkipVerify to override.)" -ForegroundColor Red
            exit 1
        }
    }
}

# ── 2. Rsync source to Contabo ──────────────────────────────────────────
# Exclude what should never ship or what Contabo will regenerate.
$excludes = @(
    "--exclude=node_modules"
    "--exclude=.next"
    "--exclude=dist"
    "--exclude=build"
    "--exclude=coverage"
    "--exclude=.turbo"
    "--exclude=.git"
    "--exclude=.claude"
    "--exclude=.kilo"
    "--exclude=logs"
    "--exclude=*.log"
    # Never ship local creds — Contabo has its own .env files.
    "--exclude=.env"
    "--exclude=.env.local"
    "--exclude=**/.env"
    "--exclude=**/.env.local"
    # Heavy/irrelevant
    "--exclude=*.pdf"
    "--exclude=check/"
    "--exclude=coming/"
    "--exclude=documentations/"
    "--exclude=_deprecated/"
    "--exclude=*.backup"
    "--exclude=*.bak"
)

$rsyncFlags = @("-az", "--delete")
if ($DryRun) { $rsyncFlags += "--dry-run"; $rsyncFlags += "--itemize-changes" }

Run-Step "Rsync source to $sshTarget`:$RemoteDir" {
    # Trailing slash on src copies contents; on dest creates dir.
    # Convert C:\path → /c/path for rsync (cygwin convention).
    $srcUnix = ($repoRoot -replace '\\', '/') -replace '^([A-Za-z]):', '/$1'
    ssh @sshOpts $sshTarget "mkdir -p $RemoteDir"
    rsync @rsyncFlags @excludes "$srcUnix/" "${sshTarget}:${RemoteDir}/"
}

if ($DryRun) {
    Write-Host ""
    Write-Host "Dry run complete. No changes applied on Contabo." -ForegroundColor Yellow
    exit 0
}

# ── 3. Install + build on Contabo ──────────────────────────────────────
Run-Step "npm install + build on Contabo" {
    $remoteBuild = @"
set -e
cd $RemoteDir
echo '--- npm install (workspaces) ---'
npm install --no-audit --no-fund
echo '--- prisma generate ---'
cd backend && npx prisma generate && cd ..
echo '--- prisma db push (schema sync; safe for additive changes) ---'
cd backend && npx prisma db push --accept-data-loss && cd ..
echo '--- turbo build ---'
npm run build
"@
    ssh @sshOpts $sshTarget $remoteBuild
}

# ── 4. Run Contabo fix script (Ollama + SDXL + firewall) ───────────────
Run-Step "Fix Ollama + SDXL + firewall on Contabo" {
    ssh @sshOpts $sshTarget "bash $RemoteDir/scripts/fix-contabo-ollama-sdxl.sh"
}

# ── 5. PM2 reload (using updated ecosystem.config.js) ──────────────────
Run-Step "PM2 reload ecosystem.config.js" {
    $pm2Cmd = @"
set -e
cd $RemoteDir
if ! command -v pm2 >/dev/null 2>&1; then
  echo 'Installing PM2 globally'
  npm install -g pm2
fi
pm2 startOrReload ecosystem.config.js
pm2 save
pm2 list
"@
    ssh @sshOpts $sshTarget $pm2Cmd
}

# ── 6. Smoke test from local ───────────────────────────────────────────
Run-Step "Probe Contabo AI endpoints from local" {
    & "$repoRoot/scripts/probe-ai-endpoints.ps1" -VpsHost $VpsHost
}

Run-Step "Smoke test 3 AI flows" {
    & "$repoRoot/scripts/smoke-test-contabo-ai.ps1" -VpsHost $VpsHost
}

Write-Host ""
Write-Host ("=" * 72) -ForegroundColor DarkCyan
Write-Host "  Ship complete. Health: https://app.sygn.live/health" -ForegroundColor Cyan
Write-Host ("=" * 72) -ForegroundColor DarkCyan
