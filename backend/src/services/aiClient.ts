/**
 * AI Client Service
 * Unified AI interface using self-hosted open-source models
 * 
 * Models:
 * - Ollama Llama 3.1:8b (port 11434) - Article writing, optimization
 * - Ollama DeepSeek R1:8b (port 11434) - Reasoning, review, SEO
 * - NLLB-200 (port 8080) - Translation
 * - SDXL (port 7860) - Image generation
 * - BGE Embeddings (port 8081) - RAG embeddings
 */

import { sanitisePromptInput } from '../middleware/promptInjectionGuard';

// Model configurations
export const AI_MODELS = {
  LLAMA: 'llama3.1:8b',
  DEEPSEEK: 'deepseek-r1:8b',
  NLLB: 'facebook/nllb-200-distilled-600M',
  SDXL: 'stabilityai/stable-diffusion-xl-base-1.0',
  EMBEDDINGS: 'BAAI/bge-small-en-v1.5'
} as const;

// Service endpoints
export const AI_ENDPOINTS = {
  OLLAMA: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  NLLB: process.env.NLLB_API_URL || 'http://localhost:8080',
  SDXL: process.env.SDXL_API_URL || 'http://localhost:7860',
  EMBEDDINGS: process.env.EMBEDDINGS_API_URL || 'http://localhost:8081'
} as const;

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useReasoning?: boolean;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: 'ollama';
  tokensUsed?: number;
  reasoning?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_ENDPOINTS.OLLAMA}/api/tags`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get list of available models in Ollama
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${AI_ENDPOINTS.OLLAMA}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch {
    return [];
  }
}

/**
 * Complete a prompt using Ollama
 */
async function ollamaComplete(
  prompt: string,
  options: AICompletionOptions = {}
): Promise<AICompletionResponse> {
  const model = options.model || AI_MODELS.LLAMA;
  
  // Sanitise prompt to prevent injection attacks
  const safePrompt = sanitisePromptInput(prompt);

  // Build the full prompt with system message if provided
  let fullPrompt = safePrompt;
  if (options.systemPrompt) {
    fullPrompt = `<|system|>\n${options.systemPrompt}\n<|end|>\n<|user|>\n${safePrompt}\n<|end|>\n<|assistant|>`;
  }

  const response = await fetch(`${AI_ENDPOINTS.OLLAMA}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 2048
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.response || '',
    model,
    provider: 'ollama'
  };
}

/**
 * Complete a chat using Ollama (for multi-turn conversations)
 */
async function ollamaChatComplete(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: AICompletionOptions = {}
): Promise<AICompletionResponse> {
  const model = options.model || AI_MODELS.LLAMA;

  // Sanitise user messages to prevent prompt injection
  const safeMessages = messages.map(m => ({
    ...m,
    content: m.role === 'user' ? sanitisePromptInput(m.content) : m.content,
  }));

  const response = await fetch(`${AI_ENDPOINTS.OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: safeMessages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 2048
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.message?.content || '',
    model,
    provider: 'ollama'
  };
}

/**
 * Main AI completion function using Ollama Llama 3.1
 * Use for article writing, headline optimization, general content
 */
export async function complete(
  prompt: string,
  options: AICompletionOptions = {}
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await chatComplete(messages, { ...options, model: options.model || AI_MODELS.LLAMA });
  return response.content;
}

/**
 * Chat completion with message history using Ollama
 */
export async function chatComplete(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: AICompletionOptions = {}
): Promise<AICompletionResponse> {
  try {
    return await ollamaChatComplete(messages, options);
  } catch (error) {
    throw new Error(`AI completion failed: ${error}`);
  }
}

/**
 * Reasoning completion using DeepSeek R1
 * Use for SEO analysis, quality review, research, complex reasoning
 */
export async function reasoningComplete(
  prompt: string,
  options: Omit<AICompletionOptions, 'model'> = {}
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  
  // DeepSeek R1 reasoning system prompt
  const reasoningSystemPrompt = options.systemPrompt || 
    `You are a reasoning assistant. Think step by step and provide detailed analysis.
Before giving your final answer, show your reasoning process.`;
  
  messages.push({ role: 'system', content: reasoningSystemPrompt });
  messages.push({ role: 'user', content: prompt });

  const response = await chatComplete(messages, { 
    ...options, 
    model: AI_MODELS.DEEPSEEK,
    temperature: options.temperature ?? 0.3 // Lower temp for reasoning
  });
  
  return response.content;
}

/**
 * Generate embeddings using BGE model
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  const response = await fetch(`${AI_ENDPOINTS.EMBEDDINGS}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(`Embeddings error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding || data.embeddings || [];
}

/**
 * Generate image using SDXL
 */
export async function generateImage(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    steps?: number;
    negativePrompt?: string;
  } = {}
): Promise<{ image: string; seed: number }> {
  const response = await fetch(`${AI_ENDPOINTS.SDXL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      negative_prompt: options.negativePrompt || 'blurry, low quality, distorted',
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 30
    })
  });

  if (!response.ok) {
    throw new Error(`SDXL error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    image: data.image || data.images?.[0] || '',
    seed: data.seed || 0
  };
}

/**
 * Translate text using NLLB-200
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const response = await fetch(`${AI_ENDPOINTS.NLLB}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source_lang: sourceLang,
      target_lang: targetLang
    })
  });

  if (!response.ok) {
    throw new Error(`NLLB error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.translated_text || data.translation || '';
}

/**
 * Get the AI client configuration
 */
export function getAIConfig() {
  return {
    models: AI_MODELS,
    endpoints: AI_ENDPOINTS,
    defaultModel: AI_MODELS.LLAMA,
    reasoningModel: AI_MODELS.DEEPSEEK
  };
}

// Export for backward compatibility
export const aiClient = {
  complete,
  chatComplete,
  reasoningComplete,
  generateEmbeddings,
  generateImage,
  translateText,
  isOllamaAvailable,
  getAvailableModels,
  getAIConfig
};

export default aiClient;
