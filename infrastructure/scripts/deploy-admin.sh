#!/bin/bash
# =============================================================================
# Deploy Admin System - jet.coindaily.online
# ⚠️ SECURED DEPLOYMENT - ADMIN ONLY
# =============================================================================

set -e

ENVIRONMENT=${1:-production}
APP_NAME="coindaily-admin"
APP_DIR="/var/www/coindaily-admin"
SOURCE_DIR="apps/admin"

echo "[ADMIN] Starting secure deployment..."
echo "[ADMIN] ⚠️ This is a secured admin deployment"

# Navigate to app directory
cd /home/deploy/news-platform/$SOURCE_DIR

# Install dependencies
echo "[ADMIN] Installing dependencies..."
npm ci --production=false

# Build the application
echo "[ADMIN] Building application..."
npm run build

# Sync to deployment directory
echo "[ADMIN] Syncing to $APP_DIR..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next/cache' \
    ./ $APP_DIR/

# Install production dependencies
cd $APP_DIR
npm ci --production

# Set strict permissions
echo "[ADMIN] Setting strict permissions..."
chown -R deploy:www-data $APP_DIR
chmod -R 750 $APP_DIR
chmod 640 $APP_DIR/.env 2>/dev/null || true

# Restart PM2 process
echo "[ADMIN] Restarting PM2 process..."
pm2 restart $APP_NAME --update-env || pm2 start ecosystem.production.config.js --only $APP_NAME

echo "[ADMIN] Deployment complete!"
echo "[ADMIN] Remember to verify IP whitelist in nginx config!"
