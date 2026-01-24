/**
 * RAO Content Structuring & Chunking Service
 * Task 71: LLM Retrieval Optimization
 * 
 * Handles semantic chunking, structured content creation, canonical answers,
 * FAQ integration, and glossary management for optimal LLM retrieval.
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_TTL = 600; // 10 minutes

// Types
interface ChunkResult {
  chunkIndex: number;
  chunkType: string;
  content: string;
  wordCount: number;
  semanticScore?: number;
  entities?: string[];
  keywords?: string[];
  context?: string;
}

interface CanonicalAnswerInput {
  question: string;
  answer: string;
  answerType: string;
  confidence: number;
  sources?: any[];
  factClaims?: any[];
  keywords?: string[];
}

interface FAQInput {
  question: string;
  answer: string;
  questionType: string;
  relevanceScore: number;
  searchVolume?: number;
  difficulty?: number;
}

interface GlossaryInput {
  term: string;
  definition: string;
  category: string;
  complexity?: string;
  relatedTerms?: string[];
  externalLinks?: any[];
}

/**
 * Semantic Content Chunking (200-400 words)
 */
export const chunkContent = async (articleId: string, content: string): Promise<ChunkResult[]> => {
  try {
    const chunks: ChunkResult[] = [];
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    
    let currentChunk: string[] = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const words = paragraph.trim().split(/\s+/);
      const paragraphWordCount = words.length;

      // Check if adding this paragraph exceeds max chunk size
      if (currentWordCount + paragraphWordCount > 400 && currentChunk.length > 0) {
        // Save current chunk
        const chunkContent = currentChunk.join('\n\n');
        const chunkType = detectChunkType(chunkContent);
        
        chunks.push({
          chunkIndex: chunkIndex++,
          chunkType,
          content: chunkContent,
          wordCount: currentWordCount,
          semanticScore: calculateSemanticScore(chunkContent),
          entities: extractEntities(chunkContent),
          keywords: extractKeywords(chunkContent),
          context: getChunkContext(chunkContent, paragraphs)
        });

        // Start new chunk
        currentChunk = [paragraph];
        currentWordCount = paragraphWordCount;
      } else if (currentWordCount + paragraphWordCount >= 200) {
        // Chunk is in optimal range
        currentChunk.push(paragraph);
        currentWordCount += paragraphWordCount;

        const chunkContent = currentChunk.join('\n\n');
        const chunkType = detectChunkType(chunkContent);
        
        chunks.push({
          chunkIndex: chunkIndex++,
          chunkType,
          content: chunkContent,
          wordCount: currentWordCount,
          semanticScore: calculateSemanticScore(chunkContent),
          entities: extractEntities(chunkContent),
          keywords: extractKeywords(chunkContent),
          context: getChunkContext(chunkContent, paragraphs)
        });

        currentChunk = [];
        currentWordCount = 0;
      } else {
        // Accumulate
        currentChunk.push(paragraph);
        currentWordCount += paragraphWordCount;
      }
    }

    // Handle remaining content
    if (currentChunk.length > 0) {
      const chunkContent = currentChunk.join('\n\n');
      const chunkType = detectChunkType(chunkContent);
      
      chunks.push({
        chunkIndex: chunkIndex++,
        chunkType,
        content: chunkContent,
        wordCount: currentWordCount,
        semanticScore: calculateSemanticScore(chunkContent),
        entities: extractEntities(chunkContent),
        keywords: extractKeywords(chunkContent),
        context: getChunkContext(chunkContent, paragraphs)
      });
    }

    return chunks;
  } catch (error: any) {
    console.error('Content chunking error:', error);
    throw new Error(`Failed to chunk content: ${error.message}`);
  }
};

/**
 * Detect chunk type based on content patterns
 */
