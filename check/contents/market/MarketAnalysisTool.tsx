// /src/components/market/MarketAnalysisTool.tsx
'use client';

import { useEffect, useState } from 'react';
import Chart from 'chart.js/auto'; // Assume Chart.js is included
import PriceAlert from './PriceAlert';
import PortfolioTracker from './PortfolioTracker';
import MarketSentiment from './MarketSentiment';
import MemecoinWatchlist from './MemecoinWatchlist';
import NFTMarketplace from './NFTmarketplace';
import PricePrediction from './PricePrediction';
import TrendingMemecoins from './TrendingMemecoins';

interface MarketData {
  coin: string;
  price: number;
  change: number;
}

const MarketAnalysisTool = () => {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartRendered, setChartRendered] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch('https://api.coindaily.online/mock-market-data', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch market data');
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching market data:`, error);
        setData([]);
        alert('Failed to load market data. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchMarketData();
  }, []);

  const renderChart = () => {
    if (chartRendered || data.length === 0) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map((d) => d.coin),
          datasets: [{
            label: 'Price ($)',
            data: data.map((d) => d.price),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }],
        },
        options: { scales: { y: { beginAtZero: true } } },
      });
      document.body.appendChild(canvas);
      setChartRendered(true);
    }
    return () => document.body.removeChild(canvas); // Cleanup
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-4 text-center">Loading market data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-purple-800 text-center">Market Analysis Tool</h1>
      {data.length > 0 ? (
        <div className="mt-6 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <ul className="space-y-2">
            {data.map((item) => (
              <li key={item.coin} className="p-2 bg-gray-50 rounded">
                <p><strong>Coin:</strong> {item.coin}</p>
                <p><strong>Price:</strong> ${item.price.toFixed(2)}</p>
                <p><strong>Change:</strong> {item.change}%</p>
              </li>
            ))}
          </ul>
          <button
            onClick={renderChart}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            View Chart
          </button>
          <PriceAlert />
          <PortfolioTracker />
          <MarketSentiment />
          <MemecoinWatchlist />
          <NFTMarketplace />
          <PricePrediction />
          <TrendingMemecoins />
        </div>
      ) : (
        <p className="mt-6 text-gray-600 text-center">No market data available.</p>
      )}
    </div>
  );
};

export default MarketAnalysisTool;