/**
 * SocialMedia Agent
 * Auto-post, engage, and grow social presence across platforms
 * 
 * Model: Llama 3.1 8B (content generation)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class SocialMediaAgent extends BaseAgent {
  constructor() {
    super({
      id: 'social-media-agent',
      name: 'SocialMedia Agent',
      type: 'social_media',
      category: 'content',
      description: 'Autonomous social media management — generates posts, plans engagement strategies, grows community presence across Twitter/X, Telegram, Discord, and African platforms. Zero social media managers needed.',
      capabilities: [
        'post_generation',
        'thread_creation',
        'engagement_strategy',
        'community_management',
        'hashtag_optimization',
        'content_repurposing',
        'audience_analysis',
        'scheduling',
        'trend_hijacking',
        'african_community_growth',
      ],
      model: 'llama',
      timeoutMs: 60000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { taskType, platform, content, audience, campaign } = task.input;

    switch (taskType) {
      case 'generate_post':
        return this.generatePost(platform, content);
      case 'generate_thread':
        return this.generateThread(content, platform);
      case 'engagement_plan':
        return this.createEngagementPlan(audience);
      case 'repurpose':
        return this.repurposeContent(content, platform);
      case 'schedule':
        return this.createSchedule(content);
      case 'campaign':
        return this.planCampaign(campaign);
      case 'community_response':
        return this.generateResponse(content);
      case 'analytics_review':
        return this.reviewAnalytics(task.input.data);
      default:
        return this.generatePost(platform || 'twitter', content);
    }
  }

  private async generatePost(platform: string, content: any): Promise<Record<string, any>> {
    const charLimits: Record<string, number> = { twitter: 280, telegram: 4096, discord: 2000, linkedin: 3000 };
    const limit = charLimits[platform] || 280;

    const prompt = `Generate an engaging ${platform} post for CoinDaily (Africa's crypto news platform):

Content/topic: ${JSON.stringify(content || {}, null, 2)}
Character limit: ${limit}

Return JSON:
{
  "post": {
    "text": string (within limit),
    "platform": "${platform}",
    "charCount": number,
    "hashtags": [string],
    "mentions": [string],
    "mediaType": "none"|"image"|"video"|"poll",
    "mediaSuggestion": string,
    "callToAction": string,
    "emoji": boolean
  },
  "variations": [
    {"text": string, "tone": "professional"|"casual"|"urgent"|"educational", "charCount": number}
  ],
  "bestPostingTime": {"utc": string, "reason": string},
  "expectedEngagement": "high"|"medium"|"low",
  "targetAudience": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.7, maxTokens: 2000 });
  }

  private async generateThread(content: any, platform?: string): Promise<Record<string, any>> {
    const prompt = `Create an engaging Twitter/X thread for CoinDaily:

Topic: ${JSON.stringify(content || {}, null, 2)}

Return JSON:
{
  "thread": {
    "hook": string (tweet 1 - attention-grabbing, max 280 chars),
    "tweets": [
      {"number": number, "text": string, "hasMedia": boolean, "mediaSuggestion": string}
    ],
    "closer": string (final tweet with CTA),
    "totalTweets": number,
    "hashtags": [string],
    "estimatedReach": string
  },
  "alternativeHooks": [string],
  "africanAngle": string,
  "bestTimeToPost": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.7, maxTokens: 3000 });
  }

  private async createEngagementPlan(audience: any): Promise<Record<string, any>> {
    const prompt = `Create a social media engagement plan for CoinDaily targeting African crypto enthusiasts:

Audience data: ${JSON.stringify(audience || {}, null, 2)}

Return JSON:
{
  "plan": {
    "duration": "1 week",
    "platforms": {
      "twitter": {
        "postsPerDay": number,
        "contentMix": {"news": number, "education": number, "engagement": number, "memes": number},
        "bestTimes": [string],
        "hashtags": [string],
        "engagementTactics": [string]
      },
      "telegram": {
        "postsPerDay": number,
        "groupEngagement": [string],
        "contentTypes": [string]
      },
      "discord": {
        "activities": [string],
        "communityEvents": [string]
      }
    },
    "africanFocus": {
      "targetCountries": [string],
      "localHashtags": [string],
      "communityPartners": [string],
      "culturalConsiderations": [string]
    },
    "contentCalendar": [
      {"day": string, "platform": string, "content": string, "type": string, "time": string}
    ],
    "kpis": [{"metric": string, "target": number, "current": number}],
    "growthTarget": {"followers": number, "engagement": number}
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 3000 });
  }

  private async repurposeContent(content: any, targetPlatform?: string): Promise<Record<string, any>> {
    const prompt = `Repurpose this content for multiple social platforms:

Original content: ${JSON.stringify(content || {}, null, 2)}
Primary target: ${targetPlatform || 'all'}

Return JSON:
{
  "repurposed": {
    "twitter": {"text": string, "thread": boolean},
    "telegram": {"text": string, "format": "message"|"article"},
    "discord": {"text": string, "channel": string},
    "linkedin": {"text": string},
    "instagram": {"caption": string, "storyText": string},
    "tiktok": {"scriptOutline": string, "hashtags": [string]}
  },
  "imagePrompts": [{"platform": string, "prompt": string, "dimensions": string}],
  "videoIdeas": [{"platform": string, "concept": string, "duration": string}],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 2500 });
  }

  private async createSchedule(content: any): Promise<Record<string, any>> {
    const prompt = `Create optimal posting schedule for African audiences:

Content to schedule: ${JSON.stringify(content || {}, null, 2)}

Consider time zones: WAT (Nigeria), EAT (Kenya), SAST (SA), GMT (Ghana)

Return JSON:
{
  "schedule": [
    {
      "content": string,
      "platform": string,
      "postAt": string (ISO datetime),
      "timezone": string,
      "reason": string,
      "expectedReach": number
    }
  ],
  "peakTimesAfrica": {
    "nigeria": {"morning": string, "afternoon": string, "evening": string},
    "kenya": {"morning": string, "afternoon": string, "evening": string},
    "southAfrica": {"morning": string, "afternoon": string, "evening": string}
  },
  "dailyDistribution": [{"hour": number, "postCount": number}],
  "weeklyStrategy": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  private async planCampaign(campaign: any): Promise<Record<string, any>> {
    const prompt = `Plan a social media campaign for CoinDaily:

Campaign: ${JSON.stringify(campaign || {}, null, 2)}

Return JSON:
{
  "campaign": {
    "name": string,
    "objective": string,
    "duration": string,
    "budget": string,
    "targetAudience": {"demographics": string, "interests": [string], "regions": [string]},
    "phases": [
      {"phase": string, "duration": string, "activities": [string], "content": [string]}
    ],
    "contentPlan": [
      {"day": number, "platform": string, "contentType": string, "description": string}
    ],
    "kpis": [{"metric": string, "target": number}],
    "africanStrategy": {"focus": string, "localPartners": [string], "languages": [string]},
    "budget_allocation": [{"platform": string, "percentage": number}],
    "expectedOutcomes": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 3000 });
  }

  private async generateResponse(content: any): Promise<Record<string, any>> {
    const prompt = `Generate appropriate community response:

Comment/question: ${JSON.stringify(content || {}, null, 2)}

Return JSON:
{
  "response": {
    "text": string,
    "tone": "helpful"|"professional"|"friendly"|"educational",
    "includesSource": boolean,
    "followUp": string,
    "escalate": boolean,
    "escalateReason": string
  },
  "alternativeResponses": [{"text": string, "tone": string}],
  "relatedContent": [{"title": string, "url": string}]
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 1500 });
  }

  private async reviewAnalytics(data: any): Promise<Record<string, any>> {
    const prompt = `Review social media analytics and provide recommendations:

Analytics data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "review": {
    "overallPerformance": "excellent"|"good"|"average"|"poor",
    "topPerformingContent": [{"content": string, "metrics": string}],
    "underperforming": [{"content": string, "issue": string, "fix": string}],
    "audienceInsights": {"growth": number, "demographics": string, "peakTimes": [string]},
    "recommendations": [{"action": string, "priority": "high"|"medium"|"low", "impact": string}],
    "africanAudienceGrowth": {"rate": number, "topCountries": [string]},
    "nextWeekFocus": [string]
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }
}

export default SocialMediaAgent;
