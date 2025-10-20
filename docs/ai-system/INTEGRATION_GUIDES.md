# Integration Guides

## CoinDaily AI System Integration Documentation

Comprehensive guides for integrating with and extending the CoinDaily AI System.

---

## Table of Contents

1. [Adding New AI Agents](#adding-new-ai-agents)
2. [Workflow Customization](#workflow-customization)
3. [Quality Threshold Tuning](#quality-threshold-tuning)
4. [Cost Optimization Strategies](#cost-optimization-strategies)
5. [Custom Agent Development](#custom-agent-development)
6. [Third-Party Integrations](#third-party-integrations)

---

## Adding New AI Agents

### Overview

Adding a new AI agent to the system involves several steps:
1. Define agent configuration
2. Implement agent logic
3. Register agent in the system
4. Configure workflows
5. Test and deploy

### Step 1: Define Agent Configuration

Create a new agent configuration file:

```typescript
// backend/src/agents/customSentimentAgent.ts

import { AIAgentConfig } from '../types/agent';

export const customSentimentAgentConfig: AIAgentConfig = {
  name: 'Custom Sentiment Analyzer',
  type: 'sentiment_analysis',
  model: 'gpt-4-turbo-preview',
  provider: 'openai',
  config: {
    temperature: 0.3,
    maxTokens: 1000,
    systemPrompt: `You are a sentiment analysis expert...`,
    responseFormat: 'json'
  },
  capabilities: [
    'analyze_sentiment',
    'detect_sarcasm',
    'identify_emotions'
  ],
  costPerRequest: 0.02,
  avgResponseTime: 800, // milliseconds
  qualityThreshold: 0.85,
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }
};
```

### Step 2: Implement Agent Logic

```typescript
// backend/src/agents/customSentimentAgent.ts

import { OpenAI } from 'openai';
import { AIAgent, AgentTask, AgentResponse } from '../types/agent';

export class CustomSentimentAgent implements AIAgent {
  private openai: OpenAI;
  private config: AIAgentConfig;
  
  constructor(config: AIAgentConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Validate input
      this.validateInput(task.inputData);
      
      // Call AI model
      const result = await this.analyzesentiment(task.inputData.text);
      
      // Calculate quality score
      const qualityScore = this.calculateQualityScore(result);
      
      // Calculate cost
      const cost = this.calculateCost(result.usage);
      
      return {
        status: 'completed',
        outputData: result.sentiment,
        metadata: {
          model: this.config.model,
          usage: result.usage,
          processingTime: Date.now() - startTime
        },
        qualityScore,
        cost
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error.message,
        metadata: {
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  
  private async analyzeSentiment(text: string) {
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: this.config.config.systemPrompt
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this text:\n\n${text}`
        }
      ],
      temperature: this.config.config.temperature,
      max_tokens: this.config.config.maxTokens,
      response_format: { type: 'json_object' }
    });
    
    return {
      sentiment: JSON.parse(response.choices[0].message.content),
      usage: response.usage
    };
  }
  
  private validateInput(inputData: any): void {
    if (!inputData.text || typeof inputData.text !== 'string') {
      throw new Error('Input must contain a text field');
    }
    
    if (inputData.text.length < 10) {
      throw new Error('Text must be at least 10 characters');
    }
    
    if (inputData.text.length > 5000) {
      throw new Error('Text must not exceed 5000 characters');
    }
  }
  
  private calculateQualityScore(result: any): number {
    // Custom quality scoring logic
    let score = 0.5; // Base score
    
    // Check if all required fields are present
    if (result.sentiment.sentiment && result.sentiment.confidence) {
      score += 0.2;
    }
    
    // High confidence increases quality
    if (result.sentiment.confidence > 0.8) {
      score += 0.15;
    }
    
    // Detailed analysis increases quality
    if (result.sentiment.emotions && result.sentiment.emotions.length > 0) {
      score += 0.15;
    }
    
    return Math.min(score, 1.0);
  }
  
  private calculateCost(usage: any): number {
    const inputCost = (usage.prompt_tokens / 1000) * 0.01;
    const outputCost = (usage.completion_tokens / 1000) * 0.03;
    return inputCost + outputCost;
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      return response.choices.length > 0;
    } catch (error) {
      return false;
    }
  }
}
```

### Step 3: Register Agent in System

```typescript
// backend/src/services/aiAgentRegistry.ts

import { CustomSentimentAgent, customSentimentAgentConfig } from '../agents/customSentimentAgent';

export class AIAgentRegistry {
  private agents: Map<string, AIAgent> = new Map();
  
