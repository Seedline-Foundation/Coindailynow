/**
 * Translation Agent - Uses NLLB-200 Distilled 600M
 * Lightweight translation model for 15 African languages with crypto terminology preservation
 */

import { Logger } from 'winston';
import { TranslationOutcome, ArticleOutcome } from '../../types/admin-types';
import { MODEL_CONFIG } from '../../config/model-config';

interface TranslationPrompt {
  language: string;
  language_code: string;
  step1_prompt: string; // Extract crypto terms
  step2_prompt: string; // Translate with preservation
}

export class TranslationAgentForReview {
  private apiEndpoint: string;
  private cryptoGlossary: Map<string, string>;

  constructor(private readonly logger: Logger) {
    this.apiEndpoint = MODEL_CONFIG.translation.apiEndpoint;
    this.cryptoGlossary = this.initializeCryptoGlossary();
  }

  /**
   * Initialize crypto terminology glossary (terms to preserve across translations)
   */
  private initializeCryptoGlossary(): Map<string, string> {
    const glossary = new Map<string, string>();

    // Terms that should NEVER be translated
    const preserveTerms = [
      'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'blockchain', 'DeFi', 
      'NFT', 'cryptocurrency', 'memecoin', 'altcoin', 'stablecoin',
      'Binance', 'Coinbase', 'wallet', 'mining', 'staking',
      'gas fee', 'smart contract', 'Web3', 'DAO', 'DEX', 'CEX',
      'HODL', 'FUD', 'FOMO', 'ATH', 'ATL', 'dApp'
    ];

    preserveTerms.forEach(term => {
      glossary.set(term.toLowerCase(), term);
    });

    return glossary;
  }

  /**
   * Translate article to multiple languages using 2-step Imo chain
   * Step 1: Extract crypto terms
   * Step 2: Translate with term preservation
   */
  async translateWithPrompts(
    prompts: TranslationPrompt[],
    article: ArticleOutcome
  ): Promise<TranslationOutcome[]> {
    this.logger.info('[TranslationAgent] Translating to 15 languages with NLLB-200-600M');

    const startTime = Date.now();

    try {
      // Step 1: Extract all crypto terms from content (once)
      const cryptoTermsInContent = this.extractCryptoTerms(article.content);

      // Step 2: Translate to all languages in parallel batches
      const batchSize = MODEL_CONFIG.translation.batchSize || 4;
      const translations: TranslationOutcome[] = [];

      for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);

        const batchPromises = batch.map(async (prompt) => {
          return this.translateToLanguage(
            article.content,
            article.title,
            prompt.language,
            prompt.language_code,
            cryptoTermsInContent
          );
        });

        const batchResults = await Promise.all(batchPromises);
        translations.push(...batchResults);

        this.logger.info(`[TranslationAgent] Batch ${Math.floor(i / batchSize) + 1} completed`, {
          languages: batch.map(p => p.language).join(', ')
        });
      }

      const processingTime = Date.now() - startTime;

      this.logger.info('[TranslationAgent] All translations complete', {
        total_languages: translations.length,
        processing_time_ms: processingTime,
        avg_time_per_language: Math.round(processingTime / translations.length)
      });

