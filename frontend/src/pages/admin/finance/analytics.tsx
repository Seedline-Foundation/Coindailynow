/**
 * Admin Finance Analytics Dashboard Page
 * Comprehensive analytics interface for financial module
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import FinanceAnalyticsDashboard from '@/components/admin/FinanceAnalyticsDashboard';

interface AnalyticsPageProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function FinanceAnalyticsPage({ user }: AnalyticsPageProps) {
  // Default date range: last 30 days
  const [dateRange] = React.useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  return (
    <>
      <Head>
        <title>Finance Analytics Dashboard | CoinDaily Admin</title>
        <meta name="description" content="Comprehensive financial analytics and insights" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Finance Analytics Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Real-time financial insights, performance metrics, and system monitoring
            </p>
          </div>

          {/* Analytics Dashboard Component */}
          <FinanceAnalyticsDashboard dateRange={dateRange} />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check authentication
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
    // Verify admin/super-admin role
    // In production, verify JWT and check role
    const user = {
      id: '1',
      email: 'admin@coindaily.com',
      role: 'SUPER_ADMIN',
    };

    // Only allow ADMIN or SUPER_ADMIN access
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

