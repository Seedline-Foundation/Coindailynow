/**
 * Contract Agent
 * Automated contract drafting, review, and management
 * 
 * Model: DeepSeek R1 8B (analytical/reasoning)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class ContractAgent extends BaseAgent {
  constructor() {
    super({
      id: 'contract-agent',
      name: 'Contract Agent',
      type: 'contract',
      category: 'legal',
      description: 'Drafts, reviews, and manages contracts including advertising agreements, partnership deals, subscription terms, contributor agreements, and vendor contracts for CoinDaily platform.',
      capabilities: [
        'contract_drafting',
        'contract_review',
        'terms_generation',
        'risk_analysis',
        'clause_suggestion',
        'negotiation_support',
        'renewal_management',
        'template_creation',
        'amendment_drafting',
        'compliance_check',
      ],
      model: 'deepseek',
      timeoutMs: 120000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { action, data, contractType, contract } = task.input;

    switch (action) {
      case 'draft':
        return this.draftContract(contractType, data);
      case 'review':
        return this.reviewContract(contract);
      case 'terms':
        return this.generateTerms(data);
      case 'risk':
        return this.riskAnalysis(contract);
      case 'clause':
        return this.suggestClauses(data);
      case 'negotiate':
        return this.negotiationSupport(data);
      case 'renewal':
        return this.manageRenewal(data);
      case 'template':
        return this.createTemplate(contractType, data);
      case 'amend':
        return this.draftAmendment(data);
      default:
        return this.draftContract(contractType, data);
    }
  }

  private async draftContract(contractType: string, data: any): Promise<Record<string, any>> {
    const prompt = `Draft a ${contractType || 'advertising'} contract for CoinDaily:

Details: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "contract": {
    "title": string,
    "type": "${contractType || 'advertising'}",
    "parties": [{"role": string, "name": string, "details": string}],
    "effectiveDate": string,
    "termLength": string,
    "sections": [
      {
        "number": string,
        "title": string,
        "content": string,
        "clauses": [{"number": string, "text": string}]
      }
    ],
    "keyTerms": {
      "scope": string,
      "compensation": string,
      "payment": string,
      "termination": string,
      "confidentiality": string,
      "ip": string,
      "liability": string,
      "indemnification": string,
      "disputeResolution": string,
      "governingLaw": string
    },
    "africanConsiderations": [string],
    "cryptoSpecific": [string],
    "signatures": [{"party": string, "date": string}],
    "notes": [string],
    "disclaimer": "This is an AI-generated draft. Legal review recommended."
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 4000 });
  }

  private async reviewContract(contract: any): Promise<Record<string, any>> {
    const prompt = `Review this contract for CoinDaily:

Contract: ${JSON.stringify(contract || {}, null, 2)}

Return JSON:
{
  "contractReview": {
    "overallScore": number (0-100),
    "riskLevel": "low"|"medium"|"high"|"very_high",
    "summary": string,
    "issues": [
      {
        "severity": "critical"|"high"|"medium"|"low",
        "section": string,
        "issue": string,
        "risk": string,
        "recommendation": string,
        "suggestedLanguage": string
      }
    ],
    "missingClauses": [{"clause": string, "importance": string, "suggestedText": string}],
    "favorability": {"forCoinDaily": number, "forCounterparty": number},
    "cryptoCompliance": {"compliant": boolean, "issues": [string]},
    "africanLegalConsiderations": [{"country": string, "consideration": string}],
    "negotiationPoints": [{"point": string, "priority": string, "approach": string}],
    "recommendations": [string],
    "approvalRecommendation": "approve"|"approve_with_changes"|"renegotiate"|"reject"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2500 });
  }

  private async generateTerms(data: any): Promise<Record<string, any>> {
    const prompt = `Generate Terms of Service / legal terms for CoinDaily:

Type: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "terms": {
    "title": string,
    "lastUpdated": "${new Date().toISOString().split('T')[0]}",
    "sections": [
      {"title": string, "content": string, "subsections": [{"title": string, "content": string}]}
    ],
    "cryptoDisclaimer": string,
    "africanJurisdictions": [{"country": string, "specificTerms": string}],
    "dataPrivacy": string,
    "intellectualProperty": string,
    "userResponsibilities": [string],
    "limitationOfLiability": string,
    "disputeResolution": string,
    "changes": string,
    "contact": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 4000 });
  }

  private async riskAnalysis(contract: any): Promise<Record<string, any>> {
    const prompt = `Analyze contract risks:

Contract: ${JSON.stringify(contract || {}, null, 2)}

Return JSON:
{
  "riskAnalysis": {
    "overallRisk": "very_low"|"low"|"medium"|"high"|"very_high",
    "riskScore": number (0-100),
    "risks": [
      {
        "category": "financial"|"legal"|"operational"|"reputational"|"regulatory",
        "risk": string,
        "likelihood": "low"|"medium"|"high",
        "impact": "low"|"medium"|"high",
        "score": number,
        "mitigation": string,
        "clause": string
      }
    ],
    "financialExposure": {"max": string, "likely": string},
    "termination": {"ease": string, "costs": string, "notice": string},
    "africanRisks": [{"risk": string, "countries": [string], "mitigation": string}],
    "cryptoRisks": [string],
    "recommendations": [string],
    "acceptableRisk": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2000 });
  }

  private async suggestClauses(data: any): Promise<Record<string, any>> {
    const prompt = `Suggest contract clauses:

Context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "clauseSuggestions": [
    {
      "title": string,
      "purpose": string,
      "text": string,
      "priority": "essential"|"recommended"|"optional",
      "protects": string,
      "notes": string
    }
  ],
  "cryptoSpecific": [{"clause": string, "reason": string}],
  "africanSpecific": [{"clause": string, "countries": [string], "reason": string}],
  "recommendations": [string]
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async negotiationSupport(data: any): Promise<Record<string, any>> {
    const prompt = `Provide negotiation support:

Negotiation context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "negotiation": {
    "position": string,
    "priorities": [{"item": string, "importance": string, "flexibility": string}],
    "redLines": [string],
    "concessions": [{"concession": string, "inExchangeFor": string}],
    "counterProposals": [{"theirAsk": string, "ourCounter": string, "rationale": string}],
    "walkAway": string,
    "bestAlternative": string,
    "tactics": [string],
    "scripts": [{"scenario": string, "response": string}],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 2000 });
  }

  private async manageRenewal(data: any): Promise<Record<string, any>> {
    const prompt = `Manage contract renewal:

Contract: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "renewal": {
    "contract": string,
    "expiryDate": string,
    "recommendation": "renew"|"renegotiate"|"terminate"|"modify",
    "reasonsToRenew": [string],
    "reasonsToChange": [string],
    "suggestedChanges": [{"clause": string, "change": string, "reason": string}],
    "newTerms": {"duration": string, "pricing": string, "additions": [string]},
    "timeline": [{"date": string, "action": string}],
    "risks": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1500 });
  }

  private async createTemplate(contractType: string, data: any): Promise<Record<string, any>> {
    const prompt = `Create a reusable contract template:

Type: ${contractType || 'general'}
Requirements: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "template": {
    "name": string,
    "type": "${contractType || 'general'}",
    "version": "1.0",
    "placeholders": [{"field": string, "description": string, "required": boolean}],
    "sections": [
      {"title": string, "content": string, "customizable": boolean}
    ],
    "optionalAddendums": [{"name": string, "content": string, "useCase": string}],
    "instructions": [string],
    "legalReviewRequired": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 3000 });
  }

  private async draftAmendment(data: any): Promise<Record<string, any>> {
    const prompt = `Draft a contract amendment:

Amendment details: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "amendment": {
    "title": string,
    "originalContract": string,
    "amendmentNumber": number,
    "effectiveDate": string,
    "changes": [
      {"section": string, "originalText": string, "newText": string, "reason": string}
    ],
    "additions": [{"title": string, "content": string}],
    "deletions": [{"section": string, "reason": string}],
    "allOtherTerms": "remain unchanged",
    "signatures": [{"party": string}],
    "notes": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }
}

export default ContractAgent;
