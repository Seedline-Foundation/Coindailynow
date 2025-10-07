/**
 * Task 54 Demo - Landing Page Interactive Features
 * Comprehensive demonstration of all implemented features
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  InfiniteScroll,
  useInfiniteScroll,
  FadeIn,
  HoverCard,
  EnhancedMarquee,
  VisualCue,
  CategoryNavigation,
  SectionHeader,
  BackToTopButton,
  AccessibleButton,
  SkipLink,
  RealTimeDataProvider,
  ConnectionStatus,
  RealTimePrice,
  ProgressiveContent,
  LazyLoad,
  Skeleton,
} from '@/components/interactive';

// Demo data
const demoCategories = [
  { id: 'all', name: 'All Features', icon: '✨', count: 15 },
  { id: 'animations', name: 'Animations', icon: '🎬', count: 8 },
  { id: 'navigation', name: 'Navigation', icon: '🧭', count: 4 },
  { id: 'accessibility', name: 'Accessibility', icon: '♿', count: 6 },
  { id: 'realtime', name: 'Real-time', icon: '⚡', count: 3 },
];

const demoArticles = Array.from({ length: 50 }, (_, i) => ({
  id: i.toString(),
  title: `Interactive Feature Demo ${i + 1}: ${['Infinite Scroll', 'Animations', 'Hover Effects', 'Accessibility', 'Real-time Data'][i % 5]}`,
  excerpt: `This demonstrates the ${['infinite scrolling', 'smooth animations', 'hover interactions', 'accessibility features', 'real-time updates'][i % 5]} implemented in Task 54.`,
  category: ['animations', 'navigation', 'accessibility', 'realtime', 'all'][i % 5],
  isNew: i < 5,
  isTrending: i % 3 === 0,
  isPremium: i % 7 === 0,
}));

const demoMarqueeItems = [
  { symbol: 'BTC', price: 43250.00, change: '+2.5%', isPositive: true },
  { symbol: 'ETH', price: 2650.75, change: '-1.2%', isPositive: false },
  { symbol: 'DOGE', price: 0.082, change: '+5.8%', isPositive: true },
  { symbol: 'ADA', price: 0.45, change: '+3.2%', isPositive: true },
  { symbol: 'SOL', price: 98.50, change: '-0.8%', isPositive: false },
];

export default function Task54Demo() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFeatures, setShowFeatures] = useState(true);

  // Infinite scroll setup
  const { items, isLoading, hasMoreItems, loadMore } = useInfiniteScroll<typeof demoArticles[0]>();

  const loadMoreArticles = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const startIndex = items.length;
    const newItems = demoArticles.slice(startIndex, startIndex + 10);
    return newItems;
  };

  const renderArticle = (article: typeof demoArticles[0], index: number) => (
    <HoverCard
      key={article.id}
      className="bg-white rounded-lg border border-gray-200 p-6 interactive-card"
      hoverScale={1.02}
      hoverShadow={true}
      clickable={true}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
            {article.category}
          </span>
          {article.isNew && <VisualCue type="new" />}
          {article.isTrending && <VisualCue type="trending" />}
          {article.isPremium && <VisualCue type="premium" />}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-gray-600 line-clamp-2">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">Demo #{parseInt(article.id) + 1}</span>
          <AccessibleButton
            variant="primary"
            size="sm"
            onClick={() => console.log('Article clicked:', article.id)}
            ariaLabel={`Read article: ${article.title}`}
          >
            Read More
          </AccessibleButton>
        </div>
      </div>
    </HoverCard>
  );

  return (
    <RealTimeDataProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Skip Links */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#features">Skip to features</SkipLink>

        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  ← Back to Main
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  Task 54: Interactive Features Demo
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <ConnectionStatus showText={true} />
                <AccessibleButton
                  variant="secondary"
                  onClick={() => setShowFeatures(!showFeatures)}
                  ariaLabel="Toggle features display"
                >
                  {showFeatures ? 'Hide' : 'Show'} Features
                </AccessibleButton>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Marquee */}
        <EnhancedMarquee
          speed={60}
          pauseOnHover={true}
          gradientEdges={true}
          className="bg-blue-50 border-y border-blue-200"
        >
          <div className="flex items-center space-x-8 py-3 px-4">
            {demoMarqueeItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-bold">{item.symbol}</span>
                <span className="text-gray-700">${item.price.toLocaleString()}</span>
                <span className={item.isPositive ? 'text-green-600' : 'text-red-600'}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </EnhancedMarquee>

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Features Overview */}
          {showFeatures && (
            <FadeIn delay={200}>
              <section className="mb-12 bg-white rounded-lg shadow-sm border p-8">
                <SectionHeader
                  id="features"
                  title="Task 54: Interactive Features Implementation"
                  subtitle="Complete coverage of FR-081 to FR-095"
                  level={2}
                  icon="🎯"
                />
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <HoverCard className="p-4 border rounded-lg hover-lift">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">🔄 Infinite Scrolling</h4>
                      <p className="text-sm text-gray-600">FR-081: Seamless content loading with performance optimization</p>
                      <div className="flex gap-2">
                        <VisualCue type="new" />
                        <span className="text-xs text-gray-500">Virtual scrolling supported</span>
                      </div>
                    </div>
                  </HoverCard>

                  <HoverCard className="p-4 border rounded-lg hover-lift">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">🎬 Smooth Animations</h4>
                      <p className="text-sm text-gray-600">FR-082, FR-093: Hardware-accelerated transitions and effects</p>
                      <div className="flex gap-2">
                        <VisualCue type="trending" />
                        <span className="text-xs text-gray-500">Respects motion preferences</span>
                      </div>
                    </div>
                  </HoverCard>

                  <HoverCard className="p-4 border rounded-lg hover-lift">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">🎯 Hover Effects</h4>
                      <p className="text-sm text-gray-600">FR-083: Interactive hover states with visual feedback</p>
                      <div className="flex gap-2">
                        <VisualCue type="hot" />
                        <span className="text-xs text-gray-500">Touch-friendly design</span>
                      </div>
                    </div>
                  </HoverCard>

                  <HoverCard className="p-4 border rounded-lg hover-lift">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">📱 Mobile-First Design</h4>
                      <p className="text-sm text-gray-600">FR-085: Responsive layout optimized for all devices</p>
                      <div className="flex gap-2">
                        <VisualCue type="premium" />
                        <span className="text-xs text-gray-500">Progressive enhancement</span>
                      </div>
                    </div>
                  </HoverCard>

                  <HoverCard className="p-4 border rounded-lg hover-lift">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">♿ Accessibility</h4>
                      <p className="text-sm text-gray-600">FR-095: WCAG 2.1 compliant with ARIA labels</p>
                      <div className="flex gap-2">
                        <VisualCue type="updated" />
                        <span className="text-xs text-gray-500">Keyboard navigation</span>
                      </div>
                    </div>
                  </HoverCard>

                  <HoverCard className="p-4 border rounded-lg hover-lift">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">⚡ Real-time Data</h4>
                      <p className="text-sm text-gray-600">FR-092: Live updates with WebSocket integration</p>
                      <div className="flex gap-2">
                        <VisualCue type="hot" animate={true} />
                        <span className="text-xs text-gray-500">Automatic reconnection</span>
                      </div>
                    </div>
                  </HoverCard>
                </div>
              </section>
            </FadeIn>
          )}

          {/* Category Navigation */}
          <FadeIn delay={400}>
            <section className="mb-8">
              <CategoryNavigation
                categories={demoCategories}
                onCategoryChange={setActiveCategory}
                showCounts={true}
                className="bg-white rounded-lg shadow-sm border p-4"
              />
            </section>
          </FadeIn>

          {/* Real-time Price Demo */}
          <FadeIn delay={600}>
            <section className="mb-8 bg-white rounded-lg shadow-sm border p-6">
              <SectionHeader
                id="realtime-demo"
                title="Real-time Price Updates"
                subtitle="Live cryptocurrency data with WebSocket connection"
                level={3}
                icon="📈"
              />
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {demoMarqueeItems.map((item) => (
                  <HoverCard key={item.symbol} className="p-4 border rounded-lg text-center">
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">{item.symbol}</h4>
                      <LazyLoad>
                        <RealTimePrice
                          symbol={item.symbol}
                          showChange={true}
                          showChart={true}
                        />
                      </LazyLoad>
                    </div>
                  </HoverCard>
                ))}
              </div>
            </section>
          </FadeIn>

          {/* Progressive Content Demo */}
          <FadeIn delay={800}>
            <section className="mb-8 bg-white rounded-lg shadow-sm border p-6">
              <SectionHeader
                id="progressive-demo"
                title="Progressive Content Loading"
                subtitle="Gradual content reveal with loading states"
                level={3}
                icon="📦"
              />
              
              <div className="mt-4">
                <ProgressiveContent
                  items={demoArticles.slice(0, 12)}
                  renderItem={(item, index) => (
                    <div key={item.id} className="p-3 border rounded hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{item.title}</h5>
                          <p className="text-sm text-gray-600 line-clamp-1">{item.excerpt}</p>
                        </div>
                        {item.isNew && <VisualCue type="new" />}
                      </div>
                    </div>
                  )}
                  batchSize={4}
                  loadDelay={300}
                  loadMoreTrigger="button"
                  buttonText="Load Next Batch"
                  showProgress={true}
                />
              </div>
            </section>
          </FadeIn>

          {/* Infinite Scroll Demo */}
          <FadeIn delay={1000}>
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <SectionHeader
                id="infinite-scroll-demo"
                title="Infinite Scroll Articles"
                subtitle={`Showing articles for: ${activeCategory}`}
                level={3}
                icon="🔄"
                actions={
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{items.length} loaded</span>
                    <VisualCue type="updated" animate={isLoading} />
                  </div>
                }
              />
              
              <div className="mt-6">
                <InfiniteScroll
                  items={items}
                  loadMore={loadMoreArticles}
                  renderItem={renderArticle}
                  hasMoreItems={hasMoreItems}
                  isLoading={isLoading}
                  threshold={200}
                  className="space-y-4"
                  loadingComponent={
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} variant="rounded" height={120} />
                      ))}
                    </div>
                  }
                />
              </div>
            </section>
          </FadeIn>
        </main>

        {/* Back to Top Button */}
        <BackToTopButton />

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-lg font-bold mb-2">Task 54 Implementation Complete ✅</h3>
            <p className="text-gray-400 mb-4">
              All 15 functional requirements (FR-081 to FR-095) successfully implemented
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <VisualCue type="new" />
              <span className="text-sm">Infinite Scroll</span>
              <VisualCue type="trending" />
              <span className="text-sm">Animations</span>
              <VisualCue type="hot" />
              <span className="text-sm">Hover Effects</span>
              <VisualCue type="premium" />
              <span className="text-sm">Accessibility</span>
              <VisualCue type="updated" />
              <span className="text-sm">Real-time Data</span>
            </div>
          </div>
        </footer>
      </div>
    </RealTimeDataProvider>
  );
}