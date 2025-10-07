# 🔧 Troubleshooting Guide
## CoinDaily Platform - Issue Resolution

**Version**: 1.0.0  
**Last Updated**: October 6, 2025

---

## 📋 Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Authentication Problems](#authentication-problems)
4. [Database Issues](#database-issues)
5. [Performance Problems](#performance-problems)
6. [Security Alerts](#security-alerts)
7. [Deployment Issues](#deployment-issues)
8. [Third-Party Service Issues](#third-party-service-issues)
9. [Emergency Procedures](#emergency-procedures)

---

## 🔍 Quick Diagnostics

### Health Check Commands

```bash
# Quick system health check
curl https://coindaily.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-06T12:00:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "ai": "ok"
  }
}

# Backend service status
cd /var/www/coindaily/backend
docker-compose ps

# Check logs
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend

# Database connection test
psql $DATABASE_URL -c "SELECT 1"

# Redis connection test
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```

### Log Locations

```bash
# Application logs
/var/www/coindaily/backend/logs/all.log
/var/www/coindaily/backend/logs/error.log
/var/www/coindaily/backend/logs/security.log

# System logs
/var/log/nginx/coindaily-access.log
/var/log/nginx/coindaily-error.log

# Docker logs
docker-compose logs -f
```

### Common Diagnostic Queries

```sql
-- Check recent errors
SELECT * FROM error_logs 
ORDER BY timestamp DESC 
LIMIT 20;

-- Check active sessions
SELECT COUNT(*) FROM sessions 
WHERE expires_at > NOW();

-- Check database size
SELECT pg_size_pretty(pg_database_size('coindaily'));

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## ❗ Common Issues

### Issue 1: "502 Bad Gateway" Error

**Symptoms**:
- Website shows 502 error
- API requests fail

**Possible Causes**:
1. Backend service is down
2. Nginx can't connect to backend
3. Backend crashed
4. Port conflict

**Diagnosis**:
```bash
# Check backend status
docker-compose ps backend

# Check if port is listening
netstat -tulpn | grep 4000

# Check backend logs
docker-compose logs backend --tail=50
```

**Solutions**:

**Solution 1: Restart Backend**
```bash
cd /var/www/coindaily
docker-compose restart backend

# Wait 30 seconds
sleep 30

# Test
curl http://localhost:4000/api/health
```

**Solution 2: Check Nginx Configuration**
```bash
# Test nginx config
sudo nginx -t

# Check upstream
sudo nano /etc/nginx/sites-available/coindaily.com
# Verify upstream backend_prod points to correct port

# Reload nginx
sudo systemctl reload nginx
```

**Solution 3: Check Port Conflicts**
```bash
# Find what's using port 4000
sudo lsof -i :4000

# Kill conflicting process if needed
sudo kill -9 <PID>

# Restart backend
docker-compose up -d backend
```

**Solution 4: Check Environment Variables**
```bash
cd /var/www/coindaily/backend

# Verify .env file exists
ls -la .env.production

# Check DATABASE_URL is set
grep DATABASE_URL .env.production
```

---

### Issue 2: "Database Connection Failed"

**Symptoms**:
- "Error connecting to database"
- Backend won't start
- Queries timing out

**Possible Causes**:
1. Neon database is down
2. Wrong connection string
3. SSL certificate issue
4. Connection pool exhausted
5. Network connectivity issue

**Diagnosis**:
```bash
# Test direct database connection
psql $DATABASE_URL -c "SELECT NOW()"

# Check connection string format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host/db?sslmode=require

# Test network connectivity
ping host.neon.tech

# Check connection pool
docker-compose logs backend | grep "connection pool"
```

**Solutions**:

**Solution 1: Verify Credentials**
```bash
# Check Neon dashboard for correct credentials
# Update .env file with correct DATABASE_URL

cd /var/www/coindaily/backend
nano .env.production

# Restart backend
docker-compose restart backend
```

**Solution 2: Fix SSL Mode**
```bash
# Ensure connection string has sslmode=require
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Or disable SSL verify (not recommended for production)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=no-verify"
```

**Solution 3: Increase Connection Pool**
```typescript
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Add connection pool settings
  connectionLimit = 20
}
```

```bash
# Regenerate Prisma client
npx prisma generate

# Restart
docker-compose restart backend
```

**Solution 4: Check Neon Database Status**
```bash
# Visit Neon dashboard: https://console.neon.tech
# Check if database is:
# - Active (not suspended)
# - Not in maintenance
# - Has available connections

# If suspended, resume in dashboard
```

---

### Issue 3: "Redis Connection Error"

**Symptoms**:
- Rate limiting not working
- Cache misses
- Session errors
- "ECONNREFUSED" in logs

**Possible Causes**:
1. Redis server is down
2. Wrong Redis credentials
3. Network issue
4. Redis out of memory

**Diagnosis**:
```bash
# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
# Expected: PONG

# Check Redis info
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD info

# Check memory usage
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD info memory
```

**Solutions**:

**Solution 1: Restart Redis**
```bash
# If self-hosted
sudo systemctl restart redis

# If using Docker
docker restart redis
```

**Solution 2: Clear Redis Memory**
```bash
# Check memory usage
redis-cli info memory

# Clear all data (use with caution!)
redis-cli FLUSHALL

# Or clear specific database
redis-cli -n 0 FLUSHDB
```

**Solution 3: Fix Configuration**
```bash
# backend/.env.production
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_TLS=true  # If using TLS

# Test new config
node -e "
const redis = require('redis');
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    tls: true
  },
  password: process.env.REDIS_PASSWORD
});
client.connect().then(() => {
  console.log('Connected!');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
"
```

---

### Issue 4: "High Memory Usage"

**Symptoms**:
- Server running out of memory
- Applications crashing with OOM
- Slow response times

**Possible Causes**:
1. Memory leak in application
2. Large dataset loaded into memory
3. Too many concurrent connections
4. Insufficient server resources

**Diagnosis**:
```bash
# Check memory usage
free -h

# Check Docker container memory
docker stats

# Check process memory
ps aux --sort=-%mem | head -10

# Check for memory leaks in Node.js
cd /var/www/coindaily/backend
node --expose-gc --inspect index.js
# Then use Chrome DevTools to profile
```

**Solutions**:

**Solution 1: Restart Services**
```bash
# Quick fix: restart containers
docker-compose restart

# Or restart individual service
docker-compose restart backend
```

**Solution 2: Increase Memory Limits**
```yaml
# docker-compose.yml
services:
  backend:
    mem_limit: 2g
    memswap_limit: 2g
```

```bash
# Apply changes
docker-compose up -d
```

**Solution 3: Enable Node.js Memory Optimization**
```bash
# Add to package.json scripts
"start": "node --max-old-space-size=2048 dist/index.js"

# Or in Dockerfile
CMD ["node", "--max-old-space-size=2048", "dist/index.js"]
```

**Solution 4: Clear Caches**
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Clear Node.js cache
rm -rf node_modules/.cache

# Clear Next.js cache
rm -rf frontend/.next/cache
```

**Solution 5: Optimize Queries**
```sql
-- Find queries using most memory
SELECT query, max_shared_memory
FROM pg_stat_statements
ORDER BY max_shared_memory DESC
LIMIT 10;

-- Add indexes if needed
CREATE INDEX idx_articles_published 
ON articles(published_at) 
WHERE status = 'PUBLISHED';
```

---

### Issue 5: "Slow API Response Times"

**Symptoms**:
- API responses > 2 seconds
- Timeout errors
- Poor user experience

**Possible Causes**:
1. Unoptimized database queries
2. Missing indexes
3. Cache not working
4. N+1 query problem
5. External API slowness

**Diagnosis**:
```bash
# Run performance benchmark
cd /var/www/coindaily/backend
npm run perf:api-benchmark

# Check slow queries
npm run perf:db-slow-queries

# Monitor real-time performance
docker-compose logs -f backend | grep "Response time"

# Check cache hit rate
redis-cli info stats | grep keyspace_hits
```

**Solutions**:

**Solution 1: Add Database Indexes**
```sql
-- Identify missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('articles', 'users', 'comments')
ORDER BY abs(correlation) DESC;

-- Add indexes
CREATE INDEX CONCURRENTLY idx_articles_category_published 
ON articles(category_id, published_at DESC) 
WHERE status = 'PUBLISHED';

CREATE INDEX CONCURRENTLY idx_comments_article 
ON comments(article_id, created_at DESC);
```

**Solution 2: Fix N+1 Queries**
```typescript
// ❌ BAD: N+1 query
const articles = await prisma.article.findMany();
for (const article of articles) {
  article.author = await prisma.user.findUnique({
    where: { id: article.authorId }
  });
}

// ✅ GOOD: Single query with include
const articles = await prisma.article.findMany({
  include: {
    author: true,
    category: true,
    tags: true
  }
});
```

**Solution 3: Implement Caching**
```typescript
// Add Redis caching to expensive queries
const cacheKey = `articles:featured`;
let articles = await redis.get(cacheKey);

if (!articles) {
  articles = await prisma.article.findMany({
    where: { featured: true },
    include: { author: true }
  });
  
  await redis.setex(
    cacheKey,
    3600,  // 1 hour
    JSON.stringify(articles)
  );
} else {
  articles = JSON.parse(articles);
}
```

**Solution 4: Optimize Prisma Queries**
```typescript
// Use select to limit fields
const articles = await prisma.article.findMany({
  select: {
    id: true,
    title: true,
    excerpt: true,
    coverImage: true,
    publishedAt: true,
    author: {
      select: {
        id: true,
        username: true,
        avatar: true
      }
    }
  }
});

// Use pagination
const articles = await prisma.article.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { publishedAt: 'desc' }
});
```

**Solution 5: Run Database Optimizer**
```bash
# Analyze and optimize database
npm run perf:db-optimize

# Vacuum database
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

---

## 🔐 Authentication Problems

### Issue: "Invalid Token" or "Token Expired"

**Symptoms**:
- Users logged out unexpectedly
- "Token expired" errors
- 401 Unauthorized responses

**Solutions**:

**Solution 1: Check JWT Secret**
```bash
# Verify JWT_SECRET is set correctly
echo $JWT_SECRET | wc -c
# Should be at least 32 characters

# If changed, users need to re-login
```

**Solution 2: Increase Token Expiry**
```bash
# backend/.env.production
JWT_EXPIRES_IN=15m  # Access token
REFRESH_TOKEN_EXPIRES_IN=7d  # Refresh token

# Restart backend
docker-compose restart backend
```

**Solution 3: Fix Token Verification**
```typescript
// Check token verification in middleware
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

---

### Issue: "Cannot Login" or "Invalid Credentials"

**Symptoms**:
- Correct password not working
- Login always fails

**Solutions**:

**Solution 1: Check Password Hash**
```typescript
// Test password comparison
const bcrypt = require('bcrypt');
const match = await bcrypt.compare(
  'user-input-password',
  user.passwordHash
);
console.log('Password match:', match);
```

**Solution 2: Check Account Status**
```sql
-- Check if user is suspended/banned
SELECT id, email, status, suspended_until
FROM users
WHERE email = 'user@example.com';
```

**Solution 3: Check Rate Limiting**
```bash
# Check if IP is blocked
redis-cli GET "blacklist:192.168.1.100"

# Remove from blacklist
redis-cli DEL "blacklist:192.168.1.100"
```

---

## 🗄️ Database Issues

### Issue: "Too Many Connections"

**Symptoms**:
- "sorry, too many clients already"
- Connection timeout errors

**Solutions**:

**Solution 1: Close Idle Connections**
```sql
-- View active connections
SELECT pid, usename, application_name, client_addr, state, query_start
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '1 hour';

-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '1 hour';
```

**Solution 2: Adjust Prisma Connection Pool**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Increase pool size
  connectionLimit = 20
}
```

---

### Issue: "Migration Failed"

**Symptoms**:
- Migration errors during deployment
- Database schema mismatch

**Solutions**:

**Solution 1: Check Migration Status**
```bash
cd /var/www/coindaily/backend
npx prisma migrate status

# If migrations are out of sync
npx prisma migrate resolve --applied <migration-name>
```

**Solution 2: Rollback Migration**
```bash
# Restore database backup
gunzip /var/backups/coindaily/db_backup_TIMESTAMP.sql.gz
psql $DATABASE_URL < /var/backups/coindaily/db_backup_TIMESTAMP.sql

# Revert to previous migration
npx prisma migrate resolve --rolled-back <migration-name>
```

**Solution 3: Force Migration**
```bash
# ⚠️ Use with caution! Can cause data loss
npx prisma migrate deploy --force
```

---

## 🚀 Performance Problems

### Issue: "High CPU Usage"

**Symptoms**:
- Server CPU at 100%
- Slow response times
- Applications freezing

**Solutions**:

**Solution 1: Identify CPU-Intensive Process**
```bash
# Check CPU usage
top -o %CPU

# Check Node.js CPU usage
node --prof index.js
node --prof-process isolate-*.log > processed.txt
```

**Solution 2: Optimize Code**
```typescript
// Use streaming for large datasets
const stream = prisma.article.findMany({
  where: { status: 'PUBLISHED' }
}).stream();

for await (const article of stream) {
  // Process one at a time
}

// Use worker threads for CPU-intensive tasks
const { Worker } = require('worker_threads');
const worker = new Worker('./heavy-task.js');
```

---

### Issue: "Disk Space Full"

**Symptoms**:
- "No space left on device"
- Cannot write logs
- Database write errors

**Solutions**:

**Solution 1: Check Disk Usage**
```bash
# Check disk space
df -h

# Find large files
du -sh /* | sort -hr | head -10

# Find large directories
du -sh /var/www/coindaily/* | sort -hr
```

**Solution 2: Clean Up**
```bash
# Clear old logs
find /var/log -name "*.log" -mtime +30 -delete
find /var/www/coindaily/backend/logs -name "*.log" -mtime +7 -delete

# Clear Docker cache
docker system prune -a -f

# Clear npm cache
npm cache clean --force

# Clear old backups
find /var/backups/coindaily -name "*.sql.gz" -mtime +30 -delete
```

---

## 🔒 Security Alerts

### Issue: "High Security Event Volume"

**Symptoms**:
- Spike in security events
- Multiple blocked IPs
- Alert notifications

**Solutions**:

**Solution 1: Investigate Pattern**
```bash
# Check Security Dashboard
# Look for:
# - Common source IPs
# - Specific endpoints targeted
# - Time patterns

# Query security events
curl https://coindaily.com/api/admin/security/events?severity=CRITICAL
```

**Solution 2: Block Attack Source**
```bash
# Block IP range in firewall
sudo ufw deny from 192.168.1.0/24

# Add to blacklist
curl -X POST https://coindaily.com/api/admin/security/blacklist \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "ipAddress": "192.168.1.100",
    "reason": "DDoS attack",
    "duration": 86400000
  }'
```

**Solution 3: Enable DDoS Protection**
```bash
# In Cloudflare:
# 1. Enable "Under Attack Mode"
# 2. Add rate limiting rules
# 3. Enable Bot Fight Mode

# In Nginx:
limit_req_zone $binary_remote_addr zone=ddos:10m rate=10r/s;
limit_req zone=ddos burst=20 nodelay;
```

---

### Issue: "Brute Force Login Attempts"

**Symptoms**:
- Multiple failed login attempts
- Same IP, different accounts

**Solutions**:

**Solution 1: Verify Rate Limiting**
```bash
# Check rate limit config
cat backend/.env.production | grep RATE_LIMIT

# Should have:
# LOGIN_RATE_LIMIT=5
# LOGIN_RATE_WINDOW=900000  # 15 minutes
```

**Solution 2: Block Attacker**
```bash
# Find attacking IP
SELECT ip_address, COUNT(*) as attempts
FROM security_events
WHERE event_type = 'FAILED_LOGIN_ATTEMPT'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY attempts DESC;

# Block IP
curl -X POST /api/admin/security/blacklist \
  -d '{"ipAddress": "ATTACKER_IP", "reason": "Brute force"}'
```

---

## 🚀 Deployment Issues

### Issue: "Deployment Failed"

**Symptoms**:
- Git pull fails
- Build errors
- Services won't start

**Solutions**:

**Solution 1: Check Git Repository**
```bash
cd /var/www/coindaily

# Check current branch
git branch

# Check for uncommitted changes
git status

# Pull latest changes
git fetch origin
git pull origin main

# If conflicts, stash changes
git stash
git pull
git stash pop
```

**Solution 2: Fix Build Errors**
```bash
# Clear caches
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf backend/dist
rm -rf frontend/.next

# Reinstall dependencies
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

# Rebuild
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

**Solution 3: Check Environment Variables**
```bash
# Verify all required env vars are set
cd backend
grep -v '^#' .env.production.example | cut -d= -f1 | while read var; do
  if [ -z "${!var}" ]; then
    echo "Missing: $var"
  fi
done
```

---

## 🌐 Third-Party Service Issues

### Issue: "Email Not Sending"

**Symptoms**:
- Password reset emails not received
- Notification emails not sent

**Solutions**:

**Solution 1: Test SMTP Connection**
```bash
# Test with telnet
telnet smtp.example.com 587

# Test with Node.js
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify((error, success) => {
  console.log(error || 'SMTP Ready');
});
"
```

**Solution 2: Check Email Logs**
```bash
# Check backend logs for email errors
grep "email" backend/logs/error.log

# Check SMTP response codes
# 250 = Success
# 421 = Service not available
# 550 = Mailbox unavailable
```

---

### Issue: "AI Services Not Responding"

**Symptoms**:
- Content generation fails
- AI features timeout

**Solutions**:

**Solution 1: Verify API Keys**
```bash
# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Google AI API
curl https://generativelanguage.googleapis.com/v1/models \
  -H "x-goog-api-key: $GOOGLE_AI_API_KEY"
```

**Solution 2: Check Rate Limits**
```bash
# OpenAI has rate limits
# Check dashboard: https://platform.openai.com/usage

# Implement retry with backoff
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(r => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};
```

---

## 🚨 Emergency Procedures

### Complete System Failure

**Steps**:

1. **Assess Scope**
   ```bash
   # Check all services
   curl https://coindaily.com/health
   docker-compose ps
   systemctl status nginx
   ```

2. **Enable Maintenance Mode**
   ```bash
   # Create maintenance page
   sudo nano /var/www/maintenance.html
   
   # Update Nginx to show maintenance page
   sudo nano /etc/nginx/sites-available/coindaily.com
   # Add: return 503;
   
   sudo systemctl reload nginx
   ```

3. **Notify Stakeholders**
   ```bash
   # Send alert to team
   # Update status page
   # Post on social media
   ```

4. **Rollback to Last Known Good State**
   ```bash
   # Switch to blue environment
   cd /var/www/coindaily
   ln -sfn blue current
   
   # Update Nginx
   sudo nano /etc/nginx/sites-available/coindaily.com
   # Change ports to blue environment
   
   sudo systemctl reload nginx
   ```

5. **Restore Database if Needed**
   ```bash
   gunzip /var/backups/coindaily/db_backup_latest.sql.gz
   psql $DATABASE_URL < /var/backups/coindaily/db_backup_latest.sql
   ```

6. **Verify System**
   ```bash
   curl https://coindaily.com/api/health
   # Test critical user flows
   ```

7. **Disable Maintenance Mode**
   ```bash
   sudo nano /etc/nginx/sites-available/coindaily.com
   # Remove: return 503;
   sudo systemctl reload nginx
   ```

8. **Post-Incident**
   - Document what happened
   - Root cause analysis
   - Implement preventive measures
   - Update runbooks

---

### Data Breach Response

**If you suspect a data breach:**

1. **Immediate Actions**
   ```bash
   # Block all suspicious IPs
   # Revoke all access tokens
   # Force password reset for affected users
   
   # Disable compromised services
   docker-compose stop <service>
   ```

2. **Investigate**
   ```bash
   # Review audit logs
   curl /api/admin/audit/logs?startDate=<incident-date>
   
   # Review security events
   curl /api/admin/security/events
   
   # Check for unauthorized access
   SELECT * FROM audit_logs
   WHERE action = 'UNAUTHORIZED_ACCESS'
   AND timestamp > '<incident-date>';
   ```

3. **Contain**
   ```bash
   # Change all secrets
   # Rotate API keys
   # Update passwords
   # Invalidate sessions
   ```

4. **Notify**
   - Legal team
   - Affected users
   - Regulatory bodies (if required)
   - Insurance provider

5. **Remediate**
   - Fix vulnerability
   - Deploy patches
   - Enhance monitoring
   - Update security policies

---

## 📞 Getting Help

### Support Channels

**Technical Issues**:
- Email: support@coindaily.com
- Slack: #tech-support
- Response time: 4 hours

**Critical Issues**:
- Phone: +1-XXX-XXX-XXXX
- Available: 24/7
- Response time: 30 minutes

**Documentation**:
- User Manual: `/docs/SUPER_ADMIN_USER_MANUAL.md`
- API Docs: `/docs/API_DOCUMENTATION.md`
- Deployment Guide: `/docs/DEPLOYMENT_GUIDE.md`

### When to Escalate

**Escalate immediately if**:
- Complete system outage
- Data breach suspected
- Security vulnerability discovered
- Financial impact > $10,000
- Unable to resolve within 1 hour

---

**End of Troubleshooting Guide**

**Version**: 1.0.0  
**Last Updated**: October 6, 2025
