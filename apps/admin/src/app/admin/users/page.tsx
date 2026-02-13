/**
 * Admin Users Page
 * User management for super admin
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mock users data
const mockUsers = [
  { id: '1', name: 'Kwame Asante', email: 'kwame@example.com', role: 'user', status: 'active', country: 'Ghana', joinedAt: '2024-01-10', isPremium: true },
  { id: '2', name: 'Amina Hassan', email: 'amina@example.com', role: 'author', status: 'active', country: 'Kenya', joinedAt: '2024-01-08', isPremium: false },
  { id: '3', name: 'Chidi Okonkwo', email: 'chidi@example.com', role: 'user', status: 'suspended', country: 'Nigeria', joinedAt: '2024-01-05', isPremium: true },
  { id: '4', name: 'Fatima Diallo', email: 'fatima@example.com', role: 'moderator', status: 'active', country: 'Senegal', joinedAt: '2024-01-03', isPremium: false },
  { id: '5', name: 'John Mensah', email: 'john@example.com', role: 'user', status: 'active', country: 'Ghana', joinedAt: '2024-01-01', isPremium: false },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-dark-400 mt-1">Manage platform users and permissions</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="12,450" change="+5.2%" trend="up" />
        <StatCard title="Premium Users" value="1,890" change="+12.3%" trend="up" />
        <StatCard title="Active Today" value="3,240" change="+8.1%" trend="up" />
        <StatCard title="Suspended" value="45" change="-2.1%" trend="down" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="author">Author</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase hidden md:table-cell">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase hidden lg:table-cell">Country</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase hidden sm:table-cell">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-dark-800/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        {user.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <p className="text-xs text-dark-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                    user.role === 'moderator' ? 'bg-blue-500/10 text-blue-500' :
                    user.role === 'author' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-dark-700 text-dark-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell text-sm text-dark-300">{user.country}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    user.status === 'suspended' ? 'bg-red-500/10 text-red-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {user.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell text-sm text-dark-400">{user.joinedAt}</td>
                <td className="px-4 py-4 text-right">
                  <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 bg-dark-800 flex items-center justify-between">
          <p className="text-sm text-dark-400">Showing 1-5 of 12,450 users</p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend }: { title: string; value: string; change: string; trend: 'up' | 'down' }) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
      <p className="text-dark-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className={`text-sm mt-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
    </div>
  );
}
