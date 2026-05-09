'use client';

import React, { useEffect, useRef } from 'react';
import { Coins, ArrowLeftRight, Shield, Clock, Zap, Plus, CreditCard, AlertTriangle } from 'lucide-react';
import { User, AdminUserControls } from '../../types/user';

interface TokenSwapProps {
  user: User;
  adminControls: AdminUserControls;
}

export const TokenSwap: React.FC<TokenSwapProps> = ({ user, adminControls }) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the ChangeNOW widget script
    const script = document.createElement('script');
    script.src = 'https://changenow.io/embeds/exchange-widget/v2/stepper-connector.js';
    script.defer = true;
    script.type = 'text/javascript';
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Token Exchange & Deposit
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Exchange cryptocurrencies instantly or deposit tokens to your wallet. Powered by ChangeNOW.
        </p>
      </div>

      {/* User Balance Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-4">
          Your Wallet Balance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white dark:bg-blue-800/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {user.joyTokens.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">JOY Tokens</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-blue-800/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user.cePoints.toLocaleString()}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">CE Points</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-blue-800/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {user.subscriptionTier.toUpperCase()}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Subscription</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-blue-800/30 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {user.readingStreak}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Widget Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Swap Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <ArrowLeftRight className="h-6 w-6" />
              <h3 className="text-xl font-semibold">Token Swap</h3>
            </div>
            <p className="text-blue-100">
              Exchange between different cryptocurrencies instantly
            </p>
          </div>
          
          <div className="p-6">
            <div ref={widgetRef} className="min-h-[356px]">
              <iframe 
                id="iframe-widget-swap" 
                src="https://changenow.io/embeds/exchange-widget/v2/widget.html?FAQ=true&amount=0.1&amountFiat=1500&backgroundColor=2B2B35&darkMode=true&from=btc&fromFiat=eur&horizontal=false&isFiat&lang=en-US&link_id=a5195e673d09d6&locales=true&logo=true&primaryColor=00C26F&to=eth&toFiat=eth&toTheMoon=true" 
                style={{ height: '356px', width: '100%', border: 'none' }}
                className="rounded-lg"
                title="ChangeNOW Exchange Widget"
              />
            </div>
          </div>
        </div>

        {/* Deposit Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Plus className="h-6 w-6" />
              <h3 className="text-xl font-semibold">Deposit Tokens</h3>
            </div>
            <p className="text-green-100">
              Top up your wallet with cryptocurrencies or fiat
            </p>
          </div>
          
          <div className="p-6">
            <div className="min-h-[356px]">
              <iframe 
                id="iframe-widget-deposit" 
                src="https://changenow.io/embeds/exchange-widget/v2/widget.html?FAQ=true&amount=0.1&amountFiat=1500&backgroundColor=2B2B35&darkMode=true&from=btc&fromFiat=eur&horizontal=false&isFiat&lang=en-US&link_id=a5195e673d09d6&locales=true&logo=true&primaryColor=00C26F&to=eth&toFiat=eth&toTheMoon=true&topUpAddress&topUpCurrency=eth&topUpExtraId&topUpMode=true&topUpNetwork=eth" 
                style={{ height: '356px', width: '100%', border: 'none' }}
                className="rounded-lg"
                title="ChangeNOW Deposit Widget"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features and Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Features
            </h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">No registration required</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Fixed rate exchanges</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">350+ cryptocurrencies</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Instant exchanges</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">24/7 support</span>
            </li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Security Notice
            </h3>
          </div>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Always verify wallet addresses before confirming transactions. 
              Cryptocurrency transactions are irreversible.
            </p>
            <p>
              ChangeNOW is a third-party service. Please review their terms 
              and privacy policy before proceeding.
            </p>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-200 font-medium">
                Never share your private keys or seed phrases with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No recent transactions found</p>
          <p className="text-sm mt-1">Your exchange and deposit history will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default TokenSwap;
