/**
 * Editorial + admin role hierarchy.
 *
 * Per documentations/launch/PRE_POST_LAUNCH_TODO.md the editorial taxonomy is:
 *   CONTRIBUTOR < JOURNALIST < EDITOR < CEO
 * The platform-admin taxonomy is:
 *   USER < ADMIN < SUPER_ADMIN  (with three speciality admins below ADMIN)
 *
 * The two trees overlap at the platform-management level: CEO and SUPER_ADMIN
 * are equivalent for editorial decisions; SUPER_ADMIN beats CEO only on
 * platform/security operations.
 */

export type Role =
  | 'USER'
  | 'CONTRIBUTOR'
  | 'JOURNALIST'
  | 'EDITOR'
  | 'CONTENT_ADMIN'
  | 'MARKETING_ADMIN'
  | 'TECH_ADMIN'
  | 'CEO'
  | 'ADMIN'
  | 'SUPER_ADMIN';

/** Higher number = more privilege. */
export const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  CONTRIBUTOR: 10,
  JOURNALIST: 20,
  EDITOR: 30,
  CONTENT_ADMIN: 40,
  MARKETING_ADMIN: 40,
  TECH_ADMIN: 40,
  CEO: 50,
  ADMIN: 50,
  SUPER_ADMIN: 100,
};

export const EDITORIAL_ROLES: Role[] = ['CONTRIBUTOR', 'JOURNALIST', 'EDITOR', 'CEO'];
export const ADMIN_ROLES: Role[] = [
  'CONTENT_ADMIN',
  'MARKETING_ADMIN',
  'TECH_ADMIN',
  'ADMIN',
  'CEO',
  'SUPER_ADMIN',
];

/** Return true if `role` is at least `minimum` in the hierarchy. */
export function hasMinimumRole(role: string | undefined | null, minimum: Role): boolean {
  if (!role) return false;
  const r = ROLE_RANK[role as Role];
  if (r === undefined) return false;
  return r >= ROLE_RANK[minimum];
}

/** Return true if `role` matches one of the allowed values exactly. */
export function hasAnyRole(role: string | undefined | null, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role as Role);
}

/** Capabilities matrix — the canonical source of truth for what each role can do. */
export const CAPABILITIES = {
  // Articles
  ARTICLE_DRAFT: ['CONTRIBUTOR', 'JOURNALIST', 'EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] as Role[],
  ARTICLE_PUBLISH: ['JOURNALIST', 'EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] as Role[],
  ARTICLE_APPROVE: ['EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] as Role[],
  ARTICLE_EMERGENCY_UNPUBLISH: ['EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN'] as Role[],

  // Marquee / ticker
  MARQUEE_PUSH: ['JOURNALIST', 'EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] as Role[],
  MARQUEE_MANAGE: ['EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] as Role[],

  // Finance
  FINANCE_READ: ['CEO', 'ADMIN', 'SUPER_ADMIN'] as Role[],
  FINANCE_APPROVE: ['CEO', 'SUPER_ADMIN'] as Role[],

  // Platform
  USER_MANAGE: ['ADMIN', 'SUPER_ADMIN', 'CEO'] as Role[],
  IP_WHITELIST_MANAGE: ['SUPER_ADMIN', 'TECH_ADMIN'] as Role[],
  AI_TASK_CONTROL: ['EDITOR', 'CEO', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'TECH_ADMIN'] as Role[],
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: string | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[capability] as readonly string[]).includes(role);
}
