#!/bin/bash

# Fix Prisma Client and Next.js Build on Server
# Run this script on your Contabo server

echo "🔧 Fixing Prisma Client and Build Issues..."
echo ""

# Step 1: Clean all caches and generated files
echo "📦 Cleaning caches and generated files..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf .next
rm -rf .turbo

# Step 2: Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate --schema=./MVP/token-landing/prisma/schema.prisma

# Step 3: Verify Prisma Client was generated
echo "✓ Checking Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "✓ Prisma Client generated successfully"
else
    echo "❌ ERROR: Prisma Client not found!"
    exit 1
fi

# Step 4: Push schema to database (if needed)
echo "📊 Pushing schema to database..."
npx prisma db push --schema=./MVP/token-landing/prisma/schema.prisma --accept-data-loss

# Step 5: Build Next.js
echo "🏗️ Building Next.js application..."
npm run build

# Step 6: Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart token-landing

echo ""
echo "✅ All done! Check the build output above for any errors."
echo "📋 View logs with: pm2 logs token-landing"
