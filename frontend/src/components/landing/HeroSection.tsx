'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  isBreaking?: boolean;
  author: string;
  readTime: string;
  slug: string;
}

interface HeroSectionProps {
  featuredNews: NewsItem[];
  breakingNews: NewsItem[];
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  featuredNews = [],
  breakingNews = [],
  className = '',
}) => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Set initial selected news
  useEffect(() => {
    if (featuredNews.length > 0) {
      setSelectedNews(featuredNews[0]);
    }
  }, [featuredNews]);

  const handleNewsHover = (news: NewsItem) => {
    setSelectedNews(news);
    setHoveredCard(news.id);
  };

  const handleNewsLeave = () => {
    setHoveredCard(null);
  };

  return (
    <section className={`relative bg-gradient-to-br from-slate-50 to-blue-50 py-12 lg:py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breaking News Banner */}
        {breakingNews.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="font-semibold uppercase text-sm tracking-wide">Breaking News</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <Link 
                href={`/news/${breakingNews[0].slug}`}
                className="block hover:text-blue-600 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {breakingNews[0].title}
                </h3>
                <p className="text-gray-600 mt-2 line-clamp-2">
                  {breakingNews[0].excerpt}
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Main Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Featured Article */}
          <div className="space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary" className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Latest News
              </Badge>
              
              {selectedNews && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedNews.category}
                    </span>
                    <span>{selectedNews.author}</span>
                    <span>•</span>
                    <span>{selectedNews.readTime}</span>
                  </div>
                  
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
                    {selectedNews.title}
                  </h1>
                  
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {selectedNews.excerpt}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href={`/news/${selectedNews.slug}`}>
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        Read Full Article
                        <ChevronRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    
                    <Button variant="outline" size="lg" className="border-gray-300">
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Listen to Article
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Featured News Grid */}
          <div className="space-y-6">
            {selectedNews?.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            )}
            
            {/* News Preview Cards */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Top Stories</h3>
              
              <div className="space-y-3">
                {featuredNews.slice(0, 4).map((news) => (
                  <div
                    key={news.id}
                    className={`p-4 bg-white rounded-lg border cursor-pointer transition-all duration-200 ${
                      hoveredCard === news.id 
                        ? 'border-blue-300 shadow-md transform scale-[1.02]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onMouseEnter={() => handleNewsHover(news)}
                    onMouseLeave={handleNewsLeave}
                  >
                    <div className="flex gap-3">
                      {news.imageUrl && (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={news.imageUrl}
                            alt={news.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-blue-600 font-medium">
                            {news.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {news.publishedAt}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {news.title}
                        </h4>
                        
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {news.excerpt}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                View All News
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;