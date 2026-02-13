#!/bin/bash
# =============================================================================
# Deploy Press System - press.coindaily.online
# =============================================================================

set -e

ENVIRONMENT=${1:-production}
APP_NAME="coindaily-press"
APP_DIR="/var/www/coindaily-press"
SOURCE_DIR="apps/press"

echo "[PRESS] Starting deployment..."

# Navigate to app directory
cd /home/deploy/news-platform/$SOURCE_DIR

# Install dependencies
echo "[PRESS] Installing dependencies..."
npm ci --production=false

# Build the application
echo "[PRESS] Building application..."
npm run build

# Sync to deployment directory
echo "[PRESS] Syncing to $APP_DIR..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next/cache' \
    ./ $APP_DIR/

# Install production dependencies
cd $APP_DIR
npm ci --production

# Restart PM2 process
echo "[PRESS] Restarting PM2 process..."
pm2 restart $APP_NAME --update-env || pm2 start ecosystem.production.config.js --only $APP_NAME

echo "[PRESS] Deployment complete!"
