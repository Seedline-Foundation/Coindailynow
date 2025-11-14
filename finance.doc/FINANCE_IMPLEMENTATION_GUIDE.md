# 🚀 Finance Operations Implementation Guide

**Quick Start Guide for Developers**  
**Date:** October 21, 2025

---

## 📋 TABLE OF CONTENTS

1. [Quick Setup](#quick-setup)
2. [Using Wallet Management](#using-wallet-management)
3. [Using Payment Gateways](#using-payment-gateways)
4. [Using Advanced Operations](#using-advanced-operations)
5. [Testing Examples](#testing-examples)
6. [Common Patterns](#common-patterns)
7. [Error Handling](#error-handling)
8. [Troubleshooting](#troubleshooting)

---

## 🏁 QUICK SETUP

### 1. Add Prisma Models

```bash
# Copy the new models to your schema.prisma
cat prisma-schema-additions.prisma >> prisma/schema.prisma

# Run migration
npx prisma migrate dev --name add_finance_operations

# Generate Prisma Client
npx prisma generate
```

### 2. Environment Variables

```env
# Add to .env file
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
FRONTEND_URL=https://coindaily.com
```

### 3. Import FinanceService

```typescript
import { FinanceService } from './services/FinanceService';
```

---

## 💼 USING WALLET MANAGEMENT

### Create User Wallet

```typescript
// Basic wallet creation
const result = await FinanceService.walletCreate({
  userId: 'user123',
  walletType: WalletType.USER_WALLET,
  currency: 'PLATFORM_TOKEN',
  dailyWithdrawalLimit: 10000,
  transactionLimit: 5000,
  metadata: { source: 'registration' }
});

if (result.success) {
  console.log('Wallet created:', result.walletId);
  console.log('Wallet address:', result.walletAddress);
}
```

### View Wallet Balance

```typescript
const balance = await FinanceService.walletViewBalance({
  userId: 'user123',
  walletId: 'wallet-id-here'
});

if (balance.success) {
  console.log('Available:', balance.balance.available);
  console.log('Locked:', balance.balance.locked);
  console.log('Staked:', balance.balance.staked);
  console.log('Total:', balance.balance.total);
  console.log('CE Points:', balance.balance.cePoints);
  console.log('JOY Tokens:', balance.balance.joyTokens);
}
```

### View Transaction History

```typescript
const history = await FinanceService.walletViewHistory({
  userId: 'user123',
  walletId: 'wallet-id-here',
  limit: 20,
  offset: 0,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  transactionType: TransactionType.DEPOSIT
});

if (history.success) {
  console.log('Total transactions:', history.pagination.total);
  history.transactions.forEach(tx => {
    console.log(`${tx.type}: ${tx.amount} ${tx.currency}`);
  });
}
```

### Set Wallet Limits

```typescript
const limits = await FinanceService.walletSetLimits({
  userId: 'user123',
  walletId: 'wallet-id-here',
  dailyWithdrawalLimit: 20000,
  transactionLimit: 10000,
  setByUserId: 'admin-user-id',
  metadata: { reason: 'account upgrade' }
});

if (limits.success) {
  console.log('New daily limit:', limits.limits.dailyWithdrawal);
  console.log('New transaction limit:', limits.limits.transaction);
}
```

### Recover Wallet

```typescript
const recovery = await FinanceService.walletRecovery({
  userId: 'user123',
  walletId: 'wallet-id-here',
  recoveryMethod: 'EMAIL',
  recoveryCode: '123456',
  newSecuritySettings: {
    twoFactorRequired: true,
    otpRequired: true
  },
  metadata: { ip: '192.168.1.1' }
});

if (recovery.success) {
  console.log('Wallet recovered:', recovery.walletId);
  console.log('New status:', recovery.status);
}
```

---

## 💳 USING PAYMENT GATEWAYS

### Stripe Payment

```typescript
const stripe = await FinanceService.gatewayStripe({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 100.00,
  currency: 'USD',
  paymentMethodId: 'pm_1234567890',
  description: 'Deposit via Stripe',
  metadata: { 
    customerEmail: 'user@example.com',
    billingAddress: '123 Main St'
  }
});

if (stripe.success) {
  console.log('Transaction ID:', stripe.transactionId);
  console.log('Stripe Payment ID:', stripe.gatewayTransactionId);
  console.log('Status:', stripe.status);
}
```

### PayPal Payment

```typescript
const paypal = await FinanceService.gatewayPayPal({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 50.00,
  currency: 'USD',
  orderId: 'PAYPAL_ORDER_123',
  description: 'Deposit via PayPal',
  metadata: { payerEmail: 'user@example.com' }
});

if (paypal.success) {
  console.log('Transaction ID:', paypal.transactionId);
  console.log('PayPal Capture ID:', paypal.gatewayTransactionId);
}
```

### Mobile Money (M-Pesa)

```typescript
const mobileMoney = await FinanceService.gatewayMobileMoney({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 1000,
  currency: 'KES',
  provider: 'M-PESA',
  phoneNumber: '+254712345678',
  description: 'M-Pesa deposit',
  metadata: { country: 'Kenya' }
});

if (mobileMoney.success) {
  console.log('Transaction ID:', mobileMoney.transactionId);
  console.log('Status:', mobileMoney.status); // PENDING
  console.log('Message:', mobileMoney.message);
}
```

### Cryptocurrency Payment

```typescript
const crypto = await FinanceService.gatewayCrypto({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 0.5,
  cryptoCurrency: 'ETH',
  network: 'ethereum',
  txHash: '0x1234567890abcdef...',
  description: 'Ethereum deposit',
  metadata: { fromAddress: '0xabc...' }
});

if (crypto.success) {
  console.log('Transaction ID:', crypto.transactionId);
  console.log('Blockchain TX:', crypto.gatewayTransactionId);
  console.log('Status:', crypto.status); // COMPLETED or PENDING
}
```

### Bank Transfer

```typescript
const bank = await FinanceService.gatewayBankTransfer({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 5000,
  currency: 'USD',
  bankAccountNumber: '1234567890',
  bankName: 'Bank of Example',
  referenceNumber: 'REF123456',
  description: 'Bank transfer deposit',
  metadata: { accountType: 'checking' }
});

if (bank.success) {
  console.log('Transaction ID:', bank.transactionId);
  console.log('Bank Reference:', bank.gatewayTransactionId);
  console.log('Message:', bank.message); // Processing may take 1-3 days
}
```

---

## 🚀 USING ADVANCED OPERATIONS

### Bulk Transfer (Immediate)

```typescript
const bulkTransfer = await FinanceService.bulkTransferAdvanced({
  fromUserId: 'admin-user-id',
  fromWalletId: 'admin-wallet-id',
  transfers: [
    {
      toUserId: 'user1',
      toWalletId: 'wallet1',
      amount: 100,
      currency: 'PLATFORM_TOKEN',
      description: 'Bonus payment'
    },
    {
      toUserId: 'user2',
      toWalletId: 'wallet2',
      amount: 150,
      currency: 'PLATFORM_TOKEN',
      description: 'Commission payment'
    }
  ],
  priority: 'HIGH',
  metadata: { campaign: 'Q4-bonuses' }
});

if (bulkTransfer.success) {
  console.log('Batch ID:', bulkTransfer.batchId);
  console.log('Total amount:', bulkTransfer.totalAmount);
  console.log('Success count:', bulkTransfer.successCount);
  console.log('Failed count:', bulkTransfer.failureCount);
  
  bulkTransfer.results.forEach(result => {
    console.log(`User ${result.toUserId}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  });
}
```

### Bulk Transfer (Scheduled)

```typescript
const scheduledBulk = await FinanceService.bulkTransferAdvanced({
  fromUserId: 'admin-user-id',
  fromWalletId: 'admin-wallet-id',
  transfers: [ /* ... */ ],
  scheduledDate: new Date('2025-12-25T00:00:00Z'), // Christmas bonus
  priority: 'NORMAL',
  metadata: { campaign: 'christmas-2025' }
});

if (scheduledBulk.success) {
  console.log('Scheduled batch ID:', scheduledBulk.batchId);
  console.log('Scheduled for:', scheduledBulk.scheduledDate);
  console.log('Status:', scheduledBulk.status); // SCHEDULED
}
```

### Scheduled Payment

```typescript
const scheduled = await FinanceService.scheduledPayment({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 500,
  currency: 'USD',
  recipientWalletId: 'recipient-wallet-id',
  scheduledDate: new Date('2025-11-01T09:00:00Z'),
  paymentType: 'RENT_PAYMENT',
  description: 'Monthly rent payment',
  metadata: { property: 'Apt 123' }
});

if (scheduled.success) {
  console.log('Scheduled payment ID:', scheduled.scheduledPaymentId);
  console.log('Transaction ID:', scheduled.transactionId);
  console.log('Scheduled for:', scheduled.scheduledDate);
}
```

### Recurring Payment

```typescript
const recurring = await FinanceService.recurringPayment({
  userId: 'user123',
  walletId: 'wallet-id-here',
  amount: 99.99,
  currency: 'USD',
  recipientWalletId: 'service-wallet-id',
  frequency: 'MONTHLY',
  startDate: new Date('2025-11-01'),
  endDate: new Date('2026-11-01'),
  maxOccurrences: 12,
  description: 'Monthly subscription',
  metadata: { plan: 'premium' }
});

if (recurring.success) {
  console.log('Recurring payment ID:', recurring.recurringPaymentId);
  console.log('Frequency:', recurring.frequency);
  console.log('Next payment:', recurring.nextPaymentDate);
}
```

### Payment Link

```typescript
const link = await FinanceService.paymentLink({
  userId: 'merchant-id',
  walletId: 'merchant-wallet-id',
  amount: 250,
  currency: 'USD',
  description: 'Product purchase',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  maxUses: 1,
  requiresAuth: false,
  customSlug: 'buy-premium-plan',
  metadata: { product: 'premium-plan' }
});

if (link.success) {
  console.log('Payment link:', link.paymentUrl);
  console.log('QR code:', link.qrCodeUrl);
  console.log('Link ID:', link.linkId);
  
  // Share: https://coindaily.com/pay/buy-premium-plan
}
```

### Invoice Generation

```typescript
const invoice = await FinanceService.invoiceGeneration({
  userId: 'freelancer-id',
  walletId: 'freelancer-wallet-id',
  recipientUserId: 'client-id',
  items: [
    {
      description: 'Web Development - Frontend',
      quantity: 40,
      unitPrice: 75
    },
    {
      description: 'Web Development - Backend',
      quantity: 30,
      unitPrice: 85
    }
  ],
  currency: 'USD',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  notes: 'Payment due within 30 days. Late fees apply after due date.',
  taxRate: 10, // 10%
  discountAmount: 200,
  metadata: { project: 'client-website' }
});

if (invoice.success) {
  console.log('Invoice number:', invoice.invoiceNumber);
  console.log('Subtotal:', invoice.subtotal); // 5550
  console.log('Tax (10%):', invoice.taxAmount); // 555
  console.log('Discount:', invoice.discountAmount); // 200
  console.log('Total:', invoice.totalAmount); // 5905
  console.log('Download:', invoice.downloadUrl);
  console.log('Pay online:', invoice.paymentUrl);
}
```

---

## 🧪 TESTING EXAMPLES

### Unit Test Example

```typescript
import { FinanceService } from '../services/FinanceService';
import { prisma } from '../lib/prisma';

describe('Wallet Management', () => {
  let testUserId: string;
  let testWalletId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.wallet.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  test('should create wallet successfully', async () => {
    const result = await FinanceService.walletCreate({
      userId: testUserId,
      walletType: 'USER_WALLET',
      currency: 'PLATFORM_TOKEN'
    });

    expect(result.success).toBe(true);
    expect(result.walletId).toBeDefined();
    expect(result.walletAddress).toBeDefined();
    
    testWalletId = result.walletId!;
  });

  test('should view wallet balance', async () => {
    const result = await FinanceService.walletViewBalance({
      userId: testUserId,
      walletId: testWalletId
    });

    expect(result.success).toBe(true);
    expect(result.balance).toBeDefined();
    expect(result.balance.total).toBe(0);
  });
});
```

### Integration Test Example

```typescript
describe('Payment Gateway Integration', () => {
  test('should process Stripe payment end-to-end', async () => {
    // 1. Create wallet
    const wallet = await FinanceService.walletCreate({
      userId: testUserId,
      walletType: 'USER_WALLET'
    });

    // 2. Process payment
    const payment = await FinanceService.gatewayStripe({
      userId: testUserId,
      walletId: wallet.walletId!,
      amount: 100,
      currency: 'USD',
      paymentMethodId: 'pm_test_card'
    });

    expect(payment.success).toBe(true);

    // 3. Verify balance
    const balance = await FinanceService.walletViewBalance({
      userId: testUserId,
      walletId: wallet.walletId!
    });

    expect(balance.balance.available).toBe(100);
  });
});
```

---

## 📚 COMMON PATTERNS

### Pattern 1: Check Balance Before Operation

```typescript
async function safeTransfer(fromWalletId: string, amount: number) {
  // Check balance first
  const balance = await FinanceService.walletViewBalance({
    userId: currentUserId,
    walletId: fromWalletId
  });

  if (!balance.success || balance.balance.available < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  // Proceed with transfer
  return await FinanceService.transferUserToUser({
    fromUserId: currentUserId,
    fromWalletId,
    toUserId: recipientId,
    toWalletId: recipientWalletId,
    amount,
    currency: 'PLATFORM_TOKEN'
  });
}
```

### Pattern 2: Error Handling with Retry

```typescript
async function reliablePayment(input: GatewayStripeInput) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await FinanceService.gatewayStripe(input);
      
      if (result.success) {
        return result;
      }

      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}
```

### Pattern 3: Batch Operations with Progress

```typescript
async function batchPayments(payments: PaymentInput[]) {
  const results = [];
  const total = payments.length;

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];
    
    console.log(`Processing ${i + 1}/${total}...`);
    
    const result = await FinanceService.processSubscriptionPayment(payment);
    results.push(result);

    // Progress callback
    onProgress?.((i + 1) / total * 100);
  }

  return results;
}
```

---

## ⚠️ ERROR HANDLING

### Common Errors

```typescript
// Insufficient balance
{
  success: false,
  error: 'Insufficient balance',
  requiredAmount: 1000,
  availableAmount: 500
}

// Unauthorized access
{
  success: false,
  error: 'Unauthorized to view this wallet'
}

// Invalid wallet
{
  success: false,
  error: 'Wallet not found'
}

// Gateway error
{
  success: false,
  error: 'Stripe payment processing failed'
}
```

### Handling Errors

```typescript
const result = await FinanceService.walletCreate(input);

if (!result.success) {
  // Log error
  console.error('Wallet creation failed:', result.error);
  
  // Notify user
  await notifyUser(userId, {
    type: 'error',
    message: result.error
  });
  
  // Track in monitoring
  await trackError({
    operation: 'wallet_create',
    error: result.error,
    userId
  });
  
  return;
}

// Success path
console.log('Wallet created:', result.walletId);
```

---

## 🔍 TROUBLESHOOTING

### Problem: Wallet creation fails

**Solution:**
```typescript
// Check if user exists
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user) {
  throw new Error('User not found');
}

// Check if wallet already exists
const existing = await prisma.wallet.findFirst({
  where: { userId, walletType: 'USER_WALLET' }
});

if (existing) {
  return { success: false, error: 'Wallet already exists' };
}
```

### Problem: Payment gateway returns pending

**Solution:**
```typescript
// Mobile money and bank transfers are async
if (result.status === 'PENDING') {
  // Set up webhook listener
  await registerWebhook(result.gatewayTransactionId);
  
  // Poll for status updates
  const finalResult = await pollPaymentStatus(
    result.transactionId,
    { maxAttempts: 10, interval: 5000 }
  );
  
  return finalResult;
}
```

### Problem: Scheduled payment not executing

**Solution:**
```typescript
// Check cron job is running
// Add to your scheduler (e.g., node-cron)
cron.schedule('*/5 * * * *', async () => {
  const duePayments = await prisma.scheduledPayment.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledDate: { lte: new Date() }
    }
  });

  for (const payment of duePayments) {
    await executeScheduledPayment(payment);
  }
});
```

---

## 📞 SUPPORT

### Need Help?
- 📖 **Documentation:** See `FINANCE_OPERATIONS_COMPLETE.md`
- 🐛 **Report Issues:** Create GitHub issue
- 💬 **Questions:** Contact development team
- 📧 **Email:** dev@coindaily.com

### Useful Commands

```bash
# Check transaction status
npx ts-node scripts/check-transaction.ts <transaction-id>

# View wallet details
npx ts-node scripts/view-wallet.ts <wallet-id>

# Test payment gateway
npm run test:gateways

# Generate test data
npm run seed:finance
```

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
