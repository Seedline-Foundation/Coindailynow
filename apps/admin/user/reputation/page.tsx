'use client';

/**
 * User Reputation Page
 * Feature 07: On-Chain Reputation & Merchant Scoring System
 */

import React from 'react';
import MerchantReputationDashboard from '@/components/user/MerchantReputationDashboard';

// Mock hook - in production, this would come from wallet context
function useWallet() {
  // TODO: Replace with actual wallet hook (wagmi, ethers, etc.)
  const [walletAddress, setWalletAddress] = React.useState<string | undefined>(undefined);
  const [isConnecting, setIsConnecting] = React.useState(false);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Check if ethereum is available
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletAddress(undefined);
  };

  return { walletAddress, isConnecting, connect, disconnect };
}

export default function ReputationPage() {
  const { walletAddress, isConnecting, connect, disconnect } = useWallet();

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Merchant Reputation</h1>
          <p className="text-gray-400">
            Build your on-chain reputation to unlock lower fees, priority support, and exclusive features.
          </p>
        </div>

        {/* Wallet Connection Bar */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            {walletAddress ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-300">Connected:</span>
                <span className="font-mono text-white">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">No wallet connected</span>
            )}
          </div>
          <button
            onClick={walletAddress ? disconnect : connect}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              walletAddress
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {isConnecting ? 'Connecting...' : walletAddress ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>

        {/* Main Dashboard */}
        <MerchantReputationDashboard walletAddress={walletAddress} />

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* How Scoring Works */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How Scoring Works</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-3">
                <span className="text-green-500">•</span>
                <span><strong className="text-white">Success Rate (30%)</strong> - Complete transactions without cancellation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500">•</span>
                <span><strong className="text-white">Volume (50%)</strong> - Higher trade volume = more reputation</span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500">•</span>
                <span><strong className="text-white">Settlement Speed</strong> - Same-day settlement bonuses</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500">•</span>
                <span><strong className="text-white">ZK Verification (+100)</strong> - Verify identity without revealing data</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong className="text-white">Disputes (-50)</strong> - Each dispute reduces score</span>
              </li>
            </ul>
          </div>

          {/* Tier Benefits */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tier Benefits</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">💎</span>
                <div>
                  <div className="text-white font-medium">Diamond (900+)</div>
                  <div className="text-gray-500">0.1% fees, priority support, exclusive airdrops</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-white font-medium">Platinum (750+)</div>
                  <div className="text-gray-500">0.25% fees, early feature access</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">🥇</span>
                <div>
                  <div className="text-white font-medium">Gold (500+)</div>
                  <div className="text-gray-500">0.5% fees, full platform features</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">🥈</span>
                <div>
                  <div className="text-white font-medium">Silver (250+)</div>
                  <div className="text-gray-500">0.75% fees, standard features</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">🥉</span>
                <div>
                  <div className="text-white font-medium">Bronze (0+)</div>
                  <div className="text-gray-500">1% fees, basic features</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                What is a Soulbound Token (SBT)?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-400 text-sm pl-4">
                SBTs are non-transferable tokens that represent your on-chain reputation. 
                Unlike regular NFTs, they cannot be sold or transferred, ensuring your reputation 
                is truly yours and reflects your actual trading history.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                Why use Polygon network?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-400 text-sm pl-4">
                Polygon offers extremely low gas fees (fractions of a cent) while maintaining 
                Ethereum security. This is essential for African users who need affordable 
                blockchain interactions.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                How do I improve my score?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-400 text-sm pl-4">
                Complete transactions successfully, maintain high volume, settle payments quickly, 
                avoid disputes, and consider ZK verification for a +100 bonus. Consistent positive 
                trading behavior is the best way to build reputation.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                What happens if I get a dispute?
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-400 text-sm pl-4">
                Each dispute reduces your score by 50 points. If the dispute is resolved in your 
                favor, the penalty may be partially or fully reversed. It's best to communicate 
                clearly with trading partners to avoid disputes.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
