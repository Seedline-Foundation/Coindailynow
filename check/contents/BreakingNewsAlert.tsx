'use client';

import { useEffect, useState } from 'react';

interface BreakingNews {
  id: string;
  title: string;
  timestamp: string;
}

const BreakingNewsAlert = () => {
  const [news, setNews] = useState<BreakingNews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-breaking-news', {
          signal: controller.signal,
          cache: 'no-store', // Disable caching for real-time data
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error('Error fetching breaking news:', error);
        setNews(null); // Fallback to null
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchBreakingNews();
  }, []);

  if (loading) return <div className="bg-yellow-200 text-center p-2">Loading breaking news...</div>;

  return news ? (
    <div className="bg-red-500 text-white text-center p-2 animate-pulse">
      <strong>Breaking News:</strong> {news.title} ({new Date(news.timestamp).toLocaleTimeString()})
    </div>
  ) : null;
};

export default BreakingNewsAlert;