/**
 * Prices Page
 * Real-time cryptocurrency prices and market data
 */

'use client';

import { useState, useEffect } from 'react';

export default function PricesPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch market data from backend
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cryptocurrency Prices
          </h1>
          <p className="text-gray-600">
            Real-time market data from African exchanges
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-center py-8">
              Market data will be displayed here once the backend API is connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
