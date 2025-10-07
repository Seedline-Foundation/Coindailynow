/**
 * Enhanced Landing Page - Task 54 Implementation
 * Integrates all interactive features: infinite scroll, animations, navigation, accessibility, real-time data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Header, 
  HeroSection, 
  ThreeColumnLayout,
  LeftSidebar,
  RightSidebar 
} from '@/components/landing';
import { ContentGrid } from '@/components/content';
import {
  InfiniteScroll,
  useInfiniteScroll,
  FadeIn,
  HoverCard,
  CategoryNavigation,
  SectionHeader,
  BackToTopButton,
  TableOfContents,
  SkipLink,
  LiveRegion,
  RealTimeDataProvider,
  ConnectionStatus,
  ProgressiveContent,
  useAutoRefresh,
  VisualCue,
} from '@/components/interactive';

// Mock data generator for infinite scroll
const generateMockArticles = (page: number): any[] => {
  const articles: any[] = [];
  const categories = ['Bitcoin', 'DeFi', 'Memecoin', 'Nigeria', 'Africa', 'Regulation'];
  const authors = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Maria Garcia', 'David Wilson'];
  
  for (let i = 0; i < 10; i++) {
    const id = (page - 1) * 10 + i + 1;
    articles.push({
      id: id.toString(),
      title: `Cryptocurrency News Article ${id}: ${categories[Math.floor(Math.random() * categories.length)]} Update`,
      excerpt: `This is a sample excerpt for article ${id}. It provides a brief overview of the cryptocurrency market developments and trends in Africa.`,
      author: authors[Math.floor(Math.random() * authors.length)],
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      readTime: `${Math.floor(Math.random() * 8) + 2} min read`,
      category: categories[Math.floor(Math.random() * categories.length)],
      imageUrl: `https://picsum.photos/400/200?random=${id}`,
      isNew: Math.random() > 0.7,
      isTrending: Math.random() > 0.8,
      isPremium: Math.random() > 0.9,
    });
  }
  return articles;
};

export default function EnhancedLandingPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock featured news data
  const featuredNews = [
    {
      id: '1',
      title: 'Bitcoin Reaches New All-Time High in Nigeria',
      excerpt: 'Nigerian cryptocurrency market sees unprecedented growth as Bitcoin reaches new heights amid economic uncertainty.',
      category: 'Bitcoin',
      publishedAt: new Date().toISOString(),
      imageUrl: 'https://picsum.photos/800/400?random=1',
      author: 'John Doe',
      readTime: '5 min read',
      slug: 'bitcoin-ath-nigeria',
      isBreaking: true,
    },
    {
      id: '2',
      title: 'African Central Banks Consider Digital Currency',
      excerpt: 'Multiple African nations explore central bank digital currencies as payment solutions for the continent.',
      category: 'Regulation',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      imageUrl: 'https://picsum.photos/800/400?random=2',
      author: 'Jane Smith',
      readTime: '7 min read',
      slug: 'cbdc-africa',
    },
  ];

  const breakingNews = [
    {
      id: '3',
      title: 'BREAKING: Major Exchange Lists New African Token',
      excerpt: 'Binance announces listing of new African cryptocurrency token focused on remittances.',
      category: 'DeFi',
      publishedAt: new Date(Date.now() - 1800000).toISOString(),
      author: 'Alex Johnson',
      readTime: '3 min read',
      slug: 'binance-african-token',
      isBreaking: true,
    },
  ];

  // Categories for navigation
  const categories = [
    { id: 'all', name: 'All News', icon: '📰', count: 1247 },
    { id: 'bitcoin', name: 'Bitcoin', icon: '₿', count: 342 },
    { id: 'defi', name: 'DeFi', icon: '🏦', count: 189 },
    { id: 'memecoin', name: 'Memecoins', icon: '🐕', count: 156 },
    { id: 'africa', name: 'Africa', icon: '🌍', count: 234 },
    { id: 'regulation', name: 'Regulation', icon: '⚖️', count: 98 },
  ];

  // Table of contents sections
  const tocSections = [
    { id: 'hero', title: 'Featured News', level: 1 },
    { id: 'trending', title: 'Trending Stories', level: 1 },
    { id: 'content-grid', title: 'Content Sections', level: 1 },
    { id: 'latest-articles', title: 'Latest Articles', level: 1 },
    { id: 'market-data', title: 'Market Data', level: 1 },
  ];

  // Infinite scroll setup
  const { items, isLoading: loadingMore, error, hasMoreItems, loadMore } = useInfiniteScroll<any>();

  const fetchMoreArticles = async (): Promise<any[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const page = Math.floor(items.length / 10) + 1;
    const newArticles = generateMockArticles(page);
    return newArticles;
  };

  // Auto-refresh for real-time updates
  const { refresh } = useAutoRefresh(async () => {
    // Simulate fetching new announcements
    const newAnnouncement = `Market update at ${new Date().toLocaleTimeString()}: Bitcoin reaches new daily high!`;
    setAnnouncements(prev => [newAnnouncement, ...prev.slice(0, 4)]);
  }, 30000); // Refresh every 30 seconds

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading
      setIsLoading(false);
    };
    
    initializeData();
  }, []);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    // In a real app, this would filter the articles
    console.log('Category changed to:', categoryId);
  };

  // Article renderer for infinite scroll
  const renderArticle = (article: any, index: number) => (
    <HoverCard
      key={article.id}
      className="bg-white rounded-lg border border-gray-200 p-6 interactive-card"
      hoverScale={1.02}
      hoverShadow={true}
      clickable={true}
      onClick={() => console.log('Article clicked:', article.id)}
    >
      <article className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                {article.category}
              </span>
              {article.isNew && <VisualCue type="new" animate={false} />}
              {article.isTrending && <VisualCue type="trending" animate={true} />}
              {article.isPremium && <VisualCue type="premium" animate={false} />}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-gray-600 mb-3 line-clamp-2">
              {article.excerpt}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>By {article.author}</span>
              <span>•</span>
              <span>{article.readTime}</span>
              <span>•</span>
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {article.imageUrl && (
            <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </article>
    </HoverCard>
  );

  return (
    <RealTimeDataProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Skip Links for Accessibility */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#navigation">Skip to navigation</SkipLink>

        {/* Live Region for Announcements */}
        <LiveRegion politeness="polite">
          {announcements.length > 0 && announcements[0]}
        </LiveRegion>

        {/* Connection Status */}
        <ConnectionStatus position="fixed" />

        {/* Header */}
        <FadeIn delay={0}>
          <Header />
        </FadeIn>

        {/* Main Content */}
        <main id="main-content" className="relative">
          {/* Hero Section */}
          <section id="section-hero" className="relative">
            <FadeIn delay={200}>
              <HeroSection 
                featuredNews={featuredNews}
                breakingNews={breakingNews}
              />
            </FadeIn>
          </section>

          {/* Category Navigation */}
          <section className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <FadeIn delay={400}>
                <CategoryNavigation
                  categories={categories}
                  onCategoryChange={handleCategoryChange}
                  variant="horizontal"
                  showCounts={true}
                />
              </FadeIn>
            </div>
          </section>

          {/* Main Layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ThreeColumnLayout
              leftColumn={
                <FadeIn delay={600} direction="left">
                  <LeftSidebar />
                </FadeIn>
              }
              centerColumn={
                <div className="space-y-12">
                  {/* Trending Section */}
                  <section id="section-trending">
                    <FadeIn delay={800}>
                      <SectionHeader
                        id="trending"
                        title="Trending Stories"
                        subtitle="Most popular cryptocurrency news in Africa"
                        count={156}
                        icon="📈"
                        level={2}
                        onHeaderClick={(id) => console.log('Header clicked:', id)}
                      />
                    </FadeIn>

                    <FadeIn delay={1000}>
                      <div className="mt-6">
                        <ProgressiveContent
                          items={generateMockArticles(1).slice(0, 6)}
                          renderItem={(item, index) => (
                            <HoverCard
                              key={item.id}
                              className="bg-white rounded-lg border border-gray-200 p-4 interactive-card"
                              hoverScale={1.01}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <h4 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h4>
                                <VisualCue type="hot" animate={true} />
                              </div>
                            </HoverCard>
                          )}
                          batchSize={3}
                          loadDelay={200}
                          loadMoreTrigger="time"
                          showProgress={true}
                        />
                      </div>
                    </FadeIn>
                  </section>

                  {/* Content Grid */}
                  <section id="section-content-grid">
                    <FadeIn delay={1200}>
                      <SectionHeader
                        id="content-grid"
                        title="Content Sections"
                        subtitle="Comprehensive cryptocurrency coverage"
                        level={2}
                      />
                    </FadeIn>

                    <FadeIn delay={1400}>
                      <div className="mt-6">
                        <ContentGrid />
                      </div>
                    </FadeIn>
                  </section>

                  {/* Latest Articles with Infinite Scroll */}
                  <section id="section-latest-articles">
                    <FadeIn delay={1600}>
                      <SectionHeader
                        id="latest-articles"
                        title="Latest Articles"
                        subtitle="Real-time cryptocurrency news updates"
                        level={2}
                        actions={
                          <button
                            onClick={refresh}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            aria-label="Refresh articles"
                          >
                            🔄
                          </button>
                        }
                      />
                    </FadeIn>

                    <div className="mt-6">
                      <InfiniteScroll
                        items={items}
                        loadMore={fetchMoreArticles}
                        renderItem={renderArticle}
                        hasMoreItems={hasMoreItems}
                        isLoading={loadingMore}
                        error={error}
                        threshold={300}
                        className="space-y-6"
                      />
                    </div>
                  </section>
                </div>
              }
              rightColumn={
                <FadeIn delay={1800} direction="right">
                  <RightSidebar />
                </FadeIn>
              }
              showAds={true}
              adKeywords={['cryptocurrency', 'bitcoin', 'africa', 'trading', activeCategory]}
            />
          </div>
        </main>

        {/* Table of Contents */}
        <TableOfContents
          sections={tocSections}
          position="fixed"
          showActiveIndicator={true}
        />

        {/* Back to Top Button */}
        <BackToTopButton />

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <FadeIn delay={2000}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h3 className="text-xl font-bold mb-4">CoinDaily Africa</h3>
              <p className="text-gray-400">
                Africa's premier cryptocurrency news platform with interactive features
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <VisualCue type="new" />
                <span className="text-sm">Real-time updates</span>
                <VisualCue type="trending" />
                <span className="text-sm">Interactive content</span>
                <VisualCue type="premium" />
                <span className="text-sm">Accessibility compliant</span>
              </div>
            </div>
          </FadeIn>
        </footer>
      </div>
    </RealTimeDataProvider>
  );
}