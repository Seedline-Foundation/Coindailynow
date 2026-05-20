/**
 * BE-1-2: Split FinanceService into finance/*.ts + categories (run from repo root).
 *   node backend/scripts/split-finance-service-v2.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcPath = path.join(root, 'backend/src/services/FinanceService.ts');
const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
const outDir = path.join(root, 'backend/src/services/finance');
const catDir = path.join(outDir, 'categories');
if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

const typesBody = lines.slice(31, 726).join('\n').replace(/^interface /gm, 'export interface ');
const typeImports = `import { Prisma } from '@prisma/client';
import {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  StakingStatus,
  EscrowStatus,
  AirdropStatus,
  UserRole,
} from '@prisma/client';

`;
fs.writeFileSync(path.join(outDir, 'financeTypes.ts'), typeImports + typesBody + '\n');

const typeNames = [...typesBody.matchAll(/^export interface (\w+)/gm)].map((m) => m[1]);
const typeImportLine = `import type {\n  ${typeNames.join(',\n  ')},\n} from '../financeTypes';\n`;

const commonImports = `import { Prisma } from '@prisma/client';
import {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  StakingStatus,
  EscrowStatus,
  AirdropStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../../../lib/prisma';
import { WalletService } from '../../WalletService';
import { PermissionService } from '../../PermissionService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import {
  ALL_FINANCE_OPERATIONS,
  requiresOTP,
  requiresApproval,
  isHighRisk,
} from '../../../constants/financeOperations';
import { generateTransactionHash, logFinanceOperation } from '../financeHelpers';
${typeImportLine}`;

function baseTransform(b) {
  return b
    .replace(/this\.generateTransactionHash\(\)/g, 'generateTransactionHash()')
    .replace(/await this\.logFinanceOperation\(/g, 'await logFinanceOperation(');
}

function securityPriv(b) {
  return b
    .replace(/this\.generateOTP\(/g, 'FinPriv.generateOTP(')
    .replace(/this\.incrementFailedOTPAttempts\(/g, 'FinPriv.incrementFailedOTPAttempts(')
    .replace(/this\.clearFailedOTPAttempts\(/g, 'FinPriv.clearFailedOTPAttempts(')
    .replace(/this\.validate2FAToken\(/g, 'FinPriv.validate2FAToken(')
    .replace(/this\.analyzeTransactionFraud\(/g, 'FinPriv.analyzeTransactionFraud(')
    .replace(/this\.analyzeUserFraud\(/g, 'FinPriv.analyzeUserFraud(')
    .replace(/this\.analyzeWalletFraud\(/g, 'FinPriv.analyzeWalletFraud(')
    .replace(/this\.analyzePatternFraud\(/g, 'FinPriv.analyzePatternFraud(');
}

function taxPriv(b) {
  return b
    .replace(/this\.isTransactionTaxable\(/g, 'FinPriv.isTransactionTaxable(')
    .replace(/await this\.validateKYCDocument\(/g, 'await FinPriv.validateKYCDocument(')
    .replace(/await this\.checkSanctionsList\(/g, 'await FinPriv.checkSanctionsList(')
    .replace(/await this\.checkPEPList\(/g, 'await FinPriv.checkPEPList(')
    .replace(/await this\.checkAdverseMedia\(/g, 'await FinPriv.checkAdverseMedia(')
    .replace(/this\.checkSanctionsList\(/g, 'FinPriv.checkSanctionsList(')
    .replace(/this\.checkPEPList\(/g, 'FinPriv.checkPEPList(')
    .replace(/this\.checkAdverseMedia\(/g, 'FinPriv.checkAdverseMedia(')
    .replace(/await this\.assessTransactionAMLRisk\(/g, 'await FinPriv.assessTransactionAMLRisk(')
    .replace(/await this\.securityWalletFreeze\(/g, 'await FinanceSecurity.securityWalletFreeze(');
}

let privBody = lines.slice(6402, 6620).join('\n');
privBody = privBody
  .replace(/private static async (\w+)/g, 'export async function $1')
  .replace(/private static (\w+)/g, 'export function $1');
fs.writeFileSync(
  path.join(outDir, 'financePrivateCompliance.ts'),
  `import prisma from '../../lib/prisma';\n\n${privBody}\n`,
);

const helpersBody = lines.slice(740, 773).join('\n');
fs.writeFileSync(
  path.join(outDir, 'financeHelpers.ts'),
  `import prisma from '../../lib/prisma';
import { ALL_FINANCE_OPERATIONS } from '../../constants/financeOperations';

${helpersBody
  .replace('private static async logFinanceOperation', 'export async function logFinanceOperation')
  .replace('private static generateTransactionHash', 'export function generateTransactionHash')}
`,
);

const categories = [
  { file: 'deposits.ts', cls: 'FinanceDeposits', start: 775, end: 981, mode: 'base' },
  { file: 'withdrawals.ts', cls: 'FinanceWithdrawals', start: 983, end: 1160, mode: 'base' },
  { file: 'transfers.ts', cls: 'FinanceTransfers', start: 1162, end: 1460, mode: 'base' },
  { file: 'payments.ts', cls: 'FinancePayments', start: 1462, end: 1785, mode: 'base' },
  { file: 'refunds.ts', cls: 'FinanceRefunds', start: 1787, end: 2089, mode: 'base' },
  { file: 'staking.ts', cls: 'FinanceStaking', start: 2091, end: 2308, mode: 'base' },
  { file: 'conversions.ts', cls: 'FinanceConversions', start: 2310, end: 2630, mode: 'base' },
  { file: 'airdrops.ts', cls: 'FinanceAirdrops', start: 2632, end: 3087, mode: 'base' },
  { file: 'escrow.ts', cls: 'FinanceEscrow', start: 3089, end: 3487, mode: 'base' },
  { file: 'gifts.ts', cls: 'FinanceGifts', start: 3489, end: 3810, mode: 'base' },
  { file: 'feesCommissions.ts', cls: 'FinanceFeesCommissions', start: 3812, end: 4095, mode: 'base' },
  { file: 'revenue.ts', cls: 'FinanceRevenue', start: 4097, end: 4318, mode: 'base' },
  { file: 'expenses.ts', cls: 'FinanceExpenses', start: 4320, end: 4935, mode: 'base' },
  { file: 'auditReporting.ts', cls: 'FinanceAuditReporting', start: 4937, end: 5582, mode: 'base' },
  { file: 'security.ts', cls: 'FinanceSecurity', start: 5585, end: 5998, mode: 'security' },
  { file: 'tax.ts', cls: 'FinanceTax', start: 6007, end: 6397, mode: 'tax' },
  { file: 'subscriptions.ts', cls: 'FinanceSubscriptions', start: 6628, end: 7215, mode: 'base' },
  { file: 'walletManagement.ts', cls: 'FinanceWalletManagement', start: 7224, end: 7613, mode: 'base' },
  { file: 'gateways.ts', cls: 'FinanceGateways', start: 7622, end: 8001, mode: 'base' },
  { file: 'advanced.ts', cls: 'FinanceAdvanced', start: 8010, end: 8479, mode: 'advanced' },
];

const staticMethods = [];

for (const c of categories) {
  let inner = lines.slice(c.start - 1, c.end).join('\n');
  inner = baseTransform(inner);
  if (c.mode === 'security') {
    inner = securityPriv(inner);
  } else if (c.mode === 'tax') {
    inner = taxPriv(inner);
  } else if (c.mode === 'advanced') {
    inner = inner.replace(/await this\.transferUserToUser\(/g, 'await FinanceTransfers.transferUserToUser(');
  }
  const header =
    c.mode === 'security'
      ? `import * as FinPriv from '../financePrivateCompliance';\n${commonImports}`
      : c.mode === 'tax'
        ? `import * as FinPriv from '../financePrivateCompliance';\nimport { FinanceSecurity } from './security';\n${commonImports}`
        : c.mode === 'advanced'
          ? `import { FinanceTransfers } from './transfers';\n${commonImports}`
          : commonImports;
  fs.writeFileSync(path.join(catDir, c.file), `${header}\nexport class ${c.cls} {\n${inner}\n}\n`);
  const re = /static async (\w+)/g;
  let m;
  while ((m = re.exec(inner))) staticMethods.push({ name: m[1], cls: c.cls });
}

const instInner = lines.slice(8484, 9570).join('\n');
const instHeader = `${commonImports.replace(typeImportLine, typeImportLine)}`;
fs.writeFileSync(
  path.join(outDir, 'financeInstanceMethods.ts'),
  `${instHeader}\nexport class FinanceInstanceMethods {\n${instInner}\n}\n`,
);

const instNames = [...instInner.matchAll(/^\s{2}async (\w+)\(/gm)].map((x) => x[1]);

const facadeImports = categories
  .map((c) => `import { ${c.cls} } from './finance/categories/${c.file.replace('.ts', '')}';`)
  .join('\n');
const staticLines = staticMethods.map(({ name, cls }) => `  static ${name} = ${cls}.${name};`).join('\n');

const facade = `/**
 * FinanceService — facade over category modules (BE-1-2).
 */
import { FinanceInstanceMethods } from './finance/financeInstanceMethods';
${facadeImports}
import { generateTransactionHash, logFinanceOperation } from './finance/financeHelpers';

export * from './finance/financeTypes';

export class FinanceService extends FinanceInstanceMethods {
  static generateTransactionHash = generateTransactionHash;
  static logFinanceOperation = logFinanceOperation;

${staticLines}
}

export const financeService = new FinanceService();
`;

fs.copyFileSync(srcPath, path.join(outDir, 'FinanceService.monolith.backup.ts'));
fs.writeFileSync(srcPath, facade);
console.log('BE-1-2 split OK. Backup:', path.join(outDir, 'FinanceService.monolith.backup.ts'));
console.log('Static methods:', staticMethods.length, 'Instance:', instNames.length);
