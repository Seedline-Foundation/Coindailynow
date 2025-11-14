/**
 * Permission Service - Handles permission delegation, checking, and hierarchical access
 * 
 * This service manages:
 * - Permission delegation (Super Admin -> Admin -> User)
 * - Permission checking with role hierarchy
 * - Delegated permission CRUD operations
 * - Permission usage logging
 */

import { PrismaClient, UserRole } from '@prisma/client';
import {
  ALL_PERMISSIONS,
  SUPER_ADMIN_EXCLUSIVE,
  isDelegatable,
  requiresSuperAdmin,
  getPermissionDisplayName,
} from '../constants/permissions';

const prisma = new PrismaClient();

// ============================================================================
// ROLE HIERARCHY
// ============================================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  TECH_ADMIN: 3,
  MARKETING_ADMIN: 3,
  CONTENT_ADMIN: 3,
  USER: 1,
};

/**
 * Check if one role has higher privilege than another
 */
export function hasHigherRole(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Check if role is admin level (not regular user)
 */
export function isAdminRole(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= 3;
}

/**
 * Check if role is super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

// ============================================================================
// PERMISSION DELEGATION
// ============================================================================

interface DelegatePermissionInput {
  delegatedByUserId: string;      // Who is granting the permission
  delegatedToUserId: string;      // Who receives the permission
  permissionKey: string;          // Permission constant
  scope?: string;                 // ALL, SPECIFIC, LIMITED
  scopeData?: any;                // Additional scope restrictions
  constraints?: any;              // Limits (e.g., max users to create)
  reason?: string;                // Why this permission was delegated
  notes?: string;                 // Additional notes
  expiresAt?: Date;               // Optional expiration
}

/**
 * Delegate a permission from one user to another
 */
export async function delegatePermission(input: DelegatePermissionInput) {
  const {
    delegatedByUserId,
    delegatedToUserId,
    permissionKey,
    scope = 'ALL',
    scopeData,
    constraints,
    reason,
    notes,
    expiresAt,
  } = input;

  // 1. Validate permission key exists
  if (!Object.values(ALL_PERMISSIONS).includes(permissionKey as any)) {
    throw new Error(`Invalid permission key: ${permissionKey}`);
  }

  // 2. Get delegator user
  const delegator = await prisma.user.findUnique({
    where: { id: delegatedByUserId },
  });

  if (!delegator) {
    throw new Error('Delegator user not found');
  }

  // 3. Get delegatee user
  const delegatee = await prisma.user.findUnique({
    where: { id: delegatedToUserId },
  });

  if (!delegatee) {
    throw new Error('Delegatee user not found');
  }

  // 4. Check if permission is delegatable
  if (!isDelegatable(permissionKey)) {
    throw new Error(
      `Permission ${permissionKey} cannot be delegated (Super Admin exclusive)`
    );
  }

  // 5. Check if delegator has permission to delegate
  // Super Admin can delegate to anyone
  if (isSuperAdmin(delegator.role)) {
    // Super Admin can delegate to admins only (not to regular users for most permissions)
    if (!isAdminRole(delegatee.role) && delegatee.role !== UserRole.USER) {
      throw new Error('Super Admin can only delegate to admins or users');
    }
  } else if (isAdminRole(delegator.role)) {
    // Admins can only delegate to users (not to other admins)
    if (isAdminRole(delegatee.role)) {
      throw new Error('Admins cannot delegate to other admins');
    }

    // Admin must have the permission themselves (either directly or delegated)
    const hasPermission = await checkPermission(delegatedByUserId, permissionKey);
    if (!hasPermission) {
      throw new Error('You do not have this permission to delegate');
    }
  } else {
    throw new Error('Only admins can delegate permissions');
  }

  // 6. Check if permission already delegated (update if exists)
  const existing = await prisma.delegatedPermission.findUnique({
    where: {
      delegatedToUserId_permissionKey: {
        delegatedToUserId,
        permissionKey,
      },
    },
  });

  if (existing) {
    // Update existing delegation
    return await prisma.delegatedPermission.update({
      where: { id: existing.id },
      data: {
        scope,
        scopeData: scopeData ? JSON.stringify(scopeData) : null,
        constraints: constraints ? JSON.stringify(constraints) : null,
        reason: reason ?? null,
        notes: notes ?? null,
        expiresAt: expiresAt ?? null,
        delegatedByUserId, // Update delegator
        isActive: true,
        revokedAt: null,
        revokedBy: null,
        revokeReason: null,
      },
    });
  }

  // 7. Create new delegation
  return await prisma.delegatedPermission.create({
    data: {
      delegatedToUserId,
      delegatedByUserId,
      permissionKey,
      scope,
      scopeData: scopeData ? JSON.stringify(scopeData) : null,
      constraints: constraints ? JSON.stringify(constraints) : null,
      reason: reason ?? null,
      notes: notes ?? null,
      expiresAt: expiresAt ?? null,
      isActive: true,
    },
  });
}

/**
 * Revoke a delegated permission
 */
export async function revokePermission(
  permissionId: string,
  revokedByUserId: string,
  revokeReason?: string
) {
  const permission = await prisma.delegatedPermission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new Error('Permission not found');
  }

  // Only the delegator or a super admin can revoke
  const revoker = await prisma.user.findUnique({
    where: { id: revokedByUserId },
  });

  if (!revoker) {
    throw new Error('Revoker user not found');
  }

  if (
    !isSuperAdmin(revoker.role) &&
    permission.delegatedByUserId !== revokedByUserId
  ) {
    throw new Error('Only the delegator or super admin can revoke permissions');
  }

  return await prisma.delegatedPermission.update({
    where: { id: permissionId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedBy: revokedByUserId,
      revokeReason: revokeReason ?? null,
    },
  });
}

