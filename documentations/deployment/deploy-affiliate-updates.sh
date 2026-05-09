#!/bin/bash

echo "🚀 Deploying affiliate conversion tracking updates to Contabo..."

# Navigate to project directory
cd /var/www/token-landing/MVP/token-landing

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies (if any new ones)
echo "📦 Installing dependencies..."
npm install

# Regenerate Prisma Client
echo "🔄 Regenerating Prisma client..."
npx prisma generate

# Push database schema changes
echo "💾 Pushing database schema updates..."
npx prisma db push --accept-data-loss

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Restart PM2 process
echo "♻️ Restarting PM2 process..."
pm2 restart token-landing

# Show status
echo "✅ Deployment complete! Checking status..."
pm2 status

echo ""
echo "🎉 Affiliate conversion tracking deployed successfully!"
echo "New features:"
echo "  - Conversion tracking (referrals who purchased tokens)"
echo "  - Earnings display (5% commission in JY tokens)"
echo "  - Updated leaderboard with conversions and earnings"
echo "  - 5-card dashboard stats grid"
