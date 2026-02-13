#!/bin/bash
# Deploy AI System to Contabo Server
# Run from local machine: ./deploy-ai.sh

set -e

# Configuration
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-your-contabo-ip}"
DEPLOY_PATH="/opt/coindaily/ai"
APP_NAME="coindaily-ai-dashboard"

echo "🚀 Deploying CoinDaily AI System to $SERVER_HOST"

# Build the AI app locally first
echo "📦 Building AI app..."
cd apps/ai
npm run build

# Create deployment package
echo "📁 Creating deployment package..."
cd ../..
tar -czf ai-deploy.tar.gz \
    apps/ai/.next \
    apps/ai/public \
    apps/ai/package.json \
    apps/ai/next.config.js \
    apps/ai/Dockerfile \
    docker-compose.ai.yml

# Upload to server
echo "📤 Uploading to server..."
scp ai-deploy.tar.gz ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# Deploy on server
echo "🔧 Deploying on server..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /opt/coindaily/ai
tar -xzf ai-deploy.tar.gz

# Build and restart the AI dashboard container
docker-compose -f docker-compose.ai.yml build ai-dashboard
docker-compose -f docker-compose.ai.yml up -d ai-dashboard

# Clean up
rm ai-deploy.tar.gz

echo "✅ AI Dashboard deployed successfully!"
docker-compose -f docker-compose.ai.yml ps
ENDSSH

# Cleanup local
rm ai-deploy.tar.gz

echo "✅ Deployment complete!"
echo "🌐 Access at: https://ai.coindaily.online"
