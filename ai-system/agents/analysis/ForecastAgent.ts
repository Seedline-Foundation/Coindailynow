/**
 * Forecast Agent
 * Price prediction and macro indicator forecasting
 * 
 * Model: DeepSeek R1 8B (reasoning/analysis)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class ForecastAgent extends BaseAgent {
  constructor() {
    super({
      id: 'forecast-agent',
      name: 'Forecast Agent',
      type: 'forecast',
      category: 'analysis',
      description: 'Predicts crypto prices, macro indicators, and African market metrics using time-series analysis, statistical models, and AI-powered scenario generation.',
      capabilities: [
        'price_forecasting',
        'macro_prediction',
        'scenario_analysis',
        'risk_assessment',
        'african_market_forecast',
        'memecoin_prediction',
        'volume_prediction',
        'seasonal_analysis',
      ],
      model: 'deepseek',
      timeoutMs: 120000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { forecastType, data, symbols, timeframe } = task.input;

    switch (forecastType) {
      case 'price':
        return this.forecastPrice(data, symbols, timeframe);
      case 'macro':
        return this.forecastMacro(data, timeframe);
      case 'scenario':
        return this.generateScenarios(data, symbols);
      case 'african_market':
        return this.forecastAfricanMarket(data, timeframe);
      case 'risk':
        return this.assessRisk(data, symbols);
      case 'volume':
        return this.forecastVolume(data, symbols);
      default:
        return this.forecastPrice(data, symbols, timeframe);
    }
  }

  private async forecastPrice(data: any, symbols?: string[], timeframe?: string): Promise<Record<string, any>> {
    const prompt = `As a quantitative crypto analyst, provide price forecasts based on technical and fundamental analysis:

Historical data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || ['BTC', 'ETH'])}
Timeframe: ${timeframe || '7d'}

Return JSON:
{
  "forecasts": [
    {
      "symbol": string,
      "currentPrice": number,
      "predictions": {
        "24h": {"price": number, "change": number, "confidence": number},
        "7d": {"price": number, "change": number, "confidence": number},
        "30d": {"price": number, "change": number, "confidence": number}
      },
      "supportLevels": [number],
      "resistanceLevels": [number],
      "keyFactors": [string],
      "riskLevel": "low"|"medium"|"high"
    }
  ],
  "marketDirection": "bullish"|"bearish"|"sideways",
  "confidence": number (0-1),
  "methodology": [string],
  "caveats": [string],
  "summary": string,
  "disclaimer": "This is AI-generated analysis and should not be considered financial advice."
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 3000 });
  }

  private async forecastMacro(data: any, timeframe?: string): Promise<Record<string, any>> {
    const prompt = `Forecast macroeconomic indicators affecting African crypto markets:

Data: ${JSON.stringify(data || {}, null, 2)}
Timeframe: ${timeframe || '30d'}

Return JSON:
{
  "macroForecasts": {
    "globalGDP": {"trend": string, "impact": string},
    "inflation": {"trend": string, "impact": string},
    "interestRates": {"trend": string, "impact": string},
    "dollarStrength": {"trend": string, "impact": string},
    "cryptoRegulation": {"trend": string, "impact": string}
  },
  "africanMacro": {
    "nigeriaInflation": {"forecast": number, "impact": string},
    "kenyaGrowth": {"forecast": number, "impact": string},
    "saRandStrength": {"forecast": string, "impact": string},
    "remittanceFlows": {"forecast": string, "impact": string},
    "mobileMoneyGrowth": {"forecast": string, "impact": string}
  },
  "cryptoImpact": {"direction": string, "magnitude": "low"|"moderate"|"high", "timeline": string},
  "scenarios": [
    {"name": string, "probability": number, "impact": string, "triggers": [string]}
  ],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async generateScenarios(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Generate market scenarios with probability estimates:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "scenarios": [
    {
      "name": string,
      "probability": number (0-1),
      "description": string,
      "triggers": [string],
      "priceTargets": [{"symbol": string, "target": number, "change": number}],
      "timeline": string,
      "riskLevel": "low"|"medium"|"high"|"extreme",
      "africanImpact": string
    }
  ],
  "baseCase": {"description": string, "probability": number},
  "bestCase": {"description": string, "probability": number},
  "worstCase": {"description": string, "probability": number},
  "blackSwanRisks": [{"event": string, "probability": number, "impact": string}],
  "recommendations": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 3000 });
  }

  private async forecastAfricanMarket(data: any, timeframe?: string): Promise<Record<string, any>> {
    const prompt = `Forecast African crypto market metrics:

Data: ${JSON.stringify(data || {}, null, 2)}
Timeframe: ${timeframe || '30d'}

Return JSON:
{
  "africanForecast": {
    "totalVolume": {"current": number, "forecast": number, "growth": number},
    "userGrowth": {"current": number, "forecast": number, "rate": number},
    "p2pVolume": {"trend": string, "forecast": number},
    "exchangeGrowth": [{"exchange": string, "growthRate": number}],
    "topCountries": [{"country": string, "volumeForecast": number, "growth": number}]
  },
  "mobileMoneyForecast": {
    "integration": string,
    "volumeGrowth": number,
    "newPartners": [string]
  },
  "regulatoryOutlook": [{"country": string, "outlook": "positive"|"neutral"|"negative", "details": string}],
  "opportunities": [{"opportunity": string, "market": string, "timeline": string}],
  "risks": [{"risk": string, "probability": number, "impact": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async assessRisk(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Comprehensive risk assessment for crypto portfolio:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "overallRisk": "low"|"moderate"|"high"|"extreme",
  "riskScore": number (0-100),
  "assetRisks": [
    {"symbol": string, "riskScore": number, "factors": [string], "maxDrawdown": number}
  ],
  "systemicRisks": [{"risk": string, "probability": number, "impact": string}],
  "africanMarketRisks": [{"risk": string, "countries": [string], "mitigation": string}],
  "correlationRisk": number,
  "liquidityRisk": number,
  "regulatoryRisk": number,
  "recommendations": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async forecastVolume(data: any, symbols?: string[]): Promise<Record<string, any>> {
    const prompt = `Forecast trading volume for crypto assets:

Data: ${JSON.stringify(data || {}, null, 2)}
Symbols: ${JSON.stringify(symbols || [])}

Return JSON:
{
  "volumeForecasts": [
    {
      "symbol": string,
      "current24hVolume": number,
      "forecast24h": number,
      "forecast7d": number,
      "trend": "increasing"|"decreasing"|"stable",
      "anomalyRisk": number
    }
  ],
  "marketWideVolume": {"forecast": number, "trend": string},
  "africanExchangeVolume": [{"exchange": string, "forecastVolume": number}],
  "catalysts": [{"event": string, "expectedVolumeImpact": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }
}

export default ForecastAgent;
