# 🎯 JY Token Rate System - Quick Reference

**Status:** ✅ Production Ready  
**Last Updated:** October 21, 2025

---

## 🚀 Quick Start

### For Super Admins

#### 1. View Current Rate
```graphql
query {
  joyTokenRate {
    rate          # Current JY/USD rate
    lastUpdated   # When it was last changed
    tokenSymbol   # "JY"
  }
}
```

#### 2. Update JY Token Rate
```graphql
mutation {
  updateJoyTokenRate(input: {
    newRate: 1.25
    reason: "Market adjustment based on trading volume"
    notes: "Optional additional context"
  }) {
    success
    message
    settings {
      joyTokenUsdRate
      lastRateUpdate
      rateUpdatedBy
    }
  }
}
```

#### 3. View Rate History
```graphql
query {
  joyTokenRateHistory(limit: 10) {
    id
    oldRate
    newRate
    changedAt: updatedAt
    updatedByUser {
      email
      role
    }
    reason
    notes
  }
}
```

#### 4. Update CE Points Rate
```graphql
mutation {
  updateCEPointsRate(input: {
    newRate: 100
    reason: "Standard conversion rate"
  }) {
    success
    message
  }
}
```

---

## 🌍 For Public Users

### Get Current JY Rate (No Auth Required)
```graphql
query {
  joyTokenRate {
    rate
    lastUpdated
    tokenSymbol
    tokenName
  }
}
```

### Convert Currency (No Auth Required)
```graphql
query {
  convertCurrency(
    amount: 100.00
    fromCurrency: "USD"
    toCurrency: "JY"
  ) {
    success
    convertedAmount  # Result in JY
    rate             # Exchange rate used
    fromCurrency
    toCurrency
  }
}
```

---

## 📊 Default Configuration

```yaml
JY Token Rate: $1.00 USD (default, can be changed by super admin)
CE Points Rate: 100 CE Points = 1 JY (default, can be changed)
Token Symbol: JY
Token Name: JOY Token
Default Currency: JY
Supported Currencies: JY, USD, EUR, KES, NGN, GHS, ZAR
Platform Name: CoinDaily
Maintenance Mode: OFF
```

---

## 🔒 Security & Permissions

### Public Operations (No Auth)
- ✅ `joyTokenRate` - Get current rate
- ✅ `convertCurrency` - Currency conversion

### Super Admin Only
- 🔐 `updateJoyTokenRate` - Update JY/USD rate
- 🔐 `updateCEPointsRate` - Update CE Points rate
- 🔐 `updatePlatformConfig` - Update general settings
- 🔐 `platformSettings` - View all settings
- 🔐 `joyTokenRateHistory` - View rate history

---

## 📈 GraphQL Schema Reference

### Types
```graphql
type JoyTokenRate {
  rate: Float!
  lastUpdated: String
  updatedBy: String
  tokenSymbol: String!
  tokenName: String!
}

type PlatformSettings {
  id: ID!
  joyTokenUsdRate: Float!
  cePointsToJyRate: Int!
  lastRateUpdate: String
  rateUpdatedBy: String
  rateUpdateReason: String
  tokenSymbol: String!
  tokenName: String!
  defaultCurrency: String!
  supportedCurrencies: [String!]!
  platformName: String!
  maintenanceMode: Boolean!
  createdAt: String!
  updatedAt: String!
}

type CurrencyRateHistory {
  id: ID!
  oldRate: Float!
  newRate: Float!
  updatedAt: String!
  updatedByUserId: String!
  updatedByUser: User
  reason: String
  notes: String
  isExpired: Boolean!
  expiresAt: String
}
```

### Inputs
```graphql
input UpdateJoyTokenRateInput {
  newRate: Float!        # Required: New USD value per JY
  reason: String         # Optional: Why rate is changing
  notes: String          # Optional: Additional context
}

input UpdateCEPointsRateInput {
  newRate: Int!          # Required: CE Points per 1 JY
  reason: String         # Optional: Why rate is changing
}

input UpdatePlatformConfigInput {
  tokenSymbol: String
  tokenName: String
  defaultCurrency: String
  supportedCurrencies: [String!]
  platformName: String
  maintenanceMode: Boolean
}
```

---

## 🛠️ Service Layer (Backend)

### Import
```typescript
import { PlatformSettingsService } from './services/PlatformSettingsService';
```

### Usage Examples

