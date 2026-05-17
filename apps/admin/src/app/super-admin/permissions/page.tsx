/**
 * Permissions Management Page
 * View and manage all delegated permissions across the platform
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

interface Permission {
  id: string;
  permissionKey: string;
  displayName: string;
  category: string;
  grantedTo: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  grantedBy: {
    id: string;
    username: string;
    email: string;
  };
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokeReason: string | null;
}

interface PermissionStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  byCategory: Record<string, number>;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [stats, setStats] = useState<PermissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['USER_MANAGEMENT']);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockPermissions: Permission[] = [
        {
          id: '1',
          permissionKey: 'user_create',
          displayName: 'Create User',
          category: 'USER_MANAGEMENT',
          grantedTo: {
            id: '2',
            username: 'content_admin_01',
            email: 'content@coindaily.com',
            role: 'CONTENT_ADMIN'
          },
          grantedBy: {
            id: '1',
            username: 'super_admin',
            email: 'admin@coindaily.com'
          },
          status: 'ACTIVE',
          grantedAt: new Date('2024-01-15'),
          expiresAt: new Date('2025-01-15'),
          revokedAt: null,
          revokeReason: null
        },
        {
          id: '2',
          permissionKey: 'content_publish',
          displayName: 'Publish Content',
          category: 'CONTENT_MANAGEMENT',
          grantedTo: {
            id: '3',
            username: 'editor_01',
            email: 'editor@coindaily.com',
            role: 'CONTENT_ADMIN'
          },
          grantedBy: {
            id: '1',
            username: 'super_admin',
            email: 'admin@coindaily.com'
          },
          status: 'ACTIVE',
          grantedAt: new Date('2024-02-01'),
          expiresAt: null,
          revokedAt: null,
          revokeReason: null
        },
        {
          id: '3',
          permissionKey: 'analytics_view',
          displayName: 'View Analytics',
          category: 'ANALYTICS',
          grantedTo: {
            id: '4',
            username: 'marketing_admin',
            email: 'marketing@coindaily.com',
            role: 'MARKETING_ADMIN'
          },
          grantedBy: {
            id: '1',
            username: 'super_admin',
            email: 'admin@coindaily.com'
          },
          status: 'EXPIRED',
          grantedAt: new Date('2023-12-01'),
          expiresAt: new Date('2024-11-01'),
          revokedAt: null,
          revokeReason: null
        }
      ];

      setPermissions(mockPermissions);

      // Calculate stats
      const mockStats: PermissionStats = {
        total: mockPermissions.length,
        active: mockPermissions.filter(p => p.status === 'ACTIVE').length,
        expired: mockPermissions.filter(p => p.status === 'EXPIRED').length,
        revoked: mockPermissions.filter(p => p.status === 'REVOKED').length,
        byCategory: mockPermissions.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'REVOKED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'EXPIRED':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400';
      case 'REVOKED':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.grantedTo.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.grantedTo.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || permission.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const permissionsByCategory = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categories = Object.keys(permissionsByCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <span>Permission Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage delegated permissions across the platform
          </p>
        </div>
        <button
          onClick={loadPermissions}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <Shield className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.expired}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revoked</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.revoked}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            {stats && Object.keys(stats.byCategory).map(category => (
              <option key={category} value={category}>
                {category.replace(/_/g, ' ')} ({stats.byCategory[category]})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Permissions List by Category */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No permissions found</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.replace(/_/g, ' ')}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                    {permissionsByCategory[category].length}
                  </span>
                </div>
              </button>

              {expandedCategories.includes(category) && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Permission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Granted To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Granted By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Expires
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {permissionsByCategory[category].map(permission => (
                        <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {permission.displayName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {permission.permissionKey}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {permission.grantedTo.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {permission.grantedTo.email}
                              </p>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {permission.grantedTo.role}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {permission.grantedBy.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(permission.grantedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(permission.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(permission.status)}`}>
                                {permission.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {permission.expiresAt
                                ? new Date(permission.expiresAt).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {permission.status === 'ACTIVE' && (
                                <button
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Revoke Permission"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
