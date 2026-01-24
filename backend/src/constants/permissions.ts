/**
 * Permission Registry - All 150+ Delegatable Permission Features
 * 
 * This file contains all permission constants that can be delegated by Super Admin
 * to Admins, and by Admins to Users (where applicable).
 * 
 * Permission Naming Convention: CATEGORY_ACTION
 * Example: USER_CREATE, CONTENT_PUBLISH, FINANCE_VIEW_WALLET
 */

// ============================================================================
// CATEGORY 1: USER MANAGEMENT (18 Permissions)
// ============================================================================

export const USER_MANAGEMENT_PERMISSIONS = {
  // User Account Management
  USER_CREATE: 'user_create',
  USER_READ: 'user_read',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_BAN: 'user_ban',
  USER_UNBAN: 'user_unban',
  USER_ROLE_CHANGE: 'user_role_change',
  USER_STATUS_CHANGE: 'user_status_change',
  
  // User Data & Privacy
  USER_EXPORT_DATA: 'user_export_data',
  USER_ANONYMIZE: 'user_anonymize',
  USER_GDPR_REQUEST: 'user_gdpr_request',
  USER_VIEW_ACTIVITY: 'user_view_activity',
  USER_VIEW_DEVICES: 'user_view_devices',
  USER_REVOKE_SESSIONS: 'user_revoke_sessions',
  
  // User Subscriptions & Billing
  USER_SUBSCRIPTION_MANAGE: 'user_subscription_manage',
  USER_SUBSCRIPTION_UPGRADE: 'user_subscription_upgrade',
  USER_SUBSCRIPTION_DOWNGRADE: 'user_subscription_downgrade',
  USER_REFUND: 'user_refund',
} as const;

// ============================================================================
// CATEGORY 2: CONTENT MANAGEMENT (22 Permissions)
// ============================================================================

export const CONTENT_MANAGEMENT_PERMISSIONS = {
  // Article Management
  CONTENT_CREATE: 'content_create',
  CONTENT_READ: 'content_read',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
  CONTENT_PUBLISH: 'content_publish',
  CONTENT_UNPUBLISH: 'content_unpublish',
  CONTENT_SCHEDULE: 'content_schedule',
  CONTENT_TRANSLATE: 'content_translate',
  
  // Content Moderation
  CONTENT_MODERATE: 'content_moderate',
  CONTENT_APPROVE: 'content_approve',
  CONTENT_REJECT: 'content_reject',
  CONTENT_FLAG: 'content_flag',
  CONTENT_PIN: 'content_pin',
  CONTENT_FEATURE: 'content_feature',
  
  // Content Categories & Tags
  CATEGORY_CREATE: 'category_create',
  CATEGORY_UPDATE: 'category_update',
  CATEGORY_DELETE: 'category_delete',
  TAG_CREATE: 'tag_create',
  TAG_UPDATE: 'tag_update',
  TAG_DELETE: 'tag_delete',
  TAG_MANAGE_TRENDING: 'tag_manage_trending',
  CATEGORY_REORDER: 'category_reorder',
} as const;

// ============================================================================
// CATEGORY 3: COMMUNITY MANAGEMENT (20 Permissions)
// ============================================================================

