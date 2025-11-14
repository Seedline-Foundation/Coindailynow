# 🔐 Delegation & Role-Based Access Control (RBAC) Implementation Plan

## 📋 Current State Analysis

### ✅ What's Already Implemented

1. **Database Schema (Backend)**
   - ✅ `UserRole` enum with: USER, CONTENT_ADMIN, MARKETING_ADMIN, TECH_ADMIN, SUPER_ADMIN
   - ✅ `AdminPermission` model for granular permissions
   - ✅ `AdminRole` model for role templates
   - ✅ `AuditLog` model for tracking all admin actions
   - ✅ User model has `role` field

2. **Authentication & Authorization**
   - ✅ JWT-based authentication
   - ✅ Super Admin login routes
   - ✅ Role-based middleware (`requireRole`)
   - ✅ Admin management UI (`/super-admin/admins`)
   - ✅ Role templates with permission structures

3. **Finance Module**
   - ⚠️ **NOT YET IMPLEMENTED** - Only documented in `finance.md`
   - No wallet system in database
   - No "We" wallet for super admin
   - No payment/transfer tracking

### ❌ What's Missing

1. **Delegation System**
   - ❌ No delegated permissions tracking
   - ❌ No permission assignment UI when creating admins
   - ❌ No granular feature delegation (beyond role templates)
   - ❌ No ability to delegate specific features to individual admins

2. **Hierarchical Access Control**
   - ❌ No enforcement of "super admin can access all admin accounts"
   - ❌ No restriction preventing admins from accessing super admin accounts
   - ❌ No hierarchy enforcement in APIs

3. **Finance/Wallet System**
   - ❌ No "We" wallet exclusive to super admin
   - ❌ No wallet delegation features
   - ❌ No payment/transfer delegation system

---

## 🎯 Implementation Plan

### **Phase 1: Enhanced Delegation System**

#### 1.1 Database Schema Enhancements

**New Model: `DelegatedPermission`**
```prisma
model DelegatedPermission {
  id                String   @id @default(cuid())
  delegatedBy       String   // Super admin who delegated
  delegatedTo       String   // Admin receiving the permission
  feature           String   // Feature name (e.g., "publish_news", "manage_users", "query_we_wallet")
  actions           String   // JSON array: ["create", "read", "update", "delete", "execute"]
  scope             String?  // JSON object for scope restrictions (e.g., specific categories, user tiers)
  expiresAt         DateTime? // Optional expiration
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  delegator         User     @relation("DelegatorPermissions", fields: [delegatedBy], references: [id], onDelete: Cascade)
  delegate          User     @relation("DelegatePermissions", fields: [delegatedTo], references: [id], onDelete: Cascade)
  
  @@unique([delegatedTo, feature])
  @@index([delegatedTo, isActive])
  @@index([delegatedBy])
  @@index([feature])
}
```

**New Model: `Wallet` (Finance Module)**
```prisma
model Wallet {
  id                String   @id @default(cuid())
  userId            String   @unique
  walletType        WalletType @default(USER) // USER, ADMIN, SUPER_ADMIN, WE_WALLET
  balance           Decimal  @default(0) @db.Decimal(20, 8)
  lockedBalance     Decimal  @default(0) @db.Decimal(20, 8)
  currency          String   @default("TOKEN")
  isLocked          Boolean  @default(false)
  lockedReason      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactionsFrom  WalletTransaction[] @relation("FromWallet")
  transactionsTo    WalletTransaction[] @relation("ToWallet")
  
  @@index([userId])
  @@index([walletType])
  @@index([isLocked])
}

enum WalletType {
  USER
  ADMIN
  SUPER_ADMIN
  WE_WALLET
}

model WalletTransaction {
  id                String   @id @default(cuid())
  fromWalletId      String?
  toWalletId        String?
  amount            Decimal  @db.Decimal(20, 8)
  type              TransactionType
  status            TransactionStatus @default(PENDING)
  description       String?
  metadata          String?  // JSON: OTP verification, approval chain, etc.
  initiatedBy       String   // User who initiated transaction
  approvedBy        String?  // For "We" wallet transactions
  otpVerified       Boolean  @default(false)
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime @default(now())
  completedAt       DateTime?
  
  fromWallet        Wallet?  @relation("FromWallet", fields: [fromWalletId], references: [id])
  toWallet          Wallet?  @relation("ToWallet", fields: [toWalletId], references: [id])
  initiator         User     @relation("InitiatedTransactions", fields: [initiatedBy], references: [id])
  approver          User?    @relation("ApprovedTransactions", fields: [approvedBy], references: [id])
  
  @@index([fromWalletId, createdAt])
  @@index([toWalletId, createdAt])
  @@index([initiatedBy])
  @@index([status, createdAt])
  @@index([type])
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER
  PAYMENT
  REFUND
  BONUS
  STAKING
  CONVERSION
  AIRDROP
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REQUIRES_APPROVAL
}
```

