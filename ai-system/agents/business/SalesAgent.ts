/**
 * Sales Agent
 * AI-powered sales outreach, proposal generation, and deal management
 * 
 * Model: Llama 3.1 8B (conversational/creative)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class SalesAgent extends BaseAgent {
  constructor() {
    super({
      id: 'sales-agent',
      name: 'Sales Agent',
      type: 'sales',
      category: 'business',
      description: 'Automates sales processes including outreach emails, proposal generation, ad package creation, partnership pitches, and deal tracking for CoinDaily advertising and enterprise subscriptions.',
      capabilities: [
        'outreach_email',
        'proposal_generation',
        'ad_package_creation',
        'partnership_pitch',
        'deal_analysis',
        'objection_handling',
        'pricing_recommendation',
        'follow_up_sequence',
        'competitor_analysis',
        'roi_calculation',
      ],
      model: 'llama',
      timeoutMs: 90000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { salesAction, prospect, data, context } = task.input;

    switch (salesAction) {
      case 'outreach':
        return this.generateOutreach(prospect, context);
      case 'proposal':
        return this.generateProposal(prospect, data);
      case 'ad_package':
        return this.createAdPackage(prospect, data);
      case 'partnership':
        return this.partnershipPitch(prospect, data);
      case 'objection':
        return this.handleObjection(task.input.objection, context);
      case 'follow_up':
        return this.createFollowUpSequence(prospect, context);
      case 'roi':
        return this.calculateROI(data);
      case 'competitor':
        return this.competitorAnalysis(data);
      case 'deal_score':
        return this.scoreDeal(data);
      default:
        return this.generateOutreach(prospect, context);
    }
  }

  private async generateOutreach(prospect: any, context?: any): Promise<Record<string, any>> {
    const prompt = `Create a personalized cold outreach email for CoinDaily advertising:

Prospect: ${JSON.stringify(prospect || {}, null, 2)}
Context: ${JSON.stringify(context || {}, null, 2)}

CoinDaily is Africa's #1 crypto news platform reaching 500K+ monthly readers across Nigeria, Kenya, South Africa, and Ghana.

Return JSON:
{
  "outreach": {
    "subject": string,
    "body": string,
    "personalization": [string],
    "callToAction": string,
    "followUpDate": string,
    "alternativeSubjects": [string],
    "linkedInMessage": string,
    "twitterDM": string,
    "estimatedOpenRate": number,
    "estimatedReplyRate": number
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.7, maxTokens: 1500 });
  }

  private async generateProposal(prospect: any, data?: any): Promise<Record<string, any>> {
    const prompt = `Generate a professional sales proposal for CoinDaily services:

Prospect: ${JSON.stringify(prospect || {}, null, 2)}
Requirements: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "proposal": {
    "title": string,
    "clientName": string,
    "executiveSummary": string,
    "challenge": string,
    "solution": string,
    "packages": [
      {
        "name": string,
        "features": [string],
        "pricing": {"monthly": number, "annual": number, "currency": "USD"},
        "deliverables": [string],
        "timeline": string
      }
    ],
    "caseStudies": [{"client": string, "result": string}],
    "roi": {"estimated": string, "metrics": [string]},
    "timeline": [{"phase": string, "duration": string, "deliverables": [string]}],
    "terms": [string],
    "nextSteps": [string],
    "validUntil": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 2500 });
  }

  private async createAdPackage(prospect: any, data?: any): Promise<Record<string, any>> {
    const prompt = `Create a tailored advertising package for a crypto/fintech advertiser on CoinDaily:

Advertiser: ${JSON.stringify(prospect || {}, null, 2)}
Requirements: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "adPackage": {
    "name": string,
    "advertiser": string,
    "placements": [
      {"type": "banner"|"sponsored"|"newsletter"|"native"|"social", "position": string, "impressions": number, "pricing": string}
    ],
    "targeting": {
      "countries": [string],
      "interests": [string],
      "demographics": string
    },
    "totalBudget": {"monthly": number, "campaign": number},
    "estimatedResults": {
      "impressions": number,
      "clicks": number,
      "ctr": number,
      "conversions": number,
      "cpa": number
    },
    "creativeRequirements": [{"type": string, "specs": string}],
    "duration": string,
    "discount": string,
    "bonuses": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 2000 });
  }

  private async partnershipPitch(prospect: any, data?: any): Promise<Record<string, any>> {
    const prompt = `Create a partnership pitch for CoinDaily:

Partner: ${JSON.stringify(prospect || {}, null, 2)}
Partnership type: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "partnershipPitch": {
    "title": string,
    "partner": string,
    "valueProposition": string,
    "synergies": [string],
    "partnershipModel": string,
    "benefits": {"forPartner": [string], "forCoinDaily": [string], "forUsers": [string]},
    "revenueModel": string,
    "implementationPlan": [{"phase": string, "actions": [string], "timeline": string}],
    "metrics": [{"kpi": string, "target": string}],
    "pitchDeck": [{"slide": string, "content": string}],
    "nextSteps": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 2000 });
  }

  private async handleObjection(objection: string, context?: any): Promise<Record<string, any>> {
    const prompt = `Handle this sales objection for CoinDaily services:

Objection: "${objection}"
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "objectionHandling": {
    "objection": "${objection}",
    "category": "price"|"timing"|"competition"|"need"|"authority"|"trust",
    "response": string,
    "evidencePoints": [string],
    "alternativeOffer": string,
    "followUpQuestion": string,
    "reframingTechnique": string,
    "confidenceLevel": number
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 1000 });
  }

  private async createFollowUpSequence(prospect: any, context?: any): Promise<Record<string, any>> {
    const prompt = `Create a follow-up email sequence:

Prospect: ${JSON.stringify(prospect || {}, null, 2)}
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "followUpSequence": {
    "prospect": string,
    "emails": [
      {"day": number, "subject": string, "body": string, "callToAction": string, "channel": "email"|"linkedin"|"twitter"}
    ],
    "triggers": [{"event": string, "action": string}],
    "totalEmails": number,
    "duration": string,
    "breakConditions": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 2000 });
  }

  private async calculateROI(data: any): Promise<Record<string, any>> {
    const prompt = `Calculate ROI for advertising on CoinDaily:

Campaign data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "roiCalculation": {
    "investment": number,
    "estimatedReturns": {"low": number, "medium": number, "high": number},
    "roi": {"low": string, "medium": string, "high": string},
    "metrics": {"impressions": number, "clicks": number, "conversions": number, "cpa": number},
    "comparisonWithIndustry": string,
    "breakEvenPoint": string,
    "recommendation": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1000 });
  }

  private async competitorAnalysis(data: any): Promise<Record<string, any>> {
    const prompt = `Analyze competitors in Africa crypto news space:

Context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "competitorAnalysis": {
    "competitors": [
      {"name": string, "strengths": [string], "weaknesses": [string], "audience": string, "pricing": string}
    ],
    "coinDailyAdvantages": [string],
    "differentiators": [string],
    "battleCards": [{"competitor": string, "talkingPoints": [string]}],
    "marketPosition": string,
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  private async scoreDeal(data: any): Promise<Record<string, any>> {
    const prompt = `Score this potential deal:

Deal: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "dealScore": {
    "score": number (1-100),
    "grade": "A"|"B"|"C"|"D"|"F",
    "probability": number,
    "value": number,
    "factors": [{"factor": string, "score": number, "weight": number}],
    "risks": [string],
    "nextBestAction": string,
    "estimatedCloseDate": string,
    "recommendation": "pursue"|"nurture"|"deprioritize"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1000 });
  }
}

export default SalesAgent;
