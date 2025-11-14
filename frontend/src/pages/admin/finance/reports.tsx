/**
 * Finance Reports Page
 * Download and generate financial reports
 */

import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useMutation } from '@apollo/client';
import { GENERATE_USER_REPORT, GENERATE_SYSTEM_REPORT } from '@/graphql/analytics';

interface ReportPageProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function FinanceReportsPage({ user }: ReportPageProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [loading, setLoading] = useState(false);

  const [generateUserReport] = useMutation(GENERATE_USER_REPORT);
  const [generateSystemReport] = useMutation(GENERATE_SYSTEM_REPORT);
  // Note: Compliance report generation will be added in future update

  const handleGenerateUserReport = async () => {
    if (!selectedUser || !startDate || !endDate) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data } = await generateUserReport({
        variables: {
          userId: selectedUser,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          format: reportFormat,
        },
      });

      if (data?.generateUserFinancialReport?.success) {
        // Download report
        window.open(data.generateUserFinancialReport.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating user report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSystemReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }

    setLoading(true);
    try {
      const { data } = await generateSystemReport({
        variables: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          format: reportFormat,
        },
      });

      if (data?.generateSystemFinancialReport?.success) {
        window.open(data.generateSystemFinancialReport.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating system report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComplianceReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select date range');
      return;
    }

    // Placeholder: Compliance report generation to be implemented
    alert('Compliance report generation will be available in a future update');
    
    /* Future implementation:
    setLoading(true);
    try {
      const { data } = await generateComplianceReport({
        variables: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          format: reportFormat,
        },
      });

      if (data?.generateComplianceReport?.success) {
        window.open(data.generateComplianceReport.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <>
      <Head>
        <title>Finance Reports | CoinDaily Admin</title>
        <meta name="description" content="Generate and download financial reports" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Financial Reports
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Financial Report
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as 'PDF' | 'CSV')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateUserReport}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate User Report'}
                </button>
              </div>
            </div>

            {/* System Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                System Financial Report
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as 'PDF' | 'CSV')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateSystemReport}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate System Report'}
                </button>
              </div>
            </div>

            {/* Compliance Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Compliance Report
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as 'PDF' | 'CSV')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateComplianceReport}
                disabled={loading}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-md disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Compliance Report'}
              </button>
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

