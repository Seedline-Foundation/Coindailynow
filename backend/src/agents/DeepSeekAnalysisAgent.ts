/**
 * DeepSeek R1 Data Analysis Agent
 *
 * @deprecated THIN WRAPPER — canonical implementation lives in ai-system.
 * This file delegates to the ai-system service via HTTP (see aiSystemClient).
 * Do not add business logic here; extend ai-system/agents/analysis/ instead.
 */

import { DataSourceItem, queryDataItems, updateItemScores } from '../services/dataSourceCenter';
import { proxyDeepSeekAnalysis } from '../services/aiSystemClient';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalysisContext {
  items: DataSourceItem[];
  regions: string[];
  categories: string[];
  dateRange: { start: Date; end: Date };
  previousAnalysis?: AnalysisResult;
}

export interface AnalysisResult {
  executiveSummary: string;
  mainAnalysis: string;
  keyFindings: KeyFinding[];
  dataInsights: DataInsight[];
  recommendations: Recommendation[];
  trendAnalysis: TrendAnalysis[];
  anomalies: Anomaly[];
  confidence: number;
  tokensUsed: number;
  processingTimeMs: number;
}

export interface KeyFinding {
  id: string;
  title: string;
  description: string;
  category: string;
  region?: string;
  importance: 'high' | 'medium' | 'low';
  supportingData: string[];
}

export interface DataInsight {
  id: string;
  type: 'chart' | 'metric' | 'comparison' | 'timeline';
  title: string;
  description: string;
  data: Record<string, any>;
  visualization?: {
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'heatmap';
    config: Record<string, any>;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  actionItems: string[];
  targetAudience: string;
}

export interface TrendAnalysis {
  topic: string;
  direction: 'up' | 'down' | 'stable' | 'volatile';
  changePercent: number;
  period: string;
  description: string;
  regions: string[];
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break';
  description: string;
  severity: 'critical' | 'warning' | 'info';
  detectedAt: Date;
  affectedItems: string[];
}

export interface ScoreResult {
  itemId: string;
  relevanceScore: number;
  qualityScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  reasoning: string;
}

// ============================================================================
// DEEPSEEK R1 CLIENT
// ============================================================================

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_ANALYSIS_MODEL || 'deepseek-r1:8b';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  eval_count?: number;
}

/**
 * Call DeepSeek R1 model via Ollama
 */
async function callDeepSeekR1(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<{ response: string; tokensUsed: number; durationMs: number }> {
  const { temperature = 0.3, maxTokens = 4096, systemPrompt } = options;

  const startTime = Date.now();

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    const durationMs = Date.now() - startTime;

    return {
      response: data.response,
      tokensUsed: data.eval_count || 0,
      durationMs,
    };
  } catch (error) {
    console.error('[DeepSeekAgent] API call failed:', error);
    throw error;
  }
}

// ============================================================================
// ANALYSIS PROMPTS
// ============================================================================

const ANALYSIS_SYSTEM_PROMPT = `You are an expert financial and market data analyst for CoinDaily, Africa's premier cryptocurrency news platform. Your role is to analyze news data and market trends to produce insightful, actionable reports.

Your analysis should:
1. Identify significant market trends and patterns
2. Highlight regional differences (especially in African markets)
3. Detect anomalies and unusual patterns
4. Provide clear, actionable recommendations
5. Be backed by specific data points from the provided sources

Focus areas:
- Cryptocurrency market movements
- Regulatory developments
- Technology and DeFi trends
- African market-specific insights (Nigeria, Kenya, South Africa, Ghana focus)
- Mobile money and crypto correlations

Output format: Always respond with valid JSON matching the requested schema.`;

function buildAnalysisPrompt(context: AnalysisContext): string {
  const itemsSummary = context.items.map(item => ({
    title: item.title,
    category: item.category,
    region: item.region,
    source: item.source,
    pubDate: item.pubDate.toISOString().split('T')[0],
    description: item.description.substring(0, 200),
    dataType: item.dataType,
    value: item.value,
    changePercent: item.changePercent,
  }));

  return `
Analyze the following ${context.items.length} news data items collected from ${context.dateRange.start.toISOString().split('T')[0]} to ${context.dateRange.end.toISOString().split('T')[0]}.

Regions covered: ${context.regions.join(', ')}
Categories covered: ${context.categories.join(', ')}

DATA ITEMS:
${JSON.stringify(itemsSummary, null, 2)}

Generate a comprehensive analysis report with the following JSON structure:
{
  "executiveSummary": "A 2-3 paragraph executive summary highlighting the most important findings",
  "mainAnalysis": "Detailed 5-7 paragraph analysis of all major trends and developments",
  "keyFindings": [
    {
      "id": "finding_1",
      "title": "Finding title",
      "description": "Detailed description",
      "category": "Category name",
      "region": "Region code or null if global",
      "importance": "high|medium|low",
      "supportingData": ["Data point 1", "Data point 2"]
    }
  ],
  "dataInsights": [
    {
      "id": "insight_1",
      "type": "chart|metric|comparison|timeline",
      "title": "Insight title",
      "description": "What this insight shows",
      "data": { "key": "value" },
      "visualization": {
        "chartType": "line|bar|pie|area",
        "config": {}
      }
    }
  ],
  "recommendations": [
    {
      "id": "rec_1",
      "title": "Recommendation title",
      "description": "Full description",
      "priority": "urgent|high|medium|low",
      "actionItems": ["Action 1", "Action 2"],
      "targetAudience": "Investors|Traders|Policy makers|etc"
    }
  ],
  "trendAnalysis": [
    {
      "topic": "Topic name",
      "direction": "up|down|stable|volatile",
      "changePercent": 15.5,
      "period": "week|month",
      "description": "Trend description",
      "regions": ["NG", "KE"]
    }
  ],
  "anomalies": [
    {
      "id": "anomaly_1",
      "type": "spike|drop|outlier|pattern_break",
      "description": "What was detected",
      "severity": "critical|warning|info",
      "detectedAt": "2024-01-15",
      "affectedItems": ["item_id_1"]
    }
  ],
  "confidence": 85
}

Provide at least:
- 5 key findings
- 3 data insights
- 3 recommendations
- 2 trend analyses
- Any anomalies detected (can be empty if none)

Ensure all analysis is specific, data-backed, and actionable.`;
}

