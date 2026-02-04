# Test NLLB-200 Translation Service
# Run with: .\test-api.ps1

Write-Host "🧪 Testing NLLB-200 Translation Service..." -ForegroundColor Green

$baseUrl = "http://localhost:8000"

# Test 1: Health check
Write-Host "`n1️⃣ Testing health endpoint..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "Status: $($health.status)" -ForegroundColor Cyan
Write-Host "Device: $($health.device)" -ForegroundColor Cyan
Write-Host "GPU Available: $($health.gpu_available)" -ForegroundColor Cyan

# Test 2: Get supported languages
Write-Host "`n2️⃣ Testing languages endpoint..." -ForegroundColor Yellow
$languages = Invoke-RestMethod -Uri "$baseUrl/languages" -Method Get
Write-Host "Supported languages: $($languages.total)" -ForegroundColor Cyan

# Test 3: Single translation (English to Swahili)
Write-Host "`n3️⃣ Testing single translation (English -> Swahili)..." -ForegroundColor Yellow
$translationRequest = @{
    text = "Bitcoin reached a new all-time high today in African markets"
    source_lang = "en"
    target_lang = "sw"
    preserve_crypto_terms = $true
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "$baseUrl/translate" -Method Post -Body $translationRequest -ContentType "application/json"
Write-Host "Original: Bitcoin reached a new all-time high today in African markets" -ForegroundColor White
Write-Host "Swahili: $($result.translated_text)" -ForegroundColor Green

# Test 4: Batch translation
Write-Host "`n4️⃣ Testing batch translation (English -> Hausa, Yoruba)..." -ForegroundColor Yellow
$batchRequest = @{
    texts = @(
        "DeFi adoption is growing in Nigeria"
        "M-Pesa integration with crypto exchanges"
    )
    source_lang = "en"
    target_langs = @("ha", "yo")
    preserve_crypto_terms = $true
} | ConvertTo-Json

$batchResult = Invoke-RestMethod -Uri "$baseUrl/translate/batch" -Method Post -Body $batchRequest -ContentType "application/json"
Write-Host "Hausa translations:" -ForegroundColor Cyan
$batchResult.translations.ha | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host "Yoruba translations:" -ForegroundColor Cyan
$batchResult.translations.yo | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