#### Get Current Rate
```typescript
const rate = await PlatformSettingsService.getJoyTokenRate();
console.log(`1 JY = $${rate.rate} USD`);
```

#### Update Rate (Super Admin Only)
```typescript
const result = await PlatformSettingsService.updateJoyTokenRate(
  1.25,                    // newRate
  'user-id-here',          // updatedByUserId
  'Market adjustment',     // reason
  'Optional notes'         // notes
);
```

#### Get Rate History
```typescript
const history = await PlatformSettingsService.getJoyTokenRateHistory(10);
history.forEach(record => {
  console.log(`${record.updatedAt}: ${record.oldRate} → ${record.newRate}`);
});
```

#### Convert Currency
```typescript
const result = await PlatformSettingsService.convertCurrency(
  100,    // amount
  'USD',  // fromCurrency
  'JY'    // toCurrency
);
console.log(`$100 USD = ${result.convertedAmount} JY`);
```

#### Convert CE Points to JY
```typescript
const jyAmount = await PlatformSettingsService.convertCEPointsToJY(1000);
console.log(`1000 CE Points = ${jyAmount} JY`);
```

---

## 📁 File Locations

### Database
- **Schema:** `backend/prisma/schema.prisma`
  - `model PlatformSettings` (line ~2800)
  - `model CurrencyRateHistory` (line ~2850)
- **Migration:** `backend/prisma/migrations/20251022023208_add_platform_settings/`

### Backend
- **Service:** `backend/src/services/PlatformSettingsService.ts`
- **GraphQL Schema:** `backend/src/graphql/schemas/platformSettings.ts`
- **GraphQL Resolvers:** `backend/src/graphql/resolvers/platformSettings.ts`
- **Init Script:** `backend/scripts/initializePlatformSettings.ts`

### Documentation
- `JOY_TOKEN_CURRENCY_SYSTEM.md` - Complete system overview
- `JY_TOKEN_RATE_CONFIGURATION_GUIDE.md` - Implementation guide
- `JY_TOKEN_IMPLEMENTATION_SUMMARY.md` - What was built
- `JY_TOKEN_SYSTEM_ARCHITECTURE.md` - Architecture diagrams
- `MIGRATION_ISSUE_RESOLVED.md` - Migration fix details

---

## 🎯 Common Use Cases

### 1. Daily Rate Update
```graphql
# Super admin updates rate based on market
mutation {
  updateJoyTokenRate(input: {
    newRate: 1.15
    reason: "Daily market adjustment"
  }) {
    success
    message
  }
}
```

### 2. Check Rate Before Transaction
```typescript
// In your transaction service
const currentRate = await PlatformSettingsService.getJoyTokenRate();
const usdAmount = jyAmount * currentRate.rate;
```

### 3. Display Rate to Users
```graphql
# Frontend query for user dashboard
query {
  joyTokenRate {
    rate
    lastUpdated
  }
}
```

### 4. Audit Rate Changes
```graphql
# Review all rate changes this month
query {
  joyTokenRateHistory(limit: 100) {
    oldRate
    newRate
    updatedAt
    reason
    updatedByUser {
      email
    }
  }
}
```

---

## ⚠️ Important Notes

### Rate Change Limits
- ✅ No hard limits enforced (super admin discretion)
- ✅ All changes logged for audit
- ✅ Cannot delete rate history (immutable)

### History Retention
- ✅ All history kept forever
- ✅ Records expire after 90 days (`isExpired` flag)
- ✅ Expired records still visible in history

### Authentication
- ✅ Public rate queries: No auth required
- ✅ Rate updates: Super admin only
- ✅ Validation via `PermissionService.requiresSuperAdmin()`

---

## 🐛 Troubleshooting

### "Permission denied" on rate update
**Problem:** Not authenticated as super admin  
**Solution:** Ensure user has `SUPER_ADMIN` role

### Rate not updating
**Problem:** Prisma Client out of sync  
**Solution:** Run `npx prisma generate`

### Old rate showing
**Problem:** Cache not cleared  
**Solution:** Rate updates are immediate (no caching on this endpoint)

---

## 📞 Support

For issues or questions:
1. Check `JY_TOKEN_RATE_CONFIGURATION_GUIDE.md`
2. Review `MIGRATION_ISSUE_RESOLVED.md`
3. Check GraphQL schema: `backend/src/graphql/schemas/platformSettings.ts`

---

**Quick Reference Version:** 1.0  
**Generated:** October 21, 2025  
**Status:** ✅ Production Ready
