'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Send, Check } from 'lucide-react';
import { subscribeWireAlerts } from '@/lib/wireAlerts';

interface Props {
  open: boolean;
  onClose: () => void;
  sources: string[];
}

/**
 * Replaces the brittle window.prompt() flow with a real subscription modal.
 * Captures email and/or Telegram chat id; persists via /api/v1/press/wire/alerts.
 */
export default function WireAlertModal({ open, onClose, sources }: Props) {
  const [email, setEmail] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDone(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email && !telegramChatId) {
      setError('Provide either an email or a Telegram chat ID.');
      return;
    }
    setSubmitting(true);
    try {
      await subscribeWireAlerts({
        email: email || undefined,
        telegramChatId: telegramChatId || undefined,
        sources,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Subscribe failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-dark-800 text-dark-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 py-5 border-b border-dark-800">
          <h2 className="text-lg font-display font-semibold text-white">Wire Alerts</h2>
          <p className="text-sm text-dark-400 mt-1">
            Get notified the moment a release matches your filter set:{' '}
            <span className="text-primary-400">
              {sources.length ? sources.join(', ') : 'All sources'}
            </span>
          </p>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white font-medium">You&apos;re subscribed.</p>
            <p className="text-sm text-dark-400 mt-1">
              Confirmation sent. You can unsubscribe from any alert email.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-black font-medium rounded-md text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-dark-400 mb-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                className="w-full bg-dark-950 border border-dark-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-dark-400 mb-1.5">
                <Send className="w-3.5 h-3.5" /> Telegram chat ID
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="123456789 (DM @CoinDailyAlertBot then /start)"
                className="w-full bg-dark-950 border border-dark-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-md py-2 text-sm"
            >
              {submitting ? 'Subscribing…' : 'Subscribe'}
            </button>
            <p className="text-[11px] text-dark-500 leading-relaxed">
              We email/IM you when a release matches your filters. Unsubscribe any
              time. We never share your address.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