**Update User Model**
```prisma
model User {
  // ... existing fields ...
  
  // Add new relations
  Wallet                    Wallet?
  DelegatedPermissionsFrom  DelegatedPermission[] @relation("DelegatorPermissions")
  DelegatedPermissionsTo    DelegatedPermission[] @relation("DelegatePermissions")
  InitiatedTransactions     WalletTransaction[] @relation("InitiatedTransactions")
  ApprovedTransactions      WalletTransaction[] @relation("ApprovedTransactions")
}
```

#### 1.2 Permission Feature Registry

**File: `backend/src/constants/permissions.ts`**
```typescript
export const PERMISSION_FEATURES = {
  // User Management
  USER_CREATE: 'user_create',
  USER_READ: 'user_read',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_BAN: 'user_ban',
  USER_ROLE_CHANGE: 'user_role_change',
  
  // Content Management
  CONTENT_CREATE: 'content_create',
  CONTENT_READ: 'content_read',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
  CONTENT_PUBLISH: 'content_publish',
  CONTENT_MODERATE: 'content_moderate',
  
  // Finance - Super Admin Only by Default
  FINANCE_WE_WALLET_VIEW: 'finance_we_wallet_view',
  FINANCE_WE_WALLET_TRANSFER: 'finance_we_wallet_transfer',
  FINANCE_QUERY_WALLETS: 'finance_query_wallets',
  FINANCE_TRACE_PAYMENTS: 'finance_trace_payments',
  FINANCE_HANDLE_ERRORS: 'finance_handle_errors',
  FINANCE_USER_AUDIT: 'finance_user_audit',
  FINANCE_TRANSFER_TO_USERS: 'finance_transfer_to_users',
  
  // System
  SYSTEM_CONFIGURE: 'system_configure',
  SYSTEM_MONITOR: 'system_monitor',
  SYSTEM_BACKUP: 'system_backup',
  
  // AI Management
  AI_CONFIGURE: 'ai_configure',
  AI_MONITOR: 'ai_monitor',
  AI_MANAGE: 'ai_manage',
} as const;

export type PermissionFeature = typeof PERMISSION_FEATURES[keyof typeof PERMISSION_FEATURES];

export const SUPER_ADMIN_EXCLUSIVE_FEATURES = [
  PERMISSION_FEATURES.FINANCE_WE_WALLET_VIEW,
  PERMISSION_FEATURES.FINANCE_WE_WALLET_TRANSFER,
  // Can be delegated but only by super admin
];

export const DELEGATABLE_FEATURES = [
  PERMISSION_FEATURES.FINANCE_QUERY_WALLETS,
  PERMISSION_FEATURES.FINANCE_TRACE_PAYMENTS,
  PERMISSION_FEATURES.FINANCE_HANDLE_ERRORS,
  PERMISSION_FEATURES.FINANCE_USER_AUDIT,
  PERMISSION_FEATURES.FINANCE_TRANSFER_TO_USERS,
  PERMISSION_FEATURES.CONTENT_PUBLISH,
  PERMISSION_FEATURES.USER_BAN,
  // All features except "We" wallet operations
];

export interface DelegatableFeature {
  id: PermissionFeature;
  name: string;
  description: string;
  category: 'user' | 'content' | 'finance' | 'system' | 'ai';
  requiresSuperAdmin: boolean;
  delegatable: boolean;
  actions: string[]; // ['create', 'read', 'update', 'delete', 'execute']
}

export const FEATURE_DEFINITIONS: Record<PermissionFeature, DelegatableFeature> = {
  [PERMISSION_FEATURES.CONTENT_PUBLISH]: {
    id: PERMISSION_FEATURES.CONTENT_PUBLISH,
    name: 'Publish Content',
    description: 'Ability to publish articles and news',
    category: 'content',
    requiresSuperAdmin: false,
    delegatable: true,
    actions: ['execute']
  },
  [PERMISSION_FEATURES.FINANCE_WE_WALLET_VIEW]: {
    id: PERMISSION_FEATURES.FINANCE_WE_WALLET_VIEW,
    name: 'View We Wallet',
    description: 'View central "We" wallet balance and transactions',
    category: 'finance',
    requiresSuperAdmin: true,
    delegatable: true,
    actions: ['read']
  },
  [PERMISSION_FEATURES.FINANCE_QUERY_WALLETS]: {
    id: PERMISSION_FEATURES.FINANCE_QUERY_WALLETS,
    name: 'Query User Wallets',
    description: 'Search and query all user wallet balances',
    category: 'finance',
    requiresSuperAdmin: false,
    delegatable: true,
    actions: ['read']
  },
  // ... all other features
};
```

