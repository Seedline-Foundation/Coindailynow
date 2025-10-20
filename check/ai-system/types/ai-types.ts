// Shared types for AI system to avoid circular dependencies

export type AITaskType = 
  | 'analysis.sentiment'
  | 'analysis.market'
  | 'analysis.trending'
  | 'analysis.performance'
  | 'analysis.user_behavior'
  | 'analysis.competitive'
  | 'analysis.predictive'
  | 'content.generate'
  | 'content.optimize'
  | 'content.summarize'
  | 'content.rewrite'
  | 'translation.auto'
  | 'translation.manual'
  | 'image.generate'
  | 'image.thumbnail'
  | 'image.chart'
  | 'seo.optimize'
  | 'social.enhance'
  | 'research.crypto'
  | 'research.news'
  | 'research.factcheck'
  | 'data.collect'
  | 'data.process'
  | 'moderation.content'
  | 'moderation.spam';

export type AgentCapability = 
  | 'market_analysis'
  | 'content_generation'
  | 'translation'
  | 'image_generation'
  | 'seo_optimization'
  | 'social_optimization'
  | 'research'
  | 'data_analysis'
  | 'content_moderation'
  | 'predictive_analysis';

export interface AgentCapabilityConfig {
  agentType: string;
  supportedTasks: AITaskType[];
  maxConcurrentTasks: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface AITask {
  id: string;
  type: AITaskType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: unknown;
  metadata: {
    articleId?: string;
    language?: string;
    marketSymbol?: string;
    deadline?: number;
    userPreferences?: Record<string, unknown>;
    requestedAt?: Date;
    source?: string;
  };
  createdAt: number;
  scheduledFor?: number;
  assignedAgent?: string;
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  result?: unknown;
  error?: string;
  processingTime?: number;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities: AgentCapability[];
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTasks: string[];
  maxConcurrentTasks: number;
  performance: {
    totalTasks: number;
    successfulTasks: number;
    averageResponseTime: number;
    lastTaskTime?: number;
  };
  lastPing: number;
  lastActivity: Date;
  totalTasksCompleted: number;
  successRate: number;
}

// Agent Result Types
export interface ContentGenerationResult {
  content: string;
  metadata?: {
    wordCount: number;
    readabilityScore: number;
    seoScore: number;
    sentiment: string;
    keywordDensity: Record<string, number>;
    suggestedTags: string[];
  };
}

export interface TranslationResult {
  translatedText: string;
  metadata?: {
    qualityScore: number;
    confidence: number;
    detectedLanguage?: string;
    alternativeTranslations?: string[];
  };
}

export interface ImageGenerationResult {
  imageUrl: string;
  metadata?: {
    size: string;
    quality: string;
    generationTime: number;
    promptUsed: string;
    revisedPrompt?: string;
  };
}

// Phase 3 Agent Result Types
export interface ResearchResult {
  content: string;
  sources: Array<{
    url: string;
    title: string;
    reliability: number;
    publishedAt?: Date;
  }>;
  metadata?: {
    confidence: number;
    factCheckScore: number;
    relevanceScore: number;
    sourceCount: number;
    processingTime: number;
  };
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: Array<{
    word: string;
    sentiment: string;
    impact: number;
  }>;
  metadata?: {
    textLength: number;
    languageDetected: string;
    processingTime: number;
    sources?: number;
    influencers?: number;
    onChainMetrics?: number;
    regionalProfile?: Record<string, unknown>;
    analysisType?: string;
    symbols?: string[];
  };
}

export interface TrendAnalysisResult {
  trend: 'rising' | 'falling' | 'stable' | 'volatile';
  trendScore: number;
  predictions: Array<{
    timeframe: string;
    prediction: string;
    confidence: number;
  }>;
  indicators: Array<{
    name: string;
    value: number;
    change: number;
  }>;
  metadata?: {
    dataPoints: number;
    timeRange: string;
    accuracy: number;
    processingTime?: number;
    africanContext?: Record<string, unknown>;
    memecoinAnalysis?: boolean;
    whaleActivity?: boolean;
    onChainMetrics?: boolean;
  };
}

export interface MarketAnalysisResult {
  trend: 'rising' | 'falling' | 'stable' | 'volatile';
  overallTrend: 'rising' | 'falling' | 'stable' | 'volatile';
  trendScore: number;
  trendStrength: number;
  confidenceScore: number;
  predictions: Array<{
    timeframe: string;
    prediction: string;
    confidence: number;
  }>;
  indicators: Array<{
    name: string;
    value: number;
    change: number;
  }>;
  metadata?: {
    dataPoints: number;
    processingTime: number;
    timeRange: string;
  };
}

export interface UserBehaviorAnalysisResult {
  confidence: number;
  predictions?: Array<{
    metric: string;
    value: number;
    confidence: number;
    trend?: 'rising' | 'falling' | 'stable';
  }>;
  behavior_patterns?: Record<string, unknown>;
  adoption_metrics?: Record<string, unknown>;
  metadata?: {
    dataPoints: number;
    processingTime: number;
    userCount: number;
  };
}

export interface DataCollectionResult {
  data: Array<Record<string, unknown>>;
  summary: {
    totalRecords: number;
    timeRange: string;
    dataQuality: number;
  };
  metadata?: {
    source: string;
    collectionTime: number;
    lastUpdate: Date;
  };
}

export interface ModerationResult {
  approved: boolean;
  confidence: number;
  issues: Array<{
    type: 'spam' | 'inappropriate' | 'misleading' | 'low_quality';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  suggestions?: string[];
  metadata?: {
    processingTime: number;
    modelVersion: string;
  };
}
