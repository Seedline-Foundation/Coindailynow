/**
 * Base Agent Class
 * Foundation for all CoinDaily AI agents
 * Provides: Ollama integration, metrics tracking, retry logic, health monitoring
 * 
 * All agents use self-hosted models:
 * - DeepSeek R1 8B (reasoning, analysis, review)
 * - Llama 3.1 8B (content generation, summarization)
 */

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  agentId: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
  retryCount: number;
  maxRetries: number;
}

export interface AgentMetricsData {
  tasksProcessed: number;
  tasksSuccessful: number;
  tasksFailed: number;
  tasksInQueue: number;
  avgProcessingTimeMs: number;
  totalProcessingTimeMs: number;
  successRate: number;
  lastTaskAt?: Date;
  lastError?: string;
  uptime: number;
  startedAt: Date;
}

export interface AgentHealthData {
  score: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastCheck: Date;
  issues: string[];
  modelAvailable: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  capabilities: string[];
  model: string;
  status: 'active' | 'idle' | 'error' | 'disabled';
  isActive: boolean;
  metrics: AgentMetricsData;
  health: AgentHealthData;
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Ollama API configuration
const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-r1:8b';
const LLAMA_MODEL = process.env.LLAMA_MODEL || 'llama3.1:8b';

// Mock mode: auto-activates when Ollama is unavailable
// Set AI_MOCK_MODE=true to force mock, AI_MOCK_MODE=false to force live
let _ollamaAvailable: boolean | null = null;

async function isOllamaAvailable(): Promise<boolean> {
  if (process.env.AI_MOCK_MODE === 'true') return false;
  if (process.env.AI_MOCK_MODE === 'false') return true;
  if (_ollamaAvailable !== null) return _ollamaAvailable;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    _ollamaAvailable = response.ok;
  } catch {
    _ollamaAvailable = false;
  }
  // Re-check every 60 seconds
  setTimeout(() => { _ollamaAvailable = null; }, 60000);
  return _ollamaAvailable;
}

function generateMockResponse(prompt: string, format?: 'json'): string {
  // Generate a realistic mock response based on the prompt content
  const p = prompt.toLowerCase();
  
  if (format === 'json') {
    // Detect what JSON structure is being asked for from the prompt
    if (p.includes('sentiment') || p.includes('bullish') || p.includes('bearish')) {
      return JSON.stringify({
        overallSentiment: 'bullish',
        sentimentScore: 0.72,
        confidence: 0.85,
        fearGreedIndex: 68,
        keyThemes: [
          { theme: 'African crypto adoption', sentiment: 'bullish', impact: 'high' },
          { theme: 'Regulatory clarity', sentiment: 'neutral', impact: 'medium' },
        ],
        africanMarketImpact: { score: 0.8, regions: ['nigeria', 'kenya', 'south_africa'], notes: 'Strong adoption trends across West Africa' },
        alerts: [{ type: 'surge_detected', message: 'Unusual volume spike on Luno exchange', severity: 'medium' }],
        riskLevel: 'medium',
        summary: '[MOCK] Crypto market sentiment in Africa remains bullish with growing institutional interest and regulatory clarity.',
        _mock: true,
      });
    }
    if (p.includes('compliance') || p.includes('regulation') || p.includes('legal')) {
      return JSON.stringify({
        isCompliant: false,
        riskLevel: 'high',
        issues: [
          { rule: 'No guaranteed returns claims', severity: 'critical', description: 'Content contains prohibited guaranteed returns language' },
          { rule: 'Unlisted token disclosure', severity: 'high', description: 'Token mentioned is not listed on approved exchanges' },
        ],
        recommendations: ['Remove guaranteed returns language', 'Add risk disclaimer', 'Verify token listing status'],
        regions: { nigeria: 'non-compliant', kenya: 'requires-review', south_africa: 'non-compliant' },
        summary: '[MOCK] Content violates multiple compliance rules - immediate attention required.',
        _mock: true,
      });
    }
    if (p.includes('trade') || p.includes('price') || p.includes('market')) {
      return JSON.stringify({
        action: 'hold',
        confidence: 0.73,
        analysis: {
          trend: 'upward',
          support: 95000,
          resistance: 102000,
          rsi: 65,
          volume: 'above_average',
        },
        signals: [
          { signal: 'RSI approaching overbought', type: 'bearish', strength: 0.4 },
          { signal: 'MACD bullish crossover', type: 'bullish', strength: 0.7 },
        ],
        recommendation: 'Hold position. Set stop-loss at $95,000.',
        summary: '[MOCK] Market showing mixed signals. Maintain position with tight stops.',
        _mock: true,
      });
    }
    if (p.includes('review') || p.includes('code') || p.includes('quality')) {
      return JSON.stringify({
        overallScore: 7.5,
        issues: [
          { type: 'security', severity: 'medium', message: 'Missing input validation on token parameter', line: 2 },
          { type: 'performance', severity: 'low', message: 'Consider adding response caching', line: 3 },
        ],
        suggestions: ['Add try-catch for fetch errors', 'Validate token parameter', 'Add response type checking'],
        summary: '[MOCK] Code is functional but needs input validation and error handling improvements.',
        _mock: true,
      });
    }
    if (p.includes('article') || p.includes('curate') || p.includes('content') || p.includes('news')) {
      return JSON.stringify({
        relevanceScore: 0.88,
        category: 'crypto_news',
        tags: ['africa', 'exchange', 'trading_volume', 'nigeria'],
        headline: 'African Crypto Exchanges See Record Growth in Q1 2026',
        summary: '[MOCK] Curated article highlighting the growth of crypto trading across African exchanges.',
        audienceMatch: 0.92,
        publishRecommendation: 'publish',
        _mock: true,
      });
    }
    if (p.includes('support') || p.includes('customer') || p.includes('help')) {
      return JSON.stringify({
        response: 'To buy Bitcoin using M-Pesa on CoinDaily: 1) Create an account 2) Go to Buy/Sell 3) Select M-Pesa as payment 4) Enter amount 5) Complete the M-Pesa prompt on your phone.',
        category: 'how_to',
        sentiment: 'helpful',
        escalationNeeded: false,
        relatedArticles: ['getting-started-mpesa', 'bitcoin-buying-guide-kenya'],
        summary: '[MOCK] Customer support response for M-Pesa Bitcoin purchase query.',
        _mock: true,
      });
    }
    // Generic fallback JSON
    return JSON.stringify({
      status: 'completed',
      result: 'Analysis completed successfully',
      confidence: 0.8,
      summary: `[MOCK] Processed request for ${prompt.substring(0, 50)}...`,
      data: { processed: true, timestamp: new Date().toISOString() },
      _mock: true,
    });
  }

  // Plain text response
  return `[MOCK RESPONSE] This is a simulated response from the AI agent. In production with Ollama running, this would be a real inference result from ${DEEPSEEK_MODEL} or ${LLAMA_MODEL}.\n\nPrompt summary: ${prompt.substring(0, 100)}...\n\nNote: Install Ollama and pull models to get real AI responses.`;
}

