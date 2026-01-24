-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joyTokenUsdRate" REAL NOT NULL DEFAULT 1.0,
    "joyTokenSymbol" TEXT NOT NULL DEFAULT 'JY',
    "joyTokenName" TEXT NOT NULL DEFAULT 'JOY Token',
    "lastRateUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateUpdatedBy" TEXT,
    "rateUpdateReason" TEXT,
    "previousRate" REAL,
    "cePointsToJyRate" INTEGER NOT NULL DEFAULT 100,
    "cePointsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'JY',
    "supportedCurrencies" TEXT NOT NULL DEFAULT 'JY,USD,EUR,KES,NGN,GHS,ZAR',
    "platformName" TEXT NOT NULL DEFAULT 'CoinDaily',
    "platformUrl" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CurrencyRateHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "usdRate" REAL NOT NULL,
    "previousRate" REAL,
    "changePercentage" REAL,
    "updatedBy" TEXT NOT NULL,
    "updateReason" TEXT,
    "notes" TEXT,
    "marketCap" REAL,
    "volume24h" REAL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PlatformSettings_lastRateUpdate_idx" ON "PlatformSettings"("lastRateUpdate");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_id_key" ON "PlatformSettings"("id");

-- CreateIndex
CREATE INDEX "CurrencyRateHistory_currency_effectiveFrom_idx" ON "CurrencyRateHistory"("currency", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CurrencyRateHistory_createdAt_idx" ON "CurrencyRateHistory"("createdAt");
