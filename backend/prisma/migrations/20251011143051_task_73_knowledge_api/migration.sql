-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "keyHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "allowedEndpoints" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "lastUsedAt" DATETIME,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "APIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "APIUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "requestSize" INTEGER NOT NULL DEFAULT 0,
    "responseSize" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "APIUsage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "APIKey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "structuredData" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT NOT NULL,
    "entities" TEXT NOT NULL,
    "facts" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "lastProcessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityScore" REAL NOT NULL DEFAULT 0.0,
    "llmReadability" REAL NOT NULL DEFAULT 0.0,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeBase_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RAGFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feedType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "category" TEXT,
    "region" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "updateFrequency" TEXT NOT NULL DEFAULT 'hourly',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGenerated" DATETIME,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "averageQuality" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIManifest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "name" TEXT NOT NULL DEFAULT 'CoinDaily Knowledge API',
    "description" TEXT NOT NULL,
    "apiEndpoints" TEXT NOT NULL,
    "capabilities" TEXT NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "rateLimit" TEXT NOT NULL,
    "authMethods" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "CitationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledgeBaseId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "citedContent" TEXT NOT NULL,
    "citationContext" TEXT,
    "userQuery" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CitationLog_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CitationLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "APIKey" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeveloperEndpoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "responseFormat" TEXT NOT NULL,
    "exampleRequest" TEXT,
    "exampleResponse" TEXT,
    "documentation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_keyHash_key" ON "APIKey"("keyHash");

-- CreateIndex
CREATE INDEX "APIKey_keyHash_idx" ON "APIKey"("keyHash");

-- CreateIndex
CREATE INDEX "APIKey_userId_idx" ON "APIKey"("userId");

-- CreateIndex
CREATE INDEX "APIKey_isActive_tier_idx" ON "APIKey"("isActive", "tier");

-- CreateIndex
CREATE INDEX "APIUsage_apiKeyId_timestamp_idx" ON "APIUsage"("apiKeyId", "timestamp");

-- CreateIndex
CREATE INDEX "APIUsage_endpoint_timestamp_idx" ON "APIUsage"("endpoint", "timestamp");

-- CreateIndex
CREATE INDEX "APIUsage_timestamp_idx" ON "APIUsage"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_articleId_key" ON "KnowledgeBase"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_articleId_idx" ON "KnowledgeBase"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_qualityScore_idx" ON "KnowledgeBase"("qualityScore");

-- CreateIndex
CREATE INDEX "KnowledgeBase_citationCount_idx" ON "KnowledgeBase"("citationCount");

-- CreateIndex
CREATE UNIQUE INDEX "RAGFeed_endpoint_key" ON "RAGFeed"("endpoint");

-- CreateIndex
CREATE INDEX "RAGFeed_feedType_idx" ON "RAGFeed"("feedType");

-- CreateIndex
CREATE INDEX "RAGFeed_isActive_idx" ON "RAGFeed"("isActive");

-- CreateIndex
CREATE INDEX "RAGFeed_category_idx" ON "RAGFeed"("category");

-- CreateIndex
CREATE INDEX "AIManifest_isActive_idx" ON "AIManifest"("isActive");

-- CreateIndex
CREATE INDEX "CitationLog_knowledgeBaseId_timestamp_idx" ON "CitationLog"("knowledgeBaseId", "timestamp");

-- CreateIndex
CREATE INDEX "CitationLog_sourceType_timestamp_idx" ON "CitationLog"("sourceType", "timestamp");

-- CreateIndex
CREATE INDEX "CitationLog_sourceName_timestamp_idx" ON "CitationLog"("sourceName", "timestamp");

-- CreateIndex
CREATE INDEX "CitationLog_timestamp_idx" ON "CitationLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperEndpoint_path_key" ON "DeveloperEndpoint"("path");

-- CreateIndex
CREATE INDEX "DeveloperEndpoint_isActive_idx" ON "DeveloperEndpoint"("isActive");

-- CreateIndex
CREATE INDEX "DeveloperEndpoint_category_idx" ON "DeveloperEndpoint"("category");

-- CreateIndex
CREATE INDEX "DeveloperEndpoint_isPublic_idx" ON "DeveloperEndpoint"("isPublic");