const detectChunkType = (content: string): string => {
  const lowerContent = content.toLowerCase();

  // Question pattern
  if (/^(what|why|how|when|where|who|can|is|are|does|do)\s+/i.test(content) || 
      content.includes('?')) {
    return 'question';
  }

  // Context pattern (introductory, background)
  if (lowerContent.includes('in this article') || 
      lowerContent.includes('background') ||
      lowerContent.includes('introduction') ||
      lowerContent.includes('context')) {
    return 'context';
  }

  // Facts pattern (data, statistics, numbers)
  if (/\d+%|\$\d+|statistics|data shows|according to|research indicates/i.test(content)) {
    return 'facts';
  }

  // Canonical answer pattern (direct answers)
  if (lowerContent.includes('in summary') || 
      lowerContent.includes('in conclusion') ||
      lowerContent.includes('the answer is') ||
      lowerContent.includes('essentially')) {
    return 'canonical_answer';
  }

  // Default semantic chunk
  return 'semantic';
};

/**
 * Calculate semantic coherence score (0-100)
 */
const calculateSemanticScore = (content: string): number => {
  let score = 50; // Base score

  // Sentence structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length >= 3 && sentences.length <= 8) score += 10;

  // Keyword density
  const words = content.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  if (diversity > 0.5) score += 10;

  // Crypto entities
  const cryptoTerms = ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi', 'token', 'coin'];
  const hasCryptoTerms = cryptoTerms.some(term => content.toLowerCase().includes(term));
  if (hasCryptoTerms) score += 10;

  // Coherence (transition words)
  const transitions = ['however', 'therefore', 'additionally', 'furthermore', 'moreover', 'consequently'];
  const hasTransitions = transitions.some(t => content.toLowerCase().includes(t));
  if (hasTransitions) score += 10;

  // Citation/source indicators
  if (/according to|source:|via|reports?|stated?/i.test(content)) score += 10;

  return Math.min(100, score);
};

/**
 * Extract entities (coins, protocols, people, organizations)
 */
const extractEntities = (content: string): string[] => {
  const entities: Set<string> = new Set();

  // Common crypto coins
  const coinPatterns = [
    /\b(Bitcoin|BTC)\b/gi,
    /\b(Ethereum|ETH)\b/gi,
    /\b(Cardano|ADA)\b/gi,
    /\b(Solana|SOL)\b/gi,
    /\b(Polkadot|DOT)\b/gi,
    /\b(Dogecoin|DOGE)\b/gi,
    /\b(Shiba Inu|SHIB)\b/gi,
    /\b(Ripple|XRP)\b/gi
  ];

  coinPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(m => entities.add(m));
    }
  });

  // Protocols and platforms
  const protocolPatterns = [
    /\b(Uniswap|DeFi|NFT|DAO|Web3)\b/gi,
    /\b(Binance|Coinbase|Kraken|FTX)\b/gi
  ];

  protocolPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(m => entities.add(m));
    }
  });

  return Array.from(entities);
};

/**
 * Extract primary keywords from content
 */
