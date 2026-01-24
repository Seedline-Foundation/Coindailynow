# Convert Frontend API Routes to Proxy Pattern
# This script converts all super-admin API routes to proxy to the backend

$frontendApiPath = "c:\Users\onech\Desktop\news-platform\frontend\src\app\api"
$routeFiles = Get-ChildItem -Path $frontendApiPath -Recurse -Filter "route.ts"

$converted = 0
$failed = 0

foreach ($file in $routeFiles) {
    try {
        Write-Host "Converting: $($file.FullName)" -ForegroundColor Cyan
        
        # Get relative path from api folder
        $relativePath = $file.DirectoryName.Replace($frontendApiPath, "").Replace("\", "/")
        $backendPath = "/api$relativePath"
        
        # Create new proxy content
        $newContent = @"
/**
 * API Route Proxy
 * Proxies requests to backend API
 */

import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('$backendPath');

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

export async function PUT(request: NextRequest) {
  return handler(request);
}

export async function DELETE(request: NextRequest) {
  return handler(request);
}

export async function PATCH(request: NextRequest) {
  return handler(request);
}
"@
        
        # Write new content
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        $converted++
        Write-Host "  ✓ Converted successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n=== Conversion Summary ===" -ForegroundColor Yellow
Write-Host "Converted: $converted files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor Red
