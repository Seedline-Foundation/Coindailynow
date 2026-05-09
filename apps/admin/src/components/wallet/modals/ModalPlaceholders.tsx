/**
 * Modal Placeholder Components
 * These are simplified versions to complete the wallet dashboard implementation
 */

'use client';

import React from 'react';
import { Wallet } from '../../../types/finance';

interface ModalProps {
  wallet: Wallet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transactionId: string) => void;
}

export const ReceiveModal: React.FC<ModalProps> = ({ wallet, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Receive Funds</h2>
        <div className="text-center">
          <p className="text-sm mb-4">Share your wallet address to receive funds:</p>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <code className="text-sm break-all">{wallet.walletAddress}</code>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const StakeModal: React.FC<ModalProps> = ({ wallet, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Stake Tokens</h2>
        <p className="text-sm mb-4">Staking feature coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const SubscribeModal: React.FC<ModalProps> = ({ wallet, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Subscribe</h2>
        <p className="text-sm mb-4">Subscription feature coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const WithdrawModal: React.FC<ModalProps> = ({ wallet, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
        <p className="text-sm mb-4">Withdrawal feature coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const TransactionDetailModal: React.FC<{ transaction: any; isOpen: boolean; onClose: () => void }> = ({ transaction, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>
        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> {transaction.id}</p>
          <p><strong>Type:</strong> {transaction.transactionType}</p>
          <p><strong>Amount:</strong> {transaction.amount} {transaction.currency}</p>
          <p><strong>Status:</strong> {transaction.status}</p>
          <p><strong>Date:</strong> {new Date(transaction.createdAt).toLocaleString()}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