#### 1.3 Permission Service

**File: `backend/src/services/permissionService.ts`**
```typescript
import { PrismaClient } from '@prisma/client';
import { PERMISSION_FEATURES, FEATURE_DEFINITIONS, PermissionFeature } from '../constants/permissions';

export class PermissionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if user has permission for a specific feature
   */
  async hasPermission(
    userId: string, 
    feature: PermissionFeature, 
    action: string = 'execute'
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return false;

    // Super Admin has all permissions
    if (user.role === 'SUPER_ADMIN') return true;

    // Check delegated permissions
    const delegated = await this.prisma.delegatedPermission.findFirst({
      where: {
        delegatedTo: userId,
        feature,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (delegated) {
      const actions = JSON.parse(delegated.actions) as string[];
      return actions.includes(action);
    }

    // Check role-based permissions (from AdminPermission model)
    const adminPermission = await this.prisma.adminPermission.findFirst({
      where: {
        adminId: userId,
        resource: FEATURE_DEFINITIONS[feature].category
      }
    });

    if (adminPermission) {
      const actions = JSON.parse(adminPermission.actions) as string[];
      return actions.includes(action);
    }

    return false;
  }

  /**
   * Delegate a permission from super admin to admin
   */
  async delegatePermission(params: {
    superAdminId: string;
    adminId: string;
    feature: PermissionFeature;
    actions: string[];
    expiresAt?: Date;
    scope?: Record<string, any>;
  }) {
    // Verify delegator is super admin
    const delegator = await this.prisma.user.findUnique({
      where: { id: params.superAdminId },
      select: { role: true }
    });

    if (delegator?.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admins can delegate permissions');
    }

    // Verify delegate is an admin
    const delegate = await this.prisma.user.findUnique({
      where: { id: params.adminId },
      select: { role: true }
    });

    const adminRoles = ['CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN'];
    if (!delegate || !adminRoles.includes(delegate.role)) {
      throw new Error('Can only delegate to admin users');
    }

    // Check if feature is delegatable
    const featureDef = FEATURE_DEFINITIONS[params.feature];
    if (!featureDef.delegatable) {
      throw new Error(`Feature ${params.feature} is not delegatable`);
    }

    // Create or update delegation
    return await this.prisma.delegatedPermission.upsert({
      where: {
        delegatedTo_feature: {
          delegatedTo: params.adminId,
          feature: params.feature
        }
      },
      update: {
        actions: JSON.stringify(params.actions),
        scope: params.scope ? JSON.stringify(params.scope) : null,
        expiresAt: params.expiresAt,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        delegatedBy: params.superAdminId,
        delegatedTo: params.adminId,
        feature: params.feature,
        actions: JSON.stringify(params.actions),
        scope: params.scope ? JSON.stringify(params.scope) : null,
        expiresAt: params.expiresAt,
        isActive: true
      }
    });
  }

  /**
   * Revoke a delegated permission
   */
  async revokeDelegation(superAdminId: string, delegationId: string) {
    const delegation = await this.prisma.delegatedPermission.findUnique({
      where: { id: delegationId }
    });

    if (!delegation) {
      throw new Error('Delegation not found');
    }

    if (delegation.delegatedBy !== superAdminId) {
      throw new Error('Can only revoke permissions you delegated');
    }

    return await this.prisma.delegatedPermission.update({
      where: { id: delegationId },
      data: { isActive: false }
    });
  }

  /**
   * Get all delegated permissions for an admin
   */
  async getAdminDelegations(adminId: string) {
    return await this.prisma.delegatedPermission.findMany({
      where: {
        delegatedTo: adminId,
        isActive: true
      },
      include: {
        delegator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
  }
}
```

