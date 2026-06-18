import axios from 'axios';
import { logger } from '../utils/logger';
import emailService from './emailService';

// ─── Types ───────────────────────────────────────────────────

export interface WireAlertSubscriptionInput {
  email: string;
  telegramChatId?: string;
  filters?: string[];
}

export interface PressReleasePayload {
  id: string;
  title: string;
  summary: string;
  slug?: string;
  category?: string;
  region?: string;
  company?: string;
  publishedAt: string;
}

// ─── Subscription management (Prisma-backed) ────────────────

export async function subscribe(
  prisma: any,
  input: WireAlertSubscriptionInput,
): Promise<{ id: string }> {
  const subscription = await prisma.wireAlertSubscription.upsert({
    where: { email: input.email },
    update: {
      telegramChatId: input.telegramChatId ?? undefined,
      filters: input.filters ? JSON.stringify(input.filters) : undefined,
      active: true,
    },
    create: {
      email: input.email,
      telegramChatId: input.telegramChatId || null,
      filters: input.filters ? JSON.stringify(input.filters) : null,
      active: true,
    },
  });
  return { id: subscription.id };
}

export async function unsubscribe(prisma: any, email: string): Promise<void> {
  await prisma.wireAlertSubscription
    .update({ where: { email }, data: { active: false } })
    .catch(() => {
      /* no subscription for that email — nothing to do */
    });
}

// ─── Email delivery ──────────────────────────────────────────

export async function sendEmailAlert(
  email: string,
  pr: PressReleasePayload,
): Promise<boolean> {
  const siteUrl = process.env.SITE_URL || 'https://sygn.live';
  const pressUrl = pr.slug ? `${siteUrl}/press/${pr.slug}` : siteUrl;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a2e;">New on CoinDaily Wire</h2>
      <h3 style="margin:4px 0;">${escapeHtml(pr.title)}</h3>
      <p style="color:#555;">${escapeHtml(pr.summary)}</p>
      ${pr.company ? `<p><strong>Company:</strong> ${escapeHtml(pr.company)}</p>` : ''}
      <p><strong>Published:</strong> ${new Date(pr.publishedAt).toUTCString()}</p>
      <a href="${pressUrl}" style="display:inline-block;padding:10px 24px;background:#667eea;color:#fff;text-decoration:none;border-radius:4px;">Read Full Release</a>
      <hr style="margin-top:24px;border:none;border-top:1px solid #ddd;" />
      <p style="font-size:12px;color:#888;">You are receiving this because you subscribed to CoinDaily Wire alerts.</p>
    </div>
  `;

  const textBody = [
    `New on CoinDaily Wire: ${pr.title}`,
    pr.company ? `Company: ${pr.company}` : '',
    `Summary: ${pr.summary}`,
    `Published: ${pr.publishedAt}`,
    `Read more: ${pressUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const sent = await emailService.sendEmail({
    to: email,
    subject: `Wire: ${pr.title.slice(0, 80)}`,
    html,
    text: textBody,
  });

  if (!sent) {
    if (process.env.POSTMARK_SERVER_TOKEN) {
      try {
        await axios.post(
          'https://api.postmarkapp.com/email',
          {
            From: process.env.WIRE_ALERT_FROM || 'wire@sygn.live',
            To: email,
            Subject: `Wire: ${pr.title.slice(0, 80)}`,
            TextBody: textBody,
          },
          { headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN } },
        );
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
  return true;
}

// ─── Telegram delivery ───────────────────────────────────────

export async function sendTelegramAlert(
  chatId: string,
  pr: PressReleasePayload,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('[wireAlertService] TELEGRAM_BOT_TOKEN not set — skipping Telegram alert');
    return false;
  }

  const siteUrl = process.env.SITE_URL || 'https://sygn.live';
  const pressUrl = pr.slug ? `${siteUrl}/press/${pr.slug}` : siteUrl;

  const text = [
    `*New on CoinDaily Wire*`,
    `*${escapeTelegramMd(pr.title)}*`,
    '',
    escapeTelegramMd(pr.summary),
    pr.company ? `Company: ${escapeTelegramMd(pr.company)}` : '',
    `Published: ${pr.publishedAt}`,
    `[Read full release](${pressUrl})`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
    return true;
  } catch (err: any) {
    logger.error('[wireAlertService] Telegram send failed', {
      chatId,
      message: err?.message,
    });
    return false;
  }
}

// ─── Notify all active subscribers ───────────────────────────

export async function notifySubscribers(
  prisma: any,
  pr: PressReleasePayload,
): Promise<{ emailsSent: number; telegramsSent: number }> {
  let emailsSent = 0;
  let telegramsSent = 0;

  let subscriptions: any[] = [];
  try {
    subscriptions = await prisma.wireAlertSubscription.findMany({
      where: { active: true },
    });
  } catch (err: any) {
    logger.error('[wireAlertService] Failed to fetch subscriptions', { message: err?.message });
    return { emailsSent, telegramsSent };
  }

  for (const sub of subscriptions) {
    if (!matchesFilters(sub.filters, pr)) continue;

    try {
      const ok = await sendEmailAlert(sub.email, pr);
      if (ok) emailsSent++;
    } catch (err: any) {
      logger.warn('[wireAlertService] Email alert failed', { email: sub.email, message: err?.message });
    }

    if (sub.telegramChatId) {
      try {
        const ok = await sendTelegramAlert(sub.telegramChatId, pr);
        if (ok) telegramsSent++;
      } catch (err: any) {
        logger.warn('[wireAlertService] Telegram alert failed', { chatId: sub.telegramChatId, message: err?.message });
      }
    }
  }

  logger.info('[wireAlertService] Notification round complete', { emailsSent, telegramsSent, total: subscriptions.length });
  return { emailsSent, telegramsSent };
}

// ─── Helpers ─────────────────────────────────────────────────

function matchesFilters(filtersJson: string | null, pr: PressReleasePayload): boolean {
  if (!filtersJson) return true;
  try {
    const filters: string[] = JSON.parse(filtersJson);
    if (!Array.isArray(filters) || filters.length === 0) return true;
    const cat = (pr.category || '').toLowerCase();
    return filters.some(
      (f) => f.toLowerCase() === 'all' || cat.includes(f.toLowerCase()),
    );
  } catch {
    return true;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeTelegramMd(str: string): string {
  return str.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}
