/**
 * Premium Users Management Page
 * Manage premium tier subscribers and their benefits
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Search,
  Filter,
  Download,
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  Star,
  Gift,
  RefreshCw,
  Eye,
  Edit,
  Mail
} from 'lucide-react';

interface PremiumUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  totalSpent: number;
  lastPaymentDate?: string;
  autoRenew: boolean;
  lifetimeValue: number;
}

export default function PremiumUsersPage() {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    basic: 0,
    premium: 0,
    enterprise: 0,
    monthlyRevenue: 0,
    churnRate: 0,
  });
  const usersPerPage = 10;

  useEffect(() => {
    fetchPremiumUsers();
  }, [currentPage, filterTier, filterStatus, searchQuery]);

  const fetchPremiumUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filterTier !== 'all' && { tier: filterTier }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await fetch(`/api/super-admin/users/premium?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching premium users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'PREMIUM':
        return 'bg-purple-500/20 text-purple-400 border-purple-500';
      case 'ENTERPRISE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'EXPIRING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'EXPIRED':
        return 'bg-red-500/20 text-red-400';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totalPages = Math.ceil(stats.total / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-400" />
            <span>Premium Users</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage premium subscribers and their benefits
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPremiumUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Premium</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Enterprise</p>
              <p className="text-2xl font-bold text-white">{stats.enterprise}</p>
            </div>
            <Star className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Churn Rate</p>
              <p className="text-2xl font-bold text-white">{stats.churnRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="BASIC">Basic</option>
            <option value="PREMIUM">Premium</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    LTV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(user.subscriptionTier)}`}>
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.subscriptionStatus)}`}>
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(user.subscriptionStartDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.subscriptionEndDate 
                        ? new Date(user.subscriptionEndDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-400">
                      ${user.lifetimeValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-400 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors">
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                {Math.min(currentPage * usersPerPage, stats.total)} of {stats.total} users
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