function buildScoringPrompt(items: DataSourceItem[]): string {
  const itemsForScoring = items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description.substring(0, 300),
    category: item.category,
    region: item.region,
    source: item.source,
  }));

  return `
Score the following news items for relevance and quality. Consider:
- Relevance: How important is this news for cryptocurrency/finance readers in Africa?
- Quality: How well-written, accurate, and informative is the content?
- Sentiment: Overall sentiment of the news

Score from 0-100 for relevance and quality.

ITEMS TO SCORE:
${JSON.stringify(itemsForScoring, null, 2)}

Respond with JSON array:
[
  {
    "itemId": "item_id",
    "relevanceScore": 75,
    "qualityScore": 80,
    "sentiment": "positive|negative|neutral",
    "tags": ["crypto", "regulation", "africa"],
    "reasoning": "Brief explanation of scores"
  }
]`;
}

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Run full data analysis — delegates to ai-system.
 */
export async function runDataAnalysis(context: AnalysisContext): Promise<AnalysisResult> {
  console.log(`[DeepSeekAgent] Proxying analysis of ${context.items.length} items to ai-system...`);
  const startTime = Date.now();
  try {
    const result = await proxyDeepSeekAnalysis({ action: 'runDataAnalysis', context }) as any;
    return {
      executiveSummary: result?.executiveSummary || '',
      mainAnalysis: result?.mainAnalysis || '',
      keyFindings: result?.keyFindings || [],
      dataInsights: result?.dataInsights || [],
      recommendations: result?.recommendations || [],
      trendAnalysis: result?.trendAnalysis || [],
      anomalies: result?.anomalies || [],
      confidence: result?.confidence || 0,
      tokensUsed: result?.tokensUsed || 0,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[DeepSeekAgent] ai-system proxy failed, returning empty result:', error);
    return {
      executiveSummary: 'ai-system unreachable — analysis unavailable',
      mainAnalysis: '',
      keyFindings: [],
      dataInsights: [],
      recommendations: [],
      trendAnalysis: [],
      anomalies: [],
      confidence: 0,
      tokensUsed: 0,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Score data items — delegates to ai-system.
 */
export async function scoreDataItems(items: DataSourceItem[]): Promise<ScoreResult[]> {
  if (items.length === 0) return [];
  try {
    const result = await proxyDeepSeekAnalysis({ action: 'scoreDataItems', items }) as any;
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('[DeepSeekAgent] ai-system proxy failed for scoring:', error);
    return [];
  }
}

/**
 * Detect anomalies — delegates to ai-system.
 */
export async function detectAnomalies(
  items: DataSourceItem[],
  historicalBaseline?: { avgCount: number; avgRelevance: number },
): Promise<Anomaly[]> {
  try {
    const result = await proxyDeepSeekAnalysis({ action: 'detectAnomalies', items, historicalBaseline }) as any;
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('[DeepSeekAgent] ai-system proxy failed for anomaly detection:', error);
    return [];
  }
}

/**
 * Generate a quick summary — delegates to ai-system.
 */
export async function generateQuickSummary(items: DataSourceItem[]): Promise<string> {
  if (items.length === 0) return 'No data items to summarize.';
  try {
    const result = await proxyDeepSeekAnalysis({ action: 'generateQuickSummary', items }) as any;
    return typeof result === 'string' ? result : (result?.summary || 'Summary unavailable');
  } catch {
    return 'ai-system unreachable — summary unavailable';
  }
}

/**
 * Check if the ai-system DeepSeek model endpoint is reachable.
 */
export async function checkModelHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return false;
    const data = await response.json();
    const models = data.models || [];
    return models.some((m: any) => m.name.includes('deepseek'));
  } catch {
    return false;
  }
}

export default {
  runDataAnalysis,
  scoreDataItems,
  detectAnomalies,
  generateQuickSummary,
  checkModelHealth,
};
