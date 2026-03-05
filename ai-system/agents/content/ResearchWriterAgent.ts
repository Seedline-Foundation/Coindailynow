/**
 * ResearchWriter Agent
 * Auto-generates research reports, data visualizations, and analysis documents
 * 
 * Model: Llama 3.1 8B (content generation) + DeepSeek R1 (analysis)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class ResearchWriterAgent extends BaseAgent {
  constructor() {
    super({
      id: 'research-writer-agent',
      name: 'ResearchWriter Agent',
      type: 'research_writer',
      category: 'content',
      description: 'Automatically generates professional research reports, market analysis documents, weekly/monthly summaries, and investor briefings with data-driven insights for African crypto markets.',
      capabilities: [
        'report_generation',
        'data_analysis_writing',
        'market_summary',
        'weekly_report',
        'monthly_report',
        'investor_briefing',
        'token_report',
        'african_market_report',
        'comparison_analysis',
        'regulatory_summary',
      ],
      model: 'llama',
      timeoutMs: 180000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { reportType, data, format, audience } = task.input;

    switch (reportType) {
      case 'weekly_market':
        return this.generateWeeklyReport(data);
      case 'monthly_market':
        return this.generateMonthlyReport(data);
      case 'token_report':
        return this.generateTokenReport(data);
      case 'african_market':
        return this.generateAfricanReport(data);
      case 'investor_briefing':
        return this.generateInvestorBriefing(data);
      case 'custom':
        return this.generateCustomReport(data, format, audience);
      case 'regulatory':
        return this.generateRegulatoryReport(data);
      case 'comparison':
        return this.generateComparisonReport(data);
      default:
        return this.generateWeeklyReport(data);
    }
  }

  private async generateWeeklyReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a comprehensive weekly crypto market report for CoinDaily:

Data: ${JSON.stringify(data || {}, null, 2)}
Week: ${new Date().toISOString().split('T')[0]}

Write a professional report. Return JSON:
{
  "report": {
    "title": "CoinDaily Weekly Market Report - [Date]",
    "executive_summary": string (3-5 sentences),
    "sections": [
      {
        "title": string,
        "content": string (2-3 paragraphs),
        "keyMetrics": [{"label": string, "value": string, "change": string}],
        "chartData": [{"label": string, "value": number}]
      }
    ],
    "marketOverview": {
      "btcSummary": string,
      "ethSummary": string,
      "altsSummary": string,
      "memecoins": string,
      "defi": string
    },
    "africanMarket": {
      "summary": string,
      "countryHighlights": [{"country": string, "highlight": string}],
      "exchangeVolumes": [{"exchange": string, "volume": string, "change": string}],
      "regulatoryUpdates": [string]
    },
    "topPerformers": [{"name": string, "change": string}],
    "worstPerformers": [{"name": string, "change": string}],
    "weekAhead": string,
    "riskLevel": "low"|"moderate"|"elevated"|"high",
    "keyDatesAhead": [{"date": string, "event": string}]
  },
  "metadata": {
    "wordCount": number,
    "readTime": number,
    "isPremium": boolean,
    "seoTitle": string,
    "seoDescription": string,
    "tags": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 5000 });
  }

  private async generateMonthlyReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a comprehensive monthly crypto market report:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "report": {
    "title": string,
    "month": string,
    "executiveSummary": string (5-7 sentences),
    "marketPerformance": {
      "totalMarketCap": {"start": string, "end": string, "change": string},
      "btcDominance": {"start": number, "end": number},
      "totalVolume": string,
      "topNarratives": [string]
    },
    "sectorAnalysis": [
      {"sector": string, "performance": string, "outlook": string, "topProjects": [string]}
    ],
    "africanDeepDive": {
      "adoption": string,
      "volumeGrowth": string,
      "topCountries": [{"country": string, "metrics": string}],
      "regulatoryChanges": [string],
      "mobileMoneyTrends": string,
      "p2pMarket": string
    },
    "defiReport": {"tvl": string, "topProtocols": [string], "yields": string},
    "nftReport": {"volume": string, "trends": [string]},
    "investorInsights": {
      "outlook": string,
      "opportunities": [string],
      "risks": [string],
      "recommendations": [string]
    },
    "monthAhead": string
  },
  "dataVisualizations": [
    {"title": string, "type": "bar"|"line"|"pie"|"table", "data": object}
  ]
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 5000 });
  }

  private async generateTokenReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a detailed token research report:

Token data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "report": {
    "title": string,
    "token": {"name": string, "symbol": string, "chain": string},
    "summary": string,
    "priceAnalysis": {
      "current": string,
      "historicalPerformance": string,
      "technicalAnalysis": string,
      "supportResistance": {"support": [number], "resistance": [number]}
    },
    "fundamentals": {
      "team": string,
      "technology": string,
      "tokenomics": string,
      "useCase": string,
      "community": string
    },
    "onChainData": {
      "holders": string,
      "transactions": string,
      "smartContractActivity": string
    },
    "competitivePosition": string,
    "africanRelevance": string,
    "riskFactors": [string],
    "investmentThesis": {"bull": string, "bear": string, "base": string},
    "rating": number (1-10),
    "targetPrice": {"bear": string, "base": string, "bull": string}
  },
  "disclaimer": "Not financial advice. DYOR."
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 4000 });
  }

  private async generateAfricanReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a dedicated African crypto market report:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "report": {
    "title": "African Crypto Market Report",
    "date": "${new Date().toISOString().split('T')[0]}",
    "executiveSummary": string,
    "countries": [
      {
        "name": string,
        "cryptoAdoption": string,
        "topExchanges": [string],
        "volumeTrend": string,
        "regulatoryStatus": string,
        "mobileMoneyIntegration": string,
        "p2pActivity": string,
        "highlights": [string]
      }
    ],
    "panAfricanTrends": [string],
    "mobileMoneyReport": {"volume": string, "growth": string, "topProviders": [string]},
    "defiInAfrica": {"tvl": string, "topProtocols": [string], "adoption": string},
    "opportunities": [{"opportunity": string, "country": string, "potential": string}],
    "challenges": [{"challenge": string, "regions": [string], "mitigation": string}],
    "outlook": string,
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 4000 });
  }

  private async generateInvestorBriefing(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a concise investor briefing:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "briefing": {
    "title": string,
    "date": "${new Date().toISOString().split('T')[0]}",
    "tldr": string (2-3 sentences),
    "marketSnapshot": {"btc": string, "eth": string, "alts": string, "fearGreed": number},
    "keyDevelopments": [{"development": string, "impact": "positive"|"negative"|"neutral", "significance": string}],
    "africanUpdate": string,
    "opportunities": [{"asset": string, "thesis": string, "risk": string}],
    "risks": [{"risk": string, "probability": string, "mitigation": string}],
    "watchList": [{"asset": string, "catalyst": string, "timeframe": string}],
    "actionItems": [string],
    "nextBriefing": string
  },
  "confidentialityLevel": "internal"|"client"|"public"
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2500 });
  }

  private async generateCustomReport(data: any, format?: string, audience?: string): Promise<Record<string, any>> {
    const prompt = `Generate a custom research report:

Data: ${JSON.stringify(data || {}, null, 2)}
Format: ${format || 'standard'}
Audience: ${audience || 'general'}

Return JSON:
{
  "report": {
    "title": string,
    "format": "${format || 'standard'}",
    "audience": "${audience || 'general'}",
    "sections": [
      {"title": string, "content": string, "data": object}
    ],
    "conclusions": [string],
    "recommendations": [string],
    "methodology": string,
    "sources": [string]
  },
  "metadata": {"wordCount": number, "readTime": number, "quality": number}
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 3000 });
  }

  private async generateRegulatoryReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a regulatory landscape report for crypto in Africa:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "report": {
    "title": "Crypto Regulatory Report - Africa",
    "countries": [
      {
        "name": string,
        "status": "favorable"|"neutral"|"restrictive"|"banned",
        "recentChanges": [string],
        "keyRegulations": [string],
        "impact": string,
        "outlook": string
      }
    ],
    "panAfricanInitiatives": [string],
    "trends": [string],
    "risks": [string],
    "opportunities": [string],
    "complianceRecommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 3000 });
  }

  private async generateComparisonReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a comparison analysis report:

Items to compare: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "comparison": {
    "title": string,
    "items": [string],
    "criteria": [
      {"criterion": string, "weight": number, "scores": [{"item": string, "score": number, "notes": string}]}
    ],
    "overallScores": [{"item": string, "totalScore": number, "rank": number}],
    "winner": {"item": string, "reason": string},
    "africanMost": {"item": string, "reason": string},
    "detailed_analysis": string,
    "recommendation": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2500 });
  }
}

export default ResearchWriterAgent;
