-- CreateTable
CREATE TABLE "ModerationQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "flagReason" TEXT,
    "assignedTo" TEXT,
    "assignedAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "autoFlagged" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminRole" TEXT NOT NULL,
    "adminComment" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isShadowBanned" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("avatarUrl", "bio", "createdAt", "email", "emailVerified", "firstName", "id", "lastLoginAt", "lastName", "location", "passwordHash", "phoneVerified", "preferredLanguage", "role", "status", "subscriptionTier", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username") SELECT "avatarUrl", "bio", "createdAt", "email", "emailVerified", "firstName", "id", "lastLoginAt", "lastName", "location", "passwordHash", "phoneVerified", "preferredLanguage", "role", "status", "subscriptionTier", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username" FROM "User";
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
CREATE TABLE "new_UserPenalty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "violationReportId" TEXT NOT NULL,
    "penaltyType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "contentHidden" BOOLEAN NOT NULL DEFAULT true,
    "accountFrozen" BOOLEAN NOT NULL DEFAULT false,
    "ipBanned" BOOLEAN NOT NULL DEFAULT false,
    "emailBanned" BOOLEAN NOT NULL DEFAULT false,
    "appealStatus" TEXT,
    "appealReason" TEXT,
    "appealSubmittedAt" DATETIME,
    "appealResolvedAt" DATETIME,
    "appealResolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolutionReason" TEXT,
    "appliedBy" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPenalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPenalty_violationReportId_fkey" FOREIGN KEY ("violationReportId") REFERENCES "ViolationReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPenalty_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserPenalty" ("accountFrozen", "appealReason", "appealResolvedAt", "appealResolvedBy", "appealStatus", "appealSubmittedAt", "contentHidden", "createdAt", "duration", "emailBanned", "endDate", "escalationLevel", "id", "ipBanned", "isActive", "isAutomatic", "metadata", "penaltyType", "resolutionReason", "resolvedAt", "resolvedBy", "severity", "startDate", "updatedAt", "userId", "violationReportId") SELECT "accountFrozen", "appealReason", "appealResolvedAt", "appealResolvedBy", "appealStatus", "appealSubmittedAt", "contentHidden", "createdAt", "duration", "emailBanned", "endDate", "escalationLevel", "id", "ipBanned", "isActive", "isAutomatic", "metadata", "penaltyType", "resolutionReason", "resolvedAt", "resolvedBy", "severity", "startDate", "updatedAt", "userId", "violationReportId" FROM "UserPenalty";
DROP TABLE "UserPenalty";
ALTER TABLE "new_UserPenalty" RENAME TO "UserPenalty";
CREATE INDEX "UserPenalty_userId_isActive_idx" ON "UserPenalty"("userId", "isActive");
CREATE INDEX "UserPenalty_penaltyType_isActive_idx" ON "UserPenalty"("penaltyType", "isActive");
CREATE INDEX "UserPenalty_escalationLevel_idx" ON "UserPenalty"("escalationLevel");
CREATE INDEX "UserPenalty_startDate_endDate_idx" ON "UserPenalty"("startDate", "endDate");
CREATE INDEX "UserPenalty_appealStatus_idx" ON "UserPenalty"("appealStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ModerationQueue_status_priority_createdAt_idx" ON "ModerationQueue"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationQueue_authorId_idx" ON "ModerationQueue"("authorId");

-- CreateIndex
CREATE INDEX "ModerationQueue_assignedTo_idx" ON "ModerationQueue"("assignedTo");

-- CreateIndex
CREATE INDEX "ModerationQueue_contentType_contentId_idx" ON "ModerationQueue"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "AdminAction_adminId_createdAt_idx" ON "AdminAction"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_actionType_createdAt_idx" ON "AdminAction"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_targetType_targetId_idx" ON "AdminAction"("targetType", "targetId");
