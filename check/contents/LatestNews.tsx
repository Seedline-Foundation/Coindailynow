'use client';

import { useState, useEffect } from 'react';
import { NewsCard } from './NewsCard';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug: string;
  image?: string;
}

// Mock data - in a real app, this would come from an API
const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High',
    excerpt: 'Bitcoin has surpassed its previous record, reaching a new all-time high amid increased institutional adoption.',
    category: 'Breaking',
    date: '2 hours ago',
    slug: '/news/breaking/bitcoin-new-ath',
  },
  {
    id: '2',
    title: 'Ethereum Upgrade Scheduled for Next Month',
    excerpt: 'The Ethereum network is preparing for its next major upgrade, promising improved scalability and reduced gas fees.',
    category: 'Updates',
    date: '5 hours ago',
    slug: '/news/updates/ethereum-upgrade',
  },
  {
    id: '3',
    title: 'New Regulations Impact Crypto Exchanges',
    excerpt: 'Recent regulatory changes are forcing cryptocurrency exchanges to adapt their compliance procedures.',
    category: 'Policy',
    date: '1 day ago',
    slug: '/news/policy/regulations-impact',
  },
  {
    id: '4',
    title: 'Memecoin Frenzy: New Tokens Gain Traction',
    excerpt: 'Several new memecoins are gaining significant attention from retail investors, with some seeing 1000%+ gains.',
    category: 'Memecoins',
    date: '3 hours ago',
    slug: '/news/memecoins/new-tokens-gain-traction',
  },
];

interface LatestNewsProps {
  limit?: number;
  category?: string;
}

export function LatestNews({ limit = 3, category }: LatestNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let filteredNews = mockNews;
        if (category) {
          filteredNews = mockNews.filter(item => item.category.toLowerCase() === category.toLowerCase());
        }
        
        setNews(filteredNews.slice(0, limit));
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [limit, category]);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit }).map((_, index) => (
          <div key={index} className="h-64 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No news articles found.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((item) => (
        <NewsCard
          key={item.id}
          title={item.title}
          excerpt={item.excerpt}
          category={item.category}
          date={item.date}
          slug={item.slug}
          image={item.image}
        />
      ))}
    </div>
  );
}