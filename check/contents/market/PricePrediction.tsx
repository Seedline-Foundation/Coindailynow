// /src/components/market/PricePrediction.tsx
'use client';

import { useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
Chart.register(...registerables);

interface PredictionData {
  coin: string;
  currentPrice: number;
  predictedPrice: number;
  timestamp: string;
}

const PricePrediction = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-price-predictions', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch price predictions');
        const data = await response.json();
        setPredictions(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching predictions:`, error);
        setPredictions([]);
        alert('Failed to load price predictions. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchPredictions();

    const interval = setInterval(fetchPredictions, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: predictions.map((p) => p.coin),
    datasets: [
      {
        label: 'Current Price ($)',
        data: predictions.map((p) => p.currentPrice),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
      },
      {
        label: 'Predicted Price ($)',
        data: predictions.map((p) => p.predictedPrice),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: $${context.raw}` } },
    },
    scales: {
      y: { beginAtZero: false, title: { display: true, text: 'Price ($)' } },
      x: { title: { display: true, text: 'Coins' } },
    },
  };

  if (loading) return <div className="p-4 text-center">Loading price predictions...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Price Prediction 🔮</h2>
      {predictions.length > 0 ? (
        <div className="mt-4">
          <Line data={chartData} options={chartOptions} />
          <ul className="mt-2 space-y-2">
            {predictions.map((pred) => (
              <li key={pred.coin} className="p-2 bg-gray-50 rounded">
                <p><strong>Coin:</strong> {pred.coin}</p>
                <p><strong>Current Price:</strong> ${pred.currentPrice.toFixed(2)}</p>
                <p><strong>Predicted Price:</strong> ${pred.predictedPrice.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Updated: {new Date(pred.timestamp).toLocaleTimeString()}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-gray-600 text-center">No price predictions available.</p>
      )}
    </div>
  );
};

export default PricePrediction;