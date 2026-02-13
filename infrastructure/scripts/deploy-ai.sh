#!/bin/bash
# =============================================================================
# Deploy AI System - ai.coindaily.online
# =============================================================================

set -e

ENVIRONMENT=${1:-production}
APP_NAME="coindaily-ai"
APP_DIR="/var/www/coindaily-ai"
SOURCE_DIR="ai-system"

echo "[AI] Starting deployment..."

# Navigate to app directory
cd /home/deploy/news-platform/$SOURCE_DIR

# Install dependencies
echo "[AI] Installing dependencies..."
npm ci --production=false

# Build the application (if TypeScript)
echo "[AI] Building application..."
npm run build 2>/dev/null || echo "[AI] No build step required"

# Sync to deployment directory
echo "[AI] Syncing to $APP_DIR..."
rsync -avz --delete \
    --exclude 'node_modules' \
    ./ $APP_DIR/

# Install production dependencies
cd $APP_DIR
npm ci --production

# Restart PM2 process
echo "[AI] Restarting PM2 process..."
pm2 restart $APP_NAME --update-env || pm2 start ecosystem.production.config.js --only $APP_NAME

echo "[AI] Deployment complete!"
