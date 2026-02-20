import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { redis } from '../api/context';

type ApiKeyRecord = {
  id: string;
  keyHash: string;
  name: string;
  tier: string;
  rateLimit: number;
  allowedEndpoints: string; // JSON array
  isActive: boolean;
  expiresAt: Date | null;
  userId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyRecord;
    }
  }
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function parseAllowedEndpoints(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map(String);
    return ['*'];
  } catch {
    return ['*'];
  }
}

function isEndpointAllowed(allowed: string[], endpointPath: string): boolean {
  if (allowed.includes('*')) return true;
  // Support exact match and prefix match ("/api/v1/prices" allows "/api/v1/prices/BTC")
  return allowed.some(rule => {
    const normalized = String(rule || '').trim();
    if (!normalized) return false;
    if (endpointPath === normalized) return true;
    return endpointPath.startsWith(normalized.endsWith('/') ? normalized : normalized + '/');
  });
}

async function getApiKeyRecord(apiKey: string): Promise<ApiKeyRecord | null> {
  const keyHash = sha256(apiKey);
  const cacheKey = `apikey:${keyHash}`;

  // Redis cache (5 minutes)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as ApiKeyRecord;
  } catch {
    // ignore cache failures
  }

  const record = await (prisma as any).aPIKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      keyHash: true,
      name: true,
      tier: true,
      rateLimit: true,
      allowedEndpoints: true,
      isActive: true,
      expiresAt: true,
      userId: true,
    },
  });

  if (!record) return null;
  if (!record.isActive) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;

  try {
    await redis.setex(cacheKey, 300, JSON.stringify(record));
  } catch {
    // ignore cache failures
  }

  return record as ApiKeyRecord;
}

async function enforcePerKeyRateLimit(record: ApiKeyRecord): Promise<{ allowed: boolean; retryAfterSec?: number }>{
  // rateLimit is "requests per hour" in our APIKey model
  const maxPerHour = Math.max(1, Number(record.rateLimit) || 100);
  const windowSec = 60 * 60;
  const bucketKey = `apikey_rl:${record.id}:${Math.floor(Date.now() / (windowSec * 1000))}`;

  try {
    const count = await redis.incr(bucketKey);
    if (count === 1) {
      await redis.expire(bucketKey, windowSec);
    }

    if (count > maxPerHour) {
      const ttl = await redis.ttl(bucketKey);
      return { allowed: false, retryAfterSec: ttl > 0 ? ttl : windowSec };
    }
    return { allowed: true };
  } catch {
    // If Redis is down, fail open
    return { allowed: true };
  }
}

export async function optionalApiKey(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);
  if (!apiKey) return next();

  try {
    const record = await getApiKeyRecord(apiKey);
    if (record) req.apiKey = record;
  } catch {
    // ignore
  }
  next();
}

export function requireApiKey(options?: { allowedEndpoints?: string[] }) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);
    if (!apiKey) {
      res.status(401).json({
        error: {
          code: 'API_KEY_REQUIRED',
          message: 'API key required (X-API-Key header or api_key query param)',
        }
      });
      return;
    }

    const record = await getApiKeyRecord(apiKey);
    if (!record) {
      res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key',
        }
      });
      return;
    }

    const allowedFromRecord = parseAllowedEndpoints(record.allowedEndpoints);
    const endpointPath = req.baseUrl + req.path;
    const allowed = options?.allowedEndpoints ?? allowedFromRecord;
    if (!isEndpointAllowed(allowed, endpointPath)) {
      res.status(403).json({
        error: {
          code: 'ENDPOINT_NOT_ALLOWED',
          message: 'API key not permitted for this endpoint',
        }
      });
      return;
    }

    const rl = await enforcePerKeyRateLimit(record);
    if (!rl.allowed) {
      if (rl.retryAfterSec) res.setHeader('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({
        error: {
          code: 'API_KEY_RATE_LIMIT',
          message: 'API key rate limit exceeded',
        }
      });
      return;
    }

    req.apiKey = record;
    next();
  };
}
