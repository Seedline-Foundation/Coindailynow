/**
 * Dispatch CoinDaily Wire notifications to subscribers (email / Telegram).
 * Subscribers are stored at wire:alert:email:* and wire:alert:tg:*; INDEX_KEY tracks active keys.
 */
import axios from 'axios';
import { getRedis } from './redis';
import { logger } from '../utils/logger';

const INDEX_KEY = 'wire:alert:index';

export async function registerWireAlertKey(key: string): Promise<void> {
  try {
    await getRedis().sadd(INDEX_KEY, key);
  } catch (e: any) {
    logger.warn('[wire-alerts] register index failed', { message: e?.message });
  }
}

export async function unregisterWireAlertKey(key: string): Promise<void> {
  try {
    await getRedis().srem(INDEX_KEY, key);
  } catch {
    /* noop */
  }
}

export type WireAlertPayload = {
  id: string;
  headline: string;
  company?: string;
  publishedAt: string;
  region?: string;
  category?: string;
};

export async function notifyWireSubscribers(item: WireAlertPayload): Promise<void> {
  const redis = getRedis();
  let keys: string[] = [];
  try {
    keys = await redis.smembers(INDEX_KEY);
  } catch {
    return;
  }

  const text = `New on CoinDaily Wire: ${item.headline}\n${item.company ? `Company: ${item.company}\n` : ''}Published: ${item.publishedAt}`;

  for (const key of keys) {
    try {
      const raw = await redis.get(key);
      if (!raw) {
        await redis.srem(INDEX_KEY, key);
        continue;
      }
      let sources: string[] = [];
      try {
        sources = JSON.parse(raw).sources || [];
      } catch {
        sources = [];
      }
      if (sources.length > 0) {
        const cat = (item.category || '').toLowerCase();
        const ok = sources.some((s) => cat.includes(String(s).toLowerCase()) || String(s).toLowerCase() === 'all');
        if (!ok) continue;
      }

      if (key.startsWith('wire:alert:email:')) {
        const email = key.replace('wire:alert:email:', '');
        if (process.env.POSTMARK_SERVER_TOKEN) {
          await axios
            .post(
              'https://api.postmarkapp.com/email',
              {
                From: process.env.WIRE_ALERT_FROM || 'wire@coindaily.online',
                To: email,
                Subject: `Wire: ${item.headline.slice(0, 80)}`,
                TextBody: text,
              },
              { headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN } },
            )
            .catch(() => undefined);
        }
      } else if (key.startsWith('wire:alert:tg:')) {
        const chatId = key.replace('wire:alert:tg:', '');
        if (process.env.TELEGRAM_BOT_TOKEN) {
          await axios
            .post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: chatId,
              text,
            })
            .catch(() => undefined);
        }
      }
    } catch (e: any) {
      logger.warn('[wire-alerts] notify failed for key', { key, message: e?.message });
    }
  }
}
