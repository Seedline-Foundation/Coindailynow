import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware as jwtAuthMiddleware } from '../../../middleware/auth';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { financeService } from '../../../services/FinanceService';
import { canEmergencyUnpublish } from '../../../lib/editorialRoles';
import { CMSService } from '../../../services/cmsService';
import { logger } from '../../../utils/logger';

/**
 * Super-admin auth middleware.
 * In development mode, accepts both mock tokens (mock_super_admin_token_*) and real JWTs.
 * In production, only real JWTs are accepted.
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Dev mode: accept mock tokens
  if (process.env.NODE_ENV !== 'production' && token && token.startsWith('mock_super_admin_token_')) {
    req.user = {
      id: 'dev-super-admin',
      email: 'admin@coindaily.online',
      username: 'superadmin',
      role: 'SUPER_ADMIN',
      subscriptionTier: 'ENTERPRISE',
      status: 'ACTIVE',
      emailVerified: true,
    };
    return next();
  }

  // Otherwise use real JWT verification
  return jwtAuthMiddleware(req, res, next);
};

// Helper: enforce admin access — no bypasses in production
const requireAdmin = (req: Request, res: Response): boolean => {
  if (process.env.NODE_ENV === 'development') return false;
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    res.status(403).json({ success: false, error: 'Forbidden', message: 'Admin access required' });
    return true;
  }
  return false;
};

// ============================================================================
// FULL PERMISSIONS REGISTRY (150+ permissions from expanded document)
// ============================================================================
const ALL_PERMISSIONS = [
  // Category 1: USER MANAGEMENT (18)
  { key: 'USER_CREATE', displayName: 'Create Users', description: 'Create new user accounts', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_READ', displayName: 'View Users', description: 'View user profiles and details', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_UPDATE', displayName: 'Edit Users', description: 'Edit user information', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_DELETE', displayName: 'Delete Users', description: 'Permanently delete user accounts', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: true },
  { key: 'USER_BAN', displayName: 'Ban Users', description: 'Ban/suspend user accounts', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_UNBAN', displayName: 'Unban Users', description: 'Restore banned accounts', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_ROLE_CHANGE', displayName: 'Change User Roles', description: 'Modify user roles', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: true },
  { key: 'USER_STATUS_CHANGE', displayName: 'Change User Status', description: 'Change account status (active/inactive/suspended)', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_EXPORT_DATA', displayName: 'Export User Data', description: 'Export user data (GDPR compliance)', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_ANONYMIZE', displayName: 'Anonymize User Data', description: 'Anonymize user data', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: true },
  { key: 'USER_GDPR_REQUEST', displayName: 'Handle GDPR Requests', description: 'Handle GDPR deletion requests', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: true },
  { key: 'USER_VIEW_ACTIVITY', displayName: 'View User Activity', description: 'View user activity logs', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_VIEW_DEVICES', displayName: 'View User Devices', description: "View user's logged-in devices", category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_REVOKE_SESSIONS', displayName: 'Revoke Sessions', description: 'Force logout user sessions', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_SUBSCRIPTION_MANAGE', displayName: 'Manage Subscriptions', description: 'Manage user subscriptions', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_SUBSCRIPTION_UPGRADE', displayName: 'Upgrade Subscriptions', description: 'Upgrade user tiers', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_SUBSCRIPTION_DOWNGRADE', displayName: 'Downgrade Subscriptions', description: 'Downgrade user tiers', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_REFUND', displayName: 'Process Refunds', description: 'Process subscription refunds', category: 'USER_MANAGEMENT', delegatable: true, requiresSuperAdmin: true },

  // Category 2: CONTENT MANAGEMENT (22)
  { key: 'CONTENT_CREATE', displayName: 'Create Content', description: 'Create new articles/posts', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_READ', displayName: 'View All Content', description: 'View all content (including drafts)', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_UPDATE', displayName: 'Edit Content', description: 'Edit existing content', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_DELETE', displayName: 'Delete Content', description: 'Delete content', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_PUBLISH', displayName: 'Publish Content', description: 'Publish content to live', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_UNPUBLISH', displayName: 'Unpublish Content', description: 'Remove content from live', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_SCHEDULE', displayName: 'Schedule Content', description: 'Schedule content publication', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_TRANSLATE', displayName: 'Translate Content', description: 'Access translation features', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_MODERATE', displayName: 'Moderate Content', description: 'Review flagged content', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_APPROVE', displayName: 'Approve Content', description: 'Approve pending content', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_REJECT', displayName: 'Reject Content', description: 'Reject submitted content', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_FLAG', displayName: 'Flag Content', description: 'Flag content for review', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_PIN', displayName: 'Pin Content', description: 'Pin content to top', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CONTENT_FEATURE', displayName: 'Feature Content', description: 'Feature content on homepage', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CATEGORY_CREATE', displayName: 'Create Categories', description: 'Create content categories', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CATEGORY_UPDATE', displayName: 'Edit Categories', description: 'Edit categories', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CATEGORY_DELETE', displayName: 'Delete Categories', description: 'Delete categories', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: true },
  { key: 'TAG_CREATE', displayName: 'Create Tags', description: 'Create content tags', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'TAG_UPDATE', displayName: 'Edit Tags', description: 'Edit tags', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'TAG_DELETE', displayName: 'Delete Tags', description: 'Delete tags', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'TAG_MANAGE_TRENDING', displayName: 'Manage Trending Tags', description: 'Manage trending tags', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'CATEGORY_REORDER', displayName: 'Reorder Categories', description: 'Reorder category hierarchy', category: 'CONTENT_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },

  // Category 3: COMMUNITY MANAGEMENT (20)
  { key: 'COMMUNITY_POST_CREATE', displayName: 'Create Community Posts', description: 'Create community posts', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_POST_DELETE', displayName: 'Delete Community Posts', description: 'Delete community posts', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_POST_MODERATE', displayName: 'Moderate Community Posts', description: 'Moderate community posts', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_COMMENT_DELETE', displayName: 'Delete Comments', description: 'Delete comments', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_COMMENT_MODERATE', displayName: 'Moderate Comments', description: 'Moderate comments', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_VOTE_MANAGE', displayName: 'Manage Voting', description: 'Manage voting system', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_ROLE_ASSIGN', displayName: 'Assign Community Roles', description: 'Assign community roles (researcher, verifier, moderator)', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_ROLE_REVOKE', displayName: 'Revoke Community Roles', description: 'Remove community roles', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_BADGE_ASSIGN', displayName: 'Assign Badges', description: 'Assign verification badges', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_BADGE_REVOKE', displayName: 'Revoke Badges', description: 'Remove verification badges', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_INFLUENCER_APPROVE', displayName: 'Approve Influencers', description: 'Approve influencer applications', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_FOLLOW_MANAGE', displayName: 'Manage Follow System', description: 'Manage follow system settings', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_RETWEET_ENABLE', displayName: 'Manage Retweets', description: 'Enable/disable retweets for users', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_POST_PROMOTE', displayName: 'Promote Posts', description: 'Allow users to promote posts', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_POST_LIMIT_SET', displayName: 'Set Post Limits', description: 'Set post frequency limits', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_PRIORITY_SET', displayName: 'Set Moderation Priority', description: 'Set moderation priority levels', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_THREAD_LOCK', displayName: 'Lock Threads', description: 'Lock/unlock discussion threads', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_THREAD_PIN', displayName: 'Pin Threads', description: 'Pin important threads', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_REPORT_REVIEW', displayName: 'Review Reports', description: 'Review community reports', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },
  { key: 'COMMUNITY_ANALYTICS_VIEW', displayName: 'View Community Analytics', description: 'View community analytics', category: 'COMMUNITY_MANAGEMENT', delegatable: true, requiresSuperAdmin: false },

  // Category 4: FINANCE & WALLET (24)
  { key: 'FINANCE_WE_WALLET_VIEW', displayName: 'View We Wallet', description: 'View "We" wallet balance and transactions', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_WE_WALLET_TRANSFER', displayName: 'We Wallet Transfer', description: 'Transfer from "We" wallet (SUPER ADMIN ONLY)', category: 'FINANCE_WALLET', delegatable: false, requiresSuperAdmin: true },
  { key: 'FINANCE_WE_WALLET_RECEIVE', displayName: 'We Wallet Receive', description: 'Receive funds to "We" wallet', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_WE_WALLET_AUDIT', displayName: 'We Wallet Audit', description: 'View full "We" wallet audit trail', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_QUERY_WALLETS', displayName: 'Query Wallets', description: 'Search and query all user wallets', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_VIEW_WALLET', displayName: 'View Wallet Details', description: 'View individual wallet details', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_LOCK_WALLET', displayName: 'Lock Wallet', description: 'Lock/freeze user wallets', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_UNLOCK_WALLET', displayName: 'Unlock Wallet', description: 'Unlock frozen wallets', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_ADJUST_BALANCE', displayName: 'Adjust Balance', description: 'Manual balance adjustments (refunds/bonuses)', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_VIEW_BALANCE', displayName: 'View Balance', description: 'View wallet balances', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_TRACE_PAYMENTS', displayName: 'Trace Payments', description: 'Trace payment history', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_VIEW_TRANSACTIONS', displayName: 'View Transactions', description: 'View all transaction records', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_CANCEL_TRANSACTION', displayName: 'Cancel Transaction', description: 'Cancel pending transactions', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_REFUND_TRANSACTION', displayName: 'Refund Transaction', description: 'Process refunds', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_APPROVE_TRANSACTION', displayName: 'Approve Transaction', description: 'Approve high-value transactions', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_REVERSE_TRANSACTION', displayName: 'Reverse Transaction', description: 'Reverse completed transactions (admin only)', category: 'FINANCE_WALLET', delegatable: false, requiresSuperAdmin: true },
  { key: 'FINANCE_PROCESS_PAYMENT', displayName: 'Process Payment', description: 'Process manual payments', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_VIEW_SUBSCRIPTIONS', displayName: 'View Subscriptions', description: 'View subscription payments', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_CANCEL_SUBSCRIPTION', displayName: 'Cancel Subscription', description: 'Cancel user subscriptions', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_REFUND_SUBSCRIPTION', displayName: 'Refund Subscription', description: 'Refund subscription payments', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: true },
  { key: 'FINANCE_USER_AUDIT', displayName: 'Audit User Finance', description: 'Audit user financial activity', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_EXPORT_REPORTS', displayName: 'Export Financial Reports', description: 'Export financial reports', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_VIEW_ANALYTICS', displayName: 'View Revenue Analytics', description: 'View revenue analytics', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },
  { key: 'FINANCE_HANDLE_ERRORS', displayName: 'Handle Payment Errors', description: 'Resolve payment errors', category: 'FINANCE_WALLET', delegatable: true, requiresSuperAdmin: false },

  // Category 5: SYSTEM & CONFIGURATION (12)
  { key: 'SYSTEM_CONFIGURE', displayName: 'Configure System', description: 'Modify system configurations', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: true },
  { key: 'SYSTEM_MONITOR', displayName: 'Monitor System', description: 'Monitor system health', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: false },
  { key: 'SYSTEM_BACKUP', displayName: 'System Backup', description: 'Initiate system backups', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: true },
  { key: 'SYSTEM_RESTORE', displayName: 'System Restore', description: 'Restore from backups', category: 'SYSTEM_CONFIG', delegatable: false, requiresSuperAdmin: true },
  { key: 'SYSTEM_UPDATE', displayName: 'System Update', description: 'Apply system updates', category: 'SYSTEM_CONFIG', delegatable: false, requiresSuperAdmin: true },
  { key: 'SYSTEM_MAINTENANCE_MODE', displayName: 'Maintenance Mode', description: 'Enable/disable maintenance mode', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: true },
  { key: 'SECURITY_VIEW_LOGS', displayName: 'View Security Logs', description: 'View security logs', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: false },
  { key: 'SECURITY_MANAGE_2FA', displayName: 'Manage 2FA', description: 'Manage 2FA settings', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: false },
  { key: 'SECURITY_IP_WHITELIST', displayName: 'IP Whitelist', description: 'Manage IP whitelist', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: true },
  { key: 'SECURITY_IP_BLACKLIST', displayName: 'IP Blacklist', description: 'Ban IP addresses', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: true },
  { key: 'SECURITY_AUDIT_LOGS', displayName: 'Audit Logs', description: 'View full audit trail', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: false },
  { key: 'SECURITY_GDPR_COMPLIANCE', displayName: 'GDPR Compliance', description: 'Handle GDPR requests', category: 'SYSTEM_CONFIG', delegatable: true, requiresSuperAdmin: true },

  // Category 6: AI & AUTOMATION (10)
  { key: 'AI_CONFIGURE', displayName: 'Configure AI', description: 'Configure AI agent settings', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: true },
  { key: 'AI_MONITOR', displayName: 'Monitor AI', description: 'Monitor AI performance', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_MANAGE_TASKS', displayName: 'Manage AI Tasks', description: 'Manage AI task queue', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_APPROVE_CONTENT', displayName: 'Approve AI Content', description: 'Approve AI-generated content', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_REJECT_CONTENT', displayName: 'Reject AI Content', description: 'Reject AI-generated content', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_QUALITY_REVIEW', displayName: 'AI Quality Review', description: 'Review AI quality scores', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_AUTO_TRANSLATE', displayName: 'Auto-translation', description: 'Manage auto-translation', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_AUTO_PUBLISH', displayName: 'Auto-publish', description: 'Enable/disable auto-publishing', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: true },
  { key: 'AI_SENTIMENT_ANALYSIS', displayName: 'Sentiment Analysis', description: 'Run sentiment analysis', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },
  { key: 'AI_MODERATION', displayName: 'AI Moderation', description: 'AI-powered content moderation', category: 'AI_AUTOMATION', delegatable: true, requiresSuperAdmin: false },

  // Category 7: ANALYTICS & REPORTING (8)
  { key: 'ANALYTICS_VIEW', displayName: 'View Analytics', description: 'View analytics dashboards', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_EXPORT', displayName: 'Export Analytics', description: 'Export analytics data', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_CUSTOM_REPORTS', displayName: 'Custom Reports', description: 'Create custom reports', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_USER_BEHAVIOR', displayName: 'User Behavior', description: 'View user behavior analytics', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_CONTENT_PERFORMANCE', displayName: 'Content Performance', description: 'View content analytics', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_REVENUE', displayName: 'Revenue Analytics', description: 'View revenue analytics', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_REAL_TIME', displayName: 'Real-time Analytics', description: 'Access real-time analytics', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },
  { key: 'ANALYTICS_PREDICTIONS', displayName: 'AI Predictions', description: 'View AI predictions', category: 'ANALYTICS_REPORTING', delegatable: true, requiresSuperAdmin: false },

  // Category 8: MARKETING & DISTRIBUTION (10)
  { key: 'MARKETING_CAMPAIGN_CREATE', displayName: 'Create Campaigns', description: 'Create marketing campaigns', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_CAMPAIGN_MANAGE', displayName: 'Manage Campaigns', description: 'Manage campaigns', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_EMAIL_SEND', displayName: 'Send Emails', description: 'Send email campaigns', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_NEWSLETTER', displayName: 'Newsletter', description: 'Manage newsletter distribution', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_SOCIAL_POST', displayName: 'Social Media Post', description: 'Post to social media', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_SOCIAL_SCHEDULE', displayName: 'Schedule Social', description: 'Schedule social posts', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_SEO_MANAGE', displayName: 'Manage SEO', description: 'Manage SEO settings', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_ADS_MANAGE', displayName: 'Manage Ads', description: 'Manage advertising', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_AFFILIATES', displayName: 'Manage Affiliates', description: 'Manage affiliate programs', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },
  { key: 'MARKETING_ANALYTICS', displayName: 'Marketing Analytics', description: 'View marketing analytics', category: 'MARKETING_DISTRIBUTION', delegatable: true, requiresSuperAdmin: false },

  // Category 9: USER DASHBOARD FEATURES (26)
  { key: 'USER_FEATURE_WRITE_POST', displayName: 'Write Posts', description: 'Allow user to write posts', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_WRITE_ARTICLE', displayName: 'Write Articles', description: 'Allow user to write articles', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_CREATE_VIDEO', displayName: 'Create Videos', description: 'Allow user to create videos', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_RECORD_PODCAST', displayName: 'Record Podcasts', description: 'Allow user to record podcasts', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_PORTFOLIO', displayName: 'Portfolio Tracking', description: 'Enable portfolio tracking', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_PRICE_ALERTS', displayName: 'Price Alerts', description: 'Enable price alerts', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_TOKEN_SWAP', displayName: 'Token Swap', description: 'Enable token swapping', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_STAKING', displayName: 'Staking', description: 'Enable staking features', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_WALLET_WHITELIST', displayName: 'Wallet Whitelist', description: 'Enable wallet whitelist management', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_COMMUNITY_POST', displayName: 'Community Posts', description: 'Allow community posts', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_COMMENT', displayName: 'Commenting', description: 'Allow commenting', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_LIKE', displayName: 'Liking', description: 'Allow liking content', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_SHARE', displayName: 'Sharing', description: 'Allow content sharing', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_RETWEET', displayName: 'Retweets', description: 'Allow retweets', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_FOLLOW', displayName: 'Follow System', description: 'Enable follow system', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_DIRECT_MESSAGE', displayName: 'Direct Messages', description: 'Enable DMs', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_AI_ASSIST', displayName: 'AI Assist', description: 'Enable AI writing assistance', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_PREMIUM_CONTENT', displayName: 'Premium Content', description: 'Access to premium articles', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_AD_FREE', displayName: 'Ad-Free', description: 'Ad-free experience', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_PRIORITY_SUPPORT', displayName: 'Priority Support', description: 'Priority customer support', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_CUSTOM_BADGE', displayName: 'Custom Badge', description: 'Custom verification badge', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_DIGITAL_STORE', displayName: 'Digital Store', description: 'Enable digital product store', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_SELL_PRODUCTS', displayName: 'Sell Products', description: 'Allow selling products', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_BOOST_CAMPAIGN', displayName: 'Post Boosting', description: 'Enable post boosting', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
  { key: 'USER_FEATURE_AIRDROP_CREATE', displayName: 'Create Airdrops', description: 'Allow airdrop creation', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: true },
  { key: 'USER_FEATURE_TOKEN_SUBSCRIPTION', displayName: 'Token Subscriptions', description: 'Enable token subscriptions', category: 'USER_FEATURES', delegatable: true, requiresSuperAdmin: false },
];

// Group permissions by category
function getPermissionCategories() {
  const categoryMap: Record<string, typeof ALL_PERMISSIONS> = {};
  for (const perm of ALL_PERMISSIONS) {
    if (!categoryMap[perm.category]) categoryMap[perm.category] = [];
    categoryMap[perm.category].push(perm);
  }
  return Object.entries(categoryMap).map(([name, permissions]) => ({
    name,
    displayName: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    permissions,
  }));
}

// ============================================================================
// DEFAULT ROLE TEMPLATES
// ============================================================================
const DEFAULT_ROLES = [
  {
    id: 'role_super_admin',
    name: 'SUPER_ADMIN',
    displayName: 'Super Administrator',
    description: 'Full system access with all 150+ permissions. Unrestricted platform control.',
    permissions: ALL_PERMISSIONS.map(p => p.key),
    adminCount: 1,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_content_admin',
    name: 'CONTENT_ADMIN',
    displayName: 'Content Administrator',
    description: 'Manage articles, categories, tags, moderation, and content publishing workflow.',
    permissions: ALL_PERMISSIONS.filter(p => ['CONTENT_MANAGEMENT'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_community_manager',
    name: 'COMMUNITY_MANAGER',
    displayName: 'Community Manager',
    description: 'Moderate community posts, manage badges, handle reports, and engagement.',
    permissions: ALL_PERMISSIONS.filter(p => ['COMMUNITY_MANAGEMENT'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_finance_admin',
    name: 'FINANCE_ADMIN',
    displayName: 'Finance Administrator',
    description: 'Manage wallets, transactions, subscriptions, revenue analytics, and financial reports.',
    permissions: ALL_PERMISSIONS.filter(p => ['FINANCE_WALLET'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_marketing_admin',
    name: 'MARKETING_ADMIN',
    displayName: 'Marketing Administrator',
    description: 'Create campaigns, manage newsletters, social posting, SEO, and affiliate programs.',
    permissions: [
      ...ALL_PERMISSIONS.filter(p => ['MARKETING_DISTRIBUTION'].includes(p.category)).map(p => p.key),
      'ANALYTICS_VIEW', 'ANALYTICS_EXPORT', 'MARKETING_ANALYTICS',
    ],
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_tech_admin',
    name: 'TECH_ADMIN',
    displayName: 'Technical Administrator',
    description: 'System configuration, monitoring, security logs, backups, and maintenance mode.',
    permissions: ALL_PERMISSIONS.filter(p => ['SYSTEM_CONFIG'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_ai_admin',
    name: 'AI_ADMIN',
    displayName: 'AI & Automation Administrator',
    description: 'Configure AI agents, manage tasks, approve AI content, run sentiment analysis.',
    permissions: ALL_PERMISSIONS.filter(p => ['AI_AUTOMATION'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_analytics_viewer',
    name: 'ANALYTICS_VIEWER',
    displayName: 'Analytics Viewer',
    description: 'Read-only access to all analytics dashboards, reports, and predictions.',
    permissions: ALL_PERMISSIONS.filter(p => ['ANALYTICS_REPORTING'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_user_manager',
    name: 'USER_MANAGER',
    displayName: 'User Manager',
    description: 'Manage user accounts, subscriptions, bans, role changes, and GDPR requests.',
    permissions: ALL_PERMISSIONS.filter(p => ['USER_MANAGEMENT'].includes(p.category)).map(p => p.key),
    adminCount: 0,
    isDefault: true,
    isSystem: true,
  },
  {
    id: 'role_senior_editor',
    name: 'SENIOR_EDITOR',
    displayName: 'Senior Editor',
    description: 'Create, edit, publish, schedule, and feature content. Manage categories and tags.',
    permissions: [
      'CONTENT_CREATE', 'CONTENT_READ', 'CONTENT_UPDATE', 'CONTENT_PUBLISH',
      'CONTENT_UNPUBLISH', 'CONTENT_SCHEDULE', 'CONTENT_TRANSLATE', 'CONTENT_PIN',
      'CONTENT_FEATURE', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'TAG_CREATE',
      'TAG_UPDATE', 'TAG_MANAGE_TRENDING', 'AI_APPROVE_CONTENT', 'AI_QUALITY_REVIEW',
    ],
    adminCount: 0,
    isDefault: true,
    isSystem: false,
  },
  {
    id: 'role_junior_editor',
    name: 'JUNIOR_EDITOR',
    displayName: 'Junior Editor',
    description: 'Create and edit content drafts. Cannot publish or delete.',
    permissions: [
      'CONTENT_CREATE', 'CONTENT_READ', 'CONTENT_UPDATE', 'CONTENT_TRANSLATE',
      'TAG_CREATE', 'TAG_UPDATE',
    ],
    adminCount: 0,
    isDefault: true,
    isSystem: false,
  },
  {
    id: 'role_content_moderator',
    name: 'CONTENT_MODERATOR',
    displayName: 'Content Moderator',
    description: 'Review flagged content, approve/reject submissions, and manage community reports.',
    permissions: [
      'CONTENT_READ', 'CONTENT_MODERATE', 'CONTENT_APPROVE', 'CONTENT_REJECT',
      'CONTENT_FLAG', 'COMMUNITY_POST_MODERATE', 'COMMUNITY_COMMENT_MODERATE',
      'COMMUNITY_COMMENT_DELETE', 'COMMUNITY_REPORT_REVIEW', 'AI_MODERATION',
    ],
    adminCount: 0,
    isDefault: true,
    isSystem: false,
  },
  {
    id: 'role_support_agent',
    name: 'SUPPORT_AGENT',
    displayName: 'Customer Support Agent',
    description: 'View user data, manage subscriptions, handle refunds, and respond to support tickets.',
    permissions: [
      'USER_READ', 'USER_VIEW_ACTIVITY', 'USER_VIEW_DEVICES', 'USER_REVOKE_SESSIONS',
      'USER_SUBSCRIPTION_MANAGE', 'USER_REFUND', 'FINANCE_VIEW_TRANSACTIONS',
      'FINANCE_REFUND_TRANSACTION', 'FINANCE_HANDLE_ERRORS',
    ],
    adminCount: 0,
    isDefault: true,
    isSystem: false,
  },
  {
    id: 'role_seo_specialist',
    name: 'SEO_SPECIALIST',
    displayName: 'SEO Specialist',
    description: 'Manage SEO settings, categories, tags, and content optimization.',
    permissions: [
      'CONTENT_READ', 'CONTENT_UPDATE', 'MARKETING_SEO_MANAGE',
      'CATEGORY_UPDATE', 'TAG_UPDATE', 'TAG_MANAGE_TRENDING', 'CATEGORY_REORDER',
      'ANALYTICS_CONTENT_PERFORMANCE',
    ],
    adminCount: 0,
    isDefault: true,
    isSystem: false,
  },
];

// In-memory store for custom roles (persists across requests during server lifetime)
let customRoles: typeof DEFAULT_ROLES = [];

const STAFF_DEPARTMENTS = [
  'finance',
  'News',
  'Compliance/Expansion/Govt',
  'Partnership',
  'Adverts',
  'Events',
  'Market And Data',
  'People Happiness',
  'Users Management/HR',
  'Marketing/branding',
  'Innovation(coding/infra)',
  'Content management',
];

const getStaffMetaPermissions = async (userId?: string): Promise<string[]> => {
  if (!userId) return [];
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { contentPreferences: true },
    });

    if (!profile?.contentPreferences) return [];
    const parsed = JSON.parse(profile.contentPreferences);
    return Array.isArray(parsed?.staffMeta?.permissions) ? parsed.staffMeta.permissions : [];
  } catch {
    return [];
  }
};

const requireFinancePermission = async (
  req: Request,
  res: Response,
  permissions: string[]
): Promise<boolean> => {
  if (process.env.NODE_ENV === 'development') return false;
  if (req.user?.role === 'SUPER_ADMIN') return false;

  const delegatedPermissions = await getStaffMetaPermissions(req.user?.id);
  const allowed = permissions.some(permission => delegatedPermissions.includes(permission));

  if (!allowed) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: `Missing required permission. Need one of: ${permissions.join(', ')}`,
    });
    return true;
  }

  return false;
};

const getRangeStartDate = (range: string): Date => {
  const now = new Date();
  const rangeMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = rangeMap[range] || 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};
export const cmsService = new CMSService(prisma, logger);

export {
  authMiddleware,
  requireAdmin,
  ALL_PERMISSIONS,
  getPermissionCategories,
  DEFAULT_ROLES,
  customRoles,
  getStaffMetaPermissions,
  STAFF_DEPARTMENTS,
  requireFinancePermission,
  getRangeStartDate,
};
export { default as prisma } from '../../../lib/prisma';
export { financeService, canEmergencyUnpublish };
