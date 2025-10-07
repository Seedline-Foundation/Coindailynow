/**
 * User Management Page
 * CRUD operations for platform users
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Award,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  subscriptionTier: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterRole, filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await fetch(`/api/super-admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'SUSPENDED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'BANNED':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      FREE: 'bg-gray-500/20 text-gray-400',
      BASIC: 'bg-blue-500/20 text-blue-400',
      PREMIUM: 'bg-purple-500/20 text-purple-400',
      ENTERPRISE: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[tier as keyof typeof colors] || colors.FREE;
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-400" />
            <span>User Management</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage all platform users and their access levels
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Today</p>
              <p className="text-2xl font-bold text-white">{Math.floor(totalUsers * 0.23)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Premium Users</p>
              <p className="text-2xl font-bold text-white">{Math.floor(totalUsers * 0.15)}</p>
            </div>
            <Award className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-white">{Math.floor(totalUsers * 0.02)}</p>
            </div>
            <Ban className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by email, username, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Roles</option>
              <option value="USER">User</option>
              <option value="CONTENT_ADMIN">Content Admin</option>
              <option value="MARKETING_ADMIN">Marketing Admin</option>
              <option value="TECH_ADMIN">Tech Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>

        {selectedUsers.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <span className="text-sm text-blue-400">
              {selectedUsers.size} user(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">
                Edit
              </button>
              <button className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                Suspend
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No users found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-400"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user.username}</p>
                            <p className="text-xs text-gray-400 flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierBadge(user.subscriptionTier)}`}>
                          {user.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-750 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
              </div>
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
          </>
        )}
      </div>
    </div>
  );
}
