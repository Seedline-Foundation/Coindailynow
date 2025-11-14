# Finance Frontend - Quick Reference Guide

## 🚀 Quick Start

### User Wallet Dashboard
Navigate to: `/wallet`

**Features:**
- View all balances (tokens, CE points, JOY tokens)
- Send/receive funds
- Stake tokens
- View transaction history
- Purchase subscriptions

### Admin Wallet Management
Navigate to: `/admin/wallet`

**Features:**
- Platform-wide wallet statistics
- Pending withdrawal management
- Transaction monitoring
- Quick access to admin tools

### Admin Airdrops
Navigate to: `/admin/wallet/airdrops`

**Features:**
- Create new airdrops
- Upload CSV with recipients
- Schedule distribution
- Monitor status

### Admin CE Points
Navigate to: `/admin/wallet/ce-points`

**Features:**
- Assign CE points to users
- Deduct CE points
- Bulk operations via CSV
- Transaction history

## 📦 Component Import Guide

```typescript
// User Components
import { 
  WalletDashboard,
  WalletBalance,
  TransactionHistory 
} from '@/components/wallet';

// Admin Components
import { 
  AdminWalletDashboard,
  AirdropManager,
  CEPointsManager 
} from '@/components/admin/wallet';

// OTP Verification
import { OTPVerificationModal } from '@/components/wallet';
```

## 🔌 API Client Usage

```typescript
import { financeApi, financeRestApi } from '@/services/financeApi';

// Query wallet
const wallet = await financeApi.getWallet(walletId);

// Get transactions
const transactions = await financeApi.getWalletTransactions(walletId, {
  limit: 50,
  status: 'COMPLETED'
});

// Transfer funds
const result = await financeApi.transferBetweenUsers({
  fromUserId,
  fromWalletId,
  toUserId,
  toWalletId,
  amount,
  currency
});

// Admin: Get overview
const overview = await financeRestApi.getAdminWalletOverview();

// Admin: Assign CE Points
await financeRestApi.assignCEPoints({
  userId,
  walletId,
  amount,
  operation: 'ASSIGN',
  reason: 'Reward for content creation'
});
```

## 🎨 Styling Guide

### Color System
- **Primary (Blue):** Transfers, default actions
- **Success (Green):** Deposits, confirmations, available balance
- **Danger (Red):** Withdrawals, errors, warnings
- **Warning (Yellow/Amber):** CE Points, pending states
- **Info (Purple):** Staking, special features
- **Secondary (Pink):** JOY Tokens, gifts

### Component Classes
```css
/* Balance Card */
.wallet-balance-card - Main balance display

/* Action Buttons */
.wallet-actions - Action button grid

/* Transaction List */
.transaction-history - Transaction list container

/* Admin Dashboard */
.admin-wallet-dashboard - Admin overview container
```

## 🔒 Security Implementation

### OTP Verification
```typescript
// 1. Request OTP
await financeRestApi.requestOTP('Withdrawal', transactionId);

// 2. Show OTP modal
<OTPVerificationModal
  isOpen={true}
  onVerify={handleOTPVerify}
  operation="Withdrawal"
  transactionId={transactionId}
  email={user.email}
/>

// 3. Verify OTP
const handleOTPVerify = async (otpCode: string) => {
  await financeRestApi.verifyOTP(otpCode, transactionId);
};
```

### Protected Operations
Operations requiring OTP:
- Withdrawals (all amounts)
- Transfers > $1000
- Stake/Unstake
- CE Points conversion
- Subscription purchases

## 📊 Transaction Types

### Icons & Colors

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| DEPOSIT | ↓ | Green | Incoming funds |
| WITHDRAWAL | ↑ | Red | Outgoing to external |
| TRANSFER | ⇄ | Blue | Between users |
| PAYMENT | 💳 | Purple | Subscription/product |
| STAKING | ⚡ | Amber | Token staking |
| CONVERSION | 🔄 | Indigo | CE to tokens |
| GIFT | 🎁 | Pink | Tips/donations |

## 🛠 Development Tips

### Add New Transaction Type
1. Update `TransactionType` enum in `types/finance.ts`
2. Add icon in `TransactionHistory.tsx` → `getTransactionIcon()`
3. Add GraphQL mutation in `financeApi.ts`
4. Update backend handler

### Add New Wallet Action
1. Create modal component in `components/wallet/modals/`
2. Add button in `WalletActions.tsx`
3. Implement API call in `financeApi.ts`
4. Add OTP verification if sensitive

### Customize Balance Display
Edit `WalletBalance.tsx`:
- Modify balance breakdown grid
- Add new currency displays
- Update color scheme

## 🐛 Debugging

### Common Issues

**Wallet not loading:**
```typescript
// Check user authentication
const { user } = useAuth();
console.log('User:', user);

// Check API response
const wallets = await financeApi.getUserWallets(userId);
console.log('Wallets:', wallets);
```

**OTP not received:**
- Verify email service configuration
- Check spam folder
- Confirm email in user profile
- Check OTP expiration (5 minutes)

**Transaction fails:**
- Verify sufficient balance
- Check wallet status (must be ACTIVE)
- Confirm OTP if required
- Review transaction limits

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  .wallet-actions { grid-cols: 2; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .wallet-actions { grid-cols: 3; }
}

/* Desktop */
@media (min-width: 1025px) {
  .wallet-actions { grid-cols: 5; }
}
```

## 🔔 Event Listeners

### Real-time Updates (Coming Soon)
```typescript
// WebSocket connection
const ws = new WebSocket('wss://api.coindaily.com/ws');

ws.on('transaction', (data) => {
  // Update transaction list
  setTransactions(prev => [data, ...prev]);
});

ws.on('balance_update', (data) => {
  // Update wallet balance
  setWallet(prev => ({ ...prev, ...data }));
});
```

## 📝 CSV Format Templates

### Airdrop Recipients
```csv
userId,walletId,amount
user-123,wallet-abc,100
user-456,wallet-def,150
user-789,wallet-ghi,200
```

### CE Points Bulk Operations
```csv
userId,walletId,amount,operation,reason
user-123,wallet-abc,50,ASSIGN,Content creation reward
user-456,wallet-def,25,DEDUCT,Policy violation penalty
```

## 🎯 Performance Optimization

### Lazy Loading
```typescript
import dynamic from 'next/dynamic';

const WalletDashboard = dynamic(() => 
  import('@/components/wallet').then(mod => mod.WalletDashboard),
  { loading: () => <LoadingSpinner /> }
);
```

### Memoization
```typescript
import { useMemo } from 'react';

const filteredTransactions = useMemo(() => {
  return transactions.filter(/* ... */);
}, [transactions, filters]);
```

## 🆘 Support

For issues or questions:
- Check documentation in `TASK_3_FINANCE_FRONTEND_COMPLETE.md`
- Review GraphQL schema in `backend/src/api/graphql/schemas/finance.graphql`
- Consult finance service in `backend/src/services/FinanceService.ts`

---

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
