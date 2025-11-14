# 🚀 TASK 4: QUICK INTEGRATION GUIDE

## ⚡ Fast Setup (5 Steps)

### Step 1: Environment Configuration (2 minutes)
```bash
# Copy example configuration
cp backend/.env.finance-security.example backend/.env

# Edit .env and set:
# - ADMIN_IP_WHITELIST (your IP addresses)
# - SMTP credentials (email service)
# - FRONTEND_URL (your domain)
```

### Step 2: Apply Security Middleware (5 minutes)
```typescript
// backend/src/routes/financeRoutes.ts
import { financeSecurityMiddleware } from '../middleware/financeSecurityMiddleware';

// Protect all finance routes
router.use(financeSecurityMiddleware.requireAuth);
router.use('/admin', financeSecurityMiddleware.requireAdmin);
router.use('/super-admin', [
  financeSecurityMiddleware.requireSuperAdmin,
  financeSecurityMiddleware.requireWhitelistedIP,
]);
```

### Step 3: Add Audit Logging (3 minutes per operation)
```typescript
// In your FinanceService methods
import { financeAuditService, AuditAction } from './FinanceAuditService';

// Log successful operations
await financeAuditService.logTransaction(
  userId,
  AuditAction.WITHDRAWAL_COMPLETED,
  transactionId,
  { amount, currency, destination },
  req
);
```

### Step 4: Add Fraud Checks (3 minutes per transaction type)
```typescript
// Before processing withdrawals/transfers
import { fraudMonitoringService } from './FraudMonitoringService';

const fraudCheck = await fraudMonitoringService.analyzeTransaction({
  userId,
  transactionType: 'WITHDRAWAL',
  amount,
  ipAddress: req.ip,
  timestamp: new Date(),
});

if (!fraudCheck.passed) {
  throw new Error(`Transaction blocked: ${fraudCheck.reasons.join(', ')}`);
}
```

### Step 5: Send Email Notifications (2 minutes per event)
```typescript
// After successful transactions
import { financeEmailService } from './FinanceEmailService';

await financeEmailService.sendDepositEmail(user.email, {
  username: user.username,
  amount,
  currency,
  transactionId,
  timestamp: new Date(),
  method: 'Blockchain',
  newBalance: wallet.balance,
});
```

---

## 📋 Essential Code Snippets

### Complete Withdrawal Flow with All Security Features
```typescript
async processWithdrawal(input: WithdrawalInput, req: Request) {
  // 1. Fraud check
  const fraudCheck = await fraudMonitoringService.analyzeTransaction({
    userId: input.userId,
    transactionType: 'WITHDRAWAL',
    amount: input.amount,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date(),
  });

  if (!fraudCheck.passed) {
    // Log failed attempt
    await financeAuditService.logTransaction(
      input.userId,
      AuditAction.WITHDRAWAL_REJECTED,
      'fraud-blocked',
      { 
        riskScore: fraudCheck.riskScore, 
        reasons: fraudCheck.reasons 
      },
      req,
      'blocked' as any
    );
    throw new Error(`Withdrawal blocked: ${fraudCheck.reasons.join(', ')}`);
  }

  // 2. Auto-lock if critical risk
  if (fraudCheck.shouldLock) {
    await fraudMonitoringService.autoLockWallet(
      input.userId,
      `High-risk withdrawal: ${fraudCheck.reasons.join(', ')}`,
      req,
      { riskScore: fraudCheck.riskScore }
    );
    throw new Error('Wallet locked due to suspicious activity');
  }

  // 3. Verify OTP
  const otpValid = await otpService.verify(input.userId, input.otpCode);
  if (!otpValid) {
    const { shouldLock } = await financeSecurityMiddleware.trackFailedOTP(
      input.userId,
      req
    );
    if (shouldLock) {
      throw new Error('Wallet locked: Too many failed OTP attempts');
    }
    throw new Error('Invalid OTP code');
  }

  // 4. Process withdrawal
  const transaction = await this.executeWithdrawal(input);

  // 5. Log success
  await financeAuditService.logTransaction(
    input.userId,
    AuditAction.WITHDRAWAL_COMPLETED,
    transaction.id,
    {
      amount: input.amount,
      currency: input.currency,
      destination: input.destinationAddress,
    },
    req
  );

  // 6. Send confirmation email
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  const wallet = await prisma.wallet.findUnique({ where: { id: input.walletId } });
  
  await financeEmailService.sendWithdrawalEmail(user.email, {
    username: user.username,
    amount: input.amount,
    currency: input.currency,
    transactionId: transaction.id,
    timestamp: new Date(),
    destinationType: input.destinationType,
    destinationAddress: input.destinationAddress,
    newBalance: wallet.balance - input.amount,
    status: 'COMPLETED',
  });

  // 7. Send alert if high risk but allowed
  if (fraudCheck.shouldAlert) {
    await financeEmailService.sendSecurityAlert(user.email, {
      username: user.username,
      alertType: 'unusual_activity',
      message: `Unusual withdrawal detected: $${input.amount}`,
      timestamp: new Date(),
      ipAddress: req.ip,
      actionRequired: 'Please verify this was you.',
    });
  }

  return transaction;
}
```

