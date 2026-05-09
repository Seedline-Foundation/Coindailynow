#!/usr/bin/env pwsh
# =============================================================================
# CoinDaily Platform - Domain Connectivity Test Suite
# Tests: coindaily.online, jet.coindaily.online, ai.coindaily.online, app.coindaily.online
# Compatible with PowerShell 5.1+
# =============================================================================

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CoinDaily Domain Test Suite" -ForegroundColor Cyan
Write-Host "  $timestamp" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

$results = @()
$passed = 0
$failed = 0
$warnings = 0

function Test-Result($name, $status, $detail) {
    $script:results += [PSCustomObject]@{ Test = $name; Status = $status; Detail = $detail }
    if ($status -eq "PASS") { 
        $script:passed++
        Write-Host "  [PASS] $name" -ForegroundColor Green
    } elseif ($status -eq "WARN") {
        $script:warnings++
        Write-Host "  [WARN] $name - $detail" -ForegroundColor Yellow
    } else {
        $script:failed++
        Write-Host "  [FAIL] $name - $detail" -ForegroundColor Red
    }
}

# =============================================================================
# 1. DNS Resolution
# =============================================================================
Write-Host "1. DNS Resolution" -ForegroundColor White
$domains = @("coindaily.online", "jet.coindaily.online", "ai.coindaily.online", "app.coindaily.online")
$expectedIP = "167.86.99.97"

foreach ($domain in $domains) {
    try {
        $dns = [System.Net.Dns]::GetHostAddresses($domain)
        $ip = $dns[0].IPAddressToString
        if ($ip -eq $expectedIP) {
            Test-Result "DNS: $domain -> $ip" "PASS" ""
        } else {
            Test-Result "DNS: $domain" "WARN" "Resolved to $ip (expected $expectedIP)"
        }
    } catch {
        Test-Result "DNS: $domain" "FAIL" "DNS resolution failed"
    }
}

# =============================================================================
# 2. SSL Certificate Checks
# =============================================================================
Write-Host "`n2. SSL Certificates" -ForegroundColor White

foreach ($domain in $domains) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient($domain, 443)
        $tcp.ReceiveTimeout = 5000
        $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, { $true })
        $ssl.AuthenticateAsClient($domain)
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
        
        $subject = $cert.Subject
        $expiry = $cert.NotAfter
        $sans = ($cert.Extensions | Where-Object { $_.Oid.FriendlyName -eq "Subject Alternative Name" })
        $sanList = if ($sans) { $sans.Format($false) } else { "None" }
        
        $covers = $false
        if ($subject -match "CN=$([regex]::Escape($domain))") { $covers = $true }
        if ($sanList -match [regex]::Escape($domain)) { $covers = $true }
        if ($sanList -match "\*\.coindaily\.online") { $covers = $true }
        
        if ($covers -and $expiry -gt (Get-Date)) {
            Test-Result "SSL: $domain" "PASS" "Valid until $($expiry.ToString('yyyy-MM-dd'))"
        } elseif (-not $covers) {
            Test-Result "SSL: $domain" "FAIL" "Cert '$subject' does NOT cover $domain. SANs: $sanList"
        } else {
            Test-Result "SSL: $domain" "FAIL" "Expired: $($expiry.ToString('yyyy-MM-dd'))"
        }
        
        $ssl.Close()
        $tcp.Close()
    } catch {
        Test-Result "SSL: $domain" "FAIL" "SSL error"
    }
}

# =============================================================================
# 3. HTTP/HTTPS Connectivity
# =============================================================================
Write-Host "`n3. HTTP/HTTPS Connectivity" -ForegroundColor White

$endpoints = @(
    @{Name="coindaily.online HTTPS"; URL="https://coindaily.online"; Expect="200"},
    @{Name="jet.coindaily.online HTTPS"; URL="https://jet.coindaily.online"; Expect="200"},
    @{Name="ai.coindaily.online HTTPS (-k)"; URL="https://ai.coindaily.online"; Expect="200"},
    @{Name="ai.coindaily.online HTTP"; URL="http://ai.coindaily.online"; Expect="200"},
    @{Name="app.coindaily.online /health HTTPS (-k)"; URL="https://app.coindaily.online/health"; Expect="200"},
    @{Name="app.coindaily.online /health HTTP"; URL="http://app.coindaily.online/health"; Expect="200"}
)

