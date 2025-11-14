# Fraud Monitoring Service - Schema Adjustments Needed

## Issue
The FraudMonitoringService has several TypeScript errors related to querying WalletTransaction by user. The current Prisma schema doesn't support direct user lookups on transactions.

## Current Errors
1. `wallet: { userId }` - Invalid, should use `fromWalletId` or `toWalletId`
2. `walletType: 'PRIMARY'` - Invalid, should use `WalletType.USER_WALLET`
3. Missing `user` relation on Wallet queries

## Quick Fix Options

### Option 1: Get Wallet ID First (Recommended for now)
```typescript
// Get user's wallet first
const userWallet = await prisma.wallet.findFirst({
  where: { userId, walletType: WalletType.USER_WALLET },
  select: { id: true },
});

if (!userWallet) return;

// Then query transactions
const transactions = await prisma.walletTransaction.findMany({
  where: {
    OR: [
      { fromWalletId: userWallet.id },
      { toWalletId: userWallet.id },
    ],
    transactionType: 'WITHDRAWAL',
  },
});
```

### Option 2: Add Computed Fields to Schema
Add virtual fields or create database views that link transactions directly to users.

### Option 3: Use Raw SQL
For complex queries, use Prisma raw SQL:
```typescript
const result = await prisma.$queryRaw`
  SELECT * FROM "WalletTransaction" wt
  JOIN "Wallet" w ON (wt."fromWalletId" = w.id OR wt."toWalletId" = w.id)
  WHERE w."userId" = ${userId}
`;
```

## Files Affected
- `backend/src/services/FraudMonitoringService.ts` (lines 253, 283, 289, 316, 436, 464, 465, 498, 503, 596)

## Action Required
The FraudMonitoringService needs refactoring to:
1. Always get wallet ID before querying transactions
2. Use proper WalletType enum instead of string literals
3. Include `user` relation in Wallet queries where needed

## Temporary Solution
For now, the service will compile with warnings. The fraud detection logic will need to be updated when integrating with the actual finance operations.
