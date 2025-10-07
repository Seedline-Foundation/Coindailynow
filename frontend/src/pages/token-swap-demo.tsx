import React from 'react';
import TokenSwap from '../components/user/TokenSwap';
import { User, AdminUserControls } from '../types/user';

const TokenSwapDemoPage: React.FC = () => {
  // Mock user data
  const mockUser: User = {
    id: 'user-001',
    username: 'crypto_trader_pro',
    email: 'trader@example.com',
    displayName: 'Crypto Trader Pro',
    firstName: 'Sarah',
    lastName: 'Johnson',
    bio: 'Premium trader with 3 years experience in DeFi and memecoins',
    avatar: '/images/avatars/trader.jpg',
    location: 'Cape Town, South Africa',
    website: 'https://traderpro.africa',
    twitter: '@traderpro',
    linkedin: 'traderpro',
    isVerified: true,
    verificationBadge: 'premium',
    accountStatus: 'active',
    subscriptionTier: 'premium',
    subscriptionStatus: 'active',
    subscriptionExpiry: new Date('2025-12-31'),
    communityRole: 'researcher',
    cePoints: 5600,
    joyTokens: 2500,
    readingStreak: 45,
    articlesRead: 234,
    commentsCount: 89,
    likesGiven: 445,
    bookmarks: 67,
    createdAt: new Date('2023-06-20'),
    updatedAt: new Date(),
    lastLoginAt: new Date()
  };

  // Mock admin controls
  const mockAdminControls: AdminUserControls = {
    userId: 'user-001',
    communityFeatures: {
      roleSystem: {
        enabled: true,
        allowedRoles: ['researcher', 'verifier'],
        canSelectRole: true
      },
      verificationBadge: {
        enabled: true,
        badgeType: 'premium',
        badgeIcon: '⭐',
        verifiedBy: 'admin-001',
        verifiedAt: new Date()
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
      canCreateVideos: true,
      requiresApproval: false,
      maxArticlesPerDay: 10,
      canUseAIAssist: true
    },
    subscriptionOverrides: {
      tier: 'premium',
      customFeatures: ['ai-assist', 'premium-content'],
      expiryDate: new Date('2025-12-31')
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Token Swap Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of the integrated ChangeNOW crypto exchange widget
          </p>
        </div>

        {/* Token Swap Component */}
        <TokenSwap user={mockUser} adminControls={mockAdminControls} />
      </div>
    </div>
  );
};

export default TokenSwapDemoPage;