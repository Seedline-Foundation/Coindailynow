/**
 * Enhanced Internal Wallet Dashboard
 * 
 * Hybrid wallet system (Database + ERC-20):
 * - Convert: CE Points → JY Token (ERC-20)
 * - Deposit: Add JY from whitelisted wallet or buy via swap
 * - Transfer: Pay for platform services (internal transfers)
 * - Send: Send JY to other users or admins
 * - Swap: Exchange tokens via YellowCard (Africa) or ChangeNOW (outside)
 * - Withdraw: Withdraw JY to whitelisted wallet (Wed/Fri only, 48hr cooldown)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { financeApi } from '../../services/financeApi';
import { 
  Wallet, 
  WalletTransaction, 
  TransactionStatus,
  WalletStatus 
} from '../../types/finance';
import { 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send as SendIcon, 
  Repeat, 
  LogOut,
  DollarSign,
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Wallet as WalletIcon
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

// Modal components
import { ConvertCEModal } from './modals/ConvertCEModal';
import { DepositJYModal } from './modals/DepositJYModal';
import { TransferModal } from './modals/TransferModal';
import { SendModal } from './modals/SendModal';
import { SwapModal } from './modals/SwapModal';
import { WithdrawModal } from './modals/WithdrawModal';

interface EnhancedWalletDashboardProps {
  userId?: string;
}

export const EnhancedWalletDashboard: React.FC<EnhancedWalletDashboardProps> = ({ userId }) => {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;

  // State
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userLocation, setUserLocation] = useState<'AFRICA' | 'OUTSIDE_AFRICA'>('OUTSIDE_AFRICA');

  // Modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Withdrawal schedule check
  const isWithdrawalDay = (): boolean => {
    const today = new Date().getDay(); // 0 = Sunday, 3 = Wednesday, 5 = Friday
    return today === 3 || today === 5; // Wednesday or Friday
  };

  const canWithdraw = (): boolean => {
    if (!wallet) return false;
    const hasMinimum = wallet.joyTokens >= 0.05;
    const isAllowedDay = isWithdrawalDay();
    const isActive = wallet.status === WalletStatus.ACTIVE;
    return hasMinimum && isAllowedDay && isActive;
  };

  // Get user location for regional widgets
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const isAfrica = data.continent_code === 'AF';
        setUserLocation(isAfrica ? 'AFRICA' : 'OUTSIDE_AFRICA');
      } catch (error) {
        console.error('Failed to detect location:', error);
        // Default to outside Africa
        setUserLocation('OUTSIDE_AFRICA');
      }
    };
    detectLocation();
  }, []);

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        setError(null);

        // Load user's wallets
        const wallets = await financeApi.getUserWallets(currentUserId);
        
        if (wallets.length === 0) {
          setError('No wallet found. Please contact support.');
          return;
        }

        // Use primary wallet
        const primaryWallet = wallets.find(w => w.walletType === 'USER_WALLET') || wallets[0];
        setWallet(primaryWallet);

        // Load transactions
        const txs = await financeApi.getWalletTransactions(primaryWallet.id, {
          limit: 50
        });
        setTransactions(txs);

      } catch (err) {
        console.error('Failed to load wallet data:', err);
        setError('Failed to load wallet. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [currentUserId, refreshKey]);

  // Refresh wallet
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle transaction completion
  const handleTransactionComplete = () => {
    handleRefresh();
  };

  // Format currency
  const formatCurrency = (amount: number, decimals: number = 4): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Action buttons configuration
  const actionButtons = [
    {
      id: 'convert',
      name: 'Convert',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => setShowConvertModal(true),
      disabled: !wallet || (wallet.cePoints || 0) < 100 || wallet.status !== WalletStatus.ACTIVE,
      tooltip: (wallet?.cePoints || 0) < 100 ? 'Need at least 100 CE Points' : 'Convert CE Points to JY Token'
    },
    {
      id: 'deposit',
      name: 'Deposit',
      icon: <ArrowDownLeft className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => setShowDepositModal(true),
      disabled: !wallet || wallet.status !== WalletStatus.ACTIVE,
      tooltip: 'Deposit JY from whitelisted wallet or buy via swap'
    },
    {
      id: 'transfer',
      name: 'Transfer',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => setShowTransferModal(true),
      disabled: !wallet || wallet.joyTokens <= 0 || wallet.status !== WalletStatus.ACTIVE,
      tooltip: 'Pay for platform services or transfer to other users'
    },
    {
      id: 'send',
      name: 'Send',
      icon: <SendIcon className="w-6 h-6" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: () => setShowSendModal(true),
      disabled: !wallet || wallet.joyTokens <= 0 || wallet.status !== WalletStatus.ACTIVE,
      tooltip: 'Send JY or other tokens to users/admins'
    },
    {
      id: 'swap',
      name: 'Swap',
      icon: <Repeat className="w-6 h-6" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => setShowSwapModal(true),
      disabled: !wallet || wallet.status !== WalletStatus.ACTIVE,
      tooltip: userLocation === 'AFRICA' ? 'Swap via YellowCard' : 'Swap via ChangeNOW'
    },
    {
      id: 'withdraw',
      name: 'Withdraw',
      icon: <LogOut className="w-6 h-6" />,
      color: canWithdraw() ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400 cursor-not-allowed',
      onClick: () => canWithdraw() && setShowWithdrawModal(true),
      disabled: !canWithdraw(),
      tooltip: !wallet 
        ? 'Wallet not loaded' 
        : wallet.joyTokens < 0.05 
        ? 'Minimum 0.05 JY required'
        : !isWithdrawalDay()
        ? 'Withdrawals only on Wednesday & Friday'
        : wallet.status !== WalletStatus.ACTIVE
        ? 'Wallet is locked'
        : 'Withdraw JY to whitelisted wallet'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="p-6">
        <ErrorMessage message="Wallet not found" />
      </div>
    );
  }

  return (
    <div className="enhanced-wallet-dashboard space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Internal Wallet
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hybrid System: Database + ERC-20 Integration
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Wallet Status Alerts */}
      {wallet.status !== WalletStatus.ACTIVE && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Wallet {wallet.status}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Your wallet has been restricted. Please contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Schedule Notice */}
      {!isWithdrawalDay() && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Withdrawal Schedule
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Withdrawals are only available on Wednesdays and Fridays (12 AM - 11 PM)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>
            Payment Widget: {userLocation === 'AFRICA' ? 'YellowCard (Africa)' : 'ChangeNOW (International)'}
          </span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <WalletIcon className="w-5 h-5" />
          <span className="text-sm font-medium text-blue-100">Total Balance</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h2 className="text-4xl font-bold">{formatCurrency(wallet.joyTokens)} JY</h2>
          <span className="text-blue-200">≈ ${formatCurrency(wallet.joyTokens * 1.0, 2)} USD</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-xs text-blue-100 mb-1">Available</p>
            <p className="text-lg font-semibold">{formatCurrency(wallet.availableBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100 mb-1">Staked</p>
            <p className="text-lg font-semibold">{formatCurrency(wallet.stakedBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100 mb-1">CE Points</p>
            <p className="text-lg font-semibold">{formatCurrency(wallet.cePoints, 0)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actionButtons.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.tooltip}
            className={`
              flex flex-col items-center justify-center p-6 rounded-xl text-white transition-all transform
              ${action.color}
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
            `}
          >
            <div className="mb-2">{action.icon}</div>
            <span className="text-sm font-semibold">{action.name}</span>
          </button>
        ))}
      </div>

      {/* Security Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Security & Limits
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Minimum withdrawal: 0.05 JY</li>
              <li>• Withdrawal cooldown: 48 hours maximum</li>
              <li>• Whitelist changes: Maximum 3 per year</li>
              <li>• AI fraud detection: Active monitoring</li>
              <li>• Withdrawals: Wednesday & Friday only</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {tx.transactionType === 'DEPOSIT' ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tx.purpose || tx.transactionType}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tx.transactionType === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)} {tx.currency}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showConvertModal && (
        <ConvertCEModal
          wallet={wallet}
          onClose={() => setShowConvertModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}

      {showDepositModal && (
        <DepositJYModal
          wallet={wallet}
          userLocation={userLocation}
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}

      {showTransferModal && (
        <TransferModal
          wallet={wallet}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}

      {showSendModal && (
        <SendModal
          wallet={wallet}
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}

      {showSwapModal && (
        <SwapModal
          wallet={wallet}
          userLocation={userLocation}
          onClose={() => setShowSwapModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          wallet={wallet}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}
    </div>
  );
};

