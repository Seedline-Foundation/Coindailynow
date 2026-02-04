// Imo-Enhanced Translation Agent
// Uses 2-step prompt chaining for high-quality translations

/// <reference types="node" />
// Audit logging (stubbed for standalone usage)
const createAuditLog = async (action: string, data: any) => { /* stub */ };
const AuditActions = { IMO_TRANSLATION: 'imo_translation' };
import { imoService } from './imo-service';

// Supported African languages
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nllbCode: 'eng_Latn' },
  'sw': { name: 'Swahili', nllbCode: 'swh_Latn' },
  'am': { name: 'Amharic', nllbCode: 'amh_Ethi' },
  'ha': { name: 'Hausa', nllbCode: 'hau_Latn' },
  'yo': { name: 'Yoruba', nllbCode: 'yor_Latn' },
  'ig': { name: 'Igbo', nllbCode: 'ibo_Latn' },
  'zu': { name: 'Zulu', nllbCode: 'zul_Latn' },
  'af': { name: 'Afrikaans', nllbCode: 'afr_Latn' },
  'so': { name: 'Somali', nllbCode: 'som_Latn' },
  'rw': { name: 'Kinyarwanda', nllbCode: 'kin_Latn' },
  'lg': { name: 'Luganda', nllbCode: 'lug_Latn' },
  'sn': { name: 'Shona', nllbCode: 'sna_Latn' },
  'fr': { name: 'French', nllbCode: 'fra_Latn' },
  'ar': { name: 'Arabic', nllbCode: 'arb_Arab' },
  'pt': { name: 'Portuguese', nllbCode: 'por_Latn' }
} as const;

// Crypto terminology that should NOT be translated
const CRYPTO_GLOSSARY = [
  'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'blockchain', 'DeFi', 
  'NFT', 'HODL', 'staking', 'yield farming', 'liquidity pool',
  'smart contract', 'gas fee', 'wallet', 'dApp', 'DAO',
  'altcoin', 'memecoin', 'whitepaper', 'airdrop', 'ICO', 'IDO',
  'Binance', 'Coinbase', 'Luno', 'Quidax', 'USDT', 'USDC'
];

export interface EnhancedTranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentType?: 'article' | 'headline' | 'social_post' | 'meta_description';
  preserveTerms?: string[];
  useLLM?: boolean; // Use LLM for high-quality translation
}

export interface EnhancedTranslationResult {
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
 * Imo-Enhanced Translation Agent
 * Uses 2-step prompt chaining:
 * 1. Extract terminology and tone
 * 2. Translate with preserved context
 */
export class ImoTranslationAgent {
  private llmApiKey: string;
  private nllbApiKey: string;
  private llmBaseUrl: string = 'https://api.openai.com/v1';
  private nllbBaseUrl: string = 'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M';
  private isInitialized: boolean = false;
  private cache: Map<string, EnhancedTranslationResult> = new Map();

  constructor() {
    this.llmApiKey = process.env.OPENAI_API_KEY || '';
    this.nllbApiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async initialize(): Promise<void> {
    await imoService.initialize();
    this.isInitialized = true;

    await createAuditLog({
      action: AuditActions.SETTINGS_UPDATE,
      resource: 'imo_translation_agent',
      resourceId: 'imo-translate',
      details: {
        initialized: true,
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
        imoEnhanced: true,
        methods: { llm: !!this.llmApiKey, nllb: !!this.nllbApiKey }
      }
    });
  }

  /**
   * Translate with Imo 2-step prompt chaining
   */
  async translate(request: EnhancedTranslationRequest): Promise<EnhancedTranslationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, metadata: { ...cached.metadata, processingTime: 0 } };
    }

