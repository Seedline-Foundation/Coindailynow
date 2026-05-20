import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────
// Shared enums / helpers
// ────────────────────────────────────────────────────────────────────

const userRoleEnum = z.enum([
  'USER',
  'ADMIN',
  'CONTENT_ADMIN',
  'MARKETING_ADMIN',
  'TECH_ADMIN',
  'SUPER_ADMIN',
]);

const articleStatusEnum = z.enum([
  'DRAFT',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED',
  'PENDING_REVIEW',
  'UNDER_REVIEW',
  'REJECTED',
]);

const userStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'BANNED',
  'DELETED',
]);

const uuid = z.string().uuid();

// ────────────────────────────────────────────────────────────────────
// articles.routes.ts
// ────────────────────────────────────────────────────────────────────

export const emergencyUnpublishSchema = z.object({
  reason: z.string().min(3).max(500).optional(),
});

export const patchArticleSchema = z.object({
  status: articleStatusEnum.optional(),
});

// ────────────────────────────────────────────────────────────────────
// users.routes.ts
// ────────────────────────────────────────────────────────────────────

export const revokeSessionsParamsSchema = z.object({
  id: z.string().min(1),
});

/** POST /api/super-admin/users — admin user creation */
export const superAdminCreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(64),
  password: z.string().min(8).max(200),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.string().optional(),
  roles: z.array(z.string()).optional(),
  department: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  subscriptionTier: z.string().optional(),
});

/** PATCH /api/super-admin/users/:id — update user status/role */
export const patchUserSchema = z.object({
  status: userStatusEnum.optional(),
  role: userRoleEnum.optional(),
});

// ────────────────────────────────────────────────────────────────────
// panel.routes.ts
// ────────────────────────────────────────────────────────────────────

/** PATCH /api/super-admin/panel-settings/:page */
export const patchPanelSettingsSchema = z.object({
  platformName: z.string().max(200).optional(),
  platformDescription: z.string().max(1000).optional(),
  maintenanceMode: z.union([z.boolean(), z.string()]).optional(),
  itemsPerPage: z.union([z.number().int().min(1).max(200), z.string()]).optional(),
  sessionTimeout: z.union([z.number().int().min(1).max(86400), z.string()]).optional(),
  maxLoginAttempts: z.union([z.number().int().min(1).max(100), z.string()]).optional(),
  enforce2FA: z.union([z.boolean(), z.string()]).optional(),
  passwordMinLength: z.union([z.number().int().min(4).max(128), z.string()]).optional(),
  backendUrl: z.string().max(500).optional(),
  rateLimitPerMinute: z.union([z.number().int().min(1).max(100000), z.string()]).optional(),
  allowedOrigins: z.union([z.string().max(2000), z.array(z.string().max(500))]).optional(),
  apiVersion: z.string().max(20).optional(),
  defaultLanguage: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
  dateFormat: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
});

/** PUT /api/super-admin/config — save platform-wide configuration */
export const putPlatformConfigSchema = z.record(
  z.string().max(100),
  z.union([
    z.string().max(5000),
    z.number(),
    z.boolean(),
    z.record(z.string(), z.unknown()),
    z.array(z.unknown()),
  ]),
).refine((obj) => Object.keys(obj).length <= 200, {
  message: 'Config object must not exceed 200 top-level keys',
});

// ────────────────────────────────────────────────────────────────────
// content.routes.ts
// ────────────────────────────────────────────────────────────────────

/** POST /api/super-admin/content/categories */
export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  parentId: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
});

/** PUT /api/super-admin/content/categories/:id */
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  parentId: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
});

/** POST /api/super-admin/content/moderation/review */
export const moderationReviewSchema = z.object({
  itemId: z.string().min(1).max(200),
  action: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(2000).optional(),
});

/** POST /api/super-admin/content/ai/generate */
export const aiGenerateContentSchema = z.object({
  topic: z.string().min(1).max(500),
  category: z.string().max(200).optional(),
  tone: z.string().max(50).optional(),
  targetLength: z.number().int().min(50).max(50000).optional(),
  language: z.string().max(10).optional(),
});

// ────────────────────────────────────────────────────────────────────
// ai.routes.ts
// ────────────────────────────────────────────────────────────────────

/** POST /api/super-admin/ai/pipeline/toggle */
export const aiPipelineToggleSchema = z.object({
  enabled: z.boolean(),
});

// ────────────────────────────────────────────────────────────────────
// daily-tasks.routes.ts
// ────────────────────────────────────────────────────────────────────

/** PUT /api/super-admin/daily-tasks/templates */
export const putDailyTaskTemplatesSchema = z.object({
  templates: z.unknown().refine((val) => val !== undefined && val !== null, {
    message: 'templates is required',
  }),
});

/** PUT /api/super-admin/daily-tasks/today */
export const putDailyTaskTodaySchema = z.object({
  log: z.unknown().refine((val) => val !== undefined && val !== null, {
    message: 'log is required',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});

/** PUT /api/super-admin/daily-tasks/assign */
export const putDailyTaskAssignSchema = z.object({
  staffId: z.string().min(1).max(200),
  staffName: z.string().max(200).optional(),
  tasks: z.unknown().refine((val) => val !== undefined && val !== null, {
    message: 'tasks is required',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  assignedBy: z.string().max(200).optional(),
});

// ────────────────────────────────────────────────────────────────────
// monetization.routes.ts
// ────────────────────────────────────────────────────────────────────

/** POST /api/super-admin/monetization/disbursements/:requestId/approve */
export const approveDisbursementSchema = z.object({
  adminNotes: z.string().max(2000).optional(),
  txHash: z.string().max(200).optional(),
});

/** POST /api/super-admin/monetization/disbursements/:requestId/reject */
export const rejectDisbursementSchema = z.object({
  reason: z.string().min(1).max(2000),
  adminNotes: z.string().max(2000).optional(),
});

/** POST /api/super-admin/monetization/wallets/:walletId/lock */
export const lockWalletSchema = z.object({
  reason: z.string().min(1).max(2000),
});

// ────────────────────────────────────────────────────────────────────
// roles.routes.ts
// ────────────────────────────────────────────────────────────────────

/** POST /api/super-admin/roles */
export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().max(200).optional(),
  description: z.string().min(1).max(1000),
  permissions: z.array(z.string().max(200)).optional(),
});

/** PUT /api/super-admin/roles/:id */
export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  permissions: z.array(z.string().max(200)).optional(),
});
