// Imo Agent Types - Shared type definitions for Imo prompt engineering system

// ============================================
// CORE IMO TYPES
// ============================================

/**
 * Prompt generation strategies supported by Imo
 */
export type ImoPromptStrategy = 
  | 'simple'           // Single-step direct prompt
  | 'chain'            // Multi-step prompt chaining
  | 'writer_editor'    // Two-step reasoning + writing (SEO articles)
  | 'rag_enhanced'     // RAG-augmented prompting (search)
  | 'negative'         // Include negative prompts (image/video)
  | 'hybrid';          // Combination of strategies

/**
 * Content types for prompt generation
 */
export type ImoContentType = 
  | 'article'
  | 'image'
  | 'video'
  | 'translation'
  | 'seo'
  | 'social'
  | 'summary'
  | 'analysis'
  | 'search_response';

/**
 * Quality assessment result
 */
export interface ImoQualityAssessment {
  clarityScore: number;        // 0-1: How clear the prompt is
  specificity: number;         // 0-1: How specific/detailed
  contextRichness: number;     // 0-1: Amount of context provided
  expectedQuality: 'low' | 'medium' | 'high' | 'exceptional';
}

/**
 * Model configuration suggestions
 */
export interface ImoModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * RAG context for prompts
 */
export interface ImoRAGContext {
  sourcesUsed: number;
  relevantSnippets: string[];
  confidenceScore: number;
}

/**
 * Prompt chain step
 */
export interface ImoChainStep {
  stepNumber: number;
  purpose: string;
  prompt: string;
  expectedOutput?: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Base request for Imo prompt generation
 */
export interface ImoPromptRequest {
  contentType: ImoContentType;
  strategy: ImoPromptStrategy;
  context: ImoPromptContext;
  options?: ImoPromptOptions;
}

/**
 * Context for prompt generation
 */
export interface ImoPromptContext {
  // Core context
  topic?: string;
  targetAudience?: 'beginner' | 'intermediate' | 'expert' | 'general';
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'formal';
  
  // Content-specific
  keywords?: string[];
  africanFocus?: boolean;
  language?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  
  // Image/Video specific
  visualStyle?: string;
  aspectRatio?: string;
  quality?: 'standard' | 'hd' | 'ultra';
  
  // SEO specific
  targetKeywords?: string[];
  competitorUrls?: string[];
  wordCount?: number;
  
  // RAG specific
  searchQuery?: string;
  contextDocs?: Array<{
    title: string;
    content: string;
    url?: string;
    relevance?: number;
  }>;
  
  // Article specific
  articleTitle?: string;
  category?: string;
  
  // Custom
  customInstructions?: string;
  metadata?: Record<string, any>;
}

/**
 * Options for prompt generation
 */
export interface ImoPromptOptions {
  maxSteps?: number;
  includeNegativePrompt?: boolean;
  enableRAG?: boolean;
  temperature?: number;
  returnIntermediateSteps?: boolean;
  optimizeForModel?: 'gpt4' | 'llama' | 'gemini' | 'dalle' | 'stable-diffusion';
}

/**
 * Generated prompt result
 */
export interface ImoPromptResult {
  prompt: string | string[];
  negativePrompt?: string;
  strategy: ImoPromptStrategy;
  steps?: ImoChainStep[];
  modelConfig?: ImoModelConfig;
  quality: ImoQualityAssessment;
  processingTime: number;
  tokensEstimate?: number;
  ragContext?: ImoRAGContext;
}

// ============================================
// AGENT-SPECIFIC TYPES
// ============================================

/**
 * Image generation with Imo
 */
export interface ImoImageRequest {
  type: 'hero' | 'thumbnail' | 'social' | 'banner' | 'infographic';
  articleTitle?: string;
  articleSummary?: string;
  category?: string;
  keywords?: string[];
  africanFocus?: boolean;
  platform?: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  quality?: 'standard' | 'hd';
}

export interface ImoImageResult {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  metadata: {
    type: string;
    size: string;
    quality: string;
    processingTime: number;
    promptQuality: string;
    imoEnhanced: boolean;
  };
}

/**
 * Content generation with Imo (Writer-Editor pattern)
 */
export interface ImoContentRequest {
  type: 'article' | 'summary' | 'social' | 'seo';
  topic: string;
  keywords?: string[];
  targetAudience?: 'beginner' | 'intermediate' | 'expert' | 'general';
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  africanFocus?: boolean;
  useRAG?: boolean;
  competitorUrls?: string[];
}

export interface ImoContentResult {
  content: string;
  metadata: {
    wordCount: number;
    readabilityScore: number;
    seoScore: number;
    keywordsUsed: string[];
    processingTime: number;
    imoEnhanced: boolean;
    ragEnhanced: boolean;
    promptStrategy: string;
  };
  outline?: {
    title: string;
    sections: string[];
    targetKeywords: string[];
  };
  ragSources?: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
}

/**
 * Translation with Imo (2-step chaining)
 */
export interface ImoTranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentType?: 'article' | 'headline' | 'social_post' | 'meta_description';
  preserveTerms?: string[];
  useLLM?: boolean;
}

