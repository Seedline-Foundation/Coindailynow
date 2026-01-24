-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "changesSummary" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentRevision_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "favoriteCategories" TEXT NOT NULL,
    "followedAuthors" TEXT NOT NULL,
    "blockedCategories" TEXT NOT NULL,
    "contentLanguages" TEXT NOT NULL,
    "readingLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "contentLength" TEXT NOT NULL DEFAULT 'MEDIUM',
    "preferredTopics" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "breakingNews" BOOLEAN NOT NULL DEFAULT true,
    "aiRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "voiceNewsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoPlayVideos" BOOLEAN NOT NULL DEFAULT false,
    "portfolioSymbols" TEXT NOT NULL DEFAULT '[]',
    "excludedTopics" TEXT NOT NULL DEFAULT '[]',
    "preferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserPreference" ("aiRecommendations", "autoPlayVideos", "blockedCategories", "breakingNews", "contentLanguages", "contentLength", "createdAt", "digestFrequency", "emailDigest", "favoriteCategories", "followedAuthors", "id", "preferences", "preferredTopics", "priceAlerts", "pushEnabled", "readingLevel", "updatedAt", "userId", "voiceNewsEnabled") SELECT "aiRecommendations", "autoPlayVideos", "blockedCategories", "breakingNews", "contentLanguages", "contentLength", "createdAt", "digestFrequency", "emailDigest", "favoriteCategories", "followedAuthors", "id", "preferences", "preferredTopics", "priceAlerts", "pushEnabled", "readingLevel", "updatedAt", "userId", "voiceNewsEnabled" FROM "UserPreference";
DROP TABLE "UserPreference";
ALTER TABLE "new_UserPreference" RENAME TO "UserPreference";
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ContentRevision_articleId_createdAt_idx" ON "ContentRevision"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_changedBy_idx" ON "ContentRevision"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_articleId_revisionNumber_key" ON "ContentRevision"("articleId", "revisionNumber");