foreach ($ep in $endpoints) {
    try {
        $raw = curl.exe -ksSL -o NUL -w "%{http_code}|%{time_total}" --max-time 15 $ep.URL 2>&1
        $parts = ($raw -join "").Trim().Split("|")
        $code = $parts[0]
        $time = $parts[1]
        
        if ($code -eq $ep.Expect -or ($code -ge 200 -and $code -lt 400)) {
            Test-Result $ep.Name "PASS" "HTTP $code (${time}s)"
        } elseif ($code -eq "000") {
            Test-Result $ep.Name "FAIL" "Connection refused/timeout"
        } elseif ($code -eq "404") {
            Test-Result $ep.Name "WARN" "HTTP 404 (${time}s)"
        } else {
            Test-Result $ep.Name "WARN" "HTTP $code (${time}s)"
        }
    } catch {
        Test-Result $ep.Name "FAIL" "curl error"
    }
}

# =============================================================================
# 4. Backend API Health & Features
# =============================================================================
Write-Host "`n4. Backend API (app.coindaily.online)" -ForegroundColor White

try {
    $healthRaw = (curl.exe -sS --max-time 10 "http://app.coindaily.online/health" 2>&1) -join ""
    $health = $healthRaw | ConvertFrom-Json
    
    if ($health.status -eq "healthy") {
        $uptimeHrs = [math]::Round($health.uptime / 3600, 1)
        Test-Result "Backend Health" "PASS" "Healthy | Uptime: ${uptimeHrs}h | v$($health.version) | $($health.environment)"
    } else {
        Test-Result "Backend Health" "FAIL" "Status: $($health.status)"
    }
    
    @("graphql", "websockets", "redis", "authentication") | ForEach-Object {
        if ($health.features.$_) { Test-Result "Feature: $_" "PASS" "" }
        else { Test-Result "Feature: $_" "WARN" "Not enabled" }
    }
} catch {
    Test-Result "Backend Health" "FAIL" "Could not parse health response"
}

# GraphQL endpoint
try {
    $gqlRaw = (curl.exe -sS --max-time 10 "http://app.coindaily.online/graphql" -H "Content-Type: application/json" -d '{\"query\":\"{ __typename }\"}' 2>&1) -join ""
    if ($gqlRaw -match "AUTHENTICATION_REQUIRED") {
        Test-Result "GraphQL Endpoint" "PASS" "Active (auth required)"
    } elseif ($gqlRaw -match "__typename") {
        Test-Result "GraphQL Endpoint" "PASS" "Active"
    } else {
        Test-Result "GraphQL Endpoint" "WARN" "Unexpected: $($gqlRaw.Substring(0, [Math]::Min(80, $gqlRaw.Length)))"
    }
} catch {
    Test-Result "GraphQL Endpoint" "FAIL" "Not responding"
}

# =============================================================================
# 5. CORS Configuration (All Frontends -> Backend)
# =============================================================================
Write-Host "`n5. CORS: Subdomain -> Backend API" -ForegroundColor White

$corsOrigins = @(
    @{Name="coindaily.online"; Origin="https://coindaily.online"},
    @{Name="jet.coindaily.online"; Origin="https://jet.coindaily.online"},
    @{Name="ai.coindaily.online"; Origin="https://ai.coindaily.online"},
    @{Name="press.coindaily.online"; Origin="https://press.coindaily.online"}
)

