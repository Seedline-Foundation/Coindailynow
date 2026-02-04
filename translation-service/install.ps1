# NLLB-200 Translation Service Setup Script
# Run with: .\install.ps1

Write-Host "🌍 Setting up NLLB-200 Translation Service..." -ForegroundColor Green

# Check Python installation
Write-Host "`nChecking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found. Please install Python 3.9+ from python.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green

# Create virtual environment
Write-Host "`nCreating virtual environment..." -ForegroundColor Yellow
python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Virtual environment created" -ForegroundColor Green

# Activate virtual environment
Write-Host "`nActivating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "`nUpgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install PyTorch (CPU or GPU)
Write-Host "`nDetecting GPU support..." -ForegroundColor Yellow
$gpuCheck = nvidia-smi 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ NVIDIA GPU detected! Installing PyTorch with CUDA support..." -ForegroundColor Green
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
} else {
    Write-Host "⚠️  No NVIDIA GPU detected. Installing CPU-only PyTorch..." -ForegroundColor Yellow
    Write-Host "   (Translation will be slower, consider using GPU for production)" -ForegroundColor Yellow
    pip install torch torchvision torchaudio
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Download model (first run)
Write-Host "`nDownloading NLLB-200 model (this may take 5-10 minutes)..." -ForegroundColor Yellow
Write-Host "Model will be cached for future use" -ForegroundColor Cyan
python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M')"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Model download failed, it will download on first API call" -ForegroundColor Yellow
} else {
    Write-Host "✅ Model downloaded successfully" -ForegroundColor Green
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the translation service:" -ForegroundColor Cyan
Write-Host "  1. Activate venv: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  2. Run server: python server.py" -ForegroundColor White
Write-Host "`nAPI will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Documentation at: http://localhost:8000/docs" -ForegroundColor Cyan
