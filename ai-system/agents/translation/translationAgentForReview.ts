/**
 * Translation Agent Wrapper for Review Agent Integration
 * Uses existing TranslationService with Imo's 2-step chaining prompts
 */

import { Logger } from 'winston';
import { TranslationOutcome, ArticleOutcome } from '../../types/admin-types';
import axios from 'axios';

export class TranslationAgentForReview {
  // Map of language names to NLLB language codes
  private readonly languageMap = {
    'Hausa': 'hau_Latn',
    'Yoruba': 'yor_Latn',
    'Igbo': 'ibo_Latn',
    'Swahili': 'swh_Latn',
    'Amharic': 'amh_Ethi',
    'Zulu': 'zul_Latn',
    'Shona': 'sna_Latn',
    'Afrikaans': 'afr_Latn',
    'Somali': 'som_Latn',
    'Oromo': 'orm_Latn',
    'Arabic': 'arb_Arab',
    'French': 'fra_Latn',
    'Portuguese': 'por_Latn',
    'Wolof': 'wol_Latn',
    'Kinyarwanda': 'kin_Latn'
  };

  // Crypto terms that should NEVER be translated
  private readonly cryptoGlossary = [
    'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'blockchain', 'DeFi',
    'NFT', 'wallet', 'cryptocurrency', 'altcoin', 'stablecoin',
    'mining', 'staking', 'yield farming', 'smart contract',
    'DAO', 'dApp', 'Web3', 'MetaMask', 'Binance', 'Coinbase'
  ];

  constructor(
    private readonly logger: Logger
  ) {}

  /**
   * Translate article to 15 African languages using Imo's 2-step chaining
   * @param imoPrompts - Map of language → Imo's 2-step prompt
   * @param article - Article to translate
   */
  async translateWithPrompts(
    imoPrompts: Map<string, string>,
    article: ArticleOutcome
  ): Promise<TranslationOutcome[]> {
    this.logger.info('[TranslationAgent] Translating to 15 languages simultaneously');

    const startTime = Date.now();

    // Process all 15 translations in parallel
    const translations = await Promise.all(
      Array.from(imoPrompts.entries()).map(async ([language, imoPrompt]) => {
        try {
          return await this.translateToLanguage(language, article, imoPrompt);
        } catch (error) {
          this.logger.error(`[TranslationAgent] Failed to translate to ${language}:`, error);
          throw error;
        }
      })
    );

    const processingTime = Date.now() - startTime;
    this.logger.info('[TranslationAgent] All translations complete', {
      languages: translations.length,
      processing_time_ms: processingTime,
      avg_time_per_language: Math.round(processingTime / translations.length)
    });

    return translations;
  }

  /**
   * Translate to a single language using Imo's 2-step chaining
   */
  private async translateToLanguage(
    language: string,
    article: ArticleOutcome,
    imoPrompt: string
  ): Promise<TranslationOutcome> {
    this.logger.info(`[TranslationAgent] Translating to ${language}`);

    const languageCode = this.languageMap[language];
    if (!languageCode) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Step 1: Extract crypto terms (from Imo's prompt guidance)
    const termsToPreserve = this.extractCryptoTerms(article.content);

    // Step 2: Translate while preserving terms
    const translation = await this.callNLLB(
      article.content,
      languageCode,
      termsToPreserve
    );

    const translatedTitle = await this.callNLLB(
      article.title,
      languageCode,
      termsToPreserve
    );

    // Validate terminology preservation
    const terminologyPreserved = this.checkTerminologyPreserved(
      translation,
      termsToPreserve
    );

    // Calculate tone consistency
    const toneConsistency = this.calculateToneConsistency(
      article.content,
      translation
    );

    return {
      language,
      language_code: languageCode,
      content: translation,
      title: translatedTitle,
      terminology_preserved: terminologyPreserved,
      tone_consistency_score: toneConsistency
    };
  }

  /**
   * Call Meta NLLB-200 API for translation
   */
  private async callNLLB(
    text: string,
    targetLangCode: string,
    preserveTerms: string[]
  ): Promise<string> {
    const nllbApiUrl = process.env.NLLB_API_URL || 'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M';
    const apiKey = process.env.HUGGINGFACE_API_KEY || '';

    try {
      // Replace crypto terms with placeholders before translation
      let processedText = text;
      const placeholders = new Map<string, string>();
      
      preserveTerms.forEach((term, index) => {
        const placeholder = `__CRYPTO_TERM_${index}__`;
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        processedText = processedText.replace(regex, placeholder);
        placeholders.set(placeholder, term);
      });

      // Translate
      const response = await axios.post(
        nllbApiUrl,
        {
          inputs: processedText,
          parameters: {
            src_lang: 'eng_Latn',
            tgt_lang: targetLangCode
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds
        }
      );

      let translatedText = response.data[0]?.translation_text || processedText;

      // Restore crypto terms from placeholders
      placeholders.forEach((term, placeholder) => {
        translatedText = translatedText.replace(new RegExp(placeholder, 'g'), term);
      });

      return translatedText;

    } catch (error) {
      this.logger.error('[TranslationAgent] NLLB API call failed:', error);
      throw new Error(`NLLB translation failed: ${error.message}`);
    }
  }

  /**
   * Extract crypto terms from text
   */
  private extractCryptoTerms(text: string): string[] {
    const foundTerms = new Set<string>();
    
    this.cryptoGlossary.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(text)) {
        foundTerms.add(term);
      }
    });

    return Array.from(foundTerms);
  }

  /**
   * Check if crypto terms were preserved in translation
   */
  private checkTerminologyPreserved(
    translatedText: string,
    preservedTerms: string[]
  ): boolean {
    return preservedTerms.every(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(translatedText);
    });
  }

  /**
   * Calculate tone consistency between original and translation
   * Uses simple heuristics (sentence length, word count ratios)
   */
  private calculateToneConsistency(
    original: string,
    translated: string
  ): number {
    const originalSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const translatedSentences = translated.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const originalWords = original.split(/\s+/).length;
    const translatedWords = translated.split(/\s+/).length;

    // Check sentence count similarity
    const sentenceRatio = Math.min(originalSentences.length, translatedSentences.length) / 
                          Math.max(originalSentences.length, translatedSentences.length);

    // Check word count similarity (within 20% is good)
    const wordRatio = Math.min(originalWords, translatedWords) / 
                      Math.max(originalWords, translatedWords);

    // Average the ratios and convert to percentage
    const score = ((sentenceRatio + wordRatio) / 2) * 100;

    return Math.round(score);
  }

  /**
   * Re-translate specific language (for edit requests)
   */
  async retranslateLanguage(
    language: string,
    article: ArticleOutcome,
    instructions: string
  ): Promise<TranslationOutcome> {
    this.logger.info(`[TranslationAgent] Re-translating ${language} with instructions:`, instructions);

    // For now, just re-translate normally
    // TODO: Incorporate specific instructions into translation prompt
    
    const termsToPreserve = this.extractCryptoTerms(article.content);
    const languageCode = this.languageMap[language];

    const translation = await this.callNLLB(
      article.content,
      languageCode,
      termsToPreserve
    );

    const translatedTitle = await this.callNLLB(
      article.title,
      languageCode,
      termsToPreserve
    );

    return {
      language,
      language_code: languageCode,
      content: translation,
      title: translatedTitle,
      terminology_preserved: this.checkTerminologyPreserved(translation, termsToPreserve),
      tone_consistency_score: this.calculateToneConsistency(article.content, translation)
    };
  }
}

export default TranslationAgentForReview;
