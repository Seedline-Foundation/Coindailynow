import React from 'react';
import SimpleProfileSettings from '../components/user/SimpleProfileSettings';
import { User, AdminUserControls } from '../types/user';

const ProfileSettingsDemoPage: React.FC = () => {
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
    <div>
      <SimpleProfileSettings 
        user={mockUser}
        adminControls={mockAdminControls}
        onUpdateProfile={(updates: Partial<User>) => {
          console.log('Profile updates:', updates);
          alert('Profile updated successfully!');
        }}
        onDeleteAccount={() => {
          if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            alert('Account deletion process initiated. You will receive an email confirmation.');
          }
        }}
      />
    </div>
  );
};

export default ProfileSettingsDemoPage;