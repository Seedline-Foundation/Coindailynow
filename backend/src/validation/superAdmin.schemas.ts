import { z } from 'zod';

export const emergencyUnpublishSchema = z.object({
  reason: z.string().min(3).max(500).optional(),
});

export const revokeSessionsParamsSchema = z.object({
  id: z.string().min(1),
});

export const patchArticleSchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
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
