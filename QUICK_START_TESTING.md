# 🚀 Quick Start Guide - Testing Wallet Backend

## Prerequisites Checklist

- [ ] Backend server is running (`npm run dev` in `backend/`)
- [ ] PostgreSQL database is accessible
- [ ] Redis server is running
- [ ] `.env` file configured with wallet secrets

## Step 1: Start the Server (if not running)

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
✅ Wallet callback routes registered (YellowCard & ChangeNOW webhooks)
Apollo GraphQL Server started successfully
Server running on port 3001
```

## Step 2: Verify Routes Are Registered

```bash
# Check if server is responding
curl http://localhost:3001/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...}
```

## Step 3: Test Webhook Callbacks

### Option A: Using Test Script

```bash
cd backend

# Test both webhooks
node test-webhooks.js both

# Or test individually
node test-webhooks.js deposit
node test-webhooks.js swap
```

**Expected Output**:
```
====================================
   Wallet Webhook Test Suite
====================================

📥 Testing YellowCard Deposit Callback...
✅ Deposit callback successful!

🔄 Testing ChangeNOW Swap Callback...
✅ Swap callback successful!

🔒 Testing Invalid Signature (should fail)...
✅ Invalid signature correctly rejected!

====================================
           Test Summary
====================================
✅ Passed: 3
❌ Failed: 0
📊 Total:  3
====================================
```

### Option B: Manual cURL Testing

**YellowCard Deposit:**
```bash
# Generate signature using Node.js
node -e "
const crypto = require('crypto');
const payload = {
  transaction_id: 'test_123',
  user_id: 'user_456',
  wallet_id: 'wallet_789',
  amount: '10.0',
  currency: 'JY',
  status: 'completed',
  tx_hash: '0xabc123'
};
const secret = process.env.YELLOWCARD_WEBHOOK_SECRET || 'test_secret';
const hmac = crypto.createHmac('sha256', secret);
hmac.update(JSON.stringify(payload));
console.log('Signature:', hmac.digest('hex'));
console.log('Payload:', JSON.stringify(payload));
"

# Then use the signature in curl
curl -X POST http://localhost:3001/api/wallet/deposit/callback \
  -H "Content-Type: application/json" \
  -H "x-yellowcard-signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "transaction_id": "test_123",
    "user_id": "user_456",
    "wallet_id": "wallet_789",
    "amount": "10.0",
    "currency": "JY",
    "status": "completed",
    "tx_hash": "0xabc123"
  }'
```

## Step 4: Test GraphQL Operations

### Get a JWT Token First

**Option A: Via GraphQL Playground**
1. Navigate to: http://localhost:3001/graphql
2. Run login mutation:
```graphql
mutation {
  login(input: {
    email: "test@example.com"
    password: "your_password"
  }) {
    tokens {
      accessToken
    }
    user {
      id
      username
    }
  }
}
```
3. Copy the `accessToken`

**Option B: Via cURL**
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"test@example.com\", password: \"password123\" }) { tokens { accessToken } } }"
  }'
```

### Run GraphQL Test Script

```bash
# Set your JWT token
export TEST_AUTH_TOKEN="your_access_token_here"

# Run all tests
node test-graphql-wallet.js
```

**Expected Output**:
```
====================================
   GraphQL Wallet Modal Tests
====================================

📋 Test 1: Get Whitelisted Wallets
✅ Success!

🔍 Test 2: Search Users
✅ Success!

💱 Test 3: Get Exchange Rate
✅ Success!

🔄 Test 4: Check Swap Status
✅ Success!

🔄 Test 5: Convert CE to JY
✅ Success!

💰 Test 6: Deposit from Wallet
✅ Success!

💸 Test 7: Create Transfer
✅ Success!

====================================
           Test Summary
====================================
✅ Passed: 7
❌ Failed: 0
📊 Total:  7
====================================
```

### Manual GraphQL Testing

Navigate to http://localhost:3001/graphql and add header:
```json
{
  "Authorization": "Bearer your_jwt_token_here"
}
```

**Test Query 1: Get Whitelisted Wallets**
```graphql
query {
  getWhitelistedWallets
}
```

