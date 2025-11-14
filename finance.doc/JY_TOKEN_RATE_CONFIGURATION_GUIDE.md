# 🔧 JOY TOKEN (JY) RATE CONFIGURATION - IMPLEMENTATION GUIDE

**For:** Super Admins & Backend Developers  
**Purpose:** Configure and manage JOY Token (JY) USD exchange rate  
**Database:** PlatformSettings model + CurrencyRateHistory model

---

## 📊 DATABASE SCHEMA

### PlatformSettings Model
```prisma
model PlatformSettings {
  id                    String   @id @default(cuid())
  
  // JOY Token (JY) Exchange Rate Configuration
  joyTokenUsdRate       Float    @default(1.0)  // Current value of 1 JY in USD
  joyTokenSymbol        String   @default("JY") // Token symbol
  joyTokenName          String   @default("JOY Token") // Full token name
  
  // Rate Management
  lastRateUpdate        DateTime @default(now())
  rateUpdatedBy         String?  // Super admin who updated
  rateUpdateReason      String?  // Reason for change
  previousRate          Float?   // Previous rate
  
  // CE Points Conversion
  cePointsToJyRate      Int      @default(100)  // CE Points = 1 JY
  cePointsEnabled       Boolean  @default(true)
  
  // Currency Settings
  defaultCurrency       String   @default("JY")
  supportedCurrencies   String   @default("JY,USD,EUR,KES,NGN,GHS,ZAR")
  
  // Platform Config
  platformName          String   @default("CoinDaily")
  platformUrl           String?
  maintenanceMode       Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### CurrencyRateHistory Model
```prisma
model CurrencyRateHistory {
  id                    String   @id @default(cuid())
  currency              String   // "JY"
  usdRate               Float    // Value in USD
  previousRate          Float?
  changePercentage      Float?
  updatedBy             String   // Admin user ID
  updateReason          String?
  notes                 String?
  marketCap             Float?
  volume24h             Float?
  effectiveFrom         DateTime @default(now())
  effectiveTo           DateTime? // When replaced
  createdAt             DateTime @default(now())
}
```

---

## 🚀 BACKEND SERVICE IMPLEMENTATION

### PlatformSettingsService.ts

#### Key Methods

**1. Get Current JY Rate (PUBLIC)**
```typescript
static async getJoyTokenRate(): Promise<GetJoyTokenRateResult>
```
Returns current JY/USD exchange rate. Anyone can call this.

**2. Update JY Rate (SUPER ADMIN ONLY)**
```typescript
static async updateJoyTokenRate(input: UpdateJoyTokenRateInput): Promise<UpdateJoyTokenRateResult>
```
Updates the JY/USD exchange rate. Creates history record.

**3. Get Rate History (SUPER ADMIN)**
```typescript
static async getJoyTokenRateHistory(adminUserId: string, limit: number): Promise<CurrencyRateHistory[]>
```
Retrieves historical rate changes with full audit trail.

**4. Convert Currency (PUBLIC)**
```typescript
static async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>
```
Converts between JY and USD using current rate.

**5. Convert CE Points (PUBLIC)**
```typescript
static async convertCEPointsToJY(cePoints: number): Promise<number>
```
Converts CE Points to JY tokens.

---

## 📡 GRAPHQL API

### Queries

**Get Current Rate**
```graphql
query GetJYRate {
  joyTokenRate {
    currentRate
    symbol
    name
    lastUpdate
    updatedBy
    cePointsRate
  }
}
```

**Get Platform Settings**
```graphql
query GetPlatformSettings {
  platformSettings {
    joyTokenUsdRate
    joyTokenSymbol
    joyTokenName
    lastRateUpdate
    rateUpdatedBy
    previousRate
    cePointsToJyRate
    supportedCurrencies
    maintenanceMode
  }
}
```

**Get Rate History**
```graphql
query GetRateHistory {
  joyTokenRateHistory(limit: 50) {
    id
    usdRate
    previousRate
    changePercentage
    updatedBy
    updatedByUser {
      displayName
    }
    updateReason
    notes
    effectiveFrom
    effectiveTo
  }
}
```

**Convert Currency**
```graphql
query ConvertUSDtoJY {
  convertCurrency(input: {
    amount: 100
    fromCurrency: "USD"
    toCurrency: "JY"
  }) {
    amount
    fromCurrency
    toCurrency
    convertedAmount
    rate
  }
}
```

### Mutations

**Update JY/USD Rate**
```graphql
mutation UpdateJYRate {
  updateJoyTokenRate(input: {
    newRate: 1.50
    reason: "Platform milestone - 100K users"
    notes: "Rewarding early adopters with increased token value"
  }) {
    success
    previousRate
    newRate
    changePercentage
    historyId
    message
    settings {
      joyTokenUsdRate
      lastRateUpdate
    }
  }
}
```

**Update CE Points Rate**
```graphql
mutation UpdateCERate {
  updateCEPointsRate(input: {
    newRate: 100
    reason: "Standard conversion rate"
  }) {
    success
    newRate
    message
  }
}
```

**Update Platform Config**
```graphql
mutation UpdatePlatformConfig {
  updatePlatformConfig(input: {
    platformName: "CoinDaily"
    platformUrl: "https://coindaily.com"
    maintenanceMode: false
    supportedCurrencies: ["JY", "USD", "EUR", "KES", "NGN"]
  }) {
    success
    settings {
      joyTokenUsdRate
      supportedCurrencies
      maintenanceMode
    }
  }
}
```

---

## 💻 FRONTEND INTEGRATION

### React Hook: useJoyTokenRate

```typescript
// hooks/useJoyTokenRate.ts
import { useQuery, useMutation } from '@apollo/client';
import { GET_JY_RATE, UPDATE_JY_RATE } from '../graphql/platformSettings';

