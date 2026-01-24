/**
 * Content SEO Optimization Service
 * Comprehensive SEO optimization with AI-powered analysis, readability scoring, and RAO support
 * 
 * Features:
 * - Real-time SEO scoring and analysis
 * - AI-powered headline optimization for CTR
 * - Internal link suggestions
 * - Readability analysis (Flesch-Kincaid)
 * - RAO content structuring (semantic chunks, canonical answers)
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// Initialize Prisma Client with proper types
const prisma = new PrismaClient() as any;

interface ContentOptimizationRequest {
  contentId: string;
  contentType: 'article' | 'page' | 'blog';
  title: string;
  content: string;
  keywords?: string[];
  targetAudience?: string;
}

interface SEOScoreBreakdown {
  overall: number;
  title: number;
  description: number;
  keywords: number;
  readability: number;
  technical: number;
}

interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
  complexWordsCount: number;
  complexWordsPercent: number;
  longSentencesCount: number;
  gradeLevel: string;
  targetAudience: string;
}

interface HeadlineAnalysis {
  score: number;
  emotionalScore: number;
  powerWords: string[];
  lengthScore: number;
  clarityScore: number;
  predictedCTR: number;
  suggestions: string[];
}

interface InternalLinkSuggestion {
  targetContentId: string;
  targetUrl: string;
  targetTitle: string;
  anchorText: string;
  contextSentence: string;
  relevanceScore: number;
}

export class ContentSEOOptimizationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-test-key',
    });
  }

  /**
   * Comprehensive content SEO optimization
   */
  async optimizeContent(request: ContentOptimizationRequest) {
    try {
      // Parallel analysis for performance
      const [
        seoScore,
        readability,
        headlineAnalysis,
        internalLinks,
        aiSuggestions,
        raoStructure
      ] = await Promise.all([
        this.calculateSEOScore(request),
        this.analyzeReadability(request.content),
        this.analyzeHeadline(request.title),
        this.suggestInternalLinks(request.contentId, request.content),
        this.generateAISuggestions(request),
        this.structureForRAO(request.content)
      ]);

      // Save optimization results
      const optimization = await prisma.contentSEOOptimization.upsert({
        where: { contentId: request.contentId },
        create: {
          contentId: request.contentId,
          contentType: request.contentType,
          overallScore: seoScore.overall,
          titleScore: seoScore.title,
          descriptionScore: seoScore.description,
          keywordScore: seoScore.keywords,
          readabilityScore: seoScore.readability,
          technicalScore: seoScore.technical,
          optimizedTitle: headlineAnalysis.suggestions[0] || request.title,
          optimizedKeywords: JSON.stringify(aiSuggestions.keywords),
          suggestedHeadlines: JSON.stringify(headlineAnalysis.suggestions),
          internalLinks: JSON.stringify(internalLinks),
          internalLinksCount: internalLinks.length,
          fleschKincaidGrade: readability.fleschKincaidGrade,
          fleschReadingEase: readability.fleschReadingEase,
          averageWordsPerSentence: readability.averageWordsPerSentence,
          averageSyllablesPerWord: readability.averageSyllablesPerWord,
          complexWordsPercent: readability.complexWordsPercent,
          semanticChunks: JSON.stringify(raoStructure.chunks),
          canonicalAnswers: JSON.stringify(raoStructure.canonicalAnswers),
          entityMentions: JSON.stringify(raoStructure.entities),
          factClaims: JSON.stringify(raoStructure.facts),
          aiHeadlineSuggestions: JSON.stringify(aiSuggestions.headlines),
          aiContentSuggestions: JSON.stringify(aiSuggestions.content),
          aiKeywordSuggestions: JSON.stringify(aiSuggestions.keywords),
          issues: JSON.stringify(seoScore.issues),
          recommendations: JSON.stringify(seoScore.recommendations),
          lastOptimized: new Date(),
        },
        update: {
          overallScore: seoScore.overall,
          titleScore: seoScore.title,
          descriptionScore: seoScore.description,
          keywordScore: seoScore.keywords,
          readabilityScore: seoScore.readability,
          technicalScore: seoScore.technical,
          optimizedTitle: headlineAnalysis.suggestions[0] || request.title,
          optimizedKeywords: JSON.stringify(aiSuggestions.keywords),
          suggestedHeadlines: JSON.stringify(headlineAnalysis.suggestions),
          internalLinks: JSON.stringify(internalLinks),
          internalLinksCount: internalLinks.length,
          fleschKincaidGrade: readability.fleschKincaidGrade,
          fleschReadingEase: readability.fleschReadingEase,
          averageWordsPerSentence: readability.averageWordsPerSentence,
          averageSyllablesPerWord: readability.averageSyllablesPerWord,
          complexWordsPercent: readability.complexWordsPercent,
          semanticChunks: JSON.stringify(raoStructure.chunks),
          canonicalAnswers: JSON.stringify(raoStructure.canonicalAnswers),
          entityMentions: JSON.stringify(raoStructure.entities),
          factClaims: JSON.stringify(raoStructure.facts),
          aiHeadlineSuggestions: JSON.stringify(aiSuggestions.headlines),
          aiContentSuggestions: JSON.stringify(aiSuggestions.content),
          aiKeywordSuggestions: JSON.stringify(aiSuggestions.keywords),
          issues: JSON.stringify(seoScore.issues),
          recommendations: JSON.stringify(seoScore.recommendations),
          lastOptimized: new Date(),
          optimizationVersion: { increment: 1 },
        },
      });

      // Save readability analysis
      await prisma.readabilityAnalysis.upsert({
        where: { contentId: request.contentId },
        create: {
          contentId: request.contentId,
          ...readability,
          suggestions: JSON.stringify(this.generateReadabilitySuggestions(readability)),
        },
        update: {
          ...readability,
          suggestions: JSON.stringify(this.generateReadabilitySuggestions(readability)),
          analyzedAt: new Date(),
        },
      });

      // Save headline optimization
      await prisma.headlineOptimization.create({
        data: {
          contentId: request.contentId,
          originalHeadline: request.title,
          optimizedHeadline: headlineAnalysis.suggestions[0] || request.title,
          predictedCTR: headlineAnalysis.predictedCTR,
          emotionalScore: headlineAnalysis.emotionalScore,
          powerWords: JSON.stringify(headlineAnalysis.powerWords),
          lengthScore: headlineAnalysis.lengthScore,
          clarityScore: headlineAnalysis.clarityScore,
        },
      });

      // Save internal link suggestions
      for (const link of internalLinks.slice(0, 10)) { // Top 10 suggestions
        await prisma.internalLinkSuggestion.create({
          data: {
            sourceContentId: request.contentId,
            targetContentId: link.targetContentId,
            targetUrl: link.targetUrl,
            anchorText: link.anchorText,
            contextSentence: link.contextSentence,
            relevanceScore: link.relevanceScore,
            topicSimilarity: link.relevanceScore,
          },
        });
      }

      return {
        success: true,
        optimization,
        seoScore,
        readability,
        headlineAnalysis,
        internalLinks: internalLinks.slice(0, 10),
        aiSuggestions,
        raoStructure,
      };
    } catch (error) {
      console.error('Content optimization error:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive SEO score
   */
  private async calculateSEOScore(request: ContentOptimizationRequest): Promise<any> {
    const scores = {
      title: this.scoreTitleSEO(request.title),
      description: this.scoreDescriptionSEO(request.content.substring(0, 160)),
      keywords: this.scoreKeywordUsage(request.content, request.keywords || []),
      readability: await this.scoreReadability(request.content),
      technical: this.scoreTechnicalSEO(request),
    };

    const overall = Math.round(
      (scores.title + scores.description + scores.keywords + scores.readability + scores.technical) / 5
    );

    const issues: any[] = [];
    const recommendations: any[] = [];

    // Collect issues and recommendations
    if (scores.title < 70) {
      issues.push({
        type: 'warning',
        category: 'title',
        message: 'Title needs optimization',
        impact: 'high',
      });
      recommendations.push({
        type: 'title',
        suggestion: 'Use power words and keep title between 50-60 characters',
        priority: 'high',
      });
    }

    if (scores.readability < 60) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Content readability is below target',
        impact: 'medium',
      });
      recommendations.push({
        type: 'content',
        suggestion: 'Simplify sentences and use shorter paragraphs',
        priority: 'medium',
      });
    }

    return {
      overall,
      ...scores,
      issues,
      recommendations,
    };
  }

  /**
   * Score title SEO quality
   */
  private scoreTitleSEO(title: string): number {
    let score = 0;
    const length = title.length;

    // Length scoring (50-60 characters ideal)
    if (length >= 50 && length <= 60) score += 40;
    else if (length >= 40 && length < 70) score += 30;
    else score += 10;

    // Power words presence
    const powerWords = ['best', 'top', 'ultimate', 'complete', 'guide', 'how to', 'why', 'what', 'crypto', 'bitcoin'];
    const hasPowerWord = powerWords.some(word => title.toLowerCase().includes(word));
    if (hasPowerWord) score += 30;

    // Numbers presence
    if (/\d+/.test(title)) score += 20;

    // Capitalization
    const words = title.split(' ');
    const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
    if (capitalizedWords.length >= words.length * 0.7) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Score description SEO quality
   */
  private scoreDescriptionSEO(description: string): number {
    let score = 0;
    const length = description.length;

    // Length scoring (120-160 characters ideal)
    if (length >= 120 && length <= 160) score += 50;
    else if (length >= 100 && length < 180) score += 35;
    else score += 15;

    // Contains call-to-action
    const cta = ['learn', 'discover', 'find', 'explore', 'get', 'read'];
    if (cta.some(word => description.toLowerCase().includes(word))) score += 25;

    // Contains keywords (assuming first few words are important)
    const words = description.toLowerCase().split(' ');
    if (words.length >= 10) score += 25;

    return Math.min(score, 100);
  }

  /**
   * Score keyword usage
   */
  private scoreKeywordUsage(content: string, keywords: string[]): number {
    if (keywords.length === 0) return 50; // Neutral score

    let score = 0;
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = contentLower.match(regex);
      const frequency = matches ? matches.length : 0;
      const density = (frequency / wordCount) * 100;

      // Ideal keyword density: 1-2%
      if (density >= 1 && density <= 2) score += 20;
      else if (density > 0.5 && density < 3) score += 15;
      else if (frequency > 0) score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Score readability
   */
  private async scoreReadability(content: string): Promise<number> {
    const metrics = this.calculateReadabilityMetrics(content);
    let score = 0;

    // Flesch Reading Ease (60-70 is ideal)
    if (metrics.fleschReadingEase >= 60 && metrics.fleschReadingEase <= 70) score += 40;
    else if (metrics.fleschReadingEase >= 50 && metrics.fleschReadingEase <= 80) score += 30;
    else score += 15;

    // Average words per sentence (15-20 is ideal)
    if (metrics.averageWordsPerSentence >= 15 && metrics.averageWordsPerSentence <= 20) score += 30;
    else if (metrics.averageWordsPerSentence >= 12 && metrics.averageWordsPerSentence <= 25) score += 20;
    else score += 10;

    // Complex words percentage (< 10% is good)
    if (metrics.complexWordsPercent < 10) score += 30;
    else if (metrics.complexWordsPercent < 15) score += 20;
    else score += 10;

    return Math.min(score, 100);
  }

  /**
   * Score technical SEO aspects
   */
  private scoreTechnicalSEO(request: ContentOptimizationRequest): number {
    let score = 0;

    // Content length (1500+ words ideal for SEO)
    const wordCount = request.content.split(/\s+/).length;
    if (wordCount >= 1500) score += 40;
    else if (wordCount >= 1000) score += 30;
    else if (wordCount >= 500) score += 20;
    else score += 10;

    // Has images (check for image references)
    if (request.content.match(/!\[.*?\]\(.*?\)/g) || request.content.includes('<img')) score += 20;

    // Has headings (check for markdown or HTML headings)
    if (request.content.match(/^#{1,6}\s/gm) || request.content.match(/<h[1-6]>/gi)) score += 20;

    // Has lists
    if (request.content.match(/^[\*\-\+]\s/gm) || request.content.match(/<[ou]l>/gi)) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Analyze readability with Flesch-Kincaid metrics
   */
  analyzeReadability(content: string): ReadabilityMetrics {
    const metrics = this.calculateReadabilityMetrics(content);
    return metrics;
  }

  /**
   * Calculate readability metrics
   */
  private calculateReadabilityMetrics(content: string): ReadabilityMetrics {
    // Remove HTML tags and markdown
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/[#*_~`]/g, '');

    // Count words
    const words = cleanContent.match(/\b\w+\b/g) || [];
    const wordCount = words.length;

    // Count sentences
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // Count paragraphs
    const paragraphs = cleanContent.split(/\n\n+/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Count syllables (approximation)
    let syllableCount = 0;
    for (const word of words) {
      syllableCount += this.countSyllables(word);
    }

    // Calculate averages
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const averageSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

    // Count complex words (3+ syllables)
    const complexWords = words.filter(w => this.countSyllables(w) >= 3);
    const complexWordsCount = complexWords.length;
    const complexWordsPercent = wordCount > 0 ? (complexWordsCount / wordCount) * 100 : 0;

    // Count long sentences (> 25 words)
    const longSentences = sentences.filter(s => {
      const sentenceWords = s.match(/\b\w+\b/g) || [];
      return sentenceWords.length > 25;
    });
    const longSentencesCount = longSentences.length;

    // Calculate Flesch-Kincaid Grade Level
    const fleschKincaidGrade = sentenceCount > 0 && wordCount > 0
      ? 0.39 * averageWordsPerSentence + 11.8 * averageSyllablesPerWord - 15.59
      : 0;

    // Calculate Flesch Reading Ease
    const fleschReadingEase = sentenceCount > 0 && wordCount > 0
      ? 206.835 - 1.015 * averageWordsPerSentence - 84.6 * averageSyllablesPerWord
      : 0;

    // Determine grade level and target audience
    let gradeLevel = 'Professional';
    let targetAudience = 'Expert';
    
    if (fleschKincaidGrade <= 6) {
      gradeLevel = 'Elementary';
      targetAudience = 'General';
    } else if (fleschKincaidGrade <= 9) {
      gradeLevel = 'Middle School';
      targetAudience = 'General';
    } else if (fleschKincaidGrade <= 12) {
      gradeLevel = 'High School';
      targetAudience = 'General';
    } else if (fleschKincaidGrade <= 16) {
      gradeLevel = 'College';
      targetAudience = 'Technical';
    }

    return {
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
      wordCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence,
      averageSyllablesPerWord,
      complexWordsCount,
      complexWordsPercent,
      longSentencesCount,
      gradeLevel,
      targetAudience,
    };
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!char) continue;
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e')) count--;
    
    // Ensure at least 1 syllable
    return Math.max(1, count);
  }

  /**
   * Generate readability suggestions
   */
  private generateReadabilitySuggestions(metrics: ReadabilityMetrics): any[] {
    const suggestions: any[] = [];

    if (metrics.fleschReadingEase < 60) {
      suggestions.push({
        type: 'readability',
        message: 'Content is difficult to read. Simplify sentences and use common words.',
        priority: 'high',
      });
    }

    if (metrics.averageWordsPerSentence > 20) {
      suggestions.push({
        type: 'sentences',
        message: 'Sentences are too long. Break them into shorter sentences (15-20 words).',
        priority: 'high',
      });
    }

    if (metrics.complexWordsPercent > 15) {
      suggestions.push({
        type: 'vocabulary',
        message: 'Too many complex words. Replace with simpler alternatives when possible.',
        priority: 'medium',
      });
    }

    if (metrics.longSentencesCount > metrics.sentenceCount * 0.2) {
      suggestions.push({
        type: 'structure',
        message: 'Many sentences exceed 25 words. Consider breaking them down.',
        priority: 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Analyze and optimize headlines for CTR
   */
  async analyzeHeadline(headline: string): Promise<HeadlineAnalysis> {
    const powerWords = [
      'ultimate', 'complete', 'essential', 'proven', 'amazing', 'incredible',
      'exclusive', 'secret', 'guaranteed', 'best', 'top', 'expert', 'free',
      'quick', 'easy', 'simple', 'powerful', 'effective'
    ];

    const foundPowerWords = powerWords.filter(word => 
      headline.toLowerCase().includes(word)
    );

    const emotionalScore = this.calculateEmotionalScore(headline);
    const lengthScore = this.calculateLengthScore(headline);
    const clarityScore = this.calculateClarityScore(headline);

    // Overall score
    const score = Math.round((emotionalScore + lengthScore + clarityScore) / 3);

    // Predict CTR based on factors
    const predictedCTR = this.predictCTR(score, foundPowerWords.length);

    // Generate AI-powered suggestions
    const suggestions = await this.generateHeadlineSuggestions(headline);

    return {
      score,
      emotionalScore,
      powerWords: foundPowerWords,
      lengthScore,
      clarityScore,
      predictedCTR,
      suggestions,
    };
  }

  /**
   * Calculate emotional score of headline
   */
  private calculateEmotionalScore(headline: string): number {
    const emotionalWords = [
      'love', 'hate', 'fear', 'hope', 'dream', 'nightmare', 'revolution',
      'breakthrough', 'disaster', 'miracle', 'shock', 'surprise', 'warning'
    ];

    const hasEmotionalWord = emotionalWords.some(word => 
      headline.toLowerCase().includes(word)
    );

    return hasEmotionalWord ? 85 : 50;
  }

  /**
   * Calculate length score (ideal: 50-60 characters)
   */
  private calculateLengthScore(headline: string): number {
    const length = headline.length;
    if (length >= 50 && length <= 60) return 100;
    if (length >= 40 && length <= 70) return 80;
    if (length >= 30 && length <= 80) return 60;
    return 40;
  }

  /**
   * Calculate clarity score
   */
  private calculateClarityScore(headline: string): number {
    let score = 70; // Base score

    // Has numbers
    if (/\d+/.test(headline)) score += 15;

    // Has question
    if (headline.includes('?')) score += 10;

    // Has "how to"
    if (/how\s+to/i.test(headline)) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Predict CTR percentage
   */
  private predictCTR(score: number, powerWordCount: number): number {
    // Base CTR from score
    let ctr = score * 0.05; // Max 5% CTR

    // Bonus from power words
    ctr += powerWordCount * 0.3;

    return Math.min(ctr, 8); // Cap at 8% CTR
  }

  /**
   * Generate AI-powered headline suggestions
   */
  private async generateHeadlineSuggestions(headline: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter specializing in high-CTR headlines for cryptocurrency news. Generate 5 optimized headline variations that are attention-grabbing, clear, and SEO-friendly.',
          },
          {
            role: 'user',
            content: `Original headline: "${headline}"\n\nGenerate 5 improved variations focusing on:\n1. Adding power words\n2. Including numbers if relevant\n3. Creating curiosity\n4. Keeping 50-60 characters\n5. Maintaining clarity\n\nReturn only the headlines, one per line.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      const suggestions = completion.choices[0]?.message?.content
        ?.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''))
        .slice(0, 5) || [headline];

      return suggestions;
    } catch (error) {
      console.error('AI headline generation error:', error);
      return [headline];
    }
  }

  /**
   * Suggest internal links based on content analysis
   */
  async suggestInternalLinks(
    contentId: string,
    content: string
  ): Promise<InternalLinkSuggestion[]> {
    try {
      // Extract key phrases from content
      const keyPhrases = this.extractKeyPhrases(content);

      // Find related articles
      const relatedArticles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: contentId },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          tags: true,
        },
        take: 50,
      });

      const suggestions: InternalLinkSuggestion[] = [];

      for (const article of relatedArticles) {
        // Calculate relevance score
        const relevanceScore = this.calculateRelevanceScore(
          content,
          keyPhrases,
          article.content,
          article.tags
        );

        if (relevanceScore > 0.3) {
          // Find good anchor text
          const anchorText = this.findBestAnchorText(content, article.title);
          
          if (anchorText) {
            suggestions.push({
              targetContentId: article.id,
              targetUrl: `/news/${article.slug}`,
              targetTitle: article.title,
              anchorText,
              contextSentence: this.getContextSentence(content, anchorText),
              relevanceScore,
            });
          }
        }
      }

      // Sort by relevance and return top suggestions
      return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
    } catch (error) {
      console.error('Internal link suggestion error:', error);
      return [];
    }
  }

  /**
   * Extract key phrases from content
   */
  private extractKeyPhrases(content: string): string[] {
    // Remove HTML and markdown
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/[#*_~`]/g, '');
    
    // Extract 2-3 word phrases
    const words = cleanContent.toLowerCase().split(/\s+/);
    const phrases: string[] = [];

    for (let i = 0; i < words.length - 2; i++) {
      const phrase2 = `${words[i]} ${words[i + 1]}`;
      const phrase3 = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      phrases.push(phrase2, phrase3);
    }

    // Count frequency
    const frequency: { [key: string]: number } = {};
    for (const phrase of phrases) {
      frequency[phrase] = (frequency[phrase] || 0) + 1;
    }

    // Return top phrases
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase);
  }

  /**
   * Calculate relevance score between contents
   */
  private calculateRelevanceScore(
    sourceContent: string,
    sourceKeyPhrases: string[],
    targetContent: string,
    targetTags: string | null
  ): number {
    let score = 0;
    const targetLower = targetContent.toLowerCase();

    // Check key phrase overlap
    for (const phrase of sourceKeyPhrases) {
      if (targetLower.includes(phrase)) {
        score += 0.1;
      }
    }

    // Check tag overlap
    if (targetTags) {
      const tags = JSON.parse(targetTags);
      const sourceLower = sourceContent.toLowerCase();
      for (const tag of tags) {
        if (sourceLower.includes(tag.toLowerCase())) {
          score += 0.15;
        }
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Find best anchor text for internal link
   */
  private findBestAnchorText(content: string, targetTitle: string): string | null {
    // Look for title or similar phrases in content
    const contentLower = content.toLowerCase();
    const titleLower = targetTitle.toLowerCase();

    // Try exact match
    if (contentLower.includes(titleLower)) {
      return targetTitle;
    }

    // Try partial match (at least 3 words)
    const titleWords = titleLower.split(/\s+/);
    if (titleWords.length >= 3) {
      const partial = titleWords.slice(0, 3).join(' ');
      if (contentLower.includes(partial)) {
        return titleWords.slice(0, 3).join(' ');
      }
    }

    return null;
  }

  /**
   * Get context sentence for anchor text
   */
  private getContextSentence(content: string, anchorText: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const anchorLower = anchorText.toLowerCase();

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(anchorLower)) {
        return sentence.trim().substring(0, 200);
      }
    }

    return '';
  }

  /**
   * Generate AI-powered content suggestions
   */
  private async generateAISuggestions(request: ContentOptimizationRequest): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO content strategist for cryptocurrency news. Provide actionable suggestions.',
          },
          {
            role: 'user',
            content: `Analyze this content and provide:\n1. 5 optimized headlines\n2. 5 relevant keywords\n3. 3 content improvement suggestions\n\nTitle: ${request.title}\nContent: ${request.content.substring(0, 1000)}...\n\nReturn JSON format: { "headlines": [], "keywords": [], "content": [] }`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        headlines: response.headlines || [],
        keywords: response.keywords || [],
        content: response.content || [],
      };
    } catch (error) {
      console.error('AI suggestions error:', error);
      return {
        headlines: [],
        keywords: [],
        content: [],
      };
    }
  }

  /**
   * Structure content for RAO (Retrieval-Augmented Optimization)
   */
  private async structureForRAO(content: string): Promise<any> {
    // Semantic chunking (200-400 word blocks)
    const chunks = this.createSemanticChunks(content);

    // Extract entities (coins, protocols, people)
    const entities = this.extractEntities(content);

    // Extract fact claims
    const facts = this.extractFactClaims(content);

    // Generate canonical answers
    const canonicalAnswers = await this.generateCanonicalAnswers(content);

    return {
      chunks,
      entities,
      facts,
      canonicalAnswers,
    };
  }

  /**
   * Create semantic content chunks for LLMs
   */
  private createSemanticChunks(content: string): string[] {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    let wordCount = 0;

    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.split(/\s+/).length;
      
      if (wordCount + paragraphWords > 400) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        wordCount = paragraphWords;
      } else {
        currentChunk += '\n\n' + paragraph;
        wordCount += paragraphWords;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  /**
   * Extract entities from content
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = [];
    
    // Cryptocurrency names (common patterns)
    const cryptoPattern = /\b(Bitcoin|BTC|Ethereum|ETH|Ripple|XRP|Cardano|ADA|Solana|SOL|Polkadot|DOT|Dogecoin|DOGE|Shiba\s+Inu|SHIB)\b/gi;
    const cryptoMatches = content.match(cryptoPattern);
    if (cryptoMatches) entities.push(...new Set(cryptoMatches));

    // Capitalized phrases (likely proper nouns)
    const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const properNouns = content.match(properNounPattern);
    if (properNouns) entities.push(...new Set(properNouns.slice(0, 10)));

    return [...new Set(entities)];
  }

  /**
   * Extract fact claims from content
   */
  private extractFactClaims(content: string): string[] {
    const facts: string[] = [];
    
    // Sentences with numbers (likely statistics or facts)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      if (/\d+/.test(sentence) && sentence.length < 200) {
        facts.push(sentence.trim());
      }
    }

    return facts.slice(0, 10);
  }

  /**
   * Generate canonical answers for common questions
   */
  private async generateCanonicalAnswers(content: string): Promise<any[]> {
    // Extract potential questions from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const questionSentences = sentences.filter(s => s.includes('?'));

    return questionSentences.slice(0, 5).map(question => ({
      question: question.trim(),
      answer: this.extractAnswerForQuestion(content, question),
    }));
  }

  /**
   * Extract answer for a question from content
   */
  private extractAnswerForQuestion(content: string, question: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const questionIndex = sentences.findIndex(s => s.includes(question));
    
    if (questionIndex >= 0 && questionIndex < sentences.length - 1) {
      const nextSentence = sentences[questionIndex + 1];
      return nextSentence ? nextSentence.trim().substring(0, 200) : '';
    }

    return '';
  }

  /**
   * Get optimization status for content
   */
  async getOptimizationStatus(contentId: string) {
    const optimization = await prisma.contentSEOOptimization.findUnique({
      where: { contentId },
    });

    const readability = await prisma.readabilityAnalysis.findUnique({
      where: { contentId },
    });

    const headlines = await prisma.headlineOptimization.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const internalLinks = await prisma.internalLinkSuggestion.findMany({
      where: {
        sourceContentId: contentId,
        status: 'suggested',
      },
      orderBy: { relevanceScore: 'desc' },
      take: 10,
    });

    return {
      optimization,
      readability,
      headlines,
      internalLinks,
    };
  }

  /**
   * Get all content optimizations for dashboard
   */
  async getAllOptimizations(filters?: {
    contentType?: string;
    minScore?: number;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters?.contentType) {
      where.contentType = filters.contentType;
    }
    
    if (filters?.minScore) {
      where.overallScore = { gte: filters.minScore };
    }

    const optimizations = await prisma.contentSEOOptimization.findMany({
      where,
      orderBy: { lastOptimized: 'desc' },
      take: filters?.limit || 50,
    });

    return optimizations;
  }
}

export const contentSeoOptimizationService = new ContentSEOOptimizationService();
