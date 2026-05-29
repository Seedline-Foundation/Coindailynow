/// <reference types="node" />
// Imo Prompt Generation Agent - Advanced Prompt Engineering for Quality AI Outputs
// Specialized in prompt chaining, negative prompting, RAG integration, and multi-step workflows

// Audit logging (stubbed for standalone usage)
const createAuditLog = async (data: any) => { /* stub */ };
const AuditActions = {
  IMO_PROMPT_GENERATED: 'imo_prompt_generated',
  SETTINGS_UPDATE: 'settings_update',
  ARTICLE_CREATE: 'article_create',
  ARTICLE_DELETE: 'article_delete'
};

/**
 * Prompt generation strategies
 */
export type PromptStrategy = 
  | 'simple'           // Single-step direct prompt
  | 'chain'            // Multi-step prompt chaining
  | 'writer_editor'    // Two-step reasoning + writing
  | 'rag_enhanced'     // RAG-augmented prompting
  | 'negative'         // Include negative prompts
  | 'hybrid';          // Combination of strategies

/**
 * Content types for prompt generation
 */
export type ContentType = 
  | 'article'
  | 'image'
  | 'video'
  | 'translation'
  | 'seo'
  | 'social'
  | 'summary'
  | 'analysis';

/**
 * Request for prompt generation
 */
export interface ImoPromptRequest {
  contentType: ContentType;
  strategy: PromptStrategy;
  context: {
    // Core context
    topic?: string;
    targetAudience?: 'beginner' | 'intermediate' | 'expert' | 'general';
    tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'formal';
    
    // Content-specific
    keywords?: string[];
    africanFocus?: boolean;
    caribbeanFocus?: boolean;
    latamFocus?: boolean;
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
    
    // Custom context
    customInstructions?: string;
    metadata?: Record<string, any>;
  };
  options?: {
    maxSteps?: number;              // For chained prompts
    includeNegativePrompt?: boolean; // For image/video
    enableRAG?: boolean;             // Enable RAG enhancement
    temperature?: number;            // Model temperature suggestion
    returnIntermediateSteps?: boolean; // Return all chain steps
    optimizeForModel?: 'gpt4' | 'llama' | 'gemini' | 'dalle' | 'stable-diffusion';
  };
}

/**
 * Generated prompt result
 */
export interface ImoPromptResult {
  // Primary prompt(s)
  prompt: string | string[];  // Single or array for chained prompts
  negativePrompt?: string;    // For image/video generation
  
  // Metadata
  strategy: PromptStrategy;
  steps?: Array<{
    stepNumber: number;
    purpose: string;
    prompt: string;
    expectedOutput?: string;
  }>;
  
  // Model configuration suggestions
  modelConfig?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  
  // Quality metrics
  quality: {
    clarityScore: number;        // How clear the prompt is
    specificity: number;         // How specific/detailed
    contextRichness: number;     // Amount of context provided
    expectedQuality: 'low' | 'medium' | 'high' | 'exceptional';
  };
  
  // Processing info
  processingTime: number;
  tokensEstimate?: number;
  
  // RAG data (if applicable)
  ragContext?: {
    sourcesUsed: number;
    relevantSnippets: string[];
    confidenceScore: number;
  };
}

/**
 * Imo - Advanced Prompt Generation Agent
 */
export class ImoPromptAgent {
  private isInitialized: boolean = false;
  private performanceMetrics: {
    totalPrompts: number;
    avgQualityScore: number;
    successRate: number;
    avgProcessingTime: number;
  } = {
    totalPrompts: 0,
    avgQualityScore: 0,
    successRate: 0,
    avgProcessingTime: 0
  };

