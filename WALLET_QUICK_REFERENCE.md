# 🚀 Wallet System - Quick Reference

## Immediate Actions Required

### 1. Configure Environment Variables (5 minutes)
```bash
cp .env.example .env
# Edit .env and add:
# - YELLOWCARD_API_KEY
# - YELLOWCARD_WEBHOOK_SECRET
# - CHANGENOW_API_KEY
# - CHANGENOW_WEBHOOK_SECRET
```

### 2. Start Backend Server
```bash
cd backend
npm install  # if not done already
npm run dev  # or npm start
```

Server runs at: `http://localhost:3001`

### 3. Test the Integration

**Test Webhooks:**
```bash
# Edit test script first: update user_id and wallet_id
node backend/tests/wallet-webhook-test.js
```

**Test GraphQL:**
```bash
export TEST_AUTH_TOKEN="your_jwt_token_here"
node backend/tests/wallet-graphql-test.js
```

---

## API Endpoints

### REST (Webhooks)
- `POST /api/wallet/deposit/callback` - YellowCard deposits
- `POST /api/wallet/swap/callback` - ChangeNOW swaps

### GraphQL Queries
```graphql
getWhitelistedWallets              # Get user's whitelisted addresses
searchUsers(query, limit)          # Search users for transfers
getExchangeRate(from, to, amount)  # Get real-time rates
checkSwapStatus(walletId)          # Check swap completion
```

### GraphQL Mutations
```graphql
convertCEToJY(walletId, ceAmount)                    # CE → JY conversion
depositFromWallet(walletId, address, amount)         # Deposit from wallet
createTransfer(fromWalletId, toId, amount, type)     # Internal transfer
```

---

## Configuration Values

| Setting | Default | Description |
|---------|---------|-------------|
| `CE_TO_JY_CONVERSION_RATE` | 0.01 | 100 CE = 1 JY |
| `PLATFORM_TRANSFER_FEE` | 0.01 | 1% fee on transfers |
| YellowCard webhook | SHA-256 | African markets |
| ChangeNOW webhook | SHA-512 | International |

---

## Common Operations

### Convert CE Points to JY
```graphql
mutation {
  convertCEToJY(walletId: "abc123", ceAmount: 500) {
    success
    jyAmount
    transactionId
  }
}
```

### Send Transfer
```graphql
mutation {
  createTransfer(
    fromWalletId: "wallet_1"
    toIdentifier: "recipient_username"
    amount: 10.0
    transferType: USER
    note: "Birthday gift"
  ) {
    success
    txId
  }
}
```

### Get Exchange Rate
```graphql
query {
  getExchangeRate(
    fromCurrency: "JY"
    toCurrency: "USD"
    amount: 100
    provider: ChangeNOW
  ) {
    rate
    fee
  }
}
```

---

## Webhook Registration

### YellowCard Setup
1. Go to: https://dashboard.yellowcard.io
2. Settings → Webhooks → Add Webhook
3. URL: `https://yourdomain.com/api/wallet/deposit/callback`
4. Event: `transaction.completed`
5. Copy secret to `.env`

### ChangeNOW Setup
1. Go to: https://changenow.io/partner-dashboard
2. API Settings → Webhooks → Add Webhook
3. URL: `https://yourdomain.com/api/wallet/swap/callback`
4. Event: `exchange.finished`
5. Copy secret to `.env`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module walletCallbackRoutes" | Restart server |
| "GraphQL field not found" | Check schema integration, restart server |
| "Webhook signature failed" | Verify secret matches provider dashboard |
| "User not authenticated" | Add `Authorization: Bearer <token>` header |
| "Wallet not found" | Use actual wallet ID from database |

---

## Security Checklist

- [ ] Webhook secrets configured in `.env` (not hardcoded)
- [ ] HTTPS enabled for production webhook URLs
- [ ] JWT authentication on all GraphQL operations
- [ ] Rate limiting enabled on webhook endpoints
- [ ] Webhook signature verification active
- [ ] Audit logging enabled for all transactions

---

## File Locations

| Component | File Path |
|-----------|-----------|
| Webhook Routes | `backend/src/routes/walletCallbackRoutes.ts` |
| GraphQL Resolvers | `backend/src/graphql/resolvers/walletModalResolvers.ts` |
| Finance Service | `backend/src/services/FinanceService.ts` |
| Schema | `backend/src/api/schema.ts` |
| Resolver Integration | `backend/src/api/resolvers.ts` |
| Express Registration | `backend/src/index.ts` (line ~218) |

---

## Testing Credentials

**Development Test Values:**
```bash
# Use these in test scripts
user_id: "actual_user_id_from_db"
wallet_id: "actual_wallet_id_from_db"
test_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Get JWT Token:**
```bash
# Login via GraphQL
mutation {
  login(input: {
    email: "test@example.com"
    password: "password"
  }) {
    tokens {
      accessToken
    }
  }
}
```

---

## Next Development Tasks

- [ ] Implement withdrawal request system (48hr cooldown, Wed/Fri)
- [ ] Build admin withdrawal approval interface
- [ ] Integrate real exchange rate APIs (replace mocks)
- [ ] Add unit tests for FinanceService methods
- [ ] Set up webhook monitoring and alerts

---

**Status**: ✅ READY FOR TESTING  
**Last Updated**: October 30, 2025  
**Version**: 1.0.0
