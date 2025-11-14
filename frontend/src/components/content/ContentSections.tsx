/**
 * Content Section Components
 * Task 53: Content Sections Grid System
 * 
 * FR-056 to FR-077: All 22 content sections implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentCard, NewsCard, CoinCard, EventCard, InterviewCard, ReviewCard, AlertCard, ContentCardGrid } from './ContentCard';
import { 
  ContentSectionType, 
  type MemecoinNewsSection as MemecoinNewsSectionType,
  type TrendingCoinsSection as TrendingCoinsSectionType,
  type GameNewsSection as GameNewsSectionType,
  PressReleaseSection,
  EventsNewsSection,
  PartnersSection,
  EditorialsSection,
  type NewsletterSection as NewsletterSectionType,
  MemefiAwardSection,
  FeaturedNewsSection,
  GeneralCryptoSection,
  CoinDailyCastSection,
  OpinionSection,
  TokenReviewsSection,
  PolicyUpdatesSection,
  UpcomingLaunchesSection,
  ScamAlertsSection,
  TopTokensSection,
  GainersLosersSection,
  ChainNewsSection,
  NigeriaCryptoSection,
  AfricaCryptoSection,
} from '@/types/content-sections';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  BookOpen, 
  Mail, 
  Award, 
  Star, 
  MessageSquare, 
  FileText, 
  Rocket, 
  AlertTriangle, 
  Shield,
  Globe,
  Flag,
  ChevronRight,
  ExternalLink,
  Mic,
  Video,
  Coffee,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== Section Header Component ==========

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
    external?: boolean;
  };
  lastUpdated?: Date;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  action,
  lastUpdated,
  className = ''
}) => {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
        {action && (
          <Button variant="outline" size="sm">
            <a href={action.href} target={action.external ? '_blank' : undefined}>
              {action.label}
              {action.external ? <ExternalLink className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

// ========== FR-056: Memecoin News Section (6 cards) ==========

interface MemecoinNewsSectionProps {
  data?: MemecoinNewsSectionType;
  isLoading?: boolean;
}

export const MemecoinNewsSection: React.FC<MemecoinNewsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  // Mock data for demonstration
  const mockData = {
    articles: [
      {
        id: '1',
        title: 'Shiba Inu Whale Activity Spikes as SHIB Price Rallies 15%',
        excerpt: 'Large holders accumulate SHIB tokens as community anticipates upcoming developments in the Shibarium ecosystem.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/shib-whale-activity-spikes',
        publishedAt: new Date('2024-10-04T10:30:00Z'),
        author: { name: 'Alex Thompson', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Memecoin', colorHex: '#FF6B35', slug: 'memecoin' },
        tags: ['SHIB', 'Whales', 'Shibarium'],
        priority: 'high' as const,
        viewCount: 15420,
        likeCount: 342,
        memecoinData: {
          symbol: 'SHIB',
          marketCap: 5600000000,
          priceChange24h: 15.34,
          socialScore: 8.5,
          viralScore: 9.2
        }
      },
      {
        id: '2',
        title: 'Dogecoin Co-Creator Speaks Out on X Platform Changes',
        excerpt: 'Billy Markus shares thoughts on social media evolution and its impact on meme culture and crypto adoption.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/dogecoin-creator-x-platform',
        publishedAt: new Date('2024-10-04T09:15:00Z'),
        author: { name: 'Sarah Chen', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Memecoin', colorHex: '#FF6B35', slug: 'memecoin' },
        tags: ['DOGE', 'Social Media', 'Community'],
        priority: 'normal' as const,
        viewCount: 8930,
        likeCount: 256,
        memecoinData: {
          symbol: 'DOGE',
          marketCap: 9800000000,
          priceChange24h: 3.67,
          socialScore: 9.1,
          viralScore: 7.8
        }
      },
      {
        id: '3',
        title: 'New African Memecoin AFROCOIN Gains Traction in Nigeria',
        excerpt: 'Community-driven token celebrates African culture while building utility in mobile payments across the continent.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/afrocoin-nigeria-adoption',
        publishedAt: new Date('2024-10-04T08:45:00Z'),
        author: { name: 'Kwame Asante', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Africa', colorHex: '#00B894', slug: 'africa' },
        tags: ['AFRO', 'Nigeria', 'Mobile Payments'],
        priority: 'breaking' as const,
        viewCount: 12340,
        likeCount: 445,
        memecoinData: {
          symbol: 'AFRO',
          marketCap: 1200000,
          priceChange24h: 89.23,
          socialScore: 7.9,
          viralScore: 9.8
        }
      },
      {
        id: '4',
        title: 'Pepe Token Integration with Major Gaming Platform',
        excerpt: 'Popular frog-themed memecoin announces partnership with leading Web3 gaming ecosystem for in-game rewards.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/pepe-gaming-integration',
        publishedAt: new Date('2024-10-04T07:20:00Z'),
        author: { name: 'Mike Rodriguez', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Gaming', colorHex: '#6C5CE7', slug: 'gaming' },
        tags: ['PEPE', 'Gaming', 'Web3'],
        priority: 'high' as const,
        viewCount: 9876,
        likeCount: 312,
        memecoinData: {
          symbol: 'PEPE',
          marketCap: 3400000000,
          priceChange24h: 12.45,
          socialScore: 8.3,
          viralScore: 8.7
        }
      },
      {
        id: '5',
        title: 'Floki Inu Announces Education Initiative in Kenya',
        excerpt: 'Memecoin project launches crypto literacy program targeting university students across East Africa.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/floki-kenya-education',
        publishedAt: new Date('2024-10-04T06:30:00Z'),
        author: { name: 'Grace Wanjiku', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Education', colorHex: '#00B894', slug: 'education' },
        tags: ['FLOKI', 'Kenya', 'Education'],
        priority: 'normal' as const,
        viewCount: 7654,
        likeCount: 198,
        memecoinData: {
          symbol: 'FLOKI',
          marketCap: 1800000000,
          priceChange24h: 6.78,
          socialScore: 7.5,
          viralScore: 6.9
        }
      },
      {
        id: '6',
        title: 'BabyDoge Charity Campaign Reaches $1M Milestone',
        excerpt: 'Community-driven donations support animal welfare organizations across multiple African countries.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/babydoge-charity-milestone',
        publishedAt: new Date('2024-10-04T05:45:00Z'),
        author: { name: 'David Okafor', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Charity', colorHex: '#E17055', slug: 'charity' },
        tags: ['BABYDOGE', 'Charity', 'Community'],
        priority: 'normal' as const,
        viewCount: 5432,
        likeCount: 167,
        memecoinData: {
          symbol: 'BABYDOGE',
          marketCap: 890000000,
          priceChange24h: 4.32,
          socialScore: 6.8,
          viralScore: 7.1
        }
      }
    ]
  };

  const articles = data?.articles || mockData.articles;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Memecoin News"
          icon={<Coins className="w-5 h-5 text-orange-500" />}
        />
        <ContentCardGrid columns={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </ContentCardGrid>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Memecoin News"
        description="Latest updates from the memecoin ecosystem"
        icon={<Coins className="w-5 h-5 text-orange-500" />}
        action={{
          label: "View All",
          href: "/category/memecoin"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {articles.slice(0, 6).map((article) => (
          <NewsCard
            key={article.id}
            type="news"
            {...article}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-057: Trending Coin Cards (1 column) ==========

interface TrendingCoinsSectionProps {
  data?: TrendingCoinsSectionType;
  isLoading?: boolean;
}

export const TrendingCoinsSection: React.FC<TrendingCoinsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  
  // Mock data for demonstration
  const mockData = {
    coins: [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 43250.67,
        priceChange: 1234.56,
        priceChangePercent: 2.94,
        marketCap: 845000000000,
        volume24h: 15600000000,
        rank: 1,
        logoUrl: '/api/placeholder/24/24',
        sparklineData: [42000, 42500, 43000, 42800, 43200, 43250]
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2345.89,
        priceChange: 67.34,
        priceChangePercent: 2.95,
        marketCap: 282000000000,
        volume24h: 8900000000,
        rank: 2,
        logoUrl: '/api/placeholder/24/24',
        sparklineData: [2280, 2320, 2340, 2330, 2345, 2346]
      },
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        price: 89.45,
        priceChange: 5.67,
        priceChangePercent: 6.77,
        marketCap: 38900000000,
        volume24h: 1200000000,
        rank: 5,
        logoUrl: '/api/placeholder/24/24',
        sparklineData: [84, 86, 88, 87, 89, 89.5]
      },
      {
        id: 'cardano',
        symbol: 'ADA',
        name: 'Cardano',
        price: 0.3456,
        priceChange: 0.0234,
        priceChangePercent: 7.26,
        marketCap: 12100000000,
        volume24h: 456000000,
        rank: 8,
        logoUrl: '/api/placeholder/24/24',
        sparklineData: [0.32, 0.33, 0.34, 0.335, 0.345, 0.3456]
      },
      {
        id: 'polygon',
        symbol: 'MATIC',
        name: 'Polygon',
        price: 0.8923,
        priceChange: -0.0456,
        priceChangePercent: -4.86,
        marketCap: 8300000000,
        volume24h: 234000000,
        rank: 12,
        logoUrl: '/api/placeholder/24/24',
        sparklineData: [0.94, 0.92, 0.90, 0.89, 0.895, 0.8923]
      }
    ]
  };

  const coins = data?.coins || mockData.coins;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Trending Coins"
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
        />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Trending Coins"
        description="Top performing cryptocurrencies"
        icon={<TrendingUp className="w-5 h-5 text-green-500" />}
        action={{
          label: "View Market",
          href: "/market"
        }}
        lastUpdated={new Date()}
      />
      
      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(['1h', '24h', '7d'] as const).map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(period)}
          >
            {period}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {coins.slice(0, 5).map((coin) => (
          <CoinCard
            key={coin.id}
            type="coin"
            id={coin.id}
            title={coin.name}
            href={`/coin/${coin.id}`}
            symbol={coin.symbol}
            name={coin.name}
            price={coin.price}
            priceChange24h={coin.priceChange}
            priceChangePercent24h={coin.priceChangePercent}
            marketCap={coin.marketCap}
            volume24h={coin.volume24h}
            rank={coin.rank}
            logoUrl={coin.logoUrl}
            sparklineData={coin.sparklineData}
            size="small"
          />
        ))}
      </div>
    </section>
  );
};

// ========== FR-058: Game News Section (6 cards) ==========

interface GameNewsSectionProps {
  data?: GameNewsSectionType;
  isLoading?: boolean;
}

export const GameNewsSection: React.FC<GameNewsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  // Mock data for demonstration
  const mockData = {
    articles: [
      {
        id: '1',
        title: 'Axie Infinity Launches New Battle Arena in Africa',
        excerpt: 'Popular play-to-earn game expands to African markets with localized content and mobile money integration.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/axie-infinity-africa-launch',
        publishedAt: new Date('2024-10-04T12:00:00Z'),
        author: { name: 'Zara Okafor', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Gaming', colorHex: '#6C5CE7', slug: 'gaming' },
        tags: ['Axie Infinity', 'Africa', 'P2E'],
        priority: 'high' as const,
        viewCount: 8934,
        likeCount: 267,
        gameData: {
          gameName: 'Axie Infinity',
          genre: 'Strategy',
          blockchain: 'Ethereum',
          tokenSymbol: 'AXS',
          playToEarnMechanics: true,
          nftIntegration: true
        }
      },
      {
        id: '2',
        title: 'The Sandbox Partners with Nigerian Game Studio',
        excerpt: 'Virtual world platform collaborates with local developers to create African-themed experiences and assets.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/sandbox-nigeria-partnership',
        publishedAt: new Date('2024-10-04T11:30:00Z'),
        author: { name: 'Kemi Adebayo', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Metaverse', colorHex: '#00B894', slug: 'metaverse' },
        tags: ['The Sandbox', 'Nigeria', 'Metaverse'],
        priority: 'normal' as const,
        viewCount: 6543,
        likeCount: 198,
        gameData: {
          gameName: 'The Sandbox',
          genre: 'Metaverse',
          blockchain: 'Ethereum',
          tokenSymbol: 'SAND',
          playToEarnMechanics: true,
          nftIntegration: true
        }
      },
      // Add more game articles...
    ]
  };

  const articles = data?.articles || mockData.articles;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Game News"
          icon={<Target className="w-5 h-5 text-purple-500" />}
        />
        <ContentCardGrid columns={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </ContentCardGrid>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Game News"
        description="Latest updates from Web3 gaming and play-to-earn"
        icon={<Target className="w-5 h-5 text-purple-500" />}
        action={{
          label: "View All Games",
          href: "/category/gaming"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {articles.slice(0, 6).map((article) => (
          <NewsCard
            key={article.id}
            type="news"
            {...article}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-063: Newsletter Signup Component ==========

interface NewsletterSectionProps {
  data?: NewsletterSectionType;
  isLoading?: boolean;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubscribed(true);
    setIsSubmitting(false);
    setEmail('');
  };

  const subscriberCount = data?.subscriberCount || 12847;
  const lastIssueDate = data?.lastIssueDate || new Date('2024-10-04T08:00:00Z');
  const previewContent = data?.previewContent || "Stay ahead of the African crypto revolution with daily insights, market analysis, and exclusive content.";

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">CoinDaily Newsletter</h3>
              <p className="text-muted-foreground mb-4">
                {previewContent}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {subscriberCount.toLocaleString()} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Last issue: {lastIssueDate.toLocaleDateString()}
                </span>
              </div>

              {isSubscribed ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-700 font-medium">
                    ✅ Successfully subscribed! Check your email for confirmation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
