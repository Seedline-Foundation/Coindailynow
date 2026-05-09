# LM Studio Integration Test Script
# Tests all LM Studio API endpoints for CoinDaily

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "LM Studio Integration Test" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:1234"
$serverUrl = "http://167.86.99.97:1234"

# Ask which endpoint to test
Write-Host "Select test environment:" -ForegroundColor Yellow
Write-Host "1. Local (Windows) - http://localhost:1234"
Write-Host "2. Server (Contabo) - http://167.86.99.97:1234"
$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "2") {
    $baseUrl = $serverUrl
    Write-Host "Testing against Contabo server..." -ForegroundColor Green
} else {
    Write-Host "Testing against local LM Studio..." -ForegroundColor Green
}

Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
Write-Host "Endpoint: GET $baseUrl/v1/models" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/v1/models" -Method Get -ErrorAction Stop
    Write-Host "✓ PASSED - Models available: $($response.data.Count)" -ForegroundColor Green
    
    foreach ($model in $response.data) {
        Write-Host "  - $($model.id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ FAILED - Cannot connect to LM Studio" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure LM Studio is running:" -ForegroundColor Yellow
    Write-Host "1. Open LM Studio application" -ForegroundColor White
    Write-Host "2. Click 'Local Server' tab" -ForegroundColor White
    Write-Host "3. Load a model (Llama 3.1 8B recommended)" -ForegroundColor White
    Write-Host "4. Click 'Start Server'" -ForegroundColor White
    exit 1
}

Write-Host ""

# Test 2: Simple Text Generation
Write-Host "Test 2: Simple Text Generation" -ForegroundColor Yellow
Write-Host "Prompt: 'Rewrite: Bitcoin hits new high'" -ForegroundColor Gray

$requestBody = @{
    model = $response.data[0].id
    messages = @(
        @{
            role = "system"
            content = "You are a crypto content writer."
        }
        @{
            role = "user"
            content = "Rewrite this headline in a more engaging way: Bitcoin hits new high"
        }
    )
    temperature = 0.7
    max_tokens = 100
} | ConvertTo-Json -Depth 10

