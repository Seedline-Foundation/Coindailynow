# 🚀 CoinDaily Platform - Deployment Guide

**Version**: 1.0.0  
**Last Updated**: October 6, 2025  
**Environment**: Production & Staging

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Database Migration](#database-migration)
7. [Security Checklist](#security-checklist)
8. [Monitoring Setup](#monitoring-setup)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare CDN                          │
│                  (SSL, DDoS Protection)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Load Balancer                      │
│               (Reverse Proxy, Rate Limiting)                │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Frontend (Next.js)     │   │   Backend (Node.js)      │
│   Port: 3000             │   │   Port: 4000             │
│   Docker Container       │   │   Docker Container       │
└──────────────────────────┘   └──────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Neon PostgreSQL                        │
│                  (Primary Database)                         │
└─────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redis Cache                            │
│              (Session, Rate Limiting)                       │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Strategy

**Blue-Green Deployment**:
- Zero-downtime deployments
- Quick rollback capability
- Two identical environments (blue/green)
- Traffic switched after validation

**Environments**:
- **Development**: Local development machines
- **Staging**: Pre-production testing (staging.coindaily.com)
- **Production**: Live platform (coindaily.com)

---

## 📦 Prerequisites

### Required Tools

**Local Machine**:
- Node.js 18+ LTS
- npm 9+
- Git 2.40+
- Docker 24+
- Docker Compose 2.20+

**Server Requirements**:
- OS: Ubuntu 22.04 LTS (recommended)
- CPU: 4 cores minimum (8 cores for production)
- RAM: 8GB minimum (16GB for production)
- Storage: 100GB SSD minimum
- Network: Static IP with firewall configured

### Required Access

**Credentials needed**:
- [ ] GitHub repository access
- [ ] Neon PostgreSQL connection string
- [ ] Redis connection details
- [ ] Cloudflare API keys
- [ ] Backblaze B2 credentials
- [ ] SMTP server credentials
- [ ] SSL certificates
- [ ] Domain DNS access

### Required Services

**External services**:
- [ ] Neon PostgreSQL database
- [ ] Redis instance (managed or self-hosted)
- [ ] Cloudflare CDN account
- [ ] Backblaze B2 storage
- [ ] Email service (SMTP)
- [ ] SSL certificate (Let's Encrypt or commercial)

---

## 🔧 Environment Setup

### 1. Server Preparation

#### Update System

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

#### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

#### Configure Firewall

```bash
# Setup UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/coindaily
sudo chown $USER:$USER /var/www/coindaily

# Clone repository
cd /var/www/coindaily
git clone https://github.com/your-org/coindaily-platform.git .

# Checkout specific branch
git checkout main  # or staging branch
```

### 3. Environment Variables

#### Backend Environment

Create `backend/.env.production`:

```bash
# Application
NODE_ENV=production
PORT=4000
API_URL=https://api.coindaily.com

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host.neon.tech/coindaily?sslmode=require
DIRECT_URL=postgresql://user:password@host.neon.tech/coindaily?sslmode=require

# Redis
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# JWT & Security
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secure-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d
CSRF_SECRET=your-csrf-secret-key

# Session
SESSION_SECRET=your-session-secret-key

# CORS
CORS_ENABLED=true
ALLOWED_ORIGINS=https://coindaily.com,https://www.coindaily.com

# Rate Limiting
WHITELISTED_IPS=10.0.0.1,10.0.0.2

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@coindaily.com
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=noreply@coindaily.com
SMTP_FROM_NAME=CoinDaily Platform

# Storage (Backblaze B2)
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key
B2_BUCKET_NAME=coindaily-media
B2_BUCKET_ID=your-bucket-id

# AI Services
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Monitoring
LOG_LEVEL=info
ENABLE_LOGGING=true
```

**Security Note**: Never commit `.env` files to Git!

#### Frontend Environment

Create `frontend/.env.production`:

```bash
# API
NEXT_PUBLIC_API_URL=https://api.coindaily.com/v1
NEXT_PUBLIC_WS_URL=wss://api.coindaily.com

# Application
NEXT_PUBLIC_APP_URL=https://coindaily.com
NEXT_PUBLIC_APP_NAME=CoinDaily

# Features
NEXT_PUBLIC_ENABLE_COMMENTS=true
NEXT_PUBLIC_ENABLE_PREMIUM=true

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Cloudflare
NEXT_PUBLIC_CDN_URL=https://cdn.coindaily.com
```

### 4. Install Dependencies

```bash
# Backend dependencies
cd /var/www/coindaily/backend
npm ci --production

# Frontend dependencies
cd /var/www/coindaily/frontend
npm ci --production

# Build frontend
npm run build
```

---

## 🧪 Staging Deployment

### Purpose

Staging environment is used for:
- Testing new features before production
- QA validation
- Performance testing
- Security testing
- Client demos

### Staging Configuration

**URL**: `https://staging.coindaily.com`

**Database**: Separate staging database (not production!)

### Deployment Steps

#### 1. Prepare Staging Branch

```bash
# Checkout staging branch
git checkout staging

# Pull latest changes
git pull origin staging

# Verify commit
git log -1
```

#### 2. Database Migration

```bash
cd /var/www/coindaily/backend

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status

# Seed test data (staging only!)
npm run seed:staging
```

#### 3. Build Application

```bash
# Build backend
cd /var/www/coindaily/backend
npm run build

# Build frontend
cd /var/www/coindaily/frontend
npm run build
```

#### 4. Docker Deployment

Create `docker-compose.staging.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    env_file:
      - ./backend/.env.staging
    restart: unless-stopped
    networks:
      - coindaily-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.staging
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - coindaily-network

networks:
  coindaily-network:
    driver: bridge
```

**Deploy**:

```bash
# Build and start containers
docker-compose -f docker-compose.staging.yml up -d --build

# Check logs
docker-compose -f docker-compose.staging.yml logs -f

# Verify services
docker-compose -f docker-compose.staging.yml ps
```

#### 5. Nginx Configuration

Create `/etc/nginx/sites-available/staging.coindaily.com`:

```nginx
upstream backend_staging {
    server localhost:4000;
}

upstream frontend_staging {
    server localhost:3000;
}

server {
    listen 80;
    server_name staging.coindaily.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.coindaily.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/staging.coindaily.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.coindaily.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API routes
    location /api {
        proxy_pass http://backend_staging;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend_staging;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site**:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/staging.coindaily.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 6. SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d staging.coindaily.com

# Auto-renewal is configured automatically
# Verify with:
sudo certbot renew --dry-run
```

#### 7. Validation

```bash
# Health check
curl https://staging.coindaily.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-06T12:00:00Z"}

# Test API endpoint
curl https://staging.coindaily.com/api/articles?limit=5

# Test frontend
curl -I https://staging.coindaily.com
# Should return 200 OK
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

**Before deploying to production**:

- [ ] All staging tests passed
- [ ] Security audit completed (0 critical vulnerabilities)
- [ ] Performance benchmarks met (< 500ms API response)
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] SSL certificates valid (> 30 days)
- [ ] DNS records verified
- [ ] Load balancer configured
- [ ] Monitoring alerts configured

### Blue-Green Deployment

#### Overview

Blue-Green deployment allows zero-downtime deployments:
- **Blue**: Current production environment
- **Green**: New version being deployed
- **Switch**: Traffic routed from blue to green after validation

#### Setup

**Directory structure**:
```
/var/www/coindaily/
├── blue/          # Current production
├── green/         # New version
└── current -> blue  # Symlink to active version
```

#### Step 1: Prepare Green Environment

```bash
# Navigate to green directory
cd /var/www/coindaily/green

# Pull latest code
git fetch origin main
git checkout main
git pull origin main

# Install dependencies
cd backend && npm ci --production && cd ..
cd frontend && npm ci --production && cd ..

# Build applications
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

#### Step 2: Run Database Migrations

```bash
cd /var/www/coindaily/green/backend

# Backup database first!
npm run db:backup

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

#### Step 3: Start Green Environment

```bash
# Start green environment on different ports
cd /var/www/coindaily/green

# Use different docker-compose file
docker-compose -f docker-compose.green.yml up -d --build

# docker-compose.green.yml uses:
# Backend: port 4001
# Frontend: port 3001
```

#### Step 4: Validate Green Environment

```bash
# Health check
curl http://localhost:4001/api/health

# Run smoke tests
cd /var/www/coindaily/green/backend
npm run test:smoke

# Performance test
npm run test:performance

# Security scan
npm run security:test

# Check logs
docker-compose -f docker-compose.green.yml logs --tail=100
```

#### Step 5: Switch Traffic

**Update Nginx configuration**:

```bash
# Edit /etc/nginx/sites-available/coindaily.com
sudo nano /etc/nginx/sites-available/coindaily.com

# Change upstream ports from 4000/3000 to 4001/3001
upstream backend_prod {
    server localhost:4001;  # Changed from 4000
}

upstream frontend_prod {
    server localhost:3001;  # Changed from 3000
}

# Test configuration
sudo nginx -t

# Reload Nginx (zero-downtime)
sudo systemctl reload nginx
```

#### Step 6: Monitor Green Environment

```bash
# Monitor for 15-30 minutes
# Watch logs
docker-compose -f docker-compose.green.yml logs -f

# Monitor metrics
# - Response times
# - Error rates
# - CPU/Memory usage
# - Database connections

# Check error logs
tail -f /var/www/coindaily/green/backend/logs/error.log
```

#### Step 7: Update Symlink

```bash
# If green is stable, update symlink
cd /var/www/coindaily
sudo ln -sfn green current

# Blue becomes standby for quick rollback
```

#### Step 8: Stop Blue Environment

```bash
# After 24-48 hours of green running successfully
cd /var/www/coindaily/blue
docker-compose down

# Keep blue files for emergency rollback
```

### Production Nginx Configuration

Full production configuration:

```nginx
# /etc/nginx/sites-available/coindaily.com

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/15m;

# Upstreams
upstream backend_prod {
    server localhost:4001;
    keepalive 32;
}

upstream frontend_prod {
    server localhost:3001;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name coindaily.com www.coindaily.com;
    return 301 https://coindaily.com$request_uri;
}

# WWW to non-WWW redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.coindaily.com;

    ssl_certificate /etc/letsencrypt/live/coindaily.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coindaily.com/privkey.pem;

    return 301 https://coindaily.com$request_uri;
}

# Main production server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name coindaily.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/coindaily.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coindaily.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/coindaily-access.log;
    error_log /var/log/nginx/coindaily-error.log;

    # Max upload size
    client_max_body_size 10M;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # API routes
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend_prod;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login endpoint (stricter rate limit)
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;

        proxy_pass http://backend_prod;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend_prod;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (served by frontend)
    location /_next/static {
        proxy_pass http://frontend_prod;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend_prod/api/health;
        access_log off;
    }
}
```

### DNS Configuration

**Configure DNS records**:

```
A Record:
  Name: @
  Value: YOUR_SERVER_IP
  TTL: 300

A Record:
  Name: www
  Value: YOUR_SERVER_IP
  TTL: 300

CNAME Record:
  Name: api
  Value: coindaily.com
  TTL: 300

CNAME Record:
  Name: staging
  Value: coindaily.com
  TTL: 300
```

---

## 🗄️ Database Migration

### Migration Process

#### 1. Backup Database

**Automated backup**:

```bash
# Create backup script
cat > /var/www/coindaily/scripts/backup-db.sh << 'EOF'
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/coindaily"
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to Backblaze B2
b2 upload-file coindaily-backups $BACKUP_FILE.gz db_backup_$TIMESTAMP.sql.gz

# Keep only last 30 days locally
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x /var/www/coindaily/scripts/backup-db.sh
```

**Schedule daily backups** (crontab):

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/coindaily/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

#### 2. Run Migrations

```bash
cd /var/www/coindaily/backend

# Check migration status
npx prisma migrate status

# Run pending migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

#### 3. Seed Production Data (Initial deployment only)

```bash
# Seed essential data
npm run seed:production

# This includes:
# - Admin user
# - Default categories
# - System settings
```

### Rollback Migration

If migration fails:

```bash
# Restore from backup
gunzip /var/backups/coindaily/db_backup_TIMESTAMP.sql.gz
psql $DATABASE_URL < /var/backups/coindaily/db_backup_TIMESTAMP.sql

# Revert code
git checkout <previous-commit>

# Restart services
docker-compose restart
```

---

## 🔒 Security Checklist

### Pre-Deployment Security

**Verify these before going live**:

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enforced (no HTTP access)
- [ ] SSL certificate valid and auto-renewing
- [ ] Firewall configured (only ports 80, 443, 22)
- [ ] SSH key-based authentication (password login disabled)
- [ ] 2FA enabled for all admin accounts
- [ ] Database uses SSL/TLS connection
- [ ] Redis requires authentication
- [ ] CORS configured with allowed origins
- [ ] Rate limiting active on all endpoints
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using Prisma ORM)
- [ ] XSS prevention (HTML sanitization)
- [ ] Dependency vulnerabilities patched (`npm audit`)
- [ ] Security penetration tests passed
- [ ] Logs properly configured (no sensitive data)
- [ ] Error messages don't expose system details
- [ ] File upload restrictions enforced
- [ ] Session security configured (HttpOnly, Secure cookies)

### Post-Deployment Security

**Monitor after deployment**:

- [ ] Security events dashboard active
- [ ] Failed login attempts monitored
- [ ] Rate limit violations tracked
- [ ] Unusual traffic patterns detected
- [ ] SSL certificate expiry monitored (> 30 days warning)
- [ ] Database connection monitoring
- [ ] Backup verification (restore test)
- [ ] Security logs reviewed daily

---

## 📊 Monitoring Setup

### Application Monitoring

#### Logging

**Backend logs** (`backend/logs/`):
- `all.log` - All application logs
- `error.log` - Errors only
- `security.log` - Security events
- `performance.log` - Performance metrics

**Log rotation** (`/etc/logrotate.d/coindaily`):

```
/var/www/coindaily/*/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 www-data www-data
}
```

#### Performance Metrics

**Key metrics to monitor**:
- API response time (< 500ms target)
- Database query time
- Cache hit rate (> 75% target)
- Error rate (< 0.1% target)
- Request throughput
- CPU usage (< 70% average)
- Memory usage (< 80%)
- Disk I/O

**Monitoring tools**:
- PM2 for process monitoring
- Prometheus for metrics collection
- Grafana for visualization

### Uptime Monitoring

**External monitoring**:
- UptimeRobot or Pingdom
- Check every 5 minutes
- Alert on downtime > 2 minutes
- Monitor from multiple locations

**Health check endpoints**:
```
https://coindaily.com/api/health
https://coindaily.com/health
```

### Alert Configuration

**Alert thresholds**:
- Response time > 1000ms (warning)
- Response time > 2000ms (critical)
- Error rate > 1% (warning)
- Error rate > 5% (critical)
- CPU > 80% for 5 minutes (warning)
- Memory > 90% (critical)
- Disk space < 10GB (warning)
- Disk space < 5GB (critical)

**Notification channels**:
- Email: admin@coindaily.com
- SMS: Critical alerts only
- Slack: #alerts channel

---

## ⏮️ Rollback Procedures

### When to Rollback

**Immediate rollback if**:
- Critical bugs affecting users
- Data corruption detected
- Security vulnerability exposed
- System instability (crashes, timeouts)
- Performance degradation > 50%

### Quick Rollback (Blue-Green)

```bash
# 1. Switch Nginx back to blue
sudo nano /etc/nginx/sites-available/coindaily.com
# Change ports from 4001/3001 to 4000/3000

# 2. Test configuration
sudo nginx -t

# 3. Reload Nginx
sudo systemctl reload nginx

# 4. Verify old version is serving traffic
curl https://coindaily.com/api/health

# 5. Stop green environment
cd /var/www/coindaily/green
docker-compose down

# Total time: < 2 minutes
```

### Database Rollback

```bash
# 1. Stop applications
docker-compose down

# 2. Restore database backup
gunzip /var/backups/coindaily/db_backup_TIMESTAMP.sql.gz
psql $DATABASE_URL < /var/backups/coindaily/db_backup_TIMESTAMP.sql

# 3. Revert code
git checkout <previous-stable-commit>

# 4. Restart applications
docker-compose up -d

# 5. Verify health
curl https://coindaily.com/api/health
```

### Post-Rollback

**After rollback**:
1. Notify team of rollback
2. Document reason for rollback
3. Create incident report
4. Identify root cause
5. Fix issues in staging
6. Retest thoroughly
7. Schedule new deployment

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: 502 Bad Gateway

**Cause**: Backend service not running

**Solution**:
```bash
# Check backend status
docker-compose ps

# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

#### Issue: Database Connection Failed

**Cause**: Database unavailable or credentials wrong

**Solution**:
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check environment variables
echo $DATABASE_URL

# Verify Neon database status (in dashboard)

# Restart with new credentials if needed
docker-compose down
docker-compose up -d
```

#### Issue: High Memory Usage

**Cause**: Memory leak or insufficient resources

**Solution**:
```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart

# If persists, increase server resources
# or optimize application code
```

#### Issue: Slow API Response

**Cause**: Database queries, cache miss, or high load

**Solution**:
```bash
# Check slow queries
npm run perf:db-slow-queries

# Clear cache
redis-cli FLUSHDB

# Run database optimizer
npm run perf:db-optimize

# Check server load
htop

# Scale horizontally if needed
```

---

## 📞 Support

### Deployment Support

**Technical Issues**:
- Email: devops@coindaily.com
- Slack: #deployments
- Phone: +1-XXX-XXX-XXXX (emergency)

### Incident Response

**Critical incidents**:
1. Alert on-call engineer
2. Start incident channel (#incident-YYYY-MM-DD)
3. Begin incident log
4. Implement fix or rollback
5. Post-mortem after resolution

---

## ✅ Deployment Checklist

### Before Deployment

- [ ] Code merged to main branch
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit passed (0 critical vulnerabilities)
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup created
- [ ] Team notified
- [ ] Rollback plan prepared

### During Deployment

- [ ] Start deployment window
- [ ] Deploy to staging first
- [ ] Validate staging deployment
- [ ] Deploy to production (green environment)
- [ ] Run smoke tests
- [ ] Monitor metrics for 15-30 minutes
- [ ] Switch traffic to green
- [ ] Monitor for issues

### After Deployment

- [ ] Verify all services healthy
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Test critical user flows
- [ ] Update deployment log
- [ ] Notify team of completion
- [ ] Monitor for 24-48 hours
- [ ] Close deployment window

---

**End of Deployment Guide**

**Version**: 1.0.0  
**Last Updated**: October 6, 2025  
**Next Review**: January 6, 2026
