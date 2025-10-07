'use client';

import React, { useState, useEffect } from 'react';
import { User, DashboardSections, Post, AdminUserControls, CommunityIntegration } from '../../types/user';
import SimpleProfileSettings from './SimpleProfileSettings';
import TokenSwap from './TokenSwap';
import {
  User as UserIcon,
  Settings,
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  Eye,
  MessageCircle,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Coins,
  Share2,
  Repeat,
  Flag,
  Users,
  Mic,
  Calendar,
  Edit3,
  Crown,
  Shield,
  Award,
  Zap,
  Bell,
  Newspaper,
  Gift,
  Hammer,
  Video,
  PenTool,
  Podcast,
  Play,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  CreditCard,
  BarChart2,
  Megaphone,
  Target,
  TrendingDown,
  Rocket,
  ChevronRight,
  ArrowUp,
  X,
  MessageSquare,
  Trophy,
  Upload,
  Phone,
  Mail,
  IdCard,
  Sun,
  Moon,
  Monitor,
  Hash,
  Tag,
  HeadphonesIcon,
  MessageCircleIcon,
  PhoneIcon,
  MailIcon,
  SendIcon,
  Plus,
  Headphones,
  Wallet,
  TrendingUpIcon,
  BarChart3,
  ArrowRightLeft,
  ShoppingCart,
  Wrench
} from 'lucide-react';

interface UserDashboardProps {
  user: User;
  adminControls: AdminUserControls;
  communityIntegration: CommunityIntegration;
}

export default function UserDashboard({ user, adminControls, communityIntegration }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'community' | 'live' | 'news' | 'market' | 'rewards' | 'tools' | 'events' | 'swap' | 'support' | 'settings'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardSections | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      // Mock dashboard data - replace with actual API call
      const mockData: DashboardSections = {
        userStats: {
          articlesRead: 147,
          readingStreak: 12,
          bookmarks: 23,
          comments: 89,
          level: 7,
          cePoints: user.cePoints,
          joyTokens: user.joyTokens,
        },
        subscriptionStatus: {
          tier: user.subscriptionTier,
          status: user.subscriptionStatus,
          expiryDate: user.subscriptionExpiry,
          features: getSubscriptionFeatures(user.subscriptionTier),
        },
        recentlyRead: [],
        bookmarks: [],
        recentComments: [],
        communityLevel: 3,
        badges: [],
        recentRewards: [],
        predictionAccuracy: 78.5,
        contentSharing: {},
        notifications: [],
        systemAlerts: [],
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionFeatures = (tier: string): string[] => {
    const features: Record<string, string[]> = {
      free: ['Basic news access', 'Community participation', 'Basic portfolio'],
      basic: ['Ad-free experience', 'Premium articles', 'Email support', 'Auto verification'],
      premium: ['All basic features', 'Premium alpha', 'Private community', 'Chat support', 'Portfolio monitoring'],
      vip: ['All premium features', 'Phone support', 'Exclusive tools', 'Priority moderation', '2.5x CE points'],
      enterprise: ['All VIP features', 'Custom branding', 'API access', 'Dedicated account manager', 'White-label solution', 'Multi-user management', 'Advanced analytics', 'Custom integrations', 'SLA guarantee', 'Priority feature requests'],
    };
    return (features[tier] as string[]) || features.free;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Flashing Ads for Free Users */}
        {user.subscriptionTier === 'free' && <FlashingAds />}

        {/* Choose A Plan Section */}
        <ChooseAPlanSection user={user} />

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: UserIcon },
                { id: 'community', label: 'Community', icon: Users },
                { id: 'news', label: 'News', icon: Newspaper },
                { id: 'live', label: 'Live & Podcasts', icon: Mic },
                { id: 'market', label: 'Market', icon: TrendingUp },
                { id: 'rewards', label: 'Rewards', icon: Gift },
                { id: 'tools', label: 'Tools', icon: Hammer },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'swap', label: 'Token Swap', icon: Coins },
                { id: 'support', label: 'Support', icon: HeadphonesIcon },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab user={user} dashboardData={dashboardData} />
        )}
        
        {activeTab === 'community' && (
          <CommunityTab user={user} communityIntegration={communityIntegration} />
        )}

        {activeTab === 'news' && <NewsTab user={user} />}
        
        {activeTab === 'live' && (
          <LiveTab user={user} adminControls={adminControls} />
        )}

        {activeTab === 'market' && <MarketTab user={user} />}
        
        {activeTab === 'rewards' && <RewardsTab user={user} />}
        
        {activeTab === 'tools' && <ToolsTab user={user} />}
        
        {activeTab === 'events' && <EventsTab user={user} />}
        
        {activeTab === 'swap' && (
          <SwapTab user={user} adminControls={adminControls} />
        )}
        
        {activeTab === 'support' && (
          <SupportTab user={user} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab user={user} adminControls={adminControls} />
        )}
      </div>
    </div>
  );
}

