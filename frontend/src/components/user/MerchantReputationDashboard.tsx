'use client';

import React from 'react';

interface MerchantReputationDashboardProps {
  walletAddress?: string;
}

export default function MerchantReputationDashboard({ walletAddress }: MerchantReputationDashboardProps) {
  if (!walletAddress) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <div className="text-5xl mb-3">🔒</div>
        <h3 className="text-xl font-semibold text-white mb-2">Connect Wallet to View Reputation</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Your on-chain reputation score is tied to your wallet address. Connect a wallet to see your tier, success rate, and SBT history.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-8 text-center">
      <div className="text-5xl mb-3">⏳</div>
      <h3 className="text-xl font-semibold text-white mb-2">Reputation Dashboard Coming Soon</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        The on-chain reputation system is being indexed for {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}.
        Score, tier, and SBT details will appear here once the reputation contracts are deployed.
      </p>
    </div>
  );
}
