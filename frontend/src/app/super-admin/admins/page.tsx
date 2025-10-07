/**
 * Admin Management Page
 * Manage all administrator accounts, permissions, and roles
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Crown,
  Eye,
  Clock,
  Check,
  X,
  AlertTriangle,
  Settings,
  Download,
  Upload
} from 'lucide-react';

interface Admin {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  _count: {
    AuditLog: number;
  };
}

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  adminCount: number;
  isDefault: boolean;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    loadAdmins();
    loadRoles();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/super-admin/admins');
      const data = await response.json();
      setAdmins(Array.isArray(data.admins) ? data.admins : []);
    } catch (error) {
      console.error('Failed to load admins:', error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/super-admin/roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const fullName = `${admin.firstName} ${admin.lastName}`.trim();
    const matchesSearch = admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || admin.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || admin.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'moderator':
        return <Eye className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage administrator accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => setShowRoleModal(true)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Roles</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Admin</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {admins.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Check className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {admins.filter(a => a.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {admins.filter(a => a.twoFactorEnabled).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">2FA Enabled</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roles.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Roles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Security
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading admins...</p>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No admins found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {`${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {`${admin.firstName} ${admin.lastName}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{admin.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(admin.role)}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {admin.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {admin._count.AuditLog} actions
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(admin.status)}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {admin.lastLoginAt ? admin.lastLoginAt.toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {admin.twoFactorEnabled ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          2FA {admin.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedAdmin(admin)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <CreateAdminModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAdmins();
          }}
        />
      )}

      {/* Role Management Modal */}
      {showRoleModal && (
        <RoleManagementModal
          roles={roles}
          onClose={() => setShowRoleModal(false)}
          onSuccess={() => {
            setShowRoleModal(false);
            loadRoles();
          }}
        />
      )}
    </div>
  );
}

// Create Admin Modal Component
function CreateAdminModal({ roles, onClose, onSuccess }: {
  roles: AdminRole[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: '',
    department: '',
    password: '',
    confirmPassword: '',
    requirePasswordChange: true,
    twoFactorRequired: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create admin');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Create New Admin
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requirePasswordChange}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirePasswordChange: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Require password change on first login
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.twoFactorRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, twoFactorRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Require two-factor authentication
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Role Management Modal Component
function RoleManagementModal({ roles, onClose, onSuccess }: {
  roles: AdminRole[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Role Management
          </h2>
          
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {role.adminCount} admin{role.adminCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map(permission => (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Create New Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}