/**
 * Redis-backed JWT access-token revocation (jti denylist).
 */

import { logger } from '../utils/logger';
import { getRedis } from '../lib/redis';

const PREFIX = 'jwt:revoked:';
const USER_PREFIX = 'jwt:revoked:user:';

/** TTL matches access token max life (15m) + buffer */
function accessTokenTtlSeconds(): number {
  return 16 * 60;
}

export async function revokeAccessTokenJti(jti: string): Promise<void> {
  if (!jti) return;
  try {
    await getRedis().setex(`${PREFIX}${jti}`, accessTokenTtlSeconds(), '1');
  } catch (e: any) {
    logger.warn('[TokenRevocation] revoke jti failed', { error: e.message });
  }
}

export async function isAccessTokenJtiRevoked(jti: string): Promise<boolean> {
  if (!jti) return false;
  try {
    const v = await getRedis().get(`${PREFIX}${jti}`);
    return v === '1';
  } catch {
    return false;
  }
}

/** Revoke all access tokens issued before this timestamp for a user (logout-all). */
export async function revokeAllAccessTokensForUser(userId: string): Promise<void> {
  try {
    await getRedis().setex(
      `${USER_PREFIX}${userId}`,
      7 * 24 * 60 * 60,
      String(Date.now()),
    );
  } catch (e: any) {
    logger.warn('[TokenRevocation] revoke user failed', { error: e.message });
  }
}

export async function isUserAccessTokenRevoked(userId: string, issuedAtSec: number): Promise<boolean> {
  try {
    const since = await getRedis().get(`${USER_PREFIX}${userId}`);
    if (!since) return false;
    return issuedAtSec * 1000 <= parseInt(since, 10);
  } catch {
    return false;
  }
}
