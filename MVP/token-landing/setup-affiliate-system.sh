#!/bin/bash
# SETUP SCRIPT - Run this to fix all errors (Linux/Mac version)

echo "🚀 Setting up Affiliate System..."
echo ""

# Navigate to token-landing directory
cd "$(dirname "$0")"

echo "📦 Step 1: Installing required packages..."
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

echo ""
echo "✅ Packages installed!"
echo ""

echo "🔧 Step 2: Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client generated!"
echo ""

echo "📄 Step 3: Checking environment variables..."

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    # Check for required variables
    if grep -q "JWT_SECRET" ".env.local"; then
        echo "✅ JWT_SECRET found"
    else
        echo "⚠️  JWT_SECRET not found - Please add to .env.local"
        echo "   Add this line: JWT_SECRET=your-super-secret-jwt-key-min-32-characters"
    fi
    
    if grep -q "NEXT_PUBLIC_BASE_URL" ".env.local"; then
        echo "✅ NEXT_PUBLIC_BASE_URL found"
    else
        echo "⚠️  NEXT_PUBLIC_BASE_URL not found - Please add to .env.local"
        echo "   Add this line: NEXT_PUBLIC_BASE_URL=https://joytoken.io"
    fi
else
    echo "⚠️  .env.local file not found!"
    echo ""
    echo "Creating .env.local file..."
    
    cat > .env.local << 'EOF'
# JWT Secret for affiliate authentication (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters

# Base URL for affiliate links
NEXT_PUBLIC_BASE_URL=https://joytoken.io

# Database URL (if not already set)
# DATABASE_URL=your-database-url-here
EOF
    
    echo "✅ .env.local created! Please update with your actual values."
fi

echo ""
echo "🗄️  Step 4: Pushing database schema..."
echo "   Run manually: npx prisma db push"
echo ""

echo "✅ SETUP COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update JWT_SECRET in .env.local with a strong secret"
echo "   2. Update NEXT_PUBLIC_BASE_URL with your actual domain"
echo "   3. Run: npx prisma db push"
echo "   4. Add tracking to your homepage (see documentation)"
echo ""
echo "🎉 All errors should be fixed now!"