  registerAgent(id: string, agent: AIAgent, config: AIAgentConfig) {
    this.agents.set(id, agent);
    
    // Store configuration in database
    await prisma.aIAgent.create({
      data: {
        id,
        name: config.name,
        type: config.type,
        model: config.model,
        provider: config.provider,
        config: config.config,
        status: 'active'
      }
    });
    
    console.log(`Agent registered: ${config.name}`);
  }
  
  getAgent(id: string): AIAgent | undefined {
    return this.agents.get(id);
  }
}

// Register custom agent
const registry = new AIAgentRegistry();
const customAgent = new CustomSentimentAgent(customSentimentAgentConfig);
registry.registerAgent('custom-sentiment-1', customAgent, customSentimentAgentConfig);
```

### Step 4: Create API Endpoints

```typescript
// backend/src/api/custom-sentiment.ts

import express from 'express';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/ai/custom-sentiment/analyze
 * @desc    Analyze sentiment using custom agent
 * @access  Private
 */
router.post('/analyze', authenticateUser, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Create task
    const task = await aiTaskService.createTask({
      agentId: 'custom-sentiment-1',
      type: 'sentiment_analysis',
      inputData: { text },
      priority: 'normal',
      userId: req.user.id
    });
    
    // Execute task
    const result = await aiTaskService.executeTask(task.id);
    
    res.json({
      data: result,
      cache: { hit: false }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'ANALYSIS_FAILED',
        message: error.message
      }
    });
  }
});

export default router;
```

### Step 5: Add GraphQL Support

```graphql
# Add to schema
extend type Query {
  customSentimentAnalysis(text: String!): SentimentResult!
}

type SentimentResult {
  sentiment: String!
  confidence: Float!
  emotions: [Emotion!]!
  sarcasm: Boolean
}

type Emotion {
  name: String!
  intensity: Float!
}
```

```typescript
// Resolver
const resolvers = {
  Query: {
    customSentimentAnalysis: async (_, { text }, context) => {
      const agent = agentRegistry.getAgent('custom-sentiment-1');
      const result = await agent.execute({
        inputData: { text }
      });
      return result.outputData;
    }
  }
};
```

### Step 6: Testing

```typescript
// backend/tests/agents/customSentimentAgent.test.ts

import { CustomSentimentAgent } from '../../src/agents/customSentimentAgent';

describe('CustomSentimentAgent', () => {
  let agent: CustomSentimentAgent;
  
  beforeAll(() => {
    agent = new CustomSentimentAgent(customSentimentAgentConfig);
  });
  
  it('should analyze positive sentiment', async () => {
    const result = await agent.execute({
      inputData: {
        text: 'Bitcoin is amazing! I love the technology.'
      }
    });
    
    expect(result.status).toBe('completed');
    expect(result.outputData.sentiment).toBe('positive');
    expect(result.outputData.confidence).toBeGreaterThan(0.7);
  });
  
  it('should detect sarcasm', async () => {
    const result = await agent.execute({
      inputData: {
        text: 'Oh great, another Bitcoin crash. Just what I needed.'
      }
    });
    
    expect(result.outputData.sarcasm).toBe(true);
  });
  
  it('should fail with invalid input', async () => {
    const result = await agent.execute({
      inputData: { text: 'short' }
    });
    
    expect(result.status).toBe('failed');
  });
});
```

---

## Workflow Customization

### Creating Custom Workflows

Workflows define how multiple AI agents work together to complete complex tasks.

### Example: Custom Article Workflow

```typescript
// backend/src/workflows/customArticleWorkflow.ts

import { Workflow, WorkflowStep } from '../types/workflow';

export const customArticleWorkflow: Workflow = {
  name: 'Custom Article Generation',
  description: 'Generate article with custom fact-checking',
  steps: [
    {
      name: 'research',
      agentType: 'research',
      config: {
        sources: ['news_api', 'twitter', 'reddit'],
        depth: 'comprehensive'
      },
      timeout: 60000, // 1 minute
      retryOnFailure: true
    },
    {
      name: 'fact_check',
      agentType: 'fact_checking',
      dependsOn: ['research'],
      config: {
        verifyAll: true,
        confidenceThreshold: 0.9
      },
      timeout: 45000
    },
    {
      name: 'content_generation',
      agentType: 'content_generation',
      dependsOn: ['fact_check'],
      config: {
        tone: 'professional',
        length: 'medium',
        includeStats: true
      },
      timeout: 120000 // 2 minutes
    },
    {
      name: 'quality_review',
      agentType: 'quality_review',
      dependsOn: ['content_generation'],
      config: {
        checkGrammar: true,
        checkSEO: true,
        checkReadability: true
      },
      timeout: 30000
    },
    {
      name: 'translation',
      agentType: 'translation',
      dependsOn: ['quality_review'],
      config: {
        languages: ['sw', 'ha', 'yo'],
        preserveFormatting: true
      },
      timeout: 90000,
      parallel: true // Translate all languages in parallel
    }
  ],
  onSuccess: async (results) => {
    // Publish article
    await publishArticle(results);
  },
  onFailure: async (error, completedSteps) => {
    // Notify admins
    await notifyAdmins('Workflow failed', error);
  }
};
```

### Workflow Execution Engine

```typescript
// backend/src/services/workflowExecutor.ts

