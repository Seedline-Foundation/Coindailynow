-- Structured LLM/RAG content schema extensions
-- Adds article enrichment fields, knowledge graph entities mapping tables,
-- and regulatory event timeline fields for /api/v1 structured feeds.

ALTER TABLE "Article"
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS "territory" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "sentimentScore" NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS "urgencyLevel" INTEGER,
  ADD COLUMN IF NOT EXISTS "keyFacts" JSONB,
  ADD COLUMN IF NOT EXISTS "speakableContent" TEXT,
  ADD COLUMN IF NOT EXISTS "factCheckStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "correctionOfId" TEXT,
  ADD COLUMN IF NOT EXISTS "lastIndexedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "citationCount" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF to_regclass('public."Article"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'Article_correctionOfId_fkey'
         AND conrelid = to_regclass('public."Article"')
     ) THEN
    ALTER TABLE "Article"
      ADD CONSTRAINT "Article_correctionOfId_fkey"
      FOREIGN KEY ("correctionOfId") REFERENCES "Article"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Article_language_publishedAt_idx" ON "Article"("language", "publishedAt");
CREATE INDEX IF NOT EXISTS "Article_factCheckStatus_idx" ON "Article"("factCheckStatus");

CREATE TABLE IF NOT EXISTS "entities" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "officialNames" JSONB,
  "aliases" JSONB,
  "identifiers" JSONB,
  "jurisdiction" CHAR(2),
  "parentEntityId" TEXT,
  "cryptoType" TEXT,
  "consensusMechanism" TEXT,
  "launchDate" DATE,
  "authorityType" TEXT,
  "regulatoryStance" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "entities_parentEntityId_fkey"
    FOREIGN KEY ("parentEntityId") REFERENCES "entities"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "entities_entityType_idx" ON "entities"("entityType");
CREATE INDEX IF NOT EXISTS "entities_jurisdiction_idx" ON "entities"("jurisdiction");

CREATE TABLE IF NOT EXISTS "article_entities" (
  "articleId" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "role" TEXT,
  "sentiment" NUMERIC(3, 2),
  PRIMARY KEY ("articleId", "entityId"),
  CONSTRAINT "article_entities_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "Article"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "article_entities_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "entities"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "article_entities_entityId_role_idx" ON "article_entities"("entityId", "role");

DO $$
BEGIN
  IF to_regclass('public.regulatory_events') IS NOT NULL THEN
    ALTER TABLE "regulatory_events"
      ADD COLUMN IF NOT EXISTS "regulatoryBodyId" TEXT,
      ADD COLUMN IF NOT EXISTS "effectiveDate" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "documentUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "citationReference" TEXT,
      ADD COLUMN IF NOT EXISTS "impactLevel" TEXT,
      ADD COLUMN IF NOT EXISTS "marketImpactData" JSONB,
      ADD COLUMN IF NOT EXISTS "articleId" TEXT;
  ELSE
    RAISE NOTICE 'Skipping regulatory_events alteration because table does not exist';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.regulatory_events') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'regulatory_events_regulatoryBodyId_fkey'
         AND conrelid = to_regclass('public.regulatory_events')
     ) THEN
    ALTER TABLE "regulatory_events"
      ADD CONSTRAINT "regulatory_events_regulatoryBodyId_fkey"
      FOREIGN KEY ("regulatoryBodyId") REFERENCES "entities"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.regulatory_events') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'regulatory_events_articleId_fkey'
         AND conrelid = to_regclass('public.regulatory_events')
     ) THEN
    ALTER TABLE "regulatory_events"
      ADD CONSTRAINT "regulatory_events_articleId_fkey"
      FOREIGN KEY ("articleId") REFERENCES "Article"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.regulatory_events') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "regulatory_events_articleId_idx" ON "regulatory_events"("articleId");
    CREATE INDEX IF NOT EXISTS "regulatory_events_regulatoryBodyId_idx" ON "regulatory_events"("regulatoryBodyId");
  END IF;
END $$;
