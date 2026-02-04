/**
 * LM Studio Client - OpenAI-Compatible API
 * Production-ready text generation for CoinDaily
 * 
 * Replaces: OpenAI GPT-4 for article writing, headlines, categorization
 * Benefits: €300/month savings, faster responses, full control
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class LMStudioClient {
  private baseUrl: string;
  private modelName: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.LLAMA_SERVICE_URL || 'http://localhost:1234';
    this.modelName = process.env.LLAMA_MODEL_NAME || 'Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf';
    this.timeout = 120000; // 2 minutes for long generations
  }

  /**
   * Generate chat completion using OpenAI-compatible API
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 2000, topP = 0.9 } = options;

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stream: false
        } as ChatCompletionRequest),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No completion choices returned from LM Studio');
      }

      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('Empty content returned from LM Studio');
      }

      console.log(`✓ LM Studio generation: ${data.usage.total_tokens} tokens`);
      return content;

    } catch (error: any) {
      console.error('LM Studio generation error:', error.message);
      throw error;
    }
  }

  /**
   * Rewrite article content for African crypto audience
   * Replaces: OpenAI GPT-4 article rewriting
   */
  async rewriteArticle(
    title: string,
    content: string,
    category: string
  ): Promise<{
    title: string;
    excerpt: string;
    content: string;
    keywords: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a professional cryptocurrency content writer for CoinDaily Africa, the premier crypto news platform for African markets.

Your writing style:
- Clear, engaging, and accessible to both beginners and experts
- Focuses on African crypto markets (Nigeria, Kenya, South Africa, Ghana)
- SEO-optimized with natural keyword integration
- Factual and unbiased reporting
- Includes relevant context for African readers

CRITICAL: Respond ONLY with valid JSON. No markdown formatting, no code blocks, no extra text.`
      },
      {
        role: 'user',
        content: `Rewrite this ${category} article for CoinDaily Africa.

Requirements:
- Make it 80%+ unique (avoid plagiarism)
- Optimize for SEO and readability
- Target African crypto audience
- Keep factual accuracy
- Use engaging headlines
- Include African market context where relevant

Original Title: ${title}

Original Content:
${content}

Provide ONLY this exact JSON structure (no markdown, no \`\`\`json):
{
  "title": "compelling headline (60-80 characters, include key terms)",
  "excerpt": "engaging summary that hooks readers (150-200 characters)",
  "content": "<p>Full rewritten article in HTML format with proper paragraphs, 500-1000 words. Include African market insights where relevant. Use <strong> for emphasis, <a> for links if needed.</p>",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
      }
    ];

    try {
      const response = await this.chatCompletion(messages, { 
        temperature: 0.7, 
        maxTokens: 3500 
      });

      // Extract JSON from response (handle cases where LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Raw response:', response);
        throw new Error('Invalid JSON response from LM Studio');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.title || !parsed.excerpt || !parsed.content || !parsed.keywords) {
        throw new Error('Missing required fields in LM Studio response');
      }

      return parsed;

    } catch (error: any) {
      console.error('Article rewrite error:', error.message);
      throw new Error(`Failed to rewrite article: ${error.message}`);
    }
  }

  /**
   * Optimize headline for maximum CTR
   * Replaces: OpenAI GPT-4 headline optimization
   */
  async optimizeHeadline(
    headline: string,
    category?: string
  ): Promise<{
    headline: string;
    score: number;
    suggestions: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a headline optimization expert specializing in crypto news for African markets. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: `Optimize this crypto news headline for maximum click-through rate:

Original: "${headline}"
${category ? `Category: ${category}` : ''}

Guidelines:
- Use power words and emotional triggers (surge, crash, breakthrough, exclusive)
- Include numbers when relevant (percentages, dates, amounts)
- Keep under 70 characters for SEO
- Optimize for African crypto audience
- Make it compelling but not clickbait
- Include key crypto terms

Provide ONLY valid JSON:
{
  "headline": "the single best optimized headline",
  "score": 85,
  "suggestions": ["alternative 1", "alternative 2", "alternative 3"]
}`
      }
    ];

    try {
      const response = await this.chatCompletion(messages, { 
        temperature: 0.8, 
        maxTokens: 500 
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error: any) {
      console.error('Headline optimization error:', error.message);
      throw new Error(`Failed to optimize headline: ${error.message}`);
    }
  }

  /**
   * Categorize content automatically
   * Replaces: OpenAI GPT-4 categorization
   */
  async categorize(
    title: string,
    content: string,
    availableCategories: string[]
  ): Promise<{
    category: string;
    tags: string[];
    confidence: number;
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a content categorization expert for cryptocurrency news. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: `Categorize this crypto article into the most appropriate category.

Title: ${title}
Content Preview: ${content.substring(0, 800)}...

Available Categories:
${availableCategories.join(', ')}

Also generate 3-5 relevant tags for better discoverability.

Provide ONLY valid JSON:
{
  "category": "single best matching category from the list above",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.95
}`
      }
    ];

    try {
      const response = await this.chatCompletion(messages, { 
        temperature: 0.3, 
        maxTokens: 300 
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Validate category exists in available list
      if (!availableCategories.includes(result.category)) {
        console.warn(`Invalid category "${result.category}", using first available`);
        result.category = availableCategories[0];
        result.confidence = 0.5;
      }

      return result;

    } catch (error: any) {
      console.error('Categorization error:', error.message);
      throw new Error(`Failed to categorize content: ${error.message}`);
    }
  }

  /**
   * Quality review and validation
   * Replaces: Google Gemini quality review
   */
  async reviewQuality(
    content: string,
    metadata?: {
      title?: string;
      category?: string;
      source?: string;
    }
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
    approved: boolean;
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a senior content quality reviewer for CoinDaily Africa, ensuring all published content meets high standards.

Review criteria:
- Factual accuracy (no false claims)
- Grammar and style (professional writing)
- SEO quality (proper structure, keywords)
- African market relevance
- No spam, scams, or misleading information
- No unlisted token promotions (security requirement)
- Proper citations and sources

Respond ONLY with valid JSON.`
      },
      {
        role: 'user',
        content: `Review this crypto article for quality and compliance:

${metadata?.title ? `Title: ${metadata.title}` : ''}
${metadata?.category ? `Category: ${metadata.category}` : ''}
${metadata?.source ? `Source: ${metadata.source}` : ''}

Content:
${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}

Provide ONLY valid JSON:
{
  "score": 85,
  "issues": ["specific issue 1", "specific issue 2"],
  "suggestions": ["improvement 1", "improvement 2", "improvement 3"],
  "approved": true
}

Score: 0-100 (>70 = approved)
Issues: Critical problems that must be fixed
Suggestions: Optional improvements
Approved: true if score > 70 and no critical issues`
      }
    ];

    try {
      const response = await this.chatCompletion(messages, { 
        temperature: 0.3, 
        maxTokens: 600 
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Auto-approve if score is high and no issues
      if (result.score > 70 && (!result.issues || result.issues.length === 0)) {
        result.approved = true;
      } else {
        result.approved = false;
      }

      return result;

    } catch (error: any) {
      console.error('Quality review error:', error.message);
      throw new Error(`Failed to review quality: ${error.message}`);
    }
  }

  /**
   * Generate SEO metadata
   */
  async generateSEOMetadata(
    title: string,
    content: string
  ): Promise<{
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an SEO expert for crypto news. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: `Generate SEO metadata for this article:

Title: ${title}
Content: ${content.substring(0, 500)}...

Provide ONLY valid JSON:
{
  "metaTitle": "SEO-optimized title (50-60 chars)",
  "metaDescription": "compelling meta description (150-160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
      }
    ];

    const response = await this.chatCompletion(messages, { temperature: 0.5, maxTokens: 300 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Invalid JSON response');
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Health check - verify LM Studio is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.data && data.data.length > 0;

    } catch (error) {
      console.error('LM Studio health check failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`);
      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }
}

export default new LMStudioClient();
