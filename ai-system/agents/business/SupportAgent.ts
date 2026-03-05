/**
 * Support Agent
 * AI-powered customer support with crypto-specific knowledge
 * 
 * Model: Llama 3.1 8B (conversational)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class SupportAgent extends BaseAgent {
  constructor() {
    super({
      id: 'support-agent',
      name: 'Support Agent',
      type: 'customer_support',
      category: 'business',
      description: 'AI customer support for CoinDaily platform users. Handles queries about subscriptions, account issues, crypto basics, platform features, and African market questions with 24/7 availability.',
      capabilities: [
        'ticket_response',
        'faq_answering',
        'account_support',
        'subscription_help',
        'crypto_education',
        'escalation_routing',
        'sentiment_detection',
        'multi_language_support',
        'knowledge_base_search',
        'feedback_collection',
      ],
      model: 'llama',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { supportType, query, userId, context, language } = task.input;

    switch (supportType) {
      case 'ticket':
        return this.handleTicket(query, userId, context);
      case 'faq':
        return this.answerFAQ(query, language);
      case 'account':
        return this.handleAccountIssue(query, userId, context);
      case 'subscription':
        return this.handleSubscription(query, userId, context);
      case 'crypto_education':
        return this.cryptoEducation(query, language);
      case 'escalation':
        return this.assessEscalation(query, userId, context);
      case 'feedback':
        return this.collectFeedback(task.input.feedback, userId);
      case 'bulk_respond':
        return this.bulkRespond(task.input.tickets);
      default:
        return this.handleTicket(query, userId, context);
    }
  }

  private async handleTicket(query: string, userId?: string, context?: any): Promise<Record<string, any>> {
    const prompt = `You are CoinDaily's support agent for Africa's premier crypto news platform.

User query: "${query}"
User ID: ${userId || 'anonymous'}
Context: ${JSON.stringify(context || {}, null, 2)}

Respond helpfully, accurately, and with African market awareness. Return JSON:
{
  "response": {
    "message": string (helpful, friendly response),
    "category": "account"|"subscription"|"technical"|"crypto"|"billing"|"feature"|"general",
    "confidence": number (0-1),
    "sentiment": "positive"|"neutral"|"negative"|"frustrated",
    "suggestedActions": [{"action": string, "description": string}],
    "relatedArticles": [{"title": string, "topic": string}],
    "followUp": string,
    "needsEscalation": boolean,
    "escalationReason": string,
    "tags": [string],
    "responseTime": "instant"|"quick"|"detailed"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 1500 });
  }

  private async answerFAQ(query: string, language?: string): Promise<Record<string, any>> {
    const prompt = `Answer this CoinDaily FAQ question:

Question: "${query}"
Language: ${language || 'English'}

Return JSON:
{
  "faq": {
    "question": "${query}",
    "answer": string (clear, concise),
    "category": string,
    "relatedQuestions": [string],
    "helpfulLinks": [{"title": string, "url": string}],
    "wasHelpful": null,
    "language": "${language || 'English'}"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 1000 });
  }

  private async handleAccountIssue(query: string, userId?: string, context?: any): Promise<Record<string, any>> {
    const prompt = `Handle account issue for CoinDaily user:

Issue: "${query}"
User: ${userId || 'unknown'}
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "accountSupport": {
    "issue": string,
    "diagnosis": string,
    "resolution": {
      "steps": [string],
      "automated": boolean,
      "requiresManual": boolean
    },
    "message": string,
    "securityCheck": boolean,
    "needsVerification": boolean,
    "estimatedResolution": string,
    "preventionTips": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1200 });
  }

  private async handleSubscription(query: string, userId?: string, context?: any): Promise<Record<string, any>> {
    const prompt = `Handle subscription query for CoinDaily (tiers: Free, Pro, Premium, Enterprise):

Query: "${query}"
User: ${userId || 'unknown'}
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "subscriptionSupport": {
    "issue": string,
    "currentPlan": string,
    "resolution": string,
    "message": string,
    "upsellOpportunity": boolean,
    "suggestedPlan": string,
    "planComparison": [{"feature": string, "free": string, "pro": string, "premium": string}],
    "billingInfo": string,
    "retentionOffer": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 1200 });
  }

  private async cryptoEducation(query: string, language?: string): Promise<Record<string, any>> {
    const prompt = `Explain this crypto concept for an African audience:

Question: "${query}"
Language: ${language || 'English'}

Use African market examples (Luno, Quidax, M-Pesa, etc). Return JSON:
{
  "education": {
    "topic": string,
    "explanation": string (clear, beginner-friendly),
    "africanContext": string,
    "examples": [{"example": string, "relevance": string}],
    "localExchanges": [string],
    "warnings": [string],
    "furtherReading": [string],
    "difficulty": "beginner"|"intermediate"|"advanced"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 1500 });
  }

  private async assessEscalation(query: string, userId?: string, context?: any): Promise<Record<string, any>> {
    const prompt = `Assess if this support ticket needs human escalation:

Query: "${query}"
User: ${userId || 'unknown'}
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "escalation": {
    "needsEscalation": boolean,
    "urgency": "low"|"medium"|"high"|"critical",
    "reason": string,
    "department": "technical"|"billing"|"security"|"management"|"legal",
    "suggestedAgent": string,
    "autoResponseBeforeEscalation": string,
    "estimatedWaitTime": string,
    "context": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.2, maxTokens: 800 });
  }

  private async collectFeedback(feedback: any, userId?: string): Promise<Record<string, any>> {
    const prompt = `Analyze user feedback for CoinDaily:

Feedback: ${JSON.stringify(feedback, null, 2)}
User: ${userId || 'anonymous'}

Return JSON:
{
  "feedbackAnalysis": {
    "sentiment": "positive"|"neutral"|"negative",
    "category": string,
    "keyPoints": [string],
    "actionItems": [{"item": string, "priority": string, "department": string}],
    "response": string,
    "npsEstimate": number (1-10),
    "retentionRisk": "low"|"medium"|"high"
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1000 });
  }

  private async bulkRespond(tickets: any[]): Promise<Record<string, any>> {
    const prompt = `Generate responses for these support tickets:

Tickets: ${JSON.stringify(tickets || [], null, 2)}

Return JSON:
{
  "bulkResponses": [
    {
      "ticketId": string,
      "response": string,
      "category": string,
      "priority": string,
      "needsEscalation": boolean
    }
  ],
  "summary": {"total": number, "autoResolved": number, "needsEscalation": number}
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 3000 });
  }
}

export default SupportAgent;