export const COMMUNITY_MANAGEMENT_PERMISSIONS = {
  // Community Posts & Engagement
  COMMUNITY_POST_CREATE: 'community_post_create',
  COMMUNITY_POST_DELETE: 'community_post_delete',
  COMMUNITY_POST_MODERATE: 'community_post_moderate',
  COMMUNITY_COMMENT_DELETE: 'community_comment_delete',
  COMMUNITY_COMMENT_MODERATE: 'community_comment_moderate',
  COMMUNITY_VOTE_MANAGE: 'community_vote_manage',
  
  // Community Roles & Permissions
  COMMUNITY_ROLE_ASSIGN: 'community_role_assign',
  COMMUNITY_ROLE_REVOKE: 'community_role_revoke',
  COMMUNITY_BADGE_ASSIGN: 'community_badge_assign',
  COMMUNITY_BADGE_REVOKE: 'community_badge_revoke',
  COMMUNITY_INFLUENCER_APPROVE: 'community_influencer_approve',
  
  // Community Features Control
  COMMUNITY_FOLLOW_MANAGE: 'community_follow_manage',
  COMMUNITY_RETWEET_ENABLE: 'community_retweet_enable',
  COMMUNITY_POST_PROMOTE: 'community_post_promote',
  COMMUNITY_POST_LIMIT_SET: 'community_post_limit_set',
  COMMUNITY_PRIORITY_SET: 'community_priority_set',
  COMMUNITY_THREAD_LOCK: 'community_thread_lock',
  COMMUNITY_THREAD_PIN: 'community_thread_pin',
  COMMUNITY_REPORT_REVIEW: 'community_report_review',
  COMMUNITY_ANALYTICS_VIEW: 'community_analytics_view',
} as const;

// ============================================================================
// CATEGORY 4: FINANCE & WALLET (24 Permissions)
// ============================================================================

export const FINANCE_PERMISSIONS = {
  // "We" Wallet (Super Admin Exclusive - Query functions delegatable)
  FINANCE_WE_WALLET_VIEW: 'finance_we_wallet_view',
  FINANCE_WE_WALLET_TRANSFER: 'finance_we_wallet_transfer', // SUPER ADMIN ONLY
  FINANCE_WE_WALLET_RECEIVE: 'finance_we_wallet_receive',
  FINANCE_WE_WALLET_AUDIT: 'finance_we_wallet_audit',
  
  // User Wallet Management (Delegatable)
  FINANCE_QUERY_WALLETS: 'finance_query_wallets',
  FINANCE_VIEW_WALLET: 'finance_view_wallet',
  FINANCE_LOCK_WALLET: 'finance_lock_wallet',
  FINANCE_UNLOCK_WALLET: 'finance_unlock_wallet',
  FINANCE_ADJUST_BALANCE: 'finance_adjust_balance',
  FINANCE_VIEW_BALANCE: 'finance_view_balance',
  
  // Transaction Management (Delegatable)
  FINANCE_TRACE_PAYMENTS: 'finance_trace_payments',
  FINANCE_VIEW_TRANSACTIONS: 'finance_view_transactions',
  FINANCE_CANCEL_TRANSACTION: 'finance_cancel_transaction',
  FINANCE_REFUND_TRANSACTION: 'finance_refund_transaction',
  FINANCE_APPROVE_TRANSACTION: 'finance_approve_transaction',
  FINANCE_REVERSE_TRANSACTION: 'finance_reverse_transaction',
  
  // Payment & Subscription (Delegatable)
  FINANCE_PROCESS_PAYMENT: 'finance_process_payment',
  FINANCE_VIEW_SUBSCRIPTIONS: 'finance_view_subscriptions',
  FINANCE_CANCEL_SUBSCRIPTION: 'finance_cancel_subscription',
  FINANCE_REFUND_SUBSCRIPTION: 'finance_refund_subscription',
  
  // Financial Reporting & Auditing (Delegatable)
  FINANCE_USER_AUDIT: 'finance_user_audit',
  FINANCE_EXPORT_REPORTS: 'finance_export_reports',
  FINANCE_VIEW_ANALYTICS: 'finance_view_analytics',
  FINANCE_HANDLE_ERRORS: 'finance_handle_errors',
} as const;

// ============================================================================
// CATEGORY 5: SYSTEM & CONFIGURATION (12 Permissions)
// ============================================================================

