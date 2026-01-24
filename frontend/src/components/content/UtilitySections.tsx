/**
 * Additional Enhanced Content Sections
 * Task 53 Enhancement: Additional sections from existing codebase
 * 
 * Includes: Breaking News, Social Feed, Crypto Glossary
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  Search,
  BookOpen,
  Twitter,
  MessageCircle,
  Share2,
  TrendingUp,
  ExternalLink,
  Bell,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  BreakingNewsAlert,
  SocialPost,
  GlossaryTerm
} from '../../types/content-sections';

// ========== Breaking News Alert Section ==========

interface BreakingNewsAlertSectionProps {
  isLoading?: boolean;
}

export const BreakingNewsAlertSection: React.FC<BreakingNewsAlertSectionProps> = ({ isLoading = false }) => {
  const [alerts, setAlerts] = useState<BreakingNewsAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setAlerts([
      {
        id: '1',
        title: 'Bitcoin Surges Above $70,000 After Major Institutional Adoption',
        summary: 'Several Fortune 500 companies announce Bitcoin treasury adoption, driving price to new all-time highs.',
        severity: 'high',
        category: 'Market',
        affectedAssets: ['BTC', 'ETH'],
        publishedAt: new Date(Date.now() - 15 * 60 * 1000),
        sourceUrl: '/news/bitcoin-surge-institutional-adoption',
        isActive: true,
        dismissible: true,
        autoExpire: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        title: 'Nigeria Central Bank Announces Digital Naira Pilot Program',
        summary: 'CBN launches comprehensive CBDC pilot across 5 major cities, targeting financial inclusion.',
        severity: 'medium',
        category: 'Regulation',
        affectedAssets: ['eNAIRA'],
        publishedAt: new Date(Date.now() - 45 * 60 * 1000),
        sourceUrl: '/news/nigeria-digital-naira-pilot',
        isActive: true,
        dismissible: true,
        autoExpire: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ]);
  }, []);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded w-48"></div>
        <div className="h-20 bg-muted animate-pulse rounded-lg"></div>
      </section>
    );
  }

  if (alerts.length === 0) {
    return null; // Don't show section if no active alerts
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-red-600">Breaking News</h2>
          <Badge variant="destructive" className="animate-pulse">
            Live
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <Badge variant="outline">
                      {alert.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - alert.publishedAt.getTime()) / (1000 * 60))} min ago
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{alert.summary}</p>
                  
                  {alert.affectedAssets.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Affected assets:</span>
                      {alert.affectedAssets.map((asset) => (
                        <Badge key={asset} variant="secondary">
                          {asset}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <a href={alert.sourceUrl}>
                    <Button variant="outline" size="sm">
                      Read Full Story
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </a>
                </div>
                
                {alert.dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// ========== Social Feed Section ==========

interface SocialFeedSectionProps {
  isLoading?: boolean;
}

export const SocialFeedSection: React.FC<SocialFeedSectionProps> = ({ isLoading = false }) => {
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    setSocialPosts([
      {
        id: '1',
        platform: 'twitter',
        content: 'Bitcoin adoption in Nigeria reaches new milestone! 🚀 #BitcoinNigeria #CryptoAdoption',
        author: '@CryptoAnalystNG',
        authorAvatar: '/images/avatar1.jpg',
        postUrl: 'https://twitter.com/cryptoanalystng/status/123',
        likes: 245,
        shares: 67,
        comments: 89,
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isVerified: true,
        sentiment: 'positive'
      },
      {
        id: '2',
        platform: 'telegram',
        content: 'Major update on Ethereum Lagos conference! Speakers announced 🎉',
        author: 'EthereumLagos',
        authorAvatar: '/images/avatar2.jpg',
        postUrl: 'https://t.me/ethereumlagos/456',
        likes: 156,
        shares: 34,
        comments: 45,
        postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isVerified: false,
        sentiment: 'positive'
      }
    ]);
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4 text-blue-500" />;
      case 'telegram': return <MessageCircle className="w-4 h-4 text-blue-600" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Social Feed</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Live Updates
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          View All Posts
        </Button>
      </div>

      <div className="space-y-4">
        {socialPosts.map((post) => (
          <Card key={post.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getPlatformIcon(post.platform)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{post.author}</span>
                    {post.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        ✓ Verified
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - post.postedAt.getTime()) / (1000 * 60 * 60))}h ago
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3">{post.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>❤️ {post.likes}</span>
                      <span>🔄 {post.shares}</span>
                      <span>💬 {post.comments}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getSentimentColor(post.sentiment)}
                      >
                        {post.sentiment}
                      </Badge>
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

// ========== Crypto Glossary Section ==========

interface CryptoGlossarySectionProps {
  isLoading?: boolean;
}

export const CryptoGlossarySection: React.FC<CryptoGlossarySectionProps> = ({ isLoading = false }) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    setTerms([
      {
        id: '1',
        term: 'Blockchain',
        definition: 'A decentralized, distributed ledger that records transactions across multiple computers in a secure and transparent manner.',
        category: 'Technology',
        relatedTerms: ['Bitcoin', 'Cryptocurrency', 'Mining'],
        examples: ['Bitcoin blockchain', 'Ethereum blockchain'],
        difficulty: 'beginner'
      },
      {
        id: '2',
        term: 'DeFi',
        definition: 'Decentralized Finance - Financial services built on blockchain networks that operate without traditional intermediaries.',
        category: 'Finance',
        relatedTerms: ['Smart Contracts', 'Yield Farming', 'Liquidity Pool'],
        examples: ['Uniswap', 'Compound', 'Aave'],
        difficulty: 'intermediate'
      },
      {
        id: '3',
        term: 'Satoshi',
        definition: 'The smallest unit of Bitcoin, equal to 0.00000001 BTC. Named after Bitcoin\'s creator, Satoshi Nakamoto.',
        category: 'Units',
        relatedTerms: ['Bitcoin', 'BTC'],
        examples: ['1 BTC = 100,000,000 satoshis'],
        difficulty: 'beginner'
      },
      {
        id: '4',
        term: 'Layer 2',
        definition: 'Secondary frameworks built on top of existing blockchains to improve scalability and reduce transaction costs.',
        category: 'Technology',
        relatedTerms: ['Lightning Network', 'Polygon', 'Optimism'],
        examples: ['Bitcoin Lightning Network', 'Ethereum Layer 2 solutions'],
        difficulty: 'advanced'
      }
    ]);
  }, []);

  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || term.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48"></div>
        <div className="h-12 bg-muted animate-pulse rounded"></div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Crypto Glossary</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Learn Terms
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          View Full Glossary
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Terms List */}
      <div className="space-y-4">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term) => (
            <Card key={term.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{term.term}</h3>
                    <Badge className={getDifficultyColor(term.difficulty)} variant="secondary">
                      {term.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {term.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4">{term.definition}</p>
                
                {term.examples && term.examples.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Examples: </span>
                    <span className="text-sm">{term.examples.join(', ')}</span>
                  </div>
                )}
                
                {term.relatedTerms.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Related: </span>
                    {term.relatedTerms.map((relatedTerm) => (
                      <Badge key={relatedTerm} variant="outline">
                        {relatedTerm}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No terms found matching your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default {
  BreakingNewsAlertSection,
  SocialFeedSection,
  CryptoGlossarySection
};
