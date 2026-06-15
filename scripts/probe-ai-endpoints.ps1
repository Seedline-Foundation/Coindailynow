#!/usr/bin/env pwsh
# Probe self-hosted AI model endpoints on the Contabo VPS.
# Usage: .\scripts\probe-ai-endpoints.ps1
#        .\scripts\probe-ai-endpoints.ps1 -Host 167.86.99.97

param(
    [string]$VpsHost = "167.86.99.97"
)

$ErrorActionPreference = "Continue"

$endpoints = @(
    @{ Name = "Ollama (Llama/DeepSeek native)"; Url = "http://${VpsHost}:11434/api/tags";       Method = "GET" }
    @{ Name = "Ollama #2 (DeepSeek alt port)";  Url = "http://${VpsHost}:11435/api/tags";       Method = "GET" }
    @{ Name = "LM Studio shim (OpenAI-compat)"; Url = "http://${VpsHost}:1234/v1/models";       Method = "GET" }
    @{ Name = "LM Studio shim health";          Url = "http://${VpsHost}:1234/health";          Method = "GET" }
    @{ Name = "NLLB translation (:8080)";       Url = "http://${VpsHost}:8080/health";          Method = "GET" }
    @{ Name = "NLLB translation (:8000 alt)";   Url = "http://${VpsHost}:8000/health";          Method = "GET" }
    @{ Name = "SDXL / Automatic1111";           Url = "http://${VpsHost}:7860/sdapi/v1/options"; Method = "GET" }
    @{ Name = "ComfyUI";                        Url = "http://${VpsHost}:8188/system_stats";    Method = "GET" }
    @{ Name = "BGE embeddings";                 Url = "http://${VpsHost}:8081/health";          Method = "GET" }
    @{ Name = "AI orchestrator (ai-system)";    Url = "http://${VpsHost}:3004/api/health";      Method = "GET" }
)

Write-Host ""
Write-Host "Probing AI endpoints on $VpsHost ..." -ForegroundColor Cyan
Write-Host ("=" * 70)

$results = @()
foreach ($ep in $endpoints) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-WebRequest -Uri $ep.Url -Method $ep.Method -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
        $sw.Stop()
        $status = "OK ($($resp.StatusCode))"
        $color  = "Green"
    } catch [System.Net.WebException] {
        $sw.Stop()
        $status = "FAIL: " + $_.Exception.Message.Split([Environment]::NewLine)[0]
        $color  = "Red"
    } catch {
        $sw.Stop()
        $status = "FAIL: " + $_.Exception.Message.Split([Environment]::NewLine)[0]
        $color  = "Red"
    }
    Write-Host ("{0,-38} {1,5}ms  " -f $ep.Name, $sw.ElapsedMilliseconds) -NoNewline
    Write-Host $status -ForegroundColor $color
    $results += [pscustomobject]@{ Name = $ep.Name; Url = $ep.Url; Status = $status }
}

Write-Host ("=" * 70)
Write-Host ""
Write-Host "Reachable endpoints are what you put in backend/.env and apps/ai/.env.local." -ForegroundColor Yellow
Write-Host "Anything FAIL means: not deployed, firewall blocking, or service crashed." -ForegroundColor Yellow
