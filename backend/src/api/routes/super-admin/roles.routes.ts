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
  createRoleSchema,
  updateRoleSchema,
} from '../../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.get('/permissions', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    
    res.json({
      success: true,
      permissions: ALL_PERMISSIONS,
      categories: getPermissionCategories(),
      totalCount: ALL_PERMISSIONS.length,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/roles
 * Get all available admin roles with full permission data
 */
router.get('/roles', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const allRoles = [...DEFAULT_ROLES, ...customRoles].map(role => ({
      ...role,
      permissions: JSON.stringify(role.permissions),
      permissionCount: role.permissions.length,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    }));

    res.json(allRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * POST /api/super-admin/roles
 * Create a new admin role with granular permissions
 */
router.post('/roles', authMiddleware, validateBody(createRoleSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { name, displayName, description, permissions } = req.body;

    const permArray = Array.isArray(permissions) ? permissions : [];
    
    // Validate all permissions are valid keys
    const validKeys = new Set(ALL_PERMISSIONS.map(p => p.key));
    const invalidPerms = permArray.filter((p: string) => !validKeys.has(p));
    if (invalidPerms.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid permissions',
        message: `Unknown permissions: ${invalidPerms.join(', ')}`
      });
      return;
    }

    // Check for duplicate role name
    const existingRole = [...DEFAULT_ROLES, ...customRoles].find(
      r => r.name.toUpperCase() === name.toUpperCase()
    );
    if (existingRole) {
      res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `Role "${name}" already exists`
      });
      return;
    }

    const newRole = {
      id: `role_${Date.now()}`,
      name: name.toUpperCase().replace(/\s+/g, '_'),
      displayName: displayName || name,
      description,
      permissions: permArray,
      adminCount: 0,
      isDefault: false,
      isSystem: false,
    };

    customRoles.push(newRole);

    res.status(201).json({
      success: true,
      data: {
        ...newRole,
        permissions: JSON.stringify(newRole.permissions),
        permissionCount: newRole.permissions.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * PUT /api/super-admin/roles/:id
 * Update an existing admin role
 */
router.put('/roles/:id', authMiddleware, validateBody(updateRoleSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;
    const { name, displayName, description, permissions } = req.body;

    // Find role
    const roleIndex = customRoles.findIndex(r => r.id === id);
    const isSystemRole = DEFAULT_ROLES.find(r => r.id === id);
    
    if (isSystemRole) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot modify system roles'
      });
      return;
    }

    if (roleIndex === -1) {
      res.status(404).json({ success: false, error: 'Role not found' });
      return;
    }

    const permArray = Array.isArray(permissions) ? permissions : customRoles[roleIndex].permissions;

    customRoles[roleIndex] = {
      ...customRoles[roleIndex],
      ...(name && { name: name.toUpperCase().replace(/\s+/g, '_') }),
      ...(displayName && { displayName }),
      ...(description && { description }),
      permissions: permArray,
    };

    res.json({
      success: true,
      data: {
        ...customRoles[roleIndex],
        permissions: JSON.stringify(customRoles[roleIndex].permissions),
        permissionCount: customRoles[roleIndex].permissions.length,
        updatedAt: new Date(),
      },
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/super-admin/roles/:id
 * Delete an admin role
 */
router.delete('/roles/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { id } = req.params;

    const isSystemRole = DEFAULT_ROLES.find(r => r.id === id);
    if (isSystemRole) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot delete system roles'
      });
      return;
    }

    const roleIndex = customRoles.findIndex(r => r.id === id);
    if (roleIndex === -1) {
      res.status(404).json({ success: false, error: 'Role not found' });
      return;
    }

    customRoles.splice(roleIndex, 1);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ============================================================================
// USER MANAGEMENT - CREATE
// ============================================================================

/**
 * POST /api/super-admin/users
 * Create a new user account (admin-created)
 */
export default router;