---

## 🔑 We Wallet Multi-Sig Example
```typescript
// Super Admin accessing We Wallet
router.post('/we-wallet/transfer', [
  financeSecurityMiddleware.requireSuperAdmin,
  financeSecurityMiddleware.requireWeWalletAuth,
], async (req, res) => {
  // This only executes if all 3 emails verified their tokens
  const result = await weWalletService.transfer(req.body);
  
  // Log We Wallet operation
  await financeAuditService.logWeWalletOperation(
    req.user.id,
    AuditAction.WE_WALLET_TRANSACTION,
    {
      action: 'transfer',
      amount: req.body.amount,
      to: req.body.to,
    },
    req,
    ['divinegiftx@gmail.com', 'bizoppventures@gmail.com', 'ivuomachimaobi1@gmail.com']
  );
  
  res.json(result);
});
```

---

## 📧 Send OTP Example
```typescript
async sendWithdrawalOTP(userId: string, req: Request) {
  // Generate OTP
  const otpCode = await otpService.generate(userId, 'withdrawal');
  
  // Get user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Send OTP email
  await financeEmailService.sendTransactionOTP(user.email, {
    username: user.username,
    otpCode,
    action: 'Withdrawal Verification',
    amount: req.body.amount,
    currency: req.body.currency,
    expiresInMinutes: 5,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date(),
  });
  
  // Log OTP generation
  await financeAuditService.logSecurityEvent(
    userId,
    AuditAction.OTP_GENERATED,
    { action: 'withdrawal', amount: req.body.amount },
    req
  );
}
```

---

## 📊 Admin Dashboard Queries

### View Audit Logs
```graphql
query GetAuditLogs {
  financeSecurityAuditLogs(
    action: "withdrawal_completed"
    startDate: "2025-10-01"
    endDate: "2025-10-22"
    limit: 50
  ) {
    id
    adminId
    action
    timestamp
    ipAddress
    details
    admin {
      username
      email
    }
  }
}
```

### Get Fraud Statistics
```graphql
query GetFraudStats {
  financeFraudStats(days: 7) {
    totalAlertsTriggered
    walletsLocked
    flaggedTransactions
    averageRiskScore
    topRiskUsers {
      userId
      username
      riskScore
    }
  }
}
```

### Lock Wallet Manually
```graphql
mutation LockWallet {
  financeLockWallet(
    userId: "user-id-here"
    reason: "Suspicious withdrawal pattern detected"
  ) {
    success
    message
  }
}
```

