/**
 * Wallet Actions Component
 * 
 * Provides action buttons for wallet operations:
 * - Send (Transfer to another user)
 * - Receive (Show wallet address/QR)
 * - Stake (Stake tokens)
 * - Subscribe (Purchase subscriptions)
 * - Withdraw (Withdraw JY tokens to external wallet)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wallet } from '../../types/finance';
import { SendModal } from './modals/SendModal';
import { ReceiveModal, StakeModal, SubscribeModal } from './modals/ModalPlaceholders';
import WithdrawJYModal from './modals/WithdrawJYModal';
import financeApi from '../../services/financeApi';

interface WalletActionsProps {
  wallet: Wallet;
  onTransactionComplete: (transactionId: string) => void;
}

export const WalletActions: React.FC<WalletActionsProps> = ({ wallet, onTransactionComplete }) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);

  // Fetch pending withdrawal count on mount and when modal closes
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const requests = await (financeApi as any).getUserWithdrawalRequests('PENDING', 100);
        setPendingWithdrawalsCount(requests.length);
      } catch (error) {
        console.error('Error fetching pending withdrawals:', error);
      }
    };

    fetchPendingCount();
  }, [showWithdrawModal]); // Re-fetch when modal closes

  const actions = [
    {
      name: 'Send',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      onClick: () => setShowSendModal(true),
      color: 'bg-blue-500 hover:bg-blue-600',
      disabled: wallet.status !== 'ACTIVE' || wallet.availableBalance <= 0
    },
    {
      name: 'Receive',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
        </svg>
      ),
      onClick: () => setShowReceiveModal(true),
      color: 'bg-green-500 hover:bg-green-600',
      disabled: false
    },
    {
      name: 'Stake',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      onClick: () => setShowStakeModal(true),
      color: 'bg-purple-500 hover:bg-purple-600',
      disabled: wallet.status !== 'ACTIVE' || wallet.availableBalance <= 0
    },
    {
      name: 'Subscribe',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      onClick: () => setShowSubscribeModal(true),
      color: 'bg-amber-500 hover:bg-amber-600',
      disabled: wallet.status !== 'ACTIVE'
    },
    {
      name: 'Withdraw',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: () => setShowWithdrawModal(true),
      color: 'bg-red-500 hover:bg-red-600',
      disabled: wallet.status !== 'ACTIVE' || wallet.availableBalance <= 0
    }
  ];

  return (
    <>
      <div className="wallet-actions grid grid-cols-5 gap-4">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`relative flex flex-col items-center justify-center p-6 rounded-xl text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${action.color}`}
          >
            {/* Pending withdrawal badge */}
            {action.name === 'Withdraw' && pendingWithdrawalsCount > 0 && (
              <span className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {pendingWithdrawalsCount}
              </span>
            )}
            <div className="mb-2">{action.icon}</div>
            <span className="text-sm font-semibold">{action.name}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {showSendModal && (
        <SendModal
          wallet={wallet}
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSuccess={onTransactionComplete}
        />
      )}

      {showReceiveModal && (
        <ReceiveModal
          wallet={wallet}
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
        />
      )}

      {showStakeModal && (
        <StakeModal
          wallet={wallet}
          isOpen={showStakeModal}
          onClose={() => setShowStakeModal(false)}
          onSuccess={onTransactionComplete}
        />
      )}

      {showSubscribeModal && (
        <SubscribeModal
          wallet={wallet}
          isOpen={showSubscribeModal}
          onClose={() => setShowSubscribeModal(false)}
          onSuccess={onTransactionComplete}
        />
      )}

      {showWithdrawModal && (
        <WithdrawJYModal
          wallet={{
            id: wallet.id,
            joyTokens: wallet.joyTokens || 0,
            whitelistedAddresses: wallet.whitelistedAddresses || [],
          }}
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            onTransactionComplete('withdrawal_request_created');
            setShowWithdrawModal(false);
          }}
        />
      )}
    </>
  );
};

export default WalletActions;

