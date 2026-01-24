/**
 * Minimal AI Task Processor for MVP
 * Processes queued AI tasks from database
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Process research tasks
 */
async function processResearchTask(inputData: any): Promise<TaskResult> {
  try {
    const { topic, sources } = JSON.parse(inputData);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are a cryptocurrency research analyst. Provide comprehensive, factual research.'
      }, {
        role: 'user',
        content: `Research the following crypto topic and provide a structured summary with sources: ${topic}`
      }],
      temperature: 0.7,
    });

    return {
      success: true,
      data: {
        summary: completion.choices[0].message.content,
        sources: ['OpenAI Research'],
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
 * Process quality review tasks
 */
async function processQualityReview(inputData: any): Promise<TaskResult> {
  try {
    const research = JSON.parse(inputData);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are a content quality reviewer. Score content from 0-1 for quality, accuracy, and relevance.'
      }, {
        role: 'user',
        content: `Review this research summary and provide a quality score (0-1) with brief feedback:\n\n${JSON.stringify(research)}`
      }],
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content || '';
    const scoreMatch = response.match(/(\d\.\d+)/);
    const qualityScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0.75;

    return {
      success: true,
      data: {
        qualityScore: Math.min(1, Math.max(0, qualityScore)),
        feedback: response,
        approved: qualityScore >= 0.7,
        issues: []
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
 * Process content generation tasks
 */
async function processContentGeneration(inputData: any): Promise<TaskResult> {
  try {
    const { research, review, requirements } = JSON.parse(inputData);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are an expert cryptocurrency journalist writing for African audiences. Write engaging, accurate news articles.'
      }, {
        role: 'user',
        content: `Write a ${requirements?.minLength || 800}-${requirements?.maxLength || 1500} word news article based on this research:\n\n${JSON.stringify(research)}\n\nFormat as JSON with: title, excerpt, content, tags, categoryId`
      }],
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content || '{}';
    const article = JSON.parse(response);

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
  // Find first queued task ordered by priority and creation time
  const { data: tasks, error: fetchError } = await supabase
    .from('AITask')
    .select('*')
    .eq('status', 'QUEUED')
    .order('priority', { ascending: false })
    .order('createdAt', { ascending: true })
    .limit(1);

  if (fetchError) {
    console.error('Error fetching task:', fetchError);
    return false;
  }

  if (!tasks || tasks.length === 0) return false;
  
  const task = tasks[0];

  // Mark as processing
  const { error: updateError } = await supabase
    .from('AITask')
    .update({
      status: 'PROCESSING',
      startedAt: new Date().toISOString()
    })
    .eq('id', task.id);

  if (updateError) {
    console.error('Error updating task status:', updateError);
    return false;
  }

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
    const processingTimeMs = Date.now() - (task.startedAt ? new Date(task.startedAt).getTime() : Date.now());
    
    const { error: resultError } = await supabase
      .from('AITask')
      .update({
        status: result.success ? 'COMPLETED' : 'FAILED',
        outputData: JSON.stringify(result.data),
        errorMessage: result.error,
        processingTimeMs,
        completedAt: new Date().toISOString()
      })
      .eq('id', task.id);

    return true;
  } catch (error) {
    // Handle processing error
    const processingTimeMs = Date.now() - (task.startedAt ? new Date(task.startedAt).getTime() : Date.now());

    const { error: errorUpdateError } = await supabase
      .from('AITask')
      .update({
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs,
        completedAt: new Date().toISOString()
      })
      .eq('id', task.id);

    if (errorUpdateError) {
      console.error('Error updating task with error:', errorUpdateError);
    }

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