#### 1.4 Hierarchical Access Middleware

**File: `backend/src/middleware/hierarchicalAccess.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Enforce hierarchical access control
 * Super Admin > Admin > User
 */
export const enforceHierarchy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Get target user from request (if accessing another user's data)
  const targetUserId = req.params.userId || req.body.userId || req.query.userId;

  if (!targetUserId) {
    next();
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId as string },
    select: { role: true }
  });

  if (!targetUser) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  const currentUserRole = req.user.role;
  const targetUserRole = targetUser.role;

  // Define role hierarchy
  const roleHierarchy = {
    SUPER_ADMIN: 5,
    TECH_ADMIN: 4,
    MARKETING_ADMIN: 3,
    CONTENT_ADMIN: 2,
    USER: 1
  };

  const currentLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy] || 0;
  const targetLevel = roleHierarchy[targetUserRole as keyof typeof roleHierarchy] || 0;

  // Admins cannot access super admin accounts
  if (targetUserRole === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
    res.status(403).json({ 
      error: 'Forbidden: Cannot access super admin accounts',
      details: 'Only super admins can access other super admin accounts'
    });
    return;
  }

  // Higher roles can access lower roles
  if (currentLevel < targetLevel) {
    res.status(403).json({ 
      error: 'Forbidden: Insufficient hierarchy level',
      details: 'You can only access accounts at or below your role level'
    });
    return;
  }

  next();
};

/**
 * Require permission for specific feature
 */
export const requirePermission = (feature: string, action: string = 'execute') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { PermissionService } = await import('../services/permissionService');
    const permissionService = new PermissionService(prisma);

    const hasPermission = await permissionService.hasPermission(
      req.user.id,
      feature,
      action
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden: Insufficient permissions',
        details: `Required permission: ${feature} (${action})`
      });
      return;
    }

    next();
  };
};
```

### **Phase 2: Admin Creation with Permission Assignment**

#### 2.1 Enhanced Admin Creation API

**File: `frontend/src/app/api/super-admin/admins/route.ts`**
```typescript
// Add to POST handler
export async function POST(request: NextRequest) {
  // ... existing authentication checks ...

  const body = await request.json();
  const {
    username,
    email,
    firstName,
    lastName,
    role,
    password,
    delegatedPermissions = [] // NEW: Array of permission features to delegate
  } = body;

  // ... create admin user ...

  // Delegate permissions if specified
  if (delegatedPermissions.length > 0) {
    const permissionService = new PermissionService(prisma);
    
    for (const permission of delegatedPermissions) {
      await permissionService.delegatePermission({
        superAdminId: decoded.userId,
        adminId: newAdmin.id,
        feature: permission.feature,
        actions: permission.actions,
        expiresAt: permission.expiresAt,
        scope: permission.scope
      });
    }
  }

  // Log admin creation in audit log
  await prisma.auditLog.create({
    data: {
      adminId: decoded.userId,
      action: 'CREATE_ADMIN',
      resource: 'admin',
      resourceId: newAdmin.id,
      details: JSON.stringify({
        username,
        email,
        role,
        delegatedPermissions: delegatedPermissions.map(p => p.feature)
      }),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: 'success'
    }
  });

  return NextResponse.json({ success: true, admin: newAdmin });
}
```

