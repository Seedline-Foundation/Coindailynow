/**
 * Type declarations for Task 71 & 72 Prisma models
 * Extends PrismaClient to include new models from recent migrations
 */

import '@prisma/client';

declare module '@prisma/client' {
  // Task 71: RAO Content Structuring Models
  export interface PrismaClient {
    contentChunk: any;
    canonicalAnswer: any;
    contentFAQ: any;
    contentGlossary: any;
    structuredContent: any;
    rAOPerformance: any;
    
    // Task 72: Semantic Embedding & Vector Index Models
    vectorEmbedding: any;
    recognizedEntity: any;
    entityMention: any;
    vectorSearchIndex: any;
    hybridSearchLog: any;
    embeddingUpdateQueue: any;
    vectorSearchMetrics: any;
  }
}
