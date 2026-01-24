/**
 * Finance Admin Dashboard Index
 * Overview of all finance features
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CogIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';

interface FinanceIndexProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const FinanceMenuItem = ({ 
  href, 
  icon: Icon, 
  title, 
  description 
}: { 
  href: string; 
  icon: any; 
  title: string; 
  description: string;
}) => (
  <Link
    href={href}
    className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  </Link>
);

export default function FinanceIndexPage({ user }: FinanceIndexProps) {
  const menuItems = [
    {
      href: '/admin/finance/analytics',
      icon: ChartBarIcon,
      title: 'Analytics Dashboard',
      description: 'Real-time financial insights, token velocity, staking metrics, and revenue analytics',
    },
    {
      href: '/admin/finance/reports',
      icon: DocumentTextIcon,
      title: 'Financial Reports',
      description: 'Generate user reports, system reports, and compliance documentation in PDF/CSV',
    },
    {
      href: '/admin/wallet',
      icon: CurrencyDollarIcon,
      title: 'Wallet Management',
      description: 'Manage user wallets, view balances, and handle transactions',
    },
    {
      href: '/admin/wallet/live-transactions',
      icon: UsersIcon,
      title: 'Live Transactions',
      description: 'Monitor real-time transaction feed and user activities',
    },
    {
      href: '/admin/finance/security',
      icon: ShieldCheckIcon,
      title: 'Security & Fraud',
      description: 'View audit logs, manage IP whitelist, and monitor fraud detection',
    },
    {
      href: '/admin/finance/settings',
      icon: CogIcon,
      title: 'System Settings',
      description: 'Configure API versions, performance monitoring, and system upgrades',
    },
  ];

  return (
    <>
      <Head>
        <title>Finance Admin | CoinDaily</title>
        <meta name="description" content="Finance module administration" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Finance Administration
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Comprehensive financial management and analytics for CoinDaily Platform
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">Total Value Locked</h3>
              <p className="text-3xl font-bold mt-2">$2.4M</p>
              <p className="text-xs opacity-75 mt-1">+12.5% from last month</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">Active Users</h3>
              <p className="text-3xl font-bold mt-2">8,432</p>
              <p className="text-xs opacity-75 mt-1">+340 this week</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">24h Transactions</h3>
              <p className="text-3xl font-bold mt-2">12,847</p>
              <p className="text-xs opacity-75 mt-1">+8.2% from yesterday</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">System Health</h3>
              <p className="text-3xl font-bold mt-2">99.8%</p>
              <p className="text-xs opacity-75 mt-1">All systems operational</p>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <FinanceMenuItem key={item.href} {...item} />
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent System Events
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { time: '2 minutes ago', event: 'Large deposit detected', amount: '$50,000', user: 'user_8432' },
                { time: '15 minutes ago', event: 'Compliance report generated', amount: 'Q1 2025', user: 'admin_1' },
                { time: '1 hour ago', event: 'New staking plan activated', amount: '180-day APR 15%', user: 'system' },
                { time: '2 hours ago', event: 'Security audit completed', amount: 'No issues found', user: 'system' },
              ].map((activity, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.event}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.user} · {activity.time}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.authToken;
  
  if (!token) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  try {
    const user = {
      id: '1',
      email: 'admin@coindaily.com',
      role: 'SUPER_ADMIN',
    };

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return {
        redirect: {
          destination: '/unauthorized',
          permanent: false,
        },
      };
    }

    return {
      props: {
        user,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }
};

