-- CreateTable
CREATE TABLE "MobileMoneyProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportedCurrencies" TEXT NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "fixedFee" INTEGER NOT NULL DEFAULT 0,
    "percentageFee" REAL NOT NULL DEFAULT 0.0,
    "timeout" INTEGER NOT NULL DEFAULT 300,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "secretKey" TEXT,
    "webhookSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MobileMoneyTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "providerFee" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "totalFee" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "failureReason" TEXT,
    "fraudAnalysisId" TEXT,
    "complianceCheckId" TEXT,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MobileMoneyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MobileMoneyTransaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MobileMoneyProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MobileMoneyTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MobileMoneyTransaction_fraudAnalysisId_fkey" FOREIGN KEY ("fraudAnalysisId") REFERENCES "FraudAnalysis" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MobileMoneyTransaction_complianceCheckId_fkey" FOREIGN KEY ("complianceCheckId") REFERENCES "ComplianceCheck" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingPeriodStart" DATETIME NOT NULL,
    "billingPeriodEnd" DATETIME NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" DATETIME,
    "transactionId" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MobileMoneyProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FraudAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "userId" TEXT,
    "riskLevel" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "flags" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rulesTriggered" TEXT,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "phoneNumber" TEXT,
    "amount" INTEGER,
    "velocity" TEXT,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "finalDecision" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FraudAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "kycRequired" BOOLEAN NOT NULL DEFAULT true,
    "maxTransactionAmount" INTEGER NOT NULL,
    "maxDailyAmount" INTEGER NOT NULL,
    "maxMonthlyAmount" INTEGER NOT NULL,
    "identityVerification" BOOLEAN NOT NULL DEFAULT false,
    "taxReporting" BOOLEAN NOT NULL DEFAULT false,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "restrictions" TEXT,
    "regulatoryBody" TEXT,
    "licenseRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceRequirement_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MobileMoneyProvider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "userId" TEXT,
    "requirementId" TEXT NOT NULL,
    "amountLimitsCheck" BOOLEAN NOT NULL DEFAULT false,
    "kycStatusCheck" BOOLEAN NOT NULL DEFAULT false,
    "sanctionsScreenCheck" BOOLEAN NOT NULL DEFAULT false,
    "taxComplianceCheck" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "violations" TEXT,
    "checkDetails" TEXT,
    "checkedBy" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ComplianceCheck_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentWebhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "transactionId" TEXT,
    "providerTransactionId" TEXT,
    "status" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "phoneNumber" TEXT,
    "signature" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MobileMoneyProvider_name_key" ON "MobileMoneyProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MobileMoneyProvider_code_key" ON "MobileMoneyProvider"("code");

-- CreateIndex
CREATE INDEX "MobileMoneyProvider_code_idx" ON "MobileMoneyProvider"("code");

-- CreateIndex
CREATE INDEX "MobileMoneyProvider_country_idx" ON "MobileMoneyProvider"("country");

-- CreateIndex
CREATE INDEX "MobileMoneyProvider_isActive_idx" ON "MobileMoneyProvider"("isActive");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_userId_idx" ON "MobileMoneyTransaction"("userId");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_providerId_idx" ON "MobileMoneyTransaction"("providerId");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_status_idx" ON "MobileMoneyTransaction"("status");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_transactionType_idx" ON "MobileMoneyTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_phoneNumber_idx" ON "MobileMoneyTransaction"("phoneNumber");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_createdAt_idx" ON "MobileMoneyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_providerTransactionId_idx" ON "MobileMoneyTransaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_userId_idx" ON "SubscriptionPayment"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_nextAttemptAt_idx" ON "SubscriptionPayment"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_billingPeriodEnd_idx" ON "SubscriptionPayment"("billingPeriodEnd");

-- CreateIndex
CREATE INDEX "FraudAnalysis_riskLevel_idx" ON "FraudAnalysis"("riskLevel");

-- CreateIndex
CREATE INDEX "FraudAnalysis_recommendation_idx" ON "FraudAnalysis"("recommendation");

-- CreateIndex
CREATE INDEX "FraudAnalysis_userId_idx" ON "FraudAnalysis"("userId");

-- CreateIndex
CREATE INDEX "FraudAnalysis_analyzedAt_idx" ON "FraudAnalysis"("analyzedAt");

-- CreateIndex
CREATE INDEX "FraudAnalysis_phoneNumber_idx" ON "FraudAnalysis"("phoneNumber");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_country_idx" ON "ComplianceRequirement"("country");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_providerId_idx" ON "ComplianceRequirement"("providerId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_isActive_idx" ON "ComplianceRequirement"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRequirement_country_providerId_key" ON "ComplianceRequirement"("country", "providerId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_passed_idx" ON "ComplianceCheck"("passed");

-- CreateIndex
CREATE INDEX "ComplianceCheck_userId_idx" ON "ComplianceCheck"("userId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_checkedAt_idx" ON "ComplianceCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "ComplianceCheck_requirementId_idx" ON "ComplianceCheck"("requirementId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_provider_idx" ON "PaymentWebhook"("provider");

-- CreateIndex
CREATE INDEX "PaymentWebhook_eventType_idx" ON "PaymentWebhook"("eventType");

-- CreateIndex
CREATE INDEX "PaymentWebhook_processed_idx" ON "PaymentWebhook"("processed");

-- CreateIndex
CREATE INDEX "PaymentWebhook_transactionId_idx" ON "PaymentWebhook"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_createdAt_idx" ON "PaymentWebhook"("createdAt");
