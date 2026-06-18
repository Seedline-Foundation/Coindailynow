#!/bin/bash

# CoinDaily Token Landing - Contabo Deployment Script
# Run this script on your Contabo server

set -e  # Exit on any error

echo "=========================================="
echo "🚀 CoinDaily Deployment Starting..."
echo "=========================================="

# Configuration
PROJECT_DIR="/var/www/token-landing"
PM2_APP_NAME="token-landing"

# Step 1: Navigate to project directory
echo ""
echo "📁 Step 1: Navigating to project directory..."
cd $PROJECT_DIR
echo "✅ Current directory: $(pwd)"

# Step 2: Pull latest changes from GitHub
echo ""
echo "📥 Step 2: Pulling latest changes from GitHub..."
git fetch origin
git pull origin main
echo "✅ Latest code pulled successfully"

# Step 3: Install dependencies
echo ""
echo "📦 Step 3: Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# Step 4: Check if .env file exists
echo ""
echo "🔍 Step 4: Checking environment configuration..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env created from example"
        echo "⚠️  IMPORTANT: Update DATABASE_URL and other secrets in .env"
    else
        echo "❌ No .env.example found. Please create .env manually"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Step 5: Database setup
echo ""
echo "🗄️  Step 5: Setting up database..."

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=" .env; then
    echo "✅ DATABASE_URL found in .env"
    
    # Generate Prisma Client
    echo "Generating Prisma Client..."
    npx prisma generate
    echo "✅ Prisma Client generated"
    
    # Run migrations
    echo "Running database migrations..."
    npx prisma migrate deploy
    echo "✅ Database migrations completed"
    
    # Optional: Seed database (uncomment if you have seed data)
    # echo "Seeding database..."
    # npx prisma db seed
    # echo "✅ Database seeded"
else
    echo "⚠️  DATABASE_URL not found in .env"
    echo "Skipping database setup. Please configure DATABASE_URL and run:"
    echo "  npx prisma generate"
    echo "  npx prisma migrate deploy"
fi

# Step 6: Build the application
echo ""
echo "🏗️  Step 6: Building application..."
npm run build
echo "✅ Application built successfully"

# Step 7: Restart PM2 service
echo ""
echo "🔄 Step 7: Managing PM2 process..."

# Check if PM2 process exists
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo "Restarting existing PM2 process..."
    pm2 restart $PM2_APP_NAME
    echo "✅ PM2 process restarted"
else
    echo "Starting new PM2 process..."
    pm2 start npm --name "$PM2_APP_NAME" -- start
    pm2 save
    echo "✅ PM2 process started and saved"
fi

# Step 8: Verify deployment
echo ""
echo "🔍 Step 8: Verifying deployment..."
pm2 status
echo ""
pm2 logs $PM2_APP_NAME --lines 20 --nostream

echo ""
echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "1. Check PM2 logs: pm2 logs $PM2_APP_NAME"
echo "2. Monitor status: pm2 monit"
echo "3. View app status: pm2 status"
echo "4. Test website: curl http://localhost:3000"
echo ""
echo "🌐 Your site should be live at: http://mvp.sygn.live"
echo ""
