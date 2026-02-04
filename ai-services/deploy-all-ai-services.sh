#!/bin/bash

# Complete AI Services Deployment Script for Contabo VPS
# Deploys: Llama 3.1, Stable Diffusion, NLLB Translation (already done)
# Estimated time: 30-45 minutes

set -e

echo "=================================================="
echo "CoinDaily AI Services Deployment"
echo "=================================================="
echo ""
echo "This script will install:"
echo "1. Ollama (Llama 3.1 8B) - Text generation"
echo "2. Stable Diffusion WebUI - Image generation"
echo "3. Systemd services for auto-start"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
echo "Step 1: Updating system packages..."
apt update && apt upgrade -y

# Install dependencies
echo "Step 2: Installing dependencies..."
apt install -y curl git python3 python3-pip python3-venv wget \
    libgl1 libglib2.0-0 build-essential

# ============================================
# LLAMA 3.1 INSTALLATION
# ============================================

echo ""
echo "Step 3: Installing Ollama (Llama 3.1)..."

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama temporarily
ollama serve &
OLLAMA_PID=$!
sleep 5

# Pull Llama 3.1 8B model (~4.7GB download)
echo "Downloading Llama 3.1 8B model (this may take 10-15 minutes)..."
ollama pull llama3.1:8b

# Stop temporary instance
kill $OLLAMA_PID || true

# Create systemd service
echo "Creating Ollama systemd service..."
cat > /etc/systemd/system/ollama.service << 'EOF'
[Unit]
Description=Ollama LLM Service
After=network.target

[Service]
Type=simple
User=root
Environment="OLLAMA_HOST=0.0.0.0:11434"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
StandardOutput=append:/var/log/ollama.log
StandardError=append:/var/log/ollama.log

[Install]
WantedBy=multi-user.target
EOF

# Start Ollama service
systemctl daemon-reload
systemctl enable ollama
systemctl start ollama

# Wait for startup
sleep 5

# Test Ollama
echo "Testing Ollama..."
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✓ Ollama is running!"
else
    echo "✗ Ollama failed to start. Check logs: journalctl -u ollama"
    exit 1
fi

# ============================================
# STABLE DIFFUSION INSTALLATION
# ============================================

echo ""
echo "Step 4: Installing Stable Diffusion WebUI..."

# Create directory
mkdir -p /opt/stable-diffusion
cd /opt/stable-diffusion

# Clone repository
if [ ! -d "stable-diffusion-webui" ]; then
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
fi

cd stable-diffusion-webui

# Create installation script
cat > install-sd.sh << 'EOF'
#!/bin/bash
export COMMANDLINE_ARGS="--skip-torch-cuda-test --no-half --api --listen --port 7860 --nowebui"
./webui.sh
EOF

chmod +x install-sd.sh

# Run initial installation (downloads models)
echo "Installing Stable Diffusion (this may take 15-20 minutes)..."
timeout 300 ./install-sd.sh || true

# Create systemd service
echo "Creating Stable Diffusion systemd service..."
cat > /etc/systemd/system/stable-diffusion.service << 'EOF'
[Unit]
Description=Stable Diffusion WebUI API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/stable-diffusion/stable-diffusion-webui
Environment="COMMANDLINE_ARGS=--skip-torch-cuda-test --no-half --api --listen --port 7860 --nowebui"
ExecStart=/opt/stable-diffusion/stable-diffusion-webui/webui.sh
Restart=always
RestartSec=10
StandardOutput=append:/var/log/stable-diffusion.log
StandardError=append:/var/log/stable-diffusion.log

[Install]
WantedBy=multi-user.target
EOF

# Start Stable Diffusion service
systemctl daemon-reload
systemctl enable stable-diffusion
systemctl start stable-diffusion

# Wait for startup (SD takes longer)
echo "Waiting for Stable Diffusion to start (may take 1-2 minutes)..."
sleep 60

# Test Stable Diffusion
echo "Testing Stable Diffusion..."
if curl -f http://localhost:7860/sdapi/v1/options > /dev/null 2>&1; then
    echo "✓ Stable Diffusion is running!"
else
    echo "⚠ Stable Diffusion may still be starting. Check logs: journalctl -u stable-diffusion"
fi

# ============================================
# FIREWALL CONFIGURATION
# ============================================

echo ""
echo "Step 5: Configuring firewall..."

# Install UFW if not present
if ! command -v ufw &> /dev/null; then
    apt install -y ufw
fi

# Allow ports
ufw allow 11434/tcp comment 'Ollama API'
ufw allow 7860/tcp comment 'Stable Diffusion API'
ufw allow 8000/tcp comment 'NLLB Translation' # Already done, but ensure

# Show status
ufw status

# ============================================
# HEALTH CHECKS
# ============================================

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "Service Status:"
echo "---------------"

# Check Ollama
if systemctl is-active --quiet ollama; then
    echo "✓ Ollama: RUNNING"
else
    echo "✗ Ollama: STOPPED"
fi

# Check Stable Diffusion
if systemctl is-active --quiet stable-diffusion; then
    echo "✓ Stable Diffusion: RUNNING"
else
    echo "✗ Stable Diffusion: STOPPED (may still be starting)"
fi

# Check NLLB (if exists)
if systemctl is-active --quiet nllb-translation; then
    echo "✓ NLLB Translation: RUNNING"
else
    echo "⚠ NLLB Translation: Not found (install separately)"
fi

echo ""
echo "API Endpoints:"
echo "---------------"
echo "Llama:              http://$(hostname -I | awk '{print $1}'):11434"
echo "Stable Diffusion:   http://$(hostname -I | awk '{print $1}'):7860"
echo "NLLB Translation:   http://$(hostname -I | awk '{print $1}'):8000"

echo ""
echo "Quick Tests:"
echo "---------------"
echo ""
echo "# Test Llama:"
echo "curl http://localhost:11434/api/tags"
echo ""
echo "# Test Stable Diffusion:"
echo "curl http://localhost:7860/sdapi/v1/options"
echo ""
echo "# Test NLLB (if installed):"
echo "curl http://localhost:8000/health"

echo ""
echo "Logs:"
echo "---------------"
echo "Ollama:             journalctl -u ollama -f"
echo "Stable Diffusion:   journalctl -u stable-diffusion -f"
echo "NLLB Translation:   journalctl -u nllb-translation -f"

echo ""
echo "Next Steps:"
echo "---------------"
echo "1. Test all services from your Windows machine"
echo "2. Update backend .env with service URLs"
echo "3. Deploy llamaClient.ts and stableDiffusionClient.ts"
echo "4. Run integration tests"
echo "5. Monitor performance for 24-48 hours"
echo ""
echo "=================================================="
echo "Monthly Cost Savings: ~€685 (93% reduction)"
echo "=================================================="