export class WorkflowExecutor {
  async execute(workflow: Workflow, initialData: any): Promise<any> {
    const results: Map<string, any> = new Map();
    const executedSteps: Set<string> = new Set();
    
    try {
      // Execute steps in order
      for (const step of workflow.steps) {
        // Check dependencies
        if (step.dependsOn) {
          const allDepsComplete = step.dependsOn.every(dep => 
            executedSteps.has(dep)
          );
          
          if (!allDepsComplete) {
            throw new Error(`Dependencies not met for step: ${step.name}`);
          }
        }
        
        // Get input from previous steps
        const input = this.prepareStepInput(step, results, initialData);
        
        // Execute step
        const stepResult = await this.executeStep(step, input);
        
        results.set(step.name, stepResult);
        executedSteps.add(step.name);
        
        // Check if quality threshold is met
        if (stepResult.qualityScore < 0.85) {
          if (step.retryOnFailure) {
            // Retry once
            const retryResult = await this.executeStep(step, input);
            results.set(step.name, retryResult);
          } else {
            throw new Error(`Quality threshold not met for step: ${step.name}`);
          }
        }
      }
      
      // Call success handler
      if (workflow.onSuccess) {
        await workflow.onSuccess(results);
      }
      
      return results;
    } catch (error) {
      // Call failure handler
      if (workflow.onFailure) {
        await workflow.onFailure(error, results);
      }
      throw error;
    }
  }
  
  private prepareStepInput(
    step: WorkflowStep, 
    results: Map<string, any>, 
    initialData: any
  ): any {
    const input = { ...initialData };
    
    // Add results from dependent steps
    if (step.dependsOn) {
      step.dependsOn.forEach(dep => {
        input[dep] = results.get(dep);
      });
    }
    
    return input;
  }
  
  private async executeStep(step: WorkflowStep, input: any): Promise<any> {
    const agent = await this.getAgentByType(step.agentType);
    
    const task = await aiTaskService.createTask({
      agentId: agent.id,
      type: step.agentType,
      inputData: {
        ...input,
        ...step.config
      },
      priority: 'high'
    });
    
    // Execute with timeout
    const result = await Promise.race([
      aiTaskService.executeTask(task.id),
      this.timeout(step.timeout)
    ]);
    
    return result;
  }
  
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Step timeout')), ms);
    });
  }
}
```

### Using Custom Workflows

```typescript
// Create workflow instance
const executor = new WorkflowExecutor();

// Execute workflow
const result = await executor.execute(customArticleWorkflow, {
  topic: 'Bitcoin ETF Approval',
  category: 'regulation',
  targetAudience: 'general'
});

console.log('Workflow completed:', result);
```

---

## Quality Threshold Tuning

### Understanding Quality Scores

Quality scores are calculated based on multiple factors:

```typescript
interface QualityMetrics {
  contentQuality: number;    // 0-1
  grammarScore: number;      // 0-1
  readabilityScore: number;  // 0-1
  factAccuracy: number;      // 0-1
  seoScore: number;          // 0-1
  relevanceScore: number;    // 0-1
  originalityScore: number;  // 0-1
}

function calculateOverallQuality(metrics: QualityMetrics): number {
  const weights = {
    contentQuality: 0.25,
    grammarScore: 0.15,
    readabilityScore: 0.10,
    factAccuracy: 0.25,
    seoScore: 0.10,
    relevanceScore: 0.10,
    originalityScore: 0.05
  };
  
  let totalScore = 0;
  Object.keys(weights).forEach(key => {
    totalScore += metrics[key] * weights[key];
  });
  
  return totalScore;
}
```

### Configuring Thresholds

```typescript
// backend/src/config/qualityThresholds.ts

