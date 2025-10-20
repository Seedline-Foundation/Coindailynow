-- CreateTable
CREATE TABLE "VectorEmbedding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "embeddingVector" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL DEFAULT 1536,
    "tokens" INTEGER NOT NULL,
    "metadata" TEXT,
    "qualityScore" REAL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastAccessedAt" DATETIME,
    "accessCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "RecognizedEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliases" TEXT,
    "description" TEXT,
    "category" TEXT,
    "metadata" TEXT,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "mentionCount" INTEGER NOT NULL DEFAULT 0,
    "lastMentionedAt" DATETIME,
    "embeddingId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EntityMention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "context" TEXT,
    "sentiment" TEXT,
    "relevanceScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "RecognizedEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VectorSearchIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indexName" TEXT NOT NULL,
    "indexType" TEXT NOT NULL DEFAULT 'hnsw',
    "dimension" INTEGER NOT NULL DEFAULT 1536,
    "metric" TEXT NOT NULL DEFAULT 'cosine',
    "contentTypes" TEXT NOT NULL,
    "configuration" TEXT,
    "totalVectors" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastBuildAt" DATETIME,
    "buildDurationMs" INTEGER,
    "avgQueryTimeMs" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HybridSearchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "queryEmbedding" TEXT,
    "searchType" TEXT NOT NULL,
    "keywordResults" TEXT,
    "vectorResults" TEXT,
    "hybridResults" TEXT NOT NULL,
    "fusionAlgorithm" TEXT NOT NULL DEFAULT 'rrf',
    "keywordWeight" REAL NOT NULL DEFAULT 0.5,
    "vectorWeight" REAL NOT NULL DEFAULT 0.5,
    "totalResults" INTEGER NOT NULL,
    "queryTimeMs" INTEGER NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "clickedResultId" TEXT,
    "clickPosition" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmbeddingUpdateQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "processingStarted" DATETIME,
    "processingEnded" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VectorSearchMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricType" TEXT NOT NULL,
    "metricValue" REAL NOT NULL,
    "testQuery" TEXT,
    "expectedResults" TEXT,
    "actualResults" TEXT,
    "searchType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT
);

-- CreateIndex
CREATE INDEX "VectorEmbedding_contentType_isActive_idx" ON "VectorEmbedding"("contentType", "isActive");

-- CreateIndex
CREATE INDEX "VectorEmbedding_contentId_idx" ON "VectorEmbedding"("contentId");

-- CreateIndex
CREATE INDEX "VectorEmbedding_embeddingModel_idx" ON "VectorEmbedding"("embeddingModel");

-- CreateIndex
CREATE INDEX "VectorEmbedding_isActive_createdAt_idx" ON "VectorEmbedding"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VectorEmbedding_contentId_contentType_embeddingModel_key" ON "VectorEmbedding"("contentId", "contentType", "embeddingModel");

-- CreateIndex
CREATE INDEX "RecognizedEntity_entityType_isActive_idx" ON "RecognizedEntity"("entityType", "isActive");

-- CreateIndex
CREATE INDEX "RecognizedEntity_normalizedName_idx" ON "RecognizedEntity"("normalizedName");

-- CreateIndex
CREATE INDEX "RecognizedEntity_mentionCount_idx" ON "RecognizedEntity"("mentionCount");

-- CreateIndex
CREATE INDEX "RecognizedEntity_isVerified_idx" ON "RecognizedEntity"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "RecognizedEntity_normalizedName_entityType_key" ON "RecognizedEntity"("normalizedName", "entityType");

-- CreateIndex
CREATE INDEX "EntityMention_entityId_contentType_idx" ON "EntityMention"("entityId", "contentType");

-- CreateIndex
CREATE INDEX "EntityMention_contentId_entityId_idx" ON "EntityMention"("contentId", "entityId");

-- CreateIndex
CREATE INDEX "EntityMention_createdAt_idx" ON "EntityMention"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VectorSearchIndex_indexName_key" ON "VectorSearchIndex"("indexName");

-- CreateIndex
CREATE INDEX "VectorSearchIndex_status_idx" ON "VectorSearchIndex"("status");

-- CreateIndex
CREATE INDEX "VectorSearchIndex_indexName_idx" ON "VectorSearchIndex"("indexName");

-- CreateIndex
CREATE INDEX "HybridSearchLog_searchType_createdAt_idx" ON "HybridSearchLog"("searchType", "createdAt");

-- CreateIndex
CREATE INDEX "HybridSearchLog_userId_createdAt_idx" ON "HybridSearchLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HybridSearchLog_query_idx" ON "HybridSearchLog"("query");

-- CreateIndex
CREATE INDEX "HybridSearchLog_createdAt_idx" ON "HybridSearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingUpdateQueue_status_priority_createdAt_idx" ON "EmbeddingUpdateQueue"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingUpdateQueue_contentId_contentType_idx" ON "EmbeddingUpdateQueue"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "EmbeddingUpdateQueue_status_idx" ON "EmbeddingUpdateQueue"("status");

-- CreateIndex
CREATE INDEX "VectorSearchMetrics_metricType_timestamp_idx" ON "VectorSearchMetrics"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "VectorSearchMetrics_searchType_idx" ON "VectorSearchMetrics"("searchType");

-- CreateIndex
CREATE INDEX "VectorSearchMetrics_timestamp_idx" ON "VectorSearchMetrics"("timestamp");
