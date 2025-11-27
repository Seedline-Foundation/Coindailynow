#!/bin/bash

# CoinDaily Initial Server Setup Script
# Run this script as root on a fresh Ubuntu 22.04 server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
   ____      _       ____        _ _       
  / ___|___ (_)_ __ |  _ \  __ _(_) |_   _ 
 | |   / _ \| | '_ \| | | |/ _` | | | | | |
 | |__| (_) | | | | | |_| | (_| | | | |_| |
  \____\___/|_|_| |_|____/ \__,_|_|_|\__, |
                                      |___/ 
  Server Setup Script for Contabo VPS
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

echo -e "${GREEN}Starting server setup...${NC}\n"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential tools
echo -e "${YELLOW}🔧 Installing essential tools...${NC}"
apt install -y curl wget git ufw vim htop build-essential

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
ufw status

# Create deployment user
echo -e "${YELLOW}👤 Creating deployment user...${NC}"
if id "coindaily" &>/dev/null; then
    echo "User 'coindaily' already exists"
else
    adduser --disabled-password --gecos "" coindaily
    usermod -aG sudo coindaily
    echo "coindaily ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
fi

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker coindaily
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

# Install Node.js 18.x
echo -e "${YELLOW}📗 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "Node.js installed successfully"
else
    echo "Node.js already installed"
fi

# Install Nginx
echo -e "${YELLOW}🌐 Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "Nginx installed successfully"
else
    echo "Nginx already installed"
fi

# Install Certbot
echo -e "${YELLOW}🔒 Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "Certbot installed successfully"
else
    echo "Certbot already installed"
fi

# Install PostgreSQL client (optional)
echo -e "${YELLOW}🗄️  Installing PostgreSQL client...${NC}"
apt install -y postgresql-client

# Install PM2 globally
echo -e "${YELLOW}⚙️  Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u coindaily --hp /home/coindaily
    echo "PM2 installed successfully"
else
    echo "PM2 already installed"
fi

# Install Fail2Ban
echo -e "${YELLOW}🛡️  Installing Fail2Ban...${NC}"
if ! command -v fail2ban-client &> /dev/null; then
    apt install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    echo "Fail2Ban installed successfully"
else
    echo "Fail2Ban already installed"
fi

# Create application directories
echo -e "${YELLOW}📁 Creating application directories...${NC}"
mkdir -p /home/coindaily/apps
mkdir -p /home/coindaily/backups
mkdir -p /home/coindaily/logs
chown -R coindaily:coindaily /home/coindaily

# Setup log rotation
echo -e "${YELLOW}📊 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/coindaily << 'EOF'
/home/coindaily/apps/Coindailynow/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 coindaily coindaily
    sharedscripts
    postrotate
        su - coindaily -c "pm2 reloadLogs"
    endscript
}
EOF

# Configure Fail2Ban for Nginx
echo -e "${YELLOW}🛡️  Configuring Fail2Ban...${NC}"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
sendername = Fail2Ban

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

systemctl restart fail2ban

# Setup automatic security updates
echo -e "${YELLOW}🔄 Setting up automatic security updates...${NC}"
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Display version information
echo -e "\n${GREEN}✅ Installation Complete!${NC}\n"
echo "================================================"
echo "Installed Software Versions:"
echo "================================================"
echo -e "OS: $(lsb_release -d | cut -f2)"
echo -e "Docker: $(docker --version)"
echo -e "Docker Compose: $(docker-compose --version)"
echo -e "Node.js: $(node --version)"
echo -e "NPM: $(npm --version)"
echo -e "Nginx: $(nginx -v 2>&1)"
echo -e "Certbot: $(certbot --version 2>&1 | head -n1)"
echo -e "PM2: $(pm2 --version)"
echo -e "PostgreSQL Client: $(psql --version)"
echo "================================================"

# Next steps
echo -e "\n${BLUE}📝 Next Steps:${NC}"
echo "1. Switch to coindaily user: su - coindaily"
echo "2. Setup SSH key authentication (recommended)"
echo "3. Clone your repository to /home/coindaily/apps"
echo "4. Configure DNS A record for mvp.coindaily.online"
echo "5. Follow CONTABO_DEPLOYMENT_GUIDE.md for application setup"
echo ""
echo -e "${GREEN}Server setup completed successfully!${NC}"
