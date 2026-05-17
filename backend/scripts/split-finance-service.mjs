/**
 * BE-1-2: Split FinanceService static categories into finance/categories/*.ts
 * and regenerate a thin FinanceService facade.
 *
 * node backend/scripts/split-finance-service.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcPath = path.join(root, 'backend/src/services/FinanceService.ts');
const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
const outDir = path.join(root, 'backend/src/services/finance');
const catDir = path.join(outDir, 'categories');

if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

const headerImports = lines.slice(0, 30).join('\n');

const typesBody = lines.slice(31, 726).join('\n');
fs.writeFileSync(
  path.join(outDir, 'financeTypes.ts'),
  `${headerImports}\n\n${typesBody}\n`,
);

const helpersBody = lines.slice(737, 773).join('\n');
const helpersFile = `import prisma from '../../lib/prisma';

${helpersBody.replace('private static async logFinanceOperation', 'export async function logFinanceOperation').replace('private static generateTransactionHash', 'export function generateTransactionHash')}
`;
fs.writeFileSync(path.join(outDir, 'financeHelpers.ts'), helpersFile);

const categories = [
  { file: 'deposits.ts', name: 'FinanceDeposits', start: 775, end: 983 },
  { file: 'withdrawals.ts', name: 'FinanceWithdrawals', start: 984, end: 1161 },
  { file: 'transfers.ts', name: 'FinanceTransfers', start: 1162, end: 1461 },
  { file: 'payments.ts', name: 'FinancePayments', start: 1462, end: 1786 },
  { file: 'refunds.ts', name: 'FinanceRefunds', start: 1787, end: 2090 },
  { file: 'staking.ts', name: 'FinanceStaking', start: 2091, end: 2309 },
  { file: 'conversions.ts', name: 'FinanceConversions', start: 2310, end: 2631 },
  { file: 'airdrops.ts', name: 'FinanceAirdrops', start: 2632, end: 3088 },
  { file: 'escrow.ts', name: 'FinanceEscrow', start: 3089, end: 3488 },
  { file: 'gifts.ts', name: 'FinanceGifts', start: 3489, end: 3810 },
  { file: 'feesAndReporting.ts', name: 'FinanceFeesReporting', start: 3811, end: 5584 },
  { file: 'security.ts', name: 'FinanceSecurity', start: 5585, end: 5999 },
  { file: 'tax.ts', name: 'FinanceTax', start: 6000, end: 6621 },
  { file: 'subscriptions.ts', name: 'FinanceSubscriptions', start: 6622, end: 8488 },
];

const catImports = `import prisma from '../../../lib/prisma';
import { WalletService } from '../../WalletService';
import { PermissionService } from '../../PermissionService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { ALL_FINANCE_OPERATIONS, requiresOTP, requiresApproval, isHighRisk } from '../../../constants/financeOperations';
import { logFinanceOperation, generateTransactionHash } from '../financeHelpers';
import type * as FinanceTypes from '../financeTypes';
`;

const methodNames = [];

for (const c of categories) {
  let body = lines.slice(c.start - 1, c.end).join('\n');
  body = body.replace(/\bthis\.logFinanceOperation\b/g, 'logFinanceOperation');
  body = body.replace(/\bthis\.generateTransactionHash\b/g, 'generateTransactionHash');
  const file = `${catImports}\nexport class ${c.name} {\n${body}\n}\n`;
  fs.writeFileSync(path.join(catDir, c.file), file);
  const re = /static async (\w+)/g;
  let m;
  while ((m = re.exec(body))) methodNames.push({ name: m[1], cls: c.name });
}

const instanceBody = lines.slice(8488, 9586).join('\n');
fs.writeFileSync(
  path.join(outDir, 'financeInstanceMethods.ts'),
  `${catImports.replace('../financeHelpers', '../financeHelpers')}\nimport prisma from '../../../lib/prisma';\n\nexport class FinanceInstanceMethods {\n${instanceBody}\n}\n`,
);

const facadeImports = categories.map((c) => `import { ${c.name} } from './finance/categories/${c.file.replace('.ts', '')}';`).join('\n');
const staticAssigns = methodNames.map(({ name, cls }) => `  static ${name} = ${cls}.${name};`).join('\n');
const instanceAssigns = [...lines.slice(8488, 9586).join('\n').matchAll(/async (\w+)\(/g)].map((m) => `  ${m[1]} = FinanceInstanceMethods.prototype.${m[1]}.bind(this);`).join('\n');

const facade = `/**
 * FinanceService — thin facade over category modules (BE-1-2).
 */
import { FinanceInstanceMethods } from './finance/financeInstanceMethods';
${facadeImports}
import { logFinanceOperation, generateTransactionHash } from './finance/financeHelpers';

export * from './finance/financeTypes';

export class FinanceService extends FinanceInstanceMethods {
  static logFinanceOperation = logFinanceOperation;
  static generateTransactionHash = generateTransactionHash;

${staticAssigns}

  constructor() {
    super();
${instanceAssigns.split('\n').map((l) => '    ' + l.trim()).join('\n')}
  }
}

export const financeService = new FinanceService();
`;

fs.writeFileSync(path.join(root, 'backend/src/services/FinanceService.ts'), facade);
console.log('Split complete:', methodNames.length, 'static methods,', categories.length, 'category files');