  constructor() {
    // Initialize with default configuration
  }

  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'imo_prompt_agent',
        resourceId: 'imo-v1',
        details: { 
          initialized: true,
          capabilities: [
            'prompt_chaining',
            'negative_prompting',
            'rag_integration',
            'writer_editor_pattern',
            'multi_language_support'
          ]
        }
      });

      console.log('✅ Imo Prompt Agent initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Imo Prompt Agent:', error);
      throw error;
    }
  }

  /**
   * Main entry point - Generate optimized prompts
   */
  async generatePrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      let result: ImoPromptResult;

      // Route to appropriate strategy
      switch (request.strategy) {
        case 'chain':
          result = await this.generateChainedPrompt(request);
          break;
        
        case 'writer_editor':
          result = await this.generateWriterEditorPrompt(request);
          break;
        
        case 'rag_enhanced':
          result = await this.generateRAGEnhancedPrompt(request);
          break;
        
        case 'negative':
          result = await this.generateNegativePrompt(request);
          break;
        
        case 'hybrid':
          result = await this.generateHybridPrompt(request);
          break;
        
        case 'simple':
        default:
          result = await this.generateSimplePrompt(request);
          break;
      }

      // Add processing metrics
      result.processingTime = Date.now() - startTime;
      
      // Update performance metrics
      this.updateMetrics(result);

      // Log successful generation
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'imo_prompt',
        resourceId: `prompt-${Date.now()}`,
        details: {
          contentType: request.contentType,
          strategy: request.strategy,
          qualityScore: result.quality.expectedQuality,
          processingTime: result.processingTime
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'imo_prompt',
        resourceId: `error-${Date.now()}`,
        details: {
          error: errorMessage,
          contentType: request.contentType,
          strategy: request.strategy
        }
      });

      throw error;
    }
  }

  /**
   * STRATEGY 1: Simple direct prompt
   */
  private async generateSimplePrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    let prompt = '';

    switch (request.contentType) {
      case 'article':
        prompt = this.buildArticlePrompt(request);
        break;
      case 'image':
        prompt = this.buildImagePrompt(request);
        break;
      case 'translation':
        prompt = this.buildTranslationPrompt(request);
        break;
      case 'seo':
        prompt = this.buildSEOPrompt(request);
        break;
      default:
        prompt = this.buildGenericPrompt(request);
    }

    return {
      prompt,
      strategy: 'simple',
      quality: this.assessPromptQuality(prompt, request),
      processingTime: 0,
      modelConfig: this.suggestModelConfig(request)
    };
  }

  /**
   * STRATEGY 2: Prompt Chaining (Multi-step)
   * Example: Translation with terminology extraction first
   */
  private async generateChainedPrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    const steps: Array<{
      stepNumber: number;
      purpose: string;
      prompt: string;
      expectedOutput?: string;
    }> = [];

    // Build chain based on content type
    if (request.contentType === 'translation') {
      // Step 1: Extract terminology and tone
      steps.push({
        stepNumber: 1,
        purpose: 'Extract key terminology, tone, and context',
        prompt: this.buildTerminologyExtractionPrompt(request),
        expectedOutput: 'JSON with key terms, tone analysis, and cultural context'
      });

      // Step 2: Perform translation using extracted context
      steps.push({
        stepNumber: 2,
        purpose: 'Translate with preserved terminology and tone',
        prompt: this.buildContextualTranslationPrompt(request),
        expectedOutput: 'Translated text maintaining tone and terminology'
      });

    } else if (request.contentType === 'seo' || request.contentType === 'article') {
      // Writer-Editor pattern for articles
      steps.push({
        stepNumber: 1,
        purpose: 'Research and create content outline',
        prompt: this.buildResearchPrompt(request),
        expectedOutput: 'Structured outline with keywords and sections'
      });

      steps.push({
        stepNumber: 2,
        purpose: 'Write content based on outline',
        prompt: this.buildWritingPrompt(request),
        expectedOutput: 'Complete article following outline structure'
      });

    } else if (request.contentType === 'image') {
      // Multi-step image generation
      steps.push({
        stepNumber: 1,
        purpose: 'Analyze visual requirements',
        prompt: this.buildVisualAnalysisPrompt(request),
        expectedOutput: 'Visual composition strategy'
      });

      steps.push({
        stepNumber: 2,
        purpose: 'Generate detailed image prompt',
        prompt: this.buildDetailedImagePrompt(request),
        expectedOutput: 'Optimized DALL-E/SD prompt'
      });
    }

    const prompts = steps.map(s => s.prompt);
    const fullPrompt = prompts.join('\n\n---NEXT STEP---\n\n');

    return {
      prompt: request.options?.returnIntermediateSteps ? prompts : fullPrompt,
      strategy: 'chain',
      steps,
      quality: this.assessPromptQuality(fullPrompt, request),
      processingTime: 0,
      modelConfig: this.suggestModelConfig(request)
    };
  }

  /**
   * STRATEGY 3: Writer-Editor Pattern (for SEO articles)
   */
  private async generateWriterEditorPrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    const steps = [
      {
        stepNumber: 1,
        purpose: 'Reasoning Phase - Research and plan',
        prompt: this.buildReasoningPrompt(request),
        expectedOutput: 'SEO strategy, keyword research, content outline'
      },
      {
        stepNumber: 2,
        purpose: 'Writing Phase - Create content',
        prompt: this.buildExecutionPrompt(request),
        expectedOutput: 'Polished article with SEO optimization'
      }
    ];

    return {
      prompt: steps.map(s => s.prompt),
      strategy: 'writer_editor',
      steps,
      quality: {
        clarityScore: 0.95,
        specificity: 0.90,
        contextRichness: 0.92,
        expectedQuality: 'exceptional'
      },
      processingTime: 0,
      modelConfig: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9
      }
    };
  }

  /**
   * STRATEGY 4: RAG-Enhanced Prompting (for search optimization)
   */
  private async generateRAGEnhancedPrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    const { contextDocs = [], searchQuery = '' } = request.context;

    // Build context from retrieved documents
    const contextSnippets = contextDocs
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, 5)  // Top 5 most relevant
      .map((doc, idx) => 
        `[Source ${idx + 1}] ${doc.title}\n${doc.content.substring(0, 500)}...\n`
      )
      .join('\n');

    const ragPrompt = `You are a cryptocurrency expert providing accurate, up-to-date information based on recent sources.

USER QUERY: ${searchQuery || request.context.topic || 'cryptocurrency information'}

RETRIEVED CONTEXT FROM RECENT SOURCES:
${contextSnippets}

INSTRUCTIONS:
1. Synthesize information from the provided sources
2. Provide accurate, fact-based response
3. Cite source numbers when referencing specific information
4. If sources conflict, mention both perspectives
5. If information is not in sources, clearly state "based on general knowledge" vs "based on provided sources"
6. Focus on African market context when relevant
${request.context.africanFocus ? '7. Emphasize African cryptocurrency adoption, regulations, and market dynamics' : ''}

Generate a comprehensive, well-structured response:`;

    return {
      prompt: ragPrompt,
      strategy: 'rag_enhanced',
      quality: {
        clarityScore: 0.93,
        specificity: 0.95,
        contextRichness: 0.98,
        expectedQuality: 'exceptional'
      },
      ragContext: {
        sourcesUsed: contextDocs.length,
        relevantSnippets: contextDocs.map(d => d.content.substring(0, 200)),
        confidenceScore: contextDocs.length > 0 ? 0.90 : 0.60
      },
      processingTime: 0,
      modelConfig: {
        temperature: 0.5,  // Lower for factual accuracy
        maxTokens: 1500
      }
    };
  }

  /**
   * STRATEGY 5: Negative Prompting (for image/video generation)
   */
  private async generateNegativePrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    const positivePrompt = request.contentType === 'image' 
      ? this.buildImagePrompt(request)
      : this.buildVideoPrompt(request);

    // Build comprehensive negative prompt for quality control
    const negativeElements = [
      // Quality issues
      'low quality', 'blurry', 'pixelated', 'grainy', 'distorted',
      'warped', 'deformed', 'disfigured', 'poor anatomy',
      
      // For video specifically
      ...(request.contentType === 'video' ? [
        'flickering', 'frame drops', 'stuttering', 'temporal inconsistency',
        'motion blur', 'compression artifacts', 'glitchy'
      ] : []),
      
      // Content issues
      'ugly', 'amateur', 'unprofessional', 'cluttered', 'messy',
      'text errors', 'watermark', 'signature', 'username',
      
      // Composition issues
      'cropped', 'cut off', 'out of frame', 'bad framing',
      'poor composition', 'unbalanced'
    ];

    const negativePrompt = negativeElements.join(', ');

    return {
      prompt: positivePrompt,
      negativePrompt,
      strategy: 'negative',
      quality: {
        clarityScore: 0.88,
        specificity: 0.92,
        contextRichness: 0.85,
        expectedQuality: 'high'
      },
      processingTime: 0,
      modelConfig: {
        ...(request.options?.optimizeForModel === 'stable-diffusion' && {
          // Stable Diffusion specific settings
          temperature: 0.8,
          topP: 0.95
        })
      }
    };
  }

  /**
   * STRATEGY 6: Hybrid (combine multiple strategies)
   */
  private async generateHybridPrompt(request: ImoPromptRequest): Promise<ImoPromptResult> {
    // Combine RAG + Chaining + Negative (if applicable)
    const baseResult = request.options?.enableRAG
      ? await this.generateRAGEnhancedPrompt(request)
      : await this.generateChainedPrompt(request);

    // Add negative prompt for visual content
    if (request.contentType === 'image' || request.contentType === 'video') {
      const negativeResult = await this.generateNegativePrompt(request);
      baseResult.negativePrompt = negativeResult.negativePrompt;
    }

    return {
      ...baseResult,
      strategy: 'hybrid',
      quality: {
        ...baseResult.quality,
        expectedQuality: 'exceptional'
      }
    };
  }

  // ============================================
  // PROMPT BUILDERS FOR DIFFERENT CONTENT TYPES
  // ============================================

  /**
   * CoinDaily Editorial Tone Constraint — Bloomberg-tier, not CoinDesk/tabloid.
   * Applied to every article and SEO prompt. Ensures confident neutral reporting.
   */
  private static readonly EDITORIAL_TONE_CONSTRAINT = `
=== EDITORIAL TONE POLICY (MANDATORY) ===
You are writing for CoinDaily — a Bloomberg-tier financial news platform, NOT a hype blog. We cover Crypto, AI, TradFi, and Blockchain across Africa, LatAm, and the Caribbean.

BANNED LANGUAGE — never use these words or their synonyms:
- Crypto/Blockchain: "moon", "mooning", "to the moon", "rocket", "skyrocket", "lambo", "pump", "dump", "shill", "FUD" (as dismissal), "hopium", "gem", "100x", "Ethereum killer", "web3 will save the world", "decentralize everything", "guaranteed returns", "can't lose", "WAGMI", "NGMI", "diamond hands", "degen"
- AI: "sentient", "singularity", "killer AI", "AGI next month", "revolutionary algorithm", "mind-blowing tool", "100x productivity", "world-ending", "God-like AI", "skynet", "silver bullet"
- TradFi: "hyperinflation collapse", "infinite money printer", "bank run tomorrow", "easy double", "no-risk yield", "get rich quick", "fiat is dead", "unlimited printing"

REQUIRED TONE:
- Confident, neutral, data-driven — like Bloomberg, Reuters, or the Financial Times
- Use precise language: "rose 12%", "declined to $X", "regulatory framework", "technological capacity", "monetary policy"
- Attribute claims: "according to CBN data", "reports from Banco Central do Brasil show", "Eastern Caribbean Central Bank estimates"
- No exclamation marks in body text. No clickbait headlines.
- Every claim must be attributable to data or a named source.
- Regional-first framing: lead with regional impact (Africa, LatAm, Caribbean), not US/EU context.
=== END EDITORIAL TONE POLICY ===`;

  private buildArticlePrompt(request: ImoPromptRequest): string {
    const { topic, tone = 'professional', targetAudience = 'general', africanFocus, caribbeanFocus, latamFocus, keywords = [] } = request.context;

    return `You are an expert journalist writing for CoinDaily (covering Crypto, AI, TradFi, and Blockchain).

TOPIC: ${topic || 'financial news'}
AUDIENCE: ${targetAudience}
TONE: ${tone}
${africanFocus ? 'FOCUS: African market, regulations, adoption, and regional impact (lead with African context first)' : ''}
${latamFocus ? 'FOCUS: Latin American market, fintech, regulations, and regional impact (lead with LatAm context first)' : ''}
${caribbeanFocus ? 'FOCUS: Caribbean market, banking/CBDCs, regulations, and regional impact (lead with Caribbean context first)' : ''}

=== TARGET REGIONAL PRIORITIES ===
- Africa: Nigeria (weight 40%, CBN, Quidax/Binance), Kenya (weight 20%, M-Pesa), South Africa (weight 20%, FSCA, Luno/VALR), Ghana (weight 10%, BoG), Egypt (weight 10%, CBE).
- LatAm: Brazil (weight 40%, BCB, Pix), Argentina (weight 25%, Ripio/Lemon Cash, inflation hedging), El Salvador (weight 15%, legal tender), Colombia (weight 10%, PSE), Mexico (weight 10%, Bitso/SPEI).
- Caribbean: ECCU (weight 35%, ECCB, DCash), Jamaica (weight 30%, BOJ, JamDex), Trinidad & Tobago (weight 20%, WiPay), Bahamas (weight 15%, CBOB, Sand Dollar).

=== MACROECONOMIC CONTEXT INTEGRATION ===
- Force check of inflation hedging (e.g. stablecoin adoption in regions facing high inflation like Nigeria or Argentina).
- Force check of remittance cost-savings metrics (Stablecoins/Stellar vs. Western Union/MoneyGram).

=== MOBILE MONEY & LOCAL PAYMENTS ===
- Actively require mentioning local payment infrastructure (e.g., M-Pesa, MTN MoMo for Africa; Pix, PSE for LatAm; JamDex, DCash, WiPay for Caribbean) where relevant to accessibility.

${ImoPromptAgent.EDITORIAL_TONE_CONSTRAINT}
${keywords.length > 0 ? `TARGET KEYWORDS: ${keywords.join(', ')}` : ''}

=== MANDATORY: RANKBRAIN-FRIENDLY CONTENT FRAMEWORK (8 STEPS) ===

STEP 1 - HOOK (first 100 words): Start with problem agitation. What is the reader's pain point or burning question about "${topic}"? Create urgency and curiosity. Include the primary keyword naturally in the opening.

STEP 2 - TABLE OF CONTENTS: Include a structured table of contents with anchor links to each major section. This increases dwell time and improves Google's understanding of your content.

STEP 3 - H2/H3 HIERARCHY WITH KEYWORD VARIATIONS: Structure using clear H2 and H3 headings. Each H2 heading should include a keyword variation. Use at least 4-6 H2 sections with sub-sections.

STEP 4 - MULTIMEDIA PLACEHOLDERS EVERY 300 WORDS: Insert [IMAGE: description], [VIDEO: description], or [CHART: description] markers every ~300 words for media to be added in post-production.

STEP 5 - FAQ SECTION (with JSON-LD): Include 3-5 FAQs targeting "People Also Ask" with concise answers. After the human-readable FAQ section, include a JSON-LD block in this exact format:
\`\`\`json-ld
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ]
}
\`\`\`

STEP 6 - SOURCES CITED: At the end of the article, include a "Sources" section listing every factual claim's source. Each source must include:
  - Source name (e.g., central bank name, local exchanges, Reuters)
  - Date of data/publication (if known)
  - URL or document reference (if available)
Format: numbered list. Minimum 3 sources per article. Bloomberg and Reuters cite every claim — so do we.

STEP 7 - STRONG CTA: End with a call-to-action directing readers to related CoinDaily content and newsletter subscription.

STEP 8 - METADATA: Output a structured metadata block at the very end:
\`\`\`metadata
sources_count: [number]
faq_count: [number]
word_count: [approximate]
primary_region: [Country/region most relevant]
\`\`\`

=== END FRAMEWORK ===

Write a comprehensive, engaging article that:
1. Opens with a compelling hook (problem agitation) with primary keyword
2. Includes table of contents with jump links
3. Provides accurate, well-researched information in H2/H3 hierarchy
4. Includes multimedia placeholders every 300 words
5. Addresses regional market context (Africa, LatAm, Caribbean), payment systems, and macroeconomic implications
6. Includes FAQ section with FAQPage JSON-LD structured data
7. Includes a "Sources" section citing every factual claim
8. Ends with strong CTA + metadata block
${keywords.length > 0 ? `9. Naturally incorporates target keywords: ${keywords.join(', ')}` : ''}

${request.context.customInstructions || ''}`;
  }

  private buildImagePrompt(request: ImoPromptRequest): string {
    const { topic, visualStyle = 'modern professional', africanFocus, caribbeanFocus, latamFocus, articleTitle } = request.context;

    let prompt = `${visualStyle} graphic illustration`;
    
    if (topic) {
      prompt += `, ${topic}`;
    }
    
    if (articleTitle) {
      prompt += ` representing "${articleTitle}"`;
    }
    
    if (africanFocus) {
      prompt += ', incorporating African elements, vibrant colors, African continent silhouette or regional patterns';
    }
    if (latamFocus) {
      prompt += ', incorporating Latin American cultural elements, vibrant colors, regional geography or patterns';
    }
    if (caribbeanFocus) {
      prompt += ', incorporating Caribbean tropical elements, island aesthetics, vibrant ocean colors, or local patterns';
    }
    
    prompt += ', clean composition, high quality, professional graphic design, tech/finance theme, digital assets visualization';
    
    if (request.context.aspectRatio) {
      prompt += `, ${request.context.aspectRatio} aspect ratio`;
    }

    return prompt;
  }

  private buildTranslationPrompt(request: ImoPromptRequest): string {
    const { sourceLanguage, targetLanguage, topic, africanFocus, caribbeanFocus, latamFocus } = request.context;

    let regionName = 'African';
    if (latamFocus) regionName = 'Latin American';
    if (caribbeanFocus) regionName = 'Caribbean';

    return `Translate the following ${sourceLanguage || 'English'} text to ${targetLanguage || 'target language'}.

IMPORTANT GUIDELINES:
1. Maintain the original tone and style
2. Preserve technical terminology (do not translate terms like "blockchain", "DeFi", "staking", "L1/L2", "large language model")
3. Adapt cultural references appropriately for regional ${targetLanguage} speakers in ${regionName} countries
4. Keep proper nouns, brand names, and ticker symbols unchanged
5. Ensure the translation reads naturally in ${targetLanguage}
6. Preserve formatting, line breaks, and special characters

TEXT TO TRANSLATE:`;
  }

  private buildSEOPrompt(request: ImoPromptRequest): string {
    const { topic, targetKeywords = [], wordCount = 1000, targetAudience = 'general', africanFocus, caribbeanFocus, latamFocus } = request.context;

    return `You are an SEO expert specializing in Crypto, AI, TradFi, and Blockchain content for regional markets.
${ImoPromptAgent.EDITORIAL_TONE_CONSTRAINT}

Create an SEO-optimized article about: ${topic}

REQUIREMENTS:
- Target word count: ${wordCount} words
- Target keywords: ${targetKeywords.join(', ')}
- Audience level: ${targetAudience}
- Include H2 and H3 headings with keyword variations
- Write compelling meta title (60 chars) and description (160 chars)
- Natural keyword placement (avoid keyword stuffing)
- Include FAQ section with common questions
- Add internal linking suggestions
- Focus on regional market context (${africanFocus ? 'Africa' : ''}${latamFocus ? 'LatAm' : ''}${caribbeanFocus ? 'Caribbean' : ''})
- Target priority regions, payment systems (MTN MoMo, M-Pesa, Pix, PSE, JamDex, DCash, WiPay), and macroeconomic factors (inflation, remittances).

=== MANDATORY: RANKBRAIN-FRIENDLY CONTENT FRAMEWORK (6 STEPS) ===
Every article MUST follow this 6-step structure:

STEP 1 - HOOK (first 100 words): Problem agitation. Open with the reader's pain point, fear, or burning curiosity. Create urgency. Include primary keyword "${targetKeywords[0] || topic}" naturally in the first sentence.

STEP 2 - TABLE OF CONTENTS: After the hook, include a table of contents with anchor links to all H2 sections. Format: [Section Name](#section-name). This boosts dwell time and helps search engines understand structure.

STEP 3 - H2/H3 HIERARCHY WITH KEYWORD VARIATIONS: Use at least 5-7 H2 sections with 2-3 H3 sub-sections. Each H2 must contain a keyword variation of "${targetKeywords[0] || topic}" (e.g., synonyms, long-tail versions, question forms).

STEP 4 - MULTIMEDIA EVERY 300 WORDS: Insert [IMAGE: description], [VIDEO: description], or [CHART: description] placeholders every ~300 words for post-production media insertion.

STEP 5 - FAQ SECTION (3-5 questions): Target Google "People Also Ask" boxes. Write common questions regional users would search. Include direct, concise answers (2-3 sentences each). Include FAQPage JSON-LD structured data block after the FAQ section.

STEP 6 - SOURCES CITED: Numbered list of every source referenced in the article. Each source: name, date, URL/reference. Minimum 3 sources.

STEP 7 - STRONG CTA: End with call-to-action directing to related CoinDaily content, newsletter signup, or community. Format: "What to read next: [topic]" and "Stay informed: Subscribe to CoinDaily's regional briefing."
=== END FRAMEWORK ===

Structure:
1. Attention-grabbing introduction with primary keyword (HOOK)
2. Table of contents with jump links
3. Problem/context explanation
4. Detailed solution/information sections (H2/H3 with keyword variations)
5. Regional market implications and local payments/macroeconomics
6. Actionable conclusion
7. FAQ section (3-5 questions targeting People Also Ask) with FAQPage JSON-LD
8. Sources Cited section (minimum 3 sources with attribution)
9. CTA to related content and newsletter`;
  }

  private buildGenericPrompt(request: ImoPromptRequest): string {
    return `${request.context.topic || 'Generate content'}

${request.context.customInstructions || ''}`;
  }

  private buildVideoPrompt(request: ImoPromptRequest): string {
    const { topic, visualStyle = 'modern', quality = 'hd' } = request.context;

    return `${quality} quality video, ${visualStyle} style, ${topic}, smooth motion, professional cinematography, clear visuals, stable camera, proper lighting, high resolution, clean rendering`;
  }

  // ============================================
  // CHAINING-SPECIFIC PROMPT BUILDERS
  // ============================================

  private buildTerminologyExtractionPrompt(request: ImoPromptRequest): string {
    return `Analyze the following cryptocurrency news article and extract:

1. KEY TERMINOLOGY: List all crypto-specific terms (e.g., DeFi, blockchain, staking)
2. TONE: Describe the tone (formal, casual, technical, beginner-friendly)
3. CULTURAL CONTEXT: Note any African-specific references, currencies, or contexts
4. PROPER NOUNS: List all brand names, exchange names, token symbols

Return as JSON:
{
  "terminology": ["term1", "term2"],
  "tone": "description",
  "culturalContext": ["context1"],
  "properNouns": ["name1", "name2"]
}

TEXT TO ANALYZE:`;
  }

  private buildContextualTranslationPrompt(request: ImoPromptRequest): string {
    const { targetLanguage, africanFocus, caribbeanFocus, latamFocus } = request.context;

    let regionName = 'African';
    if (latamFocus) regionName = 'Latin American';
    if (caribbeanFocus) regionName = 'Caribbean';

    return `Using the extracted terminology and tone from step 1, translate this article to ${targetLanguage}.

CRITICAL RULES:
1. DO NOT translate the terms listed in "terminology" - keep them in English
2. MAINTAIN the tone identified in step 1
3. PRESERVE all proper nouns exactly as listed
4. ADAPT cultural contexts appropriately for ${targetLanguage}-speaking regional audiences in ${regionName} countries
5. Keep the same paragraph structure and formatting

Translate:`;
  }

  private buildResearchPrompt(request: ImoPromptRequest): string {
    const { topic, targetKeywords = [], targetAudience = 'general', africanFocus, caribbeanFocus, latamFocus } = request.context;

    return `You are an SEO strategist researching: ${topic}

TASK: Create a comprehensive content outline using the RankBrain 6-Step Framework

1. KEYWORD RESEARCH:
   - Primary keyword: ${targetKeywords[0] || topic}
   - Secondary keywords: ${targetKeywords.slice(1).join(', ') || 'suggest related keywords'}
   - Long-tail variations for regional markets (Africa, LatAm, Caribbean)

2. COMPETITIVE ANALYSIS:
   - What are top-ranking articles covering?
   - What gaps can we fill?

3. RANKBRAIN 6-STEP CONTENT STRUCTURE:
   STEP 1 (HOOK): Draft problem agitation angle for first 100 words
   STEP 2 (TOC): List all planned H2 sections for table of contents
   STEP 3 (H2/H3 HIERARCHY):
   - Suggested H1 (with primary keyword)
   - 5-7 H2 sections (each with a keyword variation)
   - 2-3 H3 sub-sections per H2
   STEP 4 (MULTIMEDIA): Plan [IMAGE/VIDEO/CHART] placements every ~300 words
   STEP 5 (FAQ): Draft 5 "People Also Ask" questions with brief answers
   STEP 6 (CTA): Plan closing CTA and related content links

4. REGIONAL MARKET ANGLE (Africa, LatAm, Caribbean):
   - Local exchanges/payment systems to mention (MTN MoMo, M-Pesa, Pix, PSE, JamDex, DCash, WiPay, Ripio, VALR, Luno, Bitso, Sand Dollar)
   - Regional regulations or trends (CBN, FSCA, BCB, ECCB, BOJ)
   - Macroeconomic context (hedging inflation, remittance savings)

Return detailed outline with estimated word count per section.

${ImoPromptAgent.EDITORIAL_TONE_CONSTRAINT}`;
  }

  private buildWritingPrompt(request: ImoPromptRequest): string {
    return `Using the outline from step 1, write the complete article following the RankBrain 6-Step Framework.

REQUIREMENTS:
- STEP 1: Open with problem agitation hook (first 100 words, include primary keyword)
- STEP 2: Include table of contents with anchor links after the hook
- STEP 3: Follow the H2/H3 structure exactly with keyword variations in each heading
- STEP 4: Insert [IMAGE: desc], [VIDEO: desc], or [CHART: desc] every ~300 words
- STEP 5: End with FAQ section (3-5 "People Also Ask" questions with concise answers)
- STEP 6: Close with strong CTA to related CoinDaily content and newsletter

ADDITIONAL:
- Write for ${request.context.targetAudience || 'general'} audience
- Maintain ${request.context.tone || 'professional'} tone
- Include regional market context (Africa, LatAm, Caribbean) and payment/remittance networks in each major section
- Write compelling transitions between sections
- Include specific examples and data points
- Incorporate suggested keywords naturally

Write the article:`;
  }

  private buildReasoningPrompt(request: ImoPromptRequest): string {
    const { topic, targetKeywords = [] } = request.context;

    return `Step 1: REASONING & PLANNING

Research and plan an SEO-optimized article about: ${topic}

YOUR TASK:
1. Analyze search intent for "${targetKeywords[0] || topic}"
2. Identify top-ranking content gaps
3. Determine optimal content structure
4. List primary and secondary keywords
5. Plan regional market integration points (Africa, LatAm, Caribbean) including payment systems and macroeconomics
6. Suggest internal/external linking opportunities

REQUIRED: Plan the RankBrain-Friendly 6-Step Framework:
- STEP 1 HOOK: Draft the opening problem agitation angle (what makes readers care?)
- STEP 2 TOC: List all H2 section titles for the table of contents
- STEP 3 H2/H3 HIERARCHY: Map keyword variations to each H2/H3 heading
- STEP 4 MULTIMEDIA: Plan where to place [IMAGE], [VIDEO], [CHART] markers (every ~300 words)
- STEP 5 FAQ: Draft 3-5 "People Also Ask" questions with brief answers
- STEP 6 CTA: Plan the closing call-to-action and related content links

Provide detailed strategy and outline following this framework.`;
  }

  private buildExecutionPrompt(request: ImoPromptRequest): string {
    return `Step 2: WRITING & EXECUTION

Using the strategy and outline from Step 1, write the complete article.

EXECUTION CHECKLIST (RankBrain 6-Step Framework):
✓ STEP 1: Hook with problem agitation in first 100 words (include primary keyword)
✓ STEP 2: Table of contents with anchor links to all H2 sections
✓ STEP 3: H2/H3 heading hierarchy with keyword variations from Step 1 outline
✓ STEP 4: Insert [IMAGE: desc], [VIDEO: desc], or [CHART: desc] every ~300 words
✓ STEP 5: FAQ section with 3-5 "People Also Ask" questions and concise answers
✓ STEP 6: Strong CTA directing to related content and newsletter subscription

ADDITIONAL REQUIREMENTS:
✓ Target ${request.context.wordCount || 1000} words
✓ Write for ${request.context.targetAudience || 'general'} readers
✓ Include regional cryptocurrency/fintech market context (Africa, LatAm, Caribbean) in each major section
✓ Add meta title (60 chars) and meta description (160 chars)
✓ Ensure readability and flow between sections

Write the polished, SEO-optimized article following all 6 framework steps:`;
  }

  private buildVisualAnalysisPrompt(request: ImoPromptRequest): string {
    const { africanFocus, caribbeanFocus, latamFocus } = request.context;
    let styleGuide = 'professional crypto theme';
    if (africanFocus) styleGuide = 'incorporating African vibrant colors/patterns';
    else if (latamFocus) styleGuide = 'incorporating Latin American cultural elements';
    else if (caribbeanFocus) styleGuide = 'incorporating Caribbean tropical aesthetics/colors';

    return `Analyze visual requirements for: ${request.context.articleTitle || request.context.topic}

Consider:
1. Key visual elements to represent the topic
2. Color scheme (${styleGuide})
3. Composition and layout
4. Style and mood
5. Regional elements if applicable

Provide visual composition strategy:`;
  }

  private buildDetailedImagePrompt(request: ImoPromptRequest): string {
    const { africanFocus, caribbeanFocus, latamFocus } = request.context;
    let styleGuide = 'Modern digital design';
    if (africanFocus) styleGuide = 'African cultural elements';
    else if (latamFocus) styleGuide = 'Latin American cultural elements';
    else if (caribbeanFocus) styleGuide = 'Caribbean tropical elements';

    return `Based on the visual strategy from Step 1, create a detailed image generation prompt.

Requirements:
- Specific, descriptive language
- Professional cryptocurrency/finance/AI theme
- ${styleGuide}
- High quality, clean composition
- ${request.context.aspectRatio || 'balanced'} layout

Generate optimized prompt for ${request.options?.optimizeForModel || 'DALL-E'}:`;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private assessPromptQuality(prompt: string, request: ImoPromptRequest): ImoPromptResult['quality'] {
    const wordCount = prompt.split(/\s+/).length;
    const hasContext = prompt.includes('context') || prompt.includes('background');
    const hasInstructions = prompt.includes('requirements') || prompt.includes('instructions');
    const hasExamples = prompt.includes('example') || prompt.includes('such as');
    
    // Calculate scores
    const clarityScore = (hasInstructions ? 0.5 : 0) + (wordCount > 50 ? 0.3 : 0) + 0.2;
    const specificity = (request.context.keywords?.length || 0) > 0 ? 0.9 : 0.6;
    const contextRichness = (hasContext ? 0.4 : 0) + (hasExamples ? 0.3 : 0) + (wordCount > 100 ? 0.3 : 0.1);
    
    let expectedQuality: 'low' | 'medium' | 'high' | 'exceptional';
    const avgScore = (clarityScore + specificity + contextRichness) / 3;
    
    if (avgScore >= 0.85) expectedQuality = 'exceptional';
    else if (avgScore >= 0.7) expectedQuality = 'high';
    else if (avgScore >= 0.5) expectedQuality = 'medium';
    else expectedQuality = 'low';

    return {
      clarityScore: Math.min(clarityScore, 1),
      specificity: Math.min(specificity, 1),
      contextRichness: Math.min(contextRichness, 1),
      expectedQuality
    };
  }

  private suggestModelConfig(request: ImoPromptRequest): ImoPromptResult['modelConfig'] {
    const baseConfig = {
      temperature: 0.7,
      maxTokens: 1500,
      topP: 0.9,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1
    };

    // Adjust based on content type
    switch (request.contentType) {
      case 'article':
      case 'seo':
        return { ...baseConfig, temperature: 0.7, maxTokens: 2000 };
      
      case 'translation':
        return { ...baseConfig, temperature: 0.3, maxTokens: 2000 };
      
      case 'analysis':
        return { ...baseConfig, temperature: 0.4, maxTokens: 1000 };
      
      case 'social':
        return { ...baseConfig, temperature: 0.8, maxTokens: 500 };
      
      default:
        return baseConfig;
    }
  }

  private updateMetrics(result: ImoPromptResult): void {
    this.performanceMetrics.totalPrompts++;
    
    const qualityScore = (
      result.quality.clarityScore +
      result.quality.specificity +
      result.quality.contextRichness
    ) / 3;
    
    this.performanceMetrics.avgQualityScore = (
      (this.performanceMetrics.avgQualityScore * (this.performanceMetrics.totalPrompts - 1) + qualityScore) /
      this.performanceMetrics.totalPrompts
    );
    
    this.performanceMetrics.avgProcessingTime = (
      (this.performanceMetrics.avgProcessingTime * (this.performanceMetrics.totalPrompts - 1) + result.processingTime) /
      this.performanceMetrics.totalPrompts
    );
  }

  /**
   * Get agent performance metrics
   */
  getMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }
}

// Export singleton instance
export const imoAgent = new ImoPromptAgent();