// Choose A Plan Section Component
function ChooseAPlanSection({ user }: { user: User }) {
  const plans = [
    { 
      name: 'Bishops', 
      tier: 'free', 
      pricing: 'Free',
      features: [
        'Basic news access',
        'Community participation', 
        'Basic portfolio',
        'Unlimited posts/threads'
      ],
      contentLimits: {
        articles: 0,
        videos: 0,
        podcasts: 0
      }
    },
    { 
      name: 'Apostles', 
      tier: 'basic', 
      pricing: '$19.99/month',
      features: [
        'All in Free',
        'Ad-free',
        'Premium articles',
        'Sell your digital Products',
        'Special Exclusive Newsletter',
        'Email support'
      ],
      contentLimits: {
        articles: 10,
        videos: 10,
        podcasts: 15
      }
    },
    { 
      name: 'Teachers', 
      tier: 'premium', 
      pricing: '$97.79/month',
      features: [
        'All in Apostles',
        'Premium Alpha',
        'Grow private Community',
        'Chat Support'
      ],
      contentLimits: {
        articles: 20,
        videos: 20,
        podcasts: 25
      }
    },
    { 
      name: 'Prophets', 
      tier: 'vip', 
      pricing: '$199.99/month',
      features: [
        'All in Teachers',
        'Phone Support',
        'Shape Meme coin Industry',
        'Exclusive tools',
        'Exclusive Deals'
      ],
      contentLimits: {
        articles: 40,
        videos: 40,
        podcasts: 35
      }
    },
    { 
      name: 'Apostolic Fathers', 
      tier: 'enterprise', 
      pricing: '$250/User/Month',
      features: [
        'All in Prophets',
        'Custom branding',
        'API Access',
        'Dedicated Manager',
        'SLA Guarantee'
      ],
      contentLimits: {
        articles: 60,
        videos: 60,
        podcasts: 75
      }
    }
  ];

  // Get tier priority for comparison
  const getTierPriority = (tier: string) => {
    const priorities = { free: 0, basic: 1, premium: 2, vip: 3, enterprise: 4 };
    return priorities[tier as keyof typeof priorities] || 0;
  };

  const currentUserPriority = getTierPriority(user.subscriptionTier);

  // Plan display logic
  const shouldShowUpgradeButton = (planTier: string) => {
    const planPriority = getTierPriority(planTier);
    return planPriority > currentUserPriority;
  };

  const shouldGrayOut = (planTier: string) => {
    const planPriority = getTierPriority(planTier);
    return planPriority < currentUserPriority;
  };

  const isCurrentPlan = (planTier: string) => {
    return user.subscriptionTier === planTier;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          CHOOSE A PLAN
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select the perfect plan for your crypto journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {plans.map((plan) => {
          const isGrayedOut = shouldGrayOut(plan.tier);
          const showUpgrade = shouldShowUpgradeButton(plan.tier);
          const isCurrent = isCurrentPlan(plan.tier);

          return (
            <div 
              key={plan.tier}
              className={`relative rounded-lg border-2 p-6 transition-all ${
                isCurrent 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : isGrayedOut
                  ? 'border-gray-200 bg-gray-100 opacity-60 dark:border-gray-700 dark:bg-gray-800'
                  : 'border-gray-200 bg-white hover:border-blue-500 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className={`text-xl font-bold mb-2 ${
                  isGrayedOut ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {plan.name}
                </h3>
                <div className={`text-2xl font-bold mb-4 ${
                  isGrayedOut ? 'text-gray-500' : 'text-blue-600'
                }`}>
                  {plan.pricing}
                </div>
              </div>

              {/* Content Limits */}
              {plan.tier !== 'free' && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Monthly Content Limits:
                  </h4>
                  <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <div>• {plan.contentLimits.articles} Articles</div>
                    <div>• {plan.contentLimits.videos} Videos</div>
                    <div>• {plan.contentLimits.podcasts} Podcasts</div>
                    <div>• Unlimited Posts/Threads</div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-center gap-2 text-sm ${
                      isGrayedOut ? 'text-gray-500' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      <CheckCircle className={`h-4 w-4 ${
                        isGrayedOut ? 'text-gray-400' : 'text-green-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {showUpgrade ? (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                    UPGRADE NOW
                  </button>
                ) : isCurrent ? (
                  <div className="w-full bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium text-center">
                    ✓ Active Plan
                  </div>
                ) : (
                  <div className="h-12"></div> // Spacer for grayed out plans
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Flashing Ads Component for Free Users
function FlashingAds() {
  const ads = [
    "🎯 Upgrade to Apostles Plan - Get Ad-Free Experience!",
    "📈 Track Your Portfolio with Premium Tools - Join Teachers!",
    "💎 Exclusive Alpha Calls Available for Premium Members",
    "🚀 Get 2.5x CE Points with VIP Membership!"
  ];

  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4 relative overflow-hidden">
      <div className="flex items-center gap-2">
        <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">AD</span>
        <div className="flex-1 overflow-hidden">
          <div 
            className="whitespace-nowrap animate-pulse text-gray-800"
          >
            {ads[currentAdIndex]}
          </div>
        </div>
      </div>
    </div>
  );
}

// News Tab Component
function NewsTab({ user }: { user: User }) {
  const [newsFilter, setNewsFilter] = useState<'latest' | 'following-users' | 'following-topics' | 'trending' | 'live'>('latest');

  return (
    <div className="space-y-6">
      {/* News Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'latest', label: 'Latest News', icon: Clock },
            { id: 'following-users', label: 'Following Users', icon: Users },
            { id: 'following-topics', label: 'Following Topics', icon: Target },
            { id: 'trending', label: 'Trending News', icon: TrendingUp },
            { id: 'live', label: 'Live', icon: Play }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setNewsFilter(filter.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                newsFilter === filter.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <filter.icon className="h-4 w-4" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* News Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 capitalize">{newsFilter.replace('-', ' ')}</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Sample News Article {i}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                This is a sample news article content for the {newsFilter} section...
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>2 hours ago</span>
                <span>•</span>
                <span>Crypto News</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Market Tab Component  
function MarketTab({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Trending Tokens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Trending Tokens</h3>
          </div>
          <div className="space-y-3">
            {['BTC', 'ETH', 'SOL'].map((token) => (
              <div key={token} className="flex items-center justify-between">
                <span className="font-medium">{token}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">+5.2%</span>
                  <ArrowUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Tokens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Tokens</h3>
          </div>
          <div className="space-y-3">
            {['PEPE', 'DOGE', 'SHIB'].map((token) => (
              <div key={token} className="flex items-center justify-between">
                <span className="font-medium">{token}</span>
                <span className="text-sm text-gray-500">New</span>
              </div>
            ))}
          </div>
        </div>

        {/* About to Launch */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">About to Launch</h3>
          </div>
          <div className="space-y-3">
            {['TOKEN1', 'TOKEN2', 'TOKEN3'].map((token) => (
              <div key={token} className="flex items-center justify-between">
                <span className="font-medium">{token}</span>
                <span className="text-sm text-purple-500">Soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Winners/Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-green-600 dark:text-green-400 mb-4">Top Winners</h3>
          <div className="space-y-2">
            {['BTC (+12%)', 'ETH (+8%)', 'SOL (+15%)'].map((item) => (
              <div key={item} className="flex justify-between">
                <span>{item.split(' ')[0]}</span>
                <span className="text-green-500">{item.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4">Top Losers</h3>
          <div className="space-y-2">
            {['DOGE (-5%)', 'ADA (-3%)', 'DOT (-7%)'].map((item) => (
              <div key={item} className="flex justify-between">
                <span>{item.split(' ')[0]}</span>
                <span className="text-red-500">{item.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rewards Tab Component
function RewardsTab({ user }: { user: User }) {
  const isPaid = user.subscriptionTier !== 'free';
  const [activeRewardView, setActiveRewardView] = useState<'overview' | 'airdrops'>('overview');
  const [activeAirdropView, setActiveAirdropView] = useState<'current' | 'past' | 'upcoming'>('current');

  // Mock airdrop data
  const currentAirdrops = [
    {
      id: 1,
      title: 'CoinDaily Community Airdrop',
      creator: 'CoinDaily Official',
      tokenName: 'CoinDaily Token',
      tokenSymbol: 'CDT',
      totalAmount: 10000,
      participants: 2547,
      maxParticipants: 5000,
      amountPerUser: 3.92,
      endDate: '2025-10-15',
      requirements: ['Follow @CoinDaily', 'Be an active member', 'Hold 50+ JOY tokens'],
      status: 'active' as const,
      image: '/airdrop-placeholder.png'
    },
    {
      id: 2,
      title: 'African Crypto Unity Drop',
      creator: 'African Crypto Union',
      tokenName: 'Unity Token',
      tokenSymbol: 'UNITY',
      totalAmount: 25000,
      participants: 1203,
      maxParticipants: 3000,
      amountPerUser: 8.33,
      endDate: '2025-10-20',
      requirements: ['Verified account', 'Active in last 30 days', 'Complete KYC'],
      status: 'active' as const,
      image: '/airdrop-placeholder.png'
    }
  ];

  const pastAirdrops = [
    {
      id: 3,
      title: 'Memecoin Madness Airdrop',
      creator: 'MemeDAO',
      tokenName: 'Meme Token',
      tokenSymbol: 'MEME',
      totalAmount: 50000,
      finalParticipants: 4521,
      amountPerUser: 11.06,
      endDate: '2025-09-28',
      status: 'completed' as const,
      claimedTokens: 47230,
      claimRate: '94.5%'
    },
    {
      id: 4,
      title: 'Bitcoin Believers Drop',
      creator: 'BTC Maximalists',
      tokenName: 'Bitcoin Believers',
      tokenSymbol: 'BTCB',
      totalAmount: 15000,
      finalParticipants: 1876,
      amountPerUser: 8.0,
      endDate: '2025-09-15',
      status: 'completed' as const,
      claimedTokens: 14100,
      claimRate: '94.0%'
    }
  ];

  const upcomingAirdrops = [
    {
      id: 5,
      title: 'DeFi Education Airdrop',
      creator: 'DeFi Academy',
      tokenName: 'Education Token',
      tokenSymbol: 'EDU',
      totalAmount: 30000,
      estimatedParticipants: 4000,
      amountPerUser: 7.5,
      startDate: '2025-10-25',
      endDate: '2025-11-10',
      requirements: ['Complete DeFi course', 'Pass quiz', 'Share on social media'],
      status: 'upcoming' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rewards & Airdrops</h2>
          </div>
          
          {/* View Toggle */}
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Rewards Overview' },
              { id: 'airdrops', label: 'Airdrops' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveRewardView(view.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeRewardView === view.id
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {activeRewardView === 'overview' 
            ? 'Manage your CE points, JOY tokens, and reward redemptions.' 
            : 'Discover and participate in token airdrops from the community.'
          }
        </p>
      </div>

      {/* Rewards Overview */}
      {activeRewardView === 'overview' && (
        <>
          {/* Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Reward Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2.5hr</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Time on Platform Today</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">50</div>
                <div className="text-sm text-green-700 dark:text-green-300">CE Points Earned Today</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">15</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Articles Read</div>
              </div>
            </div>
          </div>

          {/* CE Points and JOY Token Redemption */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CE Points to JOY Token Conversion */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Redeem CE Points</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Current CE Points:</span>
                  <span className="font-bold text-green-600">{user.cePoints}</span>
                </div>
                <button 
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    user.cePoints >= 100 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={user.cePoints < 100}
                >
                  Convert to JOY Tokens {user.cePoints < 100 && '(Min: 100 CE)'}
                </button>
              </div>
            </div>

            {/* JOY Token Redemption */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Coins className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Redeem JOY Token</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Current JOY Tokens:</span>
                  <span className="font-bold text-yellow-600">{user.joyTokens}</span>
                </div>
                <button className="w-full py-3 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600">
                  Send Redemption Request to Admin
                </button>
              </div>
            </div>
          </div>

          {/* JOY Token Distribution - For Paid Users */}
          {isPaid && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Share & Distribute JOY Tokens</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Share your earned JOY tokens with your followers and build your community.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="py-2 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
                  Distribute to Followers
                </button>
                <button className="py-2 px-4 border border-purple-500 text-purple-500 rounded-lg font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20">
                  View Distribution History
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Airdrops Section */}
      {activeRewardView === 'airdrops' && (
        <>
          {/* Airdrop View Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex space-x-1">
              {[
                { id: 'current', label: 'Current Airdrops', count: currentAirdrops.length },
                { id: 'past', label: 'Past Airdrops', count: pastAirdrops.length },
                { id: 'upcoming', label: 'Upcoming', count: upcomingAirdrops.length }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveAirdropView(view.id as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeAirdropView === view.id
                      ? 'bg-green-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {view.label} ({view.count})
                </button>
              ))}
            </div>
          </div>

          {/* Current Airdrops */}
          {activeAirdropView === 'current' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentAirdrops.map((airdrop) => (
                <div key={airdrop.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {airdrop.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {airdrop.creator}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {airdrop.tokenName} ({airdrop.tokenSymbol})
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {airdrop.amountPerUser} {airdrop.tokenSymbol}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div>Total Pool: {airdrop.totalAmount.toLocaleString()} {airdrop.tokenSymbol}</div>
                      <div>Participants: {airdrop.participants.toLocaleString()}/{airdrop.maxParticipants.toLocaleString()}</div>
                      <div>Ends: {airdrop.endDate}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Requirements:</h4>
                    <ul className="space-y-1">
                      {airdrop.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
                      Subscribe
                    </button>
                    <button className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Airdrops */}
          {activeAirdropView === 'past' && (
            <div className="space-y-4">
              {pastAirdrops.map((airdrop) => (
                <div key={airdrop.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {airdrop.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {airdrop.creator}</p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {airdrop.finalParticipants.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {airdrop.amountPerUser} {airdrop.tokenSymbol}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Per User</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {airdrop.claimedTokens?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Tokens Claimed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {airdrop.claimRate}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Claim Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Airdrops */}
          {activeAirdropView === 'upcoming' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingAirdrops.map((airdrop) => (
                <div key={airdrop.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {airdrop.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">by {airdrop.creator}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                      Upcoming
                    </span>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {airdrop.tokenName} ({airdrop.tokenSymbol})
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ~{airdrop.amountPerUser} {airdrop.tokenSymbol}
                      </span>
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <div>Starts: {airdrop.startDate}</div>
                      <div>Ends: {airdrop.endDate}</div>
                      <div>Est. Participants: {airdrop.estimatedParticipants.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Requirements:</h4>
                    <ul className="space-y-1">
                      {airdrop.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button className="w-full py-2 px-4 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium">
                    Set Reminder
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Airdrop Tab Component
// Tools Tab Component
function ToolsTab({ user }: { user: User }) {
  const [showWritingTool, setShowWritingTool] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showTokenSubscription, setShowTokenSubscription] = useState(false);
  const [showDigitalStore, setShowDigitalStore] = useState(false);
  const [showStaking, setShowStaking] = useState(false);
  const [showWalletWhitelist, setShowWalletWhitelist] = useState(false);
  const [showBoostCampaign, setShowBoostCampaign] = useState(false);
  const [showAirdropCreator, setShowAirdropCreator] = useState(false);
  const [contentType, setContentType] = useState<'post' | 'article' | 'video' | 'podcast'>('post');

  // Get usage limits based on subscription tier
  const getUsageLimits = () => {
    switch (user.subscriptionTier) {
      case 'basic': // Apostles
        return { articles: 10, videos: 10, podcasts: 15 };
      case 'premium': // Teachers
        return { articles: 20, videos: 20, podcasts: 25 };
      case 'vip': // Prophets
        return { articles: 40, videos: 40, podcasts: 35 };
      case 'enterprise': // Apostolic Fathers
        return { articles: 60, videos: 60, podcasts: 75 };
      default: // Free (Bishops)
        return { articles: 0, videos: 0, podcasts: 0 };
    }
  };

  const limits = getUsageLimits();
  const isPaid = user.subscriptionTier !== 'free';
  const isVIPOrHigher = ['premium', 'vip', 'enterprise'].includes(user.subscriptionTier);

  const tools = [
    {
      name: 'Write Post',
      description: 'Create unlimited posts & threads (250 characters max)',
      icon: PenTool,
      available: true, // Available for all users
      action: () => setShowWritingTool(true),
      buttonText: 'Write Post',
      limit: null,
      limitText: 'Unlimited'
    },
    {
      name: 'Write Article',
      description: ['vip', 'enterprise'].includes(user.subscriptionTier) ? 'Create articles (1200 words max)' : 'Create articles (300 words max)',
      icon: Edit3,
      available: isPaid,
      action: () => { setContentType('article'); setShowWritingTool(true); },
      buttonText: 'Write Article',
      limit: limits.articles,
      limitText: limits.articles > 0 ? `${limits.articles}/month` : 'Upgrade required'
    },
    {
      name: 'Create Video',
      description: 'Record and edit video content',
      icon: Video,
      available: user.subscriptionTier === 'basic' ? false : isVIPOrHigher,
      action: () => { setContentType('video'); setShowWritingTool(true); },
      buttonText: 'Create Video',
      limit: limits.videos,
      limitText: limits.videos > 0 ? `${limits.videos}/month` : 'Upgrade required'
    },
    {
      name: 'Create Podcast',
      description: 'Record and publish podcast episodes',
      icon: Headphones,
      available: isPaid,
      action: () => { setContentType('podcast'); setShowWritingTool(true); },
      buttonText: 'Create Podcast',
      limit: limits.podcasts,
      limitText: limits.podcasts > 0 ? `${limits.podcasts}/month` : 'Upgrade required'
    },
    {
      name: 'Boost Campaign',
      description: 'Place ads/boosts for your content using JOY tokens to rank higher',
      icon: Rocket,
      available: true, // Available for all users
      action: () => setShowBoostCampaign(true),
      buttonText: 'Boost Content',
      limit: null,
      limitText: 'JOY tokens required'
    },
    {
      name: 'Digital Store',
      description: 'Create and manage your digital training courses and group access',
      icon: CreditCard,
      available: isPaid, // Available for paid users only
      action: () => setShowDigitalStore(true),
      buttonText: 'Manage Store',
      limit: null,
      limitText: 'Unlimited'
    },
    {
      name: 'Stake JOY Token',
      description: 'Stake your JOY tokens to earn rewards set by admin',
      icon: Coins,
      available: true, // Available for all users
      action: () => setShowStaking(true),
      buttonText: 'Stake Your JOY For More',
      limit: null,
      limitText: 'Based on balance'
    },
    {
      name: 'Portfolio Manager',
      description: 'Import and manage your crypto assets from any platform',
      icon: BarChart3,
      available: true, // Available for all users
      action: () => setShowPortfolio(true),
      buttonText: 'Manage Portfolio',
      limit: null,
      limitText: 'Unlimited'
    },
    {
      name: 'Token Subscription',
      description: 'Subscribe to tokens using JOY tokens for exclusive benefits',
      icon: TrendingUpIcon,
      available: user.joyTokens >= 10, // Requires at least 10 JOY tokens
      action: () => setShowTokenSubscription(true),
      buttonText: 'Subscribe Tokens',
      limit: null,
      limitText: '10+ JOY required'
    },
    {
      name: 'Airdrop Creator',
      description: 'Create and share token airdrops to your followers and subscribers',
      icon: Gift,
      available: isPaid, // Available for paid users only
      action: () => setShowAirdropCreator(true),
      buttonText: 'Create Airdrop',
      limit: null,
      limitText: 'Unlimited'
    },
    {
      name: 'Whitelist Your Wallets',
      description: 'Manage and secure your trusted wallet addresses',
      icon: Shield,
      available: true, // Available for all users
      action: () => setShowWalletWhitelist(true),
      buttonText: 'Whitelist Your Wallets',
      limit: null,
      limitText: 'Unlimited'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Writing Tool Modal */}
      {showWritingTool && (
        <WritingTool 
          contentType={contentType}
          user={user}
          onClose={() => setShowWritingTool(false)}
        />
      )}

      {/* Portfolio Manager Modal */}
      {showPortfolio && (
        <PortfolioManager 
          user={user}
          onClose={() => setShowPortfolio(false)}
        />
      )}

      {/* Token Subscription Modal */}
      {showTokenSubscription && (
        <TokenSubscriptionModal 
          user={user}
          onClose={() => setShowTokenSubscription(false)}
        />
      )}

      {/* Digital Store Modal */}
      {showDigitalStore && (
        <DigitalStoreModal 
          user={user}
          onClose={() => setShowDigitalStore(false)}
        />
      )}

      {/* JOY Token Staking Modal */}
      {showStaking && (
        <JOYStakingModal 
          user={user}
          onClose={() => setShowStaking(false)}
        />
      )}

      {/* Wallet Whitelist Modal */}
      {showWalletWhitelist && (
        <WalletWhitelistModal 
          user={user}
          onClose={() => setShowWalletWhitelist(false)}
        />
      )}

      {/* Boost Campaign Modal */}
      {showBoostCampaign && (
        <BoostCampaignModal 
          user={user}
          onClose={() => setShowBoostCampaign(false)}
        />
      )}

      {/* Airdrop Creator Modal */}
      {showAirdropCreator && (
        <AirdropCreatorModal 
          user={user}
          onClose={() => setShowAirdropCreator(false)}
        />
      )}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <div key={tool.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <tool.icon className={`h-6 w-6 ${tool.available ? 'text-blue-500' : 'text-gray-400'}`} />
              <h3 className={`font-semibold ${tool.available ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                {tool.name}
              </h3>
            </div>
            <p className={`text-sm mb-4 ${tool.available ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500'}`}>
              {tool.description}
            </p>
            
            {/* Usage Limit Display */}
            <div className="mb-4">
              <div className={`text-xs px-2 py-1 rounded-full text-center ${
                tool.limitText === 'Unlimited' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : tool.limitText?.includes('required')
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                  : tool.limitText?.includes('month')
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {tool.limitText || 'No limit info'}
              </div>
            </div>

            {tool.available ? (
              <button 
                onClick={tool.action}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                {tool.buttonText}
              </button>
            ) : (
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed">
                  Upgrade Required
                </button>
                <p className="text-xs text-gray-500">
                  Available for {user.subscriptionTier === 'free' ? 'paid plans' : 'higher tier plans'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Digital Store - Detailed Section for Paid Users */}
    </div>
  );
}

// Boost Campaign Modal Component
function BoostCampaignModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [boostType, setBoostType] = useState<'post' | 'article' | 'podcast' | 'token' | 'comment' | 'store' | 'product' | 'training'>('post');
  const [boostTitle, setBoostTitle] = useState('');
  const [boostDescription, setBoostDescription] = useState('');
  const [boostDuration, setBoostDuration] = useState<'1' | '3' | '7' | '14' | '30'>('1');
  const [boostPosition, setBoostPosition] = useState<'top' | 'featured' | 'trending'>('top');
  const [isProcessing, setIsProcessing] = useState(false);

  // JOY token pricing for boosts (per day)
  const boostPricing = {
    '1': { top: 10, featured: 15, trending: 20 },
    '3': { top: 25, featured: 40, trending: 50 },
    '7': { top: 50, featured: 80, trending: 120 },
    '14': { top: 90, featured: 150, trending: 220 },
    '30': { top: 180, featured: 300, trending: 450 }
  };

  const selectedPrice = boostPricing[boostDuration][boostPosition];
  const hasEnoughTokens = user.joyTokens >= selectedPrice;

  const handleBoostSubmit = async () => {
    if (!hasEnoughTokens) {
      alert(`Insufficient JOY tokens. You need ${selectedPrice} JOY tokens but only have ${user.joyTokens}.`);
      return;
    }

    if (!boostTitle.trim()) {
      alert('Please enter a title for your boost campaign.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Mock API call to submit boost for admin approval
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deduct JOY tokens (in real app, this would be handled by backend)
      console.log('Boost Campaign Submitted:', {
        type: boostType,
        title: boostTitle,
        description: boostDescription,
        duration: boostDuration,
        position: boostPosition,
        cost: selectedPrice,
        userJoyTokens: user.joyTokens
      });
      
      alert(`Boost campaign submitted for admin approval! ${selectedPrice} JOY tokens will be deducted upon approval.`);
      onClose();
    } catch (error) {
      alert('Failed to submit boost campaign. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Rocket className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Boost Campaign
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* JOY Token Balance */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-yellow-800 dark:text-yellow-300">Your JOY Balance:</span>
              </div>
              <span className="font-bold text-yellow-600 text-lg">{user.joyTokens} JOY</span>
            </div>
          </div>

          {/* Boost Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              What would you like to boost?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'post', label: 'Post', icon: '📝' },
                { value: 'article', label: 'Article', icon: '📰' },
                { value: 'podcast', label: 'Podcast', icon: '🎙️' },
                { value: 'token', label: 'Token', icon: '💰' },
                { value: 'comment', label: 'Comment', icon: '💬' },
                { value: 'store', label: 'Store', icon: '🏪' },
                { value: 'product', label: 'Product', icon: '📦' },
                { value: 'training', label: 'Training', icon: '🎓' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setBoostType(type.value as any)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    boostType === type.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Boost Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Boost Title *
            </label>
            <input
              type="text"
              value={boostTitle}
              onChange={(e) => setBoostTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              placeholder={`Enter title for your ${boostType} boost...`}
            />
          </div>

          {/* Boost Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              value={boostDescription}
              onChange={(e) => setBoostDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              placeholder="Describe what you're boosting and why..."
            />
          </div>

          {/* Boost Position */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Boost Position
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'top', label: 'Top Ranked', desc: 'Appear at the top of lists', icon: '🥇' },
                { value: 'featured', label: 'Featured', desc: 'Highlighted in featured sections', icon: '⭐' },
                { value: 'trending', label: 'Trending', desc: 'Show in trending sections', icon: '🔥' }
              ].map((position) => (
                <button
                  key={position.value}
                  onClick={() => setBoostPosition(position.value as any)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    boostPosition === position.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{position.icon}</span>
                    <span className="font-medium">{position.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{position.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Boost Duration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: '1', label: '1 Day' },
                { value: '3', label: '3 Days' },
                { value: '7', label: '1 Week' },
                { value: '14', label: '2 Weeks' },
                { value: '30', label: '1 Month' }
              ].map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setBoostDuration(duration.value as any)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    boostDuration === duration.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                  }`}
                >
                  <div className="font-medium">{duration.label}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {boostPricing[duration.value as keyof typeof boostPricing][boostPosition]} JOY
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">Total Cost:</span>
              <span className="font-bold text-xl text-orange-600">{selectedPrice} JOY</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {boostPosition.charAt(0).toUpperCase() + boostPosition.slice(1)} position for {boostDuration} day{boostDuration !== '1' ? 's' : ''}
            </div>
            {!hasEnoughTokens && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Insufficient JOY tokens. You need {selectedPrice - user.joyTokens} more JOY.
              </div>
            )}
          </div>

          {/* Admin Approval Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Admin Approval Required:</strong> Your boost campaign will be reviewed by administrators before going live. JOY tokens will only be deducted upon approval.
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleBoostSubmit}
              disabled={!hasEnoughTokens || !boostTitle.trim() || isProcessing}
              className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Submitting...' : `Submit Boost (${selectedPrice} JOY)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Airdrop Creator Modal Component
function AirdropCreatorModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [airdropTitle, setAirdropTitle] = useState('');
  const [airdropDescription, setAirdropDescription] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [recipientCount, setRecipientCount] = useState('');
  const [distributionType, setDistributionType] = useState<'equal' | 'weighted' | 'random'>('equal');
  const [targetAudience, setTargetAudience] = useState<'followers' | 'subscribers' | 'community' | 'custom'>('followers');
  const [requirements, setRequirements] = useState({
    minFollowers: false,
    verifiedAccount: false,
    activeUser: false,
    premiumSubscriber: false
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const amountPerRecipient = totalAmount && recipientCount ? 
    (parseFloat(totalAmount) / parseInt(recipientCount)).toFixed(4) : '0';

  const handleCreateAirdrop = async () => {
    if (!airdropTitle.trim() || !tokenName.trim() || !totalAmount || !recipientCount) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Airdrop Created:', {
        title: airdropTitle,
        description: airdropDescription,
        tokenName,
        tokenSymbol,
        totalAmount: parseFloat(totalAmount),
        recipientCount: parseInt(recipientCount),
        amountPerRecipient: parseFloat(amountPerRecipient),
        distributionType,
        targetAudience,
        requirements,
        startDate,
        endDate,
        creator: user.id
      });
      
      alert('Airdrop created successfully! It will be reviewed by administrators before going live.');
      onClose();
    } catch (error) {
      alert('Failed to create airdrop. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create Token Airdrop
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Airdrop Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Airdrop Title *
              </label>
              <input
                type="text"
                value={airdropTitle}
                onChange={(e) => setAirdropTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., CoinDaily Community Airdrop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Target Audience *
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="followers">My Followers</option>
                <option value="subscribers">My Subscribers</option>
                <option value="community">Community Members</option>
                <option value="custom">Custom List</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={airdropDescription}
              onChange={(e) => setAirdropDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              placeholder="Describe your airdrop and its purpose..."
            />
          </div>

          {/* Token Details */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Token Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Token Name *
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g., CoinDaily Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g., CDT"
                />
              </div>
            </div>
          </div>

          {/* Distribution Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Total Amount *
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Recipients Count *
              </label>
              <input
                type="number"
                value={recipientCount}
                onChange={(e) => setRecipientCount(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Per Person
              </label>
              <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-lg text-center font-medium">
                {amountPerRecipient} {tokenSymbol || 'tokens'}
              </div>
            </div>
          </div>

          {/* Distribution Type */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Distribution Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'equal', label: 'Equal Distribution', desc: 'Same amount for everyone' },
                { value: 'weighted', label: 'Weighted', desc: 'Based on engagement/activity' },
                { value: 'random', label: 'Random Amounts', desc: 'Random distribution within range' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setDistributionType(type.value as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    distributionType === type.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Participation Requirements
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'minFollowers', label: 'Minimum Followers (100+)' },
                { key: 'verifiedAccount', label: 'Verified Account' },
                { key: 'activeUser', label: 'Active in Last 30 Days' },
                { key: 'premiumSubscriber', label: 'Premium Subscriber' }
              ].map((req) => (
                <label key={req.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirements[req.key as keyof typeof requirements]}
                    onChange={(e) => setRequirements(prev => ({
                      ...prev,
                      [req.key]: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">{req.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Airdrop Summary</h4>
            <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <div>• Distributing {totalAmount} {tokenSymbol || 'tokens'} to {recipientCount} {targetAudience}</div>
              <div>• Each recipient gets ~{amountPerRecipient} {tokenSymbol || 'tokens'}</div>
              <div>• Distribution method: {distributionType}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateAirdrop}
              disabled={!airdropTitle.trim() || !tokenName.trim() || !totalAmount || !recipientCount || isProcessing}
              className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Creating...' : 'Create Airdrop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Digital Store Modal Component
function DigitalStoreModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [courseTitle, setCourseTitle] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('basic');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Digital Store Management
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage training courses and group access for your community.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Training Course */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Create Training Course</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Course Title"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <textarea
                    placeholder="Course Description"
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="basic">Basic Plan Access</option>
                    <option value="premium">Premium Plan Access</option>
                    <option value="vip">VIP Plan Access</option>
                  </select>
                  <button className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
                    Create Course
                  </button>
                </div>
              </div>
            </div>

            {/* Setup Group Access */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Setup Group Access</h4>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <textarea
                    placeholder="Group Description"
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100">
                    <option>Basic Tier Access</option>
                    <option>Premium Tier Access</option>
                    <option>VIP Tier Access</option>
                  </select>
                  <button className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Store Management Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
              <ShoppingCart className="h-4 w-4" />
              Manage Store
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-orange-500 text-orange-500 rounded-lg font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20">
              <Settings className="h-4 w-4" />
              Store Settings
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// JOY Staking Modal Component
function JOYStakingModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [stakeAmount, setStakeAmount] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Stake JOY Tokens
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Stake your JOY tokens to earn rewards. Reward rates are set by administrators.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Staking Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Current Staking</h4>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Staked Amount:</span>
                  <span className="font-bold text-yellow-600">0 JOY</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Rewards Earned:</span>
                  <span className="font-bold text-green-600">0 JOY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current APY:</span>
                  <span className="font-bold text-blue-600">12%</span>
                </div>
              </div>
            </div>

            {/* Staking Actions */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Staking Actions</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount to stake"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600">
                    Stake
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Available: {user.joyTokens} JOY tokens
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
                    Claim Rewards
                  </button>
                  <button className="flex-1 py-2 px-4 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
                    Unstake
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wallet Whitelist Modal Component
function WalletWhitelistModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [wallets, setWallets] = useState<string[]>([
    '0x1234...5678', // Mock existing wallets
    '0xabcd...efgh'
  ]);
  const [newWallet, setNewWallet] = useState('');

  const addWallet = () => {
    if (newWallet && wallets.length < 5) {
      setWallets([...wallets, newWallet]);
      setNewWallet('');
    }
  };

  const requestWalletRemoval = (walletAddress: string) => {
    // User cannot remove wallets directly - must request admin
    alert(`Removal request sent to admin for wallet: ${walletAddress}\nOnly administrators can remove whitelisted wallets.`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Whitelist Wallet Addresses
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Add up to 5 wallet addresses for token swaps and transactions on our platform.
            <span className="block mt-1 text-orange-600 dark:text-orange-400 font-medium">
              Note: Only administrators can remove whitelisted wallets upon request.
            </span>
          </p>
          
          <div className="space-y-4">
            {/* Existing Wallets */}
            <div className="space-y-2">
              {wallets.map((wallet, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-mono text-sm">{wallet}</span>
                  <button
                    onClick={() => requestWalletRemoval(wallet)}
                    className="text-orange-500 hover:text-orange-700 flex items-center gap-1 text-sm"
                    title="Request removal from admin"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Request Removal
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add New Wallet */}
            {wallets.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="Enter wallet address (0x...)"
                  className="flex-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={addWallet}
                  disabled={!newWallet}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              {wallets.length}/5 wallet addresses whitelisted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Portfolio Manager Component
function PortfolioManager({ user, onClose }: { user: User; onClose: () => void }) {
  const [activePortfolioTab, setActivePortfolioTab] = useState<'overview' | 'holdings' | 'transactions' | 'analytics'>('overview');
  const [newAsset, setNewAsset] = useState({ symbol: '', amount: '', platform: '', avgPrice: '' });
  
  // Mock portfolio data - in real implementation, fetch from API
  const portfolioData = {
    totalValue: 45670.50,
    dayChange: 1250.30,
    dayChangePercent: 2.8,
    holdings: [
      { symbol: 'BTC', name: 'Bitcoin', amount: 0.75, value: 50625.00, change: 3.2, platform: 'Binance' },
      { symbol: 'ETH', name: 'Ethereum', amount: 12.5, value: 33125.00, change: -1.8, platform: 'Coinbase' },
      { symbol: 'SOL', name: 'Solana', amount: 150.0, value: 21870.00, change: 5.7, platform: 'FTX' },
    ],
    transactions: [
      { type: 'Buy', symbol: 'BTC', amount: 0.25, price: 67500, date: '2024-10-01', platform: 'Binance' },
      { type: 'Sell', symbol: 'ETH', amount: 2.0, price: 2650, date: '2024-09-28', platform: 'Coinbase' },
    ]
  };

  const portfolioTabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'holdings', name: 'Holdings', icon: Wallet },
    { id: 'transactions', name: 'Transactions', icon: ArrowRightLeft },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const handleAddAsset = () => {
    if (newAsset.symbol && newAsset.amount) {
      console.log('Adding asset:', newAsset);
      setNewAsset({ symbol: '', amount: '', platform: '', avgPrice: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Portfolio Manager</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Portfolio Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            {portfolioTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePortfolioTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm ${
                  activePortfolioTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activePortfolioTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Portfolio Value</h3>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                    ${portfolioData.totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">24h Change</h3>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                    +${portfolioData.dayChange.toLocaleString()} ({portfolioData.dayChangePercent}%)
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Assets</h3>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                    {portfolioData.holdings.length}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Top Holdings</h3>
                <div className="space-y-2">
                  {portfolioData.holdings.slice(0, 3).map((holding, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{holding.symbol}</span>
                        </div>
                        <span className="font-medium">{holding.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${holding.value.toLocaleString()}</p>
                        <p className={`text-sm ${holding.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {holding.change >= 0 ? '+' : ''}{holding.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Holdings Tab */}
          {activePortfolioTab === 'holdings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Holdings</h3>
                <button 
                  onClick={() => console.log('Import from exchange...')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Import from Exchange
                </button>
              </div>

              {/* Add Manual Asset */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Add Asset Manually</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Symbol (e.g., BTC)"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset({...newAsset, amount: e.target.value})}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-gray-100"
                  />
                  <input
                    type="text"
                    placeholder="Platform"
                    value={newAsset.platform}
                    onChange={(e) => setNewAsset({...newAsset, platform: e.target.value})}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button 
                    onClick={handleAddAsset}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Holdings List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 text-gray-600 dark:text-gray-400">Asset</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Value</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">24h Change</th>
                      <th className="text-right py-3 text-gray-600 dark:text-gray-400">Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.holdings.map((holding, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">{holding.symbol}</span>
                            </div>
                            <div>
                              <p className="font-medium">{holding.name}</p>
                              <p className="text-sm text-gray-500">{holding.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 font-medium">{holding.amount}</td>
                        <td className="text-right py-3 font-bold">${holding.value.toLocaleString()}</td>
                        <td className={`text-right py-3 font-medium ${holding.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {holding.change >= 0 ? '+' : ''}{holding.change}%
                        </td>
                        <td className="text-right py-3 text-gray-600 dark:text-gray-400">{holding.platform}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activePortfolioTab === 'transactions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction History</h3>
              <div className="space-y-3">
                {portfolioData.transactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'Buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'Buy' ? '+' : '-'}
                      </div>
                      <div>
                        <p className="font-medium">{tx.type} {tx.symbol}</p>
                        <p className="text-sm text-gray-500">{tx.platform} • {tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{tx.amount} {tx.symbol}</p>
                      <p className="text-sm text-gray-500">${tx.price.toLocaleString()} per token</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activePortfolioTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Portfolio Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Asset Allocation</h4>
                  <div className="space-y-2">
                    {portfolioData.holdings.map((holding, idx) => {
                      const percentage = (holding.value / portfolioData.totalValue * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{holding.symbol}</span>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Return</span>
                      <span className="text-sm font-medium text-green-500">+15.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Best Performer</span>
                      <span className="text-sm font-medium">SOL (+5.7%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Score</span>
                      <span className="text-sm font-medium">Medium</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Token Subscription Modal Component
function TokenSubscriptionModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  
  // Mock subscription tokens - same as in SwapTab
  const subscriptionTokens = [
    {
      id: 1,
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67500.00,
      change24h: 2.5,
      subscriptionCost: 100,
      subscribers: 15420,
      benefits: ['Price alerts', 'Technical analysis', 'News priority', 'Community access'],
      userSubscribed: false
    },
    {
      id: 2,
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2650.00,
      change24h: -1.2,
      subscriptionCost: 75,
      subscribers: 12800,
      benefits: ['DeFi insights', 'Gas tracker', 'Ecosystem updates', 'Developer resources'],
      userSubscribed: true
    },
    {
      id: 3,
      symbol: 'SOL',
      name: 'Solana',
      price: 145.80,
      change24h: 5.7,
      subscriptionCost: 50,
      subscribers: 8500,
      benefits: ['Performance metrics', 'Ecosystem tracking', 'Airdrop alerts', 'Validator data'],
      userSubscribed: false
    },
    {
      id: 4,
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0.12,
      change24h: 8.3,
      subscriptionCost: 25,
      subscribers: 18900,
      benefits: ['Meme tracking', 'Social sentiment', 'Community events', 'Trend analysis'],
      userSubscribed: false
    }
  ];

  const totalCost = selectedTokens.reduce((sum, tokenId) => {
    const token = subscriptionTokens.find(t => t.id === tokenId);
    return sum + (token?.subscriptionCost || 0);
  }, 0);

  const toggleTokenSelection = (tokenId: number) => {
    setSelectedTokens(prev => 
      prev.includes(tokenId) 
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    );
  };

  const handleSubscribe = () => {
    if (user.joyTokens >= totalCost) {
      console.log('Subscribing to tokens:', selectedTokens, 'Cost:', totalCost);
      alert(`Successfully subscribed to ${selectedTokens.length} tokens for ${totalCost} JOY!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Token Subscriptions</h2>
              <p className="text-gray-600 dark:text-gray-400">Subscribe to tokens for premium insights and alerts</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Balance and Selection Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Your JOY Balance</h3>
              <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{user.joyTokens.toLocaleString()} JOY</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Selected Tokens</h3>
              <p className="text-xl font-bold text-green-800 dark:text-green-300">{selectedTokens.length}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Cost</h3>
              <p className="text-xl font-bold text-purple-800 dark:text-purple-300">{totalCost} JOY</p>
            </div>
          </div>

          {/* Available Tokens */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Tokens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionTokens.map((token) => (
                <div 
                  key={token.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    token.userSubscribed 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : selectedTokens.includes(token.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => !token.userSubscribed && toggleTokenSelection(token.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm">{token.symbol}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{token.name}</h4>
                        <p className="text-sm text-gray-500">${token.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {token.userSubscribed ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                          Subscribed
                        </span>
                      ) : (
                        <input 
                          type="checkbox" 
                          checked={selectedTokens.includes(token.id)}
                          onChange={() => toggleTokenSelection(token.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benefits:</p>
                    <div className="flex flex-wrap gap-1">
                      {token.benefits.slice(0, 2).map((benefit, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          {benefit}
                        </span>
                      ))}
                      {token.benefits.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          +{token.benefits.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{token.subscribers.toLocaleString()} subscribers</span>
                    <span className="font-bold text-blue-600">{token.subscriptionCost} JOY/month</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            {selectedTokens.length > 0 && (
              <button 
                onClick={handleSubscribe}
                disabled={user.joyTokens < totalCost}
                className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  user.joyTokens >= totalCost
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                <Coins className="w-5 h-5" />
                Subscribe ({totalCost} JOY)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Writing Tool Component
function WritingTool({ contentType, user, onClose }: { 
  contentType: 'post' | 'article' | 'video' | 'podcast', 
  user: User, 
  onClose: () => void 
}) {
  // If it's a post, use the simple post editor
  if (contentType === 'post') {
    return <PostEditor user={user} onClose={onClose} />;
  }

  // If it's a video, use the video editor
  if (contentType === 'video') {
    return <VideoEditor user={user} onClose={onClose} />;
  }

  // If it's a podcast, use the podcast editor
  if (contentType === 'podcast') {
    return <PodcastEditor user={user} onClose={onClose} />;
  }

  // Article editor with full features
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('news');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'settings'>('write');
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  
  // Access control - only paid users can write articles
  const isPaid = user.subscriptionTier !== 'free';
  const isEnterpriseOrProphet = ['enterprise', 'prophets'].includes(user.subscriptionTier);
  
  // Word limits for articles only
  const maxWords = isEnterpriseOrProphet ? 1200 : 300;
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // If user is not paid and trying to write article, show upgrade message
  if (!isPaid) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Upgrade Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Writing articles is available for paid subscribers only. Upgrade your plan to start creating articles.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAIAssist = async () => {
    setIsAIAssisting(true);
    try {
      // Mock AI suggestions
      const suggestions = [
        "Consider adding market analysis for better insights",
        "Include recent cryptocurrency trends",
        "Add relevant statistics and data points", 
        "Improve readability with shorter paragraphs"
      ];
      setAISuggestions(suggestions);
    } catch (error) {
      console.error('AI assist error:', error);
    } finally {
      setIsAIAssisting(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag) && tags.length < 5) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold capitalize text-gray-900 dark:text-gray-100">
              {contentType === 'article' ? 'Write Article' : 'Create Video'}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Plan Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-medium">Word Limit: </span>
              {maxWords} words • 
              <span className="font-medium"> Plan: </span>
              {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
              {isEnterpriseOrProphet && <span className="ml-2 px-2 py-1 bg-purple-500 text-white rounded text-xs">Extended Limit</span>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {['write', 'preview', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'write' && (
            <div className="space-y-4">
              {/* Title Input for Articles */}
              {contentType === 'article' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Article Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Enter article title..."
                  />
                </div>
              )}

              {/* Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {contentType === 'article' ? 'Article Content' : 'Video Description'}
                  </label>
                  {contentType === 'article' && (
                    <button
                      onClick={handleAIAssist}
                      disabled={isAIAssisting}
                      className="text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg"
                    >
                      {isAIAssisting ? '🤖 AI Working...' : '🤖 AI Assist'}
                    </button>
                  )}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder={`Write your ${contentType} here...`}
                />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className={`${wordCount > maxWords ? 'text-red-500' : 'text-gray-500'}`}>
                    {wordCount}/{maxWords} words
                  </span>
                  {wordCount > maxWords && (
                    <span className="text-red-500 font-medium">Word limit exceeded!</span>
                  )}
                </div>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">AI Suggestions:</h4>
                  <ul className="space-y-1">
                    {aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-purple-700 dark:text-purple-400">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 min-h-64">
                {contentType === 'article' && title && (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {content ? (
                    <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{content}</p>
                  ) : (
                    <p className="text-gray-500 italic">Start writing to see preview...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Category Selection */}
              {contentType === 'article' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="news">News</option>
                    <option value="analysis">Analysis</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="opinion">Opinion</option>
                    <option value="market">Market</option>
                  </select>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tags (max 5)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={addTag}
                    disabled={!newTag || tags.length >= 5}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (wordCount > maxWords) {
                  alert(`Please reduce content to ${maxWords} words or less.`);
                  return;
                }
                console.log(`Publishing ${contentType}:`, { title, content, category, tags });
                onClose();
              }}
              disabled={wordCount > maxWords || !content.trim()}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish {contentType === 'article' ? 'Article' : 'Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video Editor Component
function VideoEditor({ user, onClose }: { user: User; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'livestream' | 'settings'>('upload');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [category, setCategory] = useState('crypto-news');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'premium'>('public');
  const [isRecording, setIsRecording] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Access control - VIP or higher for video creation
  const isVIPOrHigher = ['vip', 'enterprise', 'prophets'].includes(user.subscriptionTier);

  if (!isVIPOrHigher) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              VIP Access Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Video creation is available for VIP subscribers and above. Upgrade your plan to start creating videos.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                Upgrade to VIP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Mock recording start
    setTimeout(() => setIsRecording(false), 3000);
  };

  const handleStartLivestream = () => {
    setIsLive(true);
    console.log('Starting livestream...');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Video className="h-6 w-6 text-purple-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create Video Content
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Plan Info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="text-sm text-purple-800 dark:text-purple-300">
              <span className="font-medium">Video Creation • </span>
              Plan: {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
              <span className="ml-2 px-2 py-1 bg-purple-500 text-white rounded text-xs">VIP Access</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {['upload', 'record', 'livestream', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                  activeTab === tab
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'livestream' ? 'Live Stream' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-purple-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Upload Your Video
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag and drop your video file here, or click to browse
                </p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </label>
                <div className="text-sm text-gray-500 mt-2">
                  Supported formats: MP4, AVI, MOV (Max: 500MB)
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Uploading video...
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'record' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isRecording ? (
                    <div className="w-8 h-8 bg-red-500 rounded animate-pulse"></div>
                  ) : (
                    <Video className="h-12 w-12 text-red-500" />
                  )}
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isRecording ? 'Recording...' : 'Record Video'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isRecording ? 'Recording in progress. Click stop when finished.' : 'Click the button below to start recording your video'}
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 mb-6">
                  <div className="text-gray-500 dark:text-gray-400 text-center">
                    {isRecording ? 'Camera feed would appear here' : 'Camera preview will appear here'}
                  </div>
                </div>

                <button
                  onClick={handleStartRecording}
                  disabled={isRecording}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'livestream' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isLive ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-500 font-bold text-sm">LIVE</span>
                    </div>
                  ) : (
                    <Podcast className="h-12 w-12 text-red-500" />
                  )}
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isLive ? 'Live Stream Active' : 'Start Live Stream'}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isLive ? 'Your stream is live! Viewers can now join.' : 'Go live and interact with your audience in real-time'}
                </p>

                {!isLive && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Stream Settings:</strong> Make sure your title and description are set before going live.
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartLivestream}
                  disabled={isLive}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    isLive 
                      ? 'bg-gray-400 cursor-not-allowed text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isLive ? 'Stream Active' : 'Go Live'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Video Title */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Video Title
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter video title..."
                />
              </div>

              {/* Video Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Describe your video content..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="crypto-news">Crypto News</option>
                  <option value="market-analysis">Market Analysis</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="interview">Interview</option>
                  <option value="live-discussion">Live Discussion</option>
                  <option value="review">Review</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="premium">Premium Subscribers</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tags (max 10)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={addTag}
                    disabled={!newTag || tags.length >= 10}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-purple-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                console.log('Publishing video:', { 
                  title: videoTitle, 
                  description: videoDescription, 
                  category, 
                  tags, 
                  visibility,
                  tab: activeTab 
                });
                onClose();
              }}
              disabled={!videoTitle.trim()}
              className="flex-1 py-3 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeTab === 'livestream' && isLive ? 'End Stream' : 'Create Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Post Editor Component
function PostEditor({ user, onClose }: { user: User; onClose: () => void }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const maxLength = 250;
  const remainingChars = maxLength - content.length;

  const addTag = () => {
    if (newTag && !tags.includes(newTag) && tags.length < 5) {
      // If tag starts with #, keep it, otherwise add #
      const formattedTag = newTag.startsWith('#') ? newTag : `#${newTag}`;
      setTags([...tags, formattedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ' ' && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Write Post
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Post Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxLength}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="What's on your mind about crypto?"
            />
            <div className="flex items-center justify-between mt-1 text-sm">
              <span className={`${remainingChars < 0 ? 'text-red-500' : remainingChars < 50 ? 'text-orange-500' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </span>
              <span className="text-gray-400">
                {content.length}/{maxLength}
              </span>
            </div>
          </div>

          {/* Tags & Hashtags */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Tags & Hashtags (max 5)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagInput}
                className="flex-1 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Add #hashtag or tag..."
              />
              <button
                onClick={addTag}
                disabled={!newTag || tags.length >= 5}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                Add
              </button>
            </div>
            
            {/* Display Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              Add hashtags to help others discover your post
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (remainingChars < 0) {
                  alert('Please reduce your post to 250 characters or less.');
                  return;
                }
                console.log('Publishing post:', { content, tags });
                onClose();
              }}
              disabled={remainingChars < 0 || !content.trim()}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab({ user }: { user: User }) {
  const [eventView, setEventView] = useState<'upcoming' | 'calendar' | 'past'>('upcoming');
  
  // Mock event data
  const upcomingEvents = [
    {
      id: 1,
      title: 'Crypto Trading Masterclass',
      date: '2025-10-15',
      time: '14:00 UTC',
      type: 'Webinar',
      description: 'Learn advanced trading strategies from crypto experts',
      registered: false,
      maxAttendees: 500,
      currentAttendees: 234
    },
    {
      id: 2,
      title: 'African Crypto Summit 2025',
      date: '2025-11-02',
      time: '09:00 UTC',
      type: 'Conference',
      description: 'Annual summit bringing together African crypto enthusiasts',
      registered: true,
      maxAttendees: 1000,
      currentAttendees: 789
    },
    {
      id: 3,
      title: 'DeFi Workshop for Beginners',
      date: '2025-10-22',
      time: '16:00 UTC',
      type: 'Workshop',
      description: 'Hands-on introduction to decentralized finance',
      registered: false,
      maxAttendees: 100,
      currentAttendees: 67
    }
  ];

  const pastEvents = [
    {
      id: 11,
      title: 'Bitcoin Halving Analysis',
      date: '2025-09-28',
      type: 'Webinar',
      description: 'Deep dive into Bitcoin halving effects',
      attendees: 450
    },
    {
      id: 12,
      title: 'NFT Market Trends',
      date: '2025-09-20',
      type: 'Panel Discussion',
      description: 'Current state of NFT markets in Africa',
      attendees: 320
    },
    {
      id: 13,
      title: 'Stablecoin Deep Dive',
      date: '2025-09-15',
      type: 'Workshop',
      description: 'Understanding stablecoins and their use cases',
      attendees: 180
    },
    {
      id: 14,
      title: 'Crypto Regulation Update',
      date: '2025-09-10',
      type: 'Legal Update',
      description: 'Latest regulatory changes across Africa',
      attendees: 280
    },
    {
      id: 15,
      title: 'Metaverse Investment Opportunities',
      date: '2025-09-05',
      type: 'Investment Talk',
      description: 'Exploring metaverse investment landscapes',
      attendees: 390
    },
    {
      id: 16,
      title: 'Smart Contract Security',
      date: '2025-08-30',
      type: 'Technical Workshop',
      description: 'Best practices for smart contract security',
      attendees: 150
    },
    {
      id: 17,
      title: 'DAO Governance Models',
      date: '2025-08-25',
      type: 'Discussion',
      description: 'Exploring different DAO governance approaches',
      attendees: 200
    },
    {
      id: 18,
      title: 'Layer 2 Solutions Explained',
      date: '2025-08-20',
      type: 'Technical Talk',
      description: 'Understanding Ethereum Layer 2 scaling solutions',
      attendees: 340
    },
    {
      id: 19,
      title: 'Cross-border Payments with Crypto',
      date: '2025-08-15',
      type: 'Use Case Study',
      description: 'Real-world crypto payment solutions in Africa',
      attendees: 270
    },
    {
      id: 20,
      title: 'Token Economics Fundamentals',
      date: '2025-08-10',
      type: 'Educational',
      description: 'Understanding tokenomics and token design',
      attendees: 195
    }
  ];

  const handleRegister = (eventId: number) => {
    console.log(`Registering for event ${eventId}`);
    // Handle registration logic here
  };

  return (
    <div className="space-y-6">
      {/* Event View Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'upcoming', label: 'Upcoming Events', icon: Calendar },
            { id: 'calendar', label: 'Calendar View', icon: Calendar },
            { id: 'past', label: 'Past Events', icon: Clock }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setEventView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                eventView === view.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <view.icon className="h-4 w-4" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      {eventView === 'upcoming' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upcoming Events</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">
                    {event.type}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {event.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    {event.currentAttendees}/{event.maxAttendees} registered
                  </div>
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {event.registered ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Registered</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegister(event.id)}
                    className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                  >
                    Register for Event
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {eventView === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Event Calendar</h3>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid - October 2025 */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {[...Array(2)].map((_, i) => (
              <div key={`empty-${i}`} className="h-12"></div>
            ))}
            
            {/* Days of the month */}
            {[...Array(31)].map((_, i) => {
              const day = i + 1;
              const hasEvent = [15, 22].includes(day); // Days with events
              const isToday = day === 1; // Current day
              
              return (
                <div
                  key={day}
                  className={`h-12 flex items-center justify-center text-sm border rounded ${
                    isToday
                      ? 'bg-blue-500 text-white border-blue-500'
                      : hasEvent
                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {day}
                  {hasEvent && (
                    <div className="w-1 h-1 bg-purple-500 rounded-full ml-1"></div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Event Day</span>
            </div>
          </div>
        </div>
      )}

      {/* Past Events */}
      {eventView === 'past' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Last 10 Events</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pastEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {event.title}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                          {event.type}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.attendees} attended
                        </div>
                      </div>
                    </div>
                    <button className="ml-4 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Podcast Editor Component
function PodcastEditor({ user, onClose }: { user: User; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'settings'>('record');
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [category, setCategory] = useState('crypto-talk');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'premium'>('public');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Access control - paid users only for podcast creation
  const isPaid = user.subscriptionTier !== 'free';

  if (!isPaid) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Upgrade Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Podcast creation is available for paid subscribers only. Upgrade your plan to start creating podcasts.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    // Mock recording timer
    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    
    // Stop after demo time
    setTimeout(() => {
      setIsRecording(false);
      clearInterval(interval);
    }, 5000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Headphones className="h-6 w-6 text-green-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create Podcast Episode
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Plan Info */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="text-sm text-green-800 dark:text-green-300">
              <span className="font-medium">Podcast Creation • </span>
              Plan: {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
              <span className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs">Paid Access</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {['record', 'upload', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                  activeTab === tab
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'record' && (
            <div className="space-y-6">
              <div className="text-center p-8 border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className={`h-12 w-12 ${isRecording ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isRecording ? 'Recording...' : 'Ready to Record'}
                </h4>
                {isRecording && (
                  <div className="text-2xl font-mono text-red-500 mb-4">
                    {formatDuration(recordingDuration)}
                  </div>
                )}
                <button
                  onClick={handleStartRecording}
                  disabled={isRecording}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    isRecording
                      ? 'bg-red-500 text-white cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isRecording ? 'Recording...' : 'Start Recording'}
                </button>
              </div>

              {/* Podcast Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Episode Title *
                  </label>
                  <input
                    type="text"
                    value={podcastTitle}
                    onChange={(e) => setPodcastTitle(e.target.value)}
                    placeholder="Enter podcast episode title..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                  >
                    <option value="crypto-talk">Crypto Talk</option>
                    <option value="market-analysis">Market Analysis</option>
                    <option value="tech-deep-dive">Tech Deep Dive</option>
                    <option value="interviews">Interviews</option>
                    <option value="news-discussion">News Discussion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Episode Description
                </label>
                <textarea
                  value={podcastDescription}
                  onChange={(e) => setPodcastDescription(e.target.value)}
                  placeholder="Describe your podcast episode..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-green-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Upload Audio File
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag and drop your audio file here, or click to browse
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600"
                >
                  Choose Audio File
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: MP3, WAV, M4A (Max 100MB)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                  >
                    <option value="public">Public</option>
                    <option value="followers">Followers Only</option>
                    <option value="premium">Premium Members Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              disabled={!podcastTitle.trim()}
            >
              Publish Episode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ user, dashboardData }: { user: User; dashboardData: DashboardSections | null }) {
  if (!dashboardData) return <div>Loading...</div>;

  // Get tier display info
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'free': return { name: 'Bishops', color: 'text-gray-600', bgColor: 'bg-gray-100', description: 'Community members with basic access' };
      case 'basic': return { name: 'Apostles', color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Premium members with writing tools' };
      case 'premium': return { name: 'Teachers', color: 'text-purple-600', bgColor: 'bg-purple-100', description: 'VIP members with advanced features' };
      case 'vip': return { name: 'Enterprise', color: 'text-green-600', bgColor: 'bg-green-100', description: 'Enterprise users with all features' };
      case 'enterprise': return { name: 'Prophets', color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Elite members with exclusive access' };
      default: return { name: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100', description: 'Unknown tier' };
    }
  };

  const tierInfo = getTierInfo(user.subscriptionTier);
  const isPaid = user.subscriptionTier !== 'free';

  // Calculate available tools count
  const getAvailableToolsCount = () => {
    switch (user.subscriptionTier) {
      case 'free': return 5; // Post, Portfolio, Token Sub, Staking, Wallet Whitelist
      case 'basic': return 8; // + Article, Podcast, Airdrop Creator
      case 'premium': return 10; // + Video, Digital Store
      case 'vip': return 10; // All tools
      case 'enterprise': return 10; // All tools
      default: return 5;
    }
  };

  const availableTools = getAvailableToolsCount();
  const totalTools = 10;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome back, {user.displayName}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You're part of the <span className={`font-semibold ${tierInfo.color}`}>{tierInfo.name}</span> tier. {tierInfo.description}
            </p>
          </div>
          <div className={`px-4 py-2 ${tierInfo.bgColor} ${tierInfo.color} rounded-full font-semibold text-sm`}>
            {tierInfo.name}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enhanced Subscription Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Subscription Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Current Tier:</span>
              <span className={`font-medium ${tierInfo.color} capitalize`}>{tierInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tools Access:</span>
              <span className="font-medium text-blue-600">{availableTools}/{totalTools}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${
                user.subscriptionTier !== 'free' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {user.subscriptionTier !== 'free' ? 'Active Premium' : 'Free Tier'}
              </span>
            </div>
          </div>
          
          {/* Tier Benefits */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Your Benefits:</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Community access & rewards
              </li>
              {isPaid && (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Writing & content creation tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Airdrop creation & campaigns
                  </li>
                </>
              )}
              {['premium', 'vip', 'enterprise'].includes(user.subscriptionTier) && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Video creation & digital store
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Enhanced User Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Activity Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{dashboardData?.userStats?.articlesRead || 15}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Articles Read</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{dashboardData?.userStats?.readingStreak || 7}</div>
              <div className="text-xs text-orange-700 dark:text-orange-300">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{dashboardData?.userStats?.bookmarks || 23}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Bookmarks</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl font-bold text-green-600">{dashboardData?.userStats?.comments || 12}</div>
              <div className="text-xs text-green-700 dark:text-green-300">Comments</div>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tools Used:</span>
              <span className="font-medium text-blue-600">6/9</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Content Created:</span>
              <span className="font-medium text-green-600">8 pieces</span>
            </div>
          </div>
        </div>

        {/* Enhanced Rewards & Tokens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" />
            Rewards & Assets
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">CE Points</div>
                  <div className="text-xs text-gray-500">Community Engagement</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{user.cePoints}</div>
                <div className="text-xs text-green-700 dark:text-green-300">+15 today</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Coins className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">JOY Tokens</div>
                  <div className="text-xs text-gray-500">Platform Currency</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-600">{user.joyTokens}</div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  {user.joyTokens >= 100 ? 'Can redeem' : 'Keep earning'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <button 
                className={`py-2 px-3 text-xs rounded-lg font-medium ${
                  user.cePoints >= 100 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                disabled={user.cePoints < 100}
              >
                Convert CE
              </button>
              <button className="py-2 px-3 bg-yellow-500 text-white text-xs rounded-lg font-medium hover:bg-yellow-600">
                Redeem JOY
              </button>
            </div>
          </div>
        </div>

        {/* Tools Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-500" />
            Available Tools
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Writing Tools</span>
              <span className="text-sm font-medium text-green-600">
                {user.subscriptionTier === 'free' ? '1/4' : 
                 user.subscriptionTier === 'basic' ? '3/4' : 
                 ['premium', 'vip'].includes(user.subscriptionTier) ? '3/4' : '4/4'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Campaign Tools</span>
              <span className="text-sm font-medium text-green-600">
                {isPaid ? '2/2' : '1/2'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trading Tools</span>
              <span className="text-sm font-medium text-green-600">3/3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Security Tools</span>
              <span className="text-sm font-medium text-green-600">1/1</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{availableTools}</div>
              <div className="text-sm text-gray-500">Tools Available</div>
              {!isPaid && (
                <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Upgrade for more tools
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <PenTool className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Created post</div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Earned 25 CE points</div>
                <div className="text-xs text-gray-500">5 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Updated portfolio</div>
                <div className="text-xs text-gray-500">1 day ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-red-500" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm flex items-center justify-center gap-2">
              <PenTool className="w-4 h-4" />
              Write Post
            </button>
            {isPaid && (
              <button className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" />
                Create Article
              </button>
            )}
            <button className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium text-sm flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Update Portfolio
            </button>
            <button className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4" />
              Boost Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content Tab Component
function ContentTab({ user, adminControls }: { user: User; adminControls: AdminUserControls }) {
  const canUseWritingTool = adminControls.writingTool.enabled;
  
  return (
    <div className="space-y-6">
      {/* Writing Tool Access */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-blue-500" />
          Writing Tool
        </h3>
        
        {canUseWritingTool ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 dark:text-green-400 font-medium">Writing Tool Enabled</span>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                You have access to our advanced writing tool with AI assistance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Article Creation</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Rich text editor {adminControls.writingTool.canCreateArticles ? '✓' : '✗'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    AI writing assist {adminControls.writingTool.canUseAIAssist ? '✓' : '✗'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Video content {adminControls.writingTool.canCreateVideos ? '✓' : '✗'}
                  </li>
                </ul>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Publishing Limits</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Max articles per day: <span className="font-medium">{adminControls.writingTool.maxArticlesPerDay}</span></li>
                  <li>Requires approval: <span className="font-medium">{adminControls.writingTool.requiresApproval ? 'Yes' : 'No'}</span></li>
                </ul>
              </div>
            </div>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Open Writing Tool
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Writing Tool Access Restricted</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Contact an administrator to request access to the writing tool.
            </p>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
              Request Access
            </button>
          </div>
        )}
      </div>

      {/* Recent Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          Your Articles
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No articles published yet.</p>
          {canUseWritingTool && (
            <button className="mt-3 text-blue-600 hover:text-blue-700 font-medium">
              Create your first article
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Community Tab Component
function CommunityTab({ user, communityIntegration }: { user: User; communityIntegration: CommunityIntegration }) {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('24hrs');
  const [selectedSection, setSelectedSection] = useState('latest');
  const isPaid = user.subscriptionTier !== 'free';

  const timeFilters = [
    { id: '6hrs', label: '6hrs' },
    { id: '12hrs', label: '12hrs' },
    { id: '24hrs', label: '24hrs' },
    { id: '7days', label: '7 days' },
    { id: '14days', label: '14 days' },
    { id: '21days', label: '21 days' },
    { id: '30days', label: '30 days' }
  ];

  const communitySections = [
    { id: 'latest', name: 'Latest Posts', icon: Clock },
    { id: 'trending', name: 'Trending Posts', icon: TrendingUp },
    { id: 'tags', name: 'Trending Tags', icon: Tag },
    { id: 'hashtags', name: 'Trending Hashtags', icon: Hash },
    { id: 'teachers', name: 'Trending Teachers', icon: Award },
    { id: 'bishops', name: 'Trending Bishops', icon: Crown },
    { id: 'apostles', name: 'Trending Apostles', icon: Star }
  ];

  // Mock data for community content
  const latestPosts = [
    { id: 1, title: 'Bitcoin hits new ATH today!', author: 'CryptoExpert', time: '2 min ago', likes: 45, comments: 12 },
    { id: 2, title: 'DeFi protocol launches on African exchanges', author: 'DefiGuru', time: '15 min ago', likes: 32, comments: 8 },
    { id: 3, title: 'Memecoin surge analysis', author: 'MemeTrader', time: '1 hour ago', likes: 78, comments: 23 }
  ];

  const trendingTags = ['#Bitcoin', '#DeFi', '#Ethereum', '#Cardano', '#Solana', '#NFTs', '#Web3', '#Crypto'];
  const trendingHashtags = ['#BTCToTheMoon', '#DeFiRevolution', '#CryptoAfrica', '#MemeCoinSeason', '#HODLStrong'];

  const trendingUsers = {
    teachers: [
      { name: 'Prof. Sarah Williams', followers: '125K', specialty: 'Blockchain Technology' },
      { name: 'Dr. Michael Chen', followers: '89K', specialty: 'DeFi Protocols' },
      { name: 'Prof. Amara Okafor', followers: '156K', specialty: 'Crypto Economics' }
    ],
    bishops: [
      { name: 'Bishop David Johnson', followers: '245K', specialty: 'Market Analysis' },
      { name: 'Bishop Grace Adebayo', followers: '198K', specialty: 'Investment Strategy' },
      { name: 'Bishop John Smith', followers: '267K', specialty: 'Technical Analysis' }
    ],
    apostles: [
      { name: 'Apostle Mark Thompson', followers: '456K', specialty: 'Crypto Vision' },
      { name: 'Apostle Ruth Mensah', followers: '389K', specialty: 'Blockchain Innovation' },
      { name: 'Apostle Peter Collins', followers: '512K', specialty: 'Crypto Leadership' }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {communitySections.map((section) => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedSection === section.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <section.icon className="h-4 w-4" />
            {section.name}
          </button>
        ))}
      </div>

      {/* Latest Posts Section */}
      {selectedSection === 'latest' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Latest Posts
          </h3>
          <div className="space-y-4">
            {latestPosts.map((post) => (
              <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{post.title}</h4>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>by {post.author}</span>
                    <span>•</span>
                    <span>{post.time}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Posts Section */}
      {selectedSection === 'trending' && (
        <div className="space-y-4">
          {/* Time Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h4 className="font-medium mb-3">Trending in:</h4>
            <div className="flex flex-wrap gap-2">
              {timeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedTimeFilter(filter.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTimeFilter === filter.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Trending Posts ({selectedTimeFilter})
            </h3>
            <div className="space-y-4">
              {latestPosts.map((post, index) => (
                <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{post.title}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>by {post.author}</span>
                          <span>•</span>
                          <span>{post.time}</span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500">
                          <span className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            {post.likes * 2}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trending Tags Section */}
      {selectedSection === 'tags' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-500" />
            Trending Tags
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trendingTags.map((tag, index) => (
              <div key={tag} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                <div className="font-medium text-purple-800 dark:text-purple-400">{tag}</div>
                <div className="text-sm text-purple-600 dark:text-purple-300">{Math.floor(Math.random() * 1000) + 100} mentions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Hashtags Section */}
      {selectedSection === 'hashtags' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-500" />
            Trending Hashtags
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trendingHashtags.map((hashtag, index) => (
              <div key={hashtag} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-400">{hashtag}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">{Math.floor(Math.random() * 5000) + 1000} posts</div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Teachers Section */}
      {selectedSection === 'teachers' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Trending Teachers
          </h3>
          <div className="space-y-4">
            {trendingUsers.teachers.map((teacher, index) => (
              <div key={teacher.name} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{teacher.name}</h4>
                      <p className="text-sm text-gray-500">{teacher.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-yellow-600">{teacher.followers}</div>
                    <div className="text-sm text-gray-500">followers</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Bishops Section */}
      {selectedSection === 'bishops' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            Trending Bishops
          </h3>
          <div className="space-y-4">
            {trendingUsers.bishops.map((bishop, index) => (
              <div key={bishop.name} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{bishop.name}</h4>
                      <p className="text-sm text-gray-500">{bishop.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-purple-600">{bishop.followers}</div>
                    <div className="text-sm text-gray-500">followers</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Apostles Section */}
      {selectedSection === 'apostles' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-500" />
            Trending Apostles
          </h3>
          <div className="space-y-4">
            {trendingUsers.apostles.map((apostle, index) => (
              <div key={apostle.name} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{apostle.name}</h4>
                      <p className="text-sm text-gray-500">{apostle.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">{apostle.followers}</div>
                    <div className="text-sm text-gray-500">followers</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Role Card - Only shows when user has a role */}
      {communityIntegration.roleSystem.currentRole && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Your Community Role
          </h3>
          
          <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="font-medium text-purple-800 dark:text-purple-400">
                {communityIntegration.roleSystem.currentRole.toUpperCase()}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Your Permissions:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {communityIntegration.roleSystem.rolePermissions.canVerifyContent && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Verify content
                  </li>
                )}
                {communityIntegration.roleSystem.rolePermissions.canModerateComments && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Moderate comments
                  </li>
                )}
                {communityIntegration.roleSystem.rolePermissions.canDeletePosts && (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Delete posts
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Live Tab Component
function LiveTab({ user, adminControls }: { user: User; adminControls: AdminUserControls }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isPaid = user.subscriptionTier !== 'free';

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'live', name: 'Live Now' },
    { id: 'upcoming', name: 'Upcoming' },
    { id: 'recordings', name: 'Recordings' },
    { id: 'podcasts', name: 'Podcasts' }
  ];

  const mockContent = [
    {
      id: 1,
      type: 'live',
      title: 'Bitcoin ETF Analysis with Michael Saylor',
      host: 'CoinDaily Africa',
      viewers: 1250,
      time: 'Live Now',
      thumbnail: '/api/placeholder/300/200',
      premium: false
    },
    {
      id: 2,
      type: 'upcoming',
      title: 'African DeFi: The Future of Finance',
      host: 'Expert Panel',
      viewers: 890,
      time: '2 PM Today',
      thumbnail: '/api/placeholder/300/200',
      premium: true
    },
    {
      id: 3,
      type: 'podcast',
      title: 'Weekly Memecoin Roundup',
      host: 'Sarah Johnson',
      duration: '45 min',
      time: '2 days ago',
      thumbnail: '/api/placeholder/300/200',
      premium: false
    }
  ];

  const filteredContent = selectedCategory === 'all' 
    ? mockContent 
    : mockContent.filter(item => item.type === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Live Stream Banner */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold">LIVE NOW</span>
          </div>
          <span className="text-red-200">•</span>
          <span className="text-red-200">1,250 viewers</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Bitcoin ETF Analysis with Michael Saylor</h3>
        <p className="text-red-100 mb-4">Deep dive into the latest Bitcoin ETF developments and market impact</p>
        <button className="bg-white text-red-500 px-6 py-2 rounded-lg font-medium hover:bg-red-50">
          Join Live Stream
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((content) => (
          <div key={content.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="relative">
              <img 
                src={content.thumbnail} 
                alt={content.title}
                className="w-full h-40 object-cover"
              />
              {content.premium && !isPaid && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Premium
                </div>
              )}
              {content.type === 'live' && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}
              {content.viewers && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {content.viewers} viewers
                </div>
              )}
              {content.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {content.duration}
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{content.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{content.host}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{content.time}</span>
                <button 
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    content.premium && !isPaid
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  disabled={content.premium && !isPaid}
                >
                  {content.type === 'live' ? 'Join' : 'Watch'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Podcast Creation - For Paid Users */}
      {isPaid && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create Your Content</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Share your expertise through live streams and podcasts with the CoinDaily community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="py-3 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 flex items-center gap-2">
              <Video className="h-4 w-4" />
              Start Live Stream
            </button>
            <button className="py-3 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Record Podcast
            </button>
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Upcoming Schedule</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">African DeFi Panel Discussion</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today at 2:00 PM</p>
            </div>
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Set Reminder
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Weekly Market Roundup</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tomorrow at 10:00 AM</p>
            </div>
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Set Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Swap Tab Component with Listed Tokens
function SwapTab({ user, adminControls }: { user: User; adminControls: AdminUserControls }) {
  const [selectedToken, setSelectedToken] = useState<any>(null);
  
  // Mock listed tokens data - in real implementation, fetch from API
  const listedTokens = [
    {
      id: 1,
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67500.00,
      change24h: 2.5,
      volume24h: 28450000000,
      marketCap: 1320000000000,
      logo: '/crypto/btc.png',
      subscriptionCost: 100, // JOY tokens required
      subscribers: 15420,
      description: 'The first and most widely recognized cryptocurrency, Bitcoin continues to dominate the crypto market.',
      benefits: ['Price alerts', 'Technical analysis', 'News priority', 'Community access']
    },
    {
      id: 2,
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2650.00,
      change24h: -1.2,
      volume24h: 15230000000,
      marketCap: 318000000000,
      logo: '/crypto/eth.png',
      subscriptionCost: 75,
      subscribers: 12800,
      description: 'Leading smart contract platform powering DeFi, NFTs, and Web3 applications.',
      benefits: ['DeFi insights', 'Gas tracker', 'Ecosystem updates', 'Developer resources']
    },
    {
      id: 3,
      symbol: 'SOL',
      name: 'Solana',
      price: 145.80,
      change24h: 5.7,
      volume24h: 2840000000,
      marketCap: 68000000000,
      logo: '/crypto/sol.png',
      subscriptionCost: 50,
      subscribers: 8500,
      description: 'High-performance blockchain supporting fast and low-cost transactions for DApps.',
      benefits: ['Performance metrics', 'Ecosystem tracking', 'Airdrop alerts', 'Validator data']
    },
    {
      id: 4,
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0.12,
      change24h: 8.3,
      volume24h: 1280000000,
      marketCap: 17500000000,
      logo: '/crypto/doge.png',
      subscriptionCost: 25,
      subscribers: 18900,
      description: 'The original memecoin that started the meme token revolution.',
      benefits: ['Meme tracking', 'Social sentiment', 'Community events', 'Trend analysis']
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Token Details Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{selectedToken.symbol}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedToken.name} ({selectedToken.symbol})
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {formatNumber(selectedToken.price)}
                      <span className={`ml-2 ${selectedToken.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
                      </span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedToken(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Token Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Market Cap</h4>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(selectedToken.marketCap)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">24h Volume</h4>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(selectedToken.volume24h)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedToken.description}</p>
              </div>

              {/* Subscription Benefits */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Subscription Benefits</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedToken.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400">
                      Subscribe for Premium Access
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedToken.subscribers.toLocaleString()} users already subscribed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-400">
                      {selectedToken.subscriptionCost} JOY
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">per month</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {user.joyTokens >= selectedToken.subscriptionCost ? (
                  <button className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5" />
                    Subscribe ({selectedToken.subscriptionCost} JOY)
                  </button>
                ) : (
                  <button className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed">
                    Insufficient JOY Tokens
                  </button>
                )}
                <button 
                  onClick={() => setSelectedToken(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listed Tokens Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Listed Tokens</h2>
            <p className="text-gray-600 dark:text-gray-400">Subscribe to tokens for premium insights and alerts</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Your JOY Balance</p>
            <p className="text-lg font-bold text-blue-600">{user.joyTokens.toLocaleString()} JOY</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listedTokens.map((token) => (
            <div key={token.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="font-bold text-sm">{token.symbol}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{token.name}</h3>
                    <p className="text-sm text-gray-500">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(token.price)}</p>
                  <p className={`text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>MCap: {formatNumber(token.marketCap)}</span>
                <span>{token.subscribers.toLocaleString()} subscribers</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">{token.subscriptionCost} JOY/month</span>
                <button 
                  onClick={() => setSelectedToken(token)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Original Token Swap Component */}
      <TokenSwap user={user} adminControls={adminControls} />
    </div>
  );
}

// Support Tab Component
function SupportTab({ user }: { user: User }) {
  const [selectedTicketCategory, setSelectedTicketCategory] = useState('technical');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Get support access based on subscription tier
  const getSupportAccess = () => {
    switch (user.subscriptionTier) {
      case 'enterprise': // Enterprise - Full access with highest priority + dedicated support
        return {
          telegram: true,
          email: true,
          phone: true,
          instantChat: true,
          supportTicket: true,
          priority: 'critical',
          dedicatedManager: true
        };
      case 'vip': // VIP - Full access with high priority
        return {
          telegram: true,
          email: true,
          phone: true,
          instantChat: true,
          supportTicket: true,
          priority: 'high',
          dedicatedManager: false
        };
      case 'premium': // Premium - Instant chat, support ticket, email
        return {
          telegram: false,
          email: true,
          phone: false,
          instantChat: true,
          supportTicket: true,
          priority: 'medium',
          dedicatedManager: false
        };
      case 'basic': // Basic - Telegram, support ticket, email
        return {
          telegram: true,
          email: true,
          phone: false,
          instantChat: false,
          supportTicket: true,
          priority: 'normal',
          dedicatedManager: false
        };
      default: // Free - Support ticket, telegram only
        return {
          telegram: true,
          email: false,
          phone: false,
          instantChat: false,
          supportTicket: true,
          priority: 'low',
          dedicatedManager: false
        };
    }
  };

  const supportAccess = getSupportAccess();

  const supportOptions = [
    {
      id: 'telegram',
      name: 'Telegram Support',
      description: 'Join our Telegram support group for community help',
      icon: SendIcon,
      available: supportAccess.telegram,
      action: () => window.open('https://t.me/coindaily_support', '_blank'),
      responseTime: '1-2 hours'
    },
    {
      id: 'email',
      name: 'Email Support',
      description: 'Send us an email for detailed support',
      icon: MailIcon,
      available: supportAccess.email,
      action: () => window.open('mailto:support@coindaily.africa', '_blank'),
      responseTime: '4-24 hours'
    },
    {
      id: 'phone',
      name: 'Phone Support',
      description: 'Direct phone line for urgent issues',
      icon: PhoneIcon,
      available: supportAccess.phone,
      action: () => window.open('tel:+234-800-COIN-DAILY', '_blank'),
      responseTime: 'Immediate'
    },
    {
      id: 'chat',
      name: 'Instant Chat',
      description: 'Live chat with our support team',
      icon: MessageCircleIcon,
      available: supportAccess.instantChat,
      action: () => console.log('Opening instant chat...'),
      responseTime: '5-15 minutes'
    },
    {
      id: 'ticket',
      name: 'Support Ticket',
      description: 'Create a detailed support ticket',
      icon: HeadphonesIcon,
      available: supportAccess.supportTicket,
      action: () => console.log('Creating support ticket...'),
      responseTime: '2-48 hours'
    }
  ];

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Submitting support ticket:', {
      category: selectedTicketCategory,
      subject: ticketSubject,
      message: ticketMessage,
      user: user.id,
      priority: supportAccess.priority
    });
    
    alert('Support ticket submitted successfully!');
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Support Priority Banner */}
      <div className={`rounded-lg p-4 ${
        supportAccess.priority === 'critical' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-300 dark:border-yellow-700' :
        supportAccess.priority === 'high' ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' :
        supportAccess.priority === 'medium' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
        supportAccess.priority === 'normal' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
        'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-center gap-3">
          {supportAccess.priority === 'critical' ? (
            <Crown className="h-6 w-6 text-yellow-600" />
          ) : (
            <HeadphonesIcon className={`h-6 w-6 ${
              supportAccess.priority === 'high' ? 'text-purple-600' :
              supportAccess.priority === 'medium' ? 'text-blue-600' :
              supportAccess.priority === 'normal' ? 'text-green-600' :
              'text-gray-600'
            }`} />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold ${
              supportAccess.priority === 'critical' ? 'text-yellow-800 dark:text-yellow-400' :
              supportAccess.priority === 'high' ? 'text-purple-800 dark:text-purple-400' :
              supportAccess.priority === 'medium' ? 'text-blue-800 dark:text-blue-400' :
              supportAccess.priority === 'normal' ? 'text-green-800 dark:text-green-400' :
              'text-gray-800 dark:text-gray-400'
            }`}>
              {user.subscriptionTier.toUpperCase()} Support - {supportAccess.priority.toUpperCase()} Priority
              {supportAccess.dedicatedManager && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Dedicated Manager
                </span>
              )}
            </h3>
            <p className={`text-sm ${
              supportAccess.priority === 'critical' ? 'text-yellow-700 dark:text-yellow-300' :
              supportAccess.priority === 'high' ? 'text-purple-700 dark:text-purple-300' :
              supportAccess.priority === 'medium' ? 'text-blue-700 dark:text-blue-300' :
              supportAccess.priority === 'normal' ? 'text-green-700 dark:text-green-300' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {supportAccess.priority === 'critical' && 'Highest priority enterprise support with dedicated account manager and guaranteed SLA'}
              {supportAccess.priority === 'high' && 'Top priority support with fastest response times'}
              {supportAccess.priority === 'medium' && 'Priority support with enhanced response times'}
              {supportAccess.priority === 'normal' && 'Standard support with regular response times'}
              {supportAccess.priority === 'low' && 'Community support with standard response times'}
            </p>
          </div>
        </div>
      </div>

      {/* Support Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportOptions.map((option) => (
          <div key={option.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${
            option.available ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <option.icon className={`h-6 w-6 ${
                option.available ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <h3 className={`font-semibold ${
                option.available ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
              }`}>
                {option.name}
              </h3>
            </div>
            
            <p className={`text-sm mb-4 ${
              option.available ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500'
            }`}>
              {option.description}
            </p>
            
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500">Response Time:</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{option.responseTime}</span>
            </div>

            {option.available ? (
              <button 
                onClick={option.action}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                {option.id === 'ticket' ? 'Create Ticket' : `Contact via ${option.name.split(' ')[0]}`}
              </button>
            ) : (
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed">
                  Upgrade Required
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Available for {user.subscriptionTier === 'free' ? 'paid plans' : 'higher tier plans'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support Ticket Form - Always Available */}
      {supportAccess.supportTicket && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <HeadphonesIcon className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create Support Ticket</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedTicketCategory}
                onChange={(e) => setSelectedTicketCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="technical">Technical Issue</option>
                <option value="account">Account Problem</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Detailed description of your issue or question"
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            
            <button
              onClick={handleSubmitTicket}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 flex items-center gap-2"
            >
              <SendIcon className="w-4 h-4" />
              Submit Ticket
            </button>
          </div>
        </div>
      )}

      {/* Support Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Support Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Help Center</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse our comprehensive guides</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Video className="h-5 w-5 text-green-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Video Tutorials</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Watch step-by-step tutorials</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Users className="h-5 w-5 text-purple-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Community Forum</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get help from other users</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Status Page</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check platform status</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ user, adminControls }: { user: User; adminControls: AdminUserControls }) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'appearance' | 'privacy' | 'notifications' | 'enterprise'>('profile');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [profileData, setProfileData] = useState({
    displayName: user.displayName,
    bio: user.bio,
    phoneNumber: user.phoneNumber || '',
    email: user.email,
    username: user.username,
    profileAvatar: user.avatar || '',
    companyId: '',
    nationalId: ''
  });
  
  const settingsTabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'appearance', name: 'Appearance', icon: Monitor },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    ...(user.subscriptionTier === 'enterprise' ? [{ id: 'enterprise', name: 'Enterprise', icon: Crown }] : [])
  ];

  const handleProfileUpdate = () => {
    console.log('Updating profile:', profileData);
    alert('Profile update submitted for verification');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Apply theme change to document
    const html = document.documentElement;
    
    if (newTheme === 'light') {
      html.classList.remove('dark');
      html.style.backgroundColor = '#ffffff';
      html.style.color = '#000000';
    } else if (newTheme === 'dark') {
      html.classList.add('dark');
      html.style.backgroundColor = '#000000';
      html.style.color = '#ffffff';
    } else {
      // System theme - use default colors defined in your CSS
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      html.style.backgroundColor = '';
      html.style.color = '';
    }
    
    console.log(`Theme changed to: ${newTheme}`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to your server
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileAvatar: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation */}
      <div className="flex flex-wrap gap-2">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeSettingsTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Profile Section */}
      {activeSettingsTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Avatar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Profile Avatar
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={profileData.profileAvatar || '/default-avatar.png'}
                  alt="Profile Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                />
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                  <Upload className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  Upload a profile picture. Recommended size: 200x200px.
                </p>
                <p className="text-gray-500 text-xs">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-green-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                  <span className="text-red-500 ml-1">*Cannot be changed</span>
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  disabled
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                  <span className="text-red-500 ml-1">*Cannot be changed</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                  <span className="text-red-500 ml-1">*Cannot be changed after verification</span>
                </label>
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  disabled={user.isVerified}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg ${
                    user.isVerified 
                      ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed' 
                      : 'dark:bg-gray-700 dark:text-gray-100'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Verification Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <IdCard className="w-5 h-5 text-orange-500" />
              Profile Verification
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Complete verification to unlock premium features and increase account security.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company ID / Business Registration
                </label>
                <input
                  type="text"
                  value={profileData.companyId}
                  onChange={(e) => setProfileData(prev => ({ ...prev, companyId: e.target.value }))}
                  placeholder="Enter company ID or business registration number"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  National ID / Passport Number
                </label>
                <input
                  type="text"
                  value={profileData.nationalId}
                  onChange={(e) => setProfileData(prev => ({ ...prev, nationalId: e.target.value }))}
                  placeholder="Enter national ID or passport number"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Verification Requirements:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Valid phone number
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Verified email address
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Company ID OR National ID/Passport
                </li>
              </ul>
            </div>
          </div>

          {/* Save Changes */}
          <div className="flex gap-4">
            <button
              onClick={handleProfileUpdate}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </button>
            <button className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Appearance Section */}
      {activeSettingsTab === 'appearance' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-500" />
            Theme Preferences
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Choose your preferred theme for the best viewing experience.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Light Theme */}
            <div 
              onClick={() => handleThemeChange('light')}
              className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Sun className="w-6 h-6 text-yellow-500" />
                <h4 className="font-medium">Light</h4>
                {theme === 'light' && <CheckCircle className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="bg-white border border-gray-200 rounded p-3 mb-2">
                <div className="bg-gray-100 h-2 rounded mb-1"></div>
                <div className="bg-gray-200 h-1 rounded w-3/4"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clean white interface with dark text</p>
            </div>

            {/* Dark Theme */}
            <div 
              onClick={() => handleThemeChange('dark')}
              className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                theme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Moon className="w-6 h-6 text-blue-500" />
                <h4 className="font-medium">Dark</h4>
                {theme === 'dark' && <CheckCircle className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-2">
                <div className="bg-gray-600 h-2 rounded mb-1"></div>
                <div className="bg-gray-700 h-1 rounded w-3/4"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dark interface with light text</p>
            </div>

            {/* System Theme */}
            <div 
              onClick={() => handleThemeChange('system')}
              className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                theme === 'system' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="w-6 h-6 text-green-500" />
                <h4 className="font-medium">System</h4>
                {theme === 'system' && <CheckCircle className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="bg-gradient-to-r from-white to-gray-800 border border-gray-400 rounded p-3 mb-2">
                <div className="bg-gradient-to-r from-gray-100 to-gray-600 h-2 rounded mb-1"></div>
                <div className="bg-gradient-to-r from-gray-200 to-gray-700 h-1 rounded w-3/4"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use our default theme colors</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-400 text-sm">
              <strong>Current theme:</strong> {theme.charAt(0).toUpperCase() + theme.slice(1)} mode is active.
              {theme === 'system' && ' This will automatically switch between light and dark based on your device settings.'}
            </p>
          </div>
        </div>
      )}

      {/* Privacy Section */}
      {activeSettingsTab === 'privacy' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Privacy Settings
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Control your privacy and data sharing preferences.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Profile Visibility</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to view your profile</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Activity Status</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Show when you're online</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeSettingsTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Browser push notifications</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Section */}
      {activeSettingsTab === 'enterprise' && user.subscriptionTier === 'enterprise' && (
        <div className="space-y-6">
          {/* Enterprise Dashboard */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-300" />
              <h3 className="text-lg font-semibold">Enterprise Dashboard</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded p-4">
                <h4 className="font-medium mb-2">API Usage</h4>
                <p className="text-2xl font-bold">847K</p>
                <p className="text-sm opacity-75">Requests this month</p>
              </div>
              <div className="bg-white/10 rounded p-4">
                <h4 className="font-medium mb-2">Team Members</h4>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm opacity-75">Active users</p>
              </div>
              <div className="bg-white/10 rounded p-4">
                <h4 className="font-medium mb-2">Data Usage</h4>
                <p className="text-2xl font-bold">2.1TB</p>
                <p className="text-sm opacity-75">This billing cycle</p>
              </div>
            </div>
          </div>

          {/* Custom Branding */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-purple-500" />
              Custom Branding
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Upload Logo
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Brand Color
                </label>
                <input type="color" value="#3B82F6" className="h-10 w-20 rounded border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Domain
                </label>
                <input 
                  type="text" 
                  placeholder="news.yourcompany.com"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* API Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500" />
              API Management
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium">Production API Key</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">ck_prod_••••••••••••••••</p>
                </div>
                <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                  Regenerate
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium">Staging API Key</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">ck_test_••••••••••••••••</p>
                </div>
                <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                  Regenerate
                </button>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">API Documentation</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Access comprehensive API documentation and integration guides.
                </p>
                <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                  View Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Team Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Team Management
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Team Members (12/50)</h4>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'John Smith', role: 'Admin', email: 'john@company.com' },
                  { name: 'Sarah Johnson', role: 'Editor', email: 'sarah@company.com' },
                  { name: 'Mike Chen', role: 'Viewer', email: 'mike@company.com' }
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h5 className="font-medium">{member.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-sm">
                        {member.role}
                      </span>
                      <button className="p-1 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dedicated Support */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5 text-yellow-500" />
              Dedicated Account Manager
            </h3>
            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                AM
              </div>
              <div>
                <h4 className="font-medium">Alice Manager</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your dedicated account manager</p>
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Schedule Call
                  </button>
                  <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}