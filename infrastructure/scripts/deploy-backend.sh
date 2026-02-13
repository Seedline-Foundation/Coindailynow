#!/bin/bash
# =============================================================================
# Deploy Backend System - app.coindaily.online
# =============================================================================

set -e

ENVIRONMENT=${1:-production}
APP_NAME="coindaily-backend"
APP_DIR="/var/www/coindaily-backend"
SOURCE_DIR="backend"

echo "[BACKEND] Starting deployment..."

# Navigate to app directory
cd /home/deploy/news-platform/$SOURCE_DIR

# Install dependencies
echo "[BACKEND] Installing dependencies..."
npm ci --production=false

# Generate Prisma client
echo "[BACKEND] Generating Prisma client..."
npx prisma generate

# Run migrations (if needed)
echo "[BACKEND] Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "[BACKEND] Building application..."
npm run build

# Sync to deployment directory
echo "[BACKEND] Syncing to $APP_DIR..."
rsync -avz --delete \
    --exclude 'node_modules' \
    ./ $APP_DIR/

# Install production dependencies
cd $APP_DIR
npm ci --production

# Generate Prisma client in production
npx prisma generate

# Set permissions
chmod -R 750 $APP_DIR
chmod 640 $APP_DIR/.env 2>/dev/null || true

# Restart PM2 process
echo "[BACKEND] Restarting PM2 process..."
pm2 restart $APP_NAME --update-env || pm2 start ecosystem.production.config.js --only $APP_NAME

echo "[BACKEND] Deployment complete!"
