/// <reference types="node" />
import { env } from 'node:process';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Singleton pattern for Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create Supabase client instance
 * Uses connection pooling for optimal performance
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY'
    );
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // Server-side doesn't need session persistence
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'coindaily-backend',
      },
    },
  });

  return supabaseInstance;
}

/**
 * Admin client with service role key for privileged operations
 * WARNING: Use only for admin/system operations
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Execute a function with Supabase client
 * Provides consistent error handling and connection management
 */
export async function withSupabase<T>(
  fn: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const client = getSupabaseClient();
  try {
    return await fn(client);
  } catch (error) {
    console.error('Supabase operation failed:', error);
    throw error;
  }
}

/**
 * Execute raw SQL query
 * Use this for complex queries not supported by query builder
 */
export async function executeRawQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const client = getSupabaseClient();
  const rpcPayload = {
    query,
    params: params ?? [],
  } as Record<string, unknown>;

  const { data, error } = await (client as SupabaseClient<any>).rpc('execute_sql', rpcPayload);

  if (error) {
    throw new Error(`SQL query failed: ${error.message}`);
  }

  return data as T[];
}

// Export Supabase client type for use across the application
export type SupabaseClientType = SupabaseClient<Database>;

// Default export
export default getSupabaseClient;
