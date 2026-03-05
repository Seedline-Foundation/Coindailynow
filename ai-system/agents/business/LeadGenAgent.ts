/**
 * LeadGen Agent
 * AI lead generation, qualification, and nurturing
 * 
 * Model: DeepSeek R1 8B (analytical scoring) + Llama 3.1 (content)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class LeadGenAgent extends BaseAgent {
  constructor() {
    super({
      id: 'lead-gen-agent',
      name: 'LeadGen Agent',
      type: 'lead_generation',
      category: 'business',
      description: 'Identifies and qualifies potential advertisers, premium subscribers, and enterprise clients for CoinDaily through data analysis, scoring, and automated outreach targeting the African crypto market.',
      capabilities: [
        'lead_scoring',
        'lead_qualification',
        'prospect_enrichment',
        'icp_matching',
        'lead_nurturing',
        'campaign_targeting',
        'market_sizing',
        'audience_segmentation',
        'conversion_optimization',
        'pipeline_analysis',
      ],
      model: 'deepseek',
      timeoutMs: 90000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { action, leads, data, criteria } = task.input;

    switch (action) {
      case 'score':
        return this.scoreLeads(leads);
      case 'qualify':
        return this.qualifyLead(data);
      case 'enrich':
        return this.enrichProspect(data);
      case 'icp_match':
        return this.matchICP(data, criteria);
      case 'nurture_plan':
        return this.createNurturePlan(data);
      case 'segment':
        return this.segmentAudience(data);
      case 'market_size':
        return this.sizeMarket(data);
      case 'pipeline':
        return this.analyzePipeline(data);
      case 'identify':
        return this.identifyProspects(criteria);
      default:
        return this.scoreLeads(leads || [data]);
    }
  }

  private async scoreLeads(leads: any[]): Promise<Record<string, any>> {
    const prompt = `Score these leads for CoinDaily (Africa crypto news platform):

Leads: ${JSON.stringify(leads || [], null, 2)}

Scoring criteria: company size, crypto relevance, African market presence, budget signals, engagement history.

Return JSON:
{
  "leadScoring": {
    "leads": [
      {
        "id": string,
        "name": string,
        "score": number (0-100),
        "grade": "A"|"B"|"C"|"D",
        "factors": [{"factor": string, "score": number, "weight": number}],
        "readiness": "hot"|"warm"|"cold",
        "nextAction": string,
        "estimatedValue": number,
        "conversionProbability": number
      }
    ],
    "summary": {"total": number, "hot": number, "warm": number, "cold": number},
    "topPriority": [string],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async qualifyLead(data: any): Promise<Record<string, any>> {
    const prompt = `Qualify this lead using BANT framework for CoinDaily:

Lead: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "qualification": {
    "lead": string,
    "bant": {
      "budget": {"score": number (1-5), "assessment": string, "evidence": string},
      "authority": {"score": number (1-5), "assessment": string, "decisionMaker": boolean},
      "need": {"score": number (1-5), "assessment": string, "painPoints": [string]},
      "timeline": {"score": number (1-5), "assessment": string, "urgency": string}
    },
    "overallScore": number (0-100),
    "qualified": boolean,
    "stage": "mql"|"sql"|"opportunity"|"not_qualified",
    "recommendedApproach": string,
    "talkingPoints": [string],
    "objectionsPredicted": [string],
    "nextSteps": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async enrichProspect(data: any): Promise<Record<string, any>> {
    const prompt = `Enrich this prospect profile for CoinDaily sales:

Prospect: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "enrichedProfile": {
    "company": {
      "name": string,
      "industry": string,
      "size": string,
      "revenue": string,
      "funding": string,
      "cryptoRelevance": number (1-10),
      "africanPresence": [string],
      "techStack": [string]
    },
    "contacts": [{"role": string, "relevance": string}],
    "signals": {
      "buyingSignals": [string],
      "riskSignals": [string],
      "recentNews": [string]
    },
    "socialPresence": {"platforms": [string], "followers": string, "engagement": string},
    "competitors": [string],
    "fitScore": number (1-10),
    "personalizedHooks": [string],
    "recommendedProducts": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1500 });
  }

  private async matchICP(data: any, criteria?: any): Promise<Record<string, any>> {
    const prompt = `Match this company against CoinDaily's Ideal Customer Profile:

Company: ${JSON.stringify(data || {}, null, 2)}
ICP Criteria: ${JSON.stringify(criteria || {
      industry: ['crypto', 'fintech', 'blockchain', 'defi'],
      regions: ['Africa', 'Global with African interest'],
      budget: '$1000+/month',
      needs: ['brand awareness', 'user acquisition', 'African market entry']
    }, null, 2)}

Return JSON:
{
  "icpMatch": {
    "company": string,
    "matchScore": number (0-100),
    "criteria": [
      {"criterion": string, "match": boolean, "score": number, "notes": string}
    ],
    "strengths": [string],
    "gaps": [string],
    "recommendation": "perfect_fit"|"good_fit"|"partial_fit"|"not_fit",
    "suggestedApproach": string,
    "estimatedDealSize": number,
    "estimatedTimeline": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async createNurturePlan(data: any): Promise<Record<string, any>> {
    const prompt = `Create a lead nurturing plan:

Lead: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "nurturePlan": {
    "lead": string,
    "stage": string,
    "duration": string,
    "touchpoints": [
      {"day": number, "channel": string, "content": string, "goal": string, "metric": string}
    ],
    "contentPieces": [{"type": string, "topic": string, "personalization": string}],
    "triggers": [{"event": string, "action": string}],
    "exitCriteria": {"positive": [string], "negative": [string]},
    "estimatedConversionRate": number,
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  private async segmentAudience(data: any): Promise<Record<string, any>> {
    const prompt = `Segment CoinDaily's audience for targeted campaigns:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "segmentation": {
    "segments": [
      {
        "name": string,
        "size": string,
        "characteristics": [string],
        "interests": [string],
        "behavior": string,
        "value": "high"|"medium"|"low",
        "strategy": string,
        "messaging": string,
        "channels": [string]
      }
    ],
    "africanSegments": [
      {"country": string, "segment": string, "size": string, "characteristics": string}
    ],
    "recommendations": [string],
    "campaignIdeas": [{"segment": string, "campaign": string, "expectedROI": string}]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  private async sizeMarket(data: any): Promise<Record<string, any>> {
    const prompt = `Size the addressable market for CoinDaily's services:

Context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "marketSizing": {
    "tam": {"value": string, "description": string},
    "sam": {"value": string, "description": string},
    "som": {"value": string, "description": string},
    "growthRate": string,
    "segments": [{"segment": string, "size": string, "growth": string}],
    "african": {"totalMarket": string, "growth": string, "topCountries": [{"country": string, "size": string}]},
    "methodology": string,
    "assumptions": [string],
    "opportunities": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1500 });
  }

  private async analyzePipeline(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze the sales pipeline:

Pipeline: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "pipelineAnalysis": {
    "totalValue": number,
    "weightedValue": number,
    "stages": [{"stage": string, "count": number, "value": number, "avgAge": number}],
    "velocity": {"avgDealCycle": string, "conversionRates": object},
    "atRisk": [{"deal": string, "risk": string, "action": string}],
    "forecast": {"thisMonth": number, "nextMonth": number, "thisQuarter": number},
    "bottlenecks": [string],
    "recommendations": [string],
    "healthScore": number (1-10)
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async identifyProspects(criteria: any): Promise<Record<string, any>> {
    const prompt = `Identify potential prospects for CoinDaily:

Criteria: ${JSON.stringify(criteria || {}, null, 2)}

Return JSON:
{
  "prospects": {
    "idealProfiles": [
      {
        "type": string,
        "industry": string,
        "examples": [string],
        "approach": string,
        "estimatedValue": string,
        "africanRelevance": string
      }
    ],
    "searchStrategies": [{"channel": string, "query": string, "expected": number}],
    "outreachTemplates": [{"type": string, "template": string}],
    "totalAddressable": number,
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }
}

export default LeadGenAgent;
