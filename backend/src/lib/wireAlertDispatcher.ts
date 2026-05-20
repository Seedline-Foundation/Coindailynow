/**
 * Dispatch CoinDaily Wire notifications to subscribers (email / Telegram).
 * Subscribers are stored at wire:alert:email:* and wire:alert:tg:*; INDEX_KEY tracks active keys.
 */
import axios from 'axios';
import { getRedis } from './redis';
import { logger } from '../utils/logger';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

  const text = `New on CoinDaily Wire: ${item.headline}\n${item.company ? `Company: ${item.company}\n` : ''}Published: ${item.publishedAt}\n\nView: https://press.coindaily.online/wire/${item.id}`;

  const itemUrl = `https://press.coindaily.online/wire/${item.id}`;
  const html = `
    <!DOCTYPE html>
    <html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0d1117;color:#e6edf3;">
      <div style="max-width:600px;margin:0 auto;padding:24px;background:#161b22;border:1px solid #30363d;border-radius:8px;">
        <p style="margin:0 0 8px 0;color:#7d8590;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">CoinDaily Wire · ${
          item.region || 'Global'
        }${item.category ? ` · ${item.category}` : ''}</p>
        <h2 style="margin:0 0 16px 0;color:#f0f6fc;font-size:18px;line-height:1.35;">${escapeHtml(item.headline)}</h2>
        <table style="width:100%;font-size:13px;color:#8b949e;border-collapse:collapse;">
          ${item.company ? `<tr><td style="padding:4px 0;width:100px;">Company</td><td style="padding:4px 0;color:#e6edf3;">${escapeHtml(item.company)}</td></tr>` : ''}
          <tr><td style="padding:4px 0;width:100px;">Published</td><td style="padding:4px 0;color:#e6edf3;">${escapeHtml(item.publishedAt)}</td></tr>
        </table>
        <a href="${itemUrl}" style="display:inline-block;margin-top:20px;padding:10px 18px;background:#f97316;color:#0d1117;font-weight:600;text-decoration:none;border-radius:6px;font-size:13px;">Read full release →</a>
        <p style="margin-top:24px;font-size:11px;color:#6e7681;line-height:1.5;">
          You are subscribed to CoinDaily Wire alerts.
          <a href="https://press.coindaily.online/wire/unsubscribe" style="color:#7d8590;">Unsubscribe</a>.
        </p>
      </div>
    </body></html>
  `;

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
                HtmlBody: html,
                TextBody: text,
                MessageStream: process.env.POSTMARK_WIRE_STREAM || 'outbound',
              },
              { headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN } },
            )
            .catch((e) => logger.warn('[wire-alerts] Postmark fail', { email, message: e?.message }));
        }
      } else if (key.startsWith('wire:alert:tg:')) {
        const chatId = key.replace('wire:alert:tg:', '');
        if (process.env.TELEGRAM_BOT_TOKEN) {
          await axios
            .post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
              disable_web_page_preview: false,
            })
            .catch((e) => logger.warn('[wire-alerts] Telegram fail', { chatId, message: e?.message }));
        }
      }
    } catch (e: any) {
      logger.warn('[wire-alerts] notify failed for key', { key, message: e?.message });
    }
  }
}