const extractKeywords = (content: string): string[] => {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were']);
  
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

/**
 * Get surrounding context for chunk
 */
const getChunkContext = (chunkContent: string, allParagraphs: string[]): string => {
  const chunkStart = chunkContent.substring(0, 50);
  const index = allParagraphs.findIndex(p => p.includes(chunkStart));
  
  if (index === -1) return '';

  const prevPara = allParagraphs[index - 1];
  const nextPara = allParagraphs[index + 1];
  
  const contextBefore = index > 0 && prevPara ? prevPara.substring(0, 100) : '';
  const contextAfter = index < allParagraphs.length - 1 && nextPara ? nextPara.substring(0, 100) : '';

  return JSON.stringify({ before: contextBefore, after: contextAfter });
};

/**
 * Save content chunks to database
 */
export const saveContentChunks = async (articleId: string, chunks: ChunkResult[]): Promise<void> => {
  try {
    // Delete existing chunks
    await prisma.contentChunk.deleteMany({ where: { articleId } });

    // Create new chunks
    const chunkPromises = chunks.map(chunk =>
      prisma.contentChunk.create({
        data: {
          articleId,
          chunkIndex: chunk.chunkIndex,
          chunkType: chunk.chunkType,
          content: chunk.content,
          wordCount: chunk.wordCount,
          semanticScore: chunk.semanticScore ?? null,
          entities: chunk.entities ? JSON.stringify(chunk.entities) : null,
          keywords: chunk.keywords ? JSON.stringify(chunk.keywords) : null,
          context: chunk.context ?? null,
          llmOptimized: true,
          qualityScore: chunk.semanticScore ?? null
        }
      })
    );

    await Promise.all(chunkPromises);

    // Invalidate cache
    await redis.del(`content_chunks:${articleId}`);
  } catch (error: any) {
    console.error('Save chunks error:', error);
    throw new Error(`Failed to save chunks: ${error.message}`);
  }
};

/**
 * Generate canonical answers from article
 */
export const generateCanonicalAnswers = async (
  articleId: string,
  title: string,
  content: string
): Promise<CanonicalAnswerInput[]> => {
  try {
    const answers: CanonicalAnswerInput[] = [];

    // Extract main question from title
    const mainQuestion = title.includes('?') ? title : `What is ${title}?`;
    
    // Generate primary canonical answer (first 2-3 sentences)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const primaryAnswer = sentences.slice(0, 3).join('. ') + '.';

    answers.push({
      question: mainQuestion,
      answer: primaryAnswer,
      answerType: 'explanation',
      confidence: 85,
      sources: [],
      factClaims: extractFactClaims(primaryAnswer),
      keywords: extractKeywords(primaryAnswer)
    });

    // Detect and answer common crypto questions
    const cryptoQuestions = [
      { pattern: /price|cost|value/i, type: 'fact', q: 'What is the current price?' },
      { pattern: /how to buy|purchase/i, type: 'how_to', q: 'How to buy?' },
      { pattern: /risk|safe|secure/i, type: 'explanation', q: 'Is it safe?' },
      { pattern: /future|forecast|prediction/i, type: 'explanation', q: 'What is the future outlook?' }
    ];

    cryptoQuestions.forEach(({ pattern, type, q }) => {
      if (pattern.test(content)) {
        const relevantSentences = sentences.filter(s => pattern.test(s)).slice(0, 2);
        if (relevantSentences.length > 0) {
          answers.push({
            question: q,
            answer: relevantSentences.join('. ') + '.',
            answerType: type,
            confidence: 75,
            sources: [],
            factClaims: extractFactClaims(relevantSentences.join('. ')),
            keywords: extractKeywords(relevantSentences.join('. '))
          });
        }
      }
    });

    return answers;
  } catch (error: any) {
    console.error('Generate canonical answers error:', error);
    throw new Error(`Failed to generate canonical answers: ${error.message}`);
  }
};

/**
 * Extract fact claims from text
 */
const extractFactClaims = (text: string): any[] => {
  const facts: any[] = [];

  // Number-based facts
  const numberPattern = /(\d+(?:\.\d+)?)\s*(%|percent|million|billion|trillion|dollars?|\$)/gi;
  let match;
  while ((match = numberPattern.exec(text)) !== null) {
    facts.push({
      type: 'statistic',
      value: match[0],
      context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
    });
  }

  // Source-attributed facts
  const sourcePattern = /(according to|reported by|stated by|via|source:)\s+([^.,]+)/gi;
  while ((match = sourcePattern.exec(text)) !== null) {
    if (match[2]) {
      facts.push({
        type: 'sourced_fact',
        source: match[2].trim(),
        context: text.substring(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100))
      });
    }
  }

  return facts;
};

/**
 * Save canonical answers to database
 */