**Test Query 2: Search Users**
```graphql
query {
  searchUsers(query: "john", limit: 5) {
    id
    username
    displayName
    avatar
    role
  }
}
```

**Test Query 3: Get Exchange Rate**
```graphql
query {
  getExchangeRate(
    fromCurrency: "JY"
    toCurrency: "USD"
    amount: 10
    provider: ChangeNOW
  ) {
    fromCurrency
    toCurrency
    rate
    fee
    estimatedTime
    provider
  }
}
```

**Test Mutation 1: Convert CE to JY**
```graphql
mutation {
  convertCEToJY(walletId: "your_wallet_id", ceAmount: 500) {
    success
    jyAmount
    transactionId
    error
  }
}
```

**Test Mutation 2: Create Transfer**
```graphql
mutation {
  createTransfer(
    fromWalletId: "your_wallet_id"
    toIdentifier: "recipient@example.com"
    amount: 5.0
    transferType: USER
    note: "Test transfer"
  ) {
    success
    txId
    error
  }
}
```

## Step 5: Verify Database Changes

```bash
# Connect to your database
psql $DATABASE_URL

# Check transactions
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 10;

# Check audit events
SELECT * FROM "AuditEvent" ORDER BY "createdAt" DESC LIMIT 10;

# Check wallet balances
SELECT id, "userId", "joyTokens", "cePoints", status FROM "Wallet";
```

## Troubleshooting

### Issue: "Cannot find module 'walletCallbackRoutes'"
**Solution**:
```bash
# Verify file exists
ls -la backend/src/routes/walletCallbackRoutes.ts

# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Rebuild if using compiled code
cd backend
npm run build
```

### Issue: "Webhook signature verification failed"
**Solution**:
1. Check `.env` has correct secrets:
```bash
echo $YELLOWCARD_WEBHOOK_SECRET
echo $CHANGENOW_WEBHOOK_SECRET
```
2. Ensure test script uses same secrets
3. Restart server after changing `.env`

### Issue: "GraphQL resolver not found"
**Solution**:
1. Verify import in `backend/src/api/resolvers.ts`:
```typescript
import { walletModalResolvers } from '../graphql/resolvers/walletModalResolvers';
```
2. Check file exists:
```bash
ls -la backend/src/graphql/resolvers/walletModalResolvers.ts
```
3. Restart server

### Issue: "Database connection error"
**Solution**:
```bash
# Test database connection
npx prisma db pull

# Run migrations
npx prisma migrate deploy

# Regenerate client
npx prisma generate
```

### Issue: "Redis connection error"
**Solution**:
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Or start Redis
redis-server

# Verify REDIS_URL in .env
echo $REDIS_URL
```

## Success Indicators

✅ **Server starts without errors**
✅ **Health endpoint responds**: `curl http://localhost:3001/health`
✅ **Webhook tests pass**: All 3 tests pass (deposit, swap, security)
✅ **GraphQL tests pass**: All 7 tests pass
✅ **Database has new transactions**: Check Transaction and AuditEvent tables
✅ **Redis notifications sent**: Check Redis logs for pub/sub messages

## Next Steps

Once all tests pass:

1. **Frontend Integration** - Update `frontend/src/services/financeApi.ts`
2. **Provider Setup** - Sign up for YellowCard and ChangeNOW accounts
3. **Webhook Registration** - Add your callback URLs to provider dashboards
4. **Real API Integration** - Replace mock exchange rates with real APIs
5. **Production Deployment** - Deploy to staging environment for testing

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Test webhooks
node backend/test-webhooks.js both

# Test GraphQL (set token first)
export TEST_AUTH_TOKEN="your_token"
node backend/test-graphql-wallet.js

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Transaction\";"

# Check Redis
redis-cli ping

# Restart everything
# Terminal 1: redis-server
# Terminal 2: cd backend && npm run dev
# Terminal 3: node backend/test-webhooks.js both
```

## Support

If tests fail:
1. Check server logs in terminal
2. Review `backend/logs/` directory
3. Verify all environment variables are set
4. Ensure database and Redis are running
5. Check file permissions on created files

---

**Estimated Testing Time**: 15-30 minutes
**Status**: Ready for Testing ✅
