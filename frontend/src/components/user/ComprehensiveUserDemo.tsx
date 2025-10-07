'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  User, 
  AdminUserControls, 
  CommunityIntegration, 
  UserFeedSystem, 
  LivePodcastFeatures, 
  WritingToolFeatures,
  Post,
  ArticleReactions,
  DashboardSections
} from '../../types/user';

// Dynamic imports to avoid SSR issues
const UserDashboard = dynamic(() => import('./UserDashboard'), { ssr: false });
const UserFeed = dynamic(() => import('./UserFeed'), { ssr: false });
const WritingTool = dynamic(() => import('./WritingTool'), { ssr: false });
const LivePodcastSystem = dynamic(() => import('./LivePodcastSystem'), { ssr: false });
const ProfileSettings = dynamic(() => import('./ProfileSettings'), { ssr: false });

interface ComprehensiveUserDemoProps {
  className?: string;
}

export default function ComprehensiveUserDemo({ className = '' }: ComprehensiveUserDemoProps) {
  const [activeDemo, setActiveDemo] = useState<'dashboard' | 'feed' | 'writing' | 'podcast'>('dashboard');
  const [selectedUserType, setSelectedUserType] = useState<'free' | 'premium' | 'vip'>('premium');

  // Mock Users Data
  const mockUsers = {
    free: {
      id: 'user-free',
      username: 'crypto_newbie',
      email: 'newbie@example.com',
      displayName: 'CryptoNewbie',
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Learning about cryptocurrency and blockchain technology',
      avatar: '/avatars/newbie.jpg',
      location: 'Lagos, Nigeria',
      website: '',
      twitter: '@crypto_newbie',
      linkedin: '',
      isVerified: false,
      verificationBadge: 'none' as const,
      accountStatus: 'active' as const,
      subscriptionTier: 'free' as const,
      subscriptionStatus: 'active' as const,
      subscriptionExpiry: null,
      communityRole: 'member' as const,
      cePoints: 150,
      joyTokens: 25,
      readingStreak: 3,
      articlesRead: 42,
      commentsCount: 12,
      likesGiven: 89,
      bookmarks: 15,
      createdAt: new Date('2024-08-01'),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    } as User,
    
    premium: {
      id: 'user-premium',
      username: 'crypto_enthusiast',
      email: 'enthusiast@example.com',
      displayName: 'CryptoEnthusiast',
      firstName: 'Sarah',
      lastName: 'Johnson',
      bio: 'Passionate about DeFi and emerging cryptocurrencies. Premium member since 2024.',
      avatar: '/avatars/enthusiast.jpg',
      location: 'Nairobi, Kenya',
      website: 'https://cryptoenthusiast.blog',
      twitter: '@crypto_enthusiast',
      linkedin: 'https://linkedin.com/in/cryptoenthusiast',
      isVerified: true,
      verificationBadge: 'premium' as const,
      accountStatus: 'active' as const,
      subscriptionTier: 'premium' as const,
      subscriptionStatus: 'active' as const,
      subscriptionExpiry: new Date('2025-03-15'),
      communityRole: 'researcher' as const,
      cePoints: 2450,
      joyTokens: 150,
      readingStreak: 28,
      articlesRead: 234,
      commentsCount: 89,
      likesGiven: 456,
      bookmarks: 67,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    } as User,
    
    vip: {
      id: 'user-vip',
      username: 'crypto_expert',
      email: 'expert@example.com',
      displayName: 'CryptoExpert',
      firstName: 'Michael',
      lastName: 'Chen',
      bio: 'VIP member and cryptocurrency analyst. Sharing insights on market trends and investment strategies.',
      avatar: '/avatars/expert.jpg',
      location: 'Cape Town, South Africa',
      website: 'https://cryptoexpert.pro',
      twitter: '@crypto_expert',
      linkedin: 'https://linkedin.com/in/cryptoexpert',
      isVerified: true,
      verificationBadge: 'expert' as const,
      accountStatus: 'active' as const,
      subscriptionTier: 'vip' as const,
      subscriptionStatus: 'active' as const,
      subscriptionExpiry: new Date('2025-12-01'),
      communityRole: 'moderator' as const,
      cePoints: 8750,
      joyTokens: 500,
      readingStreak: 95,
      articlesRead: 892,
      commentsCount: 234,
      likesGiven: 1247,
      bookmarks: 156,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    } as User
  };

  // Mock Admin Controls
  const mockAdminControls: Record<string, AdminUserControls> = {
    free: {
      userId: 'user-free',
      communityFeatures: {
        roleSystem: {
          enabled: false,
          allowedRoles: [],
          canSelectRole: false
        },
        verificationBadge: {
          enabled: false,
          badgeType: 'premium',
          badgeIcon: '',
          verifiedBy: '',
          verifiedAt: new Date()
        },
        followSystem: {
          enabled: false,
          canBeFollowed: false,
          canFollowOthers: true,
          maxFollowers: 0
        },
        communityPermissions: {
          canPost: true,
          canComment: true,
          canLike: true,
          canShare: true,
          canRetweet: false,
          canPromotePosts: false,
          postFrequencyLimit: 3,
          moderationPriority: 'low'
        }
      },
      writingTool: {
        enabled: false,
        canCreateArticles: false,
        canCreateVideos: false,
        requiresApproval: true,
        maxArticlesPerDay: 0,
        canUseAIAssist: false
      },
      subscriptionOverrides: {
        tier: 'free',
        customFeatures: [],
        expiryDate: null
      }
    },
    
    premium: {
      userId: 'user-premium',
      communityFeatures: {
        roleSystem: {
          enabled: true,
          allowedRoles: ['researcher'],
          canSelectRole: false
        },
        verificationBadge: {
          enabled: true,
          badgeType: 'premium',
          badgeIcon: '👑',
          verifiedBy: 'admin-001',
          verifiedAt: new Date('2024-03-01')
        },
        followSystem: {
          enabled: true,
          canBeFollowed: true,
          canFollowOthers: true,
          maxFollowers: 1000
        },
        communityPermissions: {
          canPost: true,
          canComment: true,
          canLike: true,
          canShare: true,
          canRetweet: true,
          canPromotePosts: true,
          postFrequencyLimit: 10,
          moderationPriority: 'normal'
        }
      },
      writingTool: {
        enabled: true,
        canCreateArticles: true,
        canCreateVideos: false,
        requiresApproval: true,
        maxArticlesPerDay: 2,
        canUseAIAssist: true
      },
      subscriptionOverrides: {
        tier: 'premium',
        customFeatures: ['premium_alpha', 'private_community'],
        expiryDate: new Date('2025-03-15')
      }
    },
    
    vip: {
      userId: 'user-vip',
      communityFeatures: {
        roleSystem: {
          enabled: true,
          allowedRoles: ['researcher', 'verifier', 'moderator'],
          canSelectRole: true
        },
        verificationBadge: {
          enabled: true,
          badgeType: 'expert',
          badgeIcon: '🏆',
          verifiedBy: 'admin-001',
          verifiedAt: new Date('2024-01-01')
        },
        followSystem: {
          enabled: true,
          canBeFollowed: true,
          canFollowOthers: true,
          maxFollowers: 10000
        },
        communityPermissions: {
          canPost: true,
          canComment: true,
          canLike: true,
          canShare: true,
          canRetweet: true,
          canPromotePosts: true,
          postFrequencyLimit: 20,
          moderationPriority: 'high'
        }
      },
      writingTool: {
        enabled: true,
        canCreateArticles: true,
        canCreateVideos: true,
        requiresApproval: false,
        maxArticlesPerDay: 10,
        canUseAIAssist: true
      },
      subscriptionOverrides: {
        tier: 'vip',
        customFeatures: ['all_features', 'exclusive_tools', 'priority_support'],
        expiryDate: new Date('2025-12-01')
      }
    }
  };

  const currentUser = mockUsers[selectedUserType];
  const currentAdminControls = mockAdminControls[selectedUserType]!;

  // Mock Community Integration with safe access
  const mockCommunityIntegration: CommunityIntegration = {
    roleSystem: {
      currentRole: currentUser.communityRole,
      availableRoles: currentAdminControls.communityFeatures.roleSystem.allowedRoles,
      rolePermissions: {
        canVerifyContent: selectedUserType === 'vip',
        canModerateComments: selectedUserType === 'vip',
        canDeletePosts: selectedUserType === 'vip',
        canBanUsers: false,
        canAccessModTools: selectedUserType === 'vip'
      },
      roleApplication: {
        canApply: selectedUserType === 'free',
        applicationStatus: 'none'
      }
    },
    verification: {
      isVerified: currentUser.isVerified,
      verificationLevel: selectedUserType === 'vip' ? 'expert' : selectedUserType === 'premium' ? 'premium' : 'basic',
      badgeIcon: currentAdminControls.communityFeatures.verificationBadge.badgeIcon,
      verificationBenefits: {
        noAds: selectedUserType !== 'free',
        prioritySupport: selectedUserType === 'vip',
        highlightedPosts: selectedUserType !== 'free',
        customBadgeColor: selectedUserType === 'vip' ? '#FFD700' : '#3B82F6'
      },
      verifiedBy: {
        adminId: 'admin-001',
        adminName: 'System Admin',
        verifiedAt: new Date(),
        reason: 'Premium subscription verification'
      }
    },
    followSystem: {
      followers: {
        count: selectedUserType === 'vip' ? 1247 : selectedUserType === 'premium' ? 234 : 12,
        list: [],
        canAcceptFollowers: currentAdminControls.communityFeatures.followSystem.canBeFollowed,
        requiresApproval: false
      },
      following: {
        count: selectedUserType === 'vip' ? 89 : selectedUserType === 'premium' ? 45 : 23,
        users: [],
        topics: [],
        canFollowUsers: true,
        canFollowTopics: true
      },
      limitations: {
        maxFollowing: 1000,
        maxFollowers: currentAdminControls.communityFeatures.followSystem.maxFollowers,
        dailyFollowLimit: 50
      }
    },
    permissions: {
      posting: {
        canCreatePosts: true,
        postsPerDay: currentAdminControls.communityFeatures.communityPermissions.postFrequencyLimit,
        requiresApproval: selectedUserType === 'free',
        canUseWritingTool: currentAdminControls.writingTool.enabled
      },
      interaction: {
        canComment: true,
        canLike: true,
        canShare: true,
        canRetweet: currentAdminControls.communityFeatures.communityPermissions.canRetweet,
        canPromoteWithTokens: currentAdminControls.communityFeatures.communityPermissions.canPromotePosts
      },
      moderation: {
        level: selectedUserType === 'vip' ? 'moderator' : selectedUserType === 'premium' ? 'trusted' : 'user',
        canReportContent: true,
        canBlockUsers: selectedUserType !== 'free',
        canDeleteOwnContent: true
      }
    }
  };

  // Mock Feed System
  const mockFeedSystem: UserFeedSystem = {
    feedSources: {
      followingPosts: [],
      followingTopics: [],
      generalFeed: [],
      trendingFeed: [],
      premiumFeed: []
    },
    liveContent: {
      livePodcasts: {
        ongoing: [],
        scheduled: [],
        canHostPodcast: selectedUserType === 'vip',
        canJoinAsGuest: selectedUserType !== 'free'
      },
      liveChats: [],
      liveEvents: []
    },
    feedSettings: {
      algorithm: 'relevance',
      showPromotedPosts: true,
      hideSeenPosts: false,
      contentFilters: {
        minReadTime: 2,
        categories: ['bitcoin', 'defi', 'trading'],
        languages: ['en'],
        difficulty: 'intermediate'
      }
    },
    feedInteractions: {
      postsViewed: [],
      timeSpentOnPosts: [],
      scrollDepth: [],
      clickThroughRate: 0.12
    }
  };

  // Mock Podcast Features
  const mockPodcastFeatures: LivePodcastFeatures = {
    hosting: {
      canHost: selectedUserType === 'vip',
      canSchedule: selectedUserType !== 'free',
      canInviteGuests: selectedUserType !== 'free',
      maxDuration: selectedUserType === 'vip' ? 180 : selectedUserType === 'premium' ? 90 : 30,
      canRecord: selectedUserType !== 'free'
    },
    participation: {
      canJoinAsListener: true,
      canRequestToSpeak: selectedUserType !== 'free',
      canReactLive: true,
      canChatDuringPodcast: true
    },
    features: {
      liveChat: true,
      reactions: ['👍', '👎', '🔥', '💎', '🚀'],
      polls: selectedUserType !== 'free',
      screenShare: selectedUserType === 'vip',
      recording: selectedUserType !== 'free'
    },
    monetization: {
      canReceiveTips: selectedUserType !== 'free',
      canPromotePodcast: selectedUserType !== 'free',
      sponsorshipEligible: selectedUserType === 'vip'
    }
  };

  // Mock Writing Tool Features
  const mockWritingFeatures: WritingToolFeatures = {
    articleEditor: {
      richTextEditor: true,
      aiWritingAssist: currentAdminControls.writingTool.canUseAIAssist,
      grammarCheck: selectedUserType !== 'free',
      seoOptimization: selectedUserType === 'vip',
      imageUpload: true,
      videoEmbed: selectedUserType !== 'free'
    },
    drafts: {
      autoSave: true,
      maxDrafts: selectedUserType === 'vip' ? 50 : selectedUserType === 'premium' ? 20 : 5,
      collaborativeEditing: selectedUserType === 'vip'
    },
    publishing: {
      immediatePublish: !currentAdminControls.writingTool.requiresApproval,
      schedulePublish: selectedUserType !== 'free',
      requiresApproval: currentAdminControls.writingTool.requiresApproval,
      canSetVisibility: 'public' as const
    },
    contentAnalytics: {
      viewTracking: true,
      engagementMetrics: selectedUserType !== 'free',
      readerInsights: selectedUserType === 'vip'
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Demo Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Complete User Profile & Management System
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Comprehensive user system with admin controls, community integration, writing tools, live podcasts, and advanced article reactions.
          </p>

          {/* User Type Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Select User Type to Demo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  type: 'free', 
                  title: 'Free User', 
                  description: 'Basic access with limited features',
                  features: ['Basic news access', 'Community participation', 'Basic portfolio']
                },
                { 
                  type: 'premium', 
                  title: 'Premium User', 
                  description: 'Enhanced features and writing access',
                  features: ['Writing tool access', 'Verification badge', 'Premium alpha', '2x CE points']
                },
                { 
                  type: 'vip', 
                  title: 'VIP User', 
                  description: 'Full access with all premium features',
                  features: ['Host podcasts', 'All tools access', 'Priority support', '2.5x CE points']
                }
              ].map((userType) => (
                <button
                  key={userType.type}
                  onClick={() => setSelectedUserType(userType.type as any)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedUserType === userType.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {userType.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {userType.description}
                  </p>
                  <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {userType.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Demo Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'dashboard', label: 'User Dashboard', icon: '👤' },
                  { id: 'feed', label: 'Feed & Reactions', icon: '📰' },
                  { id: 'writing', label: 'Writing Tool', icon: '✏️' },
                  { id: 'podcast', label: 'Live Podcasts', icon: '🎙️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemo(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                      activeDemo === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm min-h-96">
          {activeDemo === 'dashboard' && (
            <UserDashboard
              user={currentUser}
              adminControls={currentAdminControls}
              communityIntegration={mockCommunityIntegration}
            />
          )}

          {activeDemo === 'feed' && (
            <UserFeed
              user={currentUser}
              feedSystem={mockFeedSystem}
            />
          )}

          {activeDemo === 'writing' && (
            <WritingTool
              user={currentUser}
              adminControls={currentAdminControls}
              features={mockWritingFeatures}
            />
          )}

          {activeDemo === 'podcast' && (
            <LivePodcastSystem
              user={currentUser}
              podcastFeatures={mockPodcastFeatures}
            />
          )}
        </div>

        {/* Implementation Summary */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            ✅ Implementation Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Core Features</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• User Dashboard with stats</li>
                <li>• Subscription tier management</li>
                <li>• CE Points & JOY Tokens</li>
                <li>• Admin-controlled features</li>
                <li>• Security & privacy settings</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Article Reactions</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Love, thumbs up/down reactions</li>
                <li>• On fire & holding indicators</li>
                <li>• Hours posted & trending score</li>
                <li>• Views & seen tracking</li>
                <li>• Comment, retweet, share</li>
                <li>• Follow topic functionality</li>
                <li>• Promote with JOY tokens</li>
                <li>• Report/block system</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Community System</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Role system (admin controlled)</li>
                <li>• Verification badges</li>
                <li>• Follow users & topics</li>
                <li>• Feed from following</li>
                <li>• Community permissions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Advanced Features</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Writing tool with AI assist</li>
                <li>• Live podcast system</li>
                <li>• Real-time chat</li>
                <li>• Admin dashboard controls</li>
                <li>• Mobile-optimized UI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}