export const qualityThresholds = {
  // Minimum scores for auto-approval
  autoApproval: {
    overall: 0.90,
    contentQuality: 0.85,
    grammarScore: 0.90,
    factAccuracy: 0.95,
    seoScore: 0.80
  },
  
  // Scores requiring human review
  humanReview: {
    overall: 0.70,
    contentQuality: 0.65,
    grammarScore: 0.75,
    factAccuracy: 0.80,
    seoScore: 0.60
  },
  
  // Below these scores = rejection
  rejection: {
    overall: 0.50,
    contentQuality: 0.50,
    grammarScore: 0.60,
    factAccuracy: 0.70,
    seoScore: 0.40
  },
  
  // Per-agent thresholds
  agents: {
    'content-generation': {
      minimumQuality: 0.85,
      targetQuality: 0.92
    },
    'translation': {
      minimumQuality: 0.88,
      targetQuality: 0.95
    },
    'image-generation': {
      minimumQuality: 0.80,
      targetQuality: 0.90
    }
  }
};
```

### Dynamic Threshold Adjustment

```typescript
// backend/src/services/qualityThresholdManager.ts

export class QualityThresholdManager {
  async adjustThresholds(agentId: string): Promise<void> {
    // Get agent performance history
    const performance = await this.getAgentPerformance(agentId, '30days');
    
    // Calculate optimal threshold
    const optimalThreshold = this.calculateOptimalThreshold(performance);
    
    // Update threshold
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        config: {
          ...agent.config,
          qualityThreshold: optimalThreshold
        }
      }
    });
    
    console.log(`Threshold adjusted for ${agentId}: ${optimalThreshold}`);
  }
  
  private calculateOptimalThreshold(performance: AgentPerformance): number {
    // Find threshold that maximizes quality while minimizing rejections
    const currentThreshold = performance.qualityThreshold;
    const successRate = performance.successRate;
    const avgQuality = performance.avgQualityScore;
    
    // If success rate is too low, lower threshold
    if (successRate < 0.90) {
      return Math.max(0.70, currentThreshold - 0.05);
    }
    
    // If quality is consistently high, raise threshold
    if (avgQuality > currentThreshold + 0.10 && successRate > 0.95) {
      return Math.min(0.95, currentThreshold + 0.03);
    }
    
    return currentThreshold;
  }
}
```

### A/B Testing Quality Thresholds

```typescript
// Test different thresholds
const thresholdExperiment = {
  variants: [
    { name: 'control', threshold: 0.85 },
    { name: 'variant_a', threshold: 0.88 },
    { name: 'variant_b', threshold: 0.82 }
  ],
  duration: 7 * 24 * 60 * 60 * 1000, // 7 days
  metrics: ['quality_score', 'success_rate', 'user_satisfaction']
};

async function runThresholdExperiment() {
  const results = await experimentService.run(thresholdExperiment);
  
  // Analyze results
  const winner = results.variants.sort((a, b) => 
    b.metrics.overall_score - a.metrics.overall_score
  )[0];
  
  console.log('Winning threshold:', winner.threshold);
  
  // Apply winning threshold
  await updateSystemThreshold(winner.threshold);
}
```

---

## Cost Optimization Strategies

### 1. Model Selection Strategy

```typescript
// Choose model based on task complexity
function selectOptimalModel(task: AgentTask): string {
  const complexity = assessTaskComplexity(task);
  
  if (complexity === 'simple') {
    return 'gpt-3.5-turbo'; // $0.002/1K tokens
  } else if (complexity === 'medium') {
    return 'gpt-4-turbo'; // $0.01/1K tokens
  } else {
    return 'gpt-4'; // $0.03/1K tokens
  }
}

function assessTaskComplexity(task: AgentTask): 'simple' | 'medium' | 'complex' {
  const factors = {
    inputLength: task.inputData.text?.length || 0,
    requiresCreativity: task.type === 'content_generation',
    requiresAnalysis: task.type.includes('analysis'),
    historicalSuccessRate: 0.95 // Get from metrics
  };
  
  if (factors.inputLength < 500 && factors.historicalSuccessRate > 0.95) {
    return 'simple';
  } else if (factors.requiresCreativity || factors.requiresAnalysis) {
    return 'complex';
  }
  
  return 'medium';
}
```

### 2. Aggressive Caching

```typescript
// Cache AI responses intelligently
const cacheStrategies = {
  // Cache indefinitely for static content
  translation: { ttl: 30 * 24 * 60 * 60 }, // 30 days
  
  // Cache moderately for semi-static content
  contentGeneration: { ttl: 7 * 24 * 60 * 60 }, // 7 days
  
  // Short cache for dynamic content
  sentimentAnalysis: { ttl: 60 * 60 }, // 1 hour
  marketAnalysis: { ttl: 5 * 60 } // 5 minutes
};

