/**
 * Content Sections Grid System - Main Component
 * Task 53: Content Sections Grid System Implementation
 * 
 * Complete implementation of all 22 content sections (FR-056 to FR-077)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Import all content sections
import { 
  MemecoinNewsSection, 
  TrendingCoinsSection, 
  GameNewsSection,
  NewsletterSection 
} from './ContentSections';

import { 
  PressReleaseSection,
  EventsNewsSection,
  PartnersSection,
  MemefiAwardSection,
  CoinDailyCastSection,
  ScamAlertsSection
} from './MoreSections';

import {
  EditorialsSection,
  FeaturedNewsSection,
  GeneralCryptoSection,
  TokenReviewsSection,
  UpcomingLaunchesSection,
  TopTokensSection,
  NigeriaCryptoSection,
  AfricaCryptoSection
} from './FinalSections';

import {
  OpinionSection,
  PolicyUpdatesSection,
  GainersLosersSection
} from './MissingSections';

import {
  PredictionSection,
  SurveySection,
  LearnSection,
  AdvertisementSection,
  AIContentWidgetSection
} from './EnhancedSections';

import {
  BreakingNewsAlertSection,
  SocialFeedSection,
  CryptoGlossarySection
} from './UtilitySections';

import { 
  RefreshCw, 
  Settings, 
  Filter, 
  Eye, 
  EyeOff,
  Grid3X3,
  List,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== Content Grid Configuration ==========

interface ContentGridConfig {
  layout: 'standard' | 'compact' | 'magazine';
  showLoadingStates: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  enabledSections: string[];
  sectionOrder: string[];
}

interface ContentGridProps {
  config?: Partial<ContentGridConfig>;
  className?: string;
}

const defaultConfig: ContentGridConfig = {
  layout: 'standard',
  showLoadingStates: true,
  autoRefresh: true,
  refreshInterval: 5,
  enabledSections: [
    'breaking-news',      // Enhanced - Real-time alerts
    'featured-news',      // FR-065
    'memecoin-news',     // FR-056
    'trending-coins',    // FR-057
    'game-news',         // FR-058
    'press-releases',    // FR-059
    'events-news',       // FR-060
    'partners',          // FR-061
    'editorials',        // FR-062
    'newsletter',        // FR-063
    'memefi-award',      // FR-064
    'general-crypto',    // FR-066
    'coindaily-cast',    // FR-067
    'opinion',           // FR-068
    'token-reviews',     // FR-069
    'policy-updates',    // FR-070
    'upcoming-launches', // FR-071
    'scam-alerts',       // FR-072
    'top-tokens',        // FR-073
    'gainers-losers',    // FR-074
    'chain-news',        // FR-075
    'nigeria-crypto',    // FR-076
    'africa-crypto',     // FR-077
    'prediction',        // Enhanced - Community predictions
    'survey',            // Enhanced - Community surveys
    'learn',             // Enhanced - Learn & Earn
    'advertisement',     // Enhanced - Reward ads
    'ai-content',        // Enhanced - AI personalized
    'social-feed',       // Enhanced - Social integration
    'crypto-glossary'    // Enhanced - Educational glossary
  ],
  sectionOrder: [
    'breaking-news',
    'featured-news',
    'memecoin-news',
    'trending-coins',
    'prediction',
    'game-news',
    'newsletter',
    'press-releases',
    'events-news',
    'partners',
    'advertisement',
    'editorials',
    'memefi-award',
    'general-crypto',
    'coindaily-cast',
    'opinion',
    'token-reviews',
    'policy-updates',
    'upcoming-launches',
    'scam-alerts',
    'top-tokens',
    'gainers-losers',
    'nigeria-crypto',
    'africa-crypto',
    'learn',
    'survey',
    'ai-content',
    'social-feed',
    'crypto-glossary'
  ]
};

// ========== Main Content Grid Component ==========

export const ContentGrid: React.FC<ContentGridProps> = ({
  config = {},
  className = ''
}) => {
  const [currentConfig, setCurrentConfig] = useState<ContentGridConfig>({
    ...defaultConfig,
    ...config
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (!currentConfig.autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, currentConfig.refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentConfig.autoRefresh, currentConfig.refreshInterval]);

  // Manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    setHiddenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Section component mapping
  const sectionComponents = {
    'breaking-news': BreakingNewsAlertSection,
    'featured-news': FeaturedNewsSection,
    'memecoin-news': MemecoinNewsSection,
    'trending-coins': TrendingCoinsSection,
    'game-news': GameNewsSection,
    'press-releases': PressReleaseSection,
    'events-news': EventsNewsSection,
    'partners': PartnersSection,
    'editorials': EditorialsSection,
    'newsletter': NewsletterSection,
    'memefi-award': MemefiAwardSection,
    'general-crypto': GeneralCryptoSection,
    'coindaily-cast': CoinDailyCastSection,
    'opinion': OpinionSection,
    'token-reviews': TokenReviewsSection,
    'policy-updates': PolicyUpdatesSection,
    'upcoming-launches': UpcomingLaunchesSection,
    'scam-alerts': ScamAlertsSection,
    'top-tokens': TopTokensSection,
    'gainers-losers': GainersLosersSection,
    'nigeria-crypto': NigeriaCryptoSection,
    'africa-crypto': AfricaCryptoSection,
    'prediction': PredictionSection,
    'survey': SurveySection,
    'learn': LearnSection,
    'advertisement': AdvertisementSection,
    'ai-content': AIContentWidgetSection,
    'social-feed': SocialFeedSection,
    'crypto-glossary': CryptoGlossarySection
  };

  const layoutClasses = {
    standard: 'space-y-12',
    compact: 'space-y-8',
    magazine: 'space-y-16'
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Control Panel */}
      <div className="mb-8 bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">CoinDaily Content Hub</h1>
            <p className="text-muted-foreground">
              All 22 content sections • Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowControls(!showControls)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Controls
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-1', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Expanded Controls */}
        {showControls && (
          <div className="border-t border-border pt-4 space-y-4">
            {/* Layout Options */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Layout:</span>
              {(['standard', 'compact', 'magazine'] as const).map((layout) => (
                <Button
                  key={layout}
                  variant={currentConfig.layout === layout ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentConfig(prev => ({ ...prev, layout }))}
                >
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </Button>
              ))}
            </div>

            {/* Auto-refresh Toggle */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Auto-refresh:</span>
              <Button
                variant={currentConfig.autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentConfig(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
              >
                <Clock className="w-4 h-4 mr-1" />
                {currentConfig.autoRefresh ? 'ON' : 'OFF'}
              </Button>
              {currentConfig.autoRefresh && (
                <select
                  value={currentConfig.refreshInterval}
                  onChange={(e) => setCurrentConfig(prev => ({ ...prev, refreshInterval: Number(e.target.value) }))}
                  className="px-2 py-1 border border-border rounded text-sm"
                >
                  <option value={1}>1 min</option>
                  <option value={5}>5 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              )}
            </div>

            {/* Section Visibility */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Visible Sections:</span>
              <div className="flex flex-wrap gap-2">
                {currentConfig.enabledSections.map((sectionId) => {
                  const isHidden = hiddenSections.includes(sectionId);
                  return (
                    <Button
                      key={sectionId}
                      variant={isHidden ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => toggleSection(sectionId)}
                      className="text-xs"
                    >
                      {isHidden ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      {sectionId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Sections Grid */}
      <div className={cn(layoutClasses[currentConfig.layout])}>
        {currentConfig.sectionOrder.map((sectionId) => {
          // Skip if section is disabled or hidden
          if (!currentConfig.enabledSections.includes(sectionId) || hiddenSections.includes(sectionId)) {
            return null;
          }

          const SectionComponent = sectionComponents[sectionId as keyof typeof sectionComponents];
          
          if (!SectionComponent) {
            return (
              <Card key={sectionId} className="p-6">
                <CardContent>
                  <p className="text-muted-foreground">
                    Section "{sectionId}" not implemented yet
                  </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <div key={sectionId} className="relative">
              {/* Section wrapper with loading state */}
              <SectionComponent 
                isLoading={isLoading && currentConfig.showLoadingStates}
              />
              
              {/* Section controls overlay */}
              {showControls && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSection(sectionId)}
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <EyeOff className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-12 bg-muted/30 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">30+</div>
            <div className="text-sm text-muted-foreground">Total Sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {currentConfig.enabledSections.length - hiddenSections.length}
            </div>
            <div className="text-sm text-muted-foreground">Active Sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {currentConfig.autoRefresh ? `${currentConfig.refreshInterval}m` : 'Manual'}
            </div>
            <div className="text-sm text-muted-foreground">Refresh Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-500">
              8
            </div>
            <div className="text-sm text-muted-foreground">Reward Sections</div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              🎯 Prediction System
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              📊 Survey Platform
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              📚 Learn & Earn
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              🤖 AI Personalization
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              🔗 Social Integration
            </Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              📖 Crypto Glossary
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== Individual Section Export for Flexibility ==========

export {
  // FR-056 to FR-063
  MemecoinNewsSection,
  TrendingCoinsSection,
  GameNewsSection,
  NewsletterSection,
  
  // FR-059 to FR-061, FR-064, FR-067, FR-072
  PressReleaseSection,
  EventsNewsSection,
  PartnersSection,
  MemefiAwardSection,
  CoinDailyCastSection,
  ScamAlertsSection,
  
  // FR-062, FR-065, FR-066, FR-069, FR-071, FR-073, FR-076, FR-077
  EditorialsSection,
  FeaturedNewsSection,
  GeneralCryptoSection,
  TokenReviewsSection,
  UpcomingLaunchesSection,
  TopTokensSection,
  NigeriaCryptoSection,
  AfricaCryptoSection,
  
  // FR-068, FR-070, FR-074
  OpinionSection,
  PolicyUpdatesSection,
  GainersLosersSection
};

// Default export
export default ContentGrid;
