/**
 * MarketPulse Agent
 * Real-time market insights with pattern recognition and alert generation
 * 
 * Model: DeepSeek R1 8B (reasoning/analysis)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class MarketPulseAgent extends BaseAgent {
  constructor() {
    super({
      id: 'market-pulse-agent',
      name: 'MarketPulse Agent',
      type: 'market_pulse',
      category: 'analysis',
      description: 'Generates real-time market insights using pattern recognition, correlation analysis, and anomaly detection. Monitors African exchanges and mobile money flows.',
      capabilities: [
        'pattern_recognition',
        'correlation_analysis',
        'anomaly_detection',
        'alert_generation',
        'market_summary',
        'african_exchange_monitoring',
        'mobile_money_tracking',
        'volatility_analysis',
      ],
      model: 'deepseek',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { taskType, data, symbols, exchanges } = task.input;

    switch (taskType) {
      case 'market_pulse':
        return this.generateMarketPulse(data);
      case 'anomaly_detection':
        return this.detectAnomalies(data);
      case 'correlation':
        return this.analyzeCorrelations(data, symbols);
      case 'african_pulse':
        return this.generateAfricanPulse(data, exchanges);
      case 'volatility':
        return this.analyzeVolatility(data, symbols);
      case 'alert_check':
        return this.checkAlertConditions(data);
      default:
        return this.generateMarketPulse(data);
    }
  }

  private async generateMarketPulse(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a comprehensive real-time market pulse report:

Market data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "pulse": {
    "timestamp": "${new Date().toISOString()}",
    "overallDirection": "bullish"|"bearish"|"sideways",
    "marketStrength": number (0-100),
    "volatility": "low"|"moderate"|"high"|"extreme",
    "dominance": {"btc": number, "eth": number, "alts": number},
    "fearGreedIndex": number (0-100)
  },
  "topMovers": {
    "gainers": [{"symbol": string, "change": number, "volume": number}],
    "losers": [{"symbol": string, "change": number, "volume": number}],
    "volumeLeaders": [{"symbol": string, "volume": number}]
  },
  "patterns": [
    {"pattern": string, "symbols": [string], "significance": "high"|"medium"|"low", "action": string}
  ],
  "alerts": [
    {"type": "price"|"volume"|"pattern"|"whale", "message": string, "severity": "info"|"warning"|"critical"}
  ],
  "africanMarket": {
    "summary": string,
    "activeExchanges": [{"name": string, "volume24h": number, "topPair": string}],
    "mobileMoneyFlows": string
  },
  "shortTermOutlook": string,
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 3000 });
  }

  private async detectAnomalies(data: any): Promise<Record<string, any>> {
    const prompt = `Detect market anomalies and unusual activity:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "anomalies": [
    {
      "type": "price_spike"|"volume_surge"|"whale_movement"|"exchange_flow"|"correlation_break",
      "symbol": string,
      "description": string,
      "severity": "low"|"medium"|"high"|"critical",
      "potentialCause": string,
      "actionRecommended": string,
      "confidence": number (0-1)
    }
  ],
  "normalRangeDeviations": [{"metric": string, "expected": number, "actual": number, "deviation": number}],
  "suspiciousActivity": [{"description": string, "risk": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async analyzeCorrelations(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Analyze correlations between crypto assets and external factors:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "correlations": [
    {"pair": [string, string], "coefficient": number, "period": string, "trend": "strengthening"|"weakening"|"stable"}
  ],
  "decouplingEvents": [{"asset": string, "from": string, "significance": string}],
  "africanCorrelations": [{"crypto": string, "localFactor": string, "correlation": number}],
  "macroLinks": [{"factor": string, "impact": string, "correlation": number}],
  "insights": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async generateAfricanPulse(data: any, exchanges?: string[]): Promise<Record<string, any>> {
    const prompt = `Generate an African crypto market pulse report:

Data: ${JSON.stringify(data || {}, null, 2)}
Exchanges: ${JSON.stringify(exchanges || ['Binance Africa', 'Luno', 'Quidax', 'BuyCoins', 'Valr', 'Ice3X'])}

Return JSON:
{
  "africanPulse": {
    "overallActivity": "high"|"moderate"|"low",
    "totalVolume24h": number,
    "dominantCountries": [{"country": string, "volume": number, "growth": number}],
    "exchanges": [{"name": string, "volume": number, "topPairs": [string], "status": string}],
    "mobileMoneyFlows": {
      "mpesa": {"volume": string, "trend": string},
      "orangeMoney": {"volume": string, "trend": string},
      "mtnMoney": {"volume": string, "trend": string}
    },
    "p2pActivity": {"volume": number, "trend": string, "topPlatforms": [string]},
    "regulatoryUpdates": [{"country": string, "update": string, "impact": string}]
  },
  "opportunities": [string],
  "risks": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async analyzeVolatility(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Analyze market volatility patterns:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "volatilityIndex": number (0-100),
  "regime": "low"|"moderate"|"high"|"extreme",
  "assets": [
    {"symbol": string, "volatility30d": number, "trend": string, "expectedRange": {"min": number, "max": number}}
  ],
  "volatilityEvents": [{"event": string, "impact": number, "duration": string}],
  "hedgingRecommendations": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async checkAlertConditions(data: any): Promise<Record<string, any>> {
    const prompt = `Check market conditions against alert thresholds:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "alertsTriggered": [
    {"id": string, "type": string, "condition": string, "value": number, "threshold": number, "severity": "info"|"warning"|"critical", "message": string}
  ],
  "nearThreshold": [
    {"condition": string, "current": number, "threshold": number, "distance": number}
  ],
  "allClear": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }
}

export default MarketPulseAgent;
