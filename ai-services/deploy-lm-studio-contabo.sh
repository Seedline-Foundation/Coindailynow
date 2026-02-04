#!/bin/bash

# LM Studio Server Deployment for Contabo VPS
# Deploys LM Studio with Llama 3.1 8B for production use
# Server: 167.86.99.97

set -e

echo "=================================================="
echo "LM Studio Production Deployment"
echo "=================================================="
echo ""
echo "This will install:"
echo "- LM Studio Server (headless mode)"
echo "- Llama 3.1 8B Q4_K_M model (~4.9GB)"
echo "- Systemd service for auto-start"
echo "- API on port 1234"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
echo "Step 1: Updating system..."
apt update && apt upgrade -y

# Install dependencies
echo "Step 2: Installing dependencies..."
apt install -y curl wget git python3 python3-pip build-essential

# Create directory
echo "Step 3: Creating LM Studio directory..."
mkdir -p /opt/lm-studio
cd /opt/lm-studio

# Download Ollama (easier than LM Studio CLI for Linux)
# Note: LM Studio doesn't have a stable Linux CLI yet, so we use Ollama with OpenAI-compatible API
echo "Step 4: Installing Ollama (LM Studio alternative for Linux)..."
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama temporarily
echo "Step 5: Starting Ollama service..."
systemctl start ollama
sleep 3

# Pull Llama 3.1 8B model
echo "Step 6: Downloading Llama 3.1 8B model (~4.9GB, may take 10-15 minutes)..."
ollama pull llama3.1:8b

echo "Step 7: Testing model..."
ollama run llama3.1:8b "Say 'Model loaded successfully'" --verbose

# Create OpenAI-compatible API wrapper
echo "Step 8: Setting up OpenAI-compatible API..."

# Create Python wrapper for OpenAI compatibility
cat > /opt/lm-studio/openai-api-server.py << 'PYEOF'
#!/usr/bin/env python3
"""
OpenAI-compatible API wrapper for Ollama
Provides /v1/chat/completions endpoint compatible with OpenAI SDK
"""

from flask import Flask, request, jsonify
import requests
import time
import uuid

app = Flask(__name__)

OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "llama3.1:8b"

@app.route('/v1/models', methods=['GET'])
def list_models():
    """List available models (OpenAI-compatible)"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        ollama_models = response.json().get('models', [])
        
        models = [{
            'id': model['name'],
            'object': 'model',
            'created': int(time.time()),
            'owned_by': 'ollama'
        } for model in ollama_models]
        
        return jsonify({
            'object': 'list',
            'data': models
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI-compatible chat completions endpoint"""
    try:
        data = request.json
        messages = data.get('messages', [])
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 2000)
        
        # Convert OpenAI messages to Ollama prompt
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if role == 'system':
                prompt += f"System: {content}\n\n"
            elif role == 'user':
                prompt += f"User: {content}\n\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n\n"
        
        prompt += "Assistant:"
        
        # Call Ollama
        ollama_request = {
            'model': data.get('model', MODEL_NAME),
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': temperature,
                'num_predict': max_tokens
            }
        }
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=ollama_request,
            timeout=120
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Ollama API error'}), 500
        
        ollama_response = response.json()
        generated_text = ollama_response.get('response', '')
        
        # Return OpenAI-compatible response
        return jsonify({
            'id': f"chatcmpl-{uuid.uuid4()}",
            'object': 'chat.completion',
            'created': int(time.time()),
            'model': data.get('model', MODEL_NAME),
            'choices': [{
                'index': 0,
                'message': {
                    'role': 'assistant',
                    'content': generated_text
                },
                'finish_reason': 'stop'
            }],
            'usage': {
                'prompt_tokens': ollama_response.get('prompt_eval_count', 0),
                'completion_tokens': ollama_response.get('eval_count', 0),
                'total_tokens': ollama_response.get('prompt_eval_count', 0) + ollama_response.get('eval_count', 0)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            return jsonify({'status': 'healthy', 'ollama': 'connected'})
        return jsonify({'status': 'unhealthy', 'ollama': 'disconnected'}), 500
    except:
        return jsonify({'status': 'unhealthy', 'ollama': 'disconnected'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1234, debug=False)
PYEOF

chmod +x /opt/lm-studio/openai-api-server.py

# Install Flask
echo "Step 9: Installing Flask..."
pip3 install flask requests

# Create systemd service for API wrapper
cat > /etc/systemd/system/lm-studio-api.service << 'EOF'
[Unit]
Description=LM Studio OpenAI-Compatible API Server
After=network.target ollama.service
Requires=ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/lm-studio
ExecStart=/usr/bin/python3 /opt/lm-studio/openai-api-server.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/lm-studio-api.log
StandardError=append:/var/log/lm-studio-api.log

[Install]
WantedBy=multi-user.target
EOF

# Start services
echo "Step 10: Starting services..."
systemctl daemon-reload
systemctl enable ollama
systemctl enable lm-studio-api
systemctl restart ollama
sleep 3
systemctl start lm-studio-api

# Configure firewall
echo "Step 11: Configuring firewall..."
ufw allow 1234/tcp comment 'LM Studio API'

# Wait for startup
echo "Step 12: Waiting for services to start..."
sleep 5

# Test installation
echo "Step 13: Testing installation..."

# Test Ollama
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✓ Ollama is running"
else
    echo "✗ Ollama failed to start"
    journalctl -u ollama -n 20
    exit 1
fi

# Test OpenAI API
if curl -f http://localhost:1234/v1/models > /dev/null 2>&1; then
    echo "✓ OpenAI-compatible API is running"
else
    echo "✗ API failed to start"
    journalctl -u lm-studio-api -n 20
    exit 1
fi

# Test generation
echo "Testing text generation..."
RESPONSE=$(curl -s -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }')

if echo "$RESPONSE" | grep -q "choices"; then
    echo "✓ Text generation working"
else
    echo "✗ Text generation failed"
    echo "$RESPONSE"
fi

echo ""
echo "=================================================="
echo "Installation Complete!"
echo "=================================================="
echo ""
echo "Services Status:"
echo "----------------"
systemctl is-active ollama && echo "✓ Ollama: RUNNING" || echo "✗ Ollama: STOPPED"
systemctl is-active lm-studio-api && echo "✓ LM Studio API: RUNNING" || echo "✗ LM Studio API: STOPPED"

echo ""
echo "API Endpoints:"
echo "----------------"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "OpenAI-compatible API: http://$SERVER_IP:1234"
echo "Health check:          http://$SERVER_IP:1234/health"
echo "List models:           http://$SERVER_IP:1234/v1/models"
echo ""
echo "Test from Windows:"
echo "----------------"
echo "curl http://$SERVER_IP:1234/v1/models"
echo ""
echo "curl http://$SERVER_IP:1234/v1/chat/completions \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\":\"llama3.1:8b\",\"messages\":[{\"role\":\"user\",\"content\":\"Test\"}]}'"

echo ""
echo "Backend Configuration:"
echo "----------------"
echo "Add to backend/.env:"
echo "LLAMA_SERVICE_URL=http://$SERVER_IP:1234"

echo ""
echo "Logs:"
echo "----------------"
echo "Ollama:      journalctl -u ollama -f"
echo "API Server:  journalctl -u lm-studio-api -f"
echo "             tail -f /var/log/lm-studio-api.log"

echo ""
echo "Monthly Savings: ~€300 (article generation)"
echo "=================================================="
