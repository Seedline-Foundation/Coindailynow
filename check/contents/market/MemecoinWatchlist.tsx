// /src/components/market/MemecoinWatchlist.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

interface WatchlistItem {
  id: string;
  coin: string;
  addedDate: string;
}

interface Alert {
  id: string;
  coin: string;
  type: 'price' | 'marketCap' | 'volume' | 'transactions' | 'realHolders' | 'botHolders';
  value: number;
  timeframe?: string; // e.g., '1h', '24h'
  date?: string;
  active: boolean;
}

const MemecoinWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newCoin, setNewCoin] = useState('');
  const [alertsList, setAlertsList] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState<Alert>({
    id: '',
    coin: '',
    type: 'price',
    value: 0,
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!localStorage.getItem('isLoggedIn'); // Mock auth check
  const isPremium = !!localStorage.getItem('isPremium'); // Mock premium check
  const maxFreeAlerts = 1;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchWatchlist = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-watchlist', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch watchlist');
        const data = await response.json();
        setWatchlist(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching watchlist:`, error);
        setWatchlist([]);
        alert('Failed to load watchlist. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchWatchlist();

    const interval = setInterval(fetchWatchlist, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const addToWatchlist = () => {
    if (!isAuthenticated) {
      alert('Please log in to manage your watchlist.');
      return;
    }
    if (newCoin.trim()) {
      const newItem = {
        id: Date.now().toString(),
        coin: newCoin,
        addedDate: new Date().toISOString(),
      };
      setWatchlist((prev) => [...prev, newItem]);
      setNewCoin('');
      alert('Coin added to watchlist (mock action)');
    }
  };

  const removeFromWatchlist = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
    setAlertsList((prev) => prev.filter((alert) => alert.coin !== watchlist.find((item) => item.id === id)?.coin));
    alert('Coin removed from watchlist (mock action)');
  };

  const addAlert = () => {
    if (!isAuthenticated) {
      alert('Please log in to set alerts.');
      return;
    }
    if (!isPremium && alertsList.length >= maxFreeAlerts) {
      alert(`Free users are limited to ${maxFreeAlerts} alert. Upgrade to premium for unlimited alerts!`);
      return;
    }
    if (!newAlert.coin || !newAlert.value) {
      alert('Please select a coin and set a value for the alert.');
      return;
    }
    const alertId = Date.now().toString();
    setAlertsList((prev) => [...prev, { ...newAlert, id: alertId }]);
    setNewAlert({ id: '', coin: '', type: 'price', value: 0, active: true });
    alert(`Alert set for ${newAlert.coin} (mock action)`);
  };

  const removeAlert = (id: string) => {
    setAlertsList((prev) => prev.filter((alert) => alert.id !== id));
    alert('Alert removed (mock action)');
  };

  const checkAlerts = useCallback(() => {
    alertsList.forEach((alert) => {
      // Mock data check (replace with real API data in production)
      const mockValue = Math.random() * 100; // Simulate market data
      if (alert.active && mockValue >= alert.value) {
        window.alert(`${alert.coin} ${alert.type} reached ${mockValue}!`);
      }
    });
  }, [alertsList]);

  useEffect(() => {
    const interval = setInterval(checkAlerts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkAlerts]);

  if (loading) return <div className="p-4 text-center">Loading watchlist...</div>;
  if (!isAuthenticated) return <div className="p-4 text-center">Please log in to view or manage your watchlist.</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Memecoin Watchlist 📋</h2>
      <div className="mt-2 space-y-2">
        <input
          type="text"
          value={newCoin}
          onChange={(e) => setNewCoin(e.target.value)}
          placeholder="Add a coin (e.g., DOGE)"
          className="w-full p-2 border rounded"
        />
        <button
          onClick={addToWatchlist}
          className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
        >
          Add to Watchlist
        </button>
      </div>
      {watchlist.length > 0 && (
        <ul className="mt-4 space-y-2">
          {watchlist.map((item) => (
            <li key={item.id} className="p-2 bg-gray-50 rounded">
              <p><strong>Coin:</strong> {item.coin}</p>
              <p className="text-sm text-gray-500">Added: {new Date(item.addedDate).toLocaleDateString()}</p>
              <button
                onClick={() => removeFromWatchlist(item.id)}
                className="mt-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {isAuthenticated && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-900">Set Alert 🚨</h3>
          <select
            value={newAlert.coin}
            onChange={(e) => setNewAlert({ ...newAlert, coin: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="">Select Coin</option>
            {watchlist.map((item) => (
              <option key={item.id} value={item.coin}>{item.coin}</option>
            ))}
          </select>
          <select
            value={newAlert.type}
            onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as Alert['type'] })}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="price">Price</option>
            <option value="marketCap">Market Cap</option>
            <option value="volume">Volume</option>
            <option value="transactions">Transactions</option>
            <option value="realHolders">Real Holders</option>
            <option value="botHolders">Bot Holders</option>
          </select>
          <input
            type="number"
            value={newAlert.value}
            onChange={(e) => setNewAlert({ ...newAlert, value: parseFloat(e.target.value) || 0 })}
            placeholder="Threshold Value"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={addAlert}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
          >
            Add Alert
          </button>
          {alertsList.length > 0 && (
            <ul className="mt-4 space-y-2">
              {alertsList.map((alert) => (
                <li key={alert.id} className="p-2 bg-gray-50 rounded">
                  <p><strong>Coin:</strong> {alert.coin}</p>
                  <p><strong>Type:</strong> {alert.type}</p>
                  <p><strong>Value:</strong> {alert.value}</p>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="mt-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Remove Alert
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isPremium && alertsList.length >= maxFreeAlerts && (
            <p className="text-yellow-600 mt-2">Upgrade to premium for unlimited alerts!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MemecoinWatchlist;