/**
 * Split super-admin.ts into modules by line range.
 * node backend/scripts/split-super-admin-routes.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcPath = path.join(root, 'backend/src/api/routes/super-admin.ts');
const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
const outDir = path.join(root, 'backend/src/api/routes/super-admin');

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sharedHeader = `import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware as jwtAuthMiddleware } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { financeService } from '../../services/FinanceService';
import { canEmergencyUnpublish } from '../../lib/editorialRoles';
import { CMSService } from '../../services/cmsService';
import { logger } from '../../utils/logger';

`;

const sharedBody = slice(23, 480);
fs.writeFileSync(
  path.join(outDir, 'shared.ts'),
  sharedHeader + sharedBody + `\nexport const cmsService = new CMSService(prisma, logger);\n`,
);

const routeImport = `import { Router, Request, Response } from 'express';
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
import { validateBody } from '../../middleware/validate';
import { emergencyUnpublishSchema } from '../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

`;

const modules = [
  { file: 'stats.routes.ts', start: 486, end: 562 },
  { file: 'users.routes.ts', start: 563, end: 700, extra: [952, 979, 1271, 1400] },
  { file: 'alerts.routes.ts', start: 701, end: 748 },
  { file: 'articles.routes.ts', start: 749, end: 832, extra: [980, 1053] },
  { file: 'ai.routes.ts', start: 833, end: 951 },
  { file: 'roles.routes.ts', start: 1055, end: 1270 },
  { file: 'content.routes.ts', start: 1401, end: 2191 },
  { file: 'monetization.routes.ts', start: 1677, end: 2027 },
  { file: 'panel.routes.ts', start: 2192, end: 2826 },
  { file: 'config.routes.ts', start: 2665, end: 2788 },
  { file: 'daily-tasks.routes.ts', start: 2827, end: 2958 },
];

for (const m of modules) {
  let body = slice(m.start, m.end);
  if (m.extra) {
    for (let i = 0; i < m.extra.length; i += 2) {
      body += '\n\n' + slice(m.extra[i], m.extra[i + 1]);
    }
  }
  fs.writeFileSync(path.join(outDir, m.file), routeImport + body + '\nexport default router;\n');
}

// Fix content vs monetization overlap - content was 1401-2191 includes monetization at 1677
// Re-split content to 1401-1676 only
const contentOnly = slice(1401, 1676) + '\n\n' + slice(2028, 2191);
fs.writeFileSync(path.join(outDir, 'content.routes.ts'), routeImport + contentOnly + '\nexport default router;\n');

const index = `/** Super Admin API — composed routers (BE-1-1) */
import { Router } from 'express';
import statsRouter from './stats.routes';
import usersRouter from './users.routes';
import alertsRouter from './alerts.routes';
import articlesRouter from './articles.routes';
import aiRouter from './ai.routes';
import rolesRouter from './roles.routes';
import contentRouter from './content.routes';
import monetizationRouter from './monetization.routes';
import panelRouter from './panel.routes';
import configRouter from './config.routes';
import dailyTasksRouter from './daily-tasks.routes';

const router = Router();
router.use(statsRouter);
router.use(usersRouter);
router.use(alertsRouter);
router.use(articlesRouter);
router.use(aiRouter);
router.use(rolesRouter);
router.use(contentRouter);
router.use(monetizationRouter);
router.use(panelRouter);
router.use(configRouter);
router.use(dailyTasksRouter);

export default router;
`;
fs.writeFileSync(path.join(outDir, 'index.ts'), index);

// Replace monolith with re-export
fs.writeFileSync(
  path.join(root, 'backend/src/api/routes/super-admin.ts'),
  `/** @deprecated Import from ./super-admin/index — kept for stable import path */\nexport { default } from './super-admin/index';\n`,
);

console.log('Done. Modules in', outDir);
