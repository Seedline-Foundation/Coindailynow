'use client';

import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface SessionTimeoutWarningProps {
  secondsRemaining: number;
  onExtend: () => Promise<boolean>;
  isRefreshing: boolean;
}

/**
 * Floating warning banner that appears when the admin session
 * is about to expire. Shows a countdown and "Extend Session" button.
 */
export default function SessionTimeoutWarning({
  secondsRemaining,
  onExtend,
  isRefreshing,
}: SessionTimeoutWarningProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-slide-up">
      <div className="bg-yellow-900/95 backdrop-blur-sm border border-yellow-600 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-yellow-200">
              Session Expiring
            </h4>
            <p className="text-xs text-yellow-300/80 mt-0.5">
              Your session will expire in{' '}
              <span className="font-mono font-bold text-yellow-100">
                {secondsRemaining}s
              </span>
              . Unsaved changes may be lost.
            </p>
            <button
              onClick={onExtend}
              disabled={isRefreshing}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500 text-yellow-950 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Extend Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
