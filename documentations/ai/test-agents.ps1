#!/usr/bin/env pwsh
# ==============================================================================
# CoinDaily AI Agent Testing Script
# Tests all 26 agents via the backend API with live Ollama models
# ==============================================================================

$API_BASE = "http://localhost:4000/api/ai/registry"
$AUTH = "Authorization: Bearer mock_super_admin_token_dev"

function Test-Endpoint {
    param([string]$Method, [string]$Path, [string]$Body, [string]$Label)
    Write-Host "`n===== $Label =====" -ForegroundColor Cyan
    $url = "$API_BASE$Path"
    
    $args = @("-s", "-w", "`nHTTP:%{http_code}", $url, "-H", $AUTH)
    if ($Method -eq "POST") {
        $args += @("-X", "POST", "-H", "Content-Type: application/json", "-d", $Body)
    }
    
    $result = curl.exe @args 2>&1
    $lines = $result -split "`n"
    $httpCode = ($lines | Select-Object -Last 1) -replace "HTTP:", ""
    $json = ($lines | Select-Object -SkipLast 1) -join "`n"
    
    if ($httpCode -eq "200") {
        Write-Host "  Status: $httpCode OK" -ForegroundColor Green
    } else {
        Write-Host "  Status: $httpCode FAIL" -ForegroundColor Red
    }
    
    try {
        $parsed = $json | ConvertFrom-Json
        return $parsed
    } catch {
        Write-Host "  Response: $($json.Substring(0, [Math]::Min(200, $json.Length)))"
        return $null
    }
}

Write-Host "`n" 
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  CoinDaily AI Agent Testing Suite" -ForegroundColor Yellow
Write-Host "  Tests all 26 agents with self-hosted DeepSeek R1 & Llama 3.1" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

# ---- Step 1: Check Ollama ----
Write-Host "`n--- Step 1: Check Ollama is running ---" -ForegroundColor Magenta
$ollamaCheck = curl.exe -s -w "`nHTTP:%{http_code}" "http://localhost:11434/api/tags" 2>&1
$ollamaCode = ($ollamaCheck -split "`n" | Select-Object -Last 1) -replace "HTTP:", ""
if ($ollamaCode -eq "200") {
    Write-Host "  Ollama is RUNNING" -ForegroundColor Green
    $tags = ($ollamaCheck -split "`n" | Select-Object -SkipLast 1) -join "`n" | ConvertFrom-Json
    Write-Host "  Available models:" -ForegroundColor White
    $tags.models | ForEach-Object { Write-Host "    - $($_.name) ($([math]::Round($_.size/1GB, 1)) GB)" }
} else {
    Write-Host "  Ollama is NOT running! Start it first: ollama serve" -ForegroundColor Red
    Write-Host "  Then pull models: ollama pull deepseek-r1:8b && ollama pull llama3.1:8b" -ForegroundColor Yellow
    exit 1
}

# ---- Step 2: Check Backend ----
Write-Host "`n--- Step 2: Check Backend API ---" -ForegroundColor Magenta
$stats = Test-Endpoint -Method "GET" -Path "/stats" -Label "Registry Stats"
if ($stats -and $stats.data) {
    Write-Host "  Total agents: $($stats.data.totalAgents)" -ForegroundColor White
    Write-Host "  Active: $($stats.data.activeAgents)" -ForegroundColor White
    Write-Host "  Health: $($stats.data.overallHealth)" -ForegroundColor White
}

# ---- Step 3: List All Agents ----
Write-Host "`n--- Step 3: List All Agents ---" -ForegroundColor Magenta
$agents = Test-Endpoint -Method "GET" -Path "/agents" -Label "All Agents"
if ($agents -and $agents.data) {
    $agents.data | ForEach-Object {
        $modelIcon = if ($_.model -eq 'deepseek') { "DS" } else { "LL" }
        Write-Host "  [$modelIcon] $($_.name) ($($_.category)) - $($_.health.status)" -ForegroundColor White
    }
}

# ---- Step 4: Health Check All ----
Write-Host "`n--- Step 4: Health Check All Agents ---" -ForegroundColor Magenta
$health = Test-Endpoint -Method "GET" -Path "/health" -Label "Health Check"
if ($health -and $health.data) {
    $healthy = ($health.data | Where-Object { $_.health.modelAvailable }).Count
    $total = $health.data.Count
    Write-Host "  Model available: $healthy/$total agents" -ForegroundColor $(if ($healthy -eq $total) { "Green" } else { "Yellow" })
    $health.data | Where-Object { -not $_.health.modelAvailable } | ForEach-Object {
        Write-Host "    WARNING: $($_.name) - model NOT available" -ForegroundColor Red
    }
}

# ---- Step 5: Submit Test Tasks ----
Write-Host "`n--- Step 5: Submit Test Tasks (one per category) ---" -ForegroundColor Magenta

