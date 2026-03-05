/**
 * TradeBot Agent
 * AI-powered trading signals, strategy generation, and portfolio analysis
 * 
 * Model: DeepSeek R1 8B (analytical/reasoning)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class TradeBotAgent extends BaseAgent {
  constructor() {
    super({
      id: 'trade-bot-agent',
      name: 'TradeBot Agent',
      type: 'trade_bot',
      category: 'finance',
      description: 'Generates trading signals, analyzes market conditions, creates trading strategies, and provides portfolio analysis for CoinDaily premium subscribers in the African crypto market.',
      capabilities: [
        'signal_generation',
        'strategy_creation',
        'portfolio_analysis',
        'risk_assessment',
        'market_timing',
        'pair_analysis',
        'dca_planning',
        'african_exchange_analysis',
        'whale_tracking',
        'alert_generation',
      ],
      model: 'deepseek',
      timeoutMs: 120000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { action, data, symbol, portfolio } = task.input;

    switch (action) {
      case 'signal':
        return this.generateSignal(symbol, data);
      case 'strategy':
        return this.createStrategy(data);
      case 'portfolio':
        return this.analyzePortfolio(portfolio);
      case 'risk':
        return this.assessRisk(data);
      case 'timing':
        return this.marketTiming(data);
      case 'pair':
        return this.pairAnalysis(data);
      case 'dca':
        return this.dcaPlan(data);
      case 'african_exchange':
        return this.africanExchangeAnalysis(data);
      case 'whale':
        return this.whaleTracking(data);
      case 'alerts':
        return this.generateAlerts(data);
      default:
        return this.generateSignal(symbol, data);
    }
  }

  private async generateSignal(symbol: string, data: any): Promise<Record<string, any>> {
    const prompt = `Generate a trading signal for ${symbol || 'BTC'}:

Market data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "signal": {
    "symbol": "${symbol || 'BTC'}",
    "action": "strong_buy"|"buy"|"hold"|"sell"|"strong_sell",
    "confidence": number (0-100),
    "timeframe": "1h"|"4h"|"1d"|"1w",
    "entry": {"price": number, "zone": [number, number]},
    "targets": [{"level": number, "price": number, "probability": number}],
    "stopLoss": {"price": number, "percentage": number},
    "riskReward": number,
    "analysis": {
      "technical": {"score": number, "indicators": [{"name": string, "value": string, "signal": string}]},
      "fundamental": {"score": number, "factors": [string]},
      "sentiment": {"score": number, "source": string}
    },
    "africanContext": {"localPrice": string, "premiumDiscount": string, "localExchanges": [string]},
    "reasoning": string,
    "expiresAt": string,
    "disclaimer": "Not financial advice. DYOR. Trading carries risk."
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async createStrategy(data: any): Promise<Record<string, any>> {
    const prompt = `Create a trading strategy:

Parameters: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "strategy": {
    "name": string,
    "type": "swing"|"day"|"position"|"scalp"|"dca",
    "description": string,
    "rules": {
      "entry": [{"condition": string, "indicator": string, "value": string}],
      "exit": [{"condition": string, "indicator": string, "value": string}],
      "riskManagement": {"maxPositionSize": string, "maxDrawdown": string, "stopLossType": string}
    },
    "pairs": [string],
    "timeframes": [string],
    "backtest": {
      "period": string,
      "winRate": number,
      "profitFactor": number,
      "maxDrawdown": string,
      "sharpeRatio": number,
      "totalTrades": number
    },
    "africanOptimization": {"bestExchanges": [string], "feesConsideration": string, "liquidityNotes": string},
    "complexity": "beginner"|"intermediate"|"advanced",
    "estimatedTimeNeeded": string,
    "warnings": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async analyzePortfolio(portfolio: any): Promise<Record<string, any>> {
    const prompt = `Analyze this crypto portfolio:

Portfolio: ${JSON.stringify(portfolio || {}, null, 2)}

Return JSON:
{
  "portfolioAnalysis": {
    "totalValue": number,
    "allocation": [{"asset": string, "percentage": number, "value": number, "pnl": string}],
    "diversification": {"score": number (1-10), "issues": [string]},
    "riskProfile": {
      "level": "conservative"|"moderate"|"aggressive"|"very_aggressive",
      "volatility": number,
      "maxDrawdown": string,
      "sharpeRatio": number
    },
    "performance": {"24h": string, "7d": string, "30d": string, "ytd": string},
    "recommendations": [
      {"action": "buy"|"sell"|"hold"|"rebalance", "asset": string, "reason": string, "percentage": string}
    ],
    "rebalanceNeeded": boolean,
    "idealAllocation": [{"asset": string, "target": number, "current": number, "action": string}],
    "africanHoldings": [{"asset": string, "localRelevance": string}],
    "warnings": [string],
    "disclaimer": "Not financial advice. DYOR."
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async assessRisk(data: any): Promise<Record<string, any>> {
    const prompt = `Assess trading risk:

Position/Trade: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "riskAssessment": {
    "overallRisk": "very_low"|"low"|"moderate"|"high"|"very_high",
    "riskScore": number (1-100),
    "factors": [
      {"factor": string, "risk": number, "weight": number, "mitigation": string}
    ],
    "maxLoss": {"percentage": number, "amount": number},
    "positionSizing": {"recommended": string, "maxSafe": string},
    "correlationRisk": string,
    "liquidityRisk": string,
    "regulatoryRisk": string,
    "africanSpecificRisks": [string],
    "recommendations": [string],
    "stopLossSuggestion": number,
    "disclaimer": "Not financial advice. DYOR."
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async marketTiming(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze market timing:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "marketTiming": {
    "currentPhase": "accumulation"|"markup"|"distribution"|"markdown",
    "fearGreedIndex": number (0-100),
    "timing": "too_early"|"early"|"good"|"late"|"too_late",
    "signals": [{"signal": string, "strength": string, "timeframe": string}],
    "macroFactors": [{"factor": string, "impact": string}],
    "seasonality": string,
    "recommendation": string,
    "africanMarketPhase": string,
    "optimalEntryWindow": string,
    "warnings": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async pairAnalysis(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze trading pair:

Pair: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "pairAnalysis": {
    "pair": string,
    "correlation": number,
    "spread": {"current": number, "average": number, "trend": string},
    "liquidity": {"score": number, "depth": string},
    "volatility": {"current": number, "average": number},
    "technicals": [{"indicator": string, "value": string, "signal": string}],
    "recommendation": string,
    "bestExchanges": [{"exchange": string, "spread": string, "fee": string}],
    "africanAvailability": [{"exchange": string, "available": boolean, "localPair": string}]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async dcaPlan(data: any): Promise<Record<string, any>> {
    const prompt = `Create a DCA (Dollar Cost Averaging) plan:

Parameters: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "dcaPlan": {
    "asset": string,
    "totalBudget": number,
    "frequency": "daily"|"weekly"|"biweekly"|"monthly",
    "amount": number,
    "duration": string,
    "schedule": [{"date": string, "amount": number, "notes": string}],
    "projectionScenarios": {
      "bear": {"endValue": number, "avgPrice": number, "roi": string},
      "base": {"endValue": number, "avgPrice": number, "roi": string},
      "bull": {"endValue": number, "avgPrice": number, "roi": string}
    },
    "africaFriendly": {"exchanges": [string], "mobileMoney": boolean, "minAmount": string},
    "tips": [string],
    "warnings": [string],
    "disclaimer": "Not financial advice. DYOR."
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1500 });
  }

  private async africanExchangeAnalysis(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze African crypto exchanges:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "exchangeAnalysis": {
    "exchanges": [
      {
        "name": string,
        "country": string,
        "pairs": number,
        "volume24h": string,
        "fees": {"maker": string, "taker": string},
        "depositMethods": [string],
        "mobileMoneySupport": boolean,
        "rating": number (1-10),
        "pros": [string],
        "cons": [string],
        "bestFor": string
      }
    ],
    "comparison": [{"metric": string, "values": object}],
    "recommendation": {"beginner": string, "trader": string, "defi": string},
    "arbitrageOpportunities": [{"pair": string, "buyExchange": string, "sellExchange": string, "spread": string}],
    "regulatoryStatus": [{"country": string, "status": string}]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async whaleTracking(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze whale activity:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "whaleActivity": {
    "summary": string,
    "movements": [
      {"address": string, "amount": string, "token": string, "direction": "in"|"out", "exchange": string, "significance": string}
    ],
    "accumulation": [{"token": string, "netFlow": string, "interpretation": string}],
    "distribution": [{"token": string, "netFlow": string, "interpretation": string}],
    "signals": [{"signal": string, "strength": string, "action": string}],
    "africanWhales": [{"description": string, "activity": string}],
    "marketImpact": string,
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async generateAlerts(data: any): Promise<Record<string, any>> {
    const prompt = `Generate trading alerts based on market conditions:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "alerts": [
    {
      "type": "price"|"volume"|"whale"|"technical"|"fundamental"|"news",
      "severity": "info"|"warning"|"critical",
      "asset": string,
      "title": string,
      "message": string,
      "action": string,
      "expiresIn": string
    }
  ],
  "summary": string,
  "topPriority": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }
}

export default TradeBotAgent;
