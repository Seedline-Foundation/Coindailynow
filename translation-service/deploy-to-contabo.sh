#!/bin/bash

# NLLB-200 Translation Service - Contabo Deployment Script
# Usage: ./deploy-to-contabo.sh YOUR_VPS_IP

set -e

VPS_IP=$1
VPS_USER="translation"

if [ -z "$VPS_IP" ]; then
    echo "❌ Error: VPS IP address required"
    echo "Usage: ./deploy-to-contabo.sh YOUR_VPS_IP"
    exit 1
fi

echo "🚀 Deploying NLLB-200 Translation Service to Contabo VPS"
echo "VPS IP: $VPS_IP"
echo ""

# Step 1: Copy files to VPS
echo "📤 Uploading files..."
scp -r ./* $VPS_USER@$VPS_IP:~/translation-service/

# Step 2: Run setup on VPS
echo "⚙️  Setting up service on VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd ~/translation-service

# Activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Download model
echo "📥 Downloading NLLB-200 model (this may take 5-10 minutes)..."
python3 -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; \
AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); \
AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M')"

echo "✅ Setup complete!"
ENDSSH

# Step 3: Set up systemd service
echo "🔧 Configuring systemd service..."
ssh root@$VPS_IP << 'ENDSSH'
cat > /etc/systemd/system/translation-service.service << 'EOF'
[Unit]
Description=NLLB-200 Translation Service
After=network.target

[Service]
Type=simple
User=translation
WorkingDirectory=/home/translation/translation-service
Environment="PATH=/home/translation/translation-service/venv/bin"
ExecStart=/home/translation/translation-service/venv/bin/python server.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/translation-service.log
StandardError=append:/var/log/translation-service-error.log

[Install]
WantedBy=multi-user.target
EOF

# Create log files
touch /var/log/translation-service.log /var/log/translation-service-error.log
chown translation:translation /var/log/translation-service*.log

# Enable and start service
systemctl daemon-reload
systemctl enable translation-service
systemctl restart translation-service
systemctl status translation-service

echo "✅ Service started!"
ENDSSH

# Step 4: Test service
echo ""
echo "🧪 Testing service..."
sleep 5
curl -X POST "http://$VPS_IP:8000/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bitcoin is trending in Nigeria",
    "source_lang": "en",
    "target_lang": "ha",
    "preserve_crypto_terms": true
  }'

echo ""
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Service running at: http://$VPS_IP:8000"
echo "Health check: http://$VPS_IP:8000/health"
echo "API docs: http://$VPS_IP:8000/docs"
echo ""
echo "Next steps:"
echo "1. Configure Nginx reverse proxy (see CONTABO_DEPLOYMENT.md Step 5)"
echo "2. Add SSL certificate with certbot"
echo "3. Update TRANSLATION_SERVICE_URL in your .env file"
echo ""
