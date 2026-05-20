import { Pool, PoolClient, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';

class Database {
  private pool: Pool;
  private static instance: Database;
  private _connected = false;

  private constructor() {
    // CFIS now lives on the same self-hosted Postgres cluster as the rest of
    // the stack (Contabo + TimescaleDB) so backups, network policy, and SLAs
    // are unified. We still accept the legacy Supabase URL during migration:
    // when DATABASE_URL points at supabase.co we keep the SSL relaxation,
    // otherwise we honour DB_SSL=true for self-hosted deployments behind a
    // public reverse proxy and skip SSL on the docker-compose internal net.
    const connectionString = process.env.DATABASE_URL;
    const useSslEnv = process.env.DB_SSL === 'true' || process.env.PGSSL === 'true';

    if (connectionString) {
      const isSupabase = connectionString.includes('supabase');
      const isLocal =
        connectionString.includes('@cfis-postgres') ||
        connectionString.includes('@localhost') ||
        connectionString.includes('@127.0.0.1');

      this.pool = new Pool({
        connectionString,
        ssl:
          isSupabase || (useSslEnv && !isLocal)
            ? { rejectUnauthorized: false }
            : undefined,
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      const banner = isSupabase
        ? '[CFIS DB] DATABASE_URL points at Supabase (legacy). Plan migration per documentations/launch/CFIS_DB_MIGRATION.md'
        : '[CFIS DB] Using DATABASE_URL (self-hosted)';
      console.log(banner);
    } else {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'cfis-postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'cfis',
        password: process.env.DB_PASSWORD || 'cfis_dev_password',
        database: process.env.DB_NAME || 'cfis_db',
        ssl: useSslEnv ? { rejectUnauthorized: false } : undefined,
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log('[CFIS DB] Using individual connection params (self-hosted default)');
    }

    this.pool.on('error', (err) => {
      console.error('[CFIS DB] Unexpected pool error:', err.message);
      this._connected = false;
    });

    // Test connection on startup (non-blocking)
    this.pool.query('SELECT 1').then(() => {
      this._connected = true;
      console.log('[CFIS DB] ✅ Connected to Postgres');
    }).catch(err => {
      this._connected = false;
      console.warn('[CFIS DB] ⚠ Database not reachable:', err.message);
      console.warn('[CFIS DB] Dashboard will work but DB-dependent features will fail until DB is provisioned.');
    });
  }

  get isConnected(): boolean {
    return this._connected;
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 500) {
        console.warn(`[CFIS DB] Slow query (${duration}ms):`, text.substring(0, 100));
      }
      return result;
    } catch (error: any) {
      console.error('[CFIS DB] Query error:', error.message, '\nQuery:', text.substring(0, 200));
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  generateId(): string {
    return uuidv4();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = Database.getInstance();
export default db;
