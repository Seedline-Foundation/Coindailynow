/**
 * Mandatory editorial quality pass via self-hosted Ollama (DeepSeek R1 / Llama).
 * Default for CoinDaily — no cloud Gemini required.
 */

import { editorialPolicy } from '../../config/editorialPolicy';

const OLLAMA_URL = process.env.OLLAMA_API_URL || process.env.LLAMA_API_ENDPOINT || 'http://localhost:11434';
const REVIEW_MODEL =
  process.env.EDITORIAL_REVIEW_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-r1:8b';

export interface EditorialReviewInput {
  title: string;
  content: string;
  topic?: string;
  language?: string;
}

export interface EditorialReviewResult {
  passed: boolean;
  score: number;
  issues: string[];
  summary: string;
  skipped: boolean;
  provider: 'ollama' | 'skipped' | 'unavailable';
}

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: REVIEW_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.2, num_predict: 1024 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { response?: string };
  return data.response || '';
}

async function isOllamaReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runSelfHostedEditorialReview(
  input: EditorialReviewInput,
): Promise<EditorialReviewResult> {
  if (!editorialPolicy.requireEditorialReview) {
    return {
      passed: true,
      score: 100,
      issues: [],
      summary: 'Editorial review disabled',
      skipped: true,
      provider: 'skipped',
    };
  }

  const reachable = await isOllamaReachable();
  if (!reachable) {
    const failClosed = process.env.EDITORIAL_REVIEW_FAIL_CLOSED === 'true';
    if (failClosed || process.env.NODE_ENV === 'production') {
      return {
        passed: false,
        score: 0,
        issues: [`Ollama not reachable at ${OLLAMA_URL}`],
        summary: 'Self-hosted review unavailable',
        skipped: false,
        provider: 'unavailable',
      };
    }
    console.warn('[EditorialReview] Ollama unreachable — dev skip');
    return {
      passed: true,
      score: 75,
      issues: [],
      summary: 'Dev skip (Ollama offline)',
      skipped: true,
      provider: 'skipped',
    };
  }

  const prompt = `You are a Bloomberg-tier financial news editor for African crypto markets.
Review this article for: factual tone (no hype/fear), Africa-first relevance, clarity, and publish safety.
Return ONLY valid JSON: {"score":0-100,"passed":boolean,"issues":["..."],"summary":"one sentence"}

Title: ${input.title}
Language: ${input.language || 'en'}
Content (excerpt): ${input.content.slice(0, 12000)}`;

  try {
    const text = await callOllama(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        passed: false,
        score: 0,
        issues: ['Model returned non-JSON response'],
        summary: text.slice(0, 200),
        skipped: false,
        provider: 'ollama',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      score?: number;
      passed?: boolean;
      issues?: string[];
      summary?: string;
    };

    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
    const passed =
      parsed.passed === true ||
      (parsed.passed !== false && score >= editorialPolicy.editorialMinScore);

    return {
      passed,
      score,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: parsed.summary || '',
      skipped: false,
      provider: 'ollama',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[EditorialReview] Ollama error:', message);
    return {
      passed: false,
      score: 0,
      issues: [message],
      summary: 'Review failed',
      skipped: false,
      provider: 'ollama',
    };
  }
}

/** @deprecated Use runSelfHostedEditorialReview — kept for import compatibility */
export const runGeminiEditorialReview = runSelfHostedEditorialReview;
