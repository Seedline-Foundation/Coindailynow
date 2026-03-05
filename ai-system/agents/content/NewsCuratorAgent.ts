/**
 * NewsCurator Agent
 * Auto-collect, summarize, and publish news 24/7
 * 
 * Model: Llama 3.1 8B (content generation/summarization)
 */

import { BaseAgent, AgentTask } from '../base/BaseAgent';

export class NewsCuratorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'news-curator-agent',
      name: 'NewsCurator Agent',
      type: 'news_curator',
      category: 'content',
      description: 'Autonomous 24/7 news curation engine. Collects, summarizes, categorizes, and publishes crypto news with African market priority. Reduces editorial workload by 90%.',
      capabilities: [
        'auto_collection',
        'smart_summarization',
        'content_categorization',
        'headline_generation',
        'seo_optimization',
        'african_localization',
        'trending_detection',
        'content_scheduling',
        'auto_publishing',
        'newsletter_generation',
      ],
      model: 'llama',
      timeoutMs: 120000,
    });
  }

  protected async processTask(task: AgentTask): Promise<Record<string, any>> {
    const { taskType, data, category, language, format } = task.input;

    switch (taskType) {
      case 'curate_feed':
        return this.curateFeed(data, category);
      case 'generate_article':
        return this.generateArticle(data);
      case 'summarize':
        return this.summarizeContent(data, format);
      case 'generate_headline':
        return this.generateHeadlines(data);
      case 'schedule_content':
        return this.scheduleContent(data);
      case 'newsletter':
        return this.generateNewsletter(data);
      case 'trending':
        return this.identifyTrending(data);
      default:
        return this.curateFeed(data, category);
    }
  }

  private async curateFeed(data: any, category?: string): Promise<Record<string, any>> {
    const prompt = `As CoinDaily's autonomous news curator, create a curated news feed:

Raw data: ${JSON.stringify(data || {}, null, 2)}
Category: ${category || 'all'}

Return JSON:
{
  "curatedFeed": {
    "generatedAt": "${new Date().toISOString()}",
    "edition": "daily",
    "topStory": {
      "headline": string,
      "summary": string (3-4 sentences),
      "category": string,
      "seoTitle": string,
      "seoDescription": string,
      "tags": [string],
      "africanAngle": string
    },
    "articles": [
      {
        "headline": string,
        "summary": string (2-3 sentences),
        "category": "market"|"defi"|"regulation"|"african"|"memecoin"|"technology"|"opinion",
        "priority": "breaking"|"high"|"normal",
        "seoTitle": string,
        "tags": [string],
        "readTime": number,
        "africanRelevance": number (0-1),
        "publishReady": boolean
      }
    ],
    "africanSpotlight": {
      "headline": string,
      "summary": string,
      "country": string,
      "impact": string
    }
  },
  "scheduling": {
    "immediate": [number],
    "nextHour": [number],
    "tomorrow": [number]
  },
  "contentGaps": [string],
  "summary": string
}`;

    return this.callModelJSON(prompt, { temperature: 0.5, maxTokens: 4000 });
  }

  private async generateArticle(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a publish-ready news article for CoinDaily:

Source data: ${JSON.stringify(data || {}, null, 2)}

Write in journalistic style, focusing on African crypto market relevance. Return JSON:
{
  "article": {
    "headline": string,
    "subHeadline": string,
    "body": string (400-600 words, with paragraphs),
    "summary": string (2 sentences for meta),
    "seoTitle": string (max 60 chars),
    "seoDescription": string (max 160 chars),
    "category": string,
    "tags": [string],
    "keywords": [string],
    "readTime": number,
    "africanContext": string (1-2 sentences tying to African markets),
    "sources": [{"name": string, "url": string}],
    "relatedTopics": [string],
    "publishReady": boolean,
    "qualityScore": number (0-100)
  },
  "suggestedImages": [{"description": string, "alt": string}],
  "socialPosts": {
    "twitter": string (max 280 chars),
    "telegram": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 4000 });
  }

  private async summarizeContent(data: any, format?: string): Promise<Record<string, any>> {
    const prompt = `Summarize the following content in ${format || 'standard'} format:

Content: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "summary": {
    "brief": string (1 sentence),
    "standard": string (2-3 sentences),
    "detailed": string (1 paragraph),
    "bulletPoints": [string],
    "keyFacts": [string],
    "africanRelevance": string
  },
  "metadata": {
    "originalLength": number,
    "summaryLength": number,
    "compressionRatio": number,
    "keyEntities": [string],
    "sentiment": string
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  private async generateHeadlines(data: any): Promise<Record<string, any>> {
    const prompt = `Generate compelling, SEO-optimized headlines for this story:

Story: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "headlines": [
    {
      "text": string,
      "type": "primary"|"seo"|"social"|"clickworthy"|"informational",
      "charCount": number,
      "seoScore": number (0-100),
      "emotionalAppeal": number (0-10),
      "targetAudience": string
    }
  ],
  "recommended": number (index of best headline),
  "twitterHeadline": string (max 100 chars for tweets),
  "pushNotification": string (max 65 chars)
}`;

    return this.callModelJSON(prompt, { temperature: 0.7, maxTokens: 1500 });
  }

  private async scheduleContent(data: any): Promise<Record<string, any>> {
    const prompt = `Create an optimal content publishing schedule:

