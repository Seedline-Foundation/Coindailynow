#!/bin/bash

# CoinDaily MVP Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-production}
APP_DIR="/home/coindaily/apps/Coindailynow"
BACKUP_DIR="/home/coindaily/backups"
LOG_FILE="/home/coindaily/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Print banner
echo "================================================"
echo "🚀 CoinDaily MVP Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "================================================"
echo ""

# Check if running as correct user
if [ "$USER" != "coindaily" ]; then
    error "This script must be run as 'coindaily' user"
fi

# Create backup
log "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/coindaily_$TIMESTAMP"

if [ -d "$APP_DIR" ]; then
    cp -r "$APP_DIR" "$BACKUP_PATH"
    log "✅ Backup created at: $BACKUP_PATH"
else
    warning "App directory not found, skipping backup"
fi

# Navigate to app directory
cd "$APP_DIR" || error "Failed to navigate to app directory"

# Pull latest changes
log "📥 Pulling latest changes from git..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current branch: $CURRENT_BRANCH"

if git pull origin "$CURRENT_BRANCH"; then
    log "✅ Git pull successful"
else
    error "Git pull failed"
fi

# Show latest commit
LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%an)")
log "Latest commit: $LATEST_COMMIT"

# Update backend
log "🔧 Updating backend..."
cd "$APP_DIR/backend" || error "Backend directory not found"

# Install dependencies
log "Installing backend dependencies..."
npm install --production || error "Backend npm install failed"

# Generate Prisma client
log "Generating Prisma client..."
npm run db:generate || error "Prisma generate failed"

# Run database migrations
log "Running database migrations..."
npm run db:migrate || warning "Database migration had warnings (check manually)"

# Build backend
log "Building backend..."
npm run build || error "Backend build failed"

# Update frontend
log "🎨 Updating frontend..."
cd "$APP_DIR/frontend" || error "Frontend directory not found"

# Install dependencies
log "Installing frontend dependencies..."
npm install --production || error "Frontend npm install failed"

# Build frontend
log "Building frontend..."
npm run build || error "Frontend build failed"

# Restart services
log "🔄 Restarting services..."
cd "$APP_DIR" || error "Failed to navigate to app directory"

# Stop services gracefully
log "Stopping PM2 services..."
pm2 stop all || warning "Failed to stop some services"

# Wait for processes to stop
sleep 3

# Start services
log "Starting PM2 services..."
pm2 start ecosystem.config.js || error "Failed to start services"

# Save PM2 configuration
pm2 save || warning "Failed to save PM2 configuration"

# Wait for services to start
log "Waiting for services to start..."
sleep 5

# Check service status
log "✅ Service Status:"
pm2 status

# Test endpoints
log "🧪 Testing endpoints..."

# Test backend health
if curl -f -s "http://localhost:4000/api/health" > /dev/null; then
    log "✅ Backend health check passed"
else
    error "Backend health check failed"
fi

# Test frontend
if curl -f -s "http://localhost:3000" > /dev/null; then
    log "✅ Frontend health check passed"
else
    error "Frontend health check failed"
fi

# Cleanup old backups (keep last 5)
log "🧹 Cleaning up old backups..."
cd "$BACKUP_DIR" || warning "Backup directory not found"
ls -t | tail -n +6 | xargs -r rm -rf
log "✅ Old backups cleaned up"

# Print deployment summary
echo ""
echo "================================================"
echo "🎉 Deployment Complete!"
echo "================================================"
echo "Environment: $ENVIRONMENT"
echo "Deployed at: $(date)"
echo "Latest commit: $LATEST_COMMIT"
echo "Backup location: $BACKUP_PATH"
echo ""
echo "📊 Service Status:"
pm2 list
echo ""
echo "🌐 Access your application:"
echo "  - Frontend: https://mvp.coindaily.online"
echo "  - Backend API: https://mvp.coindaily.online/api"
echo "  - GraphQL: https://mvp.coindaily.online/graphql"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs"
echo "  - Restart: pm2 restart all"
echo "  - Monitor: pm2 monit"
echo "================================================"

log "🎉 Deployment completed successfully!"