#### 2.2 Permission Assignment UI Component

**File: `frontend/src/components/super-admin/PermissionSelector.tsx`**
```tsx
'use client';

import React, { useState } from 'react';
import { Shield, Check } from 'lucide-react';

interface Permission {
  feature: string;
  name: string;
  description: string;
  category: string;
  actions: string[];
}

interface PermissionSelectorProps {
  availablePermissions: Permission[];
  selectedPermissions: Array<{ feature: string; actions: string[] }>;
  onChange: (permissions: Array<{ feature: string; actions: string[] }>) => void;
}

export default function PermissionSelector({
  availablePermissions,
  selectedPermissions,
  onChange
}: PermissionSelectorProps) {
  const categories = [...new Set(availablePermissions.map(p => p.category))];

  const togglePermission = (feature: string, action: string) => {
    const existing = selectedPermissions.find(p => p.feature === feature);
    
    if (existing) {
      if (existing.actions.includes(action)) {
        // Remove action
        const newActions = existing.actions.filter(a => a !== action);
        if (newActions.length === 0) {
          // Remove entire permission
          onChange(selectedPermissions.filter(p => p.feature !== feature));
        } else {
          onChange(selectedPermissions.map(p =>
            p.feature === feature ? { ...p, actions: newActions } : p
          ));
        }
      } else {
        // Add action
        onChange(selectedPermissions.map(p =>
          p.feature === feature ? { ...p, actions: [...p.actions, action] } : p
        ));
      }
    } else {
      // Add new permission
      onChange([...selectedPermissions, { feature, actions: [action] }]);
    }
  };

  const isActionSelected = (feature: string, action: string) => {
    const permission = selectedPermissions.find(p => p.feature === feature);
    return permission?.actions.includes(action) || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Shield className="w-4 h-4" />
        <span>Select permissions to delegate to this admin</span>
      </div>

      {categories.map(category => (
        <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize">
            {category} Permissions
          </h3>
          
          <div className="space-y-3">
            {availablePermissions
              .filter(p => p.category === category)
              .map(permission => (
                <div key={permission.feature} className="border-l-2 border-blue-500 pl-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {permission.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {permission.description}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {permission.actions.map(action => (
                      <button
                        key={action}
                        onClick={() => togglePermission(permission.feature, action)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isActionSelected(permission.feature, action)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {isActionSelected(permission.feature, action) && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 2.3 Update Create Admin Modal

**File: `frontend/src/app/super-admin/admins/page.tsx` - Modify CreateAdminModal**
```tsx
// Add new state
const [delegatedPermissions, setDelegatedPermissions] = useState<Array<{
  feature: string;
  actions: string[];
}>>([]);

// Add PermissionSelector to the modal
<div className="mt-6">
  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
    Delegate Permissions
  </h3>
  <PermissionSelector
    availablePermissions={DELEGATABLE_FEATURES}
    selectedPermissions={delegatedPermissions}
    onChange={setDelegatedPermissions}
  />
</div>

