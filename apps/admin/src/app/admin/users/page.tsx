/**
 * Admin Users Page
 * User management with real-time data from backend API
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  Crown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { fetchUsers, fetchPlatformStats, updateUser } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  country: string;
  isPremium: boolean;
  joinedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetchUsers({ page, limit: 20, search: searchQuery, role: roleFilter, status: statusFilter }),
        fetchPlatformStats(),
      ]);
      setUsers(usersRes.data || []);
      setTotal(usersRes.pagination?.total || 0);
      setTotalPages(usersRes.pagination?.totalPages || 1);
      setStats(statsRes.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, roleFilter, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => { setSearchQuery(value); setPage(1); }, 300);
    setSearchTimeout(timeout);
  };

  const handleUpdateUser = async (userId: string, data: { status?: string; role?: string }) => {
    try {
      await updateUser(userId, data);
      setActionMenu(null);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage platform users and permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg">
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.platform?.totalUsers?.toLocaleString() || '—'} />
        <StatCard title="Premium Users" value={stats?.platform?.premiumUsers?.toLocaleString() || '—'} />
        <StatCard title="Active Users" value={stats?.platform?.activeUsers?.toLocaleString() || '—'} />
        <StatCard title="Total in View" value={total.toLocaleString()} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search users..." defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="author">Author</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="ml-3 text-gray-400">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="w-12 h-12 mb-3 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden lg:table-cell">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{user.name || 'Unknown'}</p>
                            {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role?.toLowerCase().includes('admin') ? 'bg-red-500/10 text-red-500' :
                        user.role?.toLowerCase() === 'moderator' ? 'bg-blue-500/10 text-blue-500' :
                        user.role?.toLowerCase() === 'author' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-gray-700 text-gray-300'
                      }`}>{user.role?.toLowerCase().replace('_', ' ') || 'user'}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-300">{user.country || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.status?.toLowerCase() === 'active' ? 'bg-green-500/10 text-green-500' :
                        user.status?.toLowerCase() === 'suspended' || user.status?.toLowerCase() === 'banned' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {user.status?.toLowerCase() === 'active' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {user.status?.toLowerCase().replace('_', ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-400">
                      {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-4 text-right relative">
                      <button onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenu === user.id && (
                        <div className="absolute right-4 top-12 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]">
                          {user.status?.toLowerCase() !== 'suspended' ? (
                            <button onClick={() => handleUpdateUser(user.id, { status: 'suspended' })}
                              className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-gray-700 flex items-center gap-2">
                              <Ban className="w-3 h-3" /> Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleUpdateUser(user.id, { status: 'active' })}
                              className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" /> Activate
                            </button>
                          )}
                          <button onClick={() => handleUpdateUser(user.id, { role: 'admin' })}
                            className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Make Admin
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-400">Page {page} of {totalPages} ({total.toLocaleString()} users)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
