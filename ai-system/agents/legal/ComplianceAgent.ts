/**
 * Compliance Agent
 * Regulatory compliance monitoring, policy enforcement, and audit support
 * 
 * Model: DeepSeek R1 8B (analytical/reasoning)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super({
      id: 'compliance-agent',
      name: 'Compliance Agent',
      type: 'compliance',
      category: 'legal',
      description: 'Monitors regulatory compliance for crypto content, enforces content policies, tracks African regulatory changes, ensures GDPR/data protection compliance, and supports audit processes for CoinDaily platform.',
      capabilities: [
        'regulatory_monitoring',
        'content_compliance',
        'data_protection',
        'policy_enforcement',
        'audit_support',
        'risk_assessment',
        'african_regulation',
        'reporting',
        'training_material',
        'incident_response',
      ],
      model: 'deepseek',
      timeoutMs: 90000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { action, data, content, country } = task.input;

    switch (action) {
      case 'check_content':
        return this.checkContentCompliance(content);
      case 'regulatory_update':
        return this.regulatoryUpdate(country, data);
      case 'data_protection':
        return this.dataProtectionCheck(data);
      case 'policy_review':
        return this.policyReview(data);
      case 'audit':
        return this.auditSupport(data);
      case 'risk_assessment':
        return this.complianceRiskAssessment(data);
      case 'african_regs':
        return this.africanRegulations(country, data);
      case 'report':
        return this.complianceReport(data);
      case 'training':
        return this.createTrainingMaterial(data);
      case 'incident':
        return this.handleIncident(data);
      default:
        return this.checkContentCompliance(content || data);
    }
  }

  private async checkContentCompliance(content: any): Promise<Record<string, any>> {
    const prompt = `Check this crypto content for regulatory compliance:

Content: ${JSON.stringify(content || {}, null, 2)}

Check for: financial advice disclaimers, unregistered token promotion, misleading claims, FOMO language, guaranteed returns, African regulatory compliance.

Return JSON:
{
  "complianceCheck": {
    "status": "compliant"|"needs_changes"|"non_compliant"|"blocked",
    "score": number (0-100),
    "issues": [
      {
        "severity": "critical"|"high"|"medium"|"low",
        "type": "financial_advice"|"misleading"|"unregistered_token"|"fomo"|"guaranteed_returns"|"missing_disclaimer"|"regulatory",
        "description": string,
        "location": string,
        "fix": string,
        "regulation": string
      }
    ],
    "requiredDisclaimers": [string],
    "suggestedChanges": [{"original": string, "suggested": string, "reason": string}],
    "blockedTokens": [{"token": string, "reason": string}],
    "countryRestrictions": [{"country": string, "issue": string}],
    "approvalStatus": "auto_approved"|"needs_review"|"rejected",
    "reviewerNotes": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2000 });
  }

  private async regulatoryUpdate(country?: string, data?: any): Promise<Record<string, any>> {
    const prompt = `Provide regulatory update for crypto in ${country || 'Africa'}:

Context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "regulatoryUpdate": {
    "region": "${country || 'Africa'}",
    "date": "${new Date().toISOString().split('T')[0]}",
    "updates": [
      {
        "country": string,
        "change": string,
        "effectiveDate": string,
        "impact": "positive"|"negative"|"neutral",
        "impactDescription": string,
        "affectedEntities": [string],
        "requiredActions": [string],
        "deadline": string
      }
    ],
    "upcomingChanges": [{"country": string, "expected": string, "description": string}],
    "riskAlerts": [{"alert": string, "countries": [string], "severity": string}],
    "opportunities": [string],
    "coinDailyImpact": [string],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2500 });
  }

  private async dataProtectionCheck(data: any): Promise<Record<string, any>> {
    const prompt = `Check data protection compliance:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "dataProtection": {
    "framework": "GDPR"|"POPIA"|"NDPA"|"multiple",
    "status": "compliant"|"partially_compliant"|"non_compliant",
    "score": number (0-100),
    "checks": [
      {
        "requirement": string,
        "status": "pass"|"fail"|"partial",
        "regulation": string,
        "details": string,
        "remediation": string,
        "deadline": string
      }
    ],
    "dataMapping": {"personalData": [string], "sensitiveData": [string], "retention": string},
    "consentManagement": {"adequate": boolean, "issues": [string]},
    "crossBorderTransfers": {"present": boolean, "compliant": boolean, "issues": [string]},
    "africaSpecific": [
      {"country": string, "law": string, "status": string, "requirements": [string]}
    ],
    "recommendations": [string],
    "priorityActions": [{"action": string, "deadline": string, "severity": string}]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2500 });
  }

  private async policyReview(data: any): Promise<Record<string, any>> {
    const prompt = `Review and update platform policies:

Current policies: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "policyReview": {
    "policiesReviewed": [
      {
        "name": string,
        "status": "current"|"needs_update"|"missing",
        "lastUpdated": string,
        "issues": [string],
        "suggestedUpdates": [string],
        "priority": "high"|"medium"|"low"
      }
    ],
    "missingPolicies": [{"name": string, "reason": string, "template": string}],
    "regulatoryAlignment": {"score": number, "gaps": [string]},
    "recommendations": [string],
    "nextReviewDate": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async auditSupport(data: any): Promise<Record<string, any>> {
    const prompt = `Support compliance audit:

Audit scope: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "auditSupport": {
    "scope": string,
    "checklist": [
      {"item": string, "category": string, "status": "pass"|"fail"|"na"|"pending", "evidence": string, "notes": string}
    ],
    "findings": [
      {"finding": string, "severity": string, "recommendation": string, "deadline": string}
    ],
    "riskAreas": [string],
    "documentation": [{"document": string, "status": string, "location": string}],
    "overallAssessment": string,
    "score": number (0-100),
    "nextAuditDate": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2000 });
  }

  private async complianceRiskAssessment(data: any): Promise<Record<string, any>> {
    const prompt = `Assess compliance risks:

Context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "riskAssessment": {
    "overallRisk": "low"|"medium"|"high"|"critical",
    "risks": [
      {
        "category": string,
        "risk": string,
        "likelihood": "low"|"medium"|"high",
        "impact": "low"|"medium"|"high",
        "score": number,
        "mitigation": string,
        "owner": string,
        "deadline": string
      }
    ],
    "topRisks": [string],
    "africanSpecific": [{"country": string, "risk": string, "mitigation": string}],
    "actionPlan": [{"action": string, "priority": number, "resources": string}],
    "monitoring": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 2000 });
  }

  private async africanRegulations(country?: string, data?: any): Promise<Record<string, any>> {
    const prompt = `Provide African crypto regulatory overview:

Country focus: ${country || 'All major African markets'}
Context: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "africanRegulations": {
    "countries": [
      {
        "name": string,
        "cryptoStatus": "legal"|"restricted"|"gray_area"|"banned",
        "regulatoryBody": string,
        "keyLaws": [string],
        "taxTreatment": string,
        "exchangeLicensing": string,
        "contentRestrictions": [string],
        "recentChanges": [string],
        "outlook": "positive"|"neutral"|"negative",
        "coinDailyCompliance": [string]
      }
    ],
    "panAfricanInitiatives": [string],
    "trends": [string],
    "bestPractices": [string],
    "warnings": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 3000 });
  }

  private async complianceReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate compliance status report:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "complianceReport": {
    "period": string,
    "overallStatus": "compliant"|"mostly_compliant"|"non_compliant",
    "score": number (0-100),
    "areas": [
      {"area": string, "status": string, "score": number, "issues": number, "resolved": number}
    ],
    "incidents": [{"date": string, "type": string, "severity": string, "status": string}],
    "improvements": [string],
    "openIssues": [{"issue": string, "severity": string, "deadline": string}],
    "metrics": {"contentReviewed": number, "flagged": number, "blocked": number},
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async createTrainingMaterial(data: any): Promise<Record<string, any>> {
    const prompt = `Create compliance training material:

Topic: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "training": {
    "title": string,
    "audience": string,
    "modules": [
      {
        "title": string,
        "content": string,
        "keyPoints": [string],
        "examples": [string],
        "quiz": [{"question": string, "options": [string], "correct": number}]
      }
    ],
    "duration": string,
    "assessment": {"passingScore": number, "questions": number},
    "certification": boolean,
    "nextRefresh": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2500 });
  }

  private async handleIncident(data: any): Promise<Record<string, any>> {
    const prompt = `Handle compliance incident:

Incident: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "incidentResponse": {
    "severity": "low"|"medium"|"high"|"critical",
    "type": string,
    "description": string,
    "immediateActions": [string],
    "investigation": [{"step": string, "assigned": string, "deadline": string}],
    "containment": string,
    "notification": {"required": boolean, "authorities": [string], "deadline": string},
    "remediation": [string],
    "prevention": [string],
    "timeline": string,
    "reportRequired": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 1500 });
  }
}

export default ComplianceAgent;
