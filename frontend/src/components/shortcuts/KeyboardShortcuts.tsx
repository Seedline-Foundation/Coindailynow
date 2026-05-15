'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Bloomberg-style keyboard shortcuts.
 *
 * Single-key:
 *   /  → focus search
 *   ?  → show shortcut help modal
 *   Esc → close modal / blur search
 *
 * Two-key sequences (press g then the second key within 1s):
 *   g n → go to news (home)
 *   g f → go to factsheets
 *   g p → go to pricing
 *   g a → go to about
 *   g r → go to regulatory map
 *   g q → go to FAQ
 */

const SHORTCUTS: { keys: string; description: string; href: string }[] = [
  { keys: 'g n', description: 'Go to News (Home)', href: '/' },
  { keys: 'g f', description: 'Go to Factsheets', href: '/factsheets' },
  { keys: 'g p', description: 'Go to Pricing', href: '/pricing' },
  { keys: 'g a', description: 'Go to About', href: '/about' },
  { keys: 'g r', description: 'Go to Regulations', href: '/regulations' },
  { keys: 'g q', description: 'Go to FAQ', href: '/faq' },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingG, setPendingG] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger inside inputs/textareas/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        setShowHelp(false);
        setPendingG(false);
        (document.activeElement as HTMLElement)?.blur();
        return;
      }

      if (isEditable) return;

      // "/" → focus search bar
      if (e.key === '/') {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"], input[name="q"], input[aria-label*="search" i]'
        );
        if (search) {
          search.focus();
          search.select();
        }
        return;
      }

      // "?" → show help
      if (e.key === '?') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Two-key sequences: g + X
      if (e.key === 'g' && !pendingG) {
        setPendingG(true);
        // Auto-cancel after 1s
        setTimeout(() => setPendingG(false), 1000);
        return;
      }

      if (pendingG) {
        setPendingG(false);
        const mapping: Record<string, string> = {
          n: '/',
          f: '/factsheets',
          p: '/pricing',
          a: '/about',
          r: '/regulations',
          q: '/faq',
        };
        const target = mapping[e.key];
        if (target) {
          e.preventDefault();
          router.push(target);
        }
      }
    },
    [pendingG, router],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-500 hover:text-white text-lg"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-1">
          {/* Single keys */}
          <ShortcutRow keys="/" description="Focus search bar" />
          <ShortcutRow keys="?" description="Show this help" />
          <ShortcutRow keys="Esc" description="Close / blur" />

          <div className="border-t border-gray-700 my-3" />

          {/* Navigation */}
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
            Navigation
          </p>
          {SHORTCUTS.map((s) => (
            <ShortcutRow key={s.keys} keys={s.keys} description={s.description} />
          ))}
        </div>

        <p className="text-xs text-gray-600 mt-5">
          Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 text-[10px] font-mono">g</kbd> then the second key within 1 second.
        </p>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  const parts = keys.split(' ');
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-300">{description}</span>
      <div className="flex items-center gap-1">
        {parts.map((k, i) => (
          <span key={i}>
            <kbd className="inline-block min-w-[24px] text-center px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-200 text-xs font-mono">
              {k}
            </kbd>
            {i < parts.length - 1 && <span className="text-gray-600 mx-0.5">+</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
