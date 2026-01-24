// /src/components/market/PriceAlert.tsx
'use client';

import { useEffect, useState } from 'react';

interface Alert {
  id: string;
  coin: string;
  targetPrice: number;
  status: 'active' | 'triggered';
  timestamp: string;
}

const PriceAlert = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({ coin: '', targetPrice: '' });
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!localStorage.getItem('isLoggedIn'); // Mock auth check

  useEffect(() => {
    const fetchAlerts = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-price-alerts', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch price alerts');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching price alerts:`, error);
        setAlerts([]);
        alert('Failed to load price alerts. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchAlerts();

    // Mock real-time alert checking
    const interval = setInterval(() => {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.targetPrice > Math.random() * 100 ? { ...alert, status: 'triggered' } : alert
        )
      );
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAddAlert = () => {
    if (!isAuthenticated) {
      alert('Please log in to set price alerts.');
      return;
    }
    if (newAlert.coin && newAlert.targetPrice) {
      const newAlertItem = {
        id: Date.now().toString(),
        coin: newAlert.coin,
        targetPrice: parseFloat(newAlert.targetPrice),
        status: 'active' as const,
        timestamp: new Date().toISOString(),
      };
      setAlerts((prev) => [...prev, newAlertItem]);
      setNewAlert({ coin: '', targetPrice: '' });
      alert('Price alert set (mock action)');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading price alerts...</div>;
  if (!isAuthenticated && !alerts.length) return <div className="p-4 text-center">Please log in to set or view alerts.</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Price Alerts 🔔</h2>
      {isAuthenticated && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={newAlert.coin}
            onChange={(e) => setNewAlert({ ...newAlert, coin: e.target.value })}
            placeholder="Coin (e.g., DOGE)"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            value={newAlert.targetPrice}
            onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
            placeholder="Target Price ($)"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleAddAlert}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
          >
            Add Alert
          </button>
        </div>
      )}
      {alerts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id} className={`p-2 rounded ${alert.status === 'triggered' ? 'bg-green-100' : 'bg-gray-50'}`}>
              <p><strong>Coin:</strong> {alert.coin}</p>
              <p><strong>Target Price:</strong> ${alert.targetPrice}</p>
              <p><strong>Status:</strong> {alert.status.toUpperCase()}</p>
              <p className="text-sm text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PriceAlert;