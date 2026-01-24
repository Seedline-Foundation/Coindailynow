-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "bio" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "location" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "socialMedia" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "resource" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "category" TEXT NOT NULL DEFAULT 'general',
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DeviceTrust" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "trustScore" REAL NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "riskFactors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "framework" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0.0,
    "violations" TEXT,
    "recommendations" TEXT,
    "generatedBy" TEXT,
    "reportData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Marquee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'token',
    "position" TEXT NOT NULL DEFAULT 'header',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "MarqueeStyle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marqueeId" TEXT NOT NULL,
    "speed" REAL NOT NULL DEFAULT 50.0,
    "direction" TEXT NOT NULL DEFAULT 'left',
    "pauseOnHover" BOOLEAN NOT NULL DEFAULT true,
    "backgroundColor" TEXT NOT NULL DEFAULT '#1f2937',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "fontSize" TEXT NOT NULL DEFAULT '14px',
    "fontWeight" TEXT NOT NULL DEFAULT 'normal',
    "height" TEXT NOT NULL DEFAULT '48px',
    "borderRadius" TEXT NOT NULL DEFAULT '0px',
    "borderWidth" TEXT NOT NULL DEFAULT '0px',
    "borderColor" TEXT NOT NULL DEFAULT '#transparent',
    "shadowColor" TEXT NOT NULL DEFAULT 'transparent',
    "shadowBlur" TEXT NOT NULL DEFAULT '0px',
    "showIcons" BOOLEAN NOT NULL DEFAULT true,
    "iconColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "iconSize" TEXT NOT NULL DEFAULT '20px',
    "itemSpacing" TEXT NOT NULL DEFAULT '32px',
    "paddingVertical" TEXT NOT NULL DEFAULT '12px',
    "paddingHorizontal" TEXT NOT NULL DEFAULT '16px',
    "gradient" TEXT,
    "customCSS" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarqueeStyle_marqueeId_fkey" FOREIGN KEY ("marqueeId") REFERENCES "Marquee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarqueeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marqueeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "linkUrl" TEXT,
    "linkTarget" TEXT NOT NULL DEFAULT '_self',
    "symbol" TEXT,
    "price" REAL,
    "change24h" REAL,
    "changePercent24h" REAL,
    "marketCap" REAL,
    "volume24h" REAL,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "textColor" TEXT,
    "bgColor" TEXT,
    "icon" TEXT,
    "iconColor" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarqueeItem_marqueeId_fkey" FOREIGN KEY ("marqueeId") REFERENCES "Marquee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarqueeTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "styleConfig" TEXT NOT NULL,
    "itemsConfig" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "constraints" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE'
);
INSERT INTO "new_User" ("avatarUrl", "bio", "createdAt", "email", "emailVerified", "firstName", "id", "lastLoginAt", "lastName", "location", "passwordHash", "phoneVerified", "preferredLanguage", "status", "subscriptionTier", "twoFactorEnabled", "updatedAt", "username") SELECT "avatarUrl", "bio", "createdAt", "email", "emailVerified", "firstName", "id", "lastLoginAt", "lastName", "location", "passwordHash", "phoneVerified", "preferredLanguage", "status", "subscriptionTier", "twoFactorEnabled", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditEvent_type_timestamp_idx" ON "AuditEvent"("type", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_timestamp_idx" ON "AuditEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_severity_timestamp_idx" ON "AuditEvent"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_category_timestamp_idx" ON "AuditEvent"("category", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_success_timestamp_idx" ON "AuditEvent"("success", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTrust_deviceId_key" ON "DeviceTrust"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTrust_userId_isActive_idx" ON "DeviceTrust"("userId", "isActive");

-- CreateIndex
CREATE INDEX "DeviceTrust_deviceId_idx" ON "DeviceTrust"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTrust_trustScore_idx" ON "DeviceTrust"("trustScore");

-- CreateIndex
CREATE INDEX "ComplianceReport_framework_status_idx" ON "ComplianceReport"("framework", "status");

-- CreateIndex
CREATE INDEX "ComplianceReport_createdAt_idx" ON "ComplianceReport"("createdAt");

-- CreateIndex
CREATE INDEX "ComplianceReport_score_idx" ON "ComplianceReport"("score");

-- CreateIndex
CREATE INDEX "Marquee_isActive_isPublished_idx" ON "Marquee"("isActive", "isPublished");

-- CreateIndex
CREATE INDEX "Marquee_type_position_idx" ON "Marquee"("type", "position");

-- CreateIndex
CREATE INDEX "Marquee_priority_idx" ON "Marquee"("priority");

-- CreateIndex
CREATE INDEX "Marquee_startDate_endDate_idx" ON "Marquee"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarqueeStyle_marqueeId_key" ON "MarqueeStyle"("marqueeId");

-- CreateIndex
CREATE INDEX "MarqueeItem_marqueeId_order_idx" ON "MarqueeItem"("marqueeId", "order");

-- CreateIndex
CREATE INDEX "MarqueeItem_type_isVisible_idx" ON "MarqueeItem"("type", "isVisible");

-- CreateIndex
CREATE INDEX "MarqueeTemplate_category_isDefault_idx" ON "MarqueeTemplate"("category", "isDefault");

-- CreateIndex
CREATE INDEX "AdminPermission_adminId_idx" ON "AdminPermission"("adminId");

-- CreateIndex
CREATE INDEX "AdminPermission_resource_idx" ON "AdminPermission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminId_resource_key" ON "AdminPermission"("adminId", "resource");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_timestamp_idx" ON "AuditLog"("adminId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");

-- CreateIndex
CREATE INDEX "AdminRole_name_idx" ON "AdminRole"("name");

-- CreateIndex
CREATE INDEX "AdminRole_isActive_idx" ON "AdminRole"("isActive");
