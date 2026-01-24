-- CreateTable
CREATE TABLE "BlacklistedIP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "raometa" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedIP_ipAddress_key" ON "BlacklistedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlacklistedIP_ipAddress_idx" ON "BlacklistedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlacklistedIP_userId_idx" ON "BlacklistedIP"("userId");

-- CreateIndex
CREATE INDEX "BlacklistedIP_isActive_idx" ON "BlacklistedIP"("isActive");

-- CreateIndex
CREATE INDEX "BlacklistedIP_expiresAt_idx" ON "BlacklistedIP"("expiresAt");

-- CreateIndex
CREATE INDEX "SEOMetadata_contentId_idx" ON "SEOMetadata"("contentId");

-- CreateIndex
CREATE INDEX "SEOMetadata_contentType_idx" ON "SEOMetadata"("contentType");

-- CreateIndex
CREATE INDEX "SEOMetadata_isActive_idx" ON "SEOMetadata"("isActive");

-- CreateIndex
CREATE INDEX "SEOMetadata_updatedAt_idx" ON "SEOMetadata"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SEOMetadata_contentId_contentType_key" ON "SEOMetadata"("contentId", "contentType");
