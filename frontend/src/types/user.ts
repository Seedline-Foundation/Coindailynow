// Enhanced User Types with Admin Controls
export interface User {
  // Basic Info
  id: string;
  username: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
  location: string;
  website: string;
  twitter: string;
  linkedin: string;
  
  // Contact & Verification Info
  phoneNumber?: string;
  companyId?: string;
  nationalId?: string;
  
  // Platform Status
  isVerified: boolean;
  verificationBadge: 'none' | 'premium' | 'creator' | 'expert' | 'custom';
  accountStatus: 'active' | 'suspended' | 'banned';
  
  // Subscription & Tier
  subscriptionTier: 'free' | 'basic' | 'premium' | 'vip' | 'enterprise';
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  subscriptionExpiry: Date | null;
  
  // Community Role (Admin Controlled)
  communityRole: 'member' | 'researcher' | 'verifier' | 'moderator' | null;
  
  // Engagement Stats
  cePoints: number; // Community Engagement Points
  joyTokens: number; // JOY token balance
  readingStreak: number;
  articlesRead: number;
  commentsCount: number;
  likesGiven: number;
  bookmarks: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface AdminUserControls {
  userId: string;
  
  // Community Integration (Admin Controlled)
  communityFeatures: {
    roleSystem: {
      enabled: boolean;
      allowedRoles: ('researcher' | 'verifier' | 'moderator')[];
      canSelectRole: boolean;
    };
    verificationBadge: {
      enabled: boolean;
      badgeType: 'premium' | 'creator' | 'expert' | 'custom';
      badgeIcon: string; // Any icon for now, custom badges later
      verifiedBy: string; // Admin who verified
      verifiedAt: Date;
    };
    followSystem: {
      enabled: boolean;
      canBeFollowed: boolean;
      canFollowOthers: boolean;
      maxFollowers: number;
    };
    communityPermissions: {
      canPost: boolean;
      canComment: boolean;
      canLike: boolean;
      canShare: boolean;
      canRetweet: boolean;
      canPromotePosts: boolean;
      postFrequencyLimit: number; // posts per day
      moderationPriority: 'low' | 'normal' | 'high';
    };
  };
  
  // Writing Tool Access (Admin Controlled)
  writingTool: {
    enabled: boolean;
    canCreateArticles: boolean;
    canCreateVideos: boolean;
    requiresApproval: boolean;
    maxArticlesPerDay: number;
    canUseAIAssist: boolean;
  };
  
  // Subscription Features (Admin Override)
  subscriptionOverrides: {
    tier: 'free' | 'basic' | 'premium' | 'vip' | 'enterprise';
    customFeatures: string[]; // Admin can enable specific features
    expiryDate: Date | null; // Admin can set custom expiry
  };
}

export interface WritingToolFeatures {
  // Article Creation
  articleEditor: {
    richTextEditor: boolean;
    aiWritingAssist: boolean;
    grammarCheck: boolean;
    seoOptimization: boolean;
    imageUpload: boolean;
    videoEmbed: boolean;
  };
  
  // Content Management
  drafts: {
    autoSave: boolean;
    maxDrafts: number;
    collaborativeEditing: boolean;
  };
  
  // Publishing Options
  publishing: {
    immediatePublish: boolean;
    schedulePublish: boolean;
    requiresApproval: boolean;
    canSetVisibility: 'public' | 'followers' | 'premium';
  };
  
  // Analytics
  contentAnalytics: {
    viewTracking: boolean;
    engagementMetrics: boolean;
    readerInsights: boolean;
  };
}

export interface ArticleReactions {
  // Basic Reactions
  reactions: {
    love: { count: number; userReacted: boolean };
    thumbsUp: { count: number; userReacted: boolean };
    thumbsDown: { count: number; userReacted: boolean };
    onFire: { count: number; userReacted: boolean }; // Trending indicator
    holding: { count: number; userReacted: boolean }; // User holds discussed token
  };
  
