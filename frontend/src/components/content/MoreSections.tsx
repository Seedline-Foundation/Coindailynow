/**
 * More Content Section Components
 * Task 53: Content Sections Grid System (Continued)
 * 
 * FR-059 to FR-077: Remaining content sections implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentCard, NewsCard, CoinCard, EventCard, InterviewCard, ReviewCard, AlertCard, ContentCardGrid } from './ContentCard';
import { 
  ContentSection,
  RewardPointsConfig,
  PressRelease,
  CryptoEvent,
  Partner,
  Interview,
  ScamAlert,
  PressReleaseSection as PressReleaseSectionType,
  EventsNewsSection as EventsNewsSectionType,
  PartnersSection as PartnersSectionType,
  MemefiAwardSection as MemefiAwardSectionType,
  CoinDailyCastSection as CoinDailyCastSectionType,
  ScamAlertsSection as ScamAlertsSectionType
} from '../../types/content-sections';
import { 
  FileText, 
  Calendar, 
  Users, 
  BookOpen, 
  Award, 
  Star, 
  MessageSquare, 
  Mic,
  ThumbsUp,
  Scale,
  Rocket,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Link2,
  Flag,
  Globe,
  ChevronRight,
  ExternalLink,
  Video,
  Coffee,
  Building2,
  Briefcase,
  Eye,
  Heart,
  Share2,
  Clock
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

// ========== FR-059: Press Release Section (6 cards) ==========

interface PressReleaseSectionProps {
  data?: PressReleaseSectionType;
  isLoading?: boolean;
}

export const PressReleaseSection: React.FC<PressReleaseSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    releases: [
      {
        id: '1',
        title: 'Binance Announces New African Trading Hub in Lagos',
        company: 'Binance',
        summary: 'Global crypto exchange establishes regional headquarters to serve West African markets with local currency support.',
        fullText: '',
        publishedAt: new Date('2024-10-04T14:00:00Z'),
        imageUrl: '/api/placeholder/400/250',
        companyLogoUrl: '/api/placeholder/32/32',
        isBreaking: true,
        tags: ['Binance', 'Africa', 'Exchange'],
        href: '/press/binance-lagos-hub'
      },
      {
        id: '2',
        title: 'Cardano Foundation Partners with Ethiopian Government',
        company: 'Cardano Foundation',
        summary: 'Blockchain partnership aims to improve educational record-keeping and identity management systems.',
        fullText: '',
        publishedAt: new Date('2024-10-04T13:30:00Z'),
        imageUrl: '/api/placeholder/400/250',
        companyLogoUrl: '/api/placeholder/32/32',
        isBreaking: false,
        tags: ['Cardano', 'Ethiopia', 'Government'],
        href: '/press/cardano-ethiopia-partnership'
      },
      // Add more press releases...
    ]
  };

  const releases = data?.releases || mockData.releases;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Press Releases"
          icon={<FileText className="w-5 h-5 text-blue-500" />}
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
        title="Press Releases"
        description="Official announcements from crypto companies"
        icon={<FileText className="w-5 h-5 text-blue-500" />}
        action={{
          label: "View All",
          href: "/press-releases"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {releases.slice(0, 6).map((release) => (
          <NewsCard
            key={release.id}
            type="news"
            id={release.id}
            title={release.title}
            excerpt={release.summary}
            imageUrl={release.imageUrl}
            href={`/press-releases/${release.id}`}
            publishedAt={release.publishedAt}
            author={{ name: release.company, avatarUrl: release.companyLogoUrl }}
            category={{ name: 'Press Release', colorHex: '#0984e3', slug: 'press' }}
            tags={release.tags}
            priority={release.isBreaking ? 'breaking' : 'normal'}
            isBreaking={release.isBreaking}
            sourcePublication={release.company}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-060: Events News Section ==========

interface EventsNewsSectionProps {
  data?: EventsNewsSectionType;
  isLoading?: boolean;
}

export const EventsNewsSection: React.FC<EventsNewsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    events: [
      {
        id: '1',
        title: 'Africa Blockchain Conference 2024',
        description: 'Premier blockchain event bringing together African leaders, developers, and investors.',
        startDate: new Date('2024-11-15T09:00:00Z'),
        endDate: new Date('2024-11-17T18:00:00Z'),
        location: 'Lagos, Nigeria',
        isVirtual: false,
        eventType: 'conference' as const,
        relevantTokens: ['BTC', 'ETH', 'ADA'],
        imageUrl: '/api/placeholder/400/250',
        websiteUrl: 'https://africablockchain.com',
        href: '/events/africa-blockchain-2024',
        daysUntil: 42
      },
      {
        id: '2',
        title: 'Ethereum Nairobi Meetup',
        description: 'Monthly gathering of Ethereum developers and enthusiasts in Kenya.',
        startDate: new Date('2024-10-25T18:00:00Z'),
        location: 'Nairobi, Kenya',
        isVirtual: false,
        eventType: 'conference' as const,
        relevantTokens: ['ETH'],
        imageUrl: '/api/placeholder/400/250',
        websiteUrl: 'https://meetup.com/ethereum-nairobi',
        href: '/events/ethereum-nairobi-october',
        daysUntil: 21
      },
      // Add more events...
    ]
  };

  const events = data?.upcomingEvents || mockData.events;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Upcoming Events"
          icon={<Calendar className="w-5 h-5 text-green-500" />}
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
        title="Upcoming Events"
        description="Crypto conferences and meetups across Africa"
        icon={<Calendar className="w-5 h-5 text-green-500" />}
        action={{
          label: "View Calendar",
          href: "/events"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {events.slice(0, 6).map((event) => (
          <EventCard
            key={event.id}
            type="event"
            id={event.id}
            title={event.title}
            excerpt={event.description}
            imageUrl={event.imageUrl}
            href={`/events/${event.id}`}
            startDate={event.startDate}
            endDate={event.endDate}
            location={event.location}
            isVirtual={event.isVirtual}
            eventType={event.eventType}
            daysUntil={event.daysUntil || 0}
            isExternal={!!event.websiteUrl}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-061: Partners (Sponsored) News (full width) ==========

interface PartnersSectionProps {
  data?: PartnersSectionType;
  isLoading?: boolean;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    sponsoredContent: [
      {
        id: '1',
        title: 'Exclusive: How Luno is Revolutionizing Crypto Access in South Africa',
        description: 'Discover how leading exchange Luno is making cryptocurrency accessible to millions across Africa with innovative features and local partnerships.',
        partnerName: 'Luno',
        partnerLogoUrl: '/api/placeholder/48/48',
        contentType: 'article' as const,
        ctaText: 'Read Full Story',
        ctaUrl: '/sponsored/luno-south-africa',
        imageUrl: '/api/placeholder/800/400',
        isPromoted: true,
        trackingId: 'luno-sa-001'
      }
    ]
  };

  const sponsoredContent = data?.sponsoredContent || mockData.sponsoredContent;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Partner Spotlight"
          icon={<Users className="w-5 h-5 text-purple-500" />}
        />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Partner Spotlight"
        description="Featured content from our trusted partners"
        icon={<Users className="w-5 h-5 text-purple-500" />}
      />
      
      {sponsoredContent.slice(0, 1).map((content) => (
        <Card key={content.id} className="overflow-hidden bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-64 md:h-auto">
              <img
                src={content.imageUrl}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 left-4 bg-purple-600 text-white">
                <Building2 className="w-3 h-3 mr-1" />
                Sponsored
              </Badge>
            </div>
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={content.partnerLogoUrl}
                  alt={`${content.partnerName} logo`}
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <p className="text-sm text-muted-foreground">Partner Content</p>
                  <p className="font-semibold">{content.partnerName}</p>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3">{content.title}</h3>
              <p className="text-muted-foreground mb-6 text-lg">{content.description}</p>
              
              <Button className="w-fit">
                <a href={content.ctaUrl}>
                  {content.ctaText}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </div>
        </Card>
      ))}
    </section>
  );
};

// ========== FR-064: MEMEFI Award Section ==========

interface MemefiAwardSectionProps {
  data?: MemefiAwardSectionType;
  isLoading?: boolean;
}

export const MemefiAwardSection: React.FC<MemefiAwardSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    currentWinner: {
      id: '1',
      projectName: 'MemeFi Protocol',
      description: 'Revolutionary DeFi platform gamifying yield farming through meme culture and social engagement.',
      awardCategory: 'Best Innovation',
      imageUrl: '/api/placeholder/400/250',
      websiteUrl: 'https://memefi.club',
      announcementDate: new Date('2024-10-01T00:00:00Z')
    },
    nominees: [
      {
        id: '2',
        projectName: 'PepeCoin V2',
        category: 'Best Community',
        votes: 15420,
        imageUrl: '/api/placeholder/200/200',
        description: 'Community-driven memecoin with charitable initiatives'
      },
      {
        id: '3',
        projectName: 'DogeDAO',
        category: 'Best Governance',
        votes: 12830,
        imageUrl: '/api/placeholder/200/200',
        description: 'Decentralized autonomous organization for meme lovers'
      }
    ],
    votingDeadline: new Date('2024-10-31T23:59:59Z')
  };

  const awardData = data || mockData;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="MEMEFI Awards"
          icon={<Award className="w-5 h-5 text-yellow-500" />}
        />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </section>
    );
  }

  const daysLeft = Math.ceil((awardData.votingDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="MEMEFI Awards 2024"
        description="Celebrating the best in meme finance"
        icon={<Award className="w-5 h-5 text-yellow-500" />}
        action={{
          label: "Vote Now",
          href: "/memefi-awards",
          external: true
        }}
        lastUpdated={new Date()}
      />
      
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <Badge className="bg-yellow-500 text-black mb-3">
                <Award className="w-3 h-3 mr-1" />
                {awardData.currentWinner.awardCategory}
              </Badge>
              <h3 className="text-2xl font-bold mb-2">{awardData.currentWinner.projectName}</h3>
              <p className="text-muted-foreground mb-4">{awardData.currentWinner.description}</p>
              
              <div className="flex gap-3">
                <Button variant="outline">
                  <a href={awardData.currentWinner.websiteUrl} target="_blank">
                    Visit Project
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <Button>
                  <a href="/memefi-awards">
                    Vote for Projects
                  </a>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-3">
                Voting ends in {daysLeft} days
              </p>
            </div>
            
            <div className="relative">
              <img
                src={awardData.currentWinner.imageUrl}
                alt={awardData.currentWinner.projectName}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-2">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

// ========== FR-067: CoinDaily Cast Interviews (6 cards) ==========

interface CoinDailyCastSectionProps {
  data?: CoinDailyCastSectionType;
  isLoading?: boolean;
}

export const CoinDailyCastSection: React.FC<CoinDailyCastSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    interviews: [
      {
        id: '1',
        title: 'Building the Future of African DeFi',
        guest: {
          name: 'Akinyi Wanjugu',
          title: 'CEO',
          company: 'AfriDeFi Labs',
          avatarUrl: '/api/placeholder/64/64'
        },
        host: {
          name: 'Samuel Kibiru',
          avatarUrl: '/api/placeholder/64/64'
        },
        duration: 45,
        publishedAt: new Date('2024-10-03T15:00:00Z'),
        videoUrl: '/videos/coindaily-cast-ep-101',
        audioUrl: '/audio/coindaily-cast-ep-101',
        transcriptUrl: '/transcripts/coindaily-cast-ep-101',
        imageUrl: '/api/placeholder/400/250',
        topics: ['DeFi', 'Africa', 'Innovation'],
        viewCount: 8934,
        href: '/podcast/building-future-african-defi'
      },
      {
        id: '2',
        title: 'Regulatory Landscape in Nigerian Crypto Market',
        guest: {
          name: 'Dr. Emeka Okafor',
          title: 'Blockchain Advisor',
          company: 'Central Bank of Nigeria',
          avatarUrl: '/api/placeholder/64/64'
        },
        host: {
          name: 'Samuel Kibiru',
          avatarUrl: '/api/placeholder/64/64'
        },
        duration: 38,
        publishedAt: new Date('2024-10-02T14:00:00Z'),
        videoUrl: '/videos/coindaily-cast-ep-100',
        audioUrl: '/audio/coindaily-cast-ep-100',
        imageUrl: '/api/placeholder/400/250',
        topics: ['Regulation', 'Nigeria', 'Banking'],
        viewCount: 12450,
        href: '/podcast/nigeria-crypto-regulation'
      },
      // Add more interviews...
    ]
  };

  const interviews = data?.interviews || mockData.interviews;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="CoinDaily Cast"
          icon={<Mic className="w-5 h-5 text-red-500" />}
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
        title="CoinDaily Cast"
        description="In-depth interviews with African crypto leaders"
        icon={<Mic className="w-5 h-5 text-red-500" />}
        action={{
          label: "All Episodes",
          href: "/podcast"
        }}
        lastUpdated={new Date()}
      />
      <ContentCardGrid columns={3}>
        {interviews.slice(0, 6).map((interview) => (
          <InterviewCard
            key={interview.id}
            type="interview"
            id={interview.id}
            title={interview.title}
            excerpt={interview.topics.join(' • ')}
            imageUrl={interview.imageUrl}
            href={`/interviews/${interview.id}`}
            publishedAt={interview.publishedAt}
            guest={interview.guest}
            host={interview.host}
            duration={interview.duration}
            viewCount={interview.viewCount}
            hasVideo={!!interview.videoUrl}
            hasAudio={!!interview.audioUrl}
          />
        ))}
      </ContentCardGrid>
    </section>
  );
};

// ========== FR-072: Scam Alert Section ==========

interface ScamAlertsSectionProps {
  data?: ScamAlertsSectionType;
  isLoading?: boolean;
}

export const ScamAlertsSection: React.FC<ScamAlertsSectionProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const mockData = {
    alerts: [
      {
        id: '1',
        alertType: 'rugpull' as const,
        title: 'SafeMoon V3 Token Suspected Rug Pull',
        description: 'Community reports inability to sell tokens after recent contract migration. Liquidity appears to have been drained.',
        affectedTokens: ['SAFEMOONV3', 'BSC'],
        estimatedLoss: 2400000,
        reportedDate: new Date('2024-10-04T11:00:00Z'),
        verificationStatus: 'investigating' as const,
        warningLevel: 'critical' as const,
        sourceReports: ['Community Reports', 'BSCScan Analysis'],
        relatedScams: ['SafeMoon V2 Issues'],
        href: '/alerts/safemoon-v3-rugpull'
      },
      {
        id: '2',
        alertType: 'phishing' as const,
        title: 'Fake Binance Mobile App Circulating',
        description: 'Malicious app mimicking official Binance interface detected on unofficial app stores. Steals user credentials.',
        affectedTokens: [],
        reportedDate: new Date('2024-10-04T09:30:00Z'),
        verificationStatus: 'confirmed' as const,
        warningLevel: 'high' as const,
        sourceReports: ['Security Researchers', 'User Reports'],
        relatedScams: [],
        href: '/alerts/fake-binance-app'
      }
    ]
  };

  const alerts = data?.alerts || mockData.alerts;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader 
          title="Scam Alerts"
          icon={<Shield className="w-5 h-5 text-red-500" />}
        />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader 
        title="Scam Alerts"
        description="Stay protected from crypto scams and fraud"
        icon={<Shield className="w-5 h-5 text-red-500" />}
        action={{
          label: "Report Scam",
          href: "/report-scam"
        }}
        lastUpdated={new Date()}
      />
      
      <div className="space-y-4">
        {alerts.slice(0, 5).map((alert) => (
          <AlertCard
            key={alert.id}
            type="alert"
            id={alert.id}
            title={alert.title}
            excerpt={alert.description}
            href={`/scam-alerts/${alert.id}`}
            publishedAt={alert.reportedDate}
            alertType={alert.alertType === 'rugpull' || alert.alertType === 'fake_project' || alert.alertType === 'ponzi' ? 'scam' : 
                      alert.alertType === 'phishing' ? 'security' : 'warning'}
            severity={alert.warningLevel}
            affectedTokens={alert.affectedTokens}
            size="small"
            layout="horizontal"
          />
        ))}
      </div>
    </section>
  );
};