Content items: ${JSON.stringify(data || {}, null, 2)}

Consider: Peak audience times in Africa (WAT, EAT, SAST), content diversity, news freshness.

Return JSON:
{
  "schedule": [
    {
      "contentIndex": number,
      "publishAt": string (ISO datetime),
      "timezone": string,
      "reason": string,
      "expectedReach": "high"|"medium"|"low",
      "platforms": ["web", "twitter", "telegram", "newsletter"]
    }
  ],
  "peakTimes": [{"timezone": string, "time": string, "audience": string}],
  "contentCalendar": {
    "today": number,
    "tomorrow": number,
    "thisWeek": number
  },
  "gaps": [{"time": string, "suggestion": string}]
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }

  private async generateNewsletter(data: any): Promise<Record<string, any>> {
    const prompt = `Generate a daily crypto newsletter for CoinDaily's African audience:

Content: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "newsletter": {
    "subject": string,
    "preheader": string,
    "greeting": string,
    "topStory": {"headline": string, "body": string (3-4 sentences)},
    "marketUpdate": {"summary": string, "btcPrice": string, "ethPrice": string, "fearGreed": string},
    "africanSpotlight": {"headline": string, "body": string},
    "quickBites": [{"headline": string, "summary": string}],
    "memecoinsCorner": {"content": string},
    "closingThought": string,
    "ctaText": string,
    "ctaUrl": string
  },
  "metadata": {
    "wordCount": number,
    "readTime": number,
    "personalizable": boolean
  }
}`;

    return this.callModelJSON(prompt, { temperature: 0.6, maxTokens: 3000 });
  }

  private async identifyTrending(data: any): Promise<Record<string, any>> {
    const prompt = `Identify trending topics that should be covered:

Data: ${JSON.stringify(data || {}, null, 2)}

Return JSON:
{
  "trending": [
    {
      "topic": string,
      "momentum": "exploding"|"rising"|"steady"|"declining",
      "score": number (0-100),
      "sources": number,
      "timeActive": string,
      "africanRelevance": number,
      "contentSuggestion": string,
      "urgency": "immediate"|"today"|"this_week"
    }
  ],
  "underCovered": [{"topic": string, "opportunity": string}],
  "overCovered": [{"topic": string, "suggestion": string}],
  "contentOpportunities": [string]
}`;

    return this.callModelJSON(prompt, { temperature: 0.4, maxTokens: 2000 });
  }
}

export default NewsCuratorAgent;
