/**
 * Crypto Research Agent
 * Deep research on crypto projects, tokens, protocols, and African blockchain
 * Replaces legacy check/ai-system crypto-research-agent
 * 
 * Model: DeepSeek R1 8B (deep reasoning)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class CryptoResearchAgent extends BaseAgent {
  constructor() {
    super({
      id: 'crypto-research-agent',
      name: 'Crypto Research Agent',
      type: 'crypto_research',
      category: 'research',
      description: 'Conducts deep research on crypto projects, tokens, DeFi protocols, and African blockchain initiatives. Produces detailed research reports with risk assessments.',
      capabilities: [
        'project_research',
        'token_analysis',
        'defi_protocol_review',
        'team_background_check',
        'tokenomics_analysis',
        'smart_contract_review',
        'competition_analysis',
        'african_blockchain_research',
        'rug_pull_detection',
        'investment_thesis',
      ],
      model: 'deepseek',
      timeoutMs: 180000, // 3 min for deep research
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { researchType, target, depth } = task.input;

    switch (researchType) {
      case 'project':
        return this.researchProject(target, depth);
      case 'token':
        return this.analyzeToken(target);
      case 'defi':
        return this.researchDefi(target);
      case 'african_blockchain':
        return this.researchAfricanBlockchain(target);
      case 'rug_pull_check':
        return this.checkRugPull(target);
      case 'competition':
        return this.analyzeCompetition(target);
      case 'investment_thesis':
        return this.generateInvestmentThesis(target);
      default:
        return this.researchProject(target, depth);
    }
  }

  private async researchProject(target: any, depth?: string): Promise<Record<string, any>> {
    const prompt = `Conduct comprehensive research on this crypto project:

Project: ${JSON.stringify(target || {}, null, 2)}
Depth: ${depth || 'standard'}

Return JSON:
{
  "project": {
    "name": string,
    "symbol": string,
    "category": string,
    "chain": string,
    "launchDate": string,
    "website": string
  },
  "overview": string (3-5 sentences),
  "team": {
    "known": boolean,
    "members": [{"name": string, "role": string, "background": string}],
    "credibility": "high"|"medium"|"low"|"unknown",
    "concerns": [string]
  },
  "technology": {
    "innovation": "high"|"medium"|"low",
    "auditStatus": string,
    "smartContractRisk": "low"|"medium"|"high",
    "scalability": string,
    "summary": string
  },
  "tokenomics": {
    "totalSupply": string,
    "circulating": string,
    "distribution": [{"category": string, "percentage": number}],
    "vestingSchedule": string,
    "inflationRate": string,
    "utility": [string],
    "score": number (0-10)
  },
  "marketPosition": {
    "competitors": [string],
    "uniqueValueProp": string,
    "marketCap": string,
    "rank": number
  },
  "africanRelevance": {
    "adoption": string,
    "partnerships": [string],
    "useCase": string,
    "score": number (0-10)
  },
  "risks": [{"risk": string, "severity": "low"|"medium"|"high"|"critical", "mitigation": string}],
  "strengths": [string],
  "weaknesses": [string],
  "overallScore": number (0-100),
  "recommendation": "strong_buy"|"buy"|"hold"|"avoid"|"strong_avoid",
  "disclaimer": "This is AI-generated research and not financial advice."
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 4000 });
  }

  private async analyzeToken(target: any): Promise<Record<string, any>> {
    const prompt = `Perform detailed token analysis:

Token: ${JSON.stringify(target || {}, null, 2)}

Return JSON:
{
  "token": {"name": string, "symbol": string, "chain": string},
  "priceAnalysis": {
    "currentPrice": string,
    "ath": string, "athDate": string,
    "atl": string, "atlDate": string,
    "priceChange": {"24h": number, "7d": number, "30d": number}
  },
  "onChainMetrics": {
    "holders": number,
    "topHolderConcentration": number,
    "transferVolume24h": string,
    "activeAddresses": number,
    "liquidityDepth": string
  },
  "socialMetrics": {
    "twitterFollowers": number,
    "telegramMembers": number,
    "sentiment": string,
    "socialScore": number
  },
  "fundamentalScore": number (0-100),
  "technicalScore": number (0-100),
  "socialScore": number (0-100),
  "overallScore": number (0-100),
  "riskLevel": "low"|"medium"|"high"|"extreme",
  "signals": [{"signal": string, "type": "bullish"|"bearish"|"neutral"}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async researchDefi(target: any): Promise<Record<string, any>> {
    const prompt = `Research this DeFi protocol:

Protocol: ${JSON.stringify(target || {}, null, 2)}

Return JSON:
{
  "protocol": {"name": string, "chain": string, "category": string},
  "overview": string,
  "tvl": {"current": string, "change30d": number},
  "security": {
    "audits": [{"auditor": string, "date": string, "result": string}],
    "exploitHistory": [string],
    "riskScore": number (0-10),
    "insuranceCoverage": boolean
  },
  "yield": {
    "pools": [{"name": string, "apy": number, "tvl": string, "risk": string}],
    "sustainability": string
  },
  "governance": {"type": string, "tokenHolders": number, "decentralization": string},
  "africanAccess": {"available": boolean, "restrictions": [string], "integrations": [string]},
  "competition": [{"protocol": string, "comparison": string}],
  "verdict": string,
  "riskRating": "AAA"|"AA"|"A"|"BBB"|"BB"|"B"|"C"|"D"
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async researchAfricanBlockchain(target: any): Promise<Record<string, any>> {
    const prompt = `Research African blockchain initiatives and projects:

Target: ${JSON.stringify(target || {}, null, 2)}

Return JSON:
{
  "initiative": {"name": string, "country": string, "type": string},
  "overview": string,
  "team": {"size": number, "africanFounders": boolean, "background": string},
  "problem": string,
  "solution": string,
  "impact": {
    "usersReached": number,
    "countriesActive": [string],
    "realWorldAdoption": string,
    "financialInclusion": string
  },
  "partnerships": [{"partner": string, "type": string, "significance": string}],
  "funding": {"raised": string, "investors": [string], "stage": string},
  "regulatoryStatus": [{"country": string, "status": string}],
  "competition": [string],
  "opportunities": [string],
  "challenges": [string],
  "score": number (0-100),
  "outlook": "very_promising"|"promising"|"neutral"|"challenging"
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2500 });
  }

  private async checkRugPull(target: any): Promise<Record<string, any>> {
    const prompt = `Assess rug pull risk for this token/project:

Target: ${JSON.stringify(target || {}, null, 2)}

Return JSON:
{
  "token": string,
  "rugPullRiskScore": number (0-100, higher = more risky),
  "riskLevel": "safe"|"low_risk"|"moderate"|"high_risk"|"extreme_danger",
  "redFlags": [
    {"flag": string, "severity": "critical"|"high"|"medium"|"low", "details": string}
  ],
  "greenFlags": [{"flag": string, "significance": string}],
  "analysis": {
    "contractOwnership": {"renounced": boolean, "multisig": boolean, "risk": string},
    "liquidity": {"locked": boolean, "amount": string, "lockDuration": string, "risk": string},
    "holderDistribution": {"top10Percentage": number, "risk": string},
    "tradingPattern": {"suspicious": boolean, "details": string},
    "socialAuthenticity": {"fakeFollowers": boolean, "engagement": string}
  },
  "similarToKnownScams": [{"scam": string, "similarity": number}],
  "verdict": string,
  "recommendation": "safe"|"caution"|"avoid"|"report"
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async analyzeCompetition(target: any): Promise<Record<string, any>> {
    const prompt = `Analyze competitive landscape for this crypto project:

Project: ${JSON.stringify(target || {}, null, 2)}

Return JSON:
{
  "project": string,
  "category": string,
  "competitors": [
    {
      "name": string,
      "marketCap": string,
      "strengths": [string],
      "weaknesses": [string],
      "africanPresence": boolean,
      "comparisonScore": number
    }
  ],
  "competitiveAdvantages": [string],
  "threats": [string],
  "marketShare": {"project": number, "topCompetitors": [{"name": string, "share": number}]},
  "moat": {"exists": boolean, "type": string, "strength": string},
  "positioning": string,
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async generateInvestmentThesis(target: any): Promise<Record<string, any>> {
    const prompt = `Generate an investment thesis for this crypto project:

Project: ${JSON.stringify(target || {}, null, 2)}

Return JSON:
{
  "thesis": {
    "title": string,
    "summary": string (3-5 sentences),
    "bullCase": {"scenario": string, "probability": number, "targetReturn": string, "catalysts": [string]},
    "bearCase": {"scenario": string, "probability": number, "maxLoss": string, "triggers": [string]},
    "baseCase": {"scenario": string, "probability": number, "expectedReturn": string},
    "keyMetrics": [{"metric": string, "current": string, "target": string}],
    "catalysts": [{"catalyst": string, "timeline": string, "impact": string}],
    "risks": [{"risk": string, "probability": string, "mitigation": string}],
    "entryPoints": [{"price": string, "rationale": string}],
    "exitPoints": [{"price": string, "rationale": string}],
    "timeHorizon": string,
    "conviction": "high"|"moderate"|"low",
    "africanAngle": string
  },
  "disclaimer": "This is AI-generated analysis and not financial advice. Always DYOR."
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 3000 });
  }
}

export default CryptoResearchAgent;
