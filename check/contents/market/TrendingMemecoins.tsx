// /src/components/market/TrendingMemecoins.tsx
'use client';

import { useEffect, useState } from 'react';

interface TrendingCoin {
  rank: number;
  name: string;
  volumeChange: number;
  socialScore: number;
  timestamp: string;
}

const TrendingMemecoins = () => {
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-trending-memecoins', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch trending memecoins');
        const data = await response.json();
        setTrending(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching trending memecoins:`, error);
        setTrending([]);
        alert('Failed to load trending memecoins. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchTrending();

    const interval = setInterval(fetchTrending, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4 text-center">Loading trending memecoins...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Trending Memecoins 🔥</h2>
      {trending.length > 0 ? (
        <ul className="mt-2 space-y-4">
          {trending.map((coin) => (
            <li key={coin.name} className="p-4 bg-gray-50 rounded">
              <p><strong>Rank:</strong> #{coin.rank}</p>
              <p><strong>Name:</strong> {coin.name}</p>
              <p><strong>Volume Change (%):</strong> {coin.volumeChange.toFixed(2)}%</p>
              <p><strong>Social Score:</strong> {coin.socialScore.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Updated: {new Date(coin.timestamp).toLocaleTimeString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-600 text-center">No trending memecoins available.</p>
      )}
    </div>
  );
};

export default TrendingMemecoins;