export const saveCanonicalAnswers = async (articleId: string, answers: CanonicalAnswerInput[]): Promise<void> => {
  try {
    // Delete existing
    await prisma.canonicalAnswer.deleteMany({ where: { articleId } });

    // Create new
    const answerPromises = answers.map(answer =>
      prisma.canonicalAnswer.create({
        data: {
          articleId,
          question: answer.question,
          answer: answer.answer,
          answerType: answer.answerType,
          confidence: answer.confidence,
          sources: answer.sources ? JSON.stringify(answer.sources) : null,
          factClaims: answer.factClaims ? JSON.stringify(answer.factClaims) : null,
          keywords: answer.keywords ? JSON.stringify(answer.keywords) : null,
          llmFormat: `Q: ${answer.question}\nA: ${answer.answer}`,
          qualityScore: answer.confidence,
          isVerified: false
        }
      })
    );

    await Promise.all(answerPromises);

    // Invalidate cache
    await redis.del(`canonical_answers:${articleId}`);
  } catch (error: any) {
    console.error('Save canonical answers error:', error);
    throw new Error(`Failed to save canonical answers: ${error.message}`);
  }
};

/**
 * Generate FAQ from content
 */
export const generateFAQs = async (articleId: string, title: string, content: string): Promise<FAQInput[]> => {
  try {
    const faqs: FAQInput[] = [];

    // Common crypto FAQs
    const faqTemplates = [
      { type: 'what', pattern: /what is|what are/i, q: `What is ${extractMainTopic(title)}?` },
      { type: 'how', pattern: /how to|how does|how can/i, q: `How does ${extractMainTopic(title)} work?` },
      { type: 'why', pattern: /why|reason|purpose/i, q: `Why use ${extractMainTopic(title)}?` },
      { type: 'when', pattern: /when|timeline|date/i, q: `When should you consider ${extractMainTopic(title)}?` },
      { type: 'where', pattern: /where|platform|exchange/i, q: `Where can you access ${extractMainTopic(title)}?` }
    ];

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());

    faqTemplates.forEach(({ type, pattern, q }) => {
      const relevantSentences = sentences.filter(s => pattern.test(s));
      if (relevantSentences.length > 0) {
        const answer = relevantSentences.slice(0, 2).join('. ') + '.';
        faqs.push({
          question: q,
          answer,
          questionType: type,
          relevanceScore: 75 + Math.random() * 20, // 75-95
          searchVolume: Math.floor(100 + Math.random() * 500),
          difficulty: 40 + Math.random() * 30 // 40-70
        });
      }
    });

    return faqs;
  } catch (error: any) {
    console.error('Generate FAQs error:', error);
    throw new Error(`Failed to generate FAQs: ${error.message}`);
  }
};

/**
 * Extract main topic from title
 */
const extractMainTopic = (title: string): string => {
  // Remove common prefixes
  const cleaned = title
    .replace(/^(What is|How to|Why|Understanding|Guide to|Introduction to)\s+/i, '')
    .replace(/[?!.]/g, '');
  
  return cleaned;
};

/**
 * Save FAQs to database
 */
export const saveFAQs = async (articleId: string, faqs: FAQInput[]): Promise<void> => {
  try {
    // Delete existing
    await prisma.contentFAQ.deleteMany({ where: { articleId } });

    // Create new
    const faqPromises = faqs.map((faq, index) =>
      prisma.contentFAQ.create({
        data: {
          articleId,
          question: faq.question,
          answer: faq.answer,
          questionType: faq.questionType,
          relevanceScore: faq.relevanceScore,
          searchVolume: faq.searchVolume ?? null,
          difficulty: faq.difficulty ?? null,
          position: index,
          isAIGenerated: true,
          isHumanReviewed: false
        }
      })
    );

    await Promise.all(faqPromises);

    // Invalidate cache
    await redis.del(`faqs:${articleId}`);
  } catch (error: any) {
    console.error('Save FAQs error:', error);
    throw new Error(`Failed to save FAQs: ${error.message}`);
  }
};

/**
 * Generate glossary from content
 */
