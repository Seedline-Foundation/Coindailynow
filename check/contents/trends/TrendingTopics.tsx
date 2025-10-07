// /src/components/trends/TrendingTopics.tsx
'use client';

import { useEffect, useState } from 'react';

interface TrendingTopic {
  id: string;
  topic: string;
  mentions: number;
  timestamp: string;
}

const TrendingTopics = () => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-trending-topics', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch trending topics');
        const data = await response.json();
        setTopics(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching trending topics:`, error);
        setTopics([]);
        alert('Failed to load trending topics. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchTrendingTopics();

    // Mock real-time updates
    const interval = setInterval(() => {
      setTopics((prev) =>
        prev.length > 0
          ? prev.map((topic) => ({ ...topic, mentions: topic.mentions + Math.floor(Math.random() * 5) }))
          : prev
      );
    }, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4 text-center">Loading trending topics...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Trending Topics 🔥</h2>
      {topics.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {topics.map((topic) => (
            <li key={topic.id} className="p-2 bg-gray-50 rounded">
              <p><strong>#{topic.topic}</strong></p>
              <p className="text-sm text-gray-500">Mentions: {topic.mentions} | Last Updated: {new Date(topic.timestamp).toLocaleTimeString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-600">No trending topics available.</p>
      )}
    </div>
  );
};

export default TrendingTopics;