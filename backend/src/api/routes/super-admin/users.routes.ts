import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  requireAdmin,
  prisma,
  cmsService,
  financeService,
  canEmergencyUnpublish,
  requireFinancePermission,
  getRangeStartDate,
  DEFAULT_ROLES,
  customRoles,
  getStaffMetaPermissions,
  STAFF_DEPARTMENTS,
  ALL_PERMISSIONS,
  getPermissionCategories,
} from './shared';
import { validateBody } from '../../../middleware/validate';
import {
  superAdminCreateUserSchema,
  patchUserSchema,
} from '../../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';
    const status = (req.query.status as string) || '';
    const department = (req.query.department as string) || '';
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'all') where.role = role.toUpperCase();
    if (status && status !== 'all') where.status = status.toUpperCase();

    const userSelect = {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      subscriptionTier: true,
      avatarUrl: true,
      location: true,
      createdAt: true,
      lastLoginAt: true,
      UserProfile: {
        select: {
          contentPreferences: true,
        }
      }
    } as const;

    const mapUser = (u: any) => ({
      ...u,
      department: (() => {
        try {
          const parsed = u.UserProfile?.contentPreferences ? JSON.parse(u.UserProfile.contentPreferences) : {};
          return parsed?.staffMeta?.department || 'Unassigned';
        } catch {
          return 'Unassigned';
        }
      })(),
      roles: (() => {
        try {
          const parsed = u.UserProfile?.contentPreferences ? JSON.parse(u.UserProfile.contentPreferences) : {};
          return Array.isArray(parsed?.staffMeta?.roles) && parsed.staffMeta.roles.length > 0
            ? parsed.staffMeta.roles
            : [u.role];
        } catch {
          return [u.role];
        }
      })(),
      delegatedPermissions: (() => {
        try {
          const parsed = u.UserProfile?.contentPreferences ? JSON.parse(u.UserProfile.contentPreferences) : {};
          return Array.isArray(parsed?.staffMeta?.permissions) ? parsed.staffMeta.permissions : [];
        } catch {
          return [];
        }
      })(),
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username,
      isPremium: u.subscriptionTier === 'PREMIUM' || u.subscriptionTier === 'ENTERPRISE',
      joinedAt: u.createdAt,
      country: u.location || 'Unknown',
    });

    if (department && department !== 'all') {
      const allUsers = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      });

      const mappedUsers = allUsers.map(mapUser);
      const filteredByDepartment = mappedUsers.filter(
        (user) => (user.department || '').toLowerCase() === department.toLowerCase()
      );
      const pagedUsers = filteredByDepartment.slice(offset, offset + limit);

      res.json({
        success: true,
        users: pagedUsers,
        total: filteredByDepartment.length,
        pagination: {
          page,
          limit,
          total: filteredByDepartment.length,
          totalPages: Math.ceil(filteredByDepartment.length / limit)
        }
      });
      return;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      users: users.map(mapUser),
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/alerts
 * Get system alerts from AI tasks and system events
 */

router.patch('/users/:id', authMiddleware, validateBody(patchUserSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;
    const { status, role } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (role) updateData.role = role.toUpperCase();

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, username: true, role: true, status: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/super-admin/articles/:id
 * Update article status
 */

router.post('/users', authMiddleware, validateBody(superAdminCreateUserSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { email, username, firstName, lastName, password, role, roles, department, permissions, subscriptionTier } = req.body;

    if (!email || !username || !password) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email, username, and password are required'
      });
      return;
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email or username already exists'
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const selectedRoles = Array.isArray(roles)
      ? roles.filter((r: unknown): r is string => typeof r === 'string' && r.trim().length > 0)
      : [];
    const primaryRole = (selectedRoles[0] || role || 'USER').toUpperCase();
    const validRoleValues = ['USER', 'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN', 'SUPER_ADMIN'];
    if (!validRoleValues.includes(primaryRole)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role supplied'
      });
      return;
    }

    if (department && !STAFF_DEPARTMENTS.includes(department)) {
      res.status(400).json({
        success: false,
        error: 'Invalid department supplied'
      });
      return;
    }

    const validPermissionKeys = new Set(ALL_PERMISSIONS.map(p => p.key));
    const selectedPermissions = Array.isArray(permissions)
      ? permissions.filter((p: unknown): p is string => typeof p === 'string' && validPermissionKeys.has(p))
      : [];

    // Create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: primaryRole as any,
        subscriptionTier: (subscriptionTier || 'FREE').toUpperCase(),
        status: 'ACTIVE',
        emailVerified: true, // Admin-created accounts are pre-verified
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        subscriptionTier: true,
        createdAt: true,
      }
    });

    // Create user profile
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        notificationPreferences: JSON.stringify({ email: true, push: true }),
        privacySettings: JSON.stringify({ profileVisibility: 'PUBLIC' }),
        contentPreferences: JSON.stringify({
          categories: [],
          languages: ['en'],
          staffMeta: {
            department: department || null,
            roles: selectedRoles.length > 0 ? selectedRoles.map(r => r.toUpperCase()) : [primaryRole],
            permissions: selectedPermissions,
            assignedBy: req.user?.id || 'system',
            assignedAt: new Date().toISOString(),
          }
        }),
        updatedAt: new Date(),
      }
    }).catch(() => {}); // Profile creation is non-critical

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

router.post('/users/:id/revoke-sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    const { id } = req.params;
    const { authService: authSvc } = await import('../../../services/authService');
    await authSvc.revokeAllUserTokens(id);
    await prisma.session.updateMany({ where: { userId: id }, data: { isActive: false } });
    res.json({ success: true, message: 'All sessions revoked for user' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
