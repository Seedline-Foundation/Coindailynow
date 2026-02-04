#!/bin/bash

# Deploy NLLB Translation Service to Existing Contabo Server
# Usage: ./deploy-existing-server.sh YOUR_SERVER_IP

set -e

SERVER_IP=$1
SERVER_USER=${2:-root}  # Default to root, or specify user

if [ -z "$SERVER_IP" ]; then
    echo "❌ Error: Server IP required"
    echo "Usage: ./deploy-existing-server.sh SERVER_IP [USER]"
    echo "Example: ./deploy-existing-server.sh 123.45.67.89 root"
    exit 1
fi

echo "🚀 Deploying NLLB Translation Service to existing server"
echo "Server: $SERVER_USER@$SERVER_IP"
echo ""

# Upload translation service to /opt/translation-service
echo "📤 Uploading files to /opt/translation-service..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p /opt/translation-service"
scp -r ./* $SERVER_USER@$SERVER_IP:/opt/translation-service/

# Setup on server
echo "⚙️  Installing and configuring service..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /opt/translation-service

echo "📦 Installing Python dependencies..."
apt update
apt install -y python3.10 python3-pip python3-venv

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
echo "Installing PyTorch (CPU)..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Download model
echo "📥 Downloading NLLB-200 model (~2.4GB, 5-10 min)..."
python3 -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; \
AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); \
AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M')"

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/translation-service.service << 'EOF'
[Unit]
Description=NLLB-200 Translation Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/translation-service
Environment="PATH=/opt/translation-service/venv/bin"
ExecStart=/opt/translation-service/venv/bin/python server.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/translation-service.log
StandardError=append:/var/log/translation-service-error.log

[Install]
WantedBy=multi-user.target
EOF

# Create log files
touch /var/log/translation-service.log /var/log/translation-service-error.log

# Enable and start
systemctl daemon-reload
systemctl enable translation-service
systemctl start translation-service

echo "✅ Service installed and started!"
echo ""
echo "Checking status..."
systemctl status translation-service --no-pager -l

echo ""
echo "📋 Logs:"
tail -n 20 /var/log/translation-service.log
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Service is running on port 8000 (internal)"
echo ""
echo "Next steps:"
echo "1. Configure Nginx to proxy /api/translate to localhost:8000"
echo "2. Update backend .env: TRANSLATION_SERVICE_URL=http://localhost:8000"
echo "3. Test: curl http://$SERVER_IP:8000/health"
echo ""