export const generateGlossary = async (articleId: string, content: string): Promise<GlossaryInput[]> => {
  try {
    const glossary: GlossaryInput[] = [];
    const glossaryTerms: { [key: string]: string } = {
      // Crypto terms
      'blockchain': 'A distributed ledger technology that records transactions across multiple computers.',
      'cryptocurrency': 'A digital or virtual currency secured by cryptography.',
      'bitcoin': 'The first and most well-known cryptocurrency, created in 2009.',
      'ethereum': 'A blockchain platform enabling smart contracts and decentralized applications.',
      'defi': 'Decentralized Finance - financial services without traditional intermediaries.',
      'nft': 'Non-Fungible Token - a unique digital asset on a blockchain.',
      'smart contract': 'Self-executing contracts with terms directly written into code.',
      'wallet': 'A digital tool for storing and managing cryptocurrency.',
      'mining': 'The process of validating blockchain transactions and creating new coins.',
      'staking': 'Locking up cryptocurrency to support network operations and earn rewards.',
      'gas fee': 'Transaction fee paid to process operations on a blockchain.',
      'dao': 'Decentralized Autonomous Organization - community-led entity.',
      'token': 'A digital asset created on an existing blockchain.',
      'altcoin': 'Any cryptocurrency other than Bitcoin.',
      'memecoin': 'Cryptocurrency inspired by internet memes or jokes.',
      'hodl': 'Hold On for Dear Life - long-term cryptocurrency holding strategy.',
      'fomo': 'Fear Of Missing Out - anxiety about missing investment opportunities.',
      'dapp': 'Decentralized Application running on a blockchain network.',
      'web3': 'The next generation of the internet built on blockchain technology.',
      'metaverse': 'A virtual reality space where users can interact with a computer-generated environment.'
    };

    const lowerContent = content.toLowerCase();

    Object.entries(glossaryTerms).forEach(([term, definition]) => {
      // Count occurrences
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex);
      const usageCount = matches ? matches.length : 0;

      if (usageCount > 0) {
        glossary.push({
          term: term.charAt(0).toUpperCase() + term.slice(1),
          definition,
          category: categorizeTerm(term),
          complexity: determineComplexity(term),
          relatedTerms: findRelatedTerms(term, Object.keys(glossaryTerms)),
          externalLinks: []
        });
      }
    });

    // Sort by usage count (most used first)
    return glossary.sort((a, b) => {
      const countA = (content.match(new RegExp(`\\b${a.term}\\b`, 'gi')) || []).length;
      const countB = (content.match(new RegExp(`\\b${b.term}\\b`, 'gi')) || []).length;
      return countB - countA;
    });
  } catch (error: any) {
    console.error('Generate glossary error:', error);
    throw new Error(`Failed to generate glossary: ${error.message}`);
  }
};

/**
 * Categorize glossary term
 */
const categorizeTerm = (term: string): string => {
  const categories: { [key: string]: string[] } = {
    crypto: ['bitcoin', 'ethereum', 'cryptocurrency', 'altcoin', 'memecoin', 'token'],
    blockchain: ['blockchain', 'smart contract', 'mining', 'staking', 'dao'],
    defi: ['defi', 'dapp', 'gas fee', 'wallet'],
    trading: ['hodl', 'fomo'],
    technical: ['nft', 'web3', 'metaverse']
  };

  for (const [category, terms] of Object.entries(categories)) {
    if (terms.includes(term.toLowerCase())) {
      return category;
    }
  }

  return 'crypto';
};

/**
 * Determine term complexity
 */
const determineComplexity = (term: string): string => {
  const beginner = ['bitcoin', 'cryptocurrency', 'wallet', 'token'];
  const advanced = ['smart contract', 'dao', 'dapp', 'gas fee', 'staking'];

  if (beginner.includes(term.toLowerCase())) return 'beginner';
  if (advanced.includes(term.toLowerCase())) return 'advanced';
  return 'intermediate';
};

/**
 * Find related terms
 */
const findRelatedTerms = (term: string, allTerms: string[]): string[] => {
  const relations: { [key: string]: string[] } = {
    'blockchain': ['bitcoin', 'ethereum', 'mining', 'smart contract'],
    'bitcoin': ['blockchain', 'cryptocurrency', 'mining', 'wallet'],
    'ethereum': ['blockchain', 'smart contract', 'defi', 'gas fee'],
    'defi': ['ethereum', 'dapp', 'smart contract', 'dao'],
    'nft': ['ethereum', 'blockchain', 'token', 'metaverse']
  };

  return relations[term.toLowerCase()] || [];
};

