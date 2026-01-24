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
  AlertTriangle
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string;
  adminCount: number;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PermissionCategory {
  name: string;
  permissions: {
    key: string;
    displayName: string;
    description: string;
    delegatable: boolean;
    requiresSuperAdmin: boolean;
  }[];
}

export default function RolesAccessPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['USER_MANAGEMENT']);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'SUPER_ADMIN',
          displayName: 'Super Administrator',
          description: 'Full system access with all permissions',
          permissions: JSON.stringify({ all: ['*'] }),
          adminCount: 2,
          isDefault: true,
          isSystem: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'CONTENT_ADMIN',
          displayName: 'Content Administrator',
          description: 'Manage articles, categories, and content moderation',
          permissions: JSON.stringify({
            content: ['create', 'read', 'update', 'delete', 'publish', 'moderate'],
            user: ['read', 'update']
          }),
          adminCount: 5,
          isDefault: true,
          isSystem: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '3',
          name: 'MARKETING_ADMIN',
          displayName: 'Marketing Administrator',
          description: 'Manage campaigns, analytics, and user engagement',
          permissions: JSON.stringify({
            marketing: ['create', 'read', 'update', 'delete'],
            analytics: ['read'],
            user: ['read']
          }),
          adminCount: 3,
          isDefault: true,
          isSystem: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '4',
          name: 'TECH_ADMIN',
          displayName: 'Technical Administrator',
          description: 'Manage system configuration, monitoring, and integrations',
          permissions: JSON.stringify({
            system: ['read', 'update', 'configure'],
            monitoring: ['read'],
            api: ['configure']
          }),
          adminCount: 2,
          isDefault: true,
          isSystem: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '5',
          name: 'CUSTOM_EDITOR',
          displayName: 'Senior Editor',
          description: 'Custom role for senior editors with extended permissions',
          permissions: JSON.stringify({
            content: ['create', 'read', 'update', 'publish'],
            user: ['read']
          }),
          adminCount: 1,
          isDefault: false,
          isSystem: false,
          createdAt: new Date('2024-06-15'),
          updatedAt: new Date('2024-06-15')
        }
      ];

      setRoles(mockRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
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

  const getRoleIcon = (roleName: string) => {
    if (roleName === 'SUPER_ADMIN') return <Crown className="w-5 h-5 text-yellow-500" />;
    return <Shield className="w-5 h-5 text-blue-500" />;
  };

  const filteredRoles = roles.filter(role =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemRoles = filteredRoles.filter(r => r.isSystem);
  const customRoles = filteredRoles.filter(r => !r.isSystem);

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
            Manage role templates and permission assignments
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
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {roles.length}
              </p>
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
              <p className="text-2xl font-bold text-green-600 mt-1">{customRoles.length}</p>
            </div>
            <Users className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Admins</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {roles.reduce((sum, role) => sum + role.adminCount, 0)}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-600 opacity-20" />
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
            <RoleCard key={role.id} role={role} onEdit={setSelectedRole} />
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      {customRoles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Custom Roles</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs rounded-full">
                {customRoles.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {customRoles.map(role => (
              <RoleCard key={role.id} role={role} onEdit={setSelectedRole} />
            ))}
          </div>
        </div>
      )}

      {filteredRoles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No roles found</p>
        </div>
      )}
    </div>
  );
}

// Role Card Component
function RoleCard({ role, onEdit }: { role: Role; onEdit: (role: Role) => void }) {
  const [expanded, setExpanded] = useState(false);
  const permissions = JSON.parse(role.permissions);
  const permissionCount = Object.values(permissions).flat().length;

  return (
    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
                {role.displayName}
              </h3>
              {role.isDefault && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                  Default
                </span>
              )}
              {role.isSystem && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 text-xs rounded-full">
                  System
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {role.description}
            </p>
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

            {/* Permissions Detail */}
            {expanded && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Permission Details
                </h4>
                <div className="space-y-2">
                  {Object.entries(permissions).map(([category, perms]) => (
                    <div key={category} className="flex items-start space-x-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                        {category.replace(/_/g, ' ').toUpperCase()}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(perms) ? perms : [perms]).map((perm: string) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
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
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => onEdit(role)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit Role"
          >
            <Eye className="w-5 h-5" />
          </button>
          {!role.isSystem && (
            <>
              <button
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Duplicate Role"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Role"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