export const SYSTEM_PERMISSIONS = {
  // System Settings
  SYSTEM_CONFIGURE: 'system_configure', // SUPER ADMIN ONLY
  SYSTEM_MONITOR: 'system_monitor',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
  SYSTEM_UPDATE: 'system_update',
  SYSTEM_MAINTENANCE_MODE: 'system_maintenance_mode',
  
  // Security & Compliance
  SECURITY_VIEW_LOGS: 'security_view_logs',
  SECURITY_MANAGE_2FA: 'security_manage_2fa',
  SECURITY_IP_WHITELIST: 'security_ip_whitelist',
  SECURITY_IP_BLACKLIST: 'security_ip_blacklist',
  SECURITY_AUDIT_LOGS: 'security_audit_logs',
  SECURITY_GDPR_COMPLIANCE: 'security_gdpr_compliance', // SUPER ADMIN ONLY
} as const;

// ============================================================================
// CATEGORY 6: AI & AUTOMATION (10 Permissions)
// ============================================================================

export const AI_PERMISSIONS = {
  // AI Agent Management
  AI_CONFIGURE: 'ai_configure',
  AI_MONITOR: 'ai_monitor',
  AI_MANAGE_TASKS: 'ai_manage_tasks',
  AI_APPROVE_CONTENT: 'ai_approve_content',
  AI_REJECT_CONTENT: 'ai_reject_content',
  AI_QUALITY_REVIEW: 'ai_quality_review',
  
  // Content Automation
  AI_AUTO_TRANSLATE: 'ai_auto_translate',
  AI_AUTO_PUBLISH: 'ai_auto_publish',
  AI_SENTIMENT_ANALYSIS: 'ai_sentiment_analysis',
  AI_MODERATION: 'ai_moderation',
} as const;

// ============================================================================
// CATEGORY 7: ANALYTICS & REPORTING (8 Permissions)
// ============================================================================

export const ANALYTICS_PERMISSIONS = {
  ANALYTICS_VIEW: 'analytics_view',
  ANALYTICS_EXPORT: 'analytics_export',
  ANALYTICS_CUSTOM_REPORTS: 'analytics_custom_reports',
  ANALYTICS_USER_BEHAVIOR: 'analytics_user_behavior',
  ANALYTICS_CONTENT_PERFORMANCE: 'analytics_content_performance',
  ANALYTICS_REVENUE: 'analytics_revenue',
  ANALYTICS_REAL_TIME: 'analytics_real_time',
  ANALYTICS_PREDICTIONS: 'analytics_predictions',
} as const;

// ============================================================================
// CATEGORY 8: MARKETING & DISTRIBUTION (10 Permissions)
// ============================================================================

export const MARKETING_PERMISSIONS = {
  MARKETING_CAMPAIGN_CREATE: 'marketing_campaign_create',
  MARKETING_CAMPAIGN_MANAGE: 'marketing_campaign_manage',
  MARKETING_EMAIL_SEND: 'marketing_email_send',
  MARKETING_NEWSLETTER: 'marketing_newsletter',
  MARKETING_SOCIAL_POST: 'marketing_social_post',
  MARKETING_SOCIAL_SCHEDULE: 'marketing_social_schedule',
  MARKETING_SEO_MANAGE: 'marketing_seo_manage',
  MARKETING_ADS_MANAGE: 'marketing_ads_manage',
  MARKETING_AFFILIATES: 'marketing_affiliates',
  MARKETING_ANALYTICS: 'marketing_analytics',
} as const;

// ============================================================================
// CATEGORY 9: USER DASHBOARD FEATURES (26 Permissions)
// Admin can enable/disable these features for users
// ============================================================================