/**
 * Get all permissions delegated to a user
 */
export async function getUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      DelegatedPermissionsReceived: {
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          delegatedBy: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.DelegatedPermissionsReceived;
}

/**
 * Get all users who have been delegated a specific permission
 */
export async function getUsersWithPermission(permissionKey: string) {
  return await prisma.delegatedPermission.findMany({
    where: {
      permissionKey,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      delegatedTo: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
      delegatedBy: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if a user has a specific permission
 * Considers role hierarchy and delegated permissions
 */
export async function checkPermission(
  userId: string,
  permissionKey: string
): Promise<boolean> {
  // 1. Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  // 2. Super Admin has all permissions
  if (isSuperAdmin(user.role)) {
    return true;
  }

  // 3. Check if permission requires super admin
  if (requiresSuperAdmin(permissionKey)) {
    return false; // Only super admin can have these permissions
  }

  // 4. Check delegated permissions
  const delegatedPermission = await prisma.delegatedPermission.findFirst({
    where: {
      delegatedToUserId: userId,
      permissionKey,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  return !!delegatedPermission;
}

/**
 * Check multiple permissions (returns true if user has ALL permissions)
 */
export async function checkMultiplePermissions(
  userId: string,
  permissionKeys: string[]
): Promise<boolean> {
  const results = await Promise.all(
    permissionKeys.map((key) => checkPermission(userId, key))
  );
  return results.every((result) => result);
}

/**
 * Check if user has ANY of the permissions (OR logic)
 */
export async function checkAnyPermission(
  userId: string,
  permissionKeys: string[]
): Promise<boolean> {
  const results = await Promise.all(
    permissionKeys.map((key) => checkPermission(userId, key))
  );
  return results.some((result) => result);
}

/**
 * Get all permissions a user has (including role-based and delegated)
 */
export async function getAllUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      DelegatedPermissionsReceived: {
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  // Super Admin has all permissions
  if (isSuperAdmin(user.role)) {
    return Object.values(ALL_PERMISSIONS);
  }

  // Return delegated permissions
  return user.DelegatedPermissionsReceived.map((p) => p.permissionKey);
}

// ============================================================================
// PERMISSION USAGE LOGGING
// ============================================================================

interface LogPermissionUsageInput {
  userId: string;
  permissionKey: string;
  actionType: string;           // CREATE, UPDATE, DELETE, VIEW
  resourceType: string;         // USER, ARTICLE, WALLET, etc.
  resourceId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
  ipAddress: string;
  userAgent: string;
}

/**
 * Log permission usage for audit trail
 */
export async function logPermissionUsage(input: LogPermissionUsageInput) {
  const {
    userId,
    permissionKey,
    actionType,
    resourceType,
    resourceId,
    success,
    errorMessage,
    metadata,
    ipAddress,
    userAgent,
  } = input;

  return await prisma.permissionUsageLog.create({
    data: {
      userId,
      permissionKey,
      actionType,
      resourceType,
      resourceId: resourceId ?? null,
      success,
      errorMessage: errorMessage ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get permission usage logs for a user
 */
export async function getUserPermissionLogs(
  userId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    permissionKey?: string;
    limit?: number;
  }
) {
  const where: any = { userId };

  if (options?.startDate || options?.endDate) {
    where.timestamp = {};
    if (options.startDate) where.timestamp.gte = options.startDate;
    if (options.endDate) where.timestamp.lte = options.endDate;
  }

  if (options?.permissionKey) {
    where.permissionKey = options.permissionKey;
  }

  return await prisma.permissionUsageLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options?.limit || 100,
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk delegate permissions to multiple users
 */
export async function bulkDelegatePermissions(
  delegatedByUserId: string,
  delegations: Array<{
    delegatedToUserId: string;
    permissionKey: string;
    scope?: string;
    scopeData?: any;
    constraints?: any;
  }>
) {
  const results = await Promise.allSettled(
    delegations.map((delegation) =>
      delegatePermission({
        delegatedByUserId,
        ...delegation,
      })
    )
  );

  return {
    successful: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    results,
  };
}

/**
 * Revoke all permissions for a user
 */
export async function revokeAllUserPermissions(
  userId: string,
  revokedByUserId: string,
  revokeReason?: string
) {
  const permissions = await prisma.delegatedPermission.findMany({
    where: {
      delegatedToUserId: userId,
      isActive: true,
    },
  });

  return await Promise.all(
    permissions.map((p) => revokePermission(p.id, revokedByUserId, revokeReason))
  );
}

// ============================================================================
// PERMISSION STATISTICS
// ============================================================================

/**
 * Get permission delegation statistics
 */
export async function getPermissionStatistics() {
  const [
    totalDelegations,
    activeDelegations,
    revokedDelegations,
    expiredDelegations,
    usersWithPermissions,
  ] = await Promise.all([
    prisma.delegatedPermission.count(),
    prisma.delegatedPermission.count({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.delegatedPermission.count({
      where: { isActive: false },
    }),
    prisma.delegatedPermission.count({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() },
      },
    }),
    prisma.delegatedPermission.groupBy({
      by: ['delegatedToUserId'],
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
  ]);

  return {
    totalDelegations,
    activeDelegations,
    revokedDelegations,
    expiredDelegations,
    usersWithPermissions: usersWithPermissions.length,
  };
}

/**
 * Get most used permissions
 */
export async function getMostUsedPermissions(limit: number = 10) {
  const logs = await prisma.permissionUsageLog.groupBy({
    by: ['permissionKey'],
    _count: {
      permissionKey: true,
    },
    orderBy: {
      _count: {
        permissionKey: 'desc',
      },
    },
    take: limit,
  });

  return logs.map((log) => ({
    permissionKey: log.permissionKey,
    displayName: getPermissionDisplayName(log.permissionKey),
    usageCount: log._count.permissionKey,
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const PermissionService = {
  // Role hierarchy
  hasHigherRole,
  isAdminRole,
  isSuperAdmin,

  // Delegation
  delegatePermission,
  revokePermission,
  getUserPermissions,
  getUsersWithPermission,

  // Permission checking
  checkPermission,
  checkMultiplePermissions,
  checkAnyPermission,
  getAllUserPermissions,

  // Logging
  logPermissionUsage,
  getUserPermissionLogs,

  // Bulk operations
  bulkDelegatePermissions,
  revokeAllUserPermissions,

  // Statistics
  getPermissionStatistics,
  getMostUsedPermissions,
};

export default PermissionService;
