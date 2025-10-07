// /src/components/market/MarketSentiment.tsx
'use client';

import { useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // For annotations
Chart.register(...registerables, ChartDataLabels);

interface SentimentData {
  coin: string;
  sentimentScore: number; // -100 to 100
  timestamp: string;
}

interface MarketSentiment {
  overallScore: number; // -100 to 100
  timestamp: string;
}

const MarketSentiment = () => {
  const [tokenSentiments, setTokenSentiments] = useState<SentimentData[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!localStorage.getItem('isLoggedIn'); // Mock auth check
  const isPremium = !!localStorage.getItem('isPremium'); // Mock premium check
  const maxFreeTokens = 5;

  useEffect(() => {
    const fetchSentiment = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-sentiment', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch sentiment data');
        const data = await response.json();
        const tokens = data.tokens.slice(0, isPremium ? data.tokens.length : maxFreeTokens);
        setTokenSentiments(tokens);
        if (isPremium) setMarketSentiment(data.market);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching sentiment:`, error);
        setTokenSentiments([]);
        setMarketSentiment(null);
        alert('Failed to load sentiment data. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchSentiment();

    const interval = setInterval(fetchSentiment, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [isPremium]);

  const chartData = {
    labels: tokenSentiments.map((s) => s.coin),
    datasets: [
      {
        label: 'Token Sentiment Score (%)',
        data: tokenSentiments.map((s) => s.sentimentScore),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
      ...(isPremium && marketSentiment
        ? [
            {
              label: 'General Market Sentiment (%)',
              data: tokenSentiments.map(() => marketSentiment.overallScore),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              fill: true,
              tension: 0.4,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 14 } } },
      datalabels: {
        anchor: 'end' as const,
        align: 'center' as const,
        color: '#333',
        font: { weight: 'bold' as const, size: 12 },
        formatter: (value: number) => `${value.toFixed(1)}%`,
      },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}%` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: -100,
        max: 100,
        title: { display: true, text: 'Sentiment Score (%)', font: { size: 14 } },
        ticks: { callback: (value) => `${value}%` },
      },
      x: { title: { display: true, text: 'Tokens', font: { size: 14 } } },
    },
    annotation: {
      annotations: [
        ...(isPremium && marketSentiment
          ? [
              {
                type: 'line',
                mode: 'horizontal',
                scaleID: 'y',
                value: marketSentiment.overallScore,
                borderColor: 'rgba(255, 99, 132, 0.7)',
                borderWidth: 2,
                label: {
                  enabled: true,
                  content: `Market: ${marketSentiment.overallScore}%`,
                  position: 'center',
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
                  color: 'white',
                },
              },
            ]
          : []),
      ],
    },
  };

  if (loading) return <div className="p-4 text-center">Loading market sentiment...</div>;
  if (!isAuthenticated) return <div className="p-4 text-center">Please log in to view sentiment data.</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-purple-800 text-center">Market Sentiment Analyzer 📈</h2>
      {!isPremium && tokenSentiments.length >= maxFreeTokens && (
        <p className="text-yellow-600 text-center mt-2">Upgrade to premium for unlimited tokens and market sentiment!</p>
      )}
      {tokenSentiments.length > 0 ? (
        <div className="mt-4">
          <Line data={chartData} options={chartOptions} />
          {isPremium && marketSentiment && (
            <p className="mt-2 text-center text-gray-700">
              General Market Sentiment: {marketSentiment.overallScore}% (Updated: {new Date(marketSentiment.timestamp).toLocaleTimeString()})
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-gray-600 text-center">No sentiment data available.</p>
      )}
    </div>
  );
};

export default MarketSentiment;