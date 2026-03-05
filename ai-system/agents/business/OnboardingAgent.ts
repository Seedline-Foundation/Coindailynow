/**
 * Onboarding Agent
 * Automated user onboarding, education, and activation
 * 
 * Model: Llama 3.1 8B (conversational)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class OnboardingAgent extends BaseAgent {
  constructor() {
    super({
      id: 'onboarding-agent',
      name: 'Onboarding Agent',
      type: 'onboarding',
      category: 'business',
      description: 'Guides new CoinDaily users through personalized onboarding flows, crypto education, feature discovery, and activation milestones tailored to African market users.',
      capabilities: [
        'welcome_flow',
        'personalized_tour',
        'crypto_education',
        'feature_discovery',
        'activation_tracking',
        'milestone_rewards',
        'preference_setup',
        'language_detection',
        'interest_profiling',
        're_engagement',
      ],
      model: 'llama',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { action, userId, userData, context } = task.input;

    switch (action) {
      case 'welcome':
        return this.createWelcomeFlow(userData);
      case 'tour':
        return this.generateTour(userData, context);
      case 'education':
        return this.createEducationPath(userData);
      case 'activation':
        return this.trackActivation(userId, userData);
      case 'milestones':
        return this.defineMilestones(userData);
      case 'preferences':
        return this.setupPreferences(userData);
      case 're_engage':
        return this.reEngageUser(userId, userData);
      case 'progress':
        return this.getProgress(userId, userData);
      default:
        return this.createWelcomeFlow(userData);
    }
  }

  private async createWelcomeFlow(userData: any): Promise<Record<string, any>> {
    const prompt = `Create a personalized welcome flow for a new CoinDaily user:

User: ${JSON.stringify(userData || {}, null, 2)}

CoinDaily is Africa's premier crypto news platform. Return JSON:
{
  "welcomeFlow": {
    "greeting": string (personalized, warm, African-aware),
    "steps": [
      {
        "order": number,
        "title": string,
        "description": string,
        "action": string,
        "component": string,
        "estimatedTime": string,
        "required": boolean,
        "reward": string
      }
    ],
    "personalizations": {
      "language": string,
      "country": string,
      "experience": "beginner"|"intermediate"|"advanced",
      "interests": [string],
      "suggestedContent": [{"title": string, "type": string, "reason": string}]
    },
    "quickWins": [{"action": string, "benefit": string, "reward": string}],
    "estimatedCompletionTime": string,
    "skipOption": boolean,
    "emailSequence": [
      {"day": number, "subject": string, "content": string, "cta": string}
    ]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 2000 });
  }

  private async generateTour(userData: any, context?: any): Promise<Record<string, any>> {
    const prompt = `Generate a personalized feature tour:

User: ${JSON.stringify(userData || {}, null, 2)}
Context: ${JSON.stringify(context || {}, null, 2)}

Return JSON:
{
  "tour": {
    "type": "full"|"focused"|"quick",
    "steps": [
      {
        "order": number,
        "element": string,
        "title": string,
        "description": string,
        "highlight": string,
        "tip": string,
        "position": "top"|"bottom"|"left"|"right"
      }
    ],
    "duration": string,
    "highlights": [string],
    "proFeatures": [{"feature": string, "benefit": string, "upgradePrompt": string}]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 1500 });
  }

  private async createEducationPath(userData: any): Promise<Record<string, any>> {
    const prompt = `Create a personalized crypto education path for an African user:

User: ${JSON.stringify(userData || {}, null, 2)}

Return JSON:
{
  "educationPath": {
    "level": "beginner"|"intermediate"|"advanced",
    "modules": [
      {
        "order": number,
        "title": string,
        "topics": [string],
        "estimatedTime": string,
        "format": "article"|"video"|"quiz"|"interactive",
        "africanContext": string,
        "reward": string,
        "quiz": [{"question": string, "options": [string], "correct": number}]
      }
    ],
    "africanFocus": {
      "localExchanges": [string],
      "mobileMoneyGuides": [string],
      "regulatoryInfo": [string],
      "localCommunities": [string]
    },
    "milestones": [{"name": string, "requirement": string, "reward": string, "badge": string}],
    "estimatedCompletion": string,
    "certificateAvailable": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 2500 });
  }

  private async trackActivation(userId: string, userData: any): Promise<Record<string, any>> {
    const prompt = `Analyze user activation status and suggest next actions:

User ID: ${userId}
User data: ${JSON.stringify(userData || {}, null, 2)}

Return JSON:
{
  "activation": {
    "userId": "${userId}",
    "status": "new"|"onboarding"|"activated"|"power_user"|"at_risk",
    "completedActions": [string],
    "pendingActions": [{"action": string, "priority": string, "benefit": string}],
    "activationScore": number (0-100),
    "timeToActivation": string,
    "blockers": [string],
    "nudges": [{"message": string, "channel": string, "timing": string}],
    "recommendedContent": [{"title": string, "reason": string}],
    "upgradeReadiness": number (0-100),
    "nextMilestone": {"name": string, "progress": number, "remaining": string}
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1500 });
  }

  private async defineMilestones(userData: any): Promise<Record<string, any>> {
    const prompt = `Define personalized milestones for user engagement:

User: ${JSON.stringify(userData || {}, null, 2)}

Return JSON:
{
  "milestones": {
    "path": [
      {
        "id": string,
        "name": string,
        "description": string,
        "requirements": [{"action": string, "count": number}],
        "reward": {"type": "badge"|"xp"|"feature"|"discount", "value": string},
        "order": number,
        "difficulty": "easy"|"medium"|"hard"
      }
    ],
    "streaks": [{"name": string, "requirement": string, "rewards": [string]}],
    "achievements": [{"name": string, "criteria": string, "badge": string, "rarity": string}],
    "gamification": {"xpSystem": boolean, "leaderboard": boolean, "levels": [{"level": number, "xp": number, "perks": [string]}]}
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 2000 });
  }

  private async setupPreferences(userData: any): Promise<Record<string, any>> {
    const prompt = `Generate smart preference suggestions for a new user:

User: ${JSON.stringify(userData || {}, null, 2)}

Return JSON:
{
  "preferences": {
    "suggested": {
      "language": string,
      "country": string,
      "timezone": string,
      "topics": [{"topic": string, "confidence": number}],
      "exchanges": [string],
      "notificationFrequency": "realtime"|"hourly"|"daily"|"weekly",
      "contentTypes": [string],
      "difficulty": "beginner"|"intermediate"|"advanced"
    },
    "questions": [
      {"question": string, "options": [string], "multiSelect": boolean, "required": boolean}
    ],
    "aiRecommendations": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 1200 });
  }

  private async reEngageUser(userId: string, userData: any): Promise<Record<string, any>> {
    const prompt = `Create a re-engagement strategy for an inactive user:

User ID: ${userId}
Data: ${JSON.stringify(userData || {}, null, 2)}

Return JSON:
{
  "reEngagement": {
    "userId": "${userId}",
    "inactiveDays": number,
    "riskLevel": "low"|"medium"|"high"|"critical",
    "strategy": string,
    "messages": [
      {"channel": "email"|"push"|"in_app", "timing": string, "subject": string, "content": string, "incentive": string}
    ],
    "personalization": [string],
    "whatChanged": [string],
    "winBackOffer": string,
    "successProbability": number
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 1500 });
  }

  private async getProgress(userId: string, userData: any): Promise<Record<string, any>> {
    const prompt = `Generate an onboarding progress report:

User ID: ${userId}
Data: ${JSON.stringify(userData || {}, null, 2)}

Return JSON:
{
  "progress": {
    "userId": "${userId}",
    "overallProgress": number (0-100),
    "stage": "welcome"|"exploring"|"learning"|"active"|"power_user",
    "completedSteps": [string],
    "remainingSteps": [{"step": string, "priority": string, "benefit": string}],
    "daysOnPlatform": number,
    "engagementScore": number,
    "achievements": [string],
    "recommendations": [string],
    "nextAction": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.3, maxTokens: 1000 });
  }
}

export default OnboardingAgent;
