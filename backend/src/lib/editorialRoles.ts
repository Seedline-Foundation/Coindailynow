/**
 * Editorial role mapping for launch todo (ceo/editor/journalist/contributor)
 * mapped onto existing Prisma UserRole + super-admin permission templates.
 */

import type { UserRole } from '@prisma/client';

/** Roles that may publish or manage marquee (launch editorial policy). */
export const MARQUEE_MANAGER_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_ADMIN',
];

/** Roles that may emergency-unpublish live content (<2 clicks in admin). */
export const EMERGENCY_UNPUBLISH_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_ADMIN',
];

/** Roles that may approve AI queue items and publish CMS articles. */
export const PUBLISH_APPROVER_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_ADMIN',
];

/** Launch doc aliases → platform roles (for UI copy / onboarding). */
export const LAUNCH_EDITORIAL_ALIASES: Record<string, string> = {
  ceo: 'SUPER_ADMIN',
  editor: 'CONTENT_ADMIN',
  journalist: 'CONTENT_ADMIN', // draft-only enforced via permissions in super-admin templates
  contributor: 'USER',
};

export function canEmergencyUnpublish(role: string | undefined): boolean {
  if (!role) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return EMERGENCY_UNPUBLISH_ROLES.includes(role as UserRole);
}

export function canManageMarquee(role: string | undefined): boolean {
  if (!role) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return MARQUEE_MANAGER_ROLES.includes(role as UserRole);
}

export function canPublishContent(role: string | undefined): boolean {
  if (!role) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return PUBLISH_APPROVER_ROLES.includes(role as UserRole);
}