foreach ($cors in $corsOrigins) {
    try {
        $corsHeaders = curl.exe -sI --max-time 10 -X OPTIONS "http://app.coindaily.online/graphql" `
            -H "Origin: $($cors.Origin)" `
            -H "Access-Control-Request-Method: POST" `
            -H "Access-Control-Request-Headers: Content-Type,Authorization" 2>&1
        
        $allowOriginLine = ($corsHeaders | Select-String "Access-Control-Allow-Origin")
        if ($allowOriginLine) {
            $allowOrigin = $allowOriginLine.ToString().Trim()
            if ($allowOrigin -match [regex]::Escape($cors.Origin)) {
                Test-Result "CORS: $($cors.Name) -> backend" "PASS" $allowOrigin
            } else {
                Test-Result "CORS: $($cors.Name) -> backend" "FAIL" "Got: $allowOrigin (need $($cors.Origin))"
            }
        } else {
            Test-Result "CORS: $($cors.Name) -> backend" "FAIL" "No ACAO header found"
        }
    } catch {
        Test-Result "CORS: $($cors.Name)" "FAIL" "Preflight error"
    }
}

# =============================================================================
# 6. Frontend Page Content
# =============================================================================
Write-Host "`n6. Frontend Pages" -ForegroundColor White

# coindaily.online
try {
    $page = (curl.exe -ksSL --max-time 15 "https://coindaily.online" 2>&1) -join ""
    if ($page -match "CoinDaily") { Test-Result "News Site: Branding" "PASS" "" }
    else { Test-Result "News Site: Branding" "WARN" "CoinDaily not in HTML" }
    if ($page -match "_next") { Test-Result "News Site: Next.js" "PASS" "" }
    else { Test-Result "News Site: Next.js" "FAIL" "Missing Next.js assets" }
} catch { Test-Result "News Site" "FAIL" "Could not load" }

# jet.coindaily.online
try {
    $page = (curl.exe -ksSL --max-time 15 "https://jet.coindaily.online" 2>&1) -join ""
    if ($page -match "_next|CoinDaily|admin") { Test-Result "Admin (jet): Loaded" "PASS" "" }
    else { Test-Result "Admin (jet)" "WARN" "Expected content missing" }
} catch { Test-Result "Admin (jet)" "FAIL" "Could not load" }

# ai.coindaily.online
try {
    $page = (curl.exe -ksSL --max-time 15 "https://ai.coindaily.online" 2>&1) -join ""
    if ($page -match "_next|AI|CoinDaily|dashboard") { 
        Test-Result "AI Dashboard: Loaded" "PASS" "" 
    } elseif ($page -match "404|not found|Error|Cannot GET") {
        Test-Result "AI Dashboard" "WARN" "404/Error - service may not be running on port 3004"
    } else {
        Test-Result "AI Dashboard" "WARN" "Unknown response ($($page.Length) chars)"
    }
} catch { Test-Result "AI Dashboard" "FAIL" "Could not load" }

# =============================================================================
# 7. Response Time Performance
# =============================================================================
Write-Host "`n7. Response Times (target <500ms API, <2s pages)" -ForegroundColor White

$perfUrls = @(
    @{Name="coindaily.online"; URL="https://coindaily.online"; Target=2000},
    @{Name="jet.coindaily.online"; URL="https://jet.coindaily.online"; Target=2000},
    @{Name="app.coindaily.online /health"; URL="http://app.coindaily.online/health"; Target=500}
)

foreach ($p in $perfUrls) {
    try {
        $raw = curl.exe -ksSL -o NUL -w "%{time_total}" --max-time 15 $p.URL 2>&1
        $timeMs = [math]::Round([double](($raw -join "").Trim()) * 1000)
        
        if ($timeMs -lt $p.Target) {
            Test-Result "Perf: $($p.Name)" "PASS" "${timeMs}ms (target <$($p.Target)ms)"
        } elseif ($timeMs -lt ($p.Target * 2)) {
            Test-Result "Perf: $($p.Name)" "WARN" "${timeMs}ms (target <$($p.Target)ms)"
        } else {
            Test-Result "Perf: $($p.Name)" "FAIL" "${timeMs}ms (target <$($p.Target)ms)"
        }
    } catch {
        Test-Result "Perf: $($p.Name)" "FAIL" "Could not measure"
    }
}

# =============================================================================
# SUMMARY
# =============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed:   $passed" -ForegroundColor Green
Write-Host "  Warnings: $warnings" -ForegroundColor Yellow
Write-Host "  Failed:   $failed" -ForegroundColor Red
Write-Host "  Total:    $($passed + $warnings + $failed)" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# =============================================================================
# ACTIONABLE FIXES
# =============================================================================
if ($failed -gt 0 -or $warnings -gt 0) {
    Write-Host "ACTION ITEMS:" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    
    $sslFailed = $results | Where-Object { $_.Status -eq "FAIL" -and $_.Test -match "SSL:" }
    $corsFailed = $results | Where-Object { $_.Status -eq "FAIL" -and $_.Test -match "CORS:" }
    $aiFailed = $results | Where-Object { ($_.Status -eq "FAIL" -or $_.Status -eq "WARN") -and $_.Test -match "AI" }
    
    if ($sslFailed) {
        Write-Host "`n[1] FIX SSL CERTIFICATES" -ForegroundColor Red
        Write-Host "    Current cert covers: coindaily.online + www.coindaily.online ONLY" -ForegroundColor White
        Write-Host "    Missing: app.coindaily.online, ai.coindaily.online" -ForegroundColor White
        Write-Host "    SSH into 167.86.99.97 and run:" -ForegroundColor Gray
        Write-Host '    sudo certbot certonly --nginx \' -ForegroundColor Gray
        Write-Host '      -d coindaily.online -d www.coindaily.online \' -ForegroundColor Gray
        Write-Host '      -d app.coindaily.online -d jet.coindaily.online \' -ForegroundColor Gray
        Write-Host '      -d ai.coindaily.online -d press.coindaily.online \' -ForegroundColor Gray
        Write-Host '      -d pr.coindaily.online -d backend.coindaily.online' -ForegroundColor Gray
        Write-Host '    sudo nginx -t && sudo systemctl reload nginx' -ForegroundColor Gray
        Write-Host ""
        Write-Host '    OR use Cloudflare wildcard cert:' -ForegroundColor Gray
        Write-Host '    sudo certbot certonly --dns-cloudflare \' -ForegroundColor Gray
        Write-Host '      --dns-cloudflare-credentials /etc/cloudflare.ini \' -ForegroundColor Gray
        Write-Host '      -d "*.coindaily.online" -d coindaily.online' -ForegroundColor Gray
    }
    
    if ($corsFailed) {
        Write-Host "`n[2] FIX CORS (Backend Redeploy)" -ForegroundColor Red
        Write-Host "    Production backend returns wrong CORS origin for subdomains." -ForegroundColor White
        Write-Host "    Source code (backend/src/index.ts) has correct config but" -ForegroundColor White
        Write-Host "    the deployed build is outdated." -ForegroundColor White
        Write-Host "    SSH into 167.86.99.97 and run:" -ForegroundColor Gray
        Write-Host "    cd /var/www/coindaily-app" -ForegroundColor Gray
        Write-Host "    npm ci && npm run build" -ForegroundColor Gray
        Write-Host "    pm2 restart coindaily-backend" -ForegroundColor Gray
    }
    
    if ($aiFailed) {
        Write-Host "`n[3] FIX AI DASHBOARD" -ForegroundColor Yellow
        Write-Host "    ai.coindaily.online is not serving content properly." -ForegroundColor White
        Write-Host "    Check if the app is running:" -ForegroundColor Gray
        Write-Host "    pm2 status coindaily-ai" -ForegroundColor Gray
        Write-Host "    pm2 logs coindaily-ai --lines 50" -ForegroundColor Gray
        Write-Host "    Ensure port 3004 is in use:" -ForegroundColor Gray
        Write-Host "    ss -tlnp | grep 3004" -ForegroundColor Gray
    }
    
    Write-Host ""
}

[Net.ServicePointManager]::ServerCertificateValidationCallback = $null
