/**
 * Billing Agent
 * Automated billing, invoice generation, payment processing, and revenue analytics
 * 
 * Model: DeepSeek R1 8B (analytical/precise)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class BillingAgent extends BaseAgent {
  constructor() {
    super({
      id: 'billing-agent',
      name: 'Billing Agent',
      type: 'billing',
      category: 'finance',
      description: 'Manages billing operations including invoice generation, payment reminders, subscription management, revenue analytics, and financial reporting for CoinDaily platform.',
      capabilities: [
        'invoice_generation',
        'payment_reminder',
        'subscription_management',
        'revenue_analytics',
        'dunning_management',
        'refund_processing',
        'financial_report',
        'tax_calculation',
        'currency_conversion',
        'billing_dispute',
      ],
      model: 'deepseek',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { action, data, customerId, invoiceId } = task.input;

    switch (action) {
      case 'generate_invoice':
        return this.generateInvoice(data, customerId);
      case 'payment_reminder':
        return this.paymentReminder(data, customerId);
      case 'subscription':
        return this.manageSubscription(data, customerId);
      case 'revenue_report':
        return this.revenueReport(data);
      case 'dunning':
        return this.dunningProcess(data, customerId);
      case 'refund':
        return this.processRefund(data, invoiceId);
      case 'financial_report':
        return this.financialReport(data);
      case 'tax':
        return this.taxCalculation(data);
      case 'dispute':
        return this.handleDispute(data, customerId);
      default:
        return this.generateInvoice(data, customerId);
    }
  }

  private async generateInvoice(data: any, customerId?: string): Promise<Record<string, any>> {
    const prompt = `Generate a professional invoice for CoinDaily services:

Customer: ${customerId || 'unknown'}
Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "invoice": {
    "invoiceNumber": string,
    "date": "${new Date().toISOString().split('T')[0]}",
    "dueDate": string,
    "customer": {"id": string, "name": string, "email": string, "country": string},
    "items": [
      {"description": string, "quantity": number, "unitPrice": number, "total": number, "currency": "USD"}
    ],
    "subtotal": number,
    "tax": {"rate": number, "amount": number, "type": string},
    "discount": {"type": string, "amount": number},
    "total": number,
    "currency": "USD",
    "localCurrency": {"currency": string, "amount": number, "rate": number},
    "paymentMethods": [{"method": string, "details": string}],
    "notes": string,
    "terms": string,
    "status": "draft"|"sent"|"paid"|"overdue"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 1500 });
  }

  private async paymentReminder(data: any, customerId?: string): Promise<Record<string, any>> {
    const prompt = `Generate a payment reminder for overdue invoice:

Customer: ${customerId || 'unknown'}
Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "reminder": {
    "customerId": "${customerId || 'unknown'}",
    "invoiceNumber": string,
    "amount": number,
    "daysOverdue": number,
    "reminderLevel": 1 | 2 | 3 | 4,
    "subject": string,
    "body": string,
    "tone": "friendly"|"firm"|"urgent"|"final",
    "paymentLink": string,
    "alternativePayments": [{"method": string, "instructions": string}],
    "escalation": boolean,
    "nextAction": string,
    "nextReminderDate": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1000 });
  }

  private async manageSubscription(data: any, customerId?: string): Promise<Record<string, any>> {
    const prompt = `Manage subscription for CoinDaily user:

Customer: ${customerId || 'unknown'}
Action: ${JSON.stringify(data || {}, null, 2)}

CoinDaily tiers: Free, Pro ($9.99/mo), Premium ($24.99/mo), Enterprise (custom).

Return JSON:
{
  "subscription": {
    "customerId": "${customerId || 'unknown'}",
    "currentPlan": string,
    "action": "upgrade"|"downgrade"|"cancel"|"renew"|"pause"|"modify",
    "newPlan": string,
    "pricing": {"monthly": number, "annual": number, "savings": string},
    "prorationAmount": number,
    "effectiveDate": string,
    "features": {"added": [string], "removed": [string]},
    "confirmationMessage": string,
    "retentionOffer": string,
    "cancellationSurvey": [string],
    "nextBillingDate": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1200 });
  }

  private async revenueReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a revenue analytics report:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "revenueReport": {
    "period": string,
    "metrics": {
      "mrr": number,
      "arr": number,
      "mrrGrowth": string,
      "netRevenue": number,
      "churnRevenue": number,
      "expansionRevenue": number,
      "newRevenue": number,
      "arpu": number,
      "ltv": number,
      "cac": number,
      "ltvCacRatio": number
    },
    "byPlan": [{"plan": string, "subscribers": number, "revenue": number, "growth": string}],
    "byRegion": [{"region": string, "revenue": number, "growth": string}],
    "trends": [string],
    "forecast": {"nextMonth": number, "nextQuarter": number, "yearEnd": number},
    "insights": [string],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async dunningProcess(data: any, customerId?: string): Promise<Record<string, any>> {
    const prompt = `Manage dunning process for failed payment:

Customer: ${customerId || 'unknown'}
Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "dunning": {
    "customerId": "${customerId || 'unknown'}",
    "failedAttempts": number,
    "amount": number,
    "nextRetry": string,
    "retrySchedule": [{"attempt": number, "date": string, "action": string}],
    "communications": [{"day": number, "channel": string, "message": string}],
    "gracePeriod": string,
    "serviceRestriction": string,
    "finalAction": string,
    "recoveryProbability": number,
    "alternativePayments": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1200 });
  }

  private async processRefund(data: any, invoiceId?: string): Promise<Record<string, any>> {
    const prompt = `Process refund request:

Invoice: ${invoiceId || 'unknown'}
Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "refund": {
    "invoiceId": "${invoiceId || 'unknown'}",
    "eligible": boolean,
    "reason": string,
    "amount": {"full": number, "prorated": number, "recommended": number},
    "type": "full"|"partial"|"credit"|"denied",
    "policy": string,
    "processingTime": string,
    "method": string,
    "customerMessage": string,
    "internalNotes": string,
    "retentionOffer": string,
    "approval": "auto"|"manual"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1000 });
  }

  private async financialReport(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a financial summary report:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "financialReport": {
    "period": string,
    "revenue": {"total": number, "subscriptions": number, "advertising": number, "other": number},
    "expenses": {"total": number, "infrastructure": number, "ai": number, "personnel": number, "marketing": number},
    "profit": {"gross": number, "net": number, "margin": string},
    "cashFlow": {"inflow": number, "outflow": number, "net": number},
    "kpis": {"mrr": number, "growthRate": string, "burnRate": number, "runway": string},
    "africanRevenue": [{"country": string, "revenue": number, "growth": string}],
    "highlights": [string],
    "concerns": [string],
    "recommendations": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 2000 });
  }

  private async taxCalculation(data: any): Promise<Record<string, any>> {
    const prompt = `Calculate tax obligations:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "taxCalculation": {
    "jurisdiction": string,
    "taxableAmount": number,
    "taxRate": number,
    "taxAmount": number,
    "type": "VAT"|"sales_tax"|"withholding"|"exempt",
    "africanTaxRates": [{"country": string, "rate": number, "type": string, "notes": string}],
    "exemptions": [string],
    "filingDeadline": string,
    "recommendations": [string],
    "disclaimer": "Consult a tax professional for specific advice."
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.1, maxTokens: 1000 });
  }

  private async handleDispute(data: any, customerId?: string): Promise<Record<string, any>> {
    const prompt = `Handle billing dispute:

Customer: ${customerId || 'unknown'}
Dispute: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "dispute": {
    "customerId": "${customerId || 'unknown'}",
    "category": string,
    "validClaim": boolean,
    "resolution": string,
    "customerMessage": string,
    "action": "refund"|"credit"|"adjustment"|"deny"|"escalate",
    "amount": number,
    "evidence": [string],
    "timeline": string,
    "preventionMeasure": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 1000 });
  }
}

export default BillingAgent;
