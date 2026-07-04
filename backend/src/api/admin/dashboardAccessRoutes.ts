/**
 * Dashboard Access Routes (P10.5).
 *
 * CEO-controlled per-user dashboard menu visibility. The sidebar already has
 * `assignedMenus` plumbing — this backend persists the assignment so it
 * survives logout/devices instead of living in localStorage.
 *
 * Storage: SystemConfiguration row keyed `dashboard.access.<userId>` with JSON
 * `{ presetRole?, allowedMenuIds: string[], updatedBy, updatedAt }`. No schema
 * migration needed.
 *
 * Endpoints:
 *   GET  /menus            catalog of menu IDs + role presets (any authed user)
 *   GET  /me               resolved menu list for the current user
 *   GET  /users            all staff + their assignments (SUPER_ADMIN | CEO)
 *   PUT  /users/:userId    set a user's menus (SUPER_ADMIN | CEO)
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, requireRole } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authMiddleware as any);

const KEY_PREFIX = 'dashboard.access.';

// ─── Menu catalog ─────────────────────────────────────────────────────────
// Mirrors the IDs in apps/admin/src/components/super-admin/SuperAdminSidebar.tsx.
// Keep in sync when you add/remove sidebar entries.
export const MENU_CATALOG: { id: string; label: string; group: string }[] = [
  // Always-on (the sidebar enforces these regardless of assignment)
  { id: 'overview', label: 'Overview', group: 'always' },
  { id: 'today-todo', label: 'Today TO DO', group: 'always' },
  { id: 'setup-checklist', label: 'Setup Checklist', group: 'always' },
  { id: 'help-center', label: 'Help Center', group: 'always' },

  // Content
  { id: 'content-management', label: 'Content Management', group: 'content' },
  { id: 'editorial-pipeline', label: 'Editorial Pipeline', group: 'content' },
  { id: 'gov-alerts', label: 'Gov Alerts', group: 'content' },
  { id: 'ai-management', label: 'AI Management', group: 'content' },
  { id: 'automations', label: 'Automations', group: 'content' },
  { id: 'video-pipeline', label: 'Vengine (Video)', group: 'content' },
  { id: 'distribution', label: 'Distribution', group: 'content' },
  { id: 'translations', label: 'Translations', group: 'content' },
  { id: 'seo', label: 'SEO Management', group: 'content' },
  { id: 'marquees', label: 'Marquee Ticker', group: 'content' },

  // Users
  { id: 'user-management', label: 'User Management', group: 'users' },
  { id: 'community', label: 'Community', group: 'users' },
  { id: 'expert-program', label: 'Expert Program', group: 'users' },

  // HR + Events
  { id: 'hr-hiring', label: 'HR & Hiring', group: 'hr' },
  { id: 'events-intelligence', label: 'Events Intelligence', group: 'hr' },

  // Finance
  { id: 'cfis-finance', label: 'CFIS Finance', group: 'finance' },
  { id: 'finance', label: 'Finance', group: 'finance' },
  { id: 'monetization', label: 'Monetization', group: 'finance' },
  { id: 'ai-cost-tracking', label: 'AI Cost Tracking', group: 'finance' },
  { id: 'ads-management', label: 'Ads Management', group: 'finance' },
  { id: 'affiliate', label: 'Affiliate Mgmt', group: 'finance' },
  { id: 'api-licensing', label: 'API Licensing', group: 'finance' },

  // Security + compliance
  { id: 'fraud-alerts', label: 'Fraud Alerts', group: 'security' },
  { id: 'security', label: 'Security Dashboard', group: 'security' },
  { id: 'audit', label: 'Audit System', group: 'security' },
  { id: 'compliance', label: 'Compliance', group: 'security' },
  { id: 'accessibility', label: 'Accessibility (WCAG)', group: 'security' },
  { id: 'rate-limiting', label: 'Rate Limiting & DDoS', group: 'security' },

  // Admin/ops
  { id: 'admin-management', label: 'Admin Management', group: 'ops' },
  { id: 'storage', label: 'Storage Buckets', group: 'ops' },
  { id: 'data-management', label: 'Data Management', group: 'ops' },
  { id: 'system-monitoring', label: 'System Monitoring', group: 'ops' },
  { id: 'settings', label: 'Platform Settings', group: 'ops' },

  // Market + intelligence
  { id: 'market-management', label: 'Market Management', group: 'market' },
  { id: 'chima-index', label: 'CHIMA Index Products', group: 'market' },
  { id: 'crypto-policies', label: 'Crypto Policies', group: 'market' },
  { id: 'regulatory-intel', label: 'Regulatory Intel HQ', group: 'market' },
  { id: 'analytics', label: 'Analytics', group: 'market' },

  // E-commerce + partnerships
  { id: 'ecommerce', label: 'E-commerce', group: 'misc' },
  { id: 'partnerships', label: 'Partnerships', group: 'misc' },
];

// ─── Role presets ─────────────────────────────────────────────────────────
// CEO clicks "Apply preset" to fill a user's menu list with the canonical
// kit for that role. They can still tick/untick individual items afterward.
export const ROLE_PRESETS: Record<string, { label: string; menus: string[] }> = {
  EDITOR: {
    label: 'Editor — content + video + distribution',
    menus: [
      'content-management', 'editorial-pipeline', 'gov-alerts', 'ai-management',
      'automations', 'video-pipeline', 'distribution', 'translations', 'seo', 'marquees',
      'analytics', 'community',
    ],
  },
  HR: {
    label: 'HR — hiring + onboarding + events',
    menus: ['hr-hiring', 'events-intelligence', 'user-management'],
  },
  FINANCE: {
    label: 'Finance — CFIS + AI costs + monetization',
    menus: [
      'cfis-finance', 'finance', 'monetization', 'ai-cost-tracking',
      'ads-management', 'affiliate', 'api-licensing', 'analytics',
    ],
  },
  SECURITY: {
    label: 'Security — fraud + audit + compliance',
    menus: [
      'fraud-alerts', 'security', 'audit', 'compliance', 'accessibility', 'rate-limiting',
      'system-monitoring',
    ],
  },
  MARKET_ANALYST: {
    label: 'Market analyst — indexes + regulatory + research',
    menus: [
      'market-management', 'chima-index', 'crypto-policies', 'regulatory-intel',
      'analytics', 'content-management',
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

interface StoredAccess {
  presetRole?: string;
  allowedMenuIds: string[];
  updatedBy?: string;
  updatedAt?: string;
}

async function readAccess(userId: string): Promise<StoredAccess | null> {
  const row = await prisma.systemConfiguration.findUnique({ where: { key: KEY_PREFIX + userId } });
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as StoredAccess;
    if (!Array.isArray(parsed.allowedMenuIds)) return null;
    return parsed;
  } catch { return null; }
}

async function writeAccess(userId: string, access: StoredAccess): Promise<void> {
  const key = KEY_PREFIX + userId;
  const value = JSON.stringify(access);
  const existing = await prisma.systemConfiguration.findUnique({ where: { key } });
  if (existing) {
    await prisma.systemConfiguration.update({
      where: { key },
      data: { value, updatedAt: new Date() },
    });
  } else {
    await prisma.systemConfiguration.create({
      data: {
        id: uuidv4(),
        key,
        value,
        description: 'Per-user dashboard menu visibility (P10.5)',
        updatedAt: new Date(),
      },
    });
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get('/menus', (_req: Request, res: Response) => {
  res.json({ menus: MENU_CATALOG, presets: ROLE_PRESETS });
});

router.get('/me', async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const access = await readAccess(req.user.id);
  const role = (req.user.role || '').toUpperCase();
  // SUPER_ADMIN + CEO bypass: they see everything regardless of assignment.
  const unrestricted = role === 'SUPER_ADMIN' || role === 'CEO';
  res.json({
    userId: req.user.id,
    role,
    unrestricted,
    allowedMenuIds: unrestricted ? [] : (access?.allowedMenuIds ?? []),
    presetRole: access?.presetRole ?? null,
    assigned: !!access,
  });
});

router.get('/users', requireRole(['SUPER_ADMIN', 'CEO']) as any, async (_req: Request, res: Response) => {
  try {
    // Exclude consumers — only show staff that could realistically use a dashboard.
    const STAFF_ROLES = [
      'JOURNALIST', 'EDITOR', 'CEO', 'CONTRIBUTOR',
      'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN', 'SUPER_ADMIN',
      'DEPARTMENT_HEAD', 'SENIOR_EDITOR', 'JUNIOR_EDITOR',
      'FINANCE_OFFICER', 'HR_MANAGER', 'AD_OPS_MANAGER', 'ENGINEERING',
      'EVENTS_MANAGER', 'RESEARCH_ANALYST', 'READ_ONLY_OBSERVER',
    ];
    const users = await prisma.user.findMany({
      where: { role: { in: STAFF_ROLES as any } },
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        role: true, status: true, lastLoginAt: true,
      },
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
      take: 500,
    });

    // Batch-fetch access rows in one query
    const keys = users.map(u => KEY_PREFIX + u.id);
    const rows = await prisma.systemConfiguration.findMany({ where: { key: { in: keys } } });
    const accessByUser = new Map<string, StoredAccess>();
    for (const row of rows) {
      const userId = row.key.slice(KEY_PREFIX.length);
      try {
        const parsed = JSON.parse(row.value || '{}') as StoredAccess;
        if (Array.isArray(parsed.allowedMenuIds)) accessByUser.set(userId, parsed);
      } catch { /* skip */ }
    }

    const out = users.map(u => ({
      ...u,
      access: accessByUser.get(u.id) || null,
    }));
    res.json({ users: out, count: out.length });
  } catch (err: any) {
    logger.error('[dashboard-access] /users failed', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:userId', requireRole(['SUPER_ADMIN', 'CEO']) as any, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { presetRole, allowedMenuIds } = req.body as { presetRole?: string; allowedMenuIds: unknown };

    if (!Array.isArray(allowedMenuIds)) {
      return res.status(400).json({ error: 'allowedMenuIds must be an array of menu IDs' });
    }
    // Validate every ID is in the catalog
    const valid = new Set(MENU_CATALOG.map(m => m.id));
    const bad = (allowedMenuIds as unknown[]).filter(id => typeof id !== 'string' || !valid.has(id as string));
    if (bad.length) {
      return res.status(400).json({ error: 'unknown menu ids', invalid: bad });
    }
    if (presetRole && !ROLE_PRESETS[presetRole]) {
      return res.status(400).json({ error: 'unknown presetRole', presetRole });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!targetUser) return res.status(404).json({ error: 'user not found' });

    const access: StoredAccess = {
      presetRole,
      allowedMenuIds: allowedMenuIds as string[],
      updatedBy: req.user?.id,
      updatedAt: new Date().toISOString(),
    };
    await writeAccess(userId, access);
    res.json({ ok: true, userId, access });
  } catch (err: any) {
    logger.error('[dashboard-access] PUT /users/:id failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
