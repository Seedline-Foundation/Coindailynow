/**
 * Roles & Access Management Page
 * Manage role templates, permissions, and access control
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Copy,
  Download,
  RefreshCw,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';

interface Permission {
  key: string;
  displayName: string;
  description: string;
  category: string;
  delegatable: boolean;
  requiresSuperAdmin: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string;
  permissionCount: number;
  adminCount: number;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function RolesAccessPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('super_admin_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/roles', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await fetch('/api/super-admin/permissions', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllPermissions(data.permissions || []);
        setPermissionCategories(data.categories || {});
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newRoleName.trim() || !newRoleDescription.trim()) {
      setError('Name and description are required');
      return;
    }

    if (selectedPermissions.length === 0) {
      setError('Select at least one permission');
      return;
    }

    try {
      const res = await fetch('/api/super-admin/roles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newRoleName,
          displayName: newRoleDisplayName || newRoleName,
          description: newRoleDescription,
          permissions: selectedPermissions,
        }),
      });

      if (res.ok) {
        setSuccess('Role created successfully!');
        setShowCreateModal(false);
        resetForm();
        loadRoles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || data.error || 'Failed to create role');
      }
    } catch (err) {
      setError('Failed to create role. Please try again.');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const res = await fetch(`/api/super-admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setSuccess('Role deleted successfully');
        loadRoles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete role');
      }
    } catch (err) {
      setError('Failed to delete role');
    }
  };

  const resetForm = () => {
    setNewRoleName('');
    setNewRoleDisplayName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);
    setError('');
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categoryPerms = permissionCategories[category]?.map(p => p.key) || [];
    const allSelected = categoryPerms.every(k => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPerms])]);
    }
  };

  const parsePermissions = (permStr: string): string[] => {
    try {
      const parsed = JSON.parse(permStr);
      return Array.isArray(parsed) ? parsed : Object.values(parsed).flat() as string[];
    } catch {
      return [];
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName === 'SUPER_ADMIN') return <Crown className="w-5 h-5 text-yellow-500" />;
    return <Shield className="w-5 h-5 text-blue-500" />;
  };

  const filteredRoles = roles.filter(role =>
    (role.displayName || role.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemRoles = filteredRoles.filter(r => r.isSystem || r.isDefault);
  const customRolesList = filteredRoles.filter(r => !r.isSystem && !r.isDefault);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading roles...</p>
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
            <Crown className="w-8 h-8 text-yellow-600" />
            <span>Roles & Access Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage {roles.length} role templates with {allPermissions.length} permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadRoles}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}
      {error && !showCreateModal && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{roles.length}</p>
            </div>
            <Crown className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Roles</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{systemRoles.length}</p>
            </div>
            <Shield className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Custom Roles</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{customRolesList.length}</p>
            </div>
            <Users className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Permissions</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{allPermissions.length}</p>
            </div>
            <Shield className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* System Roles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>System Roles</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
              {systemRoles.length}
            </span>
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {systemRoles.map(role => (
            <RoleCard key={role.id} role={role} onDelete={handleDeleteRole} parsePermissions={parsePermissions} />
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-600" />
            <span>Custom Roles</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs rounded-full">
              {customRolesList.length}
            </span>
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {customRolesList.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No custom roles created yet. Click "Create Role" to add one.
            </div>
          ) : (
            customRolesList.map(role => (
              <RoleCard key={role.id} role={role} onDelete={handleDeleteRole} parsePermissions={parsePermissions} />
            ))
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Role</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateRole} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Role Name *</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Content Reviewer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={newRoleDisplayName}
                      onChange={(e) => setNewRoleDisplayName(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Content Reviewer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description *</label>
                  <textarea
                    required
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    rows={2}
                    placeholder="Describe what this role can do..."
                  />
                </div>

                {/* Permissions Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">
                      Permissions ({selectedPermissions.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => setExpandedCategories(Object.keys(permissionCategories))}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Expand All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto border border-gray-600 rounded-lg p-3">
                    {Object.entries(permissionCategories).map(([category, perms]) => {
                      const isExpanded = expandedCategories.includes(category);
                      const selectedCount = perms.filter(p => selectedPermissions.includes(p.key)).length;
                      const allSelected = perms.length === selectedCount;

                      return (
                        <div key={category} className="border border-gray-700 rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between px-4 py-3 bg-gray-700/50 cursor-pointer hover:bg-gray-700"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="flex items-center space-x-3">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              <span className="text-sm font-medium text-white">{category.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-gray-400">({selectedCount}/{perms.length})</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); selectAllInCategory(category); }}
                              className={`text-xs px-2 py-1 rounded ${allSelected ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="p-3 space-y-2">
                              {perms.map(perm => (
                                <label
                                  key={perm.key}
                                  className="flex items-start space-x-3 p-2 hover:bg-gray-700/30 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.key)}
                                    onChange={() => togglePermission(perm.key)}
                                    className="mt-0.5 rounded bg-gray-700 border-gray-600"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white">{perm.displayName}</p>
                                    <p className="text-xs text-gray-400">{perm.description}</p>
                                  </div>
                                  {perm.requiresSuperAdmin && (
                                    <span title="Requires Super Admin">
                                      <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-1" />
                                    </span>
                                  )}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Create Role</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Role Card Component
function RoleCard({ role, onDelete, parsePermissions }: {
  role: Role;
  onDelete: (id: string) => void;
  parsePermissions: (str: string) => string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const permissions = parsePermissions(role.permissions);
  const permissionCount = role.permissionCount || permissions.length;

  return (
    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            {role.name === 'SUPER_ADMIN' ? (
              <Crown className="w-6 h-6 text-yellow-600" />
            ) : (
              <Shield className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {role.displayName || role.name}
              </h3>
              {(role.isDefault || role.isSystem) && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                  System
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{role.description}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{role.adminCount} admin{role.adminCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>{permissionCount} permission{permissionCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {expanded && permissions.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((perm: string) => (
                    <span
                      key={perm}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                    >
                      {perm.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title={expanded ? 'Collapse' : 'Expand permissions'}
          >
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          {!role.isSystem && !role.isDefault && (
            <button
              onClick={() => onDelete(role.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete Role"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