// Include in form submission
body: JSON.stringify({
  ...formData,
  delegatedPermissions
})
```

### **Phase 3: Finance Module - Wallet System**

#### 3.1 Wallet Service

**File: `backend/src/services/walletService.ts`**
```typescript
import { PrismaClient, WalletType, TransactionType, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class WalletService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create wallet for user (automatic on registration)
   */
  async createWallet(userId: string, walletType: WalletType = 'USER') {
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });

    if (existingWallet) {
      throw new Error('Wallet already exists for this user');
    }

    return await this.prisma.wallet.create({
      data: {
        userId,
        walletType,
        balance: new Decimal(0),
        lockedBalance: new Decimal(0)
      }
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      availableBalance: wallet.balance.minus(wallet.lockedBalance)
    };
  }

  /**
   * Create "We" wallet (super admin only)
   */
  async createWeWallet(superAdminId: string) {
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
      select: { role: true }
    });

    if (superAdmin?.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admin can create We wallet');
    }

    // Check if We wallet already exists
    const existingWeWallet = await this.prisma.wallet.findFirst({
      where: { walletType: 'WE_WALLET' }
    });

    if (existingWeWallet) {
      return existingWeWallet;
    }

    return await this.prisma.wallet.create({
      data: {
        userId: superAdminId,
        walletType: 'WE_WALLET',
        balance: new Decimal(0),
        lockedBalance: new Decimal(0)
      }
    });
  }

  /**
   * Transfer between wallets
   */
  async transfer(params: {
    fromUserId: string;
    toUserId: string;
    amount: string;
    description?: string;
    initiatedBy: string;
    requiresOTP?: boolean;
    otpCode?: string;
  }) {
    const amount = new Decimal(params.amount);

    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Amount must be greater than 0');
    }

    // Get wallets
    const fromWallet = await this.prisma.wallet.findUnique({
      where: { userId: params.fromUserId }
    });

    const toWallet = await this.prisma.wallet.findUnique({
      where: { userId: params.toUserId }
    });

    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found');
    }

    // Check if from wallet is locked
    if (fromWallet.isLocked) {
      throw new Error(`Source wallet is locked: ${fromWallet.lockedReason}`);
    }

    // Check balance
    const availableBalance = fromWallet.balance.minus(fromWallet.lockedBalance);
    if (availableBalance.lessThan(amount)) {
      throw new Error('Insufficient balance');
    }

    // OTP verification for sensitive operations
    if (params.requiresOTP && !params.otpCode) {
      throw new Error('OTP verification required');
    }

    // For "We" wallet transfers, require super admin approval
    const requiresApproval = fromWallet.walletType === 'WE_WALLET';

    // Create transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        amount,
        type: 'TRANSFER',
        status: requiresApproval ? 'REQUIRES_APPROVAL' : 'PROCESSING',
        description: params.description,
        initiatedBy: params.initiatedBy,
        otpVerified: !!params.otpCode,
        metadata: JSON.stringify({
          otpRequired: params.requiresOTP,
          requiresApproval
        })
      }
    });

    // If no approval required, complete transaction
    if (!requiresApproval) {
      await this.completeTransaction(transaction.id);
    }

    return transaction;
  }

  /**
   * Complete a transaction (update balances)
   */
  private async completeTransaction(transactionId: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: {
        fromWallet: true,
        toWallet: true
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'COMPLETED') {
      throw new Error('Transaction already completed');
    }

    // Update balances
    await this.prisma.$transaction([
      // Deduct from source wallet
      this.prisma.wallet.update({
        where: { id: transaction.fromWalletId! },
        data: {
          balance: {
            decrement: transaction.amount
          }
        }
      }),
      // Add to destination wallet
      this.prisma.wallet.update({
        where: { id: transaction.toWalletId! },
        data: {
          balance: {
            increment: transaction.amount
          }
        }
      }),
      // Update transaction status
      this.prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    ]);
  }

  /**
   * Query all wallets (delegatable permission)
   */
  async queryWallets(params: {
    userId?: string;
    walletType?: WalletType;
    minBalance?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.walletType) {
      where.walletType = params.walletType;
    }

    if (params.minBalance) {
      where.balance = {
        gte: new Decimal(params.minBalance)
      };
    }

    const page = params.page || 1;
    const limit = params.limit || 20;

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { balance: 'desc' }
      }),
      this.prisma.wallet.count({ where })
    ]);

    return {
      wallets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Trace payment history
   */
  async tracePayments(params: {
    userId?: string;
    transactionId?: string;
    type?: TransactionType;
    status?: TransactionStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (params.userId) {
      where.OR = [
        { fromWallet: { userId: params.userId } },
        { toWallet: { userId: params.userId } }
      ];
    }

    if (params.transactionId) {
      where.id = params.transactionId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const page = params.page || 1;
    const limit = params.limit || 50;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: {
          fromWallet: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          },
          toWallet: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          },
          initiator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.walletTransaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
}
```

#### 3.2 Finance API Routes

**File: `frontend/src/app/api/super-admin/finance/wallets/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { WalletService } from '@/backend/src/services/walletService';
import { PermissionService } from '@/backend/src/services/permissionService';
import { PERMISSION_FEATURES } from '@/backend/src/constants/permissions';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check permission (delegatable)
    const permissionService = new PermissionService(prisma);
    const hasPermission = await permissionService.hasPermission(
      decoded.userId,
      PERMISSION_FEATURES.FINANCE_QUERY_WALLETS,
      'read'
    );

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Forbidden: Insufficient permissions',
        required: 'finance_query_wallets'
      }, { status: 403 });
    }

    // Query wallets
    const searchParams = request.nextUrl.searchParams;
    const walletService = new WalletService(prisma);
    
    const result = await walletService.queryWallets({
      userId: searchParams.get('userId') || undefined,
      walletType: searchParams.get('walletType') as any,
      minBalance: searchParams.get('minBalance') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: decoded.userId,
        action: 'QUERY_WALLETS',
        resource: 'finance',
        details: JSON.stringify({ params: Object.fromEntries(searchParams) }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success'
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**File: `frontend/src/app/api/super-admin/finance/we-wallet/route.ts`**
```typescript
// We Wallet - Super Admin Exclusive (can be delegated)
export async function GET(request: NextRequest) {
  // Similar structure but check FINANCE_WE_WALLET_VIEW permission
  // Only super admin has this by default, but can delegate
}
```

---

## 📊 Implementation Summary

### What Will Be Implemented:

1. ✅ **Database Schema Updates**
   - DelegatedPermission model
   - Wallet model
   - WalletTransaction model
   - New enums (WalletType, TransactionType, TransactionStatus)

2. ✅ **Permission System**
   - Feature registry with all delegatable features
   - Permission service for checking/delegating permissions
   - Hierarchical access middleware
   - Super admin > Admin > User enforcement

3. ✅ **Admin Management Enhancements**
   - Permission selector UI component
   - Delegation during admin creation
   - View/edit delegated permissions
   - Permission revocation

4. ✅ **Finance Module**
   - Wallet creation for all users
   - "We" wallet (super admin exclusive)
   - Wallet transfers with OTP
   - Payment tracing (delegatable)
   - Wallet querying (delegatable)
   - Transaction history

5. ✅ **APIs**
   - `/api/super-admin/permissions/delegate` - Delegate permission
   - `/api/super-admin/permissions/revoke` - Revoke delegation
   - `/api/super-admin/finance/wallets` - Query wallets
   - `/api/super-admin/finance/we-wallet` - We wallet operations
   - `/api/super-admin/finance/transactions` - Trace payments
   - `/api/super-admin/finance/transfer` - Transfer funds

6. ✅ **Security Features**
   - Hierarchical access enforcement
   - Permission-based API protection
   - Audit logging for all actions
   - OTP verification for sensitive operations
   - "We" wallet exclusive to super admin (delegatable with restrictions)

### Key Features:

- **Delegation**: Super admin can delegate any delegatable feature to admins
- **Hierarchy**: Super admin can access all accounts, admins cannot access super admin
- **Finance**: "We" wallet exclusive to super admin, other finance features delegatable
- **Audit**: All actions tracked in AuditLog
- **Flexible**: Permissions can be time-limited and scoped
- **Secure**: OTP verification, IP tracking, hierarchical enforcement

---

## 🚀 Next Steps

**For Your Review:**

1. ✅ Review this implementation plan
2. ✅ Confirm the delegation approach
3. ✅ Approve the finance module design
4. ✅ Verify the hierarchy enforcement logic

**After Approval:**

1. Update database schema
2. Run migrations
3. Implement services and middleware
4. Create UI components
5. Build API routes
6. Write tests
7. Update documentation

**Estimated Time:**
- Database & Backend: 8-12 hours
- Frontend UI: 6-8 hours
- Testing & Documentation: 4-6 hours
- **Total: 18-26 hours**

---

## ⚠️ Important Notes

1. **Database Migration**: Will require running migrations - existing data will be preserved
2. **Breaking Changes**: None - this is additive functionality
3. **Testing**: Comprehensive testing required before production deployment
4. **Security**: All finance operations will be logged and require proper authentication
5. **"We" Wallet**: Will be created automatically when super admin first accesses finance module

---

**READY FOR YOUR APPROVAL** ✅

Please review and confirm if this implementation plan aligns with your requirements!
