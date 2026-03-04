/**
 * Super Admin Sidebar Component
 * Navigation sidebar for super admin dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  ShoppingCart,
  Tag,
  Key,
  Ticket,
  LifeBuoy,
  Award,
  Megaphone,
  ClipboardList,
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

/* ─── Menus that ALL staff can always access (never grayed) ─── */
const ALWAYS_ACCESSIBLE_MENUS = [
  'overview',
  'today-todo',
  'help-center',
];

/* ─── Role detection ─── */
function detectSidebarRole(): { isCeo: boolean; staffId: string; assignedMenus: string[] } {
  if (typeof window === 'undefined') return { isCeo: true, staffId: 'ceo', assignedMenus: [] };
  const token = localStorage.getItem('super_admin_token') || '';
  const isCeo = token.includes('super_admin') || token.includes('ceo') || token.includes('super-admin');
  const staffId = localStorage.getItem('staff_id') || (isCeo ? 'ceo' : 'staff-unknown');
  // Staff menu assignments stored by CEO (JSON array of menu IDs)
  const assignedRaw = localStorage.getItem('staff_assigned_menus');
  const assignedMenus: string[] = assignedRaw ? JSON.parse(assignedRaw) : [];
  return { isCeo, staffId, assignedMenus };
}

export default function SuperAdminSidebar({ isOpen, onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['overview']);
  const [userRole, setUserRole] = useState<{ isCeo: boolean; staffId: string; assignedMenus: string[] }>({ isCeo: true, staffId: 'ceo', assignedMenus: [] });

  useEffect(() => {
    setUserRole(detectSidebarRole());
  }, []);

  const isMenuAccessible = (menuId: string): boolean => {
    if (userRole.isCeo) return true; // CEO sees everything
    if (ALWAYS_ACCESSIBLE_MENUS.includes(menuId)) return true;
    if (userRole.assignedMenus.length === 0) return true; // No restriction set yet — show all
    return userRole.assignedMenus.includes(menuId);
  };

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
      id: 'today-todo',
      label: 'Today TO DO',
      icon: ClipboardList,
      href: '/super-admin/today-todo',
      badge: 'DAILY',
      badgeColor: 'bg-red-500 text-white',
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
        { id: 'translations', label: 'Translations', icon: Globe, href: '/super-admin/translations', badge: 'NEW', badgeColor: 'bg-cyan-500 text-white' },
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
      id: 'automations',
      label: 'Automations',
      icon: Bot,
      href: '/super-admin/automations',
      badge: 'NEW',
      badgeColor: 'bg-orange-500 text-white',
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
      id: 'crypto-policies',
      label: 'Crypto Policies',
      icon: Globe,
      href: '/super-admin/crypto-policies',
      badge: 'NEW',
      badgeColor: 'bg-purple-500 text-white',
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
      id: 'ads-management',
      label: 'Ads Management',
      icon: Megaphone,
      href: '/super-admin/ads',
      badge: 'AI',
      badgeColor: 'bg-orange-500 text-white',
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
      badge: 'NEW',
      badgeColor: 'bg-yellow-500 text-white',
      children: [
        { id: 'ecommerce-manage', label: 'Product Management', icon: ShoppingCart, href: '/super-admin/ecommerce' },
        { id: 'ecommerce-marketplace', label: 'Marketplace', icon: Tag, href: '/super-admin/ecommerce/marketplace' },
        { id: 'ecommerce-sellers', label: 'Seller Management', icon: Users, href: '/super-admin/ecommerce/sellers' },
      ],
    },
    {
      id: 'api-licensing',
      label: 'API Licensing',
      icon: Key,
      href: '/super-admin/api-licensing',
      badge: 'NEW',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'affiliate',
      label: 'Affiliate Mgmt',
      icon: Users,
      href: '/super-admin/affiliate',
      badge: 'NEW',
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      id: 'expert-program',
      label: 'Expert Program',
      icon: Award,
      href: '/super-admin/expert-program',
      badge: 'NEW',
      badgeColor: 'bg-amber-500 text-white',
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
      icon: Users,
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
        { id: 'all-settings', label: 'All Settings', icon: Settings, href: '/super-admin/settings' },
        { id: 'tokenomics', label: 'Tokenomics (CP/JY)', icon: Coins, href: '/super-admin/settings?tab=tokenomics' },
        { id: 'general', label: 'General Settings', icon: Settings, href: '/super-admin/settings/general' },
        { id: 'security', label: 'Security', icon: Lock, href: '/super-admin/settings/security' },
        { id: 'api-config', label: 'API Configuration', icon: Zap, href: '/super-admin/settings/api' },
        { id: 'localization', label: 'Localization', icon: Globe, href: '/super-admin/settings/localization' },
      ]
    },
    {
      id: 'help-center',
      label: 'Help Center',
      icon: LifeBuoy,
      href: '/super-admin/help-center',
      badge: 'NEW',
      badgeColor: 'bg-amber-500 text-white',
    },
  ];

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const accessible = isMenuAccessible(item.id);
    const grayedOut = !accessible;

    return (
      <div key={item.id} className={`mb-1 ${grayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        {hasChildren ? (
          <button
            onClick={() => !grayedOut && toggleExpanded(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
              grayedOut
                ? 'text-gray-500 cursor-not-allowed'
                : level === 0 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
            disabled={grayedOut}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </div>
            {isOpen && !grayedOut && (
              isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
            )}
            {isOpen && grayedOut && (
              <Lock className="w-3 h-3 text-gray-600" />
            )}
          </button>
        ) : (
          grayedOut ? (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-500 cursor-not-allowed"
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
              {isOpen && (
                <Lock className="w-3 h-3 text-gray-600" />
              )}
            </div>
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
          )
        )}

        {hasChildren && isExpanded && !grayedOut && (
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
        <div className="p-4 pb-6">
          <nav className="space-y-2">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>
        </div>

        {/* Footer — portal links removed; accessible via the header profile menu */}
      </aside>
    </>
  );
}
