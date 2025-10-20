/**
 * Super Admin Sidebar Component
 * Navigation sidebar for super admin dashboard
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  TrendingUp,
  Brain,
  MessageSquare,
  Handshake,
  Database,
  DollarSign,
  Search,
  Settings,
  BarChart3,
  Globe,
  Smartphone,
  AlertTriangle,
  Crown,
  Bot,
  Coins,
  ChevronDown,
  ChevronRight,
  Monitor,
  UserCog,
  Building,
  CreditCard,
  Zap,
  Eye,
  Lock,
  BookOpen,
  Headphones,
  Send,
  ShoppingCart
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: MenuItem[];
  badge?: string;
  badgeColor?: string;
}

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminSidebar({ isOpen, onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['overview']);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      href: '/super-admin/dashboard',
    },
    {
      id: 'admin-management',
      label: 'Admin Management',
      icon: UserCog,
      children: [
        { id: 'admin-accounts', label: 'Admin Accounts', icon: Users, href: '/super-admin/admins' },
        { id: 'permissions', label: 'Permissions', icon: Shield, href: '/super-admin/permissions' },
        { id: 'roles', label: 'Roles & Access', icon: Crown, href: '/super-admin/roles' },
        { id: 'audit-logs', label: 'Audit Logs', icon: Eye, href: '/super-admin/audit' },
      ]
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      children: [
        { id: 'all-users', label: 'All Users', icon: Users, href: '/super-admin/users' },
        { id: 'premium-users', label: 'Premium Users', icon: Crown, href: '/super-admin/users/premium' },
        { id: 'user-analytics', label: 'User Analytics', icon: BarChart3, href: '/super-admin/users/analytics' },
        { id: 'user-support', label: 'User Support', icon: Headphones, href: '/super-admin/users/support' },
      ]
    },
    {
      id: 'content-management',
      label: 'Content Management',
      icon: FileText,
      children: [
        { id: 'articles', label: 'Articles', icon: FileText, href: '/super-admin/content' },
        { id: 'ai-content', label: 'AI Content', icon: Bot, href: '/super-admin/content/ai' },
        { id: 'content-automation', label: 'Content Automation', icon: Bot, href: '/super-admin/content-automation', badge: 'NEW', badgeColor: 'bg-green-500 text-white' },
        { id: 'moderation', label: 'Moderation', icon: Shield, href: '/super-admin/content/moderation' },
        { id: 'categories', label: 'Categories', icon: BookOpen, href: '/super-admin/content/categories' },
      ]
    },
    {
      id: 'ai-management',
      label: 'AI Management',
      icon: Brain,
      href: '/super-admin/ai',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/super-admin/analytics',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'system-health',
      label: 'System Health',
      icon: Monitor,
      href: '/super-admin/system',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'monetization',
      label: 'Monetization',
      icon: DollarSign,
      href: '/super-admin/monetization',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'community',
      label: 'Community',
      icon: MessageSquare,
      href: '/super-admin/community',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'seo',
      label: 'SEO Management',
      icon: Search,
      href: '/super-admin/seo',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'distribution',
      label: 'Distribution',
      icon: Send,
      href: '/super-admin/distribution',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'ecommerce',
      label: 'E-commerce',
      icon: ShoppingCart,
      href: '/super-admin/ecommerce',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      href: '/super-admin/compliance',
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      id: 'security',
      label: 'Security Dashboard',
      icon: Lock,
      href: '/super-admin/security',
      badge: 'NEW',
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'audit',
      label: 'Audit System',
      icon: Eye,
      href: '/super-admin/audit',
      badge: 'NEW',
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'accessibility',
      label: 'Accessibility (WCAG)',
      icon: Eye,
      href: '/super-admin/accessibility',
      badge: 'NEW',
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'rate-limiting',
      label: 'Rate Limiting & DDoS',
      icon: Zap,
      href: '/super-admin/rate-limiting',
      badge: 'NEW',
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'market-management',
      label: 'Market Management',
      icon: TrendingUp,
      children: [
        { id: 'market-data', label: 'Market Data', icon: BarChart3, href: '/super-admin/market/data' },
        { id: 'exchanges', label: 'Exchanges', icon: Building, href: '/super-admin/market/exchanges' },
        { id: 'tokens', label: 'Token Management', icon: Coins, href: '/super-admin/market/tokens' },
        { id: 'alerts', label: 'Market Alerts', icon: AlertTriangle, href: '/super-admin/market/alerts' },
      ]
    },
    {
      id: 'partnerships',
      label: 'Partnerships',
      icon: Handshake,
      children: [
        { id: 'partners', label: 'Partners', icon: Building, href: '/super-admin/partnerships/partners' },
        { id: 'integrations', label: 'Integrations', icon: Zap, href: '/super-admin/partnerships/integrations' },
        { id: 'contracts', label: 'Contracts', icon: FileText, href: '/super-admin/partnerships/contracts' },
      ]
    },
    {
      id: 'data-management',
      label: 'Data Management',
      icon: Database,
      children: [
        { id: 'databases', label: 'Databases', icon: Database, href: '/super-admin/data/databases' },
        { id: 'backups', label: 'Backups', icon: Shield, href: '/super-admin/data/backups' },
        { id: 'migrations', label: 'Migrations', icon: Zap, href: '/super-admin/data/migrations' },
        { id: 'privacy', label: 'Privacy & GDPR', icon: Lock, href: '/super-admin/data/privacy' },
      ]
    },
    {
      id: 'seo-management-old',
      label: 'SEO Management (Old)',
      icon: Search,
      children: [
        { id: 'seo-analytics', label: 'SEO Analytics', icon: BarChart3, href: '/super-admin/seo/analytics' },
        { id: 'keywords', label: 'Keywords', icon: Search, href: '/super-admin/seo/keywords' },
        { id: 'meta-data', label: 'Meta Data', icon: FileText, href: '/super-admin/seo/meta' },
        { id: 'sitemap', label: 'Sitemap', icon: Globe, href: '/super-admin/seo/sitemap' },
      ]
    },
    {
      id: 'system-monitoring',
      label: 'System Monitoring',
      icon: Monitor,
      children: [
        { id: 'system-health', label: 'System Health', icon: Monitor, href: '/super-admin/monitoring/health' },
        { id: 'performance', label: 'Performance', icon: TrendingUp, href: '/super-admin/monitoring/performance' },
        { id: 'logs', label: 'Logs', icon: FileText, href: '/super-admin/monitoring/logs' },
        { id: 'alerts-system', label: 'System Alerts', icon: AlertTriangle, href: '/super-admin/monitoring/alerts' },
      ]
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: Settings,
      children: [
        { id: 'general', label: 'General Settings', icon: Settings, href: '/super-admin/settings/general' },
        { id: 'security', label: 'Security', icon: Lock, href: '/super-admin/settings/security' },
        { id: 'api-config', label: 'API Configuration', icon: Zap, href: '/super-admin/settings/api' },
        { id: 'localization', label: 'Localization', icon: Globe, href: '/super-admin/settings/localization' },
      ]
    },
  ];

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
              level === 0 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </div>
            {isOpen && (
              isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <Link
            href={item.href || '#'}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : level === 0
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </div>
            {isOpen && item.badge && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.badgeColor || 'bg-blue-500 text-white'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-50 h-[calc(100vh-64px)] bg-gray-800 shadow-lg transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-16'
        } overflow-y-auto`}
      >
        <div className="p-4">
          <nav className="space-y-2">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>
        </div>

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Super Admin v1.0
              </p>
              <p className="text-xs text-gray-500">
                CoinDaily Platform
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}