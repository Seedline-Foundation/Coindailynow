#!/usr/bin/env pwsh
# End-to-end smoke test of the three AI flows against the Contabo VPS.
# Talks directly to the self-hosted services using their actual API schemas.
#
# Usage:
#   .\scripts\smoke-test-contabo-ai.ps1
#   .\scripts\smoke-test-contabo-ai.ps1 -VpsHost 167.86.99.97

param(
    [string]$VpsHost = "167.86.99.97",
    [string]$SaveImage = "scripts\contabo-test-image.png"
)

$ErrorActionPreference = "Continue"

function Test-Flow {
    param([string]$Name, [scriptblock]$Block)
    Write-Host ""
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    Write-Host "  $Name" -ForegroundColor Cyan
    Write-Host ("=" * 72) -ForegroundColor DarkCyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        & $Block
        $sw.Stop()
        $ms = $sw.ElapsedMilliseconds
        Write-Host "PASS in $ms ms" -ForegroundColor Green
    } catch {
        $sw.Stop()
        $ms = $sw.ElapsedMilliseconds
        $msg = $_.Exception.Message
        Write-Host "FAIL after $ms ms" -ForegroundColor Red
        Write-Host "  $msg" -ForegroundColor Red
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            $errBody = $_.ErrorDetails.Message
            Write-Host "  body: $errBody" -ForegroundColor DarkRed
        }
    }
}

# ----- 1. CONTENT GENERATION (Ollama / Llama) -----
Test-Flow "1/3  Content generation - Ollama Llama 3.1 8B" {
    $body = @{
        model   = "llama3.1:8b"
        prompt  = "Write a 2-sentence news headline and lede about Bitcoin adoption in Nigeria. Be concise."
        stream  = $false
        options = @{ temperature = 0.7; num_predict = 200 }
    } | ConvertTo-Json -Depth 5

    $url = "http://" + $VpsHost + ":11434/api/generate"
    $resp = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 120
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $resp.response
    Write-Host ""
    $promptTok = $resp.prompt_eval_count
    $genTok    = $resp.eval_count
    $secs      = [math]::Round($resp.total_duration / 1e9, 2)
    Write-Host "tokens: prompt=$promptTok gen=$genTok duration=${secs}s"
}

# ----- 2. TRANSLATION (NLLB-200) -----
Test-Flow "2/3  Translation - NLLB-200 (English -> Swahili)" {
    $body = @{
        text                  = "Bitcoin reached a new all-time high today, surpassing previous records."
        source_lang           = "eng_Latn"
        target_lang           = "swh_Latn"
        preserve_crypto_terms = $true
    } | ConvertTo-Json

    $url = "http://" + $VpsHost + ":8080/translate"
    $resp = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 60
    Write-Host ""
    $src = $resp.source_lang
    $tgt = $resp.target_lang
    $txt = $resp.translated_text
    $mdl = $resp.model_version
    Write-Host "Source:     $src" -ForegroundColor Yellow
    Write-Host "Target:     $tgt" -ForegroundColor Yellow
    Write-Host "Translated: $txt"
    Write-Host "Model:      $mdl"
}

# ----- 3. IMAGE GENERATION (custom SDXL FastAPI) -----
Test-Flow "3/3  Image generation - SDXL POST /generate" {
    $body = @{
        prompt          = "Bitcoin coin on top of a modern African city skyline at sunset, professional editorial photo, sharp focus"
        negative_prompt = "blurry, low quality, distorted, watermark, text"
        width           = 768
        height          = 512
        steps           = 4
        guidance_scale  = 0.0
    } | ConvertTo-Json

    $url = "http://" + $VpsHost + ":7860/generate"
    $resp = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 180

    $keys = ($resp.PSObject.Properties.Name) -join ', '
    Write-Host ""
    Write-Host "Response keys: $keys" -ForegroundColor Yellow

    $b64 = $null
    if ($resp.image) {
        $b64 = $resp.image
    } elseif ($resp.image_base64) {
        $b64 = $resp.image_base64
    } elseif ($resp.images -and $resp.images.Count -gt 0) {
        $b64 = $resp.images[0]
    }

    if ($b64) {
        if ($b64 -match '^data:image/[^;]+;base64,(.+)$') {
            $b64 = $Matches[1]
        }
        $bytes = [Convert]::FromBase64String($b64)
        [IO.File]::WriteAllBytes($SaveImage, $bytes)
        $byteLen = $bytes.Length
        $savedAt = $SaveImage
        Write-Host "Image saved to $savedAt size $byteLen bytes" -ForegroundColor Green
    } elseif ($resp.url) {
        $imgUrl = $resp.url
        Write-Host "Image URL: $imgUrl" -ForegroundColor Green
    } else {
        $dump = ($resp | ConvertTo-Json -Depth 3)
        Write-Host $dump -ForegroundColor DarkYellow
        throw "Could not find image data in response"
    }
}

Write-Host ""
Write-Host ("=" * 72) -ForegroundColor DarkCyan
Write-Host "  Smoke test complete." -ForegroundColor Cyan
Write-Host ("=" * 72) -ForegroundColor DarkCyan
