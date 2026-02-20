/**
 * Admin API Client
 * Connects to the CoinDaily backend for real-time data
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiRequest<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

// GraphQL helper
async function graphqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();
  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL error');
  }
  return data.data;
}

// ========================
// STATS
// ========================

export async function fetchPlatformStats() {
  return apiRequest('/api/super-admin/stats');
}

// ========================
// USERS
// ========================

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export async function fetchUsers(filters: UserFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.role && filters.role !== 'all') params.set('role', filters.role);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  
  return apiRequest(`/api/super-admin/users?${params.toString()}`);
}

export async function updateUser(id: string, data: { status?: string; role?: string }) {
  return apiRequest(`/api/super-admin/users/${id}`, { method: 'PATCH', body: data });
}

// ========================
// ARTICLES / CONTENT
// ========================

export interface ArticleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export async function fetchArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);

  return apiRequest(`/api/super-admin/articles?${params.toString()}`);
}

export async function updateArticle(id: string, data: { status?: string }) {
  return apiRequest(`/api/super-admin/articles/${id}`, { method: 'PATCH', body: data });
}

// ========================
// AI AGENTS & TASKS
// ========================

export async function fetchAIAgents() {
  return apiRequest('/api/super-admin/ai-agents');
}

export async function fetchAITasks(limit: number = 20, status?: string) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (status) params.set('status', status);
  return apiRequest(`/api/super-admin/ai-tasks?${params.toString()}`);
}

// ========================
// ALERTS
// ========================

export async function fetchAlerts() {
  return apiRequest('/api/super-admin/alerts');
}

// ========================
// AI SYSTEM HEALTH
// ========================

export async function fetchAIHealth(aiUrl?: string) {
  const url = aiUrl || process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:3004';
  try {
    const res = await fetch(`${url}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return res.json();
  } catch {
    return { status: 'offline', services: [] };
  }
}

// ========================
// AUTH
// ========================

export async function loginAdmin(email: string, password: string) {
  return graphqlRequest(`
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        user {
          id
          email
          role
          profile {
            firstName
            lastName
          }
        }
        tokens {
          accessToken
          refreshToken
        }
        error {
          code
          message
        }
      }
    }
  `, {
    input: { email, password }
  });
}

export async function verifyAdmin() {
  return apiRequest('/api/auth/admin/verify');
}
