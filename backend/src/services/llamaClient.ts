/**
 * Llama 3.1 Client for Text Generation
 * Replaces OpenAI GPT-4 for article writing, headlines, categorization
 */

interface LlamaGenerateRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}

interface LlamaGenerateResponse {
  response: string;
  done: boolean;
  context?: number[];
}

class LlamaClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LLAMA_SERVICE_URL || 'http://localhost:11434';
  }

  /**
   * Generate text using Llama 3.1
   */
  async generate(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 2000, systemPrompt } = options;

    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
      : prompt;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          prompt: fullPrompt,
          temperature,
          num_predict: maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Llama API error: ${response.statusText}`);
      }

      const data = await response.json() as LlamaGenerateResponse;
      return data.response.trim();

    } catch (error: any) {
      console.error('Llama generation error:', error);
      throw error;
    }
  }

  /**
   * Rewrite article content (replaces GPT-4)
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
    const prompt = `Rewrite this crypto/finance article for CoinDaily, an African cryptocurrency news platform.

Make it:
- 80%+ unique and plagiarism-free
- SEO-optimized for African crypto markets
- Engaging and readable
- Focused on ${category} category

Original Title: ${title}
Original Content: ${content}

Provide ONLY a valid JSON response (no markdown, no code blocks):
{
  "title": "rewritten title (60-80 characters)",
  "excerpt": "engaging excerpt (150-200 characters)",
  "content": "full rewritten article in HTML (500-1000 words)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const systemPrompt = "You are a professional crypto content writer. Respond ONLY with valid JSON, no markdown formatting.";

    try {
      const response = await this.generate(prompt, { 
        temperature: 0.7, 
        maxTokens: 3000,
        systemPrompt 
      });

      // Extract JSON from response (Llama sometimes adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Llama');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Article rewrite error:', error);
      throw error;
    }
  }

  /**
   * Optimize headline (replaces GPT-4)
   */
  async optimizeHeadline(headline: string): Promise<{
    headline: string;
    score: number;
    suggestions: string[];
  }> {
    const prompt = `Optimize this crypto news headline for maximum CTR:
"${headline}"

Guidelines:
- Use power words and emotional triggers
- Keep under 70 characters
- Include numbers when relevant
- Optimize for African crypto audience

Provide ONLY valid JSON:
{
  "headline": "optimized headline",
  "score": 85,
  "suggestions": ["alt 1", "alt 2", "alt 3"]
}`;

    const response = await this.generate(prompt, { temperature: 0.8, maxTokens: 500 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Invalid JSON response');
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Categorize content (replaces GPT-4)
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
    const prompt = `Categorize this crypto article.

Title: ${title}
Content: ${content.substring(0, 500)}...

Available categories: ${availableCategories.join(', ')}

Provide ONLY valid JSON:
{
  "category": "best matching category",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}`;

    const response = await this.generate(prompt, { temperature: 0.3, maxTokens: 300 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Invalid JSON response');
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Quality review (replaces Google Gemini)
   */
  async reviewQuality(content: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
    approved: boolean;
  }> {
    const prompt = `Review this crypto article for quality and accuracy.

Content: ${content.substring(0, 1000)}...

Check for:
- Factual accuracy
- Grammar and style
- SEO quality
- African market relevance
- No spam or misleading claims

Provide ONLY valid JSON:
{
  "score": 85,
  "issues": ["issue1", "issue2"],
  "suggestions": ["improve X", "add Y"],
  "approved": true
}`;

    const response = await this.generate(prompt, { temperature: 0.3, maxTokens: 500 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error('Invalid JSON response');
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new LlamaClient();
