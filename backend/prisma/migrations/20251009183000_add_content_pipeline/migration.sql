-- Migration: Add ContentPipeline model for Task 9.1
-- This migration adds the content_pipeline table for tracking automated content generation pipelines

-- CreateTable: ContentPipeline
CREATE TABLE IF NOT EXISTS "ContentPipeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT,
    "status" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" REAL,
    "stages" TEXT,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentPipeline_status_idx" ON "ContentPipeline"("status");
CREATE INDEX IF NOT EXISTS "ContentPipeline_articleId_idx" ON "ContentPipeline"("articleId");
CREATE INDEX IF NOT EXISTS "ContentPipeline_startedAt_idx" ON "ContentPipeline"("startedAt");
CREATE INDEX IF NOT EXISTS "ContentPipeline_completedAt_idx" ON "ContentPipeline"("completedAt");

-- Add SystemConfiguration table if not exists (for pipeline config)
CREATE TABLE IF NOT EXISTS "SystemConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SystemConfiguration_key_key" ON "SystemConfiguration"("key");

-- Insert default pipeline configuration (only if not exists)
INSERT OR IGNORE INTO "SystemConfiguration" ("id", "key", "value", "description")
VALUES (
    lower(hex(randomblob(16))),
    'content_pipeline',
    '{"autoPublishThreshold": 0.8, "breakingNewsTimeout": 10, "translationTimeout": 30, "imageGenerationTimeout": 5, "targetLanguages": ["en", "sw", "ha", "yo", "ig", "am", "zu", "es", "pt", "it", "de", "fr", "ru"], "enableAutoPublish": true, "enableTranslationAutomation": true, "enableImageGeneration": true, "enableSEOOptimization": true, "maxConcurrentPipelines": 10}',
    'Content Pipeline Automation Configuration'
);

-- Add aiGenerated and seoKeywords columns to Article table if not exist
-- Note: SQLite doesn't support IF NOT EXISTS for ADD COLUMN
-- These will fail silently if columns already exist (catch in application code)

-- Add aiGenerated column (will fail silently if exists)
-- ALTER TABLE "Article" ADD COLUMN "aiGenerated" INTEGER DEFAULT 0;

-- Add seoKeywords column (will fail silently if exists)
-- ALTER TABLE "Article" ADD COLUMN "seoKeywords" TEXT;

-- Note: Commented out to prevent migration errors if columns already exist
-- Run manually if needed, or handle via schema.prisma changes
