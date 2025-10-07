/**
 * Missing Content Section Components
 * Task 53: Content Sections Grid System (Missing Parts)
 * 
 * FR-068, FR-070, FR-074: Opinion, Policy Updates, Gainers/Losers sections
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentCard, NewsCard, CoinCard, ContentCardGrid } from './ContentCard';
import type { 
  OpinionSection as OpinionSectionType,
  PolicyUpdatesSection as PolicyUpdatesSectionType,
  GainersLosersSection as GainersLosersSectionType,
} from '@/types/content-sections';
import { 
  MessageSquare,
  Scale,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  User,
  Clock,
  Eye,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Section Header Component
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

// ========== FR-068: Opinion Section (6 cards) ==========

interface OpinionSectionProps {
  data?: OpinionSectionType;
  isLoading?: boolean;
}

export const OpinionSection: React.FC<OpinionSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    opinions: [
      {
        id: '1',
        title: 'Why Bitcoin Will Hit $100K This Cycle',
        excerpt: 'Technical analysis and fundamental factors point to a massive bull run ahead for the leading cryptocurrency.',
        imageUrl: '/api/placeholder/400/250',
        href: '/opinion/bitcoin-100k-prediction',
        publishedAt: new Date('2024-10-04T15:00:00Z'),
        author: { name: 'Michael Saylor Jr.', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Opinion', colorHex: '#e74c3c', slug: 'opinion' },
        tags: ['Bitcoin', 'Price Prediction', 'Bull Market'],
        priority: 'high' as const,
        viewCount: 23450,
        likeCount: 1234,
        opinionData: {
          stance: 'bullish' as const,
          confidenceLevel: 8,
          timeHorizon: 'medium' as const,
          targetAudience: 'intermediate' as const
        }
      },
      {
        id: '2',
        title: 'The African CBDC Race: Nigeria vs Kenya',
        excerpt: 'Comparing the digital currency strategies of two African powerhouses and their potential impact.',
        imageUrl: '/api/placeholder/400/250',
        href: '/opinion/africa-cbdc-race',
        publishedAt: new Date('2024-10-04T14:00:00Z'),
        author: { name: 'Dr. Amara Okafor', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Analysis', colorHex: '#3498db', slug: 'analysis' },
        tags: ['CBDC', 'Nigeria', 'Kenya'],
        priority: 'normal' as const,
        viewCount: 15670,
        likeCount: 789,
        opinionData: {
          stance: 'neutral' as const,
          confidenceLevel: 7,
          timeHorizon: 'long' as const,
          targetAudience: 'advanced' as const
        }
      },
      {
        id: '3',
        title: 'DeFi is Dead, Long Live ReFi',
        excerpt: 'Regenerative Finance represents the next evolution beyond traditional DeFi protocols.',
        imageUrl: '/api/placeholder/400/250',
        href: '/opinion/defi-dead-refi-future',
        publishedAt: new Date('2024-10-04T13:00:00Z'),
        author: { name: 'Sarah Chen', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'DeFi', colorHex: '#00b894', slug: 'defi' },
        tags: ['DeFi', 'ReFi', 'Innovation'],
        priority: 'normal' as const,
        viewCount: 9876,
        likeCount: 445,
        opinionData: {
          stance: 'bearish' as const,
          confidenceLevel: 6,
          timeHorizon: 'short' as const,
          targetAudience: 'beginner' as const
        }
      },
      {
        id: '4',
        title: 'Why Ethereum Layer 2s Will Flip the Base Chain',
        excerpt: 'L2 adoption metrics suggest a fundamental shift in how users interact with Ethereum.',
        imageUrl: '/api/placeholder/400/250',
        href: '/opinion/l2-flip-ethereum',
        publishedAt: new Date('2024-10-04T12:00:00Z'),
        author: { name: 'Vitalik Buterin Fan', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Ethereum', colorHex: '#6c5ce7', slug: 'ethereum' },
        tags: ['Ethereum', 'Layer 2', 'Scaling'],
        priority: 'normal' as const,
        viewCount: 12340,
        likeCount: 567,
        opinionData: {
          stance: 'bullish' as const,
          confidenceLevel: 9,
          timeHorizon: 'medium' as const,
          targetAudience: 'advanced' as const
        }
      },
      {
        id: '5',
        title: 'Memecoins: The Gateway Drug to Crypto Adoption',
        excerpt: 'Despite criticism, meme tokens are bringing millions into the cryptocurrency ecosystem.',
        imageUrl: '/api/placeholder/400/250',
        href: '/opinion/memecoins-gateway-adoption',
        publishedAt: new Date('2024-10-04T11:00:00Z'),
        author: { name: 'Doge Father', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Memecoin', colorHex: '#ff6b35', slug: 'memecoin' },
        tags: ['Memecoins', 'Adoption', 'Culture'],
        priority: 'normal' as const,
        viewCount: 18790,
        likeCount: 892,
        opinionData: {
          stance: 'bullish' as const,
          confidenceLevel: 7,
          timeHorizon: 'long' as const,
          targetAudience: 'beginner' as const
        }
      },
      {
        id: '6',
        title: 'The Coming Crypto Regulation Tsunami',
        excerpt: 'Global regulatory crackdowns will separate legitimate projects from the chaff.',
        imageUrl: '/api/placeholder/400/250',
        href: '/opinion/crypto-regulation-tsunami',
        publishedAt: new Date('2024-10-04T10:00:00Z'),
        author: { name: 'Legal Eagle', avatarUrl: '/api/placeholder/32/32' },
        category: { name: 'Regulation', colorHex: '#e17055', slug: 'regulation' },
        tags: ['Regulation', 'Compliance', 'Policy'],
        priority: 'high' as const,
        viewCount: 16540,
        likeCount: 723,
        opinionData: {
          stance: 'bearish' as const,
          confidenceLevel: 8,
          timeHorizon: 'short' as const,
          targetAudience: 'intermediate' as const
        }
      }
    ]
  };

  const opinions = data?.opinions || mockData.opinions;

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'bullish': return 'text-green-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStanceIcon = (stance: string) => {
    switch (stance) {
      case 'bullish': return <TrendingUp className="w-3 h-3" />;
      case 'bearish': return <TrendingDown className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Opinion"
          icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
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
        title="Opinion"
        description="Expert opinions and market predictions"
        icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
        action={{
          label: "All Opinions",
          href: "/opinion"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {opinions.slice(0, 6).map((opinion) => (
          <Card key={opinion.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer h-80 flex flex-col">
            <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
              <img
                src={opinion.imageUrl}
                alt={opinion.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              
              {/* Stance Badge */}
              <Badge className={cn(
                'absolute top-2 left-2 text-xs',
                getStanceColor(opinion.opinionData.stance)
              )}>
                {getStanceIcon(opinion.opinionData.stance)}
                <span className="ml-1">{opinion.opinionData.stance.toUpperCase()}</span>
              </Badge>

              {/* Confidence Level */}
              <Badge className="absolute top-2 right-2 bg-black/50 text-white text-xs">
                {opinion.opinionData.confidenceLevel}/10
              </Badge>
            </div>

            <CardContent className="flex-1 p-4 flex flex-col">
              <div className="flex flex-wrap gap-1 mb-2">
                {opinion.category && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: opinion.category.colorHex + '20', color: opinion.category.colorHex }}
                  >
                    {opinion.category.name}
                  </Badge>
                )}
                {opinion.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {opinion.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                {opinion.excerpt}
              </p>

              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{opinion.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(opinion.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{opinion.viewCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{opinion.likeCount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-070: Policy Update Section (6 cards) ==========

interface PolicyUpdatesSectionProps {
  data?: PolicyUpdatesSectionType;
  isLoading?: boolean;
}

export const PolicyUpdatesSection: React.FC<PolicyUpdatesSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    updates: [
      {
        id: '1',
        title: 'EU MiCA Regulation Implementation Begins',
        summary: 'Markets in Crypto-Assets regulation comes into effect across European Union member states.',
        country: 'European Union',
        region: 'Europe',
        effectiveDate: new Date('2024-10-01T00:00:00Z'),
        impact: 'neutral' as const,
        affectedSectors: ['Exchanges', 'Stablecoins', 'DeFi'],
        sourceUrl: 'https://eur-lex.europa.eu/mica',
        isBreaking: false,
        lastUpdated: new Date('2024-10-04T12:00:00Z'),
        href: '/policy/eu-mica-implementation'
      },
      {
        id: '2',
        title: 'Nigeria Updates Cryptocurrency Exchange Guidelines',
        summary: 'Central Bank of Nigeria releases revised operational framework for digital asset service providers.',
        country: 'Nigeria',
        region: 'Africa',
        effectiveDate: new Date('2024-11-01T00:00:00Z'),
        impact: 'positive' as const,
        affectedSectors: ['Local Exchanges', 'Remittances'],
        sourceUrl: 'https://cbn.gov.ng/crypto-guidelines',
        isBreaking: true,
        lastUpdated: new Date('2024-10-04T11:00:00Z'),
        href: '/policy/nigeria-exchange-guidelines'
      },
      {
        id: '3',
        title: 'South Africa SARB Proposes Crypto Custody Rules',
        summary: 'South African Reserve Bank seeks public comment on proposed cryptocurrency custody regulations.',
        country: 'South Africa',
        region: 'Africa',
        effectiveDate: new Date('2024-12-01T00:00:00Z'),
        impact: 'neutral' as const,
        affectedSectors: ['Custody Services', 'Institutional Trading'],
        sourceUrl: 'https://sarb.co.za/crypto-custody',
        isBreaking: false,
        lastUpdated: new Date('2024-10-04T10:00:00Z'),
        href: '/policy/sarb-custody-rules'
      },
      {
        id: '4',
        title: 'Kenya Proposes Digital Asset Tax Framework',
        summary: 'Kenya Revenue Authority introduces capital gains tax structure for cryptocurrency transactions.',
        country: 'Kenya',
        region: 'Africa',
        effectiveDate: new Date('2025-01-01T00:00:00Z'),
        impact: 'negative' as const,
        affectedSectors: ['Individual Traders', 'Mining Operations'],
        sourceUrl: 'https://kra.go.ke/digital-asset-tax',
        isBreaking: false,
        lastUpdated: new Date('2024-10-04T09:00:00Z'),
        href: '/policy/kenya-crypto-tax'
      },
      {
        id: '5',
        title: 'Ghana Approves Blockchain Technology Roadmap',
        summary: 'Government of Ghana announces national blockchain strategy including cryptocurrency provisions.',
        country: 'Ghana',
        region: 'Africa',
        effectiveDate: new Date('2024-10-15T00:00:00Z'),
        impact: 'positive' as const,
        affectedSectors: ['Technology Sector', 'Financial Services'],
        sourceUrl: 'https://ghana.gov.gh/blockchain-roadmap',
        isBreaking: false,
        lastUpdated: new Date('2024-10-04T08:00:00Z'),
        href: '/policy/ghana-blockchain-roadmap'
      },
      {
        id: '6',
        title: 'Morocco Considers Lifting Cryptocurrency Ban',
        summary: 'Bank Al-Maghrib explores regulatory framework to potentially legalize digital asset trading.',
        country: 'Morocco',
        region: 'Africa',
        effectiveDate: new Date('2025-03-01T00:00:00Z'),
        impact: 'positive' as const,
        affectedSectors: ['Banking', 'Payments'],
        sourceUrl: 'https://bkam.ma/cryptocurrency-framework',
        isBreaking: true,
        lastUpdated: new Date('2024-10-04T07:00:00Z'),
        href: '/policy/morocco-crypto-ban-lift'
      }
    ]
  };

  const updates = data?.updates || mockData.updates;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-500 bg-green-500/10';
      case 'negative': return 'text-red-500 bg-red-500/10';
      default: return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Policy Updates"
          icon={<Scale className="w-5 h-5 text-purple-500" />}
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
        title="Policy Updates"
        description="Latest regulatory developments worldwide"
        icon={<Scale className="w-5 h-5 text-purple-500" />}
        action={{
          label: "All Updates",
          href: "/policy"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {updates.slice(0, 6).map((update) => (
          <Card key={update.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer h-80 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <Badge className={cn('text-xs', getImpactColor(update.impact))}>
                  {update.impact.toUpperCase()}
                </Badge>
                {update.isBreaking && (
                  <Badge className="bg-red-500 text-white text-xs animate-pulse">
                    BREAKING
                  </Badge>
                )}
              </div>

              <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {update.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                {update.summary}
              </p>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{update.country}</span>
                  <span>{update.region}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Effective:</span>
                  <span>{update.effectiveDate.toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {update.affectedSectors.slice(0, 2).map((sector) => (
                    <Badge key={sector} variant="outline" className="text-xs">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-074: Gainers/Losers Section ==========

interface GainersLosersSectionProps {
  data?: GainersLosersSectionType;
  isLoading?: boolean;
}

export const GainersLosersSection: React.FC<GainersLosersSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  
  const mockData = {
    gainers: [
      {
        id: 'pepe',
        symbol: 'PEPE',
        name: 'Pepe',
        price: 0.00001234,
        priceChangePercent: 45.67,
        volume24h: 123000000,
        marketCap: 5200000000,
        logoUrl: '/api/placeholder/32/32',
        rank: 47,
        reason: 'Major exchange listing announced'
      },
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        price: 89.45,
        priceChangePercent: 23.45,
        volume24h: 890000000,
        marketCap: 38900000000,
        logoUrl: '/api/placeholder/32/32',
        rank: 5,
        reason: 'Network upgrade successful'
      },
      {
        id: 'cardano',
        symbol: 'ADA',
        name: 'Cardano',
        price: 0.3456,
        priceChangePercent: 18.92,
        volume24h: 456000000,
        marketCap: 12100000000,
        logoUrl: '/api/placeholder/32/32',
        rank: 8,
        reason: 'Hydra scaling solution launch'
      }
    ],
    losers: [
      {
        id: 'terra-classic',
        symbol: 'LUNC',
        name: 'Terra Classic',
        price: 0.0001234,
        priceChangePercent: -34.56,
        volume24h: 89000000,
        marketCap: 890000000,
        logoUrl: '/api/placeholder/32/32',
        rank: 89,
        reason: 'Regulatory concerns'
      },
      {
        id: 'polygon',
        symbol: 'MATIC',
        name: 'Polygon',
        price: 0.8923,
        priceChangePercent: -12.34,
        volume24h: 234000000,
        marketCap: 8300000000,
        logoUrl: '/api/placeholder/32/32',
        rank: 12,
        reason: 'Competition from Layer 2s'
      },
      {
        id: 'chainlink',
        symbol: 'LINK',
        name: 'Chainlink',
        price: 12.34,
        priceChangePercent: -8.76,
        volume24h: 345000000,
        marketCap: 6700000000,
        logoUrl: '/api/placeholder/32/32',
        rank: 15,
        reason: 'Whale selling pressure'
      }
    ]
  };

  const gainers = data?.gainers || mockData.gainers;
  const losers = data?.losers || mockData.losers;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Gainers & Losers"
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
        />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Gainers & Losers"
        description="Top performing and declining cryptocurrencies"
        icon={<TrendingUp className="w-5 h-5 text-green-500" />}
        action={{
          label: "View All",
          href: "/market/movers"
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gainers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-500">
              <TrendingUp className="w-5 h-5" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gainers.slice(0, 5).map((gainer, index) => (
              <div key={gainer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-xs text-muted-foreground w-4">
                  {index + 1}
                </span>
                <img
                  src={gainer.logoUrl}
                  alt={gainer.name}
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{gainer.symbol}</div>
                      <div className="text-xs text-muted-foreground">{gainer.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${gainer.price.toFixed(4)}</div>
                      <div className="text-xs text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{gainer.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {gainer.reason && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {gainer.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Losers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-500">
              <TrendingDown className="w-5 h-5" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {losers.slice(0, 5).map((loser, index) => (
              <div key={loser.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-xs text-muted-foreground w-4">
                  {index + 1}
                </span>
                <img
                  src={loser.logoUrl}
                  alt={loser.name}
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{loser.symbol}</div>
                      <div className="text-xs text-muted-foreground">{loser.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${loser.price.toFixed(4)}</div>
                      <div className="text-xs text-red-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {loser.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {loser.reason && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {loser.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};