// Translation Agent - Meta NLLB-powered translation for African languages
// Handles multi-language content translation with focus on African languages

import { createAuditLog } from '../../../lib/audit';
import { AuditActions } from '../../../lib/audit';

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: {
    contentType?: 'article' | 'headline' | 'social_post' | 'meta_description';
    preserveFormatting?: boolean;
    glossary?: Record<string, string>; // Term translations to maintain consistency
    tone?: 'formal' | 'casual' | 'technical';
  };
  options?: {
    quality?: 'fast' | 'balanced' | 'high';
    returnAlternatives?: boolean;
    preserveKeywords?: string[];
  };
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  metadata: {
    wordCount: number;
    processingTime: number;
    qualityScore: number;
    detectedLanguage?: string;
  };
  alternatives?: string[];
  glossaryMatches?: Record<string, string>;
}

// Supported African languages with NLLB language codes
export const AFRICAN_LANGUAGES = {
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
  'fr': { name: 'French', nllbCode: 'fra_Latn' }, // For francophone Africa
  'ar': { name: 'Arabic', nllbCode: 'arb_Arab' }, // For North Africa
  'pt': { name: 'Portuguese', nllbCode: 'por_Latn' } // For lusophone Africa
} as const;

export class TranslationAgent {
  private apiKey: string;
  private baseUrl: string = 'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M';
  private isInitialized: boolean = false;
  private cache: Map<string, TranslationResult> = new Map();

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    try {
      // Test API connection with a simple translation
      const testResponse = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'Hello world',
          parameters: {
            src_lang: 'eng_Latn',
            tgt_lang: 'fra_Latn'
          }
        })
      });

      if (!testResponse.ok) {
        throw new Error(`NLLB API connection failed: ${testResponse.statusText}`);
      }

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'translation_agent',
        resourceId: 'nllb',
        details: { 
          initialized: true, 
          supportedLanguages: Object.keys(AFRICAN_LANGUAGES).length,
          model: 'facebook/nllb-200-distilled-600M'
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'translation_agent',
        resourceId: 'nllb',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Validate language codes
      const sourceNllbCode = this.getLanguageCode(request.sourceLanguage);
      const targetNllbCode = this.getLanguageCode(request.targetLanguage);

      if (!sourceNllbCode || !targetNllbCode) {
        throw new Error(`Unsupported language pair: ${request.sourceLanguage} -> ${request.targetLanguage}`);
      }

      // Pre-process text if needed
      const processedText = this.preprocessText(request.text, request.context);

      // Apply glossary replacements for consistency
      const textToTranslate = processedText;
      const glossaryMatches: Record<string, string> = {};
      
      if (request.context?.glossary) {
        for (const [term, translation] of Object.entries(request.context.glossary)) {
          if (processedText.toLowerCase().includes(term.toLowerCase())) {
            glossaryMatches[term] = translation;
            // We'll apply glossary after translation to avoid confusion
          }
        }
      }

      // Make translation request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: textToTranslate,
          parameters: {
            src_lang: sourceNllbCode,
            tgt_lang: targetNllbCode,
            max_length: this.getMaxLength(request.context?.contentType),
            temperature: this.getTemperature(request.options?.quality)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      let translatedText = data[0]?.translation_text || data.translation_text;

      if (!translatedText) {
        throw new Error('No translation returned from NLLB API');
      }

      // Post-process translation
      translatedText = this.postprocessText(translatedText, request.context);

      // Apply glossary replacements
      if (Object.keys(glossaryMatches).length > 0) {
        translatedText = this.applyGlossary(translatedText, glossaryMatches);
      }

      const processingTime = Date.now() - startTime;
      const wordCount = request.text.split(/\s+/).filter(word => word.length > 0).length;

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(request.text, translatedText, request);

      const result: TranslationResult = {
        translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: this.calculateConfidence(qualityScore, wordCount),
        metadata: {
          wordCount,
          processingTime,
          qualityScore
        },
        glossaryMatches: Object.keys(glossaryMatches).length > 0 ? glossaryMatches : undefined
      };

      // Cache result
      this.cache.set(cacheKey, result);

      // Log successful translation
      await createAuditLog({
        action: AuditActions.ARTICLE_UPDATE,
        resource: 'translation',
        resourceId: `${request.sourceLanguage}_${request.targetLanguage}`,
        details: {
          wordCount,
          processingTime,
          qualityScore,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          cached: false
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'translation',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage
        }
      });

      throw new Error(`Translation failed: ${errorMessage}`);
    }
  }

  async batchTranslate(
    texts: string[], 
    sourceLanguage: string, 
    targetLanguages: string[]
  ): Promise<Record<string, TranslationResult[]>> {
    const results: Record<string, TranslationResult[]> = {};

    for (const targetLang of targetLanguages) {
      results[targetLang] = [];
      
      for (const text of texts) {
        try {
          const result = await this.translateText({
            text,
            sourceLanguage,
            targetLanguage: targetLang,
            options: { quality: 'balanced' }
          });
          results[targetLang].push(result);
        } catch (error) {
          // Log error but continue with other translations
          console.error(`Batch translation error for ${targetLang}:`, error);
        }
      }
    }

    return results;
  }

  getSupportedLanguages(): typeof AFRICAN_LANGUAGES {
    return AFRICAN_LANGUAGES;
  }

  private getLanguageCode(language: string): string | null {
    const langInfo = AFRICAN_LANGUAGES[language as keyof typeof AFRICAN_LANGUAGES];
    return langInfo?.nllbCode || null;
  }

  private generateCacheKey(request: TranslationRequest): string {
    return `${request.sourceLanguage}_${request.targetLanguage}_${request.text.substring(0, 50)}_${JSON.stringify(request.context)}`;
  }

  private preprocessText(text: string, context?: TranslationRequest['context']): string {
    let processed = text.trim();

    // Preserve certain formatting if requested
    if (context?.preserveFormatting) {
      // Mark special formatting for preservation
      processed = processed
        .replace(/\*\*(.*?)\*\*/g, '~~BOLD_START~~$1~~BOLD_END~~')
        .replace(/\*(.*?)\*/g, '~~ITALIC_START~~$1~~ITALIC_END~~')
        .replace(/\[(.*?)\]\((.*?)\)/g, '~~LINK_START~~$1~~LINK_MID~~$2~~LINK_END~~');
    }

    return processed;
  }

  private postprocessText(text: string, context?: TranslationRequest['context']): string {
    let processed = text.trim();

    // Restore formatting if it was preserved
    if (context?.preserveFormatting) {
      processed = processed
        .replace(/~~BOLD_START~~(.*?)~~BOLD_END~~/g, '**$1**')
        .replace(/~~ITALIC_START~~(.*?)~~ITALIC_END~~/g, '*$1*')
        .replace(/~~LINK_START~~(.*?)~~LINK_MID~~(.*?)~~LINK_END~~/g, '[$1]($2)');
    }

    return processed;
  }

  private applyGlossary(text: string, glossary: Record<string, string>): string {
    let result = text;
    
    for (const [source, target] of Object.entries(glossary)) {
      // Simple replacement - could be enhanced with more sophisticated matching
      const regex = new RegExp(`\\b${source}\\b`, 'gi');
      result = result.replace(regex, target);
    }
    
    return result;
  }

  private getMaxLength(contentType?: string): number {
    const maxLengths = {
      article: 2048,
      headline: 100,
      social_post: 500,
      meta_description: 200
    };

    return maxLengths[contentType as keyof typeof maxLengths] || 1024;
  }

  private getTemperature(quality?: string): number {
    const temperatures = {
      fast: 0.3,
      balanced: 0.2,
      high: 0.1
    };

    return temperatures[quality as keyof typeof temperatures] || 0.2;
  }

  private calculateQualityScore(source: string, translated: string, request: TranslationRequest): number {
    let score = 70; // Base score

    // Length similarity (should be reasonably close)
    const lengthRatio = translated.length / source.length;
    if (lengthRatio >= 0.7 && lengthRatio <= 1.5) {
      score += 10;
    }

    // Keyword preservation
    if (request.options?.preserveKeywords) {
      const preservedCount = request.options.preserveKeywords.filter(keyword =>
        translated.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += (preservedCount / request.options.preserveKeywords.length) * 15;
    }

    // Structure preservation (basic check for punctuation)
    const sourcePunctuation = (source.match(/[.!?;:]/g) || []).length;
    const translatedPunctuation = (translated.match(/[.!?;:]/g) || []).length;
    if (Math.abs(sourcePunctuation - translatedPunctuation) <= 1) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateConfidence(qualityScore: number, wordCount: number): number {
    let confidence = qualityScore / 100;

    // Adjust based on text length (longer texts might have more uncertainty)
    if (wordCount > 500) {
      confidence *= 0.95;
    } else if (wordCount < 50) {
      confidence *= 0.9; // Very short texts might lack context
    }

    return Math.min(1, Math.max(0, confidence));
  }

  async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          details: { 
            apiKey: !!this.apiKey, 
            supportedLanguages: Object.keys(AFRICAN_LANGUAGES).length,
            cacheSize: this.cache.size
          }
        };
      }

      // Quick API test
      const testResponse = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'test',
          parameters: {
            src_lang: 'eng_Latn',
            tgt_lang: 'fra_Latn'
          }
        })
      });

      return {
        status: testResponse.ok ? 'healthy' : 'api_error',
        details: {
          apiKey: !!this.apiKey,
          initialized: this.isInitialized,
          supportedLanguages: Object.keys(AFRICAN_LANGUAGES).length,
          cacheSize: this.cache.size,
          apiStatus: testResponse.status
        }
      };

    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          initialized: this.isInitialized,
          cacheSize: this.cache.size
        }
      };
    }
  }

  // Clear cache to free memory
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10) // First 10 keys for debugging
    };
  }
}

// Export singleton instance
export const translationAgent = new TranslationAgent();
