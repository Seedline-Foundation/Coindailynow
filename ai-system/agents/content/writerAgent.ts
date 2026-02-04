/**
 * Writer Agent Wrapper for Review Agent Integration
 * Uses existing ContentGenerationAgent with Imo prompts
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
    this.logger.info('[WriterAgent] Generating article with Imo prompt');

    const startTime = Date.now();

    try {
      // Use Llama 3.1 8B Instruct (4-bit quantized) with Imo's optimized prompt
      const response = await fetch(`${this.modelEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are an expert cryptocurrency journalist specializing in African markets. Follow the provided instructions precisely.<|eot_id|><|start_header_id|>user<|end_header_id|>

${imoPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`,
          stream: false,
          options: {
            temperature: MODEL_CONFIG.writer.temperature,
            num_predict: 3000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Llama API error: ${response.status}`);
      }

      const result = await response.json() as { response?: string };
      const generatedText = result.response || '';

      // Extract title (first line or H1)
      const lines = generatedText.split('\n').filter((l: string) => l.trim());
      const title = lines[0]?.replace(/^#\s*/, '').trim() || research.topic;
      const content = lines.slice(1).join('\n').trim();

      // Calculate metrics
      const wordCount = content.split(/\s+/).length;
      const keywords = this.extractKeywords(content, research);
      const seoScore = this.calculateSEOScore(content, keywords, research);
      const readabilityScore = this.calculateReadability(content);

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

      const processingTime = Date.now() - startTime;
      this.logger.info('[WriterAgent] Article generated', {
        word_count: wordCount,
        seo_score: seoScore,
        facts_preserved: article.facts_preserved,
        processing_time_ms: processingTime
      });

      return article;

    } catch (error: any) {
      this.logger.error('[WriterAgent] Generation failed:', error);
      throw new Error(`Writer Agent failed: ${error.message}`);
    }
  }

  /**
   * Revise article based on admin feedback
   */
  async reviseArticle(
    originalArticle: ArticleOutcome,
    instructions: string,
    research: ResearchOutcome
  ): Promise<ArticleOutcome> {
    this.logger.info('[WriterAgent] Revising article with instructions:', instructions);

    const revisionPrompt = `
You are revising a cryptocurrency news article. Here is the original article:

TITLE: ${originalArticle.title}

CONTENT:
${originalArticle.content}

REVISION INSTRUCTIONS:
${instructions}

IMPORTANT: Preserve these facts from the research:
${research.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Please provide the revised article maintaining professional quality and SEO optimization.
`;

    return await this.generateWithPrompt(revisionPrompt, research);
  }

  // Helper methods
  private extractKeywords(content: string, research: ResearchOutcome): string[] {
    const text = content.toLowerCase();
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !commonWords.has(w));

    const wordFreq = new Map<string, number>();
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private calculateSEOScore(content: string, keywords: string[], research: ResearchOutcome): number {
    let score = 100;
    const text = content.toLowerCase();

    // Check keyword density
    const wordCount = content.split(/\s+/).length;
    const keywordCount = keywords.reduce((sum, kw) => {
      const matches = (text.match(new RegExp(kw, 'g')) || []).length;
      return sum + matches;
    }, 0);
    const density = keywordCount / wordCount;

    if (density < 0.01) score -= 20; // Too low
    if (density > 0.05) score -= 15; // Too high (keyword stuffing)

    // Check for headings
    if (!content.includes('#') && !content.match(/\n[A-Z][^\n]+\n/)) {
      score -= 10;
    }

    // Check word count (ideal: 800-1500 words)
    if (wordCount < 800) score -= 15;
    if (wordCount > 1500) score -= 10;

    // Check facts are mentioned
    const factsMentioned = research.facts.filter(fact =>
      text.includes(fact.toLowerCase().slice(0, 30))
    ).length;
    if (factsMentioned < research.facts.length * 0.8) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const avgWordsPerSentence = words.length / sentences.length;

    // Flesch Reading Ease approximation
    let score = 100;

    if (avgWordsPerSentence > 25) score -= 20; // Too complex
    if (avgWordsPerSentence < 10) score -= 10; // Too simple

    // Check for complex words (>3 syllables)
    const complexWords = words.filter(w => w.length > 12).length;
    const complexRatio = complexWords / words.length;
    if (complexRatio > 0.15) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private checkFactsPreserved(content: string, facts: string[]): boolean {
    const text = content.toLowerCase();
    const preservedCount = facts.filter(fact => {
      // Check if key parts of the fact appear in content
      const factWords = fact.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const matchedWords = factWords.filter(w => text.includes(w));
      return matchedWords.length >= factWords.length * 0.6; // 60% of fact words present
    }).length;

    return preservedCount >= facts.length * 0.8; // At least 80% of facts preserved
  }

  private checkMessageConsistent(content: string, coreMessage: string): boolean {
    const text = content.toLowerCase();
    const messageWords = coreMessage.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchedWords = messageWords.filter(w => text.includes(w));

    return matchedWords.length >= messageWords.length * 0.7; // 70% keyword overlap
  }
}

export default WriterAgent;