$testTasks = @(
    @{
        agent = "sentiment-analysis-agent"
        label = "Sentiment Analysis (DeepSeek)"
        body = '{"input":{"analysisType":"news_sentiment","data":[{"title":"Bitcoin surges past $100K as African adoption grows","source":"CoinDesk","date":"2026-03-05"},{"title":"Nigeria approves crypto regulation framework","source":"Reuters","date":"2026-03-04"}]},"priority":"high"}'
    },
    @{
        agent = "data-scraping-agent"
        label = "Data Scraping (Llama)"
        body = '{"input":{"taskType":"extract_data","data":{"sources":["binance_africa","luno","quidax"],"dataType":"market_overview","period":"24h"}},"priority":"normal"}'
    },
    @{
        agent = "news-aggregation-agent"
        label = "News Aggregation (Llama)"
        body = '{"input":{"taskType":"aggregate","data":{"topics":["bitcoin","ethereum","african_crypto"],"sources":["coindesk","cointelegraph","local_african"],"maxArticles":5}},"priority":"normal"}'
    },
    @{
        agent = "news-curator-agent"
        label = "News Curator (Llama)"
        body = '{"input":{"taskType":"curate","data":{"articles":[{"title":"Luno exchange sees record trading volume in Nigeria","content":"Luno, one of Africa leading crypto exchanges, reported...","source":"TechCrunch Africa"}],"audience":"african_crypto_enthusiasts"}},"priority":"normal"}'
    },
    @{
        agent = "code-review-agent"
        label = "Code Review (DeepSeek)"
        body = '{"input":{"taskType":"review","data":{"code":"async function getPrice(token) {\n  const resp = await fetch(`/api/price/${token}`);\n  return resp.json();\n}","language":"typescript","focus":"security,performance"}},"priority":"normal"}'
    },
    @{
        agent = "customer-support-agent"
        label = "Customer Support (Llama)"
        body = '{"input":{"taskType":"respond","data":{"query":"How do I buy Bitcoin using M-Pesa on CoinDaily?","userRegion":"kenya","language":"en"}},"priority":"high"}'
    },
    @{
        agent = "trade-bot-agent"
        label = "Trade Bot (DeepSeek)"
        body = '{"input":{"taskType":"analyze_trade","data":{"pair":"BTC/USDT","currentPrice":98500,"volume24h":2500000,"indicators":{"rsi":65,"macd":"bullish","support":95000,"resistance":102000}}},"priority":"high"}'
    },
    @{
        agent = "compliance-agent"
        label = "Compliance (DeepSeek)"
        body = '{"input":{"taskType":"check_compliance","data":{"content":"New token launch: moonAfrica coin with 1000% guaranteed returns!","contentType":"article","region":"nigeria"}},"priority":"urgent"}'
    }
)

$submittedTaskIds = @()

foreach ($test in $testTasks) {
    $result = Test-Endpoint -Method "POST" -Path "/agents/$($test.agent)/tasks" -Body $test.body -Label $test.label
    if ($result -and $result.data) {
        Write-Host "  Task ID: $($result.data.id)" -ForegroundColor White
        Write-Host "  Status: $($result.data.status)" -ForegroundColor White
        $submittedTaskIds += $result.data.id
    }
}

# ---- Step 6: Wait and Check Results ----
Write-Host "`n--- Step 6: Wait for tasks to complete (max 60s) ---" -ForegroundColor Magenta
$maxWait = 60
$waited = 0
$checkInterval = 5

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds $checkInterval
    $waited += $checkInterval
    
    $running = Test-Endpoint -Method "GET" -Path "/tasks/running" -Label "Running Tasks (${waited}s)"
    $runningCount = if ($running -and $running.data) { $running.data.Count } else { 0 }
    
    Write-Host "  Running: $runningCount tasks" -ForegroundColor White
    
    if ($runningCount -eq 0 -and $waited -gt 10) {
        Write-Host "  All tasks completed!" -ForegroundColor Green
        break
    }
}

# ---- Step 7: Show Completed Tasks ----
Write-Host "`n--- Step 7: Completed Tasks ---" -ForegroundColor Magenta
$completed = Test-Endpoint -Method "GET" -Path "/tasks/completed" -Label "Completed Tasks"
if ($completed -and $completed.data) {
    foreach ($task in $completed.data) {
        $color = if ($task.status -eq 'completed') { "Green" } elseif ($task.status -eq 'failed') { "Red" } else { "Yellow" }
        Write-Host "`n  Task: $($task.id)" -ForegroundColor White
        Write-Host "  Agent: $($task.agentId)" -ForegroundColor White
        Write-Host "  Status: $($task.status)" -ForegroundColor $color
        if ($task.processingTimeMs) {
            Write-Host "  Time: $($task.processingTimeMs)ms" -ForegroundColor White
        }
        if ($task.error) {
            Write-Host "  Error: $($task.error)" -ForegroundColor Red
        }
        if ($task.output) {
            $outputStr = ($task.output | ConvertTo-Json -Depth 3 -Compress)
            Write-Host "  Output: $($outputStr.Substring(0, [Math]::Min(300, $outputStr.Length)))..." -ForegroundColor Gray
        }
    }
}

# ---- Step 8: Final Stats ----
Write-Host "`n--- Step 8: Final Registry Stats ---" -ForegroundColor Magenta
$finalStats = Test-Endpoint -Method "GET" -Path "/stats" -Label "Final Stats"
if ($finalStats -and $finalStats.data) {
    Write-Host "  Total tasks processed: $($finalStats.data.totalTasksProcessed)" -ForegroundColor White
    Write-Host "  Total in queue: $($finalStats.data.totalTasksInQueue)" -ForegroundColor White
    Write-Host "  Overall health: $($finalStats.data.overallHealth)" -ForegroundColor White
}

Write-Host "`n============================================================" -ForegroundColor Yellow
Write-Host "  Testing Complete!" -ForegroundColor Yellow
Write-Host "  Now open http://localhost:3001/super-admin/ai to see results" -ForegroundColor Yellow
Write-Host "============================================================`n" -ForegroundColor Yellow
