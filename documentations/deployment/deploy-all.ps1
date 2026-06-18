# CoinDaily Platform - Full Deployment Script
# Deploys all systems to Contabo server at 167.86.99.97

$SERVER = "167.86.99.97"
$SSH_USER = "root"
$WEB_DIR = "/var/www"
$LOCAL_DIR = "c:\Users\user\Desktop\news-platform"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CoinDaily Platform Full Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create directory structure on server
Write-Host "[1/8] Creating directory structure on server..." -ForegroundColor Yellow
$dirStructure = @"
mkdir -p $WEB_DIR/sygn.live/{frontend,backend,shared}
mkdir -p $WEB_DIR/jet.sygn.live/{admin-frontend,contracts}
mkdir -p $WEB_DIR/pr.sygn.live/frontend
mkdir -p $WEB_DIR/ai.sygn.live
mkdir -p $WEB_DIR/backend.sygn.live
mkdir -p /var/log/coindaily
mkdir -p /opt/coindaily/{backups,configs,scripts}
chown -R www-data:www-data $WEB_DIR
"@
ssh ${SSH_USER}@${SERVER} $dirStructure
Write-Host "  ✓ Directories created" -ForegroundColor Green

# Step 2: Upload Backend
Write-Host "[2/8] Uploading Backend..." -ForegroundColor Yellow
scp -r "$LOCAL_DIR\backend\dist" "${SSH_USER}@${SERVER}:$WEB_DIR/backend.sygn.live/"
scp -r "$LOCAL_DIR\backend\node_modules" "${SSH_USER}@${SERVER}:$WEB_DIR/backend.sygn.live/"
scp "$LOCAL_DIR\backend\package.json" "${SSH_USER}@${SERVER}:$WEB_DIR/backend.sygn.live/"
scp -r "$LOCAL_DIR\backend\prisma" "${SSH_USER}@${SERVER}:$WEB_DIR/backend.sygn.live/"
Write-Host "  ✓ Backend uploaded" -ForegroundColor Green

# Step 3: Upload Main Frontend (News)
Write-Host "[3/8] Uploading News Frontend..." -ForegroundColor Yellow
scp -r "$LOCAL_DIR\frontend\.next" "${SSH_USER}@${SERVER}:$WEB_DIR/sygn.live/frontend/"
scp -r "$LOCAL_DIR\frontend\public" "${SSH_USER}@${SERVER}:$WEB_DIR/sygn.live/frontend/"
scp -r "$LOCAL_DIR\frontend\node_modules" "${SSH_USER}@${SERVER}:$WEB_DIR/sygn.live/frontend/"
scp "$LOCAL_DIR\frontend\package.json" "${SSH_USER}@${SERVER}:$WEB_DIR/sygn.live/frontend/"
scp "$LOCAL_DIR\frontend\next.config.js" "${SSH_USER}@${SERVER}:$WEB_DIR/sygn.live/frontend/"
Write-Host "  ✓ News Frontend uploaded" -ForegroundColor Green

# Step 4: Upload AI System
Write-Host "[4/8] Uploading AI System..." -ForegroundColor Yellow
scp -r "$LOCAL_DIR\ai-system\*" "${SSH_USER}@${SERVER}:$WEB_DIR/ai.sygn.live/"
Write-Host "  ✓ AI System uploaded" -ForegroundColor Green

# Step 5: Upload Smart Contracts
Write-Host "[5/8] Uploading Smart Contracts..." -ForegroundColor Yellow
scp -r "$LOCAL_DIR\contracts\*" "${SSH_USER}@${SERVER}:$WEB_DIR/jet.sygn.live/contracts/"
Write-Host "  ✓ Smart Contracts uploaded" -ForegroundColor Green

# Step 6: Upload Nginx Configs
Write-Host "[6/8] Uploading Nginx configurations..." -ForegroundColor Yellow
scp "$LOCAL_DIR\infrastructure\nginx\*.conf" "${SSH_USER}@${SERVER}:/etc/nginx/sites-available/"
Write-Host "  ✓ Nginx configs uploaded" -ForegroundColor Green

# Step 7: Configure server
Write-Host "[7/8] Configuring server..." -ForegroundColor Yellow
$configScript = @"
# Enable nginx sites
ln -sf /etc/nginx/sites-available/sygn.live.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/backend.sygn.live.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/jet.sygn.live.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/pr.sygn.live.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ai.sygn.live.conf /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Set permissions
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR

# Create .env for backend
cat > $WEB_DIR/backend.sygn.live/.env << 'ENVEOF'
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://auakxtwvqqefysprkczv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWt4dHd2cXFlZnlzcHJrY3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NzQyNjQsImV4cCI6MjA4NDI1MDI2NH0.Hyi7nwQb6cbKlFIFrRR2XGNlwtpKSf0GwiXC2ZQTMqY
JWT_SECRET=prod_jwt_secret_change_this_immediately_$(openssl rand -hex 32)
REDIS_URL=redis://localhost:6379
NLLB_API_URL=http://localhost:8080
OLLAMA_API_URL=http://localhost:11434
EMBEDDINGS_API_URL=http://localhost:8081
FRONTEND_URL=https://sygn.live
ENVEOF

# Create .env for frontend
cat > $WEB_DIR/sygn.live/frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=https://backend.sygn.live
NEXT_PUBLIC_SITE_URL=https://sygn.live
NODE_ENV=production
ENVEOF
"@
ssh ${SSH_USER}@${SERVER} $configScript
Write-Host "  ✓ Server configured" -ForegroundColor Green

# Step 8: Start services
Write-Host "[8/8] Starting services with PM2..." -ForegroundColor Yellow
$startScript = @"
cd $WEB_DIR/backend.sygn.live
pm2 delete coindaily-backend 2>/dev/null || true
pm2 start dist/backend/src/index.js --name coindaily-backend -i 2

cd $WEB_DIR/sygn.live/frontend
pm2 delete coindaily-frontend 2>/dev/null || true
pm2 start npm --name coindaily-frontend -- start

pm2 save
pm2 startup

# Reload nginx
systemctl reload nginx

# Show status
pm2 status
"@
ssh ${SSH_USER}@${SERVER} $startScript
Write-Host "  ✓ Services started" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Main Site:     https://sygn.live" -ForegroundColor White
Write-Host "  Backend API:   https://backend.sygn.live" -ForegroundColor White
Write-Host "  Super Admin:   https://jet.sygn.live/admin" -ForegroundColor White
Write-Host "  PR System:     https://pr.sygn.live" -ForegroundColor White
Write-Host "  AI Services:   https://ai.sygn.live" -ForegroundColor White
Write-Host "  Token Landing: https://token.sygn.live" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Add your IPs to jet.sygn.live.conf whitelist" -ForegroundColor White
Write-Host "  2. Get SSL certificates: certbot --nginx -d jet.sygn.live" -ForegroundColor White
Write-Host "  3. Update DNS records in Namecheap" -ForegroundColor White
