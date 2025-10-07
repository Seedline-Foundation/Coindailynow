/**
 * Final Content Section Components
 * Task 53: Content Sections Grid System (Final Part)
 * 
 * FR-062, FR-065, FR-066, FR-068 to FR-071, FR-073 to FR-077: Remaining sections
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentCard, NewsCard, CoinCard, ReviewCard, ContentCardGrid } from './ContentCard';
import type { 
  EditorialsSection as EditorialsSectionType,
  FeaturedNewsSection as FeaturedNewsSectionType,
  GeneralCryptoSection as GeneralCryptoSectionType,
  OpinionSection as OpinionSectionType,
  TokenReviewsSection as TokenReviewsSectionType,
  PolicyUpdatesSection as PolicyUpdatesSectionType,
  UpcomingLaunchesSection as UpcomingLaunchesSectionType,
  TopTokensSection as TopTokensSectionType,
  GainersLosersSection as GainersLosersSectionType,
  ChainNewsSection as ChainNewsSectionType,
  NigeriaCryptoSection as NigeriaCryptoSectionType,
  AfricaCryptoSection as AfricaCryptoSectionType,
} from '@/types/content-sections';
import { 
  BookOpen,
  Star,
  MessageSquare,
  ThumbsUp,
  Scale,
  Rocket,
  TrendingUp,
  TrendingDown,
  Link2,
  Flag,
  Globe,
  ChevronRight,
  ExternalLink,
  PenTool,
  Newspaper,
  Bitcoin,
  Eye,
  Heart,
  Clock,
  User,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import SectionHeader from previous file
const SectionHeader: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string; external?: boolean; };
  lastUpdated?: Date;
  className?: string;
}> = ({ title, description, icon, action, lastUpdated, className = '' }) => {
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

// ========== FR-062: Editorials Section (6 cards) ==========

interface EditorialsSectionProps {
  data?: EditorialsSectionType;
  isLoading?: boolean;
}

export const EditorialsSection: React.FC<EditorialsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    editorials: [
      {
        id: '1',
        title: 'Why Africa Will Lead the Next Crypto Revolution',
        excerpt: 'Mobile-first infrastructure and payment innovation position African nations as global crypto pioneers.',
        imageUrl: '/api/placeholder/400/250',
        href: '/editorial/africa-crypto-revolution',
        publishedAt: new Date('2024-10-04T12:00:00Z'),
        author: { name: 'Amara Okafor', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Editorial', colorHex: '#6c5ce7', slug: 'editorial' },
        tags: ['Africa', 'Innovation', 'Mobile Payments'],
        priority: 'high' as const,
        viewCount: 15420,
        likeCount: 892,
        editorialData: {
          editorId: 'editor1',
          editorName: 'Amara Okafor',
          editorAvatar: '/api/placeholder/32/32',
          stance: 'bullish' as const,
          credibilityScore: 9.2,
          isOpinion: false
        }
      },
      {
        id: '2',
        title: 'The Hidden Costs of Crypto Regulation in Nigeria',
        excerpt: 'Examining how recent policy changes impact innovation and financial inclusion in West Africa.',
        imageUrl: '/api/placeholder/400/250',
        href: '/editorial/nigeria-regulation-costs',
        publishedAt: new Date('2024-10-04T10:30:00Z'),
        author: { name: 'Dr. Kemi Adebayo', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Policy', colorHex: '#e17055', slug: 'policy' },
        tags: ['Nigeria', 'Regulation', 'Policy'],
        priority: 'normal' as const,
        viewCount: 8934,
        likeCount: 445,
        editorialData: {
          editorId: 'editor2',
          editorName: 'Dr. Kemi Adebayo',
          editorAvatar: '/api/placeholder/32/32',
          stance: 'neutral' as const,
          credibilityScore: 8.7,
          isOpinion: false
        }
      },
      // Add more editorials...
    ]
  };

  const editorials = data?.editorials || mockData.editorials;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Editorials"
          icon={<PenTool className="w-5 h-5 text-purple-500" />}
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
        title="Editorials"
        description="Expert analysis and thought leadership"
        icon={<PenTool className="w-5 h-5 text-purple-500" />}
        action={{
          label: "All Editorials",
          href: "/editorials"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {editorials.slice(0, 6).map((editorial) => (
          <NewsCard
            key={editorial.id}
            type="news"
            {...editorial}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-065: Featured News Section (6 cards) ==========

interface FeaturedNewsSectionProps {
  data?: FeaturedNewsSectionType;
  isLoading?: boolean;
}

export const FeaturedNewsSection: React.FC<FeaturedNewsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    featuredArticles: [
      {
        id: '1',
        title: 'Bitcoin ETF Approval Sparks African Exchange Expansion',
        excerpt: 'Major cryptocurrency exchanges announce plans to expand services across African markets following regulatory clarity.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/bitcoin-etf-africa-expansion',
        publishedAt: new Date('2024-10-04T14:00:00Z'),
        author: { name: 'Samuel Kibiru', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Breaking', colorHex: '#e74c3c', slug: 'breaking' },
        tags: ['Bitcoin', 'ETF', 'Africa'],
        priority: 'breaking' as const,
        viewCount: 25430,
        likeCount: 1250,
        featuredReason: 'breaking' as const,
        featuredUntil: new Date('2024-10-05T00:00:00Z'),
        impressions: 125000
      },
      {
        id: '2',
        title: 'Ethereum Merge Anniversary: African Staking Pools Surge',
        excerpt: 'One year after The Merge, African-based staking pools report 300% growth in participation.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/ethereum-africa-staking-growth',
        publishedAt: new Date('2024-10-04T13:00:00Z'),
        author: { name: 'Grace Wanjiku', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Analysis', colorHex: '#3498db', slug: 'analysis' },
        tags: ['Ethereum', 'Staking', 'Africa'],
        priority: 'high' as const,
        viewCount: 18230,
        likeCount: 756,
        featuredReason: 'trending' as const,
        featuredUntil: new Date('2024-10-05T00:00:00Z'),
        impressions: 89000
      },
      // Add more featured articles...
    ]
  };

  const featuredArticles = data?.featuredArticles || mockData.featuredArticles;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Featured News"
          icon={<Star className="w-5 h-5 text-yellow-500" />}
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
        title="Featured News"
        description="Top stories handpicked by our editorial team"
        icon={<Star className="w-5 h-5 text-yellow-500" />}
        action={{
          label: "All News",
          href: "/news"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {featuredArticles.slice(0, 6).map((article) => (
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

// ========== FR-066: General Crypto News (6 cards) ==========

interface GeneralCryptoSectionProps {
  data?: GeneralCryptoSectionType;
  isLoading?: boolean;
}

export const GeneralCryptoSection: React.FC<GeneralCryptoSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    articles: [
      {
        id: '1',
        title: 'DeFi Total Value Locked Reaches New All-Time High',
        excerpt: 'Decentralized finance protocols collectively hold over $100 billion in locked assets.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/defi-tvl-ath',
        publishedAt: new Date('2024-10-04T11:00:00Z'),
        author: { name: 'Alex Thompson', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'DeFi', colorHex: '#00b894', slug: 'defi' },
        tags: ['DeFi', 'TVL', 'Market'],
        priority: 'normal' as const,
        viewCount: 12340,
        likeCount: 567
      },
      // Add more general crypto articles...
    ]
  };

  const articles = data?.articles || mockData.articles;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="General Crypto News"
          icon={<Bitcoin className="w-5 h-5 text-orange-500" />}
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
        title="General Crypto News"
        description="Latest updates from the global cryptocurrency market"
        icon={<Bitcoin className="w-5 h-5 text-orange-500" />}
        action={{
          label: "All Crypto News",
          href: "/category/crypto"
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

// ========== FR-069: Token Project Review (6 cards) ==========

interface TokenReviewsSectionProps {
  data?: TokenReviewsSectionType;
  isLoading?: boolean;
}

export const TokenReviewsSection: React.FC<TokenReviewsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    reviews: [
      {
        id: '1',
        tokenSymbol: 'ADA',
        tokenName: 'Cardano',
        contractAddress: '0x...',
        blockchain: 'Cardano',
        overallScore: 8.5,
        scores: {
          technology: 9.0,
          team: 8.5,
          tokenomics: 7.5,
          community: 9.0,
          useCases: 8.0
        },
        summary: 'Strong academic foundation with peer-reviewed research, but slower development pace.',
        pros: ['Peer-reviewed research', 'Strong academic team', 'Sustainability focus'],
        cons: ['Slow development', 'Limited dApps', 'High complexity'],
        reviewedBy: 'CoinDaily Research Team',
        reviewDate: new Date('2024-10-01T00:00:00Z'),
        lastUpdated: new Date('2024-10-04T00:00:00Z'),
        logoUrl: '/api/placeholder/64/64',
        href: '/reviews/cardano-ada'
      },
      {
        id: '2',
        tokenSymbol: 'SOL',
        tokenName: 'Solana',
        contractAddress: '0x...',
        blockchain: 'Solana',
        overallScore: 7.8,
        scores: {
          technology: 8.5,
          team: 8.0,
          tokenomics: 7.0,
          community: 8.5,
          useCases: 7.5
        },
        summary: 'High-performance blockchain with growing ecosystem, but concerns about centralization.',
        pros: ['High throughput', 'Low fees', 'Growing dApp ecosystem'],
        cons: ['Network instability', 'Centralization concerns', 'High validator requirements'],
        reviewedBy: 'CoinDaily Research Team',
        reviewDate: new Date('2024-09-28T00:00:00Z'),
        lastUpdated: new Date('2024-10-04T00:00:00Z'),
        logoUrl: '/api/placeholder/64/64',
        href: '/reviews/solana-sol'
      },
      // Add more token reviews...
    ]
  };

  const reviews = data?.reviews || mockData.reviews;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Token Reviews"
          icon={<ThumbsUp className="w-5 h-5 text-blue-500" />}
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
        title="Token Reviews"
        description="In-depth analysis of cryptocurrency projects"
        icon={<ThumbsUp className="w-5 h-5 text-blue-500" />}
        action={{
          label: "All Reviews",
          href: "/reviews"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {reviews.slice(0, 6).map((review) => (
          <ReviewCard
            key={review.id}
            type="review"
            id={review.id}
            title={`${review.tokenName} Review`}
            excerpt={review.summary}
            href={review.href}
            publishedAt={review.reviewDate}
            author={{ name: review.reviewedBy }}
            category={{ name: 'Review', colorHex: '#3498db', slug: 'review' }}
            tags={[review.tokenSymbol, review.blockchain]}
            tokenSymbol={review.tokenSymbol}
            tokenName={review.tokenName}
            overallScore={review.overallScore}
            reviewDate={review.reviewDate}
            lastUpdated={review.lastUpdated}
            logoUrl={review.logoUrl}
            blockchain={review.blockchain}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-071: Upcoming Launches (1 column) ==========

interface UpcomingLaunchesSectionProps {
  data?: UpcomingLaunchesSectionType;
  isLoading?: boolean;
}

export const UpcomingLaunchesSection: React.FC<UpcomingLaunchesSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    launches: [
      {
        id: '1',
        projectName: 'AfriSwap DEX',
        launchDate: new Date('2024-10-15T12:00:00Z'),
        projectType: 'defi' as const,
        blockchain: 'Polygon',
        description: 'Decentralized exchange focused on African cryptocurrency trading pairs and mobile money integration.',
        teamInfo: {
          teamSize: 12,
          hasDoxxedTeam: true,
          previousProjects: ['AfriPay', 'CryptoAfrica']
        },
        fundingInfo: {
          totalRaised: 2500000,
          investors: ['Binance Labs', 'Polygon Ventures'],
          isPublicSale: true
        },
        riskLevel: 'low' as const,
        imageUrl: '/api/placeholder/400/200',
        websiteUrl: 'https://afriswap.io',
        socialLinks: {
          twitter: 'https://twitter.com/afriswap',
          discord: 'https://discord.gg/afriswap',
          telegram: 'https://t.me/afriswap'
        },
        href: '/launches/afriswap-dex'
      },
      {
        id: '2',
        projectName: 'NairaToken',
        launchDate: new Date('2024-10-22T10:00:00Z'),
        projectType: 'token' as const,
        blockchain: 'BNB Chain',
        description: 'Nigerian Naira-backed stablecoin for seamless crypto-to-fiat transactions.',
        teamInfo: {
          teamSize: 8,
          hasDoxxedTeam: true,
          previousProjects: ['PayNaija']
        },
        fundingInfo: {
          totalRaised: 1200000,
          investors: ['Nigerian Fintech Fund'],
          isPublicSale: false
        },
        riskLevel: 'medium' as const,
        imageUrl: '/api/placeholder/400/200',
        websiteUrl: 'https://nairatoken.ng',
        socialLinks: {
          twitter: 'https://twitter.com/nairatoken'
        },
        href: '/launches/naira-token'
      },
      // Add more upcoming launches...
    ]
  };

  const launches = data?.launches || mockData.launches;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Upcoming Launches"
          icon={<Rocket className="w-5 h-5 text-green-500" />}
        />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'high': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Upcoming Launches"
        description="New crypto projects launching soon"
        icon={<Rocket className="w-5 h-5 text-green-500" />}
        action={{
          label: "All Launches",
          href: "/launches"
        }}
        lastUpdated={new Date()}
      />
      
      <div className="space-y-4">
        {launches.slice(0, 5).map((launch) => {
          const daysUntil = getDaysUntil(launch.launchDate);
          
          return (
            <Card key={launch.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {launch.imageUrl && (
                    <img
                      src={launch.imageUrl}
                      alt={launch.projectName}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{launch.projectName}</h3>
                      <div className="flex gap-2">
                        <Badge className={getRiskColor(launch.riskLevel)}>
                          {launch.riskLevel} risk
                        </Badge>
                        <Badge variant="outline">
                          {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {launch.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{launch.blockchain}</span>
                      <span>{launch.projectType.toUpperCase()}</span>
                      {launch.fundingInfo.totalRaised && (
                        <span>${launch.fundingInfo.totalRaised.toLocaleString()} raised</span>
                      )}
                      <span>{launch.teamInfo.teamSize} team members</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

// ========== FR-073: Top Tokens Section ==========

interface TopTokensSectionProps {
  data?: TopTokensSectionType;
  isLoading?: boolean;
}

export const TopTokensSection: React.FC<TopTokensSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  
  const mockData = {
    tokens: [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 43250.67,
        marketCap: 845000000000,
        volume24h: 15600000000,
        priceChange24h: 1234.56,
        priceChangePercent24h: 2.94,
        rank: 1,
        logoUrl: '/api/placeholder/32/32',
        category: 'Currency',
        sparklineData: [42000, 42500, 43000, 42800, 43200, 43250]
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2345.89,
        marketCap: 282000000000,
        volume24h: 8900000000,
        priceChange24h: 67.34,
        priceChangePercent24h: 2.95,
        rank: 2,
        logoUrl: '/api/placeholder/32/32',
        category: 'Smart Contract',
        sparklineData: [2280, 2320, 2340, 2330, 2345, 2346]
      },
      // Add more top tokens...
    ]
  };

  const tokens = data?.tokens || mockData.tokens;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Top Tokens"
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
        />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Top Tokens"
        description="Best performing cryptocurrencies by market cap"
        icon={<TrendingUp className="w-5 h-5 text-green-500" />}
        action={{
          label: "Full Rankings",
          href: "/rankings"
        }}
        lastUpdated={new Date()}
      />
      
      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(['24h', '7d', '30d'] as const).map((period) => (
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

      <div className="space-y-2">
        {tokens.slice(0, 10).map((token, index) => {
          const isPositive = token.priceChangePercent24h >= 0;
          
          return (
            <Card key={token.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground font-mono text-sm w-6">
                    #{token.rank}
                  </span>
                  
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={token.logoUrl}
                      alt={token.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">${token.price.toFixed(2)}</div>
                    <div className={cn(
                      'text-sm flex items-center gap-1',
                      isPositive ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : ''}{token.priceChangePercent24h.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    <div>${(token.marketCap / 1e9).toFixed(1)}B</div>
                    <div>${(token.volume24h / 1e6).toFixed(0)}M vol</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

// ========== FR-076: Nigeria Crypto Section (6 cards) ==========

interface NigeriaCryptoSectionProps {
  data?: NigeriaCryptoSectionType;
  isLoading?: boolean;
}

export const NigeriaCryptoSection: React.FC<NigeriaCryptoSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    articles: [
      {
        id: '1',
        title: 'CBN Considers New Framework for Cryptocurrency Operations',
        excerpt: 'Central Bank of Nigeria explores regulatory sandbox for digital asset service providers.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/cbn-crypto-framework',
        publishedAt: new Date('2024-10-04T13:00:00Z'),
        author: { name: 'Emeka Okafor', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Nigeria', colorHex: '#00b894', slug: 'nigeria' },
        tags: ['CBN', 'Regulation', 'Nigeria'],
        priority: 'high' as const,
        viewCount: 18430,
        likeCount: 734,
        regionalData: {
          country: 'Nigeria',
          region: 'West Africa',
          localRelevance: 10,
          affectedExchanges: ['Quidax', 'BuyCoins', 'Patricia'],
          regulatoryImplications: ['Banking partnerships', 'KYC requirements'],
          localCurrencyImpact: {
            currency: 'NGN',
            priceChange: 2.3
          }
        }
      },
      {
        id: '2',
        title: 'Lagos Fintech Week Highlights Blockchain Innovation',
        excerpt: 'Nigerian startups showcase solutions for financial inclusion using cryptocurrency technology.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/lagos-fintech-week-blockchain',
        publishedAt: new Date('2024-10-04T11:30:00Z'),
        author: { name: 'Kemi Adebayo', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Innovation', colorHex: '#6c5ce7', slug: 'innovation' },
        tags: ['Lagos', 'Fintech', 'Innovation'],
        priority: 'normal' as const,
        viewCount: 12340,
        likeCount: 456,
        regionalData: {
          country: 'Nigeria',
          region: 'West Africa',
          localRelevance: 9,
          affectedExchanges: [],
          regulatoryImplications: [],
          localCurrencyImpact: {
            currency: 'NGN',
            priceChange: 0
          }
        }
      },
      // Add more Nigeria-specific articles...
    ]
  };

  const articles = data?.articles || mockData.articles;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Nigeria Crypto"
          icon={<Flag className="w-5 h-5 text-green-500" />}
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
        title="Nigeria Crypto News"
        description="Cryptocurrency developments in Nigeria 🇳🇬"
        icon={<Flag className="w-5 h-5 text-green-500" />}
        action={{
          label: "All Nigeria News",
          href: "/region/nigeria"
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

// ========== FR-077: Africa Crypto Section (6 cards) ==========

interface AfricaCryptoSectionProps {
  data?: AfricaCryptoSectionType;
  isLoading?: boolean;
}

export const AfricaCryptoSection: React.FC<AfricaCryptoSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    articles: [
      {
        id: '1',
        title: 'African Union Explores CBDC Collaboration Framework',
        excerpt: 'Continental body considers unified digital currency standards across member nations.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/au-cbdc-framework',
        publishedAt: new Date('2024-10-04T12:00:00Z'),
        author: { name: 'Amina Hassan', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Africa', colorHex: '#e17055', slug: 'africa' },
        tags: ['African Union', 'CBDC', 'Policy'],
        priority: 'breaking' as const,
        viewCount: 21340,
        likeCount: 923,
        regionalData: {
          country: 'Continental',
          region: 'Africa',
          localRelevance: 10,
          affectedExchanges: ['Luno', 'Quidax', 'Ice3x'],
          regulatoryImplications: ['Cross-border payments', 'Harmonized regulation'],
          localCurrencyImpact: {
            currency: 'Multiple',
            priceChange: 0
          }
        }
      },
      {
        id: '2',
        title: 'Kenya and Ghana Lead Africa in Crypto Adoption Rates',
        excerpt: 'Latest survey shows East and West African nations driving continental cryptocurrency growth.',
        imageUrl: '/api/placeholder/400/250',
        href: '/news/kenya-ghana-crypto-adoption',
        publishedAt: new Date('2024-10-04T10:00:00Z'),
        author: { name: 'David Asante', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Adoption', colorHex: '#00b894', slug: 'adoption' },
        tags: ['Kenya', 'Ghana', 'Adoption'],
        priority: 'high' as const,
        viewCount: 15670,
        likeCount: 687,
        regionalData: {
          country: 'Kenya, Ghana',
          region: 'Africa',
          localRelevance: 9,
          affectedExchanges: ['Luno', 'Quidax'],
          regulatoryImplications: ['Increased oversight', 'Tax implications'],
          localCurrencyImpact: {
            currency: 'KES, GHS',
            priceChange: 1.5
          }
        }
      },
      // Add more Africa-wide articles...
    ]
  };

  const articles = data?.articles || mockData.articles;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Africa Crypto"
          icon={<Globe className="w-5 h-5 text-orange-500" />}
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
        title="Africa Crypto News"
        description="Cryptocurrency developments across the African continent 🌍"
        icon={<Globe className="w-5 h-5 text-orange-500" />}
        action={{
          label: "All Africa News",
          href: "/region/africa"
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