'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Crown, 
  Wallet, 
  FileCode, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Key,
  Users,
  ChevronLeft,
  Bell,
  Settings
} from 'lucide-react';

/**
 * CEO Portal - jet.coindaily.online/admin/CEO
 * 
 * ⚠️ CEO-ONLY ACCESS
 * 
 * This page is restricted to CEO IP addresses only.
 * Provides executive-level access to:
 * - Fund management
 * - Smart contract deployment
 * - Revenue overview
 * - Critical system actions
 */

export default function CEOPortal() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="flex items-center gap-2 text-dark-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span className="font-display font-bold text-white">CEO Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-dark-400 hover:text-white">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-dark-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Security Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-500 mb-1">Executive Access Enabled</h3>
              <p className="text-dark-400 text-sm">
                You are accessing the CEO-restricted portal. All actions are logged and require confirmation.
                Session will timeout in 15 minutes of inactivity.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-500" />
              <span className="flex items-center text-green-500 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                +18.2%
              </span>
            </div>
            <p className="text-dark-400 text-sm">Total Treasury</p>
            <p className="text-2xl font-bold text-white">$1,234,567</p>
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              <span className="flex items-center text-green-500 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                +5.4%
              </span>
            </div>
            <p className="text-dark-400 text-sm">Monthly Revenue</p>
            <p className="text-2xl font-bold text-white">$89,432</p>
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="flex items-center text-red-500 text-sm">
                <ArrowDownRight className="w-4 h-4" />
                -2.1%
              </span>
            </div>
            <p className="text-dark-400 text-sm">Active Users</p>
            <p className="text-2xl font-bold text-white">8,432</p>
          </div>

          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-dark-400 text-sm">Pending Approvals</p>
            <p className="text-2xl font-bold text-white">12</p>
          </div>
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fund Management */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-6 h-6 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">Fund Management</h2>
            </div>
            
            <div className="space-y-4">
              <Link 
                href="/admin/funds"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Treasury Overview</p>
                  <p className="text-dark-400 text-sm">View all wallets and balances</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/funds/transfers"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Transfer Funds</p>
                  <p className="text-dark-400 text-sm">Process payment requests</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/funds/approvals"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white font-medium">Pending Approvals</p>
                    <p className="text-dark-400 text-sm">Review withdrawal requests</p>
                  </div>
                </div>
                <span className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded-full">
                    12 pending
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-dark-500" />
                </span>
              </Link>
            </div>
          </div>

          {/* Smart Contracts */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileCode className="w-6 h-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-white">Smart Contracts</h2>
            </div>
            
            <div className="space-y-4">
              <Link 
                href="/admin/contracts"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Contract Management</p>
                  <p className="text-dark-400 text-sm">View deployed contracts</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/contracts/deploy"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Deploy New Contract</p>
                  <p className="text-dark-400 text-sm">Deploy to mainnet/testnet</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/contracts/upgrades"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Contract Upgrades</p>
                  <p className="text-dark-400 text-sm">Upgrade proxy contracts</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
            </div>
          </div>

          {/* Security Center */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Security Center</h2>
            </div>
            
            <div className="space-y-4">
              <Link 
                href="/admin/security/audit"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Audit Logs</p>
                  <p className="text-dark-400 text-sm">View all admin actions</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/security/keys"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">API Key Management</p>
                  <p className="text-dark-400 text-sm">Rotate and manage keys</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/security/whitelist"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">IP Whitelist</p>
                  <p className="text-dark-400 text-sm">Manage allowed IPs</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
            </div>
          </div>

          {/* Staff Management */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-green-500" />
              <h2 className="text-lg font-semibold text-white">Staff Management</h2>
            </div>
            
            <div className="space-y-4">
              <Link 
                href="/admin/staff"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Staff Directory</p>
                  <p className="text-dark-400 text-sm">View all staff members</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/staff/permissions"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Permissions</p>
                  <p className="text-dark-400 text-sm">Manage staff access</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
              
              <Link 
                href="/admin/staff/invite"
                className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-white font-medium">Invite Staff</p>
                  <p className="text-dark-400 text-sm">Add new team members</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-dark-500" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
