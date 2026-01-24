// frontend/src/components/user/PWAInstallButton.tsx
// Task 66: PWA Install Button Component

'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Bell, Check } from 'lucide-react';
import { pwaHelper } from '@/lib/pwa-helper';

export default function PWAInstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check install status
    setCanInstall(pwaHelper.canInstall());
    setIsInstalled(pwaHelper.isAppInstalled());

    // Check push notification status
    if ('Notification' in window) {
      setIsPushEnabled(Notification.permission === 'granted');
    }

    // Register service worker
    pwaHelper.registerServiceWorker();
  }, []);

  const handleInstall = async () => {
    const installed = await pwaHelper.showInstallPrompt();
    if (installed) {
      setCanInstall(false);
      setIsInstalled(true);
      setShowPrompt(false);
    }
  };

  const handleEnablePush = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please log in to enable notifications');
      return;
    }

    const subscription = await pwaHelper.subscribeToPush(userId);
    if (subscription) {
      setIsPushEnabled(true);
      await pwaHelper.showNotification('Notifications Enabled!', {
        body: 'You will now receive important updates from CoinDaily',
        icon: '/icons/manifest-icon-192.maskable.png',
      });
    }
  };

  // Don't show if already installed and push is enabled
  if (isInstalled && isPushEnabled) {
    return null;
  }

  return (
    <>
      {/* Install Button */}
      {canInstall && !isInstalled && (
        <button
          onClick={() => setShowPrompt(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
        >
          <Download className="w-5 h-5" />
          Install App
        </button>
      )}

      {/* Push Notification Button (if installed but not enabled) */}
      {isInstalled && !isPushEnabled && (
        <button
          onClick={handleEnablePush}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
        >
          <Bell className="w-5 h-5" />
          Enable Notifications
        </button>
      )}

      {/* Install Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Install CoinDaily
                </h3>
                <p className="text-sm text-gray-600">
                  Get instant access to crypto news
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <Feature
                icon={<Check className="w-5 h-5 text-green-600" />}
                text="Fast, app-like experience"
              />
              <Feature
                icon={<Check className="w-5 h-5 text-green-600" />}
                text="Works offline"
              />
              <Feature
                icon={<Check className="w-5 h-5 text-green-600" />}
                text="Push notifications for breaking news"
              />
              <Feature
                icon={<Check className="w-5 h-5 text-green-600" />}
                text="Access from home screen"
              />
              <Feature
                icon={<Check className="w-5 h-5 text-green-600" />}
                text="Personalized news feed"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Install
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Free • No app store needed • Uninstall anytime
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Feature Component
interface FeatureProps {
  icon: React.ReactNode;
  text: string;
}

function Feature({ icon, text }: FeatureProps) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <p className="text-gray-700">{text}</p>
    </div>
  );
}

