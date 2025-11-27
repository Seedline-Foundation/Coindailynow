#!/bin/bash
# Deployment script for token.coindaily.online on Contabo
# Run this script ON THE CONTABO SERVER after uploading files

set -e

echo "🚀 Starting deployment for token.coindaily.online..."

# Variables
DOMAIN="token.coindaily.online"
APP_DIR="/var/www/token-landing"
NODE_VERSION="18"

# Step 1: Install Node.js if not installed
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

# Step 2: Install PM2 globally if not installed
echo "📦 Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

echo "✅ PM2 installed"

# Step 3: Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
cd $APP_DIR
npm install --production

# Step 5: Create .env file
echo "🔐 Setting up environment variables..."
if [ ! -f "$APP_DIR/.env.local" ]; then
    cat > $APP_DIR/.env.local << 'EOF'
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://token.coindaily.online
NEXT_PUBLIC_MAIN_SITE_URL=https://coindaily.online

# Resend API Configuration
RESEND_API_KEY=re_9ZZbMhkr_4Dy4dW6mbXY3tbvr29ZTuLas
RESEND_AUDIENCE_ID=ecadae8d-d87f-4bb7-9309-dc9fd61805ce

# Google Form for Whitelist
NEXT_PUBLIC_WHITELIST_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSf_-AfOpsv0717Q1j43zUbVN6uVMfDCErLK8rT2NvyQlxN7EQ/viewform

# Font Loading Configuration
NODE_FETCH_TIMEOUT=30000
EOF
    echo "✅ .env.local created"
else
    echo "⚠️  .env.local already exists, skipping..."
fi

# Step 6: Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 delete token-landing 2>/dev/null || true
pm2 start npm --name "token-landing" -- start -- -p 3001
pm2 save
pm2 startup systemd -u $USER --hp $HOME

echo "✅ Application started on port 3001"

# Step 7: Install Nginx if not installed
echo "📦 Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

echo "✅ Nginx installed"

# Step 8: Configure Nginx
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name token.coindaily.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx configured"

# Step 9: Install Certbot and get SSL
echo "🔒 Setting up SSL certificate..."
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

echo "📝 Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email niceface4life@gmail.com --redirect

echo "✅ SSL certificate installed"

# Step 10: Setup auto-renewal
echo "🔄 Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo "🌐 Your site is live at: https://$DOMAIN"
echo "📊 Check PM2 status: pm2 status"
echo "📋 View logs: pm2 logs token-landing"
echo "🔄 Restart app: pm2 restart token-landing"
echo "============================================"
