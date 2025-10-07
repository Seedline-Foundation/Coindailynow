// /src/components/real-time/LiveBlogging.tsx
'use client';

import { useEffect, useState } from 'react';

interface LiveUpdate {
  id: string;
  message: string;
  timestamp: string;
}

const LiveBlogging = () => {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-live-updates', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setUpdates(data);
      } catch (error) {
        console.error('Error fetching live updates:', error);
        setUpdates([]);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchUpdates();

    // Mock real-time updates (e.g., WebSocket simulation)
    const interval = setInterval(() => {
      setUpdates((prev) => [...prev, { id: Date.now().toString(), message: `New update ${prev.length + 1}`, timestamp: new Date().toISOString() }]);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-100 p-4 text-center">Loading live updates...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-purple-800 text-center">Live Blogging</h1>
      <div className="mt-6 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {updates.length > 0 ? (
          <ul className="space-y-4">
            {updates.map((update) => (
              <li key={update.id} className="p-2 bg-gray-50 rounded">
                <p className="text-gray-800">{update.message}</p>
                <p className="text-sm text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">No live updates available.</p>
        )}
      </div>
    </div>
  );
};

export default LiveBlogging;