async function getCachedOrExecute(
  cacheKey: string,
  task: AgentTask,
  agent: AIAgent
): Promise<any> {
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Execute task
  const result = await agent.execute(task);
  
  // Cache result
  const ttl = cacheStrategies[task.type]?.ttl || 3600;
  await redis.setex(cacheKey, ttl, JSON.stringify(result));
  
  return result;
}
```

### 3. Batch Processing

```typescript
// Process multiple tasks in one API call
async function batchTranslate(texts: string[], targetLang: string): Promise<string[]> {
  // Combine texts into one request
  const combinedText = texts.map((text, i) => 
    `[${i}]\n${text}\n`
  ).join('\n---\n');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `Translate each numbered section to ${targetLang}:\n\n${combinedText}`
    }]
  });
  
  // Parse individual translations
  const translations = parseTranslations(response.choices[0].message.content);
  
  // Cost: 1 API call vs N API calls
  console.log(`Saved ${(texts.length - 1) * 0.002} USD`);
  
  return translations;
}
```

### 4. Request Throttling

```typescript
// Limit concurrent AI requests
class AIRequestThrottler {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent = 5; // Limit concurrent requests
  
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      // Wait for slot to open
      await new Promise(resolve => {
        this.queue.push(resolve);
      });
    }
    
    this.activeRequests++;
    
    try {
      return await fn();
    } finally {
      this.activeRequests--;
      
      // Process next in queue
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}

const throttler = new AIRequestThrottler();

// Usage
const result = await throttler.enqueue(() => 
  agent.execute(task)
);
```

### 5. Cost Monitoring & Alerts

```typescript
// Track costs in real-time
async function trackCost(agentId: string, cost: number): Promise<void> {
  // Increment daily spend
  const today = new Date().toISOString().split('T')[0];
  const key = `cost:${agentId}:${today}`;
  
  await redis.incrbyFloat(key, cost);
  
  // Check budget
  const dailySpend = parseFloat(await redis.get(key));
  const budget = await getBudgetLimit(agentId, 'daily');
  
  if (dailySpend > budget * 0.9) {
    // 90% of budget reached
    await sendBudgetAlert(agentId, dailySpend, budget);
  }
  
  if (dailySpend >= budget) {
    // Budget exceeded, throttle agent
    await throttleAgent(agentId);
  }
}
```

### 6. Prompt Optimization

```typescript
// Shorter, more efficient prompts
const inefficientPrompt = `
You are a highly sophisticated AI assistant specializing in cryptocurrency 
news analysis. Your task is to carefully read and analyze the following 
article about Bitcoin, and then provide a comprehensive summary that 
includes the main points, key takeaways, and any important details that 
readers should know about...
`;

const efficientPrompt = `
Summarize this Bitcoin article with key points:
`;

// Savings: ~80 tokens = $0.0024 per request
// At 1000 requests/day = $2.40/day = $876/year saved
```

---

## Custom Agent Development

### Agent Template

```typescript
// backend/src/agents/templateAgent.ts

import { AIAgent, AgentTask, AgentResponse, AIAgentConfig } from '../types/agent';

export class TemplateAgent implements AIAgent {
  private config: AIAgentConfig;
  
  constructor(config: AIAgentConfig) {
    this.config = config;
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Validate input
      this.validateInput(task.inputData);
      
      // 2. Process task
      const result = await this.process(task.inputData);
      
      // 3. Validate output
      this.validateOutput(result);
      
      // 4. Calculate metrics
      const qualityScore = this.calculateQuality(result);
      const cost = this.calculateCost(result);
      
      return {
        status: 'completed',
        outputData: result,
        qualityScore,
        cost,
        metadata: {
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error.message,
        metadata: {
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  
  private validateInput(inputData: any): void {
    // Implement validation logic
    throw new Error('Not implemented');
  }
  
  private async process(inputData: any): Promise<any> {
    // Implement main processing logic
    throw new Error('Not implemented');
  }
  
  private validateOutput(output: any): void {
    // Implement output validation
    throw new Error('Not implemented');
  }
  
  private calculateQuality(output: any): number {
    // Implement quality calculation
    return 0.85;
  }
  
  private calculateCost(output: any): number {
    // Implement cost calculation
    return 0.01;
  }
  
  async healthCheck(): Promise<boolean> {
    // Implement health check
    return true;
  }
}
```

---

## Third-Party Integrations

### Example: Integrating Claude API

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAgent implements AIAgent {
  private anthropic: Anthropic;
  
  constructor(config: AIAgentConfig) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: task.inputData.prompt
      }]
    });
    
    return {
      status: 'completed',
      outputData: {
        text: message.content[0].text
      },
      cost: this.calculateCost(message.usage)
    };
  }
}
```

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
