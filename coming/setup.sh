#!/bin/bash

# CoinDaily Coming Soon - Quick Setup Script
# This script sets up the coming soon landing page

echo "🚀 CoinDaily - Coming Soon Setup"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Set up environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your Resend API key"
else
    echo "✅ .env.local already exists"
fi

echo ""

# Set up database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to set up database"
    exit 1
fi

echo "✅ Database ready"
echo ""

# Summary
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Resend API key"
echo "2. Set your launch date in .env.local"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:3001"
echo ""
echo "Happy launching! 🎉"