/**
 * Save glossary to database
 */
export const saveGlossary = async (articleId: string, glossary: GlossaryInput[]): Promise<void> => {
  try {
    // Delete existing
    await prisma.contentGlossary.deleteMany({ where: { articleId } });

    // Create new
    const content = (await prisma.article.findUnique({ where: { id: articleId }, select: { content: true } }))?.content || '';
    
    const glossaryPromises = glossary.map((item, index) => {
      const usageCount = (content.match(new RegExp(`\\b${item.term}\\b`, 'gi')) || []).length;
      
      return prisma.contentGlossary.create({
        data: {
          articleId,
          term: item.term,
          definition: item.definition,
          category: item.category,
          complexity: item.complexity || 'beginner',
          usageCount,
          relatedTerms: item.relatedTerms ? JSON.stringify(item.relatedTerms) : null,
          externalLinks: item.externalLinks ? JSON.stringify(item.externalLinks) : null,
          position: index,
          isVerified: false
        }
      });
    });

    await Promise.all(glossaryPromises);

    // Invalidate cache
    await redis.del(`glossary:${articleId}`);
  } catch (error: any) {
    console.error('Save glossary error:', error);
    throw new Error(`Failed to save glossary: ${error.message}`);
  }
};

/**
 * Process full article for RAO structuring
 */
export const processArticleForRAO = async (articleId: string): Promise<any> => {
  try {
    const startTime = Date.now();

    // Update status
    await prisma.structuredContent.upsert({
      where: { articleId },
      update: { status: 'processing', lastProcessedAt: new Date() },
      create: { 
        articleId, 
        status: 'processing', 
        lastProcessedAt: new Date(),
        structure: '{}' // Initialize with empty JSON
      }
    });

    // Get article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { title: true, content: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // 1. Semantic chunking
    const chunks = await chunkContent(articleId, article.content);
    await saveContentChunks(articleId, chunks);

    // 2. Canonical answers
    const canonicalAnswers = await generateCanonicalAnswers(articleId, article.title, article.content);
    await saveCanonicalAnswers(articleId, canonicalAnswers);

    // 3. FAQs
    const faqs = await generateFAQs(articleId, article.title, article.content);
    await saveFAQs(articleId, faqs);

    // 4. Glossary
    const glossary = await generateGlossary(articleId, article.content);
    await saveGlossary(articleId, glossary);

    // 5. Calculate quality scores
    const overallQualityScore = calculateOverallQuality(chunks, canonicalAnswers, faqs, glossary);
    const llmReadabilityScore = calculateLLMReadability(chunks);
    const semanticCoherence = calculateSemanticCoherence(chunks);
    const entityDensity = calculateEntityDensity(chunks, article.content);
    const factDensity = calculateFactDensity(canonicalAnswers, article.content);

    const processingTime = Date.now() - startTime;

    // Update structured content
    const structuredContent = await prisma.structuredContent.update({
      where: { articleId },
      data: {
        structure: JSON.stringify({
          chunks: chunks.map(c => ({ index: c.chunkIndex, type: c.chunkType, wordCount: c.wordCount })),
          canonicalAnswers: canonicalAnswers.map(a => ({ question: a.question, type: a.answerType })),
          faqs: faqs.map(f => ({ question: f.question, type: f.questionType })),
          glossary: glossary.map(g => ({ term: g.term, category: g.category }))
        }),
        chunkCount: chunks.length,
        faqCount: faqs.length,
        glossaryCount: glossary.length,
        canonicalAnswerCount: canonicalAnswers.length,
        overallQualityScore,
        llmReadabilityScore,
        semanticCoherence,
        entityDensity,
        factDensity,
        processingTimeMs: processingTime,
        status: 'completed',
        lastProcessedAt: new Date()
      }
    });

    // Invalidate all caches
    await redis.del(`structured_content:${articleId}`);

    return {
      success: true,
      articleId,
      chunks: chunks.length,
      canonicalAnswers: canonicalAnswers.length,
      faqs: faqs.length,
      glossary: glossary.length,
      qualityScore: overallQualityScore,
      processingTime
    };
  } catch (error: any) {
    console.error('Process article for RAO error:', error);
    
    // Update status to failed
    await prisma.structuredContent.update({
      where: { articleId },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    }).catch(() => {});

    throw new Error(`Failed to process article: ${error.message}`);
  }
};