  // Engagement Metrics
  engagement: {
    views: number; // How many people seen it
    uniqueViews: number;
    timeSpentReading: number; // Average time
    hoursPosted: number; // Hours since posted
    trendingScore: number; // Algorithm-calculated trending score
  };
  
  // Social Features
  social: {
    comments: {
      count: number;
      canComment: boolean;
      comments: Comment[];
    };
    retweets: {
      count: number;
      canRetweet: boolean;
      retweetedBy: User[];
    };
    shares: {
      count: number;
      shareUrls: {
        twitter: string;
        telegram: string;
        whatsapp: string;
        copyLink: string;
      };
    };
  };
  
  // Advanced Features
  advanced: {
    followTopic: {
      isFollowing: boolean;
      topicId: string;
      topicName: string;
    };
    promotePost: {
      canPromote: boolean;
      joyTokenCost: number;
      currentPromotion?: {
        level: 'basic' | 'premium' | 'featured';
        expiresAt: Date;
        tokensSpent: number;
      };
    };
    reporting: {
      canReport: boolean;
      reportReasons: ('spam' | 'inappropriate' | 'misleading' | 'harassment')[];
      canBlock: boolean;
      canRemove: boolean; // For moderators/admins
    };
  };
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: User;
  publishedAt: Date;
  updatedAt: Date;
  category: string;
  tags: string[];
  image?: string;
  video?: string;
  reactions: ArticleReactions;
  isPromoted: boolean;
  promotionLevel?: 'basic' | 'premium' | 'featured';
  visibility: 'public' | 'followers' | 'premium';
  status: 'draft' | 'pending' | 'published' | 'archived';
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  followersCount: number;
  postsCount: number;
  isFollowing: boolean;
  category: string;
  trending: boolean;
}

export interface UserFeedSystem {
  // Feed Sources
  feedSources: {
    followingPosts: Post[]; // Posts from people user follows
    followingTopics: Post[]; // Posts from topics user follows
    generalFeed: Post[]; // Public posts algorithm
    trendingFeed: Post[]; // Trending posts
    premiumFeed: Post[]; // Premium content (for subscribers)
  };
  
  // Live Features
  liveContent: {
    livePodcasts: {
      ongoing: LivePodcast[];
      scheduled: LivePodcast[];
      canHostPodcast: boolean; // Admin controlled
      canJoinAsGuest: boolean;
    };
    liveChats: LiveChat[];
    liveEvents: LiveEvent[];
  };
  
  // Feed Customization
  feedSettings: {
    algorithm: 'chronological' | 'relevance' | 'engagement';
    showPromotedPosts: boolean;
    hideSeenPosts: boolean;
    contentFilters: {
      minReadTime: number;
      categories: string[];
      languages: string[];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    };
  };
  
  // Interaction Tracking
  feedInteractions: {
    postsViewed: string[]; // Track viewed posts
    timeSpentOnPosts: { postId: string; timeMs: number }[];
    scrollDepth: { postId: string; percentage: number }[];
    clickThroughRate: number;
  };
}

export interface LivePodcast {
  id: string;
  title: string;
  description: string;
  host: User;
  guests: User[];
  listeners: User[];
  status: 'scheduled' | 'live' | 'ended';
  startTime: Date;
  endTime: Date;
  duration: number;
  recordingUrl?: string;
  chatEnabled: boolean;
  reactionsEnabled: boolean;
  maxListeners: number;
}

export interface LiveChat {
  id: string;
  podcastId: string;
  user: User;
  message: string;
  timestamp: Date;
  reactions: string[];
}

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  organizer: User;
  startTime: Date;
  endTime: Date;
  type: 'webinar' | 'ama' | 'trading_session' | 'announcement';
  participants: User[];
  maxParticipants: number;
}

