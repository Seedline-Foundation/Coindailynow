/**
 * User Test Factories
 * Standardized mock users for testing
 */

import { User, UserRole } from '../../src/types';

export interface MockUserOptions {
  id?: string;
  email?: string;
  username?: string;
  role?: UserRole;
  emailVerified?: boolean;
  status?: string;
  twoFactorEnabled?: boolean;
  firstName?: string;
  lastName?: string;
}

/**
 * Create a mock user with default values
 */
export const createMockUser = (overrides?: MockUserOptions): User => ({
  id: overrides?.id || 'test-user-id',
  email: overrides?.email || 'test@coindaily.com',
  username: overrides?.username || 'testuser',
  passwordHash: '$2a$12$abcdefghijklmnopqrstuvwxyz1234567890', // Mock bcrypt hash
  role: overrides?.role || UserRole.USER,
  firstName: overrides?.firstName || 'Test',
  lastName: overrides?.lastName || 'User',
  avatarUrl: null,
  bio: null,
  location: null,
  preferredLanguage: 'en',
  subscriptionTier: 'FREE',
  emailVerified: overrides?.emailVerified ?? true,
  phoneVerified: false,
  twoFactorEnabled: overrides?.twoFactorEnabled ?? false,
  twoFactorSecret: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-01'),
  status: overrides?.status || 'ACTIVE',
  isShadowBanned: false,
});

/**
 * Create a mock admin user
 */
export const createMockAdmin = (overrides?: MockUserOptions): User =>
  createMockUser({
    ...overrides,
    role: UserRole.ADMIN,
    email: overrides?.email || 'admin@coindaily.com',
    username: overrides?.username || 'admin',
  });

/**
 * Create a mock content admin user
 */
export const createMockContentAdmin = (overrides?: MockUserOptions): User =>
  createMockUser({
    ...overrides,
    role: UserRole.CONTENT_ADMIN,
    email: overrides?.email || 'content@coindaily.com',
    username: overrides?.username || 'contentadmin',
  });

/**
 * Create a mock super admin user
 */
export const createMockSuperAdmin = (overrides?: MockUserOptions): User =>
  createMockUser({
    ...overrides,
    role: UserRole.SUPER_ADMIN,
    email: overrides?.email || 'superadmin@coindaily.com',
    username: overrides?.username || 'superadmin',
  });

/**
 * Create a mock unverified user
 */
export const createMockUnverifiedUser = (overrides?: MockUserOptions): User =>
  createMockUser({
    ...overrides,
    emailVerified: false,
    status: 'PENDING_VERIFICATION',
  });

/**
 * Create a mock suspended user
 */
export const createMockSuspendedUser = (overrides?: MockUserOptions): User =>
  createMockUser({
    ...overrides,
    status: 'SUSPENDED',
  });

/**
 * Create multiple mock users
 */
export const createMockUsers = (count: number, overrides?: MockUserOptions): User[] =>
  Array.from({ length: count }, (_, i) =>
    createMockUser({
      ...overrides,
      id: `test-user-${i}`,
      email: `test${i}@coindaily.com`,
      username: `testuser${i}`,
    })
  );