export function useJoyTokenRate() {
  const { data, loading, refetch } = useQuery(GET_JY_RATE);
  
  const [updateRate, { loading: updating }] = useMutation(UPDATE_JY_RATE);
  
  const currentRate = data?.joyTokenRate?.currentRate || 1.0;
  
  const convertJYtoUSD = (jyAmount: number) => {
    return jyAmount * currentRate;
  };
  
  const convertUSDtoJY = (usdAmount: number) => {
    return usdAmount / currentRate;
  };
  
  const updateJYRate = async (newRate: number, reason: string, notes?: string) => {
    const result = await updateRate({
      variables: {
        input: { newRate, reason, notes }
      }
    });
    
    await refetch();
    return result;
  };
  
  return {
    currentRate,
    loading,
    updating,
    convertJYtoUSD,
    convertUSDtoJY,
    updateJYRate,
    refetch
  };
}
```

### Display Component
```typescript
// components/JYRateDisplay.tsx
import { useJoyTokenRate } from '../hooks/useJoyTokenRate';

export function JYRateDisplay({ jyAmount }: { jyAmount: number }) {
  const { currentRate, convertJYtoUSD } = useJoyTokenRate();
  const usdValue = convertJYtoUSD(jyAmount);
  
  return (
    <div>
      <span className="text-2xl font-bold">{jyAmount.toFixed(2)} JY</span>
      <span className="text-sm text-gray-500 ml-2">
        (${usdValue.toFixed(2)} USD at ${currentRate}/JY)
      </span>
    </div>
  );
}
```

### Super Admin Rate Management Panel
```typescript
// components/SuperAdmin/JYRateManager.tsx
import { useState } from 'react';
import { useJoyTokenRate } from '../../hooks/useJoyTokenRate';