      return translations;

    } catch (error) {
      this.logger.error('[TranslationAgent] Translation failed:', error);
      throw new Error(`Translation Agent failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract crypto terms from content that should be preserved
   */
  private extractCryptoTerms(content: string): Set<string> {
    const terms = new Set<string>();

    // Check each glossary term
    this.cryptoGlossary.forEach((preservedForm, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(content)) {
        terms.add(preservedForm);
      }
    });

    // Extract price mentions (e.g., $50,000, 300%)
    const priceMatches = content.match(/\$[\d,]+|\d+%/g);
    if (priceMatches) {
      priceMatches.forEach(price => terms.add(price));
    }

    return terms;
  }

  /**
   * Translate to a single language
   */
  private async translateToLanguage(
    content: string,
    title: string,
    language: string,
    languageCode: string,
    cryptoTerms: Set<string>
  ): Promise<TranslationOutcome> {
    this.logger.debug(`[TranslationAgent] Translating to ${language}`);

    try {
      // Protect crypto terms by wrapping them in special markers
      const protectedContent = this.protectCryptoTerms(content, cryptoTerms);
      const protectedTitle = this.protectCryptoTerms(title, cryptoTerms);

      // Translate using NLLB-200-Distilled-600M
      const translatedContent = await this.callNLLBAPI(protectedContent, languageCode);
      const translatedTitle = await this.callNLLBAPI(protectedTitle, languageCode);

      // Restore crypto terms
      const finalContent = this.restoreCryptoTerms(translatedContent, cryptoTerms);
      const finalTitle = this.restoreCryptoTerms(translatedTitle, cryptoTerms);

      // Calculate tone consistency score
      const toneScore = this.calculateToneConsistency(content, finalContent);

      // Verify terminology preservation
      const terminologyPreserved = this.verifyTerminologyPreserved(finalContent, cryptoTerms);

      return {
        language,
        language_code: languageCode,
        title: finalTitle,
        content: finalContent,
        terminology_preserved: terminologyPreserved,
        tone_consistency_score: toneScore
      };

    } catch (error) {
      this.logger.error(`[TranslationAgent] Translation to ${language} failed:`, error);
      
      // Return placeholder
      return {
        language,
        language_code: languageCode,
        title: `[Translation Error] ${title}`,
        content: `[Translation to ${language} failed: ${error instanceof Error ? error.message : String(error)}]`,
        terminology_preserved: false,
        tone_consistency_score: 0
      };
    }
  }

  /**
   * Call NLLB API for translation
   */
  private async callNLLBAPI(text: string, targetLangCode: string): Promise<string> {
    // Using HuggingFace Transformers pipeline or custom API
    const response = await fetch(`${this.apiEndpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: 'eng_Latn',
        target_lang: targetLangCode,
        max_length: MODEL_CONFIG.translation.maxLength,
        num_beams: MODEL_CONFIG.translation.numBeams
      })
    });

    if (!response.ok) {
      throw new Error(`NLLB API error: ${response.status}`);
    }

    const result = await response.json() as { translated_text?: string; translation?: string };
    return result.translated_text || result.translation || '';
  }

  /**
   * Protect crypto terms by wrapping them in markers
   */
  private protectCryptoTerms(text: string, terms: Set<string>): string {
    let protectedText = text;

    terms.forEach(term => {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      protectedText = protectedText.replace(regex, `<<<${term}>>>`);
    });

    return protectedText;
  }

  /**
   * Restore crypto terms after translation
   */
  private restoreCryptoTerms(text: string, terms: Set<string>): string {
    let restored = text;

    terms.forEach(term => {
      const regex = new RegExp(`<<<${this.escapeRegex(term)}>>>`, 'gi');
      restored = restored.replace(regex, term);
    });

    return restored;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate tone consistency score
   */
  private calculateToneConsistency(original: string, translated: string): number {
    // Simple heuristic: compare sentence lengths and punctuation
    const originalSentences = original.split(/[.!?]+/).filter(s => s.trim());
    const translatedSentences = translated.split(/[.!?]+/).filter(s => s.trim());

    const sentenceLengthRatio = Math.min(
      originalSentences.length / translatedSentences.length,
      translatedSentences.length / originalSentences.length
    );

    // Check punctuation preservation
    const originalPunctuation = (original.match(/[!?]/g) || []).length;
    const translatedPunctuation = (translated.match(/[!?]/g) || []).length;

    const punctuationRatio = originalPunctuation > 0
      ? Math.min(translatedPunctuation / originalPunctuation, 1)
      : 1;

    const score = (sentenceLengthRatio * 0.6 + punctuationRatio * 0.4) * 100;

    return Math.round(score);
  }

  /**
   * Verify all crypto terms were preserved
   */
  private verifyTerminologyPreserved(translated: string, terms: Set<string>): boolean {
    let preserved = 0;
    let total = 0;

    terms.forEach(term => {
      total++;
      if (translated.includes(term)) {
        preserved++;
      }
    });

    // At least 95% of terms must be preserved
    return total === 0 || (preserved / total) >= 0.95;
  }

  /**
   * Revise translations based on admin feedback
   */
  async reviseTranslations(
    languages: string[],
    editNotes: string,
    article: ArticleOutcome
  ): Promise<TranslationOutcome[]> {
    this.logger.info('[TranslationAgent] Revising translations', {
      languages,
      edit_notes: editNotes
    });

    const prompts: TranslationPrompt[] = languages.map(lang => {
      const langCode = MODEL_CONFIG.translation.languages[lang as keyof typeof MODEL_CONFIG.translation.languages];
      return {
        language: lang,
        language_code: langCode,
        step1_prompt: `Extract crypto terms from: ${article.content}`,
        step2_prompt: `Translate to ${lang}, preserving crypto terms. ${editNotes}`
      };
    });

    return this.translateWithPrompts(prompts, article);
  }
}

export default TranslationAgentForReview;
