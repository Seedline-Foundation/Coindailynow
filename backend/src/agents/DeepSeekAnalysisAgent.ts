/**
 * DeepSeek R1 Data Analysis Agent
 *
 * AI Agent powered by DeepSeek R1 model (self-hosted via Ollama) that:
 * - Analyzes data from the Data Source Center
 * - Identifies market trends, regional patterns, and anomalies
 * - Generates comprehensive weekly analysis reports
 * - Scores data items for relevance and quality
 *
 * This agent runs SEPARATELY from the news content pipeline.
 * It's specifically designed for data analysis, not content generation.
 */

import { DataSourceItem, queryDataItems, updateItemScores } from '../services/dataSourceCenter';

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
 * Run full data analysis on items from the Data Source Center
 */
export async function runDataAnalysis(context: AnalysisContext): Promise<AnalysisResult> {
  console.log(`[DeepSeekAgent] Starting analysis of ${context.items.length} items...`);

  const prompt = buildAnalysisPrompt(context);
  
  const { response, tokensUsed, durationMs } = await callDeepSeekR1(prompt, {
    systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 8192,
  });

  // Parse the JSON response
  let analysisResult: any;
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    analysisResult = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('[DeepSeekAgent] Failed to parse analysis response:', parseError);
    // Return a default structure with the raw response
    return {
      executiveSummary: 'Analysis parsing failed. Raw response available in mainAnalysis.',
      mainAnalysis: response,
      keyFindings: [],
      dataInsights: [],
      recommendations: [],
      trendAnalysis: [],
      anomalies: [],
      confidence: 0,
      tokensUsed,
      processingTimeMs: durationMs,
    };
  }

  console.log(`[DeepSeekAgent] Analysis complete in ${durationMs}ms, used ${tokensUsed} tokens`);

  return {
    executiveSummary: analysisResult.executiveSummary || '',
    mainAnalysis: analysisResult.mainAnalysis || '',
    keyFindings: analysisResult.keyFindings || [],
    dataInsights: analysisResult.dataInsights || [],
    recommendations: analysisResult.recommendations || [],
    trendAnalysis: analysisResult.trendAnalysis || [],
    anomalies: analysisResult.anomalies || [],
    confidence: analysisResult.confidence || 50,
    tokensUsed,
    processingTimeMs: durationMs,
  };
}

/**
 * Score data items for relevance and quality
 */
export async function scoreDataItems(items: DataSourceItem[]): Promise<ScoreResult[]> {
  if (items.length === 0) return [];

  console.log(`[DeepSeekAgent] Scoring ${items.length} items...`);

  // Process in batches of 20 to avoid token limits
  const BATCH_SIZE = 20;
  const results: ScoreResult[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const prompt = buildScoringPrompt(batch);

    try {
      const { response, tokensUsed, durationMs } = await callDeepSeekR1(prompt, {
        systemPrompt: 'You are a news quality analyst. Respond only with valid JSON.',
        temperature: 0.1,
        maxTokens: 2048,
      });

      // Parse response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        results.push(...scores);

        // Update scores in database
        for (const score of scores) {
          await updateItemScores(score.itemId, {
            relevanceScore: score.relevanceScore,
            qualityScore: score.qualityScore,
            sentiment: score.sentiment,
            tags: score.tags,
          });
        }
      }

      console.log(`[DeepSeekAgent] Scored batch ${Math.floor(i / BATCH_SIZE) + 1}, used ${tokensUsed} tokens`);
    } catch (error) {
      console.error(`[DeepSeekAgent] Failed to score batch:`, error);
    }

    // Small delay between batches
    if (i + BATCH_SIZE < items.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}

/**
 * Detect anomalies in recent data
 */
export async function detectAnomalies(
  items: DataSourceItem[],
  historicalBaseline?: { avgCount: number; avgRelevance: number }
): Promise<Anomaly[]> {
  console.log(`[DeepSeekAgent] Detecting anomalies in ${items.length} items...`);

  // Group items by day
  const dailyCounts = new Map<string, number>();
  for (const item of items) {
    const dateKey = item.pubDate.toISOString().split('T')[0];
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
  }

  // Calculate statistics
  const counts = Array.from(dailyCounts.values());
  const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
  const stdDev = Math.sqrt(
    counts.reduce((acc, val) => acc + Math.pow(val - avgCount, 2), 0) / counts.length
  );

  const anomalies: Anomaly[] = [];

  // Detect spikes/drops (more than 2 standard deviations from mean)
  for (const [date, count] of dailyCounts) {
    if (count > avgCount + 2 * stdDev) {
      anomalies.push({
        id: `spike_${date}`,
        type: 'spike',
        description: `Unusual spike in news volume on ${date}: ${count} items (average: ${avgCount.toFixed(1)})`,
        severity: count > avgCount + 3 * stdDev ? 'critical' : 'warning',
        detectedAt: new Date(date),
        affectedItems: items.filter(i => i.pubDate.toISOString().startsWith(date)).map(i => i.id),
      });
    } else if (count < avgCount - 2 * stdDev && stdDev > 0) {
      anomalies.push({
        id: `drop_${date}`,
        type: 'drop',
        description: `Unusual drop in news volume on ${date}: ${count} items (average: ${avgCount.toFixed(1)})`,
        severity: 'info',
        detectedAt: new Date(date),
        affectedItems: [],
      });
    }
  }

  // Detect category anomalies (sudden topic surges)
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
  }

  const totalItems = items.length;
  for (const [category, count] of categoryCounts) {
    const percentage = (count / totalItems) * 100;
    if (percentage > 40 && count > 10) {
      anomalies.push({
        id: `category_surge_${category}`,
        type: 'pattern_break',
        description: `${category} news dominance: ${percentage.toFixed(1)}% of all items (${count} items)`,
        severity: 'warning',
        detectedAt: new Date(),
        affectedItems: items.filter(i => i.category === category).slice(0, 10).map(i => i.id),
      });
    }
  }

  console.log(`[DeepSeekAgent] Detected ${anomalies.length} anomalies`);
  return anomalies;
}

/**
 * Generate a quick summary without full analysis (for previews)
 */
export async function generateQuickSummary(items: DataSourceItem[]): Promise<string> {
  if (items.length === 0) return 'No data items to summarize.';

  const prompt = `
Provide a brief 2-3 sentence summary of these ${items.length} news items:

${items.slice(0, 20).map(i => `- ${i.title} (${i.category}, ${i.region})`).join('\n')}

Focus on the main themes and any notable trends.`;

  const { response } = await callDeepSeekR1(prompt, {
    temperature: 0.5,
    maxTokens: 256,
  });

  return response.trim();
}

/**
 * Check if DeepSeek R1 model is available
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
