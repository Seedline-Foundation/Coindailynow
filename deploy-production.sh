#!/bin/bash
# ============================================================================
# CoinDaily Production Deployment Script
# Run on Contabo VPS (167.86.99.97)
# ============================================================================
set -e

PROJECT_DIR="/var/www/news-platform"
cd "$PROJECT_DIR"

echo "=========================================="
echo "  CoinDaily Production Deployment"
echo "=========================================="

# Step 1: Pull latest code
echo ""
echo "[1/8] Pulling latest code..."
git pull origin main

# Step 2: Install dependencies
echo ""
echo "[2/8] Installing dependencies..."
npm install

# Step 3: Generate Prisma client
echo ""
echo "[3/8] Generating Prisma client..."
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..

# Step 4: Build backend
echo ""
echo "[4/8] Building backend..."
cd backend
npm run build
cd ..

# Step 5: Build news app
echo ""
echo "[5/8] Building news app..."
cd apps/news
npm run build
cd ../..

# Step 6: Build admin app
echo ""
echo "[6/8] Building admin app..."
cd apps/admin
npm run build
cd ../..

# Step 7: Setup nginx (first time only)
echo ""
echo "[7/8] Setting up nginx configs..."
sudo cp nginx-app.coindaily.online.conf /etc/nginx/sites-available/app.coindaily.online
sudo cp nginx-coindaily.online.conf /etc/nginx/sites-available/coindaily.online
sudo cp nginx-jet.coindaily.online.conf /etc/nginx/sites-available/jet.coindaily.online

# Enable sites (create symlinks)
sudo ln -sf /etc/nginx/sites-available/app.coindaily.online /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/coindaily.online /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/jet.coindaily.online /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Step 8: Create log directory and start/restart PM2
echo ""
echo "[8/8] Starting applications with PM2..."
mkdir -p logs

# Stop existing apps (if running)
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start all apps
pm2 start ecosystem.config.js --only coindaily-backend,coindaily-news,coindaily-admin

# Save PM2 process list (auto-restart on reboot)
pm2 save

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "  Backend API:  https://app.coindaily.online"
echo "  News App:     https://coindaily.online"
echo "  Admin Panel:  https://jet.coindaily.online"
echo ""
echo "  Check status: pm2 status"
echo "  View logs:    pm2 logs"
echo "=========================================="
