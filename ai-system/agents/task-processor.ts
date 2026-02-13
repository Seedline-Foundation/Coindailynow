/**
 * Minimal AI Task Processor for MVP
 * Processes queued AI tasks from database
 * Uses local Ollama models (llama3.1:8b for content, deepseek-r1:8b for reasoning)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Local Ollama endpoint
const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const LLAMA_MODEL = 'llama3.1:8b';
const DEEPSEEK_MODEL = 'deepseek-r1:8b';

interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Call Ollama API
 */
async function callOllama(model: string, prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response || '';
}

/**
 * Process research tasks using DeepSeek for reasoning
 */
async function processResearchTask(inputData: any): Promise<TaskResult> {
  try {
    const { topic } = JSON.parse(inputData);
    
    const prompt = `You are a cryptocurrency research analyst. Provide comprehensive, factual research.

Research the following crypto topic and provide a structured summary:
Topic: ${topic}

Provide your response as JSON with this structure:
{
  "summary": "your research summary here",
  "keywords": ["keyword1", "keyword2"],
  "sentiment": "bullish" | "neutral" | "bearish",
  "confidence": 0.85
}`;

    const response = await callOllama(DEEPSEEK_MODEL, prompt);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        data: {
          summary: data.summary || response,
          sources: ['Local AI Research'],
          keywords: data.keywords || [topic],
          sentiment: data.sentiment || 'neutral',
          confidence: data.confidence || 0.85
        }
      };
    }

    return {
      success: true,
      data: {
        summary: response,
        sources: ['Local AI Research'],
        keywords: [topic],
        sentiment: 'neutral',
        confidence: 0.85
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Research failed'
    };
  }
}

/**
 * Process quality review tasks using DeepSeek
 */
async function processQualityReview(inputData: any): Promise<TaskResult> {
  try {
    const research = JSON.parse(inputData);
    
    const prompt = `You are a content quality reviewer. Score content from 0-1 for quality, accuracy, and relevance.

Review this research summary and provide a quality score (0-1) with brief feedback:

${JSON.stringify(research)}

Respond with ONLY a JSON object:
{"score": 0.85, "feedback": "your feedback here", "issues": []}`;

    const response = await callOllama(DEEPSEEK_MODEL, prompt);
    
    // Extract score from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    let qualityScore = 0.75;
    let feedback = response;
    let issues: string[] = [];

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        qualityScore = data.score || 0.75;
        feedback = data.feedback || response;
        issues = data.issues || [];
      } catch {}
    } else {
      const scoreMatch = response.match(/(\d\.\d+)/);
      if (scoreMatch) {
        qualityScore = parseFloat(scoreMatch[1]);
      }
    }

    return {
      success: true,
      data: {
        qualityScore: Math.min(1, Math.max(0, qualityScore)),
        feedback,
        approved: qualityScore >= 0.7,
        issues
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Quality review failed'
    };
  }
}

/**
 * Process content generation tasks using Llama 3.1
 */
async function processContentGeneration(inputData: any): Promise<TaskResult> {
  try {
    const { research, requirements } = JSON.parse(inputData);
    const minLength = requirements?.minLength || 800;
    const maxLength = requirements?.maxLength || 1500;
    
    const prompt = `You are an expert cryptocurrency journalist writing for African audiences. Write engaging, accurate news articles.

Write a ${minLength}-${maxLength} word news article based on this research:

${JSON.stringify(research)}

Respond with ONLY a JSON object:
{
  "title": "article title",
  "excerpt": "2-3 sentence excerpt",
  "content": "full article content in markdown",
  "tags": ["tag1", "tag2"],
  "categoryId": "category"
}`;

    const response = await callOllama(LLAMA_MODEL, prompt);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const article = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        data: {
          title: article.title || 'Untitled Article',
          excerpt: article.excerpt || article.content?.substring(0, 200) || '',
          content: article.content || '',
          tags: article.tags || ['crypto', 'news'],
          categoryId: article.categoryId || 'general'
        }
      };
    }

    // Fallback if no valid JSON
    return {
      success: true,
      data: {
        title: 'Generated Article',
        excerpt: response.substring(0, 200),
        content: response,
        tags: ['crypto', 'news'],
        categoryId: 'general'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content generation failed'
    };
  }
}

/**
 * Main task processor loop
 */
export async function processNextTask(): Promise<boolean> {
  const task = await prisma.aITask.findFirst({
    where: { status: 'QUEUED' },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  if (!task) return false;

  // Mark as processing
  await prisma.aITask.update({
    where: { id: task.id },
    data: {
      status: 'PROCESSING',
      startedAt: new Date()
    }
  });

  let result: TaskResult;

  try {
    // Route to appropriate processor
    switch (task.taskType) {
      case 'trending_research':
        result = await processResearchTask(task.inputData || '{}');
        break;
      case 'quality_review':
        result = await processQualityReview(task.inputData || '{}');
        break;
      case 'content_generation':
        result = await processContentGeneration(task.inputData || '{}');
        break;
      default:
        result = { success: false, error: `Unknown task type: ${task.taskType}` };
    }

    // Update task with result
    await prisma.aITask.update({
      where: { id: task.id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        outputData: JSON.stringify(result.data),
        errorMessage: result.error,
        completedAt: new Date(),
        processingTimeMs: Date.now() - (task.startedAt?.getTime() || Date.now())
      }
    });

    return true;
  } catch (error) {
    // Handle processing error
    await prisma.aITask.update({
      where: { id: task.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    });
    return false;
  }
}

/**
 * Start continuous processing
 */
export async function startTaskProcessor() {
  console.log('🤖 AI Task Processor started');
  
  while (true) {
    try {
      const processed = await processNextTask();
      if (!processed) {
        // No tasks, wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Task processor error:', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Auto-start if run directly
if (require.main === module) {
  startTaskProcessor().catch(console.error);
}