export const USER_FEATURE_PERMISSIONS = {
  // Writing Tools
  USER_FEATURE_WRITE_POST: 'user_feature_write_post',
  USER_FEATURE_WRITE_ARTICLE: 'user_feature_write_article',
  USER_FEATURE_CREATE_VIDEO: 'user_feature_create_video',
  USER_FEATURE_RECORD_PODCAST: 'user_feature_record_podcast',
  
  // Portfolio & Trading
  USER_FEATURE_PORTFOLIO: 'user_feature_portfolio',
  USER_FEATURE_PRICE_ALERTS: 'user_feature_price_alerts',
  USER_FEATURE_TOKEN_SWAP: 'user_feature_token_swap',
  USER_FEATURE_STAKING: 'user_feature_staking',
  USER_FEATURE_WALLET_WHITELIST: 'user_feature_wallet_whitelist',
  
  // Community & Social
  USER_FEATURE_COMMUNITY_POST: 'user_feature_community_post',
  USER_FEATURE_COMMENT: 'user_feature_comment',
  USER_FEATURE_LIKE: 'user_feature_like',
  USER_FEATURE_SHARE: 'user_feature_share',
  USER_FEATURE_RETWEET: 'user_feature_retweet',
  USER_FEATURE_FOLLOW: 'user_feature_follow',
  USER_FEATURE_DIRECT_MESSAGE: 'user_feature_direct_message',
  
  // Premium Features
  USER_FEATURE_AI_ASSIST: 'user_feature_ai_assist',
  USER_FEATURE_PREMIUM_CONTENT: 'user_feature_premium_content',
  USER_FEATURE_AD_FREE: 'user_feature_ad_free',
  USER_FEATURE_PRIORITY_SUPPORT: 'user_feature_priority_support',
  USER_FEATURE_CUSTOM_BADGE: 'user_feature_custom_badge',
  
  // Commerce & Monetization
  USER_FEATURE_DIGITAL_STORE: 'user_feature_digital_store',
  USER_FEATURE_SELL_PRODUCTS: 'user_feature_sell_products',
  USER_FEATURE_BOOST_CAMPAIGN: 'user_feature_boost_campaign',
  USER_FEATURE_AIRDROP_CREATE: 'user_feature_airdrop_create',
  USER_FEATURE_TOKEN_SUBSCRIPTION: 'user_feature_token_subscription',
} as const;

// ============================================================================
// ALL PERMISSIONS REGISTRY
// ============================================================================

export const ALL_PERMISSIONS = {
  ...USER_MANAGEMENT_PERMISSIONS,
  ...CONTENT_MANAGEMENT_PERMISSIONS,
  ...COMMUNITY_MANAGEMENT_PERMISSIONS,
  ...FINANCE_PERMISSIONS,
  ...SYSTEM_PERMISSIONS,
  ...AI_PERMISSIONS,
  ...ANALYTICS_PERMISSIONS,
  ...MARKETING_PERMISSIONS,
  ...USER_FEATURE_PERMISSIONS,
} as const;

// ============================================================================
// PERMISSION CATEGORIES
// ============================================================================

export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: Object.values(USER_MANAGEMENT_PERMISSIONS),
  CONTENT_MANAGEMENT: Object.values(CONTENT_MANAGEMENT_PERMISSIONS),
  COMMUNITY_MANAGEMENT: Object.values(COMMUNITY_MANAGEMENT_PERMISSIONS),
  FINANCE: Object.values(FINANCE_PERMISSIONS),
  SYSTEM: Object.values(SYSTEM_PERMISSIONS),
  AI: Object.values(AI_PERMISSIONS),
  ANALYTICS: Object.values(ANALYTICS_PERMISSIONS),
  MARKETING: Object.values(MARKETING_PERMISSIONS),
  USER_FEATURES: Object.values(USER_FEATURE_PERMISSIONS),
} as const;

// ============================================================================
// SUPER ADMIN EXCLUSIVE PERMISSIONS (Cannot be delegated)
// ============================================================================

export const SUPER_ADMIN_EXCLUSIVE = [
  ALL_PERMISSIONS.FINANCE_WE_WALLET_TRANSFER,
  ALL_PERMISSIONS.SYSTEM_CONFIGURE,
  ALL_PERMISSIONS.SECURITY_GDPR_COMPLIANCE,
] as const;

// ============================================================================
// DELEGATABLE BY SUPER ADMIN (All except exclusive ones)
// ============================================================================

export const DELEGATABLE_BY_SUPER_ADMIN = Object.values(ALL_PERMISSIONS).filter(
  (permission) => !SUPER_ADMIN_EXCLUSIVE.includes(permission as any)
);