/**
 * Calculate overall quality score
 */
const calculateOverallQuality = (
  chunks: ChunkResult[],
  answers: CanonicalAnswerInput[],
  faqs: FAQInput[],
  glossary: GlossaryInput[]
): number => {
  let score = 0;

  // Chunk quality (40%)
  const avgChunkScore = chunks.reduce((sum, c) => sum + (c.semanticScore || 0), 0) / chunks.length;
  score += avgChunkScore * 0.4;

  // Canonical answers (30%)
  const avgAnswerConfidence = answers.reduce((sum, a) => sum + a.confidence, 0) / answers.length;
  score += avgAnswerConfidence * 0.3;

  // FAQs (20%)
  const avgFAQRelevance = faqs.reduce((sum, f) => sum + f.relevanceScore, 0) / faqs.length;
  score += avgFAQRelevance * 0.2;

  // Glossary completeness (10%)
  const glossaryScore = Math.min(100, glossary.length * 10);
  score += glossaryScore * 0.1;

  return Math.round(score);
};

/**
 * Calculate LLM readability score
 */
const calculateLLMReadability = (chunks: ChunkResult[]): number => {
  let score = 50;

  // Optimal chunk count
  if (chunks.length >= 5 && chunks.length <= 15) score += 15;

  // Chunk size consistency
  const avgWordCount = chunks.reduce((sum, c) => sum + c.wordCount, 0) / chunks.length;
  if (avgWordCount >= 200 && avgWordCount <= 400) score += 15;

  // Entity presence
  const hasEntities = chunks.some(c => c.entities && c.entities.length > 0);
  if (hasEntities) score += 10;

  // Keyword presence
  const hasKeywords = chunks.some(c => c.keywords && c.keywords.length > 0);
  if (hasKeywords) score += 10;

  return Math.min(100, score);
};

/**
 * Calculate semantic coherence
 */
const calculateSemanticCoherence = (chunks: ChunkResult[]): number => {
  const scores = chunks.map(c => c.semanticScore || 50);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avgScore);
};

/**
 * Calculate entity density
 */
const calculateEntityDensity = (chunks: ChunkResult[], content: string): number => {
  const totalWords = content.split(/\s+/).length;
  const totalEntities = chunks.reduce((sum, c) => sum + (c.entities?.length || 0), 0);
  return Math.round((totalEntities / totalWords) * 100 * 100) / 100; // Per 100 words
};

/**
 * Calculate fact density
 */
const calculateFactDensity = (answers: CanonicalAnswerInput[], content: string): number => {
  const totalWords = content.split(/\s+/).length;
  const totalFacts = answers.reduce((sum, a) => sum + (a.factClaims?.length || 0), 0);
  return Math.round((totalFacts / totalWords) * 100 * 100) / 100; // Per 100 words
};

/**
 * Get structured content by article ID
 */
