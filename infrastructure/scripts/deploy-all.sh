#!/bin/bash
# ============================================
# CoinDaily Platform - Full Deployment Script
# ============================================

set -e

# Configuration
SERVER_IP="167.86.99.97"
SERVER_USER="root"
DEPLOY_DIR="/var/www"
LOG_DIR="/var/log/coindaily"
LOCAL_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   CoinDaily Platform Deployment${NC}"
echo -e "${BLUE}============================================${NC}"

# Check SSH connectivity
echo -e "${YELLOW}[1/10] Checking SSH connectivity...${NC}"
ssh -q ${SERVER_USER}@${SERVER_IP} exit
echo -e "${GREEN}✓ SSH connection successful${NC}"

# Create directory structure
echo -e "${YELLOW}[2/10] Creating directory structure...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
mkdir -p /var/www/coindaily-backend
mkdir -p /var/www/coindaily-news
mkdir -p /var/www/coindaily-admin
mkdir -p /var/www/coindaily-pr
mkdir -p /var/www/coindaily-ai
mkdir -p /var/log/coindaily
chmod 755 /var/log/coindaily
echo "✓ Directories created"
EOF

# Sync Backend
echo -e "${YELLOW}[3/10] Deploying Backend API...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'tests' \
    --exclude '*.log' \
    --exclude '.env.local' \
    ${LOCAL_DIR}/backend/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/coindaily-backend/
echo -e "${GREEN}✓ Backend synced${NC}"

# Sync News Frontend
echo -e "${YELLOW}[4/10] Deploying News Frontend...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude '*.log' \
    ${LOCAL_DIR}/frontend/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/coindaily-news/
echo -e "${GREEN}✓ News Frontend synced${NC}"

# Sync Admin Portal
echo -e "${YELLOW}[5/10] Deploying Admin Portal...${NC}"
# Admin uses same codebase but different build
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude '*.log' \
    ${LOCAL_DIR}/frontend/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/coindaily-admin/
echo -e "${GREEN}✓ Admin Portal synced${NC}"

# Sync PR System
echo -e "${YELLOW}[6/10] Deploying PR System...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude '*.log' \
    ${LOCAL_DIR}/frontend/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/coindaily-pr/
echo -e "${GREEN}✓ PR System synced${NC}"

# Sync AI System
echo -e "${YELLOW}[7/10] Deploying AI System...${NC}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.log' \
    ${LOCAL_DIR}/ai-system/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/coindaily-ai/
echo -e "${GREEN}✓ AI System synced${NC}"

# Sync Infrastructure configs
echo -e "${YELLOW}[8/10] Deploying Nginx configs...${NC}"
scp ${LOCAL_DIR}/infrastructure/nginx/*.conf ${SERVER_USER}@${SERVER_IP}:/etc/nginx/sites-available/
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
# Enable all sites
ln -sf /etc/nginx/sites-available/coindaily.online.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/backend.coindaily.online.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/jet.coindaily.online.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/pr.coindaily.online.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ai.coindaily.online.conf /etc/nginx/sites-enabled/

# Test nginx config
nginx -t
echo "✓ Nginx configs installed"
EOF
echo -e "${GREEN}✓ Nginx configured${NC}"

# Deploy PM2 ecosystem
echo -e "${YELLOW}[9/10] Deploying PM2 ecosystem...${NC}"
scp ${LOCAL_DIR}/infrastructure/ecosystem.production.config.js ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/ecosystem.config.js
echo -e "${GREEN}✓ PM2 config deployed${NC}"

# Install dependencies and start services
echo -e "${YELLOW}[10/10] Installing dependencies and starting services...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /var/www

# Backend
echo "Installing backend dependencies..."
cd coindaily-backend && npm ci --production && cd ..

# News Frontend
echo "Installing news frontend dependencies..."
cd coindaily-news && npm ci --production && cd ..

# Admin Portal
echo "Installing admin dependencies..."
cd coindaily-admin && npm ci --production && cd ..

# PR System
echo "Installing PR system dependencies..."
cd coindaily-pr && npm ci --production && cd ..

# AI System
echo "Installing AI system dependencies..."
cd coindaily-ai && npm ci --production && cd ..

# Start/Restart PM2
echo "Starting PM2 services..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "✓ All services started"
EOF

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Services deployed:"
echo -e "  ${BLUE}• coindaily.online${NC} - News Platform"
echo -e "  ${BLUE}• backend.coindaily.online${NC} - Backend API"
echo -e "  ${BLUE}• jet.coindaily.online${NC} - Admin Portal (IP Restricted)"
echo -e "  ${BLUE}• pr.coindaily.online${NC} - PR System"
echo -e "  ${BLUE}• ai.coindaily.online${NC} - AI Services"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add SSL certificates: certbot --nginx -d coindaily.online -d backend.coindaily.online -d jet.coindaily.online -d pr.coindaily.online -d ai.coindaily.online"
echo "2. Configure DNS A records for all subdomains"
echo "3. Add whitelisted IPs to jet.coindaily.online.conf"
echo "4. Test all endpoints"