    try {
      // Use LLM for high-quality translations if available
      if (request.useLLM && this.llmApiKey) {
        return await this.translateWithLLM(request, startTime);
      }

      // Fall back to NLLB for direct translation
      return await this.translateWithNLLB(request, startTime);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'imo_translation',
        resourceId: 'error',
        details: { error: errorMessage }
      });

      throw error;
    }
  }

  /**
   * High-quality translation using LLM with 2-step chaining
   */
  private async translateWithLLM(
    request: EnhancedTranslationRequest,
    startTime: number
  ): Promise<EnhancedTranslationResult> {
    // STEP 1: Use Imo to generate chained translation prompts
    const imoResult = await imoService.generateTranslationPrompt({
      sourceText: request.text,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      contentType: request.contentType,
      preserveTerms: [...CRYPTO_GLOSSARY, ...(request.preserveTerms || [])]
    });

    const prompts = Array.isArray(imoResult.prompt) 
      ? imoResult.prompt 
      : [imoResult.prompt];

    // STEP 1: Extract terminology and tone
    const extractionPrompt = `${prompts[0]}

TEXT:
${request.text}`;

    const extraction = await this.callLLM(extractionPrompt, 0.3, 500);
    
    // Parse extraction results
    const chainSteps = this.parseExtractionResults(extraction);

    // STEP 2: Translate with context
    const translationPrompt = `${prompts[1] || 'Translate the following text:'}

EXTRACTED CONTEXT:
- Terminology to preserve: ${chainSteps.terminology.join(', ')}
- Tone: ${chainSteps.tone}
- Cultural context: ${chainSteps.culturalContext.join(', ')}

TARGET LANGUAGE: ${this.getLanguageName(request.targetLanguage)}

TEXT TO TRANSLATE:
${request.text}`;

    const translatedText = await this.callLLM(translationPrompt, 0.5, 2000);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(
      request.text, 
      translatedText, 
      chainSteps.terminology
    );

    const result: EnhancedTranslationResult = {
      translatedText,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      metadata: {
        wordCount: request.text.split(/\s+/).length,
        processingTime: Date.now() - startTime,
        qualityScore,
        preservedTerms: chainSteps.terminology,
        toneAnalysis: chainSteps.tone,
        imoEnhanced: true,
        method: 'llm'
      },
      chainSteps
    };

    // Cache result
    this.cache.set(this.getCacheKey(request), result);

    await createAuditLog({
      action: AuditActions.ARTICLE_UPDATE,
      resource: 'imo_translation',
      resourceId: `${request.sourceLanguage}-${request.targetLanguage}`,
      details: {
        method: 'llm',
        wordCount: result.metadata.wordCount,
        qualityScore,
        preservedTerms: chainSteps.terminology.length
      }
    });

    return result;
  }

  /**
   * Direct translation using NLLB (fallback)
   */
  private async translateWithNLLB(
    request: EnhancedTranslationRequest,
    startTime: number
  ): Promise<EnhancedTranslationResult> {
    const sourceCode = this.getNLLBCode(request.sourceLanguage);
    const targetCode = this.getNLLBCode(request.targetLanguage);

    if (!sourceCode || !targetCode) {
      throw new Error(`Unsupported language pair: ${request.sourceLanguage} -> ${request.targetLanguage}`);
    }

    const response = await fetch(this.nllbBaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.nllbApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: request.text,
        parameters: {
          src_lang: sourceCode,
          tgt_lang: targetCode
        }
      })
    });

    if (!response.ok) {
      throw new Error(`NLLB translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data[0]?.translation_text || data.translation_text || '';

    const result: EnhancedTranslationResult = {
      translatedText,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      metadata: {
        wordCount: request.text.split(/\s+/).length,
        processingTime: Date.now() - startTime,
        qualityScore: 0.75, // Default score for NLLB
        preservedTerms: [],
        imoEnhanced: false,
        method: 'nllb'
      }
    };

    return result;
  }

  /**
   * Batch translate to multiple languages
   */
  async batchTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguages: string[],
    useLLM: boolean = true
  ): Promise<Map<string, EnhancedTranslationResult>> {
    const results = new Map<string, EnhancedTranslationResult>();

    // Process in parallel (with concurrency limit)
    const batchSize = 3;
    for (let i = 0; i < targetLanguages.length; i += batchSize) {
      const batch = targetLanguages.slice(i, i + batchSize);
      const promises = batch.map(lang => 
        this.translate({
          text,
          sourceLanguage,
          targetLanguage: lang,
          useLLM
        }).then(result => ({ lang, result }))
      );

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ lang, result }) => results.set(lang, result));
    }

    return results;
  }

  /**
   * Helper: Call LLM
   */
  private async callLLM(
    prompt: string, 
    temperature: number, 
    maxTokens: number
  ): Promise<string> {
    const response = await fetch(`${this.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.llmApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert translator specializing in cryptocurrency and financial content for African markets. Preserve technical terminology and adapt cultural context appropriately.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      throw new Error(`LLM call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse extraction results from step 1
   */
  private parseExtractionResults(extraction: string): {
    terminology: string[];
    tone: string;
    culturalContext: string[];
  } {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(extraction);
      return {
        terminology: parsed.terminology || parsed.terms || [],
        tone: parsed.tone || 'professional',
        culturalContext: parsed.culturalContext || parsed.cultural_context || []
      };
    } catch {
      // Fall back to regex extraction
      const termMatch = extraction.match(/terminology[:\s]+([^\n]+)/i);
      const toneMatch = extraction.match(/tone[:\s]+([^\n]+)/i);
      
      return {
        terminology: termMatch 
          ? termMatch[1].split(',').map(t => t.trim()) 
          : CRYPTO_GLOSSARY.slice(0, 10),
        tone: toneMatch ? toneMatch[1].trim() : 'professional',
        culturalContext: []
      };
    }
  }

  /**
   * Calculate translation quality score
   */
  private calculateQualityScore(
    source: string, 
    translated: string,
    preservedTerms: string[]
  ): number {
    let score = 0.7; // Base score

    // Check length ratio (should be similar)
    const lengthRatio = translated.length / Math.max(source.length, 1);
    if (lengthRatio >= 0.7 && lengthRatio <= 1.5) {
      score += 0.1;
    }

    // Check preserved terms
    const translatedLower = translated.toLowerCase();
    const preservedCount = preservedTerms.filter(
      term => translatedLower.includes(term.toLowerCase())
    ).length;
    const preservationRate = preservedCount / Math.max(preservedTerms.length, 1);
    score += preservationRate * 0.15;

    // Check for common translation issues
    if (!translated.includes('???') && !translated.includes('[untranslated]')) {
      score += 0.05;
    }

    return Math.min(1, Math.round(score * 100) / 100);
  }

  /**
   * Helper methods
   */
  private getCacheKey(request: EnhancedTranslationRequest): string {
    return `${request.sourceLanguage}-${request.targetLanguage}-${request.text.substring(0, 100)}`;
  }

  private getLanguageName(code: string): string {
    return SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES]?.name || code;
  }

  private getNLLBCode(code: string): string | undefined {
    return SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES]?.nllbCode;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }
}

export const imoTranslationAgent = new ImoTranslationAgent();