### Export Audit Logs
```graphql
mutation ExportLogs {
  financeExportAuditLogs(
    format: CSV
    startDate: "2025-10-01"
    endDate: "2025-10-22"
  ) {
    success
    format
    filename
    content
  }
}
```

---

## 🌐 Start Blockchain Sync

### In Main Application
```typescript
// backend/src/index.ts
import { startBlockchainSync, stopBlockchainSync } from './workers/blockchainSyncWorker';

async function main() {
  // Start server...
  const server = app.listen(PORT);
  
  // Start blockchain sync
  await startBlockchainSync();
  logger.info('✅ Blockchain sync worker started');
  
  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    stopBlockchainSync();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
```

---

## ⚙️ Environment Variables Quick Reference

```env
# Critical Security (keep secret!)
WE_WALLET_AUTH_EMAIL_1=divinegiftx@gmail.com
WE_WALLET_AUTH_EMAIL_2=bizoppventures@gmail.com
WE_WALLET_AUTH_EMAIL_3=ivuomachimaobi1@gmail.com

# IP Whitelist (comma-separated)
ADMIN_IP_WHITELIST=192.168.1.100,203.0.113.45
DISABLE_IP_WHITELIST=false  # Only true in development!

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@coindaily.com

# Frontend URL
FRONTEND_URL=https://coindaily.com

# Fraud Thresholds (adjust as needed)
MAX_FAILED_OTP=5
MAX_WITHDRAWAL_AMOUNT=50000
MAX_DAILY_WITHDRAWALS=10

# Blockchain (when ready)
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR-KEY
MAIN_TOKEN_ADDRESS=0x...
PLATFORM_WALLET_ADDRESS=0x...
```

---

## ✅ Testing Commands

### Test Email Service
```typescript
// Create a test route
router.post('/test/email', async (req, res) => {
  await financeEmailService.sendDepositEmail('test@example.com', {
    username: 'TestUser',
    amount: 100,
    currency: 'JY',
    transactionId: 'test-123',
    timestamp: new Date(),
    method: 'Test',
    newBalance: 1000,
  });
  res.json({ success: true });
});
```

### Test Fraud Detection
```typescript
// Create a test route
router.post('/test/fraud', async (req, res) => {
  const check = await fraudMonitoringService.analyzeTransaction({
    userId: 'test-user',
    transactionType: 'WITHDRAWAL',
    amount: 60000, // Exceeds limit
    ipAddress: req.ip,
    timestamp: new Date(),
  });
  res.json(check);
});
```

### Test Audit Logging
```typescript
// Create a test route
router.post('/test/audit', async (req, res) => {
  await financeAuditService.logTransaction(
    'test-user',
    AuditAction.WITHDRAWAL_COMPLETED,
    'test-tx-123',
    { amount: 100, currency: 'JY' },
    req
  );
  res.json({ success: true });
});
```

---

## 🚨 Common Issues & Solutions

### Issue: Emails not sending
**Solution:** Check SMTP credentials, enable "Less secure app access" or use app-specific password

### Issue: IP whitelist blocking you
**Solution:** Add your IP to `ADMIN_IP_WHITELIST` or set `DISABLE_IP_WHITELIST=true` (dev only!)

### Issue: Blockchain sync not starting
**Solution:** Verify `BLOCKCHAIN_RPC_URL` is set and `MAIN_TOKEN_ADDRESS` is configured

### Issue: Wallet auto-locking too aggressively
**Solution:** Adjust fraud thresholds in `.env` (increase `MAX_WITHDRAWAL_AMOUNT`, etc.)

### Issue: We Wallet authentication failing
**Solution:** Ensure all 3 email addresses receive and verify their tokens

---

## 📞 Support

- **Documentation:** See `TASK_4_SECURITY_NOTIFICATIONS_COMPLETE.md`
- **Issues:** Check audit logs for detailed error tracking
- **Security:** Review fraud statistics daily in admin dashboard

---

**Last Updated:** October 22, 2025
**Status:** ✅ Production Ready
