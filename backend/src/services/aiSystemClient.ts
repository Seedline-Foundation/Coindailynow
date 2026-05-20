/**
 * AI System HTTP Client
 *
 * Thin HTTP bridge to the ai-system service (default: http://localhost:3004).
 * All heavy AI logic lives in ai-system; the backend calls it over REST.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const AI_SYSTEM_URL = process.env.AI_SYSTEM_URL || 'http://localhost:3004';
const REQUEST_TIMEOUT_MS = 120_000; // AI tasks can be slow

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!_client) {
    _client = axios.create({
      baseURL: AI_SYSTEM_URL,
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

async function post<T = unknown>(path: string, body?: unknown, opts?: AxiosRequestConfig): Promise<T> {
  const res = await getClient().post<T>(path, body, opts);
  return res.data;
}

async function get<T = unknown>(path: string, opts?: AxiosRequestConfig): Promise<T> {
  const res = await getClient().get<T>(path, opts);
  return res.data;
}

// ---------------------------------------------------------------------------
// API methods – match the ai-system REST surface
// ---------------------------------------------------------------------------

export interface SubmitArticlePayload {
  topic: string;
  context?: Record<string, unknown>;
  priority?: string;
}

export interface QueueItem {
  id: string;
  articleId: string;
  status: string;
  submittedAt: string;
  [key: string]: unknown;
}

export interface ApproveArticlePayload {
  adminId: string;
  adminNotes?: string;
}

export interface PipelineStatus {
  running: boolean;
  pendingCount: number;
  lastRunAt: string | null;
  [key: string]: unknown;
}

/** Submit a new article to the AI content pipeline. */
export async function submitArticle(payload: SubmitArticlePayload): Promise<{ id: string; status: string }> {
  return post('/api/pipeline/submit', payload);
}

/** Retrieve items currently in the AI admin queue. */
export async function getQueueItems(): Promise<QueueItem[]> {
  return get('/api/pipeline/queue');
}

/** Mark an article as approved in the AI admin queue. */
export async function approveArticle(queueItemId: string, payload: ApproveArticlePayload): Promise<{ success: boolean }> {
  return post(`/api/pipeline/queue/${queueItemId}/approve`, payload);
}

/** Get the current status of the AI editorial pipeline. */
export async function getPipelineStatus(): Promise<PipelineStatus> {
  return get('/api/pipeline/status');
}

// ---------------------------------------------------------------------------
// Agent-proxy helpers – used by the thin wrapper agents
// ---------------------------------------------------------------------------

export async function proxyContentGeneration(task: Record<string, unknown>): Promise<unknown> {
  return post('/api/agents/content-generation/process', task);
}

export async function proxyMarketAnalysis(task: Record<string, unknown>): Promise<unknown> {
  return post('/api/agents/market-analysis/process', task);
}

export async function proxyQualityReview(task: Record<string, unknown>): Promise<unknown> {
  return post('/api/agents/quality-review/process', task);
}

export async function proxyTranslation(task: Record<string, unknown>): Promise<unknown> {
  return post('/api/agents/translation/process', task);
}

export async function proxyDeepSeekAnalysis(task: Record<string, unknown>): Promise<unknown> {
  return post('/api/agents/deepseek-analysis/process', task);
}

// ---------------------------------------------------------------------------
// Re-export for convenience
// ---------------------------------------------------------------------------

export const aiSystemClient = {
  submitArticle,
  getQueueItems,
  approveArticle,
  getPipelineStatus,
  proxyContentGeneration,
  proxyMarketAnalysis,
  proxyQualityReview,
  proxyTranslation,
  proxyDeepSeekAnalysis,
  getClient,
};

export default aiSystemClient;
