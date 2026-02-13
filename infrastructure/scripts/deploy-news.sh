#!/bin/bash
# =============================================================================
# Deploy News System - coindaily.online
# =============================================================================

set -e

ENVIRONMENT=${1:-production}
APP_NAME="coindaily-news"
APP_DIR="/var/www/coindaily-news"
SOURCE_DIR="apps/news"

echo "[NEWS] Starting deployment..."

# Navigate to app directory
cd /home/deploy/news-platform/$SOURCE_DIR

# Install dependencies
echo "[NEWS] Installing dependencies..."
npm ci --production=false

# Build the application
echo "[NEWS] Building application..."
npm run build

# Sync to deployment directory
echo "[NEWS] Syncing to $APP_DIR..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next/cache' \
    ./ $APP_DIR/

# Install production dependencies
cd $APP_DIR
npm ci --production

# Restart PM2 process
echo "[NEWS] Restarting PM2 process..."
pm2 restart $APP_NAME --update-env || pm2 start ecosystem.production.config.js --only $APP_NAME

echo "[NEWS] Deployment complete!"
