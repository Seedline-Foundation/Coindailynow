/**
 * NLLB Translation Client
 * Connects to self-hosted NLLB-200 translation service on Contabo
 */

interface TranslationRequest {
  text: string;
  source_lang: string;
  target_lang: string;
  preserve_crypto_terms?: boolean;
}

interface TranslationResponse {
  translated_text: string;
  source_lang: string;
  target_lang: string;
  model_version: string;
}

interface BatchTranslationRequest {
  texts: string[];
  source_lang: string;
  target_langs: string[];
  preserve_crypto_terms?: boolean;
}

interface BatchTranslationResponse {
  translations: Record<string, string[]>;
  model_version: string;
}

class NLLBTranslationClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor() {
    this.baseUrl = process.env.TRANSLATION_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 120000; // 120 seconds for translations
    this.retries = 3;
  }

  /**
   * Translate single text to target language
   */
  async translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string,
    preserveCryptoTerms: boolean = true
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            source_lang: sourceLang,
            target_lang: targetLang,
            preserve_crypto_terms: preserveCryptoTerms
          } as TranslationRequest),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Translation failed (${response.status}): ${error}`);
        }

        const result = await response.json() as TranslationResponse;
        return result.translated_text;

      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          throw new Error('Translation timeout - service may be overloaded');
        }

        // Retry on network errors
        if (attempt < this.retries) {
          console.warn(`Translation attempt ${attempt} failed, retrying...`);
          await this.sleep(1000 * attempt); // Exponential backoff
          continue;
        }
      }
    }

    throw lastError || new Error('Translation failed after retries');
  }

  /**
   * Translate multiple texts to multiple languages
   */
  async batchTranslate(
    texts: string[],
    sourceLang: string = 'en',
    targetLangs: string[],
    preserveCryptoTerms: boolean = true
  ): Promise<Record<string, string[]>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2);

    try {
      const response = await fetch(`${this.baseUrl}/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          source_lang: sourceLang,
          target_langs: targetLangs,
          preserve_crypto_terms: preserveCryptoTerms
        } as BatchTranslationRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Batch translation failed (${response.status}): ${error}`);
      }

      const result = await response.json() as BatchTranslationResponse;
      return result.translations;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Batch translation timeout');
      }

      throw error;
    }
  }

  /**
   * Translate article content (title, excerpt, content)
   */
  async translateArticle(
    article: {
      title: string;
      excerpt?: string;
      content: string;
    },
    targetLang: string
  ): Promise<{
    title: string;
    excerpt?: string;
    content: string;
  }> {
    const texts: string[] = [
      article.title,
      article.excerpt || '',
      article.content
    ];

    const results = await this.batchTranslate(texts, 'en', [targetLang]);
    const translated = results[targetLang];

    return {
      title: translated[0],
      excerpt: article.excerpt ? translated[1] : undefined,
      content: translated[2]
    };
  }

  /**
   * Health check - verify service is running
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    status?: string;
    device?: string;
    gpu_available?: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: data.status === 'healthy',
          status: data.status,
          device: data.device,
          gpu_available: data.gpu_available
        };
      }

      return { healthy: false };
    } catch {
      return { healthy: false };
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/languages`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.languages;
      }

      return {};
    } catch {
      return {};
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new NLLBTranslationClient();