// ============================================================================
// PERMISSION METADATA (For UI display and grouping)
// ============================================================================

export interface PermissionMetadata {
  key: string;
  displayName: string;
  description: string;
  category: string;
  requiresSuperAdmin: boolean;
  delegatable: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const PERMISSION_METADATA: Record<string, PermissionMetadata> = {
  // User Management
  [ALL_PERMISSIONS.USER_CREATE]: {
    key: ALL_PERMISSIONS.USER_CREATE,
    displayName: 'Create User',
    description: 'Create new user accounts',
    category: 'USER_MANAGEMENT',
    requiresSuperAdmin: false,
    delegatable: true,
    riskLevel: 'MEDIUM',
  },
  [ALL_PERMISSIONS.USER_DELETE]: {
    key: ALL_PERMISSIONS.USER_DELETE,
    displayName: 'Delete User',
    description: 'Permanently delete user accounts',
    category: 'USER_MANAGEMENT',
    requiresSuperAdmin: false,
    delegatable: true,
    riskLevel: 'HIGH',
  },
  [ALL_PERMISSIONS.USER_BAN]: {
    key: ALL_PERMISSIONS.USER_BAN,
    displayName: 'Ban User',
    description: 'Ban or suspend user accounts',
    category: 'USER_MANAGEMENT',
    requiresSuperAdmin: false,
    delegatable: true,
    riskLevel: 'HIGH',
  },
  
  // Finance
  [ALL_PERMISSIONS.FINANCE_WE_WALLET_TRANSFER]: {
    key: ALL_PERMISSIONS.FINANCE_WE_WALLET_TRANSFER,
    displayName: 'Transfer from We Wallet',
    description: 'Transfer funds from platform central wallet (SUPER ADMIN ONLY)',
    category: 'FINANCE',
    requiresSuperAdmin: true,
    delegatable: false,
    riskLevel: 'CRITICAL',
  },
  [ALL_PERMISSIONS.FINANCE_VIEW_WALLET]: {
    key: ALL_PERMISSIONS.FINANCE_VIEW_WALLET,
    displayName: 'View Wallet',
    description: 'View user wallet details and balances',
    category: 'FINANCE',
    requiresSuperAdmin: false,
    delegatable: true,
    riskLevel: 'LOW',
  },
  
  // System
  [ALL_PERMISSIONS.SYSTEM_CONFIGURE]: {
    key: ALL_PERMISSIONS.SYSTEM_CONFIGURE,
    displayName: 'Configure System',
    description: 'Modify critical system configurations (SUPER ADMIN ONLY)',
    category: 'SYSTEM',
    requiresSuperAdmin: true,
    delegatable: false,
    riskLevel: 'CRITICAL',
  },
  
  // Add more metadata as needed...
};

// ============================================================================
// PERMISSION HELPER FUNCTIONS
// ============================================================================

/**
 * Get all permissions in a category
 */
export function getPermissionsByCategory(category: keyof typeof PERMISSION_CATEGORIES): string[] {
  return PERMISSION_CATEGORIES[category];
}

/**
 * Check if permission is delegatable
 */
export function isDelegatable(permission: string): boolean {
  return DELEGATABLE_BY_SUPER_ADMIN.includes(permission as any);
}

/**
 * Check if permission requires super admin
 */
export function requiresSuperAdmin(permission: string): boolean {
  return SUPER_ADMIN_EXCLUSIVE.includes(permission as any);
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: string): string {
  return PERMISSION_METADATA[permission]?.displayName || permission;
}

/**
 * Get all permissions as array
 */
export function getAllPermissions(): string[] {
  return Object.values(ALL_PERMISSIONS);
}

/**
 * Get permission count
 */
export function getPermissionCount(): number {
  return Object.keys(ALL_PERMISSIONS).length;
}

// Export count for verification
console.log(`✅ Total Permissions Registered: ${getPermissionCount()}`);
