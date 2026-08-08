import {
  getPermissionsByCategory,
  isDelegatable,
  requiresSuperAdmin,
  getPermissionDisplayName,
  getAllPermissions,
  getPermissionCount,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
} from '../../src/constants/permissions';

describe('Permissions Constants and Utilities', () => {
  describe('getPermissionCount', () => {
    test('should return the correct count of total permissions', () => {
      const count = getPermissionCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(100); // 150+ permissions registered
      expect(count).toBe(Object.keys(ALL_PERMISSIONS).length);
    });
  });

  describe('getAllPermissions', () => {
    test('should return an array of all registered permissions', () => {
      const allPerms = getAllPermissions();
      expect(Array.isArray(allPerms)).toBe(true);
      expect(allPerms.length).toBe(getPermissionCount());
      expect(allPerms).toContain('user_create');
      expect(allPerms).toContain('system_configure');
    });
  });

  describe('getPermissionsByCategory', () => {
    test('should return permissions under the specified category', () => {
      const userManagementPerms = getPermissionsByCategory('USER_MANAGEMENT');
      expect(Array.isArray(userManagementPerms)).toBe(true);
      expect(userManagementPerms).toContain('user_create');
      expect(userManagementPerms).toContain('user_delete');
      expect(userManagementPerms.length).toBe(PERMISSION_CATEGORIES.USER_MANAGEMENT.length);
    });

    test('should return permissions for other categories correctly', () => {
      const financePerms = getPermissionsByCategory('FINANCE');
      expect(financePerms).toContain('finance_we_wallet_transfer');
      expect(financePerms).toContain('finance_view_wallet');
      expect(financePerms.length).toBe(PERMISSION_CATEGORIES.FINANCE.length);
    });
  });

  describe('requiresSuperAdmin', () => {
    test('should return true for exclusive super admin permissions', () => {
      expect(requiresSuperAdmin('system_configure')).toBe(true);
      expect(requiresSuperAdmin('finance_we_wallet_transfer')).toBe(true);
      expect(requiresSuperAdmin('security_gdpr_compliance')).toBe(true);
    });

    test('should return false for regular permissions', () => {
      expect(requiresSuperAdmin('user_create')).toBe(false);
      expect(requiresSuperAdmin('content_publish')).toBe(false);
      expect(requiresSuperAdmin('finance_view_wallet')).toBe(false);
    });
  });

  describe('isDelegatable', () => {
    test('should return true for delegatable permissions', () => {
      expect(isDelegatable('user_create')).toBe(true);
      expect(isDelegatable('content_publish')).toBe(true);
      expect(isDelegatable('finance_view_wallet')).toBe(true);
    });

    test('should return false for non-delegatable exclusive super admin permissions', () => {
      expect(isDelegatable('system_configure')).toBe(false);
      expect(isDelegatable('finance_we_wallet_transfer')).toBe(false);
      expect(isDelegatable('security_gdpr_compliance')).toBe(false);
    });
  });

  describe('getPermissionDisplayName', () => {
    test('should return mapped display name for permissions with metadata', () => {
      expect(getPermissionDisplayName('user_create')).toBe('Create User');
      expect(getPermissionDisplayName('user_delete')).toBe('Delete User');
      expect(getPermissionDisplayName('finance_we_wallet_transfer')).toBe('Transfer from We Wallet');
    });

    test('should fallback to the permission key itself if no metadata exists', () => {
      const unknownPerm = 'non_existent_permission_test';
      expect(getPermissionDisplayName(unknownPerm)).toBe(unknownPerm);
    });
  });
});
