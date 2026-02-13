/**
 * Market Analysis API Route
 * Uses DeepSeek R1 via Ollama for crypto market analysis
 */

import { NextRequest, NextResponse } from 'next/server';

// DeepSeek endpoint - separate Ollama instance for reasoning
const OLLAMA_URL = process.env.DEEPSEEK_API_URL || process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-r1:8b';

export async function POST(request: NextRequest) {
  try {
    const { topic, analysisType } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `You are an expert cryptocurrency analyst specializing in African markets. Provide detailed, data-driven analysis.

Perform a ${analysisType || 'comprehensive'} analysis on:
${topic}

Consider:
- African exchange data (Luno, Quidax, Binance Africa, Yellow Card)
- Mobile money correlation (M-Pesa, MTN Money, EcoCash)
- Regional regulatory environment
- Local trading volumes and patterns
- Remittance flows and crypto adoption

Provide your analysis as JSON:
{
  "summary": "executive summary",
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "keyFindings": ["finding1", "finding2", "finding3"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendation": "action recommendation",
  "africanMarketImpact": "specific impact on African markets"
}`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
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
      const analysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        analysis,
        model: MODEL,
        processingTime: data.total_duration ? `${(data.total_duration / 1e9).toFixed(2)}s` : 'N/A'
      });
    }

    return NextResponse.json({
      success: true,
      analysis: { summary: data.response },
      model: MODEL
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