export interface ImoTranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  metadata: {
    wordCount: number;
    processingTime: number;
    qualityScore: number;
    preservedTerms: string[];
    toneAnalysis?: string;
    imoEnhanced: boolean;
    method: 'llm' | 'nllb';
  };
  chainSteps?: {
    terminology: string[];
    tone: string;
    culturalContext: string[];
  };
}

/**
 * RAG search with Imo
 */
export interface ImoSearchRequest {
  query: string;
  maxSources?: number;
  dateRange?: 'day' | 'week' | 'month' | 'year';
  africanFocus?: boolean;
}

export interface ImoSearchResult {
  response: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  metadata: {
    processingTime: number;
    sourcesUsed: number;
    confidenceScore: number;
  };
}

// ============================================
// AGENT TASK TYPES (for orchestrator)
// ============================================

/**
 * Extended AI task types including Imo operations
 */
export type ImoTaskType = 
  | 'imo.prompt.simple'
  | 'imo.prompt.chain'
  | 'imo.prompt.writer_editor'
  | 'imo.prompt.rag'
  | 'imo.prompt.negative'
  | 'imo.image.hero'
  | 'imo.image.social'
  | 'imo.content.article'
  | 'imo.content.seo'
  | 'imo.content.summary'
  | 'imo.translation.chain'
  | 'imo.translation.batch'
  | 'imo.search.rag';

/**
 * Imo agent capability
 */
export type ImoCapability = 
  | 'prompt_engineering'
  | 'prompt_chaining'
  | 'negative_prompting'
  | 'rag_integration'
  | 'writer_editor_pattern'
  | 'multi_language_translation'
  | 'seo_optimization'
  | 'image_prompt_optimization'
  | 'video_prompt_optimization';

/**
 * Imo agent definition
 */
export interface ImoAgent {
  id: string;
  name: 'Imo';
  version: string;
  capabilities: ImoCapability[];
  status: 'idle' | 'busy' | 'error' | 'offline';
  performance: {
    totalPrompts: number;
    avgQualityScore: number;
    avgProcessingTime: number;
    successRate: number;
  };
}

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Imo configuration
 */
export interface ImoConfig {
  defaultStrategy: ImoPromptStrategy;
  enableRAG: boolean;
  enableCaching: boolean;
  cacheTTL: number;
  maxChainSteps: number;
  defaultModelConfig: ImoModelConfig;
  africanFocusDefault: boolean;
  supportedLanguages: string[];
  cryptoGlossary: string[];
}

/**
 * Default Imo configuration
 */
export const DEFAULT_IMO_CONFIG: ImoConfig = {
  defaultStrategy: 'chain',
  enableRAG: true,
  enableCaching: true,
  cacheTTL: 1000 * 60 * 30, // 30 minutes
  maxChainSteps: 3,
  defaultModelConfig: {
    temperature: 0.7,
    maxTokens: 1500,
    topP: 0.9
  },
  africanFocusDefault: true,
  supportedLanguages: [
    'en', 'sw', 'am', 'ha', 'yo', 'ig', 'zu', 
    'af', 'so', 'rw', 'lg', 'sn', 'fr', 'ar', 'pt'
  ],
  cryptoGlossary: [
    'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'blockchain', 'DeFi',
    'NFT', 'HODL', 'staking', 'yield farming', 'liquidity pool',
    'smart contract', 'gas fee', 'wallet', 'dApp', 'DAO',
    'Binance', 'Luno', 'Quidax', 'USDT', 'USDC'
  ]
};