export function JYRateManager() {
  const { currentRate, updateJYRate, loading } = useJoyTokenRate();
  const [newRate, setNewRate] = useState(currentRate);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async () => {
    try {
      const result = await updateJYRate(newRate, reason, notes);
      alert(result.data.updateJoyTokenRate.message);
    } catch (error) {
      alert('Error updating rate: ' + error.message);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">JY Token Rate Management</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Rate</p>
        <p className="text-3xl font-bold">${currentRate.toFixed(4)} USD</p>
        <p className="text-sm text-gray-500">1 JY = ${currentRate} USD</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">New Rate (USD)</label>
          <input
            type="number"
            step="0.01"
            value={newRate}
            onChange={(e) => setNewRate(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Reason *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Platform milestone achieved"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional context..."
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading || !reason}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update JY Rate'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🔄 USAGE IN FINANCE OPERATIONS

### FinanceService Integration

**Deposit Flow**
```typescript
// User deposits $100 USD via Stripe
const jyRate = await PlatformSettingsService.getJoyTokenRate();
const jyAmount = 100 / jyRate.currentRate; // e.g., 100 / 1.50 = 66.67 JY

await WalletService.updateBalance(walletId, jyAmount, 'ADD');
```

**Withdrawal Flow**
```typescript
// User withdraws 100 JY
const jyRate = await PlatformSettingsService.getJoyTokenRate();
const usdAmount = 100 * jyRate.currentRate; // e.g., 100 * 1.50 = $150 USD

await PaymentGateway.sendUSD(usdAmount, bankAccount);
```

**Payment Flow**
```typescript
// Premium subscription: 29.99 JY
const jyRate = await PlatformSettingsService.getJoyTokenRate();
const usdEquivalent = 29.99 * jyRate.currentRate; // Show user USD value

await FinanceService.processSubscriptionPayment({
  amount: 29.99,
  currency: 'JY',
  usdEquivalent: usdEquivalent // For display/accounting
});
```

---

## 📋 MIGRATION GUIDE

### Step 1: Run Prisma Migration
```bash
npx prisma migrate dev --name add_platform_settings
```

### Step 2: Initialize Default Settings
```typescript
// scripts/initializePlatformSettings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeSettings() {
  const existing = await prisma.platformSettings.findFirst();
  
  if (!existing) {
    await prisma.platformSettings.create({
      data: {
        joyTokenUsdRate: 1.0,
        joyTokenSymbol: 'JY',
        joyTokenName: 'JOY Token',
        cePointsToJyRate: 100,
        cePointsEnabled: true,
        defaultCurrency: 'JY',
        supportedCurrencies: 'JY,USD,EUR,KES,NGN,GHS,ZAR',
        platformName: 'CoinDaily',
        maintenanceMode: false
      }
    });
    
    console.log('✅ Platform settings initialized');
  } else {
    console.log('ℹ️ Platform settings already exist');
  }
}

initializeSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run: `npx ts-node scripts/initializePlatformSettings.ts`

### Step 3: Update Existing Wallets
```typescript
// All wallets should already use 'JY' currency
// If you have 'PLATFORM_TOKEN' or other values, update them:
await prisma.wallet.updateMany({
  where: { currency: { not: 'JY' } },
  data: { currency: 'JY' }
});
```

### Step 4: Update Frontend
- Add `useJoyTokenRate` hook to all payment pages
- Display USD equivalent using current rate
- Add rate display in user wallet/dashboard

---

## ✅ TESTING CHECKLIST

### Backend Tests
- [ ] PlatformSettingsService.getJoyTokenRate() returns correct rate
- [ ] PlatformSettingsService.updateJoyTokenRate() requires super admin
- [ ] Rate history is created on every update
- [ ] Previous history records are marked as expired
- [ ] Currency conversion works with custom rates
- [ ] CE Points conversion uses configured rate

### API Tests
- [ ] Query `joyTokenRate` returns current rate
- [ ] Query `platformSettings` requires authentication
- [ ] Mutation `updateJoyTokenRate` requires super admin
- [ ] Rate history query returns ordered results
- [ ] Currency conversion query works correctly

### Frontend Tests
- [ ] JY amounts display with USD equivalent
- [ ] Rate updates reflect immediately after mutation
- [ ] Super admin panel shows current rate
- [ ] Rate change form validates input
- [ ] History shows all rate changes

### Integration Tests
- [ ] Deposit converts USD→JY at current rate
- [ ] Withdrawal converts JY→USD at current rate
- [ ] Payments process with correct USD equivalent
- [ ] CE Points convert at configured rate
- [ ] Rate changes affect all new transactions

---

## 🚨 IMPORTANT NOTES

### Rate Change Impact
⚠️ **Existing balances are NOT automatically adjusted when rate changes**  
- Users keep their JY balance
- USD equivalent value changes based on new rate
- Example: User has 100 JY
  - Rate $1.00: Worth $100 USD
  - Rate increases to $1.50: Now worth $150 USD
  - Rate decreases to $0.75: Now worth $75 USD

### Security Considerations
- Only super admins can change rates
- All rate changes are logged with reason
- History is immutable (cannot delete)
- Rate changes are immediate (no scheduled changes yet)
- Consider adding rate change notifications to users

### Best Practices
1. **Gradual Changes:** Don't change rate by more than 25% at once
2. **Communication:** Announce rate changes in advance
3. **Monitoring:** Track rate impact on deposits/withdrawals
4. **History:** Review past changes before making new ones
5. **Testing:** Test rate changes in staging first

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
