/**
 * Writer Agent - Uses Llama 3.1 8B Instruct (4-bit quantized)
 * Optimized for article writing and headline generation
 */

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { ArticleOutcome, ResearchOutcome } from '../../types/admin-types';
import { MODEL_CONFIG } from '../../config/model-config';

export class WriterAgent {
  private modelEndpoint: string;
  private modelName: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {
    this.modelEndpoint = MODEL_CONFIG.writer.apiEndpoint;
    this.modelName = MODEL_CONFIG.writer.model;
  }

  /**
   * Generate article using Imo's optimized prompt
   * @param imoPrompt - Multi-step prompt from Imo (Writer-Editor pattern)
   * @param research - Research data to preserve facts and message
   */
  async generateWithPrompt(
    imoPrompt: string,
    research: ResearchOutcome
  ): Promise<ArticleOutcome> {
    this.logger.info('[WriterAgent] Generating article with Llama 3.1 8B');

    const startTime = Date.now();

    try {
      // Use Llama 3.1 8B Instruct (4-bit quantized) via Ollama
      const response = await fetch(`${this.modelEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b-instruct-q4_0', // 4-bit quantization
          prompt: this.formatLlamaPrompt(imoPrompt),
          stream: false,
          options: {
            temperature: MODEL_CONFIG.writer.temperature,
            num_predict: MODEL_CONFIG.writer.maxTokens,
            top_p: MODEL_CONFIG.writer.topP,
            repeat_penalty: 1.1,
            stop: ['<|eot_id|>']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Llama API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as { response?: string };
      const generatedText = result.response || '';

      // Extract title (first line or H1)
      const lines = generatedText.split('\n').filter((l: string) => l.trim());
      const title = lines[0].replace(/^#\s*/, '').trim();
      const content = lines.slice(1).join('\n').trim();

      // Calculate metrics
      const wordCount = content.split(/\s+/).length;
      const keywords = this.extractKeywords(content, research);
      const seoScore = this.calculateSEOScore(content, keywords, research);
      const readabilityScore = this.calculateReadability(content);

      const processingTimeMs = Date.now() - startTime;
      
      const article: ArticleOutcome = {
        id: `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        title,
        word_count: wordCount,
        keywords,
        readability_score: readabilityScore,
        seo_score: seoScore,
        facts_preserved: this.checkFactsPreserved(content, research.facts),
        message_consistent: this.checkMessageConsistent(content, research.core_message)
      };

      this.logger.info('[WriterAgent] Article generated successfully', {
        word_count: wordCount,
        seo_score: seoScore,
        facts_preserved: article.facts_preserved,
        processing_time_ms: processingTimeMs,
        tokens_per_second: Math.round(wordCount / (processingTimeMs / 1000))
      });

      return article;

    } catch (error) {
      this.logger.error('[WriterAgent] Generation failed:', error);
      throw new Error(`Writer Agent failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format prompt for Llama 3.1 Instruct format
   */
  private formatLlamaPrompt(imoPrompt: string): string {
    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are an expert cryptocurrency journalist specializing in African markets. You write clear, engaging, and SEO-optimized articles. Follow the provided instructions precisely.<|eot_id|><|start_header_id|>user<|end_header_id|>

${imoPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
  }

  /**
   * Revise article based on admin feedback
   */
  async reviseArticle(
    currentArticle: ArticleOutcome,
    editNotes: string,
    research: ResearchOutcome
  ): Promise<ArticleOutcome> {
    this.logger.info('[WriterAgent] Revising article based on feedback');

    const revisionPrompt = `# Article Revision Task

CURRENT ARTICLE:
Title: ${currentArticle.title}
${currentArticle.content}

EDITOR FEEDBACK:
${editNotes}

RESEARCH CONTEXT:
${research.facts.join('\n')}

INSTRUCTIONS:
1. Carefully review the editor's feedback
2. Make the requested changes while preserving:
   - Core facts and message
   - SEO keywords: ${currentArticle.keywords.join(', ')}
   - Professional tone for African crypto audience
3. Output the revised article with title on first line
4. Maintain similar word count (${currentArticle.word_count} words)

REVISED ARTICLE:`;

    return this.generateWithPrompt(revisionPrompt, research);
  }

  /**
   * Extract SEO keywords from content
   */
  private extractKeywords(content: string, research: ResearchOutcome): string[] {
    const keywords: Set<string> = new Set();

    // Extract from research topic
    const topicWords = research.topic.toLowerCase().split(/\s+/);
    topicWords.forEach(word => {
      if (word.length > 3 && !this.isStopWord(word)) {
        keywords.add(word);
      }
    });

    // Extract crypto-specific terms
    const cryptoTerms = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'crypto',
      'cryptocurrency', 'defi', 'nft', 'memecoin', 'altcoin',
      'binance', 'africa', 'nigeria', 'kenya', 'ghana', 'south africa'
    ];

    const contentLower = content.toLowerCase();
    cryptoTerms.forEach(term => {
      if (contentLower.includes(term)) {
        keywords.add(term);
      }
    });

    return Array.from(keywords).slice(0, 10); // Top 10 keywords
  }

  /**
   * Calculate SEO score (0-100)
   */
  private calculateSEOScore(content: string, keywords: string[], research: ResearchOutcome): number {
    let score = 0;

    // Keyword density (max 30 points)
    const wordCount = content.split(/\s+/).length;
    const keywordOccurrences = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      return count + (content.match(regex) || []).length;
    }, 0);
    const keywordDensity = keywordOccurrences / wordCount;
    score += Math.min(30, keywordDensity * 100 * 5); // Optimal density: 1-2%

    // Title contains primary keyword (15 points)
    const contentLines = content.split('\n');
    const titleLine = contentLines[0]?.toLowerCase() || '';
    if (keywords.some(kw => titleLine.includes(kw))) {
      score += 15;
    }

    // Word count (15 points) - optimal 800-1500 words
    if (wordCount >= 800 && wordCount <= 1500) {
      score += 15;
    } else if (wordCount >= 600 && wordCount <= 2000) {
      score += 10;
    }

    // Headings/structure (20 points)
    const hasHeadings = content.match(/^##/gm);
    if (hasHeadings && hasHeadings.length >= 3) {
      score += 20;
    } else if (hasHeadings && hasHeadings.length >= 1) {
      score += 10;
    }

    // African focus (20 points)
    const africanTerms = ['africa', 'nigeria', 'kenya', 'ghana', 'south africa', 'african'];
    const hasAfricanFocus = africanTerms.some(term => content.toLowerCase().includes(term));
    if (hasAfricanFocus) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate readability score (Flesch Reading Ease)
   */
  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.trim().length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;

    // Adjust for silent e
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;

    return Math.max(1, count);
  }

  /**
   * Check if facts from research are preserved in article
   */
  private checkFactsPreserved(content: string, facts: string[]): boolean {
    const contentLower = content.toLowerCase();
    const preservedCount = facts.filter(fact => {
      // Extract key numbers and entities from fact
      const numbers = fact.match(/\d+/g) || [];
      const entities = fact.match(/[A-Z][a-z]+/g) || [];

      const numbersPreserved = numbers.every(num => contentLower.includes(num));
      const entitiesPreserved = entities.length === 0 || entities.some(entity => 
        contentLower.includes(entity.toLowerCase())
      );

      return numbersPreserved && entitiesPreserved;
    }).length;

    // At least 80% of facts must be preserved
    return preservedCount / facts.length >= 0.8;
  }

  /**
   * Check if core message is consistent
   */
  private checkMessageConsistent(content: string, coreMessage: string): boolean {
    const messageKeywords = coreMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentLower = content.toLowerCase();

    const matchedKeywords = messageKeywords.filter(kw => contentLower.includes(kw)).length;

    // At least 70% of message keywords must appear
    return matchedKeywords / messageKeywords.length >= 0.7;
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'for',
      'from', 'with', 'this', 'that', 'these', 'those', 'was', 'were'
    ]);
    return stopWords.has(word.toLowerCase());
  }
}

export default WriterAgent;
