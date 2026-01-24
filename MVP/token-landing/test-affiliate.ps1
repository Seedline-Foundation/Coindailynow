# Affiliate System Testing PowerShell Script
# Quick manual tests for affiliate endpoints

$BASE_URL = "http://localhost:3001"
$API_BASE = "$BASE_URL/api/affiliate"

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "   Affiliate System Quick Test Script" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Generate unique test data
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testEmail = "test-affiliate-$timestamp@example.com"
$testPassword = "TestPassword123!"
$testName = "Test User $timestamp"

Write-Host "`nTest Data:" -ForegroundColor Yellow
Write-Host "  Email: $testEmail" -ForegroundColor White
Write-Host "  Password: $testPassword" -ForegroundColor White

# Test 1: Register Affiliate
Write-Host "`n[TEST 1] Registering new affiliate..." -ForegroundColor Cyan
$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = $testName
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$API_BASE/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json"
    
    Write-Host "✓ Registration successful!" -ForegroundColor Green
    Write-Host "  Affiliate Code: $($registerResponse.code)" -ForegroundColor White
    $affiliateCode = $registerResponse.code
} catch {
    Write-Host "✗ Registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n[TEST 2] Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor White
    $authToken = $loginResponse.token
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Get Affiliate Link
Write-Host "`n[TEST 3] Getting affiliate link..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $authToken"
}

try {
    $linkResponse = Invoke-RestMethod -Uri "$API_BASE/link" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Link retrieved!" -ForegroundColor Green
    Write-Host "  Link: $($linkResponse.link)" -ForegroundColor White
    Write-Host "  Code: $($linkResponse.code)" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to get link: $_" -ForegroundColor Red
}

# Test 4: Track Clicks
Write-Host "`n[TEST 4] Tracking clicks (3 clicks)..." -ForegroundColor Cyan
for ($i = 1; $i -le 3; $i++) {
    try {
        $trackResponse = Invoke-RestMethod -Uri "$API_BASE/track?ref=$affiliateCode" `
            -Method GET
        Write-Host "  Click $i tracked ✓" -ForegroundColor Green
    } catch {
        Write-Host "  Click $i failed ✗" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200
}

# Test 5: Get Statistics
Write-Host "`n[TEST 5] Getting statistics..." -ForegroundColor Cyan
try {
    $statsResponse = Invoke-RestMethod -Uri "$API_BASE/stats" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Statistics retrieved!" -ForegroundColor Green
    Write-Host "  Total Clicks: $($statsResponse.stats.totalClicks)" -ForegroundColor White
    Write-Host "  Total Conversions: $($statsResponse.stats.totalConversions)" -ForegroundColor White
    Write-Host "  Conversion Rate: $($statsResponse.stats.conversionRate)%" -ForegroundColor White
    Write-Host "  Total Earnings: `$$($statsResponse.stats.totalEarnings)" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to get stats: $_" -ForegroundColor Red
}

# Test 6: Submit Whitelist Entry
Write-Host "`n[TEST 6] Submitting whitelist entry..." -ForegroundColor Cyan
$whitelistEmail = "whitelist-$timestamp@example.com"
$whitelistBody = @{
    email = $whitelistEmail
    referralCode = $affiliateCode
} | ConvertTo-Json

try {
    $whitelistResponse = Invoke-RestMethod -Uri "$BASE_URL/api/whitelist/submit" `
        -Method POST `
        -Body $whitelistBody `
        -ContentType "application/json"
    
    Write-Host "✓ Whitelist entry submitted!" -ForegroundColor Green
    Write-Host "  Email: $whitelistEmail" -ForegroundColor White
    Write-Host "  Credited to: $affiliateCode" -ForegroundColor White
} catch {
    Write-Host "✗ Whitelist submission failed: $_" -ForegroundColor Red
}

# Test 7: Check Stats After Conversion
Write-Host "`n[TEST 7] Checking stats after conversion..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
try {
    $statsResponse2 = Invoke-RestMethod -Uri "$API_BASE/stats" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Updated statistics:" -ForegroundColor Green
    Write-Host "  Total Clicks: $($statsResponse2.stats.totalClicks)" -ForegroundColor White
    Write-Host "  Total Conversions: $($statsResponse2.stats.totalConversions)" -ForegroundColor White
    Write-Host "  Conversion Rate: $($statsResponse2.stats.conversionRate)%" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to get updated stats: $_" -ForegroundColor Red
}

# Test 8: View Leaderboard
Write-Host "`n[TEST 8] Viewing leaderboard..." -ForegroundColor Cyan
try {
    $leaderboardResponse = Invoke-RestMethod -Uri "$API_BASE/leaderboard?limit=10" `
        -Method GET
    
    Write-Host "✓ Leaderboard retrieved!" -ForegroundColor Green
    Write-Host "  Top affiliates: $($leaderboardResponse.leaderboard.Count)" -ForegroundColor White
    
    if ($leaderboardResponse.leaderboard.Count -gt 0) {
        Write-Host "`n  Top 3:" -ForegroundColor Yellow
        $leaderboardResponse.leaderboard[0..2] | ForEach-Object -Begin { $rank = 1 } -Process {
            if ($_) {
                $name = if ($_.name) { $_.name } else { "Anonymous" }
                Write-Host "    $rank. $name - $($_.totalConversions) conversions" -ForegroundColor White
                $rank++
            }
        }
    }
} catch {
    Write-Host "✗ Failed to get leaderboard: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nTest Credentials:" -ForegroundColor Yellow
Write-Host "  Email: $testEmail" -ForegroundColor White
Write-Host "  Password: $testPassword" -ForegroundColor White
Write-Host "  Affiliate Code: $affiliateCode" -ForegroundColor White
Write-Host "  Auth Token: $($authToken.Substring(0, 30))..." -ForegroundColor White

Write-Host "`n✓ All tests completed!" -ForegroundColor Green
Write-Host "`nYou can now:" -ForegroundColor Yellow
Write-Host "  1. Login at: $BASE_URL/affiliate/login" -ForegroundColor White
Write-Host "  2. View dashboard at: $BASE_URL/dashboard?tab=affiliate" -ForegroundColor White
Write-Host "  3. Share your link: $BASE_URL/?ref=$affiliateCode" -ForegroundColor White
Write-Host ""
