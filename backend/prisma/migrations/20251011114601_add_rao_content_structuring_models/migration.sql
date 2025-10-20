-- CreateTable
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "embedding" TEXT,
    "semanticScore" REAL,
    "entities" TEXT,
    "keywords" TEXT,
    "context" TEXT,
    "sourceReferences" TEXT,
    "llmOptimized" BOOLEAN NOT NULL DEFAULT true,
    "qualityScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CanonicalAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "sources" TEXT,
    "relatedQuestions" TEXT,
    "factClaims" TEXT,
    "keywords" TEXT,
    "llmFormat" TEXT NOT NULL,
    "qualityScore" REAL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentFAQ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL,
    "searchVolume" INTEGER,
    "difficulty" REAL,
    "position" INTEGER NOT NULL,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT true,
    "isHumanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentGlossary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "complexity" TEXT NOT NULL DEFAULT 'beginner',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "relatedTerms" TEXT,
    "externalLinks" TEXT,
    "position" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StructuredContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "faqCount" INTEGER NOT NULL DEFAULT 0,
    "glossaryCount" INTEGER NOT NULL DEFAULT 0,
    "canonicalAnswerCount" INTEGER NOT NULL DEFAULT 0,
    "overallQualityScore" REAL,
    "llmReadabilityScore" REAL,
    "semanticCoherence" REAL,
    "entityDensity" REAL,
    "factDensity" REAL,
    "lastProcessedAt" DATETIME,
    "processingTimeMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RAOPerformanceMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,
    "comparisonToPrevious" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ContentChunk_articleId_chunkType_idx" ON "ContentChunk"("articleId", "chunkType");

-- CreateIndex
CREATE INDEX "ContentChunk_chunkType_idx" ON "ContentChunk"("chunkType");

-- CreateIndex
CREATE INDEX "ContentChunk_semanticScore_idx" ON "ContentChunk"("semanticScore");

-- CreateIndex
CREATE INDEX "ContentChunk_llmOptimized_idx" ON "ContentChunk"("llmOptimized");

-- CreateIndex
CREATE UNIQUE INDEX "ContentChunk_articleId_chunkIndex_key" ON "ContentChunk"("articleId", "chunkIndex");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_articleId_idx" ON "CanonicalAnswer"("articleId");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_answerType_idx" ON "CanonicalAnswer"("answerType");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_confidence_idx" ON "CanonicalAnswer"("confidence");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_isVerified_idx" ON "CanonicalAnswer"("isVerified");

-- CreateIndex
CREATE INDEX "ContentFAQ_articleId_position_idx" ON "ContentFAQ"("articleId", "position");

-- CreateIndex
CREATE INDEX "ContentFAQ_questionType_idx" ON "ContentFAQ"("questionType");

-- CreateIndex
CREATE INDEX "ContentFAQ_relevanceScore_idx" ON "ContentFAQ"("relevanceScore");

-- CreateIndex
CREATE INDEX "ContentGlossary_articleId_position_idx" ON "ContentGlossary"("articleId", "position");

-- CreateIndex
CREATE INDEX "ContentGlossary_category_idx" ON "ContentGlossary"("category");

-- CreateIndex
CREATE INDEX "ContentGlossary_complexity_idx" ON "ContentGlossary"("complexity");

-- CreateIndex
CREATE INDEX "ContentGlossary_term_idx" ON "ContentGlossary"("term");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGlossary_articleId_term_key" ON "ContentGlossary"("articleId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "StructuredContent_articleId_key" ON "StructuredContent"("articleId");

-- CreateIndex
CREATE INDEX "StructuredContent_status_idx" ON "StructuredContent"("status");

-- CreateIndex
CREATE INDEX "StructuredContent_overallQualityScore_idx" ON "StructuredContent"("overallQualityScore");

-- CreateIndex
CREATE INDEX "StructuredContent_lastProcessedAt_idx" ON "StructuredContent"("lastProcessedAt");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_articleId_metricType_idx" ON "RAOPerformanceMetric"("articleId", "metricType");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_metricType_timestamp_idx" ON "RAOPerformanceMetric"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_source_idx" ON "RAOPerformanceMetric"("source");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_timestamp_idx" ON "RAOPerformanceMetric"("timestamp");