try {
    $genResponse = Invoke-RestMethod -Uri "$baseUrl/v1/chat/completions" -Method Post -Body $requestBody -ContentType "application/json" -ErrorAction Stop
    $generatedText = $genResponse.choices[0].message.content
    
    Write-Host "✓ PASSED - Generated text:" -ForegroundColor Green
    Write-Host "  $generatedText" -ForegroundColor White
    Write-Host "  Tokens used: $($genResponse.usage.total_tokens)" -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED - Text generation error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Article Rewrite (Complex Task)
Write-Host "Test 3: Article Rewrite with JSON Response" -ForegroundColor Yellow
Write-Host "Testing structured output generation..." -ForegroundColor Gray

$articleRequest = @{
    model = $response.data[0].id
    messages = @(
        @{
            role = "system"
            content = "You are a professional crypto content writer. Respond ONLY with valid JSON, no markdown formatting."
        }
        @{
            role = "user"
            content = @"
Rewrite this crypto article for CoinDaily Africa.

Original Title: Bitcoin Price Surges Past $50K
Original Content: Bitcoin reached a new milestone today as its price surpassed $50,000 for the first time in months. The surge comes amid growing institutional adoption and positive market sentiment.

Provide ONLY valid JSON (no markdown, no code blocks):
{
  "title": "rewritten title (60-80 characters)",
  "excerpt": "engaging excerpt (150-200 characters)",
  "content": "full rewritten article in HTML (300+ words)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
"@
        }
    )
    temperature = 0.7
    max_tokens = 1500
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Generating (may take 30-60 seconds)..." -ForegroundColor Gray
    $articleResponse = Invoke-RestMethod -Uri "$baseUrl/v1/chat/completions" -Method Post -Body $articleRequest -ContentType "application/json" -ErrorAction Stop
    $articleContent = $articleResponse.choices[0].message.content
    
    # Try to parse JSON
    if ($articleContent -match '\{[\s\S]*\}') {
        $jsonMatch = $Matches[0]
        $parsed = $jsonMatch | ConvertFrom-Json
        
        Write-Host "✓ PASSED - Article rewritten successfully" -ForegroundColor Green
        Write-Host "  Title: $($parsed.title)" -ForegroundColor White
        Write-Host "  Excerpt: $($parsed.excerpt)" -ForegroundColor Gray
        Write-Host "  Keywords: $($parsed.keywords -join ', ')" -ForegroundColor Gray
        Write-Host "  Content length: $($parsed.content.Length) chars" -ForegroundColor Gray
        Write-Host "  Tokens used: $($articleResponse.usage.total_tokens)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ WARNING - Generated text but not valid JSON" -ForegroundColor Yellow
        Write-Host "Response: $articleContent" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ FAILED - Article rewrite error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Performance Test
Write-Host "Test 4: Performance Test" -ForegroundColor Yellow
Write-Host "Measuring response time for 200-word generation..." -ForegroundColor Gray

$perfRequest = @{
    model = $response.data[0].id
    messages = @(
        @{
            role = "user"
            content = "Write a 200-word article about cryptocurrency trading in Africa."
        }
    )
    temperature = 0.7
    max_tokens = 300
} | ConvertTo-Json -Depth 10

try {
    $startTime = Get-Date
    $perfResponse = Invoke-RestMethod -Uri "$baseUrl/v1/chat/completions" -Method Post -Body $perfRequest -ContentType "application/json" -ErrorAction Stop
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    $tokensGenerated = $perfResponse.usage.completion_tokens
    $tokensPerSecond = [math]::Round($tokensGenerated / $duration, 2)
    
    Write-Host "✓ PASSED - Performance metrics:" -ForegroundColor Green
    Write-Host "  Response time: $([math]::Round($duration, 2)) seconds" -ForegroundColor White
    Write-Host "  Tokens generated: $tokensGenerated" -ForegroundColor Gray
    Write-Host "  Speed: $tokensPerSecond tokens/second" -ForegroundColor Gray
    
    if ($tokensPerSecond -lt 10) {
        Write-Host "  ⚠ WARNING: Slow performance. Consider:" -ForegroundColor Yellow
        Write-Host "    - Using Q4_K_M quantization instead of Q8_0" -ForegroundColor White
        Write-Host "    - Upgrading to GPU VPS" -ForegroundColor White
        Write-Host "    - Reducing max_tokens" -ForegroundColor White
    } elseif ($tokensPerSecond -gt 20) {
        Write-Host "  ✓ Excellent performance!" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ FAILED - Performance test error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Backend Integration Test
Write-Host "Test 5: Backend Integration Test" -ForegroundColor Yellow
Write-Host "Testing lmStudioClient.ts..." -ForegroundColor Gray

if (Test-Path "test-llama.ts") {
    try {
        Write-Host "Running: npx ts-node test-llama.ts" -ForegroundColor Gray
        $output = npx ts-node test-llama.ts 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PASSED - Backend integration successful" -ForegroundColor Green
            Write-Host $output -ForegroundColor Gray
        } else {
            Write-Host "✗ FAILED - Backend integration error" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
        }
    } catch {
        Write-Host "⚠ SKIPPED - test-llama.ts not found or error running" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ SKIPPED - test-llama.ts not found" -ForegroundColor Yellow
    Write-Host "  Create test-llama.ts to test backend integration" -ForegroundColor Gray
}

Write-Host ""

# Summary
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $baseUrl" -ForegroundColor White
Write-Host "Model: $($response.data[0].id)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update backend/.env: LLAMA_SERVICE_URL=$baseUrl" -ForegroundColor White
Write-Host "2. Deploy lmStudioClient.ts to backend/src/services/" -ForegroundColor White
Write-Host "3. Update contentAutomationService.ts to use lmStudioClient" -ForegroundColor White
Write-Host "4. Run full integration test: npx ts-node test-llama.ts" -ForegroundColor White
Write-Host "5. Monitor performance for 48 hours" -ForegroundColor White
Write-Host ""
Write-Host "Monthly Savings: ~€300 (article writing)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
