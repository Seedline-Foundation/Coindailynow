'use client';

import React, { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function AppInstallAndOfflinePrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<string>('');

  useEffect(() => {
    const updateOnlineState = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        const ts = new Date().toISOString();
        setLastOnlineAt(ts);
        localStorage.setItem('coindaily_last_online_at', ts);
      }
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    const cachedLastOnline = localStorage.getItem('coindaily_last_online_at') || '';
    if (cachedLastOnline) setLastOnlineAt(cachedLastOnline);

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShowInstall(false);
    setDeferredPrompt(null);
  };

  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 shadow-lg md:left-auto md:right-4 md:w-[420px]">
          <div className="font-semibold">Offline Mode Active</div>
          <div className="mt-1 text-xs">
            Showing cached data.
            {lastOnlineAt ? ` Last sync: ${new Date(lastOnlineAt).toLocaleString()}.` : ' No previous sync timestamp found.'}
          </div>
        </div>
      )}

      {showInstall && (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 shadow-lg md:left-auto md:right-4 md:w-[420px]">
          <div className="font-semibold">Install CoinDaily App</div>
          <div className="mt-1 text-xs">Get faster launch and offline access for African crypto news.</div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleInstall} className="rounded-md bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-800">
              Add to Home Screen
            </button>
            <button onClick={() => setShowInstall(false)} className="rounded-md border border-cyan-300 bg-white px-3 py-1.5 text-xs font-medium text-cyan-800 hover:bg-cyan-100">
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
