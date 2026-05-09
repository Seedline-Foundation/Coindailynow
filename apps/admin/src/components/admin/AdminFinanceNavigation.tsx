/**
 * Admin Finance Navigation Component
 * Sidebar navigation for finance administration
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CogIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Finance Overview',
    href: '/admin/finance',
    icon: HomeIcon,
  },
  {
    name: 'Analytics Dashboard',
    href: '/admin/finance/analytics',
    icon: ChartBarIcon,
    badge: 'New',
  },
  {
    name: 'Financial Reports',
    href: '/admin/finance/reports',
    icon: DocumentTextIcon,
  },
  {
    name: 'Wallet Management',
    href: '/admin/wallet',
    icon: CurrencyDollarIcon,
    children: [
      {
        name: 'Overview',
        href: '/admin/wallet',
        icon: CurrencyDollarIcon,
      },
      {
        name: 'Live Transactions',
        href: '/admin/wallet/live-transactions',
        icon: BoltIcon,
      },
      {
        name: 'Airdrops',
        href: '/admin/wallet/airdrops',
        icon: ArrowTrendingUpIcon,
      },
      {
        name: 'CE Points',
        href: '/admin/wallet/ce-points',
        icon: ChartBarIcon,
      },
    ],
  },
  {
    name: 'Security & Fraud',
    href: '/admin/finance/security',
    icon: ShieldCheckIcon,
  },
  {
    name: 'System Settings',
    href: '/admin/finance/settings',
    icon: CogIcon,
  },
];

export default function AdminFinanceNavigation() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const isActive = (href: string) => {
    return router.pathname === href;
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg h-full overflow-y-auto">
      <div className="px-4 py-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Finance Administration
        </h2>
        
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.name}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.name}</span>
                    </div>
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        expandedItems.includes(item.name) ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {expandedItems.includes(item.name) && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            href={child.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive(child.href)
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <child.icon className="h-4 w-4 mr-2" />
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Quick Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">Active Users</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">8,432</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">Total Value</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">$2.4M</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">24h Volume</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">$847K</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">System Health</span>
            <span className="inline-flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">99.8%</span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

