# Start NLLB-200 Translation Service
# Run with: .\start.ps1

Write-Host "🚀 Starting NLLB-200 Translation Service..." -ForegroundColor Green

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start server
Write-Host "`nServer starting at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Documentation at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Yellow

python server.py
