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
import { emergencyUnpublishSchema } from '../../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.get('/panel-data/:section/:page', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const section = (req.params.section || '').toLowerCase();
    const page = (req.params.page || '').toLowerCase();
    const key = `${section}/${page}`;
    const now = new Date();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let payload: any;

    switch (key) {
      case 'partnerships/partners': {
        const [totalPartners, activePartners, enterprisePartners, recentPartners] = await Promise.all([
          prisma.partnerSyndication.count(),
          prisma.partnerSyndication.count({ where: { status: 'ACTIVE' } }),
          prisma.partnerSyndication.count({ where: { tier: 'ENTERPRISE' } }),
          prisma.partnerSyndication.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { partnerName: true, status: true, tier: true, articlesShared: true },
          }),
        ]);

        payload = {
          title: 'Partners',
          description: 'Partner organization overview and onboarding activity.',
          metrics: [
            { label: 'Total Partners', value: totalPartners },
            { label: 'Active Partners', value: activePartners },
            { label: 'Enterprise Tier', value: enterprisePartners },
          ],
          highlights: recentPartners.map(p => ({
            label: `${p.partnerName} (${p.tier})`,
            value: `${p.status} · shared ${p.articlesShared}`,
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'partnerships/integrations': {
        const [total, active, verified, recent] = await Promise.all([
          prisma.integrationConnection.count(),
          prisma.integrationConnection.count({ where: { isActive: true } }),
          prisma.integrationConnection.count({ where: { isVerified: true } }),
          prisma.integrationConnection.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 6,
            select: { name: true, platform: true, isActive: true, isVerified: true },
          }),
        ]);

        payload = {
          title: 'Integrations',
          description: 'Connected integration endpoints and verification state.',
          metrics: [
            { label: 'Total Connections', value: total },
            { label: 'Active Connections', value: active },
            { label: 'Verified Connections', value: verified },
          ],
          highlights: recent.map(item => ({
            label: `${item.name} (${item.platform})`,
            value: `${item.isActive ? 'active' : 'inactive'} · ${item.isVerified ? 'verified' : 'unverified'}`,
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'partnerships/contracts': {
        const [contractEvents, recentContractEvents, partnerCount] = await Promise.all([
          prisma.auditEvent.count({
            where: {
              OR: [
                { action: { contains: 'CONTRACT', mode: 'insensitive' } },
                { details: { contains: 'contract', mode: 'insensitive' } },
              ],
            },
          }),
          prisma.auditEvent.findMany({
            where: {
              OR: [
                { action: { contains: 'CONTRACT', mode: 'insensitive' } },
                { details: { contains: 'contract', mode: 'insensitive' } },
              ],
            },
            orderBy: { timestamp: 'desc' },
            take: 6,
            select: { action: true, timestamp: true, success: true },
          }),
          prisma.partnerSyndication.count(),
        ]);

        payload = {
          title: 'Contracts',
          description: 'Contract-related operations and partner agreement activity.',
          metrics: [
            { label: 'Partner Records', value: partnerCount },
            { label: 'Contract Events', value: contractEvents },
            { label: 'Recent Window', value: 'Live' },
          ],
          highlights: recentContractEvents.map(item => ({
            label: item.action,
            value: `${item.success ? 'success' : 'failed'} · ${item.timestamp.toISOString()}`,
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'data/databases': {
        const [userCount, articleCount, taskCount, walletCount, pingResult] = await Promise.all([
          prisma.user.count(),
          prisma.article.count(),
          prisma.aITask.count(),
          prisma.wallet.count(),
          prisma.$queryRawUnsafe('SELECT 1 as ok').catch(() => []),
        ]);

        const dbOnline = Array.isArray(pingResult) && pingResult.length > 0;
        payload = {
          title: 'Databases',
          description: 'Core database connectivity and table-scale metrics.',
          metrics: [
            { label: 'Database Status', value: dbOnline ? 'Online' : 'Issue detected' },
            { label: 'Users', value: userCount },
            { label: 'Articles', value: articleCount },
            { label: 'AI Tasks', value: taskCount },
            { label: 'Wallets', value: walletCount },
          ],
          highlights: [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'data/backups': {
        const [totalReports, completedReports, latestReport] = await Promise.all([
          prisma.complianceReport.count(),
          prisma.complianceReport.count({ where: { status: 'completed' } }),
          prisma.complianceReport.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { title: true, status: true, createdAt: true },
          }),
        ]);

        payload = {
          title: 'Backups',
          description: 'Backup/report generation status and recovery documentation.',
          metrics: [
            { label: 'Total Backup Reports', value: totalReports },
            { label: 'Completed Reports', value: completedReports },
            { label: 'Latest Snapshot', value: latestReport ? latestReport.createdAt.toISOString() : 'N/A' },
          ],
          highlights: latestReport
            ? [{ label: latestReport.title, value: `${latestReport.status} · ${latestReport.createdAt.toISOString()}` }]
            : [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'data/migrations': {
        const migrations = await prisma.$queryRawUnsafe<any[]>(
          'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC NULLS LAST LIMIT 5'
        ).catch(() => []);

        payload = {
          title: 'Migrations',
          description: 'Schema migration history and latest rollout activity.',
          metrics: [
            { label: 'Recent Migrations', value: migrations.length },
            { label: 'Last Applied', value: migrations[0]?.finished_at ? new Date(migrations[0].finished_at).toISOString() : 'N/A' },
            { label: 'Migration State', value: migrations.length > 0 ? 'Detected' : 'Unavailable' },
          ],
          highlights: migrations.map(m => ({
            label: m.migration_name || 'unknown',
            value: m.finished_at ? new Date(m.finished_at).toISOString() : 'pending',
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'data/privacy': {
        const [consented, withdrawn, gdprReports] = await Promise.all([
          prisma.userConsent.count({ where: { consented: true } }),
          prisma.userConsent.count({ where: { consented: false } }),
          prisma.complianceReport.count({ where: { reportType: { contains: 'gdpr', mode: 'insensitive' } } }),
        ]);

        payload = {
          title: 'Privacy & GDPR',
          description: 'Consent status and GDPR-related reporting visibility.',
          metrics: [
            { label: 'Consented Records', value: consented },
            { label: 'Withdrawn/Declined', value: withdrawn },
            { label: 'GDPR Reports', value: gdprReports },
          ],
          highlights: [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'monitoring/health': {
        const [pendingAlerts, activeUsers, dbPing] = await Promise.all([
          prisma.moderationAlert.count({ where: { status: 'PENDING' } }).catch(() => 0),
          prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
          prisma.$queryRawUnsafe('SELECT 1 as ok').catch(() => []),
        ]);

        payload = {
          title: 'System Health',
          description: 'Live system heartbeat and service-level status indicators.',
          metrics: [
            { label: 'Uptime (seconds)', value: Math.floor(process.uptime()) },
            { label: 'Memory (MB)', value: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) },
            { label: 'DB Connectivity', value: Array.isArray(dbPing) && dbPing.length > 0 ? 'Online' : 'Offline' },
            { label: 'Pending Alerts', value: pendingAlerts },
            { label: 'Active Users', value: activeUsers },
          ],
          highlights: [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'monitoring/performance': {
        const [tasks24h, failedTasks24h, recentEvents] = await Promise.all([
          prisma.aITask.count({ where: { createdAt: { gte: last24h } } }).catch(() => 0),
          prisma.aITask.count({ where: { createdAt: { gte: last24h }, status: 'FAILED' } }).catch(() => 0),
          prisma.auditEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10,
            select: { action: true, timestamp: true, success: true },
          }).catch(() => []),
        ]);

        const failureRate = tasks24h > 0 ? Number(((failedTasks24h / tasks24h) * 100).toFixed(2)) : 0;

        payload = {
          title: 'Performance',
          description: 'Operational throughput and recent failure-rate visibility.',
          metrics: [
            { label: 'AI Tasks (24h)', value: tasks24h },
            { label: 'Failed Tasks (24h)', value: failedTasks24h },
            { label: 'Failure Rate (%)', value: failureRate },
          ],
          highlights: recentEvents.slice(0, 5).map(item => ({
            label: item.action,
            value: `${item.success ? 'success' : 'failed'} · ${item.timestamp.toISOString()}`,
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'monitoring/logs': {
        const events = await prisma.auditEvent.findMany({
          orderBy: { timestamp: 'desc' },
          take: 15,
          select: { action: true, category: true, success: true, timestamp: true },
        });

        payload = {
          title: 'Logs',
          description: 'Recent audit stream across admin and system operations.',
          metrics: [
            { label: 'Recent Log Entries', value: events.length },
            { label: 'Successful Events', value: events.filter(e => e.success).length },
            { label: 'Failed Events', value: events.filter(e => !e.success).length },
          ],
          highlights: events.map(item => ({
            label: `${item.category || 'general'} · ${item.action}`,
            value: `${item.success ? 'success' : 'failed'} · ${item.timestamp.toISOString()}`,
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'monitoring/alerts': {
        const [total, pending, critical, recent] = await Promise.all([
          prisma.moderationAlert.count(),
          prisma.moderationAlert.count({ where: { status: 'PENDING' } }),
          prisma.moderationAlert.count({ where: { severity: 'CRITICAL' } }),
          prisma.moderationAlert.findMany({
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: { title: true, severity: true, status: true, createdAt: true },
          }),
        ]);

        payload = {
          title: 'System Alerts',
          description: 'Recent platform alerts, severity tiers, and response status.',
          metrics: [
            { label: 'Total Alerts', value: total },
            { label: 'Pending Alerts', value: pending },
            { label: 'Critical Alerts', value: critical },
          ],
          highlights: recent.map(item => ({
            label: `${item.severity} · ${item.title}`,
            value: `${item.status} · ${item.createdAt.toISOString()}`,
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'settings/general': {
        const [categories, aiAgents, users] = await Promise.all([
          prisma.category.count({ where: { isActive: true } }),
          prisma.aIAgent.count({ where: { isActive: true } }),
          prisma.user.count(),
        ]);

        payload = {
          title: 'General Settings',
          description: 'Platform defaults and active system modules overview.',
          metrics: [
            { label: 'Environment', value: process.env.NODE_ENV || 'development' },
            { label: 'Active Categories', value: categories },
            { label: 'Active AI Agents', value: aiAgents },
            { label: 'Registered Users', value: users },
          ],
          highlights: [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'settings/security': {
        const [lockedWallets, twoFactorUsers, failedEvents] = await Promise.all([
          prisma.wallet.count({ where: { isLocked: true } }),
          prisma.user.count({ where: { twoFactorEnabled: true } }),
          prisma.auditEvent.count({ where: { success: false, timestamp: { gte: last24h } } }),
        ]);

        payload = {
          title: 'Security Settings',
          description: 'Security posture, lock states, and recent failed operations.',
          metrics: [
            { label: 'Locked Wallets', value: lockedWallets },
            { label: '2FA Enabled Users', value: twoFactorUsers },
            { label: 'Failed Events (24h)', value: failedEvents },
          ],
          highlights: [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'settings/api': {
        const [integrations, activeIntegrations, aiAgents] = await Promise.all([
          prisma.integrationConnection.count(),
          prisma.integrationConnection.count({ where: { isActive: true } }),
          prisma.aIAgent.count({ where: { isActive: true } }),
        ]);

        payload = {
          title: 'API Configuration',
          description: 'Integration connectivity and API-linked service overview.',
          metrics: [
            { label: 'Integration Connections', value: integrations },
            { label: 'Active Connections', value: activeIntegrations },
            { label: 'Active AI Providers', value: aiAgents },
            { label: 'Backend URL', value: process.env.BACKEND_URL || 'http://localhost:4000' },
          ],
          highlights: [],
          updatedAt: now.toISOString(),
        };
        break;
      }

      case 'settings/localization': {
        const supportedLanguages = ['en', 'fr', 'sw', 'yo', 'ha', 'ig', 'zu', 'ar'];

        payload = {
          title: 'Localization',
          description: 'Language usage, localization coverage, and translation footprint.',
          metrics: [
            { label: 'Default Locale', value: process.env.DEFAULT_LOCALE || 'en' },
            { label: 'Supported Languages', value: supportedLanguages.length },
            { label: 'Regional Focus', value: 'Africa-first' },
          ],
          highlights: supportedLanguages.map(lang => ({
            label: lang,
            value: 'enabled',
          })),
          updatedAt: now.toISOString(),
        };
        break;
      }

      default:
        res.status(404).json({ success: false, error: 'Panel not found' });
        return;
    }

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error fetching panel data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch panel data' });
  }
});

// ─── PATCH /panel-settings/:page — save editable settings ────────────────────
const ALLOWED_SETTINGS_PAGES = ['general', 'security', 'api', 'localization'] as const;
type SettingsPage = typeof ALLOWED_SETTINGS_PAGES[number];

const SETTINGS_FIELD_MAP: Record<SettingsPage, string[]> = {
  general: ['platformName', 'platformDescription', 'maintenanceMode', 'itemsPerPage'],
  security: ['sessionTimeout', 'maxLoginAttempts', 'enforce2FA', 'passwordMinLength'],
  api: ['backendUrl', 'rateLimitPerMinute', 'allowedOrigins', 'apiVersion'],
  localization: ['defaultLanguage', 'timezone', 'dateFormat', 'currency'],
};

router.patch('/panel-settings/:page', authMiddleware, async (req: any, res: any) => {
  try {
    const page = req.params.page as SettingsPage;

    if (!ALLOWED_SETTINGS_PAGES.includes(page)) {
      return res.status(404).json({ success: false, error: 'Settings page not found' });
    }

    const allowedFields = SETTINGS_FIELD_MAP[page];
    const updates: Record<string, string> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided' });
    }

    // Upsert each field into SystemConfiguration
    const now = new Date();
    const upserts = Object.entries(updates).map(([key, value]) => {
      const configKey = `settings.${page}.${key}`;
      return prisma.systemConfiguration.upsert({
        where: { key: configKey },
        update: { value, updatedAt: now },
        create: {
          id: `cfg_${page}_${key}_${Date.now()}`,
          key: configKey,
          value,
          description: `${page} settings — ${key}`,
          updatedAt: now,
        },
      });
    });

    await Promise.all(upserts);

    return res.json({
      success: true,
      message: `${page} settings saved successfully`,
      saved: Object.keys(updates),
    });
  } catch (error) {
    console.error('Error saving panel settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// ─── GET /config — load platform-wide system configuration ────────────────────
router.get('/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Read all config rows from SystemConfiguration that start with "platform."
    const rows = await prisma.systemConfiguration.findMany({
      where: { key: { startsWith: 'platform.' } },
    });

    // Build nested config object from flat key-value rows
    // e.g. key "platform.general.siteName" → config.general.siteName
    const config: Record<string, any> = {};
    for (const row of rows) {
      const parts = row.key.replace('platform.', '').split('.');
      const section = parts[0];
      const field = parts.slice(1).join('.');
      if (!config[section]) config[section] = {};

      // Parse value: booleans, numbers, arrays (JSON), or strings
      let value: any = row.value;
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value !== null && value !== '' && !isNaN(Number(value)) && !value.startsWith('[')) value = Number(value);
      else if (value && (value.startsWith('[') || value.startsWith('{'))) {
        try { value = JSON.parse(value); } catch { /* keep as string */ }
      }
      config[section][field] = value;
    }

    // Also pull tokenomics from the tokenomics-specific keys
    const tkRows = await prisma.systemConfiguration.findMany({
      where: { key: { startsWith: 'tokenomics.' } },
    });
    if (tkRows.length > 0) {
      if (!config.tokenomics) config.tokenomics = {};
      for (const row of tkRows) {
        const field = row.key.replace('tokenomics.', '');
        let value: any = row.value;
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value !== null && value !== '' && !isNaN(Number(value))) value = Number(value);
        config.tokenomics[field] = value;
      }
    }

    return res.json(config);
  } catch (error: any) {
    // If table doesn't exist yet, return empty config (frontend uses defaults)
    if (error?.code === 'P2021') {
      return res.json({});
    }
    console.error('Error loading platform config:', error);
    return res.status(500).json({ success: false, error: 'Failed to load configuration' });
  }
});

// ─── PUT /config — save platform-wide system configuration ─────────────────────
router.put('/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const now = new Date();
    const upserts: Promise<any>[] = [];

    // Flatten nested config object to key-value pairs
    for (const [section, fields] of Object.entries(body)) {
      if (section === 'tokenomics') continue; // handled separately via /api/tokenomics/config
      if (typeof fields === 'object' && fields !== null && !Array.isArray(fields)) {
        for (const [field, value] of Object.entries(fields as Record<string, any>)) {
          const configKey = `platform.${section}.${field}`;
          const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          upserts.push(
            prisma.systemConfiguration.upsert({
              where: { key: configKey },
              update: { value: strValue, updatedAt: now },
              create: {
                id: `platform_${section}_${field}_${Date.now()}`,
                key: configKey,
                value: strValue,
                description: `Platform config — ${section}.${field}`,
                updatedAt: now,
              },
            })
          );
        }
      }
    }

    // Also save tokenomics if present
    if (body.tokenomics && typeof body.tokenomics === 'object') {
      for (const [field, value] of Object.entries(body.tokenomics as Record<string, any>)) {
        const configKey = `tokenomics.${field}`;
        const strValue = String(value);
        upserts.push(
          prisma.systemConfiguration.upsert({
            where: { key: configKey },
            update: { value: strValue, updatedAt: now },
            create: {
              id: `tokenomics_${field}_${Date.now()}`,
              key: configKey,
              value: strValue,
              description: `Tokenomics — ${field}`,
              updatedAt: now,
            },
          })
        );
      }
    }

    if (upserts.length > 0) {
      await Promise.all(upserts);
    }

    return res.json({ success: true, message: 'Configuration saved' });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.status(503).json({
        success: false,
        error: 'SystemConfiguration table not available — run migrations first',
      });
    }
    console.error('Error saving platform config:', error);
    return res.status(500).json({ success: false, error: 'Failed to save configuration' });
  }
});

// ─── GET /panel-settings/:page — load saved editable settings ─────────────────
router.get('/panel-settings/:page', authMiddleware, async (req: any, res: any) => {
  try {
    const page = req.params.page as SettingsPage;

    if (!ALLOWED_SETTINGS_PAGES.includes(page)) {
      return res.status(404).json({ success: false, error: 'Settings page not found' });
    }

    const allowedFields = SETTINGS_FIELD_MAP[page];
    const keys = allowedFields.map(f => `settings.${page}.${f}`);

    const rows = await prisma.systemConfiguration.findMany({
      where: { key: { in: keys } },
    });

    const saved: Record<string, string> = {};
    for (const row of rows) {
      const field = row.key.split('.').pop()!;
      saved[field] = row.value ?? '';
    }

    return res.json({ success: true, page, fields: allowedFields, saved });
  } catch (error) {
    console.error('Error loading panel settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to load settings' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  DAILY TASKS — "Today TO DO" system
//  Templates stored in SystemConfiguration: dailytasks.templates
//  Daily logs stored in: dailytasks.log.YYYY-MM-DD
// ═══════════════════════════════════════════════════════════════════════

/** Helper: today's key */
const todayKey = () => `dailytasks.log.${new Date().toISOString().split('T')[0]}`;

// ─── GET /daily-tasks/templates — master task list ────────────────────
export default router;