export abstract class BaseAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly category: string;
  public readonly description: string;
  public readonly capabilities: string[];
  public readonly model: 'deepseek' | 'llama';

  protected isActive: boolean = true;
  protected taskQueue: AgentTask[] = [];
  protected currentTask: AgentTask | null = null;
  protected completedTasks: AgentTask[] = [];
  protected metrics: AgentMetricsData;
  protected health: AgentHealthData;
  protected startedAt: Date;
  protected maxQueueSize: number = 100;
  protected maxRetries: number = 3;
  protected timeoutMs: number = 300000; // 5 min — CPU inference over SSH tunnel needs more time
  protected maxCompletedTaskHistory: number = 500;

  constructor(config: {
    id: string;
    name: string;
    type: string;
    category: string;
    description: string;
    capabilities: string[];
    model: 'deepseek' | 'llama';
    maxQueueSize?: number;
    maxRetries?: number;
    timeoutMs?: number;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.category = config.category;
    this.description = config.description;
    this.capabilities = config.capabilities;
    this.model = config.model;
    this.maxQueueSize = config.maxQueueSize || 100;
    this.maxRetries = config.maxRetries || 3;
    this.timeoutMs = config.timeoutMs || 120000;
    this.startedAt = new Date();

    this.metrics = {
      tasksProcessed: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      tasksInQueue: 0,
      avgProcessingTimeMs: 0,
      totalProcessingTimeMs: 0,
      successRate: 1.0,
      uptime: 0,
      startedAt: this.startedAt,
    };

    this.health = {
      score: 1.0,
      status: 'healthy',
      lastCheck: new Date(),
      issues: [],
      modelAvailable: false,
    };
  }

  // ============================================================================
  // Abstract Methods (must implement in each agent)
  // ============================================================================

  /** Process a task — implement agent-specific logic here */
  protected abstract processTask(task: AgentTask): Promise<Record<string, any>>;

  // ============================================================================
  // Ollama Integration
  // ============================================================================

  /** Call Ollama with the agent's configured model (auto-falls back to mock when unavailable) */
  protected async callModel(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    format?: 'json';
  }): Promise<string> {
    // Check if Ollama is available; use mock if not
    const ollamaReady = await isOllamaAvailable();
    if (!ollamaReady) {
      console.log(`[${this.id}] Ollama unavailable — using mock mode`);
      // Simulate slight processing delay (100-500ms)
      await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
      return generateMockResponse(prompt, options?.format);
    }

    const modelName = this.model === 'deepseek' ? DEEPSEEK_MODEL : LLAMA_MODEL;
    const body: Record<string, any> = {
      model: modelName,
      prompt: options?.systemPrompt 
        ? `${options.systemPrompt}\n\n${prompt}` 
        : prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2000,
      },
    };

    if (options?.format === 'json') {
      body.format = 'json';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      return data.response || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Call model and parse JSON response (auto-falls back to mock when unavailable) */
  protected async callModelJSON<T = any>(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): Promise<T> {
    const raw = await this.callModel(prompt, { ...options, format: 'json' });
    try {
      // Try to extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse JSON response: ${raw.substring(0, 200)}`);
    }
  }

  // ============================================================================
  // Task Management
  // ============================================================================

  /** Submit a task to this agent */
  public async submitTask(input: Record<string, any>, priority: AgentTask['priority'] = 'normal'): Promise<AgentTask> {
    if (!this.isActive) {
      throw new Error(`Agent ${this.name} is disabled`);
    }

    if (this.taskQueue.length >= this.maxQueueSize) {
      throw new Error(`Agent ${this.name} queue is full (${this.maxQueueSize})`);
    }

    const task: AgentTask = {
      id: `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.type,
      priority,
      status: 'queued',
      input,
      agentId: this.id,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    };

    // Insert by priority
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    const insertIdx = this.taskQueue.findIndex(
      t => priorityOrder[t.priority] > priorityOrder[priority]
    );
    if (insertIdx === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIdx, 0, task);
    }

    this.metrics.tasksInQueue = this.taskQueue.length;

    // Auto-process if no current task
    if (!this.currentTask) {
      this.processNextTask();
    }

    return task;
  }

  /** Execute a task immediately (synchronous processing) */
  public async execute(input: Record<string, any>, priority: AgentTask['priority'] = 'normal'): Promise<AgentTask> {
    const task = await this.submitTask(input, priority);

    // Wait for task completion
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (task.status === 'completed' || task.status === 'failed') {
          clearInterval(checkInterval);
          resolve(task);
        }
      }, 100);

      // Timeout safety
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(task);
      }, this.timeoutMs + 5000);
    });
  }

  /** Process the next task in queue */
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0 || !this.isActive) {
      this.currentTask = null;
      return;
    }

    const task = this.taskQueue.shift()!;
    this.currentTask = task;
    task.status = 'processing';
    task.startedAt = new Date();
    this.metrics.tasksInQueue = this.taskQueue.length;

    try {
      const result = await this.processTask(task);
      task.output = result;
      task.status = 'completed';
      task.completedAt = new Date();
      task.processingTimeMs = task.completedAt.getTime() - task.startedAt!.getTime();

      this.metrics.tasksProcessed++;
      this.metrics.tasksSuccessful++;
      this.metrics.totalProcessingTimeMs += task.processingTimeMs;
      this.metrics.avgProcessingTimeMs = this.metrics.totalProcessingTimeMs / this.metrics.tasksProcessed;
      this.metrics.successRate = this.metrics.tasksSuccessful / this.metrics.tasksProcessed;
      this.metrics.lastTaskAt = task.completedAt;

    } catch (error: any) {
      task.error = error.message || 'Unknown error';

      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'queued';
        this.taskQueue.unshift(task);
        this.metrics.tasksInQueue = this.taskQueue.length;
      } else {
        task.status = 'failed';
        task.completedAt = new Date();
        task.processingTimeMs = task.completedAt.getTime() - task.startedAt!.getTime();
        this.metrics.tasksProcessed++;
        this.metrics.tasksFailed++;
        this.metrics.successRate = this.metrics.tasksSuccessful / this.metrics.tasksProcessed;
        this.metrics.lastError = error.message;
      }
    }

    // Store in completed history
    if (task.status === 'completed' || task.status === 'failed') {
      this.completedTasks.push(task);
      if (this.completedTasks.length > this.maxCompletedTaskHistory) {
        this.completedTasks.shift();
      }
    }

    this.currentTask = null;

    // Process next task
    if (this.taskQueue.length > 0 && this.isActive) {
      setTimeout(() => this.processNextTask(), 50);
    }
  }

  // ============================================================================
  // Health & Status
  // ============================================================================

  /** Check health of this agent */
  public async checkHealth(): Promise<AgentHealthData> {
    const issues: string[] = [];
    let score = 1.0;

    // Check model availability
    const ollamaReady = await isOllamaAvailable();
    if (ollamaReady) {
      try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, { 
          signal: AbortSignal.timeout(5000) 
        });
        if (response.ok) {
          const data: any = await response.json();
          const modelName = this.model === 'deepseek' ? DEEPSEEK_MODEL : LLAMA_MODEL;
          const available = data.models?.some((m: any) => m.name.includes(modelName.split(':')[0]));
          this.health.modelAvailable = !!available;
          if (!available) {
            issues.push(`Model ${modelName} not found in Ollama (mock mode available)`);
            score -= 0.15; // Less penalty since mock mode works
          }
        } else {
          this.health.modelAvailable = false;
          issues.push('Ollama API unreachable (running in mock mode)');
          score -= 0.2;
        }
      } catch {
        this.health.modelAvailable = false;
        issues.push('Ollama API connection failed (running in mock mode)');
        score -= 0.2;
      }
    } else {
      // Mock mode active — agent is still functional
      this.health.modelAvailable = false;
      issues.push('Running in MOCK mode — Ollama not connected. Install Ollama and pull models for real AI.');
      score -= 0.15; // Minor penalty, agent still works in mock mode
    }

    // Check error rate
    if (this.metrics.tasksProcessed > 0 && this.metrics.successRate < 0.8) {
      issues.push(`High error rate: ${((1 - this.metrics.successRate) * 100).toFixed(1)}%`);
      score -= 0.2;
    }

    // Check queue overflow
    if (this.taskQueue.length > this.maxQueueSize * 0.8) {
      issues.push(`Queue near capacity: ${this.taskQueue.length}/${this.maxQueueSize}`);
      score -= 0.1;
    }

    if (!this.isActive) {
      issues.push('Agent is disabled');
      score = 0;
    }

    score = Math.max(0, Math.min(1, score));

    this.health = {
      score,
      status: score >= 0.8 ? 'healthy' : score >= 0.5 ? 'degraded' : score > 0 ? 'unhealthy' : 'offline',
      lastCheck: new Date(),
      issues,
      modelAvailable: this.health.modelAvailable,
    };

    return this.health;
  }

  /** Get full agent info */
  public getInfo(): AgentInfo {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      description: this.description,
      capabilities: this.capabilities,
      model: this.model === 'deepseek' ? DEEPSEEK_MODEL : LLAMA_MODEL,
      status: !this.isActive ? 'disabled' : this.currentTask ? 'active' : this.health.score < 0.5 ? 'error' : 'idle',
      isActive: this.isActive,
      metrics: {
        ...this.metrics,
        uptime: Date.now() - this.startedAt.getTime(),
        tasksInQueue: this.taskQueue.length,
      },
      health: this.health,
      configuration: {
        maxQueueSize: this.maxQueueSize,
        maxRetries: this.maxRetries,
        timeoutMs: this.timeoutMs,
        model: this.model === 'deepseek' ? DEEPSEEK_MODEL : LLAMA_MODEL,
      },
      createdAt: this.startedAt,
      updatedAt: new Date(),
    };
  }

  /** Get current running task */
  public getCurrentTask(): AgentTask | null {
    return this.currentTask;
  }

  /** Get queued tasks */
  public getQueuedTasks(): AgentTask[] {
    return [...this.taskQueue];
  }

  /** Get completed task history */
  public getCompletedTasks(limit: number = 50, offset: number = 0): AgentTask[] {
    return this.completedTasks
      .slice()
      .reverse()
      .slice(offset, offset + limit);
  }

  /** Get all task history (completed + failed) */
  public getTaskHistory(limit: number = 50, offset: number = 0): AgentTask[] {
    return this.completedTasks
      .slice()
      .reverse()
      .slice(offset, offset + limit);
  }

  /** Enable/disable agent */
  public setActive(active: boolean): void {
    this.isActive = active;
    if (active && this.taskQueue.length > 0 && !this.currentTask) {
      this.processNextTask();
    }
  }

  /** Cancel a specific task */
  public cancelTask(taskId: string): boolean {
    const idx = this.taskQueue.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const task = this.taskQueue.splice(idx, 1)[0];
      task.status = 'cancelled';
      task.completedAt = new Date();
      this.completedTasks.push(task);
      this.metrics.tasksInQueue = this.taskQueue.length;
      return true;
    }
    return false;
  }

  /** Reset agent state and metrics */
  public reset(): void {
    this.taskQueue = [];
    this.currentTask = null;
    this.completedTasks = [];
    this.startedAt = new Date();
    this.metrics = {
      tasksProcessed: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      tasksInQueue: 0,
      avgProcessingTimeMs: 0,
      totalProcessingTimeMs: 0,
      successRate: 1.0,
      uptime: 0,
      startedAt: this.startedAt,
    };
  }
}

export default BaseAgent;
