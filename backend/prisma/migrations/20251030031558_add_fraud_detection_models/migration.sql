-- CreateTable
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WeWalletAuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "amount" REAL,
    "targetWalletId" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "otpIds" TEXT NOT NULL,
    "verifiedEmails" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "initiatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "WalletWhitelist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "addressType" TEXT NOT NULL,
    "label" TEXT,
    "verificationMethod" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatesAt" DATETIME,
    "deletedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletWhitelist_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "fraudScore" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "autoFrozen" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fraud_alerts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fraud_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JY',
    "destinationAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "adminNotes" TEXT,
    "processedAt" DATETIME,
    "transactionId" TEXT,
    "transactionHash" TEXT,
    "lastWithdrawalAt" DATETIME,
    "cooldownHours" REAL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "withdrawal_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WalletTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whitelist_changes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "reason" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "changeYear" INTEGER NOT NULL,
    "changeCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "whitelist_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "whitelist_changes_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OTP_userId_purpose_verified_idx" ON "OTP"("userId", "purpose", "verified");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "OTP"("expiresAt");

-- CreateIndex
CREATE INDEX "OTP_createdAt_idx" ON "OTP"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeWalletAuthSession_sessionId_key" ON "WeWalletAuthSession"("sessionId");

-- CreateIndex
CREATE INDEX "WeWalletAuthSession_sessionId_idx" ON "WeWalletAuthSession"("sessionId");

-- CreateIndex
CREATE INDEX "WeWalletAuthSession_initiatedBy_status_idx" ON "WeWalletAuthSession"("initiatedBy", "status");

-- CreateIndex
CREATE INDEX "WeWalletAuthSession_status_expiresAt_idx" ON "WeWalletAuthSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "WalletWhitelist_walletId_isActive_idx" ON "WalletWhitelist"("walletId", "isActive");

-- CreateIndex
CREATE INDEX "WalletWhitelist_address_addressType_idx" ON "WalletWhitelist"("address", "addressType");

-- CreateIndex
CREATE INDEX "WalletWhitelist_isVerified_idx" ON "WalletWhitelist"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "WalletWhitelist_walletId_address_addressType_key" ON "WalletWhitelist"("walletId", "address", "addressType");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_timestamp_idx" ON "SecurityLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_action_timestamp_idx" ON "SecurityLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_timestamp_idx" ON "SecurityLog"("timestamp");

-- CreateIndex
CREATE INDEX "fraud_alerts_walletId_createdAt_idx" ON "fraud_alerts"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_userId_createdAt_idx" ON "fraud_alerts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_severity_resolved_idx" ON "fraud_alerts"("severity", "resolved");

-- CreateIndex
CREATE INDEX "fraud_alerts_alertType_createdAt_idx" ON "fraud_alerts"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_fraudScore_idx" ON "fraud_alerts"("fraudScore");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_transactionId_key" ON "withdrawal_requests"("transactionId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_walletId_status_idx" ON "withdrawal_requests"("walletId", "status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_userId_status_idx" ON "withdrawal_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_requestedAt_idx" ON "withdrawal_requests"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "withdrawal_requests_reviewedBy_reviewedAt_idx" ON "withdrawal_requests"("reviewedBy", "reviewedAt");

-- CreateIndex
CREATE INDEX "whitelist_changes_userId_changeYear_idx" ON "whitelist_changes"("userId", "changeYear");

-- CreateIndex
CREATE INDEX "whitelist_changes_walletId_operation_idx" ON "whitelist_changes"("walletId", "operation");

-- CreateIndex
CREATE INDEX "whitelist_changes_operation_createdAt_idx" ON "whitelist_changes"("operation", "createdAt");
