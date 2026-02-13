/**
 * Article Generation API Route
 * Uses Llama 3.1 8B via Ollama for content generation
 */

import { NextRequest, NextResponse } from 'next/server';

// Ollama endpoint - uses internal Docker network in production
const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL = process.env.LLAMA_MODEL || 'llama3.1:8b';

export async function POST(request: NextRequest) {
  try {
    const { topic, style, length } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `You are an expert cryptocurrency journalist writing for CoinDaily Africa. Write engaging, accurate news articles focused on African crypto markets.

Write a ${length || 'medium-length'} ${style || 'news'} article about:
${topic}

Focus on:
- African market impact
- Local exchanges (Luno, Quidax, Binance Africa)
- Mobile money integration (M-Pesa, MTN Money)
- Regulatory developments in Nigeria, Kenya, South Africa

Provide the response as JSON:
{
  "title": "compelling headline",
  "excerpt": "2-3 sentence summary",
  "content": "full article in markdown format",
  "tags": ["relevant", "tags"],
  "readingTime": "X min read"
}`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Try to parse JSON from response
    const jsonMatch = data.response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const article = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        article,
        model: MODEL,
        processingTime: data.total_duration ? `${(data.total_duration / 1e9).toFixed(2)}s` : 'N/A'
      });
    }

    return NextResponse.json({
      success: true,
      article: { content: data.response },
      model: MODEL
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