export interface CommunityIntegration {
  // Role System (Admin Controlled)
  roleSystem: {
    currentRole: 'member' | 'researcher' | 'verifier' | 'moderator' | null;
    availableRoles: string[]; // Set by admin
    rolePermissions: {
      canVerifyContent: boolean;
      canModerateComments: boolean;
      canDeletePosts: boolean;
      canBanUsers: boolean;
      canAccessModTools: boolean;
    };
    roleApplication: {
      canApply: boolean;
      applicationStatus: 'none' | 'pending' | 'approved' | 'rejected';
      applicationDate?: Date;
    };
  };
  
  // Verification System (Admin Controlled)
  verification: {
    isVerified: boolean;
    verificationLevel: 'basic' | 'premium' | 'expert' | 'creator';
    badgeIcon: string; // Will use any icon for now
    verificationBenefits: {
      noAds: boolean;
      prioritySupport: boolean;
      highlightedPosts: boolean;
      customBadgeColor: string;
    };
    verifiedBy: {
      adminId: string;
      adminName: string;
      verifiedAt: Date;
      reason: string;
    };
  };
  
  // Follow System (Admin Controlled)
  followSystem: {
    followers: {
      count: number;
      list: User[];
      canAcceptFollowers: boolean;
      requiresApproval: boolean;
    };
    following: {
      count: number;
      users: User[];
      topics: Topic[];
      canFollowUsers: boolean;
      canFollowTopics: boolean;
    };
    limitations: {
      maxFollowing: number;
      maxFollowers: number;
      dailyFollowLimit: number;
    };
  };
  
  // Community Permissions (Admin Controlled)
  permissions: {
    posting: {
      canCreatePosts: boolean;
      postsPerDay: number;
      requiresApproval: boolean;
      canUseWritingTool: boolean;
    };
    interaction: {
      canComment: boolean;
      canLike: boolean;
      canShare: boolean;
      canRetweet: boolean;
      canPromoteWithTokens: boolean;
    };
    moderation: {
      level: 'user' | 'trusted' | 'moderator' | 'admin';
      canReportContent: boolean;
      canBlockUsers: boolean;
      canDeleteOwnContent: boolean;
    };
  };
}

export interface LivePodcastFeatures {
  // Podcast Creation (Admin Controlled)
  hosting: {
    canHost: boolean; // Admin controlled
    canSchedule: boolean;
    canInviteGuests: boolean;
    maxDuration: number; // minutes
    canRecord: boolean;
  };
  
  // Podcast Participation
  participation: {
    canJoinAsListener: boolean;
    canRequestToSpeak: boolean;
    canReactLive: boolean;
    canChatDuringPodcast: boolean;
  };
  
  // Podcast Features
  features: {
    liveChat: boolean;
    reactions: string[]; // ['👍', '👎', '🔥', '💎', '🚀']
    polls: boolean;
    screenShare: boolean;
    recording: boolean;
  };
  
  // Monetization
  monetization: {
    canReceiveTips: boolean; // JOY tokens
    canPromotePodcast: boolean; // Using JOY tokens
    sponsorshipEligible: boolean;
  };
}

export interface DashboardSections {
  // Overview
  userStats: {
    articlesRead: number;
    readingStreak: number;
    bookmarks: number;
    comments: number;
    level: number;
    cePoints: number;
    joyTokens: number;
  };
  subscriptionStatus: {
    tier: 'free' | 'basic' | 'premium' | 'vip' | 'enterprise';
    status: 'active' | 'expired' | 'cancelled';
    expiryDate: Date | null;
    features: string[];
  };
  
  // Content Engagement
  recentlyRead: Post[];
  bookmarks: Post[];
  
  // Portfolio (Premium feature)
  portfolio?: {
    totalValue: number;
    dayChange: number;
    holdings: any[];
  };
  priceAlerts?: any[];
  watchlist?: any[];
  
  // Community Activity
  recentComments: any[];
  communityLevel: number;
  badges: any[];
  
  // Rewards & Points
  recentRewards: any[];
  predictionAccuracy: number;
  contentSharing: any;
  
  // Notifications
  notifications: any[];
  systemAlerts: any[];
}