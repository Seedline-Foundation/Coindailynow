/**
 * User Wallet Page
 * Cryptocurrency wallet management
 */

'use client';

import React, { useState, useEffect } from 'react';
import WalletDashboard from '@/components/wallet/WalletDashboard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { WalletTransaction, TransactionType, TransactionStatus, PaymentMethod } from '@/types/finance';

// Mock transactions for development
const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    transactionHash: '0x1234567890abcdef',
    transactionType: TransactionType.DEPOSIT,
    operationType: 'deposit',
    toWalletId: 'wallet-1',
    amount: 0.5,
    currency: 'BTC',
    netAmount: 0.4999,
    fee: 0.0001,
    status: TransactionStatus.COMPLETED,
    paymentMethod: PaymentMethod.CRYPTO,
    transactionDate: new Date('2026-02-05'),
    requiresApproval: false,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-02-05'),
  },
  {
    id: 'tx-2',
    transactionHash: '0xabcdef1234567890',
    transactionType: TransactionType.WITHDRAWAL,
    operationType: 'withdrawal',
    fromWalletId: 'wallet-1',
    amount: 100,
    currency: 'USDT',
    netAmount: 99,
    fee: 1,
    status: TransactionStatus.PENDING,
    paymentMethod: PaymentMethod.CRYPTO,
    transactionDate: new Date('2026-02-06'),
    requiresApproval: true,
    createdAt: new Date('2026-02-06'),
    updatedAt: new Date('2026-02-06'),
  },
  {
    id: 'tx-3',
    transactionHash: '0x9876543210fedcba',
    transactionType: TransactionType.TRANSFER,
    operationType: 'transfer',
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-2',
    amount: 0.1,
    currency: 'ETH',
    netAmount: 0.099,
    fee: 0.001,
    status: TransactionStatus.COMPLETED,
    paymentMethod: PaymentMethod.CRYPTO,
    transactionDate: new Date('2026-02-07'),
    requiresApproval: false,
    createdAt: new Date('2026-02-07'),
    updatedAt: new Date('2026-02-07'),
  },
];

export default function UserWalletPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>(mockTransactions);
  const [walletId] = useState('wallet-1');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Wallet</h1>
        <p className="text-dark-400 mt-1">Manage your cryptocurrency holdings and transactions.</p>
      </div>

      <WalletDashboard />
      
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>
        <TransactionHistory transactions={transactions} walletId={walletId} />
      </div>
    </div>
  );
}
