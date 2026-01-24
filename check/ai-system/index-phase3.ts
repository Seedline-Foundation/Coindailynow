// Phase 3 AI System Index - Export all research and analysis agents
// Comprehensive Phase 3 implementation for African cryptocurrency journalism

// Research Agents
export { cryptoResearchAgent } from './agents/research/crypto-research-agent';
export { newsAggregationAgent } from './agents/research/news-aggregation-agent';

// Analysis Agents  
export { sentimentAnalysisAgent } from './agents/analysis/sentiment-analysis-agent';
export { trendAnalysisAgent } from './agents/analysis/trend-analysis-agent';

// Data Infrastructure
export { priceDataCollector } from './data/collectors/price-data-collector';
export { newsDataCollector } from './data/collectors/news-data-collector';
export { dataProcessor } from './data/processors/data-processor';

// Types
export * from './types/ai-types';

// Phase 3 Agent Registry
export const phase3Agents = {
  research: {
    crypto: 'crypto-research-agent',
    news: 'news-aggregation-agent'
  },
  analysis: {
    sentiment: 'sentiment-analysis-agent',
    trend: 'trend-analysis-agent'
  },
  data: {
    priceCollector: 'price-data-collector',
    newsCollector: 'news-data-collector',
    processor: 'data-processor'
  }
};

// Phase 3 Capabilities
export const phase3Capabilities = [
  'research.crypto',
  'research.news', 
  'analysis.sentiment',
  'analysis.trend',
  'data.collect',
  'data.process',
  'african_market_focus',
  'multi_source_aggregation',
  'real_time_processing',
  'predictive_analytics'
];

console.log('📊 Phase 3 AI System loaded with African market specialization');
console.log(`✅ Available agents: ${Object.keys(phase3Agents).length} categories`);
console.log(`✅ Capabilities: ${phase3Capabilities.length} features`);
