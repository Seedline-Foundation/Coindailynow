/**
 * Trend Analysis Agent
 * Identifies and predicts market trends using statistical analysis + AI reasoning
 * Replaces legacy check/ai-system trend analysis agent
 * 
 * Model: DeepSeek R1 8B (reasoning/analysis)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class TrendAnalysisAgent extends BaseAgent {
  constructor() {
    super({
      id: 'trend-analysis-agent',
      name: 'Trend Analysis Agent',
      type: 'trend_analysis',
      category: 'analysis',
      description: 'Identifies emerging market trends, detects pattern breakouts, and provides predictive analysis for crypto markets with African market specialization.',
      capabilities: [
        'trend_identification',
        'pattern_recognition',
        'breakout_detection',
        'momentum_analysis',
        'african_market_trends',
        'memecoin_trend_detection',
        'cross_market_correlation',
        'trend_prediction',
      ],
      model: 'deepseek',
      timeoutMs: 90000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { analysisType, data, timeframe, symbols } = task.input;

    switch (analysisType) {
      case 'trend_identification':
        return this.identifyTrends(data, timeframe);
      case 'pattern_recognition':
        return this.recognizePatterns(data, symbols);
      case 'breakout_detection':
        return this.detectBreakouts(data);
      case 'momentum_analysis':
        return this.analyzeMomentum(data, symbols);
      case 'memecoin_trends':
        return this.analyzeMemecoTrends(data);
      case 'cross_market':
        return this.analyzeCrossMarket(data);
      default:
        return this.identifyTrends(data, timeframe);
    }
  }

  private async identifyTrends(data: any, timeframe?: string): Promise<Record<string, any>> {
    const prompt = `You are an expert crypto market trend analyst specializing in African markets.

Analyze the following market data and identify key trends:

Data: ${JSON.stringify(data || {}, null, 2)}
Timeframe: ${timeframe || '24h'}

Return JSON:
{
  "trends": [
    {
      "name": string,
      "direction": "bullish"|"bearish"|"sideways",
      "strength": number (0-100),
      "duration": string,
      "confidence": number (0-1),
      "tokens": [string],
      "description": string,
      "africanRelevance": number (0-1)
    }
  ],
  "emergingTrends": [{"trend": string, "probability": number, "timeframe": string}],
  "fadingTrends": [{"trend": string, "reason": string}],
  "africanMarket": {
    "uniqueTrends": [string],
    "exchangeSpecific": [{"exchange": string, "trend": string}],
    "mobileMoneyImpact": string
  },
  "outlook": string,
  "riskFactors": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 3000 });
  }

  private async recognizePatterns(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Analyze price/volume data for chart patterns and technical signals:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "patterns": [
    {
      "symbol": string,
      "pattern": string,
      "type": "continuation"|"reversal"|"bilateral",
      "confidence": number (0-1),
      "targetPrice": number,
      "stopLoss": number,
      "timeframe": string
    }
  ],
  "supportResistance": [{"symbol": string, "support": number, "resistance": number}],
  "volumeAnalysis": {"trend": string, "anomalies": [string]},
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async detectBreakouts(data: any): Promise<Record<string, any>> {
    const prompt = `Detect potential breakout signals in crypto market data:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "breakouts": [
    {
      "symbol": string,
      "direction": "up"|"down",
      "confidence": number (0-1),
      "currentPrice": number,
      "breakoutLevel": number,
      "volume": string,
      "catalyst": string,
      "risk": "low"|"medium"|"high"
    }
  ],
  "watchlist": [{"symbol": string, "level": number, "direction": string}],
  "falseBreakoutRisk": [{"symbol": string, "risk": number}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async analyzeMomentum(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Analyze momentum indicators for crypto assets:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "momentum": [
    {
      "symbol": string,
      "rsi": number,
      "macd": {"signal": string, "histogram": number},
      "momentum": "strong_bullish"|"bullish"|"neutral"|"bearish"|"strong_bearish",
      "divergence": boolean,
      "recommendation": string
    }
  ],
  "overbought": [string],
  "oversold": [string],
  "divergences": [{"symbol": string, "type": "bullish"|"bearish", "significance": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async analyzeMemecoTrends(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze memecoin market trends with focus on African adoption:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "trendingMemecoins": [
    {
      "name": string,
      "symbol": string,
      "trendScore": number (0-100),
      "socialMentions": number,
      "priceChange24h": number,
      "africanAdoption": string,
      "riskLevel": "low"|"medium"|"high"|"extreme"
    }
  ],
  "narratives": [{"narrative": string, "coins": [string], "momentum": string}],
  "rugPullRisk": [{"coin": string, "riskScore": number, "flags": [string]}],
  "emergingMemes": [{"name": string, "potential": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async analyzeCrossMarket(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze cross-market correlations between crypto and traditional/African markets:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "correlations": [
    {"pair": [string, string], "correlation": number, "significance": string}
  ],
  "africanMarketLinks": [
    {"cryptoAsset": string, "africanAsset": string, "relationship": string}
  ],
  "mobileMoneyFlows": {"trend": string, "impact": string},
  "macroFactors": [{"factor": string, "impact": string, "direction": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }
}

export default TrendAnalysisAgent;