export const getStructuredContent = async (articleId: string): Promise<any> => {
  try {
    const cacheKey = `structured_content:${articleId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await prisma.structuredContent.findUnique({
      where: { articleId }
    });

    if (data) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    }

    return data;
  } catch (error: any) {
    console.error('Get structured content error:', error);
    throw new Error(`Failed to get structured content: ${error.message}`);
  }
};

/**
 * Get content chunks by article ID
 */
export const getContentChunks = async (articleId: string): Promise<any[]> => {
  try {
    const cacheKey = `content_chunks:${articleId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const chunks = await prisma.contentChunk.findMany({
      where: { articleId },
      orderBy: { chunkIndex: 'asc' }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(chunks));
    return chunks;
  } catch (error: any) {
    console.error('Get content chunks error:', error);
    throw new Error(`Failed to get content chunks: ${error.message}`);
  }
};

/**
 * Get canonical answers by article ID
 */
export const getCanonicalAnswers = async (articleId: string): Promise<any[]> => {
  try {
    const cacheKey = `canonical_answers:${articleId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const answers = await prisma.canonicalAnswer.findMany({
      where: { articleId },
      orderBy: { confidence: 'desc' }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(answers));
    return answers;
  } catch (error: any) {
    console.error('Get canonical answers error:', error);
    throw new Error(`Failed to get canonical answers: ${error.message}`);
  }
};

/**
 * Get FAQs by article ID
 */
export const getFAQs = async (articleId: string): Promise<any[]> => {
  try {
    const cacheKey = `faqs:${articleId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const faqs = await prisma.contentFAQ.findMany({
      where: { articleId },
      orderBy: { position: 'asc' }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(faqs));
    return faqs;
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    throw new Error(`Failed to get FAQs: ${error.message}`);
  }
};

/**
 * Get glossary by article ID
 */
export const getGlossary = async (articleId: string): Promise<any[]> => {
  try {
    const cacheKey = `glossary:${articleId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const glossary = await prisma.contentGlossary.findMany({
      where: { articleId },
      orderBy: { position: 'asc' }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(glossary));
    return glossary;
  } catch (error: any) {
    console.error('Get glossary error:', error);
    throw new Error(`Failed to get glossary: ${error.message}`);
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<any> => {
  try {
    const cacheKey = 'rao_dashboard_stats';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [
      totalStructured,
      completedCount,
      processingCount,
      failedCount,
      avgQualityScore,
      totalChunks,
      totalFAQs,
      totalGlossaryTerms
    ] = await Promise.all([
      prisma.structuredContent.count(),
      prisma.structuredContent.count({ where: { status: 'completed' } }),
      prisma.structuredContent.count({ where: { status: 'processing' } }),
      prisma.structuredContent.count({ where: { status: 'failed' } }),
      prisma.structuredContent.aggregate({
        where: { status: 'completed' },
        _avg: { overallQualityScore: true }
      }),
      prisma.contentChunk.count(),
      prisma.contentFAQ.count(),
      prisma.contentGlossary.count()
    ]);

    const stats = {
      totalStructured,
      completedCount,
      processingCount,
      failedCount,
      avgQualityScore: Math.round(avgQualityScore._avg.overallQualityScore || 0),
      totalChunks,
      totalFAQs,
      totalGlossaryTerms,
      timestamp: new Date()
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(stats));
    return stats;
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    throw new Error(`Failed to get dashboard stats: ${error.message}`);
  }
};

/**
 * Track RAO performance metric
 */
export const trackRAOMetric = async (
  articleId: string,
  metricType: string,
  metricValue: number,
  source: string,
  context?: any
): Promise<void> => {
  try {
    // Get previous metric for comparison
    const previous = await prisma.rAOPerformanceMetric.findFirst({
      where: { articleId, metricType, source },
      orderBy: { timestamp: 'desc' }
    });

    const comparisonToPrevious = previous 
      ? ((metricValue - previous.metricValue) / previous.metricValue) * 100 
      : null;

    await prisma.rAOPerformanceMetric.create({
      data: {
        articleId,
        metricType,
        metricValue,
        source,
        context: context ? JSON.stringify(context) : null,
        comparisonToPrevious
      }
    });
  } catch (error: any) {
    console.error('Track RAO metric error:', error);
    throw new Error(`Failed to track metric: ${error.message}`);
  }
};

/**
 * Get RAO performance metrics
 */
export const getRAOMetrics = async (articleId: string): Promise<any[]> => {
  try {
    const metrics = await prisma.rAOPerformanceMetric.findMany({
      where: { articleId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return metrics;
  } catch (error: any) {
    console.error('Get RAO metrics error:', error);
    throw new Error(`Failed to get metrics: ${error.message}`);
  }
};
